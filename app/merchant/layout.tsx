'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { LoadingScreen } from '@/components/LoadingSpinner';
import MerchantHeader from '@/components/merchant/MerchantHeader';
import MerchantBottomNav from '@/components/merchant/MerchantBottomNav';

export default function MerchantLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 const { isAuthenticated, isMerchant, loading } = useAuth();
 const router = useRouter();
 const pathname = usePathname();

 // Allow setup and pending pages without strict merchant check
 const isSetupOrPending = pathname === '/merchant/setup' || pathname === '/merchant/pending';

 useEffect(() => {
 // Wait until loading is done
 if (loading) return;

 // For setup and pending pages, allow access - they handle their own auth
 if (isSetupOrPending) {
 return;
 }

 // Not authenticated - redirect to login
 if (!isAuthenticated) {
 router.push('/login?redirect=/merchant/dashboard');
 return;
 }

 // For other merchant pages, check if merchant
 if (!isMerchant) {
 router.push('/');
 }
 }, [isAuthenticated, isMerchant, loading, router, isSetupOrPending]);

 // Show loading while checking auth
 if (loading) {
 return <LoadingScreen message="Loading..."/>;
 }

 // For setup and pending pages, render immediately
 if (isSetupOrPending) {
 return <>{children}</>;
 }

 // Not authenticated - show redirecting message
 if (!isAuthenticated) {
 return <LoadingScreen message="Redirecting to Login..."/>;
 }

 // Not a merchant - show redirecting message
 if (!isMerchant) {
 return <LoadingScreen message="Redirecting..."/>;
 }

 // Render merchant pages with header and bottom nav
 return (
 <div className="min-h-screen bg-background-light">
 <MerchantHeader />
 <main className="pb-24">
 {children}
 </main>
 <MerchantBottomNav />
 </div>
 );
}

