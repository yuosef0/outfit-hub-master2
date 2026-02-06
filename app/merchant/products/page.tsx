'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import Toast from '@/components/Toast';
import { Product } from '@/lib/types';

export default function ProductsListPage() {
 const router = useRouter();
 const [loading, setLoading] = useState(true);
 const [storeId, setStoreId] = useState<string | null>(null);
 const [products, setProducts] = useState<Product[]>([]);
 const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
 const [searchQuery, setSearchQuery] = useState('');
 const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
 const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

 const supabase = createBrowserClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 );

 useEffect(() => {
 checkStoreAndFetchProducts();
 }, []);

 useEffect(() => {
 // Filter products
 let filtered = products;

 // Search filter
 if (searchQuery.trim() !== '') {
 filtered = filtered.filter(p =>
 p.name.toLowerCase().includes(searchQuery.toLowerCase())
 );
 }

 // Status filter
 if (filterStatus === 'active') {
 filtered = filtered.filter(p => p.is_active);
 } else if (filterStatus === 'inactive') {
 filtered = filtered.filter(p => !p.is_active);
 }

 setFilteredProducts(filtered);
 }, [searchQuery, filterStatus, products]);

 const checkStoreAndFetchProducts = async () => {
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
 await fetchProducts(store.id);
 } catch (error) {
 console.error('Error:', error);
 } finally {
 setLoading(false);
 }
 };

 const fetchProducts = async (storeId: string) => {
 const { data, error } = await supabase
 .from('products')
 .select('*')
 .eq('store_id', storeId)
 .order('created_at', { ascending: false });

 if (error) {
 console.error('Error fetching products:', error);
 return;
 }

 setProducts(data || []);
 setFilteredProducts(data || []);
 };

 const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
 const { error } = await supabase
 .from('products')
 .update({ is_active: !currentStatus })
 .eq('id', productId);

 if (error) {
 setToast({ message: 'حدث خطأ أثناء تحديث حالة المنتج', type: 'error' });
 return;
 }

 setToast({ message: `تم ${!currentStatus ? 'تفعيل' : 'إيقاف'} المنتج بنجاح`, type: 'success' });

 // Update local state
 setProducts(products.map(p =>
 p.id === productId ? { ...p, is_active: !currentStatus } : p
 ));
 };

 const deleteProduct = async (productId: string) => {
 if (!confirm('هل أنت متأكد من حذف هذا المنتج؟ لن تتمكن من استرجاعه.')) {
 return;
 }

 const { error } = await supabase
 .from('products')
 .delete()
 .eq('id', productId);

 if (error) {
 setToast({ message: 'حدث خطأ أثناء حذف المنتج', type: 'error' });
 return;
 }

 setToast({ message: 'تم حذف المنتج بنجاح', type: 'success' });
 setProducts(products.filter(p => p.id !== productId));
 };

 const activeCount = products.filter(p => p.is_active).length;
 const inactiveCount = products.filter(p => !p.is_active).length;
 const lowStockCount = products.filter(p => p.stock_quantity < 5).length;

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

 return (
 <div className="bg-background-light">
 {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

 {/* Header */}
 <div className="bg-card-light border-b border-border-light sticky top-0 z-10">
 <div className="px-4 py-4">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold text-text-light-primary ">
 📦 المنتجات
 </h1>
 <p className="text-text-light-secondary text-sm mt-0.5">
 إدارة منتجات متجرك ({products.length} منتج)
 </p>
 </div>
 <Link
 href="/merchant/products/new"
 className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-bold"
 >
 <span className="material-symbols-outlined text-xl">add</span>
 إضافة
 </Link>
 </div>
 </div>
 </div>

 <main className="p-4 max-w-7xl mx-auto">
 {/* Stats */}
 <div className="grid grid-cols-3 gap-3 mb-6">
 <div className="bg-card-light rounded-xl p-4 border border-border-light">
 <div className="flex items-center gap-2 mb-2">
 <div className="w-8 h-8 bg-green-900/30 rounded-lg flex items-center justify-center">
 <span className="material-symbols-outlined text-green-400 text-base">
 check_circle
 </span>
 </div>
 </div>
 <p className="text-xl font-bold text-text-light-primary ">{activeCount}</p>
 <p className="text-xs text-text-light-secondary">نشط</p>
 </div>

 <div className="bg-card-light rounded-xl p-4 border border-border-light">
 <div className="flex items-center gap-2 mb-2">
 <div className="w-8 h-8 bg-card-light rounded-lg flex items-center justify-center">
 <span className="material-symbols-outlined text-text-light-secondary text-base">
 cancel
 </span>
 </div>
 </div>
 <p className="text-xl font-bold text-text-light-primary ">{inactiveCount}</p>
 <p className="text-xs text-text-light-secondary">غير نشط</p>
 </div>

 <div className="bg-card-light rounded-xl p-4 border border-border-light">
 <div className="flex items-center gap-2 mb-2">
 <div className="w-8 h-8 bg-red-900/30 rounded-lg flex items-center justify-center">
 <span className="material-symbols-outlined text-red-400 text-base">
 warning
 </span>
 </div>
 </div>
 <p className="text-xl font-bold text-text-light-primary ">{lowStockCount}</p>
 <p className="text-xs text-text-light-secondary">كمية قليلة</p>
 </div>
 </div>

 {/* Search & Filter */}
 <div className="bg-card-light rounded-xl p-4 border border-border-light mb-6">
 {/* Search */}
 <div className="relative mb-4">
 <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-text-light-secondary">
 search
 </span>
 <input
 type="text"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="ابحث عن منتج..."
 className="w-full pr-12 pl-4 py-3 rounded-lg border border-border-light bg-background-light text-text-light-primary focus:ring-2 focus:ring-primary focus:border-transparent text-right"
 />
 </div>

 {/* Filter Tabs */}
 <div className="flex gap-2">
 <button
 onClick={() => setFilterStatus('all')}
 className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
 filterStatus === 'all'
 ? 'bg-primary text-white'
 : 'bg-card-light text-text-light-secondary'
 }`}
 >
 الكل ({products.length})
 </button>
 <button
 onClick={() => setFilterStatus('active')}
 className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
 filterStatus === 'active'
 ? 'bg-primary text-white'
 : 'bg-card-light text-text-light-secondary'
 }`}
 >
 نشط ({activeCount})
 </button>
 <button
 onClick={() => setFilterStatus('inactive')}
 className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
 filterStatus === 'inactive'
 ? 'bg-primary text-white'
 : 'bg-card-light text-text-light-secondary'
 }`}
 >
 غير نشط ({inactiveCount})
 </button>
 </div>
 </div>

 {/* Products Grid */}
 {filteredProducts.length > 0 ? (
 <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
 {filteredProducts.map((product) => (
 <div
 key={product.id}
 className="bg-card-light rounded-xl overflow-hidden border border-border-light"
 >
 {/* Product Image */}
 <div className="relative aspect-square">
 {product.image_urls?.[0] ? (
 <img
 src={product.image_urls[0]}
 alt={product.name}
 className="w-full h-full object-cover"
 />
 ) : (
 <div className="w-full h-full bg-card-light flex items-center justify-center">
 <span className="material-symbols-outlined text-4xl text-text-light-secondary">
 image
 </span>
 </div>
 )}
 {!product.is_active && (
 <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
 <span className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold">
 غير نشط
 </span>
 </div>
 )}
 {product.stock_quantity < 5 && product.is_active && (
 <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
 كمية قليلة!
 </div>
 )}
 </div>

 {/* Product Info */}
 <div className="p-3">
 <h3 className="font-bold text-text-light-primary text-sm mb-1 truncate text-right">
 {product.name}
 </h3>
 <p className="text-base font-bold text-primary mb-2 text-right">
 {product.price.toFixed(2)} ج.م
 </p>
 <div className="flex items-center justify-between text-xs text-text-light-secondary mb-3">
 <span className="flex items-center gap-1">
 <span className="material-symbols-outlined text-sm">inventory</span>
 {product.stock_quantity}
 </span>
 {product.is_active ? (
 <span className="text-green-400 font-bold">● نشط</span>
 ) : (
 <span className="text-text-light-secondary font-bold">○ متوقف</span>
 )}
 </div>

 {/* Actions */}
 <div className="grid grid-cols-3 gap-2">
 <button
 onClick={() => toggleProductStatus(product.id, product.is_active)}
 className={`px-2 py-2 rounded-lg text-xs font-bold transition-colors ${
 product.is_active
 ? 'bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/40'
 : 'bg-green-900/30 text-green-400 hover:bg-green-900/40'
 }`}
 >
 {product.is_active ? 'إيقاف' : 'تفعيل'}
 </button>
 <Link
 href={`/merchant/products/${product.id}/edit`}
 className="flex items-center justify-center px-2 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
 >
 <span className="material-symbols-outlined text-base">edit</span>
 </Link>
 <button
 onClick={() => deleteProduct(product.id)}
 className="flex items-center justify-center px-2 py-2 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/40 transition-colors"
 >
 <span className="material-symbols-outlined text-base">delete</span>
 </button>
 </div>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="bg-card-light rounded-xl p-12 border border-border-light text-center">
 <div className="w-24 h-24 bg-card-light rounded-full flex items-center justify-center mx-auto mb-4">
 <span className="material-symbols-outlined text-5xl text-text-light-secondary">
 {searchQuery ? 'search_off' : 'inventory_2'}
 </span>
 </div>
 <h3 className="text-xl font-bold text-text-light-primary mb-2">
 {searchQuery || filterStatus !== 'all' ? 'لا توجد نتائج' : 'لا توجد منتجات'}
 </h3>
 <p className="text-text-light-secondary mb-6">
 {searchQuery
 ? 'جرب البحث بكلمات أخرى'
 : filterStatus !== 'all'
 ? 'لا توجد منتجات بهذه الحالة'
 : 'ابدأ بإضافة منتجك الأول'}
 </p>
 {!searchQuery && filterStatus === 'all' && (
 <Link
 href="/merchant/products/new"
 className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-bold"
 >
 <span className="material-symbols-outlined">add</span>
 إضافة منتج
 </Link>
 )}
 </div>
 )}
 </main>
 </div>
 );
}
