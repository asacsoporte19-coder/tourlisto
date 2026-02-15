"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import ChecklistItem from "./ChecklistItem";
import styles from "./Checklist.module.css";

interface ChecklistItemType {
    id: string;
    text: string;
    checked: boolean;
}

interface ChecklistGroupProps {
    title: string;
    items: ChecklistItemType[];
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onAdd: (text: string) => void;
}

export default function ChecklistGroup({ title, items, onToggle, onDelete, onAdd }: ChecklistGroupProps) {
    const [newItemText, setNewItemText] = useState<string>("");

    const handleAdd = () => {
        if (newItemText.trim()) {
            onAdd(newItemText);
            setNewItemText("");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleAdd();
        }
    };

    return (
        <div className={styles.group}>
            <div className={styles.header}>
                <h2 className={styles.title}>{title}</h2>
                <span>{items.filter(i => i.checked).length}/{items.length}</span>
            </div>

            <div className={styles.list}>
                {items.map(item => (
                    <ChecklistItem
                        key={item.id}
                        item={item}
                        onToggle={onToggle}
                        onDelete={onDelete}
                    />
                ))}
            </div>

            <div className={styles.addInputContainer}>
                <input
                    type="text"
                    className={styles.input}
                    placeholder="New Item..."
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <button className={styles.addButton} onClick={handleAdd}>
                    <Plus size={20} />
                </button>
            </div>
        </div>
    );
}
