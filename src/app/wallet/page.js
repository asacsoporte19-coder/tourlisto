"use client";

import { useState, useEffect, useMemo } from "react";
import FloatingNav from "@/components/UI/FloatingNav";
import {
    Wallet, Plus, Trash2, ArrowRight, CheckCircle, Receipt, User, X, Info, Edit2,
    Utensils, Car, Bed, Coffee, ShoppingBag, Zap, Clapperboard, HandCoins,
    Globe, PieChart, Download
} from "lucide-react";
import { useTrip } from "@/context/TripContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";

// --- Constants ---
const CATEGORY_ICONS = {
    food: <Utensils size={18} />,
    transport: <Car size={18} />,
    accommodation: <Bed size={18} />,
    drinks: <Coffee size={18} />,
    shopping: <ShoppingBag size={18} />,
    activities: <Clapperboard size={18} />,
    bills: <Zap size={18} />,
    general: <Receipt size={18} />,
    settlement: <HandCoins size={18} className="text-green-400" />
};

const CATEGORY_LABELS = {
    food: "Comida",
    transport: "Transporte",
    accommodation: "Alojamiento",
    drinks: "Bebidas",
    shopping: "Compras",
    activities: "Actividades",
    bills: "Facturas",
    general: "Otros"
};

const CURRENCIES = [
    { code: 'EUR', symbol: '€', label: 'Euro' },
    { code: 'USD', symbol: '$', label: 'Dólar' },
    { code: 'GBP', symbol: '£', label: 'Libra' },
    { code: 'JPY', symbol: '¥', label: 'Yen' },
    { code: 'MXN', symbol: '$', label: 'Peso MX' },
    { code: 'CHF', symbol: 'Fr', label: 'Franco' },
];

// --- Helpers ---
const formatCurrency = (amount, currency = 'EUR') => {
    if (isNaN(amount)) return "0,00";
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: currency }).format(amount);
};

// --- Components ---

