"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from './AuthContext';

export interface Trip {
    id: string;
    name: string;
    location: string | null;
    start_date: string;
    end_date: string;
    share_code: string;
    created_by: string;
}

interface TripContextType {
    trips: Trip[];
    activeTrip: Trip | null;
    setActiveTrip: (trip: Trip | null) => void;
    loading: boolean;
    refreshTrips: () => Promise<void>;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

interface TripProviderProps {
    children: ReactNode;
}

export const TripProvider = ({ children }: TripProviderProps) => {
    const { user } = useAuth();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

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
                // Ensure data matches Trip interface. 
                // Supabase returns PostgREST response, we cast or rely on loose typing here for now unless we generate types.
                setTrips(data as unknown as Trip[]);
                if (data.length > 0 && !activeTrip) {
                    // Default to the first trip if none selected
                    setActiveTrip(data[0] as unknown as Trip);
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
            setTrips(data as unknown as Trip[]);
        }
    };

    return (
        <TripContext.Provider value={{ trips, activeTrip, setActiveTrip, loading, refreshTrips }}>
            {children}
        </TripContext.Provider>
    );
};

export const useTrip = (): TripContextType => {
    const context = useContext(TripContext);
    if (context === undefined) {
        throw new Error('useTrip must be used within a TripProvider');
    }
    return context;
};
