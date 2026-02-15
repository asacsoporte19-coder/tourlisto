"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Key, CheckCircle, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function SecurityModal({ isOpen, onClose }) {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }
    const [userEmail, setUserEmail] = useState("");

    useEffect(() => {
        if (isOpen) {
            const checkUser = async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setUserEmail(user.email);
                } else {
                    setMessage({ type: 'error', text: 'No has iniciado sesión.' });
                }
            };
            checkUser();
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);

        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: 'Las contraseñas no coinciden.' });
            return;
        }

        if (password.length < 6) {
            setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres.' });
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            setMessage({ type: 'success', text: 'Contraseña actualizada correctamente.' });
            setPassword("");
            setConfirmPassword("");

            // Auto close after success
            setTimeout(() => {
                onClose();
                setMessage(null);
            }, 2000);

        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Error al actualizar.' });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 30 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-sm bg-white/90 dark:bg-[#121212]/90 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/5"
                >
                    {/* Header */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 opacity-70"></div>

                    <div className="p-8">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                                    <Lock className="text-emerald-500" size={20} />
                                    Seguridad
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                                    Actualiza tu contraseña {userEmail && `para ${userEmail}`}.
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 -mr-2 -mt-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {message && (
                            <div className={`mb-6 p-3 rounded-xl flex items-center gap-3 text-sm ${message.type === 'success'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                                }`}>
                                {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                                    Nueva Contraseña
                                </label>
                                <div className="relative group">
                                    <Key size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 pl-10 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-white/10 transition-all hover:border-gray-300 dark:hover:border-white/20"
                                        placeholder="Mínimo 6 caracteres"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                                    Confirmar Contraseña
                                </label>
                                <div className="relative group">
                                    <Key size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 pl-10 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-white/10 transition-all hover:border-gray-300 dark:hover:border-white/20"
                                        placeholder="Repite la contraseña"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>Actualizar acceso</>
                                )}
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
