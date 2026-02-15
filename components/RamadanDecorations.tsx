'use client';

import React, { useState } from 'react';

/* ===== Traditional Egyptian Fanous (فانوس رمضان) ===== */
export function Fanous({ color = 'red', className }: { color?: 'red' | 'gold' | 'green' | 'purple'; className?: string }) {
    const colors = {
        red: { body: '#E63946', bodyLight: '#FF6B6B', glow: 'rgba(230, 57, 70, 0.6)', cap: '#FFD700', accent: '#FF9F1C' },
        gold: { body: '#FFB703', bodyLight: '#FFD166', glow: 'rgba(255, 183, 3, 0.6)', cap: '#E63946', accent: '#FF6B6B' },
        green: { body: '#2D9B5A', bodyLight: '#52D689', glow: 'rgba(45, 155, 90, 0.5)', cap: '#FFD700', accent: '#FFB703' },
        purple: { body: '#7B2D8E', bodyLight: '#A855F7', glow: 'rgba(123, 45, 142, 0.5)', cap: '#FFD700', accent: '#FF6B6B' },
    };
    const c = colors[color];

    return (
        <svg viewBox="0 0 60 110" fill="none" className={className}>
            <defs>
                <radialGradient id={`glow-${color}`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={c.glow} />
                    <stop offset="100%" stopColor="transparent" />
                </radialGradient>
                <linearGradient id={`body-${color}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={c.bodyLight} />
                    <stop offset="100%" stopColor={c.body} />
                </linearGradient>
            </defs>

            {/* Chain */}
            <line x1="30" y1="0" x2="30" y2="14" stroke={c.cap} strokeWidth="2" />
            <circle cx="30" cy="4" r="2" fill={c.cap} />

            {/* Top ornament - dome */}
            <path d="M24 14 Q30 8, 36 14 Z" fill={c.cap} />
            {/* Top cap */}
            <rect x="21" y="14" width="18" height="5" rx="2" fill={c.cap} />

            {/* Main body - traditional fanous shape */}
            <path
                d="M21 19 L17 30 Q14 50, 17 65 L21 75 Q30 80, 39 75 L43 65 Q46 50, 43 30 L39 19 Z"
                fill={`url(#body-${color})`}
                stroke={c.cap}
                strokeWidth="1.5"
            />

            {/* Inner glow */}
            <ellipse cx="30" cy="48" rx="10" ry="20" fill={`url(#glow-${color})`} />

            {/* Decorative panels */}
            <path d="M22 25 L30 22 L38 25" stroke={c.cap} strokeWidth="1" opacity="0.8" />
            <path d="M19 35 L30 32 L41 35" stroke={c.cap} strokeWidth="1" opacity="0.8" />
            <line x1="30" y1="19" x2="30" y2="75" stroke={c.cap} strokeWidth="0.8" opacity="0.5" />
            <line x1="18" y1="48" x2="42" y2="48" stroke={c.cap} strokeWidth="0.8" opacity="0.5" />

            {/* Arabesque diamond shapes */}
            <path d="M30 28 L34 38 L30 48 L26 38 Z" fill={c.accent} opacity="0.3" stroke={c.cap} strokeWidth="0.5" />
            <path d="M30 50 L33 58 L30 66 L27 58 Z" fill={c.accent} opacity="0.3" stroke={c.cap} strokeWidth="0.5" />

            {/* Small window circles */}
            <circle cx="23" cy="38" r="2.5" fill={c.accent} opacity="0.4" stroke={c.cap} strokeWidth="0.5" />
            <circle cx="37" cy="38" r="2.5" fill={c.accent} opacity="0.4" stroke={c.cap} strokeWidth="0.5" />
            <circle cx="23" cy="58" r="2.5" fill={c.accent} opacity="0.4" stroke={c.cap} strokeWidth="0.5" />
            <circle cx="37" cy="58" r="2.5" fill={c.accent} opacity="0.4" stroke={c.cap} strokeWidth="0.5" />

            {/* Bottom cap */}
            <rect x="23" y="75" width="14" height="4" rx="1.5" fill={c.cap} />
            {/* Bottom tip ornament */}
            <path d="M27 79 L30 88 L33 79" fill={c.cap} />
            <circle cx="30" cy="89" r="2" fill={c.accent} />

            {/* Light flame inside */}
            <ellipse cx="30" cy="46" rx="3" ry="5" fill="rgba(255, 255, 200, 0.6)">
                <animate attributeName="ry" values="4;6;4" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" repeatCount="indefinite" />
            </ellipse>
        </svg>
    );
}

/* ===== شخصية فانوس - Cute Fanous Character with face, hands & legs ===== */
/* ===== شخصية فانوس - Cute Fanous Character with face, hands & legs ===== */
export function FanousCharacter({ className }: { className?: string }) {
    return (
        <div
            className={`relative ${className} flex items-center justify-center`}
        >
            {/* The Cartoon Character Image */}
            <img
                src="/images/—Pngtree—cheerful cartoon boy in traditional_20427650.png"
                alt="Ramadan Cartoon Boy"
                className="w-full h-full object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.3)] z-10"
            />
        </div>
    );
}

/* ===== زينة رمضان - Colorful Bunting/String ===== */
export function StringLights({ top = '48px', className }: { top?: string; className?: string }) {
    const flagColors = ['#E63946', '#FFB703', '#2D9B5A', '#7B2D8E', '#FF6B6B', '#FFD166', '#52D689', '#E63946', '#FFB703', '#2D9B5A', '#7B2D8E'];

    return (
        <svg
            className={`absolute left-0 w-full ${className || ''}`}
            style={{ height: '50px', top }}
            viewBox="0 0 420 50"
            preserveAspectRatio="none"
            fill="none"
        >
            {/* String/rope */}
            <path
                d="M-5 6 Q35 22, 70 14 Q105 6, 140 18 Q175 30, 210 16 Q245 2, 280 18 Q315 34, 350 14 Q385 -2, 425 10"
                stroke="#FFD700"
                strokeWidth="1.5"
                fill="none"
            />
            {/* Triangular flags */}
            {[
                { x: 35, y: 14, rot: 5 },
                { x: 70, y: 13, rot: -3 },
                { x: 105, y: 10, rot: 4 },
                { x: 140, y: 17, rot: -5 },
                { x: 175, y: 24, rot: 3 },
                { x: 210, y: 15, rot: -4 },
                { x: 245, y: 8, rot: 5 },
                { x: 280, y: 17, rot: -3 },
                { x: 315, y: 26, rot: 4 },
                { x: 350, y: 13, rot: -5 },
                { x: 385, y: 3, rot: 3 },
            ].map((flag, i) => (
                <g key={i} transform={`translate(${flag.x}, ${flag.y}) rotate(${flag.rot})`}>
                    <path
                        d="M-5 0 L0 14 L5 0 Z"
                        fill={flagColors[i]}
                        opacity="0.85"
                    />
                    <circle cx="0" cy="14" r="2" fill={flagColors[i]}>
                        <animate
                            attributeName="opacity"
                            values="0.5;1;0.5"
                            dur={`${1.5 + i * 0.2}s`}
                            begin={`${i * 0.15}s`}
                            repeatCount="indefinite"
                        />
                    </circle>
                </g>
            ))}
        </svg>
    );
}

/* ===== Crescent + Star ===== */
export function CrescentStar({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 44 44" fill="none" className={className}>
            <circle cx="22" cy="22" r="20" fill="rgba(255, 215, 0, 0.08)" />
            <path
                d="M26 4 A16 16 0 1 0 26 40 A12 12 0 1 1 26 4Z"
                fill="#FFD700"
                opacity="0.85"
            />
            <path
                d="M16 18 L17.5 22 L14 24.5 L18 24.5 L19 28.5 L20.5 24.8 L24.5 25.5 L21.5 22.5 L23 19 L19.5 21 Z"
                fill="#FFD700"
            />
        </svg>
    );
}

/* ===== Decorative Star ===== */
export function Star({ className, color = '#FFD700' }: { className?: string; color?: string }) {
    return (
        <svg viewBox="0 0 20 20" fill="none" className={className}>
            <path
                d="M10 1 L12 7.5 L19 8 L13.5 12.5 L15 19 L10 15 L5 19 L6.5 12.5 L1 8 L8 7.5 Z"
                fill={color}
            />
        </svg>
    );
}

export default function RamadanDecorations() {
    const [showCharacter, setShowCharacter] = useState(true);

    return (
        <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
            {/* ===== String Lights / زينة - Removed (moved to header) ===== */}
            {/* <StringLights /> */}

            {/* ===== Hanging Fanous - Removed (moved to header) ===== */}





            {/* ===== شخصية فانوس - Fanous Character with speech bubble ===== */}
            {showCharacter && (
                <div
                    className="absolute bottom-[55px] left-3 pointer-events-auto animate-slide-up"
                    style={{ animationDelay: '0.5s' }}
                >
                    {/* Close button - High Visibility */}
                    <button
                        onClick={() => setShowCharacter(false)}
                        className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-red-500 text-white shadow-md flex items-center justify-center z-30 hover:bg-red-600 transition-colors"
                        aria-label="Close"
                    >
                        <span className="text-sm font-bold leading-none mb-0.5">×</span>
                    </button>

                    {/* Speech bubble - Larger Text */}
                    <div className="relative -mb-4 z-20 bg-gradient-to-br from-[#FFD700] to-[#E63946] rounded-2xl rounded-bl-sm px-4 py-3 text-center shadow-lg transform translate-x-2 min-w-[140px] border border-[#B8860B]">
                        <p className="text-lg font-bold text-white leading-tight drop-shadow-md">رمضان كريم 🌙</p>
                        <p className="text-base text-white font-medium mt-1 drop-shadow-sm">كل سنة وانتوا طيبين</p>
                    </div>

                    {/* Character */}
                    <FanousCharacter className="w-32 h-44 drop-shadow-[0_0_16px_rgba(230,57,70,0.4)]" />
                </div>
            )}
        </div>
    );
}

/* ===== Mosque Skyline ===== */
export function MosqueSkyline({ className, color = '#2D5A43' }: { className?: string; color?: string }) {
    return (
        <svg viewBox="0 0 1200 120" fill="none" className={className} preserveAspectRatio="none">
            <path
                d="M0 120 L1200 120 L1200 105 L1150 105 Q1125 105, 1110 80 L1100 60 L1090 80 Q1075 105, 1050 105 L1000 105 L950 105 Q925 105, 910 80 L900 50 L890 80 Q875 105, 850 105 L700 105 Q675 105, 660 70 L650 40 L640 70 Q625 105, 600 105 L450 105 Q425 105, 410 80 L400 60 L390 80 Q375 105, 350 105 L200 105 Q175 105, 160 80 L150 50 L140 80 Q125 105, 100 105 L0 105 Z"
                fill={color}
                opacity="0.1"
            />
            {/* Mosques */}
            <g opacity="0.15">
                {/* Left Mosque */}
                <rect x="50" y="80" width="60" height="40" fill={color} />
                <path d="M50 80 Q80 50, 110 80" fill={color} />
                <rect x="120" y="60" width="10" height="60" fill={color} />
                <path d="M115 60 L125 60 L125 50 L115 50 Z" fill={color} />

                {/* Center Mosque */}
                <rect x="500" y="70" width="100" height="50" fill={color} />
                <path d="M500 70 Q550 20, 600 70" fill={color} />
                <rect x="480" y="40" width="15" height="80" fill={color} />
                <path d="M475 40 L495 40 L487.5 25 Z" fill={color} />
                <rect x="605" y="40" width="15" height="80" fill={color} />
                <path d="M600 40 L620 40 L612.5 25 Z" fill={color} />

                {/* Right Mosque */}
                <rect x="900" y="80" width="80" height="40" fill={color} />
                <circle cx="940" cy="80" r="30" fill={color} />
                <rect x="990" y="50" width="12" height="70" fill={color} />
                <path d="M986 50 L1006 50 L996 35 Z" fill={color} />
            </g>
            <path
                d="M0 120 L1200 120 L1200 115 L0 115 Z"
                fill={color}
                opacity="0.3"
            />
        </svg>
    );
}
