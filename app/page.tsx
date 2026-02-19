'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import WishlistButton from '@/components/WishlistButton';
import RamadanDecorations from '@/components/RamadanDecorations';
import RamadanLoader from '@/components/RamadanLoader';
import { createBrowserClient } from '@supabase/ssr';
import type { SliderImage, Category, Store, Product } from '@/lib/types';
import { useAuthStore } from '@/store/authStore';
import { StoreBadges } from '@/components/StoreBadges';

export default function HomePage() {
    const [sliderImages, setSliderImages] = useState<SliderImage[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [categories, setCategories] = useState<Category[]>([]);
    interface DisplayStore extends Store {
        display_name: string;
        link_url: string;
        is_branch?: boolean;
    }

    const [featuredStores, setFeaturedStores] = useState<DisplayStore[]>([]);
    const [newArrivals, setNewArrivals] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [productCounts, setProductCounts] = useState<Record<string, number>>({});
    const [topWeeklyStoreId, setTopWeeklyStoreId] = useState<string | null>(null);
    const { user } = useAuthStore();

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch slider images
                const { data: sliderData } = await supabase
                    .from('slider_images')
                    .select('*')
                    .eq('is_active', true)
                    .order('display_order', { ascending: true });

                if (sliderData) setSliderImages(sliderData);

                // Fetch categories
                const { data: categoriesData } = await supabase
                    .from('categories')
                    .select('*')
                    .eq('is_active', true)
                    .order('display_order', { ascending: true });

                if (categoriesData) setCategories(categoriesData);

                // 2. Fetch Stores Logic
                // If we have a location filter, we want to show:
                // a) Main stores physically located here
                // b) Branches physically located here

                let displayStores: DisplayStore[] = [];

                if (user?.governorate) {
                    // A. Fetch Main Stores in Location
                    let mainStoreQuery = supabase
                        .from('stores')
                        .select('*')
                        .eq('is_active', true)
                        .eq('governorate', user.governorate)
                        .not('is_visible', 'is', false);

                    if (user.district) {
                        mainStoreQuery = mainStoreQuery.eq('district', user.district);
                    }

                    // B. Fetch Branches in Location (with parent store info)
                    let branchQuery = supabase
                        .from('store_branches')
                        .select('*, store:store_id(*)')
                        .eq('is_active', true)
                        .eq('governorate', user.governorate);

                    if (user.district) {
                        branchQuery = branchQuery.eq('district', user.district);
                    }

                    const [mainRes, branchRes] = await Promise.all([mainStoreQuery, branchQuery]);

                    // Process Main Stores
                    if (mainRes.data) {
                        const mainStores = mainRes.data.map((s: any) => ({
                            ...s,
                            display_name: s.name,
                            link_url: `/stores/${s.id}`,
                            is_branch: false,
                            unique_key: `store_${s.id}`
                        }));
                        displayStores = [...displayStores, ...mainStores];
                    }

                    // Process Branches
                    if (branchRes.data) {
                        const branches = branchRes.data
                            .filter((b: any) => b.store && b.store.is_active) // Ensure parent store is active
                            .map((b: any) => ({
                                ...b.store, // Inherit store props (logo, category, etc.)
                                id: b.store.id, // Use store ID for linking basic stuff, but we use branch ID for uniqueness in list
                                display_name: b.name === b.store.name ? b.name : `${b.store.name} - ${b.name}`, // "Zara - City Stars" or just "Branch Name" if descriptive
                                link_url: `/stores/${b.store_id}?branch_id=${b.id}`,
                                is_branch: true,
                                unique_key: `branch_${b.id}` // Helper for React key
                            }));
                        displayStores = [...displayStores, ...branches];
                    }

                } else {
                    // No location set: Fetch all Main Stores (Global View)
                    const { data: storesData } = await supabase
                        .from('stores')
                        .select('*')
                        .eq('is_active', true)
                        .not('is_visible', 'is', false)
                        .order('created_at', { ascending: false });

                    if (storesData) {
                        displayStores = storesData.map((s: any) => ({
                            ...s,
                            display_name: s.name,
                            link_url: `/stores/${s.id}`,
                            is_branch: false,
                            unique_key: `store_${s.id}`
                        }));
                    }
                }

                // Fetch product counts per store for badges + featured filter
                const storeIds = displayStores.map(ds => ds.id);
                if (storeIds.length > 0) {
                    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
                    const { data: pcData } = await supabase
                        .from('products')
                        .select('store_id, created_at')
                        .eq('is_active', true)
                        .in('store_id', storeIds)
                        .limit(5000);

                    const counts: Record<string, number> = {};
                    const weeklyCounts: Record<string, number> = {};
                    pcData?.forEach(p => {
                        counts[p.store_id] = (counts[p.store_id] || 0) + 1;
                        if (p.created_at >= oneWeekAgo) {
                            weeklyCounts[p.store_id] = (weeklyCounts[p.store_id] || 0) + 1;
                        }
                    });
                    setProductCounts(counts);
                    const topEntry = Object.entries(weeklyCounts).sort(([, a], [, b]) => b - a)[0];
                    setTopWeeklyStoreId(topEntry && topEntry[1] > 0 ? topEntry[0] : null);

                    // Featured stores = all stores with ≥5 products, sorted by weekly activity then total count
                    const visibleFeatured = displayStores
                        .filter(ds => (counts[ds.id] || 0) >= 5)
                        .sort((a, b) => {
                            const weeklyDiff = (weeklyCounts[b.id] || 0) - (weeklyCounts[a.id] || 0);
                            if (weeklyDiff !== 0) return weeklyDiff;
                            return (counts[b.id] || 0) - (counts[a.id] || 0);
                        });
                    setFeaturedStores(visibleFeatured);
                } else {
                    setFeaturedStores([]);
                }

                // For New Arrivals, we still want to show products from ALL relevant stores in this area
                // We can derive relevantStoreIds from our displayStores
                const filteredStoreIds = displayStores.map(ds => ds.id);
                // Depending on the logic, if displayStores is empty (because of filter), New Arrivals should be empty too?
                // Or if no filter (Global View), displayStores has all stores, so New Arrivals has all products.
                // Re-using the logic from previous step for New Arrivals is fine, but using `filteredStoreIds` is more consistent with what user sees.

                // 3. Fetch New Arrivals (Filtered by relevant IDs if location is set)
                let productsQuery = supabase
                    .from('products')
                    .select(`
                        *,
                        stores:store_id!inner (
                            id,
                            name,
                            logo_url,
                            governorate,
                            district
                        )
                    `)
                    .eq('is_active', true)
                    .limit(50); // Larger pool for randomization

                const relevantStoreIds = displayStores.length > 0 ? displayStores.map(ds => ds.id) : null;

                if (relevantStoreIds !== null && user?.governorate) {
                    if (relevantStoreIds.length > 0) {
                        productsQuery = productsQuery.in('store_id', relevantStoreIds);
                        const { data: productsData } = await productsQuery;
                        if (productsData) {
                            const shuffled = [...productsData].sort(() => 0.5 - Math.random());
                            setNewArrivals(shuffled.slice(0, 10));
                        }
                    } else {
                        setNewArrivals([]);
                    }
                } else {
                    // No location set, fetch random from all
                    const { data: productsData } = await productsQuery;
                    if (productsData) {
                        const shuffled = [...productsData].sort(() => 0.5 - Math.random());
                        setNewArrivals(shuffled.slice(0, 10));
                    }
                }
            } catch (error: any) {
                if (error.name !== 'AbortError') {
                    console.error('Error fetching data:', error);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user?.governorate, user?.district]);

    // Auto-rotate slider every 3 seconds
    useEffect(() => {
        if (sliderImages.length === 0) return;

        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [sliderImages.length]);

    if (isLoading) {
        return <RamadanLoader />;
    }

    return (
        <div
            className="relative flex h-auto min-h-screen w-full flex-col bg-background-dark justify-between group/design-root overflow-x-hidden"
            style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}
        >
            <RamadanDecorations />
            <div className="pb-24">
                {/* Slider Section */}
                <div className="@container px-4 pt-3">
                    <div>
                        <div className="relative overflow-hidden bg-background-dark rounded-2xl">
                            {sliderImages.length > 0 ? (
                                <>
                                    {sliderImages.map((slide, index) => (
                                        <div
                                            key={slide.id}
                                            className={`${index === 0 ? 'relative' : 'absolute inset-0'} transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                                                }`}
                                        >
                                            <img
                                                src={slide.image_url}
                                                alt={slide.title || ''}
                                                className="w-full h-auto block rounded-2xl"
                                            />
                                            {/* Gradient overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(15,23,19,0.4)] via-transparent to-transparent rounded-2xl" />
                                            {slide.title && (
                                                <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                                                    <h2 className="text-cream text-2xl font-bold">{slide.title}</h2>
                                                    {slide.description && (
                                                        <p className="text-text-dark-primary text-sm mt-1">{slide.description}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {/* Slider Indicators */}
                                    <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-2 z-20">
                                        {sliderImages.map((_, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setCurrentSlide(index)}
                                                className={`size-1.5 rounded-full transition-opacity ${index === currentSlide ? 'bg-cream' : 'bg-cream/50'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-[218px] bg-card-dark">
                                    <p className="text-text-dark-secondary">No slider images available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Categories Section */}
                <div className="bg-arabesque/30 pt-4 pb-8 rounded-t-3xl mt-4 border-t border-[#FFD700]/20">
                    <h3 className="text-cream text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-4 text-center">
                        Categories
                    </h3>
                    <div className="flex overflow-x-auto [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <div className="flex items-stretch px-4 gap-8">
                            {categories.length > 0 ? (
                                categories.map((category) => (
                                    <Link
                                        key={category.id}
                                        href={`/categories/${category.name.toLowerCase()}`}
                                        className="flex h-full flex-1 flex-col gap-4 text-center rounded-lg min-w-32 pt-4 hover:opacity-80 transition-opacity"
                                    >
                                        {/* Festive Border Container */}
                                        <div className="w-full aspect-square rounded-full flex flex-col items-center justify-center p-[2px] bg-gradient-to-br from-[#FFD700]/40 via-transparent to-[#FFD700]/40 shadow-lg">
                                            {category.image_url ? (
                                                <div
                                                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-full h-full border-2 border-background-dark"
                                                    style={{ backgroundImage: `url("${category.image_url}")` }}
                                                />
                                            ) : (
                                                <div className="w-full h-full rounded-full flex items-center justify-center bg-card-dark border-2 border-background-dark">
                                                    <span className="material-symbols-outlined text-4xl text-text-dark-secondary">category</span>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-text-dark-primary text-base font-medium leading-normal">
                                            {category.name}
                                        </p>
                                    </Link>
                                ))
                            ) : (
                                <p className="text-text-dark-secondary px-4">No categories available</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Featured Stores Section */}
                <div className="bg-arabesque/30 pt-4 pb-8 rounded-t-3xl mt-4 border-t border-[#FFD700]/20">
                    <h3 className="text-cream text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-4 text-center">
                        Featured Stores
                    </h3>
                    <div className="flex overflow-y-auto [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <div className="flex items-stretch p-4 gap-3">
                            {featuredStores.length > 0 ? (
                                featuredStores.map((store: any) => (
                                    <Link
                                        key={store.unique_key || store.id}
                                        href={store.link_url}
                                        className="flex h-full flex-1 flex-col gap-4 rounded-lg min-w-40 hover:opacity-80 transition-opacity relative group"
                                    >


                                        {/* Festive Border Container */}
                                        <div className="w-full aspect-video rounded-xl relative overflow-hidden bg-card-dark p-[1px] bg-gradient-to-br from-[#FFD700]/40 via-transparent to-[#FFD700]/40 shadow-md transform group-hover:scale-105 transition-transform duration-300">
                                            <div className="w-full h-full rounded-[11px] overflow-hidden relative bg-card-dark">
                                                {store.logo_url ? (
                                                    <div
                                                        className="w-full h-full bg-center bg-no-repeat bg-cover"
                                                        style={{ backgroundImage: `url("${store.logo_url}")` }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-card-dark">
                                                        <span className="material-symbols-outlined text-4xl text-text-dark-secondary">store</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-text-dark-primary text-base font-medium leading-normal line-clamp-1">
                                                {store.display_name}
                                            </p>
                                            <p className="text-text-dark-secondary text-sm font-normal leading-normal">
                                                {store.category || 'Store'}
                                            </p>
                                            <StoreBadges
                                                productCount={productCounts[store.id] || 0}
                                                isTopWeekly={topWeeklyStoreId === store.id}
                                            />
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <p className="text-text-dark-secondary px-4">No featured stores available</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* New Arrivals Section */}
                <div className="bg-arabesque/30 pt-4 pb-8 rounded-t-3xl mt-4 border-t border-[#FFD700]/20">
                    <h3 className="text-cream text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 text-center">
                        New Arrivals <span className="text-[#FFD700]">✨</span>
                    </h3>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(158px,1fr))] gap-3 p-4">
                        {newArrivals.length > 0 ? (
                            newArrivals.map((product) => (
                                <Link
                                    key={product.id}
                                    href={`/products/${product.id}`}
                                    className="flex flex-col gap-3 pb-3 group relative"
                                >
                                    {/* Festive Border Container */}
                                    <div className="w-full aspect-[3/4] rounded-xl relative overflow-hidden bg-card-dark p-[1px] bg-gradient-to-br from-[#FFD700]/40 via-transparent to-[#FFD700]/40">
                                        <div className="w-full h-full rounded-[11px] overflow-hidden relative bg-card-dark">
                                            {product.image_urls && product.image_urls.length > 0 ? (
                                                <div
                                                    className="w-full h-full bg-center bg-no-repeat bg-cover transform group-hover:scale-105 transition-transform duration-500"
                                                    style={{
                                                        backgroundImage: `url("${product.image_urls[0]}")`,
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-4xl text-text-dark-secondary">image</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute top-2 right-2 z-10">
                                            <WishlistButton productId={product.id} className="!bg-card-dark/80 backdrop-blur-sm" />
                                        </div>
                                        {product.old_price && product.old_price > product.price && (
                                            <span className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                                -{Math.round(((product.old_price - product.price) / product.old_price) * 100)}%
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-text-dark-primary text-base font-medium leading-normal">
                                            {product.name}
                                        </p>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-text-dark-secondary text-sm font-normal leading-normal">
                                                ${product.price.toFixed(2)}
                                            </p>
                                            {product.old_price && product.old_price > product.price && (
                                                <p className="text-text-dark-secondary/60 text-xs line-through">
                                                    ${product.old_price.toFixed(2)}
                                                </p>
                                            )}
                                        </div>
                                        {product.stores && (
                                            <p className="text-text-dark-secondary text-xs font-normal leading-normal mt-1">
                                                {product.stores.name}
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <p className="text-text-dark-secondary col-span-full text-center">
                                No new arrivals available
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
