export const exportTripData = (): string | null => {
    if (typeof window === 'undefined') return null;

    const data = {
        itinerary: JSON.parse(localStorage.getItem("travel-itinerary") || "null"),
        wallet: JSON.parse(localStorage.getItem("travel-wallet-split") || "null"),
        checklist: JSON.parse(localStorage.getItem("travel-checklist") || "null"),
        timestamp: Date.now()
    };

    // UTF-8 safe base64 encoding
    const json = JSON.stringify(data);
    return btoa(unescape(encodeURIComponent(json)));
};

export const importTripData = (base64Data: string): boolean => {
    if (typeof window === 'undefined') return false;

    try {
        // UTF-8 safe base64 decoding
        const json = decodeURIComponent(escape(atob(base64Data)));
        const data = JSON.parse(json);

        if (data.itinerary) localStorage.setItem("travel-itinerary", JSON.stringify(data.itinerary));
        if (data.wallet) localStorage.setItem("travel-wallet-split", JSON.stringify(data.wallet));
        if (data.checklist) localStorage.setItem("travel-checklist", JSON.stringify(data.checklist));

        return true;
    } catch (e) {
        console.error("Invalid trip data", e);
        return false;
    }
};
