'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { EGYPTIAN_GOVERNORATES } from '@/lib/types';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function SignUpPage() {
    const router = useRouter();
    const { t } = useLanguage();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [role, setRole] = useState<'customer' | 'merchant'>('customer');
    const [governorate, setGovernorate] = useState('');
    const [district, setDistrict] = useState('');
    const [districts, setDistricts] = useState<any[]>([]);

    const supabase = useMemo(
        () =>
            createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            ),
        []
    );

    // Fetch districts from database
    React.useEffect(() => {
        const fetchDistricts = async () => {
            const { data } = await supabase
                .from('districts')
                .select('*')
                .eq('is_active', true)
                .order('name', { ascending: true });
            if (data) setDistricts(data);
        };
        fetchDistricts();
    }, [supabase]);

    const handleEmailSignUp = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!agreedToTerms) {
            setError('Please agree to the Terms & Privacy');
            return;
        }

        // Phone validation: must be exactly 11 digits
        if (phone && !/^\d{11}$/.test(phone)) {
            setError('رقم الهاتف لازم يكون 11 رقم');
            return;
        }

        if (password !== confirmPassword) {
            setError('كلمة السر مش متطابقة');
            return;
        }

        // Password validation: must contain uppercase, number, and symbol
        if (password.length < 8) {
            setError('كلمة السر لازم تكون 8 حروف على الأقل');
            return;
        }

        if (!/[A-Z]/.test(password)) {
            setError('كلمة السر لازم تحتوي على حرف كبير (A-Z)');
            return;
        }

        if (!/\d/.test(password)) {
            setError('كلمة السر لازم تحتوي على رقم (0-9)');
            return;
        }

        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
            setError('كلمة السر لازم تحتوي على رمز (!@#$%^&*)');
            return;
        }

        if (role === 'customer' && !governorate) {
            setError('برجاء اختيار المحافظة');
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            console.log('Signing up with role:', role);

            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        phone: phone ? `+20${phone}` : null,
                        role: role,
                    },
                },
            });

            if (signUpError) throw signUpError;

            console.log('Signup successful, user:', data.user?.id);

            // Upsert user role in users table (insert if not exists, update if exists)
            if (data.user) {
                const { error: upsertError } = await supabase
                    .from('users')
                    .upsert({
                        id: data.user.id,
                        email: email,
                        role: role,
                        full_name: fullName,
                        phone: phone ? `+20${phone}` : null,
                        governorate: role === 'customer' ? governorate : null,
                        district: role === 'customer' && district ? district : null,
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'id'
                    });

                if (upsertError) {
                    console.error('Error upserting user role:', upsertError);
                } else {
                    console.log('User role set to:', role);
                }
            }

            // Redirect based on role
            if (role === 'merchant') {
                console.log('Redirecting to merchant setup...');
                router.push('/merchant/setup');
            } else {
                router.push('/login?message=Check your email to verify your account');
            }
        } catch (err: any) {
            console.error('Signup error:', err);
            setError(err.message || 'Failed to sign up');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        try {
            setIsLoading(true);
            setError(null);

            if (typeof window !== 'undefined') {
                sessionStorage.setItem('pending_role', role);
            }

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });

            if (error) throw error;
        } catch (err: any) {
            setError(err.message || 'Failed to sign up with Google');
            setIsLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col items-center bg-background-light overflow-x-hidden" suppressHydrationWarning>
            <div className="flex w-full max-w-md flex-col items-center p-4 pt-12 pb-12">
                {/* Logo */}
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                    <span className="material-symbols-outlined text-5xl text-primary">shopping_bag</span>
                </div>

                {/* Headline */}
                <h1 className="text-text-light-primary tracking-tight text-[32px] font-bold leading-tight text-center pb-3">
                    {t('auth.createAccount')}
                </h1>

                {/* Role Selection */}
                <div className="w-full mb-6">
                    <p className="text-center text-sm text-text-light-secondary mb-3">
                        {t('auth.selectAccountType')}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setRole('customer')}
                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${role === 'customer'
                                ? 'border-primary bg-primary/20'
                                : 'border-border-light hover:border-primary/50'
                                }`}
                        >
                            <span className="material-symbols-outlined text-3xl mb-2 text-primary">
                                person
                            </span>
                            <span className={`font-semibold ${role === 'customer'
                                ? 'text-primary'
                                : 'text-text-light-primary'
                                }`}>
                                {t('auth.customer')}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole('merchant')}
                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${role === 'merchant'
                                ? 'border-primary bg-primary/20'
                                : 'border-border-light hover:border-primary/50'
                                }`}
                        >
                            <span className="material-symbols-outlined text-3xl mb-2 text-primary">
                                store
                            </span>
                            <span className={`font-semibold ${role === 'merchant'
                                ? 'text-primary'
                                : 'text-text-light-primary'
                                }`}>
                                {t('auth.merchant')}
                            </span>
                        </button>
                    </div>
                </div>

                <form onSubmit={handleEmailSignUp} className="w-full space-y-4">
                    {/* Full Name */}
                    <div className="flex w-full flex-wrap items-end gap-4">
                        <label className="flex flex-col w-full flex-1">
                            <p className="text-text-light-primary text-base font-medium leading-normal pb-2">
                                {t('auth.fullName')}
                            </p>
                            <input
                                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-light-primary focus:outline-0 focus:ring-0 border border-border-light bg-background-light focus:border-primary h-14 placeholder:text-text-light-secondary p-[15px] text-base font-normal leading-normal"
                                placeholder={t('auth.enterFullName')}
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />
                        </label>
                    </div>

                    {/* Email */}
                    <div className="flex w-full flex-wrap items-end gap-4">
                        <label className="flex flex-col w-full flex-1">
                            <p className="text-text-light-primary text-base font-medium leading-normal pb-2">
                                {t('auth.email')}
                            </p>
                            <input
                                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-light-primary focus:outline-0 focus:ring-0 border border-border-light bg-background-light focus:border-primary h-14 placeholder:text-text-light-secondary p-[15px] text-base font-normal leading-normal"
                                placeholder={t('auth.enterEmailAddress')}
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </label>
                    </div>

                    {/* Phone Number */}
                    <div className="flex w-full flex-wrap items-end gap-4">
                        <label className="flex flex-col w-full flex-1">
                            <p className="text-text-light-primary text-base font-medium leading-normal pb-2">
                                {t('auth.phoneNumber')}
                            </p>
                            <div className="relative flex w-full items-center">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                                    <span className="text-text-light-primary text-base font-normal">+20</span>
                                </div>
                                <input
                                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-light-primary focus:outline-0 focus:ring-0 border border-border-light bg-background-light focus:border-primary h-14 placeholder:text-text-light-secondary pl-12 pr-4 py-[15px] text-base font-normal leading-normal"
                                    placeholder={t('auth.enterPhone')}
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        if (val.length <= 11) setPhone(val);
                                    }}
                                    maxLength={11}
                                />
                            </div>
                        </label>
                    </div>

                    {/* Governorate (customers only) */}
                    {role === 'customer' && (
                        <>
                            <div className="flex w-full flex-wrap items-end gap-4">
                                <label className="flex flex-col w-full flex-1">
                                    <p className="text-text-light-primary text-base font-medium leading-normal pb-2">
                                        {t('auth.governorate')}
                                    </p>
                                    <select
                                        className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-light-primary focus:outline-0 focus:ring-0 border border-border-light bg-background-light focus:border-primary h-14 placeholder:text-text-light-secondary p-[15px] text-base font-normal leading-normal"
                                        value={governorate}
                                        onChange={(e) => { setGovernorate(e.target.value); setDistrict(''); }}
                                        required
                                    >
                                        <option value="">{t('auth.selectGovernorate')}</option>
                                        {EGYPTIAN_GOVERNORATES.map((gov) => (
                                            <option key={gov.code} value={gov.code}>
                                                {gov.name_ar}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            {/* District (customers only, shown after governorate) */}
                            {governorate && (
                                <div className="flex w-full flex-wrap items-end gap-4">
                                    <label className="flex flex-col w-full flex-1">
                                        <p className="text-text-light-primary text-base font-medium leading-normal pb-2">
                                            المركز
                                        </p>
                                        <select
                                            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-light-primary focus:outline-0 focus:ring-0 border border-border-light bg-background-light focus:border-primary h-14 placeholder:text-text-light-secondary p-[15px] text-base font-normal leading-normal"
                                            value={district}
                                            onChange={(e) => setDistrict(e.target.value)}
                                        >
                                            <option value="">اختر المركز (اختياري)</option>
                                            {districts
                                                .filter(d => d.governorate_code === governorate)
                                                .map((dist) => (
                                                    <option key={dist.id} value={dist.name}>
                                                        {dist.name_ar}
                                                    </option>
                                                ))}
                                        </select>
                                    </label>
                                </div>
                            )}
                        </>
                    )}

                    {/* Password */}
                    <div className="flex w-full flex-wrap items-end gap-4">
                        <label className="flex flex-col w-full flex-1">
                            <p className="text-text-light-primary text-base font-medium leading-normal pb-2">
                                {t('auth.password')}
                            </p>
                            <div className="relative flex w-full items-center">
                                <input
                                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-light-primary focus:outline-0 focus:ring-0 border border-border-light bg-background-light focus:border-primary h-14 placeholder:text-text-light-secondary p-[15px] pr-12 text-base font-normal leading-normal"
                                    placeholder={t('auth.enterPassword')}
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#4c669a]"
                                >
                                    <span className="material-symbols-outlined">
                                        {showPassword ? 'visibility' : 'visibility_off'}
                                    </span>
                                </button>
                            </div>
                            <p className="text-xs text-text-light-secondary mt-2">
                                كلمة السر لازم تكون 8 حروف على الأقل وتحتوي على حرف كبير ورقم ورمز
                            </p>
                        </label>
                    </div>

                    {/* Confirm Password */}
                    <div className="flex w-full flex-wrap items-end gap-4">
                        <label className="flex flex-col w-full flex-1">
                            <p className="text-text-light-primary text-base font-medium leading-normal pb-2">
                                {t('auth.confirmPassword')}
                            </p>
                            <div className="relative flex w-full items-center">
                                <input
                                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-light-primary focus:outline-0 focus:ring-0 border border-border-light bg-background-light focus:border-primary h-14 placeholder:text-text-light-secondary p-[15px] pr-12 text-base font-normal leading-normal"
                                    placeholder={t('auth.confirmPasswordPlaceholder')}
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#4c669a]"
                                >
                                    <span className="material-symbols-outlined">
                                        {showConfirmPassword ? 'visibility' : 'visibility_off'}
                                    </span>
                                </button>
                            </div>
                        </label>
                    </div>

                    {/* Terms Checkbox */}
                    <div className="flex items-center space-x-2 pt-2">
                        <input
                            className="form-checkbox h-5 w-5 rounded border-border-light text-primary focus:ring-primary"
                            id="terms"
                            type="checkbox"
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                        />
                        <label className="text-sm text-text-light-secondary" htmlFor="terms">
                            {t('auth.agreeToTerms')}{' '}
                            <Link href="/terms" className="font-medium text-primary hover:underline">
                                {t('auth.termsAndPrivacy')}
                            </Link>
                        </label>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Sign Up Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-base font-semibold text-white shadow-sm hover:bg-primary/90 mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? t('auth.creatingAccount') : t('auth.signup')}
                    </button>
                </form>

                {/* Divider */}
                <div className="relative flex w-full items-center justify-center py-8">
                    <div className="absolute h-px w-full bg-surface-light"></div>
                    <span className="relative bg-background-light px-3 text-sm font-medium text-text-light-secondary">
                        {t('auth.or')}
                    </span>
                </div>

                {/* Social Sign Up Buttons */}
                <div className="flex w-full flex-col gap-4">
                    <button
                        onClick={handleGoogleSignUp}
                        disabled={isLoading}
                        type="button"
                        className="flex h-14 w-full items-center justify-center gap-3 rounded-lg border border-border-light bg-card-light px-4 py-2.5 text-base font-medium text-text-light-primary shadow-sm hover:bg-card-light disabled:opacity-50"
                    >
                        <svg className="h-6 w-6" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        <span>{t('auth.signUpWithGoogle')}</span>
                    </button>


                </div>

                {/* Login Link */}
                <p className="mt-8 text-center text-base text-text-light-secondary">
                    {t('auth.alreadyHaveAccount')}{' '}
                    <Link href="/login" className="font-semibold text-primary hover:underline">
                        {t('auth.login')}
                    </Link>
                </p>
            </div>
        </div>
    );
}
