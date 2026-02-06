'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Toast from '@/components/Toast';
import { StoreReview } from '@/lib/types';

type FilterType = 'all' | 'no_reply' | '5' | '4' | '3' | '2' | '1';

const FILTERS = [
    { value: 'all' as FilterType, label: 'الكل' },
    { value: 'no_reply' as FilterType, label: 'بدون رد' },
    { value: '5' as FilterType, label: '⭐ 5' },
    { value: '4' as FilterType, label: '⭐ 4' },
    { value: '3' as FilterType, label: '⭐ 3' },
    { value: '2' as FilterType, label: '⭐ 2' },
    { value: '1' as FilterType, label: '⭐ 1' },
];

export default function ReviewsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [storeId, setStoreId] = useState<string | null>(null);
    const [reviews, setReviews] = useState<StoreReview[]>([]);
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [selectedReview, setSelectedReview] = useState<StoreReview | null>(null);
    const [replyText, setReplyText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        checkStoreAndFetchReviews();
    }, []);

    const checkStoreAndFetchReviews = async () => {
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
            await fetchReviews(store.id);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchReviews = async (storeId: string) => {
        const { data, error } = await supabase
            .from('store_reviews')
            .select('*')
            .eq('store_id', storeId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching reviews:', error);
            return;
        }

        setReviews(data || []);
    };

    const getFilteredReviews = () => {
        let filtered = reviews;

        if (activeFilter === 'no_reply') {
            filtered = reviews.filter(r => !r.merchant_reply);
        } else if (activeFilter !== 'all') {
            const rating = parseInt(activeFilter);
            filtered = reviews.filter(r => r.rating === rating);
        }

        return filtered;
    };

    const handleReply = async () => {
        if (!selectedReview || !replyText.trim()) {
            setToast({ message: 'برجاء كتابة رد', type: 'error' });
            return;
        }

        setSubmitting(true);

        try {
            const { error } = await supabase
                .from('store_reviews')
                .update({
                    merchant_reply: replyText.trim(),
                    replied_at: new Date().toISOString(),
                })
                .eq('id', selectedReview.id);

            if (error) throw error;

            setToast({ message: 'تم إرسال الرد بنجاح ✅', type: 'success' });

            // Update local state
            setReviews(reviews.map(r =>
                r.id === selectedReview.id
                    ? { ...r, merchant_reply: replyText.trim(), replied_at: new Date().toISOString() }
                    : r
            ));

            setSelectedReview(null);
            setReplyText('');
        } catch (err: any) {
            console.error('Error replying to review:', err);
            setToast({ message: 'حدث خطأ أثناء إرسال الرد', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const getRatingStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            <span
                key={i}
                className={`material-symbols-outlined text-base ${i < rating ? 'text-yellow-500' : 'text-text-light-secondary'
                    }`}
            >
                star
            </span>
        ));
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / 86400000);

        if (days === 0) return 'اليوم';
        if (days === 1) return 'أمس';
        if (days < 7) return `منذ ${days} ${days === 2 ? 'يومين' : 'أيام'}`;
        return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const avgRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : '0.0';

    if (loading) {
        return (
            <div className="bg-background-light min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-text-light-secondary">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    const filteredReviews = getFilteredReviews();

    return (
        <div className="bg-background-light pb-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <div className="bg-card-light border-b border-border-light sticky top-0 z-10">
                <div className="px-4 py-4">
                    <h1 className="text-2xl font-bold text-text-light-primary ">
                        ⭐ التقييمات
                    </h1>
                    <p className="text-text-light-secondary text-sm mt-0.5">
                        المتوسط: {avgRating} ({reviews.length} تقييم)
                    </p>
                </div>

                {/* Filters */}
                <div className="px-4 pb-2 overflow-x-auto">
                    <div className="flex gap-2 min-w-max">
                        {FILTERS.map((filter) => (
                            <button
                                key={filter.value}
                                onClick={() => setActiveFilter(filter.value)}
                                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeFilter === filter.value
                                    ? 'bg-primary text-white'
                                    : 'bg-card-light text-text-light-secondary hover:bg-surface-light'
                                    }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <main className="p-4 max-w-5xl mx-auto">
                {/* Average Rating Card */}
                {reviews.length > 0 && (
                    <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-5 text-white mb-5">
                        <div className="flex items-center gap-5">
                            <div className="text-center">
                                <p className="text-5xl font-bold mb-2">{avgRating}</p>
                                <div className="flex gap-0.5">
                                    {getRatingStars(Math.round(parseFloat(avgRating)))}
                                </div>
                            </div>
                            <div className="flex-1">
                                <p className="text-white/90 text-lg font-bold mb-1">متوسط التقييم</p>
                                <p className="text-white/80">بناءً على {reviews.length} تقييم من العملاء</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Reviews List */}
                {filteredReviews.length > 0 ? (
                    <div className="space-y-4">
                        {filteredReviews.map((review) => (
                            <div
                                key={review.id}
                                className="bg-card-light rounded-xl p-5 border border-border-light"
                            >
                                {/* Review Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        {review.customer?.avatar_url ? (
                                            <img
                                                src={review.customer.avatar_url}
                                                alt={review.customer?.full_name || 'عميل'}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 bg-surface-light rounded-full flex items-center justify-center">
                                                <span className="material-symbols-outlined text-text-light-secondary">
                                                    person
                                                </span>
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-bold text-text-light-primary ">
                                                {review.customer?.full_name || 'عميل'}
                                            </p>
                                            <p className="text-xs text-text-light-secondary">
                                                {formatDate(review.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-0.5">
                                        {getRatingStars(review.rating)}
                                    </div>
                                </div>

                                {/* Review Content */}
                                {review.comment && (
                                    <p className="text-text-light-primary mb-3 text-right">
                                        "{review.comment}"
                                    </p>
                                )}

                                {/* Related Products */}
                                {review.orders?.items && review.orders.items.length > 0 && (
                                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                                        {review.orders.items.map((item: any, index: number) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-card-light rounded-lg text-xs"
                                            >
                                                <span className="material-symbols-outlined text-sm text-primary">
                                                    inventory_2
                                                </span>
                                                <span className="text-text-light-primary">
                                                    {item.product_name}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Merchant Reply */}
                                {review.merchant_reply ? (
                                    <div className="bg-blue-900/20 rounded-lg p-4 border-r-4 border-primary">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="material-symbols-outlined text-primary text-sm">reply</span>
                                            <p className="text-sm font-bold text-primary">ردك:</p>
                                        </div>
                                        <p className="text-text-light-primary text-sm text-right">
                                            "{review.merchant_reply}"
                                        </p>
                                        {review.replied_at && (
                                            <p className="text-xs text-text-light-secondary mt-2 text-right">
                                                {formatDate(review.replied_at)}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setSelectedReview(review);
                                            setReplyText('');
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-bold text-sm"
                                    >
                                        <span className="material-symbols-outlined text-base">reply</span>
                                        اكتب رد
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-card-light rounded-xl p-12 border border-border-light text-center">
                        <div className="w-24 h-24 bg-card-light rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-5xl text-text-light-secondary">
                                star
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-text-light-primary mb-2">
                            {activeFilter === 'all' ? 'لا توجد تقييمات بعد' : 'لا توجد نتائج'}
                        </h3>
                        <p className="text-text-light-secondary">
                            {activeFilter === 'all'
                                ? 'سيظهر هنا تقييمات العملاء لمتجرك'
                                : 'جرب تغيير الفلتر'}
                        </p>
                    </div>
                )}
            </main>

            {/* Reply Modal */}
            {selectedReview && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                    onClick={() => setSelectedReview(null)}
                >
                    <div
                        className="bg-card-light rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-text-light-primary ">
                                💬 الرد على التقييم
                            </h2>
                            <button
                                onClick={() => setSelectedReview(null)}
                                className="p-2 hover:bg-card-light rounded-lg transition-colors"
                            >
                                <span className="material-symbols-outlined text-text-light-secondary">
                                    close
                                </span>
                            </button>
                        </div>

                        {/* Original Review */}
                        <div className="bg-card-light rounded-lg p-4 mb-5">
                            <div className="flex items-center gap-3 mb-3">
                                {selectedReview.customer?.avatar_url ? (
                                    <img
                                        src={selectedReview.customer.avatar_url}
                                        alt={selectedReview.customer.full_name || 'عميل'}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-10 h-10 bg-surface-light rounded-full flex items-center justify-center">
                                        <span className="material-symbols-outlined text-text-light-secondary">
                                            person
                                        </span>
                                    </div>
                                )}
                                <div className="flex-1">
                                    <p className="font-bold text-text-light-primary ">
                                        {selectedReview.customer?.full_name || 'عميل'}
                                    </p>
                                    <div className="flex gap-0.5 mt-1">
                                        {getRatingStars(selectedReview.rating)}
                                    </div>
                                </div>
                            </div>
                            {selectedReview.comment && (
                                <p className="text-text-light-primary text-sm text-right">
                                    "{selectedReview.comment}"
                                </p>
                            )}
                        </div>

                        {/* Reply Input */}
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-text-light-primary mb-2 text-right">
                                ردك:
                            </label>
                            <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                rows={5}
                                placeholder="مثال: شكراً على تقييمك! ده يشرفنا ونتمنى نشوفك تاني..."
                                className="w-full px-4 py-3 rounded-lg border border-border-light bg-card-light text-text-light-primary text-right focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                            />
                            <p className="text-xs text-text-light-secondary mt-2 text-right">
                                نصيحة: كن مهذباً ومحترفاً في الرد، حتى لو كان التقييم سلبياً
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setSelectedReview(null)}
                                className="flex-1 px-4 py-3 bg-surface-light hover:bg-surface-light text-text-light-primary rounded-lg transition-colors font-bold"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handleReply}
                                disabled={submitting || !replyText.trim()}
                                className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        جاري الإرسال...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-base">send</span>
                                        إرسال الرد
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
