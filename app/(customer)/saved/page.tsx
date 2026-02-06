'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import type { Product, Store } from '@/lib/types';
import WishlistButton from '@/components/WishlistButton';

export default function SavedPage() {
 const [activeTab, setActiveTab] = useState<'products' | 'stores'>('products');
 const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
 const [wishlistStores, setWishlistStores] = useState<Store[]>([]);
 const [isLoading, setIsLoading] = useState(true);

 const supabase = useMemo(
 () =>
 createBrowserClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 ),
 []
 );

 useEffect(() => {
 fetchWishlist();
 }, [supabase]);

 const fetchWishlist = async () => {
 try {
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) {
 setIsLoading(false);
 return;
 }

 // Fetch wishlist products
 const { data: productsData } = await supabase
 .from('wishlist')
 .select(`
 id,
 created_at,
 products:product_id (
 *,
 stores:store_id (
 id,
 name,
 logo_url
 )
 )
 `)
 .eq('user_id', user.id)
 .order('created_at', { ascending: false });

 if (productsData) {
 const products = productsData
 .filter(item => item.products)
 .map(item => item.products) as unknown as Product[];
 setWishlistProducts(products);
 }

 // Fetch wishlist stores
 const { data: storesData } = await supabase
 .from('wishlist_stores')
 .select(`
 id,
 created_at,
 stores:store_id (*)
 `)
 .eq('user_id', user.id)
 .order('created_at', { ascending: false });

 if (storesData) {
 const stores = storesData
 .filter(item => item.stores)
 .map(item => item.stores) as unknown as Store[];
 setWishlistStores(stores);
 }
 } catch (error) {
 console.error('Error fetching wishlist:', error);
 } finally {
 setIsLoading(false);
 }
 };

 const removeStore = async (storeId: string) => {
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return;

 await supabase
 .from('wishlist_stores')
 .delete()
 .eq('user_id', user.id)
 .eq('store_id', storeId);

 setWishlistStores(prev => prev.filter(store => store.id !== storeId));
 };

 if (isLoading) {
 return (
 <div className="flex items-center justify-center min-h-screen bg-background-light">
 <div className="text-center">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
 <p className="mt-4 text-text-light-secondary">Loading...</p>
 </div>
 </div>
 );
 }

 const isEmpty = wishlistProducts.length === 0 && wishlistStores.length === 0;

 return (
 <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden pb-20 bg-background-light text-text-light-primary">
 {/* Header */}
 <div className="sticky top-0 z-50 bg-background-light/95 /95 backdrop-blur-sm border-b border-border-light/50/50 p-4">
 <h1 className="text-2xl font-bold text-text-light-primary">Saved Items</h1>
 </div>

 {isEmpty ? (
 <div className="flex flex-col items-center justify-center flex-1 px-6 py-12">
 <div className="w-32 h-32 mb-6 flex items-center justify-center bg-background-light rounded-full">
 <span className="material-symbols-outlined text-6xl text-text-light-secondary">favorite</span>
 </div>
 <h2 className="text-xl font-bold text-text-light-primary mb-2">No saved items yet</h2>
 <p className="text-text-light-secondary text-center mb-6">
 Start saving your favorite products and stores
 </p>
 <Link
 href="/"
 className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
 >
 Explore Now
 </Link>
 </div>
 ) : (
 <>
 {/* Tabs */}
 <div className="sticky top-[72px] z-40 bg-background-light border-b border-border-light/50/50 px-4">
 <div className="flex gap-6">
 <button
 onClick={() => setActiveTab('products')}
 className={`py-3 px-1 font-semibold text-sm relative transition-colors ${activeTab === 'products'
 ? 'text-primary'
 : 'text-text-light-secondary hover:text-text-light-primary'
 }`}
 >
 Products ({wishlistProducts.length})
 {activeTab === 'products' && (
 <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
 )}
 </button>
 <button
 onClick={() => setActiveTab('stores')}
 className={`py-3 px-1 font-semibold text-sm relative transition-colors ${activeTab === 'stores'
 ? 'text-primary'
 : 'text-text-light-secondary hover:text-text-light-primary'
 }`}
 >
 Stores ({wishlistStores.length})
 {activeTab === 'stores' && (
 <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
 )}
 </button>
 </div>
 </div>

 {/* Content */}
 <main className="flex-1 p-4">
 {activeTab === 'products' ? (
 wishlistProducts.length === 0 ? (
 <div className="text-center py-12">
 <p className="text-text-light-secondary">No saved products</p>
 </div>
 ) : (
 <div className="grid grid-cols-2 gap-4">
 {wishlistProducts.map((product) => (
 <Link
 key={product.id}
 href={`/products/${product.id}`}
 className="group relative flex flex-col gap-3 rounded-2xl bg-card-light p-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-border-light transition-all active:scale-95 duration-200"
 >
 <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-background-light ">
 <img
 alt={product.name}
 className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
 src={product.image_urls?.[0] || 'https://via.placeholder.com/300x400'}
 />
 <div className="absolute top-2 right-2">
 <WishlistButton
 productId={product.id}
 className="!bg-card-light/90"
 />
 </div>
 </div>
 <div className="flex flex-col px-1 pb-1">
 <h3 className="text-sm font-semibold text-text-light-primary leading-tight line-clamp-2">
 {product.name}
 </h3>
 <p className="text-xs font-medium text-text-light-secondary mt-1">
 ${product.price.toFixed(2)}
 </p>
 {product.stores && (
 <p className="text-xs text-text-light-secondary mt-0.5">
 {product.stores.name}
 </p>
 )}
 </div>
 </Link>
 ))}
 </div>
 )
 ) : (
 wishlistStores.length === 0 ? (
 <div className="text-center py-12">
 <p className="text-text-light-secondary">No saved stores</p>
 </div>
 ) : (
 <div className="space-y-4">
 {wishlistStores.map((store) => (
 <div
 key={store.id}
 className="bg-card-light/50 rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-border-light/50"
 >
 <div className="flex gap-4 mb-3">
 <div className="w-16 h-16 shrink-0 rounded-xl bg-card-light flex items-center justify-center overflow-hidden border border-gray-100 ">
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
 <h3 className="text-text-light-primary text-lg font-bold leading-tight">
 {store.name}
 </h3>
 {store.category && (
 <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-card-light text-text-light-secondary mt-1">
 {store.category}
 </span>
 )}
 </div>
 <button
 onClick={() => removeStore(store.id)}
 className="text-text-light-secondary hover:text-red-500 transition-colors"
 >
 <span className="material-symbols-outlined text-[20px]">delete</span>
 </button>
 </div>
 </div>
 </div>
 {store.description && (
 <p className="text-text-light-secondary text-sm leading-relaxed line-clamp-2 mb-4">
 {store.description}
 </p>
 )}
 <Link
 href={`/stores/${store.id}`}
 className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-primary/20 text-primary font-semibold text-sm hover:bg-primary hover:text-white transition-all active:scale-[0.98]"
 >
 View Store
 </Link>
 </div>
 ))}
 </div>
 )
 )}
 </main>
 </>
 )}
 </div>
 );
}
