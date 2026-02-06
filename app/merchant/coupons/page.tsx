'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Toast from '@/components/Toast';
import { Coupon } from '@/lib/types';

export default function CouponsPage() {
 const router = useRouter();
 const [loading, setLoading] = useState(true);
 const [storeId, setStoreId] = useState<string | null>(null);
 const [coupons, setCoupons] = useState<Coupon[]>([]);
 const [showCreateModal, setShowCreateModal] = useState(false);
 const [submitting, setSubmitting] = useState(false);
 const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

 const [formData, setFormData] = useState({
 code: '',
 discount_type: 'percentage' as 'percentage' | 'fixed',
 discount_value: '',
 min_order_amount: '',
 max_uses: '',
 expires_at: '',
 });

 const supabase = createBrowserClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 );

 useEffect(() => {
 checkStoreAndFetchCoupons();
 }, []);

 const checkStoreAndFetchCoupons = async () => {
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
 await fetchCoupons(store.id);
 } catch (error) {
 console.error('Error:', error);
 } finally {
 setLoading(false);
 }
 };

 const fetchCoupons = async (storeId: string) => {
 const { data, error } = await supabase
 .from('coupons')
 .select('*')
 .eq('store_id', storeId)
 .order('created_at', { ascending: false });

 if (error) {
 console.error('Error fetching coupons:', error);
 return;
 }

 setCoupons(data || []);
 };

 const generateRandomCode = () => {
 const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
 let code = '';
 for (let i = 0; i < 8; i++) {
 code += chars.charAt(Math.floor(Math.random() * chars.length));
 }
 setFormData({ ...formData, code });
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();

 if (!storeId) return;

 setSubmitting(true);

 try {
 const { error } = await supabase
 .from('coupons')
 .insert({
 store_id: storeId,
 code: formData.code.toUpperCase(),
 discount_type: formData.discount_type,
 discount_value: parseFloat(formData.discount_value),
 min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : null,
 max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
 expires_at: formData.expires_at || null,
 is_active: true,
 current_uses: 0,
 });

 if (error) throw error;

 setToast({ message: 'تم إنشاء الكوبون بنجاح! ✅', type: 'success' });
 setShowCreateModal(false);
 setFormData({
 code: '',
 discount_type: 'percentage',
 discount_value: '',
 min_order_amount: '',
 max_uses: '',
 expires_at: '',
 });

 // Refresh coupons
 if (storeId) await fetchCoupons(storeId);
 } catch (err: any) {
 console.error('Error creating coupon:', err);
 setToast({ message: err.message || 'حدث خطأ أثناء إنشاء الكوبون', type: 'error' });
 } finally {
 setSubmitting(false);
 }
 };

 const toggleCouponStatus = async (couponId: string, currentStatus: boolean) => {
 const { error } = await supabase
 .from('coupons')
 .update({ is_active: !currentStatus })
 .eq('id', couponId);

 if (error) {
 setToast({ message: 'حدث خطأ أثناء تحديث حالة الكوبون', type: 'error' });
 return;
 }

 setToast({ message: `تم ${!currentStatus ? 'تفعيل' : 'إيقاف'} الكوبون بنجاح ✅`, type: 'success' });
 setCoupons(coupons.map(c =>
 c.id === couponId ? { ...c, is_active: !currentStatus } : c
 ));
 };

 const deleteCoupon = async (couponId: string) => {
 if (!confirm('هل أنت متأكد من حذف هذا الكوبون؟')) {
 return;
 }

 const { error } = await supabase
 .from('coupons')
 .delete()
 .eq('id', couponId);

 if (error) {
 setToast({ message: 'حدث خطأ أثناء حذف الكوبون', type: 'error' });
 return;
 }

 setToast({ message: 'تم حذف الكوبون بنجاح ✅', type: 'success' });
 setCoupons(coupons.filter(c => c.id !== couponId));
 };

 const isExpired = (expiresAt: string | null) => {
 if (!expiresAt) return false;
 return new Date(expiresAt) < new Date();
 };

 if (loading) {
 return (
 <div className="bg-background-light flex items-center justify-center">
 <div className="text-center">
 <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
 <p className="text-text-light-secondary">جاري التحميل...</p>
 </div>
 </div>
 );
 };

 const activeCoupons = coupons.filter(c => c.is_active && !isExpired(c.expires_at));
 const inactiveCoupons = coupons.filter(c => !c.is_active || isExpired(c.expires_at));

 return (
 <div className="bg-background-light">
 {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

 {/* Header */}
 <div className="bg-card-light border-b border-border-light sticky top-0 z-10">
 <div className="px-4 py-4">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold text-text-light-primary ">
 🏷️ الكوبونات
 </h1>
 <p className="text-text-light-secondary text-sm mt-0.5">
 إدارة كوبونات الخصم ({coupons.length} كوبون)
 </p>
 </div>
 <button
 onClick={() => setShowCreateModal(true)}
 className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-bold"
 >
 <span className="material-symbols-outlined text-xl">add</span>
 إنشاء
 </button>
 </div>
 </div>
 </div>

 <main className="p-4 max-w-5xl mx-auto">
 {/* Active Coupons */}
 {activeCoupons.length > 0 && (
 <div className="mb-6">
 <h2 className="text-lg font-bold text-text-light-primary mb-3 text-right">
 نشط ({activeCoupons.length})
 </h2>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {activeCoupons.map((coupon) => (
 <div
 key={coupon.id}
 className="bg-card-light rounded-xl p-5 border-2 border-green-800"
 >
 {/* Coupon Code */}
 <div className="bg-gradient-to-r from-primary to-green-600 rounded-lg p-4 mb-4 text-center">
 <p className="text-white/80 text-xs mb-1">كود الخصم</p>
 <p className="text-2xl font-bold text-white tracking-wider">{coupon.code}</p>
 </div>

 {/* Discount Info */}
 <div className="space-y-2 mb-4 text-right">
 <div className="flex items-center justify-between">
 <span className="text-sm text-text-light-secondary">الخصم:</span>
 <span className="font-bold text-primary text-lg">
 {coupon.discount_type === 'percentage'
 ? `${coupon.discount_value}%`
 : `${coupon.discount_value} ج.م`}
 </span>
 </div>
 {coupon.min_order_amount && (
 <div className="flex items-center justify-between">
 <span className="text-sm text-text-light-secondary">الحد الأدنى:</span>
 <span className="text-sm font-medium text-text-light-primary ">
 {coupon.min_order_amount} ج.م
 </span>
 </div>
 )}
 <div className="flex items-center justify-between">
 <span className="text-sm text-text-light-secondary">الاستخدامات:</span>
 <span className="text-sm font-medium text-text-light-primary ">
 {coupon.current_uses} / {coupon.max_uses || '∞'}
 </span>
 </div>
 {coupon.expires_at && (
 <div className="flex items-center justify-between">
 <span className="text-sm text-text-light-secondary">ينتهي:</span>
 <span className="text-sm font-medium text-text-light-primary ">
 {new Date(coupon.expires_at).toLocaleDateString('ar-EG')}
 </span>
 </div>
 )}
 </div>

 {/* Actions */}
 <div className="flex gap-2">
 <button
 onClick={() => toggleCouponStatus(coupon.id, coupon.is_active)}
 className="flex-1 px-3 py-2 bg-yellow-900/30 text-yellow-400 rounded-lg hover:bg-yellow-900/40 transition-colors font-bold text-sm"
 >
 إيقاف
 </button>
 <button
 onClick={() => deleteCoupon(coupon.id)}
 className="flex items-center justify-center px-3 py-2 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/40 transition-colors"
 >
 <span className="material-symbols-outlined text-base">delete</span>
 </button>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Inactive Coupons */}
 {inactiveCoupons.length > 0 && (
 <div>
 <h2 className="text-lg font-bold text-text-light-primary mb-3 text-right">
 غير نشط ({inactiveCoupons.length})
 </h2>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {inactiveCoupons.map((coupon) => (
 <div
 key={coupon.id}
 className="bg-card-light rounded-xl p-5 border border-border-light opacity-60"
 >
 {/* Coupon Code */}
 <div className="bg-surface-light rounded-lg p-4 mb-4 text-center">
 <p className="text-text-light-secondary text-xs mb-1">كود الخصم</p>
 <p className="text-2xl font-bold text-text-light-primary tracking-wider">{coupon.code}</p>
 </div>

 {/* Status Badge */}
 <div className="mb-3 text-center">
 <span className={`px-3 py-1 rounded-full text-xs font-bold ${
 isExpired(coupon.expires_at)
 ? 'bg-red-900/30 text-red-400'
 : 'bg-card-light text-text-light-secondary'
 }`}>
 {isExpired(coupon.expires_at) ? 'منتهي' : 'غير نشط'}
 </span>
 </div>

 {/* Discount Info */}
 <div className="space-y-2 mb-4 text-right">
 <div className="flex items-center justify-between">
 <span className="text-sm text-text-light-secondary">الخصم:</span>
 <span className="font-bold text-text-light-primary">
 {coupon.discount_type === 'percentage'
 ? `${coupon.discount_value}%`
 : `${coupon.discount_value} ج.م`}
 </span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-sm text-text-light-secondary">الاستخدامات:</span>
 <span className="text-sm font-medium text-text-light-primary">
 {coupon.current_uses} / {coupon.max_uses || '∞'}
 </span>
 </div>
 </div>

 {/* Actions */}
 <div className="flex gap-2">
 {!isExpired(coupon.expires_at) && (
 <button
 onClick={() => toggleCouponStatus(coupon.id, coupon.is_active)}
 className="flex-1 px-3 py-2 bg-green-900/30 text-green-400 rounded-lg hover:bg-green-900/40 transition-colors font-bold text-sm"
 >
 تفعيل
 </button>
 )}
 <button
 onClick={() => deleteCoupon(coupon.id)}
 className="flex-1 px-3 py-2 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/40 transition-colors font-bold text-sm"
 >
 حذف
 </button>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Empty State */}
 {coupons.length === 0 && (
 <div className="bg-card-light rounded-xl p-12 border border-border-light text-center">
 <div className="w-24 h-24 bg-card-light rounded-full flex items-center justify-center mx-auto mb-4">
 <span className="material-symbols-outlined text-5xl text-text-light-secondary">local_offer</span>
 </div>
 <h3 className="text-xl font-bold text-text-light-primary mb-2">
 لا توجد كوبونات بعد
 </h3>
 <p className="text-text-light-secondary mb-6">
 أنشئ كوبون خصم لجذب المزيد من العملاء
 </p>
 <button
 onClick={() => setShowCreateModal(true)}
 className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-bold"
 >
 <span className="material-symbols-outlined">add</span>
 إنشاء كوبون
 </button>
 </div>
 )}
 </main>

 {/* Create Coupon Modal */}
 {showCreateModal && (
 <div
 className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
 onClick={() => setShowCreateModal(false)}
 >
 <div
 className="bg-card-light rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
 onClick={(e) => e.stopPropagation()}
 >
 <div className="flex items-center justify-between mb-6">
 <h2 className="text-2xl font-bold text-text-light-primary ">
 🏷️ إنشاء كوبون خصم
 </h2>
 <button
 onClick={() => setShowCreateModal(false)}
 className="p-2 hover:bg-card-light rounded-lg transition-colors"
 >
 <span className="material-symbols-outlined text-text-light-secondary">close</span>
 </button>
 </div>

 <form onSubmit={handleSubmit} className="space-y-5">
 {/* Code */}
 <div>
 <label className="block text-sm font-bold text-text-light-primary mb-2 text-right">
 كود الكوبون *
 </label>
 <div className="flex gap-2">
 <input
 type="text"
 value={formData.code}
 onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
 required
 maxLength={20}
 placeholder="SUMMER25"
 className="flex-1 px-4 py-3 rounded-lg border border-border-light bg-card-light text-text-light-primary text-right focus:ring-2 focus:ring-primary focus:border-transparent uppercase font-bold"
 />
 <button
 type="button"
 onClick={generateRandomCode}
 className="px-4 py-3 bg-card-light hover:bg-surface-light text-text-light-primary rounded-lg transition-colors flex items-center gap-2"
 title="توليد عشوائي"
 >
 <span className="material-symbols-outlined">casino</span>
 </button>
 </div>
 </div>

 {/* Discount Type */}
 <div>
 <label className="block text-sm font-bold text-text-light-primary mb-2 text-right">
 نوع الخصم *
 </label>
 <div className="grid grid-cols-2 gap-3">
 <label
 className={`px-4 py-3 rounded-lg border-2 cursor-pointer text-center font-medium transition-all ${
 formData.discount_type === 'percentage'
 ? 'border-primary bg-primary/10 text-primary'
 : 'border-border-light text-text-light-secondary hover:border-primary/50'
 }`}
 >
 <input
 type="radio"
 name="discount_type"
 value="percentage"
 checked={formData.discount_type === 'percentage'}
 onChange={(e) => setFormData({ ...formData, discount_type: 'percentage' })}
 className="hidden"
 />
 نسبة مئوية (%)
 </label>
 <label
 className={`px-4 py-3 rounded-lg border-2 cursor-pointer text-center font-medium transition-all ${
 formData.discount_type === 'fixed'
 ? 'border-primary bg-primary/10 text-primary'
 : 'border-border-light text-text-light-secondary hover:border-primary/50'
 }`}
 >
 <input
 type="radio"
 name="discount_type"
 value="fixed"
 checked={formData.discount_type === 'fixed'}
 onChange={(e) => setFormData({ ...formData, discount_type: 'fixed' })}
 className="hidden"
 />
 مبلغ ثابت (ج.م)
 </label>
 </div>
 </div>

 {/* Discount Value */}
 <div>
 <label className="block text-sm font-bold text-text-light-primary mb-2 text-right">
 قيمة الخصم *
 </label>
 <div className="relative">
 <input
 type="number"
 value={formData.discount_value}
 onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
 required
 min="0"
 max={formData.discount_type === 'percentage' ? 100 : undefined}
 step="0.01"
 placeholder={formData.discount_type === 'percentage' ? '25' : '50'}
 className="w-full px-4 py-3 rounded-lg border border-border-light bg-card-light text-text-light-primary text-right focus:ring-2 focus:ring-primary focus:border-transparent pr-12"
 />
 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light-secondary font-medium">
 {formData.discount_type === 'percentage' ? '%' : 'ج.م'}
 </span>
 </div>
 </div>

 {/* Min Order Amount */}
 <div>
 <label className="block text-sm font-bold text-text-light-primary mb-2 text-right">
 حد أدنى للطلب (اختياري)
 </label>
 <div className="relative">
 <input
 type="number"
 value={formData.min_order_amount}
 onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
 min="0"
 step="0.01"
 placeholder="200"
 className="w-full px-4 py-3 rounded-lg border border-border-light bg-card-light text-text-light-primary text-right focus:ring-2 focus:ring-primary focus:border-transparent pr-12"
 />
 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light-secondary font-medium">
 ج.م
 </span>
 </div>
 </div>

 {/* Max Uses & Expiry Date */}
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-bold text-text-light-primary mb-2 text-right">
 حد الاستخدام
 </label>
 <input
 type="number"
 value={formData.max_uses}
 onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
 min="1"
 placeholder="50"
 className="w-full px-4 py-3 rounded-lg border border-border-light bg-card-light text-text-light-primary text-right focus:ring-2 focus:ring-primary focus:border-transparent"
 />
 <p className="text-xs text-text-light-secondary mt-1 text-right">
 اتركه فارغاً لعدد غير محدود
 </p>
 </div>
 <div>
 <label className="block text-sm font-bold text-text-light-primary mb-2 text-right">
 تاريخ الانتهاء
 </label>
 <input
 type="date"
 value={formData.expires_at}
 onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
 min={new Date().toISOString().split('T')[0]}
 className="w-full px-4 py-3 rounded-lg border border-border-light bg-card-light text-text-light-primary text-right focus:ring-2 focus:ring-primary focus:border-transparent"
 />
 </div>
 </div>

 {/* Submit */}
 <div className="flex gap-3 pt-4">
 <button
 type="button"
 onClick={() => setShowCreateModal(false)}
 className="flex-1 px-4 py-3 bg-surface-light hover:bg-surface-light text-text-light-primary rounded-lg transition-colors font-bold"
 >
 إلغاء
 </button>
 <button
 type="submit"
 disabled={submitting}
 className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
 >
 {submitting ? (
 <>
 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
 جاري الإنشاء...
 </>
 ) : (
 <>
 <span className="material-symbols-outlined text-base">check_circle</span>
 إنشاء الكوبون
 </>
 )}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
}
