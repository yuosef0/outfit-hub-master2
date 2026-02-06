'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Toast from '@/components/Toast';

interface Category {
 id: string;
 name: string;
 name_ar: string | null;
 description: string | null;
 display_order: number;
 is_active: boolean;
 created_at: string;
}

export default function CategoriesPage() {
 const router = useRouter();
 const [loading, setLoading] = useState(true);
 const [storeId, setStoreId] = useState<string | null>(null);
 const [categories, setCategories] = useState<Category[]>([]);
 const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
 const [showModal, setShowModal] = useState(false);
 const [editingCategory, setEditingCategory] = useState<Category | null>(null);
 const [formData, setFormData] = useState({
 name: '',
 name_ar: '',
 description: '',
 display_order: 0,
 is_active: true,
 });

 const supabase = createBrowserClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 );

 useEffect(() => {
 checkStoreAndInit();
 }, []);

 const checkStoreAndInit = async () => {
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
 fetchCategories(store.id);
 } catch (error) {
 console.error('Error:', error);
 } finally {
 setLoading(false);
 }
 };

 const fetchCategories = async (storeIdToFetch: string) => {
 try {
 const { data, error } = await supabase
 .from('store_categories')
 .select('*')
 .eq('store_id', storeIdToFetch)
 .order('display_order', { ascending: true });

 if (error) throw error;
 setCategories(data || []);
 } catch (error: any) {
 console.error('Error fetching categories:', error);
 setToast({ message: 'حدث خطأ أثناء تحميل الفئات', type: 'error' });
 }
 };

 const handleOpenModal = (category?: Category) => {
 if (category) {
 setEditingCategory(category);
 setFormData({
 name: category.name,
 name_ar: category.name_ar || '',
 description: category.description || '',
 display_order: category.display_order,
 is_active: category.is_active,
 });
 } else {
 setEditingCategory(null);
 setFormData({
 name: '',
 name_ar: '',
 description: '',
 display_order: categories.length,
 is_active: true,
 });
 }
 setShowModal(true);
 };

 const handleCloseModal = () => {
 setShowModal(false);
 setEditingCategory(null);
 setFormData({
 name: '',
 name_ar: '',
 description: '',
 display_order: 0,
 is_active: true,
 });
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!storeId) return;

 try {
 if (editingCategory) {
 // Update existing category
 const { error } = await supabase
 .from('store_categories')
 .update({
 name: formData.name,
 name_ar: formData.name_ar || null,
 description: formData.description || null,
 display_order: formData.display_order,
 is_active: formData.is_active,
 })
 .eq('id', editingCategory.id);

 if (error) throw error;
 setToast({ message: '✅ تم تحديث الفئة بنجاح', type: 'success' });
 } else {
 // Create new category
 const { error } = await supabase
 .from('store_categories')
 .insert({
 store_id: storeId,
 name: formData.name,
 name_ar: formData.name_ar || null,
 description: formData.description || null,
 display_order: formData.display_order,
 is_active: formData.is_active,
 });

 if (error) throw error;
 setToast({ message: '✅ تم إضافة الفئة بنجاح', type: 'success' });
 }

 handleCloseModal();
 fetchCategories(storeId);
 } catch (error: any) {
 console.error('Error saving category:', error);
 setToast({ message: error.message || 'حدث خطأ أثناء حفظ الفئة', type: 'error' });
 }
 };

 const handleDelete = async (categoryId: string) => {
 if (!confirm('هل أنت متأكد من حذف هذه الفئة؟ سيتم إلغاء ربط جميع المنتجات بهذه الفئة.')) {
 return;
 }

 try {
 const { error } = await supabase
 .from('store_categories')
 .delete()
 .eq('id', categoryId);

 if (error) throw error;

 setToast({ message: '✅ تم حذف الفئة بنجاح', type: 'success' });
 if (storeId) fetchCategories(storeId);
 } catch (error: any) {
 console.error('Error deleting category:', error);
 setToast({ message: 'حدث خطأ أثناء حذف الفئة', type: 'error' });
 }
 };

 const toggleActive = async (category: Category) => {
 try {
 const { error } = await supabase
 .from('store_categories')
 .update({ is_active: !category.is_active })
 .eq('id', category.id);

 if (error) throw error;

 setToast({
 message: `✅ تم ${!category.is_active ? 'تفعيل' : 'إخفاء'} الفئة`,
 type: 'success'
 });
 if (storeId) fetchCategories(storeId);
 } catch (error: any) {
 console.error('Error toggling category:', error);
 setToast({ message: 'حدث خطأ', type: 'error' });
 }
 };

 if (loading) {
 return (
 <div className="flex items-center justify-center"style={{ minHeight: 'calc(100vh - 4rem)' }}>
 <div className="text-center">
 <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
 <p className="text-text-light-secondary">جاري التحميل...</p>
 </div>
 </div>
 );
 }

 return (
 <div className="bg-background-light min-h-screen">
 {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

 {/* Header */}
 <div className="bg-card-light border-b border-border-light sticky top-0 z-10">
 <div className="px-4 py-4">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold text-text-light-primary ">
 📂 إدارة الفئات
 </h1>
 <p className="text-text-light-secondary text-sm mt-0.5">
 قسّم منتجاتك إلى فئات (رجالي، حريمي، أطفال...)
 </p>
 </div>
 <button
 onClick={() => handleOpenModal()}
 className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-bold flex items-center gap-2"
 >
 <span className="material-symbols-outlined">add</span>
 إضافة فئة
 </button>
 </div>
 </div>
 </div>

 <main className="p-4 max-w-5xl mx-auto">
 {categories.length === 0 ? (
 <div className="bg-card-light rounded-xl p-12 text-center border border-border-light">
 <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
 <span className="material-symbols-outlined text-5xl text-primary">category</span>
 </div>
 <h2 className="text-xl font-bold text-text-light-primary mb-2">
 لا توجد فئات بعد
 </h2>
 <p className="text-text-light-secondary mb-6">
 ابدأ بإنشاء فئات لتنظيم منتجاتك
 </p>
 <button
 onClick={() => handleOpenModal()}
 className="px-8 py-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-bold"
 >
 إنشاء أول فئة
 </button>
 </div>
 ) : (
 <div className="grid gap-4">
 {categories.map((category) => (
 <div
 key={category.id}
 className="bg-card-light rounded-xl p-5 border border-border-light hover:shadow-lg transition-shadow"
 >
 <div className="flex items-start justify-between">
 <div className="flex items-start gap-4 flex-1">
 <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
 <span className="material-symbols-outlined text-2xl text-primary">category</span>
 </div>
 <div className="flex-1">
 <div className="flex items-center gap-2 mb-1">
 <h3 className="text-lg font-bold text-text-light-primary ">
 {category.name_ar || category.name}
 </h3>
 {!category.is_active && (
 <span className="px-2 py-0.5 bg-surface-light text-text-light-secondary text-xs rounded-full">
 مخفية
 </span>
 )}
 </div>
 {category.name_ar && (
 <p className="text-sm text-text-light-secondary">
 {category.name}
 </p>
 )}
 {category.description && (
 <p className="text-sm text-text-light-secondary mt-2">
 {category.description}
 </p>
 )}
 <p className="text-xs text-text-light-secondary mt-2">
 ترتيب العرض: {category.display_order}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <button
 onClick={() => toggleActive(category)}
 className={`p-2 rounded-lg transition-colors ${
 category.is_active
 ? 'bg-green-900/20 text-green-400'
 : 'bg-card-light text-text-light-secondary'
 }`}
 title={category.is_active ? 'إخفاء' : 'إظهار'}
 >
 <span className="material-symbols-outlined text-xl">
 {category.is_active ? 'visibility' : 'visibility_off'}
 </span>
 </button>
 <button
 onClick={() => handleOpenModal(category)}
 className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
 >
 <span className="material-symbols-outlined text-xl">edit</span>
 </button>
 <button
 onClick={() => handleDelete(category.id)}
 className="p-2 bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/40 transition-colors"
 >
 <span className="material-symbols-outlined text-xl">delete</span>
 </button>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </main>

 {/* Modal */}
 {showModal && (
 <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
 <div className="bg-card-light rounded-xl p-6 max-w-md w-full border border-border-light">
 <h2 className="text-xl font-bold text-text-light-primary mb-4">
 {editingCategory ? 'تعديل الفئة' : 'إضافة فئة جديدة'}
 </h2>

 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-text-light-primary mb-2 text-right">
 اسم الفئة بالعربي *
 </label>
 <input
 type="text"
 value={formData.name_ar}
 onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
 className="w-full px-4 py-3 rounded-lg border border-border-light bg-background-light text-text-light-primary focus:ring-2 focus:ring-primary focus:border-transparent text-right"
 placeholder="مثال: ملابس رجالي"
 required
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-text-light-primary mb-2 text-right">
 اسم الفئة بالإنجليزي *
 </label>
 <input
 type="text"
 value={formData.name}
 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
 className="w-full px-4 py-3 rounded-lg border border-border-light bg-background-light text-text-light-primary focus:ring-2 focus:ring-primary focus:border-transparent"
 placeholder="Example: Men's Clothing"
 required
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-text-light-primary mb-2 text-right">
 الوصف (اختياري)
 </label>
 <textarea
 value={formData.description}
 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
 className="w-full px-4 py-3 rounded-lg border border-border-light bg-background-light text-text-light-primary focus:ring-2 focus:ring-primary focus:border-transparent text-right"
 placeholder="وصف مختصر للفئة"
 rows={3}
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-text-light-primary mb-2 text-right">
 ترتيب العرض
 </label>
 <input
 type="number"
 value={formData.display_order}
 onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
 className="w-full px-4 py-3 rounded-lg border border-border-light bg-background-light text-text-light-primary focus:ring-2 focus:ring-primary focus:border-transparent"
 min="0"
 />
 </div>

 <div className="flex items-center gap-3">
 <label className="relative inline-flex items-center cursor-pointer">
 <input
 type="checkbox"
 checked={formData.is_active}
 onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
 className="sr-only peer"
 />
 <div className="w-11 h-6 bg-surface-light peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card-light after:border-border-light after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
 <span className="mr-3 text-sm font-medium text-text-light-primary">
 فئة نشطة
 </span>
 </label>
 </div>

 <div className="flex gap-3 pt-4">
 <button
 type="button"
 onClick={handleCloseModal}
 className="flex-1 px-6 py-3 bg-surface-light text-text-light-primary rounded-lg hover:bg-surface-light transition-colors font-bold"
 >
 إلغاء
 </button>
 <button
 type="submit"
 className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-bold"
 >
 {editingCategory ? 'حفظ التعديلات' : 'إضافة الفئة'}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
}
