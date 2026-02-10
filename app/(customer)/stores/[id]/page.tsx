'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import type { Store, Product, StoreReview } from '@/lib/types';
import WishlistButton from '@/components/WishlistButton';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface StoreCategory {
    id: string;
    name: string;
    name_ar: string | null;
    display_order: number;
}

export default function StoreProfilePage() {
    const router = useRouter();
    const params = useParams();
    const storeId = params.id as string;
    const { t, language } = useLanguage();

    const [activeTab, setActiveTab] = useState('Products');
    const [store, setStore] = useState<Store | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<StoreCategory[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [followLoading, setFollowLoading] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [reviews, setReviews] = useState<StoreReview[]>([]);
    const [avgRating, setAvgRating] = useState<number>(0);
    const [reviewsCount, setReviewsCount] = useState<number>(0);

    const supabase = useMemo(
        () =>
            createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            ),
        []
    );

    // Fetch store data
    useEffect(() => {
        const fetchStore = async () => {
            try {
                const { data, error } = await supabase
                    .from('stores')
                    .select('*')
                    .eq('id', storeId)
                    .maybeSingle();

                if (error) throw error;
                if (!data || !data.is_active || data.is_visible === false) {
                    setStore(null);
                    return;
                }
                setStore(data);
            } catch (error: any) {
                console.error('Error fetching store:', error.message || error);
            }
        };

        if (storeId) {
            fetchStore();
        }
    }, [storeId, supabase]);

    // Check if user is following this store and get followers count
    useEffect(() => {
        const checkFollowStatus = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setCurrentUserId(user.id);
                    const { data: followData } = await supabase
                        .from('store_follows')
                        .select('id')
                        .eq('user_id', user.id)
                        .eq('store_id', storeId)
                        .maybeSingle();
                    setIsFollowing(!!followData);
                }

                const { count } = await supabase
                    .from('store_follows')
                    .select('*', { count: 'exact', head: true })
                    .eq('store_id', storeId);
                setFollowersCount(count || 0);
            } catch (error) {
                console.error('Error checking follow status:', error);
            }
        };

        if (storeId) {
            checkFollowStatus();
        }
    }, [storeId, supabase]);

    // Fetch categories for this store
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data, error } = await supabase
                    .from('store_categories')
                    .select('id, name, name_ar, display_order')
                    .eq('store_id', storeId)
                    .eq('is_active', true)
                    .order('display_order', { ascending: true });

                if (!error) {
                    setCategories(data || []);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        if (storeId) {
            fetchCategories();
        }
    }, [storeId, supabase]);

    // Fetch reviews for this store
    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const { data, error } = await supabase
                    .from('store_reviews')
                    .select('*')
                    .eq('store_id', storeId)
                    .order('created_at', { ascending: false });

                if (!error && data) {
                    // Fetch customer info separately (no FK on customer_id)
                    const customerIds = [...new Set(data.map(r => r.customer_id))];
                    let customerMap: Record<string, { id: string; full_name?: string; avatar_url?: string }> = {};
                    if (customerIds.length > 0) {
                        const { data: customers } = await supabase
                            .from('users')
                            .select('id, full_name, avatar_url')
                            .in('id', customerIds);
                        if (customers) {
                            customers.forEach(c => { customerMap[c.id] = c; });
                        }
                    }

                    const reviewsWithCustomer = data.map(r => ({
                        ...r,
                        customer: customerMap[r.customer_id] || null,
                    }));

                    setReviews(reviewsWithCustomer);
                    setReviewsCount(data.length);
                    if (data.length > 0) {
                        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
                        setAvgRating(Math.round(avg * 10) / 10);
                    }
                }
            } catch (error) {
                console.error('Error fetching reviews:', error);
            }
        };

        if (storeId) {
            fetchReviews();
        }
    }, [storeId, supabase]);

    // Fetch products for this store
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('store_id', storeId)
                    .eq('is_active', true)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                setProducts(data || []);
                setFilteredProducts(data || []);
            } catch (error) {
                console.error('Error fetching products:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (storeId) {
            fetchProducts();
        } else {
            setIsLoading(false);
        }
    }, [storeId, supabase]);

    const handleFollow = async () => {
        if (!currentUserId) {
            router.push('/login?redirect=/stores/' + storeId);
            return;
        }

        setFollowLoading(true);
        try {
            if (isFollowing) {
                await supabase
                    .from('store_follows')
                    .delete()
                    .eq('user_id', currentUserId)
                    .eq('store_id', storeId);
                setIsFollowing(false);
                setFollowersCount(prev => Math.max(0, prev - 1));
            } else {
                await supabase
                    .from('store_follows')
                    .insert({ user_id: currentUserId, store_id: storeId });
                setIsFollowing(true);
                setFollowersCount(prev => prev + 1);
            }
        } catch (error) {
            console.error('Error toggling follow:', error);
        } finally {
            setFollowLoading(false);
        }
    };

    // Filter products
    useEffect(() => {
        let filtered = [...products];

        if (activeCategory) {
            // Find the category object
            const selectedCategory = categories.find(c => c.id === activeCategory);
            if (selectedCategory) {
                // Filter by name (primary) OR id (fallback) OR arabic name (fallback)
                // This ensures compatibility regardless of how the category is stored in the product
                filtered = filtered.filter(product =>
                    product.category === selectedCategory.name ||
                    product.category === selectedCategory.id ||
                    (selectedCategory.name_ar && product.category === selectedCategory.name_ar)
                );
            }
        }

        if (searchQuery) {
            filtered = filtered.filter(product =>
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredProducts(filtered);
    }, [searchQuery, activeCategory, products]);

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

    if (!store) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background-light">
                <div className="text-center">
                    <span className="material-symbols-outlined text-6xl text-border-light mb-4">store</span>
                    <p className="text-text-light-secondary">{t('store.storeNotFound')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto bg-background-light shadow-xl overflow-hidden transition-colors duration-200 pb-20">


            {/* Store Header Area */}
            <div className="flex flex-col w-full relative">
                {/* Cover Image */}
                <div className="w-full h-40 bg-surface-light relative overflow-hidden">
                    {store.banner_url ? (
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url('${store.banner_url}')` }}
                        ></div>
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5"></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                </div>

                {/* Profile Info & Logo */}
                <div className="px-4 relative pb-4">
                    <div className="flex justify-between items-end -mt-10 mb-3">
                        {/* Logo */}
                        <div className="relative">
                            <div className="h-24 w-24 rounded-full border-[4px] border-background-light bg-card-light overflow-hidden shadow-sm">
                                {store.logo_url ? (
                                    <img alt="Store Logo" className="w-full h-full object-cover" src={store.logo_url} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-card-light">
                                        <span className="material-symbols-outlined text-4xl text-text-light-secondary">store</span>
                                    </div>
                                )}
                            </div>
                            {/* Verified Badge */}
                            <div className="absolute bottom-1 right-1 bg-primary text-white rounded-full p-0.5 border-2 border-background-light flex items-center justify-center" title={t('store.verifiedMerchant')}>
                                <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                            </div>
                        </div>
                        {/* Follow Button */}
                        <button
                            onClick={handleFollow}
                            disabled={followLoading}
                            className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-semibold shadow-sm transition-all active:scale-95 h-10 mb-2 ${isFollowing
                                ? 'bg-card-light border border-border-light text-text-light-primary hover:bg-red-50 hover:text-red-500 hover:border-red-200'
                                : 'bg-primary hover:bg-primary/90 text-white'
                                }`}
                        >
                            {followLoading ? (
                                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                            ) : isFollowing ? (
                                <>
                                    <span className="material-symbols-outlined text-[18px]">check</span>
                                    <span>{t('store.following')}</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                    <span>{t('store.follow')}</span>
                                </>
                            )}
                        </button>
                    </div>
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold text-text-light-primary">{store.name}</h1>
                        <div className="flex items-center gap-2 text-sm">
                            {store.category && (
                                <span className="px-2 py-0.5 rounded-md bg-card-light text-text-light-secondary font-medium text-xs border border-border-light">{store.category}</span>
                            )}
                            <div className="flex items-center gap-1 text-amber-500">
                                <span className="material-symbols-outlined text-[16px] fill-current">star</span>
                                <span className="font-bold text-text-light-primary">{avgRating > 0 ? avgRating : '-'}</span>
                                <span className="text-text-light-secondary font-normal">({reviewsCount} {t('store.reviews')})</span>
                            </div>
                            <div className="flex items-center gap-1 text-primary">
                                <span className="material-symbols-outlined text-[16px]">group</span>
                                <span className="font-bold text-text-light-primary">{followersCount}</span>
                                <span className="text-text-light-secondary font-normal">{t('store.followers')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Bar (Actions) */}
            <div className="px-4 py-2">
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                    <style jsx>{`
 .no-scrollbar::-webkit-scrollbar {
 display: none;
 }
 .no-scrollbar {
 -ms-overflow-style: none;
 scrollbar-width: none;
 }
 `}</style>
                    {store.address && (
                        <a
                            href={store.maps_link || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 pl-1 pr-3 py-1.5 bg-card-light/50 rounded-lg border border-transparent hover:border-border-light transition-colors cursor-pointer shrink-0"
                        >
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <span className="material-symbols-outlined text-[18px]">location_on</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-text-light-primary">{store.address}</span>
                                <span className="text-[10px] text-text-light-secondary">{t('store.viewOnMap')}</span>
                            </div>
                        </a>
                    )}
                    {store.phone && (
                        <div className="flex items-center gap-2 pl-1 pr-3 py-1.5 bg-card-light/50 rounded-lg border border-transparent hover:border-border-light transition-colors cursor-pointer shrink-0">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <span className="material-symbols-outlined text-[18px]">call</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-text-light-primary">{t('store.callNow')}</span>
                                <span className="text-[10px] text-text-light-secondary">{store.phone}</span>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-2 pl-1 pr-3 py-1.5 bg-card-light/50 rounded-lg border border-transparent hover:border-border-light transition-colors cursor-pointer shrink-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <span className="material-symbols-outlined text-[18px]">schedule</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-text-light-primary">{t('store.open')}</span>
                            <span className="text-[10px] text-text-light-secondary">{t('store.openUntil')} 9 PM</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Tabs */}
            <div className="sticky top-[73px] z-40 bg-background-light border-b border-border-light">
                <div className="flex px-4">
                    <button
                        onClick={() => setActiveTab('Products')}
                        className={`flex-1 pb-3 pt-3 border-b-[3px] font-bold text-sm text-center relative transition-colors ${activeTab === 'Products' ? 'border-primary text-primary' : 'border-transparent text-text-light-secondary hover:text-text-light-primary'}`}
                    >
                        {t('store.products')} ({products.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('About')}
                        className={`flex-1 pb-3 pt-3 border-b-[3px] font-medium text-sm text-center transition-colors ${activeTab === 'About' ? 'border-primary text-primary' : 'border-transparent text-text-light-secondary hover:text-text-light-primary'}`}
                    >
                        {t('store.about')}
                    </button>
                    <button
                        onClick={() => setActiveTab('Reviews')}
                        className={`flex-1 pb-3 pt-3 border-b-[3px] font-medium text-sm text-center transition-colors ${activeTab === 'Reviews' ? 'border-primary text-primary' : 'border-transparent text-text-light-secondary hover:text-text-light-primary'}`}
                    >
                        {t('store.reviews')}
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col p-4 gap-5 min-h-[500px]">
                {activeTab === 'Products' && (
                    <>
                        {/* Search & Filter Controls */}
                        <div className="flex flex-col gap-4">
                            {/* Search Bar */}
                            <div className="relative w-full">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="material-symbols-outlined text-text-light-secondary">search</span>
                                </div>
                                <input
                                    className="block w-full rounded-xl border-none bg-card-light py-3 pl-10 pr-4 text-sm text-text-light-primary placeholder-gray-400 focus:ring-2 focus:ring-primary shadow-sm"
                                    placeholder={`${t('store.search')} ${store.name}...`}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* Category Tabs (Horizontal Scrollable) */}
                            {categories.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                                    <style jsx>{`
 .no-scrollbar::-webkit-scrollbar {
 display: none;
 }
 .no-scrollbar {
 -ms-overflow-style: none;
 scrollbar-width: none;
 }
 `}</style>
                                    <button
                                        onClick={() => setActiveCategory(null)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all shrink-0 ${activeCategory === null
                                            ? 'bg-primary text-white shadow-sm'
                                            : 'bg-card-light text-text-light-secondary hover:bg-card-light'
                                            }`}
                                    >
                                        {t('store.all')}
                                    </button>
                                    {categories.map((category) => (
                                        <button
                                            key={category.id}
                                            onClick={() => setActiveCategory(category.id)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all shrink-0 ${activeCategory === category.id
                                                ? 'bg-primary text-white shadow-sm'
                                                : 'bg-card-light text-text-light-secondary hover:bg-card-light'
                                                }`}
                                        >
                                            {language === 'ar' && category.name_ar ? category.name_ar : category.name}
                                        </button>
                                    ))}
                                </div>
                            )}


                        </div>

                        {/* Product Grid */}
                        {filteredProducts.length === 0 ? (
                            <div className="text-center py-12">
                                <span className="material-symbols-outlined text-6xl text-border-light mb-4">inventory_2</span>
                                <p className="text-text-light-secondary">{t('store.noProducts')}</p>
                                <p className="text-sm text-text-light-secondary mt-2">{t('store.adjustFilters')}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                {filteredProducts.map((product) => (
                                    <Link key={product.id} href={`/products/${product.id}`} className="group flex flex-col bg-card-light/50 backdrop-blur-md border border-border-light/50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer">
                                        <div className="aspect-[3/4] w-full relative bg-card-light">
                                            {product.image_urls && product.image_urls.length > 0 ? (
                                                <img alt={product.name} className="w-full h-full object-cover" src={product.image_urls[0]} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-6xl text-text-light-secondary">image</span>
                                                </div>
                                            )}
                                            <WishlistButton
                                                productId={product.id}
                                                className="absolute top-2 right-2 z-10"
                                            />
                                            {product.stock_quantity === 0 && (
                                                <div className="absolute bottom-2 left-2 bg-red-500 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded">
                                                    {t('product.outOfStock')}
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3 flex flex-col gap-1 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="text-sm font-medium text-text-light-primary line-clamp-2 leading-tight">{product.name}</h3>
                                            </div>
                                            <p className="text-xs text-text-light-secondary">{product.category}</p>
                                            <div className="mt-auto pt-2 flex items-center justify-between">
                                                <span className="text-base font-bold text-text-light-primary">{t('common.egp')} {product.price.toFixed(2)}</span>
                                                <button className="w-7 h-7 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90">
                                                    <span className="material-symbols-outlined text-[16px]">add</span>
                                                </button>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'About' && (
                    <div className="space-y-4">
                        <div className="bg-card-light/50 rounded-xl p-4 border border-border-light">
                            <h3 className="font-bold text-text-light-primary mb-2">{t('store.about')} {store.name}</h3>
                            <p className="text-text-light-secondary text-sm leading-relaxed">
                                {store.description || t('store.noDescription')}
                            </p>
                        </div>
                        {store.address && (
                            <div className="bg-card-light/50 rounded-xl p-4 border border-border-light">
                                <h3 className="font-bold text-text-light-primary mb-2">{t('store.location')}</h3>
                                <p className="text-text-light-secondary text-sm">{store.address}</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'Reviews' && (
                    <div>
                        {/* Rating Summary */}
                        {reviewsCount > 0 && (
                            <div className="bg-card-light rounded-xl p-5 border border-border-light mb-5">
                                <div className="flex items-center gap-4">
                                    <div className="text-center">
                                        <p className="text-4xl font-bold text-text-light-primary">{avgRating}</p>
                                        <div className="flex items-center gap-0.5 mt-1 justify-center">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <span
                                                    key={star}
                                                    className={`material-symbols-outlined text-[18px] ${star <= Math.round(avgRating) ? 'text-amber-500 filled fill' : 'text-border-light'}`}
                                                >
                                                    star
                                                </span>
                                            ))}
                                        </div>
                                        <p className="text-xs text-text-light-secondary mt-1">
                                            {t('reviews.basedOn')} {reviewsCount} {t('reviews.customerReviews')}
                                        </p>
                                    </div>
                                    <div className="flex-1 space-y-1.5">
                                        {[5, 4, 3, 2, 1].map((star) => {
                                            const count = reviews.filter(r => Math.round(r.rating) === star).length;
                                            const pct = reviewsCount > 0 ? (count / reviewsCount) * 100 : 0;
                                            return (
                                                <div key={star} className="flex items-center gap-2">
                                                    <span className="text-xs text-text-light-secondary w-3">{star}</span>
                                                    <div className="flex-1 bg-surface-light rounded-full h-2">
                                                        <div className="bg-amber-500 rounded-full h-2 transition-all" style={{ width: `${pct}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Reviews List */}
                        {reviews.length > 0 ? (
                            <div className="space-y-4">
                                {reviews.map((review) => (
                                    <div key={review.id} className="bg-card-light rounded-xl p-4 border border-border-light">
                                        <div className="flex items-start gap-3">
                                            {review.customer?.avatar_url ? (
                                                <img src={review.customer.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                    <span className="material-symbols-outlined text-primary text-base">person</span>
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-semibold text-text-light-primary text-sm">
                                                        {review.customer?.full_name || (language === 'ar' ? 'عميل' : 'Customer')}
                                                    </p>
                                                    <span className="text-xs text-text-light-secondary">
                                                        {new Date(review.created_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                        })}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-0.5 mt-1">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <span
                                                            key={star}
                                                            className={`material-symbols-outlined text-[14px] ${star <= review.rating ? 'text-amber-500 filled fill' : 'text-border-light'}`}
                                                        >
                                                            star
                                                        </span>
                                                    ))}
                                                </div>
                                                {review.comment && (
                                                    <p className="text-sm text-text-light-secondary mt-2">{review.comment}</p>
                                                )}
                                                {review.merchant_reply && (
                                                    <div className="mt-3 p-3 bg-surface-light rounded-lg border-l-2 border-primary">
                                                        <p className="text-xs font-semibold text-primary mb-1">{t('reviews.merchantReply')}</p>
                                                        <p className="text-sm text-text-light-secondary">{review.merchant_reply}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <span className="material-symbols-outlined text-6xl text-border-light mb-4">rate_review</span>
                                <p className="text-text-light-secondary">{t('store.noReviews')}</p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
