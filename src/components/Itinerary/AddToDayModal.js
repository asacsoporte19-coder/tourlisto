"use client";

import { X, Calendar } from "lucide-react";
import { initialItinerary } from "@/data/itinerary";

export default function AddToDayModal({ isOpen, onClose, onSelectDay }) {
    if (!isOpen) return null;

    return (
        <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000
        }}>
            <div className="card" style={{ width: "90%", maxWidth: "400px", padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h2 style={{ fontSize: "1.2rem", margin: 0 }}>Añadir al Plan</h2>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
                        <X size={24} />
                    </button>
                </div>

                <p style={{ marginBottom: "1rem", color: "#666" }}>Selecciona un día:</p>

                <div style={{ display: "grid", gap: "0.5rem" }}>
                    {Object.entries(initialItinerary).map(([key, day]) => (
                        <button
                            key={key}
                            onClick={() => onSelectDay(key)}
                            style={{
                                padding: "1rem",
                                borderRadius: "var(--radius)",
                                border: "1px solid var(--border)",
                                background: "var(--card)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "1rem",
                                textAlign: "left"
                            }}
                        >
                            <Calendar size={20} color="var(--primary)" />
                            <div>
                                <div style={{ fontWeight: "bold" }}>{day.date}</div>
                                <div style={{ fontSize: "0.8rem", color: "#666" }}>{day.label}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
