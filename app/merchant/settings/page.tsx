'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { EGYPTIAN_GOVERNORATES } from '@/lib/types';

interface Store {
    id: string;
    name: string;
    description: string;
    category: string;
    address: string;
    governorate: string;
    phone: string;
    maps_link: string;
    logo_url: string | null;
    banner_url: string | null;
}

interface Toast {
    message: string;
    type: 'success' | 'error';
}

export default function MerchantSettingsPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [store, setStore] = useState<Store | null>(null);
    const [toast, setToast] = useState<Toast | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        address: '',
        governorate: '',
        phone: '',
        maps_link: '',
    });

    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);

    const logoInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const CATEGORIES = [
        'ملابس رجالي',
        'ملابس نسائي',
        'ملابس أطفال',
        'أحذية',
        'إكسسوارات',
        'ملابس رياضية',
        'ملابس تقليدية',
        'حقائب',
    ];

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            const { data: storeData } = await supabase
                .from('stores')
                .select('*')
                .eq('merchant_id', user.id)
                .single();

            if (!storeData) {
                router.push('/merchant/setup');
                return;
            }

            if (!storeData.is_active) {
                router.push('/merchant/pending');
                return;
            }

            setStore(storeData);
            setFormData({
                name: storeData.name || '',
                description: storeData.description || '',
                category: storeData.category || '',
                address: storeData.address || '',
                governorate: storeData.governorate || '',
                phone: storeData.phone || '',
                maps_link: storeData.maps_link || '',
            });
            setLogoPreview(storeData.logo_url);
            setBannerPreview(storeData.banner_url);
        } catch (error) {
            console.error('Error checking auth:', error);
            setToast({ message: 'حدث خطأ في التحقق من الحساب', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setToast({ message: 'حجم الصورة يجب أن يكون أقل من 2 ميجا', type: 'error' });
                return;
            }
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setToast({ message: 'حجم الصورة يجب أن يكون أقل من 5 ميجا', type: 'error' });
                return;
            }
            setBannerFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setBannerPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadImage = async (file: File, type: 'logo' | 'banner') => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${store!.id}_${type}_${Date.now()}.${fileExt}`;
        const filePath = `stores/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('store-images')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const {
            data: { publicUrl },
        } = supabase.storage.from('store-images').getPublicUrl(filePath);

        return publicUrl;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setToast({ message: 'برجاء إدخال اسم المتجر', type: 'error' });
            return;
        }

        if (!formData.category) {
            setToast({ message: 'برجاء اختيار فئة المتجر', type: 'error' });
            return;
        }

        if (!formData.phone.trim()) {
            setToast({ message: 'برجاء إدخال رقم الهاتف', type: 'error' });
            return;
        }

        if (!formData.address.trim()) {
            setToast({ message: 'برجاء إدخال العنوان', type: 'error' });
            return;
        }

        if (!formData.governorate) {
            setToast({ message: 'برجاء اختيار المحافظة', type: 'error' });
            return;
        }

        setSaving(true);

        try {
            let logoUrl = store!.logo_url;
            let bannerUrl = store!.banner_url;

            if (logoFile) {
                logoUrl = await uploadImage(logoFile, 'logo');
            }

            if (bannerFile) {
                bannerUrl = await uploadImage(bannerFile, 'banner');
            }

            const { error } = await supabase
                .from('stores')
                .update({
                    name: formData.name.trim(),
                    description: formData.description.trim(),
                    category: formData.category,
                    address: formData.address.trim(),
                    governorate: formData.governorate,
                    phone: formData.phone.trim(),
                    maps_link: formData.maps_link.trim(),
                    logo_url: logoUrl,
                    banner_url: bannerUrl,
                })
                .eq('id', store!.id);

            if (error) throw error;

            setToast({ message: 'تم حفظ الإعدادات بنجاح ✓', type: 'success' });

            // Refresh store data
            await checkAuth();

            // Clear file selections
            setLogoFile(null);
            setBannerFile(null);
        } catch (error: any) {
            console.error('Error saving settings:', error);
            setToast({ message: error.message || 'حدث خطأ أثناء الحفظ', type: 'error' });
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
            <div className="min-h-screen bg-card-light flex items-center justify-center">
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
                    <h1 className="text-2xl font-bold text-text-light-primary ">
                        الإعدادات
                    </h1>
                    <p className="text-sm text-text-light-secondary mt-1">
                        إدارة معلومات المتجر
                    </p>
                </div>
            </div>

            {/* Form */}
            <div className="max-w-4xl mx-auto px-4 py-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Store Images Section */}
                    <div className="bg-card-light rounded-lg border border-border-light p-6">
                        <h2 className="text-lg font-semibold text-text-light-primary mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">image</span>
                            صور المتجر
                        </h2>

                        <div className="space-y-6">
                            {/* Logo */}
                            <div>
                                <label className="block text-sm font-medium text-text-light-primary mb-2">
                                    شعار المتجر (Logo)
                                </label>
                                <div className="flex items-center gap-4">
                                    <div className="relative w-24 h-24 rounded-lg border-2 border-dashed border-border-light overflow-hidden bg-card-light">
                                        {logoPreview ? (
                                            <Image
                                                src={logoPreview}
                                                alt="Logo"
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-4xl text-text-light-secondary">
                                                    store
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <button
                                            type="button"
                                            onClick={() => logoInputRef.current?.click()}
                                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
                                        >
                                            {logoPreview ? 'تغيير الشعار' : 'رفع الشعار'}
                                        </button>
                                        <p className="text-xs text-text-light-secondary mt-2">
                                            PNG أو JPG (الحد الأقصى 2 ميجا)
                                        </p>
                                        <input
                                            ref={logoInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoChange}
                                            className="hidden"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Banner */}
                            <div>
                                <label className="block text-sm font-medium text-text-light-primary mb-2">
                                    صورة الغلاف (Banner)
                                </label>
                                <div className="space-y-3">
                                    <div className="relative w-full h-40 rounded-lg border-2 border-dashed border-border-light overflow-hidden bg-card-light">
                                        {bannerPreview ? (
                                            <Image
                                                src={bannerPreview}
                                                alt="Banner"
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-5xl text-text-light-secondary">
                                                    panorama
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <button
                                            type="button"
                                            onClick={() => bannerInputRef.current?.click()}
                                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
                                        >
                                            {bannerPreview ? 'تغيير الغلاف' : 'رفع صورة الغلاف'}
                                        </button>
                                        <p className="text-xs text-text-light-secondary mt-2">
                                            PNG أو JPG (الحد الأقصى 5 ميجا) - نسبة 16:9 مفضلة
                                        </p>
                                        <input
                                            ref={bannerInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleBannerChange}
                                            className="hidden"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Store Info Section */}
                    <div className="bg-card-light rounded-lg border border-border-light p-6">
                        <h2 className="text-lg font-semibold text-text-light-primary mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">info</span>
                            معلومات المتجر
                        </h2>

                        <div className="space-y-4">
                            {/* Store Name */}
                            <div>
                                <label className="block text-sm font-medium text-text-light-primary mb-2">
                                    اسم المتجر *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-card-light border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-light-primary "
                                    placeholder="اسم المتجر"
                                    required
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-text-light-primary mb-2">
                                    فئة المتجر *
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-2 bg-card-light border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-light-primary "
                                    required
                                >
                                    <option value="">اختر الفئة</option>
                                    {CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-text-light-primary mb-2">
                                    وصف المتجر
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 bg-card-light border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-light-primary resize-none"
                                    rows={4}
                                    placeholder="وصف قصير عن متجرك ومنتجاتك..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contact Info Section */}
                    <div className="bg-card-light rounded-lg border border-border-light p-6">
                        <h2 className="text-lg font-semibold text-text-light-primary mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">contact_phone</span>
                            معلومات الاتصال
                        </h2>

                        <div className="space-y-4">
                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-text-light-primary mb-2">
                                    رقم الهاتف *
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 bg-card-light border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-light-primary "
                                    placeholder="01XXXXXXXXX"
                                    dir="ltr"
                                    required
                                />
                            </div>

                            {/* Address */}
                            <div>
                                <label className="block text-sm font-medium text-text-light-primary mb-2">
                                    العنوان *
                                </label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-4 py-2 bg-card-light border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-light-primary "
                                    placeholder="العنوان الكامل للمتجر"
                                    required
                                />
                            </div>

                            {/* Governorate */}
                            <div>
                                <label className="block text-sm font-medium text-text-light-primary mb-2">
                                    المحافظة *
                                </label>
                                <select
                                    value={formData.governorate}
                                    onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
                                    className="w-full px-4 py-2 bg-card-light border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-light-primary "
                                    required
                                >
                                    <option value="">اختر المحافظة</option>
                                    {EGYPTIAN_GOVERNORATES.map((gov) => (
                                        <option key={gov.code} value={gov.name}>
                                            {gov.name_ar}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Google Maps Link */}
                            <div>
                                <label className="block text-sm font-medium text-text-light-primary mb-2">
                                    رابط الموقع على خرائط Google
                                </label>
                                <input
                                    type="url"
                                    value={formData.maps_link}
                                    onChange={(e) => setFormData({ ...formData, maps_link: e.target.value })}
                                    className="w-full px-4 py-2 bg-card-light border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-light-primary "
                                    placeholder="https://maps.google.com/..."
                                    dir="ltr"
                                />
                                <p className="text-xs text-text-light-secondary mt-1">
                                    يساعد العملاء في الوصول إلى متجرك بسهولة
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="sticky bottom-0 bg-card-light border-t border-border-light p-4 -mx-4">
                        <div className="max-w-4xl mx-auto">
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        جاري الحفظ...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">save</span>
                                        حفظ التغييرات
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
