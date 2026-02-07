'use client';

import { usePathname } from 'next/navigation';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from '@/components/BottomNav';
import CartManager from "@/components/CartManager";
import ScrollToTop from "@/components/ScrollToTop";

export default function MainLayoutWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    // Pages where we want to hide the global layout elements
    const shouldHideLayout =
        pathname?.startsWith('/login') ||
        pathname?.startsWith('/signup') ||
        pathname?.startsWith('/merchant') ||
        pathname?.startsWith('/admin');

    if (shouldHideLayout) {
        return <>{children}</>;
    }

    return (
        <>
            <Header />
            {children}
            <Footer />
            <CartManager />
            <BottomNav />
            <ScrollToTop />
        </>
    );
}
