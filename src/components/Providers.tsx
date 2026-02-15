"use client";

import { AuthProvider } from "@/context/AuthContext";
import { TripProvider } from "@/context/TripContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ReactNode } from "react";

interface ProvidersProps {
    children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <ThemeProvider>
            <LanguageProvider>
                <AuthProvider>
                    <TripProvider>
                        {children}
                    </TripProvider>
                </AuthProvider>
            </LanguageProvider>
        </ThemeProvider>
    );
}
