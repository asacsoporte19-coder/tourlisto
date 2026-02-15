"use client";

import { useState, useEffect } from "react";
import FloatingNav from "@/components/UI/FloatingNav";
import { Wallet, Plus, Trash2, ArrowRight, CheckCircle, Receipt, User, X, Info, Edit2 } from "lucide-react";
import { useTrip } from "@/context/TripContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";

// Modal for Editing User Name
const EditNameModal = ({ isOpen, onClose, currentName, onSave }) => {
    const [name, setName] = useState(currentName);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setName(currentName);
    }, [currentName]);

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
                    placeholder="Tu nombre (ej. Juanjo)"
                    autoFocus
                />
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white">Cancelar</button>
                    <button
                        onClick={handleSubmit}
                        disabled={!name.trim() || saving}
                        className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-500 disabled:opacity-50"
                    >
                        {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Modal Component for Debt Details
const DebtDetailsModal = ({ isOpen, onClose, debt, expenses, getName, formatCurrency }) => {
    if (!isOpen || !debt) return null;

    // Filter expenses relevant to this specific debt relationship
    const relevantExpenses = expenses.filter(e => {
        const payerIsFrom = e.paid_by === debt.from;
        const payerIsTo = e.paid_by === debt.to;

        const fromInSplit = e.split_with.includes(debt.from);
        const toInSplit = e.split_with.includes(debt.to);

        return (payerIsFrom && toInSplit) || (payerIsTo && fromInSplit) || (e.type === 'settlement' && ((e.paid_by === debt.from && e.split_with.includes(debt.to)) || (e.paid_by === debt.to && e.split_with.includes(debt.from))));
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-gray-900 border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl relative max-h-[80vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                    <X size={24} />
                </button>

                <h3 className="text-2xl font-bold text-white mb-1">Detalle de Deuda</h3>
                <p className="text-gray-400 text-sm mb-6">
                    Interacciones entre <span className="text-blue-300">{getName(debt.from)}</span> y <span className="text-green-300">{getName(debt.to)}</span>
                </p>

                <div className="space-y-4">
                    {relevantExpenses.length === 0 ? (
                        <p className="text-gray-500 text-center">No se encontraron gastos directos entre estas dos personas.</p>
                    ) : (
                        relevantExpenses.map(expense => {
                            const isPayerFrom = expense.paid_by === debt.from;
                            let share = 0;
                            if (expense.type === 'settlement') {
                                share = expense.amount;
                            } else {
                                const splitCount = expense.split_with.length;
                                share = expense.amount / splitCount;
                            }

                            return (
                                <div key={expense.id} className="bg-black/40 p-3 rounded-xl border border-white/5">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-white max-w-[70%] truncate">{expense.description}</span>
                                        <span className="text-xs text-gray-500 whitespace-nowrap">{new Date(expense.date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400 text-xs max-w-[60%]">
                                            {isPayerFrom ? getName(debt.from) : getName(debt.to)} pagó {formatCurrency(expense.amount)}
                                        </span>
                                        <div className="text-right">
                                            <span className={`font-bold block ${isPayerFrom ? 'text-green-400' : 'text-red-400'}`}>
                                                {isPayerFrom ? 'Recupera' : 'Genera deuda'}
                                            </span>
                                            <span className="text-white font-mono">
                                                {formatCurrency(share)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
                    <span className="text-gray-400">Deuda Neta Actual</span>
                    <span className="text-xl font-bold text-white">{formatCurrency(debt.amount)}</span>
                </div>
            </div>
        </div>
    );
};

export default function WalletPage() {
    const { user } = useAuth();
    const { activeTrip } = useTrip();

    const [members, setMembers] = useState([]); // [{ id, name, ... }]
    const [expenses, setExpenses] = useState([]);
    const [profileCache, setProfileCache] = useState({});

    // UI States
    const [selectedDebt, setSelectedDebt] = useState(null);
    const [isNameModalOpen, setIsNameModalOpen] = useState(false);

    // Helper
    const formatCurrency = (amount) => {
        if (isNaN(amount)) return "0,00 €";
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    // Form
    const [desc, setDesc] = useState("");
    const [amount, setAmount] = useState("");
    const [paidBy, setPaidBy] = useState(""); // User ID
    const [splitWith, setSplitWith] = useState([]); // Array of User IDs

    const [loading, setLoading] = useState(true);

    // Update Name Function
    const updateUserName = async (newName) => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: newName })
                .eq('id', user.id);

            if (error) throw error;

            setProfileCache(prev => ({ ...prev, [user.id]: newName }));
            setMembers(prev => prev.map(m => m.id === user.id ? { ...m, name: newName } : m));

        } catch (error) {
            console.error("Error updating name:", error);
            alert("No se pudo actualizar el nombre");
        }
    };

    useEffect(() => {
        if (!activeTrip) return;

        const loadData = async () => {
            setLoading(true);

            try {
                // 1. Fetch Trip Members (Active participants)
                const { data: memberData, error: memberError } = await supabase
                    .from('trip_members')
                    .select('user_id, profiles(full_name, email)')
                    .eq('trip_id', activeTrip.id);

                if (memberError) throw memberError;

                const activeMembers = (memberData || []).map(m => ({
                    id: m.user_id,
                    name: m.profiles?.full_name || m.profiles?.email?.split('@')[0] || 'Desconocido'
                }));
                setMembers(activeMembers);

                // 2. Fetch Expenses
                const { data: expenseData, error: expenseError } = await supabase
                    .from('expenses')
                    .select('*')
                    .eq('trip_id', activeTrip.id)
                    .order('date', { ascending: false });

                if (expenseError) throw expenseError;
                const loadedExpenses = expenseData || [];
                setExpenses(loadedExpenses);

                // 3. Resolve ALL needed profiles
                const allUserIds = new Set();
                activeMembers.forEach(m => allUserIds.add(m.id));

                loadedExpenses.forEach(e => {
                    if (e.paid_by) allUserIds.add(e.paid_by);
                    if (Array.isArray(e.split_with)) {
                        e.split_with.forEach(id => allUserIds.add(id));
                    }
                });

                const knownIds = new Set(activeMembers.map(m => m.id));
                const unknownIds = [...allUserIds].filter(id => !knownIds.has(id));

                let extraProfiles = [];
                if (unknownIds.length > 0) {
                    const { data: profileData, error: profileError } = await supabase
                        .from('profiles')
                        .select('id, full_name, email')
                        .in('id', unknownIds);
                    if (profileData) extraProfiles = profileData;
                }

                const newCache = {};
                activeMembers.forEach(m => newCache[m.id] = m.name);
                extraProfiles.forEach(p => newCache[p.id] = p.full_name || p.email?.split('@')[0] || 'Usuario');

                setProfileCache(newCache);

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

    const addExpense = async () => {
        if (!desc || !amount || splitWith.length === 0 || !paidBy) return;

        const newExpense = {
            trip_id: activeTrip.id,
            description: desc,
            amount: parseFloat(amount),
            paid_by: paidBy,
            split_with: splitWith,
            date: new Date().toISOString(),
            type: 'expense'
        };

        const { data, error } = await supabase.from('expenses').insert([newExpense]).select().single();

        if (error) {
            console.error(error);
            alert("Error al guardar gasto");
        } else {
            setExpenses(prev => [data, ...prev]);
            setDesc("");
            setAmount("");
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
            if (!e.amount || isNaN(e.amount)) return;
            if (!e.paid_by) return;

            if (balances[e.paid_by] === undefined) { balances[e.paid_by] = 0; totalPaid[e.paid_by] = 0; totalShare[e.paid_by] = 0; }

            if (e.type === 'settlement') {
                if (e.split_with && e.split_with.length > 0) {
                    const receiverId = e.split_with[0];
                    if (balances[receiverId] === undefined) { balances[receiverId] = 0; totalPaid[receiverId] = 0; totalShare[receiverId] = 0; }

                    balances[e.paid_by] += e.amount;
                    balances[receiverId] -= e.amount;
                }
                return;
            }

            const paidAmount = parseFloat(e.amount);
            totalPaid[e.paid_by] += paidAmount;
            balances[e.paid_by] += paidAmount;

            if (e.split_with && Array.isArray(e.split_with) && e.split_with.length > 0) {
                const splitAmount = paidAmount / e.split_with.length;
                e.split_with.forEach(memberId => {
                    if (balances[memberId] === undefined) { balances[memberId] = 0; totalPaid[memberId] = 0; totalShare[memberId] = 0; }
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
        return { simplifiedDebts, totalPaid, totalShare, balances };
    };

    const { simplifiedDebts: debts, totalPaid, totalShare, balances } = calculateStats();

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
                    <p className="text-gray-400">Gestiona los gastos compartidos de {activeTrip.name}.</p>
                </header>

                {/* Totals Summary */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl mb-6">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Receipt size={20} className="text-purple-400" />
                        Resumen de Costes
                    </h2>
                    <div className="space-y-4">
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
                            <p className="text-xs text-gray-400 mb-2 italic">Pulsa en una deuda para ver el detalle</p>
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
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Monto</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
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
                        </div>
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
                        {expenses.map(expense => (
                            <div key={expense.id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors group">
                                <div>
                                    <div className="font-bold text-white">{expense.description}</div>
                                    <div className="text-sm text-gray-400">
                                        Pagado por <span className="text-blue-300">{getName(expense.paid_by)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="font-bold text-white">{formatCurrency(expense.amount)}</div>
                                        <div className="text-xs text-gray-500">{new Date(expense.date).toLocaleDateString()}</div>
                                    </div>
                                    <button
                                        onClick={() => removeExpense(expense.id)}
                                        className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-2"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {expenses.length === 0 && (
                            <p className="text-center text-gray-500 py-4">No hay gastos registrados aún.</p>
                        )}
                    </div>
                </div>
            </div>

            <DebtDetailsModal
                isOpen={!!selectedDebt}
                onClose={() => setSelectedDebt(null)}
                debt={selectedDebt}
                expenses={expenses}
                getName={getName}
                formatCurrency={formatCurrency}
            />

            <EditNameModal
                isOpen={isNameModalOpen}
                onClose={() => setIsNameModalOpen(false)}
                currentName={user ? (profileCache[user.id] || "Usuario") : ""}
                onSave={updateUserName}
            />

            <FloatingNav />
        </div>
    );
}
