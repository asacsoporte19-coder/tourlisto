"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, User } from "lucide-react";
import { useTrip } from "@/context/TripContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";

export default function TravelersModal({ isOpen, onClose }) {
    const { activeTrip } = useTrip();
    const { user } = useAuth();
    const [travelers, setTravelers] = useState([]);
    const [newEmail, setNewEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen && activeTrip) {
            loadTravelers();
        }
    }, [isOpen, activeTrip]);

    const loadTravelers = async () => {
        if (!activeTrip) return;

        setLoading(true);
        const { data, error } = await supabase
            .from('trip_members')
            .select('user_id, profiles(full_name, email)')
            .eq('trip_id', activeTrip.id);

        if (error) {
            console.error(error);
            setError("Error cargando viajeros");
        } else {
            const mapped = (data || []).map(m => ({
                id: m.user_id,
                name: m.profiles?.full_name || m.profiles?.email || 'Usuario',
                email: m.profiles?.email,
                isCurrentUser: m.user_id === user?.id
            }));
            setTravelers(mapped);
        }
        setLoading(false);
    };

    const addTraveler = async () => {
        if (!newEmail.trim() || !activeTrip) return;

        setError("");
        setLoading(true);

        // 1. Find user by email
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .eq('email', newEmail.trim())
            .single();

        if (profileError || !profileData) {
            setError("Usuario no encontrado. Deben registrarse primero.");
            setLoading(false);
            return;
        }

        // 2. Check if already a member
        const { data: existingMember } = await supabase
            .from('trip_members')
            .select('id')
            .eq('trip_id', activeTrip.id)
            .eq('user_id', profileData.id)
            .single();

        if (existingMember) {
            setError("Este usuario ya está en el viaje");
            setLoading(false);
            return;
        }

        // 3. Add to trip_members
        const { error: insertError } = await supabase
            .from('trip_members')
            .insert({
                trip_id: activeTrip.id,
                user_id: profileData.id
            });

        if (insertError) {
            setError("Error añadiendo viajero");
            console.error(insertError);
        } else {
            setNewEmail("");
            await loadTravelers(); // Refresh list
        }
        setLoading(false);
    };

    const removeTraveler = async (travelerId) => {
        if (!activeTrip || travelerId === user?.id) return; // Can't remove yourself

        setLoading(true);
        const { error } = await supabase
            .from('trip_members')
            .delete()
            .eq('trip_id', activeTrip.id)
            .eq('user_id', travelerId);

        if (error) {
            setError("Error eliminando viajero");
            console.error(error);
        } else {
            await loadTravelers();
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem"
        }}>
            <div className="card" style={{ maxWidth: "400px", width: "100%", position: "relative" }}>
                <button
                    onClick={onClose}
                    style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", cursor: "pointer" }}
                >
                    <X />
                </button>

                <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Viajeros</h2>
                <p style={{ color: "#666", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
                    Añade viajeros por su email (deben estar registrados).
                </p>

                {error && (
                    <div style={{
                        background: "#fee",
                        color: "#c00",
                        padding: "0.5rem",
                        borderRadius: "8px",
                        marginBottom: "1rem",
                        fontSize: "0.9rem"
                    }}>
                        {error}
                    </div>
                )}

                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                    <input
                        type="email"
                        placeholder="email@ejemplo.com"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="input"
                        style={{ flex: 1, padding: "0.5rem", border: "1px solid var(--border)", borderRadius: "8px" }}
                        onKeyDown={(e) => e.key === "Enter" && addTraveler()}
                        disabled={loading}
                    />
                    <button
                        onClick={addTraveler}
                        disabled={loading}
                        style={{
                            background: "var(--primary)",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            padding: "0 1rem",
                            cursor: loading ? "wait" : "pointer",
                            opacity: loading ? 0.6 : 1
                        }}
                    >
                        <Plus />
                    </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "300px", overflowY: "auto" }}>
                    {travelers.length === 0 && !loading && (
                        <p style={{ color: "#999", textAlign: "center", padding: "1rem" }}>
                            No hay viajeros aún
                        </p>
                    )}
                    {travelers.map(t => (
                        <div key={t.id} style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "0.75rem",
                            background: "#f8fafc",
                            borderRadius: "8px"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <div style={{ background: "#e0f2fe", padding: "4px", borderRadius: "50%", color: "var(--primary)" }}>
                                    <User size={16} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 500 }}>
                                        {t.name} {t.isCurrentUser && "(Tú)"}
                                    </div>
                                    <div style={{ fontSize: "0.8rem", color: "#666" }}>
                                        {t.email}
                                    </div>
                                </div>
                            </div>
                            {!t.isCurrentUser && (
                                <button
                                    onClick={() => removeTraveler(t.id)}
                                    disabled={loading}
                                    style={{
                                        color: "#ef4444",
                                        background: "none",
                                        border: "none",
                                        cursor: loading ? "wait" : "pointer",
                                        opacity: loading ? 0.6 : 1
                                    }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
