'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

interface Store {
    id: string;
    name: string;
    description: string;
    category: string;
    address: string;
    governorate: string;
    district: string | null;
    phone: string;
    maps_link: string;
    logo_url: string | null;
    banner_url: string | null;
    opening_time: string | null;
    closing_time: string | null;
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
        district: '',
        phone: '',
        maps_link: '',
        opening_time: '',
        closing_time: '',
    });

    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);

    const [availableSubcategories, setAvailableSubcategories] = useState<{ id: string; name: string; name_ar: string | null }[]>([]);
    const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);

    const [governorates, setGovernorates] = useState<any[]>([]);
    const [districts, setDistricts] = useState<any[]>([]);

    const logoInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);



    const [categories, setCategories] = useState<{ id: string; name: string; name_ar: string }[]>([]);

    useEffect(() => {
        checkAuth();
        fetchCategories();
        fetchGovernorates();
    }, []);

    // Fetch active governorates and districts
    const fetchGovernorates = async () => {
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
            console.error('Error fetching governorates:', error);
        }
    };

    // Fetch subcategories when category changes
    useEffect(() => {
        const fetchSubcategories = async () => {
            if (!formData.category) {
                setAvailableSubcategories([]);
                return;
            }

            const selectedCatNames = formData.category.split(',');
            const selectedCats = categories.filter(c => selectedCatNames.includes(c.name_ar || c.name));
            if (selectedCats.length === 0) return;

            const categoryIds = selectedCats.map(c => c.id);
            const { data } = await supabase
                .from('subcategories')
                .select('id, name, name_ar')
                .in('category_id', categoryIds)
                .order('name');

            setAvailableSubcategories(data || []);
        };

        fetchSubcategories();
    }, [formData.category, categories]);

    const fetchCategories = async () => {
        const { data } = await supabase
            .from('categories')
            .select('id, name, name_ar')
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        if (data) setCategories(data);
    };

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
                district: storeData.district || '',
                phone: storeData.phone || '',
                maps_link: storeData.maps_link || '',
                opening_time: storeData.opening_time || '',
                closing_time: storeData.closing_time || '',
            });
            setLogoPreview(storeData.logo_url);
            setBannerPreview(storeData.banner_url);

            // Fetch existing store subcategories
            const { data: existingSubs } = await supabase
                .from('store_subcategories')
                .select('subcategory_id')
                .eq('store_id', storeData.id);

            if (existingSubs) {
                setSelectedSubcategories(existingSubs.map(s => s.subcategory_id));
            }
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
                    phone: formData.phone.trim(),
                    maps_link: formData.maps_link.trim(),
                    opening_time: formData.opening_time || null,
                    closing_time: formData.closing_time || null,
                    logo_url: logoUrl,
                    banner_url: bannerUrl,
                })
                .eq('id', store!.id);

            if (error) throw error;

            // Update Store Subcategories
            // First delete existing
            await supabase.from('store_subcategories').delete().eq('store_id', store!.id);

            // Then insert new
            if (selectedSubcategories.length > 0) {
                const { error: subError } = await supabase
                    .from('store_subcategories')
                    .insert(selectedSubcategories.map(subId => ({
                        store_id: store!.id,
                        subcategory_id: subId
                    })));

                if (subError) console.error('Error saving subcategories:', subError);
            }

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
                                    فئات المتجر * (اختر فئة أو أكثر)
                                </label>
                                <div className="grid grid-cols-2 gap-2 bg-background-light rounded-lg border border-border-light p-3">
                                    {categories.map((cat) => {
                                        const catName = (cat.name_ar || cat.name).trim();
                                        const selectedCats = formData.category ? formData.category.split(',') : [];
                                        const isSelected = selectedCats.includes(catName);
                                        return (
                                            <label key={cat.id} className={`flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border transition-all ${isSelected ? 'border-primary bg-primary/10' : 'border-border-light hover:border-primary/50'}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => {
                                                        const cats = formData.category ? formData.category.split(',') : [];
                                                        const updated = isSelected
                                                            ? cats.filter(c => c !== catName)
                                                            : [...cats, catName];
                                                        setFormData({ ...formData, category: updated.join(',') });
                                                    }}
                                                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                                                />
                                                <span className="text-sm text-text-light-primary text-right flex-1">{catName}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Subcategories Selection */}
                            {availableSubcategories.length > 0 && (
                                <div className="space-y-2 animate-fade-in">
                                    <label className="block text-sm font-medium text-text-light-primary">
                                        التخصصات (اختياري)
                                    </label>
                                    <div className="grid grid-cols-2 gap-2 bg-background-light rounded-lg border border-border-light p-3 max-h-48 overflow-y-auto">
                                        {availableSubcategories.map((sub) => (
                                            <label key={sub.id} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-card-light transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSubcategories.includes(sub.id)}
                                                    onChange={() => {
                                                        setSelectedSubcategories(prev =>
                                                            prev.includes(sub.id)
                                                                ? prev.filter(id => id !== sub.id)
                                                                : [...prev, sub.id]
                                                        );
                                                    }}
                                                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                                                />
                                                <span className="text-sm text-text-light-primary text-right flex-1">{sub.name_ar || sub.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <p className="text-xs text-text-light-secondary">
                                        اختر التخصصات الدقيقة متجرك ليظهر في نتائج البحث المخصصة.
                                    </p>
                                </div>
                            )}

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

                            {/* Working Hours */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-light-primary mb-2">
                                        وقت الفتح
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.opening_time}
                                        onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })}
                                        className="w-full px-4 py-2 bg-card-light border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-light-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-light-primary mb-2">
                                        وقت الإغلاق
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.closing_time}
                                        onChange={(e) => setFormData({ ...formData, closing_time: e.target.value })}
                                        className="w-full px-4 py-2 bg-card-light border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-light-primary"
                                    />
                                </div>
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

                            {/* Governorate (read-only - set during registration) */}
                            <div>
                                <label className="block text-sm font-medium text-text-light-primary mb-2">
                                    المحافظة
                                </label>
                                <div className="w-full px-4 py-2 bg-background-light border border-border-light rounded-lg text-text-light-primary cursor-not-allowed">
                                    {governorates.find(g => g.code === formData.governorate)?.name_ar || formData.governorate || 'غير محدد'}
                                </div>
                                <p className="text-xs text-text-light-secondary mt-1">تم تحديد المحافظة أثناء التسجيل ولا يمكن تغييرها</p>
                            </div>

                            {/* District (read-only - set during registration) */}
                            {formData.district && (
                                <div>
                                    <label className="block text-sm font-medium text-text-light-primary mb-2">
                                        المركز
                                    </label>
                                    <div className="w-full px-4 py-2 bg-background-light border border-border-light rounded-lg text-text-light-primary cursor-not-allowed">
                                        {districts.find(d => d.name === formData.district)?.name_ar || formData.district}
                                    </div>
                                </div>
                            )}

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
