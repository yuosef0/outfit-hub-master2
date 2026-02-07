'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { EGYPTIAN_GOVERNORATES } from '@/lib/types';

interface GovernorateRecord {
    id: string;
    code: string;
    name: string;
    name_ar: string;
    is_active: boolean;
    created_at: string;
}

export default function AdminGovernoratesPage() {
    const { t } = useLanguage();
    const [governorates, setGovernorates] = useState<GovernorateRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ code: '', name: '', name_ar: '' });
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const supabase = useMemo(
        () => createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        ),
        []
    );

    const fetchGovernorates = async () => {
        try {
            const { data, error } = await supabase
                .from('governorates')
                .select('*')
                .order('name', { ascending: true });

            if (error) {
                // If table doesn't exist yet, use hardcoded data
                console.warn('Governorates table not found, using hardcoded data');
                const fallback: GovernorateRecord[] = EGYPTIAN_GOVERNORATES.map((g, i) => ({
                    id: `fallback-${i}`,
                    code: g.code,
                    name: g.name,
                    name_ar: g.name_ar,
                    is_active: g.code === 'MIN', // Only Minya active by default
                    created_at: new Date().toISOString(),
                }));
                setGovernorates(fallback);
            } else {
                setGovernorates(data || []);
            }
        } catch (error) {
            console.error('Error fetching governorates:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGovernorates();
    }, [supabase]);

    const toggleActive = async (gov: GovernorateRecord) => {
        if (gov.id.startsWith('fallback-')) return; // Can't toggle fallback data
        setUpdatingId(gov.id);
        try {
            const { error } = await supabase
                .from('governorates')
                .update({ is_active: !gov.is_active })
                .eq('id', gov.id);

            if (error) throw error;
            setGovernorates(prev =>
                prev.map(g => g.id === gov.id ? { ...g, is_active: !gov.is_active } : g)
            );
        } catch (error) {
            console.error('Error toggling governorate:', error);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.code || !form.name || !form.name_ar) return;

        setSaving(true);
        try {
            const { error } = await supabase.from('governorates').insert({
                code: form.code.toUpperCase(),
                name: form.name,
                name_ar: form.name_ar,
                is_active: false,
            });

            if (error) throw error;
            setForm({ code: '', name: '', name_ar: '' });
            setShowAdd(false);
            fetchGovernorates();
        } catch (error) {
            console.error('Error adding governorate:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (id.startsWith('fallback-')) return;
        try {
            await supabase.from('governorates').delete().eq('id', id);
            setGovernorates(prev => prev.filter(g => g.id !== id));
        } catch (error) {
            console.error('Error deleting governorate:', error);
        }
    };

    const activeCount = governorates.filter(g => g.is_active).length;

    return (
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-light-primary">{t('admin.governorateManagement')}</h1>
                    <p className="text-xs text-text-light-secondary mt-1">
                        {activeCount} {t('admin.active')} / {governorates.length} {t('admin.total')}
                    </p>
                </div>
                <button
                    onClick={() => setShowAdd(!showAdd)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                        {showAdd ? 'close' : 'add'}
                    </span>
                    {showAdd ? t('admin.cancel') : t('admin.addGovernorate')}
                </button>
            </div>

            {/* Add Form */}
            {showAdd && (
                <form onSubmit={handleAdd} className="bg-card-light rounded-xl p-5 border border-border-light mb-6 space-y-4">
                    <h2 className="text-base font-bold text-text-light-primary">{t('admin.addGovernorate')}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-text-light-secondary mb-1">Code</label>
                            <input
                                type="text"
                                value={form.code}
                                onChange={(e) => setForm({ ...form, code: e.target.value })}
                                placeholder="e.g. CAI"
                                className="w-full px-3 py-2 rounded-lg border border-border-light bg-background-light text-text-light-primary text-sm"
                                required
                                maxLength={5}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-text-light-secondary mb-1">Name (English)</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g. Cairo"
                                className="w-full px-3 py-2 rounded-lg border border-border-light bg-background-light text-text-light-primary text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-text-light-secondary mb-1">Name (Arabic)</label>
                            <input
                                type="text"
                                value={form.name_ar}
                                onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
                                placeholder="e.g. القاهرة"
                                className="w-full px-3 py-2 rounded-lg border border-border-light bg-background-light text-text-light-primary text-sm"
                                required
                                dir="rtl"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                    >
                        {saving ? '...' : t('admin.save')}
                    </button>
                </form>
            )}

            {/* Governorate List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="space-y-2">
                    {governorates.map((gov) => (
                        <div key={gov.id} className="bg-card-light rounded-xl p-4 border border-border-light flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className={`material-symbols-outlined ${gov.is_active ? 'text-green-400' : 'text-text-light-secondary'}`} style={{ fontSize: '20px' }}>
                                    location_on
                                </span>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-bold text-text-light-primary">{gov.name}</h3>
                                        <span className="text-sm text-text-light-secondary" dir="rtl">{gov.name_ar}</span>
                                        <span className="text-[10px] bg-background-light px-1.5 py-0.5 rounded border border-border-light text-text-light-secondary font-mono">{gov.code}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => toggleActive(gov)}
                                    disabled={updatingId === gov.id || gov.id.startsWith('fallback-')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${
                                        gov.is_active
                                            ? 'bg-green-900/20 text-green-400'
                                            : 'bg-card-light text-text-light-secondary border border-border-light'
                                    }`}
                                >
                                    {updatingId === gov.id ? '...' : gov.is_active ? t('admin.active') : t('admin.inactive')}
                                </button>
                                {!gov.id.startsWith('fallback-') && (
                                    <button
                                        onClick={() => handleDelete(gov.id)}
                                        className="p-1 rounded text-red-400 hover:bg-red-900/20"
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
