'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';

import { useCartUI } from '@/context/CartUIContext';

export default function BottomNav() {
 const pathname = usePathname();
 const { openCart } = useCartUI();
 const [cartCount, setCartCount] = useState(0);

 // Hide BottomNav on merchant pages
 if (pathname.startsWith('/merchant')) {
 return null;
 }

 const supabase = useMemo(
 () =>
 createBrowserClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 ),
 []
 );

 // Fetch cart count
 useEffect(() => {
 const fetchCartCount = async () => {
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) {
 setCartCount(0);
 return;
 }

 const { data, error } = await supabase
 .from('cart_items')
 .select('quantity')
 .eq('user_id', user.id);

 if (!error && data) {
 const total = data.reduce((sum, item) => sum + item.quantity, 0);
 setCartCount(total);
 }
 };

 fetchCartCount();

 // Refresh cart count every 5 seconds
 const interval = setInterval(fetchCartCount, 5000);
 return () => clearInterval(interval);
 }, [supabase]);

 // Helper function for active/inactive styles
 const getItemStyles = (path: string) => {
 const isActive = pathname === path;
 return {
 link: `flex flex-1 flex-col items-center justify-end gap-1 ${isActive ? 'text-primary' : 'text-text-light-secondary'}`,
 icon: `flex h-8 items-center justify-center ${isActive ? 'text-primary' : 'text-text-light-secondary'}`,
 text: `text-xs font-medium leading-normal tracking-[0.015em] ${isActive ? 'text-primary' : 'text-text-light-secondary'}`
 };
 };

 const homeStyles = getItemStyles('/');
 const categoriesStyles = getItemStyles('/categories');
 const profileStyles = getItemStyles('/profile');
 const inactiveStyles = {
 link: 'flex flex-1 flex-col items-center justify-end gap-1 text-text-light-secondary',
 icon: 'flex h-8 items-center justify-center text-text-light-secondary',
 text: 'text-xs font-medium leading-normal tracking-[0.015em] text-text-light-secondary'
 };

 return (
 <div className="fixed bottom-0 left-0 right-0 z-50 bg-background-light/95 backdrop-blur border-t border-border-light">
 <div className="flex gap-2 px-4 py-2">
 <Link className={homeStyles.link} href="/">
 <div className={homeStyles.icon} data-icon="House"data-size="24px"data-weight="fill">
 <svg xmlns="http://www.w3.org/2000/svg"width="24px"height="24px"fill="currentColor"viewBox="0 0 256 256">
 <path d="M224,115.55V208a16,16,0,0,1-16,16H168a16,16,0,0,1-16-16V168a8,8,0,0,0-8-8H112a8,8,0,0,0-8,8v40a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V115.55a16,16,0,0,1,5.17-11.78l80-75.48.11-.11a16,16,0,0,1,21.53,0,1.14,1.14,0,0,0,.11.11l80,75.48A16,16,0,0,1,224,115.55Z"></path>
 </svg>
 </div>
 <p className={homeStyles.text}>Home</p>
 </Link>
 <Link className={getItemStyles('/stores').link} href="/stores">
 <div className={getItemStyles('/stores').icon} data-icon="Storefront"data-size="24px"data-weight="regular">
 <svg xmlns="http://www.w3.org/2000/svg"width="24px"height="24px"fill="currentColor"viewBox="0 0 256 256">
 <path d="M232,96l-20.69-51.73A16,16,0,0,0,196.44,32H59.56A16,16,0,0,0,44.69,44.27L24,96v112a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V96ZM40,96l19.56-48.91,1.15-.29H195.29l1.15.29L216,96v8H192a20,20,0,0,1-40,0H128a20,20,0,0,1-40,0H64a20,20,0,0,1-24,0V96Zm176,112H40V128.79a35.84,35.84,0,0,0,8,2.21,36,36,0,0,0,8,.8,20.1,20.1,0,0,0,19.6-16h24.8a20.1,20.1,0,0,0,19.6,16h16a20.1,20.1,0,0,0,19.6-16h24.8a20.1,20.1,0,0,0,19.6,16,36,36,0,0,0,8-.8,35.84,35.84,0,0,0,8-2.21V208Z"></path>
 </svg>
 </div>
 <p className={getItemStyles('/stores').text}>Stores</p>
 </Link>
 <Link className={categoriesStyles.link} href="/categories">
 <div className={categoriesStyles.icon} data-icon="ListBullets"data-size="24px"data-weight="regular">
 <svg xmlns="http://www.w3.org/2000/svg"width="24px"height="24px"fill="currentColor"viewBox="0 0 256 256">
 <path d="M80,64a8,8,0,0,1,8-8H216a8,8,0,0,1,0,16H88A8,8,0,0,1,80,64Zm136,56H88a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Zm0,64H88a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16ZM44,52A12,12,0,1,0,56,64,12,12,0,0,0,44,52Zm0,64a12,12,0,1,0,12,12A12,12,0,0,0,44,116Zm0,64a12,12,0,1,0,12,12A12,12,0,0,0,44,180Z"></path>
 </svg>
 </div>
 <p className={categoriesStyles.text}>Categories</p>
 </Link>
 <button
 className={inactiveStyles.link}
 onClick={openCart}
 >
 <div className={`${inactiveStyles.icon} relative`} data-icon="ShoppingCart"data-size="24px"data-weight="regular">
 <svg xmlns="http://www.w3.org/2000/svg"width="24px"height="24px"fill="currentColor"viewBox="0 0 256 256">
 <path d="M222.14,58.87A8,8,0,0,0,216,56H54.68L49.79,29.14A16,16,0,0,0,34.05,16H16a8,8,0,0,0,0,16h18L59.56,172.29a24,24,0,0,0,5.33,11.27,28,28,0,1,0,44.4,8.44h45.42A27.75,27.75,0,0,0,152,204a28,28,0,1,0,28-28H83.17a8,8,0,0,1-7.87-6.57L72.13,152h116a24,24,0,0,0,23.61-19.71l12.16-66.86A8,8,0,0,0,222.14,58.87ZM96,204a12,12,0,1,1-12-12A12,12,0,0,1,96,204Zm96,0a12,12,0,1,1-12-12A12,12,0,0,1,192,204Zm4-74.57A8,8,0,0,1,188.1,136H69.22L57.59,72H206.41Z"></path>
 </svg>
 {cartCount > 0 && (
 <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
 {cartCount > 9 ? '9+' : cartCount}
 </span>
 )}
 </div>
 <p className={inactiveStyles.text}>Cart</p>
 </button>
 <Link className={inactiveStyles.link} href="/saved">
 <div className={inactiveStyles.icon} data-icon="Heart"data-size="24px"data-weight="regular">
 <svg xmlns="http://www.w3.org/2000/svg"width="24px"height="24px"fill="currentColor"viewBox="0 0 256 256">
 <path d="M178,32c-20.65,0-38.73,8.88-50,23.89C116.73,40.88,98.65,32,78,32A62.07,62.07,0,0,0,16,94c0,70,103.79,126.66,108.21,129a8,8,0,0,0,7.58,0C136.21,220.66,240,164,240,94A62.07,62.07,0,0,0,178,32ZM128,206.8C109.74,196.16,32,147.69,32,94A46.06,46.06,0,0,1,78,48c19.45,0,35.78,10.36,42.6,27a8,8,0,0,0,14.8,0c6.82-16.67,23.15-27,42.6-27a46.06,46.06,0,0,1,46,46C224,147.61,146.24,196.15,128,206.8Z"></path>
 </svg>
 </div>
 <p className={inactiveStyles.text}>Wishlist</p>
 </Link>
 <Link className={profileStyles.link} href="/profile">
 <div className={profileStyles.icon} data-icon="User"data-size="24px"data-weight="regular">
 <svg xmlns="http://www.w3.org/2000/svg"width="24px"height="24px"fill="currentColor"viewBox="0 0 256 256">
 <path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"></path>
 </svg>
 </div>
 <p className={profileStyles.text}>Profile</p>
 </Link>
 </div>
 </div>
 );
}
