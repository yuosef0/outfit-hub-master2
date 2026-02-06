'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/hooks/useCart';
import { supabase } from '@/lib/supabase';

export function BottomNavigation() {
    const pathname = usePathname();
    const { totalItems } = useCart();

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 w-full border-t border-border-light bg-surface-light/95 backdrop-blur-md px-6 py-3 flex justify-between items-center">
            <Link
                href="/"
                className={`flex flex-col items-center gap-1 transition-colors ${isActive('/') ? 'text-primary' : 'text-text-light-secondary hover:text-primary'
                    }`}
            >
                <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: isActive('/') ? "'FILL' 1" : "'FILL' 0" }}
                >
                    home
                </span>
                <span className="text-[10px] font-bold">Home</span>
            </Link>

            <Link
                href="/mall"
                className={`flex flex-col items-center gap-1 transition-colors ${isActive('/mall') ? 'text-primary' : 'text-text-light-secondary hover:text-primary'
                    }`}
            >
                <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: isActive('/mall') ? "'FILL' 1" : "'FILL' 0" }}
                >
                    explore
                </span>
                <span className="text-[10px] font-bold">Mall</span>
            </Link>

            <Link
                href="/saved"
                className={`flex flex-col items-center gap-1 transition-colors ${isActive('/saved') ? 'text-primary' : 'text-text-light-secondary hover:text-primary'
                    }`}
            >
                <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: isActive('/saved') ? "'FILL' 1" : "'FILL' 0" }}
                >
                    favorite
                </span>
                <span className="text-[10px] font-bold">Saved</span>
            </Link>

            <Link
                href="/cart"
                className={`flex flex-col items-center gap-1 transition-colors ${isActive('/cart') ? 'text-primary' : 'text-text-light-secondary hover:text-primary'
                    }`}
            >
                <div className="relative">
                    <span
                        className="material-symbols-outlined"
                        style={{ fontVariationSettings: isActive('/cart') ? "'FILL' 1" : "'FILL' 0" }}
                    >
                        shopping_bag
                    </span>
                    {totalItems > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                            {totalItems > 9 ? '9+' : totalItems}
                        </span>
                    )}
                </div>
                <span className="text-[10px] font-bold">Cart</span>
            </Link>

            <Link
                href="/profile"
                className={`flex flex-col items-center gap-1 transition-colors ${isActive('/profile') ? 'text-primary' : 'text-text-light-secondary hover:text-primary'
                    }`}
            >
                <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: isActive('/profile') ? "'FILL' 1" : "'FILL' 0" }}
                >
                    person
                </span>
                <span className="text-[10px] font-bold">Profile</span>
            </Link>
        </nav>
    );
}

// Merchant Sidebar Navigation
export function MerchantNavigation() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = React.useState(false);

    const isActive = (path: string) => {
        if (path === '/merchant/dashboard') {
            return pathname === path;
        }
        return pathname.startsWith(path);
    };

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = '/login';
        }
    };

    const menuItems = [
        { href: '/merchant/dashboard', icon: 'dashboard', label: 'لوحة التحكم' },
        { href: '/merchant/products/new', icon: 'add_circle', label: 'إضافة منتج' },
        { href: '/merchant/products', icon: 'inventory_2', label: 'المنتجات' },
        { href: '/merchant/categories', icon: 'category', label: 'الفئات' },
        { href: '/merchant/orders', icon: 'receipt_long', label: 'الطلبات' },
        { href: '/merchant/pickup', icon: 'qr_code_scanner', label: 'تسليم الطلبات' },
        { href: '/merchant/analytics', icon: 'analytics', label: 'التحليلات' },
        { href: '/merchant/reviews', icon: 'star', label: 'التقييمات' },
        { href: '/merchant/coupons', icon: 'local_offer', label: 'الكوبونات' },
        { href: '/merchant/settings', icon: 'settings', label: 'الإعدادات' },
    ];

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-surface-light rounded-lg shadow-lg border border-border-light"
            >
                <span className="material-symbols-outlined text-text-light-primary">
                    {isOpen ? 'close' : 'menu'}
                </span>
            </button>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 right-0 h-full bg-surface-light border-l border-border-light z-40 transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    } lg:translate-x-0 w-64`}
            >
                {/* Logo/Header */}
                <div className="p-6 border-b border-border-light">
                    <h2 className="text-xl font-bold text-text-light-primary flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">store</span>
                        لوحة التاجر
                    </h2>
                </div>

                {/* Menu Items */}
                <nav className="p-4 space-y-2 pb-24 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${isActive(item.href)
                                    ? 'bg-primary text-background-light shadow-glow font-bold'
                                    : 'text-text-light-secondary hover:bg-card-light hover:text-text-light-primary'
                                }`}
                        >
                            <span
                                className="material-symbols-outlined"
                                style={{
                                    fontVariationSettings: isActive(item.href) ? "'FILL' 1" : "'FILL' 0",
                                }}
                            >
                                {item.icon}
                            </span>
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                {/* Logout Button */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border-light bg-surface-light">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-900/20 transition-all"
                    >
                        <span className="material-symbols-outlined">logout</span>
                        <span className="font-medium">تسجيل الخروج</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
