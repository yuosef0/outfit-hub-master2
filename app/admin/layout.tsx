'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminBottomNav from '@/components/admin/AdminBottomNav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

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
        <div className="h-[100dvh] bg-background-light overflow-hidden flex flex-col">
            <AdminHeader />
            <main className="flex-1 overflow-y-auto overflow-x-hidden pb-24">
                {children}
            </main>
            <AdminBottomNav />
        </div>
    );
}
