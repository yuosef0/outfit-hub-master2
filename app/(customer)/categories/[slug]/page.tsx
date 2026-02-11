'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import type { Store } from '@/lib/types';
import { useAuthStore } from '@/store/authStore';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface Subcategory {
    id: string;
    name: string;
    name_ar: string | null;
}

export default function CategoryDetailPage() {
    const router = useRouter();
    const params = useParams();
    const slug = typeof params?.slug === 'string' ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : '';

    const [stores, setStores] = useState<Store[]>([]);
    const [filteredStores, setFilteredStores] = useState<Store[]>([]);
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { user } = useAuthStore();
    const { t } = useLanguage();

    const supabase = useMemo(
        () =>
            createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            ),
        []
    );

    // Fetch data (Category, Subcategories, Stores)
    useEffect(() => {
        const fetchData = async () => {
            try {
                const categoryName = slug.replace(/-/g, ' ');

                // 1. Fetch Category to get ID and Arabic Name
                const { data: categoryData } = await supabase
                    .from('categories')
                    .select('id, name, name_ar')
                    .ilike('name', categoryName)
                    .single();

                if (categoryData) {
                    // 2. Fetch Subcategories
                    const { data: subs } = await supabase
                        .from('subcategories')
                        .select('id, name, name_ar')
                        .eq('category_id', categoryData.id)
                        .order('name');
                    setSubcategories(subs || []);

                    // 3. Fetch Stores (match English OR Arabic category name)
                    let storesQuery = supabase
                        .from('stores')
                        .select('*')
                        .eq('is_active', true)
                        .or('is_visible.eq.true,is_visible.is.null')
                        .or(`category.ilike.%${categoryData.name}%,category.ilike.%${categoryData.name_ar}%`)
                        .order('created_at', { ascending: false });

                    // Filter by governorate and district if user is logged in and has them selected
                    if (user?.governorate) {
                        storesQuery = storesQuery.eq('governorate', user.governorate);
                        if (user?.district) {
                            storesQuery = storesQuery.eq('district', user.district);
                        }
                    }

                    const { data: storesData, error } = await storesQuery;

                    if (error) throw error;
                    if (storesData) {
                        setStores(storesData);
                        setFilteredStores(storesData);
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (slug) {
            fetchData();
        }
    }, [slug, supabase, user?.governorate, user?.district]);

    // Filter stores by search query AND subcategory
    useEffect(() => {
        const filterStores = async () => {
            let filtered = stores;

            // 1. Filter by Search
            if (searchQuery) {
                filtered = filtered.filter(store =>
                    store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    store.description?.toLowerCase().includes(searchQuery.toLowerCase())
                );
            }

            // 2. Filter by Subcategory
            if (selectedSubcategory) {
                const { data: storeSubcategories } = await supabase
                    .from('store_subcategories')
                    .select('store_id')
                    .eq('subcategory_id', selectedSubcategory);

                if (storeSubcategories) {
                    const storeIds = new Set(storeSubcategories.map(s => s.store_id));
                    filtered = filtered.filter(store => storeIds.has(store.id));
                }
            }

            setFilteredStores(filtered);
        };

        filterStores();
    }, [searchQuery, stores, selectedSubcategory, supabase]);



    const displayTitle = slug
        ? slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        : "Category";

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background-light">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-text-light-secondary">{t('categories.loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto min-h-screen bg-background-light shadow-2xl relative overflow-hidden flex flex-col transition-colors duration-200">


            {/* Store Count and Filters */}
            <div className="px-5 py-3 border-b border-border-light/50/50 space-y-3">
                {subcategories.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSelectedSubcategory(null)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedSubcategory === null
                                ? 'bg-primary text-white shadow-md shadow-primary/20'
                                : 'bg-card-light text-text-light-secondary border border-border-light hover:border-primary/50'
                                }`}
                        >
                            {t('common.all')}
                        </button>
                        {subcategories.map((sub) => (
                            <button
                                key={sub.id}
                                onClick={() => setSelectedSubcategory(sub.id)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedSubcategory === sub.id
                                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                                    : 'bg-card-light text-text-light-secondary border border-border-light hover:border-primary/50'
                                    }`}
                            >
                                {sub.name_ar || sub.name}
                            </button>
                        ))}
                    </div>
                )}
                <p className="text-sm text-text-light-secondary">
                    {filteredStores.length} {filteredStores.length === 1 ? t('categories.store') : t('categories.stores')} {t('categories.found')}
                </p>
            </div>

            {/* Main Content: Store List */}
            <main className="flex-1 overflow-y-auto px-5 py-4 space-y-5 pb-24">
                {filteredStores.length === 0 ? (
                    <div className="text-center py-12">
                        <span className="material-symbols-outlined text-6xl text-border-light mb-4">store</span>
                        <p className="text-text-light-secondary">{t('categories.noStores')}</p>
                        <p className="text-sm text-text-light-secondary mt-2">{t('categories.tryOther')}</p>
                    </div>
                ) : (
                    filteredStores.map((store) => (
                        <div
                            key={store.id}
                            className="group bg-card-light/50 rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-border-light/50 hover:border-primary/30 transition-all"
                        >
                            <div className="flex gap-4 mb-3">
                                <div className="w-16 h-16 shrink-0 rounded-xl bg-card-light flex items-center justify-center overflow-hidden border border-gray-100">
                                    {store.logo_url ? (
                                        <img
                                            className="w-full h-full object-cover"
                                            src={store.logo_url}
                                            alt={`${store.name} Logo`}
                                        />
                                    ) : (
                                        <span className="material-symbols-outlined text-3xl text-text-light-secondary">store</span>
                                    )}
                                </div>
                                <div className="flex flex-col flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-text-light-primary text-lg font-bold leading-tight truncate">
                                                {store.name}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                {store.category && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-card-light text-text-light-secondary">
                                                        {store.category}
                                                    </span>
                                                )}
                                                {store.subscription_plan === 'premium' && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-900/30 text-amber-400">
                                                        {t('categories.premium')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button className="text-text-light-secondary hover:text-red-500 transition-colors">
                                            <span className="material-symbols-outlined text-[20px]">favorite</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            {store.description && (
                                <p className="text-text-light-secondary text-sm leading-relaxed line-clamp-2 mb-4">
                                    {store.description}
                                </p>
                            )}
                            {store.address && (
                                <div className="flex items-center gap-2 text-xs text-text-light-secondary mb-4">
                                    <span className="material-symbols-outlined text-[16px]">location_on</span>
                                    <span>{store.address}</span>
                                </div>
                            )}
                            <Link
                                href={`/stores/${store.id}`}
                                className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-primary/20 text-primary font-semibold text-sm hover:bg-primary hover:text-white transition-all active:scale-[0.98]"
                            >
                                {t('categories.viewStore')}
                            </Link>
                        </div>
                    ))
                )}
            </main>
        </div>
    );
}
