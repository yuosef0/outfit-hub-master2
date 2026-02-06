'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { usePathname } from 'next/navigation';

export default function Header() {
 const pathname = usePathname();
 const [userGovernorate, setUserGovernorate] = useState<string>('Cairo, Egypt');
 const [isLoading, setIsLoading] = useState(true);

 // Hide Header on merchant pages
 if (pathname.startsWith('/merchant')) {
 return null;
 }

 useEffect(() => {
 const fetchUserGovernorate = async () => {
 try {
 const supabase = createBrowserClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 );

 const { data: { user } } = await supabase.auth.getUser();

 if (user) {
 const { data: userData } = await supabase
 .from('users')
 .select('governorate')
 .eq('id', user.id)
 .single();

 if (userData?.governorate) {
 setUserGovernorate(`${userData.governorate}, Egypt`);
 }
 }
 } catch (error) {
 console.error('Error fetching governorate:', error);
 } finally {
 setIsLoading(false);
 }
 };

 fetchUserGovernorate();
 }, []);

 return (
 <header
 className="relative z-50 border-b bg-background-light border-border-light"
 >
 <div className="flex items-center p-4 pb-2 justify-between gap-2">
 {/* Location Selector */}
 <div className="flex items-center gap-1 flex-1 cursor-pointer group">
 <span className="material-symbols-outlined text-primary group-hover:opacity-80 transition-opacity"style={{ fontSize: '20px' }}>location_on</span>
 <h2 className="text-text-light-primary text-sm font-bold leading-tight">
 {isLoading ? 'Loading...' : userGovernorate}
 </h2>
 <span className="material-symbols-outlined text-text-light-secondary group-hover:text-primary transition-colors"style={{ fontSize: '18px' }}>expand_more</span>
 </div>

 <div className="flex items-center gap-3">
 {/* Language Toggle */}
 <div className="flex border border-border-light rounded-full p-0.5 bg-card-light">
 <button className="px-3 py-1 text-[10px] font-bold bg-primary rounded-full shadow-sm text-white transition-all">EN</button>
 <button className="px-3 py-1 text-[10px] font-bold text-text-light-secondary hover:text-text-light-primary transition-colors">AR</button>
 </div>

 {/* Notifications */}
 <button className="relative flex items-center justify-center h-10 w-10 rounded-full bg-card-light text-text-light-primary hover:bg-card-dark transition-colors border border-border-light">
 <span className="material-symbols-outlined"style={{ fontSize: '24px' }}>notifications</span>
 <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-background-light"></span>
 </button>
 </div>
 </div>


 </header>
 );
}
