"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, AlignLeft, MapPin, Music, Utensils, Bus, Bed, Sparkles, LucideIcon } from "lucide-react";
import { useState, useEffect, FormEvent } from "react";

// --- Types ---
interface PlanData {
    id?: string;
    title: string;
    description: string;
    type: string;
    start_time: string;
}

interface CustomPlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: PlanData) => void;
    editingItem: Partial<PlanData> | null;
    initialDate: string | null;
}

interface Category {
    id: string;
    label: string;
    icon: LucideIcon;
    color: string;
}

export default function CustomPlanModal({ isOpen, onClose, onSave, editingItem, initialDate }: CustomPlanModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("Activity");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("09:00");
    const [coordinates, setCoordinates] = useState("");

    useEffect(() => {
        if (isOpen) {
            if (editingItem) {
                setTitle(editingItem.title || "");
                setDescription(editingItem.description || "");
                setCategory(editingItem.type || "Activity");
                if (editingItem.start_time) {
                    const dt = new Date(editingItem.start_time);
                    setDate(dt.toISOString().split('T')[0]);
                    setTime(dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                }

                // Extract coordinates from description for editing
                const coordRegex = /(?:Coordinates|Location|Coordenadas):\s*(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/i;
                const match = editingItem.description?.match(coordRegex);
                if (match) {
                    setCoordinates(`${match[1]}, ${match[2]}`);
                    // Clean description for display
                    setDescription((editingItem.description || "").replace(coordRegex, '').trim());
                } else {
                    setCoordinates("");
                }

            } else {
                setTitle("");
                setDescription("");
                setCategory("Activity");
                setDate(initialDate || new Date().toISOString().split('T')[0]);
                setTime("09:00");
                setCoordinates("");
            }
        }
    }, [isOpen, editingItem, initialDate]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const dateTimeString = `${date}T${time}:00`;

        let finalDescription = description;
        if (coordinates.trim()) {
            // Append coordinates to description
            finalDescription = `${description}\n\nCoordinates: ${coordinates.trim()}`.trim();
        }

        const planData: PlanData = {
            id: editingItem?.id,
            title,
            description: finalDescription,
            type: category,
            start_time: new Date(dateTimeString).toISOString(),
        };
        onSave(planData);
        onClose();
    };

    const categories: Category[] = [
        { id: 'Activity', label: 'Actividad', icon: MapPin, color: 'from-blue-500/20 to-blue-600/20 text-blue-300 border-blue-500/30' },
        { id: 'Food', label: 'Comida', icon: Utensils, color: 'from-orange-500/20 to-orange-600/20 text-orange-300 border-orange-500/30' },
        { id: 'Evento', label: 'Evento', icon: Music, color: 'from-purple-500/20 to-purple-600/20 text-purple-300 border-purple-500/30' },
        { id: 'Transport', label: 'Transporte', icon: Bus, color: 'from-emerald-500/20 to-emerald-600/20 text-emerald-300 border-emerald-500/30' },
        { id: 'Lodging', label: 'Alojamiento', icon: Bed, color: 'from-yellow-500/20 to-yellow-600/20 text-yellow-300 border-yellow-500/30' },
    ];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 30 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-lg bg-white/90 dark:bg-[#121212]/90 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/5 max-h-[90vh] overflow-y-auto custom-scrollbar"
                >
                    {/* Header with subtle gradient */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-70"></div>

                    <div className="p-8">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                                    {editingItem ? <Sparkles className="text-purple-400" size={24} /> : <PlusIcon className="text-blue-400" size={24} />}
                                    {editingItem ? "Editar Experiencia" : "Nuevo Plan"}
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                    {editingItem ? "Modifica los detalles de tu plan." : "Añade algo especial a tu viaje."}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 -mr-2 -mt-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Title with floating-like label effect */}
                            <div className="group">
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                                    ¿Qué vamos a hacer?
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Ej: Concierto Coldplay, Cena en..."
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-lg text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-white/10 transition-all hover:border-gray-300 dark:hover:border-white/20"
                                    autoFocus
                                    required
                                />
                            </div>

                            {/* Categories Grid */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 ml-1">
                                    Categoría
                                </label>
                                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setCategory(cat.id)}
                                            className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 ${category === cat.id
                                                ? `bg-gradient-to-br ${cat.color} border-current shadow-lg scale-105`
                                                : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-gray-300'
                                                }`}
                                        >
                                            <cat.icon size={20} className={category === cat.id ? "text-current" : "opacity-70"} />
                                            <span className="text-[10px] font-medium">{cat.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Date & Time Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                                        Fecha
                                    </label>
                                    <div className="relative group">
                                        <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 pl-11 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-white/10 transition-all hover:border-gray-300 dark:hover:border-white/20 [&::-webkit-calendar-picker-indicator]:dark:invert"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                                        Hora
                                    </label>
                                    <div className="relative group">
                                        <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                                        <input
                                            type="time"
                                            value={time}
                                            onChange={(e) => setTime(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 pl-11 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-white/10 transition-all hover:border-gray-300 dark:hover:border-white/20 [&::-webkit-calendar-picker-indicator]:dark:invert"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Location (New) */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                                    Ubicación (Coordenadas)
                                </label>
                                <div className="relative group">
                                    <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                                    <input
                                        type="text"
                                        value={coordinates}
                                        onChange={(e) => setCoordinates(e.target.value)}
                                        placeholder="Ej: 40.4168, -3.7038"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pl-11 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all hover:border-white/20"
                                    />
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1 ml-1">
                                    Copia y pega las coordenadas (Lat, Lon) para que aparezca en el mapa.
                                </p>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                                    Notas Adicionales
                                </label>
                                <div className="relative">
                                    <AlignLeft size={18} className="absolute left-4 top-4 text-gray-500" />
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Reservas, códigos, recordatorios..."
                                        rows={3}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pl-11 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all hover:border-white/20 resize-none"
                                    />
                                </div>
                            </div>

                            {/* Action Button */}
                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 transform hover:-translate-y-0.5 transition-all duration-200"
                            >
                                {editingItem ? "Guardar Cambios" : "Añadir al Itinerario"}
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

// Simple icon for header
function PlusIcon({ size, className }: { size: number, className: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
    )
}
