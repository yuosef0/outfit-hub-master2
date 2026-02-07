'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface Category {
    id: string;
    name: string;
    name_ar: string | null;
    description: string | null;
    image_url: string | null;
    icon: string | null;
    display_order: number;
    is_active: boolean;
}

export default function AdminCategoriesPage() {
    const { t } = useLanguage();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [isEditing, setIsEditing] = useState(false);
    const [currentCategory, setCurrentCategory] = useState<Partial<Category>>({});
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [iconFile, setIconFile] = useState<File | null>(null);

    const supabase = useMemo(
        () => createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        ),
        []
    );

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;
            setCategories(data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, [supabase]);

    const handleFileUpload = async (file: File, bucket: string = 'categories') => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            let imageUrl = currentCategory.image_url;
            let iconUrl = currentCategory.icon;

            if (imageFile) {
                imageUrl = await handleFileUpload(imageFile);
            }

            if (iconFile) {
                iconUrl = await handleFileUpload(iconFile);
            }

            const categoryData = {
                name: currentCategory.name,
                name_ar: currentCategory.name_ar || null,
                description: currentCategory.description || null,
                icon: iconUrl || null,
                display_order: currentCategory.display_order || 0,
                is_active: currentCategory.is_active !== undefined ? currentCategory.is_active : true,
                image_url: imageUrl,
            };

            if (currentCategory.id) {
                // Update
                const { error } = await supabase
                    .from('categories')
                    .update(categoryData)
                    .eq('id', currentCategory.id);
                if (error) throw error;
            } else {
                // Insert
                const { error } = await supabase
                    .from('categories')
                    .insert([categoryData]);
                if (error) throw error;
            }

            setIsEditing(false);
            setCurrentCategory({});
            setImageFile(null);
            setIconFile(null);
            fetchCategories();
        } catch (error) {
            console.error('Error saving category:', error);
            alert('Error saving category');
        } finally {
            setSubmitting(false);
        }
    };
    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this category?')) return;

        try {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
            alert('Error deleting category');
        }
    };

    const toggleActive = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('categories')
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            fetchCategories();
        } catch (error) {
            console.error('Error toggling status:', error);
        }
    };

    return (
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-text-light-primary">Category Management</h1>
                <button
                    onClick={() => {
                        setCurrentCategory({ display_order: categories.length + 1, is_active: true });
                        setIsEditing(true);
                    }}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors"
                >
                    <span className="material-symbols-outlined">add</span>
                    Add Category
                </button>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="bg-card-light rounded-xl overflow-hidden border border-border-light shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-background-light border-b border-border-light">
                                <tr>
                                    <th className="px-6 py-4 text-sm font-semibold text-text-light-primary">Order</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-text-light-primary">Image</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-text-light-primary">Name (EN)</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-text-light-primary">Name (AR)</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-text-light-primary">Status</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-text-light-primary text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light">
                                {categories.map((category) => (
                                    <tr key={category.id} className="hover:bg-background-light/50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-text-light-secondary">{category.display_order}</td>
                                        <td className="px-6 py-4">
                                            {category.image_url ? (
                                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                                                    <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-gray-400">image</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-text-light-primary">{category.name}</td>
                                        <td className="px-6 py-4 text-sm text-text-light-secondary font-arabic">{category.name_ar || '-'}</td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => toggleActive(category.id, category.is_active)}
                                                className={`px-2 py-1 rounded text-xs font-bold ${category.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                                            >
                                                {category.is_active ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setCurrentCategory(category);
                                                        setIsEditing(true);
                                                    }}
                                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(category.id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {categories.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-text-light-secondary">
                                            No categories found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-background-light rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-border-light flex justify-between items-center sticky top-0 bg-background-light z-10">
                            <h2 className="text-lg font-bold text-text-light-primary">
                                {currentCategory.id ? 'Edit Category' : 'Add New Category'}
                            </h2>
                            <button onClick={() => setIsEditing(false)} className="text-text-light-secondary hover:text-text-light-primary">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-text-light-primary mb-1">Image</label>
                                <div className="flex items-center gap-4">
                                    {(imageFile || currentCategory.image_url) && (
                                        <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                                            <img
                                                src={imageFile ? URL.createObjectURL(imageFile) : currentCategory.image_url!}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                        className="block w-full text-sm text-text-light-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                    />
                                </div>
                            </div>

                            {/* Names */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-light-primary mb-1">Name (EN) *</label>
                                    <input
                                        type="text"
                                        required
                                        value={currentCategory.name || ''}
                                        onChange={(e) => setCurrentCategory({ ...currentCategory, name: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg bg-card-light border border-border-light focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-light-primary"
                                        placeholder="e.g. Men's Clothing"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-light-primary mb-1">Name (AR)</label>
                                    <input
                                        type="text"
                                        value={currentCategory.name_ar || ''}
                                        onChange={(e) => setCurrentCategory({ ...currentCategory, name_ar: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg bg-card-light border border-border-light focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-light-primary font-arabic text-right"
                                        placeholder="مثال: ملابس رجالي"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-text-light-primary mb-1">Description</label>
                                <textarea
                                    value={currentCategory.description || ''}
                                    onChange={(e) => setCurrentCategory({ ...currentCategory, description: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-card-light border border-border-light focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-light-primary"
                                    rows={2}
                                />
                            </div>

                            {/* Icon & Order */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-light-primary mb-1">Icon (Upload)</label>
                                        <div className="flex items-center gap-4">
                                            {(iconFile || currentCategory.icon) && (
                                                <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                                                    <img
                                                        src={iconFile ? URL.createObjectURL(iconFile) : currentCategory.icon!}
                                                        alt="Icon Preview"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setIconFile(e.target.files?.[0] || null)}
                                                className="block w-full text-sm text-text-light-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-light-primary mb-1">Order</label>
                                    <input
                                        type="number"
                                        value={currentCategory.display_order || 0}
                                        onChange={(e) => setCurrentCategory({ ...currentCategory, display_order: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 rounded-lg bg-card-light border border-border-light focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-light-primary"
                                    />
                                </div>
                            </div>

                            {/* Active Checkbox */}
                            <div className="flex items-center pt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={currentCategory.is_active !== false}
                                        onChange={(e) => setCurrentCategory({ ...currentCategory, is_active: e.target.checked })}
                                        className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                                    />
                                    <span className="text-sm font-medium text-text-light-primary">Active</span>
                                </label>
                            </div>


                            <div className="pt-4 flex justify-end gap-3 border-t border-border-light mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-text-light-secondary hover:bg-card-light transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2 rounded-lg text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : 'Save Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
