# Outfit Hub - نظرة عامة على المشروع

## 📋 ملخص المشروع

**Outfit Hub** هو marketplace للملابس والأزياء في المنيا، مصر. المنصة بتربط التجار بالعملاء وبتسمح للتجار بإنشاء متاجرهم الخاصة وعرض منتجاتهم.

### نموذج العمل (Business Model)
- عمولة 3% على كل عملية بيع
- التجار يدفعوا عمولة بعد البيع
- العملاء يطلبوا من محلات مختلفة
- التجار يستلموا الطلبات عن طريق QR Code

---

## 🛠️ البنية التقنية (Tech Stack)

### Frontend & Framework
- **Next.js 16.1.6** (App Router) مع Turbopack
- **React 19** مع TypeScript
- **Tailwind CSS** للتصميم
- **Material Symbols** للأيقونات

### Backend & Database
- **Supabase** (PostgreSQL + Auth + Storage + Real-time)
- **Row Level Security (RLS)** للأمان
- **Supabase Storage** لتخزين الصور

### الحزم المهمة
```json
{
  "@supabase/ssr": "^0.6.1",
  "@supabase/supabase-js": "^2.49.2",
  "next": "16.1.6",
  "react": "^19.0.0",
  "typescript": "^5"
}
```

---

## 🗄️ قاعدة البيانات (Database Schema)

### الجداول الرئيسية

#### 1. users (مدمج مع Supabase Auth)
- `id` - UUID
- `email` - string
- `role` - enum: 'customer' | 'merchant' | 'admin'
- `phone` - string
- `created_at` - timestamp

