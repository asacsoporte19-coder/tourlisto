"use client";

import { Star, Euro, Plus } from "lucide-react";

export default function PlaceCard({ place, onAdd }) {
    return (
        <div className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ height: "150px", overflow: "hidden", position: "relative" }}>
                <img
                    src={place.image}
                    alt={place.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    background: "white",
                    padding: "4px 8px",
                    borderRadius: "12px",
                    fontWeight: "bold",
                    fontSize: "0.8rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                }}>
                    <Star size={14} fill="#fbbf24" stroke="#fbbf24" />
                    {place.rating}
                </div>
            </div>

            <div style={{ padding: "1rem", flexGrow: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <h3 style={{ fontSize: "1.1rem", margin: 0 }}>{place.name}</h3>
                    <span style={{ fontSize: "0.9rem", color: "#666" }}>{place.price}</span>
                </div>

                <p style={{ fontSize: "0.9rem", color: "var(--primary)", fontWeight: 500, marginBottom: "0.5rem" }}>{place.type}</p>

                <p style={{ fontSize: "0.85rem", color: "#666", lineHeight: 1.4, flexGrow: 1, marginBottom: "1rem" }}>{place.description}</p>

                <button
                    onClick={() => onAdd(place)}
                    className="btn btn-primary"
                    style={{ width: "100%", gap: "0.5rem", fontSize: "0.9rem", padding: "0.5rem" }}
                >
                    <Plus size={16} /> Añadir al Plan
                </button>
            </div>
        </div>
    );
}
