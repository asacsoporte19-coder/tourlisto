"use client";

import dynamic from "next/dynamic";
import FloatingNav from "@/components/UI/FloatingNav";
import { useTrip } from "@/context/TripContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// Use ItineraryMap for consistency across the app
const ItineraryMap = dynamic(
    () => import("@/components/Map/ItineraryMap"),
    { ssr: false, loading: () => <p className="text-white text-center p-10">Cargando Mapa...</p> }
);
// Import the type (dynamically imported components don't export types easily, so we might need to import the file for type)
import { ItineraryItem } from "@/components/Map/ItineraryMap";

export default function MapPage() {
    const { activeTrip } = useTrip();
    const [mapItems, setMapItems] = useState<ItineraryItem[]>([]);

    useEffect(() => {
        if (!activeTrip) return;

        const fetchItems = async () => {
            const { data, error } = await supabase
                .from('itinerary_items')
                .select('*')
                .eq('trip_id', activeTrip.id);

            if (!error) {
                setMapItems(data || []);
            }
        };

        fetchItems();
    }, [activeTrip]);

    return (
        <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#000" }}>
            <div style={{ flex: 1, position: "relative" }}>
                {/* Reusing the beautiful ItineraryMap */}
                <ItineraryMap items={mapItems} />
            </div>

            <FloatingNav />
        </div>
    );
}
