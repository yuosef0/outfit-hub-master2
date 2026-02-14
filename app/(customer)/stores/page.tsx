'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import StoreWishlistButton from '@/components/StoreWishlistButton';
import type { Store, District } from '@/lib/types';
import { useAuthStore } from '@/store/authStore';
import { useLanguage } from '@/lib/i18n/LanguageContext';

function DiscoverStoresContent() {
    const searchParams = useSearchParams();
    const { t } = useLanguage();
    const initialCategory = searchParams.get('category');

    interface DisplayStore extends Store {
        display_name: string;
        link_url: string;
        is_branch?: boolean;
        unique_key?: string;
    }

    const [activeCategory, setActiveCategory] = useState(initialCategory || 'All');
    const [searchQuery, setSearchQuery] = useState('');
    const [stores, setStores] = useState<Store[]>([]);
    const [filteredStores, setFilteredStores] = useState<DisplayStore[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sortBy, setSortBy] = useState<'name' | 'newest'>('newest');
    const [branches, setBranches] = useState<{ id: string; store_id: string; governorate: string; district?: string; address?: string; name?: string }[]>([]);

    const supabase = useMemo(
        () =>
            createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            ),
        []
    );

    const { user, fetchUser } = useAuthStore();

    // Ensure we have user data
    useEffect(() => {
        fetchUser();
    }, []);



    // Fetch all stores
    useEffect(() => {
        const fetchStores = async () => {
            try {
                const { data, error } = await supabase
                    .from('stores')
                    .select('*')
                    .eq('is_active', true)
                    .or('is_visible.eq.true,is_visible.is.null')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (data) {
                    setStores(data);
                    setFilteredStores(data);
                }

                // Also fetch active branches for location filtering
                try {
                    const { data: branchesData } = await supabase
                        .from('store_branches')
                        .select('id, store_id, governorate, district, address, name')
                        .eq('is_active', true);
                    setBranches(branchesData || []);
                } catch {
                    setBranches([]);
                }
            } catch (error) {
                console.error('Error fetching stores:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStores();
    }, [supabase]);

    // Update active category when search params change
    useEffect(() => {
        if (initialCategory) {
            setActiveCategory(initialCategory);
        }
    }, [initialCategory]);

    // Get unique categories from stores (handles comma-separated multi-categories)
    const categories = ['All', ...Array.from(new Set(stores.flatMap(store => (store.category || '').split(',').map(c => c.trim())).filter(Boolean)))];

    // Get the display address for a store (matching branch address or main store address)
    const getDisplayAddress = (store: Store) => {
        if (!user?.governorate) return store.address;
        // Find a branch matching user's location
        const matchingBranch = branches.find(b => {
            if (b.store_id !== store.id) return false;
            if (b.governorate !== user.governorate) return false;
            if (user.district && b.district && b.district !== user.district) return false;
            return true;
        });
        return matchingBranch?.address || store.address;
    };



    // Filter and sort stores based on user's location from sidebar
    useEffect(() => {
        let result: DisplayStore[] = [];

        // 1. Initial Processing: If location is set, split into Main Stores and Branches
        if (user?.governorate) {
            // A. Main Stores matching location
            const mainStores = stores.filter(store =>
                store.governorate === user.governorate &&
                (!user.district || store.district === user.district)
            ).map(s => ({
                ...s,
                display_name: s.name,
                link_url: `/stores/${s.id}`,
                is_branch: false,
                unique_key: `store_${s.id}`
            }));

            // B. Branches matching location
            const relevantBranches = branches.filter(b =>
                b.governorate === user.governorate &&
                (!user.district || b.district === user.district)
            );

            const branchStores = relevantBranches.map(b => {
                const parentStore = stores.find(s => s.id === b.store_id);
                if (!parentStore) return null;
                return {
                    ...parentStore,
                    id: parentStore.id, // Keep parent ID for referencing, but unique_key handles list uniqueness
                    display_name: b.name === parentStore.name ? b.name : `${parentStore.name} - ${b.name || 'Branch'}`,
                    address: b.address || parentStore.address, // Use branch address
                    governorate: b.governorate,
                    district: b.district,
                    link_url: `/stores/${parentStore.id}?branch_id=${b.id}`,
                    is_branch: true,
                    unique_key: `branch_${b.id}`
                };
            }).filter(Boolean) as DisplayStore[];

            result = [...mainStores, ...branchStores];
        } else {
            // No location filter: Just show all main stores
            result = stores.map(s => ({
                ...s,
                display_name: s.name,
                link_url: `/stores/${s.id}`,
                is_branch: false,
                unique_key: `store_${s.id}`
            }));
        }

        // 2. Filter by category (handles comma-separated multi-categories)
        if (activeCategory !== 'All') {
            result = result.filter(store => {
                const storeCats = (store.category || '').split(',').map(c => c.trim().toLowerCase());
                return storeCats.includes(activeCategory.toLowerCase());
            });
        }

        // 3. Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(store =>
                store.display_name.toLowerCase().includes(query) ||
                store.description?.toLowerCase().includes(query)
            );
        }

        // 4. Sort
        if (sortBy === 'name') {
            result.sort((a, b) => a.display_name.localeCompare(b.display_name));
        } else {
            result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }

        setFilteredStores(result);
    }, [activeCategory, searchQuery, sortBy, stores, branches, user?.governorate, user?.district]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background-light">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-text-light-secondary">{t('stores.loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto min-h-screen bg-background-light shadow-2xl relative overflow-hidden flex flex-col transition-colors duration-200">
            {/* Header Section */}
            <div className="sticky top-0 z-50 bg-background-light/95 backdrop-blur-md pb-2 shadow-sm">
                <div className="px-4 py-3">
                    <h1 className="text-2xl font-bold text-text-light-primary mb-3">{t('stores.discover')}</h1>

                    {/* Search Bar */}
                    <div className="relative mb-3">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-light-secondary">search</span>
                        <input
                            type="text"
                            placeholder={t('stores.searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl bg-card-light border border-border-light text-text-light-primary placeholder:text-text-light-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>

                </div>

                {/* Filters & Sort */}
                <div className="flex flex-col gap-2">
                    {/* Category Pills */}
                    <div className="flex gap-2 px-4 overflow-x-auto no-scrollbar">
                        <style jsx>{`
                            .no-scrollbar::-webkit-scrollbar {
                                display: none;
                            }
                            .no-scrollbar {
                                -ms-overflow-style: none;
                                scrollbar-width: none;
                            }
                        `}</style>
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category || 'All')}
                                className={`flex h-8 px-3 shrink-0 items-center justify-center rounded-full transition-transform active:scale-95 border ${activeCategory === category
                                    ? 'bg-primary border-primary text-white shadow-sm'
                                    : 'bg-card-light border-border-light text-text-light-secondary hover:border-primary/50'
                                    }`}
                            >
                                <span className="text-xs font-medium">{category}</span>
                            </button>
                        ))}
                    </div>

                    {/* Sort & Stats Row */}
                    <div className="flex justify-between items-center px-4 pt-1">
                        <button
                            onClick={() => setSortBy(sortBy === 'newest' ? 'name' : 'newest')}
                            className="flex items-center gap-1.5 text-text-light-secondary hover:text-primary transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">sort</span>
                            <span className="text-xs font-medium">{t('stores.sortBy')}: {sortBy === 'newest' ? t('stores.newest') : t('stores.name')}</span>
                        </button>
                        <div className="text-xs text-text-light-secondary">
                            {filteredStores.length} {filteredStores.length === 1 ? t('stores.store') : t('stores.stores')}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content: Store List */}
            <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
                {filteredStores.length === 0 ? (
                    <div className="text-center py-12">
                        <span className="material-symbols-outlined text-6xl text-border-light mb-4">store</span>
                        <p className="text-text-light-secondary">{t('stores.noStores')}</p>
                        <p className="text-sm text-text-light-secondary mt-2">{t('stores.adjustFilters')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {filteredStores.map((store) => (
                            <Link
                                key={store.unique_key || store.id}
                                href={store.link_url}
                                className="group bg-card-light rounded-xl p-3 shadow-sm border border-border-light hover:border-primary/30 transition-all flex flex-col h-full relative"
                            >
                                {/* Header with Logo & Wishlist */}
                                <div className="flex justify-between items-start mb-3">
                                    <div className="w-12 h-12 shrink-0 rounded-lg bg-background-light flex items-center justify-center overflow-hidden border border-border-light">
                                        {store.logo_url ? (
                                            <img
                                                className="w-full h-full object-cover"
                                                src={store.logo_url}
                                                alt={`${store.name} Logo`}
                                            />
                                        ) : (
                                            <span className="material-symbols-outlined text-2xl text-text-light-secondary">store</span>
                                        )}
                                    </div>
                                    <div
                                        className="absolute top-2 right-2 z-10"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                    >
                                        <StoreWishlistButton storeId={store.id} />
                                    </div>
                                </div>

                                {/* Store Info */}
                                <div className="flex-1 min-w-0 mb-3">
                                    <h3 className="text-text-light-primary text-base font-bold leading-tight truncate mb-1">
                                        {store.display_name}
                                    </h3>

                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        {store.category && store.category.split(',').map((cat, i) => (
                                            <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-background-light text-text-light-secondary border border-border-light">
                                                {cat.trim()}
                                            </span>
                                        ))}
                                        {store.subscription_plan === 'premium' && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-900/10 text-amber-600 border border-amber-200">
                                                {t('stores.premium')}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1 text-[11px] text-text-light-secondary line-clamp-1">
                                        <span className="material-symbols-outlined text-[14px] shrink-0">location_on</span>
                                        <span className="truncate">{store.address}</span>
                                    </div>
                                </div>

                                {/* Action */}
                                <div
                                    className="w-full flex items-center justify-center gap-1.5 h-8 rounded-lg bg-cream text-primary font-bold text-xs hover:bg-cream/90 transition-all mt-auto"
                                >
                                    {t('stores.view')}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

export default function DiscoverStoresPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-background-light">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-text-light-secondary">Loading...</p>
                </div>
            </div>
        }>
            <DiscoverStoresContent />
        </Suspense>
    );
}
