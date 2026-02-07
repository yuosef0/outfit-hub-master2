'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { EGYPTIAN_GOVERNORATES } from '@/lib/types';
import Toast from '@/components/Toast';

export default function EditProfilePage() {
    const router = useRouter();
    const { t, language } = useLanguage();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Form state
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [governorate, setGovernorate] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');

    const supabase = useMemo(
        () =>
            createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            ),
        []
    );

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push('/login');
                    return;
                }

                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (data) {
                    setFullName(data.full_name || '');
                    setPhone(data.phone || '');
                    setGovernorate(data.governorate || '');
                    setAvatarUrl(data.avatar_url || '');
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [supabase, router]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('users')
                .update({
                    full_name: fullName,
                    phone: phone,
                    governorate: governorate,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;

            setToast({
                message: language === 'ar' ? 'تم حفظ التغييرات بنجاح' : 'Changes saved successfully',
                type: 'success'
            });

            setTimeout(() => {
                router.back();
            }, 1500);
        } catch (error) {
            console.error('Error saving profile:', error);
            setToast({
                message: language === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Error saving changes',
                type: 'error'
            });
        } finally {
            setIsSaving(false);
        }
    };

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
            {/* Toast */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Header */}
            <div className="sticky top-0 z-50 bg-background-light/95 backdrop-blur-md border-t border-border-light">
                <div className="flex items-center justify-between px-4 py-3">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-card-light transition-colors"
                    >
                        <span className="material-symbols-outlined text-text-light-primary">close</span>
                    </button>
                    <h1 className="text-lg font-bold text-text-light-primary">
                        {language === 'ar' ? 'تعديل الملف الشخصي' : 'Edit Profile'}
                    </h1>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        {isSaving ? (
                            <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></span>
                        ) : (
                            language === 'ar' ? 'حفظ' : 'Save'
                        )}
                    </button>
                </div>
            </div>

            {/* Form */}
            <main className="flex-1 p-4">
                <div className="space-y-6">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center py-6">
                        <div className="w-24 h-24 rounded-full bg-card-light border-4 border-background-light overflow-hidden shadow-lg mb-4">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                                    <span className="material-symbols-outlined text-4xl text-primary">person</span>
                                </div>
                            )}
                        </div>
                        <button className="text-primary font-semibold text-sm">
                            {language === 'ar' ? 'تغيير الصورة' : 'Change Photo'}
                        </button>
                    </div>

                    {/* Full Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-text-light-primary">
                            {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                        </label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder={language === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                            className="w-full px-4 py-3 bg-card-light border border-border-light rounded-xl text-text-light-primary placeholder-text-light-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                        />
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-text-light-primary">
                            {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder={language === 'ar' ? 'أدخل رقم هاتفك' : 'Enter your phone number'}
                            className="w-full px-4 py-3 bg-card-light border border-border-light rounded-xl text-text-light-primary placeholder-text-light-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                        />
                    </div>

                    {/* Governorate */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-text-light-primary">
                            {language === 'ar' ? 'المحافظة' : 'Governorate'}
                        </label>
                        <select
                            value={governorate}
                            onChange={(e) => setGovernorate(e.target.value)}
                            className="w-full px-4 py-3 bg-card-light border border-border-light rounded-xl text-text-light-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors appearance-none cursor-pointer"
                        >
                            <option value="">
                                {language === 'ar' ? 'اختر المحافظة' : 'Select Governorate'}
                            </option>
                            {EGYPTIAN_GOVERNORATES.map((gov) => (
                                <option key={gov.code} value={gov.code}>
                                    {language === 'ar' ? gov.name_ar : gov.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Info Note */}
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-primary">info</span>
                            <p className="text-sm text-text-light-secondary">
                                {language === 'ar'
                                    ? 'لا يمكن تغيير البريد الإلكتروني من هنا. للمساعدة، تواصل معنا.'
                                    : 'Email cannot be changed here. For assistance, please contact support.'}
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
