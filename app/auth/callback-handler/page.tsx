'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function CallbackHandler() {
 const router = useRouter();

 const supabase = useMemo(
 () =>
 createBrowserClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 ),
 []
 );

 useEffect(() => {
 const handleCallback = async () => {
 try {
 // Get current user
 const { data: { user }, error: userError } = await supabase.auth.getUser();

 if (userError || !user) {
 console.error('No authenticated user found:', userError);
 router.push('/login');
 return;
 }

 // Get pending role from session storage
 const pendingRole = typeof window !== 'undefined'
 ? sessionStorage.getItem('pending_role') as 'customer' | 'merchant' | null
 : null;

 if (pendingRole) {
 // Check if user exists first
 const { data: existingUser } = await supabase
 .from('users')
 .select('id, governorate')
 .eq('id', user.id)
 .maybeSingle();

 if (existingUser) {
 // Update existing user
 const { error: updateError } = await supabase
 .from('users')
 .update({
 role: pendingRole,
 updated_at: new Date().toISOString()
 })
 .eq('id', user.id);

 if (updateError) {
 console.error('Error updating user role:', updateError.message || updateError);
 }

 // Merchants don't need governorate
 if (pendingRole === 'merchant') {
 // Will be handled in the main redirect logic below
 } else {
 // Check if customer needs governorate
 if (!existingUser.governorate) {
 if (typeof window !== 'undefined') {
 sessionStorage.setItem('needs_governorate', 'true');
 }
 router.push('/select-governorate');
 return;
 }
 }
 } else {
 // Insert new user without governorate (will be set later)
 const { error: insertError } = await supabase
 .from('users')
 .insert({
 id: user.id,
 email: user.email,
 full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
 avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
 role: pendingRole,
 });

 if (insertError) {
 console.error('Error creating user:', insertError.message || insertError);
 }

 // Merchants don't need governorate, redirect to setup
 if (pendingRole === 'merchant') {
 if (typeof window !== 'undefined') {
 sessionStorage.removeItem('pending_role');
 }
 router.push('/merchant/setup');
 return;
 }

 // Customers need governorate
 if (typeof window !== 'undefined') {
 sessionStorage.setItem('needs_governorate', 'true');
 }
 router.push('/select-governorate');
 return;
 }

 // Clear pending role
 if (typeof window !== 'undefined') {
 sessionStorage.removeItem('pending_role');
 }

 // Redirect based on role
 if (pendingRole === 'merchant') {
 // Check if merchant has a store
 const { data: store } = await supabase
 .from('stores')
 .select('id, is_active')
 .eq('merchant_id', user.id)
 .maybeSingle();

 if (!store) {
 // No store, redirect to setup
 router.push('/merchant/setup');
 } else if (!store.is_active) {
 // Store exists but not active, redirect to pending
 router.push('/merchant/pending');
 } else {
 // Store exists and active, redirect to dashboard
 router.push('/merchant/dashboard');
 }
 } else {
 // Customer - redirect to home
 router.push('/');
 }
 } else {
 // No pending role, get from database or default to customer
 const { data: userData } = await supabase
 .from('users')
 .select('role, governorate')
 .eq('id', user.id)
 .maybeSingle();

 const role = userData?.role || 'customer';

 // Handle merchant redirects
 if (role === 'merchant') {
 // Check if merchant has a store
 const { data: store } = await supabase
 .from('stores')
 .select('id, is_active')
 .eq('merchant_id', user.id)
 .maybeSingle();

 if (!store) {
 router.push('/merchant/setup');
 } else if (!store.is_active) {
 router.push('/merchant/pending');
 } else {
 router.push('/merchant/dashboard');
 }
 return;
 }

 // Customer flow - check governorate
 if (!userData?.governorate) {
 if (typeof window !== 'undefined') {
 sessionStorage.setItem('needs_governorate', 'true');
 }
 router.push('/select-governorate');
 return;
 }

 router.push('/');
 }
 } catch (error) {
 console.error('Callback error:', error);
 router.push('/login');
 }
 };

 handleCallback();
 }, [router, supabase]);

 return (
 <div className="min-h-screen flex items-center justify-center bg-background-light">
 <div className="text-center">
 <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
 <p className="text-text-light-secondary">Signing you in...</p>
 </div>
 </div>
 );
}
