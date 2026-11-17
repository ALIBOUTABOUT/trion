import React from 'react';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCartContext } from '../../context/CartContext';
import { formatPrice } from '../../lib/validation';
import { Button } from '../ui/Button';

export function CartDrawer() {
  const { cart, isOpen, closeCart, updateQty, remove, total, count } = useCartContext();

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-full max-w-sm bg-[#1A1A1A] border-r border-[#262626] z-50 flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#262626]">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-white" />
            <h2 className="font-bold text-white font-arabic">سلة التسوق</h2>
            {count > 0 && (
              <span className="bg-white text-black text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {count}
              </span>
            )}
          </div>
          <button onClick={closeCart} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto py-4 px-4 space-y-4">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-10">
              <ShoppingBag size={48} className="text-gray-700 mb-4" />
              <p className="text-gray-400 font-arabic">سلتك فارغة</p>
              <p className="text-gray-600 text-sm font-arabic mt-1">أضف منتجات لتبدأ التسوق</p>
            </div>
          ) : (
            cart.items.map((item) => (
              <div key={item.variant_id} className="flex gap-3 p-3 bg-[#111111] border border-[#262626]">
                <img
                  src={item.product_image}
                  alt={item.product_name}
                  className="w-20 h-20 object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold font-arabic truncate">{item.product_name}</p>
                  <p className="text-gray-400 text-xs font-arabic mt-0.5">
                    {item.color} — {item.size}
                  </p>
                  <p className="text-white text-sm font-bold mt-1 font-arabic">{formatPrice(item.unit_price)}</p>

                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQty(item.variant_id, item.quantity - 1)}
                      className="w-7 h-7 border border-[#404040] flex items-center justify-center text-gray-400 hover:text-white hover:border-white transition-colors"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-white text-sm w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.variant_id, item.quantity + 1)}
                      className="w-7 h-7 border border-[#404040] flex items-center justify-center text-gray-400 hover:text-white hover:border-white transition-colors"
                    >
                      <Plus size={12} />
                    </button>
                    <button
                      onClick={() => remove(item.variant_id)}
                      className="mr-auto text-gray-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.items.length > 0 && (
          <div className="border-t border-[#262626] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 font-arabic">المجموع الجزئي</span>
              <span className="text-white font-bold font-arabic">{formatPrice(total)}</span>
            </div>
            <p className="text-gray-500 text-xs font-arabic">رسوم التوصيل تُحسب عند الدفع</p>
            <Link to="/checkout" onClick={closeCart}>
              <Button variant="primary" fullWidth size="lg">
                إتمام الطلب
              </Button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
