"use client";

import { Utensils, Camera, LayoutGrid, Bed } from "lucide-react";

export default function FilterBar({ active, onFilterChange }) {
    const filters = [
        { id: "todos", label: "Todos", icon: LayoutGrid },
        { id: "eat", label: "Comer", icon: Utensils },
        { id: "see", label: "Ver", icon: Camera },
        { id: "stay", label: "Dormir", icon: Bed },
    ];

    return (
        <div style={{
            display: "flex",
            gap: "0.5rem",
            overflowX: "auto",
            padding: "0.5rem 0 1rem 0",
            scrollbarWidth: "none"
        }}>
            {filters.map(f => {
                const isActive = active === f.id;
                const Icon = f.icon;
                return (
                    <button
                        key={f.id}
                        onClick={() => onFilterChange(f.id)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "8px 16px",
                            borderRadius: "20px",
                            border: isActive ? "none" : "1px solid var(--border)",
                            background: isActive ? "var(--primary)" : "var(--card)",
                            color: isActive ? "white" : "var(--foreground)",
                            whiteSpace: "nowrap",
                            cursor: "pointer",
                            fontWeight: 500
                        }}
                    >
                        <Icon size={16} />
                        {f.label}
                    </button>
                );
            })}
        </div>
    );
}
