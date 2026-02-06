'use client';

import { CartUIProvider } from '@/context/CartUIContext';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
 return (
 <CartUIProvider>
 {children}
 </CartUIProvider>
 );
}
