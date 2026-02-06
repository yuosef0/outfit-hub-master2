'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { Category } from '@/lib/types';

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { language, t } = useLanguage();

    const supabase = useMemo(
        () =>
            createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            ),
        []
    );

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data, error } = await supabase
                    .from('categories')
                    .select('*')
                    .eq('is_active', true)
                    .order('display_order', { ascending: true });

                if (error) throw error;
                if (data) {
                    setCategories(data);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCategories();
    }, [supabase]);

    // Helper to get category name based on language
    const getCategoryName = (category: Category) => {
        if (language === 'ar' && category.name_ar) {
            return category.name_ar;
        }
        return category.name;
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
        <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden pb-20 bg-background-light text-text-light-primary antialiased selection:bg-accent-green/30">
            {/* Categories Grid */}
            <main className="flex-1 p-4">
                <h1 className="text-2xl font-bold text-text-light-primary mb-4 px-1">{t('categories.title')}</h1>

                {categories.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-text-light-secondary">{t('common.noResults')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 pb-4">
                        {categories.map((category) => (
                            <Link
                                key={category.id}
                                href={`/categories/${category.name.toLowerCase()}`}
                                className="group relative flex flex-col gap-3 rounded-2xl bg-card-light p-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-border-light transition-all active:scale-95 duration-200"
                            >
                                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-background-light ">
                                    {category.image_url ? (
                                        <img
                                            alt={`${getCategoryName(category)} category`}
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            src={category.image_url}
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center">
                                            <span className="material-symbols-outlined text-6xl text-text-light-secondary">category</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                                <div className="flex flex-col px-1 pb-1">
                                    <h3 className="text-base font-semibold text-text-light-primary leading-tight">
                                        {getCategoryName(category)}
                                    </h3>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
