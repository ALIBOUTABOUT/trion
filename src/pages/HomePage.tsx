import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Truck, CreditCard, Zap, ChevronRight } from 'lucide-react';
import { ProductCard } from '../components/products/ProductCard';
import { getProducts, getStoreSettings } from '../lib/services';
import type { Product } from '../types';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div dir="rtl">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0A0A0A]">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="/trion-hero.png"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80';
            }}
            alt="TRION.WEAR.OFF"
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/70 via-[#0A0A0A]/40 to-[#0A0A0A]" />
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <div className="inline-block mb-6">
            <span className="text-xs text-gray-400 tracking-[0.3em] uppercase font-arabic border border-[#333] px-4 py-1.5">
              الموضة الجزائرية الحديثة
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white leading-tight font-arabic mb-6">
            الأسلوب الذي
            <br />
            <span className="text-gray-400">يعبّر عنك</span>
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto font-arabic mb-10 leading-relaxed">
            ملابس عصرية بتصاميم أصيلة. التوصيل إلى 58 ولاية جزائرية. الدفع عند الاستلام.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/products">
              <Button size="lg">
                تسوق الآن
                <ArrowLeft size={18} />
              </Button>
            </Link>
            <Link to="/about">
              <Button variant="ghost" size="lg">
                من نحن
              </Button>
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-600">
          <div className="w-px h-10 bg-gradient-to-b from-transparent to-gray-600" />
        </div>
      </section>

      {/* Benefits bar */}
      <section className="bg-[#0A0A0A] border-y border-[#1A1A1A]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-[#1A1A1A]">
            {[
              { icon: CreditCard, title: 'الدفع عند الاستلام', desc: 'ادفع حين تستلم طلبك' },
              { icon: Truck, title: 'التوصيل إلى 58 ولاية', desc: 'نوصل لكامل التراب الجزائري' },
              { icon: Zap, title: 'طلب سريع وسهل', desc: 'اطلب في دقائق معدودة' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-4 py-6 px-6">
                <Icon className="w-8 h-8 text-white flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold text-sm font-arabic">{title}</p>
                  <p className="text-gray-500 text-xs font-arabic mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="mb-12">
          <p className="text-gray-500 text-xs tracking-widest uppercase mb-2 font-arabic">منتجاتنا</p>
          <div className="flex items-end justify-between">
            <h2 className="section-title">المجموعة الحالية</h2>
            <Link to="/products" className="hidden sm:flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-sm font-arabic">
              عرض الكل <ChevronRight size={16} />
            </Link>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner text="جاري التحميل..." />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <div className="mt-10 text-center sm:hidden">
          <Link to="/products">
            <Button variant="secondary">عرض جميع المنتجات</Button>
          </Link>
        </div>
      </section>

      {/* Brand story */}
      <section className="py-20 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <img
                src="https://images.unsplash.com/photo-1612198790700-0c0a0cb2e3e4?w=800&q=80"
                alt="TRION brand"
                className="w-full aspect-square object-cover"
              />
            </div>
            <div className="order-1 md:order-2">
              <p className="text-gray-500 text-xs tracking-widest uppercase mb-3 font-arabic">قصتنا</p>
              <h2 className="text-3xl md:text-4xl font-black text-white font-arabic mb-6 leading-tight">
                أصيلون في أسلوبنا
              </h2>
              <p className="text-gray-400 leading-relaxed font-arabic mb-6">
                TRION.WEAR.OFF علامة جزائرية تؤمن بأن الأسلوب ليس ترفاً بل هوية. نصمم ملابس تعكس الثقافة الجزائرية الحديثة بلمسة عالمية راقية.
              </p>
              <p className="text-gray-400 leading-relaxed font-arabic mb-8">
                كل قطعة تُصنع بعناية واهتمام بالتفاصيل، لتدوم طويلاً وتجعلك مميزاً في أي مكان.
              </p>
              <Link to="/about">
                <Button variant="secondary">اعرف أكثر عنا</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
