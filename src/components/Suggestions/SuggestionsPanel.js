"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader, AlertCircle, Plus } from "lucide-react";
import SuggestionCard from "./SuggestionCard";
import DatePickerModal from "@/components/UI/DatePickerModal";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";

export default function SuggestionsPanel({ trip }) {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // State for Date Selection Modal
    const [showDateModal, setShowDateModal] = useState(false);
    const [selectedSuggestion, setSelectedSuggestion] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim() || !trip?.location) return;

        setLoading(true);
        setHasSearched(true);
        try {
            const response = await fetch(`/api/suggestions?location=${encodeURIComponent(trip.location)}&q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();

            if (response.ok) {
                setResults(data.items || []);
            } else {
                setResults([]);
            }
        } catch (err) {
            console.error("Search error", err);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const initiateAddToItinerary = (suggestion) => {
        if (!trip || !trip.id) {
            alert("Error: No valid trip selected.");
            return;
        }
        setSelectedSuggestion(suggestion);
        setShowDateModal(true);
    };

    const confirmAddToItinerary = async (dateTimeStr) => {
        if (!selectedSuggestion) return;

        try {
            const startTime = dateTimeStr;
            const description = selectedSuggestion.description || '';
            const coords = (selectedSuggestion.lat && selectedSuggestion.lon)
                ? `\n\nCoordinates: ${selectedSuggestion.lat}, ${selectedSuggestion.lon}`
                : '';

            const newItem = {
                trip_id: trip.id,
                title: selectedSuggestion.name,
                description: `${description}${coords}`,
                type: 'Activity', // Default to Activity for search results
                start_time: startTime
            };

            const { error } = await supabase
                .from('itinerary_items')
                .insert([newItem]);

            if (error) throw error;

            alert("Plan añadido con éxito! 📅");
            setShowDateModal(false);
            setSelectedSuggestion(null);

        } catch (error) {
            console.error('Error adding item:', error);
            alert("Failed to add item to itinerary.");
        }
    };

    return (
        <div className="bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 p-6 min-h-[400px]">
            {/* Search Input */}
            <form onSubmit={handleSearch} className="relative mb-8">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Buscar en ${trip?.location || 'el destino'}...`}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition-all text-lg"
                    autoFocus
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-xl transition-colors"
                >
                    {loading ? <Loader size={18} className="animate-spin" /> : "Buscar"}
                </button>
            </form>

            {/* Results */}
            <div className="space-y-4">
                {!hasSearched && (
                    <div className="text-center text-gray-500 py-12 flex flex-col items-center">
                        <Search size={48} className="mb-4 opacity-20" />
                        <p>Escribe algo como "Pizza", "Museo", o "Parque"</p>
                        <p className="text-xs mt-2 opacity-50">Explora {trip?.location}</p>
                    </div>
                )}

                {loading && (
                    <div className="flex justify-center py-12">
                        <Loader className="animate-spin text-blue-500" size={32} />
                    </div>
                )}

                {!loading && hasSearched && results.length === 0 && (
                    <div className="text-center text-gray-500 py-12">
                        <AlertCircle size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No encontramos nada para "{searchQuery}"</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.map((item, index) => (
                        <SuggestionCard
                            key={index}
                            suggestion={item}
                            onAdd={() => initiateAddToItinerary(item)}
                        />
                    ))}
                </div>
            </div>

            <DatePickerModal
                isOpen={showDateModal}
                onClose={() => setShowDateModal(false)}
                onConfirm={confirmAddToItinerary}
            />
        </div>
    );
}
