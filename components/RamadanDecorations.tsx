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
export function FanousCharacter({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 120 180" fill="none" className={className}>
            <defs>
                <radialGradient id="char-glow" cx="50%" cy="40%" r="50%">
                    <stop offset="0%" stopColor="rgba(255, 183, 3, 0.5)" />
                    <stop offset="100%" stopColor="transparent" />
                </radialGradient>
                <linearGradient id="char-body" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FF6B6B" />
                    <stop offset="100%" stopColor="#E63946" />
                </linearGradient>
            </defs>

            {/* === Top ornament === */}
            <line x1="60" y1="0" x2="60" y2="12" stroke="#FFD700" strokeWidth="2.5" />
            <circle cx="60" cy="3" r="3" fill="#FFD700" />
            <path d="M52 12 Q60 4, 68 12 Z" fill="#FFD700" />
            <rect x="48" y="12" width="24" height="6" rx="3" fill="#FFD700" />

            {/* === Main body === */}
            <path
                d="M48 18 L42 35 Q37 60, 40 80 L46 95 Q60 102, 74 95 L80 80 Q83 60, 78 35 L72 18 Z"
                fill="url(#char-body)"
                stroke="#FFD700"
                strokeWidth="2"
            />

            {/* Inner glow */}
            <ellipse cx="60" cy="58" rx="14" ry="28" fill="url(#char-glow)" />

            {/* Decorative bands */}
            <path d="M44 30 L60 26 L76 30" stroke="#FFD700" strokeWidth="1.2" opacity="0.7" />
            <line x1="39" y1="58" x2="81" y2="58" stroke="#FFD700" strokeWidth="1" opacity="0.5" />
            <path d="M42 78 L60 74 L78 78" stroke="#FFD700" strokeWidth="1.2" opacity="0.7" />

            {/* Diamond patterns */}
            <path d="M60 32 L66 45 L60 58 L54 45 Z" fill="#FF9F1C" opacity="0.25" stroke="#FFD700" strokeWidth="0.6" />
            <path d="M60 60 L65 70 L60 80 L55 70 Z" fill="#FF9F1C" opacity="0.25" stroke="#FFD700" strokeWidth="0.6" />

            {/* === FACE === */}
            {/* Eyes - big cute eyes */}
            <ellipse cx="52" cy="48" rx="5" ry="5.5" fill="white" />
            <ellipse cx="68" cy="48" rx="5" ry="5.5" fill="white" />
            {/* Pupils */}
            <ellipse cx="53" cy="49" rx="3" ry="3.5" fill="#1a1a2e" />
            <ellipse cx="69" cy="49" rx="3" ry="3.5" fill="#1a1a2e" />
            {/* Eye shine */}
            <circle cx="54.5" cy="47" r="1.5" fill="white" />
            <circle cx="70.5" cy="47" r="1.5" fill="white" />

            {/* Rosy cheeks */}
            <ellipse cx="46" cy="56" rx="4" ry="2.5" fill="#FF9F9F" opacity="0.5" />
            <ellipse cx="74" cy="56" rx="4" ry="2.5" fill="#FF9F9F" opacity="0.5" />

            {/* Happy smile */}
            <path d="M54 58 Q60 65, 66 58" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" fill="none" />

            {/* === Bottom cap === */}
            <rect x="50" y="95" width="20" height="5" rx="2" fill="#FFD700" />

            {/* === LEFT hand (waving) === */}
            <g>
                <animateTransform attributeName="transform" type="rotate" values="-10 37 70; 10 37 70; -10 37 70" dur="1.5s" repeatCount="indefinite" />
                {/* Arm */}
                <path d="M42 55 Q32 52, 24 42" stroke="#FFD700" strokeWidth="3" strokeLinecap="round" fill="none" />
                {/* Hand (open palm) */}
                <circle cx="22" cy="40" r="4" fill="#FFD700" />
                {/* Fingers */}
                <line x1="19" y1="37" x2="17" y2="33" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
                <line x1="21" y1="36" x2="20" y2="32" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
                <line x1="24" y1="36" x2="24" y2="32" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* === RIGHT hand (waving) === */}
            <g>
                <animateTransform attributeName="transform" type="rotate" values="10 83 70; -10 83 70; 10 83 70" dur="1.8s" repeatCount="indefinite" />
                {/* Arm */}
                <path d="M78 55 Q88 52, 96 42" stroke="#FFD700" strokeWidth="3" strokeLinecap="round" fill="none" />
                {/* Hand */}
                <circle cx="98" cy="40" r="4" fill="#FFD700" />
                {/* Fingers */}
                <line x1="96" y1="36" x2="96" y2="32" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
                <line x1="99" y1="36" x2="100" y2="32" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
                <line x1="101" y1="37" x2="103" y2="33" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* === Legs === */}
            {/* Left leg */}
            <path d="M52 100 L48 120 Q47 125, 42 126" stroke="#FFD700" strokeWidth="3" strokeLinecap="round" fill="none" />
            {/* Left shoe */}
            <ellipse cx="40" cy="127" rx="6" ry="3" fill="#E63946" />

            {/* Right leg */}
            <path d="M68 100 L72 120 Q73 125, 78 126" stroke="#FFD700" strokeWidth="3" strokeLinecap="round" fill="none" />
            {/* Right shoe */}
            <ellipse cx="80" cy="127" rx="6" ry="3" fill="#E63946" />

            {/* Flame glow */}
            <ellipse cx="60" cy="55" rx="4" ry="6" fill="rgba(255, 255, 200, 0.4)">
                <animate attributeName="ry" values="5;7;5" dur="2s" repeatCount="indefinite" />
            </ellipse>
        </svg>
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

            {/* ===== Crescent + Star ===== */}
            <div className="absolute right-5 animate-float" style={{ top: '160px', animationDelay: '0.5s' }}>
                <CrescentStar className="w-11 h-11 drop-shadow-[0_0_14px_rgba(255,215,0,0.6)]" />
            </div>

            {/* ===== Twinkling Stars ===== */}
            <div className="absolute left-[12%] animate-twinkle" style={{ top: '110px' }}>
                <Star className="w-5 h-5" color="#FFD700" />
            </div>
            <div className="absolute left-[42%] animate-twinkle-slow" style={{ top: '170px', animationDelay: '0.8s' }}>
                <Star className="w-4 h-4" color="#FFB703" />
            </div>
            <div className="absolute right-[18%] animate-twinkle-fast" style={{ top: '100px', animationDelay: '0.4s' }}>
                <Star className="w-4 h-4" color="#FF6B6B" />
            </div>
            <div className="absolute right-[35%] animate-twinkle" style={{ top: '180px', animationDelay: '1.2s' }}>
                <Star className="w-5 h-5" color="#FFD166" />
            </div>
            <div className="absolute left-[55%] animate-twinkle-slow" style={{ top: '90px', animationDelay: '0.6s' }}>
                <Star className="w-3.5 h-3.5" color="#52D689" />
            </div>

            {/* ===== شخصية فانوس - Fanous Character with speech bubble ===== */}
            {showCharacter && (
                <div
                    className="absolute bottom-24 left-3 pointer-events-auto animate-slide-up"
                    style={{ animationDelay: '0.5s' }}
                >
                    {/* Close button */}
                    <button
                        onClick={() => setShowCharacter(false)}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-card-light border border-border-light text-text-light-secondary text-xs flex items-center justify-center z-10 hover:bg-red-500 hover:text-white transition-colors"
                    >
                        ×
                    </button>

                    {/* Speech bubble */}
                    <div className="relative mb-1 bg-gradient-to-br from-[#FFD700]/20 to-[#E63946]/20 backdrop-blur-sm border border-[#FFD700]/40 rounded-2xl rounded-bl-sm px-3 py-2 text-center">
                        <p className="text-sm font-bold text-[#FFD700] leading-tight">رمضان كريم 🌙</p>
                        <p className="text-xs text-cream font-medium mt-0.5">كل سنة وانتوا طيبين</p>
                    </div>

                    {/* Character */}
                    <FanousCharacter className="w-20 h-[120px] drop-shadow-[0_0_16px_rgba(230,57,70,0.4)]" />
                </div>
            )}
        </div>
    );
}
