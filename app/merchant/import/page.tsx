'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import * as XLSX from 'xlsx';
import Toast from '@/components/Toast';

interface ParsedProduct {
    name: string;
    sku: string;
    price: number;
    old_price?: number;
    stock_quantity: number;
    description?: string;
    category?: string;
    sizes?: string[];
    colors?: string[];
    _status?: 'new' | 'update';
    _existingId?: string;
}

interface ColumnMapping {
    name: string;
    sku: string;
    price: string;
    old_price: string;
    stock_quantity: string;
    description: string;
    category: string;
    sizes: string;
    colors: string;
}

const FIELD_LABELS: Record<keyof ColumnMapping, { label: string; required: boolean }> = {
    name: { label: 'اسم المنتج', required: true },
    sku: { label: 'كود المنتج (SKU)', required: false },
    price: { label: 'السعر', required: true },
    old_price: { label: 'السعر القديم', required: false },
    stock_quantity: { label: 'الكمية', required: true },
    description: { label: 'الوصف', required: false },
    category: { label: 'القسم', required: false },
    sizes: { label: 'المقاسات', required: false },
    colors: { label: 'الألوان', required: false },
};

export default function ImportPage() {
    const [storeId, setStoreId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    // File parsing state
    const [fileHeaders, setFileHeaders] = useState<string[]>([]);
    const [rawData, setRawData] = useState<Record<string, any>[]>([]);
    const [fileName, setFileName] = useState('');

    // Column mapping
    const [mapping, setMapping] = useState<ColumnMapping>({
        name: '', sku: '', price: '', old_price: '',
        stock_quantity: '', description: '', category: '', sizes: '', colors: '',
    });

    // Parsed & ready products
    const [products, setProducts] = useState<ParsedProduct[]>([]);
    const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'done'>('upload');

    // Import results
    const [results, setResults] = useState({ created: 0, updated: 0, errors: 0 });

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
            if (store) setStoreId(store.id);
            setLoading(false);
        };
        init();
    }, [supabase]);

    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = evt.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

                if (jsonData.length === 0) {
                    setToast({ message: 'الملف فارغ', type: 'error' });
                    return;
                }

                const headers = Object.keys(jsonData[0]);
                setFileHeaders(headers);
                setRawData(jsonData);

                // Auto-map columns by common names
                const autoMapping: ColumnMapping = { ...mapping };
                const nameMatches = ['name', 'اسم', 'اسم المنتج', 'product name', 'product', 'item', 'item name', 'description1'];
                const skuMatches = ['sku', 'كود', 'barcode', 'باركود', 'code', 'item code', 'product code', 'رمز'];
                const priceMatches = ['price', 'سعر', 'السعر', 'sell price', 'selling price', 'retail price'];
                const oldPriceMatches = ['old_price', 'old price', 'السعر القديم', 'original price', 'cost'];
                const qtyMatches = ['stock', 'quantity', 'كمية', 'الكمية', 'stock_quantity', 'qty', 'المخزون', 'count'];
                const descMatches = ['description', 'وصف', 'الوصف', 'desc', 'details'];
                const catMatches = ['category', 'قسم', 'القسم', 'type', 'group', 'التصنيف'];
                const sizeMatches = ['size', 'sizes', 'مقاس', 'المقاس', 'المقاسات'];
                const colorMatches = ['color', 'colors', 'لون', 'اللون', 'الألوان'];

                headers.forEach(h => {
                    const lower = h.toLowerCase().trim();
                    if (nameMatches.includes(lower)) autoMapping.name = h;
                    if (skuMatches.includes(lower)) autoMapping.sku = h;
                    if (priceMatches.includes(lower)) autoMapping.price = h;
                    if (oldPriceMatches.includes(lower)) autoMapping.old_price = h;
                    if (qtyMatches.includes(lower)) autoMapping.stock_quantity = h;
                    if (descMatches.includes(lower)) autoMapping.description = h;
                    if (catMatches.includes(lower)) autoMapping.category = h;
                    if (sizeMatches.includes(lower)) autoMapping.sizes = h;
                    if (colorMatches.includes(lower)) autoMapping.colors = h;
                });

                setMapping(autoMapping);
                setStep('mapping');
                setToast({ message: `تم قراءة ${jsonData.length} صف من الملف`, type: 'success' });
            } catch (err) {
                console.error('Error parsing file:', err);
                setToast({ message: 'حدث خطأ في قراءة الملف. تأكد أنه ملف Excel أو CSV صحيح.', type: 'error' });
            }
        };
        reader.readAsBinaryString(file);
    }, [mapping]);

    const handleMapping = async () => {
        if (!mapping.name || !mapping.price || !mapping.stock_quantity) {
            setToast({ message: 'يجب تحديد أعمدة: اسم المنتج، السعر، والكمية', type: 'error' });
            return;
        }

        const parsed: ParsedProduct[] = [];
        const skus = rawData
            .map(row => row[mapping.sku]?.toString().trim())
            .filter(Boolean);

        // Check existing products by SKU
        let existingProducts: Record<string, string> = {};
        if (skus.length > 0 && storeId) {
            const { data } = await supabase
                .from('products')
                .select('id, sku')
                .eq('store_id', storeId)
                .in('sku', skus);
            if (data) {
                data.forEach(p => {
                    if (p.sku) existingProducts[p.sku] = p.id;
                });
            }
        }

        for (const row of rawData) {
            const name = row[mapping.name]?.toString().trim();
            const price = parseFloat(row[mapping.price]);
            const qty = parseInt(row[mapping.stock_quantity]);

            if (!name || isNaN(price) || isNaN(qty)) continue;

            const sku = mapping.sku ? row[mapping.sku]?.toString().trim() || '' : '';
            const isExisting = sku && existingProducts[sku];

            let sizes: string[] | undefined;
            if (mapping.sizes && row[mapping.sizes]) {
                const sizeStr = row[mapping.sizes].toString();
                sizes = sizeStr.split(/[,،\s]+/).map((s: string) => s.trim()).filter(Boolean);
            }

            let colors: string[] | undefined;
            if (mapping.colors && row[mapping.colors]) {
                const colorStr = row[mapping.colors].toString();
                colors = colorStr.split(/[,،\s]+/).map((c: string) => c.trim()).filter(Boolean);
            }

            parsed.push({
                name,
                sku,
                price,
                old_price: mapping.old_price ? parseFloat(row[mapping.old_price]) || undefined : undefined,
                stock_quantity: qty,
                description: mapping.description ? row[mapping.description]?.toString() || '' : '',
                category: mapping.category ? row[mapping.category]?.toString() || '' : '',
                sizes,
                colors,
                _status: isExisting ? 'update' : 'new',
                _existingId: isExisting ? existingProducts[sku] : undefined,
            });
        }

        if (parsed.length === 0) {
            setToast({ message: 'لم يتم العثور على منتجات صالحة في الملف', type: 'error' });
            return;
        }

        setProducts(parsed);
        setStep('preview');
    };

    const handleImport = async () => {
        if (!storeId) return;
        setImporting(true);

        let created = 0, updated = 0, errors = 0;

        for (const product of products) {
            try {
                const productData: any = {
                    store_id: storeId,
                    name: product.name,
                    price: product.price,
                    stock_quantity: product.stock_quantity,
                    is_active: true,
                    image_urls: [],
                };

                if (product.sku) productData.sku = product.sku;
                if (product.old_price) productData.old_price = product.old_price;
                if (product.description) productData.description = product.description;
                if (product.category) productData.category = product.category;
                if (product.sizes?.length) productData.sizes = product.sizes;
                if (product.colors?.length) productData.colors = product.colors;

                if (product._status === 'update' && product._existingId) {
                    const { error } = await supabase
                        .from('products')
                        .update(productData)
                        .eq('id', product._existingId);
                    if (error) throw error;
                    updated++;
                } else {
                    const { error } = await supabase
                        .from('products')
                        .insert(productData);
                    if (error) throw error;
                    created++;
                }
            } catch (err) {
                console.error('Error importing product:', product.name, err);
                errors++;
            }
        }

        setResults({ created, updated, errors });
        setStep('done');
        setImporting(false);
    };

    const resetAll = () => {
        setStep('upload');
        setFileHeaders([]);
        setRawData([]);
        setProducts([]);
        setFileName('');
        setMapping({
            name: '', sku: '', price: '', old_price: '',
            stock_quantity: '', description: '', category: '', sizes: '', colors: '',
        });
        setResults({ created: 0, updated: 0, errors: 0 });
    };

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
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-text-light-primary text-right">
                    استيراد المنتجات
                </h1>
                <p className="text-text-light-secondary text-right mt-1">
                    ارفع ملف Excel أو CSV من السيستم بتاعك وهنضيف المنتجات أوتوماتيك
                </p>
            </div>

            {/* Steps indicator */}
            <div className="flex items-center justify-center gap-2 mb-8">
                {['upload', 'mapping', 'preview', 'done'].map((s, i) => (
                    <div key={s} className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === s ? 'bg-primary text-white' :
                            ['upload', 'mapping', 'preview', 'done'].indexOf(step) > i ? 'bg-green-500 text-white' :
                                'bg-card-light text-text-light-secondary border border-border-light'
                            }`}>
                            {['upload', 'mapping', 'preview', 'done'].indexOf(step) > i ? '✓' : i + 1}
                        </div>
                        {i < 3 && <div className="w-8 h-px bg-border-light" />}
                    </div>
                ))}
            </div>

            {/* Step 1: Upload */}
            {step === 'upload' && (
                <div className="bg-card-light rounded-xl p-8 border border-border-light text-center">
                    <span className="material-symbols-outlined text-6xl text-primary mb-4 block">upload_file</span>
                    <h2 className="text-xl font-bold text-text-light-primary mb-2">ارفع ملف المنتجات</h2>
                    <p className="text-text-light-secondary mb-6">
                        يدعم ملفات Excel (.xlsx, .xls) و CSV
                    </p>

                    <label className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg cursor-pointer hover:bg-primary/90 transition-colors">
                        <span className="material-symbols-outlined">folder_open</span>
                        اختر ملف
                        <input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                    </label>

                    <div className="mt-8 p-4 bg-background-light rounded-lg text-right">
                        <h3 className="font-bold text-text-light-primary mb-2">نصائح:</h3>
                        <ul className="text-sm text-text-light-secondary space-y-1">
                            <li>- تأكد أن الملف يحتوي على أعمدة: اسم المنتج، السعر، والكمية (كحد أدنى)</li>
                            <li>- لو عندك كود SKU في السيستم، ضيفه عشان نقدر نحدث المنتجات بعدين</li>
                            <li>- المنتجات هتتعمل بدون صور - تقدر تضيف الصور بعدين من صفحة التعديل</li>
                            <li>- لو رفعت نفس الملف تاني، المنتجات اللي ليها نفس الـ SKU هتتحدث مش هتتكرر</li>
                        </ul>
                    </div>
                </div>
            )}

            {/* Step 2: Column Mapping */}
            {step === 'mapping' && (
                <div className="bg-card-light rounded-xl p-6 border border-border-light">
                    <h2 className="text-xl font-bold text-text-light-primary mb-2 text-right">
                        ربط الأعمدة
                    </h2>
                    <p className="text-text-light-secondary text-right mb-6">
                        ملف: <span className="font-medium text-text-light-primary">{fileName}</span> ({rawData.length} صف)
                        <br />
                        اختر العمود المناسب لكل حقل
                    </p>

                    <div className="space-y-4">
                        {(Object.keys(FIELD_LABELS) as (keyof ColumnMapping)[]).map(field => (
                            <div key={field} className="flex items-center gap-4">
                                <label className="w-40 text-right text-sm font-medium text-text-light-primary shrink-0">
                                    {FIELD_LABELS[field].label}
                                    {FIELD_LABELS[field].required && <span className="text-red-500 mr-1">*</span>}
                                </label>
                                <select
                                    value={mapping[field]}
                                    onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
                                    className="flex-1 px-3 py-2 rounded-lg border border-border-light bg-background-light text-text-light-primary text-right focus:ring-2 focus:ring-primary"
                                >
                                    <option value="">-- لا يوجد --</option>
                                    {fileHeaders.map(h => (
                                        <option key={h} value={h}>{h}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>

                    {/* Preview first 3 rows */}
                    <div className="mt-6 overflow-x-auto">
                        <h3 className="text-sm font-bold text-text-light-secondary mb-2 text-right">معاينة أول 3 صفوف:</h3>
                        <table className="w-full text-sm border border-border-light rounded-lg overflow-hidden">
                            <thead>
                                <tr className="bg-background-light">
                                    {fileHeaders.map(h => (
                                        <th key={h} className="px-3 py-2 text-right text-text-light-secondary font-medium border-b border-border-light whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rawData.slice(0, 3).map((row, i) => (
                                    <tr key={i} className="border-b border-border-light">
                                        {fileHeaders.map(h => (
                                            <td key={h} className="px-3 py-2 text-right text-text-light-primary whitespace-nowrap">{row[h]?.toString() || '-'}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button onClick={resetAll} className="px-4 py-2 bg-card-light border border-border-light text-text-light-secondary rounded-lg hover:bg-background-light transition-colors">
                            رجوع
                        </button>
                        <button onClick={handleMapping} className="flex-1 px-4 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors">
                            معاينة المنتجات
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Preview */}
            {step === 'preview' && (
                <div className="bg-card-light rounded-xl p-6 border border-border-light">
                    <h2 className="text-xl font-bold text-text-light-primary mb-2 text-right">معاينة قبل الاستيراد</h2>
                    <div className="flex gap-4 mb-4 text-sm text-right">
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full">
                            جديد: {products.filter(p => p._status === 'new').length}
                        </span>
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full">
                            تحديث: {products.filter(p => p._status === 'update').length}
                        </span>
                        <span className="px-3 py-1 bg-card-light text-text-light-secondary rounded-full border border-border-light">
                            الإجمالي: {products.length}
                        </span>
                    </div>

                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-card-light">
                                <tr className="border-b border-border-light">
                                    <th className="px-3 py-2 text-right text-text-light-secondary">الحالة</th>
                                    <th className="px-3 py-2 text-right text-text-light-secondary">الاسم</th>
                                    <th className="px-3 py-2 text-right text-text-light-secondary">SKU</th>
                                    <th className="px-3 py-2 text-right text-text-light-secondary">السعر</th>
                                    <th className="px-3 py-2 text-right text-text-light-secondary">الكمية</th>
                                    <th className="px-3 py-2 text-right text-text-light-secondary">القسم</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((p, i) => (
                                    <tr key={i} className="border-b border-border-light/50">
                                        <td className="px-3 py-2">
                                            {p._status === 'update' ? (
                                                <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">تحديث</span>
                                            ) : (
                                                <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">جديد</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2 text-right text-text-light-primary font-medium">{p.name}</td>
                                        <td className="px-3 py-2 text-right text-text-light-secondary">{p.sku || '-'}</td>
                                        <td className="px-3 py-2 text-right text-text-light-primary">{p.price} ج.م</td>
                                        <td className="px-3 py-2 text-right text-text-light-primary">{p.stock_quantity}</td>
                                        <td className="px-3 py-2 text-right text-text-light-secondary">{p.category || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mt-4 text-right">
                        <p className="text-sm text-yellow-400">
                            <span className="font-bold">تنبيه:</span> المنتجات هتتعمل بدون صور. تقدر تضيف الصور بعدين من صفحة تعديل المنتج.
                        </p>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button onClick={() => setStep('mapping')} className="px-4 py-2 bg-card-light border border-border-light text-text-light-secondary rounded-lg hover:bg-background-light transition-colors">
                            رجوع
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={importing}
                            className="flex-1 px-4 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {importing ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                    جاري الاستيراد...
                                </span>
                            ) : (
                                `استيراد ${products.length} منتج`
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 4: Done */}
            {step === 'done' && (
                <div className="bg-card-light rounded-xl p-8 border border-border-light text-center">
                    <span className="material-symbols-outlined text-6xl text-green-500 mb-4 block">check_circle</span>
                    <h2 className="text-xl font-bold text-text-light-primary mb-4">تم الاستيراد بنجاح!</h2>

                    <div className="flex justify-center gap-6 mb-6">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-green-500">{results.created}</p>
                            <p className="text-sm text-text-light-secondary">منتج جديد</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-blue-500">{results.updated}</p>
                            <p className="text-sm text-text-light-secondary">تم تحديثه</p>
                        </div>
                        {results.errors > 0 && (
                            <div className="text-center">
                                <p className="text-2xl font-bold text-red-500">{results.errors}</p>
                                <p className="text-sm text-text-light-secondary">خطأ</p>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 justify-center">
                        <button onClick={resetAll} className="px-6 py-2 bg-card-light border border-border-light text-text-light-secondary rounded-lg hover:bg-background-light transition-colors">
                            استيراد ملف آخر
                        </button>
                        <a href="/merchant/products" className="px-6 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors">
                            عرض المنتجات
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
