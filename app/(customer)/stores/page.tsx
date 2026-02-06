'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import StoreWishlistButton from '@/components/StoreWishlistButton';
import type { Store } from '@/lib/types';

function DiscoverStoresContent() {
 const searchParams = useSearchParams();
 const initialCategory = searchParams.get('category');
 console.log('Initial Category from URL:', initialCategory);

 const [activeCategory, setActiveCategory] = useState(initialCategory || 'All');
 const [searchQuery, setSearchQuery] = useState('');
 const [stores, setStores] = useState<Store[]>([]);
 const [filteredStores, setFilteredStores] = useState<Store[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [sortBy, setSortBy] = useState<'name' | 'newest'>('newest');

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
 console.log('Fetching stores from database...');
 const { data, error } = await supabase
 .from('stores')
 .select('*')
 .order('created_at', { ascending: false });

 console.log('Stores query result:', { data, error });

 if (error) {
 console.error('Supabase error:', error);
 throw error;
 }

 if (data) {
 console.log(`Found ${data.length} stores`);
 setStores(data);
 setFilteredStores(data);
 } else {
 console.log('No data returned from query');
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

 // Get unique categories from stores
 const categories = ['All', ...Array.from(new Set(stores.map(store => store.category).filter(Boolean)))];

 // Filter and sort stores
 useEffect(() => {
 let filtered = [...stores];

 // Filter by category
 if (activeCategory !== 'All') {
 filtered = filtered.filter(store =>
 store.category?.toLowerCase() === activeCategory.toLowerCase()
 );
 console.log(`Filtering for category: ${activeCategory}. Found ${filtered.length} stores.`);
 }

 // Filter by search query
 if (searchQuery) {
 filtered = filtered.filter(store =>
 store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
 store.description?.toLowerCase().includes(searchQuery.toLowerCase())
 );
 }

 // Sort
 if (sortBy === 'name') {
 filtered.sort((a, b) => a.name.localeCompare(b.name));
 } else {
 filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
 }

 setFilteredStores(filtered);
 }, [activeCategory, searchQuery, sortBy, stores]);

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
 <div className="sticky top-0 z-50 bg-background-light/95 /95 backdrop-blur-sm border-b border-border-light/50/50 p-4">
 <h1 className="text-2xl font-bold text-text-light-primary mb-3">Discover Stores</h1>

 {/* Search Bar */}
 <div className="relative">
 <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-light-secondary">search</span>
 <input
 type="text"
 placeholder="Search stores..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background-light border border-border-light text-text-light-primary placeholder:text-text-light-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
 />
 </div>
 </div>

 {/* Filters Section */}
 <div className="sticky top-[120px] z-40 bg-background-light/95 /95 backdrop-blur-sm border-b border-border-light/50/50 pt-3 flex flex-col gap-3 pb-3">
 {/* Category Pills */}
 <div className="flex gap-3 px-5 overflow-x-auto no-scrollbar pb-1">
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
 className={`flex h-9 min-w-[60px] shrink-0 items-center justify-center rounded-full px-4 transition-transform active:scale-95 ${activeCategory === category
 ? 'bg-primary text-white shadow-md shadow-primary/20'
 : 'bg-card-light border border-border-light text-text-light-secondary'
 }`}
 >
 <p className="text-sm font-medium leading-normal">{category}</p>
 </button>
 ))}
 </div>

 {/* Sort & Filter Toolbar */}
 <div className="flex justify-between items-center px-5 pt-1">
 <button
 onClick={() => setSortBy(sortBy === 'newest' ? 'name' : 'newest')}
 className="flex items-center gap-2 text-primary font-bold text-sm bg-primary/20 px-3 py-2 rounded-lg hover:bg-primary/20 transition-colors"
 >
 <span className="material-symbols-outlined text-[20px]">sort</span>
 <span>Sort by: {sortBy === 'newest' ? 'Newest' : 'Name'}</span>
 </button>
 <div className="text-sm text-text-light-secondary">
 {filteredStores.length} {filteredStores.length === 1 ? 'store' : 'stores'}
 </div>
 </div>
 </div>

 {/* Main Content: Store List */}
 <main className="flex-1 overflow-y-auto px-5 py-4 space-y-5 pb-24">
 {filteredStores.length === 0 ? (
 <div className="text-center py-12">
 <span className="material-symbols-outlined text-6xl text-border-light mb-4">store</span>
 <p className="text-text-light-secondary">No stores found</p>
 <p className="text-sm text-text-light-secondary mt-2">Try adjusting your filters</p>
 </div>
 ) : (
 filteredStores.map((store) => (
 <div
 key={store.id}
 className="group bg-card-light/50 rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-border-light/50 hover:border-primary/30 transition-all"
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
 <StoreWishlistButton storeId={store.id} />
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
