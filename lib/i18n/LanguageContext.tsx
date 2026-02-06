'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'ar';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
    dir: 'ltr' | 'rtl';
}

const translations: Record<Language, Record<string, string>> = {
    en: {
        // Navigation
        'nav.home': 'Home',
        'nav.mall': 'Mall',
        'nav.saved': 'Saved',
        'nav.cart': 'Cart',
        'nav.profile': 'Profile',

        // Footer
        'footer.brand': 'Outfit-Hub',
        'footer.tagline': 'Your premium destination for fashion and lifestyle.',
        'footer.quickLinks': 'Quick Links',
        'footer.aboutUs': 'About Us',
        'footer.stores': 'Stores',
        'footer.contact': 'Contact',
        'footer.faq': 'FAQ',
        'footer.legal': 'Legal',
        'footer.privacy': 'Privacy Policy',
        'footer.terms': 'Terms of Service',
        'footer.returnPolicy': 'Return Policy',
        'footer.cookiePolicy': 'Cookie Policy',
        'footer.copyright': '© 2026 Outfit-Hub. All rights reserved.',
        'footer.language': 'Language',

        // Store Page
        'store.follow': 'Follow',
        'store.following': 'Following',
        'store.followers': 'followers',
        'store.products': 'Products',
        'store.about': 'About',
        'store.reviews': 'Reviews',
        'store.noProducts': 'No products found',
        'store.adjustFilters': 'Try adjusting your filters',
        'store.callNow': 'Call Now',
        'store.open': 'Open',
        'store.viewOnMap': 'View on map',
        'store.all': 'All',
        'store.search': 'Search in',

        // Common
        'common.loading': 'Loading...',
        'common.error': 'Error',
        'common.success': 'Success',
        'common.cancel': 'Cancel',
        'common.save': 'Save',
        'common.delete': 'Delete',
        'common.edit': 'Edit',
        'common.add': 'Add',
        'common.soldOut': 'SOLD OUT',
    },
    ar: {
        // Navigation
        'nav.home': 'الرئيسية',
        'nav.mall': 'المول',
        'nav.saved': 'المفضلة',
        'nav.cart': 'السلة',
        'nav.profile': 'حسابي',

        // Footer
        'footer.brand': 'أوتفيت هب',
        'footer.tagline': 'وجهتك المميزة للموضة وأسلوب الحياة.',
        'footer.quickLinks': 'روابط سريعة',
        'footer.aboutUs': 'من نحن',
        'footer.stores': 'المتاجر',
        'footer.contact': 'اتصل بنا',
        'footer.faq': 'الأسئلة الشائعة',
        'footer.legal': 'قانوني',
        'footer.privacy': 'سياسة الخصوصية',
        'footer.terms': 'شروط الخدمة',
        'footer.returnPolicy': 'سياسة الاسترجاع',
        'footer.cookiePolicy': 'سياسة ملفات تعريف الارتباط',
        'footer.copyright': '© 2026 أوتفيت هب. جميع الحقوق محفوظة.',
        'footer.language': 'اللغة',

        // Store Page
        'store.follow': 'متابعة',
        'store.following': 'متابَع',
        'store.followers': 'متابع',
        'store.products': 'المنتجات',
        'store.about': 'عن المتجر',
        'store.reviews': 'التقييمات',
        'store.noProducts': 'لا توجد منتجات',
        'store.adjustFilters': 'جرب تعديل الفلاتر',
        'store.callNow': 'اتصل الآن',
        'store.open': 'مفتوح',
        'store.viewOnMap': 'عرض على الخريطة',
        'store.all': 'الكل',
        'store.search': 'ابحث في',

        // Common
        'common.loading': 'جاري التحميل...',
        'common.error': 'خطأ',
        'common.success': 'نجاح',
        'common.cancel': 'إلغاء',
        'common.save': 'حفظ',
        'common.delete': 'حذف',
        'common.edit': 'تعديل',
        'common.add': 'إضافة',
        'common.soldOut': 'نفدت الكمية',
    },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>('ar');

    useEffect(() => {
        // Load saved language from localStorage
        const savedLang = localStorage.getItem('language') as Language;
        if (savedLang && (savedLang === 'en' || savedLang === 'ar')) {
            setLanguageState(savedLang);
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('language', lang);
        // Update document direction
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
    };

    const t = (key: string): string => {
        return translations[language][key] || key;
    };

    const dir = language === 'ar' ? 'rtl' : 'ltr';

    useEffect(() => {
        document.documentElement.dir = dir;
        document.documentElement.lang = language;
    }, [language, dir]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

export { translations };
