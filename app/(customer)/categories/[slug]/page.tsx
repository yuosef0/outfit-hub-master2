'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import type { Store } from '@/lib/types';

export default function CategoryDetailPage() {
 const router = useRouter();
 const params = useParams();
 const slug = typeof params?.slug === 'string' ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : '';

 const [stores, setStores] = useState<Store[]>([]);
 const [filteredStores, setFilteredStores] = useState<Store[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');

 const supabase = useMemo(
 () =>
 createBrowserClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 ),
 []
 );

 // Fetch stores from database
 useEffect(() => {
 const fetchStores = async () => {
 try {
 const categoryName = slug.replace(/-/g, ' ');

 const { data, error } = await supabase
 .from('stores')
 .select('*')
 .eq('is_active', true)
 .ilike('category', `%${categoryName}%`)
 .order('created_at', { ascending: false });

 if (error) throw error;
 if (data) {
 setStores(data);
 setFilteredStores(data);
 }
 } catch (error) {
 console.error('Error fetching stores:', error);
 } finally {
 setIsLoading(false);
 }
 };

 if (slug) {
 fetchStores();
 }
 }, [slug, supabase]);

 // Filter stores by search query
 useEffect(() => {
 if (searchQuery) {
 const filtered = stores.filter(store =>
 store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
 store.description?.toLowerCase().includes(searchQuery.toLowerCase())
 );
 setFilteredStores(filtered);
 } else {
 setFilteredStores(stores);
 }
 }, [searchQuery, stores]);

 const displayTitle = slug
 ? slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
 : "Category";

 if (isLoading) {
 return (
 <div className="flex items-center justify-center min-h-screen bg-background-light">
 <div className="text-center">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
 <p className="mt-4 text-text-light-secondary">Loading stores...</p>
 </div>
 </div>
 );
 }

 return (
 <div className="max-w-md mx-auto min-h-screen bg-background-light shadow-2xl relative overflow-hidden flex flex-col transition-colors duration-200">
 {/* Header */}
 <div className="sticky top-0 z-50 bg-background-light/95/95 backdrop-blur-sm border-b border-border-light/50/50 p-4">
 <div className="flex items-center gap-3 mb-3">
 <button
 onClick={() => router.back()}
 className="flex size-10 items-center justify-center rounded-full hover:bg-card-light transition-colors"
 >
 <span className="material-symbols-outlined text-text-light-primary">arrow_back</span>
 </button>
 <h1 className="text-2xl font-bold text-text-light-primary flex-1">{displayTitle}</h1>
 </div>

 {/* Search Bar */}
 <div className="relative">
 <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-light-secondary">search</span>
 <input
 type="text"
 placeholder="Search stores..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card-light border border-border-light text-text-light-primary placeholder:text-text-light-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
 />
 </div>
 </div>

 {/* Store Count */}
 <div className="px-5 py-3 border-b border-border-light/50/50">
 <p className="text-sm text-text-light-secondary">
 {filteredStores.length} {filteredStores.length === 1 ? 'store' : 'stores'} found
 </p>
 </div>

 {/* Main Content: Store List */}
 <main className="flex-1 overflow-y-auto px-5 py-4 space-y-5 pb-24">
 {filteredStores.length === 0 ? (
 <div className="text-center py-12">
 <span className="material-symbols-outlined text-6xl text-border-light mb-4">store</span>
 <p className="text-text-light-secondary">No stores found in this category</p>
 <p className="text-sm text-text-light-secondary mt-2">Try browsing other categories</p>
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
 Premium
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
 View Store
 </Link>
 </div>
 ))
 )}
 </main>
 </div>
 );
}
