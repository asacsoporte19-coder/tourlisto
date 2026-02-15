
import { NextResponse } from "next/server";

// Initialize OSM Integration
// Replacing Gemini with OpenStreetMap for real-world data

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const location = searchParams.get('location');
        const category = searchParams.get('category');

        if (!location) {
            return NextResponse.json({ error: 'Location parameter is required' }, { status: 400 });
        }

        console.log(`Fetching suggestions for: ${location} [Category: ${category || 'ALL'}]`);

        // If search query is provided, use direct search
        const query = searchParams.get('q');
        if (query) {
            try {
                const { getOSMSearch } = require('@/lib/osm');
                const searchResults = await getOSMSearch(query, location);
                return NextResponse.json({
                    items: searchResults,
                    source: 'openstreetmap_search'
                });
            } catch (error) {
                return NextResponse.json({ error: 'Search failed' }, { status: 500 });
            }
        }

        // If category is provided, fetch only that category
        if (category) {
            try {
                const { getOSMCategorySuggestions } = require('@/lib/osm');
                const categoryData = await getOSMCategorySuggestions(location, category);

                // If OSM returns no items, throw error to trigger catch block and use fallback
                if (!categoryData || categoryData.length === 0) {
                    throw new Error("No OSM data found for category");
                }

                return NextResponse.json({
                    category,
                    items: categoryData,
                    source: 'openstreetmap'
                });
            } catch (error) {
                console.log(`OSM/Category Fetch failed for ${category} (${error.message}), using fallback.`);

                const { getFallbackSuggestions } = require('@/lib/fallbackSuggestions');
                const fallback = getFallbackSuggestions(location);
                return NextResponse.json({
                    category,
                    items: fallback.suggestions[category] || [],
                    isFallback: true,
                    source: 'local_curated'
                });
            }
        }

        // --- LEGACY / FULL FETCH LOGIC ---
        // Try OpenStreetMap (Nominatim) first for real data
        try {
            const { getOSMSuggestions } = require('@/lib/osm');
            const osmData = await getOSMSuggestions(location);

            // Check if we actually got meaningful results (need at least 3 categories with data)
            const categoriesWithData = Object.values(osmData.suggestions).filter(arr => arr.length > 0);

            if (categoriesWithData.length >= 3) {
                console.log(`OSM returned ${categoriesWithData.length} categories, using OSM data`);
                return NextResponse.json({
                    ...osmData,
                    source: 'openstreetmap'
                });
            }
            console.log(`OSM returned insufficient data (${categoriesWithData.length} categories), using fallback.`);

        } catch (osmError) {
            console.error("OSM Fetch Failed:", osmError);
            // Continue to fallback
        }

        // Fallback to local curated data if OSM fails or returns nothing
        const { getFallbackSuggestions } = require('@/lib/fallbackSuggestions');
        const fallbackData = getFallbackSuggestions(location || "Destination");

        return NextResponse.json({
            ...fallbackData,
            isFallback: true,
            source: 'local_curated'
        });

    } catch (error) {
        console.error('Error generating suggestions:', error);
        return NextResponse.json(
            { error: 'Failed to generate suggestions', details: error.message },
            { status: 500 }
        );
    }
}
