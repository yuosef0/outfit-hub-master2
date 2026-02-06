'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { QRCodeSVG } from 'qrcode.react';
import type { Order } from '@/lib/types';

function ConfirmationContent() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const [loading, setLoading] = useState(true);
 const [orders, setOrders] = useState<Order[]>([]);

 const supabase = createBrowserClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 );

 useEffect(() => {
 fetchOrders();
 }, []);

 const fetchOrders = async () => {
 try {
 const orderIds = searchParams.get('orders')?.split(',') || [];
 if (orderIds.length === 0) {
 router.push('/');
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
 maps_link,
 phone
 )
 `)
 .in('id', orderIds);

 if (error) throw error;
 setOrders(data || []);
 } catch (error) {
 console.error('Error:', error);
 } finally {
 setLoading(false);
 }
 };

 const formatExpiryTime = (expiresAt: string) => {
 const now = new Date();
 const expires = new Date(expiresAt);
 const diff = expires.getTime() - now.getTime();

 if (diff <= 0) return 'منتهي';

 const hours = Math.floor(diff / (1000 * 60 * 60));
 const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

 return `${hours} ساعة و ${minutes} دقيقة`;
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

 return (
 <div className="min-h-screen bg-background-light pb-24">
 {/* Header */}
 <div className="bg-gradient-to-r from-primary to-green-600 text-white">
 <div className="px-4 py-8 text-center">
 <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
 <span className="material-symbols-outlined text-5xl">check_circle</span>
 </div>
 <h1 className="text-2xl font-bold mb-2">
 ✅ تم تأكيد طلبك بنجاح!
 </h1>
 <p className="text-white/90">
 احتفظ برموز الاستلام التالية
 </p>
 </div>
 </div>

 <main className="p-4 max-w-3xl mx-auto -mt-6">
 {/* Orders */}
 <div className="space-y-4">
 {orders.map((order) => (
 <div key={order.id} className="bg-card-light rounded-xl overflow-hidden border border-border-light shadow-lg">
 {/* Store Header */}
 <div className="bg-gradient-to-r from-primary/10 to-green-600/10 p-5 border-b border-border-light">
 <div className="flex items-center gap-3 mb-3">
 {order.stores?.logo_url ? (
 <img src={order.stores.logo_url} alt={order.stores.name} className="w-14 h-14 rounded-lg object-cover"/>
 ) : (
 <div className="w-14 h-14 bg-primary/20 rounded-lg flex items-center justify-center">
 <span className="material-symbols-outlined text-primary text-2xl">store</span>
 </div>
 )}
 <div className="flex-1">
 <h2 className="text-lg font-bold text-text-light-primary ">
 {order.stores?.name || 'متجر'}
 </h2>
 {order.stores?.address && (
 <p className="text-sm text-text-light-secondary flex items-center gap-1">
 <span className="material-symbols-outlined text-sm">location_on</span>
 {order.stores.address}
 </p>
 )}
 </div>
 {order.stores?.maps_link && (
 <a
 href={order.stores.maps_link}
 target="_blank"
 rel="noopener noreferrer"
 className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-bold"
 >
 📍 الخريطة
 </a>
 )}
 </div>
 {order.stores?.phone && (
 <a
 href={`tel:${order.stores.phone}`}
 className="flex items-center justify-center gap-2 w-full py-2 bg-card-light rounded-lg text-primary hover:bg-card-light transition-colors"
 >
 <span className="material-symbols-outlined">phone</span>
 <span className="font-medium">{order.stores.phone}</span>
 </a>
 )}
 </div>

 {/* QR Code Section */}
 <div className="p-6 text-center">
 <div className="inline-block p-6 bg-card-light rounded-2xl border-4 border-primary mb-4">
 <QRCodeSVG
 value={order.pickup_code}
 size={200}
 level="H"
 includeMargin={true}
 />
 </div>
 <div className="bg-card-light rounded-xl p-4 mb-4">
 <p className="text-sm text-text-light-secondary mb-2">رمز الاستلام</p>
 <p className="text-4xl font-bold text-primary tracking-wider">
 {order.pickup_code}
 </p>
 </div>
 <div className="flex items-center justify-center gap-2 text-sm text-text-light-secondary">
 <span className="material-symbols-outlined text-orange-500">schedule</span>
 <span>صالح لمدة {formatExpiryTime(order.expires_at)}</span>
 </div>
 </div>

 {/* Order Items */}
 <div className="px-5 pb-5">
 <h3 className="font-bold text-text-light-primary mb-3 flex items-center gap-2">
 <span className="material-symbols-outlined text-primary">shopping_bag</span>
 تفاصيل الطلب
 </h3>
 <div className="space-y-2 mb-4">
 {order.items.map((item: any, index: number) => (
 <div key={index} className="flex items-center justify-between text-sm">
 <div className="flex items-center gap-2">
 {item.product_image && (
 <img src={item.product_image} alt={item.product_name} className="w-10 h-10 rounded object-cover"/>
 )}
 <span className="text-text-light-primary">
 {item.product_name} × {item.quantity}
 </span>
 </div>
 <span className="font-medium text-primary">
 {(item.price * item.quantity).toFixed(2)} ج.م
 </span>
 </div>
 ))}
 </div>
 <div className="pt-3 border-t border-border-light flex justify-between items-center">
 <span className="font-bold text-text-light-primary ">المبلغ المستحق:</span>
 <span className="text-2xl font-bold text-primary">{order.total_amount.toFixed(2)} ج.م</span>
 </div>
 <div className="mt-3 p-3 bg-yellow-900/20 rounded-lg">
 <p className="text-sm text-yellow-200 flex items-center gap-2">
 <span className="material-symbols-outlined text-base">info</span>
 الدفع نقداً عند الاستلام من المتجر
 </p>
 </div>
 </div>
 </div>
 ))}
 </div>

 {/* Instructions */}
 <div className="bg-blue-900/20 rounded-xl p-5 mt-5 border border-blue-800">
 <h3 className="font-bold text-blue-100 mb-3 flex items-center gap-2">
 <span className="material-symbols-outlined">help</span>
 تعليمات الاستلام
 </h3>
 <ul className="space-y-2 text-sm text-blue-200">
 <li className="flex items-start gap-2">
 <span className="material-symbols-outlined text-base mt-0.5">check_circle</span>
 <span>اذهب للمتجر خلال 24 ساعة</span>
 </li>
 <li className="flex items-start gap-2">
 <span className="material-symbols-outlined text-base mt-0.5">check_circle</span>
 <span>أظهر رمز QR أو الرقم للتاجر</span>
 </li>
 <li className="flex items-start gap-2">
 <span className="material-symbols-outlined text-base mt-0.5">check_circle</span>
 <span>ادفع المبلغ نقداً واستلم طلبك</span>
 </li>
 </ul>
 </div>

 {/* Action Buttons */}
 <div className="flex gap-3 mt-5">
 <button
 onClick={() => router.push('/')}
 className="flex-1 px-6 py-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-bold"
 >
 العودة للرئيسية
 </button>
 <button
 onClick={() => window.print()}
 className="px-6 py-4 bg-surface-light text-text-light-primary rounded-lg hover:bg-surface-light transition-colors font-bold"
 >
 <span className="material-symbols-outlined">print</span>
 </button>
 </div>
 </main>
 </div>
 );
}

export default function ConfirmationPage() {
 return (
 <Suspense fallback={
 <div className="min-h-screen bg-background-light flex items-center justify-center">
 <div className="text-center">
 <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
 <p className="text-text-light-secondary">جاري التحميل...</p>
 </div>
 </div>
 }>
 <ConfirmationContent />
 </Suspense>
 );
}
