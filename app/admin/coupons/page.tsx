'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface Coupon {
    id: string;
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_order_amount: number | null;
    max_uses: number | null;
    current_uses: number;
    is_active: boolean;
    expires_at: string | null;
    store_id: string | null;
    created_at: string;
}

export default function AdminCouponsPage() {
    const { t } = useLanguage();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        code: '',
        discount_type: 'percentage' as 'percentage' | 'fixed',
        discount_value: '',
        min_order_amount: '',
        max_uses: '',
        expires_at: '',
    });

    const supabase = useMemo(
        () => createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        ),
        []
    );

    const fetchCoupons = async () => {
        try {
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .is('store_id', null)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCoupons(data || []);
        } catch (error) {
            console.error('Error fetching coupons:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, [supabase]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.code || !form.discount_value) return;

        setSaving(true);
        try {
            const { error } = await supabase.from('coupons').insert({
                code: form.code.toUpperCase(),
                discount_type: form.discount_type,
                discount_value: parseFloat(form.discount_value),
                min_order_amount: form.min_order_amount ? parseFloat(form.min_order_amount) : null,
                max_uses: form.max_uses ? parseInt(form.max_uses) : null,
                current_uses: 0,
                is_active: true,
                expires_at: form.expires_at || null,
                store_id: null, // Global coupon
            });

            if (error) throw error;

            setForm({ code: '', discount_type: 'percentage', discount_value: '', min_order_amount: '', max_uses: '', expires_at: '' });
            setShowForm(false);
            fetchCoupons();
        } catch (error) {
            console.error('Error creating coupon:', error);
        } finally {
            setSaving(false);
        }
    };

    const toggleCoupon = async (id: string, isActive: boolean) => {
        try {
            await supabase.from('coupons').update({ is_active: !isActive }).eq('id', id);
            setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active: !isActive } : c));
        } catch (error) {
            console.error('Error toggling coupon:', error);
        }
    };

    const deleteCoupon = async (id: string) => {
        try {
            await supabase.from('coupons').delete().eq('id', id);
            setCoupons(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error('Error deleting coupon:', error);
        }
    };

    return (
        <div className="p-4 max-w-3xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold text-text-light-primary">{t('admin.couponManagement')}</h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors w-full sm:w-auto justify-center"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                        {showForm ? 'close' : 'add'}
                    </span>
                    {showForm ? t('admin.cancel') : t('admin.createCoupon')}
                </button>
            </div>

            {/* Create Form */}
            {showForm && (
                <form onSubmit={handleCreate} className="bg-card-light rounded-xl p-5 border border-border-light mb-6 space-y-4">
                    <h2 className="text-base font-bold text-text-light-primary">{t('admin.newGlobalCoupon')}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-text-light-secondary mb-1">{t('admin.couponCode')}</label>
                            <input
                                type="text"
                                value={form.code}
                                onChange={(e) => setForm({ ...form, code: e.target.value })}
                                placeholder="e.g. WELCOME20"
                                className="w-full px-3 py-2 rounded-lg border border-border-light bg-background-light text-text-light-primary text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-text-light-secondary mb-1">{t('admin.discountType')}</label>
                            <select
                                value={form.discount_type}
                                onChange={(e) => setForm({ ...form, discount_type: e.target.value as 'percentage' | 'fixed' })}
                                className="w-full px-3 py-2 rounded-lg border border-border-light bg-background-light text-text-light-primary text-sm"
                            >
                                <option value="percentage">{t('admin.percentage')}</option>
                                <option value="fixed">{t('admin.fixedAmount')}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-text-light-secondary mb-1">{t('admin.discountValue')}</label>
                            <input
                                type="number"
                                value={form.discount_value}
                                onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                                placeholder={form.discount_type === 'percentage' ? '10' : '50'}
                                className="w-full px-3 py-2 rounded-lg border border-border-light bg-background-light text-text-light-primary text-sm"
                                required
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-text-light-secondary mb-1">{t('admin.minOrder')}</label>
                            <input
                                type="number"
                                value={form.min_order_amount}
                                onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })}
                                placeholder="0"
                                className="w-full px-3 py-2 rounded-lg border border-border-light bg-background-light text-text-light-primary text-sm"
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-text-light-secondary mb-1">{t('admin.maxUses')}</label>
                            <input
                                type="number"
                                value={form.max_uses}
                                onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                                placeholder="Unlimited"
                                className="w-full px-3 py-2 rounded-lg border border-border-light bg-background-light text-text-light-primary text-sm"
                                min="1"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-text-light-secondary mb-1">{t('admin.expiresAt')}</label>
                            <input
                                type="date"
                                value={form.expires_at}
                                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-border-light bg-background-light text-text-light-primary text-sm"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                    >
                        {saving ? '...' : t('admin.createCoupon')}
                    </button>
                </form>
            )}

            {/* Coupon List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : coupons.length === 0 ? (
                <div className="text-center py-12">
                    <span className="material-symbols-outlined text-5xl text-border-light mb-3">local_offer</span>
                    <p className="text-text-light-secondary">{t('admin.noCoupons')}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {coupons.map((coupon) => (
                        <div key={coupon.id} className="bg-card-light rounded-xl p-4 border border-border-light">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="min-w-0 w-full sm:w-auto">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-bold text-primary font-mono">{coupon.code}</span>
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${coupon.is_active
                                                ? 'bg-green-900/20 text-green-400'
                                                : 'bg-red-900/20 text-red-400'
                                            }`}>
                                            {coupon.is_active ? t('admin.active') : t('admin.inactive')}
                                        </span>
                                    </div>
                                    <p className="text-xs text-text-light-secondary">
                                        {coupon.discount_type === 'percentage'
                                            ? `${coupon.discount_value}% off`
                                            : `${coupon.discount_value} EGP off`
                                        }
                                        {coupon.min_order_amount ? ` &middot; Min: ${coupon.min_order_amount} EGP` : ''}
                                        {coupon.max_uses ? ` · ${coupon.current_uses}/${coupon.max_uses} used` : ` · ${coupon.current_uses} used`}
                                    </p>
                                    {coupon.expires_at && (
                                        <p className="text-[10px] text-text-light-secondary mt-0.5">
                                            Expires: {new Date(coupon.expires_at).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                                    <button
                                        onClick={() => toggleCoupon(coupon.id, coupon.is_active)}
                                        className={`px-2 py-1 rounded text-xs font-medium ${coupon.is_active
                                                ? 'bg-red-900/20 text-red-400'
                                                : 'bg-green-900/20 text-green-400'
                                            }`}
                                    >
                                        {coupon.is_active ? t('admin.deactivate') : t('admin.activate')}
                                    </button>
                                    <button
                                        onClick={() => deleteCoupon(coupon.id)}
                                        className="px-2 py-1 rounded text-xs text-red-400 hover:bg-red-900/20"
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
