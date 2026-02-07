'use client';

import { useCartUI } from '@/context/CartUIContext';
import { usePathname } from 'next/navigation';
import CartDrawer from './CartDrawer';

export default function CartManager() {
 const pathname = usePathname();
 const { isCartOpen, closeCart } = useCartUI();

 // Hide CartManager on merchant and admin pages
 if (pathname.startsWith('/merchant') || pathname.startsWith('/admin')) {
 return null;
 }

 return <CartDrawer isOpen={isCartOpen} onClose={closeCart} />;
}
