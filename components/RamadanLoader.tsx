'use client';

import { Fanous } from './RamadanDecorations';

export default function RamadanLoader() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background-light">
            <div className="relative w-40 h-40 flex items-center justify-center">
                {/* Glowing Circle Background - Reducer Opacity */}
                <div className="absolute inset-0 rounded-full bg-[#FFD700]/5 animate-pulse" />

                {/* Swinging Lantern - Increased Size */}
                <div className="origin-top animate-swing">
                    <img
                        src="/images/—Pngtree—ramadan lantern_20020649.png"
                        alt="Loading..."
                        className="w-28 h-36 object-contain drop-shadow-[0_0_8px_rgba(255,215,0,0.3)]"
                    />
                </div>
            </div>

            <p className="mt-6 text-cream font-playfair text-lg font-bold tracking-widest animate-pulse">
                RAMADAN KAREEM
            </p>
            <p className="text-text-light-secondary text-xs tracking-wider mt-2">
                Loading...
            </p>
        </div>
    );
}
