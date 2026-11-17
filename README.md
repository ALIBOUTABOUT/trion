# TRION.WEAR.OFF — E-commerce Platform

منصة تجارة إلكترونية متكاملة وعصرية لعلامة الملابس الجزائرية **TRION.WEAR.OFF**.

---

## 📌 مميزات المشروع

- **تصميم أزياء فاخر ومينيماليست:** ألوان سوداء وفحمية متناسقة (`#0A0A0A`, `#111111`, `#1A1A1A`) مستوحاة من ثقافة أزياء الشارع الفاخرة (Minimalist Luxury Streetwear).
- **واجهة عربية أصيلة 100% بنظام RTL:** خط عربي أنيق (Cairo و Tajawal)، وتوجيه شامل لجميع العناصر والنماذج.
- **تجربة تسوق فائقة السلاسة:** بدون الحاجة لإنشاء حساب؛ يختار الزبون المقاس واللون والكمية ويطلب بنقرة واحدة.
- **تغطية شاملة لـ 58 ولاية جزائرية:** قائمة كاملة لجميع الولايات مع حقل البلدية والعنوان بالتفصيل، والتحقق من أرقام الهواتف الجزائرية (`05`, `06`, `07`).
- **الدفع عند الاستلام (Cash on Delivery):** الخيار المفضل والوحيد للمشترين.
- **إدارة ذكية للمخزون (Inventory Management):** إدارة مستقلة لكميات كل تركيبة (مقاس + لون)، ومنع شراء أي متغير نفذ من المخزون، واسترجاع تلقائي للمخزون عند إلغاء أي طلبية.
- **لوحة تحكم إدارية محمية بالكامل (`/admin`):**
  - نظرة عامة وإحصائيات المبيعات، الطلبات المعلقة، والمؤكدة والمسلمة.
  - إدارة كاملة للطلبات مع إمكانية الاتصال المباشر بالزبون بنقرة واحدة (`tel:`).
  - إدارة المنتجات (إضافة، تعديل، إخفاء/إظهار، حذف، ورفع الصور).
  - ضبط المخزون لكل مقاس ولون بدقة.
  - حماية مسارات الإدارة عبر Supabase Auth وتأمينها على مستوى قاعدة البيانات (Row Level Security).
- **تكامل آمن مع WhatsApp Cloud API:** إرسال إشعار تلقائي بتفاصيل كل طلبية جديدة إلى رقم واتساب المتجر عبر دالة خادم آمنة (Supabase Edge Function) بدون إظهار أي مفاتيح سرية في واجهة المتصفح، وبدون إفساد الطلب في حال واجهت خدمة واتساب أي عطل مؤقت.

---

## 🛠️ بنية التقنيات المستخدمة (Tech Stack)

- **الواجهة الأمامية:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React, React Router 6.
- **قاعدة البيانات والخدمات السحابية:** Supabase (PostgreSQL 15+, Row Level Security, Supabase Auth, Supabase Storage).
- **الدوال الخادمة الآمنة:** Supabase Edge Functions (Deno Runtime).
- **بوابة الإشعارات:** Meta WhatsApp Business Platform / Cloud API.
- **الاستضافة:** Vercel.

---

## 🚀 التشغيل والتطوير المحلي (Local Development)

### 1. تثبيت الحزم:
```bash
npm install
```

