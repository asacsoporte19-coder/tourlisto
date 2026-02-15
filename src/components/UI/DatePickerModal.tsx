"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar } from "lucide-react";
import { useState } from "react";

interface Trip {
    start_date: string;
    end_date: string;
}

interface DatePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (dateTime: string) => void;
    trip: Trip | null;
}

export default function DatePickerModal({ isOpen, onClose, onConfirm, trip }: DatePickerModalProps) {
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState("10:00"); // Default time

    if (!isOpen) return null;

    // Generate dates based on trip duration or default to next 7 days
    const getDates = () => {
        const dates = [];
        let startDate = trip?.start_date ? new Date(trip.start_date) : new Date();
        const endDate = trip?.end_date ? new Date(trip.end_date) : new Date(startDate);

        // If end date is not valid or same as start, show 5 days
        if (isNaN(endDate.getTime()) || endDate.getTime() === startDate.getTime()) {
            endDate.setDate(startDate.getDate() + 5);
        }

        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dates;
    };

    const dates = getDates();

    const handleConfirm = () => {
        if (selectedDate) {
            // Return ISO string or object with date and time?
            // Let's return just valid ISO string for start_time
            // Format: YYYY-MM-DDTHH:mm:ss
            const finalDateTime = `${selectedDate}T${selectedTime}:00`;
            onConfirm(finalDateTime);
            onClose();
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Calendar className="text-blue-400" size={24} />
                            Select Date & Time
                        </h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-400 mb-2">Time</label>
                        <input
                            type="time"
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>

                    <div className="space-y-2 max-h-[40vh] overflow-y-auto mb-6 pr-2 custom-scrollbar">
                        {dates.map((date) => {
                            const dateStr = date.toISOString().split('T')[0];
                            const isSelected = selectedDate === dateStr;

                            return (
                                <button
                                    key={dateStr}
                                    onClick={() => setSelectedDate(dateStr)}
                                    className={`w-full p-4 rounded-xl text-left transition-all border ${isSelected
                                        ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20"
                                        : "bg-white/5 border-white/5 text-gray-300 hover:bg-white/10 hover:border-white/20"
                                        }`}
                                >
                                    <div className="font-semibold text-lg">
                                        {date.toLocaleDateString(undefined, { weekday: 'long' })}
                                    </div>
                                    <div className="text-sm opacity-80">
                                        {date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={handleConfirm}
                        disabled={!selectedDate}
                        className={`w-full py-3 rounded-xl font-bold text-lg transition-all ${selectedDate
                            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]"
                            : "bg-gray-800 text-gray-500 cursor-not-allowed"
                            }`}
                    >
                        Confirm Date
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
