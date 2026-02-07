'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useLanguage } from '@/lib/i18n/LanguageContext';

type Period = 'this_month' | 'last_month' | 'last_3_months' | 'last_6_months';

export default function AdminDashboard() {
    const { t } = useLanguage();
    const [period, setPeriod] = useState<Period>('this_month');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalMerchants: 0,
        totalCustomers: 0,
        totalSales: 0,
        totalRevenue: 0,
        totalCommission: 0,
    });
    const [topMerchants, setTopMerchants] = useState<{ name: string; email: string; total: number }[]>([]);

    const supabase = useMemo(
        () => createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        ),
        []
    );

    const getDateRange = (p: Period) => {
        const now = new Date();
        let start: Date;
        switch (p) {
            case 'this_month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'last_month':
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                break;
            case 'last_3_months':
                start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                break;
            case 'last_6_months':
                start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
                break;
        }
        return start.toISOString();
    };

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const startDate = getDateRange(period);

                // Fetch counts in parallel
                const [merchantsRes, customersRes, ordersRes] = await Promise.all([
                    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'merchant'),
                    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
                    supabase.from('orders').select('total_amount, commission_amount, store_id').eq('status', 'completed').gte('created_at', startDate),
                ]);

                const orders = ordersRes.data || [];
                const totalRevenue = orders.reduce((s, o) => s + (o.total_amount || 0), 0);
                const totalCommission = orders.reduce((s, o) => s + (o.commission_amount || 0), 0);

                setStats({
                    totalMerchants: merchantsRes.count || 0,
                    totalCustomers: customersRes.count || 0,
                    totalSales: orders.length,
                    totalRevenue,
                    totalCommission,
                });

                // Top 10 merchants by sales
                const storeRevenue: Record<string, number> = {};
                for (const o of orders) {
                    storeRevenue[o.store_id] = (storeRevenue[o.store_id] || 0) + (o.total_amount || 0);
                }

                const topStoreIds = Object.entries(storeRevenue)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10);

                if (topStoreIds.length > 0) {
                    const { data: stores } = await supabase
                        .from('stores')
                        .select('id, name, merchant_id')
                        .in('id', topStoreIds.map(s => s[0]));

                    if (stores) {
                        const merchantIds = [...new Set(stores.map(s => s.merchant_id))];
                        const { data: merchants } = await supabase
                            .from('users')
                            .select('id, full_name, email')
                            .in('id', merchantIds);

                        const merchantMap = new Map((merchants || []).map(m => [m.id, m]));

                        const top = topStoreIds.map(([storeId, total]) => {
                            const store = stores.find(s => s.id === storeId);
                            const merchant = store ? merchantMap.get(store.merchant_id) : null;
                            return {
                                name: store?.name || 'Unknown',
                                email: merchant?.email || '',
                                total,
                            };
                        });

                        setTopMerchants(top);
                    }
                }
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [period, supabase]);

    const statCards = [
        { label: t('admin.totalMerchants'), value: stats.totalMerchants, icon: 'store', color: 'text-blue-400' },
        { label: t('admin.totalCustomers'), value: stats.totalCustomers, icon: 'people', color: 'text-green-400' },
        { label: t('admin.totalSales'), value: stats.totalSales, icon: 'receipt_long', color: 'text-purple-400' },
        { label: t('admin.totalRevenue'), value: `${stats.totalRevenue.toFixed(2)} EGP`, icon: 'payments', color: 'text-amber-400' },
        { label: t('admin.totalCommission'), value: `${stats.totalCommission.toFixed(2)} EGP`, icon: 'account_balance', color: 'text-primary' },
    ];

    const periods: { key: Period; label: string }[] = [
        { key: 'this_month', label: t('admin.thisMonth') },
        { key: 'last_month', label: t('admin.lastMonth') },
        { key: 'last_3_months', label: t('admin.last3Months') },
        { key: 'last_6_months', label: t('admin.last6Months') },
    ];

    return (
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold text-text-light-primary">{t('admin.dashboard')}</h1>

                {/* Period Selector */}
                <div className="flex gap-2 overflow-x-auto">
                    {periods.map((p) => (
                        <button
                            key={p.key}
                            onClick={() => setPeriod(p.key)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                                period === p.key
                                    ? 'bg-primary text-white'
                                    : 'bg-card-light text-text-light-secondary hover:bg-card-light border border-border-light'
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
                        {statCards.map((card) => (
                            <div key={card.label} className="bg-card-light rounded-xl p-4 border border-border-light">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`material-symbols-outlined ${card.color}`} style={{ fontSize: '20px' }}>
                                        {card.icon}
                                    </span>
                                    <span className="text-xs text-text-light-secondary">{card.label}</span>
                                </div>
                                <p className="text-xl font-bold text-text-light-primary">{card.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Top 10 Merchants */}
                    <div className="bg-card-light rounded-xl border border-border-light">
                        <div className="p-4 border-b border-border-light">
                            <h2 className="text-lg font-bold text-text-light-primary flex items-center gap-2">
                                <span className="material-symbols-outlined text-amber-400">emoji_events</span>
                                {t('admin.topMerchants')}
                            </h2>
                        </div>
                        <div className="divide-y divide-border-light">
                            {topMerchants.length === 0 ? (
                                <div className="p-8 text-center text-text-light-secondary">
                                    {t('admin.noData')}
                                </div>
                            ) : (
                                topMerchants.map((merchant, i) => (
                                    <div key={i} className="flex items-center justify-between p-4">
                                        <div className="flex items-center gap-3">
                                            <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                                {i + 1}
                                            </span>
                                            <div>
                                                <p className="text-sm font-medium text-text-light-primary">{merchant.name}</p>
                                                <p className="text-xs text-text-light-secondary">{merchant.email}</p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-primary">{merchant.total.toFixed(2)} EGP</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
