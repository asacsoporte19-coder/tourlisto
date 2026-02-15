"use client";

import { useState, useEffect, MouseEvent } from "react";
import FloatingNav from "@/components/UI/FloatingNav";
import { useTrip } from "@/context/TripContext";
import { supabase } from "@/lib/supabaseClient";
import { Music, MapPin, Trash2, GripVertical, Pencil, Plus, Utensils, Bus, Bed, List, Map as MapIcon, LucideIcon } from "lucide-react";
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    useDroppable,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import CustomPlanModal from "@/components/UI/CustomPlanModal";
import dynamic from 'next/dynamic';

const ItineraryMap = dynamic(() => import("@/components/Map/ItineraryMap"), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-white/5 animate-pulse rounded-3xl"></div>
});

// TYPES
interface ItineraryItem {
    id: string;
    trip_id: string;
    title: string;
    description?: string;
    type: string;
    start_time: string;
    created_at?: string;
    coordinates?: { lat: number; lng: number }; // Assuming potential future use
}

interface PlanData {
    id?: string;
    title: string;
    description: string;
    type: string;
    start_time: string;
}

// Helper for icons based on type
const getTypeIcon = (type: string) => {
    switch (type) {
        case 'Food': return <Utensils size={20} />;
        case 'Transport': return <Bus size={20} />;
        case 'Lodging': return <Bed size={20} />;
        case 'Evento': return <Music size={20} />;
        default: return <MapPin size={20} />;
    }
};

const getTypeColor = (type: string) => {
    switch (type) {
        case 'Food': return 'bg-orange-500/10 text-orange-400';
        case 'Transport': return 'bg-green-500/10 text-green-400';
        case 'Lodging': return 'bg-yellow-500/10 text-yellow-400';
        case 'Evento': return 'bg-purple-500/10 text-purple-400';
        default: return 'bg-blue-500/10 text-blue-400';
    }
};

// Sortable Item Component
interface SortableItemProps {
    id: string;
    item: ItineraryItem;
    onDelete: (id: string) => void;
    onEdit: (item: ItineraryItem) => void;
}

function SortableItem({ id, item, onDelete, onEdit }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        touchAction: 'none',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative group p-5 mb-4 rounded-3xl border border-gray-200 dark:border-white/10 backdrop-blur-md transition-all duration-300 
            ${isDragging ? 'z-50 scale-105 shadow-2xl bg-white/80 dark:bg-white/10' : 'bg-white/60 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 hover:border-blue-200 dark:hover:border-white/20 hover:shadow-lg hover:-translate-y-1'}`}
        >
            {/* Glass shimmers */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/40 dark:from-white/5 to-transparent pointer-events-none" />

            <div className="relative flex gap-5 items-center">
                <div {...attributes} {...listeners} className="cursor-grab text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/80 transition-colors p-2 -ml-2">
                    <GripVertical size={20} />
                </div>

                {/* Time Column */}
                <div className="flex flex-col items-center justify-center min-w-[60px]">
                    {item.start_time ? (
                        <>
                            <span className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">
                                {new Date(item.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).split(' ')[0]}
                            </span>
                            <span className="text-[10px] items-center font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">
                                {new Date(item.start_time).toLocaleTimeString([], { hour: 'numeric', hour12: true }).split(' ')[1] || ''}
                            </span>
                        </>
                    ) : (
                        <span className="text-gray-400 dark:text-gray-600 text-xs">--:--</span>
                    )}
                </div>

                {/* Icon Box */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${getTypeColor(item.type)} ring-1 ring-black/5 dark:ring-white/10`}>
                    {getTypeIcon(item.type)}
                </div>

                {/* Content */}
                <div className="flex-grow min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate pr-4">{item.title}</h3>
                    {item.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-0.5 font-light">{item.description}</p>
                    )}
                </div>
            </div>

            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-4">
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                    className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400 hover:text-blue-500 dark:hover:text-white transition-colors"
                >
                    <Pencil size={16} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-400/70 hover:text-red-500 transition-colors"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
}

