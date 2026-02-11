'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Toast from '@/components/Toast';
import { EGYPTIAN_GOVERNORATES } from '@/lib/types';



const AREAS = [
    'مدينة المنيا',
    'المنيا الجديدة',
    'أبو قرقاص',
    'مغاغة',
    'بني مزار',
    'ملوي',
    'سمالوط',
    'العدوة',
    'دير مواس',
];

export default function MerchantSetupPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        address: '',
        governorate: '',
        area: '',
        maps_link: '',
        phone: '',
        logo: null as File | null,
        banner: null as File | null,
    });

    const [previews, setPreviews] = useState({
        logo: '',
        banner: '',
    });

    const [availableSubcategories, setAvailableSubcategories] = useState<{ id: string; name: string; name_ar: string | null }[]>([]);
    const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const [categories, setCategories] = useState<{ id: string; name: string; name_ar: string }[]>([]);

    useEffect(() => {
        checkUser();
        const fetchCategories = async () => {
            const { data } = await supabase
                .from('categories')
                .select('id, name, name_ar')
                .eq('is_active', true)
                .order('display_order', { ascending: true });

            if (data) setCategories(data);
        };
        fetchCategories();
    }, []);

    // Fetch subcategories when category changes
    useEffect(() => {
        const fetchSubcategories = async () => {
            if (!formData.category) {
                setAvailableSubcategories([]);
                return;
            }

            const selectedCat = categories.find(c => (c.name_ar || c.name) === formData.category);
            if (!selectedCat) return;

            const { data } = await supabase
                .from('subcategories')
                .select('id, name, name_ar')
                .eq('category_id', selectedCat.id)
                .order('name');

            setAvailableSubcategories(data || []);
        };

        fetchSubcategories();
    }, [formData.category, categories]);

    // Fetch subcategories when category changes
    useEffect(() => {
        const fetchSubcategories = async () => {
            if (!formData.category) {
                setAvailableSubcategories([]);
                return;
            }

            const selectedCat = categories.find(c => (c.name_ar || c.name) === formData.category);
            if (!selectedCat) return;

            const { data } = await supabase
                .from('subcategories')
                .select('id, name, name_ar')
                .eq('category_id', selectedCat.id)
                .order('name');

            setAvailableSubcategories(data || []);
        };

        fetchSubcategories();
    }, [formData.category, categories]);

    const handleSubcategoryToggle = (id: string) => {
        setSelectedSubcategories(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/merchant/signup');
            return;
        }
        setUserId(user.id);

        const { data: existingStore } = await supabase
            .from('stores')
            .select('id')
            .eq('merchant_id', user.id)
            .maybeSingle();

        if (existingStore) {
            router.push('/merchant/dashboard');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setToast({ message: 'حجم الصورة يجب أن يكون أقل من 2 ميجابايت', type: 'error' });
                return;
            }

            setFormData({ ...formData, [type]: file });

            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviews({ ...previews, [type]: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const nextStep = () => {
        if (currentStep === 1 && (!formData.name || !formData.category)) {
            setToast({ message: 'برجاء ملء جميع الحقول المطلوبة', type: 'error' });
            return;
        }
        if (currentStep === 2) {
            if (!formData.address || !formData.governorate || !formData.area || !formData.phone) {
                setToast({ message: 'برجاء ملء جميع الحقول المطلوبة', type: 'error' });
                return;
            }
            if (!/^01[0-2,5]{1}[0-9]{8}$/.test(formData.phone)) {
                setToast({ message: 'رقم الهاتف غير صحيح', type: 'error' });
                return;
            }
        }
        setCurrentStep(currentStep + 1);
        window.scrollTo(0, 0);
    };

    const prevStep = () => {
        setCurrentStep(currentStep - 1);
        window.scrollTo(0, 0);
    };

    const handleSubmit = async () => {
        if (!formData.logo) {
            setToast({ message: 'برجاء رفع شعار المتجر', type: 'error' });
            return;
        }

        setLoading(true);
        try {
            const logoExt = formData.logo.name.split('.').pop();
            const logoFileName = `${userId}-logo-${Math.floor(Math.random() * 100000)}.${logoExt}`;
            const { error: logoError } = await supabase.storage.from('stores').upload(logoFileName, formData.logo);
            if (logoError) throw logoError;

            const { data: { publicUrl: logoUrl } } = supabase.storage.from('stores').getPublicUrl(logoFileName);

            let bannerUrl = null;
            if (formData.banner) {
                const bannerExt = formData.banner.name.split('.').pop();
                const bannerFileName = `${userId}-banner-${Math.floor(Math.random() * 100000)}.${bannerExt}`;
                const { error: bannerError } = await supabase.storage.from('stores').upload(bannerFileName, formData.banner);
                if (bannerError) throw bannerError;
                const { data: { publicUrl } } = supabase.storage.from('stores').getPublicUrl(bannerFileName);
                bannerUrl = publicUrl;
            }

            // Get auth token for API call
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) throw new Error('غير مسجل دخول');

            // Create store via API (bypasses RLS)
            const response = await fetch('/api/stores', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description,
                    category: formData.category,
                    address: formData.address,
                    governorate: formData.governorate,
                    area: formData.area,
                    phone: formData.phone,
                    maps_link: formData.maps_link || undefined,
                    logo_url: logoUrl,
                    banner_url: bannerUrl,
                }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'حدث خطأ أثناء إنشاء المتجر');

            // Insert Store Subcategories
            if (selectedSubcategories.length > 0 && result.store?.id) {
                const { error: subError } = await supabase
                    .from('store_subcategories')
                    .insert(selectedSubcategories.map(subId => ({
                        store_id: result.store.id,
                        subcategory_id: subId
                    })));

                if (subError) console.error('Error saving subcategories:', subError);
            }

            setToast({ message: 'تم إرسال طلبك بنجاح!', type: 'success' });
            setTimeout(() => router.push('/merchant/pending'), 2000);
        } catch (err: any) {
            setToast({ message: err.message || 'حدث خطأ', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const totalSteps = 3;
    const progressPercentage = Math.round((currentStep / totalSteps) * 100);

    return (
        <div className="relative flex h-full min-h-screen w-full flex-col bg-background-light font-display overflow-x-hidden">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="sticky top-0 z-10 flex items-center bg-background-light p-4 pb-2 justify-between">
                <button onClick={() => currentStep > 1 ? prevStep() : router.back()} className="text-text-light-primary flex size-12 shrink-0 items-center justify-start hover:opacity-70 transition-opacity">
                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>arrow_back</span>
                </button>
                <h2 className="text-text-light-primary text-lg font-bold leading-tight tracking-[-0.015em] hidden sm:block">تسجيل متجر</h2>
                <div className="size-12"></div>
            </div>

            <div className="flex flex-col w-full px-4 pt-1 pb-4">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-text-light-secondary">خطوة {currentStep} من {totalSteps}</span>
                    <span className="text-xs font-medium text-primary">{progressPercentage}% مكتمل</span>
                </div>
                <div className="flex w-full flex-row items-center justify-center gap-2">
                    {[1, 2, 3].map((step) => (
                        <div key={step} className={`h-1.5 flex-1 rounded-full ${step <= currentStep ? 'bg-primary' : 'bg-surface-light'}`}></div>
                    ))}
                </div>
            </div>

            <div className="flex-1 flex flex-col px-4 pb-4">
                {currentStep === 1 && (
                    <>
                        <div className="pb-6 pt-2">
                            <h1 className="text-text-light-primary tracking-tight text-[28px] font-bold leading-tight text-right">معلومات المتجر</h1>
                            <p className="text-text-light-secondary text-base font-normal leading-normal pt-2 text-right">أخبر العملاء عن متجرك للبدء.</p>
                        </div>

                        <div className="flex flex-col gap-5">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-text-light-primary text-right">اسم المتجر *</label>
                                <input className="w-full rounded-lg border border-border-light bg-card-light px-4 py-3 text-base text-text-light-primary placeholder-text-light-secondary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm text-right" name="name" value={formData.name} onChange={handleChange} placeholder="مثال: ستايل هب" type="text" />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-text-light-primary text-right">وصف المتجر</label>
                                <div className="relative">
                                    <textarea className="w-full rounded-lg border border-border-light bg-card-light px-4 py-3 text-base text-text-light-primary placeholder-text-light-secondary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm resize-none text-right" name="description" value={formData.description} onChange={handleChange} placeholder="أحدث صيحات الموضة..." rows={4} maxLength={500} />
                                    <div className="absolute bottom-3 left-3 text-xs text-text-light-secondary">{formData.description.length}/500</div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-text-light-primary text-right">الفئة الرئيسية *</label>
                                <div className="relative">
                                    <select className="w-full appearance-none rounded-lg border border-border-light bg-card-light px-4 py-3 text-base text-text-light-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm pr-10 text-right" name="category" value={formData.category} onChange={handleChange}>
                                        <option value="">اختر الفئة</option>
                                        {categories.map((cat) => (<option key={cat.id} value={cat.name_ar || cat.name}>{cat.name_ar || cat.name}</option>))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-4 text-text-light-secondary">
                                        <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>expand_more</span>
                                    </div>
                                </div>
                            </div>

                            {/* Subcategories Selection */}
                            {availableSubcategories.length > 0 && (
                                <div className="flex flex-col gap-1.5 animate-fade-in">
                                    <label className="text-sm font-semibold text-text-light-primary text-right">التخصصات (اختياري)</label>
                                    <div className="grid grid-cols-2 gap-2 bg-card-light rounded-lg border border-border-light p-3 max-h-48 overflow-y-auto">
                                        {availableSubcategories.map((sub) => (
                                            <label key={sub.id} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-background-light transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSubcategories.includes(sub.id)}
                                                    onChange={() => handleSubcategoryToggle(sub.id)}
                                                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                                                />
                                                <span className="text-sm text-text-light-primary text-right flex-1">{sub.name_ar || sub.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Next Button */}
                            <div className="mt-8">
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="w-full bg-primary text-white py-4 px-6 rounded-lg font-bold text-lg hover:bg-primary/90 transition-all shadow-lg"
                                >
                                    التالي ←
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {currentStep === 2 && (
                    <>
                        <div className="pb-6 pt-2">
                            <h1 className="text-text-light-primary tracking-tight text-[28px] font-bold leading-tight text-right">الموقع والتواصل</h1>
                            <p className="text-text-light-secondary text-base font-normal leading-normal pt-2 text-right">أدخل عنوان متجرك ووسائل التواصل.</p>
                        </div>

                        <div className="flex flex-col gap-5">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-text-light-primary text-right">العنوان *</label>
                                <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full rounded-lg border border-border-light bg-card-light px-4 py-3 text-base text-text-light-primary placeholder-text-light-secondary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm text-right" placeholder="شارع طه حسين، مدينة المنيا" />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-text-light-primary text-right">المحافظة *</label>
                                <div className="relative">
                                    <select className="w-full appearance-none rounded-lg border border-border-light bg-card-light px-4 py-3 text-base text-text-light-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm pr-10 text-right" name="governorate" value={formData.governorate} onChange={handleChange}>
                                        <option value="">اختر المحافظة</option>
                                        {EGYPTIAN_GOVERNORATES.map((gov) => (<option key={gov.code} value={gov.name}>{gov.name_ar}</option>))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-4 text-text-light-secondary">
                                        <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>expand_more</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-text-light-primary text-right">المنطقة *</label>
                                <div className="relative">
                                    <select name="area" value={formData.area} onChange={handleChange} className="w-full appearance-none rounded-lg border border-border-light bg-card-light px-4 py-3 text-base text-text-light-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm pr-10 text-right">
                                        <option value="">اختر المنطقة</option>
                                        {AREAS.map((area) => (<option key={area} value={area}>{area}</option>))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-4 text-text-light-secondary">
                                        <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>expand_more</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-text-light-primary text-right">رابط Google Maps (اختياري)</label>
                                <input type="url" name="maps_link" value={formData.maps_link} onChange={handleChange} className="w-full rounded-lg border border-border-light bg-card-light px-4 py-3 text-base text-text-light-primary placeholder-text-light-secondary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm text-right" placeholder="https://maps.google.com/..." />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-text-light-primary text-right">رقم WhatsApp *</label>
                                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full rounded-lg border border-border-light bg-card-light px-4 py-3 text-base text-text-light-primary placeholder-text-light-secondary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm text-right" placeholder="01012345678" />
                            </div>

                            {/* Navigation Buttons */}
                            <div className="mt-8 flex gap-3">
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="flex-1 bg-surface-light text-text-light-primary py-4 px-6 rounded-lg font-bold text-lg hover:bg-surface-light transition-all"
                                >
                                    → رجوع
                                </button>
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="flex-1 bg-primary text-white py-4 px-6 rounded-lg font-bold text-lg hover:bg-primary/90 transition-all shadow-lg"
                                >
                                    التالي ←
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {currentStep === 3 && (
                    <>
                        <div className="pb-6 pt-2">
                            <h1 className="text-text-light-primary tracking-tight text-[28px] font-bold leading-tight text-right">الهوية البصرية</h1>
                            <p className="text-text-light-secondary text-base font-normal leading-normal pt-2 text-right">أضف شعار وصورة غلاف لمتجرك.</p>
                        </div>

                        <div className="mb-6">
                            <h2 className="text-text-light-primary text-base font-bold leading-tight tracking-[-0.015em] text-right pb-3">لوجو المتجر *</h2>
                            <div className="flex flex-row items-center gap-4">
                                <label className="relative group cursor-pointer shrink-0">
                                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} className="hidden" />
                                    {previews.logo ? (
                                        <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-primary">
                                            <img src={previews.logo} alt="Logo" className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="h-24 w-24 rounded-full bg-card-light border-2 border-dashed border-border-light flex items-center justify-center hover:border-primary hover:bg-primary/5 transition-colors">
                                            <span className="material-symbols-outlined text-text-light-secondary group-hover:text-primary" style={{ fontSize: '32px' }}>photo_camera</span>
                                        </div>
                                    )}
                                    <div className="absolute bottom-0 right-0 bg-primary rounded-full p-1.5 shadow-md border-2 border-background-light">
                                        <span className="material-symbols-outlined text-white" style={{ fontSize: '14px' }}>{previews.logo ? 'edit' : 'add'}</span>
                                    </div>
                                </label>
                                <div className="flex flex-col">
                                    <p className="text-sm font-medium text-text-light-primary ">اسحب الصورة أو اضغط للرفع</p>
                                    <p className="text-xs text-text-light-secondary mt-1">PNG/JPG، حد أقصى 2MB</p>
                                </div>
                            </div>
                        </div>

                        <div className="mb-8">
                            <h2 className="text-text-light-primary text-base font-bold leading-tight tracking-[-0.015em] text-right pb-3">صورة الغلاف (اختياري)</h2>
                            <label className="w-full aspect-[16/9] sm:aspect-[21/9] rounded-lg bg-card-light border-2 border-dashed border-border-light flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors group overflow-hidden">
                                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'banner')} className="hidden" />
                                {previews.banner ? (
                                    <img src={previews.banner} alt="Banner" className="w-full h-full object-cover" />
                                ) : (
                                    <>
                                        <div className="rounded-full bg-card-light p-3 mb-2 group-hover:bg-card-light transition-colors">
                                            <span className="material-symbols-outlined text-text-light-secondary group-hover:text-primary" style={{ fontSize: '28px' }}>image</span>
                                        </div>
                                        <p className="text-sm font-medium text-primary">اسحب الصورة أو اضغط للرفع</p>
                                    </>
                                )}
                            </label>
                        </div>

                        <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4 mb-6">
                            <p className="text-sm text-blue-300 text-right">سيتم مراجعة متجرك وتفعيله خلال 24 ساعة. سنتواصل معك على WhatsApp.</p>
                        </div>

                        {/* Navigation Buttons */}
                        <div className="mt-8 flex gap-3">
                            <button
                                type="button"
                                onClick={prevStep}
                                className="flex-1 bg-surface-light text-text-light-primary py-4 px-6 rounded-lg font-bold text-lg hover:bg-surface-light transition-all"
                            >
                                → رجوع
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-1 bg-primary text-white py-4 px-6 rounded-lg font-bold text-lg hover:bg-primary/90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        جاري الإرسال...
                                    </>
                                ) : (
                                    '✅ إرسال للمراجعة'
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div >
    );
}
