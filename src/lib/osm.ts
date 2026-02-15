const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface OSMPOI {
    name: string;
    description: string;
    why: string;
    lat: string;
    lon: string;
    display_name?: string;
    class?: string;
    type?: string;
    address?: {
        city?: string;
        town?: string;
    };
    extratags?: {
        description?: string;
    };
}

interface OSMResult {
    location: string;
    suggestions: Record<string, OSMPOI[]>;
}

export const getOSMSearch = async (query: string, location: string): Promise<OSMPOI[]> => {
    // Combine query with location for better results
    const fullQuery = `${query} in ${location}`;
    console.log(`Searching OSM for: ${fullQuery}`);
    try {
        const results = await searchNominatim(fullQuery, 10);
        return results.map((item: any) => mapOSMToSuggestion(item, "Search Result"));
    } catch (e) {
        console.error("OSM Search failed", e);
        return [];
    }
};

const searchNominatim = async (query: string, limit = 5): Promise<any[]> => {
    try {
        // Nominatim requires a User-Agent
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=${limit}&extratags=1`;

        await delay(1000); // Respect generic API rate limits (1 request per second rule of thumb)

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'SimpleTravelApp/1.0 (administrador@example.com)' // Placeholder user agent
            }
        });

        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error("OSM Search Error:", error);
        return [];
    }
};

const mapOSMToSuggestion = (item: any, defaultWhy: string): OSMPOI => {
    // Try to find a description or interesting tag
    let description = item.display_name.split(',')[0]; // Simple name fallback
    if (item.extratags && item.extratags.description) {
        description = item.extratags.description;
    } else {
        // Construct a simple description from address
        const city = item.address?.city || item.address?.town || "";
        description = `${item.type.replace(/_/g, ' ')} in ${city}`;
    }

    return {
        name: item.name || item.display_name.split(',')[0], // Get the main name
        description: description.charAt(0).toUpperCase() + description.slice(1),
        why: defaultWhy || item.class, // Use category as 'why' if nothing else
        lat: item.lat,
        lon: item.lon
    };
};


const getCategoryQuery = (category: string, location: string) => {
    switch (category) {
        case 'Restaurants': return { query: `restaurants in ${location}`, limit: 5, why: "Top Rated" };
        case 'Attractions': return { query: `tourist attractions in ${location}`, limit: 5, why: "Must See" };
        case 'Activities': return { query: `leisure in ${location}`, limit: 5, why: "Fun & Leisure" };
        case 'Shopping': return { query: `shopping mall in ${location}`, limit: 3, why: "Shopping" };
        case 'Nightlife': return { query: `bar in ${location}`, limit: 3, why: "Night Out" };
        case 'Transportation': return { query: `transportation in ${location}`, limit: 3, why: "Transit" };
        default: return { query: `tourist info in ${location}`, limit: 3, why: "General" };
    }
};

export const getOSMCategorySuggestions = async (location: string, category: string): Promise<OSMPOI[]> => {
    console.log(`Fetching OSM data for ${category} in ${location}...`);

    // Check for special transportation logic
    if (category === 'Transportation') {
        // Parallel fetch for better speed
        try {
            const [stations, airports] = await Promise.all([
                searchNominatim(`station in ${location}`, 3),
                searchNominatim(`airport in ${location}`, 1)
            ]);

            let transport = [
                ...stations.map(i => mapOSMToSuggestion(i, "Transit Station")),
                ...airports.map(i => mapOSMToSuggestion(i, "Airport"))
            ];

            // Filter duplicates if any
            const unique: OSMPOI[] = [];
            const seen = new Set();
            for (const t of transport) {
                if (!seen.has(t.name)) {
                    seen.add(t.name);
                    unique.push(t);
                }
            }
            transport = unique.slice(0, 4);

            // Always ensure at least one item for transportation generic
            if (transport.length < 2) {
                transport.push({
                    name: "Local Taxi / Uber",
                    description: "Available 24/7.",
                    why: "Convenient",
                    lat: "0",
                    lon: "0"
                });
            }
            return transport;
        } catch (e) {
            console.error("Transport fetch error", e);
            return [];
        }
    }

    const { query, limit, why } = getCategoryQuery(category, location);
    const rawData = await searchNominatim(query, limit);
    return rawData.map(i => mapOSMToSuggestion(i, why));
};

export const getOSMSuggestions = async (location: string): Promise<OSMResult> => {
    // Kept for backward compatibility if needed, but we should move to category-based fetching
    console.log(`Fetching ALL OSM data for ${location}...`);

    const categories = ["Restaurants", "Attractions", "Activities", "Shopping", "Nightlife", "Transportation"];
    const results: Record<string, OSMPOI[]> = {};

    for (const cat of categories) {
        results[cat] = await getOSMCategorySuggestions(location, cat);
        await delay(500); // Delay to avoid rate limits
    }

    return {
        location: location,
        suggestions: results
    };
};
