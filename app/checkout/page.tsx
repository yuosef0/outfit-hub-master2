'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Toast from '@/components/Toast';
import type { CartItem, Product } from '@/lib/types';

interface GroupedCartItems {
    [storeId: string]: {
        storeName: string;
        storeLogo?: string;
        storeAddress?: string;
        mapsLink?: string;
        items: (CartItem & { products: Product })[];
        total: number;
    };
}

export default function CheckoutPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [cartItems, setCartItems] = useState<(CartItem & { products: Product })[]>([]);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    const [formData, setFormData] = useState({
        customer_name: '',
        customer_phone: '',
    });

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login?redirect=/checkout');
                return;
            }

            // Fetch cart items
            const { data: cartData } = await supabase
                .from('cart_items')
                .select('*')
                .eq('user_id', user.id);

            if (!cartData || cartData.length === 0) {
                setToast({ message: 'السلة فارغة', type: 'error' });
                setTimeout(() => router.push('/'), 2000);
                return;
            }

            // Fetch products with store info
            const productIds = cartData.map(item => item.product_id);
            const { data: productsData } = await supabase
                .from('products')
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
                .in('id', productIds);

            const mergedItems = cartData.map((cartItem) => {
                const product = productsData?.find(p => p.id === cartItem.product_id);
                return {
                    ...cartItem,
                    products: product!
                };
            }).filter(item => item.products);

            setCartItems(mergedItems);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const groupedItems: GroupedCartItems = cartItems.reduce((acc, item) => {
        const storeId = item.products.stores?.id || '';
        if (!acc[storeId]) {
            acc[storeId] = {
                storeName: item.products.stores?.name || 'متجر',
                storeLogo: item.products.stores?.logo_url,
                storeAddress: item.products.stores?.address,
                mapsLink: item.products.stores?.maps_link,
                items: [],
                total: 0,
            };
        }
        acc[storeId].items.push(item);
        acc[storeId].total += item.products.price * item.quantity;
        return acc;
    }, {} as GroupedCartItems);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.customer_name.trim() || !formData.customer_phone.trim()) {
            setToast({ message: 'برجاء إدخال الاسم ورقم الهاتف', type: 'error' });
            return;
        }

        setSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const orderIds: string[] = [];

            // Create an order for each store
            for (const [storeId, group] of Object.entries(groupedItems)) {
                const commission = group.total * 0.03; // 3% commission
                const pickupCode = Math.floor(100000 + Math.random() * 900000).toString();
                const expiresAt = new Date();
                expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

                const orderData = {
                    customer_id: user.id,
                    customer_name: formData.customer_name,
                    customer_phone: formData.customer_phone,
                    customer_email: user.email,
                    store_id: storeId,
                    pickup_code: pickupCode,
                    status: 'reserved',
                    total_amount: group.total,
                    commission_amount: commission,
                    items: group.items.map(item => ({
                        product_id: item.product_id,
                        product_name: item.products.name,
                        product_image: item.products.image_urls?.[0],
                        quantity: item.quantity,
                        price: item.products.price,
                    })),
                    expires_at: expiresAt.toISOString(),
                };

                const { data: order, error } = await supabase
                    .from('orders')
                    .insert(orderData)
                    .select()
                    .single();

                if (error) throw error;
                orderIds.push(order.id);
            }

            // Clear cart
            await supabase
                .from('cart_items')
                .delete()
                .eq('user_id', user.id);

            // Redirect to confirmation
            router.push(`/confirmation?orders=${orderIds.join(',')}`);
        } catch (error: any) {
            console.error('Error creating orders:', error);
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint,
                full: JSON.stringify(error, null, 2)
            });
            setToast({ message: error.message || error.details || 'حدث خطأ أثناء إنشاء الطلب', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background-light flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-text-light-secondary">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    const grandTotal = Object.values(groupedItems).reduce((sum, group) => sum + group.total, 0);

    return (
        <div className="min-h-screen bg-background-light pb-24">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <div className="bg-card-light border-b border-border-light sticky top-0 z-10">
                <div className="px-4 py-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-card-light rounded-lg transition-colors"
                        >
                            <span className="material-symbols-outlined text-text-light-secondary">arrow_back</span>
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-text-light-primary ">
                                🛒 إتمام الطلب
                            </h1>
                            <p className="text-text-light-secondary text-sm">
                                أكمل بياناتك لتأكيد الطلب
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <main className="p-4 max-w-3xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Customer Info */}
                    <div className="bg-card-light rounded-xl p-5 border border-border-light">
                        <h2 className="text-lg font-bold text-text-light-primary mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">person</span>
                            بيانات العميل
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-light-primary mb-2 text-right">
                                    الاسم الكامل *
                                </label>
                                <input
                                    type="text"
                                    value={formData.customer_name}
                                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-border-light bg-background-light text-text-light-primary focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                                    placeholder="أدخل اسمك الكامل"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-light-primary mb-2 text-right">
                                    رقم الهاتف *
                                </label>
                                <input
                                    type="tel"
                                    value={formData.customer_phone}
                                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-border-light bg-background-light text-text-light-primary focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                                    placeholder="01XXXXXXXXX"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Orders Summary by Store */}
                    {Object.entries(groupedItems).map(([storeId, group]) => (
                        <div key={storeId} className="bg-card-light rounded-xl p-5 border border-border-light">
                            {/* Store Header */}
                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-border-light">
                                <div className="flex items-center gap-3">
                                    {group.storeLogo ? (
                                        <img src={group.storeLogo} alt={group.storeName} className="w-12 h-12 rounded-lg object-cover" />
                                    ) : (
                                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                            <span className="material-symbols-outlined text-primary">store</span>
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-bold text-text-light-primary ">{group.storeName}</h3>
                                        {group.storeAddress && (
                                            <p className="text-sm text-text-light-secondary">{group.storeAddress}</p>
                                        )}
                                    </div>
                                </div>
                                {group.mapsLink && (
                                    <a
                                        href={group.mapsLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-sm text-primary hover:underline"
                                    >
                                        <span className="material-symbols-outlined text-base">location_on</span>
                                        العنوان
                                    </a>
                                )}
                            </div>

                            {/* Items */}
                            <div className="space-y-3 mb-4">
                                {group.items.map((item) => (
                                    <div key={item.id} className="flex items-center gap-3">
                                        {item.products.image_urls?.[0] && (
                                            <img
                                                src={item.products.image_urls[0]}
                                                alt={item.products.name}
                                                className="w-16 h-16 rounded-lg object-cover"
                                            />
                                        )}
                                        <div className="flex-1">
                                            <p className="font-medium text-text-light-primary ">{item.products.name}</p>
                                            <p className="text-sm text-text-light-secondary">
                                                {item.quantity} × {item.products.price.toFixed(2)} ج.م
                                            </p>
                                            {(item.size || item.color) && (
                                                <div className="flex gap-2 mt-1">
                                                    {item.size && (
                                                        <span className="text-xs bg-surface-light px-2 py-0.5 rounded text-text-light-secondary border border-border-light">
                                                            Size: {item.size}
                                                        </span>
                                                    )}
                                                    {item.color && (
                                                        <span className="text-xs bg-surface-light px-2 py-0.5 rounded text-text-light-secondary border border-border-light flex items-center gap-1">
                                                            Color:
                                                            <span
                                                                className="w-2.5 h-2.5 rounded-full border border-border-light inline-block"
                                                                style={{ backgroundColor: item.color }}
                                                            ></span>
                                                            {item.color}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <p className="font-bold text-primary">
                                            {(item.quantity * item.products.price).toFixed(2)} ج.م
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Store Total */}
                            <div className="pt-3 border-t border-border-light flex justify-between items-center">
                                <span className="font-bold text-text-light-primary ">الإجمالي:</span>
                                <span className="text-xl font-bold text-primary">{group.total.toFixed(2)} ج.م</span>
                            </div>
                        </div>
                    ))}

                    {/* Grand Total & Submit */}
                    <div className="bg-gradient-to-r from-primary to-green-600 text-white rounded-xl p-5">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-lg font-bold">المجموع الكلي:</span>
                            <span className="text-2xl font-bold">{grandTotal.toFixed(2)} ج.م</span>
                        </div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-card-light text-primary hover:bg-card-light font-bold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'جاري التأكيد...' : 'تأكيد الطلب'}
                        </button>
                        <p className="text-sm text-white/80 text-center mt-3">
                            💰 الدفع نقداً عند الاستلام من المتجر
                        </p>
                    </div>
                </form>
            </main>
        </div>
    );
}
