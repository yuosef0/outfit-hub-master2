'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import WishlistButton from '@/components/WishlistButton';
import Toast from '@/components/Toast';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { Product } from '@/lib/types';
import { LoadingScreen } from '@/components/LoadingSpinner';

export default function ProductDetailPage() {
    const router = useRouter();
    const params = useParams();
    const productId = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';
    const { t } = useLanguage();

    const [product, setProduct] = useState<Product | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    const supabase = useMemo(
        () =>
            createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            ),
        []
    );

    const [isInCart, setIsInCart] = useState(false);
    const [cartItemId, setCartItemId] = useState<string | null>(null);
    const [availableStock, setAvailableStock] = useState<number>(0);

    // Check if product is in cart
    const checkCartStatus = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !product) return;

        let query = supabase
            .from('cart_items')
            .select('id')
            .eq('user_id', user.id)
            .eq('product_id', product.id);

        if (selectedSize) {
            query = query.eq('size', selectedSize);
        } else {
            query = query.is('size', null);
        }

        if (selectedColor) {
            query = query.eq('color', selectedColor);
        } else {
            query = query.is('color', null);
        }

        const { data } = await query.maybeSingle();

        setIsInCart(!!data);
        setCartItemId(data?.id || null);
    };

    // Fetch product details
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select(`
            *,
            stores:store_id (
              id,
              name,
              logo_url,
              address
            )
          `)
                    .eq('id', productId)
                    .single();

                if (error) throw error;
                if (data) {
                    setProduct(data);

                    // Fetch related products from the same store
                    const { data: relatedData } = await supabase
                        .from('products')
                        .select('*')
                        .eq('store_id', data.store_id)
                        .eq('is_active', true)
                        .neq('id', productId)
                        .limit(6);

                    if (relatedData) {
                        setRelatedProducts(relatedData);
                    }
                }
            } catch (error) {
                console.error('Error fetching product:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (productId) {
            fetchProduct();
        }
    }, [productId, supabase]);

    // Fetch available stock for selected variant
    useEffect(() => {
        const fetchAvailableStock = async () => {
            if (!product) return;

            // Check if product has variants
            const { data: variants } = await supabase
                .from('product_variants')
                .select('stock_quantity')
                .eq('product_id', product.id);

            if (variants && variants.length > 0) {
                // Product has variants, find matching one
                let query = supabase
                    .from('product_variants')
                    .select('stock_quantity')
                    .eq('product_id', product.id);

                // Handle size matching (NULL or value)
                if (selectedSize) {
                    query = query.eq('size', selectedSize);
                } else {
                    query = query.is('size', null);
                }

                // Handle color matching (NULL or value)
                if (selectedColor) {
                    query = query.eq('color', selectedColor);
                } else {
                    query = query.is('color', null);
                }

                const { data: variant } = await query.maybeSingle();

                setAvailableStock(variant?.stock_quantity || 0);
            } else {
                // No variants, use product-level stock
                setAvailableStock(product.stock_quantity || 0);
            }
        };

        fetchAvailableStock();
    }, [product, selectedSize, selectedColor]);

    // Check cart status when product changes
    useEffect(() => {
        if (product) {
            checkCartStatus();
        }
    }, [product, selectedSize, selectedColor]); // Re-check when selection changes

    const nextImage = () => {
        const images = product?.image_urls;
        if (images && images.length > 0) {
            setCurrentImageIndex((prev) => (prev + 1) % images.length);
        }
    };

    const currentImage = product?.image_urls && product.image_urls.length > 0
        ? product.image_urls[currentImageIndex]
        : 'https://via.placeholder.com/400x600';

    const imageCount = product?.image_urls?.length || 0;

    // ... (in the component)

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (!product) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-card-light">
                <span className="material-symbols-outlined text-6xl text-border-light mb-4">inventory_2</span>
                <p className="text-text-light-secondary">{t('product.productNotFound')}</p>
                <button
                    onClick={() => router.back()}
                    className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                    {t('common.back')}
                </button>
            </div>
        );
    }

    return (
        <div className="relative flex flex-col min-h-screen w-full bg-card-light shadow-2xl overflow-hidden">
            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Scrollable Content */}
            <main className="flex-1 overflow-y-auto pb-32 hide-scrollbar">
                <style jsx>{`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
                {/* Image Gallery */}
                <div className="bg-card-light pb-4">
                    {/* Main Image */}
                    <div className="relative w-full h-[50vh] bg-card-light" onClick={nextImage}>
                        <img
                            key={currentImageIndex}
                            alt={product.name}
                            className="w-full h-full object-contain transition-opacity duration-300"
                            src={currentImage}
                        />
                        {/* Image Counter Badge */}
                        {product.image_urls && product.image_urls.length > 1 && (
                            <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full">
                                {currentImageIndex + 1}/{product.image_urls.length}
                            </div>
                        )}
                    </div>

                    {/* Thumbnails */}
                    {product.image_urls && product.image_urls.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto px-4 mt-4 hide-scrollbar">
                            {product.image_urls.map((url, index) => (
                                <button
                                    key={index}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentImageIndex(index);
                                    }}
                                    className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${currentImageIndex === index
                                        ? 'border-primary'
                                        : 'border-transparent opacity-70 hover:opacity-100'
                                        }`}
                                >
                                    <img
                                        src={url}
                                        alt={`${product.name} thumbnail ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="px-5 pt-6 pb-4">
                    {/* Store Name */}
                    {product.stores && (
                        <Link
                            href={`/stores/${product.stores.id}`}
                            className="flex items-center gap-1 mb-2 group"
                        >
                            <span className="text-primary text-sm font-semibold tracking-wide uppercase">
                                {product.stores.name}
                            </span>
                            <span className="material-symbols-outlined text-primary text-sm group-hover:translate-x-0.5 transition-transform">
                                chevron_right
                            </span>
                        </Link>
                    )}

                    {/* Title */}
                    <h1 className="text-2xl font-bold leading-tight text-text-light-primary mb-3">
                        {product.name}
                    </h1>

                    {/* Price Block */}
                    <div className="flex items-end gap-3 mb-6">
                        <span className="text-2xl font-bold text-text-light-primary">
                            {t('common.egp')} {product.price.toFixed(2)}
                        </span>
                        {product.category && (
                            <span className="px-2.5 py-1 bg-primary/20 text-primary text-xs font-bold rounded-full mb-1">
                                {product.category}
                            </span>
                        )}
                    </div>

                    {/* Separator */}
                    <div className="h-px w-full bg-card-light mb-6"></div>

                    {/* Selection Area */}
                    <div className="space-y-6">
                        {/* Stock Info */}
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-text-light-secondary">inventory</span>
                            <span className="text-sm text-text-light-secondary">
                                {product.stock_quantity > 0 ? (
                                    <span className="text-green-400 font-medium">
                                        {product.stock_quantity} {t('product.inStock')}
                                    </span>
                                ) : (
                                    <span className="text-red-400 font-medium">{t('product.outOfStock')}</span>
                                )}
                            </span>
                        </div>

                        {/* Selectors */}
                        {product.sizes && product.sizes.length > 0 && (
                            <div className="mb-4">
                                <span className="text-sm font-medium text-text-light-primary mb-3 block">{t('product.size')}</span>
                                <div className="flex flex-wrap gap-2">
                                    {product.sizes.map((size) => (
                                        <button
                                            key={size}
                                            onClick={() => setSelectedSize(size)}
                                            className={`h-10 min-w-[40px] px-3 rounded-lg border text-sm font-medium transition-all ${selectedSize === size
                                                ? 'border-primary bg-primary text-white'
                                                : 'border-border-light bg-card-light text-text-light-secondary hover:border-primary/50'
                                                }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {product.colors && product.colors.length > 0 && (
                            <div className="mb-4">
                                <span className="text-sm font-medium text-text-light-primary mb-3 block">{t('product.color')}</span>
                                <div className="flex flex-wrap gap-2">
                                    {product.colors.map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => setSelectedColor(color)}
                                            className={`h-10 px-4 rounded-lg border text-sm font-medium transition-all ${selectedColor === color
                                                ? 'border-primary bg-primary text-white'
                                                : 'border-border-light bg-card-light text-text-light-secondary hover:border-primary/50'
                                                }`}
                                        >
                                            {color}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity */}
                        <div>
                            <span className="text-sm font-medium text-text-light-primary mb-3 block">{t('common.quantity')}</span>
                            <div className="inline-flex items-center h-11 rounded-lg border border-border-light bg-card-light p-1">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-9 h-full flex items-center justify-center rounded-md bg-card-light shadow-sm text-text-light-primary hover:bg-card-light transition-all active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-lg">remove</span>
                                </button>
                                <span className="w-10 text-center text-sm font-semibold text-text-light-primary">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                                    disabled={quantity >= availableStock}
                                    className="w-9 h-full flex items-center justify-center rounded-md bg-card-light shadow-sm text-text-light-primary hover:bg-card-light transition-all active:scale-95 disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined text-lg">add</span>
                                </button>
                            </div>
                        </div>

                        {/* Actions (Add to Cart) */}
                        <div className="flex gap-3 pt-2">
                            <div className="flex-shrink-0">
                                <WishlistButton
                                    productId={product.id}
                                    className="w-14 h-14 rounded-xl border border-border-light !bg-card-light"
                                />
                            </div>
                            <button
                                onClick={async () => {
                                    // Validation
                                    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
                                        setToast({ message: t('product.selectSize') || 'Please select a size', type: 'error' });
                                        return;
                                    }
                                    if (product.colors && product.colors.length > 0 && !selectedColor) {
                                        setToast({ message: t('product.selectColor') || 'Please select a color', type: 'error' });
                                        return;
                                    }

                                    const { data: { user } } = await supabase.auth.getUser();
                                    if (!user) {
                                        setToast({ message: t('msg.loginRequired'), type: 'error' });
                                        return;
                                    }

                                    try {
                                        if (isInCart && cartItemId) {
                                            // Remove from cart
                                            const { error } = await supabase
                                                .from('cart_items')
                                                .delete()
                                                .eq('id', cartItemId);

                                            if (!error) {
                                                setIsInCart(false);
                                                setCartItemId(null);
                                                setToast({ message: t('msg.removedFromCart'), type: 'success' });
                                            } else {
                                                setToast({ message: t('msg.somethingWrong'), type: 'error' });
                                            }
                                        } else {
                                            // Add to cart
                                            const { data: newItem, error } = await supabase
                                                .from('cart_items')
                                                .insert({
                                                    user_id: user.id,
                                                    product_id: product.id,
                                                    quantity: quantity,
                                                    size: selectedSize || null,
                                                    color: selectedColor || null
                                                })
                                                .select()
                                                .single();

                                            if (!error && newItem) {
                                                setIsInCart(true);
                                                setCartItemId(newItem.id);
                                                setToast({ message: t('msg.addedToCart'), type: 'success' });
                                            } else {
                                                setToast({ message: t('msg.somethingWrong'), type: 'error' });
                                            }
                                        }
                                    } catch (error) {
                                        console.error('Error managing cart:', error);
                                        setToast({ message: t('msg.tryAgain'), type: 'error' });
                                    }
                                }}
                                disabled={product.stock_quantity === 0 && !isInCart}
                                className={`flex-1 h-14 rounded-xl flex items-center justify-center gap-2 font-bold text-base shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${isInCart
                                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30'
                                    : 'bg-primary hover:bg-primary/90 text-white shadow-primary/30'
                                    }`}
                            >
                                <span className="material-symbols-outlined">
                                    {isInCart ? 'remove_shopping_cart' : 'shopping_cart'}
                                </span>
                                {isInCart ? t('common.remove') : product.stock_quantity > 0 ? t('common.addToCart') : t('product.outOfStock')}
                            </button>
                        </div>
                    </div>

                    {/* Separator */}
                    <div className="h-px w-full bg-card-light my-6"></div>

                    {/* Accordions */}
                    <div className="space-y-4">
                        {product.description && (
                            <>
                                <details className="group [&_summary::-webkit-details-marker]:hidden" open>
                                    <summary className="flex cursor-pointer items-center justify-between text-text-light-primary">
                                        <h2 className="text-base font-semibold">{t('product.description')}</h2>
                                        <span className="material-symbols-outlined transition duration-300 group-open:-rotate-180">expand_more</span>
                                    </summary>
                                    <div className="mt-3 text-sm leading-relaxed text-text-light-secondary">
                                        <p>{product.description}</p>
                                    </div>
                                </details>
                                <div className="h-px w-full bg-card-light"></div>
                            </>
                        )}

                        {product.stores?.address && (
                            <>
                                <details className="group [&_summary::-webkit-details-marker]:hidden">
                                    <summary className="flex cursor-pointer items-center justify-between text-text-light-primary">
                                        <h2 className="text-base font-semibold">{t('store.location')}</h2>
                                        <span className="material-symbols-outlined transition duration-300 group-open:-rotate-180">expand_more</span>
                                    </summary>
                                    <div className="mt-3 text-sm leading-relaxed text-text-light-secondary">
                                        <p>{product.stores.address}</p>
                                    </div>
                                </details>
                                <div className="h-px w-full bg-card-light"></div>
                            </>
                        )}
                    </div>
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div className="bg-background-light py-8 px-5 mt-4">
                        <h3 className="text-lg font-bold text-text-light-primary mb-4">{t('product.relatedProducts')}</h3>
                        <div className="flex overflow-x-auto gap-4 pb-4 -mx-5 px-5 hide-scrollbar snap-x snap-mandatory">
                            {relatedProducts.map((relatedProduct) => (
                                <div
                                    key={relatedProduct.id}
                                    className="min-w-[160px] snap-start cursor-pointer"
                                    onClick={() => router.push(`/products/${relatedProduct.id}`)}
                                >
                                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-3 bg-card-light">
                                        <img
                                            alt={relatedProduct.name}
                                            className="w-full h-full object-cover"
                                            src={relatedProduct.image_urls?.[0] || 'https://via.placeholder.com/300x400'}
                                        />
                                        <button className="absolute top-2 right-2 w-8 h-8 rounded-full bg-card-light/80 backdrop-blur-sm flex items-center justify-center text-text-light-secondary hover:text-red-500 transition-colors">
                                            <span className="material-symbols-outlined text-[18px]">favorite</span>
                                        </button>
                                    </div>
                                    <h4 className="text-sm font-medium text-text-light-primary truncate">{relatedProduct.name}</h4>
                                    <p className="text-sm font-semibold text-text-light-secondary">{t('common.egp')} {relatedProduct.price.toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
