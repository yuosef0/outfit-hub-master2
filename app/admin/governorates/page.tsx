'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { EGYPTIAN_GOVERNORATES, District } from '@/lib/types';

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
    const [districts, setDistricts] = useState<District[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ code: '', name: '', name_ar: '' });
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [expandedGov, setExpandedGov] = useState<string | null>(null);
    const [showAddDistrict, setShowAddDistrict] = useState<string | null>(null);
    const [districtForm, setDistrictForm] = useState({ name: '', name_ar: '' });

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
                console.warn('Governorates table not found, using hardcoded data');
                const fallback: GovernorateRecord[] = EGYPTIAN_GOVERNORATES.map((g, i) => ({
                    id: `fallback-${i}`,
                    code: g.code,
                    name: g.name,
                    name_ar: g.name_ar,
                    is_active: g.code === 'MIN',
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

    const fetchDistricts = async () => {
        try {
            const { data } = await supabase
                .from('districts')
                .select('*')
                .order('name', { ascending: true });
            setDistricts(data || []);
        } catch (error) {
            console.error('Error fetching districts:', error);
        }
    };

    useEffect(() => {
        fetchGovernorates();
        fetchDistricts();
    }, [supabase]);

    const toggleActive = async (gov: GovernorateRecord) => {
        if (gov.id.startsWith('fallback-')) return;
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

    const handleAddDistrict = async (e: React.FormEvent, govCode: string) => {
        e.preventDefault();
        if (!districtForm.name || !districtForm.name_ar) return;

        setSaving(true);
        try {
            const { error } = await supabase.from('districts').insert({
                governorate_code: govCode,
                name: districtForm.name,
                name_ar: districtForm.name_ar,
                is_active: true,
            });

            if (error) throw error;
            setDistrictForm({ name: '', name_ar: '' });
            setShowAddDistrict(null);
            fetchDistricts();
        } catch (error) {
            console.error('Error adding district:', error);
        } finally {
            setSaving(false);
        }
    };

    const toggleDistrictActive = async (district: District) => {
        try {
            const { error } = await supabase
                .from('districts')
                .update({ is_active: !district.is_active })
                .eq('id', district.id);

            if (error) throw error;
            setDistricts(prev =>
                prev.map(d => d.id === district.id ? { ...d, is_active: !district.is_active } : d)
            );
        } catch (error) {
            console.error('Error toggling district:', error);
        }
    };

    const handleDeleteDistrict = async (id: string) => {
        try {
            await supabase.from('districts').delete().eq('id', id);
            setDistricts(prev => prev.filter(d => d.id !== id));
        } catch (error) {
            console.error('Error deleting district:', error);
        }
    };

    const getDistrictsForGov = (govCode: string) => {
        return districts.filter(d => d.governorate_code === govCode);
    };

    const activeCount = governorates.filter(g => g.is_active).length;

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-light-primary">المحافظات والمراكز</h1>
                    <p className="text-xs text-text-light-secondary mt-1">
                        {activeCount} {t('admin.active')} / {governorates.length} {t('admin.total')}
                    </p>
                </div>
                <button
                    onClick={() => setShowAdd(!showAdd)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors w-full sm:w-auto justify-center"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                        {showAdd ? 'close' : 'add'}
                    </span>
                    {showAdd ? t('admin.cancel') : 'إضافة محافظة'}
                </button>
            </div>

            {/* Add Governorate Form */}
            {showAdd && (
                <form onSubmit={handleAdd} className="bg-card-light rounded-xl p-5 border border-border-light mb-6 space-y-4">
                    <h2 className="text-base font-bold text-text-light-primary">إضافة محافظة جديدة</h2>
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
                    {governorates.map((gov) => {
                        const govDistricts = getDistrictsForGov(gov.code);
                        const isExpanded = expandedGov === gov.code;

                        return (
                            <div key={gov.id} className="bg-card-light rounded-xl border border-border-light overflow-hidden">
                                {/* Governorate Header */}
                                <div className="p-3">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto">
                                            <span className={`material-symbols-outlined shrink-0 ${gov.is_active ? 'text-green-400' : 'text-text-light-secondary'}`} style={{ fontSize: '20px' }}>
                                                location_on
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <h3 className="text-sm font-bold text-text-light-primary">{gov.name}</h3>
                                                    <span className="text-sm text-text-light-secondary" dir="rtl">{gov.name_ar}</span>
                                                    <span className="text-[10px] bg-background-light px-1 py-0.5 rounded border border-border-light text-text-light-secondary font-mono">{gov.code}</span>
                                                    <span className="text-[10px] bg-blue-900/20 text-blue-400 px-1.5 py-0.5 rounded">{govDistricts.length} مركز</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-end">
                                            <button
                                                onClick={() => setExpandedGov(isExpanded ? null : gov.code)}
                                                className="px-2 py-1 rounded-lg text-[11px] font-bold bg-blue-900/20 text-blue-400 hover:bg-blue-900/30"
                                            >
                                                {isExpanded ? 'إخفاء المراكز' : 'عرض المراكز'}
                                            </button>
                                            <button
                                                onClick={() => toggleActive(gov)}
                                                disabled={updatingId === gov.id || gov.id.startsWith('fallback-')}
                                                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50 ${gov.is_active
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
                                </div>

                                {/* Districts Section */}
                                {isExpanded && (
                                    <div className="border-t border-border-light bg-background-light/50 p-3">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-xs font-bold text-text-light-primary">المراكز ({govDistricts.length})</h4>
                                            <button
                                                onClick={() => setShowAddDistrict(showAddDistrict === gov.code ? null : gov.code)}
                                                className="text-xs px-2 py-1 bg-primary text-white rounded hover:bg-primary/90"
                                            >
                                                {showAddDistrict === gov.code ? 'إلغاء' : '+ إضافة مركز'}
                                            </button>
                                        </div>

                                        {/* Add District Form */}
                                        {showAddDistrict === gov.code && (
                                            <form onSubmit={(e) => handleAddDistrict(e, gov.code)} className="bg-card-light rounded-lg p-3 mb-3 space-y-2">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input
                                                        type="text"
                                                        value={districtForm.name}
                                                        onChange={(e) => setDistrictForm({ ...districtForm, name: e.target.value })}
                                                        placeholder="Name (English)"
                                                        className="px-2 py-1.5 rounded border border-border-light bg-background-light text-text-light-primary text-xs"
                                                        required
                                                    />
                                                    <input
                                                        type="text"
                                                        value={districtForm.name_ar}
                                                        onChange={(e) => setDistrictForm({ ...districtForm, name_ar: e.target.value })}
                                                        placeholder="الاسم (عربي)"
                                                        className="px-2 py-1.5 rounded border border-border-light bg-background-light text-text-light-primary text-xs"
                                                        required
                                                        dir="rtl"
                                                    />
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={saving}
                                                    className="px-3 py-1.5 bg-primary text-white rounded text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
                                                >
                                                    {saving ? '...' : 'حفظ'}
                                                </button>
                                            </form>
                                        )}

                                        {/* Districts List */}
                                        {govDistricts.length === 0 ? (
                                            <p className="text-xs text-text-light-secondary text-center py-4">لا توجد مراكز</p>
                                        ) : (
                                            <div className="space-y-1.5">
                                                {govDistricts.map((district) => (
                                                    <div key={district.id} className="bg-card-light rounded-lg p-2 flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="material-symbols-outlined text-text-light-secondary" style={{ fontSize: '16px' }}>
                                                                place
                                                            </span>
                                                            <div>
                                                                <span className="text-xs font-medium text-text-light-primary">{district.name}</span>
                                                                <span className="text-xs text-text-light-secondary mr-1.5" dir="rtl">{district.name_ar}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => toggleDistrictActive(district)}
                                                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${district.is_active
                                                                    ? 'bg-green-900/20 text-green-400'
                                                                    : 'bg-card-light text-text-light-secondary border border-border-light'
                                                                    }`}
                                                            >
                                                                {district.is_active ? 'نشط' : 'غير نشط'}
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteDistrict(district.id)}
                                                                className="p-0.5 rounded text-red-400 hover:bg-red-900/20"
                                                            >
                                                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>delete</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
