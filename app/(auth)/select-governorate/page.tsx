'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { EGYPTIAN_GOVERNORATES } from '@/lib/types';

export default function SelectGovernoratePage() {
 const router = useRouter();
 const [governorate, setGovernorate] = useState('');
 const [isLoading, setIsLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const supabase = useMemo(
 () =>
 createBrowserClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 ),
 []
 );

 useEffect(() => {
 // Check if user needs to select governorate
 const needsGovernorate = typeof window !== 'undefined'
 ? sessionStorage.getItem('needs_governorate')
 : null;

 if (!needsGovernorate) {
 router.push('/');
 }
 }, [router]);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();

 if (!governorate) {
 setError('Please select your governorate');
 return;
 }

 try {
 setIsLoading(true);
 setError(null);

 const { data: { user } } = await supabase.auth.getUser();

 if (!user) {
 router.push('/login');
 return;
 }

 // Update user's governorate
 const { error: updateError } = await supabase
 .from('users')
 .update({ governorate })
 .eq('id', user.id);

 if (updateError) throw updateError;

 // Clear session flag
 if (typeof window !== 'undefined') {
 sessionStorage.removeItem('needs_governorate');
 }

 // Redirect to home
 router.push('/');
 } catch (err: any) {
 setError(err.message || 'Failed to update governorate');
 } finally {
 setIsLoading(false);
 }
 };

 return (
 <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">
 <div className="flex flex-col w-full h-full min-h-screen items-center justify-center p-6 bg-background-light">
 <div className="w-full max-w-sm flex flex-col items-center">
 {/* Logo */}
 <div className="mb-8">
 <svg fill="none"height="48"viewBox="0 0 48 48"width="48"xmlns="http://www.w3.org/2000/svg">
 <path className="fill-primary"d="M24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4Z"/>
 <path d="M24 14L34 24L24 34L14 24L24 14Z"fill="white"/>
 </svg>
 </div>

 {/* Headline */}
 <h1 className="text-text-light-primary tracking-light text-[32px] font-bold leading-tight text-center pb-3">
 Select Your Location
 </h1>
 <p className="text-text-light-secondary text-center mb-8">
 Please select your governorate to personalize your experience
 </p>

 <form onSubmit={handleSubmit} className="w-full">
 {/* Governorate Dropdown */}
 <div className="flex w-full flex-wrap items-end gap-4 pb-4">
 <label className="flex flex-col w-full flex-1">
 <p className="text-text-light-primary text-base font-medium leading-normal pb-2">
 Governorate (المحافظة)
 </p>
 <div className="flex w-full flex-1 items-stretch rounded-lg">
 <select
 className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-light-primary focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light bg-background-light focus:border-primary h-14 placeholder:text-[#4c669a] p-[15px] text-base font-normal leading-normal"
 value={governorate}
 onChange={(e) => setGovernorate(e.target.value)}
 required
 >
 <option value="">Select your governorate</option>
 {EGYPTIAN_GOVERNORATES.map((gov) => (
 <option key={gov.code} value={gov.name}>
 {gov.name} - {gov.name_ar}
 </option>
 ))}
 </select>
 </div>
 </label>
 </div>

 {/* Error Message */}
 {error && (
 <div className="mt-4 p-3 bg-red-900/20 border border-red-800 rounded-lg">
 <p className="text-sm text-red-400">{error}</p>
 </div>
 )}

 {/* Submit Button */}
 <button
 type="submit"
 disabled={isLoading}
 className="flex items-center justify-center text-center font-medium text-base h-14 mt-8 w-full rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {isLoading ? 'Saving...' : 'Continue'}
 </button>
 </form>
 </div>
 </div>
 </div>
 );
}
