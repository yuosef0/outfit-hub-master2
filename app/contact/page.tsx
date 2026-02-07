'use client';
import React from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function ContactPage() {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-background-light py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-text-light-primary mb-6 text-center">{t('contact.title')}</h1>
                <div className="bg-card-light rounded-lg shadow-sm p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-semibold text-text-light-primary mb-2">{t('contact.getInTouch')}</h3>
                            <p className="text-text-light-secondary mb-4">
                                {t('contact.desc')}
                            </p>
                            <div className="space-y-2 text-text-light-secondary">
                                <p className="flex items-center gap-2">
                                    <span className="material-symbols-outlined">email</span>
                                    support@outfithub.com
                                </p>
                                <p className="flex items-center gap-2">
                                    <span className="material-symbols-outlined">phone</span>
                                    +20 123 456 7890
                                </p>
                                <p className="flex items-center gap-2">
                                    <span className="material-symbols-outlined">location_on</span>
                                    {t('contact.address')}
                                </p>
                            </div>
                        </div>
                        <form className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-light-primary mb-1">{t('contact.name')}</label>
                                <input type="text" className="w-full rounded-md border border-border-light bg-background-light px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-light-primary mb-1">{t('contact.email')}</label>
                                <input type="email" className="w-full rounded-md border border-border-light bg-background-light px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-light-primary mb-1">{t('contact.message')}</label>
                                <textarea rows={4} className="w-full rounded-md border border-border-light bg-background-light px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"></textarea>
                            </div>
                            <button type="button" className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition-colors">
                                {t('contact.send')}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
