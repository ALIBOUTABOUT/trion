import React from 'react';
import { Instagram, Phone, MessageCircle } from 'lucide-react';

export function ContactPage() {
  return (
    <div className="pt-24 pb-20 min-h-screen" dir="rtl">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="mb-12">
          <p className="text-gray-500 text-xs tracking-widest uppercase mb-2 font-arabic">تواصل</p>
          <h1 className="text-3xl md:text-4xl font-black text-white font-arabic">تواصل معنا</h1>
          <p className="text-gray-400 mt-3 font-arabic">
            نحن هنا للمساعدة. تواصل معنا عبر أي من القنوات التالية.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              icon: Phone,
              label: 'الهاتف',
              value: '+213 XXX XXX XXX',
              href: 'tel:+213XXXXXXXXX',
              desc: 'متاح من 9ص إلى 9م',
            },
            {
              icon: MessageCircle,
              label: 'واتساب',
              value: 'تواصل عبر واتساب',
              href: 'https://wa.me/213XXXXXXXXX',
              desc: 'للاستفسارات والمتابعة',
            },
            {
              icon: Instagram,
              label: 'إنستغرام',
              value: '@trionwearoff',
              href: 'https://instagram.com/trionwearoff',
              desc: 'تابعنا للتحديثات والعروض',
            },
          ].map(({ icon: Icon, label, value, href, desc }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-5 p-6 bg-[#1A1A1A] border border-[#262626] hover:border-[#404040] transition-colors group"
            >
              <div className="w-12 h-12 border border-[#333] flex items-center justify-center group-hover:border-white transition-colors">
                <Icon size={22} className="text-white" />
              </div>
              <div>
                <p className="text-gray-400 text-xs font-arabic mb-0.5">{label}</p>
                <p className="text-white font-semibold font-arabic">{value}</p>
                <p className="text-gray-500 text-xs font-arabic mt-0.5">{desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
