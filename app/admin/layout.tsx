'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const NAV_ITEMS = [
    { href: '/admin/dashboard', icon: 'dashboard', labelKey: 'admin.dashboard' },
    { href: '/admin/stores', icon: 'store', labelKey: 'admin.stores' },
    { href: '/admin/customers', icon: 'people', labelKey: 'admin.customers' },
    { href: '/admin/commissions', icon: 'payments', labelKey: 'admin.commissions' },
    { href: '/admin/coupons', icon: 'local_offer', labelKey: 'admin.coupons' },
    { href: '/admin/governorates', icon: 'location_on', labelKey: 'admin.governorates' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const supabase = useMemo(
        () => createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        ),
        []
    );

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profile?.role !== 'admin') {
                router.push('/');
                return;
            }

            setIsAdmin(true);
            setLoading(false);
        };

        checkAdmin();
    }, [supabase, router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background-light flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-background-light flex items-center justify-center">
                <p className="text-text-light-secondary">Redirecting...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-light flex">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card-light border-r border-border-light transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="p-5 border-b border-border-light">
                        <div className="flex items-center justify-between">
                            <h1 className="font-playfair text-cream text-lg font-black tracking-wide">
                                OutFit-Hub
                            </h1>
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                                Admin
                            </span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                        {NAV_ITEMS.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                        isActive
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-text-light-secondary hover:bg-card-light hover:text-text-light-primary'
                                    }`}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                                        {item.icon}
                                    </span>
                                    {t(item.labelKey)}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Logout */}
                    <div className="p-3 border-t border-border-light">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-900/20 transition-colors w-full"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
                            {t('auth.logout')}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top bar */}
                <header className="sticky top-0 z-30 bg-background-light/95 backdrop-blur-md border-b border-border-light">
                    <div className="flex items-center gap-3 px-4 py-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden flex items-center justify-center h-10 w-10 rounded-lg hover:bg-card-light transition-colors"
                        >
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <h2 className="text-lg font-bold text-text-light-primary">
                            {t('admin.panelTitle')}
                        </h2>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
