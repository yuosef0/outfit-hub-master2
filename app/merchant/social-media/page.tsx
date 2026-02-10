'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function SocialMediaPage() {
    const router = useRouter();
    const { t, language } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [storeId, setStoreId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        facebook_link: '',
        instagram_link: '',
        tiktok_link: '',
        whatsapp_number: '',
    });
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        checkAuthAndFetchData();
    }, []);

    const checkAuthAndFetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data: store, error } = await supabase
                .from('stores')
                .select('id, facebook_link, instagram_link, tiktok_link, whatsapp_number')
                .eq('merchant_id', user.id)
                .single();

            if (error) throw error;
            if (!store) {
                router.push('/merchant/setup');
                return;
            }

            setStoreId(store.id);
            setFormData({
                facebook_link: store.facebook_link || '',
                instagram_link: store.instagram_link || '',
                tiktok_link: store.tiktok_link || '',
                whatsapp_number: store.whatsapp_number || '',
            });
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (!storeId) return;

            const { error } = await supabase
                .from('stores')
                .update({
                    facebook_link: formData.facebook_link.trim() || null,
                    instagram_link: formData.instagram_link.trim() || null,
                    tiktok_link: formData.tiktok_link.trim() || null,
                    whatsapp_number: formData.whatsapp_number.trim() || null,
                })
                .eq('id', storeId);

            if (error) throw error;

            setToast({
                message: language === 'ar' ? 'تم حفظ الروابط بنجاح' : 'Links saved successfully',
                type: 'success'
            });
        } catch (error) {
            console.error('Error saving links:', error);
            setToast({
                message: language === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Error saving links',
                type: 'error'
            });
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-card-light">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-card-light">
            {/* Toast */}
            {toast && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
                    <div
                        className={`${toast.type === 'success'
                            ? 'bg-green-500'
                            : 'bg-red-500'
                            } text-white px-6 py-3 rounded-lg shadow-lg`}
                    >
                        {toast.message}
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="sticky top-0 z-10 bg-card-light border-b border-border-light">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <h1 className="text-2xl font-bold text-text-light-primary">
                        {language === 'ar' ? 'وسائل التواصل الاجتماعي' : 'Social Media'}
                    </h1>
                    <p className="text-sm text-text-light-secondary mt-1">
                        {language === 'ar' ? 'أضف روابط صفحاتك ليسهل على العملاء الوصول إليك' : 'Add your social media links so customers can reach you'}
                    </p>
                </div>
            </div>

            {/* Form */}
            <div className="max-w-4xl mx-auto px-4 py-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-card-light rounded-lg border border-border-light p-6 space-y-6">
                        {/* Facebook */}
                        <div>
                            <label className="block text-sm font-medium text-text-light-primary mb-2 flex items-center gap-2">
                                <span className="text-[#1877F2] font-bold">Facebook</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="material-symbols-outlined text-text-light-secondary">link</span>
                                </div>
                                <input
                                    type="url"
                                    value={formData.facebook_link}
                                    onChange={(e) => setFormData({ ...formData, facebook_link: e.target.value })}
                                    className="block w-full rounded-lg border border-border-light bg-card-light py-2 pl-10 pr-3 text-text-light-primary placeholder-gray-400 focus:ring-2 focus:ring-primary focus:outline-none"
                                    placeholder="https://facebook.com/..."
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        {/* Instagram */}
                        <div>
                            <label className="block text-sm font-medium text-text-light-primary mb-2 flex items-center gap-2">
                                <span className="text-[#E4405F] font-bold">Instagram</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="material-symbols-outlined text-text-light-secondary">link</span>
                                </div>
                                <input
                                    type="url"
                                    value={formData.instagram_link}
                                    onChange={(e) => setFormData({ ...formData, instagram_link: e.target.value })}
                                    className="block w-full rounded-lg border border-border-light bg-card-light py-2 pl-10 pr-3 text-text-light-primary placeholder-gray-400 focus:ring-2 focus:ring-primary focus:outline-none"
                                    placeholder="https://instagram.com/..."
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        {/* TikTok */}
                        <div>
                            <label className="block text-sm font-medium text-text-light-primary mb-2 flex items-center gap-2">
                                <span className="text-black font-bold">TikTok</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="material-symbols-outlined text-text-light-secondary">link</span>
                                </div>
                                <input
                                    type="url"
                                    value={formData.tiktok_link}
                                    onChange={(e) => setFormData({ ...formData, tiktok_link: e.target.value })}
                                    className="block w-full rounded-lg border border-border-light bg-card-light py-2 pl-10 pr-3 text-text-light-primary placeholder-gray-400 focus:ring-2 focus:ring-primary focus:outline-none"
                                    placeholder="https://tiktok.com/..."
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        {/* WhatsApp */}
                        <div>
                            <label className="block text-sm font-medium text-text-light-primary mb-2 flex items-center gap-2">
                                <span className="text-[#25D366] font-bold">WhatsApp</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="material-symbols-outlined text-text-light-secondary">call</span>
                                </div>
                                <input
                                    type="text"
                                    value={formData.whatsapp_number}
                                    onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                                    className="block w-full rounded-lg border border-border-light bg-card-light py-2 pl-10 pr-3 text-text-light-primary placeholder-gray-400 focus:ring-2 focus:ring-primary focus:outline-none"
                                    placeholder="+201xxxxxxxxx"
                                    dir="ltr"
                                />
                            </div>
                            <p className="text-xs text-text-light-secondary mt-1">
                                {language === 'ar' ? 'أدخل الرقم مع مفتاح الدولة (مثال: 201000000000)' : 'Enter number with country code (e.g., 2010000000000)'}
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-primary text-white px-8 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                    {language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
                                </>
                            ) : (
                                language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
