'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function RamadanGreeting() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Check if greeting has been shown this session
        const hasSeenGreeting = sessionStorage.getItem('hasSeenRamadanGreeting_v1');

        if (!hasSeenGreeting) {
            // Delay slightly for dramatic effect
            const timer = setTimeout(() => {
                setShow(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setShow(false);
        // Mark as seen for this session
        sessionStorage.setItem('hasSeenRamadanGreeting_v1', 'true');
    };

    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={handleClose}
                    />

                    {/* Decorations pinned to top */}
                    <motion.img
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ type: "spring", duration: 0.8 }}
                        src="/images/66b17cb1a4e11.png"
                        alt="Ramadan decorations"
                        className="absolute top-0 left-0 w-full h-auto object-contain z-10 pointer-events-none"
                    />

                    {/* Modal Content - centered */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        transition={{ type: "spring", duration: 0.8 }}
                        className="relative z-10 max-w-md w-full flex flex-col items-center"
                    >
                        {/* The Image */}
                        <div className="relative w-full flex items-center justify-center">
                            {/* Glow Effect behind image */}
                            <div className="absolute inset-0 bg-[#FFD700] opacity-10 blur-3xl rounded-full"></div>

                            <img
                                src="/images/—Pngtree—lettering ramadan luxury arabic text_6181609.png"
                                alt="Ramadan Kareem"
                                className="relative w-full h-auto object-contain drop-shadow-[0_0_25px_rgba(255,215,0,0.3)]"
                            />
                        </div>

                        {/* Close Button at bottom */}
                        <motion.button
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1, transition: { delay: 0.5 } }}
                            onClick={handleClose}
                            className="mt-8 px-8 py-2 bg-transparent border border-[#FFD700] text-[#FFD700] rounded-full hover:bg-[#FFD700] hover:text-[#1a1a2e] transition-colors duration-300 font-medium tracking-wide"
                        >
                            إغلاق
                        </motion.button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
