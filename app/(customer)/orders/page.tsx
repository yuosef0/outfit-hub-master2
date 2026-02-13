'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { Order, OrderStatus } from '@/lib/types';
import ReviewModal from '@/components/ReviewModal';
import Toast from '@/components/Toast';

export default function OrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
    const { t, language } = useLanguage();
    const [reviewedOrders, setReviewedOrders] = useState<Set<string>>(new Set());
    const [reviewModalData, setReviewModalData] = useState<{ orderId: string; storeId: string; storeName: string } | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [completedOrder, setCompletedOrder] = useState<{ id: string; storeName: string } | null>(null);

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

                setUserId(user.id);

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

    // Real-time subscription: update order status instantly when merchant completes pickup
    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel(`customer-orders-realtime-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `customer_id=eq.${userId}`,
                },
                (payload) => {
                    const updated = payload.new as any;

                    // Use functional update so we have access to current state
                    setOrders((prev) => {
                        const current = prev.find((o) => o.id === updated.id);

                        // Show congratulations modal when order transitions to completed
                        if (updated.status === 'completed' && current?.status !== 'completed') {
                            setCompletedOrder({
                                id: updated.id,
                                storeName: current?.stores?.name || 'المتجر',
                            });
                        }

                        return prev.map((o) =>
                            o.id === updated.id
                                ? { ...o, ...updated, stores: o.stores }
                                : o
                        );
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, supabase]);

    const handleReviewSuccess = () => {
        if (reviewModalData) {
            setReviewedOrders(prev => new Set([...prev, reviewModalData.orderId]));
            setReviewModalData(null);
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
        const statusKeys: Record<OrderStatus, string> = {
            'reserved': 'orders.reserved',
            'confirmed': 'orders.confirmed',
            'ready': 'orders.ready',
            'completed': 'orders.delivered',
            'cancelled': 'orders.cancelled',
            'expired': 'orders.expired',
        };
        return t(statusKeys[status]);
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
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
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
                        {t('orders.allOrders')} ({orders.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`flex-1 py-3 font-semibold text-sm text-center border-b-2 transition-colors ${activeTab === 'pending'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-text-light-secondary hover:text-text-light-primary'
                            }`}
                    >
                        {t('orders.pendingTab')} ({pendingOrders.length})
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
                            {t('orders.noOrdersYet')}
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

                                    {/* Pickup Code - Only for active (not expired, not completed) orders */}
                                    {['reserved', 'confirmed', 'ready'].includes(order.status) && new Date(order.expires_at) > new Date() && (
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
                                                        {t('orders.pickupCode')}
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
                                                        {t('orders.readyForPickup')}
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
                                            {order.items?.length || 0} {t('orders.items')}
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
                                            onClick={() => setReviewModalData({
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
            {reviewModalData && (
                <ReviewModal
                    isOpen={!!reviewModalData}
                    onClose={() => setReviewModalData(null)}
                    storeId={reviewModalData.storeId}
                    storeName={reviewModalData.storeName}
                    orderId={reviewModalData.orderId}
                    onSuccess={handleReviewSuccess}
                />
            )}

            {/* 🎉 Congratulations Modal — shown when merchant completes the order */}
            {completedOrder && (
                <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-card-light rounded-3xl p-8 max-w-sm w-full border border-border-light shadow-2xl text-center">
                        {/* Animated checkmark */}
                        <div className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5 animate-bounce">
                            <span className="material-symbols-outlined text-green-500 text-6xl">check_circle</span>
                        </div>

                        <h2 className="text-2xl font-bold text-text-light-primary mb-2">
                            تم الاستلام! 🎉
                        </h2>

                        <p className="text-text-light-secondary mb-1 text-sm">
                            شكراً لك على تسوقك من
                        </p>
                        <p className="text-primary font-bold text-lg mb-4">
                            {completedOrder.storeName}
                        </p>

                        <p className="text-sm text-text-light-secondary mb-7 leading-relaxed">
                            نتمنى أن تكون راضياً عن تجربتك معنا 💙<br />
                            يسعدنا خدمتك دائماً
                        </p>

                        <button
                            onClick={() => setCompletedOrder(null)}
                            className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-primary/90 transition-colors shadow-md"
                        >
                            رائع! 👍
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
