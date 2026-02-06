'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Toast from '@/components/Toast';
import { Order, OrderStatus } from '@/lib/types';

type TabStatus = OrderStatus | 'all';

const STATUS_TABS: { value: TabStatus; label: string; icon: string }[] = [
    { value: 'reserved', label: 'جديد', icon: '🆕' },
    { value: 'confirmed', label: 'مؤكد', icon: '✅' },
    { value: 'ready', label: 'جاهز', icon: '📦' },
    { value: 'completed', label: 'مكتمل', icon: '✔️' },
    { value: 'cancelled', label: 'ملغي', icon: '❌' },
];

export default function OrdersPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [storeId, setStoreId] = useState<string | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [activeTab, setActiveTab] = useState<TabStatus>('reserved');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showPickupCodeModal, setShowPickupCodeModal] = useState(false);
    const [pickupCode, setPickupCode] = useState(['', '', '', '', '', '']);
    const [pickupAttempts, setPickupAttempts] = useState(0);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        checkStoreAndFetchOrders();

        // Setup notification sound
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio('/notification.mp3');
        }
    }, []);

    // Real-time订阅 for new orders
    useEffect(() => {
        if (!storeId) return;

        const channel = supabase
            .channel('orders')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'orders',
                    filter: `store_id=eq.${storeId}`,
                },
                (payload) => {
                    const newOrder = payload.new as Order;
                    setOrders((prev) => [newOrder, ...prev]);

                    // Play notification sound
                    if (audioRef.current) {
                        audioRef.current.play().catch(console.error);
                    }

                    setToast({ message: 'طلب جديد! 🛍️', type: 'success' });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [storeId]);

    const checkStoreAndFetchOrders = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data: store } = await supabase
                .from('stores')
                .select('id, is_active')
                .eq('merchant_id', user.id)
                .single();

            if (!store) {
                router.push('/merchant/setup');
                return;
            }

            if (!store.is_active) {
                router.push('/merchant/pending');
                return;
            }

            setStoreId(store.id);
            await fetchOrders(store.id);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async (storeId: string) => {
        console.log('[Orders] Fetching orders for store:', storeId);

        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('store_id', storeId)
            .order('created_at', { ascending: false });

        console.log('[Orders] Response - Data:', data, 'Error:', error);

        if (error) {
            console.error('Error fetching orders:', error);
            console.error('Error type:', typeof error);
            console.error('Error keys:', Object.keys(error));
            console.error('Error stringified:', JSON.stringify(error, null, 2));
            return;
        }

        setOrders(data || []);
    };

    const getOrdersByStatus = (status: TabStatus) => {
        if (status === 'all') return orders;
        return orders.filter(o => o.status === status);
    };

    const getStatusCount = (status: TabStatus) => {
        return getOrdersByStatus(status).length;
    };

    const calculateTimeRemaining = (expiresAt: string) => {
        const now = new Date();
        const expires = new Date(expiresAt);
        const diff = expires.getTime() - now.getTime();

        if (diff <= 0) return 'منتهي';

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        return `${hours} ساعة و ${minutes} دقيقة`;
    };

    const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
        const updateData: any = { status: newStatus };

        if (newStatus === 'completed') {
            updateData.completed_at = new Date().toISOString();

            // Reduce stock quantity for each item in the order
            const order = orders.find(o => o.id === orderId);
            if (order && order.items) {
                for (const item of order.items) {
                    // Get current product stock
                    const { data: product } = await supabase
                        .from('products')
                        .select('stock_quantity')
                        .eq('id', item.product_id)
                        .single();

                    if (product && product.stock_quantity >= item.quantity) {
                        // Reduce stock
                        await supabase
                            .from('products')
                            .update({ stock_quantity: product.stock_quantity - item.quantity })
                            .eq('id', item.product_id);
                    }
                }
            }
        }

        const { error } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', orderId);

        if (error) {
            setToast({ message: 'حدث خطأ أثناء تحديث حالة الطلب', type: 'error' });
            return;
        }

        setToast({ message: 'تم تحديث حالة الطلب بنجاح ✅', type: 'success' });

        // Update local state
        setOrders(orders.map(o =>
            o.id === orderId ? { ...o, status: newStatus, ...updateData } : o
        ));

        if (selectedOrder?.id === orderId) {
            setSelectedOrder({ ...selectedOrder, status: newStatus, ...updateData });
        }
    };

    const handlePickupCodeChange = (index: number, value: string) => {
        if (value.length > 1) return;

        if (!/^\d*$/.test(value)) return;

        const newCode = [...pickupCode];
        newCode[index] = value;
        setPickupCode(newCode);

        // Auto-focus next input
        if (value && index < 5) {
            codeInputRefs.current[index + 1]?.focus();
        }
    };

    const handlePickupCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !pickupCode[index] && index > 0) {
            codeInputRefs.current[index - 1]?.focus();
        }
    };

    const validatePickupCode = async () => {
        if (!selectedOrder) return;

        const enteredCode = pickupCode.join('');

        if (enteredCode !== selectedOrder.pickup_code) {
            setPickupAttempts(prev => prev + 1);

            if (pickupAttempts >= 2) {
                setToast({
                    message: '❌ الكود غير صحيح. تم قفل المحاولات لمدة 5 دقائق',
                    type: 'error'
                });
                setShowPickupCodeModal(false);
                setPickupAttempts(0);
                setPickupCode(['', '', '', '', '', '']);
                return;
            }

            setToast({
                message: `❌ الكود غير صحيح. المحاولات المتبقية: ${3 - pickupAttempts - 1}`,
                type: 'error'
            });
            setPickupCode(['', '', '', '', '', '']);
            codeInputRefs.current[0]?.focus();
            return;
        }

        // Code is correct
        await updateOrderStatus(selectedOrder.id, 'completed');
        setShowPickupCodeModal(false);
        setSelectedOrder(null);
        setPickupCode(['', '', '', '', '', '']);
        setPickupAttempts(0);

        setToast({
            message: '✅ تم الاستلام! العميل يدفع ' + selectedOrder.total_amount.toFixed(2) + ' ج.م نقداً',
            type: 'success'
        });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `منذ ${minutes} دقيقة`;
        if (hours < 24) return `منذ ${hours} ساعة`;
        return `منذ ${days} يوم`;
    };

    if (loading) {
        return (
            <div className="bg-background-light min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-text-light-secondary">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    const filteredOrders = getOrdersByStatus(activeTab);

    return (
        <div className="bg-background-light pb-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <div className="bg-card-light border-b border-border-light sticky top-0 z-10">
                <div className="px-4 py-4">
                    <h1 className="text-2xl font-bold text-text-light-primary ">
                        📦 الطلبات
                    </h1>
                    <p className="text-text-light-secondary text-sm mt-0.5">
                        إدارة طلبات متجرك ({orders.length} طلب)
                    </p>
                </div>

                {/* Tabs */}
                <div className="px-4 pb-2 overflow-x-auto">
                    <div className="flex gap-2 min-w-max">
                        {STATUS_TABS.map((tab) => {
                            const count = getStatusCount(tab.value);
                            return (
                                <button
                                    key={tab.value}
                                    onClick={() => setActiveTab(tab.value)}
                                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeTab === tab.value
                                        ? 'bg-primary text-white'
                                        : 'bg-card-light text-text-light-secondary hover:bg-surface-light'
                                        }`}
                                >
                                    {tab.icon} {tab.label} {count > 0 && `(${count})`}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <main className="p-4 max-w-5xl mx-auto">
                {filteredOrders.length > 0 ? (
                    <div className="space-y-4">
                        {filteredOrders.map((order) => (
                            <div
                                key={order.id}
                                className="bg-card-light rounded-xl p-5 border border-border-light"
                            >
                                {/* Order Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-lg font-bold text-text-light-primary ">
                                                طلب #{order.id.slice(0, 8)}
                                            </p>
                                            <span className="text-sm text-text-light-secondary">
                                                {formatDate(order.created_at)}
                                            </span>
                                        </div>
                                        {order.customer && (
                                            <div className="text-sm text-text-light-secondary">
                                                <p className="font-medium">العميل: {order.customer.full_name || 'غير متوفر'}</p>
                                                {order.customer.phone && (
                                                    <p className="flex items-center gap-1 mt-1">
                                                        <span className="material-symbols-outlined text-sm">phone</span>
                                                        {order.customer.phone}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {order.status === 'reserved' && order.expires_at && (
                                        <div className="text-right">
                                            <p className="text-xs text-text-light-secondary">⏰ الحجز ساري حتى</p>
                                            <p className="text-sm font-bold text-yellow-400">
                                                {calculateTimeRemaining(order.expires_at)}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Products */}
                                <div className="mb-4">
                                    <p className="text-sm font-bold text-text-light-primary mb-2">المنتجات:</p>
                                    <div className="space-y-2">
                                        {order.items.map((item, index) => (
                                            <div key={index} className="flex items-center gap-3 p-2 bg-card-light rounded-lg">
                                                {item.product_image && (
                                                    <img
                                                        src={item.product_image}
                                                        alt={item.product_name}
                                                        className="w-12 h-12 object-cover rounded"
                                                    />
                                                )}
                                                <div className="flex-1 text-right">
                                                    <p className="text-sm font-medium text-text-light-primary ">
                                                        • {item.product_name}
                                                        {item.size && ` (${item.size})`}
                                                        {item.color && `, ${item.color}`}
                                                        {item.quantity > 1 && ` x${item.quantity}`}
                                                    </p>
                                                    <p className="text-xs text-text-light-secondary">
                                                        = {item.price.toFixed(2)} ج.م
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Financial Summary */}
                                <div className="border-t border-border-light pt-3 mb-4 space-y-1 text-right">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-text-light-secondary">الإجمالي:</span>
                                        <span className="font-bold text-text-light-primary ">
                                            {order.total_amount.toFixed(2)} ج.م
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-text-light-secondary">العمولة (3%):</span>
                                        <span className="font-medium text-red-400">
                                            {order.commission_amount.toFixed(2)} ج.م
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-base">
                                        <span className="font-bold text-text-light-primary">صافي الربح:</span>
                                        <span className="font-bold text-primary">
                                            {(order.total_amount - order.commission_amount).toFixed(2)} ج.م
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    {order.status === 'reserved' && (
                                        <>
                                            <button
                                                onClick={() => updateOrderStatus(order.id, 'confirmed')}
                                                className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-primary-light text-white rounded-lg font-bold transition-colors"
                                            >
                                                ✅ تأكيد وتجهيز
                                            </button>
                                            <button
                                                onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                                className="px-4 py-2.5 bg-red-900/30 hover:bg-red-900/40 text-red-400 rounded-lg font-bold transition-colors"
                                            >
                                                ❌ رفض
                                            </button>
                                        </>
                                    )}
                                    {order.status === 'confirmed' && (
                                        <button
                                            onClick={() => updateOrderStatus(order.id, 'ready')}
                                            className="flex-1 px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-bold transition-colors"
                                        >
                                            📦 الطلب جاهز
                                        </button>
                                    )}
                                    {order.status === 'ready' && (
                                        <button
                                            onClick={() => {
                                                setSelectedOrder(order);
                                                setShowPickupCodeModal(true);
                                                setTimeout(() => codeInputRefs.current[0]?.focus(), 100);
                                            }}
                                            className="flex-1 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold transition-colors"
                                        >
                                            🔐 تأكيد الاستلام
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-card-light rounded-xl p-12 border border-border-light text-center">
                        <div className="w-24 h-24 bg-card-light rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-5xl text-text-light-secondary">
                                shopping_bag
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-text-light-primary mb-2">
                            لا توجد طلبات
                        </h3>
                        <p className="text-text-light-secondary">
                            {activeTab === 'reserved' ? 'لا توجد طلبات جديدة حالياً' : `لا توجد طلبات ${STATUS_TABS.find(t => t.value === activeTab)?.label || ''}`}
                        </p>
                    </div>
                )}
            </main>

            {/* Pickup Code Modal */}
            {showPickupCodeModal && selectedOrder && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                    onClick={() => {
                        setShowPickupCodeModal(false);
                        setPickupCode(['', '', '', '', '', '']);
                        setPickupAttempts(0);
                    }}
                >
                    <div
                        className="bg-card-light rounded-2xl p-6 max-w-md w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-4xl text-primary">lock</span>
                            </div>
                            <h2 className="text-2xl font-bold text-text-light-primary mb-2">
                                🔐 تأكيد الاستلام
                            </h2>
                            <p className="text-sm text-text-light-secondary">
                                أدخل كود الاستلام من العميل
                            </p>
                        </div>

                        {/* Code Input */}
                        <div className="flex gap-2 justify-center mb-6" dir="ltr">
                            {pickupCode.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => { codeInputRefs.current[index] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handlePickupCodeChange(index, e.target.value)}
                                    onKeyDown={(e) => handlePickupCodeKeyDown(index, e)}
                                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-border-light rounded-lg bg-card-light text-text-light-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                />
                            ))}
                        </div>

                        {/* Info */}
                        <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4 mb-6 text-center">
                            <p className="text-sm text-blue-300">
                                أو امسح QR Code من هاتف العميل
                            </p>
                        </div>

                        {/* Order Summary */}
                        <div className="bg-card-light rounded-lg p-4 mb-6 text-right">
                            <p className="text-sm text-text-light-secondary mb-2">ملخص الطلب:</p>
                            <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-light-secondary">المبلغ:</span>
                                    <span className="font-bold text-text-light-primary ">
                                        {selectedOrder.total_amount.toFixed(2)} ج.م
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-light-secondary">العمولة:</span>
                                    <span className="font-medium text-red-400">
                                        {selectedOrder.commission_amount.toFixed(2)} ج.م (3%)
                                    </span>
                                </div>
                                <div className="pt-2 border-t border-border-light">
                                    <p className="text-xs text-center text-text-light-secondary">
                                        "العميل يدفع <span className="font-bold">{selectedOrder.total_amount.toFixed(2)} ج.م</span> نقداً مباشرة ليك في المتجر"
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowPickupCodeModal(false);
                                    setPickupCode(['', '', '', '', '', '']);
                                    setPickupAttempts(0);
                                }}
                                className="flex-1 px-4 py-3 bg-surface-light hover:bg-surface-light text-text-light-primary font-bold rounded-lg transition-colors"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={validatePickupCode}
                                disabled={pickupCode.some(d => !d)}
                                className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                ✅ تأكيد الاستلام
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
