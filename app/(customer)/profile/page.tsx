'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { signOut } from '@/lib/auth';

interface UserData {
 id: string;
 email: string;
 full_name: string | null;
 avatar_url: string | null;
 role: 'customer' | 'merchant';
}

export default function ProfilePage() {
 const router = useRouter();
 const [user, setUser] = useState<UserData | null>(null);
 const [loading, setLoading] = useState(true);
 const [loggingOut, setLoggingOut] = useState(false);

 const supabase = createBrowserClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 );

 useEffect(() => {
 const fetchUserData = async () => {
 try {
 // Get authenticated user
 const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

 if (authError || !authUser) {
 router.push('/login');
 return;
 }

 // Get user data from database
 const { data: userData, error: dbError } = await supabase
 .from('users')
 .select('*')
 .eq('id', authUser.id)
 .maybeSingle();

 if (dbError) {
 console.error('Error fetching user data:', dbError);
 }

 // Set user data
 setUser({
 id: authUser.id,
 email: authUser.email || '',
 full_name: userData?.full_name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
 avatar_url: userData?.avatar_url || authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null,
 role: userData?.role || 'customer',
 });
 } catch (error) {
 console.error('Error in fetchUserData:', error);
 router.push('/login');
 } finally {
 setLoading(false);
 }
 };

 fetchUserData();
 }, [router, supabase]);

 const handleLogout = async () => {
 try {
 setLoggingOut(true);
 await signOut();
 router.push('/login');
 } catch (error) {
 console.error('Error logging out:', error);
 setLoggingOut(false);
 }
 };

 if (loading) {
 return (
 <div className="bg-background-light min-h-screen flex items-center justify-center pb-24">
 <div className="text-center">
 <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
 <p className="text-text-light-secondary">Loading profile...</p>
 </div>
 </div>
 );
 }

 if (!user) {
 return null;
 }

 return (
 <div className="bg-background-light min-h-screen flex flex-col pb-24">
 {/* Top App Bar */}
 <div className="sticky top-0 z-50 bg-background-light/80 /80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-border-light">
 <button
 onClick={() => router.back()}
 className="flex items-center justify-center p-2 rounded-full hover:bg-card-light transition-colors"
 >
 <span className="material-symbols-outlined text-text-light-primary">arrow_back</span>
 </button>
 <h1 className="text-lg font-bold text-center flex-1 pr-10">Profile</h1>
 </div>

 {/* Profile Header */}
 <div className="px-4 pt-6 pb-6">
 <div className="flex flex-col items-center gap-4">
 <div className="relative group cursor-pointer">
 {user.avatar_url ? (
 <div
 className="w-28 h-28 rounded-full bg-cover bg-center border-4 border-card-light shadow-md"
 style={{ backgroundImage: `url('${user.avatar_url}')` }}
 />
 ) : (
 <div className="w-28 h-28 rounded-full bg-primary/20 border-4 border-card-light shadow-md flex items-center justify-center">
 <span className="material-symbols-outlined text-6xl text-primary">person</span>
 </div>
 )}
 <div className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full border-4 border-background-light flex items-center justify-center shadow-sm">
 <span className="material-symbols-outlined text-[16px]">edit</span>
 </div>
 </div>
 <div className="text-center space-y-1">
 <h2 className="text-2xl font-bold text-text-light-primary">
 {user.full_name || 'User'}
 </h2>
 <p className="text-text-light-secondary text-sm">{user.email}</p>
 {user.role === 'merchant' && (
 <span className="inline-block mt-2 px-3 py-1 bg-primary/20 text-primary text-xs font-semibold rounded-full">
 Merchant Account
 </span>
 )}
 </div>
 <button className="mt-2 w-full max-w-[200px] h-10 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary font-semibold text-sm transition-colors flex items-center justify-center gap-2">
 <span className="material-symbols-outlined text-[18px]">edit_square</span>
 Edit Profile
 </button>
 </div>
 </div>

 {/* Menu List Container */}
 <div className="flex flex-col gap-6 px-4">
 {/* Shopping Activity Group */}
 <div className="flex flex-col gap-2">
 <h3 className="text-xs font-semibold uppercase tracking-wider text-text-light-secondary ml-2">My Shopping</h3>
 <div className="bg-surface-light rounded-xl overflow-hidden shadow-sm border border-border-light">
 {/* My Orders */}
 <button
 onClick={() => router.push('/orders')}
 className="w-full flex items-center gap-4 p-4 hover:bg-card-light transition-colors border-b border-border-light last:border-0 group"
 >
 <div className="w-10 h-10 rounded-lg bg-blue-900/20 flex items-center justify-center text-primary shrink-0">
 <span className="material-symbols-outlined">shopping_bag</span>
 </div>
 <div className="flex-1 text-left font-medium text-text-light-primary">My Orders</div>
 <div className="flex items-center gap-2">
 <span className="material-symbols-outlined text-text-light-secondary text-[20px]">chevron_right</span>
 </div>
 </button>

 {/* My Wishlist */}
 <button
 onClick={() => router.push('/wishlist')}
 className="w-full flex items-center gap-4 p-4 hover:bg-card-light transition-colors border-b border-border-light last:border-0 group"
 >
 <div className="w-10 h-10 rounded-lg bg-pink-900/20 flex items-center justify-center text-pink-500 shrink-0">
 <span className="material-symbols-outlined">favorite</span>
 </div>
 <div className="flex-1 text-left font-medium text-text-light-primary">My Wishlist</div>
 <span className="material-symbols-outlined text-text-light-secondary text-[20px]">chevron_right</span>
 </button>

 {/* My Reviews */}
 <button className="w-full flex items-center gap-4 p-4 hover:bg-card-light transition-colors last:border-0 group">
 <div className="w-10 h-10 rounded-lg bg-amber-900/20 flex items-center justify-center text-amber-500 shrink-0">
 <span className="material-symbols-outlined">rate_review</span>
 </div>
 <div className="flex-1 text-left font-medium text-text-light-primary">My Reviews</div>
 <span className="material-symbols-outlined text-text-light-secondary text-[20px]">chevron_right</span>
 </button>
 </div>
 </div>

 {/* Settings Group */}
 <div className="flex flex-col gap-2">
 <h3 className="text-xs font-semibold uppercase tracking-wider text-text-light-secondary ml-2">Preferences</h3>
 <div className="bg-surface-light rounded-xl overflow-hidden shadow-sm border border-border-light">
 {/* Notifications */}
 <button className="w-full flex items-center gap-4 p-4 hover:bg-card-light transition-colors border-b border-border-light last:border-0 group">
 <div className="w-10 h-10 rounded-lg bg-purple-900/20 flex items-center justify-center text-purple-500 shrink-0">
 <span className="material-symbols-outlined">notifications</span>
 </div>
 <div className="flex-1 text-left font-medium text-text-light-primary">Notifications</div>
 <span className="material-symbols-outlined text-text-light-secondary text-[20px]">chevron_right</span>
 </button>

 {/* Language Toggle */}
 <div className="w-full flex items-center gap-4 p-4 hover:bg-card-light transition-colors last:border-0 group justify-between">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-lg bg-teal-900/20 flex items-center justify-center text-teal-600 shrink-0">
 <span className="material-symbols-outlined">translate</span>
 </div>
 <div className="font-medium text-text-light-primary">Language</div>
 </div>
 {/* Simple Toggle UI */}
 <div className="flex items-center bg-background-light rounded-lg p-1 h-9">
 <button className="px-3 h-full rounded-md bg-card-light text-xs font-bold text-primary shadow-sm">EN</button>
 <button className="px-3 h-full rounded-md text-xs font-medium text-text-light-secondary hover:text-slate-700">AR</button>
 </div>
 </div>
 </div>
 </div>

 {/* Support & Legal Group */}
 <div className="flex flex-col gap-2">
 <h3 className="text-xs font-semibold uppercase tracking-wider text-text-light-secondary ml-2">Support &amp; Legal</h3>
 <div className="bg-surface-light rounded-xl overflow-hidden shadow-sm border border-border-light">
 {/* Help & Support */}
 <button className="w-full flex items-center gap-4 p-4 hover:bg-card-light transition-colors border-b border-border-light last:border-0 group">
 <div className="w-10 h-10 rounded-lg bg-card-light flex items-center justify-center text-text-light-secondary shrink-0">
 <span className="material-symbols-outlined">help</span>
 </div>
 <div className="flex-1 text-left font-medium text-text-light-primary">Help &amp; Support</div>
 <span className="material-symbols-outlined text-text-light-secondary text-[20px]">chevron_right</span>
 </button>

 {/* Terms & Conditions */}
 <button className="w-full flex items-center gap-4 p-4 hover:bg-card-light transition-colors border-b border-border-light last:border-0 group">
 <div className="w-10 h-10 rounded-lg bg-card-light flex items-center justify-center text-text-light-secondary shrink-0">
 <span className="material-symbols-outlined">description</span>
 </div>
 <div className="flex-1 text-left font-medium text-text-light-primary">Terms &amp; Conditions</div>
 <span className="material-symbols-outlined text-text-light-secondary text-[20px]">chevron_right</span>
 </button>

 {/* Privacy Policy */}
 <button className="w-full flex items-center gap-4 p-4 hover:bg-card-light transition-colors border-b border-border-light last:border-0 group">
 <div className="w-10 h-10 rounded-lg bg-card-light flex items-center justify-center text-text-light-secondary shrink-0">
 <span className="material-symbols-outlined">lock</span>
 </div>
 <div className="flex-1 text-left font-medium text-text-light-primary">Privacy Policy</div>
 <span className="material-symbols-outlined text-text-light-secondary text-[20px]">chevron_right</span>
 </button>

 {/* About Outfit Hub */}
 <button className="w-full flex items-center gap-4 p-4 hover:bg-card-light transition-colors last:border-0 group">
 <div className="w-10 h-10 rounded-lg bg-card-light flex items-center justify-center text-text-light-secondary shrink-0">
 <span className="material-symbols-outlined">info</span>
 </div>
 <div className="flex-1 text-left font-medium text-text-light-primary">About Outfit Hub</div>
 <span className="material-symbols-outlined text-text-light-secondary text-[20px]">chevron_right</span>
 </button>
 </div>
 </div>

 {/* Logout Button */}
 <div className="bg-surface-light rounded-xl overflow-hidden shadow-sm border border-border-light mt-2 mb-8">
 <button
 onClick={handleLogout}
 disabled={loggingOut}
 className="w-full flex items-center gap-4 p-4 hover:bg-red-50 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
 >
 <div className="w-10 h-10 rounded-lg bg-red-900/20 flex items-center justify-center text-red-500 shrink-0">
 {loggingOut ? (
 <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
 ) : (
 <span className="material-symbols-outlined">logout</span>
 )}
 </div>
 <div className="flex-1 text-left font-semibold text-red-500">
 {loggingOut ? 'Logging out...' : 'Log Out'}
 </div>
 </button>
 </div>

 <p className="text-center text-xs text-text-light-secondary pb-4">Version 1.0.0 (Build 1)</p>
 </div>
 </div>
 );
}
