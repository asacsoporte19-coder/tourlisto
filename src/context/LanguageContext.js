"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import es from '@/locales/es';
import en from '@/locales/en';

const LanguageContext = createContext();

const translations = {
    es,
    en
};

export function LanguageProvider({ children }) {
    const [language, setLanguageState] = useState('es');

    useEffect(() => {
        // Load language preference from localStorage
        const savedLang = localStorage.getItem('language');
        if (savedLang && translations[savedLang]) {
            setLanguageState(savedLang);
        }
    }, []);

    const setLanguage = (lang) => {
        if (translations[lang]) {
            setLanguageState(lang);
            localStorage.setItem('language', lang);
        }
    };

    const t = (key) => {
        const keys = key.split('.');
        let value = translations[language];

        for (const k of keys) {
            value = value?.[k];
        }

        return value || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
