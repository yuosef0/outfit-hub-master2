'use client';
import React from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function CookiePolicyPage() {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-background-light py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-text-light-primary mb-6 text-center">{t('cookie.title')}</h1>
                <div className="bg-card-light rounded-lg shadow-sm p-6 space-y-4 text-text-light-secondary">
                    <p className="whitespace-pre-wrap">{t('cookie.content')}</p>
                </div>
            </div>
        </div>
    );
}
