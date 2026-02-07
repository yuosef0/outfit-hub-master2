'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

interface ProductVariant {
    id?: string;
    product_id: string;
    size: string | null;
    color: string | null;
    stock_quantity: number;
}

export default function EditProductPage() {
    const router = useRouter();
    const params = useParams();
    const productId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [storeId, setStoreId] = useState<string | null>(null);
    const [storeCategories, setStoreCategories] = useState<StoreCategory[]>([]);
    const [systemCategories, setSystemCategories] = useState<SystemCategory[]>([]);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    const [formData, setFormData] = useState({
        name: '',
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

    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [newImages, setNewImages] = useState<File[]>([]);
    const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

    // Color State
    const [selectedColors, setSelectedColors] = useState<{ name: string, hex: string }[]>([]);
    const [showAddColorModal, setShowAddColorModal] = useState(false);
    const [newColorName, setNewColorName] = useState('');
    const [newColorHex, setNewColorHex] = useState('#000000');
    const [editingColorIndex, setEditingColorIndex] = useState<number | null>(null);

    const [customSize, setCustomSize] = useState('');
    const [showCustomSizeInput, setShowCustomSizeInput] = useState(false);

    // Variants state
    const [variants, setVariants] = useState<{ id?: string; size: string; color: string; stock: number }[]>([]);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Subcategories state
    const [availableSubcategories, setAvailableSubcategories] = useState<{ id: string, name: string, name_ar: string | null }[]>([]);

    useEffect(() => {
        checkStoreAndFetchData();
    }, [productId]);

    const checkStoreAndFetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data: store } = await supabase
                .from('stores')
                .select('id, is_active')
                .eq('merchant_id', user.id)
                .single();

            if (!store) {
                router.push('/merchant/setup');
                return;
            }

            if (!store.is_active) {
                router.push('/merchant/pending');
                return;
            }

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

            // Fetch product
            const { data: product, error: productError } = await supabase
                .from('products')
                .select('*')
                .eq('id', productId)
                .eq('store_id', store.id)
                .single();

            if (productError || !product) {
                setToast({ message: 'المنتج غير موجود', type: 'error' });
                setTimeout(() => router.push('/merchant/products'), 2000);
                return;
            }

            // Fetch Subcategories if product has a category
            if (product.category && sysCategories) {
                const sysCat = sysCategories.find(c => c.name === product.category);
                if (sysCat) {
                    const { data: subs } = await supabase
                        .from('subcategories')
                        .select('id, name, name_ar')
                        .eq('category_id', sysCat.id)
                        .order('name');
                    setAvailableSubcategories(subs || []);
                }
            }

            // Fetch variants
            const { data: productVariants } = await supabase
                .from('product_variants')
                .select('*')
                .eq('product_id', productId);

            // Populate form
            setFormData({
                name: product.name || '',
                description: product.description || '',
                price: product.price?.toString() || '',
                old_price: product.old_price?.toString() || '',
                category: product.category || '',
                category_id: product.category_id || '',
                gender_filter: product.gender_filter || '',
                stock_quantity: product.stock_quantity?.toString() || '',
                subcategory_id: product.subcategory_id || '',
                is_active: product.is_active ?? true,
            });

            setExistingImages(product.image_urls || []);
            setSelectedSizes(product.sizes || []);

            // Handle colors loading
            let loadedColors: { name: string, hex: string }[] = [];
            if (Array.isArray(product.colors)) {
                loadedColors = product.colors.map((c: any) => {
                    const name = typeof c === 'string' ? c : c.name || c;
                    const knownColor = AVAILABLE_COLORS.find(ac => ac.name === name);
                    return {
                        name,
                        hex: knownColor ? knownColor.hex : '#000000'
                    };
                });
            }
            setSelectedColors(loadedColors);

            // Set variants
            if (productVariants && productVariants.length > 0) {
                setVariants(productVariants.map(v => ({
                    id: v.id,
                    size: v.size || '',
                    color: v.color || '',
                    stock: v.stock_quantity
                })));
            }

        } catch (error) {
            console.error('Error:', error);
            setToast({ message: 'حدث خطأ أثناء التحميل', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const fetchSubcategories = async (categoryId: string) => {
        const { data } = await supabase
            .from('subcategories')
            .select('id, name, name_ar')
            .eq('category_id', categoryId)
            .order('name');

        setAvailableSubcategories(data || []);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));

        if (name === 'category_id') {
            if (value) {
                fetchSubcategories(value);
            } else {
                setAvailableSubcategories([]);
            }
            // Reset subcategory selection
            setFormData(prev => ({ ...prev, subcategory_id: '' }));
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);

        const totalImages = existingImages.length + newImages.length + files.length;
        if (totalImages > 10) {
            setToast({ message: 'يمكنك رفع 10 صور كحد أقصى', type: 'error' });
            return;
        }

        const invalidFiles = files.filter(f => f.size > 2 * 1024 * 1024);
        if (invalidFiles.length > 0) {
            setToast({ message: 'حجم الصورة يجب أن يكون أقل من 2 ميجابايت', type: 'error' });
            return;
        }

        setNewImages([...newImages, ...files]);

        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewImagePreviews(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeExistingImage = (index: number) => {
        setExistingImages(existingImages.filter((_, i) => i !== index));
    };

    const removeNewImage = (index: number) => {
        setNewImages(newImages.filter((_, i) => i !== index));
        setNewImagePreviews(newImagePreviews.filter((_, i) => i !== index));
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
        if (colorExists && editingColorIndex === null) {
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

    // Update variants when sizes or colors change
    useEffect(() => {
        if (loading) return;

        setVariants(prevVariants => {
            const newVariants: { id?: string; size: string; color: string; stock: number }[] = [];

            // If we have both sizes and colors
            if (selectedSizes.length > 0 && selectedColors.length > 0) {
                selectedSizes.forEach(size => {
                    selectedColors.forEach(color => {
                        const existing = prevVariants.find(v => v.size === size && v.color === color.name);
                        newVariants.push({
                            id: existing?.id,
                            size,
                            color: color.name,
                            stock: existing ? existing.stock : 0
                        });
                    });
                });
            }
            // Only sizes
            else if (selectedSizes.length > 0) {
                selectedSizes.forEach(size => {
                    const existing = prevVariants.find(v => v.size === size && (v.color === '' || v.color === null));
                    newVariants.push({
                        id: existing?.id,
                        size,
                        color: '',
                        stock: existing ? existing.stock : 0
                    });
                });
            }
            // Only colors
            else if (selectedColors.length > 0) {
                selectedColors.forEach(color => {
                    const existing = prevVariants.find(v => (v.size === '' || v.size === null) && v.color === color.name);
                    newVariants.push({
                        id: existing?.id,
                        size: '',
                        color: color.name,
                        stock: existing ? existing.stock : 0
                    });
                });
            } else {
                // No variants
            }
            return newVariants;
        });

    }, [selectedSizes, selectedColors]); // eslint-disable-line react-hooks/exhaustive-deps

    const updateVariantStock = (index: number, value: string) => {
        const newVariants = [...variants];
        newVariants[index].stock = parseInt(value) || 0;
        setVariants(newVariants);

        // Update total stock
        const totalStock = newVariants.reduce((sum, v) => sum + v.stock, 0);
        setFormData(prev => ({ ...prev, stock_quantity: totalStock.toString() }));
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!storeId) {
            setToast({ message: 'حدث خطأ، برجاء المحاولة مرة أخرى', type: 'error' });
            return;
        }

        if (existingImages.length + newImages.length === 0) {
            setToast({ message: 'برجاء إضافة صورة واحدة على الأقل', type: 'error' });
            return;
        }

        // Validate variants
        if (variants.length > 0) {
            const totalVariantStock = variants.reduce((sum, v) => sum + v.stock, 0);
            if (totalVariantStock === 0) {
                setToast({ message: 'برجاء تحديد كمية المخزون للأنواع المختلفة', type: 'error' });
                return;
            }
        }

        setSubmitting(true);

        try {
            // Upload new images
            const newImageUrls: string[] = [];

            for (const image of newImages) {
                const fileName = `${storeId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${image.name.split('.').pop()}`;
                const { error: uploadError } = await supabase.storage
                    .from('products')
                    .upload(fileName, image);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('products')
                    .getPublicUrl(fileName);

                newImageUrls.push(publicUrl);
            }

            // Combine existing and new image URLs
            const allImageUrls = [...existingImages, ...newImageUrls];

            // Update product
            const productData: any = {
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                category: formData.category,
                category_id: formData.category_id || null,
                stock_quantity: parseInt(formData.stock_quantity),
                image_urls: allImageUrls,
                is_active: formData.is_active,
                subcategory_id: formData.subcategory_id || null,
            };

            if (formData.old_price) {
                productData.old_price = parseFloat(formData.old_price);
            } else {
                productData.old_price = null;
            }

            if (selectedSizes.length > 0) {
                productData.sizes = selectedSizes;
            } else {
                productData.sizes = null;
            }

            if (selectedColors.length > 0) {
                productData.colors = selectedColors.map(c => c.name); // Store names as strings
            } else {
                productData.colors = null;
            }

            console.log('Sending product data:', productData);

            const { error: updateError } = await supabase
                .from('products')
                .update(productData)
                .eq('id', productId);

            if (updateError) {
                console.error('Supabase Update Error:', updateError);
                throw updateError;
            }

            // Handle Variants update
            await supabase.from('product_variants').delete().eq('product_id', productId);

            if (variants.length > 0) {
                const variantsData = variants.map(v => ({
                    product_id: productId,
                    size: v.size || null,
                    color: v.color || null,
                    stock_quantity: v.stock
                }));

                const { error: variantsError } = await supabase
                    .from('product_variants')
                    .insert(variantsData);

                if (variantsError) throw variantsError;
            }

            setToast({ message: '✅ تم تحديث المنتج بنجاح!', type: 'success' });

            setTimeout(() => {
                router.push('/merchant/products');
            }, 1500);
        } catch (err: any) {
            console.error('Error updating product:', err);
            setToast({ message: err.message || 'حدث خطأ أثناء تحديث المنتج', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-background-light flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-text-light-secondary">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    const discount = calculateDiscount();
    const totalImages = existingImages.length + newImages.length;

    return (
        <div className="bg-background-light min-h-screen">
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
                            <h1 className="text-xl font-bold text-text-light-primary">
                                ✏️ تعديل المنتج
                            </h1>
                            <p className="text-text-light-secondary text-sm">
                                عدّل بيانات المنتج والمخزون
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <main className="p-4 max-w-3xl mx-auto pb-24">
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* صور المنتج */}
                    <div className="bg-card-light rounded-xl p-5 border border-border-light">
                        <label className="block text-right font-bold text-text-light-primary mb-3">
                            📷 صور المنتج * (صورة واحدة على الأقل)
                        </label>
                        <p className="text-sm text-text-light-secondary mb-4 text-right">
                            حد أقصى 10 صور | حجم الصورة: أقل من 2 ميجابايت
                        </p>

                        <div className="grid grid-cols-3 gap-3 mb-4">
                            {/* Existing images */}
                            {existingImages.map((url, index) => (
                                <div key={`existing-${index}`} className="relative group aspect-square">
                                    <img
                                        src={url}
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
                                        onClick={() => removeExistingImage(index)}
                                        className="absolute top-2 left-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <span className="material-symbols-outlined text-sm">close</span>
                                    </button>
                                </div>
                            ))}

                            {/* New images */}
                            {newImagePreviews.map((preview, index) => (
                                <div key={`new-${index}`} className="relative group aspect-square">
                                    <img
                                        src={preview}
                                        alt={`صورة جديدة ${index + 1}`}
                                        className="w-full h-full object-cover rounded-lg border-2 border-green-500"
                                    />
                                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
                                        جديدة
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeNewImage(index)}
                                        className="absolute top-2 left-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <span className="material-symbols-outlined text-sm">close</span>
                                    </button>
                                </div>
                            ))}

                            {/* Add more */}
                            {totalImages < 10 && (
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

                    {/* اسم المنتج */}
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

                        {/* Store Section Select */}
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
                                                    <td className="px-4 py-2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={variant.stock}
                                                            onChange={(e) => updateVariantStock(index, e.target.value)}
                                                            className="w-24 px-2 py-1 rounded border border-border-light bg-background-light focus:ring-2 focus:ring-primary text-center"
                                                        />
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

                    {/* نشط */}
                    <div className="bg-card-light rounded-xl p-5 border border-border-light">
                        <label className="flex items-center justify-between cursor-pointer">
                            <div className="text-right">
                                <p className="font-bold text-[#0d121b]">المنتج نشط</p>
                                <p className="text-sm text-text-light-secondary">المنتج سيكون متاحاً للعملاء</p>
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
                                    حفظ التعديلات
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Add/Edit Color Modal */}
                {showAddColorModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-card-light rounded-xl p-6 w-full max-w-sm">
                            <h3 className="text-xl font-bold text-text-light-primary mb-4 text-center">
                                {editingColorIndex !== null ? 'تعديل لون' : 'إضافة لون جديد'}
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-right font-medium text-text-light-primary mb-2">
                                        اسم اللون
                                    </label>
                                    <input
                                        type="text"
                                        value={newColorName}
                                        onChange={(e) => setNewColorName(e.target.value)}
                                        placeholder="مثال: أحمر، كحلي فاتح"
                                        className="w-full px-4 py-2 rounded-lg border border-border-light bg-background-light text-text-light-primary text-right focus:ring-2 focus:ring-primary"
                                    />
                                </div>

                                <div>
                                    <label className="block text-right font-medium text-text-light-primary mb-2">
                                        اختر اللون
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={newColorHex}
                                            onChange={(e) => setNewColorHex(e.target.value)}
                                            className="w-12 h-12 rounded-lg cursor-pointer border border-border-light p-1"
                                        />
                                        <div className="flex-1 text-left text-sm text-text-light-secondary uppercase">
                                            {newColorHex}
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Colors Selection */}
                                <div>
                                    <p className="text-xs text-text-light-secondary mb-2 text-right">ألوان جاهزة:</p>
                                    <div className="flex flex-wrap gap-2 justify-end">
                                        {AVAILABLE_COLORS.map(c => (
                                            <button
                                                key={c.hex}
                                                type="button"
                                                onClick={() => {
                                                    setNewColorName(c.name);
                                                    setNewColorHex(c.hex);
                                                }}
                                                className="w-6 h-6 rounded-full border border-border-light"
                                                style={{ backgroundColor: c.hex }}
                                                title={c.name}
                                            ></button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddColorModal(false)}
                                        className="flex-1 px-4 py-2 bg-surface-light text-text-light-primary rounded-lg font-bold"
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        type="button"
                                        onClick={addNewColor}
                                        className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-bold"
                                    >
                                        {editingColorIndex !== null ? 'حفظ التعديل' : 'إضافة'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
