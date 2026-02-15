"use client";

import { Check, Trash2 } from "lucide-react";
import styles from "./Checklist.module.css";

export default function ChecklistItem({ item, onToggle, onDelete }) {
    return (
        <div className={`${styles.item} ${item.checked ? styles.checked : ""}`}>
            <button
                className={styles.checkbox}
                onClick={() => onToggle(item.id)}
                aria-label={item.checked ? "Uncheck item" : "Check item"}
            >
                {item.checked && <Check size={16} strokeWidth={3} />}
            </button>
            <span className={styles.label}>{item.text}</span>
            <button
                className={styles.deleteBtn}
                onClick={() => onDelete(item.id)}
                aria-label="Delete item"
            >
                <Trash2 size={16} />
            </button>
        </div>
    );
}
