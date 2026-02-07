'use client';
import React from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function PrivacyPolicyPage() {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-background-light py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-text-light-primary mb-6 text-center">{t('privacy.title')}</h1>
                <div className="bg-card-light rounded-lg shadow-sm p-6 space-y-4 text-text-light-secondary">
                    <p>{t('privacy.content')}</p>
                </div>
            </div>
        </div>
    );
}
