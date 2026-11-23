import React from 'react';
import { FileCheck, ShieldAlert, ShoppingBag, Truck } from 'lucide-react';

export function TermsPage() {
  return (
    <div className="pt-28 pb-20 min-h-screen bg-[#0A0A0A]" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-10 pb-6 border-b border-[#1A1A1A]">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-[#333] text-gray-400 text-xs font-arabic mb-3">
            <FileCheck size={14} />
            <span>الشروط والأحكام الرسمية</span>
          </div>
          <h1 className="text-3xl font-black text-white font-arabic">شروط الاستخدام والطلب</h1>
          <p className="text-gray-400 text-sm font-arabic mt-2">
            شروط الشراء والتعامل مع متجر TRION.WEAR.OFF في الجزائر
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8 text-gray-300 font-arabic text-sm leading-relaxed">
          <section className="bg-[#141414] border border-[#222] p-6">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <ShoppingBag size={18} className="text-gray-400" />
              1. إتمام الطلب وتأكيده
            </h2>
            <p className="mb-2">
              عند قيامك بتقديم طلب عبر الموقع، يعتبر الطلب مبدئياً حتى يتم تأكيده هاتفياً من قبل خدمة العملاء:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-400 pr-2">
              <li>سيتصل بك فريقنا هاتفياً خلال 24 ساعة لتأكيد معلومات التوصيل والمقاسات.</li>
              <li>الطلبات التي يتعذر التواصل مع أصحابها خلال 48 ساعة قد تعتبر ملغاة تلقائياً.</li>
              <li>يرجى التأكد من كتابة رقم هاتف صالح وفي وضع العمل لتجنب تأخر الشحنة.</li>
            </ul>
          </section>

          <section className="bg-[#141414] border border-[#222] p-6">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Truck size={18} className="text-gray-400" />
              2. الدفع عند الاستلام (COD)
            </h2>
            <p>
              طريقة الدفع المعتمدة في متجرنا هي الدفع نقداً عند استلام طلبيتك لجميع الولايات الـ 58. لا نطلب أي دفع مسبق بالبطاقة البنكية أو الحوالة البريدية.
            </p>
          </section>

          <section className="bg-[#141414] border border-[#222] p-6">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <ShieldAlert size={18} className="text-gray-400" />
              3. الأسعار وتوفر المنتجات
            </h2>
            <p>
              جميع الأسعار المعروضة في المتجر هي بالدينار الجزائري (DA) ومحددة بوضوح. المخزون محدد ومرتبط بالنظام الفعلي. في حال نفاد أي مقاس أو لون أثناء معالجة الطلب، يتم إخطار الزبون فوراً بالخيارات البديلة أو إلغاء الطلب دون أي التزام مالي.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
