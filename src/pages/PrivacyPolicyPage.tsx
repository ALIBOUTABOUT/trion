import React from 'react';
import { Shield, Lock, Eye, FileText } from 'lucide-react';

export function PrivacyPolicyPage() {
  return (
    <div className="pt-28 pb-20 min-h-screen bg-[#0A0A0A]" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-10 pb-6 border-b border-[#1A1A1A]">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-[#333] text-gray-400 text-xs font-arabic mb-3">
            <Shield size={14} />
            <span>حماية البيانات والخصوصية</span>
          </div>
          <h1 className="text-3xl font-black text-white font-arabic">سياسة الخصوصية</h1>
          <p className="text-gray-400 text-sm font-arabic mt-2">
            آخر تحديث: نوفمبر 2026 — التزامنا بحماية بيانات زبائن متجر TRION.WEAR.OFF
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8 text-gray-300 font-arabic text-sm leading-relaxed">
          <section className="bg-[#141414] border border-[#222] p-6">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Eye size={18} className="text-gray-400" />
              1. البيانات التي نجمعها
            </h2>
            <p className="mb-2">
              عند قيامك بطلب منتج من متجرنا، نجمع فقط المعلومات الضرورية لتوصيل طلبيتك والتواصل معك:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-400 pr-2">
              <li>الاسم واللقب لتسجيل الطلبية.</li>
              <li>رقم الهاتف للتواصل وتأكيد موعد التوصيل معك من قبل الموزع.</li>
              <li>الولاية، البلدية، وعنوان التوصيل المفصل لإيصال الشحنة.</li>
              <li>أي ملاحظات خاصة بالتوصيل تضيفها اختيارياً.</li>
            </ul>
            <p className="mt-3 text-xs text-gray-500">
              * ملاحظة: لا نطلب إنشاء حساب أو كلمات مرور للتسوق في متجرنا.
            </p>
          </section>

          <section className="bg-[#141414] border border-[#222] p-6">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <FileText size={18} className="text-gray-400" />
              2. كيف نستخدم بياناتك
            </h2>
            <p>
              تُستخدم بياناتك لغرض واحد فقط وهو:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-400 pr-2 mt-2">
              <li>معالجة طلبيتك وتجهيزها في المخزن.</li>
              <li>الاتصال بك هاتفياً لتأكيد المقاسات وتاريخ التوصيل.</li>
              <li>تسليم معلومات العنوان لشركة التوصيل الشريكة لإيصال الطلب.</li>
            </ul>
          </section>

          <section className="bg-[#141414] border border-[#222] p-6">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Lock size={18} className="text-gray-400" />
              3. أمان وحماية المعلومات
            </h2>
            <p>
              نحن نلتزم بحماية بياناتك الشخصية وعدم بيعها أو مشاركتها أو تأجيرها لأي طرف ثالث لأغراض إعلانية. بياناتك مخزنة في قواعد بيانات مشفرة ومحمية بسياسات أمان مشددة (Row Level Security) تمنع أي وصول غير مصرح به.
            </p>
          </section>

          <section className="bg-[#141414] border border-[#222] p-6">
            <h2 className="text-lg font-bold text-white mb-3">4. تواصل معنا بخصوص خصوصيتك</h2>
            <p>
              إذا كان لديك أي استفسار بخصوص بياناتك أو ترغب في تعديل أو حذف معلومات طلبيتك، يمكنك التواصل معنا مباشرة عبر الهاتف:
              <span className="text-white font-mono font-bold mr-2">0557 91 92 24</span>
              أو عبر حسابنا على إنستغرام:
              <a href="https://instagram.com/trion.wear.off" target="_blank" rel="noreferrer" className="text-white underline mr-1">
                @trion.wear.off
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