#### 2. stores (محلات التجار)
```sql
- id (UUID, PK)
- merchant_id (UUID, FK -> users.id)
- name (TEXT)
- description (TEXT)
- logo_url (TEXT)
- cover_url (TEXT)
- phone (TEXT)
- address (TEXT)
- is_active (BOOLEAN) -- موافقة الإدمن
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 3. store_categories (فئات المحل)
```sql
- id (UUID, PK)
- store_id (UUID, FK -> stores.id)
- name (TEXT) -- English name
- name_ar (TEXT) -- Arabic name (رجالي، حريمي، أطفالي...)
- description (TEXT)
- display_order (INTEGER) -- ترتيب العرض
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- UNIQUE(store_id, name)
```

#### 4. products (المنتجات)
```sql
- id (UUID, PK)
- store_id (UUID, FK -> stores.id)
- category_id (UUID, FK -> store_categories.id, NULLABLE)
- name (TEXT)
- description (TEXT)
- price (NUMERIC)
- old_price (NUMERIC, NULLABLE) -- للخصومات
- category (TEXT) -- ملابس، أحذية، شنط، إكسسوارات...
- gender_filter (TEXT) -- رجالي، حريمي، أطفالي، الكل
- sizes (TEXT[]) -- ["S", "M", "L", "XL"]
- colors (TEXT[]) -- ["أسود", "أبيض", "أزرق"]
- image_urls (TEXT[]) -- مصفوفة روابط الصور
- stock_quantity (INTEGER)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 5. orders (الطلبات)
```sql
- id (UUID, PK)
- customer_id (UUID, FK -> users.id)
- store_id (UUID, FK -> stores.id)
- total (NUMERIC)
- commission (NUMERIC) -- 3% من السعر
- status (TEXT) -- 'pending', 'confirmed', 'ready', 'completed', 'cancelled'
- qr_code (TEXT) -- كود التسليم
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 6. order_items (عناصر الطلب)
```sql
- id (UUID, PK)
- order_id (UUID, FK -> orders.id)
- product_id (UUID, FK -> products.id)
- quantity (INTEGER)
- price (NUMERIC) -- سعر المنتج وقت الطلب
- size (TEXT, NULLABLE)
- color (TEXT, NULLABLE)
```

#### 7. saved_products (المنتجات المحفوظة)
```sql
- id (UUID, PK)
- user_id (UUID, FK -> users.id)
- product_id (UUID, FK -> products.id)
- created_at (TIMESTAMP)
```

#### 8. reviews (التقييمات)
```sql
- id (UUID, PK)
- store_id (UUID, FK -> stores.id)
- customer_id (UUID, FK -> users.id)
- rating (INTEGER) -- 1-5
- comment (TEXT)
- created_at (TIMESTAMP)
```

---

## 📁 هيكل المشروع (Folder Structure)

```
outfit-hub-master/
├── app/
│   ├── (customer)/          # صفحات العملاء
│   │   ├── page.tsx         # الصفحة الرئيسية
│   │   ├── mall/            # المول - كل المحلات
│   │   ├── stores/[id]/     # صفحة المحل
│   │   ├── products/[id]/   # صفحة تفاصيل المنتج
│   │   ├── cart/            # السلة
│   │   ├── saved/           # المنتجات المحفوظة
│   │   ├── orders/          # الطلبات
│   │   └── profile/         # الملف الشخصي
│   │
│   ├── merchant/            # لوحة التاجر
│   │   ├── dashboard/       # لوحة التحكم
│   │   ├── setup/           # إنشاء محل جديد
│   │   ├── pending/         # في انتظار الموافقة
│   │   ├── products/        # المنتجات
│   │   │   ├── page.tsx     # قائمة المنتجات
│   │   │   ├── new/         # إضافة منتج جديد
│   │   │   └── [id]/edit/   # تعديل منتج
│   │   ├── categories/      # إدارة الفئات
│   │   ├── orders/          # الطلبات
│   │   ├── pickup/          # تسليم الطلبات (QR Scanner)
│   │   ├── analytics/       # التحليلات
│   │   ├── reviews/         # التقييمات
│   │   └── settings/        # الإعدادات
│   │
│   ├── login/               # تسجيل الدخول
│   ├── register/            # التسجيل
│   ├── api/                 # API Routes
│   └── layout.tsx           # Root Layout
│
├── components/
│   ├── Navigation.tsx       # Bottom Nav + Merchant Sidebar
│   ├── ProductCard.tsx      # بطاقة المنتج
│   ├── StoreCard.tsx        # بطاقة المحل
│   ├── Toast.tsx            # رسائل التنبيه
│   └── ...
│
├── hooks/
│   ├── useCart.tsx          # إدارة السلة (localStorage)
│   └── ...
│
├── lib/
│   └── supabase/
│       ├── client.ts        # Browser client
│       └── server.ts        # Server client
│
├── middleware.ts            # Authentication & Authorization
│
├── supabase/
│   └── migrations/          # SQL Migrations
│       ├── create_store_categories_table.sql
│       └── ...
│
├── public/
│   └── ...
│
├── .env.local               # Environment Variables
├── next.config.ts           # Next.js Config
├── tailwind.config.ts       # Tailwind Config
└── tsconfig.json            # TypeScript Config
```

---

## 👥 أنواع المستخدمين

### 1. العملاء (Customers)
- تصفح المحلات والمنتجات
- إضافة منتجات للسلة
- إتمام الطلبات
- حفظ المنتجات المفضلة
- تقييم المحلات

### 2. التجار (Merchants)
- إنشاء وإدارة محل
- إضافة وتعديل المنتجات
- تقسيم المحل لفئات (رجالي، حريمي...)
- إدارة الطلبات
- تسليم الطلبات عبر QR Code
- عرض التحليلات والإحصائيات

### 3. الإدارة (Admin) - قيد التطوير
- الموافقة على المحلات الجديدة
- إدارة العمولات
- مراقبة النظام

---

## 🔑 الميزات الرئيسية

### ✅ تم تنفيذها

1. **نظام المصادقة**
   - تسجيل دخول بالبريد الإلكتروني
   - تسجيل حسابات جديدة (عميل/تاجر)
   - Middleware للحماية

2. **لوحة التاجر**
   - إنشاء محل جديد
   - إضافة منتجات (صور متعددة، مقاسات، ألوان، أسعار)
   - تعديل المنتجات
   - إدارة الفئات (رجالي، حريمي، أطفالي...)
   - تفعيل/إيقاف المنتجات
   - تسليم الطلبات بـ QR Code

3. **صفحات العملاء**
   - الصفحة الرئيسية (منتجات مميزة)
   - المول (كل المحلات)
   - صفحة المحل (مع فلترة بالفئات)
   - صفحة المنتج (تفاصيل كاملة)
   - السلة
   - المحفوظات (Saved)
   - الطلبات

4. **نظام الفئات**
   - التاجر يقدر يقسم محله لفئات
   - ربط المنتجات بالفئات
   - عرض الفئات في صفحة المحل
   - فلترة المنتجات حسب الفئة

5. **السلة والطلبات**
   - إضافة منتجات للسلة
   - حفظ السلة في localStorage
   - إتمام الطلب
   - QR Code لكل طلب
   - حالات الطلب (pending, confirmed, ready, completed)

### 🔄 قيد التطوير

- نظام الكوبونات
- التحليلات المتقدمة
- لوحة الإدمن
- نظام الإشعارات
- تقييمات المنتجات

---

## 🎨 نظام التصميم

### الألوان
```css
--primary: #FFC107 (أصفر ذهبي)
--background-light: #f5f5f5
--background-dark: #0d121b
--text-dark: #0d121b
--text-light: #ffffff
```

### Dark Mode
المشروع يدعم الوضع الداكن بالكامل باستخدام Tailwind dark: variant

### الخطوط
- **Material Symbols Outlined** للأيقونات
- Default system fonts

---

## 🔐 الأمان (Security)

### Middleware Protection
```typescript
// middleware.ts
- التحقق من تسجيل الدخول
- التحقق من نوع المستخدم (customer/merchant)
- التحقق من حالة المحل (is_active)
- إعادة التوجيه حسب الصلاحيات
```

### Row Level Security (RLS)
جميع الجداول محمية بـ RLS policies في Supabase

---

## 📝 ملاحظات مهمة

1. **Turbopack**
   - المشروع يستخدم Next.js 16.1.6 مع Turbopack
   - أحياناً الـ cache بيعمل مشاكل - حلها: حذف `.next` folder

2. **Environment Variables**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

3. **Storage Buckets**
   - `products` - صور المنتجات
   - `stores` - صور المحلات (logo, cover)

4. **القيم الافتراضية**
   - العمولة: 3% من سعر الطلب
   - حد أقصى للصور: 10 صور لكل منتج
   - حجم الصورة: أقل من 2MB

5. **الـ Navigation**
   - العملاء: Bottom Navigation (Home, Mall, Saved, Cart, Profile)
   - التجار: Right Sidebar مع قائمة كاملة

---

## 🚀 كيفية التشغيل

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

الموقع يفتح على: http://localhost:3000

---

## 📊 الإحصائيات والتحليلات

### لوحة التاجر تعرض:
- إجمالي المبيعات
- عدد الطلبات
- المنتجات النشطة
- التقييمات

---

## 🐛 المشاكل المعروفة والحلول

### 1. Jest Worker Crash (Turbopack)
**المشكلة**: أحياناً الـ dev server يعمل crash عند فتح صفحات معينة
**الحل**:
```bash
# Kill all Node processes
Get-Process node | Stop-Process -Force

