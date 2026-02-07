'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import type { CartItem, Product } from '@/lib/types';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface GroupedCartItems {
    [storeId: string]: {
        storeName: string;
        storeLogo?: string;
        items: (CartItem & { products: Product })[];
    };
}

export default function CartPage() {
    const router = useRouter();
    const { t } = useLanguage();
    const [cartItems, setCartItems] = useState<(CartItem & { products: Product })[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const supabase = useMemo(
        () =>
            createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            ),
        []
    );

    useEffect(() => {
        fetchCart();
    }, [supabase]);

    const fetchCart = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setIsLoading(false);
                return;
            }

            // Step 1: Fetch Cart Items
            const { data: cartData, error: cartError } = await supabase
                .from('cart_items')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (cartError) {
                console.error('Error fetching cart_items:', cartError.message || cartError);
                throw cartError;
            }

            if (!cartData || cartData.length === 0) {
                setCartItems([]);
                setIsLoading(false);
                return;
            }

            // Step 2: Fetch Products for these items
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
                console.error('Error fetching products for cart:', productsError.message || productsError);
                throw productsError;
            }

            // Step 3: Merge data
            const mergedItems = cartData.map((cartItem) => {
                const product = productsData?.find((p) => p.id === cartItem.product_id);
                return product ? { ...cartItem, products: product } : null;
            }).filter(item => item !== null) as (CartItem & { products: Product })[];

            setCartItems(mergedItems);

        } catch (error: any) {
            console.error('Error in fetchCart:', error.message || error);
        } finally {
            setIsLoading(false);
        }
    };

    const updateQuantity = async (itemId: string, newQuantity: number) => {
        if (newQuantity < 1) return;

        try {
            const { error } = await supabase
                .from('cart_items')
                .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
                .eq('id', itemId);

            if (!error) {
                setCartItems(prev =>
                    prev.map(item =>
                        item.id === itemId ? { ...item, quantity: newQuantity } : item
                    )
                );
            }
        } catch (error) {
            console.error('Error updating quantity:', error);
        }
    };

    const removeItem = async (itemId: string) => {
        try {
            const { error } = await supabase
                .from('cart_items')
                .delete()
                .eq('id', itemId);

            if (!error) {
                setCartItems(prev => prev.filter(item => item.id !== itemId));
            }
        } catch (error) {
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background-light">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-text-light-secondary">{t('cart.loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background-light font-display text-text-light-primary min-h-screen flex flex-col relative overflow-x-hidden transition-colors duration-200">
            {/* Top App Bar */}
            <header className="sticky top-0 z-50 bg-background-light/95 /95 backdrop-blur-md transition-colors">
                <div className="flex items-center justify-between px-4 h-14">
                    <button
                        onClick={() => router.back()}
                        aria-label="Go back"
                        className="size-10 flex items-center justify-center rounded-full hover:bg-card-light text-text-light-primary transition-colors"
                    >
                        <span className="material-symbols-outlined text-[24px]">arrow_back</span>
                    </button>
                    <h1 className="text-lg font-bold tracking-tight text-text-light-primary">{t('cart.myCart')}</h1>
                    <div className="w-10"></div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto no-scrollbar pb-48 px-4 pt-2">
                {cartItems.length > 0 ? (
                    <div className="space-y-6">
                        {Object.entries(groupedItems).map(([storeId, { storeName, storeLogo, items }]) => (
                            <section key={storeId} className="flex flex-col gap-3">
                                {/* Store Header */}
                                <Link href={`/stores/${storeId}`} className="flex items-center gap-3 px-1 py-1 hover:opacity-80 transition-opacity">
                                    <div className="size-8 rounded-full bg-card-light shadow-sm border border-border-light flex items-center justify-center overflow-hidden">
                                        {storeLogo ? (
                                            <img src={storeLogo} alt={storeName} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="material-symbols-outlined text-primary text-base">store</span>
                                        )}
                                    </div>
                                    <div className="flex-1 flex items-center gap-1">
                                        <h2 className="font-semibold text-sm text-text-light-primary">{storeName}</h2>
                                        <span className="material-symbols-outlined text-text-light-secondary text-[18px]">chevron_right</span>
                                    </div>
                                </Link>

                                {/* Cart Items */}
                                {items.map((item) => (
                                    <article
                                        key={item.id}
                                        className="bg-card-light rounded-2xl p-3 shadow-sm flex gap-4 transition-colors"
                                    >
                                        {/* Product Image */}
                                        <Link href={`/products/${item.products.id}`} className="w-24 h-28 shrink-0 bg-background-light rounded-xl overflow-hidden relative group">
                                            <img
                                                src={item.products.image_urls?.[0] || 'https://via.placeholder.com/300x400'}
                                                alt={item.products.name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        </Link>

                                        {/* Content */}
                                        <div className="flex flex-col flex-1 justify-between py-0.5">
                                            <div>
                                                <div className="flex justify-between items-start gap-3">
                                                    <Link href={`/products/${item.products.id}`}>
                                                        <h3 className="font-semibold text-sm text-text-light-primary leading-snug line-clamp-2 hover:text-primary transition-colors">
                                                            {item.products.name}
                                                        </h3>
                                                    </Link>
                                                    <button
                                                        onClick={() => removeItem(item.id)}
                                                        aria-label="Remove item"
                                                        className="text-text-light-secondary hover:text-red-500 transition-colors shrink-0 p-1 -mr-1 -mt-1"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                                    </button>
                                                </div>
                                                {item.products.category && (
                                                    <p className="text-xs font-medium text-text-light-secondary mt-1.5">
                                                        {item.products.category}
                                                    </p>
                                                )}
                                                {(item.size || item.color) && (
                                                    <div className="flex gap-2 mt-2">
                                                        {item.size && (
                                                            <span className="text-xs bg-surface-light px-2 py-1 rounded text-text-light-secondary border border-border-light">
                                                                {t('product.size')}: {item.size}
                                                            </span>
                                                        )}
                                                        {item.color && (
                                                            <span className="text-xs bg-surface-light px-2 py-1 rounded text-text-light-secondary border border-border-light flex items-center gap-1">
                                                                {t('product.color')}:
                                                                <span
                                                                    className="w-3 h-3 rounded-full border border-border-light inline-block"
                                                                    style={{ backgroundColor: item.color }}
                                                                ></span>
                                                                {item.color}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-end justify-between mt-3">
                                                <span className="font-bold text-base text-primary">
                                                    ${item.products.price.toFixed(2)}
                                                </span>

                                                {/* Quantity Stepper */}
                                                <div className="flex items-center bg-background-light rounded-lg p-1 h-8 shadow-inner">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        aria-label="Decrease quantity"
                                                        className="size-6 flex items-center justify-center bg-card-light text-text-light-secondary rounded shadow-sm hover:scale-105 active:scale-95 transition-all"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px] font-bold">remove</span>
                                                    </button>
                                                    <span className="w-8 text-center text-xs font-semibold text-text-light-primary tabular-nums">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        aria-label="Increase quantity"
                                                        className="size-6 flex items-center justify-center bg-card-light text-text-light-secondary rounded shadow-sm hover:scale-105 active:scale-95 transition-all"
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
                    <div className="flex flex-col items-center justify-center py-10 px-6 bg-card-light rounded-3xl shadow-sm mt-8">
                        <div className="w-48 h-48 mb-6 flex items-center justify-center relative">
                            <div className="absolute inset-0 bg-primary/5 rounded-full blur-2xl"></div>
                            <div className="relative z-10 p-6 bg-card-light rounded-full shadow-sm">
                                <span className="material-symbols-outlined text-[64px] text-primary/80">shopping_bag</span>
                            </div>
                            <div
                                className="absolute top-10 right-10 p-2 bg-card-light rounded-full shadow-md animate-bounce"
                                style={{ animationDuration: '3s' }}
                            >
                                <span className="material-symbols-outlined text-xl text-yellow-400">star</span>
                            </div>
                            <div className="absolute bottom-10 left-8 p-1.5 bg-card-light rounded-full shadow-md">
                                <span className="material-symbols-outlined text-lg text-red-400">favorite</span>
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
                            className="mt-8 flex items-center justify-center px-8 h-11 bg-primary hover:bg-primary-light text-white text-sm font-bold rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95"
                        >
                            {t('cart.startShopping')}
                        </Link>
                    </div>
                )}
            </main>

            {/* Sticky Bottom Bar */}
            {cartItems.length > 0 && (
                <footer className="fixed bottom-[90px] left-0 w-full bg-card-light/90 backdrop-blur-xl px-4 py-4 pb-4 z-40 transition-colors">
                    <div className="w-full max-w-md mx-auto space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-text-light-secondary">
                                {t('cart.subtotal')} ({totalItems} {totalItems !== 1 ? t('cart.items') : t('cart.item')})
                            </span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold text-text-light-primary tracking-tight">
                                    ${subtotal.toFixed(2)}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/checkout')}
                            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-light active:bg-primary-dark text-white h-12 rounded-xl font-bold text-base transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                        >
                            {t('cart.proceedToCheckout')}
                            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                        </button>
                    </div>
                </footer>
            )}
        </div>
    );
}
