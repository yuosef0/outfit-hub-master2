'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface WishlistButtonProps {
 productId: string;
 className?: string;
}

export default function WishlistButton({ productId, className = '' }: WishlistButtonProps) {
 const [isInWishlist, setIsInWishlist] = useState(false);
 const [isLoading, setIsLoading] = useState(false);
 const [isAuthenticated, setIsAuthenticated] = useState(false);
 const [isMounted, setIsMounted] = useState(false);

 const supabase = createBrowserClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 );

 useEffect(() => {
 setIsMounted(true);
 checkWishlistStatus();
 }, [productId]);

 const checkWishlistStatus = async () => {
 const { data: { user } } = await supabase.auth.getUser();
 if (user) {
 setIsAuthenticated(true);
 const { data } = await supabase
 .from('wishlist')
 .select('id')
 .eq('user_id', user.id)
 .eq('product_id', productId)
 .maybeSingle();

 setIsInWishlist(!!data);
 }
 };

 const toggleWishlist = async (e: React.MouseEvent) => {
 e.preventDefault();
 e.stopPropagation();

 if (!isAuthenticated) {
 // Usually redirect to login or show toast
 alert('Please login to save items to wishlist');
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
 .from('wishlist')
 .delete()
 .eq('user_id', user.id)
 .eq('product_id', productId);

 if (!error) setIsInWishlist(false);
 } else {
 // Add
 const { error } = await supabase
 .from('wishlist')
 .insert({
 user_id: user.id,
 product_id: productId
 });

 if (!error) setIsInWishlist(true);
 }
 } catch (error) {
 console.error('Error toggling wishlist:', error);
 } finally {
 setIsLoading(false);
 }
 };

 // Prevent hydration mismatch by not rendering until mounted
 if (!isMounted) {
 return (
 <button
 className={`p-1.5 rounded-full backdrop-blur-sm transition-all duration-200 flex items-center justify-center bg-card-light/80 text-text-light-secondary ${className}`}
 disabled
 >
 <span
 className="material-symbols-outlined text-[20px]"
 style={{ fontVariationSettings: "'FILL' 0"}}
 >
 favorite
 </span>
 </button>
 );
 }

 return (
 <button
 onClick={toggleWishlist}
 className={`p-1.5 rounded-full backdrop-blur-sm transition-all duration-200 active:scale-95 flex items-center justify-center ${isInWishlist
 ? 'bg-rose-50/10 text-rose-500'
 : 'bg-card-light/80 text-text-light-secondary hover:text-rose-400'
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
