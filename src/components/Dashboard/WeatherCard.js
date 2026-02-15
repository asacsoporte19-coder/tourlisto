"use client";

import { CloudRain, Sun, Cloud, Wind, MapPin } from "lucide-react";

export default function WeatherCard({ location }) {
    // Mock data for Feb in Lisbon
    const weather = {
        temp: 16,
        condition: "Parcialmente Nublado",
        icon: Cloud,
        forecast: [
            { day: "19", icon: Cloud, temp: 15 },
            { day: "20", icon: Sun, temp: 17 },
            { day: "21", icon: Sun, temp: 18 },
            { day: "22", icon: CloudRain, temp: 14 },
        ]
    };

    const MainIcon = weather.icon;

    return (
        <div className="h-full flex flex-col justify-between bg-gradient-to-br from-[#39a3ef] to-[#0ea5e9] text-white rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-1 text-sm font-medium opacity-80 mb-1">
                        <MapPin size={14} />
                        {location}
                    </div>
                    <div className="text-5xl font-bold leading-none">{weather.temp}°</div>
                    <div className="text-sm opacity-90 mt-1">Ahora: {weather.condition}</div>
                </div>
                <MainIcon size={32} />
            </div>

            <div className="flex justify-between gap-2 mt-4">
                {weather.forecast.map((d, i) => {
                    const Icon = d.icon;
                    // Mocking upcoming days relative to "today"
                    const today = new Date();
                    const nextDay = new Date(today);
                    nextDay.setDate(today.getDate() + i + 1);
                    const dayName = nextDay.toLocaleDateString('es-ES', { weekday: 'short' });

                    return (
                        <div key={i} className="flex flex-col items-center text-xs">
                            <span className="opacity-80 capitalize">{dayName}</span>
                            <Icon size={16} className="my-1" />
                            <span>{d.temp}°</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
