"use client";

import { useState } from "react";
import { useTrip } from "@/context/TripContext";
import FloatingNav from "@/components/UI/FloatingNav";
import CustomPlanModal from "@/components/UI/CustomPlanModal";
import { Loader, Plus, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface PlanData {
    title: string;
    description: string;
    type: string;
    start_time: string;
}

export default function ExplorePage() {
    const { activeTrip, loading } = useTrip();
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <Loader className="animate-spin text-blue-500" />
            </div>
        );
    }

    if (!activeTrip) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
                <h1 className="text-2xl font-bold mb-4">No hay viaje seleccionado 🌍</h1>
                <p className="text-gray-500 mb-8">Selecciona o crea un viaje para empezar a explorar.</p>
                <FloatingNav />
            </div>
        );
    }

    const handleSavePlan = async (planData: PlanData) => {
        try {
            const newItem = {
                trip_id: activeTrip.id,
                title: planData.title,
                description: planData.description,
                type: planData.type,
                start_time: planData.start_time
            };

            const { error } = await supabase
                .from('itinerary_items')
                .insert([newItem]);

            if (error) throw error;
            alert("¡Plan añadido al itinerario!");
        } catch (error) {
            console.error("Error adding plan:", error);
            alert("Error al guardar el plan.");
        }
    };

    return (
        <div style={{ paddingBottom: "120px", minHeight: "100vh" }}>
            <div className="container" style={{ maxWidth: "800px", margin: "0 auto" }}>
                <header style={{ padding: "2rem 0 1rem" }} className="text-center">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
                        Explorar {activeTrip.location || "el destino"}
                    </h1>
                    <p className="text-gray-400">
                        Añade tus propios descubrimientos y planes.
                    </p>
                </header>

                <div className="mt-8 flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-white/5 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">
                    <MapPin size={48} className="text-blue-500 mb-4 opacity-50" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Diseña tu aventura</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
                        ¿Tienes un restaurante recomendado o un museo en mente? Añádelo directamente a tu itinerario desde aquí.
                    </p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Añadir Plan Manualmente
                    </button>
                </div>
            </div>

            <CustomPlanModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSavePlan}
                initialDate={activeTrip.start_date}
                editingItem={null}
            />

            <FloatingNav />
        </div>
    );
}
