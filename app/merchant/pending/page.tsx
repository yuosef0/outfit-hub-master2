'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function MerchantPendingPage() {
 const router = useRouter();
 const [storeName, setStoreName] = useState('');
 const [loading, setLoading] = useState(true);

 const supabase = createBrowserClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 );

 useEffect(() => {
 checkStoreStatus();
 // Poll every 30 seconds to check if store is activated
 const interval = setInterval(checkStoreStatus, 30000);
 return () => clearInterval(interval);
 }, []);

 const checkStoreStatus = async () => {
 try {
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) {
 router.push('/login');
 return;
 }

 const { data: store } = await supabase
 .from('stores')
 .select('*')
 .eq('merchant_id', user.id)
 .maybeSingle();

 if (!store) {
 router.push('/merchant/setup');
 return;
 }

 setStoreName(store.name);

 // If store is activated, redirect to dashboard
 if (store.is_active) {
 router.push('/merchant/dashboard');
 }
 } catch (error) {
 console.error('Error checking store status:', error);
 } finally {
 setLoading(false);
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

 return (
 <div className="min-h-screen bg-background-light flex items-center justify-center p-4">
 <div className="max-w-lg w-full">
 {/* Main Card */}
 <div className="bg-card-light rounded-2xl shadow-xl p-8 text-center mb-6">
 {/* Icon */}
 <div className="w-24 h-24 bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
 <span className="material-symbols-outlined text-6xl text-yellow-400">
 schedule
 </span>
 </div>

 {/* Title */}
 <h1 className="text-3xl font-bold text-text-light-primary mb-3">
 متجرك قيد المراجعة ⏳
 </h1>

 {/* Subtitle */}
 <p className="text-text-light-secondary mb-6 text-lg">
 شكراً لتسجيل <span className="font-bold text-primary">{storeName}</span> في Outfit Hub!
 </p>

 {/* Info Box */}
 <div className="bg-blue-900/20 border border-blue-800 rounded-xl p-5 mb-8">
 <p className="text-sm text-blue-300 font-medium">
 📱 سنتواصل معك على WhatsApp فور تفعيل متجرك خلال 24 ساعة
 </p>
 </div>

 {/* Progress Steps */}
 <div className="space-y-4 text-right">
 {/* Step 1 - Completed */}
 <div className="flex items-start gap-4 p-4 rounded-lg bg-green-900/20 border border-green-800">
 <div className="shrink-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
 <span className="material-symbols-outlined text-white text-xl">
 check
 </span>
 </div>
 <div className="flex-1">
 <h3 className="font-bold text-text-light-primary mb-1">تم استلام طلبك ✅</h3>
 <p className="text-sm text-text-light-secondary">
 تم إرسال بيانات متجرك بنجاح
 </p>
 </div>
 </div>

 {/* Step 2 - In Progress */}
 <div className="flex items-start gap-4 p-4 rounded-lg bg-yellow-900/20 border border-yellow-800">
 <div className="shrink-0 w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
 <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
 </div>
 <div className="flex-1">
 <h3 className="font-bold text-text-light-primary mb-1">جاري المراجعة... ⏳</h3>
 <p className="text-sm text-text-light-secondary">
 فريقنا يراجع بيانات متجرك للتأكد من كل شيء
 </p>
 </div>
 </div>

 {/* Step 3 - Pending */}
 <div className="flex items-start gap-4 p-4 rounded-lg bg-card-light/50 border border-border-light">
 <div className="shrink-0 w-10 h-10 bg-surface-light rounded-full flex items-center justify-center">
 <span className="material-symbols-outlined text-text-light-secondary text-xl">
 notifications_active
 </span>
 </div>
 <div className="flex-1">
 <h3 className="font-bold text-text-light-secondary mb-1">التفعيل 🎉</h3>
 <p className="text-sm text-text-light-secondary">
 سنرسل لك إشعار ورسالة WhatsApp عند التفعيل
 </p>
 </div>
 </div>
 </div>
 </div>

 {/* What's Next Card */}
 <div className="bg-card-light rounded-xl shadow-sm border border-border-light p-6">
 <h3 className="font-bold text-text-light-primary mb-4 text-right">ماذا بعد؟</h3>
 <div className="space-y-3 text-right">
 <div className="flex items-start gap-3">
 <span className="material-symbols-outlined text-primary mt-0.5">
 inventory_2
 </span>
 <p className="text-sm text-text-light-secondary">
 جهّز صور منتجاتك بجودة عالية
 </p>
 </div>
 <div className="flex items-start gap-3">
 <span className="material-symbols-outlined text-primary mt-0.5">
 camera_alt
 </span>
 <p className="text-sm text-text-light-secondary">
 اكتب أوصاف واضحة ومفيدة للعملاء
 </p>
 </div>
 <div className="flex items-start gap-3">
 <span className="material-symbols-outlined text-primary mt-0.5">
 verified
 </span>
 <p className="text-sm text-text-light-secondary">
 تأكد من توفر المنتجات بالكميات المطلوبة
 </p>
 </div>
 </div>
 </div>

 {/* Contact Support */}
 <div className="text-center mt-6">
 <p className="text-sm text-text-light-secondary">
 عندك استفسار؟ تواصل معنا على WhatsApp
 </p>
 <a
 href="https://wa.me/01012345678"
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
 >
 <span className="material-symbols-outlined">chat</span>
 تواصل معنا
 </a>
 </div>
 </div>
 </div>
 );
}
