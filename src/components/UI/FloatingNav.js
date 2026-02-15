"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Map as MapIcon, Wallet, CheckSquare, Sun, Moon, Settings, Share2, User, Calendar, ListTodo, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import ShareModal from "@/components/Social/ShareModal";
import TravelersModal from "@/components/Social/TravelersModal";
import SecurityModal from "./SecurityModal";

export default function FloatingNav() {
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();
    const [isMoreOpen, setIsMoreOpen] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [isTravelersOpen, setIsTravelersOpen] = useState(false);
    const [isSecurityOpen, setIsSecurityOpen] = useState(false);

    const navItems = [
        { href: "/", icon: Home, label: "Inicio" },
        { href: "/explore", icon: Compass, label: "Explorar" },
        { href: "/itinerary", icon: Calendar, label: "Plan" },
        { href: "/wallet", icon: Wallet, label: "Cartera" },
        { href: "/checklist", icon: ListTodo, label: "Lista" },
    ];

    return (
        <>
            <div style={{
                position: "fixed",
                bottom: "2rem",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 1000,
                width: "90%",
                maxWidth: "400px"
            }}>
                <nav
                    className="backdrop-blur-xl transition-all duration-300"
                    style={{
                        padding: "0.75rem",
                        borderRadius: "2rem",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        backgroundColor: theme === 'dark' ? "rgba(0, 0, 0, 0.4)" : "#ffffff", // Force clear white in light mode
                        border: theme === 'dark' ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #e5e7eb",
                        boxShadow: theme === 'dark' ? "none" : "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
                    }}
                >
                    {navItems.map(({ href, icon: Icon, label }) => {
                        const isActive = pathname === href;
                        const iconColor = isActive
                            ? (theme === 'dark' ? "#60a5fa" : "#3b82f6") // Blue-400 : Blue-500
                            : (theme === 'dark' ? "#9ca3af" : "#111827"); // Gray-400 : Gray-900 (Black)

                        return (
                            <Link
                                key={href}
                                href={href}
                                aria-label={label}
                                className="relative p-2 flex items-center justify-center transition-colors hover:opacity-80"
                                style={{ color: iconColor }}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-pill"
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            background: "rgba(57, 163, 239, 0.1)",
                                            borderRadius: "50%"
                                        }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} style={{ position: "relative", zIndex: 10 }} />
                            </Link>
                        );
                    })}



                    {/* More Button */}
                    <button
                        onClick={() => setIsMoreOpen(!isMoreOpen)}
                        style={{
                            background: "none",
                            border: "none",
                            padding: "0.5rem",
                            color: "#6b7280",
                            cursor: "pointer",
                            position: "relative"
                        }}
                    >
                        <Settings size={24} />
                    </button>
                </nav>
            </div>

            {/* More Menu */}
            {isMoreOpen && (
                <div className="fixed bottom-28 right-8 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-2xl p-2 shadow-2xl z-[1001] flex flex-col gap-2 min-w-[200px]">
                    <button
                        onClick={() => { setIsTravelersOpen(true); setIsMoreOpen(false); }}
                        style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", border: "none", background: "none", cursor: "pointer", width: "100%", textAlign: "left" }}
                        className="text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <User size={18} /> Viajeros
                    </button>
                    <button
                        onClick={() => { setIsShareOpen(true); setIsMoreOpen(false); }}
                        style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", border: "none", background: "none", cursor: "pointer", width: "100%", textAlign: "left" }}
                        className="text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <Share2 size={18} /> Compartir
                    </button>

                    <button
                        onClick={() => { setIsSecurityOpen(true); setIsMoreOpen(false); }}
                        style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", border: "none", background: "none", cursor: "pointer", width: "100%", textAlign: "left" }}
                        className="text-gray-300 hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <Lock size={18} /> Seguridad
                    </button>
                </div>
            )}

            <ShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} />
            <TravelersModal isOpen={isTravelersOpen} onClose={() => setIsTravelersOpen(false)} />
            <SecurityModal isOpen={isSecurityOpen} onClose={() => setIsSecurityOpen(false)} />
        </>
    );
}
