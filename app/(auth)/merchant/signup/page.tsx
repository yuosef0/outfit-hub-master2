'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

export default function MerchantSignupPage() {
 const router = useRouter();
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState('');
 const [formData, setFormData] = useState({
 fullName: '',
 email: '',
 password: '',
 phone: '',
 });

 const supabase = createBrowserClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 );

 const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 setFormData({
 ...formData,
 [e.target.name]: e.target.value,
 });
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setLoading(true);
 setError('');

 // Phone validation: must be exactly 11 digits
 if (!/^\d{11}$/.test(formData.phone)) {
 setError('رقم الموبايل لازم يكون 11 رقم');
 setLoading(false);
 return;
 }

 // Password validation
 if (formData.password.length < 8) {
 setError('كلمة السر لازم تكون 8 حروف على الأقل');
 setLoading(false);
 return;
 }

 if (!/[A-Z]/.test(formData.password)) {
 setError('كلمة السر لازم تحتوي على حرف كبير (A-Z)');
 setLoading(false);
 return;
 }

 if (!/\d/.test(formData.password)) {
 setError('كلمة السر لازم تحتوي على رقم (0-9)');
 setLoading(false);
 return;
 }

 if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(formData.password)) {
 setError('كلمة السر لازم تحتوي على رمز (!@#$%^&*)');
 setLoading(false);
 return;
 }

 try {
 // Sign up the user
 const { data: authData, error: authError } = await supabase.auth.signUp({
 email: formData.email,
 password: formData.password,
 options: {
 data: {
 full_name: formData.fullName,
 phone: formData.phone,
 role: 'merchant',
 },
 },
 });

 if (authError) throw authError;

 if (authData.user) {
 // Update user role in users table
 const { error: updateError } = await supabase
 .from('users')
 .update({ role: 'merchant', full_name: formData.fullName, phone: formData.phone })
 .eq('id', authData.user.id);

 if (updateError) throw updateError;

 // Redirect to store setup
 router.push('/merchant/setup');
 }
 } catch (err: any) {
 setError(err.message || 'حدث خطأ أثناء التسجيل');
 } finally {
 setLoading(false);
 }
 };

 const handleGoogleSignup = async () => {
 setLoading(true);
 setError('');

 try {
 const { error } = await supabase.auth.signInWithOAuth({
 provider: 'google',
 options: {
 redirectTo: `${window.location.origin}/merchant/setup`,
 queryParams: {
 access_type: 'offline',
 prompt: 'consent',
 },
 },
 });

 if (error) throw error;
 } catch (err: any) {
 setError(err.message || 'حدث خطأ أثناء التسجيل بـ Google');
 setLoading(false);
 }
 };

 return (
 <div className="min-h-screen bg-background-light flex items-center justify-center p-4">
 <div className="w-full max-w-md">
 <div className="bg-card-light rounded-2xl shadow-xl p-8">
 {/* Header */}
 <div className="text-center mb-8">
 <h1 className="text-3xl font-bold text-text-light-primary mb-2">
 🏪 سجّل متجرك
 </h1>
 <p className="text-text-light-secondary text-sm">
 سجّل مجاناً وابدأ تعرض منتجاتك لآلاف العملاء
 </p>
 <div className="mt-4 bg-primary/20 rounded-lg p-3">
 <p className="text-sm text-primary font-medium">
 💰 مفيش اشتراكات - بس عمولة 3% على كل عملية بيع فعلية
 </p>
 </div>
 </div>

 {/* Error Message */}
 {error && (
 <div className="mb-6 bg-red-900/20 border border-red-800 rounded-lg p-4">
 <p className="text-red-400 text-sm">{error}</p>
 </div>
 )}

 {/* Form */}
 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-text-light-primary mb-2">
 الاسم الكامل *
 </label>
 <input
 type="text"
 name="fullName"
 value={formData.fullName}
 onChange={handleChange}
 required
 className="w-full px-4 py-3 rounded-lg border border-border-light bg-card-light text-text-light-primary focus:ring-2 focus:ring-primary focus:border-transparent"
 placeholder="أحمد محمد"
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-text-light-primary mb-2">
 البريد الإلكتروني *
 </label>
 <input
 type="email"
 name="email"
 value={formData.email}
 onChange={handleChange}
 required
 className="w-full px-4 py-3 rounded-lg border border-border-light bg-card-light text-text-light-primary focus:ring-2 focus:ring-primary focus:border-transparent"
 placeholder="email@example.com"
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-text-light-primary mb-2">
 كلمة السر *
 </label>
 <input
 type="password"
 name="password"
 value={formData.password}
 onChange={handleChange}
 required
 minLength={8}
 className="w-full px-4 py-3 rounded-lg border border-border-light bg-card-light text-text-light-primary focus:ring-2 focus:ring-primary focus:border-transparent"
 placeholder="••••••••"
 />
 <p className="text-xs text-text-light-secondary mt-1">
 كلمة السر لازم تكون 8 حروف على الأقل وتحتوي على حرف كبير ورقم ورمز
 </p>
 </div>

 <div>
 <label className="block text-sm font-medium text-text-light-primary mb-2">
 رقم الموبايل *
 </label>
 <input
 type="tel"
 name="phone"
 value={formData.phone}
 onChange={(e) => {
 const val = e.target.value.replace(/\D/g, '');
 if (val.length <= 11) setFormData({ ...formData, phone: val });
 }}
 required
 maxLength={11}
 className="w-full px-4 py-3 rounded-lg border border-border-light bg-card-light text-text-light-primary focus:ring-2 focus:ring-primary focus:border-transparent"
 placeholder="01012345678"
 />
 <p className="text-xs text-text-light-secondary mt-1">
 رقم الموبايل لازم يكون 11 رقم
 </p>
 </div>

 <button
 type="submit"
 disabled={loading}
 className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {loading ? 'جاري التسجيل...' : 'إنشاء حساب'}
 </button>
 </form>

 {/* Divider */}
 <div className="my-6 flex items-center">
 <div className="flex-1 border-t border-border-light "></div>
 <span className="px-4 text-sm text-text-light-secondary">أو</span>
 <div className="flex-1 border-t border-border-light "></div>
 </div>

 {/* Google Sign In */}
 <button
 onClick={handleGoogleSignup}
 disabled={loading}
 className="w-full bg-card-light border border-border-light hover:bg-card-light text-text-light-primary font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
 >
 <svg className="w-5 h-5"viewBox="0 0 24 24">
 <path
 fill="currentColor"
 d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
 />
 <path
 fill="currentColor"
 d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
 />
 <path
 fill="currentColor"
 d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
 />
 <path
 fill="currentColor"
 d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
 />
 </svg>
 تسجيل بـ Google
 </button>

 {/* Footer */}
 <p className="mt-6 text-center text-sm text-text-light-secondary">
 عندك حساب بالفعل؟{' '}
 <Link href="/merchant/login"className="text-primary hover:underline font-medium">
 تسجيل الدخول
 </Link>
 </p>
 </div>
 </div>
 </div>
 );
}
