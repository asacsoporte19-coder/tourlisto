"use client";

import { useState, useEffect } from "react";
import FloatingNav from "@/components/UI/FloatingNav";
import { Wallet, Plus, Trash2, ArrowRight, CheckCircle } from "lucide-react";
import { useTrip } from "@/context/TripContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";

export default function WalletPage() {
    const { user } = useAuth();
    const { activeTrip } = useTrip();

    const [members, setMembers] = useState([]); // [{ id, name, ... }]
    const [expenses, setExpenses] = useState([]);

    // Helper
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    // Form
    const [desc, setDesc] = useState("");
    const [amount, setAmount] = useState("");
    const [paidBy, setPaidBy] = useState(""); // User ID
    const [splitWith, setSplitWith] = useState([]); // Array of User IDs

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!activeTrip) return;

        const loadData = async () => {
            setLoading(true);
            // 1. Fetch Members
            const { data: memberData, error: memberError } = await supabase
                .from('trip_members')
                .select('user_id, profiles(full_name, email)')
                .eq('trip_id', activeTrip.id);

            if (memberError) console.error(memberError);

            const mappedMembers = (memberData || []).map(m => ({
                id: m.user_id,
                name: m.profiles?.full_name || m.profiles?.email || 'Desconocido'
            }));
            setMembers(mappedMembers);

            // Set default paidBy as current user if in list
            if (user && mappedMembers.find(m => m.id === user.id)) {
                setPaidBy(user.id);
                setSplitWith(mappedMembers.map(m => m.id)); // Default split with all
            } else if (mappedMembers.length > 0) {
                setPaidBy(mappedMembers[0].id);
                setSplitWith(mappedMembers.map(m => m.id));
            }

            // 2. Fetch Expenses
            const { data: expenseData, error: expenseError } = await supabase
                .from('expenses')
                .select('*')
                .eq('trip_id', activeTrip.id)
                .order('date', { ascending: false });

            if (expenseError) console.error(expenseError);
            setExpenses(expenseData || []);

            setLoading(false);
        };

        loadData();
    }, [activeTrip, user]);

    // Helpers to get name
    const getName = (id) => members.find(m => m.id === id)?.name || '...';

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

        // Optimistic UI? 
        // Better to wait for DB ID for deletion logic, but can show loading.
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

    // --- Debt Logic (Adapted for IDs) ---
    const calculateDebts = () => {
        let balances = {}; // { userId: amount }
        members.forEach(m => balances[m.id] = 0);

        expenses.forEach(e => {
            if (e.type === 'settlement') {
                // Settlement: paid_by paid to split_with[0]
                // So paid_by is +, split_with is - (they received money, so their balance debt decreases... wait)
                // If A pays B 100 to settle.
                // A spent 100 (Creditor in generic sense of transaction, but reduces A's debt).
                // It treats as simple transfer. 
                // Let's model it: A pays B. A's balance += 100. B's balance -= 100.
                if (balances[e.paid_by] !== undefined) balances[e.paid_by] += e.amount;
                if (balances[e.split_with[0]] !== undefined) balances[e.split_with[0]] -= e.amount;
                return;
            }

            const paidAmount = e.amount;
            const splitAmount = paidAmount / e.split_with.length;

            if (balances[e.paid_by] !== undefined) balances[e.paid_by] += paidAmount;

            e.split_with.forEach(memberId => {
                if (balances[memberId] !== undefined) balances[memberId] -= splitAmount;
            });
        });

        // Separate Debtors and Creditors
        let debtors = [];
        let creditors = [];

        Object.entries(balances).forEach(([id, amount]) => {
            if (amount < -0.01) debtors.push({ id, amount });
            if (amount > 0.01) creditors.push({ id, amount });
        });

        debtors.sort((a, b) => a.amount - b.amount);
        creditors.sort((a, b) => b.amount - a.amount);

        let debts = [];
        let i = 0;
        let j = 0;

        while (i < debtors.length && j < creditors.length) {
            let debtor = debtors[i];
            let creditor = creditors[j];

            let amount = Math.min(Math.abs(debtor.amount), creditor.amount);

            debts.push({
                from: debtor.id,
                to: creditor.id,
                amount: amount
            });

            debtor.amount += amount;
            creditor.amount -= amount;

            if (Math.abs(debtor.amount) < 0.01) i++;
            if (creditor.amount < 0.01) j++;
        }

        return debts;
    };

    const debts = calculateDebts();

    // Only sum non-settlement expenses for total
    const totalTripCost = expenses.filter(e => e.type !== 'settlement').reduce((acc, curr) => acc + curr.amount, 0);

    const settleDebt = async (debt) => {
        const settlement = {
            trip_id: activeTrip.id,
            description: `Pago a ${getName(debt.to)}`,
            amount: debt.amount,
            paid_by: debt.from,
            split_with: [debt.to],
            date: new Date().toISOString(),
            type: "settlement"
        };

        const { data, error } = await supabase.from('expenses').insert([settlement]).select().single();
        if (!error) {
            setExpenses(prev => [data, ...prev]);
        }
    };

    if (loading && !members.length) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-white text-lg">Cargando billetera...</div>
            </div>
        );
    }

    if (!activeTrip) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="bg-black/40 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-xl text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">No hay viaje seleccionado</h2>
                    <p className="text-gray-400">Crea o selecciona un viaje para gestionar los gastos.</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ paddingBottom: "120px", minHeight: "100vh" }}>
            <div className="container" style={{ maxWidth: "600px", margin: "0 auto" }}>
                <header style={{ padding: "2rem 0 1rem" }}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-blue-500/20 rounded-2xl backdrop-blur-md">
                            <Wallet className="text-blue-400" size={32} />
                        </div>
                        <h1 className="text-4xl font-bold text-white">Billetera</h1>
                    </div>
                    <p className="text-gray-400">Gestiona los gastos compartidos de {activeTrip.name}.</p>
                </header>

                {/* Debts Summary */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl mb-6">
                    <h2 className="text-xl font-bold text-white mb-4">Balance de Deudas</h2>
                    {/* ... debts logic ... */}
                    {Object.keys(debts).length === 0 ? (
                        <div className="text-center py-4 text-gray-400">
                            <CheckCircle className="mx-auto mb-2 opacity-50" size={32} />
                            <p>¡Todo al día! No hay deudas pendientes.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {Object.entries(debts).map(([from, toMap]) => (
                                Object.entries(toMap).map(([to, amount]) => (
                                    <div key={`${from}-${to}`} className="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-red-300">{getName(from)}</span>
                                            <ArrowRight size={16} className="text-gray-500" />
                                            <span className="font-medium text-green-300">{getName(to)}</span>
                                        </div>
                                        <span className="font-bold text-white">{formatCurrency(amount)}</span>
                                    </div>
                                ))
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
                                            {m.name}
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
                                        onClick={() => {
                                            if (splitWith.includes(m.id)) {
                                                setSplitWith(splitWith.filter(id => id !== m.id));
                                            } else {
                                                setSplitWith([...splitWith, m.id]);
                                            }
                                        }}
                                        className={`px-3 py-1 rounded-lg text-sm transition-all ${splitWith.includes(m.id)
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        {m.name}
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
            <FloatingNav />
        </div>
    );
}
