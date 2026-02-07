'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useLanguage } from '@/lib/i18n/LanguageContext';


interface SliderImage {
    id: string;
    image_url: string;
    title: string | null;
    description: string | null;
    link_url: string | null;
    display_order: number;
    is_active: boolean;
}

export default function AdminSliderPage() {
    const { t } = useLanguage();
    const [slides, setSlides] = useState<SliderImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Form State
    const [isEditing, setIsEditing] = useState(false);
    const [currentSlide, setCurrentSlide] = useState<Partial<SliderImage>>({});
    const [imageFile, setImageFile] = useState<File | null>(null);

    const supabase = useMemo(
        () => createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        ),
        []
    );

    const fetchSlides = async () => {
        try {
            const { data, error } = await supabase
                .from('slider_images')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;
            setSlides(data || []);
        } catch (error) {
            console.error('Error fetching slides:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSlides();
    }, [supabase]);

    const handleImageUpload = async (file: File) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('slider_images')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('slider_images')
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);

        try {
            let imageUrl = currentSlide.image_url;

            if (imageFile) {
                imageUrl = await handleImageUpload(imageFile);
            }

            if (!imageUrl) {
                alert('Please select an image');
                setUploading(false);
                return;
            }

            const slideData = {
                title: currentSlide.title || null,
                description: currentSlide.description || null,
                link_url: currentSlide.link_url || null,
                display_order: currentSlide.display_order || 0,
                is_active: currentSlide.is_active !== undefined ? currentSlide.is_active : true,
                image_url: imageUrl,
            };

            if (currentSlide.id) {
                // Update
                const { error } = await supabase
                    .from('slider_images')
                    .update(slideData)
                    .eq('id', currentSlide.id);
                if (error) throw error;
            } else {
                // Insert
                const { error } = await supabase
                    .from('slider_images')
                    .insert([slideData]);
                if (error) throw error;
            }

            setIsEditing(false);
            setCurrentSlide({});
            setImageFile(null);
            fetchSlides();
        } catch (error) {
            console.error('Error saving slide:', error);
            alert('Error saving slide');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this slide?')) return;

        try {
            const { error } = await supabase
                .from('slider_images')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchSlides();
        } catch (error) {
            console.error('Error deleting slide:', error);
        }
    };

    const toggleActive = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('slider_images')
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            fetchSlides();
        } catch (error) {
            console.error('Error toggling status:', error);
        }
    };

    return (
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-text-light-primary">Manage Slider (Homepage)</h1>
                <button
                    onClick={() => {
                        setCurrentSlide({ display_order: slides.length + 1, is_active: true });
                        setIsEditing(true);
                    }}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors"
                >
                    <span className="material-symbols-outlined">add</span>
                    Add Slide
                </button>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {slides.map((slide) => (
                        <div key={slide.id} className="bg-card-light rounded-xl overflow-hidden border border-border-light shadow-sm group">
                            <div className="relative aspect-video bg-gray-100">
                                <img src={slide.image_url} alt={slide.title || 'Slide'} className="w-full h-full object-cover" />
                                <div className="absolute top-2 right-2 flex gap-1">
                                    <button
                                        onClick={() => toggleActive(slide.id, slide.is_active)}
                                        className={`px-2 py-1 rounded text-xs font-bold ${slide.is_active ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}
                                    >
                                        {slide.is_active ? 'Active' : 'Inactive'}
                                    </button>
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-text-light-primary mb-1">{slide.title || 'No Title'}</h3>
                                <p className="text-sm text-text-light-secondary mb-3 line-clamp-2">{slide.description || '-'}</p>
                                <div className="flex items-center justify-between mt-auto">
                                    <span className="text-xs text-text-light-secondary bg-background-light px-2 py-1 rounded border border-border-light">
                                        Order: {slide.display_order}
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setCurrentSlide(slide);
                                                setIsEditing(true);
                                            }}
                                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">edit</span>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(slide.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-background-light rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="px-6 py-4 border-b border-border-light flex justify-between items-center">
                            <h2 className="text-lg font-bold text-text-light-primary">
                                {currentSlide.id ? 'Edit Slide' : 'Add New Slide'}
                            </h2>
                            <button onClick={() => setIsEditing(false)} className="text-text-light-secondary hover:text-text-light-primary">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-text-light-primary mb-1">Image *</label>
                                <div className="flex items-center gap-4">
                                    {(imageFile || currentSlide.image_url) && (
                                        <div className="w-20 h-12 rounded bg-gray-100 overflow-hidden shrink-0">
                                            <img
                                                src={imageFile ? URL.createObjectURL(imageFile) : currentSlide.image_url}
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
                                        required={!currentSlide.id}
                                    />
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-text-light-primary mb-1">Title</label>
                                <input
                                    type="text"
                                    value={currentSlide.title || ''}
                                    onChange={(e) => setCurrentSlide({ ...currentSlide, title: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-card-light border border-border-light focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-light-primary"
                                    placeholder="Promotional Title"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-text-light-primary mb-1">Description</label>
                                <textarea
                                    value={currentSlide.description || ''}
                                    onChange={(e) => setCurrentSlide({ ...currentSlide, description: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-card-light border border-border-light focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-light-primary"
                                    rows={2}
                                    placeholder="Brief subtitle or description"
                                />
                            </div>

                            {/* Display Order */}
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-text-light-primary mb-1">Order</label>
                                    <input
                                        type="number"
                                        value={currentSlide.display_order || 0}
                                        onChange={(e) => setCurrentSlide({ ...currentSlide, display_order: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 rounded-lg bg-card-light border border-border-light focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-light-primary"
                                    />
                                </div>
                                <div className="flex items-center pt-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={currentSlide.is_active !== false}
                                            onChange={(e) => setCurrentSlide({ ...currentSlide, is_active: e.target.checked })}
                                            className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                                        />
                                        <span className="text-sm font-medium text-text-light-primary">Active</span>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-text-light-secondary hover:bg-card-light transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="px-6 py-2 rounded-lg text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                    {uploading ? 'Saving...' : 'Save Slide'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
