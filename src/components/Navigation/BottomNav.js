"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListTodo, Map, Home, Compass, Calendar } from "lucide-react";

export default function BottomNav() {
    const pathname = usePathname();

    const navItems = [
        { href: "/", label: "Home", icon: Home },
        { href: "/explore", label: "Explore", icon: Compass },
        { href: "/itinerary", label: "Plan", icon: Calendar },
        { href: "/checklist", label: "Checklist", icon: ListTodo },
        { href: "/map", label: "Map", icon: Map },
    ];

    return (
        <nav style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "var(--card)",
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-around",
            padding: "0.8rem 0",
            zIndex: 1000
        }}>
            {navItems.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                    <Link
                        key={href}
                        href={href}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            fontSize: "0.75rem",
                            color: isActive ? "var(--primary)" : "#6b7280",
                            textDecoration: "none"
                        }}
                    >
                        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} style={{ marginBottom: "4px" }} />
                        <span style={{ fontWeight: isActive ? 600 : 400 }}>{label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
