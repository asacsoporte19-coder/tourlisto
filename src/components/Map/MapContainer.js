import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useState } from "react";
import { Plus } from "lucide-react";
import DatePickerModal from "@/components/UI/DatePickerModal";
import { supabase } from "@/lib/supabaseClient";

// Fix Leaflet's default icon path issues
const icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Custom icon for dropped pin
const droppedIcon = L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const center = [38.7223, -9.1393]; // Lisbon Center

function LocationMarker({ onMapClick }) {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng);
        },
    });
    return null;
}

export default function LisbonMap({ places, trip }) {
    const [droppedPin, setDroppedPin] = useState(null);
    const [showDateModal, setShowDateModal] = useState(false);

    const handleMapClick = (latlng) => {
        setDroppedPin({
            lat: latlng.lat,
            lng: latlng.lng,
            name: "", // Empty to encourage typing
            description: "Custom map pin"
        });
    };

    const handleAddToItinerary = () => {
        if (!trip) {
            alert("Please select a trip first.");
            return;
        }
        setShowDateModal(true);
    };

    const confirmAddToItinerary = async (dateTimeStr) => {
        if (!droppedPin) return;

        try {
            const newItem = {
                trip_id: trip.id,
                title: droppedPin.name,
                description: `Coordinates: ${droppedPin.lat.toFixed(4)}, ${droppedPin.lng.toFixed(4)}`,
                type: 'Attractions', // Default category for map pins
                start_time: dateTimeStr // Use the full ISO string returned by DatePickerModal
            };

            const { error } = await supabase
                .from('itinerary_items')
                .insert([newItem]);

            if (error) throw error;
            alert(`✅ Added location to ${dateTimeStr}!`);
            setDroppedPin(null); // Clear pin after adding
        } catch (err) {
            console.error("Error adding map pin:", err);
            alert("Failed to add location.");
        } finally {
            setShowDateModal(false);
        }
    };

    return (
        <>
            <MapContainer
                center={center}
                zoom={13}
                style={{ height: "100%", width: "100%", zIndex: 0 }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <LocationMarker onMapClick={handleMapClick} />

                {places.map((place) => (
                    <Marker key={place.id} position={place.position} icon={icon}>
                        <Popup>
                            <strong>{place.name}</strong>
                            <p>{place.description}</p>
                        </Popup>
                    </Marker>
                ))}

                {droppedPin && (
                    <Marker position={[droppedPin.lat, droppedPin.lng]} icon={droppedIcon}>
                        <Popup>
                            <div className="text-center min-w-[200px]">
                                <input
                                    type="text"
                                    value={droppedPin.name}
                                    onChange={(e) => setDroppedPin(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full text-center font-bold mb-2 border-b border-gray-300 focus:outline-none focus:border-blue-500 px-1"
                                    placeholder="Nombre del lugar..."
                                    autoFocus
                                />
                                <p className="mb-2 text-xs text-gray-500">
                                    {droppedPin.lat.toFixed(4)}, {droppedPin.lng.toFixed(4)}
                                </p>
                                <button
                                    onClick={handleAddToItinerary}
                                    className="w-full bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm flex items-center justify-center gap-1 hover:bg-blue-700 transition-colors"
                                >
                                    <Plus size={14} /> Añadir al Plan
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                )}
            </MapContainer>

            <DatePickerModal
                isOpen={showDateModal}
                onClose={() => setShowDateModal(false)}
                onConfirm={confirmAddToItinerary}
                trip={trip}
            />
        </>
    );
}
