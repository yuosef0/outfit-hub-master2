'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import Toast from '@/components/Toast';
import type { StoreBranch } from '@/lib/types';
import { EGYPTIAN_GOVERNORATES } from '@/lib/types';

export default function MerchantBranchesPage() {
    const router = useRouter();
    const { t, language } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [storeId, setStoreId] = useState<string | null>(null);
    const [storeGovernorate, setStoreGovernorate] = useState('');
    const [storeDistrict, setStoreDistrict] = useState('');
    const [branches, setBranches] = useState<StoreBranch[]>([]);
    const [governorates, setGovernorates] = useState<any[]>([]);
    const [districts, setDistricts] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingBranch, setEditingBranch] = useState<StoreBranch | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        governorate: '',
        district: '',
        phone: '',
        maps_link: '',
    });

    const supabase = useMemo(
        () =>
            createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            ),
        []
    );

    useEffect(() => {
        initPage();
    }, []);

    const initPage = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/login'); return; }

            const { data: store } = await supabase
                .from('stores')
                .select('id, is_active, governorate, district')
                .eq('merchant_id', user.id)
                .single();

            if (!store) { router.push('/merchant/setup'); return; }
            if (!store.is_active) { router.push('/merchant/pending'); return; }

            setStoreId(store.id);
            setStoreGovernorate(store.governorate || '');
            setStoreDistrict(store.district || '');

            // Fetch governorates and districts
            const [govRes, distRes] = await Promise.all([
                supabase.from('governorates').select('*').eq('is_active', true).order('name'),
                supabase.from('districts').select('*').eq('is_active', true).order('name'),
            ]);

            // Use DB governorates if available, otherwise fallback to hardcoded list
            const govData = govRes.data && govRes.data.length > 0 ? govRes.data : EGYPTIAN_GOVERNORATES;
            setGovernorates(govData);
            setDistricts(distRes.data || []);

            // Fetch branches directly from Supabase (no API caching layer)
            try {
                const { data: branchesData } = await supabase
                    .from('store_branches')
                    .select('*')
                    .eq('store_id', store.id)
                    .eq('is_active', true)
                    .order('created_at', { ascending: true });
                setBranches(branchesData || []);
            } catch {
                setBranches([]);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getGovName = (code: string) => {
        const gov = governorates.find(g => g.code === code);
        if (!gov) return code;
        return language === 'ar' ? gov.name_ar : gov.name;
    };

    const getDistName = (name: string) => {
        const dist = districts.find(d => d.name === name);
        if (!dist) return name;
        return language === 'ar' ? dist.name_ar : dist.name;
    };

    const filteredDistricts = districts.filter(d => d.governorate_code === formData.governorate);

    const resetForm = () => {
        setFormData({ name: '', address: '', governorate: '', district: '', phone: '', maps_link: '' });
        setEditingBranch(null);
        setShowForm(false);
    };

    const openEditForm = (branch: StoreBranch) => {
        setEditingBranch(branch);
        setFormData({
            name: branch.name,
            address: branch.address,
            governorate: branch.governorate,
            district: branch.district || '',
            phone: branch.phone || '',
            maps_link: branch.maps_link || '',
        });
        setShowForm(true);
    };

    const getAuthToken = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token || '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!storeId || !formData.name || !formData.address || !formData.governorate) return;

        setSubmitting(true);
        try {
            const token = await getAuthToken();
            const method = editingBranch ? 'PUT' : 'POST';
            const body = editingBranch
                ? { branchId: editingBranch.id, ...formData }
                : formData;

            const res = await fetch(`/api/stores/${storeId}/branches`, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 409) {
                    setToast({ message: t('merchant.branches.duplicateLocation'), type: 'error' });
                    return;
                }

                if (data.details && Array.isArray(data.details)) {
                    const detailMsg = data.details.map((d: any) => `${d.path.join('.')}: ${d.message}`).join(', ');
                    throw new Error(detailMsg);
                }

                throw new Error(data.error || 'Error saving branch');
            }

            // Update local state directly with the returned branch data
            // No re-fetch needed - the API returns the exact saved data
            if (data.branch) {
                if (editingBranch) {
                    setBranches(prev => prev.map(b => b.id === editingBranch.id ? data.branch : b));
                } else {
                    setBranches(prev => [...prev, data.branch]);
                }
            }

            setToast({ message: t('merchant.branches.saved'), type: 'success' });
            resetForm();
        } catch (err: any) {
            console.error('Error saving branch:', err);
            setToast({ message: err.message || 'Error', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const deleteBranch = async (branchId: string) => {
        if (!confirm(t('merchant.branches.deleteConfirm'))) return;
        if (!storeId) return;

        try {
            const token = await getAuthToken();
            const res = await fetch(`/api/stores/${storeId}/branches?branchId=${branchId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error');

            setToast({ message: t('merchant.branches.deleted'), type: 'success' });
            setBranches(prev => prev.filter(b => b.id !== branchId));
        } catch (err: any) {
            console.error('Error deleting branch:', err);
            setToast({ message: err.message || 'Error', type: 'error' });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background-light">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-text-light-secondary">
                        {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-background-light pb-24">
            {/* Toast */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Header */}
            <div className="sticky top-0 z-50 bg-background-light/95 backdrop-blur-md border-b border-border-light">
                <div className="flex items-center justify-between px-4 py-3">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-card-light transition-colors"
                    >
                        <span className="material-symbols-outlined text-text-light-primary">
                            {language === 'ar' ? 'arrow_forward' : 'arrow_back'}
                        </span>
                    </button>
                    <div className="text-center">
                        <h1 className="text-lg font-bold text-text-light-primary">
                            {t('merchant.branches.title')}
                        </h1>
                        <p className="text-xs text-text-light-secondary">
                            {t('merchant.branches.subtitle')}
                        </p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowForm(true); }}
                        className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>add</span>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-4 py-6">
                <div className="max-w-2xl mx-auto space-y-4">

                    {/* Main Branch Card (read-only) */}
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>store</span>
                            <span className="font-bold text-text-light-primary text-sm">
                                {t('merchant.branches.mainBranch')}
                            </span>
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-semibold">
                                {language === 'ar' ? 'رئيسي' : 'Main'}
                            </span>
                        </div>
                        <div className="space-y-1 text-sm text-text-light-secondary">
                            {storeGovernorate && (
                                <p className="flex items-center gap-2">
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>location_on</span>
                                    {getGovName(storeGovernorate)}
                                    {storeDistrict && ` - ${getDistName(storeDistrict)}`}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Add/Edit Form */}
                    {showForm && (
                        <div className="p-4 bg-card-light border border-border-light rounded-xl space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-text-light-primary text-sm">
                                    {editingBranch ? t('merchant.branches.editBranch') : t('merchant.branches.addBranch')}
                                </h3>
                                <button onClick={resetForm} className="text-text-light-secondary hover:text-text-light-primary">
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Branch Name */}
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-text-light-primary">
                                        {t('merchant.branches.branchName')}
                                        <span className="text-red-500 mr-1">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder={language === 'ar' ? 'مثال: فرع المنيا' : 'e.g. Minya Branch'}
                                        className="w-full px-4 py-3 bg-background-light border border-border-light rounded-xl text-text-light-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-sm"
                                        required
                                    />
                                </div>

                                {/* Governorate */}
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-text-light-primary">
                                        {t('merchant.branches.governorate')}
                                        <span className="text-red-500 mr-1">*</span>
                                    </label>
                                    <select
                                        value={formData.governorate}
                                        onChange={(e) => setFormData({ ...formData, governorate: e.target.value, district: '' })}
                                        className="w-full px-4 py-3 bg-background-light border border-border-light rounded-xl text-text-light-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors appearance-none cursor-pointer text-sm"
                                        required
                                    >
                                        <option value="">
                                            {language === 'ar' ? 'اختر المحافظة' : 'Select Governorate'}
                                        </option>
                                        {governorates.map((gov) => (
                                            <option key={gov.code} value={gov.code}>
                                                {language === 'ar' ? gov.name_ar : gov.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* District */}
                                {formData.governorate && (
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-text-light-primary">
                                            {t('merchant.branches.district')}
                                            <span className="text-text-light-secondary text-xs mr-2">
                                                ({language === 'ar' ? 'اختياري' : 'Optional'})
                                            </span>
                                        </label>
                                        <select
                                            value={formData.district}
                                            onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                            className="w-full px-4 py-3 bg-background-light border border-border-light rounded-xl text-text-light-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors appearance-none cursor-pointer text-sm"
                                        >
                                            <option value="">
                                                {language === 'ar' ? 'اختر المركز (اختياري)' : 'Select District (Optional)'}
                                            </option>
                                            {filteredDistricts.map((dist) => (
                                                <option key={dist.id} value={dist.name}>
                                                    {language === 'ar' ? dist.name_ar : dist.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Address */}
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-text-light-primary">
                                        {t('merchant.branches.address')}
                                        <span className="text-red-500 mr-1">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder={language === 'ar' ? 'العنوان التفصيلي' : 'Detailed address'}
                                        className="w-full px-4 py-3 bg-background-light border border-border-light rounded-xl text-text-light-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-sm"
                                        required
                                    />
                                </div>

                                {/* Phone */}
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-text-light-primary">
                                        {t('merchant.branches.phone')}
                                    </label>
                                    <input
                                        type="tel"
                                        dir="ltr"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="01XXXXXXXXX"
                                        className="w-full px-4 py-3 bg-background-light border border-border-light rounded-xl text-text-light-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-sm"
                                    />
                                </div>

                                {/* Maps Link */}
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-text-light-primary">
                                        {t('merchant.branches.mapsLink')}
                                    </label>
                                    <input
                                        type="url"
                                        dir="ltr"
                                        value={formData.maps_link}
                                        onChange={(e) => setFormData({ ...formData, maps_link: e.target.value })}
                                        placeholder="https://maps.google.com/..."
                                        className="w-full px-4 py-3 bg-background-light border border-border-light rounded-xl text-text-light-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-sm"
                                    />
                                </div>

                                {/* Submit Buttons */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                                    >
                                        {submitting
                                            ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                                            : (language === 'ar' ? 'حفظ' : 'Save')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-6 py-3 bg-card-light border border-border-light text-text-light-primary rounded-xl font-semibold text-sm hover:bg-background-light transition-colors"
                                    >
                                        {language === 'ar' ? 'إلغاء' : 'Cancel'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Branches List */}
                    {branches.length === 0 && !showForm ? (
                        <div className="text-center py-12">
                            <span className="material-symbols-outlined text-text-light-secondary mb-3" style={{ fontSize: '48px' }}>location_city</span>
                            <p className="text-text-light-secondary text-sm">
                                {t('merchant.branches.noBranches')}
                            </p>
                            <button
                                onClick={() => setShowForm(true)}
                                className="mt-4 px-6 py-2 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
                            >
                                {t('merchant.branches.addBranch')}
                            </button>
                        </div>
                    ) : (
                        branches.map((branch) => (
                            <div key={branch.id} className="p-4 bg-card-light border border-border-light rounded-xl">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-text-light-primary text-sm">{branch.name}</h3>
                                        <div className="mt-2 space-y-1.5">
                                            <p className="text-text-light-secondary text-xs flex items-center gap-1.5">
                                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>location_on</span>
                                                {getGovName(branch.governorate)}
                                                {branch.district && ` - ${getDistName(branch.district)}`}
                                            </p>
                                            <p className="text-text-light-secondary text-xs flex items-center gap-1.5">
                                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>home</span>
                                                {branch.address}
                                            </p>
                                            {branch.phone && (
                                                <p className="text-text-light-secondary text-xs flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>call</span>
                                                    <span dir="ltr">{branch.phone}</span>
                                                </p>
                                            )}
                                            {branch.maps_link && (
                                                <a
                                                    href={branch.maps_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary text-xs flex items-center gap-1.5 hover:underline"
                                                >
                                                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>map</span>
                                                    {language === 'ar' ? 'عرض على الخريطة' : 'View on Map'}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => openEditForm(branch)}
                                            className="p-2 rounded-full hover:bg-background-light transition-colors text-text-light-secondary"
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                                        </button>
                                        <button
                                            onClick={() => deleteBranch(branch.id)}
                                            className="p-2 rounded-full hover:bg-red-50 transition-colors text-red-500"
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
