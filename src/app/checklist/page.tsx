"use client";

import { useState, useEffect } from "react";
import { useTrip } from "@/context/TripContext";
import { supabase } from "@/lib/supabaseClient";
import { Plus, Trash2, Check, Edit2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import FloatingNav from "@/components/UI/FloatingNav";

interface ChecklistCategory {
    id: string;
    trip_id: string;
    name: string;
    position: number;
    color?: string; // Optional as not always returned or used
}

interface ChecklistItem {
    id: string;
    trip_id: string;
    category_id: string | null;
    text: string;
    completed: boolean;
}

export default function ChecklistPage() {
    const { activeTrip } = useTrip();
    const router = useRouter();
    const [categories, setCategories] = useState<ChecklistCategory[]>([]);
    const [items, setItems] = useState<ChecklistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [showNewCategory, setShowNewCategory] = useState(false);
    const [editingCategory, setEditingCategory] = useState<string | null>(null);

    useEffect(() => {
        if (!activeTrip) return;
        fetchData();
    }, [activeTrip]);

    const fetchData = async () => {
        setLoading(true);

        // Fetch categories
        const { data: categoriesData, error: catError } = await supabase
            .from('checklist_categories')
            .select('*')
            .eq('trip_id', activeTrip!.id)
            .order('position');

        // Fetch items
        const { data: itemsData, error: itemsError } = await supabase
            .from('checklist_items')
            .select('*')
            .eq('trip_id', activeTrip!.id);

        if (catError) console.error(catError);
        else setCategories(categoriesData || []);

        if (itemsError) console.error(itemsError);
        else setItems(itemsData || []);

        setLoading(false);
    };

    // Category management
    const addCategory = async () => {
        if (!newCategoryName.trim()) return;

        const { data, error } = await supabase
            .from('checklist_categories')
            .insert([{
                trip_id: activeTrip!.id,
                name: newCategoryName,
                position: categories.length
            }])
            .select()
            .single();

        if (error) {
            console.error(error);
        } else {
            setCategories([...categories, data]);
            setNewCategoryName("");
            setShowNewCategory(false);
        }
    };

    const updateCategory = async (id: string, name: string) => {
        const { error } = await supabase
            .from('checklist_categories')
            .update({ name })
            .eq('id', id);

        if (error) {
            console.error(error);
        } else {
            setCategories(categories.map(cat => cat.id === id ? { ...cat, name } : cat));
            setEditingCategory(null);
        }
    };

    const deleteCategory = async (id: string) => {
        if (!confirm("Delete this category? Items will remain uncategorized.")) return;

        const { error } = await supabase
            .from('checklist_categories')
            .delete()
            .eq('id', id);

        if (error) {
            console.error(error);
        } else {
            setCategories(categories.filter(cat => cat.id !== id));
        }
    };

    // Item management
    const addItem = async (categoryId: string | null, text: string) => {
        if (!text.trim()) return;

        const { data, error } = await supabase
            .from('checklist_items')
            .insert([{
                trip_id: activeTrip!.id,
                category_id: categoryId,
                text,
                completed: false
            }])
            .select()
            .single();

        if (error) {
            console.error(error);
        } else {
            setItems([...items, data]);
        }
    };

    const toggleItem = async (id: string, currentStatus: boolean) => {
        setItems(items.map(item => item.id === id ? { ...item, completed: !currentStatus } : item));

        const { error } = await supabase
            .from('checklist_items')
            .update({ completed: !currentStatus })
            .eq('id', id);

        if (error) {
            console.error(error);
            setItems(items.map(item => item.id === id ? { ...item, completed: currentStatus } : item));
        }
    };

    const deleteItem = async (id: string) => {
        setItems(items.filter(item => item.id !== id));
        const { error } = await supabase.from('checklist_items').delete().eq('id', id);
        if (error) console.error(error);
    };

    if (!activeTrip) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-xl text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">No selected trip</h2>
                    <p className="text-gray-400">Please select a trip to view the checklist.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-24 px-4 py-8">
            <FloatingNav />
            {/* Header */}
            <div className="max-w-4xl mx-auto mb-8 pt-8">
                <div className="flex items-center gap-4 mb-4">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Checklist</h1>
                    </div>
                </div>
                <p className="text-gray-400 mb-6">Organiza tus tareas para <span className="text-white font-medium">{activeTrip.name}</span></p>

                {/* Progress Bar */}
                <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                    <div className="flex justify-between text-sm text-gray-400 mb-2 font-medium">
                        <span>Progreso</span>
                        <span className="text-white">{items.length === 0 ? 0 : Math.round((items.filter(i => i.completed).length / items.length) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-700/50 h-3 rounded-full overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${items.length === 0 ? 0 : (items.filter(i => i.completed).length / items.length) * 100}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-right">
                        {items.filter(i => i.completed).length} de {items.length} tareas completadas
                    </p>
                </div>
            </div>

            {/* Categories */}
            <div className="max-w-4xl mx-auto space-y-6">
                <AnimatePresence>
                    {categories.map((category) => (
                        <CategorySection
                            key={category.id}
                            category={category}
                            items={items.filter(item => item.category_id === category.id)}
                            onAddItem={(text) => addItem(category.id, text)}
                            onToggleItem={toggleItem}
                            onDeleteItem={deleteItem}
                            onUpdateCategory={(name) => updateCategory(category.id, name)}
                            onDeleteCategory={() => deleteCategory(category.id)}
                            editingCategory={editingCategory}
                            setEditingCategory={setEditingCategory}
                        />
                    ))}
                </AnimatePresence>

                {/* Uncategorized items */}
                {items.filter(item => !item.category_id).length > 0 && (
                    <CategorySection
                        category={{ id: "uncategorized", trip_id: activeTrip.id, name: "Uncategorized", position: -1, color: "#6b7280" }}
                        items={items.filter(item => !item.category_id)}
                        onAddItem={(text) => addItem(null, text)}
                        onToggleItem={toggleItem}
                        onDeleteItem={deleteItem}
                        isUncategorized
                        // Dummy props for required fields that won't be used for uncategorized
                        onUpdateCategory={() => { }}
                        onDeleteCategory={() => { }}
                        editingCategory={null}
                        setEditingCategory={() => { }}
                    />
                )}

                {/* Add Category Button */}
                {showNewCategory ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-black/40 backdrop-blur-xl border border-white/20 rounded-2xl p-6"
                    >
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Category name..."
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                            />
                            <button
                                onClick={addCategory}
                                className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-xl transition-colors"
                            >
                                <Check size={20} />
                            </button>
                            <button
                                onClick={() => {
                                    setShowNewCategory(false);
                                    setNewCategoryName("");
                                }}
                                className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-xl transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <button
                        onClick={() => setShowNewCategory(true)}
                        className="w-full bg-black/20 hover:bg-black/30 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-white font-medium flex items-center justify-center gap-2 transition-all"
                    >
                        <Plus size={20} />
                        Add Category
                    </button>
                )}
            </div>
        </div>
    );
}

interface CategorySectionProps {
    category: ChecklistCategory;
    items: ChecklistItem[];
    onAddItem: (text: string) => void;
    onToggleItem: (id: string, currentStatus: boolean) => void;
    onDeleteItem: (id: string) => void;
    onUpdateCategory: (name: string) => void;
    onDeleteCategory: () => void;
    editingCategory: string | null;
    setEditingCategory: (id: string | null) => void;
    isUncategorized?: boolean;
}

// Category Section Component
function CategorySection({
    category,
    items,
    onAddItem,
    onToggleItem,
    onDeleteItem,
    onUpdateCategory,
    onDeleteCategory,
    editingCategory,
    setEditingCategory,
    isUncategorized
}: CategorySectionProps) {
    const [newItemText, setNewItemText] = useState("");
    const [showAddItem, setShowAddItem] = useState(false);
    const [editName, setEditName] = useState(category.name);

    const handleAddItem = () => {
        onAddItem(newItemText);
        setNewItemText("");
        setShowAddItem(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl"
        >
            {/* Category Header */}
            <div className="flex items-center justify-between mb-4">
                {editingCategory === category.id ? (
                    <div className="flex gap-2 flex-1">
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && onUpdateCategory(editName)}
                            className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                        />
                        <button
                            onClick={() => onUpdateCategory(editName)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded-lg transition-colors"
                        >
                            <Check size={16} />
                        </button>
                        <button
                            onClick={() => {
                                setEditingCategory(null);
                                setEditName(category.name);
                            }}
                            className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ) : (
                    <>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <span
                                style={{ backgroundColor: category.color }}
                                className="w-3 h-3 rounded-full"
                            />
                            {category.name}
                        </h2>
                        {!isUncategorized && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setEditingCategory(category.id)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={onDeleteCategory}
                                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Items */}
            <div className="space-y-2 mb-4">
                <AnimatePresence>
                    {items.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex items-center gap-3 bg-black/20 p-3 rounded-xl hover:bg-black/30 transition-colors group"
                        >
                            <button
                                onClick={() => onToggleItem(item.id, item.completed)}
                                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${item.completed
                                    ? 'bg-green-500 border-green-500'
                                    : 'border-white/30 hover:border-white/50'
                                    }`}
                            >
                                {item.completed && <Check size={16} className="text-white" />}
                            </button>
                            <span className={`flex-1 ${item.completed ? 'line-through text-gray-400' : ''}`}>
                                {item.text}
                            </span>
                            <button
                                onClick={() => onDeleteItem(item.id)}
                                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 rounded-lg transition-all text-red-400"
                            >
                                <Trash2 size={16} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Add Item */}
            {showAddItem ? (
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="New item..."
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                        className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                    />
                    <button
                        onClick={handleAddItem}
                        className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-xl transition-colors"
                    >
                        <Check size={20} />
                    </button>
                    <button
                        onClick={() => {
                            setShowAddItem(false);
                            setNewItemText("");
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-xl transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setShowAddItem(true)}
                    className="w-full bg-black/20 hover:bg-black/30 border border-white/10 rounded-xl p-3 text-white/70 hover:text-white font-medium flex items-center justify-center gap-2 transition-all"
                >
                    <Plus size={18} />
                    Add Item
                </button>
            )}
        </motion.div>
    );
}
