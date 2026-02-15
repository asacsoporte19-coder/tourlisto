"use client";

import { useState } from "react";
import { X, Copy, Check } from "lucide-react";
import { exportTripData } from "@/utils/sharing";

export default function ShareModal({ isOpen, onClose }) {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const navData = exportTripData();
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}?import=${navData}` : "";

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem"
        }}>
            <div className="card" style={{ maxWidth: "400px", width: "100%", position: "relative" }}>
                <button
                    onClick={onClose}
                    style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", cursor: "pointer" }}
                >
                    <X />
                </button>

                <h2 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Compartir Viaje</h2>
                <p style={{ color: "#666", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
                    Copia este enlace y envíalo a tus amigos. Al abrirlo, tendrán una copia exacta de tu plan (Itinerario, Gastos, etc.).
                </p>

                <div style={{
                    background: "#f1f5f9",
                    padding: "1rem",
                    borderRadius: "8px",
                    wordBreak: "break-all",
                    fontSize: "0.8rem",
                    marginBottom: "1rem",
                    maxHeight: "100px",
                    overflowY: "auto",
                    color: "#475569"
                }}>
                    {shareUrl.substring(0, 100)}...
                </div>

                <button
                    className="btn btn-primary"
                    onClick={handleCopy}
                    style={{ width: "100%", display: "flex", justifyContent: "center", gap: "0.5rem" }}
                >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                    {copied ? "¡Copiado!" : "Copiar Enlace"}
                </button>
            </div>
        </div>
    );
}
