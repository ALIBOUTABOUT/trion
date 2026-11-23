import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Phone, MapPin, ShieldCheck } from 'lucide-react';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#0A0A0A] border-t border-[#1A1A1A] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <span className="text-white font-bold text-lg tracking-widest">
              TRION<span className="text-gray-500">.</span>WEAR<span className="text-gray-500">.</span>OFF
            </span>
            <p className="mt-3 text-gray-500 text-sm leading-relaxed font-arabic">
              علامة أزياء عصرية أصيلة من الجزائر. نوصل إلى جميع الولايات الـ 58 مع خيار الدفع نقداً عند الاستلام.
            </p>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 font-arabic">روابط سريعة</h3>
            <ul className="space-y-2">
              {[
                { to: '/', label: 'الرئيسية' },
                { to: '/products', label: 'جميع المنتجات' },
                { to: '/about', label: 'من نحن' },
                { to: '/contact', label: 'تواصل معنا' },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-gray-500 hover:text-white text-sm transition-colors font-arabic">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal / Policies */}
          <div>
            <h3 className="text-white font-semibold mb-4 font-arabic">السياسات والضمان</h3>
            <ul className="space-y-2">
              {[
                { to: '/returns', label: 'التوصيل واستبدال المقاس' },
                { to: '/privacy', label: 'سياسة الخصوصية' },
                { to: '/terms', label: 'الشروط والأحكام' },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-gray-500 hover:text-white text-sm transition-colors font-arabic">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4 font-arabic">خدمة الزبائن</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://instagram.com/trion.wear.off"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm"
                >
                  <Instagram size={16} />
                  <span className="font-arabic">@trion.wear.off</span>
                </a>
              </li>
              <li>
                <a
                  href="tel:+213557919224"
                  className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm"
                >
                  <Phone size={16} />
                  <span className="font-mono">0557 91 92 24</span>
                </a>
              </li>
              <li className="flex items-center gap-2 text-gray-500 text-sm">
                <MapPin size={16} />
                <span className="font-arabic">الجزائر (58 ولاية)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#1A1A1A] pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-xs font-arabic">
            &copy; {year} TRION.WEAR.OFF — جميع الحقوق محفوظة
          </p>
          <div className="flex items-center gap-6">
            <span className="text-gray-600 text-xs font-arabic flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-500" />
              الدفع عند الاستلام
            </span>
            <span className="text-gray-600 text-xs font-arabic">التوصيل لـ 58 ولاية</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
