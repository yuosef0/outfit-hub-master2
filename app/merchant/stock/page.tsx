'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import * as XLSX from 'xlsx';
import Toast from '@/components/Toast';

interface Product {
    id: string;
    name: string;
    sku: string | null;
    stock_quantity: number;
    price: number;
    is_active: boolean;
    image_urls: string[];
}

interface StockChange {
    id: string;
    newQty: number;
}

export default function StockPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [storeId, setStoreId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [changes, setChanges] = useState<Record<string, number>>({});
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [mode, setMode] = useState<'manual' | 'file'>('manual');

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: store } = await supabase
                .from('stores')
                .select('id')
                .eq('merchant_id', user.id)
                .single();
            if (store) {
                setStoreId(store.id);
                await fetchProducts(store.id);
            }
            setLoading(false);
        };
        init();
    }, [supabase]);

    const fetchProducts = async (sid: string) => {
        const { data } = await supabase
            .from('products')
            .select('id, name, sku, stock_quantity, price, is_active, image_urls')
            .eq('store_id', sid)
            .order('name');
        if (data) setProducts(data);
    };

    const handleQtyChange = (productId: string, newQty: number) => {
        setChanges(prev => ({ ...prev, [productId]: newQty }));
    };

    const saveChanges = async () => {
        const entries = Object.entries(changes);
        if (entries.length === 0) {
            setToast({ message: 'لا توجد تغييرات للحفظ', type: 'info' });
            return;
        }

        setSaving(true);
        let successCount = 0;

        for (const [productId, newQty] of entries) {
            const { error } = await supabase
                .from('products')
                .update({ stock_quantity: newQty })
                .eq('id', productId);
            if (!error) successCount++;
        }

        setToast({ message: `تم تحديث ${successCount} منتج`, type: 'success' });
        setChanges({});
        if (storeId) await fetchProducts(storeId);
        setSaving(false);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const data = evt.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

                if (rows.length === 0) {
                    setToast({ message: 'الملف فارغ', type: 'error' });
                    return;
                }

                // Find SKU and quantity columns
                const headers = Object.keys(rows[0]);
                const skuCol = headers.find(h => ['sku', 'كود', 'barcode', 'باركود', 'code'].includes(h.toLowerCase().trim()));
                const qtyCol = headers.find(h => ['stock', 'quantity', 'كمية', 'الكمية', 'stock_quantity', 'qty', 'المخزون'].includes(h.toLowerCase().trim()));

                if (!skuCol || !qtyCol) {
                    setToast({ message: 'الملف لازم يحتوي على عمود SKU وعمود الكمية', type: 'error' });
                    return;
                }

                // Match with existing products
                const newChanges: Record<string, number> = {};
                let matched = 0;

                for (const row of rows) {
                    const sku = row[skuCol]?.toString().trim();
                    const qty = parseInt(row[qtyCol]);
                    if (!sku || isNaN(qty)) continue;

                    const product = products.find(p => p.sku === sku);
                    if (product) {
                        newChanges[product.id] = qty;
                        matched++;
                    }
                }

                if (matched === 0) {
                    setToast({ message: 'لم يتم مطابقة أي منتج. تأكد أن أكواد SKU في الملف متطابقة مع المنتجات.', type: 'error' });
                } else {
                    setChanges(newChanges);
                    setToast({ message: `تم مطابقة ${matched} منتج من ${rows.length} صف`, type: 'success' });
                }
            } catch (err) {
                setToast({ message: 'حدث خطأ في قراءة الملف', type: 'error' });
            }
        };
        reader.readAsBinaryString(file);
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
    );

    const changedCount = Object.keys(changes).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 pb-32">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="text-right flex-1">
                    <h1 className="text-2xl font-bold text-text-light-primary">تحديث المخزون</h1>
                    <p className="text-text-light-secondary text-sm mt-1">عدّل كميات المنتجات بسرعة</p>
                </div>
            </div>

            {/* Mode tabs */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setMode('manual')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'manual' ? 'bg-primary text-white' : 'bg-card-light text-text-light-secondary border border-border-light'}`}
                >
                    تعديل يدوي
                </button>
                <button
                    onClick={() => setMode('file')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'file' ? 'bg-primary text-white' : 'bg-card-light text-text-light-secondary border border-border-light'}`}
                >
                    رفع ملف
                </button>
            </div>

            {/* File upload mode */}
            {mode === 'file' && (
                <div className="bg-card-light rounded-xl p-5 border border-border-light mb-4 text-center">
                    <p className="text-text-light-secondary text-sm mb-3 text-right">
                        ارفع ملف CSV/Excel يحتوي على عمود SKU وعمود الكمية الجديدة
                    </p>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg cursor-pointer hover:bg-primary/90 text-sm">
                        <span className="material-symbols-outlined text-lg">upload_file</span>
                        اختر ملف
                        <input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                    </label>
                </div>
            )}

            {/* Search */}
            <div className="relative mb-4">
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-light-secondary">search</span>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ابحث بالاسم أو كود SKU..."
                    className="w-full pr-10 pl-4 py-3 rounded-lg border border-border-light bg-card-light text-text-light-primary text-right focus:ring-2 focus:ring-primary"
                />
            </div>

            {/* Products list */}
            <div className="space-y-2">
                {filteredProducts.map(product => {
                    const currentQty = changes[product.id] ?? product.stock_quantity;
                    const isChanged = changes[product.id] !== undefined;

                    return (
                        <div key={product.id} className={`bg-card-light rounded-xl p-4 border flex items-center gap-3 ${isChanged ? 'border-primary/50' : 'border-border-light'}`}>
                            {/* Image */}
                            <div className="w-12 h-12 rounded-lg bg-background-light overflow-hidden shrink-0">
                                {product.image_urls?.[0] ? (
                                    <img src={product.image_urls[0]} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="material-symbols-outlined text-text-light-secondary text-xl">image</span>
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 text-right min-w-0">
                                <p className="font-medium text-text-light-primary text-sm truncate">{product.name}</p>
                                {product.sku && (
                                    <p className="text-xs text-text-light-secondary">{product.sku}</p>
                                )}
                            </div>

                            {/* Quantity controls */}
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={() => handleQtyChange(product.id, Math.max(0, currentQty - 1))}
                                    className="w-8 h-8 rounded-full bg-background-light border border-border-light flex items-center justify-center text-text-light-primary hover:bg-red-500/20 hover:border-red-500/50 transition-colors"
                                >
                                    -
                                </button>
                                <input
                                    type="number"
                                    value={currentQty}
                                    onChange={(e) => handleQtyChange(product.id, Math.max(0, parseInt(e.target.value) || 0))}
                                    className={`w-16 text-center py-1 rounded-lg border text-sm font-bold ${isChanged ? 'border-primary bg-primary/10 text-primary' : 'border-border-light bg-background-light text-text-light-primary'}`}
                                />
                                <button
                                    onClick={() => handleQtyChange(product.id, currentQty + 1)}
                                    className="w-8 h-8 rounded-full bg-background-light border border-border-light flex items-center justify-center text-text-light-primary hover:bg-green-500/20 hover:border-green-500/50 transition-colors"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {products.length === 0 && (
                <div className="text-center py-12 text-text-light-secondary">
                    <span className="material-symbols-outlined text-4xl mb-2 block">inventory_2</span>
                    <p>لا توجد منتجات</p>
                </div>
            )}

            {/* Save button - fixed at bottom */}
            {changedCount > 0 && (
                <div className="fixed bottom-20 left-0 right-0 p-4 z-50">
                    <div className="max-w-4xl mx-auto">
                        <button
                            onClick={saveChanges}
                            disabled={saving}
                            className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {saving ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                    جاري الحفظ...
                                </span>
                            ) : (
                                `حفظ التغييرات (${changedCount} منتج)`
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
