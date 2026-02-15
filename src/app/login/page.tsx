"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Mail, Lock } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { t } = useLanguage();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push('/');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-cover bg-center relative"
            style={{
                backgroundImage: "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop')",
                backgroundPosition: "center bottom"
            }}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"></div>

            <LanguageSelector />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative w-full max-w-md p-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl text-white overflow-hidden"
            >
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-br from-white/10 to-transparent rotate-45 pointer-events-none"></div>

                <div className="relative z-10">
                    <h1 className="text-4xl md:text-5xl font-serif text-center mb-2 tracking-wide text-white drop-shadow-md">
                        {t('auth.login.title')}
                    </h1>
                    <p className="text-center text-gray-200 mb-10 font-light tracking-widest text-sm uppercase">
                        {t('auth.login.subtitle')}
                    </p>

                    {error && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="bg-red-500/20 border border-red-500/50 text-red-100 p-3 rounded-lg mb-6 text-sm text-center backdrop-blur-sm"
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-1">
                            <label className="text-xs uppercase tracking-wider text-gray-300 ml-1">{t('auth.login.email')}</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-3.5 text-gray-300 w-5 h-5 group-focus-within:text-white transition-colors" />
                                <input
                                    type="email"
                                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:bg-white/10 focus:border-white/30 text-white placeholder-gray-400 transition-all font-light"
                                    placeholder="nomad@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs uppercase tracking-wider text-gray-300 ml-1">{t('auth.login.password')}</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-3.5 text-gray-300 w-5 h-5 group-focus-within:text-white transition-colors" />
                                <input
                                    type="password"
                                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:bg-white/10 focus:border-white/30 text-white placeholder-gray-400 transition-all font-light"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-white text-gray-900 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                        >
                            {loading ? t('common.loading') : t('auth.login.submit')}
                            {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                        </motion.button>
                    </form>

                    <div className="mt-8 text-center text-sm">
                        <span className="text-gray-300">{t('auth.login.noAccount')} </span>
                        <Link href="/signup" className="text-white font-semibold hover:underline">
                            {t('auth.login.signUp')}
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
