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

        // Profile Page
        'profile.title': 'Profile',
        'profile.editProfile': 'Edit Profile',
        'profile.myShopping': 'My Shopping',
        'profile.myOrders': 'My Orders',
        'profile.myWishlist': 'My Wishlist',
        'profile.myReviews': 'My Reviews',
        'profile.preferences': 'Preferences',
        'profile.notifications': 'Notifications',
        'profile.language': 'Language',
        'profile.supportLegal': 'Support & Legal',
        'profile.helpSupport': 'Help & Support',
        'profile.termsConditions': 'Terms & Conditions',
        'profile.privacyPolicy': 'Privacy Policy',
        'profile.aboutApp': 'About Outfit Hub',
        'profile.logout': 'Log Out',
        'profile.loggingOut': 'Logging out...',
        'profile.loadingProfile': 'Loading profile...',
        'profile.merchantAccount': 'Merchant Account',

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
        'common.addToCart': 'Add to Cart',
        'common.buyNow': 'Buy Now',
        'common.price': 'Price',
        'common.quantity': 'Quantity',
        'common.total': 'Total',
        'common.checkout': 'Checkout',
        'common.continue': 'Continue',
        'common.back': 'Back',
        'common.search': 'Search',
        'common.filter': 'Filter',
        'common.sort': 'Sort',
        'common.all': 'All',
        'common.viewAll': 'View All',
        'common.seeMore': 'See More',
        'common.noResults': 'No results found',

        // Cart
        'cart.title': 'Shopping Cart',
        'cart.empty': 'Your cart is empty',
        'cart.subtotal': 'Subtotal',
        'cart.proceedToCheckout': 'Proceed to Checkout',

        // Categories
        'categories.title': 'Categories',
        'categories.all': 'All Categories',
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

        // Profile Page
        'profile.title': 'الملف الشخصي',
        'profile.editProfile': 'تعديل الملف',
        'profile.myShopping': 'مشترياتي',
        'profile.myOrders': 'طلباتي',
        'profile.myWishlist': 'قائمة الأمنيات',
        'profile.myReviews': 'تقييماتي',
        'profile.preferences': 'التفضيلات',
        'profile.notifications': 'الإشعارات',
        'profile.language': 'اللغة',
        'profile.supportLegal': 'الدعم والقانون',
        'profile.helpSupport': 'المساعدة والدعم',
        'profile.termsConditions': 'الشروط والأحكام',
        'profile.privacyPolicy': 'سياسة الخصوصية',
        'profile.aboutApp': 'عن أوتفيت هب',
        'profile.logout': 'تسجيل الخروج',
        'profile.loggingOut': 'جاري الخروج...',
        'profile.loadingProfile': 'جاري تحميل الملف...',
        'profile.merchantAccount': 'حساب تاجر',

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
        'common.addToCart': 'أضف للسلة',
        'common.buyNow': 'اشتري الآن',
        'common.price': 'السعر',
        'common.quantity': 'الكمية',
        'common.total': 'الإجمالي',
        'common.checkout': 'الدفع',
        'common.continue': 'متابعة',
        'common.back': 'رجوع',
        'common.search': 'بحث',
        'common.filter': 'فلتر',
        'common.sort': 'ترتيب',
        'common.all': 'الكل',
        'common.viewAll': 'عرض الكل',
        'common.seeMore': 'عرض المزيد',
        'common.noResults': 'لا توجد نتائج',

        // Cart
        'cart.title': 'سلة التسوق',
        'cart.empty': 'سلتك فارغة',
        'cart.subtotal': 'المجموع الفرعي',
        'cart.proceedToCheckout': 'متابعة الدفع',

        // Categories
        'categories.title': 'الفئات',
        'categories.all': 'جميع الفئات',
    },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>('ar');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Load saved language from localStorage
        const savedLang = localStorage.getItem('language') as Language;
        if (savedLang && (savedLang === 'en' || savedLang === 'ar')) {
            setLanguageState(savedLang);
            document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
            document.documentElement.lang = savedLang;
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
        if (mounted) {
            document.documentElement.dir = dir;
            document.documentElement.lang = language;
        }
    }, [language, dir, mounted]);

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
