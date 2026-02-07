'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { CartItem, Product } from '@/lib/types';

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

interface GroupedCartItems {
    [storeId: string]: {
        storeName: string;
        storeLogo?: string;
        items: (CartItem & { products: Product })[];
    };
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
    const [isVisible, setIsVisible] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const [cartItems, setCartItems] = useState<(CartItem & { products: Product })[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useLanguage();

    const supabase = useMemo(
        () =>
            createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            ),
        []
    );

    // Handle animation state
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            document.body.style.overflow = 'hidden';
            fetchCart();
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            document.body.style.overflow = '';
            setCartItems([]);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Close on route change
    useEffect(() => {
        onClose();
    }, [pathname]);

    const fetchCart = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: cartData, error: cartError } = await supabase
                .from('cart_items')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (cartError) {
                console.error('Error fetching cart items:', cartError.message || cartError);
                return;
            };

            if (!cartData || cartData.length === 0) {
                setCartItems([]);
                return;
            }

            const productIds = cartData.map(item => item.product_id);
            const { data: productsData, error: productsError } = await supabase
                .from('products')
                .select(`
          *,
          stores:store_id (
            id,
            name,
            logo_url
          )
        `)
                .in('id', productIds);

            if (productsError) {
                console.error('Error fetching products:', productsError.message || productsError);
                return;
            }

            const mergedItems = cartData.map((cartItem) => {
                const product = productsData?.find((p) => p.id === cartItem.product_id);
                return product ? { ...cartItem, products: product } : null;
            }).filter(item => item !== null) as (CartItem & { products: Product })[];

            setCartItems(mergedItems);

        } catch (error: any) {
            console.error('Error fetching cart in drawer:', error.message || error);
        } finally {
            setIsLoading(false);
        }
    };

    const updateQuantity = async (itemId: string, newQuantity: number) => {
        if (newQuantity < 1) return;

        setCartItems(prev =>
            prev.map(item =>
                item.id === itemId ? { ...item, quantity: newQuantity } : item
            )
        );

        try {
            const { error } = await supabase
                .from('cart_items')
                .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
                .eq('id', itemId);

            if (error) {
                console.error("Error updating quantity", error);
                fetchCart();
            }
        } catch (error) {
            console.error("Error updating quantity", error);
        }
    };

    const removeItem = async (itemId: string) => {
        const previousItems = [...cartItems];
        setCartItems(prev => prev.filter(item => item.id !== itemId));

        try {
            const { error } = await supabase
                .from('cart_items')
                .delete()
                .eq('id', itemId);

            if (error) {
                setCartItems(previousItems);
                console.error('Error removing item:', error);
            }
        } catch (error) {
            setCartItems(previousItems);
            console.error('Error removing item:', error);
        }
    };

    const groupedItems: GroupedCartItems = cartItems.reduce((acc, item) => {
        if (!item.products?.stores) return acc;

        const storeId = item.products.stores.id;
        if (!acc[storeId]) {
            acc[storeId] = {
                storeName: item.products.stores.name,
                storeLogo: item.products.stores.logo_url,
                items: [],
            };
        }
        acc[storeId].items.push(item);
        return acc;
    }, {} as GroupedCartItems);

    const subtotal = cartItems.reduce((sum, item) => sum + (item.products?.price || 0) * item.quantity, 0);
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    if (!isVisible && !isOpen) return null;

    return (
        <div className={`fixed inset-0 z-[100] flex justify-end transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Drawer Panel */}
            <div className={`relative w-full max-w-md h-full bg-background-light shadow-2xl flex flex-col transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* Header */}
                <header className="sticky top-0 z-50 bg-background-light/95 /95 backdrop-blur-md transition-colors shrink-0">
                    <div className="flex items-center justify-between px-4 h-14">
                        <button
                            onClick={onClose}
                            aria-label={t('common.close')}
                            className="size-10 flex items-center justify-center rounded-full hover:bg-card-light text-text-light-primary transition-colors"
                        >
                            <span className="material-symbols-outlined text-[24px]">close</span>
                        </button>
                        <h1 className="text-lg font-bold tracking-tight text-text-light-primary">{t('cart.yourCart')} ({totalItems})</h1>
                        <Link
                            href="/cart"
                            onClick={onClose}
                            className="h-10 px-2 flex items-center justify-center text-primary font-semibold text-sm hover:opacity-80 transition-opacity"
                        >
                            {t('common.viewAll')}
                        </Link>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto no-scrollbar px-4 pt-4 pb-4">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-40">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : cartItems.length > 0 ? (
                        <div className="space-y-6">
                            {Object.entries(groupedItems).map(([storeId, { storeName, storeLogo, items }]) => (
                                <section key={storeId} className="flex flex-col gap-3">
                                    {/* Store Header */}
                                    <div className="flex items-center gap-3 px-1 py-1">
                                        <div className="size-8 rounded-full bg-card-light shadow-sm border border-border-light flex items-center justify-center overflow-hidden">
                                            {storeLogo ? (
                                                <img alt={storeName} className="w-full h-full object-cover" src={storeLogo} />
                                            ) : (
                                                <span className="material-symbols-outlined text-primary text-base">store</span>
                                            )}
                                        </div>
                                        <div className="flex-1 flex items-center gap-1">
                                            <h2 className="font-semibold text-sm text-text-light-primary">{storeName}</h2>
                                            <span className="material-symbols-outlined text-text-light-secondary text-[18px]">chevron_right</span>
                                        </div>
                                    </div>

                                    {items.map((item) => (
                                        <article key={item.id} className="bg-transparent rounded-2xl p-3 shadow-none flex gap-4 transition-colors border border-border-light/50">
                                            {/* Product Image */}
                                            <div className="w-24 h-28 shrink-0 bg-background-light rounded-xl overflow-hidden relative group">
                                                <Link href={`/products/${item.products.id}`} onClick={onClose}>
                                                    <img
                                                        src={item.products.image_urls?.[0] || 'https://via.placeholder.com/300x400'}
                                                        alt={item.products.name}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    />
                                                </Link>
                                            </div>
                                            {/* Content */}
                                            <div className="flex flex-col flex-1 justify-between py-0.5">
                                                <div>
                                                    <div className="flex justify-between items-start gap-3">
                                                        <Link href={`/products/${item.products.id}`} onClick={onClose}>
                                                            <h3 className="font-semibold text-sm text-text-light-primary leading-snug line-clamp-2 hover:text-primary transition-colors">
                                                                {item.products.name}
                                                            </h3>
                                                        </Link>
                                                        <button
                                                            onClick={() => removeItem(item.id)}
                                                            aria-label={t('cart.removeItem')}
                                                            className="text-text-light-secondary hover:text-red-500 transition-colors shrink-0 p-1 -mr-1 -mt-1"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                                        </button>
                                                    </div>
                                                    {item.products.category && (
                                                        <p className="text-xs font-medium text-text-light-secondary mt-1.5">{item.products.category}</p>
                                                    )}
                                                    {(item.size || item.color) && (
                                                        <div className="flex gap-2 mt-2">
                                                            {item.size && (
                                                                <span className="text-xs bg-surface-light px-2 py-1 rounded text-text-light-secondary">
                                                                    {t('product.size')}: {item.size}
                                                                </span>
                                                            )}
                                                            {item.color && (
                                                                <span className="text-xs bg-surface-light px-2 py-1 rounded text-text-light-secondary flex items-center gap-1">
                                                                    {t('product.color')}:
                                                                    <span
                                                                        className="w-3 h-3 rounded-full border border-border-light inline-block"
                                                                        style={{ backgroundColor: item.color }}
                                                                    ></span>
                                                                    {/* If color is a name, display it. Use hex for circle. 
                                                                        Since we store color name or hex? The prompt implies mixed usage or name.
                                                                        Let's assume the stored value is the ONE selected. 
                                                                        If I store "Red", I can't easily show hex unless I look it up.
                                                                        However, product page stores `selectedColor` which comes from `product.colors` (names? or objects?).
                                                                        In `new/page.tsx`, `colors` are stored as `{name, hex}` objects in `selectedColors` state, 
                                                                        BUT `productData.colors` sent to DB is that array of objects?
                                                                        Wait, `products.colors` is `text[]` in DB?
                                                                        In `add_variants_to_cart.sql`: `colors TEXT[]`.
                                                                        In `new/page.tsx`: `productData.colors = selectedColors`. `selectedColors` is `{name, hex}[]`.
                                                                        Supabase might stringify JSON if column is text[]? Or is it JSONB?
                                                                        `products.colors` is `text[]`. 
                                                                        If I send JSON objects to a text[] column, it might be weird.
                                                                        Let's check `lib/types.ts`: `colors?: string[];`. 
                                                                        So `productData.colors` should be strings. 
                                                                        In `new/page.tsx`, I saw: `productData.colors = selectedColors`. 
                                                                        If `selectedColors` is objects, this might be saving `[{"name":"Red","hex":"#F00"}]` as string representation?
                                                                        Or is it failing?
                                                                        If the user meant sending just names?
                                                                        Actually, looking at `new/page.tsx`, `selectedColors` is `{name: string, hex: string}[]`.
                                                                        If I insert that into `text[]`, it might error or cast to string.
                                                                        
                                                                        Let's assume for now we perform a safe display: display the value as text. 
                                                                        If it looks like a hex code (starts with #), render a box.
                                                                    */}
                                                                    {item.color}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-end justify-between mt-3">
                                                    <span className="font-bold text-base text-primary">{t('common.egp')} {item.products.price.toFixed(2)}</span>
                                                    {/* Quantity Stepper */}
                                                    <div className="flex items-center bg-background-light rounded-lg p-1 h-8 shadow-inner">
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                            aria-label={t('cart.updateQuantity')}
                                                            className="size-6 flex items-center justify-center bg-surface-light text-text-light-secondary rounded shadow-sm hover:scale-105 active:scale-95 transition-all"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px] font-bold">remove</span>
                                                        </button>
                                                        <span className="w-8 text-center text-xs font-semibold text-text-light-primary tabular-nums">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                            aria-label={t('cart.updateQuantity')}
                                                            className="size-6 flex items-center justify-center bg-surface-light text-text-light-secondary rounded shadow-sm hover:scale-105 active:scale-95 transition-all"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px] font-bold">add</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </section>
                            ))}
                        </div>
                    ) : (
                        // Empty State
                        <div className="flex flex-col items-center justify-center py-10 px-6 h-full">
                            <div className="w-48 h-48 mb-6 flex items-center justify-center relative">
                                <div className="absolute inset-0 bg-primary/5 rounded-full blur-2xl"></div>
                                <div className="relative z-10 p-6 bg-card-light rounded-full shadow-sm">
                                    <span className="material-symbols-outlined text-[64px] text-primary/80">shopping_bag</span>
                                </div>
                            </div>
                            <div className="max-w-[280px] flex flex-col items-center gap-3">
                                <h3 className="text-xl font-bold text-text-light-primary text-center">{t('cart.empty')}</h3>
                                <p className="text-sm text-text-light-secondary text-center leading-relaxed">
                                    {t('cart.emptyMessage')}
                                </p>
                            </div>
                            <Link
                                href="/"
                                onClick={onClose}
                                className="mt-8 flex items-center justify-center px-8 h-11 bg-primary hover:bg-primary-light text-white text-sm font-bold rounded-xl transition-all shadow-glow hover:shadow-lg active:scale-95"
                            >
                                {t('cart.continueShopping')}
                            </Link>
                        </div>
                    )}
                </main>

                {/* Footer (Actions) */}
                {cartItems.length > 0 && (
                    <div className="mt-auto p-4 pb-8 bg-background-light">
                        <div className="w-full space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-text-light-secondary">{t('cart.subtotal')} ({totalItems} {totalItems === 1 ? t('cart.item') : t('cart.items')})</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-xl font-bold text-text-light-primary tracking-tight">{t('common.egp')} {subtotal.toFixed(2)}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    onClose();
                                    router.push('/checkout');
                                }}
                                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-light active:bg-primary-dark text-white h-12 rounded-xl font-bold text-base transition-all shadow-glow hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                            >
                                {t('cart.proceedToCheckout')}
                                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
