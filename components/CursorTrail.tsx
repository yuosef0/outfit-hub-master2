'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Point {
    x: number;
    y: number;
    id: number;
}

export default function CursorTrail() {
    const [points, setPoints] = useState<Point[]>([]);

    useEffect(() => {
        let counter = 0;
        const handleMouseMove = (e: MouseEvent) => {
            const newPoint = { x: e.clientX, y: e.clientY, id: counter++ };
            setPoints((prev) => [...prev.slice(-15), newPoint]);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Clean up old points periodically to prevent memory leaks if mouse stops moving
    useEffect(() => {
        const interval = setInterval(() => {
            setPoints((prev) => {
                if (prev.length === 0) return prev;
                return prev.slice(1);
            });
        }, 100);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
            <AnimatePresence>
                {points.map((point) => (
                    <motion.div
                        key={point.id}
                        initial={{ opacity: 0.8, scale: 0.5 }}
                        animate={{ opacity: 0, scale: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="absolute w-2 h-2 rounded-full bg-[#FFD700] shadow-[0_0_8px_#FFD700]"
                        style={{
                            left: point.x,
                            top: point.y,
                            transform: 'translate(-50%, -50%)',
                        }}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}
