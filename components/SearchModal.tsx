'use client';

import React, { useEffect, useState, useRef } from 'react';
import { ProductCard } from './ProductCard';
import { StoreCard } from './StoreCard';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Tab = 'all' | 'products' | 'stores';

interface Product {
    id: string;
    name: string;
    price: number;
    image_urls: string[];
    stores: {
        name: string;
    };
    category: string;
}

interface Store {
    id: string;
    name: string;
    logo_url: string;
    category: string;
    address: string;
    rating?: number;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const [shouldRender, setShouldRender] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<Tab>('all');
    const [products, setProducts] = useState<Product[]>([]);
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(false);
    const { t } = useLanguage();
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            document.body.style.overflow = 'hidden';
            // Focus input logic could go here
        } else {
            const timer = setTimeout(() => setShouldRender(false), 300);
            document.body.style.overflow = '';
            setSearchTerm('');
            setProducts([]);
            setStores([]);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        if (!searchTerm.trim()) {
            setProducts([]);
            setStores([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        searchTimeout.current = setTimeout(async () => {
            try {
                // Determine what to fetch based on tab

                const promises = [];
                // Fetch products for 'all' or 'products'
                if (activeTab === 'all' || activeTab === 'products') {
                    promises.push(
                        fetch(`/api/products?search=${encodeURIComponent(searchTerm)}`)
                            .then(res => res.json())
                            .then(data => setProducts(data.products || []))
                    );
                }

                // Fetch stores for 'all' or 'stores'
                if (activeTab === 'all' || activeTab === 'stores') {
                    promises.push(
                        fetch(`/api/stores?search=${encodeURIComponent(searchTerm)}&is_active=true`)
                            .then(res => res.json())
                            .then(data => setStores(data.stores || []))
                    );
                }

                await Promise.all(promises);
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setLoading(false);
            }
        }, 500);

        return () => {
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
        };
    }, [searchTerm, activeTab, isOpen]);


    if (!shouldRender) return null;

    return (
        <div
            className={`fixed inset-0 z-[100] bg-background-light transition-transform duration-300 ease-in-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
        >
            <div className="relative flex flex-col h-full w-full mx-auto overflow-x-hidden bg-background-light group/design-root overflow-y-auto">

                {/* Header */}
                <div className="sticky top-0 z-50 bg-background-light/95 backdrop-blur-md border-b border-border-light">
                    <div className="h-4 w-full"></div>
                    <div className="px-4 pb-2 flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-card-light transition-colors"
                        >
                            <span className="material-symbols-outlined text-text-light-primary" style={{ fontSize: '28px' }}>close</span>
                        </button>
                        <div className="flex-1 relative group">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <span className="material-symbols-outlined text-text-light-secondary text-[20px]">search</span>
                            </div>
                            <input
                                className="w-full bg-card-light border-none rounded-xl py-3 pl-10 pr-10 text-base placeholder-text-light-secondary text-text-light-primary focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
                                placeholder={t('search.placeholder')}
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute inset-y-0 right-2 flex items-center justify-center p-1 text-text-light-secondary hover:text-text-light-primary"
                                >
                                    <span className="material-symbols-outlined text-[20px]">cancel</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center px-4 gap-6 pt-2 overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`flex flex-col items-center gap-2 pb-3 min-w-[3rem] border-b-[3px] text-sm whitespace-nowrap transition-colors ${activeTab === 'all' ? 'border-primary text-primary font-bold' : 'border-transparent text-text-light-secondary hover:text-text-light-primary font-medium'}`}
                        >
                            {t('search.all')}
                        </button>
                        <button
                            onClick={() => setActiveTab('products')}
                            className={`flex flex-col items-center gap-2 pb-3 min-w-[3rem] border-b-[3px] text-sm whitespace-nowrap transition-colors ${activeTab === 'products' ? 'border-primary text-primary font-bold' : 'border-transparent text-text-light-secondary hover:text-text-light-primary font-medium'}`}
                        >
                            {t('search.products')}
                        </button>
                        <button
                            onClick={() => setActiveTab('stores')}
                            className={`flex flex-col items-center gap-2 pb-3 min-w-[3rem] border-b-[3px] text-sm whitespace-nowrap transition-colors ${activeTab === 'stores' ? 'border-primary text-primary font-bold' : 'border-transparent text-text-light-secondary hover:text-text-light-primary font-medium'}`}
                        >
                            {t('search.stores')}
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 bg-background-light min-h-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <>
                            {/* Products Grid */}
                            {(activeTab === 'all' || activeTab === 'products') && products.length > 0 && (
                                <div className="mb-8">
                                    {(activeTab === 'all') && <h3 className="text-lg font-bold text-text-light-primary mb-4">{t('search.products')}</h3>}
                                    <div className="grid grid-cols-2 gap-4 pb-4">
                                        {products.map((product) => (
                                            <div key={product.id} onClick={onClose} className="w-full">
                                                {/* Wrapper div to constrain width if needed, but grid handles it */}
                                                <div className="w-full">
                                                    <ProductCard
                                                        id={product.id}
                                                        name={product.name}
                                                        price={product.price}
                                                        storeName={product.stores?.name || t('search.unknownStore')}
                                                        imageUrl={product.image_urls?.[0]}
                                                    // category={product.category}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Stores Grid */}
                            {(activeTab === 'all' || activeTab === 'stores') && stores.length > 0 && (
                                <div className="mb-8">
                                    {(activeTab === 'all') && <h3 className="text-lg font-bold text-text-light-primary mb-4">{t('search.stores')}</h3>}
                                    <div className="flex flex-wrap gap-4 pb-4 justify-center sm:justify-start">
                                        {stores.map((store) => (
                                            <div key={store.id} onClick={onClose}>
                                                <StoreCard
                                                    id={store.id}
                                                    name={store.name}
                                                    category={store.category}
                                                    logoUrl={store.logo_url}
                                                    address={store.address}
                                                // rating={store.rating}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* No Results */}
                            {!loading && searchTerm && (
                                (activeTab === 'products' && products.length === 0) ||
                                (activeTab === 'stores' && stores.length === 0) ||
                                (activeTab === 'all' && products.length === 0 && stores.length === 0)
                            ) && (
                                    <div className="flex flex-col items-center justify-center py-20 text-text-light-secondary">
                                        <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
                                        <p>{t('search.noResults')} &quot;{searchTerm}&quot;</p>
                                    </div>
                                )}

                            {/* Initial State / Empty State */}
                            {!searchTerm && (
                                <div className="flex flex-col items-center justify-center py-20 text-text-light-secondary opacity-50">
                                    <span className="material-symbols-outlined text-4xl mb-2">search</span>
                                    <p>{t('search.typeToSearch')}</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
