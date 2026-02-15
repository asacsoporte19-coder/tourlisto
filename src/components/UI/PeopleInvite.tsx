"use client";

import { useState, KeyboardEvent } from "react";
import { UserPlus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PeopleInviteProps {
    people: string[];
    onPeopleChange: (people: string[]) => void;
}

export default function PeopleInvite({ people, onPeopleChange }: PeopleInviteProps) {
    const [email, setEmail] = useState("");

    const addPerson = () => {
        if (!email.trim()) return;

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert("Please enter a valid email address");
            return;
        }

        if (people.includes(email)) {
            alert("This person is already added");
            return;
        }

        onPeopleChange([...people, email]);
        setEmail("");
    };

    const removePerson = (emailToRemove: string) => {
        onPeopleChange(people.filter(e => e !== emailToRemove));
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addPerson();
        }
    };

    return (
        <div className="space-y-3">
            {/* Email Input */}
            <div className="relative flex gap-2">
                <input
                    type="email"
                    placeholder="Email address (optional)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <UserPlus className="absolute left-3 top-3.5 text-gray-400 pointer-events-none" size={18} />
                <button
                    type="button"
                    onClick={addPerson}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors text-white font-medium"
                >
                    Add
                </button>
            </div>

            {/* Added People Chips */}
            {people.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    <AnimatePresence>
                        {people.map((personEmail) => (
                            <motion.div
                                key={personEmail}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded-full px-3 py-1.5 text-sm"
                            >
                                <span className="text-white">{personEmail}</span>
                                <button
                                    type="button"
                                    onClick={() => removePerson(personEmail)}
                                    className="hover:bg-red-500/30 rounded-full p-0.5 transition-colors"
                                >
                                    <X size={14} className="text-white" />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {people.length > 0 && (
                <p className="text-xs text-gray-400">
                    {people.length} {people.length === 1 ? 'person' : 'people'} will be invited to this trip
                </p>
            )}
        </div>
    );
}
