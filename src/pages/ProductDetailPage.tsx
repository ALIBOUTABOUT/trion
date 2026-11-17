import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Minus, Plus, ShoppingCart, Zap } from 'lucide-react';
import { getProductById } from '../lib/services';
import { useCartContext } from '../context/CartContext';
import { formatPrice } from '../lib/validation';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import type { Product, ProductVariant } from '../types';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { add, openCart } = useCartContext();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageIndex, setImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);

  useEffect(() => {
    if (!id) return;
    getProductById(id)
      .then((p) => {
        setProduct(p);
        if (p?.variants && p.variants.length > 0) {
          const firstAvail = p.variants.find((v) => v.stock > 0);
          if (firstAvail) {
            setSelectedColor(firstAvail.color);
          }
        }
      })
      .catch(() => navigate('/products'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <div className="pt-24 min-h-screen"><LoadingSpinner text="جاري التحميل..." /></div>;
  if (!product) return null;

  // Unique colors
  const colors = product.variants
    ? [...new Map(product.variants.map((v) => [v.color, v])).values()]
    : [];

  // Available sizes for selected color
  const availableSizes = product.variants
    ? product.variants.filter((v) => v.color === selectedColor)
    : [];

  // Selected variant
  const selectedVariant: ProductVariant | undefined = product.variants?.find(
    (v) => v.color === selectedColor && v.size === selectedSize
  );

  const inStock = selectedVariant ? selectedVariant.stock > 0 : false;
  const maxQty = selectedVariant?.stock ?? 1;

  const finalPrice = product.base_price + (selectedVariant?.price_adjustment ?? 0);

  const handleAddToCart = () => {
    if (!selectedVariant || !inStock) return;
    add({
      product_id: product.id,
      variant_id: selectedVariant.id,
      product_name: product.name,
      product_image: product.images[0],
      color: selectedColor!,
      color_hex: selectedVariant.color_hex,
      size: selectedSize!,
      quantity,
      unit_price: finalPrice,
    });
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  const handleBuyNow = () => {
    if (!selectedVariant || !inStock) return;
    handleAddToCart();
    navigate('/checkout');
  };

  return (
    <div className="pt-20 pb-20 min-h-screen" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb */}
        <nav className="py-6 flex items-center gap-2 text-sm text-gray-500">
          <button onClick={() => navigate('/products')} className="hover:text-white transition-colors font-arabic">
            المنتجات
          </button>
          <ChevronLeft size={14} />
          <span className="text-white font-arabic truncate max-w-xs">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
          {/* Image Gallery */}
          <div>
            <div className="relative aspect-[4/5] overflow-hidden bg-[#1A1A1A]">
              <img
                src={product.images[imageIndex]}
                alt={product.name}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() => setImageIndex((i) => (i > 0 ? i - 1 : product.images.length - 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/60 flex items-center justify-center text-white hover:bg-black transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <button
                    onClick={() => setImageIndex((i) => (i < product.images.length - 1 ? i + 1 : 0))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/60 flex items-center justify-center text-white hover:bg-black transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2 mt-3">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setImageIndex(i)}
                    className={`w-16 h-16 overflow-hidden border-2 transition-colors ${
                      i === imageIndex ? 'border-white' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white font-arabic mb-2">{product.name}</h1>
            <p className="text-2xl font-bold text-white font-arabic mb-6">{formatPrice(finalPrice)}</p>

            {/* Description */}
            <p className="text-gray-400 leading-relaxed font-arabic text-sm mb-8">{product.description}</p>

            {/* Color Selection */}
            {colors.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-300 font-arabic mb-3">
                  اللون: <span className="text-white">{selectedColor ?? 'اختر لوناً'}</span>
                </p>
                <div className="flex gap-3">
                  {colors.map((v) => {
                    const hasStockForColor = product.variants?.some(
                      (pv) => pv.color === v.color && pv.stock > 0
                    );
                    return (
                      <button
                        key={v.color}
                        title={v.color}
                        disabled={!hasStockForColor}
                        onClick={() => {
                          setSelectedColor(v.color);
                          setSelectedSize(null);
                        }}
                        className={`w-9 h-9 rounded-full border-2 transition-all ${
                          selectedColor === v.color ? 'border-white scale-110' : 'border-[#404040]'
                        } ${!hasStockForColor ? 'opacity-30 cursor-not-allowed' : 'hover:border-gray-400'}`}
                        style={{ backgroundColor: v.color_hex }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {availableSizes.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-300 font-arabic mb-3">
                  المقاس: <span className="text-white">{selectedSize ?? 'اختر مقاساً'}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((v) => (
                    <button
                      key={v.size}
                      disabled={v.stock === 0}
                      onClick={() => setSelectedSize(v.size)}
                      className={`min-w-[52px] h-11 px-3 border text-sm font-medium transition-all ${
                        selectedSize === v.size
                          ? 'border-white bg-white text-black'
                          : v.stock === 0
                          ? 'border-[#2a2a2a] text-gray-700 cursor-not-allowed line-through'
                          : 'border-[#404040] text-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {v.size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-8">
              <p className="text-sm font-medium text-gray-300 font-arabic mb-3">الكمية</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-[#404040]">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center text-white font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                    disabled={!selectedVariant || quantity >= maxQty}
                    className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white transition-colors disabled:opacity-30"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                {selectedVariant && (
                  <span className="text-gray-500 text-xs font-arabic">
                    {selectedVariant.stock} قطعة متوفرة
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={handleAddToCart}
                disabled={!selectedColor || !selectedSize || !inStock}
              >
                {addedFeedback ? (
                  <span className="font-arabic">✓ تمت الإضافة</span>
                ) : (
                  <>
                    <ShoppingCart size={18} />
                    <span className="font-arabic">أضف إلى السلة</span>
                  </>
                )}
              </Button>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleBuyNow}
                disabled={!selectedColor || !selectedSize || !inStock}
              >
                <Zap size={18} />
                <span className="font-arabic">اشتر الآن</span>
              </Button>
              {(!selectedColor || !selectedSize) && (
                <p className="text-xs text-gray-500 text-center font-arabic">
                  {!selectedColor ? 'اختر اللون أولاً' : 'اختر المقاس أولاً'}
                </p>
              )}
            </div>

            {/* Delivery info */}
            <div className="mt-8 p-4 border border-[#262626] bg-[#1A1A1A]">
              <div className="flex items-center gap-3 text-sm text-gray-400 font-arabic">
                <span>🚚</span>
                <span>التوصيل متاح لجميع الولايات الـ 58 — الدفع عند الاستلام</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
