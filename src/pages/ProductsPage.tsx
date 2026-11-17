import React, { useEffect, useState } from 'react';
import { getProducts } from '../lib/services';
import { ProductCard } from '../components/products/ProductCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import type { Product } from '../types';

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch(() => setError('فشل تحميل المنتجات'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="pt-20 pb-20 min-h-screen" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Page header */}
        <div className="py-12 border-b border-[#1A1A1A] mb-10">
          <p className="text-gray-500 text-xs tracking-widest uppercase mb-2 font-arabic">تسوق</p>
          <h1 className="text-3xl md:text-4xl font-black text-white font-arabic">جميع المنتجات</h1>
        </div>

        {loading ? (
          <LoadingSpinner text="جاري تحميل المنتجات..." />
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-400 font-arabic">{error}</p>
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            title="لا توجد منتجات بعد"
            description="سيتم إضافة منتجات قريباً"
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
