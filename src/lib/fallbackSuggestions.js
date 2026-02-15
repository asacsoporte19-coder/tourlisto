export const getFallbackSuggestions = (location) => {
    const defaultSuggestions = {
        location: location,
        suggestions: {
            "Restaurants": [
                { "name": "Local Bistro", "description": `A charming spot serving authentic ${location} cuisine.`, "why": "Local favorite" },
                { "name": "The Grand Dining Room", "description": "Upscale dining experience with city views.", "why": "Fine dining" },
                { "name": "Street Food Market", "description": "Bustling market with various local treats.", "why": "Budget friendly" },
                { "name": "Cafe Central", "description": "Perfect for coffee and people watching.", "why": "Atmosphere" },
                { "name": "Fusion Kitchen", "description": "Modern twist on traditional dishes.", "why": "Unique flavors" }
            ],
            "Attractions": [
                { "name": "City Museum", "description": "History and art of the region.", "why": "Cultural insight" },
                { "name": "Central Park", "description": "Green oasis in the heart of the city.", "why": "Nature & Relax" },
                { "name": "Old Town Square", "description": "Historic architecture and lively atmosphere.", "why": "Must-see" },
                { "name": "The Viewpoint", "description": "Panoramic views of the skyline.", "why": "Best photo op" },
                { "name": "The River Walk", "description": "Scenic path along the water.", "why": "Scenic stroll" }
            ],
            "Activities": [
                { "name": "Walking Tour", "description": "Guided tour of the historic center.", "why": "Informative" },
                { "name": "Food Tasting", "description": "Sample local delicacies.", "why": "Delicious" },
                { "name": "Sunset Cruise", "description": "Relaxing boat ride at dusk.", "why": "Romantic" },
                { "name": "Cooking Class", "description": "Learn to make local dishes.", "why": "Hands-on" },
                { "name": "Bike Rental", "description": "Explore the city on two wheels.", "why": "Active fun" }
            ],
            "Shopping": [
                { "name": "Main Street", "description": "Popular brand names and stores.", "why": "Variety" },
                { "name": "Artisan Market", "description": "Handmade crafts and souvenirs.", "why": "Unique gifts" },
                { "name": "Vintage Lane", "description": "Retro clothing and antiques.", "why": "Hidden gems" }
            ],
            "Nightlife": [
                { "name": "The Jazz Club", "description": "Live music and intimate setting.", "why": "Great music" },
                { "name": "Rooftop Bar", "description": "Cocktails with a view.", "why": "Chic vibe" },
                { "name": "Local Pub", "description": "Friendly atmosphere and local brews.", "why": "Casual fun" }
            ],
            "Transportation": [
                { "name": "Public Transit", "description": "Efficient metro/bus system.", "why": "Cost-effective" },
                { "name": "Rideshare (Uber/Lyft)", "description": "Available 24/7 in the city.", "why": "Convenient" },
                { "name": "Bike Sharing", "description": "City-wide bike rental stations.", "why": "Eco-friendly" }
            ]
        }
    };

    // Specific overrides for Paris if needed (can be expanded)
    if (location.toLowerCase().includes('paris')) {
        defaultSuggestions.suggestions.Attractions[0] = { "name": "Eiffel Tower", "description": "Iconic iron lattice tower on the Champ de Mars.", "why": "Global icon" };
        defaultSuggestions.suggestions.Attractions[1] = { "name": "Louvre Museum", "description": "World's largest art museum.", "why": "Mona Lisa" };
    }

    return defaultSuggestions;
};
