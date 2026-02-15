'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function IftarCountdown() {
    const { t, language } = useLanguage();
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [isIftarTime, setIsIftarTime] = useState(false);

    useEffect(() => {
        // Mock Maghrib time (e.g., 6:15 PM)
        // In a real app, fetch from an API based on location
        const calculateTimeLeft = () => {
            const now = new Date();
            const iftar = new Date();
            iftar.setHours(18, 15, 0, 0); // 6:15 PM

            if (now > iftar) {
                setIsIftarTime(true);
                return;
            }

            const diff = iftar.getTime() - now.getTime();
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft(
                `${hours.toString().padStart(2, '0')}:${minutes
                    .toString()
                    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );
        };

        calculateTimeLeft();
        const interval = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(interval);
    }, []);

    if (isIftarTime) return null;

    return (
        <div className="hidden md:flex flex-col items-center justify-center mx-4 bg-black/20 px-3 py-1 rounded-lg border border-[#FFD700]/30">
            <span className="text-[10px] text-[#FFD700] font-bold uppercase tracking-wider">
                {language === 'ar' ? 'متبقي على الإفطار' : 'Iftar In'}
            </span>
            <span className="text-sm font-mono font-bold text-white tracking-widest">
                {timeLeft}
            </span>
        </div>
    );
}
