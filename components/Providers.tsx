'use client';

import { CartUIProvider } from '@/context/CartUIContext';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
    return (
        <LanguageProvider>
            <CartUIProvider>
                {children}
            </CartUIProvider>
        </LanguageProvider>
    );
}
