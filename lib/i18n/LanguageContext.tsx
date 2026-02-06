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
        'nav.stores': 'Stores',
        'nav.wishlist': 'Wishlist',

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
        'store.closed': 'Closed',
        'store.viewOnMap': 'View on map',
        'store.all': 'All',
        'store.search': 'Search in',
        'store.storeNotFound': 'Store not found',
        'store.rating': 'Rating',
        'store.location': 'Location',
        'store.contact': 'Contact',
        'store.workingHours': 'Working Hours',
        'store.description': 'Description',
        'store.openUntil': 'Until',
        'store.verifiedMerchant': 'Verified Merchant',
        'store.noDescription': 'No description available.',
        'store.noReviews': 'No reviews yet',

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
        'profile.user': 'User',
        'profile.version': 'Version',

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
        'common.addedToCart': 'Added to cart',
        'common.buyNow': 'Buy Now',
        'common.price': 'Price',
        'common.quantity': 'Quantity',
        'common.total': 'Total',
        'common.checkout': 'Checkout',
        'common.continue': 'Continue',
        'common.back': 'Back',
        'common.search': 'Search',
        'common.searchProducts': 'Search products...',
        'common.searchStores': 'Search stores...',
        'common.filter': 'Filter',
        'common.sort': 'Sort',
        'common.all': 'All',
        'common.viewAll': 'View All',
        'common.seeMore': 'See More',
        'common.noResults': 'No results found',
        'common.remove': 'Remove',
        'common.update': 'Update',
        'common.close': 'Close',
        'common.confirm': 'Confirm',
        'common.yes': 'Yes',
        'common.no': 'No',
        'common.or': 'or',
        'common.and': 'and',
        'common.egp': 'EGP',

        // Cart
        'cart.title': 'Shopping Cart',
        'cart.yourCart': 'Your Cart',
        'cart.empty': 'Your cart is empty',
        'cart.emptyMessage': 'Looks like you haven\'t added anything yet',
        'cart.subtotal': 'Subtotal',
        'cart.shipping': 'Shipping',
        'cart.free': 'Free',
        'cart.proceedToCheckout': 'Proceed to Checkout',
        'cart.continueShopping': 'Continue Shopping',
        'cart.items': 'items',
        'cart.item': 'item',
        'cart.removeItem': 'Remove item',
        'cart.updateQuantity': 'Update quantity',
        'cart.outOfStock': 'Out of stock',
        'cart.limitedStock': 'Limited stock',

        // Categories
        'categories.title': 'Categories',
        'categories.all': 'All Categories',
        'categories.clothing': 'Clothing',
        'categories.shoes': 'Shoes',
        'categories.accessories': 'Accessories',
        'categories.bags': 'Bags',
        'categories.jewelry': 'Jewelry',
        'categories.watches': 'Watches',

        // Homepage
        'home.featuredStores': 'Featured Stores',
        'home.newArrivals': 'New Arrivals',
        'home.noNewArrivals': 'No new arrivals yet.',
        'home.reviews': 'reviews',
        'home.trending': 'Trending',
        'home.bestSellers': 'Best Sellers',
        'home.deals': 'Deals',
        'home.forYou': 'For You',

        // Product
        'product.details': 'Details',
        'product.description': 'Description',
        'product.specifications': 'Specifications',
        'product.reviews': 'Reviews',
        'product.relatedProducts': 'Related Products',
        'product.addedToWishlist': 'Added to wishlist',
        'product.removedFromWishlist': 'Removed from wishlist',
        'product.size': 'Size',
        'product.color': 'Color',
        'product.selectSize': 'Select Size',
        'product.selectColor': 'Select Color',
        'product.inStock': 'In Stock',
        'product.outOfStock': 'Out of Stock',
        'product.onlyLeft': 'Only left',
        'product.productNotFound': 'Product not found',
        'product.share': 'Share',
        'product.report': 'Report',

        // Wishlist / Saved
        'wishlist.title': 'Wishlist',
        'wishlist.saved': 'Saved',
        'wishlist.empty': 'Your wishlist is empty',
        'wishlist.emptyMessage': 'Save items you love to see them here',
        'wishlist.addToWishlist': 'Add to Wishlist',
        'wishlist.removeFromWishlist': 'Remove from Wishlist',
        'wishlist.savedStores': 'Saved Stores',
        'wishlist.savedProducts': 'Saved Products',

        // Orders
        'orders.title': 'My Orders',
        'orders.orderNumber': 'Order #',
        'orders.orderDate': 'Order Date',
        'orders.status': 'Status',
        'orders.pending': 'Pending',
        'orders.confirmed': 'Confirmed',
        'orders.processing': 'Processing',
        'orders.shipped': 'Shipped',
        'orders.delivered': 'Delivered',
        'orders.cancelled': 'Cancelled',
        'orders.trackOrder': 'Track Order',
        'orders.noOrders': 'No orders yet',
        'orders.startShopping': 'Start Shopping',

        // Authentication
        'auth.login': 'Log In',
        'auth.logout': 'Log Out',
        'auth.signup': 'Sign Up',
        'auth.email': 'Email',
        'auth.password': 'Password',
        'auth.forgotPassword': 'Forgot Password?',
        'auth.rememberMe': 'Remember me',
        'auth.orContinueWith': 'or continue with',
        'auth.noAccount': 'Don\'t have an account?',
        'auth.haveAccount': 'Already have an account?',

        // Messages
        'msg.loginRequired': 'Please log in to continue',
        'msg.addedToCart': 'Added to cart successfully',
        'msg.removedFromCart': 'Removed from cart',
        'msg.orderPlaced': 'Order placed successfully',
        'msg.somethingWrong': 'Something went wrong',
        'msg.tryAgain': 'Please try again',
    },
    ar: {
        // Navigation
        'nav.home': 'الرئيسية',
        'nav.mall': 'المول',
        'nav.saved': 'المفضلة',
        'nav.cart': 'السلة',
        'nav.profile': 'حسابي',
        'nav.stores': 'المتاجر',
        'nav.wishlist': 'المفضلة',

        // Footer
        'footer.brand': 'Outfit-Hub',
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
        'footer.copyright': '© 2026 Outfit-Hub. جميع الحقوق محفوظة.',
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
        'store.closed': 'مغلق',
        'store.viewOnMap': 'عرض على الخريطة',
        'store.all': 'الكل',
        'store.search': 'ابحث في',
        'store.storeNotFound': 'المتجر غير موجود',
        'store.rating': 'التقييم',
        'store.location': 'الموقع',
        'store.contact': 'التواصل',
        'store.workingHours': 'ساعات العمل',
        'store.description': 'الوصف',
        'store.openUntil': 'حتى',
        'store.verifiedMerchant': 'تاجر موثوق',
        'store.noDescription': 'لا يوجد وصف متاح.',
        'store.noReviews': 'لا توجد تقييمات بعد',

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
        'profile.aboutApp': 'عن Outfit Hub',
        'profile.logout': 'تسجيل الخروج',
        'profile.loggingOut': 'جاري الخروج...',
        'profile.loadingProfile': 'جاري تحميل الملف...',
        'profile.merchantAccount': 'حساب تاجر',
        'profile.user': 'مستخدم',
        'profile.version': 'الإصدار',

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
        'common.addedToCart': 'تمت الإضافة للسلة',
        'common.buyNow': 'اشتري الآن',
        'common.price': 'السعر',
        'common.quantity': 'الكمية',
        'common.total': 'الإجمالي',
        'common.checkout': 'الدفع',
        'common.continue': 'متابعة',
        'common.back': 'رجوع',
        'common.search': 'بحث',
        'common.searchProducts': 'ابحث عن منتجات...',
        'common.searchStores': 'ابحث عن متاجر...',
        'common.filter': 'فلتر',
        'common.sort': 'ترتيب',
        'common.all': 'الكل',
        'common.viewAll': 'عرض الكل',
        'common.seeMore': 'عرض المزيد',
        'common.noResults': 'لا توجد نتائج',
        'common.remove': 'حذف',
        'common.update': 'تحديث',
        'common.close': 'إغلاق',
        'common.confirm': 'تأكيد',
        'common.yes': 'نعم',
        'common.no': 'لا',
        'common.or': 'أو',
        'common.and': 'و',
        'common.egp': 'ج.م',

        // Cart
        'cart.title': 'سلة التسوق',
        'cart.yourCart': 'سلتك',
        'cart.empty': 'سلتك فارغة',
        'cart.emptyMessage': 'يبدو أنك لم تضف أي شيء بعد',
        'cart.subtotal': 'المجموع الفرعي',
        'cart.shipping': 'الشحن',
        'cart.free': 'مجاني',
        'cart.proceedToCheckout': 'متابعة الدفع',
        'cart.continueShopping': 'مواصلة التسوق',
        'cart.items': 'عناصر',
        'cart.item': 'عنصر',
        'cart.removeItem': 'حذف العنصر',
        'cart.updateQuantity': 'تحديث الكمية',
        'cart.outOfStock': 'نفدت الكمية',
        'cart.limitedStock': 'كمية محدودة',

        // Categories
        'categories.title': 'الفئات',
        'categories.all': 'جميع الفئات',
        'categories.clothing': 'ملابس',
        'categories.shoes': 'أحذية',
        'categories.accessories': 'إكسسوارات',
        'categories.bags': 'حقائب',
        'categories.jewelry': 'مجوهرات',
        'categories.watches': 'ساعات',

        // Homepage
        'home.featuredStores': 'متاجر مميزة',
        'home.newArrivals': 'وصل حديثاً',
        'home.noNewArrivals': 'لا يوجد منتجات جديدة.',
        'home.reviews': 'تقييم',
        'home.trending': 'الأكثر رواجاً',
        'home.bestSellers': 'الأكثر مبيعاً',
        'home.deals': 'عروض',
        'home.forYou': 'لك',

        // Product
        'product.details': 'التفاصيل',
        'product.description': 'الوصف',
        'product.specifications': 'المواصفات',
        'product.reviews': 'التقييمات',
        'product.relatedProducts': 'منتجات ذات صلة',
        'product.addedToWishlist': 'تمت الإضافة للمفضلة',
        'product.removedFromWishlist': 'تمت الإزالة من المفضلة',
        'product.size': 'المقاس',
        'product.color': 'اللون',
        'product.selectSize': 'اختر المقاس',
        'product.selectColor': 'اختر اللون',
        'product.inStock': 'متوفر',
        'product.outOfStock': 'غير متوفر',
        'product.onlyLeft': 'متبقي فقط',
        'product.productNotFound': 'المنتج غير موجود',
        'product.share': 'مشاركة',
        'product.report': 'إبلاغ',

        // Wishlist / Saved
        'wishlist.title': 'قائمة الأمنيات',
        'wishlist.saved': 'المحفوظات',
        'wishlist.empty': 'قائمة الأمنيات فارغة',
        'wishlist.emptyMessage': 'احفظ المنتجات التي تحبها لتراها هنا',
        'wishlist.addToWishlist': 'أضف للمفضلة',
        'wishlist.removeFromWishlist': 'إزالة من المفضلة',
        'wishlist.savedStores': 'المتاجر المحفوظة',
        'wishlist.savedProducts': 'المنتجات المحفوظة',

        // Orders
        'orders.title': 'طلباتي',
        'orders.orderNumber': 'رقم الطلب #',
        'orders.orderDate': 'تاريخ الطلب',
        'orders.status': 'الحالة',
        'orders.pending': 'قيد الانتظار',
        'orders.confirmed': 'تم التأكيد',
        'orders.processing': 'قيد التجهيز',
        'orders.shipped': 'تم الشحن',
        'orders.delivered': 'تم التوصيل',
        'orders.cancelled': 'ملغي',
        'orders.trackOrder': 'تتبع الطلب',
        'orders.noOrders': 'لا توجد طلبات',
        'orders.startShopping': 'ابدأ التسوق',

        // Authentication
        'auth.login': 'تسجيل الدخول',
        'auth.logout': 'تسجيل الخروج',
        'auth.signup': 'إنشاء حساب',
        'auth.email': 'البريد الإلكتروني',
        'auth.password': 'كلمة المرور',
        'auth.forgotPassword': 'نسيت كلمة المرور؟',
        'auth.rememberMe': 'تذكرني',
        'auth.orContinueWith': 'أو تابع بـ',
        'auth.noAccount': 'ليس لديك حساب؟',
        'auth.haveAccount': 'لديك حساب بالفعل؟',

        // Messages
        'msg.loginRequired': 'يرجى تسجيل الدخول للمتابعة',
        'msg.addedToCart': 'تمت الإضافة للسلة بنجاح',
        'msg.removedFromCart': 'تمت الإزالة من السلة',
        'msg.orderPlaced': 'تم تقديم الطلب بنجاح',
        'msg.somethingWrong': 'حدث خطأ ما',
        'msg.tryAgain': 'يرجى المحاولة مرة أخرى',
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
        }
        // Always keep LTR direction
        document.documentElement.dir = 'ltr';
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('language', lang);
        // Keep LTR direction always
        document.documentElement.lang = lang;
    };

    const t = (key: string): string => {
        return translations[language][key] || key;
    };

    // Always LTR
    const dir = 'ltr' as const;

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
