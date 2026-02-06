'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface StoreWishlistButtonProps {
 storeId: string;
 className?: string;
}

export default function StoreWishlistButton({ storeId, className = '' }: StoreWishlistButtonProps) {
 const [isInWishlist, setIsInWishlist] = useState(false);
 const [isLoading, setIsLoading] = useState(false);
 const [isAuthenticated, setIsAuthenticated] = useState(false);

 const supabase = createBrowserClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 );

 useEffect(() => {
 checkWishlistStatus();
 }, [storeId]);

 const checkWishlistStatus = async () => {
 const { data: { user } } = await supabase.auth.getUser();
 if (user) {
 setIsAuthenticated(true);
 const { data } = await supabase
 .from('wishlist_stores')
 .select('id')
 .eq('user_id', user.id)
 .eq('store_id', storeId)
 .maybeSingle();

 setIsInWishlist(!!data);
 }
 };

 const toggleWishlist = async (e: React.MouseEvent) => {
 e.preventDefault();
 e.stopPropagation();

 if (!isAuthenticated) {
 alert('Please login to save stores to wishlist');
 return;
 }

 if (isLoading) return;
 setIsLoading(true);

 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return;

 try {
 if (isInWishlist) {
 // Remove
 const { error } = await supabase
 .from('wishlist_stores')
 .delete()
 .eq('user_id', user.id)
 .eq('store_id', storeId);

 if (!error) setIsInWishlist(false);
 } else {
 // Add
 const { error } = await supabase
 .from('wishlist_stores')
 .insert({
 user_id: user.id,
 store_id: storeId
 });

 if (!error) setIsInWishlist(true);
 }
 } catch (error) {
 console.error('Error toggling store wishlist:', error);
 } finally {
 setIsLoading(false);
 }
 };

 return (
 <button
 onClick={toggleWishlist}
 className={`p-1.5 rounded-full backdrop-blur-sm transition-all duration-200 active:scale-95 flex items-center justify-center ${isInWishlist
 ? 'bg-rose-900/30 text-rose-500'
 : 'bg-card-light/80 text-text-light-secondary hover:text-rose-500'
 } ${className}`}
 disabled={isLoading}
 >
 <span
 className={`material-symbols-outlined text-[20px] transition-transform duration-150 ${isInWishlist ? 'fill-current scale-110' : ''}`}
 style={{ fontVariationSettings: isInWishlist ? "'FILL' 1": "'FILL' 0"}}
 >
 favorite
 </span>
 </button>
 );
}
