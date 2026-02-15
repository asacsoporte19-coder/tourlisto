// @ts-nocheck
"use client";

import { useEffect, useState, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapPin, Music, Utensils, Bus, Bed, Star, LucideIcon } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MapContainer, TileLayer, Marker, Tooltip, Polyline, useMap, Popup } from 'react-leaflet';
import L from 'leaflet'; // Import L for types if available, otherwise just usage

// Types
export interface ItineraryItem {
    id: string;
    title: string;
    description?: string;
    type: string;
    start_time: string;
    lat?: number;
    lng?: number; // Added lat/lng here as they are processed
    order?: number;
    [key: string]: any;
}

interface ItineraryMapProps {
    items: ItineraryItem[];
    showControls?: boolean;
}

// Icon Mapping
const getIconForCategory = (type: string) => {
    switch (type) {
        case 'Food': return <Utensils size={14} color="white" />;
        case 'Evento': return <Music size={14} color="white" />;
        case 'Transport': return <Bus size={14} color="white" />;
        case 'Lodging': return <Bed size={14} color="white" />;
        case 'Attractions': return <Star size={14} color="white" />;
        default: return <MapPin size={14} color="white" />;
    }
};

const getColorForCategory = (type: string) => {
    switch (type) {
        case 'Food': return '#f97316'; // Orange
        case 'Evento': return '#a855f7'; // Purple
        case 'Transport': return '#10b981'; // Emerald
        case 'Lodging': return '#eab308'; // Yellow
        default: return '#3b82f6'; // Blue
    }
};

function MapUpdater({ bounds }: { bounds: [number, number][] }) {
    const map = useMap();
    useEffect(() => {
        if (bounds && bounds.length > 0 && map) {
            try {
                map.fitBounds(bounds, { padding: [50, 50] });
            } catch (e) {
                console.error("Error setting bounds", e);
            }
        }
    }, [bounds, map]);
    return null;
}

