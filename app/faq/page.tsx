'use client';
import React from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function FAQPage() {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-background-light py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-text-light-primary mb-6 text-center">{t('faq.title')}</h1>
                <div className="space-y-4">
                    {[
                        { q: t('faq.q1'), a: t('faq.a1') },
                        { q: t('faq.q2'), a: t('faq.a2') },
                        { q: t('faq.q3'), a: t('faq.a3') },
                        { q: t('faq.q4'), a: t('faq.a4') },
                        { q: t('faq.q5'), a: t('faq.a5') }
                    ].map((item, index) => (
                        <div key={index} className="bg-card-light rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-text-light-primary mb-2">{item.q}</h3>
                            <p className="text-text-light-secondary">{item.a}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
