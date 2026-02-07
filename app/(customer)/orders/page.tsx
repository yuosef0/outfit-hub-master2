'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { Order, OrderStatus } from '@/lib/types';

export default function OrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
    const { t, language } = useLanguage();
    const [reviewedOrders, setReviewedOrders] = useState<Set<string>>(new Set());
    const [reviewModal, setReviewModal] = useState<{ orderId: string; storeId: string; storeName: string } | null>(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const supabase = useMemo(
        () =>
            createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            ),
        []
    );

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push('/login');
                    return;
                }

                const { data, error } = await supabase
                    .from('orders')
                    .select(`
            *,
            stores:store_id (
              id,
              name,
              logo_url,
              address,
              maps_link
            )
          `)
                    .eq('customer_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setOrders(data || []);
                setCurrentUserId(user.id);

                // Fetch which orders have already been reviewed
                const { data: existingReviews } = await supabase
                    .from('store_reviews')
                    .select('order_id')
                    .eq('customer_id', user.id);

                if (existingReviews) {
                    setReviewedOrders(new Set(existingReviews.map(r => r.order_id).filter(Boolean)));
                }
            } catch (error) {
                console.error('Error fetching orders:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrders();
    }, [supabase, router]);

    const submitReview = async () => {
        if (!reviewModal || !currentUserId) return;
        setReviewSubmitting(true);

        try {
            const { error } = await supabase
                .from('store_reviews')
                .insert({
                    store_id: reviewModal.storeId,
                    customer_id: currentUserId,
                    order_id: reviewModal.orderId,
                    rating: reviewRating,
                    comment: reviewComment.trim() || null,
                });

            if (error) throw error;

            setReviewedOrders(prev => new Set([...prev, reviewModal.orderId]));
            setReviewModal(null);
            setReviewRating(5);
            setReviewComment('');
        } catch (error) {
            console.error('Error submitting review:', error);
        } finally {
            setReviewSubmitting(false);
        }
    };

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case 'reserved':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'confirmed':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'ready':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'completed':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'cancelled':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'expired':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusText = (status: OrderStatus) => {
        const statusTexts: Record<OrderStatus, { en: string; ar: string }> = {
            'reserved': { en: 'Reserved', ar: 'محجوز' },
            'confirmed': { en: 'Confirmed', ar: 'مؤكد' },
            'ready': { en: 'Ready for Pickup', ar: 'جاهز للاستلام' },
            'completed': { en: 'Completed', ar: 'مكتمل' },
            'cancelled': { en: 'Cancelled', ar: 'ملغي' },
            'expired': { en: 'Expired', ar: 'منتهي' },
        };
        return language === 'ar' ? statusTexts[status].ar : statusTexts[status].en;
    };

    const pendingOrders = orders.filter(order =>
        ['reserved', 'confirmed', 'ready'].includes(order.status)
    );

    const displayOrders = activeTab === 'pending' ? pendingOrders : orders;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background-light">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-text-light-secondary">{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-background-light pb-24">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-background-light/95 backdrop-blur-md border-b border-border-light">
                <div className="flex items-center px-4 py-3">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-card-light transition-colors"
                    >
                        <span className="material-symbols-outlined text-text-light-primary">arrow_back</span>
                    </button>
                    <h1 className="text-lg font-bold text-text-light-primary flex-1 text-center pr-10">
                        {t('orders.title')}
                    </h1>
                </div>

                {/* Tabs */}
                <div className="flex px-4 border-b border-border-light">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`flex-1 py-3 font-semibold text-sm text-center border-b-2 transition-colors ${activeTab === 'all'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-text-light-secondary hover:text-text-light-primary'
                            }`}
                    >
                        {language === 'ar' ? 'كل الطلبات' : 'All Orders'} ({orders.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`flex-1 py-3 font-semibold text-sm text-center border-b-2 transition-colors ${activeTab === 'pending'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-text-light-secondary hover:text-text-light-primary'
                            }`}
                    >
                        {language === 'ar' ? 'قيد الانتظار' : 'Pending'} ({pendingOrders.length})
                    </button>
                </div>
            </div>

            {/* Content */}
            <main className="flex-1 p-4">
                {displayOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-24 h-24 mb-6 flex items-center justify-center bg-card-light rounded-full">
                            <span className="material-symbols-outlined text-5xl text-text-light-secondary">shopping_bag</span>
                        </div>
                        <h2 className="text-xl font-bold text-text-light-primary mb-2">
                            {t('orders.noOrders')}
                        </h2>
                        <p className="text-text-light-secondary text-center mb-6">
                            {language === 'ar' ? 'لا توجد طلبات حتى الآن' : 'You have no orders yet'}
                        </p>
                        <Link
                            href="/"
                            className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                        >
                            {t('orders.startShopping')}
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {displayOrders.map((order) => (
                            <div
                                key={order.id}
                                className="bg-card-light rounded-2xl border border-border-light overflow-hidden shadow-sm"
                            >
                                {/* Order Header */}
                                <div className="p-4 border-b border-border-light">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            {order.stores?.logo_url ? (
                                                <img
                                                    src={order.stores.logo_url}
                                                    alt={order.stores.name}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-primary">store</span>
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="font-semibold text-text-light-primary">{order.stores?.name || 'Store'}</h3>
                                                <p className="text-xs text-text-light-secondary">
                                                    {new Date(order.created_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                                            {getStatusText(order.status)}
                                        </span>
                                    </div>

                                    {/* Pickup Code - Only for pending orders */}
                                    {['reserved', 'confirmed', 'ready'].includes(order.status) && (
                                        <div className="mt-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                                            <div className="flex flex-col items-center gap-3">
                                                {/* QR Code */}
                                                <div className="bg-white p-3 rounded-xl shadow-sm">
                                                    <img
                                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${order.pickup_code}&bgcolor=ffffff&color=000000&margin=0`}
                                                        alt="QR Code"
                                                        className="w-32 h-32"
                                                    />
                                                </div>

                                                {/* Pickup Code Text */}
                                                <div className="text-center">
                                                    <span className="text-xs text-text-light-secondary block mb-1">
                                                        {language === 'ar' ? 'كود الاستلام' : 'Pickup Code'}
                                                    </span>
                                                    <div className="flex items-center justify-center gap-2">
                                                        <span className="text-2xl font-bold text-primary tracking-[0.3em]">
                                                            {order.pickup_code}
                                                        </span>
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(order.pickup_code);
                                                            }}
                                                            className="p-1.5 hover:bg-primary/10 rounded-lg transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-primary text-[20px]">content_copy</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                {order.status === 'ready' && (
                                                    <p className="text-xs text-primary font-medium bg-primary/10 px-3 py-1.5 rounded-full">
                                                        {language === 'ar' ? '🎉 طلبك جاهز للاستلام!' : '🎉 Your order is ready for pickup!'}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Order Items */}
                                <div className="p-4">
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {order.items?.slice(0, 3).map((item, index) => (
                                            <div key={index} className="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-background-light">
                                                {item.product_image ? (
                                                    <img
                                                        src={item.product_image}
                                                        alt={item.product_name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-text-light-secondary">image</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {order.items && order.items.length > 3 && (
                                            <div className="shrink-0 w-16 h-16 rounded-lg bg-background-light flex items-center justify-center">
                                                <span className="text-sm font-semibold text-text-light-secondary">
                                                    +{order.items.length - 3}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Total */}
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-light">
                                        <span className="text-sm text-text-light-secondary">
                                            {order.items?.length || 0} {language === 'ar' ? 'منتج' : 'items'}
                                        </span>
                                        <span className="font-bold text-text-light-primary">
                                            {t('common.egp')} {order.total_amount.toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                {/* Store Location */}
                                {order.stores?.address && (
                                    <div className="px-4 pb-4">
                                        <a
                                            href={order.stores.maps_link || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.stores.address)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 p-2 bg-background-light rounded-lg text-sm text-text-light-secondary hover:bg-card-light transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[18px] text-primary">location_on</span>
                                            <span className="truncate flex-1">{order.stores.address}</span>
                                            <span className="material-symbols-outlined text-[16px] text-primary shrink-0">open_in_new</span>
                                        </a>
                                    </div>
                                )}

                                {/* Rate Store Button - only for completed orders that haven't been reviewed */}
                                {order.status === 'completed' && !reviewedOrders.has(order.id) && (
                                    <div className="px-4 pb-4">
                                        <button
                                            onClick={() => setReviewModal({
                                                orderId: order.id,
                                                storeId: order.store_id,
                                                storeName: order.stores?.name || '',
                                            })}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary/10 text-primary rounded-xl font-semibold text-sm hover:bg-primary/20 transition-colors border border-primary/20"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">star</span>
                                            {t('reviews.rateStore')}
                                        </button>
                                    </div>
                                )}

                                {/* Already reviewed badge */}
                                {order.status === 'completed' && reviewedOrders.has(order.id) && (
                                    <div className="px-4 pb-4">
                                        <div className="flex items-center justify-center gap-2 py-2 text-green-400 text-sm">
                                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                            {t('reviews.alreadyReviewed')}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Review Modal */}
            {reviewModal && (
                <>
                    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm" onClick={() => setReviewModal(null)} />
                    <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[101] bg-card-light rounded-2xl border border-border-light p-6 max-w-md mx-auto shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-text-light-primary">{t('reviews.rateStore')}</h3>
                            <button onClick={() => setReviewModal(null)} className="p-1 hover:bg-surface-light rounded-full">
                                <span className="material-symbols-outlined text-text-light-secondary">close</span>
                            </button>
                        </div>

                        <p className="text-sm text-text-light-secondary mb-4">{reviewModal.storeName}</p>

                        {/* Star Rating */}
                        <div className="mb-4">
                            <p className="text-sm font-medium text-text-light-primary mb-2">{t('reviews.yourRating')}</p>
                            <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setReviewRating(star)}
                                        className="transition-transform hover:scale-110"
                                    >
                                        <span className={`material-symbols-outlined text-[32px] ${star <= reviewRating ? 'text-amber-500 filled fill' : 'text-border-light'}`}>
                                            star
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Comment */}
                        <div className="mb-5">
                            <p className="text-sm font-medium text-text-light-primary mb-2">{t('reviews.yourComment')}</p>
                            <textarea
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 rounded-lg border border-border-light bg-background-light text-text-light-primary text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                                placeholder={t('reviews.writeReview')}
                            />
                        </div>

                        {/* Submit */}
                        <button
                            onClick={submitReview}
                            disabled={reviewSubmitting}
                            className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-light transition-colors disabled:opacity-50"
                        >
                            {reviewSubmitting ? '...' : t('reviews.submit')}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
