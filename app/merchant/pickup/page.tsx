'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Html5Qrcode } from 'html5-qrcode';
import Toast from '@/components/Toast';
import type { Order } from '@/lib/types';

export default function PickupPage() {
 const router = useRouter();
 const [loading, setLoading] = useState(true);
 const [storeId, setStoreId] = useState<string | null>(null);
 const [scanning, setScanning] = useState(false);
 const [manualCode, setManualCode] = useState('');
 const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
 const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
 const [showConfirmModal, setShowConfirmModal] = useState(false);

 const scannerRef = useRef<Html5Qrcode | null>(null);
 const isScanning = useRef(false);

 const supabase = createBrowserClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 );

 useEffect(() => {
 checkStoreAndInit();
 return () => {
 stopScanner();
 };
 }, []);

 const checkStoreAndInit = async () => {
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
 } catch (error) {
 console.error('Error:', error);
 } finally {
 setLoading(false);
 }
 };

 const startScanner = async () => {
 if (isScanning.current || !storeId) return;

 try {
 setScanning(true);
 isScanning.current = true;

 // Wait for DOM to update before initializing scanner
 await new Promise(resolve => setTimeout(resolve, 100));

 const html5QrCode = new Html5Qrcode('qr-reader');
 scannerRef.current = html5QrCode;

 await html5QrCode.start(
 { facingMode: 'environment' },
 {
 fps: 10,
 qrbox: { width: 250, height: 250 }
 },
 (decodedText) => {
 handleScanSuccess(decodedText);
 },
 (errorMessage) => {
 // Ignore scan errors
 }
 );
 } catch (err: any) {
 console.error('Scanner error:', err);
 let errorMessage = 'خطأ في تشغيل الكاميرا';

 // Check if it's HTTPS issue
 if (err.toString().includes('not supported') || err.toString().includes('streaming')) {
 errorMessage = '⚠️ الكاميرا تحتاج HTTPS. استخدم ngrok أو ادخل من localhost';
 } else if (err.toString().includes('Permission')) {
 errorMessage = 'برجاء السماح بالوصول للكاميرا';
 }

 setToast({ message: errorMessage, type: 'error' });
 setScanning(false);
 isScanning.current = false;
 }
 };

 const stopScanner = async () => {
 if (scannerRef.current && isScanning.current) {
 try {
 await scannerRef.current.stop();
 scannerRef.current.clear();
 } catch (err) {
 console.error('Error stopping scanner:', err);
 }
 }
 setScanning(false);
 isScanning.current = false;
 scannerRef.current = null;
 };

 const handleScanSuccess = async (code: string) => {
 await stopScanner();
 await verifyPickupCode(code);
 };

 const handleManualSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (manualCode.length === 6) {
 await verifyPickupCode(manualCode);
 }
 };

 const verifyPickupCode = async (code: string) => {
 if (!storeId) return;

 try {
 const { data: order, error } = await supabase
 .from('orders')
 .select('*')
 .eq('pickup_code', code)
 .eq('store_id', storeId)
 .single();

 if (error || !order) {
 setToast({ message: 'الكود غير صحيح أو منتهي', type: 'error' });
 setManualCode('');
 return;
 }

 if (order.status === 'completed') {
 setToast({ message: 'تم استلام هذا الطلب مسبقاً', type: 'error' });
 setManualCode('');
 return;
 }

 if (order.status === 'cancelled' || order.status === 'expired') {
 setToast({ message: 'هذا الطلب ملغي أو منتهي', type: 'error' });
 setManualCode('');
 return;
 }

 // Check if expired
 const expiresAt = new Date(order.expires_at);
 if (expiresAt < new Date()) {
 setToast({ message: 'هذا الطلب منتهي الصلاحية', type: 'error' });
 setManualCode('');
 return;
 }

 setSelectedOrder(order);
 setShowConfirmModal(true);
 } catch (err: any) {
 console.error('Error:', err);
 setToast({ message: 'حدث خطأ أثناء التحقق', type: 'error' });
 }
 };

 const completePickup = async () => {
 if (!selectedOrder) return;

 try {
 const { error } = await supabase
 .from('orders')
 .update({
 status: 'completed',
 completed_at: new Date().toISOString()
 })
 .eq('id', selectedOrder.id);

 if (error) throw error;

 setToast({ message: '✅ تم تسليم الطلب بنجاح!', type: 'success' });
 setShowConfirmModal(false);
 setSelectedOrder(null);
 setManualCode('');
 } catch (err: any) {
 console.error('Error:', err);
 setToast({ message: 'حدث خطأ أثناء تأكيد التسليم', type: 'error' });
 }
 };

 if (loading) {
 return (
 <div className="flex items-center justify-center"style={{ minHeight: 'calc(100vh - 4rem)' }}>
 <div className="text-center">
 <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
 <p className="text-text-light-secondary">جاري التحميل...</p>
 </div>
 </div>
 );
 }

 return (
 <div className="bg-background-light min-h-screen">
 {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

 {/* Header */}
 <div className="bg-card-light border-b border-border-light sticky top-0 z-10">
 <div className="px-4 py-4">
 <h1 className="text-2xl font-bold text-text-light-primary ">
 📦 تسليم الطلبات
 </h1>
 <p className="text-text-light-secondary text-sm mt-0.5">
 امسح رمز QR أو أدخل الكود يدوياً
 </p>
 </div>
 </div>

 <main className="p-4 max-w-3xl mx-auto">
 {/* Scanner */}
 {!scanning ? (
 <div className="bg-card-light rounded-xl p-8 border border-border-light text-center mb-5">
 <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
 <span className="material-symbols-outlined text-5xl text-primary">qr_code_scanner</span>
 </div>
 <h2 className="text-xl font-bold text-text-light-primary mb-2">
 ابدأ المسح الضوئي
 </h2>
 <p className="text-text-light-secondary mb-6">
 اسمح بالوصول للكاميرا لمسح رمز QR
 </p>
 <button
 onClick={startScanner}
 className="px-8 py-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-bold text-lg"
 >
 <span className="flex items-center gap-2 justify-center">
 <span className="material-symbols-outlined">camera_alt</span>
 تشغيل الكاميرا
 </span>
 </button>
 </div>
 ) : (
 <div className="bg-card-light rounded-xl p-5 border border-border-light mb-5">
 <div id="qr-reader"className="rounded-lg overflow-hidden mb-4"></div>
 <button
 onClick={stopScanner}
 className="w-full px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-bold"
 >
 إيقاف المسح
 </button>
 </div>
 )}

 {/* Manual Input */}
 <div className="bg-card-light rounded-xl p-6 border border-border-light">
 <h3 className="font-bold text-text-light-primary mb-4 flex items-center gap-2">
 <span className="material-symbols-outlined text-primary">edit</span>
 أو أدخل الكود يدوياً
 </h3>
 <form onSubmit={handleManualSubmit} className="space-y-4">
 <input
 type="text"
 value={manualCode}
 onChange={(e) => setManualCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
 placeholder="000000"
 className="w-full px-6 py-4 text-center text-3xl font-bold tracking-wider rounded-lg border-2 border-border-light bg-background-light text-text-light-primary focus:ring-2 focus:ring-primary focus:border-transparent"
 maxLength={6}
 />
 <button
 type="submit"
 disabled={manualCode.length !== 6}
 className="w-full px-6 py-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
 >
 التحقق من الكود
 </button>
 </form>
 </div>
 </main>

 {/* Confirmation Modal */}
 {showConfirmModal && selectedOrder && (
 <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
 <div className="bg-card-light rounded-xl p-6 max-w-md w-full border border-border-light">
 <h2 className="text-xl font-bold text-text-light-primary mb-4 text-center">
 تأكيد التسليم
 </h2>

 {/* Order Details */}
 <div className="bg-card-light rounded-lg p-4 mb-4">
 <div className="mb-3">
 <p className="text-sm text-text-light-secondary">العميل</p>
 <p className="font-bold text-text-light-primary ">{selectedOrder.customer_name}</p>
 </div>
 <div className="mb-3">
 <p className="text-sm text-text-light-secondary">رقم الهاتف</p>
 <p className="font-bold text-text-light-primary ">{selectedOrder.customer_phone}</p>
 </div>
 <div>
 <p className="text-sm text-text-light-secondary">المبلغ المستحق</p>
 <p className="text-2xl font-bold text-primary">{selectedOrder.total_amount.toFixed(2)} ج.م</p>
 </div>
 </div>

 {/* Items */}
 <div className="mb-6 max-h-40 overflow-y-auto">
 <p className="text-sm font-bold text-text-light-primary mb-2">المنتجات:</p>
 <div className="space-y-2">
 {selectedOrder.items.map((item: any, index: number) => (
 <div key={index} className="text-sm text-text-light-secondary flex justify-between">
 <span>{item.product_name} × {item.quantity}</span>
 <span className="font-medium">{(item.price * item.quantity).toFixed(2)} ج.م</span>
 </div>
 ))}
 </div>
 </div>

 <div className="bg-yellow-900/20 rounded-lg p-3 mb-6">
 <p className="text-sm text-yellow-200 flex items-center gap-2">
 <span className="material-symbols-outlined text-base">info</span>
 تأكد من استلام المبلغ نقداً قبل التسليم
 </p>
 </div>

 {/* Actions */}
 <div className="flex gap-3">
 <button
 onClick={() => {
 setShowConfirmModal(false);
 setSelectedOrder(null);
 }}
 className="flex-1 px-6 py-3 bg-surface-light text-text-light-primary rounded-lg hover:bg-surface-light transition-colors font-bold"
 >
 إلغاء
 </button>
 <button
 onClick={completePickup}
 className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-bold"
 >
 ✅ تأكيد التسليم
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
