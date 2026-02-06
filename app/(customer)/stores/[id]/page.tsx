'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import type { Store, Product } from '@/lib/types';
import WishlistButton from '@/components/WishlistButton';

interface StoreCategory {
    id: string;
    name: string;
    name_ar: string | null;
    display_order: number;
}

export default function StoreProfilePage() {
    const router = useRouter();
    const params = useParams();
    const storeId = params.id as string;

    const [activeTab, setActiveTab] = useState('Products');
    const [store, setStore] = useState<Store | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<StoreCategory[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const supabase = useMemo(
        () =>
            createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            ),
        []
    );

    // Fetch store data
    useEffect(() => {
        const fetchStore = async () => {
            try {
                console.log('Fetching store with ID:', storeId);
                const { data, error } = await supabase
                    .from('stores')
                    .select('*')
                    .eq('id', storeId)
                    .maybeSingle();

                console.log('Store query result:', { data, error });

                if (error) {
                    console.error('Supabase error fetching store:', error.message);
                    throw error;
                }

                if (!data) {
                    console.log('Store not found');
                    setStore(null);
                    return;
                }

                setStore(data);
                console.log('Store set:', data.name);
            } catch (error: any) {
                console.error('Error fetching store:', error.message || error);
            }
        };

        if (storeId) {
            fetchStore();
        } else {
            console.log('No storeId in URL params');
        }
    }, [storeId, supabase]);

    // Fetch categories for this store
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data, error } = await supabase
                    .from('store_categories')
                    .select('id, name, name_ar, display_order')
                    .eq('store_id', storeId)
                    .eq('is_active', true)
                    .order('display_order', { ascending: true });

                if (error) {
                    console.error('Error fetching categories:', error);
                } else {
                    setCategories(data || []);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        if (storeId) {
            fetchCategories();
        }
    }, [storeId, supabase]);

    // Fetch products for this store
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                console.log('Fetching products for store:', storeId);
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('store_id', storeId)
                    .eq('is_active', true)
                    .order('created_at', { ascending: false });

                console.log('Products query result:', { data, error, count: data?.length });

                if (error) {
                    console.error('Supabase error fetching products:', error);
                    throw error;
                }

                setProducts(data || []);
                setFilteredProducts(data || []);
                console.log('Products set:', data?.length || 0);
            } catch (error) {
                console.error('Error fetching products:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (storeId) {
            fetchProducts();
        } else {
            console.log('No storeId provided');
            setIsLoading(false);
        }
    }, [storeId, supabase]);

    // Filter products
    useEffect(() => {
        let filtered = [...products];

        // Filter by category
        if (activeCategory) {
            filtered = filtered.filter(product => product.category === activeCategory);
        }

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(product =>
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredProducts(filtered);
    }, [searchQuery, activeCategory, products]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background-light">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-text-light-secondary">Loading store...</p>
                </div>
            </div>
        );
    }

    if (!store) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background-light">
                <div className="text-center">
                    <span className="material-symbols-outlined text-6xl text-border-light mb-4">store</span>
                    <p className="text-text-light-secondary">Store not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto bg-background-light shadow-xl overflow-hidden transition-colors duration-200">
            {/* Top App Bar */}
            <div className="sticky top-0 z-50 flex items-center bg-background-light/95/95 backdrop-blur-md p-4 justify-between border-b border-border-light">
                <button
                    onClick={() => router.back()}
                    className="text-[#0d121b] flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-surface-light transition-colors"
                >
                    <span className="material-symbols-outlined text-[24px]">arrow_back</span>
                </button>
                <h2 className="text-[#0d121b] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center truncate px-2">{store.name}</h2>
                <div className="flex w-10 items-center justify-end">
                    <button className="text-[#0d121b] flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-surface-light transition-colors">
                        <span className="material-symbols-outlined text-[24px]">more_vert</span>
                    </button>
                </div>
            </div>

            {/* Store Header Area */}
            <div className="flex flex-col w-full relative">
                {/* Cover Image */}
                <div className="w-full h-40 bg-surface-light relative overflow-hidden">
                    {store.banner_url ? (
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url('${store.banner_url}')` }}
                        ></div>
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5"></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                </div>

                {/* Profile Info & Logo */}
                <div className="px-4 relative pb-4">
                    <div className="flex justify-between items-end -mt-10 mb-3">
                        {/* Logo */}
                        <div className="relative">
                            <div className="h-24 w-24 rounded-full border-[4px] border-background-light bg-card-light overflow-hidden shadow-sm">
                                {store.logo_url ? (
                                    <img alt="Store Logo" className="w-full h-full object-cover" src={store.logo_url} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-card-light">
                                        <span className="material-symbols-outlined text-4xl text-text-light-secondary">store</span>
                                    </div>
                                )}
                            </div>
                            {/* Verified Badge */}
                            <div className="absolute bottom-1 right-1 bg-primary text-white rounded-full p-0.5 border-2 border-background-light flex items-center justify-center" title="Verified Merchant">
                                <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                            </div>
                        </div>
                        {/* Follow Button */}
                        <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-sm transition-transform active:scale-95 h-10 mb-2">
                            <span>Follow</span>
                        </button>
                    </div>
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold text-text-light-primary">{store.name}</h1>
                        <div className="flex items-center gap-2 text-sm">
                            {store.category && (
                                <span className="px-2 py-0.5 rounded-md bg-card-light text-text-light-secondary font-medium text-xs border border-border-light">{store.category}</span>
                            )}
                            <div className="flex items-center gap-1 text-amber-500">
                                <span className="material-symbols-outlined text-[16px] fill-current">star</span>
                                <span className="font-bold text-text-light-primary">4.8</span>
                                <span className="text-text-light-secondary font-normal">(1.2k Reviews)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Bar (Actions) */}
            <div className="px-4 py-2">
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                    <style jsx>{`
 .no-scrollbar::-webkit-scrollbar {
 display: none;
 }
 .no-scrollbar {
 -ms-overflow-style: none;
 scrollbar-width: none;
 }
 `}</style>
                    {store.address && (
                        <div className="flex items-center gap-2 pl-1 pr-3 py-1.5 bg-card-light/50 rounded-lg border border-transparent hover:border-border-light transition-colors cursor-pointer shrink-0">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <span className="material-symbols-outlined text-[18px]">location_on</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-text-light-primary">{store.address}</span>
                                <span className="text-[10px] text-text-light-secondary">View on map</span>
                            </div>
                        </div>
                    )}
                    {store.phone && (
                        <div className="flex items-center gap-2 pl-1 pr-3 py-1.5 bg-card-light/50 rounded-lg border border-transparent hover:border-border-light transition-colors cursor-pointer shrink-0">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <span className="material-symbols-outlined text-[18px]">call</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-text-light-primary">Call Now</span>
                                <span className="text-[10px] text-text-light-secondary">{store.phone}</span>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-2 pl-1 pr-3 py-1.5 bg-card-light/50 rounded-lg border border-transparent hover:border-border-light transition-colors cursor-pointer shrink-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <span className="material-symbols-outlined text-[18px]">schedule</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-text-light-primary">Open</span>
                            <span className="text-[10px] text-text-light-secondary">Until 9 PM</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Tabs */}
            <div className="sticky top-[73px] z-40 bg-background-light border-b border-border-light">
                <div className="flex px-4">
                    <button
                        onClick={() => setActiveTab('Products')}
                        className={`flex-1 pb-3 pt-3 border-b-[3px] font-bold text-sm text-center relative transition-colors ${activeTab === 'Products' ? 'border-primary text-primary' : 'border-transparent text-text-light-secondary hover:text-text-light-primary'}`}
                    >
                        Products ({products.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('About')}
                        className={`flex-1 pb-3 pt-3 border-b-[3px] font-medium text-sm text-center transition-colors ${activeTab === 'About' ? 'border-primary text-primary' : 'border-transparent text-text-light-secondary hover:text-text-light-primary'}`}
                    >
                        About
                    </button>
                    <button
                        onClick={() => setActiveTab('Reviews')}
                        className={`flex-1 pb-3 pt-3 border-b-[3px] font-medium text-sm text-center transition-colors ${activeTab === 'Reviews' ? 'border-primary text-primary' : 'border-transparent text-text-light-secondary hover:text-text-light-primary'}`}
                    >
                        Reviews
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col p-4 gap-5 min-h-[500px]">
                {activeTab === 'Products' && (
                    <>
                        {/* Search & Filter Controls */}
                        <div className="flex flex-col gap-4">
                            {/* Search Bar */}
                            <div className="relative w-full">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="material-symbols-outlined text-text-light-secondary">search</span>
                                </div>
                                <input
                                    className="block w-full rounded-xl border-none bg-card-light py-3 pl-10 pr-4 text-sm text-text-light-primary placeholder-gray-400 focus:ring-2 focus:ring-primary shadow-sm"
                                    placeholder={`Search in ${store.name}...`}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* Category Tabs (Horizontal Scrollable) */}
                            {categories.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                                    <style jsx>{`
 .no-scrollbar::-webkit-scrollbar {
 display: none;
 }
 .no-scrollbar {
 -ms-overflow-style: none;
 scrollbar-width: none;
 }
 `}</style>
                                    <button
                                        onClick={() => setActiveCategory(null)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all shrink-0 ${activeCategory === null
                                            ? 'bg-primary text-white shadow-sm'
                                            : 'bg-card-light text-text-light-secondary hover:bg-card-light'
                                            }`}
                                    >
                                        الكل
                                    </button>
                                    {categories.map((category) => (
                                        <button
                                            key={category.id}
                                            onClick={() => setActiveCategory(category.id)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all shrink-0 ${activeCategory === category.id
                                                ? 'bg-primary text-white shadow-sm'
                                                : 'bg-card-light text-text-light-secondary hover:bg-card-light'
                                                }`}
                                        >
                                            {category.name_ar || category.name}
                                        </button>
                                    ))}
                                </div>
                            )}


                        </div>

                        {/* Product Grid */}
                        {filteredProducts.length === 0 ? (
                            <div className="text-center py-12">
                                <span className="material-symbols-outlined text-6xl text-border-light mb-4">inventory_2</span>
                                <p className="text-text-light-secondary">No products found</p>
                                <p className="text-sm text-text-light-secondary mt-2">Try adjusting your filters</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 pb-20">
                                {filteredProducts.map((product) => (
                                    <Link key={product.id} href={`/products/${product.id}`} className="group flex flex-col bg-card-light/50 backdrop-blur-md border border-border-light/50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer">
                                        <div className="aspect-[3/4] w-full relative bg-card-light">
                                            {product.image_urls && product.image_urls.length > 0 ? (
                                                <img alt={product.name} className="w-full h-full object-cover" src={product.image_urls[0]} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-6xl text-text-light-secondary">image</span>
                                                </div>
                                            )}
                                            <WishlistButton
                                                productId={product.id}
                                                className="absolute top-2 right-2 z-10"
                                            />
                                            {product.stock_quantity === 0 && (
                                                <div className="absolute bottom-2 left-2 bg-red-500 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded">
                                                    SOLD OUT
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3 flex flex-col gap-1 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="text-sm font-medium text-text-light-primary line-clamp-2 leading-tight">{product.name}</h3>
                                            </div>
                                            <p className="text-xs text-text-light-secondary">{product.category}</p>
                                            <div className="mt-auto pt-2 flex items-center justify-between">
                                                <span className="text-base font-bold text-text-light-primary">EGP {product.price.toFixed(2)}</span>
                                                <button className="w-7 h-7 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90">
                                                    <span className="material-symbols-outlined text-[16px]">add</span>
                                                </button>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'About' && (
                    <div className="space-y-4 pb-20">
                        <div className="bg-card-light/50 rounded-xl p-4 border border-border-light">
                            <h3 className="font-bold text-text-light-primary mb-2">About {store.name}</h3>
                            <p className="text-text-light-secondary text-sm leading-relaxed">
                                {store.description || 'No description available.'}
                            </p>
                        </div>
                        {store.address && (
                            <div className="bg-card-light/50 rounded-xl p-4 border border-border-light">
                                <h3 className="font-bold text-text-light-primary mb-2">Location</h3>
                                <p className="text-text-light-secondary text-sm">{store.address}</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'Reviews' && (
                    <div className="text-center py-12">
                        <span className="material-symbols-outlined text-6xl text-border-light mb-4">rate_review</span>
                        <p className="text-text-light-secondary">No reviews yet</p>
                    </div>
                )}
            </main>
        </div>
    );
}
