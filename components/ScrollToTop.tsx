'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function ScrollToTop() {
    const pathname = usePathname();
    const [visible, setVisible] = useState(false);

    // Hide on merchant pages
    if (pathname.startsWith('/merchant')) {
        return null;
    }

    useEffect(() => {
        const handleScroll = () => {
            setVisible(window.scrollY > 300);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <AnimatePresence>
            {visible && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="fixed bottom-24 right-4 z-40 w-10 h-10 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:bg-primary-light transition-colors"
                    aria-label="Scroll to top"
                >
                    <span className="material-symbols-outlined text-[20px]">keyboard_arrow_up</span>
                </motion.button>
            )}
        </AnimatePresence>
    );
}
