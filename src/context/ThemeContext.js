"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState("dark"); // Default to dark as per current design

    useEffect(() => {
        // Check local storage or system preference
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme) {
            setTheme(savedTheme);
        } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
            setTheme("dark");
        }
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;
        console.log("ThemeContext: Applying theme:", theme); // DEBUG LOG
        // Remove both to start fresh
        root.classList.remove("light", "dark");
        // Add current theme
        root.classList.add(theme);
        // Persist
        localStorage.setItem("theme", theme);
    }, [theme]);

    const toggleTheme = () => {
        console.log("ThemeContext: Toggling theme. Current:", theme); // DEBUG LOG
        setTheme(prev => prev === "dark" ? "light" : "dark");
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
