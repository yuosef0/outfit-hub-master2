// Database entity types for Outfit-Hub

export interface Governorate {
    code: string;
    name: string;
    name_ar: string;
}

export interface SliderImage {
    id: string;
    image_url: string;
    title?: string;
    description?: string;
    link_url?: string;
    display_order: number;
    is_active: boolean;
    created_at: string;
}

export interface Category {
    id: string;
    name: string;
    name_ar?: string;
    description?: string;
    image_url?: string;
    icon?: string;
    display_order: number;
    is_active: boolean;
    created_at: string;
}

export interface Store {
    id: string;
    merchant_id: string;
    name: string;
    description?: string;
    logo_url?: string;
    banner_url?: string;
    address: string;
    phone?: string;
    maps_link?: string;
    category?: string;
    subscription_plan: string;
    is_active: boolean;
    points_balance: number;
    created_at: string;
    updated_at: string;
}

export interface Product {
    id: string;
    store_id: string;
    name: string;
    description?: string;
    price: number;
    category?: string;
    gender_filter?: string;
    image_urls?: string[];
    stock_quantity: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    // For joined queries with store information
    stores?: {
        id: string;
        name: string;
        logo_url?: string;
        address?: string;
    };
}

export interface User {
    id: string;
    email: string;
    full_name?: string;
    phone?: string;
    role: string;
    avatar_url?: string;
    governorate?: string;
    created_at: string;
    updated_at: string;
}

export interface Wishlist {
    id: string;
    user_id: string;
    product_id: string;
    created_at: string;
    // For joined queries
    products?: Product;
}

export interface CartItem {
    id: string;
    user_id: string;
    product_id: string;
    quantity: number;
    created_at: string;
    updated_at: string;
    // For joined queries
    products?: Product;
}

// Merchant Experience Types

export type OrderStatus = 'reserved' | 'confirmed' | 'ready' | 'completed' | 'cancelled' | 'expired';

export interface OrderItem {
    product_id: string;
    product_name: string;
    product_image?: string;
    quantity: number;
    size?: string;
    color?: string;
    price: number;
}

export interface Order {
    id: string;
    customer_id: string;
    store_id: string;
    pickup_code: string;
    status: OrderStatus;
    total_amount: number;
    commission_amount: number;
    items: OrderItem[];
    notes?: string;
    expires_at: string;
    completed_at?: string;
    created_at: string;
    updated_at: string;
    // For joined queries
    stores?: {
        id: string;
        name: string;
        logo_url?: string;
        address?: string;
    };
    customer?: {
        id: string;
        full_name?: string;
        phone?: string;
        email?: string;
    };
}

export type CouponDiscountType = 'percentage' | 'fixed';

export interface Coupon {
    id: string;
    store_id: string;
    code: string;
    discount_type: CouponDiscountType;
    discount_value: number;
    min_order_amount?: number;
    max_uses?: number;
    current_uses: number;
    expires_at?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export type CommissionStatus = 'pending' | 'paid';

export interface Commission {
    id: string;
    order_id: string;
    store_id: string;
    amount: number;
    status: CommissionStatus;
    paid_at?: string;
    notes?: string;
    created_at: string;
    // For joined queries
    orders?: Order;
}

export interface StoreReview {
    id: string;
    store_id: string;
    customer_id: string;
    order_id?: string;
    rating: number;
    comment?: string;
    merchant_reply?: string;
    replied_at?: string;
    created_at: string;
    updated_at: string;
    // For joined queries
    customer?: {
        id: string;
        full_name?: string;
        avatar_url?: string;
    };
    orders?: {
        id: string;
        items: OrderItem[];
    };
}

// Analytics Types
export interface SalesAnalytics {
    total_sales: number;
    total_orders: number;
    completed_orders: number;
    cancelled_orders: number;
    average_order_value: number;
    commission_total: number;
}

export interface ProductSalesStats {
    product_id: string;
    product_name: string;
    product_image?: string;
    total_sold: number;
    revenue: number;
}

// Egyptian Governorates
export const EGYPTIAN_GOVERNORATES: Governorate[] = [
    { code: 'CAI', name: 'Cairo', name_ar: 'القاهرة' },
    { code: 'ALX', name: 'Alexandria', name_ar: 'الإسكندرية' },
    { code: 'GIZ', name: 'Giza', name_ar: 'الجيزة' },
    { code: 'SHG', name: 'Sharqia', name_ar: 'الشرقية' },
    { code: 'DKH', name: 'Dakahlia', name_ar: 'الدقهلية' },
    { code: 'BNS', name: 'Beni Suef', name_ar: 'بني سويف' },
    { code: 'FYM', name: 'Fayoum', name_ar: 'الفيوم' },
    { code: 'GHB', name: 'Gharbia', name_ar: 'الغربية' },
    { code: 'ISM', name: 'Ismailia', name_ar: 'الإسماعيلية' },
    { code: 'MNF', name: 'Monufia', name_ar: 'المنوفية' },
    { code: 'MIN', name: 'Minya', name_ar: 'المنيا' },
    { code: 'QNA', name: 'Qena', name_ar: 'قنا' },
    { code: 'SIN', name: 'North Sinai', name_ar: 'شمال سيناء' },
    { code: 'SIS', name: 'South Sinai', name_ar: 'جنوب سيناء' },
    { code: 'ASN', name: 'Aswan', name_ar: 'أسوان' },
    { code: 'AST', name: 'Asyut', name_ar: 'أسيوط' },
    { code: 'BH', name: 'Beheira', name_ar: 'البحيرة' },
    { code: 'KFS', name: 'Kafr El Sheikh', name_ar: 'كفر الشيخ' },
    { code: 'MT', name: 'Matruh', name_ar: 'مطروح' },
    { code: 'LX', name: 'Luxor', name_ar: 'الأقصر' },
    { code: 'PTS', name: 'Port Said', name_ar: 'بورسعيد' },
    { code: 'SUZ', name: 'Suez', name_ar: 'السويس' },
    { code: 'SHR', name: 'Sohag', name_ar: 'سوهاج' },
    { code: 'DT', name: 'Damietta', name_ar: 'دمياط' },
    { code: 'QLY', name: 'Qalyubia', name_ar: 'القليوبية' },
    { code: 'WAD', name: 'New Valley', name_ar: 'الوادي الجديد' },
    { code: 'BA', name: 'Red Sea', name_ar: 'البحر الأحمر' },
];