interface DaySectionProps {
    dateKey: string;
    items: ItineraryItem[];
    onDelete: (id: string) => void;
    onEdit: (item: ItineraryItem) => void;
    onAdd: (date: string) => void;
}

function DaySection({ dateKey, items = [], onDelete, onEdit, onAdd }: DaySectionProps) {
    const { setNodeRef } = useDroppable({
        id: dateKey,
    });

    return (
        <div className="pl-8 relative">
            <div className="absolute left-[7px] top-10 bottom-[-1.5rem] w-0.5 bg-gray-200 dark:bg-white/10"></div>

            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-4 h-4 rounded-full bg-blue-500 absolute left-0 ring-4 ring-gray-100 dark:ring-black/20"></div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {new Date(dateKey).toLocaleDateString("es-ES", {
                                day: "numeric",
                                month: "short",
                                weekday: "long",
                            })}
                        </h3>
                    </div>
                </div>
                <button
                    onClick={() => onAdd(dateKey)}
                    className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    title="Añadir plan"
                >
                    <Plus size={20} />
                </button>
            </div>

            <SortableContext
                id={dateKey}
                items={items.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
            >
                <div
                    ref={setNodeRef}
                    className="flex flex-col gap-3 min-h-[100px] p-2 rounded-xl transition-colors bg-white/5 border border-white/5 pb-8"
                >
                    {items.length === 0 && (
                        <button
                            onClick={() => onAdd(dateKey)}
                            className="text-gray-500 text-sm text-center py-6 italic border border-dashed border-white/10 rounded-lg bg-black/20 hover:bg-white/5 hover:text-gray-300 w-full transition-colors"
                        >
                            + Añadir primer plan del día
                        </button>
                    )}
                    {items.map((item) => (
                        <SortableItem
                            key={item.id}
                            id={item.id}
                            item={item}
                            onDelete={onDelete}
                            onEdit={onEdit}
                        />
                    ))}
                </div>
            </SortableContext>
        </div>
    );
}

