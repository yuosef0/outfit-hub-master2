'use client';

import React, { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    storeId: string;
    storeName: string;
    orderId: string;
    onSuccess: () => void;
}

export default function ReviewModal({
    isOpen,
    onClose,
    storeId,
    storeName,
    orderId,
    onSuccess
}: ReviewModalProps) {
    const { t } = useLanguage();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('store_reviews')
                .insert({
                    store_id: storeId,
                    customer_id: user.id,
                    order_id: orderId,
                    rating: rating,
                    comment: comment.trim() || null,
                });

            if (error) throw error;
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error submitting review:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-card-light rounded-2xl border border-border-light p-6 w-full max-w-md shadow-xl animate-scale-up">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-text-light-primary">{t('reviews.rateStore')}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-surface-light rounded-full transition-colors">
                        <span className="material-symbols-outlined text-text-light-secondary">close</span>
                    </button>
                </div>

                <p className="text-sm text-text-light-secondary mb-4">{storeName}</p>

                {/* Star Rating */}
                <div className="mb-4">
                    <p className="text-sm font-medium text-text-light-primary mb-2">{t('reviews.yourRating')}</p>
                    <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className="transition-transform hover:scale-110 focus:outline-none"
                            >
                                <span className={`material-symbols-outlined text-[32px] ${star <= rating ? 'text-amber-500 filled fill' : 'text-border-light'}`}>
                                    star
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Comment */}
                <div className="mb-5">
                    <p className="text-sm font-medium text-text-light-primary mb-2">{t('reviews.yourComment')}</p>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-border-light bg-background-light text-text-light-primary text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                        placeholder={t('reviews.writeReview')}
                    />
                </div>

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    {t('reviews.submit')}
                </button>
            </div>
        </div>
    );
}
