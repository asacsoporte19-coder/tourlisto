"use client";

import { motion } from "framer-motion";
import { Plus, MapPin, Star } from "lucide-react";

const CATEGORY_ICONS = {
    Restaurants: "🍽️",
    Attractions: "🎭",
    Activities: "🎪",
    Shopping: "🛍️",
    Nightlife: "🌃",
    Transportation: "🚆"
};

const CATEGORY_COLORS = {
    Restaurants: "from-orange-500 to-red-500",
    Attractions: "from-blue-500 to-purple-500",
    Activities: "from-green-500 to-teal-500",
    Shopping: "from-pink-500 to-rose-500",
    Nightlife: "from-indigo-500 to-violet-500",
    Transportation: "from-gray-500 to-slate-500"
};

export default function SuggestionCard({ suggestion, category, onAddToItinerary }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all group"
        >
            <div className="flex gap-3">
                {/* Category Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${CATEGORY_COLORS[category]} flex items-center justify-center text-2xl flex-shrink-0`}>
                    {CATEGORY_ICONS[category]}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h4 className="text-white font-semibold mb-1 truncate">{suggestion.name}</h4>
                    <p className="text-gray-300 text-sm mb-2">{suggestion.description}</p>
                    <div className="flex items-center gap-2 text-xs">
                        <Star size={12} className="text-yellow-400" />
                        <span className="text-yellow-400">{suggestion.why}</span>
                    </div>
                </div>

                {/* Add Button */}
                <button
                    onClick={() => onAddToItinerary(suggestion, category)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity self-start p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white"
                    title="Add to itinerary"
                >
                    <Plus size={16} />
                </button>
            </div>
        </motion.div>
    );
}
