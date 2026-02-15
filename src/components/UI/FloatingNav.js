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
                <nav className="bg-white/95 dark:bg-black/40 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 shadow-xl dark:shadow-none transition-all duration-300" style={{
                    padding: "0.75rem",
                    borderRadius: "2rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}>
                    {navItems.map(({ href, icon: Icon, label }) => {
                        const isActive = pathname === href;
                        return (
                            <Link
                                key={href}
                                href={href}
                                aria-label={label}
                                style={{
                                    position: "relative",
                                    padding: "0.5rem",
                                    color: isActive ? "var(--primary)" : "#6b7280",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}
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
                        className="text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <Lock size={18} /> Seguridad
                    </button>

                    <div className="h-px bg-gray-100 dark:bg-white/10 my-1" />

                    <button
                        onClick={() => {
                            console.log("FloatingNav: Theme button clicked");
                            toggleTheme();
                        }}
                        style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", border: "none", background: "none", cursor: "pointer", width: "100%", textAlign: "left" }}
                        className="text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition-colors"
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        {theme === 'dark' ? 'Modo Día' : 'Modo Noche'}
                    </button>
                </div>
            )}

            <ShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} />
            <TravelersModal isOpen={isTravelersOpen} onClose={() => setIsTravelersOpen(false)} />
            <SecurityModal isOpen={isSecurityOpen} onClose={() => setIsSecurityOpen(false)} />
        </>
    );
}
