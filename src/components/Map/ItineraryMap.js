"use client";

import { useEffect, useState, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapPin, Music, Utensils, Bus, Bed, Star } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MapContainer, TileLayer, Marker, Tooltip, Polyline, useMap } from 'react-leaflet';

// Icon Mapping
const getIconForCategory = (type) => {
    switch (type) {
        case 'Food': return <Utensils size={14} color="white" />;
        case 'Evento': return <Music size={14} color="white" />;
        case 'Transport': return <Bus size={14} color="white" />;
        case 'Lodging': return <Bed size={14} color="white" />;
        case 'Attractions': return <Star size={14} color="white" />;
        default: return <MapPin size={14} color="white" />;
    }
};

const getColorForCategory = (type) => {
    switch (type) {
        case 'Food': return '#f97316'; // Orange
        case 'Evento': return '#a855f7'; // Purple
        case 'Transport': return '#10b981'; // Emerald
        case 'Lodging': return '#eab308'; // Yellow
        default: return '#3b82f6'; // Blue
    }
};

function MapUpdater({ bounds }) {
    const map = useMap(); // Now this should work correctly as it's the real hook
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

export default function ItineraryMap({ items, showControls = true }) {
    const [processedItems, setProcessedItems] = useState([]);
    const [bounds, setBounds] = useState([]);
    const [Leaflet, setLeaflet] = useState(null);
    const [selectedDay, setSelectedDay] = useState("all");

    // Load Leaflet on client side only for Icon creation
    useEffect(() => {
        import('leaflet').then((L) => {
            // Fix default icons
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
        return uniqueDates.sort((a, b) => new Date(a) - new Date(b)).map((dateStr, index) => ({
            date: dateStr,
            label: `Día ${index + 1}`,
            fullDate: new Date(dateStr)
        }));
    }, [items]);

    useEffect(() => {
        if (!items) return;

        // Sort by time
        const sorted = [...items].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

        const mapped = sorted.map((item, index) => {
            const coordRegex = /(?:Coordinates|Location|Coordenadas):\s*(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/i;
            const match = item.description?.match(coordRegex);

            if (match) {
                return {
                    ...item,
                    lat: parseFloat(match[1]),
                    lng: parseFloat(match[2]),
                    order: index + 1 // Keep original global order vs daily order? Global is better for "Tour" feel
                };
            }
            return null;
        }).filter(Boolean);

        // Filter by day
        const filtered = selectedDay === "all"
            ? mapped
            : mapped.filter(item => new Date(item.start_time).toDateString() === selectedDay);

        // Re-calculate local order for the day if needed, or keep global?
        // Let's keep global numbers to match the itinerary list, OR re-index for the day view?
        // User wants "friendly". Global numbers might be "14, 15, 16" on Day 3. That is confusing if standalone.
        // But if they have a printed itinerary, it matches.
        // Let's stick to global order for consistency, but maybe I will re-calculate if requested.
        // Actually, let's keep the mapped items as source, and just filter `processedItems` for rendering.

        setProcessedItems(filtered);

        if (filtered.length > 0) {
            const b = filtered.map(i => [i.lat, i.lng]);
            setBounds(b);
        }
    }, [items, selectedDay]);

    const createCategoryIcon = (type, number) => {
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
                    positions={processedItems.map(i => [i.lat, i.lng])}
                    pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.7, dashArray: '10, 10' }}
                />

                {processedItems.map((item) => {
                    const icon = createCategoryIcon(item.type, item.order);
                    if (!icon) return null;

                    return (
                        <Marker
                            key={item.id}
                            position={[item.lat, item.lng]}
                            icon={icon}
                        >
                            <Tooltip direction="top" offset={[0, -32]} opacity={1} className="custom-tooltip">
                                <div className="font-bold text-black text-sm">{item.title}</div>
                                <div className="text-xs text-gray-600">{new Date(item.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </Tooltip>
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
