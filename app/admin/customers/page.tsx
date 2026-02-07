'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface Customer {
    id: string;
    full_name: string | null;
    email: string;
    phone: string | null;
    governorate: string | null;
    created_at: string;
}

export default function AdminCustomersPage() {
    const { t } = useLanguage();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const supabase = useMemo(
        () => createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        ),
        []
    );

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('id, full_name, email, phone, governorate, created_at')
                    .eq('role', 'customer')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setCustomers(data || []);
            } catch (error) {
                console.error('Error fetching customers:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCustomers();
    }, [supabase]);

    const filtered = customers.filter(c => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            c.full_name?.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            c.phone?.includes(q)
        );
    });

    return (
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-text-light-primary mb-6">{t('admin.customerManagement')}</h1>

            {/* Search */}
            <div className="relative mb-4">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-light-secondary" style={{ fontSize: '20px' }}>search</span>
                <input
                    type="text"
                    placeholder={t('admin.searchCustomers')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card-light border border-border-light text-text-light-primary placeholder:text-text-light-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                />
            </div>

            <p className="text-xs text-text-light-secondary mb-4">
                {filtered.length} {t('admin.customers').toLowerCase()}
            </p>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                    <span className="material-symbols-outlined text-5xl text-border-light mb-3">people</span>
                    <p className="text-text-light-secondary">{t('admin.noData')}</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map((customer) => (
                        <div key={customer.id} className="bg-card-light rounded-xl p-4 border border-border-light">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>person</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-sm font-bold text-text-light-primary truncate">
                                        {customer.full_name || 'No name'}
                                    </h3>
                                    <p className="text-xs text-text-light-secondary truncate">{customer.email}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    {customer.phone && (
                                        <p className="text-xs text-text-light-secondary">{customer.phone}</p>
                                    )}
                                    {customer.governorate && (
                                        <p className="text-[10px] text-primary font-medium">{customer.governorate}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
