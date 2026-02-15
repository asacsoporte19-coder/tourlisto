"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BentoGrid from "@/components/Dashboard/BentoGrid";
import FloatingNav from "@/components/UI/FloatingNav";
import { useAuth } from "@/context/AuthContext";
import { useTrip } from "@/context/TripContext";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Plus, ArrowRight, MapPin, Calendar, LogOut, Search, Hash, Trash2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { getLocationImage } from "@/lib/unsplash";
import DateRangePicker from "@/components/UI/DateRangePicker";
import PeopleInvite from "@/components/UI/PeopleInvite";

const TRIP_IMAGES = [
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop", // Switzerland
  "https://images.unsplash.com/photo-1499856871940-a09627c6dcf6?q=80&w=2020&auto=format&fit=crop", // Paris
  "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop", // Tokyo
  "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?q=80&w=2083&auto=format&fit=crop", // Venice
  "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?q=80&w=2086&auto=format&fit=crop"  // Cinque Terre
];

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const { trips, activeTrip, setActiveTrip, loading: tripLoading, refreshTrips } = useTrip();
  const { t } = useLanguage();
  const [newTripName, setNewTripName] = useState("");
  const [newTripLocation, setNewTripLocation] = useState("");
  const [tripDates, setTripDates] = useState([null, null]);
  const [invitedPeople, setInvitedPeople] = useState([]);
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  if (authLoading || (user && tripLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cover bg-center relative"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=2021&q=80')" }}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        <div className="relative z-10 text-center text-white p-8 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl max-w-lg w-full">
          <h1 className="text-5xl font-serif font-bold mb-4 drop-shadow-lg">{t('landing.title')}</h1>
          <p className="mb-8 text-xl font-light tracking-wide text-gray-200">{t('landing.subtitle')}</p>
          <div className="flex gap-4 justify-center">
            <Link href="/login" className="bg-white text-gray-900 px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-lg">{t('landing.login')}</Link>
            <Link href="/signup" className="bg-transparent border border-white px-8 py-3 rounded-xl font-bold hover:bg-white/10 transition-colors shadow-lg backdrop-blur-sm">{t('landing.signup')}</Link>
          </div>
        </div>
        <LanguageSelector />
      </div>
    );
  }

  const createTrip = async (e) => {
    e.preventDefault();
    if (!newTripName.trim()) return;
    setCreating(true);

    const [startDate, endDate] = tripDates;

    const formatDateForDB = (date) => {
      if (!date) return null;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const { data: trip, error } = await supabase
      .from('trips')
      .insert([{
        created_by: user.id,
        name: newTripName,
        location: newTripLocation.trim() || null,
        start_date: startDate ? formatDateForDB(startDate) : new Date().toISOString().split('T')[0],
        end_date: endDate ? formatDateForDB(endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }])
      .select()
      .single();

    if (error) {
      alert("Error creating trip: " + error.message);
      setCreating(false);
      return;
    }

    // Add creator as owner
    await supabase.from('trip_members').insert({ trip_id: trip.id, user_id: user.id, role: 'owner' });

    // Add invited people as members
    if (invitedPeople.length > 0) {
      // First, find or create profiles for invited emails
      for (const email of invitedPeople) {
        // Check if user exists by email in auth or profiles
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .single();

        if (existingProfile) {
          // Add existing user as member
          await supabase.from('trip_members').insert({
            trip_id: trip.id,
            user_id: existingProfile.id,
            role: 'member'
          });
        }
        // Note: If user doesn't exist, they'll need to sign up first
        // You could implement email invitations here in the future
      }
    }

    await refreshTrips();
    setActiveTrip(trip);
    setNewTripName("");
    setNewTripLocation("");
    setTripDates([null, null]);
    setInvitedPeople([]);
    setCreating(false);
  };

  const joinTrip = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setJoining(true);

    const { data: trips, error } = await supabase.from('trips').select('id').eq('share_code', joinCode);

    if (error || !trips.length) {
      alert("Invalid code or trip not found");
    } else {
      const trip = trips[0];
      const { error: joinError } = await supabase.from('trip_members').insert({ trip_id: trip.id, user_id: user.id, role: 'viewer' });
      if (joinError) {
        if (joinError.code === '23505') alert("You are already in this trip");
        else alert("Error joining trip: " + joinError.message);
      } else {
        await refreshTrips();
        alert("Successfully joined trip!");
        setJoinCode("");
        // Optionally auto-select the joined trip if we could find it easily in the refreshed list
      }
    }
    setJoining(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const deleteTrip = async (tripId, e) => {
    e.stopPropagation(); // Prevent card click
    if (!confirm(t('dashboard.confirmDelete'))) return;

    const { error } = await supabase.from('trips').delete().eq('id', tripId);
    if (error) {
      alert("Error deleting trip: " + error.message);
    } else {
      await refreshTrips();
      if (activeTrip?.id === tripId) {
        setActiveTrip(null);
      }
    }
  };

  // DASHBOARD / TRIP SELECTION VIEW
  if (!activeTrip) {
    return (
      <div className="min-h-screen bg-cover bg-fixed relative overflow-y-auto"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519681393798-3828fb4090bb?q=80&w=2070&auto=format&fit=crop')" }}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm fixed"></div>

        <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
          <LanguageSelector />
          {/* Header */}
          <div className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-4xl md:text-5xl font-serif text-white font-bold tracking-tight">{t('dashboard.title')}</h1>
              <p className="text-gray-300 mt-2 font-light">{t('dashboard.subtitle')}, {user.user_metadata?.full_name?.split(' ')[0] || 'Traveler'}?</p>
            </div>
            <button onClick={handleLogout} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-md">
              <LogOut size={20} />
            </button>
          </div>

          {/* Trip Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <AnimatePresence>
              {trips.length > 0 ? trips.map((trip, index) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setActiveTrip(trip)}
                  className="group relative h-48 rounded-3xl overflow-hidden cursor-pointer shadow-2xl border border-white/10"
                >
                  {/* Card Background Image */}
                  <div className="absolute inset-0">
                    <img
                      src={getLocationImage(trip.location) || TRIP_IMAGES[index % TRIP_IMAGES.length]}
                      alt={trip.location || trip.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => deleteTrip(trip.id, e)}
                    className="absolute top-3 right-3 p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 z-10"
                    title={t('common.delete')}
                  >
                    <Trash2 size={16} />
                  </button>

                  {/* Card Content */}
                  <div className="absolute bottom-0 left-0 p-6 w-full">
                    <h3 className="text-2xl font-bold text-white mb-1 group-hover:translate-x-2 transition-transform duration-300">{trip.name}</h3>
                    <div className="flex items-center text-gray-300 text-sm gap-4">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{trip.start_date.split('-')[0]}</span>
                      </div>
                      {/* Optional: Add member count if available */}
                    </div>
                  </div>
                </motion.div>
              )) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full py-12 text-center text-gray-400 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md"
                >
                  <p>{t('dashboard.noTrips')}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Area */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Create Trip */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Plus className="text-blue-400" /> {t('dashboard.newAdventure')}
              </h2>
              <form onSubmit={createTrip} className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t('dashboard.createPlaceholder')}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all pl-10"
                    value={newTripName}
                    onChange={e => setNewTripName(e.target.value)}
                    required
                  />
                  <Plus className="absolute left-3 top-3.5 text-gray-400" size={18} />
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Location (e.g., Paris, Tokyo)"
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all pl-10"
                    value={newTripLocation}
                    onChange={e => setNewTripLocation(e.target.value)}
                  />
                  <MapPin className="absolute left-3 top-3.5 text-gray-400" size={18} />
                </div>

                {/* Date Range Picker */}
                <DateRangePicker
                  startDate={tripDates[0]}
                  endDate={tripDates[1]}
                  onDateChange={(start, end) => setTripDates([start, end])}
                />

                {/* People Invite */}
                <PeopleInvite
                  people={invitedPeople}
                  onPeopleChange={setInvitedPeople}
                />

                <button
                  type="submit"
                  disabled={creating || !newTripName.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl transition-colors disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                >
                  {creating ? t('dashboard.creating') : t('dashboard.create')}
                  {!creating && <ArrowRight size={18} />}
                </button>
              </form>
            </div>

            {/* Join Trip */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Hash className="text-purple-400" /> {t('dashboard.joinFriend')}
              </h2>
              <form onSubmit={joinTrip} className="relative">
                <input
                  type="text"
                  placeholder={t('dashboard.joinPlaceholder')}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all pl-10"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value)}
                />
                <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <button
                  type="submit"
                  disabled={joining || !joinCode.trim()}
                  className="absolute right-2 top-2 bg-purple-600 hover:bg-purple-500 text-white p-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  <ArrowRight size={18} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE TRIP VIEW (Keeping original layout but checking styles)
  // For consistency, let's inject a background here too but keep the content clean
  return (
    <div className="min-h-screen pb-24 pt-8 transition-colors duration-500">
      <div className="container mx-auto px-4 max-w-4xl">
        <header className="flex justify-between items-end mb-8 border-b border-gray-200 dark:border-white/10 pb-6">
          <div>
            <span className="text-xs font-bold tracking-widest text-blue-500 uppercase mb-1 block">{t('dashboard.currentTrip')}</span>
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="TourListo Logo" className="h-12 w-auto object-contain" />
              <h1 className="text-3xl md:text-4xl font-serif font-bold">
                {activeTrip.name}
              </h1>
            </div>
          </div>
          <button onClick={() => setActiveTrip(null)} className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
            {t('dashboard.switchTrip')}
          </button>
        </header>

        <BentoGrid />

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 bg-white dark:bg-zinc-900 px-6 py-3 rounded-full shadow-sm border border-gray-200 dark:border-zinc-800">
            <span className="text-sm text-gray-500 dark:text-gray-400">Share Code:</span>
            <code className="text-sm font-bold text-blue-600 dark:text-blue-400 tracking-wider">
              {activeTrip.share_code}
            </code>
          </div>
        </div>
      </div>

      <FloatingNav />
    </div>
  );
}