export default function ItineraryMap({ items, showControls = true }: ItineraryMapProps) {
    const [processedItems, setProcessedItems] = useState<ItineraryItem[]>([]);
    const [bounds, setBounds] = useState<[number, number][]>([]);
    const [Leaflet, setLeaflet] = useState<any>(null);
    const [selectedDay, setSelectedDay] = useState("all");

    // Load Leaflet on client side only for Icon creation
    useEffect(() => {
        import('leaflet').then((L) => {
            // Fix default icons
            // @ts-ignore
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });
            setLeaflet(L);
        });
    }, []);

    // Extract unique days
    const days = useMemo(() => {
        if (!items) return [];
        const uniqueDates = [...new Set(items.map(item => new Date(item.start_time).toDateString()))];
        return uniqueDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime()).map((dateStr, index) => ({
            date: dateStr,
            label: `Día ${index + 1}`,
            fullDate: new Date(dateStr)
        }));
    }, [items]);

    useEffect(() => {
        if (!items) return;

        // Sort by time
        const sorted = [...items].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

        const mapped = sorted.map((item, index) => {
            const coordRegex = /(?:Coordinates|Location|Coordenadas):\s*(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/i;
            const match = item.description?.match(coordRegex);

            if (match) {
                return {
                    ...item,
                    lat: parseFloat(match[1]),
                    lng: parseFloat(match[2]),
                    order: index + 1
                };
            }
            return null;
        }).filter(Boolean) as ItineraryItem[];

        // Filter by day
        const filtered = selectedDay === "all"
            ? mapped
            : mapped.filter(item => new Date(item.start_time).toDateString() === selectedDay);

        setProcessedItems(filtered);

        if (filtered.length > 0) {
            const b = filtered.map(i => [i.lat!, i.lng!] as [number, number]);
            setBounds(b);
        }
    }, [items, selectedDay]);

    const createCategoryIcon = (type: string, number: number) => {
        if (!Leaflet) return null;

        const iconMarkup = renderToStaticMarkup(getIconForCategory(type));
        const color = getColorForCategory(type);

        return Leaflet.divIcon({
            className: 'custom-category-icon',
            html: `
                <div style="position: relative; width: 32px; height: 32px;">
                    <div style="
                        background-color: ${color};
                        width: 32px;
                        height: 32px;
                        border-radius: 50% 50% 50% 0;
                        transform: rotate(-45deg);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 3px 6px rgba(0,0,0,0.4);
                        border: 2px solid white;
                    ">
                        <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center;">
                            ${iconMarkup}
                        </div>
                    </div>
                    <div style="
                        position: absolute;
                        top: -8px;
                        right: -8px;
                        background-color: #ef4444; /* Red-500 */
                        color: white;
                        font-size: 12px;
                        font-weight: 800;
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                        border: 2px solid white;
                        z-index: 10;
                    ">${number}</div>
                </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32],
            tooltipAnchor: [16, -16]
        });
    };

    if (processedItems.length === 0 && selectedDay === "all") {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-white/5 rounded-3xl p-8 text-center border border-white/10">
                <MapPin size={48} className="text-gray-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-400">Sin ubicaciones</h3>
                <p className="text-gray-500 max-w-xs mt-2">
                    Tus planes aparecerán aquí cuando tengan ubicación.
                </p>
            </div>
        );
    }

    return (
        <div className="h-full w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative z-0">
            {/* @ts-ignore */}
            <MapContainer
                center={bounds[0] || [0, 0]}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
                className="z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapUpdater bounds={bounds} />

                <Polyline
                    positions={processedItems.map(i => [i.lat!, i.lng!] as [number, number])}
                    pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.7, dashArray: '10, 10' }}
                />

                {processedItems.map((item) => {
                    const icon = createCategoryIcon(item.type, item.order!);
                    if (!icon) return null;

                    return (
                        <Marker
                            key={item.id}
                            position={[item.lat!, item.lng!]}
                            icon={icon}
                        >
                            <Tooltip direction="top" offset={[0, -32]} opacity={1} className="custom-tooltip">
                                <div className="font-bold text-black text-sm">{item.title}</div>
                                <div className="text-xs text-gray-600">{new Date(item.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </Tooltip>
                            <Popup className="custom-popup">
                                <div className="p-1 min-w-[200px]">
                                    <div className="flex items-center gap-2 mb-2 border-b pb-2">
                                        <div
                                            style={{ backgroundColor: getColorForCategory(item.type) }}
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm"
                                        >
                                            {getIconForCategory(item.type)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-base m-0 leading-tight">{item.title}</h3>
                                            <span className="text-xs text-gray-500">{item.type}</span>
                                        </div>
                                    </div>
                                    {item.description && (
                                        <p className="text-sm text-gray-600 mb-3 bg-gray-50 p-2 rounded-lg italic border border-gray-100">
                                            "{item.description}"
                                        </p>
                                    )}
                                    <div className="flex justify-between items-center text-xs text-gray-400 mt-2 font-mono">
                                        <span>{new Date(item.start_time).toLocaleDateString()}</span>
                                        <span className="font-bold text-blue-500">{new Date(item.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>

            {/* Day Filter Controls - Only show if we have days AND controls are enabled */}
            {showControls && days.length > 0 && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] flex gap-2 overflow-x-auto max-w-[90%] p-2 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-gray-200">
                    <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedDay("all"); }}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${selectedDay === "all"
                            ? "bg-blue-500 text-white shadow-md transform scale-105"
                            : "bg-transparent text-gray-600 hover:bg-gray-100"
                            }`}
                    >
                        Todo
                    </button>
                    {days.map((day) => (
                        <button
                            key={day.date}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedDay(day.date); }}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${selectedDay === day.date
                                ? "bg-blue-500 text-white shadow-md transform scale-105"
                                : "bg-transparent text-gray-600 hover:bg-gray-100"
                                }`}
                        >
                            {day.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
