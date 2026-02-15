"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Map as MapIcon, Wallet, CheckSquare, Sun, Moon, Settings, Share2, User, Calendar, ListTodo, Lock, LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import ShareModal from "@/components/Social/ShareModal";
import TravelersModal from "@/components/Social/TravelersModal";
import SecurityModal from "./SecurityModal";

interface NavItem {
    href: string;
    icon: LucideIcon;
    label: string;
}

export default function FloatingNav() {
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();
    const [isMoreOpen, setIsMoreOpen] = useState<boolean>(false);
    const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
    const [isTravelersOpen, setIsTravelersOpen] = useState<boolean>(false);
    const [isSecurityOpen, setIsSecurityOpen] = useState<boolean>(false);

    const navItems: NavItem[] = [
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
                    className="bg-black/40 backdrop-blur-xl border border-white/10 transition-all duration-300"
                    style={{
                        padding: "0.75rem",
                        borderRadius: "2rem",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    {navItems.map(({ href, icon: Icon, label }) => {
                        const isActive = pathname === href;

                        return (
                            <Link
                                key={href}
                                href={href}
                                aria-label={label}
                                className={`relative p-2 flex items-center justify-center transition-colors hover:opacity-80 ${isActive ? "text-blue-400" : "text-gray-400 hover:text-gray-200"
                                    }`}
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
                            cursor: "pointer",
                            position: "relative"
                        }}
                        className="text-gray-400 hover:text-gray-200"
                    >
                        <Settings size={24} />
                    </button>
                </nav>
                {/* More Menu - Now relative to the container */}
                <AnimatePresence>
                    {isMoreOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute bottom-full mb-4 right-0 bg-zinc-900 border border-white/10 rounded-2xl p-2 shadow-2xl flex flex-col gap-2 min-w-[200px]"
                            style={{ zIndex: 1002 }}
                        >
                            <button
                                onClick={() => { setIsTravelersOpen(true); setIsMoreOpen(false); }}
                                className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:bg-white/5 rounded-lg transition-colors w-full text-left"
                            >
                                <User size={18} /> Viajeros
                            </button>
                            <button
                                onClick={() => { setIsShareOpen(true); setIsMoreOpen(false); }}
                                className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:bg-white/5 rounded-lg transition-colors w-full text-left"
                            >
                                <Share2 size={18} /> Compartir
                            </button>
                            <button
                                onClick={() => { setIsSecurityOpen(true); setIsMoreOpen(false); }}
                                className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:bg-white/5 rounded-lg transition-colors w-full text-left"
                            >
                                <Lock size={18} /> Seguridad
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div> // Closing the main fixed container

            <ShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} />
            <TravelersModal isOpen={isTravelersOpen} onClose={() => setIsTravelersOpen(false)} />
            <SecurityModal isOpen={isSecurityOpen} onClose={() => setIsSecurityOpen(false)} />
        </>
    );
}