### 2. إعداد ملف البيئة:
قم بإنشاء ملف `.env` بناءً على `.env.example`:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```
*(ملاحظة: إذا لم تقم بإدخال مفاتيح Supabase، سيعمل المشروع تلقائياً في نمط العرض التجريبي **Mock Mode** ببيانات المنتجات الافتراضية وسلة التسوق المحلية).*

### 3. تشغيل خادم التطوير:
```bash
npm run dev
```

### 4. بناء نسخة الإنتاج:
```bash
npm run build
```

---

## 📁 الهيكل البرمجي للمشروع (Project Structure)

```
trion/
├── public/
│   ├── favicon.svg             # أيقونة الموقع
│   └── trion-hero.png          # صورة الهوية البصرية لـ TRION
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx    # حماية مسارات لوحة الإدارة
│   │   ├── cart/
│   │   │   └── CartDrawer.tsx       # درج سلة التسوق المنزلق
│   │   ├── layout/
│   │   │   ├── CustomerLayout.tsx   # تخطيط واجهة الزبائن
│   │   │   ├── Header.tsx           # شريط الترويسة
│   │   │   ├── Footer.tsx           # تذييل الموقع
│   │   │   └── AdminLayout.tsx      # تخطيط لوحة الإدارة والشريط الجانبي
│   │   ├── products/
│   │   │   └── ProductCard.tsx      # بطاقة عرض المنتج
│   │   └── ui/
│   │       ├── Badge.tsx            # شارات حالات الطلب
│   │       ├── Button.tsx           # زر تفاعلي مع حالات التحميل
│   │       ├── EmptyState.tsx       # حالة القوائم الفارغة
│   │       ├── Input.tsx            # حقل إدخال نصوص
│   │       ├── LoadingSpinner.tsx   # مؤشر التحميل
│   │       ├── Modal.tsx            # نافذة منبثقة تفاعلية
│   │       └── Select.tsx           # قائمة اختيار منسدلة
│   ├── context/
│   │   └── CartContext.tsx          # سياق إدارة السلة المشترك
│   ├── hooks/
│   │   ├── useAuth.ts               # خطاف إدارة جلسة المدير في Supabase
│   │   └── useCart.ts               # خطاف سلة التسوق
│   ├── lib/
│   │   ├── cart.ts                  # إدارة سلة التسوق محلياً في localStorage
│   │   ├── constants.ts             # قائمة الـ 58 ولاية، المقاسات، وحالات الطلب
│   │   ├── mock-data.ts             # بيانات تجريبية افتراضية
│   │   ├── services.ts              # دوال استرجاع وتحديث البيانات من Supabase
│   │   ├── supabase.ts              # تهيئة عميل Supabase
│   │   └── validation.ts            # التحقق من أرقام الهواتف الجزائرية وتنسيق الأسعار
│   ├── pages/
│   │   ├── HomePage.tsx             # الصفحة الرئيسية والبانر
│   │   ├── ProductsPage.tsx         # صفحة تشكيلة المنتجات
│   │   ├── ProductDetailPage.tsx    # صفحة تفاصيل المنتج، اختيار المقاس واللون
│   │   ├── CheckoutPage.tsx         # صفحة الدفع وتأكيد الطلب
│   │   ├── AboutPage.tsx            # صفحة من نحن وقصة العلامة
│   │   ├── ContactPage.tsx          # صفحة التواصل
│   │   ├── NotFoundPage.tsx         # صفحة 404
│   │   └── admin/
│   │       ├── AdminLoginPage.tsx      # تسجيل دخول المسؤول
│   │       ├── AdminDashboardPage.tsx  # نظرة عامة والإحصائيات
│   │       ├── AdminOrdersPage.tsx     # إدارة ومتابعة الطلبات
│   │       ├── AdminProductsPage.tsx   # إدارة المنتجات والأسعار
│   │       └── AdminInventoryPage.tsx  # إدارة المخزون والمقاسات
│   ├── styles/
│   │   └── globals.css              # إعدادات Tailwind والتوجيه RTL
│   ├── types/
│   │   └── index.ts                 # واجهات TypeScript لجميع كيانات النظام
│   ├── App.tsx                      # مسارات التطبيق والتوجيه
│   ├── main.tsx                     # نقطة دخول React
│   └── vite-env.d.ts                # تعريفات بيئة عمل Vite
├── supabase/
│   ├── schema.sql                   # مخطط قاعدة البيانات وسياسات الأمان RLS
│   └── functions/
│       └── submit-order/
│           └── index.ts             # دالة Edge Function لمعالجة الطلب وإشعار واتساب
├── tailwind.config.js               # تكوين Tailwind وسمة العلامة التجارية
├── vite.config.ts                   # تكوين Vite وتوزيع الحزم (Chunk Splitting)
└── vercel.json                      # تكوين إعادة التوجيه لـ Vercel SPA
```
