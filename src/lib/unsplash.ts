// Direct Unsplash image URLs - no API needed
// Using a curated collection of high-quality travel images

const LOCATION_IMAGES: Record<string, string> = {
    // European cities
    'paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&h=900&fit=crop',
    'london': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1600&h=900&fit=crop',
    'rome': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1600&h=900&fit=crop',
    'barcelona': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1600&h=900&fit=crop',
    'amsterdam': 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=1600&h=900&fit=crop',
    'berlin': 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=1600&h=900&fit=crop',
    'prague': 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=1600&h=900&fit=crop',
    'vienna': 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=1600&h=900&fit=crop',
    'madrid': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1600&h=900&fit=crop',
    'lisbon': 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1600&h=900&fit=crop',
    'lisboa': 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1600&h=900&fit=crop',

    // Asian cities
    'tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1600&h=900&fit=crop',
    'kyoto': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1600&h=900&fit=crop',
    'bangkok': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1600&h=900&fit=crop',
    'singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1600&h=900&fit=crop',
    'seoul': 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=1600&h=900&fit=crop',
    'dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1600&h=900&fit=crop',

    // American cities
    'new york': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1600&h=900&fit=crop',
    'san francisco': 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1600&h=900&fit=crop',
    'los angeles': 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=1600&h=900&fit=crop',
    'chicago': 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1600&h=900&fit=crop',
    'miami': 'https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=1600&h=900&fit=crop',

    // Default fallback
    'default': 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&h=900&fit=crop'
};

export function getLocationImage(location: string | null | undefined): string {
    if (!location) return LOCATION_IMAGES.default;

    // Normalize location name
    const normalizedLocation = location.toLowerCase().trim();

    // Check for exact match
    if (LOCATION_IMAGES[normalizedLocation]) {
        return LOCATION_IMAGES[normalizedLocation];
    }

    // Check for partial match
    for (const [city, url] of Object.entries(LOCATION_IMAGES)) {
        if (normalizedLocation.includes(city) || city.includes(normalizedLocation)) {
            return url;
        }
    }

    // Default fallback
    return LOCATION_IMAGES.default;
}

export function getCachedLocationImage(location: string | null | undefined): string {
    return getLocationImage(location);
}
