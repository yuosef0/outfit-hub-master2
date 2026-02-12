'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import WishlistButton from '@/components/WishlistButton';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { Product } from '@/lib/types';

export default function CustomerHome() {
    const [newArrivals, setNewArrivals] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { t } = useLanguage();

    const supabase = useMemo(
        () =>
            createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            ),
        []
    );

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // Get customer's governorate and district to filter products
                let storeIds: string[] | null = null;
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: userData } = await supabase
                        .from('users')
                        .select('governorate, district')
                        .eq('id', user.id)
                        .single();

                    if (userData?.governorate) {
                        let storesQuery = supabase
                            .from('stores')
                            .select('id')
                            .eq('governorate', userData.governorate)
                            .eq('is_active', true)
                            .or('is_visible.eq.true,is_visible.is.null');

                        // Further filter by district if user has selected one
                        if (userData.district) {
                            storesQuery = storesQuery.eq('district', userData.district);
                        }

                        const { data: govStores } = await storesQuery;

                        // Also include stores that have branches in user's location
                        let branchStoreIds: string[] = [];
                        try {
                            let branchQuery = supabase
                                .from('store_branches')
                                .select('store_id')
                                .eq('governorate', userData.governorate)
                                .eq('is_active', true);

                            if (userData.district) {
                                branchQuery = branchQuery.eq('district', userData.district);
                            }

                            const { data: branchStores } = await branchQuery;
                            branchStoreIds = branchStores?.map(b => b.store_id) || [];
                        } catch {
                            // store_branches table may not exist yet
                        }

                        const mainStoreIds = govStores?.map(s => s.id) || [];
                        const allStoreIds = [...new Set([...mainStoreIds, ...branchStoreIds])];

                        if (allStoreIds.length > 0) {
                            storeIds = allStoreIds;
                        }
                    }
                }

                let query = supabase
                    .from('products')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (storeIds) {
                    query = query.in('store_id', storeIds);
                }

                const { data, error } = await query;
                if (error) throw error;
                setNewArrivals(data || []);
            } catch (error) {
                console.error('Error fetching new arrivals:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProducts();
    }, [supabase]);

    const categories = [
        { key: 'clothing', name: t('categories.clothing'), image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCh0FGkmosPlESTAez7toDDNAYxLu9G6XjJaJD_7eodx9F00yugRYI1CniccQl92UCMUCX4c5hq8XxbvnEVfXOrEM-aXk1yCXgxTneNJXgyvIB-5FOXyEAKs43o9DfZxYJ8EZchD7ScK2Kwib_t6XZ-abQtC-rI8XYdRnvcuW0HqFCsR9dG5yVwhgdgVICNOlsQsi97FN0SxQJ1NXlNTpCONGxWgKHTxX3fFEbyaqsLmBZhWdbSIvcwrH2nSJRwB-Ug8D1-Z3Ubr1A' },
        { key: 'shoes', name: t('categories.shoes'), image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLZSM9zJ1L3m1rsenjDysQRDLMNCwlyRiu3Gq7JZWVrGznqqTT6n0j696Swk2pPKDtxoDWcuu2QRlXiFCKCtwu-wXz9Dj6NGgoOZ0zRXsTN4ibEPIaA9WBEdWjyA4F7loGTbIilW48xWjEjlp8JoAW4KrlHwjt-ILlWHyivjv4XrpKlA82YH0hyWD9FgkBQQkYB09CAJtElpGWReLSz2Rp8JMfblKW1m4NrGaiLCFLKwLwX7yNPEKCYkwEDqDF92yobpNdmRgrncE' },
        { key: 'accessories', name: t('categories.accessories'), image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBaMqU0SQcGOPGwl0joR2LAzeL3LAr9jIkYfozeMDgqm0ZY_DA5Z1XaWUPenYeHbFHagXu45YIBSE_FsAHQv5bTu_orlYE5JneG67E62JQHrWwcjFLKeA03sonFLSG8L9yVmarKWQxe2kjWRZBG2FujyZ-s-BVdPvcgwCLpsThPhMDtjeCL13u_uuj0FvAq5pewqv2bYWGlD5uIx3YnwJzcX2emonHJwyj5euw1K-L7HMU4SRAGfMkfouHwIuS1Ht3hjmfeb7f3y2A' },
    ];

    const stores = [
        { name: t('home.store.fashionHub'), rating: '4.5', reviews: '120', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCUaNZjUCPeA4HEQfaWg7NC62ewS94Ixesfk7QT0hjcyDfv_8_riFQR7cNJ4O9CAlAxPAQkt6W8ObHbv4D8HpHvKGmTyOCUQ9Mv10G7tA6HopVeUEYLrKQXuC4yzgGm5uIqQLVM2hSWX8GEF_d8c8iB3_HhITjMhLXqGXGrnB82rZV2Fudt89e7LVIunwhyeISepgdhr8LgMwt1OS6QuF5B1YL1R0shKzDwUWLmoJYr6IAtr2NUd9cXbYs6k9PhZC8QHM4KwxWFXjo' },
        { name: t('home.store.footwearEmporium'), rating: '4.2', reviews: '85', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJ92JDGlRH4MBOJxP_pTcWpxKslDaAFpjFdJ9QpFfX6FueQZxzI73wI23UtFUJqD5JNonXRVa9os1UqN2iTLmmcNMM6uaFyzxFI2oJMJCYXdYiYwSSHoYUPNUf2vzt_bMEbv0piVvmC2we5FuH2qn-U5QtD_KeQCFECWIxNgDiMBiqEv6LafOQHSy45BO_JEXKddz9_E3A9ieJO-tZO7XX76q8rmLTYhKEq1q2a_IN2y6vwHOXjTsqK9R9uXYO_u-GBiBI5j9wq4U' },
        { name: t('home.store.accessoryHaven'), rating: '4.8', reviews: '150', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQQxedAx8M4BMdIUclm1ysr3wrGPV9iWYVdJNiYQLJSRrWz4oEXBRQyTZSDs6KZJ-aifKAABKl2bUzpZoK1EEDE0K_GqcGLyFhyZCeCNDJQgmmKWT6s9yzedTz1ymqYfbqPZ4R3vb1XdFgqPjOUtesW8S9K_pC8WH1swbsjP3NT6HI5AGp45V4AOjsgM4y2NBrGypBzAgG9Iy73ds8JnY4_nUw3Yha173TzQXLVkEDvPRtS9XL6K1z76fnAfxCxYqSzVyFg_pi7N4' },
    ];

    return (
        <div
            className="relative flex h-auto min-h-screen w-full flex-col bg-background-light justify-between overflow-x-hidden"
            style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}
        >
            <div>
                {/* Hero Banner */}
                <div className="@container px-4 pt-3">
                    <div>
                        <div
                            className="bg-cover bg-center flex flex-col justify-end overflow-hidden bg-background-light rounded-2xl min-h-[218px]"
                            style={{
                                backgroundImage: `linear-gradient(0deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0) 25%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuCw5nivGPYrZWcARh3zC1c4M4EV0erj_yXcnwuI8wQZI02tFJ4q1VmK4C4pdGm4dR5RzPIXo8GJwrCmso6bgC_koxwT9ejvXt04jTwIb-ulbn_nWH0t-VEcscxpN6SbRNP7Ka6GMNXz3XfWnj1WBPetENxGEodJ2qT40pPFFZvBK2cAYvJaNsgCqHKRgcLR6IMZImJ_6t3XY6XQiKOnV2kdyOk5w5NTm3Cf6nkY_N4QucWWlb2C7pdXUISy8c6og_sL0NKXigdn0wY")`
                            }}
                        >
                            <div className="flex justify-center gap-2 p-5">
                                <div className="size-1.5 rounded-full bg-card-light"></div>
                                <div className="size-1.5 rounded-full bg-card-light opacity-50"></div>
                                <div className="size-1.5 rounded-full bg-card-light opacity-50"></div>
                                <div className="size-1.5 rounded-full bg-card-light opacity-50"></div>
                                <div className="size-1.5 rounded-full bg-card-light opacity-50"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Categories */}
                <h3 className="text-text-light-primary text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">{t('categories.title')}</h3>
                <div className="flex overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <div className="flex items-stretch p-4 gap-8">
                        {categories.map((category) => (
                            <Link
                                href={`/stores?category=${category.key}`}
                                key={category.key}
                                className="flex h-full flex-1 flex-col gap-4 text-center rounded-lg min-w-32 pt-4 cursor-pointer hover:opacity-80 transition-opacity"
                            >
                                <div
                                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full flex flex-col self-center w-full"
                                    style={{ backgroundImage: `url("${category.image}")` }}
                                ></div>
                                <p className="text-text-light-primary text-base font-medium leading-normal">{category.name}</p>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Featured Stores */}
                <h3 className="text-text-light-primary text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">{t('home.featuredStores')}</h3>
                <div className="flex overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <div className="flex items-stretch p-4 gap-3">
                        {stores.map((store) => (
                            <div key={store.name} className="flex h-full flex-1 flex-col gap-4 rounded-lg min-w-40">
                                <div
                                    className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl flex flex-col"
                                    style={{ backgroundImage: `url("${store.image}")` }}
                                ></div>
                                <div>
                                    <p className="text-text-light-primary text-base font-medium leading-normal">{store.name}</p>
                                    <p className="text-[#4c739a] text-sm font-normal leading-normal">{store.rating} • {store.reviews} {t('home.reviews')}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* New Arrivals */}
                <h3 className="text-text-light-primary text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">{t('home.newArrivals')}</h3>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(158px,1fr))] gap-3 p-4">
                    {isLoading ? (
                        <div className="col-span-full text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        </div>
                    ) : newArrivals.length === 0 ? (
                        <div className="col-span-full text-center py-8 text-text-light-secondary">
                            {t('home.noNewArrivals')}
                        </div>
                    ) : (
                        newArrivals.map((product) => (
                            <Link
                                key={product.id}
                                href={`/products/${product.id}`}
                                className="flex flex-col gap-3 pb-3 group relative"
                            >
                                <div className="aspect-[3/4] w-full relative bg-card-light rounded-xl overflow-hidden">
                                    {product.image_urls && product.image_urls.length > 0 ? (
                                        <img
                                            alt={product.name}
                                            src={product.image_urls[0]}
                                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="material-symbols-outlined text-4xl text-text-light-secondary">image</span>
                                        </div>
                                    )}
                                    {/* Reuse WishlistButton here */}
                                    <WishlistButton
                                        productId={product.id}
                                        className="absolute top-2 right-2 z-10"
                                    />
                                </div>
                                <div>
                                    <p className="text-text-light-primary text-base font-medium leading-normal line-clamp-1">{product.name}</p>
                                    <p className="text-[#4c739a] text-sm font-normal leading-normal">{t('common.egp')} {product.price.toFixed(2)}</p>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
