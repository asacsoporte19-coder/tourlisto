"use client";

import { AuthProvider } from "@/context/AuthContext";
import { TripProvider } from "@/context/TripContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "@/context/ThemeContext";

export function Providers({ children }) {
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
