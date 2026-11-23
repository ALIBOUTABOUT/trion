import React from 'react';
import { RotateCcw, Truck, CheckCircle2, Clock } from 'lucide-react';

export function ReturnPolicyPage() {
  return (
    <div className="pt-28 pb-20 min-h-screen bg-[#0A0A0A]" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-10 pb-6 border-b border-[#1A1A1A]">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-[#333] text-gray-400 text-xs font-arabic mb-3">
            <RotateCcw size={14} />
            <span>الاستبدال والتوصيل</span>
          </div>
          <h1 className="text-3xl font-black text-white font-arabic">سياسة التوصيل والاستبدال</h1>
          <p className="text-gray-400 text-sm font-arabic mt-2">
            كل ما تحتاج معرفته حول شحن واستلام وتغيير مقاسات مشترياتك من TRION.WEAR.OFF
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8 text-gray-300 font-arabic text-sm leading-relaxed">
          <section className="bg-[#141414] border border-[#222] p-6">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Truck size={18} className="text-gray-400" />
              1. مدة ورسوم التوصيل
            </h2>
            <div className="space-y-2 text-gray-400">
              <p>• نوصل إلى جميع الولايات الـ 58 في الجزائر.</p>
              <p>• رسوم التوصيل الوطنية ثابتة ومعلنة في سلة الشراء (500 دج).</p>
              <p>• مدة التوصيل المعتادة: من يومين إلى 5 أيام عمل بحسب الولاية وبعد تأكيد الطلب هاتفياً.</p>
            </div>
          </section>

          <section className="bg-[#141414] border border-[#222] p-6">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Clock size={18} className="text-gray-400" />
              2. شروط استبدال المقاس
            </h2>
            <p className="mb-2">
              نضمن لك حق استبدال المقاس في حال لم يناسبك خلال <strong className="text-white">48 ساعة</strong> من استلام الطلبية وفق الشروط التالية:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-400 pr-2">
              <li>أن تكون القطعة في حالتها الأصلية غير ملبوسة وبكامل بطاقاتها (Tag).</li>
              <li>عدم وجود أي آثار عطور أو غسيل أو ضرر في القماش.</li>
              <li>توفر المقاس البديل المطلوب في المخزن.</li>
            </ul>
          </section>

          <section className="bg-[#141414] border border-[#222] p-6">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-gray-400" />
              3. كيفية طلب الاستبدال
            </h2>
            <p>
              لتسجيل طلب استبدال المقاس، يرجى التواصل معنا عبر:
            </p>
            <div className="mt-3 p-4 bg-[#1A1A1A] border border-[#262626] space-y-2">
              <p className="font-arabic">
                📞 الهاتف: <span className="font-mono text-white font-bold">0557 91 92 24</span>
              </p>
              <p className="font-arabic">
                📸 إنستغرام: <span className="text-white">@trion.wear.off</span> (إرسال رقم الطلب واسم الزبون)
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
