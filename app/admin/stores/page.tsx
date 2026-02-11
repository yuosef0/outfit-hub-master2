'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface StoreWithMerchant {
    id: string;
    name: string;
    category: string | null;
    district: string | null;
    governorate: string | null;
    is_active: boolean;
    is_visible: boolean;
    created_at: string;
    logo_url: string | null;
    merchant_id: string;
    merchant_name?: string;
    merchant_email?: string;
}

type FilterStatus = 'all' | 'active' | 'inactive';

export default function AdminStoresPage() {
    const { t } = useLanguage();
    const [stores, setStores] = useState<StoreWithMerchant[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<FilterStatus>('all');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [governorates, setGovernorates] = useState<any[]>([]);

    const supabase = useMemo(
        () => createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        ),
        []
    );

    // Fetch governorates for code-to-name resolution
    useEffect(() => {
        const fetchGovernorates = async () => {
            const { data } = await supabase
                .from('governorates')
                .select('code, name, name_ar');
            if (data) setGovernorates(data);
        };
        fetchGovernorates();
    }, [supabase]);

    const getGovernorateName = (code: string | null) => {
        if (!code) return null;
        // Try matching by code first (new format), then by English name (old format)
        const gov = governorates.find(g => g.code === code) || governorates.find(g => g.name === code);
        return gov?.name_ar || code;
    };

    const fetchStores = async () => {
        try {
            const { data, error } = await supabase
                .from('stores')
                .select('id, name, category, district, governorate, is_active, is_visible, created_at, logo_url, merchant_id')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data && data.length > 0) {
                const merchantIds = [...new Set(data.map(s => s.merchant_id))];
                const { data: merchants } = await supabase
                    .from('users')
                    .select('id, full_name, email')
                    .in('id', merchantIds);

                const merchantMap = new Map((merchants || []).map(m => [m.id, m]));

                const storesWithMerchant: StoreWithMerchant[] = data.map(s => ({
                    ...s,
                    merchant_name: merchantMap.get(s.merchant_id)?.full_name || '-',
                    merchant_email: merchantMap.get(s.merchant_id)?.email || '-',
                }));

                setStores(storesWithMerchant);
            } else {
                setStores([]);
            }
        } catch (error) {
            console.error('Error fetching stores:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStores();
    }, [supabase]);

    const toggleStoreStatus = async (storeId: string, currentStatus: boolean) => {
        setUpdatingId(storeId);
        try {
            const { error } = await supabase
                .from('stores')
                .update({ is_active: !currentStatus })
                .eq('id', storeId);

            if (error) throw error;

            setStores(prev =>
                prev.map(s => s.id === storeId ? { ...s, is_active: !currentStatus } : s)
            );
        } catch (error) {
            console.error('Error toggling store status:', error);
        } finally {
            setUpdatingId(null);
        }
    };

    const toggleStoreVisibility = async (storeId: string, currentVisibility: boolean) => {
        setUpdatingId(storeId);
        try {
            const { error } = await supabase
                .from('stores')
                .update({ is_visible: !currentVisibility })
                .eq('id', storeId);

            if (error) throw error;

            setStores(prev =>
                prev.map(s => s.id === storeId ? { ...s, is_visible: !currentVisibility } : s)
            );
        } catch (error) {
            console.error('Error toggling store visibility:', error);
        } finally {
            setUpdatingId(null);
        }
    };

    const filtered = stores.filter(s => {
        const matchesSearch = !search ||
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.merchant_name?.toLowerCase().includes(search.toLowerCase()) ||
            s.merchant_email?.toLowerCase().includes(search.toLowerCase());

        const matchesFilter = filter === 'all' ||
            (filter === 'active' && s.is_active) ||
            (filter === 'inactive' && !s.is_active);

        return matchesSearch && matchesFilter;
    });

    return (
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-text-light-primary mb-6">{t('admin.storeManagement')}</h1>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-light-secondary" style={{ fontSize: '20px' }}>search</span>
                    <input
                        type="text"
                        placeholder={t('admin.searchStores')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card-light border border-border-light text-text-light-primary placeholder:text-text-light-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                </div>
                <div className="flex gap-2">
                    {(['all', 'active', 'inactive'] as FilterStatus[]).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                                filter === f
                                    ? 'bg-primary text-white'
                                    : 'bg-card-light text-text-light-secondary border border-border-light'
                            }`}
                        >
                            {f === 'all' ? t('admin.all') : f === 'active' ? t('admin.active') : t('admin.inactive')}
                        </button>
                    ))}
                </div>
            </div>

            <p className="text-xs text-text-light-secondary mb-4">
                {filtered.length} {t('admin.stores').toLowerCase()}
            </p>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                    <span className="material-symbols-outlined text-5xl text-border-light mb-3">store</span>
                    <p className="text-text-light-secondary">{t('admin.noData')}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((store) => (
                        <div key={store.id} className="bg-card-light rounded-xl p-4 border border-border-light">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 min-w-0 flex-1">
                                    <div className="w-11 h-11 shrink-0 rounded-lg bg-background-light flex items-center justify-center overflow-hidden border border-border-light">
                                        {store.logo_url ? (
                                            <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="material-symbols-outlined text-text-light-secondary">store</span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <h3 className="text-sm font-bold text-text-light-primary truncate">{store.name}</h3>
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                store.is_active
                                                    ? 'bg-green-900/20 text-green-400'
                                                    : 'bg-red-900/20 text-red-400'
                                            }`}>
                                                {store.is_active ? t('admin.active') : t('admin.inactive')}
                                            </span>
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5 ${
                                                store.is_visible !== false
                                                    ? 'bg-blue-900/20 text-blue-400'
                                                    : 'bg-orange-900/20 text-orange-400'
                                            }`}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                                                    {store.is_visible !== false ? 'visibility' : 'visibility_off'}
                                                </span>
                                                {store.is_visible !== false ? t('admin.stores.visible') : t('admin.stores.hidden')}
                                            </span>
                                        </div>
                                        <p className="text-xs text-text-light-secondary">{store.merchant_name} &middot; {store.merchant_email}</p>
                                        <div className="flex flex-wrap gap-2 mt-1.5">
                                            {store.category && (
                                                <span className="text-[10px] bg-background-light px-1.5 py-0.5 rounded border border-border-light text-text-light-secondary">{store.category}</span>
                                            )}
                                            {store.governorate && (
                                                <span className="text-[10px] bg-background-light px-1.5 py-0.5 rounded border border-border-light text-text-light-secondary">
                                                    {getGovernorateName(store.governorate)}
                                                </span>
                                            )}
                                            {store.district && (
                                                <span className="text-[10px] bg-background-light px-1.5 py-0.5 rounded border border-border-light text-text-light-secondary">{store.district}</span>
                                            )}
                                            <span className="text-[10px] text-text-light-secondary">
                                                {new Date(store.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5 shrink-0">
                                    <button
                                        onClick={() => toggleStoreVisibility(store.id, store.is_visible !== false)}
                                        disabled={updatingId === store.id}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${
                                            store.is_visible !== false
                                                ? 'bg-orange-900/20 text-orange-400 hover:bg-orange-900/30'
                                                : 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/30'
                                        }`}
                                    >
                                        {updatingId === store.id ? '...' : store.is_visible !== false ? t('admin.stores.hide') : t('admin.stores.show')}
                                    </button>
                                    <button
                                        onClick={() => toggleStoreStatus(store.id, store.is_active)}
                                        disabled={updatingId === store.id}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${
                                            store.is_active
                                                ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30'
                                                : 'bg-green-900/20 text-green-400 hover:bg-green-900/30'
                                        }`}
                                    >
                                        {updatingId === store.id ? '...' : store.is_active ? t('admin.deactivate') : t('admin.activate')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
