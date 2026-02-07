'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import type { Product } from '@/lib/types';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function WishlistPage() {
 const router = useRouter();
 const { t } = useLanguage();
 const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
 const [isLoading, setIsLoading] = useState(true);

 const supabase = useMemo(
 () =>
 createBrowserClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 ),
 []
 );

 // Fetch wishlist items
 useEffect(() => {
 const fetchWishlist = async () => {
 try {
 const { data: { user } } = await supabase.auth.getUser();

 if (!user) {
 router.push('/login');
 return;
 }

 const { data, error } = await supabase
 .from('wishlist')
 .select('*, products(*)')
 .eq('user_id', user.id);

 if (error) throw error;

 // Extract products from the joined query
 // Using any here because Supabase types might be tricky with joins
 const products = data
 ?.map((item: any) => item.products)
 .filter(Boolean) as Product[];

 setWishlistItems(products || []);
 } catch (error) {
 console.error('Error fetching wishlist:', error);
 } finally {
 setIsLoading(false);
 }
 };

 fetchWishlist();
 }, [supabase, router]);

 const removeFromWishlist = async (productId: string) => {
 try {
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return;

 const { error } = await supabase
 .from('wishlist')
 .delete()
 .eq('user_id', user.id)
 .eq('product_id', productId);

 if (error) throw error;

 // Update UI
 setWishlistItems(prev => prev.filter(item => item.id !== productId));
 } catch (error) {
 console.error('Error removing from wishlist:', error);
 }
 };

 if (isLoading) {
 return (
 <div className="flex items-center justify-center min-h-screen bg-background-light">
 <div className="text-center">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
 <p className="mt-4 text-text-light-secondary">{t('wishlist.loading')}</p>
 </div>
 </div>
 );
 }

 return (
 <div className="max-w-md mx-auto min-h-screen bg-background-light shadow-2xl relative overflow-hidden flex flex-col transition-colors duration-200">
 {/* Header */}
 <div className="sticky top-0 z-50 bg-background-light/95 /95 backdrop-blur-sm border-b border-border-light/50/50 p-4 flex items-center gap-4">
 <button
 onClick={() => router.back()}
 className="flex items-center justify-center p-2 rounded-full hover:bg-card-light transition-colors"
 >
 <span className="material-symbols-outlined text-text-light-primary">arrow_back</span>
 </button>
 <h1 className="text-xl font-bold text-text-light-primary">{t('wishlist.title')}</h1>
 <div className="flex-1"></div>
 <div className="text-sm font-medium text-text-light-secondary">
 {wishlistItems.length} {t('wishlist.items')}
 </div>
 </div>

 {/* Content */}
 <main className="flex-1 p-4 pb-24">
 {wishlistItems.length === 0 ? (
 <div className="flex flex-col items-center justify-center h-[60vh] text-center">
 <div className="w-20 h-20 bg-background-light rounded-full flex items-center justify-center mb-4">
 <span className="material-symbols-outlined text-4xl text-text-light-secondary">favorite_border</span>
 </div>
 <h2 className="text-lg font-bold text-text-light-primary mb-2">{t('wishlist.empty')}</h2>
 <p className="text-text-light-secondary mb-6 max-w-xs">
 {t('wishlist.emptyMessage')}
 </p>
 <Link
 href="/stores"
 className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors active:scale-95"
 >
 {t('wishlist.exploreStores')}
 </Link>
 </div>
 ) : (
 <div className="grid grid-cols-2 gap-4">
 {wishlistItems.map((product) => (
 <Link
 key={product.id}
 href={`/products/${product.id}`}
 className="group flex flex-col bg-card-light/50 border border-border-light/50/50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer relative"
 >
 <div className="aspect-[3/4] w-full relative bg-card-light">
 {product.image_urls && product.image_urls.length > 0 ? (
 <img
 alt={product.name}
 className="w-full h-full object-cover"
 src={product.image_urls[0]}
 />
 ) : (
 <div className="w-full h-full flex items-center justify-center">
 <span className="material-symbols-outlined text-6xl text-text-light-secondary">image</span>
 </div>
 )}
 <button
 onClick={(e) => {
 e.preventDefault();
 e.stopPropagation();
 removeFromWishlist(product.id);
 }}
 className="absolute top-2 right-2 p-1.5 rounded-full bg-card-light/80 backdrop-blur-sm text-red-500 hover:bg-surface-light transition-colors"
 >
 <span className="material-symbols-outlined text-[20px] fill-current">favorite</span>
 </button>
 </div>
 <div className="p-3 flex flex-col gap-1 flex-1">
 <h3 className="text-sm font-medium text-text-light-primary line-clamp-2 leading-tight">
 {product.name}
 </h3>
 <div className="mt-auto pt-2 flex items-center justify-between">
 <span className="text-base font-bold text-text-light-primary">
 {t('common.egp')} {product.price.toFixed(2)}
 </span>
 </div>
 </div>
 </Link>
 ))}
 </div>
 )}
 </main>
 </div>
 );
}
