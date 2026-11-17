import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import type { Product } from '../../types';
import { formatPrice } from '../../lib/validation';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const colors = product.variants
    ? [...new Map(product.variants.map((v) => [v.color, v])).values()]
    : [];
  const hasStock = product.variants?.some((v) => v.stock > 0) ?? false;

  return (
    <div className="group bg-[#1A1A1A] border border-[#262626] hover:border-[#404040] transition-all duration-300">
      {/* Image */}
      <Link to={`/products/${product.id}`} className="block relative overflow-hidden aspect-[3/4]">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {!hasStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-gray-300 font-arabic text-sm border border-gray-500 px-4 py-2">نفذ المخزون</span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="p-4">
        <Link to={`/products/${product.id}`}>
          <h3 className="text-white font-semibold font-arabic text-sm hover:text-gray-300 transition-colors truncate">
            {product.name}
          </h3>
        </Link>

        {/* Colors */}
        {colors.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2">
            {colors.slice(0, 5).map((v) => (
              <div
                key={v.color}
                title={v.color}
                className="w-4 h-4 rounded-full border border-[#404040]"
                style={{ backgroundColor: v.color_hex }}
              />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          <span className="text-white font-bold font-arabic text-sm">{formatPrice(product.base_price)}</span>
          {hasStock && (
            <Link
              to={`/products/${product.id}`}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
            >
              <ShoppingCart size={14} />
              <span className="font-arabic">اختر</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
