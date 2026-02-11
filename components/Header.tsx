'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { SearchModal } from '@/components/SearchModal';
import { useCartUI } from '@/context/CartUIContext';
import { NotificationsDropdown } from '@/components/NotificationsDropdown';
import { useAuthStore } from '@/store/authStore';

export default function Header() {
    const pathname = usePathname();
    const [userGovernorate, setUserGovernorate] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdatingGov, setIsUpdatingGov] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const { language, setLanguage, t } = useLanguage();
    const { openCart } = useCartUI();
    const [cartCount, setCartCount] = useState(0);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { user, updateGovernorate, fetchUser, loading } = useAuthStore();
    const [governorates, setGovernorates] = useState<any[]>([]);
    const [districts, setDistricts] = useState<any[]>([]);
    const [selectedDistrict, setSelectedDistrict] = useState<string>('');

    // Local state for governorate to allow immediate UI updates while saving
    // Initialize with user's governorate if available
    const [localGovernorate, setLocalGovernorate] = useState<string>('');

    // Sync local state when user loads/changes
    useEffect(() => {
        if (user?.governorate) {
            setLocalGovernorate(user.governorate);
        }
        if (user?.district) {
            setSelectedDistrict(user.district);
        }
    }, [user?.governorate, user?.district]);

    const supabase = useMemo(
        () =>
            createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            ),
        []
    );

    // Hide Header on merchant and admin pages (they have their own headers)
    if (pathname.startsWith('/merchant') || pathname.startsWith('/admin')) {
        return null;
    }

    useEffect(() => {
        setMounted(true);
        // Ensure we have latest user data
        fetchUser();
    }, []);

    // Fetch active governorates and districts
    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: govData } = await supabase
                    .from('governorates')
                    .select('*')
                    .order('name', { ascending: true });

                const { data: distData } = await supabase
                    .from('districts')
                    .select('*')
                    .eq('is_active', true)
                    .order('name', { ascending: true });

                setGovernorates(govData || []);
                setDistricts(distData || []);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [supabase]);

    // Track auth state
    useEffect(() => {
        setIsAuthenticated(!!user);
    }, [user]);

    // Handle governorate change
    const handleGovernorateChange = async (newGov: string) => {
        setLocalGovernorate(newGov); // Immediate UI update
        setSelectedDistrict(''); // Reset district
        setIsUpdatingGov(true);
        try {
            await updateGovernorate(newGov, ''); // Clear district when governorate changes
        } catch (error) {
            console.error('Error updating governorate:', error);
            // Revert if error (optional, but good UX)
            if (user?.governorate) setLocalGovernorate(user.governorate);
        } finally {
            setIsUpdatingGov(false);
        }
    };

    // Handle district change
    const handleDistrictChange = async (newDistrict: string) => {
        setSelectedDistrict(newDistrict); // Immediate UI update
        try {
            await updateGovernorate(localGovernorate, newDistrict);
        } catch (error) {
            console.error('Error updating district:', error);
            // Revert if error
            if (user?.district) setSelectedDistrict(user.district);
        }
    };

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
            <header className="sticky top-0 z-50 bg-background-light/95 backdrop-blur-md">
                <div className="relative flex items-center px-4 py-3 justify-between">
                    {/* Left - Menu Button */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setMenuOpen(true)}
                            className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-card-light transition-colors text-cream"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>menu</span>
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
                    </div>

                    {/* Center - Brand Name */}
                    <div className="absolute left-1/2 transform -translate-x-1/2">
                        <h1
                            className="font-playfair text-cream text-xl font-black tracking-wide select-none whitespace-nowrap"
                            style={{ letterSpacing: '0.08em' }}
                        >
                            OutFit-Hub
                        </h1>
                    </div>

                    {/* Right - Search & Notifications */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-card-light transition-colors text-cream"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>search</span>
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

                    {/* Governorate Selector */}
                    {isAuthenticated && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-text-light-secondary text-sm">
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>location_on</span>
                                {loading ? (
                                    <span>{t('common.loading')}</span>
                                ) : (
                                    <select
                                        value={localGovernorate}
                                        onChange={(e) => {
                                            handleGovernorateChange(e.target.value);
                                            setSelectedDistrict(''); // Reset district when governorate changes
                                        }}
                                        className="bg-transparent border-none text-text-light-secondary text-sm focus:outline-none focus:ring-0 cursor-pointer p-0 pr-5 appearance-none"
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='%239ca3af'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right center' }}
                                        disabled={isUpdatingGov}
                                    >
                                        <option value="">{t('header.selectGovernorate')}</option>
                                        {governorates.map((gov) => (
                                            <option key={gov.code} value={gov.code}>
                                                {gov.name_ar}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* District Selector - Shows when governorate is selected */}
                            {localGovernorate && (
                                <div className="flex items-center gap-2 text-text-light-secondary text-sm pl-6">
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>place</span>
                                    <select
                                        value={selectedDistrict}
                                        onChange={(e) => handleDistrictChange(e.target.value)}
                                        className="bg-transparent border-none text-text-light-secondary text-sm focus:outline-none focus:ring-0 cursor-pointer p-0 pr-5 appearance-none"
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='%239ca3af'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right center' }}
                                    >
                                        <option value="">{language === 'ar' ? 'كل المراكز' : 'All Districts'}</option>
                                        {districts
                                            .filter(d => d.governorate_code === localGovernorate)
                                            .map((dist) => (
                                                <option key={dist.id} value={dist.name}>
                                                    {dist.name_ar}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    )}
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

                    <div className="h-px bg-border-light my-2" />

                    {/* Login/Logout */}
                    {isAuthenticated ? (
                        <button
                            onClick={async () => {
                                await supabase.auth.signOut();
                                setMenuOpen(false);
                                window.location.href = '/login';
                            }}
                            className="px-3 py-3 flex items-center gap-3 rounded-lg text-red-400 hover:bg-red-900/20 transition-colors"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>logout</span>
                            <span className="text-sm font-medium">{t('auth.logout')}</span>
                        </button>
                    ) : (
                        <Link
                            href="/login"
                            className="px-3 py-3 flex items-center gap-3 rounded-lg text-primary hover:bg-card-light transition-colors"
                            onClick={() => setMenuOpen(false)}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>login</span>
                            <span className="text-sm font-medium">{t('auth.login')}</span>
                        </Link>
                    )}
                </nav>
            </div>

            {/* Search Modal */}
            <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </>
    );
}
