"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { importTripData } from "@/utils/sharing";

export default function TripImporter() {
    const searchParams = useSearchParams();
    const router = useRouter(); // Use main router

    useEffect(() => {
        const importData = searchParams.get("import");
        if (importData) {
            // Small delay to ensure UI is ready or just confirm immediately
            if (confirm("¿Quieres importar este plan de viaje? Esto sobrescribirá tus datos actuales.")) {
                const success = importTripData(importData);
                if (success) {
                    alert("¡Plan importado con éxito!");
                    router.replace("/"); // Clean URL
                    // Force reload to reflect changes in all components (since they read from localStorage on mount)
                    window.location.reload();
                } else {
                    alert("Error al importar el plan.");
                }
            }
        }
    }, [searchParams, router]);

    return null; // This component is logical only
}
