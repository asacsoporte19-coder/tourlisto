"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from './AuthContext';

const TripContext = createContext({});

export const TripProvider = ({ children }) => {
    const { user } = useAuth();
    const [trips, setTrips] = useState([]);
    const [activeTrip, setActiveTrip] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setTrips([]);
            setActiveTrip(null);
            return;
        }

        const fetchTrips = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('trips')
                .select('*')
                .order('start_date', { ascending: true });

            if (error && error.message) {
                console.error('Error fetching trips:', error);
            } else if (data) {
                setTrips(data);
                if (data.length > 0 && !activeTrip) {
                    // Default to the first trip if none selected
                    setActiveTrip(data[0]);
                }
            }
            setLoading(false);
        };

        fetchTrips();
    }, [user]);

    const refreshTrips = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('trips')
            .select('*')
            .order('start_date', { ascending: true });
        if (error && error.message) {
            console.error('Error refreshing trips:', error);
        } else if (data) {
            setTrips(data);
        }
    };

    return (
        <TripContext.Provider value={{ trips, activeTrip, setActiveTrip, loading, refreshTrips }}>
            {children}
        </TripContext.Provider>
    );
};

export const useTrip = () => useContext(TripContext);
