'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { StoreReview } from '@/lib/types';
import Link from 'next/link';

export default function MyReviewsPage() {
    const router = useRouter();
    const { t, language } = useLanguage();
    const [reviews, setReviews] = useState<(StoreReview & { stores: { name: string; logo_url: string | null } })[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const supabase = useMemo(
        () =>
            createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            ),
        []
    );

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push('/login');
                    return;
                }

                const { data, error } = await supabase
                    .from('store_reviews')
                    .select(`
                        *,
                        stores (
                            name,
                            logo_url
                        )
                    `)
                    .eq('customer_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                // @ts-ignore - Supabase types might not perfectly match the join result structure without exact casting
                setReviews(data || []);
            } catch (error) {
                console.error('Error fetching reviews:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReviews();
    }, [supabase, router]);

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
        <div className="min-h-screen bg-background-light pb-24">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-background-light/95 backdrop-blur-md border-b border-border-light">
                <div className="flex items-center px-4 py-3">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-card-light transition-colors"
                    >
                        <span className="material-symbols-outlined text-text-light-primary">arrow_back</span>
                    </button>
                    <h1 className="text-lg font-bold text-text-light-primary flex-1 text-center pr-10">
                        {t('profile.myReviews')}
                    </h1>
                </div>
            </div>

            {/* Content */}
            <main className="p-4 space-y-4">
                {reviews.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <span className="material-symbols-outlined text-6xl text-border-light mb-4">rate_review</span>
                        <h2 className="text-xl font-bold text-text-light-primary mb-2">
                            {t('reviews.noReviews')}
                        </h2>
                        <p className="text-text-light-secondary mb-6">
                            {t('reviews.noReviewsDesc')}
                        </p>
                        <Link
                            href="/orders"
                            className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                        >
                            {t('orders.title')}
                        </Link>
                    </div>
                ) : (
                    reviews.map((review) => (
                        <div key={review.id} className="bg-card-light rounded-xl p-4 border border-border-light shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-surface-light border border-border-light overflow-hidden flex-shrink-0">
                                    {review.stores?.logo_url ? (
                                        <img src={review.stores.logo_url} alt={review.stores.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="material-symbols-outlined text-text-light-secondary text-sm">store</span>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-text-light-primary text-sm">{review.stores?.name}</h3>
                                    <p className="text-xs text-text-light-secondary">
                                        {new Date(review.created_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 mb-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                        key={star}
                                        className={`material-symbols-outlined text-[18px] ${star <= review.rating ? 'text-amber-500 filled fill' : 'text-border-light'}`}
                                    >
                                        star
                                    </span>
                                ))}
                            </div>

                            {review.comment && (
                                <p className="text-sm text-text-light-secondary leading-relaxed bg-surface-light p-3 rounded-lg">
                                    {review.comment}
                                </p>
                            )}

                            {review.merchant_reply && (
                                <div className="mt-3 pl-3 border-l-2 border-primary">
                                    <p className="text-xs font-bold text-primary mb-1">{t('reviews.merchantReply')}</p>
                                    <p className="text-xs text-text-light-secondary">{review.merchant_reply}</p>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </main>
        </div>
    );
}
