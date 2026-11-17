import React from 'react';

export function AboutPage() {
  return (
    <div className="pt-24 pb-20 min-h-screen" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="mb-12">
          <p className="text-gray-500 text-xs tracking-widest uppercase mb-2 font-arabic">من نحن</p>
          <h1 className="text-3xl md:text-4xl font-black text-white font-arabic">قصة TRION</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <img
              src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80"
              alt="TRION"
              className="w-full aspect-square object-cover"
            />
          </div>
          <div className="space-y-6">
            <p className="text-gray-300 leading-relaxed font-arabic">
              TRION.WEAR.OFF هي علامة جزائرية للملابس العصرية، تأسست بشغف حقيقي للأزياء والهوية الجزائرية.
            </p>
            <p className="text-gray-400 leading-relaxed font-arabic">
              نؤمن بأن الأسلوب الجيد يبدأ من تصميم صادق، وقماش عالي الجودة، وسعر عادل. كل قطعة نصممها تحمل بصمتنا الخاصة وتعكس روح الشباب الجزائري المعاصر.
            </p>
            <p className="text-gray-400 leading-relaxed font-arabic">
              هدفنا بسيط: أن نجعل كل عميل في الجزائر يشعر بالثقة والأناقة بملابس تليق به.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { number: '58', label: 'ولاية يصلها توصيلنا' },
            { number: '100%', label: 'دفع عند الاستلام' },
            { number: '2', label: 'منتجات في مجموعتنا الأولى' },
          ].map(({ number, label }) => (
            <div key={label} className="bg-[#1A1A1A] border border-[#262626] p-8 text-center">
              <p className="text-4xl font-black text-white mb-2">{number}</p>
              <p className="text-gray-400 text-sm font-arabic">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
