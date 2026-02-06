'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

export default function MerchantDashboardPage() {
 const router = useRouter();
 const [loading, setLoading] = useState(true);
 const [storeId, setStoreId] = useState<string | null>(null);
 const [storeName, setStoreName] = useState('');
 const [merchantName, setMerchantName] = useState('');

 const [stats, setStats] = useState({
 totalSales: 0,
 totalOrders: 0,
 totalProducts: 0,
 avgRating: 0,
 salesChange: '+12%',
 ordersChange: '+8%',
 newOrders: 0,
 });

 const [recentOrders, setRecentOrders] = useState<any[]>([]);
 const [topProducts, setTopProducts] = useState<any[]>([]);

 const supabase = createBrowserClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 );

 useEffect(() => {
 checkMerchantAndStore();
 }, []);

 const checkMerchantAndStore = async () => {
 try {
 const { data: { user } } = await supabase.auth.getUser();

 if (!user) {
 router.push('/login');
 return;
 }

 // Get merchant's store
 const { data: store, error: storeError } = await supabase
 .from('stores')
 .select('*')
 .eq('merchant_id', user.id)
 .single();

 if (storeError || !store) {
 router.push('/merchant/setup');
 return;
 }

 if (!store.is_active) {
 router.push('/merchant/pending');
 return;
 }

 setStoreId(store.id);
 setStoreName(store.name);
 setMerchantName(store.name || 'التاجر');

 // Fetch dashboard data
 await Promise.all([
 fetchStats(store.id),
 fetchRecentOrders(store.id),
 fetchTopProducts(store.id),
 ]);
 } catch (error) {
 console.error('Error:', error);
 } finally {
 setLoading(false);
 }
 };

 const fetchStats = async (storeId: string) => {
 // Fetch orders
 const { data: orders } = await supabase
 .from('orders')
 .select('total_amount, status, created_at')
 .eq('store_id', storeId);

 if (orders) {
 const completedOrders = orders.filter(o => o.status === 'completed');
 const totalSales = completedOrders.reduce((sum, o) => sum + o.total_amount, 0);
 const newOrders = orders.filter(o => o.status === 'reserved').length;

 setStats(prev => ({
 ...prev,
 totalSales,
 totalOrders: orders.length,
 newOrders,
 }));
 }

 // Fetch products count
 const { count: productsCount } = await supabase
 .from('products')
 .select('*', { count: 'exact', head: true })
 .eq('store_id', storeId);

 if (productsCount !== null) {
 setStats(prev => ({ ...prev, totalProducts: productsCount }));
 }

 // Fetch store rating
 const { data: store } = await supabase
 .from('stores')
 .select('rating')
 .eq('id', storeId)
 .single();

 if (store) {
 setStats(prev => ({ ...prev, avgRating: store.rating || 0 }));
 }
 };

 const fetchRecentOrders = async (storeId: string) => {
 const { data: orders } = await supabase
 .from('orders')
 .select('*')
 .eq('store_id', storeId)
 .order('created_at', { ascending: false })
 .limit(5);

 if (orders) {
 setRecentOrders(orders);
 }
 };

 const fetchTopProducts = async (storeId: string) => {
 const { data: products } = await supabase
 .from('products')
 .select('id, name, image_urls, price')
 .eq('store_id', storeId)
 .eq('is_active', true)
 .order('created_at', { ascending: false })
 .limit(3);

 if (products) {
 setTopProducts(products);
 }
 };

 const getStatusBadge = (status: string) => {
 const badges = {
 reserved: { bg: 'bg-yellow-900/30', text: 'text-yellow-400', label: '⏳ جديد', icon: 'schedule' },
 confirmed: { bg: 'bg-primary/10', text: 'text-primary', label: '✅ مؤكد', icon: 'check_circle' },
 ready: { bg: 'bg-purple-900/30', text: 'text-purple-400', label: '📦 جاهز', icon: 'inventory' },
 completed: { bg: 'bg-green-900/30', text: 'text-green-400', label: '✔️ مكتمل', icon: 'done_all' },
 cancelled: { bg: 'bg-red-900/30', text: 'text-red-400', label: '❌ ملغي', icon: 'cancel' },
 expired: { bg: 'bg-background-light /30', text: 'text-text-light-primary', label: 'منتهي', icon: 'timelapse' },
 };

 const badge = badges[status as keyof typeof badges] || badges.reserved;
 return (
 <span className={`inline-flex items-center gap-1 px-3 py-1.5 ${badge.bg} ${badge.text} text-xs font-bold rounded-lg`}>
 {badge.label}
 </span>
 );
 };

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
 {/* Header */}
 <div className="bg-card-light border-b border-border-light sticky top-0 z-10">
 <div className="px-4 py-4">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold text-text-light-primary ">
 🏪 {storeName}
 </h1>
 <p className="text-text-light-secondary text-sm mt-0.5">
 مرحباً {merchantName}! 👋
 </p>
 </div>
 <Link
 href="/merchant/settings"
 className="p-2 hover:bg-card-light rounded-lg transition-colors"
 >
 <span className="material-symbols-outlined text-text-light-secondary">
 settings
 </span>
 </Link>
 </div>
 </div>
 </div>

 <main className="p-4 max-w-7xl mx-auto">
 {/* Stats Grid */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
 {/* Total Sales */}
 <div className="bg-card-light rounded-xl p-4 border border-border-light">
 <div className="flex items-center justify-between mb-2">
 <div className="w-10 h-10 bg-green-900/30 rounded-lg flex items-center justify-center">
 <span className="material-symbols-outlined text-green-400 text-xl">
 payments
 </span>
 </div>
 <span className="text-xs font-medium text-green-400">
 {stats.salesChange} ↑
 </span>
 </div>
 <p className="text-2xl font-bold text-text-light-primary ">
 {stats.totalSales.toFixed(0)}
 </p>
 <p className="text-xs text-text-light-secondary mt-1">
 المبيعات (ج.م)
 </p>
 </div>

 {/* Total Orders */}
 <div className="bg-card-light rounded-xl p-4 border border-border-light">
 <div className="flex items-center justify-between mb-2">
 <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
 <span className="material-symbols-outlined text-primary text-xl">
 shopping_bag
 </span>
 </div>
 <span className="text-xs font-medium text-primary">
 {stats.ordersChange} ↑
 </span>
 </div>
 <p className="text-2xl font-bold text-text-light-primary ">
 {stats.totalOrders}
 </p>
 <p className="text-xs text-text-light-secondary mt-1">
 الطلبات
 </p>
 </div>

 {/* Total Products */}
 <div className="bg-card-light rounded-xl p-4 border border-border-light">
 <div className="flex items-center justify-between mb-2">
 <div className="w-10 h-10 bg-purple-900/30 rounded-lg flex items-center justify-center">
 <span className="material-symbols-outlined text-purple-400 text-xl">
 inventory_2
 </span>
 </div>
 </div>
 <p className="text-2xl font-bold text-text-light-primary ">
 {stats.totalProducts}
 </p>
 <p className="text-xs text-text-light-secondary mt-1">
 المنتجات
 </p>
 </div>

 {/* Rating */}
 <div className="bg-card-light rounded-xl p-4 border border-border-light">
 <div className="flex items-center justify-between mb-2">
 <div className="w-10 h-10 bg-yellow-900/30 rounded-lg flex items-center justify-center">
 <span className="material-symbols-outlined text-yellow-400 text-xl">
 star
 </span>
 </div>
 </div>
 <p className="text-2xl font-bold text-text-light-primary ">
 {stats.avgRating.toFixed(1)}
 </p>
 <p className="text-xs text-text-light-secondary mt-1">
 التقييم
 </p>
 </div>
 </div>

 {/* Quick Actions */}
 <div className="bg-card-light rounded-xl p-5 border border-border-light mb-6">
 <h2 className="text-lg font-bold text-text-light-primary mb-4 text-right">
 ⚡ إجراءات سريعة
 </h2>
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
 <Link
 href="/merchant/products/new"
 className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-border-light hover:border-primary hover:bg-primary/5 transition-all"
 >
 <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
 <span className="material-symbols-outlined text-2xl text-primary">add_circle</span>
 </div>
 <span className="text-sm font-bold text-text-light-primary">➕ أضف منتج</span>
 </Link>

 <Link
 href="/merchant/orders"
 className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-border-light hover:border-primary hover:bg-primary/5 transition-all relative"
 >
 {stats.newOrders > 0 && (
 <span className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
 {stats.newOrders}
 </span>
 )}
 <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
 <span className="material-symbols-outlined text-2xl text-primary">shopping_bag</span>
 </div>
 <span className="text-sm font-bold text-text-light-primary">📦 الطلبات</span>
 </Link>

 <Link
 href="/merchant/coupons"
 className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-border-light hover:border-primary hover:bg-primary/5 transition-all"
 >
 <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
 <span className="material-symbols-outlined text-2xl text-primary">local_offer</span>
 </div>
 <span className="text-sm font-bold text-text-light-primary">🏷️ كوبون</span>
 </Link>

 <Link
 href="/merchant/analytics"
 className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-border-light hover:border-primary hover:bg-primary/5 transition-all"
 >
 <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
 <span className="material-symbols-outlined text-2xl text-primary">analytics</span>
 </div>
 <span className="text-sm font-bold text-text-light-primary">📈 التحليلات</span>
 </Link>
 </div>
 </div>

 {/* Recent Orders & Top Products */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* Recent Orders */}
 <div className="bg-card-light rounded-xl p-5 border border-border-light">
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-lg font-bold text-text-light-primary ">
 📦 آخر الطلبات
 </h2>
 <Link
 href="/merchant/orders"
 className="text-primary hover:underline text-sm font-medium"
 >
 عرض الكل →
 </Link>
 </div>

 {recentOrders.length > 0 ? (
 <div className="space-y-3">
 {recentOrders.map((order) => (
 <Link
 key={order.id}
 href={`/merchant/orders`}
 className="flex items-center justify-between p-3 rounded-lg border border-border-light hover:bg-card-light/50 transition-colors"
 >
 <div className="flex-1 min-w-0">
 <p className="font-bold text-text-light-primary text-sm">
 #{order.pickup_code} | {order.customer_name || 'عميل'}
 </p>
 <p className="text-xs text-text-light-secondary mt-0.5">
 {order.total_amount.toFixed(2)} ج.م
 </p>
 </div>
 {getStatusBadge(order.status)}
 </Link>
 ))}
 </div>
 ) : (
 <div className="text-center py-8">
 <span className="material-symbols-outlined text-6xl text-text-light-secondary">
 shopping_bag
 </span>
 <p className="text-text-light-secondary mt-3">
 لا توجد طلبات بعد
 </p>
 </div>
 )}
 </div>

 {/* Top Products */}
 <div className="bg-card-light rounded-xl p-5 border border-border-light">
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-lg font-bold text-text-light-primary ">
 🏆 أحدث منتجاتك
 </h2>
 <Link
 href="/merchant/products"
 className="text-primary hover:underline text-sm font-medium"
 >
 عرض الكل →
 </Link>
 </div>

 {topProducts.length > 0 ? (
 <div className="space-y-3">
 {topProducts.map((product, index) => (
 <div
 key={product.id}
 className="flex items-center gap-3 p-3 rounded-lg border border-border-light"
 >
 <span className="text-2xl font-bold text-text-light-secondary w-6">
 {index + 1}
 </span>
 <div className="w-14 h-14 rounded-lg overflow-hidden bg-card-light">
 {product.image_urls?.[0] ? (
 <img
 src={product.image_urls[0]}
 alt={product.name}
 className="w-full h-full object-cover"
 />
 ) : (
 <div className="w-full h-full flex items-center justify-center">
 <span className="material-symbols-outlined text-text-light-secondary">image</span>
 </div>
 )}
 </div>
 <div className="flex-1 min-w-0">
 <p className="font-bold text-text-light-primary truncate text-sm">
 {product.name}
 </p>
 <p className="text-sm text-primary font-bold mt-0.5">
 {product.price.toFixed(2)} ج.م
 </p>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="text-center py-8">
 <span className="material-symbols-outlined text-6xl text-text-light-secondary">
 inventory_2
 </span>
 <p className="text-text-light-secondary mt-3 mb-4">
 لم تضف أي منتجات بعد
 </p>
 <Link
 href="/merchant/products/new"
 className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-bold"
 >
 <span className="material-symbols-outlined">add</span>
 أضف منتجك الأول
 </Link>
 </div>
 )}
 </div>
 </div>
 </main>
 </div>
 );
}
