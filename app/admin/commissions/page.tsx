'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface StoreCommission {
    id: string;
    name: string;
    logo_url: string | null;
    commission_rate: number;
    totalOrders: number;
    totalRevenue: number;
    totalCommission: number;
}

export default function AdminCommissionsPage() {
    const { t } = useLanguage();
    const [stores, setStores] = useState<StoreCommission[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [savingId, setSavingId] = useState<string | null>(null);

    const supabase = useMemo(
        () => createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        ),
        []
    );

    const fetchData = async () => {
        try {
            const [storesRes, ordersRes] = await Promise.all([
                supabase.from('stores').select('id, name, logo_url, commission_rate'),
                supabase.from('orders').select('store_id, total_amount, commission_amount').eq('status', 'completed'),
            ]);

            const storesData = storesRes.data || [];
            const orders = ordersRes.data || [];

            const storeStats: Record<string, { orders: number; revenue: number; commission: number }> = {};
            for (const o of orders) {
                if (!storeStats[o.store_id]) {
                    storeStats[o.store_id] = { orders: 0, revenue: 0, commission: 0 };
                }
                storeStats[o.store_id].orders++;
                storeStats[o.store_id].revenue += o.total_amount || 0;
                storeStats[o.store_id].commission += o.commission_amount || 0;
            }

            const result: StoreCommission[] = storesData.map(s => ({
                id: s.id,
                name: s.name,
                logo_url: s.logo_url,
                commission_rate: s.commission_rate ?? 0.03,
                totalOrders: storeStats[s.id]?.orders || 0,
                totalRevenue: storeStats[s.id]?.revenue || 0,
                totalCommission: storeStats[s.id]?.commission || 0,
            }));

            result.sort((a, b) => b.totalRevenue - a.totalRevenue);
            setStores(result);
        } catch (error) {
            console.error('Error fetching commission data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [supabase]);

    const startEdit = (store: StoreCommission) => {
        setEditingId(store.id);
        setEditValue((store.commission_rate * 100).toFixed(1));
    };

    const saveCommission = async (storeId: string) => {
        const rate = parseFloat(editValue) / 100;
        if (isNaN(rate) || rate < 0 || rate > 1) return;

        setSavingId(storeId);
        try {
            const { error } = await supabase
                .from('stores')
                .update({ commission_rate: rate })
                .eq('id', storeId);

            if (error) throw error;

            setStores(prev =>
                prev.map(s => s.id === storeId ? { ...s, commission_rate: rate } : s)
            );
            setEditingId(null);
        } catch (error) {
            console.error('Error saving commission rate:', error);
        } finally {
            setSavingId(null);
        }
    };

    const totalCommissionCollected = stores.reduce((s, st) => s + st.totalCommission, 0);

    return (
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-text-light-primary mb-6">{t('admin.commissionManagement')}</h1>

            {/* Summary */}
            <div className="bg-gradient-to-r from-primary to-green-600 text-white rounded-xl p-5 mb-6">
                <p className="text-sm opacity-80 mb-1">{t('admin.totalCommission')}</p>
                <p className="text-3xl font-bold">{totalCommissionCollected.toFixed(2)} EGP</p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : stores.length === 0 ? (
                <div className="text-center py-12">
                    <span className="material-symbols-outlined text-5xl text-border-light mb-3">payments</span>
                    <p className="text-text-light-secondary">{t('admin.noData')}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {stores.map((store) => (
                        <div key={store.id} className="bg-card-light rounded-xl p-4 border border-border-light">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 shrink-0 rounded-lg bg-background-light flex items-center justify-center overflow-hidden border border-border-light">
                                        {store.logo_url ? (
                                            <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="material-symbols-outlined text-text-light-secondary">store</span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-bold text-text-light-primary truncate">{store.name}</h3>
                                        <p className="text-xs text-text-light-secondary">
                                            {store.totalOrders} {t('admin.orders')} &middot; {store.totalRevenue.toFixed(2)} EGP
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right shrink-0">
                                    {editingId === store.id ? (
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="number"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                className="w-16 px-2 py-1 text-xs rounded border border-border-light bg-background-light text-text-light-primary text-right"
                                                step="0.1"
                                                min="0"
                                                max="100"
                                            />
                                            <span className="text-xs text-text-light-secondary">%</span>
                                            <button
                                                onClick={() => saveCommission(store.id)}
                                                disabled={savingId === store.id}
                                                className="ml-1 px-2 py-1 bg-primary text-white text-xs rounded disabled:opacity-50"
                                            >
                                                {savingId === store.id ? '...' : t('admin.save')}
                                            </button>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="px-2 py-1 text-text-light-secondary text-xs"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => startEdit(store)}
                                            className="text-sm font-bold text-primary hover:underline"
                                        >
                                            {(store.commission_rate * 100).toFixed(1)}%
                                        </button>
                                    )}
                                    <p className="text-xs text-text-light-secondary mt-0.5">
                                        {t('admin.earned')}: {store.totalCommission.toFixed(2)} EGP
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