# Delete .next cache
Remove-Item -Recurse -Force .next

# Restart server
npm run dev
```

### 2. Middleware Warning
**المشكلة**: تحذير "middleware file convention is deprecated"
**الحل**: في المستقبل تغيير `middleware.ts` إلى `proxy.ts` (Next.js requirement)

---

## 📞 معلومات الاتصال والدعم

- الموقع الجغرافي: المنيا، مصر
- اللغة الأساسية: العربية
- اللغة الاحتياطية: English

---

## 🔄 آخر التحديثات

### 2026-02-06
- ✅ إضافة ميزة تعديل المنتجات
- ✅ إضافة نظام الفئات للمحلات (store_categories)
- ✅ ربط المنتجات بالفئات
- ✅ فلترة المنتجات في صفحة المحل حسب الفئة
- ✅ إصلاح مشكلة Turbopack crash

---

## 💡 نصائح للتطوير

1. **عند إضافة صفحات جديدة**:
   - تأكد من إضافتها في الـ middleware إذا كانت محمية
   - استخدم `'use client'` للصفحات اللي تحتاج client-side interactions

2. **عند التعامل مع Supabase**:
   - استخدم `createBrowserClient` في Client Components
   - استخدم `createServerClient` في Server Components/Actions

3. **عند إضافة migrations**:
   - ضع الملفات في `supabase/migrations/`
   - شغّل الـ migration على Supabase Dashboard

4. **عند التعامل مع الصور**:
   - تأكد من رفع الصور على Supabase Storage
   - استخدم `getPublicUrl()` لجلب رابط الصورة

---

## 🎯 الأهداف المستقبلية

- [ ] إضافة نظام الدفع الإلكتروني
- [ ] إضافة نظام الإشعارات (Push Notifications)
- [ ] تحسين الـ SEO
- [ ] إضافة PWA Support
- [ ] إضافة Chat بين التاجر والعميل
- [ ] إضافة نظام الشحن والتوصيل
- [ ] إضافة لوحة تحكم للإدمن

---

**آخر تحديث**: 6 فبراير 2026
**الإصدار**: 1.0.0
