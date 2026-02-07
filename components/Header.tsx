'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { SearchModal } from '@/components/SearchModal';
import { useCartUI } from '@/context/CartUIContext';
import { NotificationsDropdown } from '@/components/NotificationsDropdown';

export default function Header() {
    const pathname = usePathname();
    const [userGovernorate, setUserGovernorate] = useState<string>('Cairo, Egypt');
    const [isLoading, setIsLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const { language, setLanguage, t } = useLanguage();
    const { openCart } = useCartUI();
    const [cartCount, setCartCount] = useState(0);
    const menuRef = useRef<HTMLDivElement>(null);

    const supabase = useMemo(
        () =>
            createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            ),
        []
    );

    // Hide Header on merchant pages
    if (pathname.startsWith('/merchant')) {
        return null;
    }

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const fetchUserGovernorate = async () => {
            try {
                // Use the memoized client
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    const { data: userData } = await supabase
                        .from('users')
                        .select('governorate')
                        .eq('id', user.id)
                        .single();

                    if (userData?.governorate) {
                        setUserGovernorate(`${userData.governorate}, Egypt`);
                    }
                }
            } catch (error) {
                console.error('Error fetching governorate:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserGovernorate();
    }, [supabase]);

    // Fetch cart count
    useEffect(() => {
        const fetchCartCount = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setCartCount(0); return; }

            const { data, error } = await supabase
                .from('cart_items')
                .select('quantity')
                .eq('user_id', user.id);

            if (!error && data) {
                setCartCount(data.reduce((sum, item) => sum + item.quantity, 0));
            }
        };

        fetchCartCount();
        const interval = setInterval(fetchCartCount, 5000);
        return () => clearInterval(interval);
    }, [supabase]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };

        if (menuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpen]);

    // Close menu on route change
    useEffect(() => {
        setMenuOpen(false);
    }, [pathname]);

    return (
        <>
            <header className="relative z-50 border-b bg-background-light/95 backdrop-blur-md border-border-light">
                <div className="flex items-center px-4 py-3 justify-between">
                    {/* Left - Menu Button */}
                    <button
                        onClick={() => setMenuOpen(true)}
                        className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-card-light transition-colors text-cream"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>menu</span>
                    </button>

                    {/* Center - Brand Name */}
                    <h1
                        className="font-playfair text-cream text-xl font-black tracking-wide select-none"
                        style={{ letterSpacing: '0.08em' }}
                    >
                        OutFit-Hub
                    </h1>

                    {/* Right - Search & Notifications */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-card-light transition-colors text-cream"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>search</span>
                        </button>

                        <button
                            onClick={openCart}
                            className="relative flex items-center justify-center h-10 w-10 rounded-full hover:bg-card-light transition-colors text-cream"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>shopping_cart</span>
                            {cartCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-background-light">
                                    {cartCount > 9 ? '9+' : cartCount}
                                </span>
                            )}
                        </button>

                        <NotificationsDropdown />
                    </div>
                </div>
            </header>

            {/* Menu Overlay */}
            {menuOpen && (
                <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
            )}

            {/* Slide-out Menu */}
            <div
                ref={menuRef}
                className={`fixed top-0 ${language === 'ar' ? 'right-0' : 'left-0'} z-[101] h-full w-[280px] bg-background-light border-r border-border-light transform transition-transform duration-300 ease-out ${menuOpen
                    ? 'translate-x-0'
                    : language === 'ar' ? 'translate-x-full' : '-translate-x-full'
                    }`}
            >
                {/* Menu Header */}
                <div className="p-6 border-b border-border-light">
                    <div className="flex items-center justify-between mb-4">
                        <h2
                            className="font-playfair text-cream text-lg font-black tracking-wide"
                        >
                            OutFit-Hub
                        </h2>
                        <button
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-card-light transition-colors text-text-light-secondary"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
                        </button>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2 text-text-light-secondary text-sm">
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>location_on</span>
                        <span>{isLoading ? 'Loading...' : userGovernorate}</span>
                    </div>
                </div>

                {/* Menu Items */}
                <nav className="p-4 flex flex-col gap-1">
                    {/* Language Toggle */}
                    <div className="px-3 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-text-light-primary">
                            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>translate</span>
                            <span className="text-sm font-medium">{t('profile.language')}</span>
                        </div>
                        {mounted && (
                            <div className="flex border border-border-light rounded-full p-0.5 bg-card-light">
                                <button
                                    onClick={() => setLanguage('en')}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${language === 'en'
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'text-text-light-secondary hover:text-text-light-primary'
                                        }`}
                                >
                                    EN
                                </button>
                                <button
                                    onClick={() => setLanguage('ar')}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${language === 'ar'
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'text-text-light-secondary hover:text-text-light-primary'
                                        }`}
                                >
                                    AR
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="h-px bg-border-light my-2" />

                    {/* Navigation Links */}
                    <Link
                        href="/"
                        className={`px-3 py-3 flex items-center gap-3 rounded-lg transition-colors ${pathname === '/' ? 'bg-card-light text-cream' : 'text-text-light-primary hover:bg-card-light'}`}
                        onClick={() => setMenuOpen(false)}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>home</span>
                        <span className="text-sm font-medium">{t('nav.home')}</span>
                    </Link>

                    <Link
                        href="/stores"
                        className={`px-3 py-3 flex items-center gap-3 rounded-lg transition-colors ${pathname === '/stores' ? 'bg-card-light text-cream' : 'text-text-light-primary hover:bg-card-light'}`}
                        onClick={() => setMenuOpen(false)}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>storefront</span>
                        <span className="text-sm font-medium">{t('footer.stores')}</span>
                    </Link>

                    <Link
                        href="/categories"
                        className={`px-3 py-3 flex items-center gap-3 rounded-lg transition-colors ${pathname === '/categories' ? 'bg-card-light text-cream' : 'text-text-light-primary hover:bg-card-light'}`}
                        onClick={() => setMenuOpen(false)}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>category</span>
                        <span className="text-sm font-medium">{t('categories.title')}</span>
                    </Link>

                    <Link
                        href="/orders"
                        className={`px-3 py-3 flex items-center gap-3 rounded-lg transition-colors ${pathname === '/orders' ? 'bg-card-light text-cream' : 'text-text-light-primary hover:bg-card-light'}`}
                        onClick={() => setMenuOpen(false)}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>receipt_long</span>
                        <span className="text-sm font-medium">{t('nav.orders')}</span>
                    </Link>

                    <Link
                        href="/saved"
                        className={`px-3 py-3 flex items-center gap-3 rounded-lg transition-colors ${pathname === '/saved' ? 'bg-card-light text-cream' : 'text-text-light-primary hover:bg-card-light'}`}
                        onClick={() => setMenuOpen(false)}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>favorite</span>
                        <span className="text-sm font-medium">{t('nav.saved')}</span>
                    </Link>

                    <Link
                        href="/profile"
                        className={`px-3 py-3 flex items-center gap-3 rounded-lg transition-colors ${pathname === '/profile' ? 'bg-card-light text-cream' : 'text-text-light-primary hover:bg-card-light'}`}
                        onClick={() => setMenuOpen(false)}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>person</span>
                        <span className="text-sm font-medium">{t('nav.profile')}</span>
                    </Link>
                </nav>
            </div>

            {/* Search Modal */}
            <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </>
    );
}
