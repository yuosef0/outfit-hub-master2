'use client';

import { Fanous } from './RamadanDecorations';

export default function RamadanLoader() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background-light">
            <div className="relative w-24 h-24 flex items-center justify-center">
                {/* Glowing Circle Background */}
                <div className="absolute inset-0 rounded-full bg-[#FFD700]/10 animate-pulse" />

                {/* Swinging Lantern */}
                <div className="origin-top animate-swing">
                    <Fanous color="gold" className="w-12 h-20 drop-shadow-[0_0_15px_rgba(255,215,0,0.6)]" />
                </div>
            </div>

            <p className="mt-6 text-cream font-playfair text-lg font-bold tracking-widest animate-pulse">
                RAMADAN KAREEM
            </p>
            <p className="text-text-light-secondary text-xs tracking-wider mt-2">
                Loading functionality...
            </p>
        </div>
    );
}
