'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function MerchantHeader() {
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);
    const [storeName, setStoreName] = useState<string>('');
    const [mounted, setMounted] = useState(false);
    const { language, setLanguage, t } = useLanguage();
    const menuRef = useRef<HTMLDivElement>(null);

    const supabase = useMemo(
        () =>
            createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            ),
        []
    );

    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch store name
    useEffect(() => {
        const fetchStoreName = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: store } = await supabase
                .from('stores')
                .select('name')
                .eq('merchant_id', user.id)
                .maybeSingle();

            if (store) setStoreName(store.name);
        };
        fetchStoreName();
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

    const isActive = (path: string) => {
        if (path === '/merchant/dashboard') return pathname === path;
        return pathname.startsWith(path);
    };

    const menuItems = [
        { href: '/merchant/dashboard', icon: 'dashboard', labelKey: 'merchant.dashboard' },
        { href: '/merchant/products', icon: 'inventory_2', labelKey: 'merchant.products' },
        { href: '/merchant/products/new', icon: 'add_circle', labelKey: 'merchant.addProduct' },
        { href: '/merchant/categories', icon: 'category', labelKey: 'merchant.categories' },
        { href: '/merchant/orders', icon: 'receipt_long', labelKey: 'merchant.orders' },
        { href: '/merchant/pickup', icon: 'qr_code_scanner', labelKey: 'merchant.pickup' },
        { href: '/merchant/analytics', icon: 'analytics', labelKey: 'merchant.analytics' },
        { href: '/merchant/reviews', icon: 'star', labelKey: 'merchant.reviews' },
        { href: '/merchant/coupons', icon: 'local_offer', labelKey: 'merchant.coupons' },
        { href: '/merchant/settings', icon: 'settings', labelKey: 'merchant.settings' },
        { href: '/merchant/social-media', icon: 'share', labelKey: 'merchant.socialMedia', labelAr: 'وسائل التواصل', labelEn: 'Social Media' },
    ];

    return (
        <>
            <header className="sticky top-0 z-50 bg-background-light/95 backdrop-blur-md">
                {/* Top Bar */}
                <div className="relative flex items-center px-4 py-3 justify-between">
                    {/* Left - Menu Button */}
                    <button
                        onClick={() => setMenuOpen(true)}
                        className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-card-light transition-colors text-cream"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>menu</span>
                    </button>

                    {/* Center - Brand Name */}
                    <div className="absolute left-1/2 transform -translate-x-1/2">
                        <h1
                            className="font-playfair text-cream text-xl font-black tracking-wide select-none whitespace-nowrap"
                            style={{ letterSpacing: '0.08em' }}
                        >
                            OutFit-Hub
                        </h1>
                    </div>

                    {/* Right - Settings */}
                    <Link
                        href="/merchant/settings"
                        className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-card-light transition-colors text-cream"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>settings</span>
                    </Link>
                </div>

                {/* Welcome Bar */}
                {storeName && (
                    <div className="px-4 pb-3">
                        <p className="text-sm text-text-light-secondary">
                            {t('merchant.welcome')}{' '}
                            <span className="font-bold text-cream">{storeName}</span>
                        </p>
                    </div>
                )}
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
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="font-playfair text-cream text-lg font-black tracking-wide">
                            OutFit-Hub
                        </h2>
                        <button
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-card-light transition-colors text-text-light-secondary"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
                        </button>
                    </div>
                    {storeName && (
                        <p className="text-xs text-text-light-secondary">
                            <span className="material-symbols-outlined align-middle" style={{ fontSize: '14px' }}>store</span>
                            {' '}{storeName}
                        </p>
                    )}
                </div>

                {/* Menu Items */}
                <nav className="p-4 flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
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
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`px-3 py-3 flex items-center gap-3 rounded-lg transition-colors ${isActive(item.href) ? 'bg-card-light text-cream' : 'text-text-light-primary hover:bg-card-light'}`}
                            onClick={() => setMenuOpen(false)}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>{item.icon}</span>
                            <span className="font-medium">
                                {language === 'ar'
                                    ? (item.labelAr || t(item.labelKey))
                                    : (item.labelEn || t(item.labelKey))
                                }
                            </span>
                        </Link>
                    ))}

                    <div className="h-px bg-border-light my-2" />

                    {/* Logout */}
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
                </nav>
            </div>
        </>
    );
}
