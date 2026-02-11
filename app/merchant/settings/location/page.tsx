'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import Toast from '@/components/Toast';

export default function MerchantLocationSettingsPage() {
    const router = useRouter();
    const { language } = useLanguage();

    const [governorate, setGovernorate] = useState('');
    const [district, setDistrict] = useState('');
    const [governorates, setGovernorates] = useState<any[]>([]);
    const [districts, setDistricts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const supabase = useMemo(
        () =>
            createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            ),
        []
    );

    // Fetch active governorates and districts
    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: govData } = await supabase
                    .from('governorates')
                    .select('*')
                    .eq('is_active', true)
                    .order('name', { ascending: true });

                const { data: distData } = await supabase
                    .from('districts')
                    .select('*')
                    .eq('is_active', true)
                    .order('name', { ascending: true });

                setGovernorates(govData || []);
                setDistricts(distData || []);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [supabase]);

    // Fetch current store location
    useEffect(() => {
        const fetchStoreLocation = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push('/login');
                    return;
                }

                const { data: storeData } = await supabase
                    .from('stores')
                    .select('governorate, district')
                    .eq('merchant_id', user.id)
                    .single();

                if (storeData) {
                    setGovernorate(storeData.governorate || '');
                    setDistrict(storeData.district || '');
                }
            } catch (error) {
                console.error('Error fetching store location:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStoreLocation();
    }, [supabase, router]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('stores')
                .update({
                    governorate: governorate,
                    district: district || null,
                    updated_at: new Date().toISOString()
                })
                .eq('merchant_id', user.id);

            if (error) throw error;

            setToast({
                message: language === 'ar' ? 'تم حفظ الموقع بنجاح' : 'Location saved successfully',
                type: 'success'
            });

            setTimeout(() => {
                router.push('/merchant/dashboard');
            }, 1500);
        } catch (error) {
            console.error('Error saving location:', error);
            setToast({
                message: language === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Error saving location',
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
                    <p className="mt-4 text-text-light-secondary">
                        {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                    </p>
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
            <div className="sticky top-0 z-50 bg-background-light/95 backdrop-blur-md border-b border-border-light">
                <div className="flex items-center justify-between px-4 py-3">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-card-light transition-colors"
                    >
                        <span className="material-symbols-outlined text-text-light-primary">
                            {language === 'ar' ? 'arrow_forward' : 'arrow_back'}
                        </span>
                    </button>
                    <h1 className="text-lg font-bold text-text-light-primary">
                        {language === 'ar' ? 'إعدادات الموقع' : 'Location Settings'}
                    </h1>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        {isSaving
                            ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                            : (language === 'ar' ? 'حفظ' : 'Save')}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-4 py-6">
                <div className="max-w-2xl mx-auto space-y-6">
                    {/* Info Card */}
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-primary">info</span>
                            <div className="flex-1">
                                <p className="text-sm text-text-light-primary">
                                    {language === 'ar'
                                        ? 'حدد المحافظة والمركز الخاص بمتجرك. سيساعد هذا العملاء في العثور على متجرك بسهولة.'
                                        : 'Select your store governorate and district. This will help customers find your store easily.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Governorate */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-text-light-primary">
                            {language === 'ar' ? 'المحافظة' : 'Governorate'}
                            <span className="text-red-500 ml-1">*</span>
                        </label>
                        <select
                            value={governorate}
                            onChange={(e) => {
                                setGovernorate(e.target.value);
                                setDistrict(''); // Reset district when governorate changes
                            }}
                            className="w-full px-4 py-3 bg-card-light border border-border-light rounded-xl text-text-light-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors appearance-none cursor-pointer"
                        >
                            <option value="">
                                {language === 'ar' ? 'اختر المحافظة' : 'Select Governorate'}
                            </option>
                            {governorates.map((gov) => (
                                <option key={gov.code} value={gov.code}>
                                    {language === 'ar' ? gov.name_ar : gov.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* District - Shows when governorate is selected */}
                    {governorate && (
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-text-light-primary">
                                {language === 'ar' ? 'المركز' : 'District'}
                                <span className="text-text-light-secondary text-xs ml-2">
                                    ({language === 'ar' ? 'اختياري' : 'Optional'})
                                </span>
                            </label>
                            <select
                                value={district}
                                onChange={(e) => setDistrict(e.target.value)}
                                className="w-full px-4 py-3 bg-card-light border border-border-light rounded-xl text-text-light-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors appearance-none cursor-pointer"
                            >
                                <option value="">
                                    {language === 'ar' ? 'اختر المركز (اختياري)' : 'Select District (Optional)'}
                                </option>
                                {districts
                                    .filter(d => d.governorate_code === governorate)
                                    .map((dist) => (
                                        <option key={dist.id} value={dist.name}>
                                            {language === 'ar' ? dist.name_ar : dist.name}
                                        </option>
                                    ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