// Modal: Edit Name
const EditNameModal = ({ isOpen, onClose, currentName, onSave }) => {
    const [name, setName] = useState(currentName);
    const [saving, setSaving] = useState(false);

    useEffect(() => { setName(currentName); }, [currentName]);

    const handleSubmit = async () => {
        if (!name.trim()) return;
        setSaving(true);
        await onSave(name);
        setSaving(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-gray-900 border border-white/10 rounded-3xl w-full max-w-sm p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-4">¿Cómo te llamas?</h3>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                    placeholder="Tu nombre"
                    autoFocus
                />
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white">Cancelar</button>
                    <button onClick={handleSubmit} disabled={!name.trim() || saving} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-500 disabled:opacity-50">
                        {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Modal: Reports & Stats
const ReportsModal = ({ isOpen, onClose, expenses, getName, expensesTotal }) => {
    if (!isOpen) return null;

    // Calculate Category Stats
    const categoryStats = useMemo(() => {
        const stats = {};
        expenses.forEach(e => {
            if (e.type === 'settlement') return;
            const cat = e.category || 'general';
            stats[cat] = (stats[cat] || 0) + parseFloat(e.amount);
        });
        // Sort by amount descending
        return Object.entries(stats).sort(([, a], [, b]) => b - a);
    }, [expenses]);

    const downloadCSV = () => {
        const csvRows = [
            ['Fecha', 'Descripción', 'Pagado Por', 'Categoría', 'Moneda Original', 'Monto Original', 'Monto (EUR)'],
            ...expenses.map(e => [
                new Date(e.date).toLocaleDateString(),
                `"${e.description.replace(/"/g, '""')}"`, // Escape quotes
                getName(e.paid_by),
                e.type === 'settlement' ? 'Pago Deuda' : (CATEGORY_LABELS[e.category] || 'General'),
                e.currency_code || 'EUR',
                e.original_amount || e.amount,
                e.amount
            ])
        ];

        const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "gastos_tourlisto.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="bg-gray-900 border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24} /></button>

                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <PieChart className="text-purple-400" />
                    Estadísticas
                </h3>

                <div className="bg-black/40 p-4 rounded-xl border border-white/5 mb-6 text-center">
                    <p className="text-gray-400 text-sm mb-1">Gasto Total del Viaje</p>
                    <p className="text-3xl font-bold text-white">{formatCurrency(expensesTotal)}</p>
                </div>

                <div className="space-y-4 mb-8">
                    <h4 className="text-lg font-bold text-white mb-2">Por Categoría</h4>
                    {categoryStats.map(([cat, amount]) => {
                        const percentage = ((amount / expensesTotal) * 100).toFixed(1);
                        return (
                            <div key={cat} className="flex items-center gap-3">
                                <div className="p-2 bg-gray-800 rounded-lg text-gray-300">
                                    {CATEGORY_ICONS[cat] || <Receipt size={18} />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-300">{CATEGORY_LABELS[cat] || 'General'}</span>
                                        <span className="text-white font-bold">{formatCurrency(amount)}</span>
                                    </div>
                                    <div className="w-full bg-gray-800 rounded-full h-2">
                                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                                    </div>
                                    <div className="text-xs text-gray-500 text-right mt-1">{percentage}%</div>
                                </div>
                            </div>
                        );
                    })}
                    {categoryStats.length === 0 && <p className="text-gray-500 text-center">No hay gastos para mostrar.</p>}
                </div>

                <div className="pt-4 border-t border-white/10">
                    <button
                        onClick={downloadCSV}
                        className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                        <Download size={20} />
                        Exportar Excel (CSV)
                    </button>
                    <p className="text-center text-xs text-gray-500 mt-2">Descarga un archivo compatible con Excel/Sheets</p>
                </div>
            </div>
        </div>
    );
};

// Modal: Debt Details (Updated)
const DebtDetailsModal = ({ isOpen, onClose, debt, expenses, getName, onSettle }) => {
    if (!isOpen || !debt) return null;

    const relevantExpenses = expenses.filter(e => {
        const payerIsFrom = e.paid_by === debt.from;
        const payerIsTo = e.paid_by === debt.to;
        const fromInSplit = e.split_with.includes(debt.from);
        const toInSplit = e.split_with.includes(debt.to);
        return (payerIsFrom && toInSplit) || (payerIsTo && fromInSplit) || (e.type === 'settlement' && ((e.paid_by === debt.from && e.split_with.includes(debt.to)) || (e.paid_by === debt.to && e.split_with.includes(debt.from))));
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-gray-900 border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl relative max-h-[80vh] overflow-y-auto flex flex-col">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24} /></button>
                <h3 className="text-2xl font-bold text-white mb-1">Detalle de Deuda</h3>
                <p className="text-gray-400 text-sm mb-6">Interacciones entre <span className="text-blue-300">{getName(debt.from)}</span> y <span className="text-green-300">{getName(debt.to)}</span></p>

                <div className="space-y-4 flex-1 overflow-y-auto mb-4">
                    {relevantExpenses.length === 0 ? <p className="text-gray-500 text-center">No se encontraron gastos directos.</p> : relevantExpenses.map(expense => {
                        const isPayerFrom = expense.paid_by === debt.from;
                        const isSettlement = expense.type === 'settlement';
                        let share = isSettlement ? expense.amount : (expense.amount / expense.split_with.length);

                        return (
                            <div key={expense.id} className={`p-3 rounded-xl border ${isSettlement ? 'bg-green-900/20 border-green-500/30' : 'bg-black/40 border-white/5'}`}>
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400">{CATEGORY_ICONS[expense.category || (isSettlement ? 'settlement' : 'general')]}</span>
                                        <span className="font-bold text-white max-w-[180px] truncate">{expense.description}</span>
                                    </div>
                                    <span className="text-xs text-gray-500 whitespace-nowrap">{new Date(expense.date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400 text-xs max-w-[60%]">
                                        {isPayerFrom ? getName(debt.from) : getName(debt.to)} {isSettlement ? 'pagó' : 'pagó'} {formatCurrency(expense.amount)}
                                    </span>
                                    <div className="text-right">
                                        <span className={`font-bold block ${isPayerFrom ? 'text-green-400' : 'text-red-400'}`}>
                                            {isPayerFrom ? 'Recupera' : 'Genera deuda'}
                                        </span>
                                        <span className="text-white font-mono">{formatCurrency(share)}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-auto pt-4 border-t border-white/10">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-400">Deuda Neta Actual</span>
                        <span className="text-xl font-bold text-white">{formatCurrency(debt.amount)}</span>
                    </div>
                    <button onClick={() => onSettle(debt)} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
                        <HandCoins size={20} /> Saldar Deuda ({formatCurrency(debt.amount)})
                    </button>
                    <p className="text-center text-xs text-gray-500 mt-2">Esto registrará un pago de {getName(debt.from)} a {getName(debt.to)}.</p>
                </div>
            </div>
        </div>
    );
};

// --- Main Page ---
export default function WalletPage() {
    const { user } = useAuth();
    const { activeTrip } = useTrip();

    const [members, setMembers] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [profileCache, setProfileCache] = useState({});

    // UI States
    const [selectedDebt, setSelectedDebt] = useState(null);
    const [isNameModalOpen, setIsNameModalOpen] = useState(false);
    const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);

    // Form
    const [desc, setDesc] = useState("");
    const [amount, setAmount] = useState(""); // This is the Base Amount (EUR) eventually
    const [category, setCategory] = useState("general");
    const [paidBy, setPaidBy] = useState("");
    const [splitWith, setSplitWith] = useState([]);

    // Multi-currency Form State
    const [currency, setCurrency] = useState("EUR");
    const [originalAmount, setOriginalAmount] = useState("");
    const [exchangeRate, setExchangeRate] = useState("1"); // 1 EUR = X Local

    const [loading, setLoading] = useState(true);

    // Update names logic... (same as before)
    const updateUserName = async (newName) => {
        if (!user) return;
        try {
            const { error } = await supabase.from('profiles').update({ full_name: newName }).eq('id', user.id);
            if (error) throw error;
            setProfileCache(prev => ({ ...prev, [user.id]: newName }));
            setMembers(prev => prev.map(m => m.id === user.id ? { ...m, name: newName } : m));
        } catch (error) {
            console.error("Error updating name:", error);
            alert("No se pudo actualizar el nombre");
        }
    };

    // Load Data Effect
    useEffect(() => {
        if (!activeTrip) return;
        const loadData = async () => {
            setLoading(true);
            try {
                // Fetch members
                const { data: memberData } = await supabase.from('trip_members').select('user_id, profiles(full_name, email)').eq('trip_id', activeTrip.id);
                const activeMembers = (memberData || []).map(m => ({
                    id: m.user_id,
                    name: m.profiles?.full_name || m.profiles?.email?.split('@')[0] || 'Desconocido'
                }));
                setMembers(activeMembers);

                // Fetch expenses
                const { data: expenseData } = await supabase.from('expenses').select('*').eq('trip_id', activeTrip.id).order('date', { ascending: false });
                const loadedExpenses = expenseData || [];
                setExpenses(loadedExpenses);

                // Resolve profiles
                const allUserIds = new Set();
                activeMembers.forEach(m => allUserIds.add(m.id));
                loadedExpenses.forEach(e => {
                    if (e.paid_by) allUserIds.add(e.paid_by);
                    if (Array.isArray(e.split_with)) e.split_with.forEach(id => allUserIds.add(id));
                });
                const unknownIds = [...allUserIds].filter(id => !activeMembers.some(m => m.id === id));
                if (unknownIds.length > 0) {
                    const { data: profileData } = await supabase.from('profiles').select('id, full_name, email').in('id', unknownIds);
                    if (profileData) {
                        const newCache = {};
                        activeMembers.forEach(m => newCache[m.id] = m.name);
                        profileData.forEach(p => newCache[p.id] = p.full_name || p.email?.split('@')[0] || 'Usuario';
                        setProfileCache(newCache);
                    }
                } else {
                    const newCache = {};
                    activeMembers.forEach(m => newCache[m.id] = m.name);
                    setProfileCache(newCache);
                }

                if (user && activeMembers.find(m => m.id === user.id)) {
                    setPaidBy(user.id);
                    setSplitWith(activeMembers.map(m => m.id));
                } else if (activeMembers.length > 0) {
                    setPaidBy(activeMembers[0].id);
                    setSplitWith(activeMembers.map(m => m.id));
                }
            } catch (error) {
                console.error("Error loading wallet data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [activeTrip, user]);

    const getName = (id) => {
        if (user && id === user.id) return "Tú";
        return profileCache[id] || members.find(m => m.id === id)?.name || 'Usuario desconocido';
    };

    // Auto-calculate base amount when original amount or rate changes
    useEffect(() => {
        if (!originalAmount) {
            setAmount("");
            return;
        }
        if (currency === 'EUR') {
            setAmount(originalAmount);
            setExchangeRate("1");
        } else {
            // Logic: Amount (EUR) = Original (Local) / Exchange Rate (if rate is 1 EUR = X Local)
            // Or typically: Local / Rate -> EUR. 
            // Example: 1 EUR = 1.05 USD. Expense 10.50 USD. 10.50 / 1.05 = 10 EUR.
            const rate = parseFloat(exchangeRate) || 1;
            const calculated = parseFloat(originalAmount) / rate;
            setAmount(calculated.toFixed(2));
        }
    }, [originalAmount, exchangeRate, currency]);

    const addExpense = async () => {
        if (!desc || !amount || splitWith.length === 0 || !paidBy) return;

        const newExpense = {
            trip_id: activeTrip.id,
            description: desc,
            amount: parseFloat(amount), // Base amount (EUR)
            paid_by: paidBy,
            split_with: splitWith,
            date: new Date().toISOString(),
            type: 'expense',
            category: category,
            currency_code: currency,
            original_amount: parseFloat(originalAmount || amount),
            exchange_rate: parseFloat(exchangeRate)
        };

        const { data, error } = await supabase.from('expenses').insert([newExpense]).select().single();

        if (error) {
            console.error(error);
            alert("Error al guardar gasto");
        } else {
            setExpenses(prev => [data, ...prev]);
            setDesc("");
            setAmount("");
            setOriginalAmount("");
            setCategory("general");
            // Reset currency to EUR or keep last? Usually EUR is safer default to reset.
            setCurrency("EUR");
            setExchangeRate("1");
        }
    };

    const settleDebt = async (debt) => {
        const confirmMsg = `¿Confirmas que ${getName(debt.from)} ha pagado ${formatCurrency(debt.amount)} a ${getName(debt.to)}?`;
        if (!window.confirm(confirmMsg)) return;

        const settlementCheck = {
            trip_id: activeTrip.id,
            description: `Pago de deuda (${getName(debt.from)} -> ${getName(debt.to)})`,
            amount: debt.amount,
            paid_by: debt.from,
            split_with: [debt.to],
            date: new Date().toISOString(),
            type: 'settlement',
            category: 'settlement',
            currency_code: 'EUR',
            original_amount: debt.amount,
            exchange_rate: 1
        };

        const { data, error } = await supabase.from('expenses').insert([settlementCheck]).select().single();
        if (!error) {
            setExpenses(prev => [data, ...prev]);
            setSelectedDebt(null);
        }
    };

    const removeExpense = async (id) => {
        setExpenses(prev => prev.filter(e => e.id !== id));
        await supabase.from('expenses').delete().eq('id', id);
    };

    const toggleSplit = (id) => {
        if (splitWith.includes(id)) {
            setSplitWith(splitWith.filter(p => p !== id));
        } else {
            setSplitWith([...splitWith, id]);
        }
    };

    // Stats Calculations
    const calculateStats = () => {
        let balances = {};
        let totalPaid = {};
        let totalShare = {};

        Object.keys(profileCache).forEach(id => {
            balances[id] = 0;
            totalPaid[id] = 0;
            totalShare[id] = 0;
        });
        expenses.forEach(e => {
            if (e.paid_by && balances[e.paid_by] === undefined) { balances[e.paid_by] = 0; totalPaid[e.paid_by] = 0; totalShare[e.paid_by] = 0; }
            if (Array.isArray(e.split_with)) {
                e.split_with.forEach(id => {
                    if (balances[id] === undefined) { balances[id] = 0; totalPaid[id] = 0; totalShare[id] = 0; }
                });
            }
        });

        let grandTotal = 0;

        expenses.forEach(e => {
            if (!e.amount || isNaN(e.amount)) return;
            if (!e.paid_by) return;

            if (e.type === 'settlement') {
                if (e.split_with && e.split_with.length > 0) {
                    const receiverId = e.split_with[0];
                    balances[e.paid_by] += e.amount;
                    balances[receiverId] -= e.amount;
                }
                return;
            }

            const paidAmount = parseFloat(e.amount);
            grandTotal += paidAmount;
            totalPaid[e.paid_by] += paidAmount;
            balances[e.paid_by] += paidAmount;

            if (e.split_with && Array.isArray(e.split_with) && e.split_with.length > 0) {
                const splitAmount = paidAmount / e.split_with.length;
                e.split_with.forEach(memberId => {
                    balances[memberId] -= splitAmount;
                    totalShare[memberId] += splitAmount;
                });
            } else {
                totalShare[e.paid_by] += paidAmount;
                balances[e.paid_by] -= paidAmount;
            }
        });

        let debtors = [];
        let creditors = [];
        Object.entries(balances).forEach(([id, amount]) => {
            if (amount < -0.01) debtors.push({ id, amount });
            if (amount > 0.01) creditors.push({ id, amount });
        });
        debtors.sort((a, b) => a.amount - b.amount);
        creditors.sort((a, b) => b.amount - a.amount);

        let i = 0; let j = 0;
        let simplifiedDebts = [];
        while (i < debtors.length && j < creditors.length) {
            let debtor = debtors[i];
            let creditor = creditors[j];
            let amount = Math.min(Math.abs(debtor.amount), creditor.amount);
            simplifiedDebts.push({ from: debtor.id, to: creditor.id, amount: amount });
            debtor.amount += amount;
            creditor.amount -= amount;
            if (Math.abs(debtor.amount) < 0.01) i++;
            if (creditor.amount < 0.01) j++;
        }
        return { simplifiedDebts, totalPaid, totalShare, balances, grandTotal };
    };

    const { simplifiedDebts: debts, totalPaid, totalShare, balances, grandTotal } = calculateStats();

    if (loading && !members.length) return <div className="min-h-screen flex items-center justify-center text-white">Cargando...</div>;
    if (!activeTrip) return <div className="min-h-screen flex items-center justify-center p-8"><div className="text-white text-center">No hay viaje seleccionado</div></div>;

    return (
        <div style={{ paddingBottom: "120px", minHeight: "100vh" }}>
            <div className="container" style={{ maxWidth: "600px", margin: "0 auto" }}>
                <header style={{ padding: "2rem 0 1rem" }}>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-500/20 rounded-2xl backdrop-blur-md">
                                <Wallet className="text-blue-400" size={32} />
                            </div>
                            <h1 className="text-4xl font-bold text-white">Billetera</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsReportsModalOpen(true)}
                                className="bg-white/10 hover:bg-white/20 text-purple-300 p-2 rounded-full transition-all border border-white/10"
                            >
                                <PieChart size={20} />
                            </button>
                            {user && (
                                <button
                                    onClick={() => setIsNameModalOpen(true)}
                                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-blue-300 px-4 py-2 rounded-full transition-all border border-white/10"
                                >
                                    <Edit2 size={14} />
                                    <span className="font-medium text-sm">{profileCache[user.id] || "Soy..."}</span>
                                </button>
                            )}
                        </div>
                    </div>
                    <p className="text-gray-400">Gestiona los gastos compartidos de {activeTrip.name}.</p>
                </header>

                {/* Totals Summary */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl mb-6">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Receipt size={20} className="text-purple-400" />
                        Resumen de Costes
                    </h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-end border-b border-white/10 pb-4 mb-4">
                            <span className="text-gray-400 text-sm">Gasto Total Viaje</span>
                            <span className="text-2xl font-bold text-white">{formatCurrency(grandTotal)}</span>
                        </div>

                        {Object.entries(totalPaid).map(([userId, paid]) => {
                            if (paid === 0 && totalShare[userId] === 0) return null;
                            const balance = balances[userId] || 0;
                            const isPositive = balance > 0.01;
                            const isZero = Math.abs(balance) < 0.01;

                            return (
                                <div key={userId} className="bg-black/20 p-4 rounded-xl border border-white/5">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-white flex items-center gap-2">
                                            <User size={16} className="text-gray-400" />
                                            {getName(userId)}
                                        </span>
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${isZero ? 'bg-gray-500/20 text-gray-400' : (isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')}`}>
                                            {isZero ? 'AL DÍA' : (isPositive ? 'RECIBE' : 'DEBE')} {isZero ? '' : formatCurrency(Math.abs(balance))}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-500 text-xs">Total Pagado</p>
                                            <p className="text-white font-medium">{formatCurrency(paid)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-gray-500 text-xs">Total Consumido</p>
                                            <p className="text-white font-medium">{formatCurrency(totalShare[userId] || 0)}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Debts Summary */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl mb-6">
                    <h2 className="text-xl font-bold text-white mb-4">Deudas Pendientes</h2>
                    {debts.length === 0 ? (
                        <div className="text-center py-4 text-gray-400">
                            <CheckCircle className="mx-auto mb-2 opacity-50" size={32} />
                            <p>¡Todo al día! No hay deudas pendientes.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-xs text-gray-400 mb-2 italic">Pulsa en una deuda para ver el detalle y saldarla</p>
                            {debts.map((debt, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedDebt(debt)}
                                    className="w-full flex items-center justify-between bg-black/20 p-3 rounded-xl border border-white/5 hover:bg-white/5 transition-colors text-left"
                                >
                                    <div className="flex items-center gap-2 flex-1">
                                        <span className="font-medium text-red-300 truncate max-w-[80px] sm:max-w-none">{getName(debt.from)}</span>
                                        <ArrowRight size={16} className="text-gray-500 flex-shrink-0" />
                                        <span className="font-medium text-green-300 truncate max-w-[80px] sm:max-w-none">{getName(debt.to)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-white whitespace-nowrap">{formatCurrency(debt.amount)}</span>
                                        <Info size={16} className="text-gray-500" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Add Expense Form */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl mb-8">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Plus size={20} className="text-green-400" />
                        Nuevo Gasto
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Descripción</label>
                            <input
                                type="text"
                                value={desc}
                                onChange={e => setDesc(e.target.value)}
                                placeholder="Cena, Taxi, Hotel..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>

                        {/* Category Selector */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Categoría</label>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                                    if (key === 'settlement') return null;
                                    const isSelected = category === key;
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => setCategory(key)}
                                            className={`p-2 rounded-xl flex items-center gap-2 text-sm transition-all border ${isSelected
                                                ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20'
                                                : 'bg-black/20 border-white/5 text-gray-400 hover:bg-white/10'}`}
                                            title={label}
                                        >
                                            {CATEGORY_ICONS[key]}
                                            <span className={isSelected ? 'inline' : 'hidden sm:inline'}>{label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Amount & Currency */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Monto (Local)</label>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value)}
                                        className="bg-black/40 border border-white/10 rounded-xl px-2 py-3 text-white text-sm focus:outline-none"
                                    >
                                        {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                                    </select>
                                    <input
                                        type="number"
                                        value={originalAmount}
                                        onChange={e => setOriginalAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all number-input"
                                    />
                                </div>
                            </div>

                            {currency === 'EUR' ? (
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Pagado por</label>
                                    <select
                                        value={paidBy}
                                        onChange={e => setPaidBy(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                                    >
                                        {members.map(m => (
                                            <option key={m.id} value={m.id} className="bg-gray-900 text-white">
                                                {getName(m.id)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Cambio (1 EUR = ?)</label>
                                    <input
                                        type="number"
                                        value={exchangeRate}
                                        onChange={e => setExchangeRate(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all number-input"
                                    />
                                    <span className="text-xs text-gray-500 mt-1 block">≈ {formatCurrency(parseFloat(amount))}</span>
                                </div>
                            )}
                        </div>

                        {/* Pagado por (Duplicate if currency != EUR to keep layout clean) */}
                        {currency !== 'EUR' && (
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Pagado por</label>
                                <select
                                    value={paidBy}
                                    onChange={e => setPaidBy(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                                >
                                    {members.map(m => (
                                        <option key={m.id} value={m.id} className="bg-gray-900 text-white">
                                            {getName(m.id)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Dividir entre</label>
                            <div className="flex flex-wrap gap-2">
                                {members.map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => toggleSplit(m.id)}
                                        className={`px-3 py-1 rounded-lg text-sm transition-all ${splitWith.includes(m.id)
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        {getName(m.id)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={addExpense}
                            disabled={!desc || !amount || splitWith.length === 0}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        >
                            Añadir Gasto
                        </button>
                    </div>
                </div>

                {/* History */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
                    <h2 className="text-xl font-bold text-white mb-4">Historial</h2>
                    <div className="space-y-4">
                        {expenses.map(expense => {
                            const isForeign = expense.currency_code && expense.currency_code !== 'EUR';
                            return (
                                <div key={expense.id} className={`flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors group ${expense.type === 'settlement' ? 'bg-green-900/10 border border-green-500/20' : ''}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${expense.type === 'settlement' ? 'bg-green-500/20 text-green-400' : 'bg-gray-700/50 text-gray-300'}`}>
                                            {CATEGORY_ICONS[expense.category || (expense.type === 'settlement' ? 'settlement' : 'general')]}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white">{expense.description}</div>
                                            <div className="text-sm text-gray-400">
                                                Pagado por <span className="text-blue-300">{getName(expense.paid_by)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="font-bold text-white">
                                                {formatCurrency(expense.amount)}
                                            </div>
                                            {isForeign && (
                                                <div className="text-xs text-gray-400">
                                                    {expense.original_amount} {expense.currency_code}
                                                </div>
                                            )}
                                            {!isForeign && (
                                                <div className="text-xs text-gray-500">{new Date(expense.date).toLocaleDateString()}</div>
                                            )}
                                        </div>
                                        <button onClick={() => removeExpense(expense.id)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-2">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        {expenses.length === 0 && <p className="text-center text-gray-500 py-4">No hay gastos registrados aún.</p>}
                    </div>
                </div>
            </div>

            <DebtDetailsModal
                isOpen={!!selectedDebt}
                onClose={() => setSelectedDebt(null)}
                debt={selectedDebt}
                expenses={expenses}
                getName={getName}
                onSettle={settleDebt}
            />

            <EditNameModal
                isOpen={isNameModalOpen}
                onClose={() => setIsNameModalOpen(false)}
                currentName={user ? (profileCache[user.id] || "Usuario") : ""}
                onSave={updateUserName}
            />

            <ReportsModal
                isOpen={isReportsModalOpen}
                onClose={() => setIsReportsModalOpen(false)}
                expenses={expenses}
                getName={getName}
                expensesTotal={grandTotal}
            />

            <FloatingNav />
        </div>
    );
}
