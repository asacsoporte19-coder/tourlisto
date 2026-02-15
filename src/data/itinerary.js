import { Music } from "lucide-react";

export const initialItinerary = {
    "2026-02-19": { date: "19 Feb", label: "Llegada", items: [] },
    "2026-02-20": { date: "20 Feb", label: "Explorando", items: [] },
    "2026-02-21": {
        date: "21 Feb",
        label: "Rock in Rio",
        items: [
            {
                id: "event-rir",
                name: "Rock in Rio - Linkin Park",
                description: "Escenario Principal",
                type: "Evento",
                isFixed: true,
                icon: "Music",
                time: "18:00"
            }
        ]
    },
    "2026-02-22": { date: "22 Feb", label: "Domingo Relax", items: [] },
    "2026-02-23": { date: "23 Feb", label: "Último Día", items: [] },
    "2026-02-24": { date: "24 Feb", label: "Salida", items: [] },
};
