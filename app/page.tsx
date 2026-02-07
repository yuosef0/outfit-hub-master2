'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import WishlistButton from '@/components/WishlistButton';
import { createBrowserClient } from '@supabase/ssr';
import type { SliderImage, Category, Store, Product } from '@/lib/types';

export default function HomePage() {
 const [sliderImages, setSliderImages] = useState<SliderImage[]>([]);
 const [currentSlide, setCurrentSlide] = useState(0);
 const [categories, setCategories] = useState<Category[]>([]);
 const [featuredStores, setFeaturedStores] = useState<Store[]>([]);
 const [newArrivals, setNewArrivals] = useState<Product[]>([]);
 const [isLoading, setIsLoading] = useState(true);

 const supabase = createBrowserClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 );

 useEffect(() => {
 const fetchData = async () => {
 try {
 // Fetch slider images
 const { data: sliderData } = await supabase
 .from('slider_images')
 .select('*')
 .eq('is_active', true)
 .order('display_order', { ascending: true });

 if (sliderData) setSliderImages(sliderData);

 // Fetch categories
 const { data: categoriesData } = await supabase
 .from('categories')
 .select('*')
 .eq('is_active', true)
 .order('display_order', { ascending: true })
 .limit(6);

 if (categoriesData) setCategories(categoriesData);

 // Fetch featured stores (first 4)
 const { data: storesData } = await supabase
 .from('stores')
 .select('*')
 .eq('is_active', true)
 .order('created_at', { ascending: false })
 .limit(4);

 if (storesData) setFeaturedStores(storesData);

 // Fetch new arrivals (latest 6 products with store info)
 const { data: productsData } = await supabase
 .from('products')
 .select(`
 *,
 stores:store_id (
 id,
 name,
 logo_url
 )
 `)
 .eq('is_active', true)
 .order('created_at', { ascending: false })
 .limit(6);

 if (productsData) setNewArrivals(productsData);
 } catch (error) {
 console.error('Error fetching data:', error);
 } finally {
 setIsLoading(false);
 }
 };

 fetchData();
 }, []);

 // Auto-rotate slider every 3 seconds
 useEffect(() => {
 if (sliderImages.length === 0) return;

 const interval = setInterval(() => {
 setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
 }, 3000);

 return () => clearInterval(interval);
 }, [sliderImages.length]);

 if (isLoading) {
 return (
 <div className="flex items-center justify-center min-h-screen bg-background-light">
 <div className="text-center">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
 <p className="mt-4 text-text-light-secondary">Loading...</p>
 </div>
 </div>
 );
 }

 return (
 <div
 className="relative flex h-auto min-h-screen w-full flex-col bg-background-dark justify-between group/design-root overflow-x-hidden"
 style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}
 >
 <div className="pb-24">
 {/* Slider Section */}
 <div className="@container px-4 pt-3">
 <div>
 <div className="relative overflow-hidden bg-background-dark rounded-2xl min-h-[218px]">
 {sliderImages.length > 0 ? (
 <>
 {sliderImages.map((slide, index) => (
 <div
 key={slide.id}
 className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'
 }`}
 style={{
 backgroundImage: `linear-gradient(0deg, rgba(15, 23, 19, 0.4) 0%, rgba(15, 23, 19, 0) 25%), url("${slide.image_url}")`,
 backgroundSize: 'cover',
 backgroundPosition: 'center',
 }}
 >
 {slide.title && (
 <div className="absolute bottom-0 left-0 right-0 p-6">
 <h2 className="text-cream text-2xl font-bold">{slide.title}</h2>
 {slide.description && (
 <p className="text-text-dark-primary text-sm mt-1">{slide.description}</p>
 )}
 </div>
 )}
 </div>
 ))}
 {/* Slider Indicators */}
 <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-2">
 {sliderImages.map((_, index) => (
 <button
 key={index}
 onClick={() => setCurrentSlide(index)}
 className={`size-1.5 rounded-full transition-opacity ${index === currentSlide ? 'bg-cream' : 'bg-cream/50'
 }`}
 />
 ))}
 </div>
 </>
 ) : (
 <div className="flex items-center justify-center h-[218px] bg-card-dark">
 <p className="text-text-dark-secondary">No slider images available</p>
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Categories Section */}
 <h3 className="text-cream text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">
 Categories
 </h3>
 <div className="flex overflow-y-auto [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
 <div className="flex items-stretch p-4 gap-8">
 {categories.length > 0 ? (
 categories.map((category) => (
 <Link
 key={category.id}
 href={`/categories/${category.name.toLowerCase()}`}
 className="flex h-full flex-1 flex-col gap-4 text-center rounded-lg min-w-32 pt-4 hover:opacity-80 transition-opacity"
 >
 <div
 className="bg-center bg-no-repeat aspect-square bg-cover rounded-full flex flex-col self-center w-full"
 style={{ backgroundImage: `url("${category.image_url || 'https://via.placeholder.com/150'}")` }}
 />
 <p className="text-text-dark-primary text-base font-medium leading-normal">
 {category.name}
 </p>
 </Link>
 ))
 ) : (
 <p className="text-text-dark-secondary px-4">No categories available</p>
 )}
 </div>
 </div>

 {/* Featured Stores Section */}
 <h3 className="text-cream text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">
 Featured Stores
 </h3>
 <div className="flex overflow-y-auto [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
 <div className="flex items-stretch p-4 gap-3">
 {featuredStores.length > 0 ? (
 featuredStores.map((store) => (
 <Link
 key={store.id}
 href={`/stores/${store.id}`}
 className="flex h-full flex-1 flex-col gap-4 rounded-lg min-w-40 hover:opacity-80 transition-opacity"
 >
 <div
 className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl flex flex-col"
 style={{ backgroundImage: `url("${store.logo_url || 'https://via.placeholder.com/300x200'}")` }}
 />
 <div>
 <p className="text-text-dark-primary text-base font-medium leading-normal">
 {store.name}
 </p>
 <p className="text-text-dark-secondary text-sm font-normal leading-normal">
 {store.category || 'Store'}
 </p>
 </div>
 </Link>
 ))
 ) : (
 <p className="text-text-dark-secondary px-4">No featured stores available</p>
 )}
 </div>
 </div>

 {/* New Arrivals Section */}
 <h3 className="text-cream text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">
 New Arrivals
 </h3>
 <div className="grid grid-cols-[repeat(auto-fit,minmax(158px,1fr))] gap-3 p-4">
 {newArrivals.length > 0 ? (
 newArrivals.map((product) => (
 <Link
 key={product.id}
 href={`/products/${product.id}`}
 className="flex flex-col gap-3 pb-3 group relative"
 >
 <div
 className="w-full bg-center bg-no-repeat aspect-[3/4] bg-cover rounded-xl relative overflow-hidden"
 style={{
 backgroundImage: `url("${product.image_urls && product.image_urls.length > 0
 ? product.image_urls[0]
 : 'https://via.placeholder.com/300x400'
 }")`,
 }}
 >
 <div className="absolute top-2 right-2">
 <WishlistButton productId={product.id} className="!bg-card-dark"/>
 </div>
 </div>
 <div>
 <p className="text-text-dark-primary text-base font-medium leading-normal">
 {product.name}
 </p>
 <p className="text-text-dark-secondary text-sm font-normal leading-normal">
 ${product.price.toFixed(2)}
 </p>
 {product.stores && (
 <p className="text-text-dark-secondary text-xs font-normal leading-normal mt-1">
 {product.stores.name}
 </p>
 )}
 </div>
 </Link>
 ))
 ) : (
 <p className="text-text-dark-secondary col-span-full text-center">
 No new arrivals available
 </p>
 )}
 </div>
 </div>
 </div>
 );
}
