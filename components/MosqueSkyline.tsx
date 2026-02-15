
/* ===== Mosque Skyline ===== */
export function MosqueSkyline({ className, color = '#2D5A43' }: { className?: string; color?: string }) {
    return (
        <svg viewBox="0 0 1200 120" fill="none" className={className} preserveAspectRatio="none">
            <path
                d="M0 120 L1200 120 L1200 100 Q1150 100, 1120 70 L1100 40 L1080 70 Q1050 100, 1000 100 L950 100 Q920 100, 900 70 L880 30 L860 70 Q840 100, 800 100 L750 100 Q720 100, 700 80 L680 50 L660 80 Q640 100, 600 100 L500 100 Q480 100, 460 70 L440 20 L420 70 Q400 100, 350 100 L300 100 Q280 100, 260 80 L240 50 L220 80 Q200 100, 150 100 L0 100 Z"
                fill={color}
                opacity="0.15"
            />
            <path
                d="M0 120 L1200 120 L1200 110 L1000 110 L900 110 L800 110 L600 110 L400 110 L200 110 L0 110 Z"
                fill={color}
                opacity="0.3"
            />
            {/* Domes and Minarets (Simplified) */}
            <g transform="translate(100, 20) scale(0.8)">
                <path d="M50 100 L50 40 L40 30 L60 30 L50 40" fill={color} opacity="0.4" />
                <path d="M20 100 L80 100 L80 60 Q50 30, 20 60 Z" fill={color} opacity="0.3" />
            </g>
            <g transform="translate(400, 40) scale(0.6)">
                <path d="M50 100 L50 40 L40 30 L60 30 L50 40" fill={color} opacity="0.4" />
                <circle cx="50" cy="70" r="30" fill={color} opacity="0.3" />
            </g>
            <g transform="translate(800, 10) scale(1)">
                <path d="M60 100 L60 20 L50 10 L70 10 L60 20" fill={color} opacity="0.4" />
                <path d="M20 100 L100 100 L100 60 Q60 20, 20 60 Z" fill={color} opacity="0.3" />
            </g>
        </svg>
    );
}
