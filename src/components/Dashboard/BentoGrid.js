"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Compass, Calendar, ListTodo, Map as MapIcon, Wallet, Loader } from "lucide-react";
import WeatherCard from "./WeatherCard";
import { useTrip } from "@/context/TripContext";
import dynamic from 'next/dynamic';
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// Dynamically import ItineraryMap with no SSR
const ItineraryMap = dynamic(() => import('@/components/Map/ItineraryMap'), {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-2xl"><Loader className="animate-spin text-gray-400" /></div>
});

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export default function BentoGrid() {
    const { activeTrip } = useTrip();
    const [mapItems, setMapItems] = useState([]);
    const [loadingMap, setLoadingMap] = useState(false);

    useEffect(() => {
        if (!activeTrip) return;

        const fetchItineraryForMap = async () => {
            setLoadingMap(true);
            const { data, error } = await supabase
                .from('itinerary_items')
                .select('*')
                .eq('trip_id', activeTrip.id);

            if (!error) {
                setMapItems(data || []);
            }
            setLoadingMap(false);
        };

        fetchItineraryForMap();
    }, [activeTrip]);

    if (!activeTrip) return null;

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
                padding: "1rem"
            }}
        >
            {/* Weather - Large Tile */}
            <motion.div variants={item} style={{ gridColumn: "span 2" }}>
                <WeatherCard location={activeTrip.location || "Tu Destino"} />
            </motion.div>

            {/* Explore - Medium Tile */}
            <motion.div variants={item} style={{ gridColumn: "span 2" }}>
                <Link href="/explore" className="no-underline block h-full">
                    <div className="card h-[150px] relative overflow-hidden border-none flex items-end p-0 group">
                        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{
                            backgroundImage: "url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1000')",
                        }}></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>

                        <div className="relative z-10 flex flex-col justify-end p-6 text-white w-full h-full">
                            <div className="flex items-center gap-2 mb-1">
                                <Compass size={24} />
                                <span className="text-xl font-bold">Añadir Planes</span>
                            </div>
                            <p className="text-sm text-gray-200">Encuentra actividades y lugares para tu viaje</p>
                        </div>
                    </div>
                </Link>
            </motion.div>

            {/* Checklist */}
            <motion.div variants={item}>
                <Link href="/checklist" className="no-underline block h-full">
                    <div className="h-full flex flex-col gap-2 justify-center items-center text-center bg-slate-800 dark:bg-slate-900 text-white border-none rounded-xl p-6 shadow-sm hover:bg-slate-700 dark:hover:bg-slate-800 transition-colors">
                        <div className="bg-white/10 p-3 rounded-full text-purple-300">
                            <ListTodo size={24} />
                        </div>
                        <span className="font-semibold text-white">Checklist</span>
                    </div>
                </Link>
            </motion.div>

            {/* Map - Interactive Preview */}
            <motion.div variants={item}>
                <Link href="/map" className="block h-full w-full relative group overflow-hidden rounded-3xl" style={{ minHeight: '150px' }}>
                    <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
                        {!loadingMap && <ItineraryMap items={mapItems} showControls={false} />}
                    </div>
                    {/* Overlay to ensure clickability and label */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none flex items-end justify-center pb-4 z-[999]">
                        <div className="flex items-center gap-2 text-white">
                            <MapIcon size={18} />
                            <span className="font-bold">Map Preview</span>
                        </div>
                    </div>
                </Link>
            </motion.div>

            {/* Plan (Itinerary) - Large Tile */}
            <motion.div variants={item} style={{ gridColumn: "span 2" }}>
                <Link href="/itinerary" className="no-underline block h-full">
                    <div className="bg-slate-800 dark:bg-slate-900 text-white rounded-xl p-6 shadow-sm flex items-center justify-between hover:bg-slate-700 dark:hover:bg-slate-800 transition-colors h-full">
                        <div className="flex items-center gap-4">
                            <div className="bg-white/10 p-3 rounded-xl">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <div className="font-bold">Plan de Viaje</div>
                                <div className="text-sm opacity-70">
                                    {new Date(activeTrip.start_date).toLocaleDateString([], { day: 'numeric', month: 'short' })} - {new Date(activeTrip.end_date).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                                </div>
                            </div>
                        </div>
                        {/* Indicator */}
                        <div className="text-xs bg-pink-600 px-3 py-1 rounded-full whitespace-nowrap">
                            Ver Detalle
                        </div>
                    </div>
                </Link>
            </motion.div>

            {/* Wallet (New) */}
            <motion.div variants={item} style={{ gridColumn: "span 2" }}>
                <Link href="/wallet" className="no-underline block h-full">
                    <div className="flex items-center gap-4 bg-slate-800 dark:bg-slate-900 text-white border-none rounded-xl p-6 shadow-sm hover:bg-slate-700 dark:hover:bg-slate-800 transition-colors">
                        <div className="bg-white/10 p-3 rounded-full text-red-300">
                            <Wallet size={24} />
                        </div>
                        <div>
                            <div className="font-bold text-white">Billetera Compartida</div>
                            <div className="text-sm text-gray-400">Gestionar gastos del grupo</div>
                        </div>
                    </div>
                </Link>
            </motion.div>
        </motion.div>
    );
}
