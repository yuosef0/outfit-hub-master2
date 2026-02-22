'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Toast from '@/components/Toast';

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];

const AVAILABLE_COLORS = [
    { name: 'أسود', hex: '#000000' },
    { name: 'أبيض', hex: '#FFFFFF' },
    { name: 'أزرق', hex: '#0000FF' },
    { name: 'أحمر', hex: '#FF0000' },
    { name: 'أخضر', hex: '#00FF00' },
    { name: 'أصفر', hex: '#FFFF00' },
    { name: 'رمادي', hex: '#808080' },
    { name: 'بني', hex: '#8B4513' },
    { name: 'بيج', hex: '#F5F5DC' },
    { name: 'كحلي', hex: '#000080' },
    { name: 'نبيتي', hex: '#800000' },
    { name: 'زيتي', hex: '#808000' },
];

interface StoreCategory {
    id: string;
    name: string;
    name_ar: string | null;
}

interface SystemCategory {
    id: string;
    name: string;
    name_ar: string | null;
}

export default function NewProductPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [storeId, setStoreId] = useState<string | null>(null);
    const [storeCategories, setStoreCategories] = useState<StoreCategory[]>([]);
    const [systemCategories, setSystemCategories] = useState<SystemCategory[]>([]);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        description: '',
        price: '',
        old_price: '',
        category: '',
        category_id: '',
        gender_filter: '',
        stock_quantity: '',
        subcategory_id: '',
        is_active: true,
    });

    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
    const [selectedColors, setSelectedColors] = useState<{ name: string, hex: string }[]>([]);
    const [customSize, setCustomSize] = useState('');
    const [showCustomSizeInput, setShowCustomSizeInput] = useState(false);
    const [showAddColorModal, setShowAddColorModal] = useState(false);
    const [newColorName, setNewColorName] = useState('');
    const [newColorHex, setNewColorHex] = useState('#000000');
    const [editingColorIndex, setEditingColorIndex] = useState<number | null>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        checkStoreAndFetchData();
    }, []);

    const checkStoreAndFetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            console.log('[Products/New] User:', user?.id);
            if (!user) {
                console.log('[Products/New] No user - redirecting to login');
                router.push('/login');
                return;
            }

            const { data: store, error: storeError } = await supabase
                .from('stores')
                .select('id, is_active')
                .eq('merchant_id', user.id)
                .single();

            console.log('[Products/New] Store:', store, 'Error:', storeError);

            if (!store) {
                console.log('[Products/New] No store - redirecting to setup');
                router.push('/merchant/setup');
                return;
            }

            if (!store.is_active) {
                console.log('[Products/New] Inactive store - redirecting to pending');
                router.push('/merchant/pending');
                return;
            }

            console.log('[Products/New] All good - setting store ID:', store.id);
            setStoreId(store.id);

            // Fetch store categories
            const { data: categories } = await supabase
                .from('store_categories')
                .select('id, name, name_ar')
                .eq('store_id', store.id)
                .eq('is_active', true)
                .order('display_order');

            setStoreCategories(categories || []);

            // Fetch system categories
            const { data: sysCategories } = await supabase
                .from('categories')
                .select('id, name, name_ar')
                .eq('is_active', true)
                .order('display_order');

            setSystemCategories(sysCategories || []);

        } catch (error) {
            console.error('[Products/New] Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const [availableSubcategories, setAvailableSubcategories] = useState<{ id: string, name: string, name_ar: string | null }[]>([]);

    useEffect(() => {
        if (formData.category_id) {
            fetchSubcategories(formData.category_id);
        } else {
            setAvailableSubcategories([]);
            setFormData(prev => ({ ...prev, subcategory_id: '' }));
        }
    }, [formData.category_id]);

    const fetchSubcategories = async (categoryId: string) => {
        const { data } = await supabase
            .from('subcategories')
            .select('id, name, name_ar')
            .eq('category_id', categoryId)
            .order('name');

        setAvailableSubcategories(data || []);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);

        // Validate max 10 images
        if (images.length + files.length > 10) {
            setToast({ message: 'يمكنك رفع 10 صور كحد أقصى', type: 'error' });
            return;
        }

        // Validate file sizes (max 50MB each)
        const invalidFiles = files.filter(f => f.size > 50 * 1024 * 1024);
        if (invalidFiles.length > 0) {
            setToast({ message: 'حجم الصورة يجب أن يكون أقل من 50 ميجابايت', type: 'error' });
            return;
        }

        setImages([...images, ...files]);

        // Create previews
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviews(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
        setImagePreviews(imagePreviews.filter((_, i) => i !== index));
    };

    const toggleSize = (size: string) => {
        if (selectedSizes.includes(size)) {
            setSelectedSizes(selectedSizes.filter(s => s !== size));
        } else {
            setSelectedSizes([...selectedSizes, size]);
        }
    };

    const addCustomSize = () => {
        if (customSize.trim() && !selectedSizes.includes(customSize.trim())) {
            setSelectedSizes([...selectedSizes, customSize.trim()]);
            setCustomSize('');
            setShowCustomSizeInput(false);
        }
    };

    const toggleColor = (color: { name: string, hex: string }) => {
        const exists = selectedColors.find(c => c.name === color.name && c.hex === color.hex);
        if (exists) {
            setSelectedColors(selectedColors.filter(c => !(c.name === color.name && c.hex === color.hex)));
        } else {
            setSelectedColors([...selectedColors, color]);
        }
    };

    const addNewColor = () => {
        if (!newColorName.trim()) {
            setToast({ message: 'برجاء إدخال اسم اللون', type: 'error' });
            return;
        }

        const colorExists = selectedColors.find(c => c.name === newColorName.trim());
        if (colorExists) {
            setToast({ message: 'هذا اللون موجود بالفعل', type: 'error' });
            return;
        }

        if (editingColorIndex !== null) {
            // Edit existing color
            const updated = [...selectedColors];
            updated[editingColorIndex] = { name: newColorName.trim(), hex: newColorHex };
            setSelectedColors(updated);
            setToast({ message: 'تم تعديل اللون بنجاح', type: 'success' });
        } else {
            // Add new color
            setSelectedColors([...selectedColors, { name: newColorName.trim(), hex: newColorHex }]);
            setToast({ message: 'تم إضافة اللون بنجاح', type: 'success' });
        }

        setShowAddColorModal(false);
        setNewColorName('');
        setNewColorHex('#000000');
        setEditingColorIndex(null);
    };

    const editColor = (index: number) => {
        const color = selectedColors[index];
        setNewColorName(color.name);
        setNewColorHex(color.hex);
        setEditingColorIndex(index);
        setShowAddColorModal(true);
    };

    const deleteColor = (index: number) => {
        setSelectedColors(selectedColors.filter((_, i) => i !== index));
        setToast({ message: 'تم حذف اللون', type: 'success' });
    };

    const calculateDiscount = () => {
        if (formData.old_price && formData.price) {
            const oldPrice = parseFloat(formData.old_price);
            const newPrice = parseFloat(formData.price);
            if (oldPrice > newPrice && oldPrice > 0) {
                return Math.round(((oldPrice - newPrice) / oldPrice) * 100);
            }
        }
        return 0;
    };

    const [variants, setVariants] = useState<{ size: string; color: string; stock: number }[]>([]);

    // Update variants when sizes or colors change
    useEffect(() => {
        const newVariants: { size: string; color: string; stock: number }[] = [];

        // If we have both sizes and colors
        if (selectedSizes.length > 0 && selectedColors.length > 0) {
            selectedSizes.forEach(size => {
                selectedColors.forEach(color => {
                    const existingWrapper = variants.find(v => v.size === size && v.color === color.name);
                    newVariants.push({
                        size,
                        color: color.name,
                        stock: existingWrapper ? existingWrapper.stock : 0
                    });
                });
            });
        }
        // If we only have sizes
        else if (selectedSizes.length > 0) {
            selectedSizes.forEach(size => {
                const existingWrapper = variants.find(v => v.size === size && v.color === '');
                newVariants.push({
                    size,
                    color: '',
                    stock: existingWrapper ? existingWrapper.stock : 0
                });
            });
        }
        // If we only have colors
        else if (selectedColors.length > 0) {
            selectedColors.forEach(color => {
                const existingWrapper = variants.find(v => v.size === '' && v.color === color.name);
                newVariants.push({
                    size: '',
                    color: color.name,
                    stock: existingWrapper ? existingWrapper.stock : 0
                });
            });
        } else {
            // No variants (handled by main stock input if needed, but we'll try to enforce variants if any options selected)
        }

        setVariants(newVariants);
    }, [selectedSizes, selectedColors]); // eslint-disable-line react-hooks/exhaustive-deps

    const updateVariantStock = (index: number, value: string) => {
        const newVariants = [...variants];
        const numValue = value === '' ? 0 : Math.max(0, parseInt(value) || 0);
        newVariants[index] = { ...newVariants[index], stock: numValue };
        setVariants(newVariants);

        // Update total stock
        const totalStock = newVariants.reduce((sum, v) => sum + v.stock, 0);
        setFormData(prev => ({ ...prev, stock_quantity: totalStock.toString() }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!storeId) {
            setToast({ message: 'حدث خطأ، برجاء المحاولة مرة أخرى', type: 'error' });
            return;
        }

        if (images.length === 0) {
            setToast({ message: 'برجاء رفع صورة واحدة على الأقل', type: 'error' });
            return;
        }

        // Validate variants stock if variants exist
        if (variants.length > 0) {
            const totalVariantStock = variants.reduce((sum, v) => sum + v.stock, 0);
            if (totalVariantStock === 0) {
                setToast({ message: 'برجاء تحديد كمية المخزون للأنواع المختلفة', type: 'error' });
                return;
            }
        }

        setSubmitting(true);

        try {
            // Upload images
            const imageUrls: string[] = [];

            for (const image of images) {
                const fileName = `${storeId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${image.name.split('.').pop()}`;
                const { error: uploadError } = await supabase.storage
                    .from('products')
                    .upload(fileName, image);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('products')
                    .getPublicUrl(fileName);

                imageUrls.push(publicUrl);
            }

            // Create product
            const productData: any = {
                store_id: storeId,
                name: formData.name,
                description: formData.description || null,
                price: parseFloat(formData.price),
                category: formData.category || null,
                category_id: formData.category_id || null,
                stock_quantity: parseInt(formData.stock_quantity) || 0, // Default to 0 if empty/NaN
                image_urls: imageUrls,
                is_active: formData.is_active,
                subcategory_id: formData.subcategory_id || null,
            };

            // Add optional fields if provided
            if (formData.old_price) {
                productData.old_price = parseFloat(formData.old_price);
            }
            if (selectedSizes.length > 0) {
                productData.sizes = selectedSizes;
            }
            if (selectedColors.length > 0) {
                // Ensure we store detailed color info if possible, or just names
                // The current DB schema likely expects arrays of strings or JSON
                // Based on previous code, it seemed to be handling objects but check types.ts
                // types.ts says `colors?: string[]`. So we should extract names.
                productData.colors = selectedColors.map(c => c.name);
            }

            const { data: newProduct, error: productError } = await supabase
                .from('products')
                .insert(productData)
                .select()
                .single();

            if (productError) throw productError;

            // Insert Variants
            if (variants.length > 0 && newProduct) {
                const variantsData = variants.map(v => ({
                    product_id: newProduct.id,
                    size: v.size || null,
                    color: v.color || null,
                    stock_quantity: v.stock
                }));

                const { error: variantsError } = await supabase
                    .from('product_variants')
                    .insert(variantsData);

                if (variantsError) throw variantsError;
            }

            setToast({ message: 'تم إضافة المنتج بنجاح! ✅', type: 'success' });

            setTimeout(() => {
                router.push('/merchant/products');
            }, 1500);
        } catch (err: any) {
            console.error('Error creating product:', err);
            // ... error handling
            setToast({ message: err.message || err.details || 'حدث خطأ أثناء إضافة المنتج', type: 'error' });
        } finally {
            setSubmitting(false);
        }
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
    }

    const discount = calculateDiscount();

    return (
        <div className="bg-background-light">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <div className="bg-card-light border-b border-border-light sticky top-0 z-10">
                <div className="px-4 py-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-card-light rounded-lg transition-colors"
                        >
                            <span className="material-symbols-outlined text-text-light-secondary">arrow_back</span>
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-text-light-primary ">
                                ➕ إضافة منتج جديد
                            </h1>
                            <p className="text-text-light-secondary text-sm">
                                أضف منتج جديد لمتجرك
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <main className="p-4 max-w-3xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* صور المنتج */}
                    <div className="bg-card-light rounded-xl p-5 border border-border-light">
                        <label className="block text-right font-bold text-text-light-primary mb-3">
                            📷 صور المنتج * (مطلوب صورة واحدة على الأقل)
                        </label>
                        <p className="text-sm text-text-light-secondary mb-4 text-right">
                            حد أقصى 10 صور | حجم الصورة: أقل من 50 ميجابايت
                        </p>

                        <div className="grid grid-cols-3 gap-3 mb-4">
                            {imagePreviews.map((preview, index) => (
                                <div key={index} className="relative group aspect-square">
                                    <img
                                        src={preview}
                                        alt={`صورة ${index + 1}`}
                                        className="w-full h-full object-cover rounded-lg"
                                    />
                                    {index === 0 && (
                                        <div className="absolute top-2 right-2 bg-primary text-white px-2 py-1 rounded text-xs font-bold">
                                            ★ رئيسية
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-2 left-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <span className="material-symbols-outlined text-sm">close</span>
                                    </button>
                                </div>
                            ))}

                            {images.length < 10 && (
                                <label className="border-2 border-dashed border-border-light rounded-lg aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-card-light transition-colors">
                                    <span className="material-symbols-outlined text-4xl text-text-light-secondary">add_photo_alternate</span>
                                    <span className="text-xs text-text-light-secondary mt-2 font-medium">أضف صورة</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* اسم المنتج + SKU */}
                    <div className="bg-card-light rounded-xl p-5 border border-border-light">
                        <label className="block text-right font-bold text-text-light-primary mb-3">
                            اسم المنتج *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 rounded-lg border border-border-light bg-background-light text-text-light-primary text-right focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="تيشرت قطن 100%"
                        />


                    </div>

                    {/* الوصف */}
                    <div className="bg-card-light rounded-xl p-5 border border-border-light">
                        <label className="block text-right font-bold text-text-light-primary mb-3">
                            الوصف
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            className="w-full px-4 py-3 rounded-lg border border-border-light bg-background-light text-text-light-primary text-right focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="تيشرت مصري ممتاز مناسب لكل المناسبات..."
                        />
                    </div>

                    {/* التصنيف والفئة */}
                    <div className="bg-card-light rounded-xl p-5 border border-border-light space-y-5">

                        {/* System Category Select */}
                        <div>
                            <label className="block text-right font-bold text-text-light-primary mb-3">
                                التصنيف العام (للبحث والفلترة العامة) *
                            </label>
                            <select
                                name="category_id"
                                value={formData.category_id || ''}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 rounded-lg border border-border-light bg-background-light text-text-light-primary text-right focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                                <option value="">اختر التصنيف العام</option>
                                {systemCategories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.name_ar || cat.name}</option>
                                ))}
                            </select>
                            <p className="text-xs text-text-light-secondary mt-1 text-right">
                                هذا التصنيف يساعد العملاء في العثور على منتجك عند البحث في التطبيق بالكامل.
                            </p>
                        </div>

                        {/* Subcategory Select */}
                        {availableSubcategories.length > 0 && (
                            <div>
                                <label className="block text-right font-bold text-text-light-primary mb-3">
                                    القسم الفرعي *
                                </label>
                                <select
                                    name="subcategory_id"
                                    value={formData.subcategory_id || ''}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-border-light bg-background-light text-text-light-primary text-right focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    <option value="">اختر القسم الفرعي</option>
                                    {availableSubcategories.map((sub) => (
                                        <option key={sub.id} value={sub.id}>
                                            {sub.name_ar || sub.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Store Section Select (NEW) */}
                        <div>
                            <label className="block text-right font-bold text-text-light-primary mb-3">
                                قسم المتجر (للظهور في صفحة متجرك) *
                            </label>
                            <select
                                name="category"
                                value={formData.category} // Save Name here
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 rounded-lg border border-border-light bg-background-light text-text-light-primary text-right focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                                <option value="">اختر قسم داخل متجرك</option>
                                {storeCategories.map((cat) => (
                                    <option key={cat.id} value={cat.name}>{cat.name_ar || cat.name}</option>
                                ))}
                            </select>
                            {storeCategories.length === 0 && (
                                <p className="text-xs text-red-500 mt-1 text-right">
                                    تنبيه: لم تقم بإضافة أقسام لمتجرك بعد (مثل: رجالي، حريمي). يمكنك إضافتها من "الأقسام" في لوحة التحكم.
                                </p>
                            )}
                            <p className="text-xs text-text-light-secondary mt-1 text-right">
                                هذا هو القسم الذي سيظهر فيه المنتج عند زيارة العميل لصفحة متجرك.
                            </p>
                        </div>

                    </div>

                    {/* السعر */}
                    <div className="bg-card-light rounded-xl p-5 border border-border-light space-y-5">
                        <div>
                            <label className="block text-right font-bold text-text-light-primary mb-3">
                                السعر *
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-3 rounded-lg border border-border-light bg-background-light text-text-light-primary text-right focus:ring-2 focus:ring-primary focus:border-transparent pr-16"
                                    placeholder="250"
                                />
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light-secondary font-medium">
                                    ج.م
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-right font-bold text-text-light-primary mb-3">
                                السعر قبل الخصم (اختياري)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    name="old_price"
                                    value={formData.old_price}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-3 rounded-lg border border-border-light bg-background-light text-text-light-primary text-right focus:ring-2 focus:ring-primary focus:border-transparent pr-16"
                                    placeholder="350"
                                />
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light-secondary font-medium">
                                    ج.م
                                </span>
                            </div>
                            {discount > 0 && (
                                <p className="text-sm text-primary font-bold mt-2 text-right">
                                    ← خصم {discount}% 🏷️
                                </p>
                            )}
                        </div>
                    </div>

                    {/* المقاسات المتاحة */}
                    <div className="bg-card-light rounded-xl p-5 border border-border-light">
                        <label className="block text-right font-bold text-text-light-primary mb-3">
                            المقاسات المتاحة
                        </label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {AVAILABLE_SIZES.map((size) => (
                                <button
                                    key={size}
                                    type="button"
                                    onClick={() => toggleSize(size)}
                                    className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${selectedSizes.includes(size)
                                        ? 'border-primary bg-primary text-white'
                                        : 'border-border-light text-text-light-secondary hover:border-primary/50'
                                        }`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>

                        {/* Custom sizes */}
                        {selectedSizes.filter(s => !AVAILABLE_SIZES.includes(s)).map((size) => (
                            <span key={size} className="inline-flex items-center gap-1 px-3 py-1 bg-primary text-white rounded-lg text-sm mr-2 mb-2">
                                {size}
                                <button
                                    type="button"
                                    onClick={() => setSelectedSizes(selectedSizes.filter(s => s !== size))}
                                    className="hover:bg-white/20 rounded"
                                >
                                    <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                            </span>
                        ))}

                        {showCustomSizeInput ? (
                            <div className="flex gap-2 mt-3">
                                <input
                                    type="text"
                                    value={customSize}
                                    onChange={(e) => setCustomSize(e.target.value)}
                                    placeholder="مثال: 38، 40"
                                    className="flex-1 px-3 py-2 rounded-lg border border-border-light bg-background-light text-text-light-primary text-right"
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSize())}
                                />
                                <button
                                    type="button"
                                    onClick={addCustomSize}
                                    className="px-4 py-2 bg-primary text-white rounded-lg font-medium"
                                >
                                    إضافة
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCustomSizeInput(false);
                                        setCustomSize('');
                                    }}
                                    className="px-4 py-2 bg-surface-light text-text-light-primary rounded-lg"
                                >
                                    إلغاء
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setShowCustomSizeInput(true)}
                                className="text-primary font-medium text-sm hover:underline"
                            >
                                + مقاس مخصص
                            </button>
                        )}
                    </div>

                    {/* الألوان المتاحة */}
                    <div className="bg-card-light rounded-xl p-5 border border-border-light">
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-right font-bold text-text-light-primary">
                                الألوان المتاحة
                            </label>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAddColorModal(true);
                                    setEditingColorIndex(null);
                                    setNewColorName('');
                                    setNewColorHex('#000000');
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                            >
                                <span className="material-symbols-outlined text-sm">add</span>
                                إضافة لون
                            </button>
                        </div>

                        {selectedColors.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {selectedColors.map((color, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-primary bg-primary/10"
                                    >
                                        <span
                                            className={`w-6 h-6 rounded-full ${color.hex === '#FFFFFF' ? 'border-2 border-border-light' : ''}`}
                                            style={{ backgroundColor: color.hex }}
                                        ></span>
                                        <span className="text-primary font-medium">{color.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => editColor(index)}
                                            className="p-1 hover:bg-primary/20 rounded transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm text-primary">edit</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => deleteColor(index)}
                                            className="p-1 hover:bg-red-500/20 rounded transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm text-red-500">delete</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-text-light-secondary text-sm text-center py-4">
                                لم تقم بإضافة أي ألوان بعد. اضغط "إضافة لون" للبدء
                            </p>
                        )}
                    </div>

                    {/* الكمية المتاحة / المخزون تفصيلي */}
                    <div className="bg-card-light rounded-xl p-5 border border-border-light">
                        <label className="block text-right font-bold text-text-light-primary mb-3">
                            الكمية المتاحة *
                        </label>

                        {variants.length > 0 ? (
                            <div className="space-y-4">
                                <p className="text-sm text-text-light-secondary text-right mb-2">
                                    أدخل الكمية المتاحة لكل نوع (المجموع: {formData.stock_quantity})
                                </p>
                                <div className="border border-border-light rounded-lg overflow-hidden">
                                    <table className="w-full text-right">
                                        <thead className="bg-surface-light">
                                            <tr>
                                                <th className="px-4 py-2 text-text-light-primary font-bold border-b border-border-light">المقاس</th>
                                                <th className="px-4 py-2 text-text-light-primary font-bold border-b border-border-light">اللون</th>
                                                <th className="px-4 py-2 text-text-light-primary font-bold border-b border-border-light">الكمية</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {variants.map((variant, index) => (
                                                <tr key={index} className="border-b border-border-light last:border-0 hover:bg-background-light">
                                                    <td className="px-4 py-2 text-text-light-secondary">
                                                        {variant.size || '-'}
                                                    </td>
                                                    <td className="px-4 py-2 text-text-light-secondary">
                                                        {variant.color || '-'}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="flex items-center gap-1 justify-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => updateVariantStock(index, String(Math.max(0, variant.stock - 1)))}
                                                                className="w-7 h-7 flex items-center justify-center rounded-md bg-background-light border border-border-light hover:bg-card-light text-text-light-primary transition-colors"
                                                            >
                                                                <span className="material-symbols-outlined text-[16px]">remove</span>
                                                            </button>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={variant.stock === 0 ? '' : variant.stock}
                                                                onChange={(e) => updateVariantStock(index, e.target.value)}
                                                                placeholder="0"
                                                                className="w-14 px-1 py-1 rounded border border-border-light bg-background-light focus:ring-2 focus:ring-primary text-center text-sm"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => updateVariantStock(index, String(variant.stock + 1))}
                                                                className="w-7 h-7 flex items-center justify-center rounded-md bg-primary/15 hover:bg-primary/25 text-primary transition-colors"
                                                            >
                                                                <span className="material-symbols-outlined text-[16px]">add</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <input
                                type="number"
                                name="stock_quantity"
                                value={formData.stock_quantity}
                                onChange={handleChange}
                                required
                                min="0"
                                className="w-full px-4 py-3 rounded-lg border border-border-light bg-background-light text-text-light-primary text-right focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="50"
                            />
                        )}
                    </div>

                    {/* نشر فوراً */}
                    <div className="bg-card-light rounded-xl p-5 border border-border-light">
                        <label className="flex items-center justify-between cursor-pointer">
                            <div className="text-right">
                                <p className="font-bold text-text-light-primary ">نشر فوراً</p>
                                <p className="text-sm text-text-light-secondary">المنتج سيكون متاحاً للعملاء فوراً</p>
                            </div>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-14 h-7 bg-surface-light rounded-full peer peer-checked:bg-primary transition-colors"></div>
                                <div className="absolute top-0.5 right-0.5 w-6 h-6 bg-card-light rounded-full transition-transform peer-checked:translate-x-[-28px]"></div>
                            </div>
                        </label>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 sticky bottom-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex-1 px-6 py-4 bg-surface-light hover:bg-surface-light text-text-light-primary font-bold rounded-xl transition-colors"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 px-6 py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    جاري الحفظ...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">save</span>
                                    حفظ المنتج
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </main>

            {/* Add/Edit Color Modal */}
            {showAddColorModal && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                    onClick={() => {
                        setShowAddColorModal(false);
                        setNewColorName('');
                        setNewColorHex('#000000');
                        setEditingColorIndex(null);
                    }}
                >
                    <div
                        className="bg-card-light rounded-2xl p-6 max-w-md w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-text-light-primary">
                                {editingColorIndex !== null ? '✏️ تعديل اللون' : '🎨 إضافة لون جديد'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowAddColorModal(false);
                                    setNewColorName('');
                                    setNewColorHex('#000000');
                                    setEditingColorIndex(null);
                                }}
                                className="p-2 hover:bg-surface-light rounded-lg transition-colors"
                            >
                                <span className="material-symbols-outlined text-text-light-secondary">close</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-text-light-primary mb-2 text-right">
                                    اسم اللون *
                                </label>
                                <input
                                    type="text"
                                    value={newColorName}
                                    onChange={(e) => setNewColorName(e.target.value)}
                                    placeholder="مثال: أزرق سماوي"
                                    className="w-full px-4 py-3 rounded-lg border border-border-light bg-background-light text-text-light-primary text-right focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-text-light-primary mb-2 text-right">
                                    كود اللون *
                                </label>
                                <div className="flex gap-3 items-center">
                                    <input
                                        type="color"
                                        value={newColorHex}
                                        onChange={(e) => setNewColorHex(e.target.value)}
                                        className="w-16 h-12 rounded-lg border-2 border-border-light cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={newColorHex}
                                        onChange={(e) => setNewColorHex(e.target.value)}
                                        placeholder="#000000"
                                        className="flex-1 px-4 py-3 rounded-lg border border-border-light bg-background-light text-text-light-primary focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {newColorName && (
                                <div className="bg-surface-light rounded-lg p-4">
                                    <p className="text-sm text-text-light-secondary mb-2 text-right">معاينة:</p>
                                    <div className="flex items-center gap-3 justify-center">
                                        <span
                                            className="w-12 h-12 rounded-full border-2 border-border-light"
                                            style={{ backgroundColor: newColorHex }}
                                        ></span>
                                        <span className="text-text-light-primary font-bold">{newColorName}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowAddColorModal(false);
                                    setNewColorName('');
                                    setNewColorHex('#000000');
                                    setEditingColorIndex(null);
                                }}
                                className="flex-1 px-4 py-3 bg-surface-light hover:bg-surface-light text-text-light-primary rounded-lg transition-colors font-bold"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={addNewColor}
                                disabled={!newColorName.trim()}
                                className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {editingColorIndex !== null ? 'حفظ التعديلات' : 'إضافة'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