export default function ItineraryPage() {
    const { activeTrip } = useTrip() as any;
    // itinerary = { "2024-05-20": [item1, item2], "2024-05-21": [] }
    const [itinerary, setItinerary] = useState<Record<string, ItineraryItem[]>>({});
    const [activeId, setActiveId] = useState<string | null>(null); // ID of item currently being dragged
    const [loading, setLoading] = useState<boolean>(true);

    // Custom Plan Modal State
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);
    const [selectedDateForAdd, setSelectedDateForAdd] = useState<string | null>(null);

    // View State
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list'); // 'list' | 'map'
    const [activeDayKey, setActiveDayKey] = useState<string | null>(null); // For map view filtering

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), // Require movement of 8px to start drag
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        if (!activeTrip) return;

        const fetchData = async () => {
            setLoading(true);
            const start = new Date(activeTrip.start_date);
            const end = new Date(activeTrip.end_date);
            const days: Record<string, ItineraryItem[]> = {};

            // Initialize days
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dateKey = d.toISOString().split('T')[0];
                days[dateKey] = [];
            }

            // Set default active day to first day if not set
            if (!activeDayKey) {
                setActiveDayKey(start.toISOString().split('T')[0]);
            }

            const { data, error } = await supabase
                .from('itinerary_items')
                .select('*')
                .eq('trip_id', activeTrip.id)
                .order('start_time', { ascending: true });

            if (data) {
                // First pass: group by date
                data.forEach((item: any) => {
                    const dateKey = item.start_time ? item.start_time.split('T')[0] : null;
                    if (dateKey && days.hasOwnProperty(dateKey)) {
                        days[dateKey].push(item as ItineraryItem);
                    }
                });
            }

            setItinerary(days);
            setLoading(false);
        };

        fetchData();
    }, [activeTrip]);

    // Modal Handlers
    const handleAddPlan = (dateKey: string) => {
        setEditingItem(null);
        setSelectedDateForAdd(dateKey);
        setIsModalOpen(true);
    };

    const handleEditPlan = (item: ItineraryItem) => {
        setEditingItem(item);
        setSelectedDateForAdd(null);
        setIsModalOpen(true);
    };

    const handleSavePlan = async (planData: PlanData) => {
        // If updating
        if (planData.id) {
            const { error } = await supabase
                .from('itinerary_items')
                .update({
                    title: planData.title,
                    description: planData.description,
                    type: planData.type,
                    start_time: planData.start_time
                })
                .eq('id', planData.id);

            if (!error) {
                setItinerary(prev => {
                    const newState: Record<string, ItineraryItem[]> = { ...prev };

                    // 1. Remove from old location
                    let oldItem: ItineraryItem | null = null;
                    Object.keys(newState).forEach(date => {
                        const idx = newState[date].findIndex(i => i.id === planData.id);
                        if (idx !== -1) {
                            oldItem = newState[date][idx];
                            newState[date] = newState[date].filter(i => i.id !== planData.id);
                        }
                    });

                    // 2. Add to new location (date)
                    const newDateKey = planData.start_time.split('T')[0];
                    if (newState[newDateKey] && oldItem) {
                        const safeOldItem: any = oldItem || {};
                        const safePlanData: any = planData || {};
                        const newItem = { ...safeOldItem, ...safePlanData };

                        // Ensure start_time is valid string
                        if (!newItem.start_time) newItem.start_time = new Date().toISOString();

                        const currentItems = newState[newDateKey] || [];
                        const updatedItems = [...currentItems, newItem];

                        newState[newDateKey] = updatedItems.sort((a: any, b: any) => {
                            const timeA = new Date(a.start_time).getTime();
                            const timeB = new Date(b.start_time).getTime();
                            return timeA - timeB;
                        });
                    }

                    return newState;
                });
            }
        } else {
            // New Plan
            const { data, error } = await supabase
                .from('itinerary_items')
                .insert([{
                    trip_id: activeTrip.id,
                    title: planData.title,
                    description: planData.description,
                    type: planData.type,
                    start_time: planData.start_time
                }])
                .select();

            if (!error && data) {
                const newItem = data[0] as ItineraryItem;
                const dateKey = newItem.start_time.split('T')[0];

                setItinerary(prev => ({
                    ...prev,
                    [dateKey]: [...(prev[dateKey] || []), newItem].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                }));
            }
        }
    };

    // --- Drag Handlers (Keep existing logic) ---

    const findContainer = (id: string): string | undefined => {
        if (id in itinerary) return id;
        return Object.keys(itinerary).find((key) =>
            itinerary[key].find((item) => item.id === id)
        );
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        const overId = over?.id as string;

        if (!overId || active.id === overId) return;

        const activeContainer = findContainer(active.id as string);
        const overContainer = (overId in itinerary)
            ? overId
            : findContainer(overId);

        if (!activeContainer || !overContainer || activeContainer === overContainer) {
            return;
        }

        // Move item to new container in state (optimistic UI update during drag)
        setItinerary((prev) => {
            const activeItems = prev[activeContainer];
            const overItems = prev[overContainer];
            const activeIndex = activeItems.findIndex((i) => i.id === active.id);
            const overIndex = (overId in itinerary)
                ? overItems.length + 1
                : overItems.findIndex((i) => i.id === overId);

            let newIndex;
            if (overId in itinerary) {
                newIndex = overItems.length + 1;
            } else {
                const isBelowOverItem =
                    over &&
                    active.rect.current.translated &&
                    active.rect.current.translated.top >
                    over.rect.top + over.rect.height;

                const modifier = isBelowOverItem ? 1 : 0;
                newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
            }

            return {
                ...prev,
                [activeContainer]: [
                    ...prev[activeContainer].filter((item) => item.id !== active.id),
                ],
                [overContainer]: [
                    ...prev[overContainer].slice(0, newIndex),
                    activeItems[activeIndex],
                    ...prev[overContainer].slice(newIndex, prev[overContainer].length),
                ],
            };
        });
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) {
            setActiveId(null);
            return;
        }

        const activeContainer = findContainer(active.id as string); // Based on current state (could be different from start container due to DragOver)

        // If dropped outside or invalid
        if (!activeContainer) {
            setActiveId(null);
            return;
        }

        const overContainer = (over.id in itinerary)
            ? over.id as string
            : findContainer(over.id as string);

        if (activeContainer && overContainer) {
            const activeIndex = itinerary[activeContainer].findIndex((i) => i.id === active.id);
            const overIndex = (over.id in itinerary)
                ? itinerary[overContainer].length // Append if dropped on empty container or container itself
                : itinerary[overContainer].findIndex((i) => i.id === over.id);

            // Reorder/move logic
            let newItinerary = { ...itinerary };

            if (activeContainer === overContainer) {
                // Reordering within same container
                if (activeIndex !== overIndex) {
                    newItinerary[activeContainer] = arrayMove(itinerary[activeContainer], activeIndex, overIndex);
                }
            } else {
                // Moved between containers (already partially handled by DragOver, but final position confirmation)
                // Actually, DragOver handles the state update. So here we essentially confirm and persist.
                // BUT: arrayMove logic is usually for same-container sort.
                // If different containers, DragOver already put it there. We just need to persist the new order of target container.
            }

            // Recalculate Time for the TARGET container with "Smart Ripple"
            // Goal: Only change necessary times, respecting gaps.
            const targetDay = overContainer;
            let updatedItems = [...newItinerary[targetDay]];

            // 1. Identify the items that need a check (starting from the moved item's new position)
            const movedItemIndex = updatedItems.findIndex(i => i.id === active.id);
            if (movedItemIndex === -1) {
                setActiveId(null);
                return; // Should not happen
            }

            // 2. Set the moved item's time
            const prevItem = updatedItems[movedItemIndex - 1];
            let newStartTime;

            if (prevItem) {
                // Default: 1 hour after previous item
                const prevDate = new Date(prevItem.start_time);
                newStartTime = new Date(prevDate.getTime() + 60 * 60 * 1000); // +1 hour
            } else {
                // Default Start of Day if first
                newStartTime = new Date(`${targetDay}T09:00:00`);
            }

            updatedItems[movedItemIndex] = {
                ...updatedItems[movedItemIndex],
                start_time: newStartTime.toISOString()
            };

            // 3. Ripple Effect: Correct subsequent items ONLY if they overlap
            const updatesToPersist = [updatedItems[movedItemIndex]]; // Track what changed

            for (let i = movedItemIndex; i < updatedItems.length - 1; i++) {
                const currentItem = updatedItems[i];
                // @ts-ignore
                const nextItem = updatedItems[i + 1];

                const currentEndGuess = new Date(new Date(currentItem.start_time).getTime() + 30 * 60 * 1000); // Assume min 30m duration
                const nextStart = new Date(nextItem.start_time);

                // If next item starts BEFORE current item (or too close), push it forward
                if (nextStart.getTime() <= new Date(currentItem.start_time).getTime() || nextStart.getTime() < currentEndGuess.getTime()) {
                    // Set next item to start 30 mins after current item starts (or 1h? let's do 30m to minimize displacement)
                    // User said: "at least at that hour or with a 30 min lapse"
                    const adjustedTime = new Date(new Date(currentItem.start_time).getTime() + 30 * 60 * 1000);
                    updatedItems[i + 1] = {
                        ...nextItem,
                        start_time: adjustedTime.toISOString()
                    };
                    updatesToPersist.push(updatedItems[i + 1]);
                } else {
                    // Gap exists! We can stop rippling. The rest of the list is safe.
                    // This satisfies "not affecting the whole list".
                    break;
                }
            }

            // Update local state
            newItinerary[targetDay] = updatedItems;
            setItinerary(newItinerary);

            // Persist ONLY changed items to Supabase
            for (const item of updatesToPersist) {
                await supabase
                    .from('itinerary_items')
                    .update({ start_time: item.start_time })
                    .eq('id', item.id);
            }
        }

        setActiveId(null);
    };

    const deleteItem = async (itemId: string) => {
        if (!confirm("¿Seguro que quieres borrar este plan?")) return;

        const { error } = await supabase.from('itinerary_items').delete().eq('id', itemId);
        if (!error) {
            setItinerary(prev => {
                const next = { ...prev };
                Object.keys(next).forEach(key => {
                    next[key] = next[key].filter(i => i.id !== itemId);
                });
                return next;
            });
        }
    };

    // Helper to get items for map
    const getMapItems = () => {
        if (!activeDayKey || activeDayKey === 'all') {
            // Flatten all items
            return Object.values(itinerary).flat();
        }
        return itinerary[activeDayKey] || [];
    };

    if (!activeTrip) return <div className="container py-8">Selecciona un viaje.</div>;
    if (loading) return <div className="container py-8">Cargando itinerario...</div>;

    return (
        <div style={{ paddingBottom: "80px", minHeight: "100vh" }}>
            <div className="container h-full flex flex-col">
                <header className="py-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-1">Plan de Viaje</h1>
                        <p className="text-gray-400">{activeTrip?.start_date} - {activeTrip?.end_date}</p>
                    </div>

                    {/* View Toggle */}
                    <div className="bg-white/10 p-1 rounded-xl flex gap-1 self-start md:self-auto">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${viewMode === 'list'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <List size={18} />
                            <span className="font-medium">Lista</span>
                        </button>
                        <button
                            onClick={() => setViewMode('map')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${viewMode === 'map'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <MapIcon size={18} />
                            <span className="font-medium">Mapa</span>
                        </button>
                    </div>
                </header>

                {viewMode === 'list' ? (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCorners}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="flex flex-col gap-6 pb-20">
                            {Object.keys(itinerary).sort().map((dateKey) => (
                                <DaySection
                                    key={dateKey}
                                    dateKey={dateKey}
                                    items={itinerary[dateKey]}
                                    onDelete={deleteItem}
                                    onEdit={handleEditPlan}
                                    onAdd={handleAddPlan}
                                />
                            ))}
                        </div>

                        <DragOverlay>
                            {activeId ? (
                                <div className="opacity-80 rotate-2 cursor-grabbing">
                                    <div className="card bg-[#1a1a1a] border border-blue-500/50 rounded-xl p-4 shadow-2xl flex gap-4 items-center w-[300px]">
                                        <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                                            <MapPin size={20} />
                                        </div>
                                        <div className="font-bold text-white">Moviendo...</div>
                                    </div>
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                ) : (
                    <div className="flex flex-col gap-4 h-[calc(100vh-250px)]">
                        {/* Map Day Selector */}
                        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                            {Object.keys(itinerary).sort().map((dateKey) => (
                                <button
                                    key={dateKey}
                                    onClick={() => setActiveDayKey(dateKey)}
                                    className={`whitespace-nowrap px-4 py-2 rounded-full border transition-all ${activeDayKey === dateKey
                                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    {new Date(dateKey).toLocaleDateString("es-ES", { weekday: 'short', day: 'numeric' })}
                                </button>
                            ))}
                        </div>

                        {/* Map Component */}
                        <div className="flex-grow w-full relative">
                            <ItineraryMap items={getMapItems()} />

                            {/* Legend / Info Overlay */}
                            <div className="absolute top-4 right-4 z-10 bg-black/80 backdrop-blur-md p-4 rounded-xl border border-white/10 max-w-xs">
                                <h3 className="text-white font-bold mb-2 text-sm flex items-center gap-2">
                                    <MapPin size={16} className="text-blue-400" />
                                    Ruta del Día
                                </h3>
                                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                    {getMapItems().map((item, i) => (
                                        <div key={item.id} className="flex items-start gap-2 text-xs text-gray-400">
                                            <span className="font-mono text-blue-400 font-bold">{i + 1}.</span>
                                            <span className="truncate">{item.title}</span>
                                            <span className="ml-auto opacity-50">{new Date(item.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    ))}
                                    {getMapItems().length === 0 && (
                                        <p className="text-gray-500 italic text-xs">No hay planes con ubicación.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <CustomPlanModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSavePlan}
                    editingItem={editingItem}
                    initialDate={selectedDateForAdd}
                />
            </div>
            <FloatingNav />
        </div>
    );
}
