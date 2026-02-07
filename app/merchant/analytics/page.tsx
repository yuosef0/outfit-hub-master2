'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Toast from '@/components/Toast';
import { useLanguage } from '@/lib/i18n/LanguageContext';

type Period = 'this_month' | 'last_month' | 'last_3_months' | 'last_6_months';

interface ProductStats {
 product_id: string;
 product_name: string;
 product_image?: string;
 total_sold: number;
 revenue: number;
}

interface DailySales {
 date: string;
 sales: number;
}

export default function AnalyticsPage() {
 const router = useRouter();
 const { t, language } = useLanguage();
 const [loading, setLoading] = useState(true);
 const [storeId, setStoreId] = useState<string | null>(null);
 const [period, setPeriod] = useState<Period>('this_month');
 const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

 const [analytics, setAnalytics] = useState({
 totalRevenue: 0,
 totalOrders: 0,
 completedOrders: 0,
 cancelledOrders: 0,
 expiredOrders: 0,
 avgOrderValue: 0,
 totalCommission: 0,
 uniqueCustomers: 0,
 returningCustomers: 0,
 });

 // New enhanced metrics
 const [revenueTrend, setRevenueTrend] = useState<number>(0); // % change vs previous period
 const [bestCategory, setBestCategory] = useState<{ name: string; count: number } | null>(null);
 const [avgFulfillmentTime, setAvgFulfillmentTime] = useState<number>(0); // in hours
 const [newCustomerRate, setNewCustomerRate] = useState<number>(0); // % of new customers

 const [topProducts, setTopProducts] = useState<ProductStats[]>([]);
 const [dailySales, setDailySales] = useState<DailySales[]>([]);
 const [peakHours, setPeakHours] = useState<{ hour: string; count: number }[]>([]);

 const supabase = useMemo(() => createBrowserClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 ), []);

 const PERIODS = [
 { value: 'this_month' as Period, label: t('merchant.analytics.thisMonth') },
 { value: 'last_month' as Period, label: t('merchant.analytics.lastMonth') },
 { value: 'last_3_months' as Period, label: t('merchant.analytics.last3Months') },
 { value: 'last_6_months' as Period, label: t('merchant.analytics.last6Months') },
 ];

 useEffect(() => {
 checkStoreAndFetchAnalytics();
 }, []);

 useEffect(() => {
 if (storeId) {
 fetchAnalytics(storeId);
 }
 }, [period, storeId]);

 const checkStoreAndFetchAnalytics = async () => {
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
 await fetchAnalytics(store.id);
 } catch (error) {
 console.error('Error:', error);
 } finally {
 setLoading(false);
 }
 };

 const getPeriodDates = () => {
 const now = new Date();
 let startDate = new Date();
 let prevStartDate = new Date();

 switch (period) {
 case 'this_month':
 startDate = new Date(now.getFullYear(), now.getMonth(), 1);
 prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
 break;
 case 'last_month':
 startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
 prevStartDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
 break;
 case 'last_3_months':
 startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
 prevStartDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
 break;
 case 'last_6_months':
 startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
 prevStartDate = new Date(now.getFullYear(), now.getMonth() - 12, 1);
 break;
 }

 return { startDate: startDate.toISOString(), prevStartDate: prevStartDate.toISOString() };
 };

 const fetchAnalytics = async (storeId: string) => {
 try {
 const { startDate, prevStartDate } = getPeriodDates();

 // Fetch current period orders
 const { data: orders } = await supabase
 .from('orders')
 .select('*')
 .eq('store_id', storeId)
 .gte('created_at', startDate);

 // Fetch previous period orders for trend comparison
 const { data: prevOrders } = await supabase
 .from('orders')
 .select('total_amount, status, customer_id')
 .eq('store_id', storeId)
 .gte('created_at', prevStartDate)
 .lt('created_at', startDate);

 // Fetch all-time customers for acquisition rate
 const { data: allTimeOrders } = await supabase
 .from('orders')
 .select('customer_id')
 .eq('store_id', storeId)
 .lt('created_at', startDate);

 if (orders) {
 const completed = orders.filter(o => o.status === 'completed');
 const cancelled = orders.filter(o => o.status === 'cancelled');
 const expired = orders.filter(o => o.status === 'expired');

 const totalRevenue = completed.reduce((sum, o) => sum + o.total_amount, 0);
 const totalCommission = completed.reduce((sum, o) => sum + o.commission_amount, 0);
 const avgOrderValue = completed.length > 0 ? totalRevenue / completed.length : 0;

 // Calculate unique and returning customers
 const customerIds = orders.map(o => o.customer_id);
 const uniqueCustomers = new Set(customerIds).size;
 const customerCounts = customerIds.reduce((acc: any, id: string) => {
 acc[id] = (acc[id] || 0) + 1;
 return acc;
 }, {});
 const returningCustomers = Object.values(customerCounts).filter((count: any) => count > 1).length;

 setAnalytics({
 totalRevenue,
 totalOrders: orders.length,
 completedOrders: completed.length,
 cancelledOrders: cancelled.length,
 expiredOrders: expired.length,
 avgOrderValue,
 totalCommission,
 uniqueCustomers,
 returningCustomers,
 });

 // Revenue Trend: compare with previous period
 if (prevOrders) {
 const prevCompleted = prevOrders.filter(o => o.status === 'completed');
 const prevRevenue = prevCompleted.reduce((sum, o) => sum + o.total_amount, 0);
 const trend = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : (totalRevenue > 0 ? 100 : 0);
 setRevenueTrend(Math.round(trend));
 }

 // Best Category: derive from completed order items
 const categoryCounts: { [key: string]: number } = {};
 completed.forEach(order => {
 order.items.forEach((item: any) => {
 const cat = item.category || item.product_name?.split(' ')[0] || 'Other';
 categoryCounts[cat] = (categoryCounts[cat] || 0) + item.quantity;
 });
 });

 // Fetch product categories for more accurate category info
 const productIds = completed.flatMap(o => o.items.map((i: any) => i.product_id));
 if (productIds.length > 0) {
 const uniqueProductIds = [...new Set(productIds)];
 const { data: products } = await supabase
 .from('products')
 .select('id, category')
 .in('id', uniqueProductIds.slice(0, 100));

 if (products) {
 const productCategoryMap: { [key: string]: string } = {};
 products.forEach(p => { if (p.category) productCategoryMap[p.id] = p.category; });

 const catCounts: { [key: string]: number } = {};
 completed.forEach(order => {
 order.items.forEach((item: any) => {
 const cat = productCategoryMap[item.product_id] || 'Other';
 catCounts[cat] = (catCounts[cat] || 0) + item.quantity;
 });
 });

 const sorted = Object.entries(catCounts).sort(([, a], [, b]) => b - a);
 if (sorted.length > 0) {
 setBestCategory({ name: sorted[0][0], count: sorted[0][1] });
 }
 }
 }

 // Avg Fulfillment Time: completed_at - created_at for completed orders
 const fulfillmentTimes = completed
 .filter(o => o.completed_at)
 .map(o => {
 const created = new Date(o.created_at).getTime();
 const completedAt = new Date(o.completed_at).getTime();
 return (completedAt - created) / (1000 * 60 * 60); // hours
 });
 const avgTime = fulfillmentTimes.length > 0
 ? fulfillmentTimes.reduce((sum, t) => sum + t, 0) / fulfillmentTimes.length
 : 0;
 setAvgFulfillmentTime(Math.round(avgTime * 10) / 10);

 // New Customer Rate: customers in this period who never ordered before
 const currentCustomerIds = new Set(customerIds);
 const prevCustomerIds = new Set(allTimeOrders?.map(o => o.customer_id) || []);
 const newCustomers = [...currentCustomerIds].filter(id => !prevCustomerIds.has(id)).length;
 const rate = currentCustomerIds.size > 0 ? (newCustomers / currentCustomerIds.size) * 100 : 0;
 setNewCustomerRate(Math.round(rate));

 // Calculate daily sales
 const locale = language === 'ar' ? 'ar-EG' : 'en-US';
 const salesByDate: { [key: string]: number } = {};
 completed.forEach(order => {
 const date = new Date(order.created_at).toLocaleDateString(locale, {
 month: 'short',
 day: 'numeric',
 });
 salesByDate[date] = (salesByDate[date] || 0) + order.total_amount;
 });

 const dailySalesArray = Object.entries(salesByDate)
 .map(([date, sales]) => ({ date, sales }))
 .slice(-7);

 setDailySales(dailySalesArray);

 // Calculate peak hours
 const hourCounts: { [key: string]: number } = {};
 orders.forEach(order => {
 const hour = new Date(order.created_at).getHours();
 const hourRange = `${hour}:00-${hour + 1}:00`;
 hourCounts[hourRange] = (hourCounts[hourRange] || 0) + 1;
 });

 const peakHoursArray = Object.entries(hourCounts)
 .map(([hour, count]) => ({ hour, count }))
 .sort((a, b) => b.count - a.count)
 .slice(0, 3);

 setPeakHours(peakHoursArray);

 // Calculate top products
 const productSales: { [key: string]: { name: string; image?: string; sold: number; revenue: number } } = {};

 completed.forEach(order => {
 order.items.forEach((item: any) => {
 if (!productSales[item.product_id]) {
 productSales[item.product_id] = {
 name: item.product_name,
 image: item.product_image,
 sold: 0,
 revenue: 0,
 };
 }
 productSales[item.product_id].sold += item.quantity;
 productSales[item.product_id].revenue += item.price * item.quantity;
 });
 });

 const topProductsArray = Object.entries(productSales)
 .map(([id, data]) => ({
 product_id: id,
 product_name: data.name,
 product_image: data.image,
 total_sold: data.sold,
 revenue: data.revenue,
 }))
 .sort((a, b) => b.total_sold - a.total_sold)
 .slice(0, 5);

 setTopProducts(topProductsArray);
 }
 } catch (error) {
 console.error('Error fetching analytics:', error);
 setToast({ message: t('common.error'), type: 'error' });
 }
 };

 const getMaxSales = () => {
 return Math.max(...dailySales.map(d => d.sales), 1);
 };

 const getMaxProductSold = () => {
 return Math.max(...topProducts.map(p => p.total_sold), 1);
 };

 if (loading) {
 return (
 <div className="bg-background-light flex items-center justify-center min-h-[60vh]">
 <div className="text-center">
 <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
 <p className="text-text-light-secondary">{t('common.loading')}</p>
 </div>
 </div>
 );
 }

 const completionRate = analytics.totalOrders > 0
 ? ((analytics.completedOrders / analytics.totalOrders) * 100).toFixed(0)
 : 0;
 const cancellationRate = analytics.totalOrders > 0
 ? ((analytics.cancelledOrders / analytics.totalOrders) * 100).toFixed(0)
 : 0;
 const expiredRate = analytics.totalOrders > 0
 ? ((analytics.expiredOrders / analytics.totalOrders) * 100).toFixed(0)
 : 0;
 const returningRate = analytics.uniqueCustomers > 0
 ? ((analytics.returningCustomers / analytics.uniqueCustomers) * 100).toFixed(0)
 : 0;

 return (
 <div className="bg-background-light">
 {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

 {/* Header */}
 <div className="bg-card-light border-b border-border-light">
 <div className="px-4 py-4">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold text-text-light-primary">
 {t('merchant.analytics.title')}
 </h1>
 <p className="text-text-light-secondary text-sm mt-0.5">
 {t('merchant.analytics.subtitle')}
 </p>
 </div>

 {/* Period Selector */}
 <select
 value={period}
 onChange={(e) => setPeriod(e.target.value as Period)}
 className="px-4 py-2 rounded-lg border border-border-light bg-card-light text-text-light-primary font-medium text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
 >
 {PERIODS.map((p) => (
 <option key={p.value} value={p.value}>{p.label}</option>
 ))}
 </select>
 </div>
 </div>
 </div>

 <main className="p-4 max-w-7xl mx-auto space-y-5 pb-8">
 {/* Main Stats Grid */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 <div className="bg-card-light rounded-xl p-4 border border-border-light">
 <div className="flex items-center gap-2 mb-2">
 <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
 <span className="material-symbols-outlined text-primary text-base">payments</span>
 </div>
 </div>
 <p className="text-2xl font-bold text-text-light-primary">
 {analytics.totalRevenue.toFixed(0)}
 </p>
 <p className="text-xs text-text-light-secondary">{t('merchant.analytics.revenue')} ({t('common.egp')})</p>
 </div>

 <div className="bg-card-light rounded-xl p-4 border border-border-light">
 <div className="flex items-center gap-2 mb-2">
 <div className="w-8 h-8 bg-green-900/30 rounded-lg flex items-center justify-center">
 <span className="material-symbols-outlined text-green-400 text-base">check_circle</span>
 </div>
 </div>
 <p className="text-2xl font-bold text-text-light-primary">{analytics.completedOrders}</p>
 <p className="text-xs text-text-light-secondary">{t('merchant.analytics.completedOrders')}</p>
 </div>

 <div className="bg-card-light rounded-xl p-4 border border-border-light">
 <div className="flex items-center gap-2 mb-2">
 <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
 <span className="material-symbols-outlined text-primary text-base">trending_up</span>
 </div>
 </div>
 <p className="text-2xl font-bold text-text-light-primary">
 {analytics.avgOrderValue.toFixed(0)}
 </p>
 <p className="text-xs text-text-light-secondary">{t('merchant.analytics.avgOrder')} ({t('common.egp')})</p>
 </div>

 <div className="bg-card-light rounded-xl p-4 border border-border-light">
 <div className="flex items-center gap-2 mb-2">
 <div className="w-8 h-8 bg-yellow-900/30 rounded-lg flex items-center justify-center">
 <span className="material-symbols-outlined text-yellow-400 text-base">account_balance</span>
 </div>
 </div>
 <p className="text-2xl font-bold text-text-light-primary">
 {analytics.totalCommission.toFixed(0)}
 </p>
 <p className="text-xs text-text-light-secondary">{t('merchant.analytics.commission')} ({t('common.egp')})</p>
 </div>
 </div>

 {/* Enhanced Metrics Grid */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 {/* Revenue Trend */}
 <div className="bg-card-light rounded-xl p-4 border border-border-light">
 <div className="flex items-center gap-2 mb-2">
 <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${revenueTrend >= 0 ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
 <span className={`material-symbols-outlined text-base ${revenueTrend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
 {revenueTrend >= 0 ? 'trending_up' : 'trending_down'}
 </span>
 </div>
 </div>
 <p className={`text-2xl font-bold ${revenueTrend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
 {revenueTrend > 0 ? '+' : ''}{revenueTrend}%
 </p>
 <p className="text-xs text-text-light-secondary">{t('merchant.analytics.revenueTrend')}</p>
 </div>

 {/* Best Category */}
 <div className="bg-card-light rounded-xl p-4 border border-border-light">
 <div className="flex items-center gap-2 mb-2">
 <div className="w-8 h-8 bg-purple-900/30 rounded-lg flex items-center justify-center">
 <span className="material-symbols-outlined text-purple-400 text-base">category</span>
 </div>
 </div>
 <p className="text-lg font-bold text-text-light-primary truncate">
 {bestCategory?.name || '-'}
 </p>
 <p className="text-xs text-text-light-secondary">
 {t('merchant.analytics.bestCategory')} {bestCategory ? `(${bestCategory.count} ${t('merchant.analytics.pieces')})` : ''}
 </p>
 </div>

 {/* Avg Fulfillment Time */}
 <div className="bg-card-light rounded-xl p-4 border border-border-light">
 <div className="flex items-center gap-2 mb-2">
 <div className="w-8 h-8 bg-blue-900/30 rounded-lg flex items-center justify-center">
 <span className="material-symbols-outlined text-blue-400 text-base">timer</span>
 </div>
 </div>
 <p className="text-2xl font-bold text-text-light-primary">
 {avgFulfillmentTime}
 </p>
 <p className="text-xs text-text-light-secondary">{t('merchant.analytics.fulfillmentTime')} ({t('merchant.analytics.hours')})</p>
 </div>

 {/* New Customer Rate */}
 <div className="bg-card-light rounded-xl p-4 border border-border-light">
 <div className="flex items-center gap-2 mb-2">
 <div className="w-8 h-8 bg-cyan-900/30 rounded-lg flex items-center justify-center">
 <span className="material-symbols-outlined text-cyan-400 text-base">person_add</span>
 </div>
 </div>
 <p className="text-2xl font-bold text-text-light-primary">
 {newCustomerRate}%
 </p>
 <p className="text-xs text-text-light-secondary">{t('merchant.analytics.acquisitionRate')}</p>
 </div>
 </div>

 {/* Daily Sales Chart */}
 <div className="bg-card-light rounded-xl p-5 border border-border-light">
 <h2 className="text-lg font-bold text-text-light-primary mb-4">
 {t('merchant.analytics.dailySales')}
 </h2>

 {dailySales.length > 0 ? (
 <div className="space-y-3">
 {dailySales.map((day, index) => {
 const percentage = (day.sales / getMaxSales()) * 100;
 return (
 <div key={index}>
 <div className="flex items-center justify-between text-sm mb-1">
 <span className="text-text-light-secondary">{day.date}</span>
 <span className="font-bold text-text-light-primary">
 {day.sales.toFixed(0)} {t('common.egp')}
 </span>
 </div>
 <div className="w-full bg-surface-light rounded-full h-2">
 <div
 className="bg-primary rounded-full h-2 transition-all duration-300"
 style={{ width: `${percentage}%` }}
 ></div>
 </div>
 </div>
 );
 })}
 </div>
 ) : (
 <p className="text-center text-text-light-secondary py-8">{t('merchant.analytics.noSales')}</p>
 )}
 </div>

 {/* Top Products */}
 <div className="bg-card-light rounded-xl p-5 border border-border-light">
 <h2 className="text-lg font-bold text-text-light-primary mb-4">
 {t('merchant.analytics.topProducts')}
 </h2>

 {topProducts.length > 0 ? (
 <div className="space-y-4">
 {topProducts.map((product, index) => {
 const percentage = (product.total_sold / getMaxProductSold()) * 100;
 return (
 <div key={product.product_id}>
 <div className="flex items-center gap-3 mb-2">
 <span className="text-xl font-bold text-text-light-secondary">{index + 1}</span>
 {product.product_image && (
 <img
 src={product.product_image}
 alt={product.product_name}
 className="w-10 h-10 object-cover rounded-lg"
 />
 )}
 <div className="flex-1 min-w-0">
 <p className="text-sm font-medium text-text-light-primary truncate">
 {product.product_name}
 </p>
 <p className="text-xs text-text-light-secondary">
 {product.total_sold} {t('merchant.analytics.pieces')} &bull; {product.revenue.toFixed(0)} {t('common.egp')}
 </p>
 </div>
 </div>
 <div className="w-full bg-surface-light rounded-full h-2">
 <div
 className="bg-gradient-to-r from-primary to-green-500 rounded-full h-2 transition-all duration-300"
 style={{ width: `${percentage}%` }}
 ></div>
 </div>
 </div>
 );
 })}
 </div>
 ) : (
 <p className="text-center text-text-light-secondary py-8">{t('merchant.analytics.noSales')}</p>
 )}
 </div>

 {/* Order Status & Peak Hours */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
 {/* Order Status */}
 <div className="bg-card-light rounded-xl p-5 border border-border-light">
 <h2 className="text-lg font-bold text-text-light-primary mb-4">
 {t('merchant.analytics.orderStatus')}
 </h2>
 <div className="space-y-3">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 bg-green-500 rounded-full"></div>
 <span className="text-sm text-text-light-secondary">{t('merchant.analytics.completed')}</span>
 </div>
 <span className="font-bold text-text-light-primary">{completionRate}%</span>
 </div>
 <div className="w-full bg-surface-light rounded-full h-2">
 <div
 className="bg-green-500 rounded-full h-2 transition-all"
 style={{ width: `${completionRate}%` }}
 ></div>
 </div>

 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 bg-red-500 rounded-full"></div>
 <span className="text-sm text-text-light-secondary">{t('merchant.analytics.cancelled')}</span>
 </div>
 <span className="font-bold text-text-light-primary">{cancellationRate}%</span>
 </div>
 <div className="w-full bg-surface-light rounded-full h-2">
 <div
 className="bg-red-500 rounded-full h-2 transition-all"
 style={{ width: `${cancellationRate}%` }}
 ></div>
 </div>

 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
 <span className="text-sm text-text-light-secondary">{t('merchant.analytics.expired')}</span>
 </div>
 <span className="font-bold text-text-light-primary">{expiredRate}%</span>
 </div>
 <div className="w-full bg-surface-light rounded-full h-2">
 <div
 className="bg-yellow-500 rounded-full h-2 transition-all"
 style={{ width: `${expiredRate}%` }}
 ></div>
 </div>
 </div>
 </div>

 {/* Peak Hours */}
 <div className="bg-card-light rounded-xl p-5 border border-border-light">
 <h2 className="text-lg font-bold text-text-light-primary mb-4">
 {t('merchant.analytics.peakHours')}
 </h2>
 {peakHours.length > 0 ? (
 <div className="space-y-3">
 {peakHours.map((peak, index) => (
 <div key={index} className="flex items-center justify-between p-3 bg-surface-light rounded-lg">
 <span className="text-sm text-text-light-secondary">{peak.hour}</span>
 <span className="font-bold text-primary">{peak.count} {t('merchant.analytics.orders')}</span>
 </div>
 ))}
 </div>
 ) : (
 <p className="text-center text-text-light-secondary py-8">{t('merchant.analytics.noData')}</p>
 )}
 </div>
 </div>

 {/* Customers */}
 <div className="bg-card-light rounded-xl p-5 border border-border-light">
 <h2 className="text-lg font-bold text-text-light-primary mb-4">
 {t('merchant.analytics.customers')}
 </h2>
 <div className="grid grid-cols-2 gap-4">
 <div className="text-center p-4 bg-blue-900/20 rounded-lg">
 <p className="text-3xl font-bold text-primary">
 {analytics.uniqueCustomers}
 </p>
 <p className="text-sm text-text-light-secondary mt-1">{t('merchant.analytics.uniqueCustomers')}</p>
 </div>
 <div className="text-center p-4 bg-green-900/20 rounded-lg">
 <p className="text-3xl font-bold text-green-400">
 {returningRate}%
 </p>
 <p className="text-sm text-text-light-secondary mt-1">{t('merchant.analytics.returningCustomers')}</p>
 </div>
 </div>
 </div>

 {/* Net Profit */}
 <div className="bg-gradient-to-r from-primary to-green-600 rounded-xl p-6 text-white">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-white/80 text-sm mb-1">{t('merchant.analytics.netProfit')}</p>
 <p className="text-4xl font-bold">
 {(analytics.totalRevenue - analytics.totalCommission).toFixed(2)} {t('common.egp')}
 </p>
 </div>
 <span className="material-symbols-outlined text-6xl text-white/20">trending_up</span>
 </div>
 </div>
 </main>
 </div>
 );
}
