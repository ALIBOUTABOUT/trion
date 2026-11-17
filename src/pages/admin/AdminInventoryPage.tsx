import React, { useEffect, useState } from 'react';
import {
  Plus,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Package,
  Layers,
} from 'lucide-react';
import { getAllProductsAdmin, upsertVariant, deleteVariant } from '../../lib/services';
import { SIZES } from '../../lib/constants';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import type { Product, ProductVariant } from '../../types';

export function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingVariantId, setSavingVariantId] = useState<string | null>(null);
  const [addingForProductId, setAddingForProductId] = useState<string | null>(null);

  // New variant state
  const [newColor, setNewColor] = useState('أسود');
  const [newColorHex, setNewColorHex] = useState('#0A0A0A');
  const [newSize, setNewSize] = useState('M');
  const [newStock, setNewStock] = useState(10);
  const [newPriceAdj, setNewPriceAdj] = useState(0);

  const loadInventory = () => {
    setLoading(true);
    getAllProductsAdmin()
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleStockUpdate = async (variant: ProductVariant, newQty: number) => {
    const validQty = Math.max(0, newQty);
    setSavingVariantId(variant.id);
    try {
      await upsertVariant({
        ...variant,
        stock: validQty,
      });

      setProducts((prev) =>
        prev.map((p) => ({
          ...p,
          variants: (p.variants || []).map((v) =>
            v.id === variant.id ? { ...v, stock: validQty } : v
          ),
        }))
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'فشل تحديث المخزون');
    } finally {
      setSavingVariantId(null);
    }
  };

  const handleDeleteVariant = async (productId: string, variantId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المتغير؟')) return;
    try {
      await deleteVariant(variantId);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, variants: (p.variants || []).filter((v) => v.id !== variantId) }
            : p
        )
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'فشل حذف المتغير');
    }
  };

  const handleAddVariant = async (productId: string) => {
    if (!newColor.trim()) {
      alert('يرجى إدخال اسم اللون');
      return;
    }

    setSavingVariantId('new');
    try {
      const created = await upsertVariant({
        product_id: productId,
        color: newColor.trim(),
        color_hex: newColorHex,
        size: newSize,
        stock: Math.max(0, newStock),
        price_adjustment: newPriceAdj,
      });

      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, variants: [...(p.variants || []), created] } : p
        )
      );

      // Reset
      setAddingForProductId(null);
      setNewColor('أسود');
      setNewColorHex('#0A0A0A');
      setNewSize('M');
      setNewStock(10);
      setNewPriceAdj(0);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'فشل إضافة المتغير');
    } finally {
      setSavingVariantId(null);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#262626]">
        <div>
          <h1 className="text-2xl font-black text-white font-arabic">إدارة المخزون والكميات</h1>
          <p className="text-gray-400 text-xs font-arabic mt-1">
            التحكم في كمية كل مقاس ولون ومنع نفاذ المنتجات المطلوبة
          </p>
        </div>

        <button
          onClick={loadInventory}
          className="inline-flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-white bg-[#1A1A1A] border border-[#262626] transition-colors font-arabic self-start sm:self-auto"
        >
          <RefreshCw size={13} />
          <span>تحديث المخزون</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner text="جاري تحميل سجلات المخزون..." />
      ) : products.length === 0 ? (
        <EmptyState
          title="لا توجد منتجات مسجلة"
          description="أضف منتجات أولاً لتتمكن من إدارة مقاساتها ومخزونها"
        />
      ) : (
        <div className="space-y-8">
          {products.map((product) => {
            const variants = product.variants || [];
            const totalStock = variants.reduce((s, v) => s + v.stock, 0);

            return (
              <div key={product.id} className="bg-[#1A1A1A] border border-[#262626]">
                {/* Product Section Header */}
                <div className="p-4 sm:p-5 bg-[#141414] border-b border-[#262626] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {product.images?.[0] && (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-12 h-14 object-cover border border-[#262626]"
                      />
                    )}
                    <div>
                      <h2 className="text-base font-bold text-white font-arabic">{product.name}</h2>
                      <p className="text-xs text-gray-400 font-arabic mt-0.5">
                        إجمالي المخزون المتوفر: <strong className="text-white">{totalStock} قطعة</strong> across{' '}
                        {variants.length} متغيرات
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      setAddingForProductId(addingForProductId === product.id ? null : product.id)
                    }
                  >
                    <Plus size={14} />
                    <span className="font-arabic">إضافة مقاس/لون جديد</span>
                  </Button>
                </div>

                {/* Add Variant Inline Form */}
                {addingForProductId === product.id && (
                  <div className="p-5 bg-[#0F0F0F] border-b border-[#262626] animate-fade-in">
                    <p className="text-xs font-bold text-white font-arabic mb-3">
                      إضافة مقاس أو لون جديد لهذا المنتج:
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end">
                      <div>
                        <label className="text-[11px] text-gray-400 block mb-1 font-arabic">اسم اللون (عربي)</label>
                        <input
                          type="text"
                          value={newColor}
                          onChange={(e) => setNewColor(e.target.value)}
                          placeholder="مثال: أسود"
                          className="w-full bg-[#1A1A1A] border border-[#333] text-white text-xs px-3 py-2 font-arabic"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-gray-400 block mb-1 font-arabic">رمز اللون (HEX)</label>
                        <div className="flex items-center gap-2 bg-[#1A1A1A] border border-[#333] px-2 py-1">
                          <input
                            type="color"
                            value={newColorHex}
                            onChange={(e) => setNewColorHex(e.target.value)}
                            className="w-6 h-6 border-0 bg-transparent cursor-pointer"
                          />
                          <span className="text-xs font-mono text-gray-300">{newColorHex}</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] text-gray-400 block mb-1 font-arabic">المقاس</label>
                        <select
                          value={newSize}
                          onChange={(e) => setNewSize(e.target.value)}
                          className="w-full bg-[#1A1A1A] border border-[#333] text-white text-xs px-3 py-2 font-arabic"
                        >
                          {SIZES.map((sz) => (
                            <option key={sz} value={sz}>
                              {sz}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-gray-400 block mb-1 font-arabic">الكمية الأولية</label>
                        <input
                          type="number"
                          min="0"
                          value={newStock}
                          onChange={(e) => setNewStock(parseInt(e.target.value, 10) || 0)}
                          className="w-full bg-[#1A1A1A] border border-[#333] text-white text-xs px-3 py-2"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAddVariant(product.id)}
                          loading={savingVariantId === 'new'}
                          className="flex-1"
                        >
                          <span className="font-arabic">إضافة</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setAddingForProductId(null)}
                        >
                          <span className="font-arabic">إلغاء</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Variants List Table */}
                {variants.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-500 font-arabic">
                    لا توجد متغيرات لهذا المنتج بعد. انقر على &quot;إضافة مقاس/لون جديد&quot; للبدء.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right">
                      <thead className="bg-[#111111] text-xs font-arabic text-gray-400 border-b border-[#262626]">
                        <tr>
                          <th className="px-4 py-3">اللون</th>
                          <th className="px-4 py-3">المقاس</th>
                          <th className="px-4 py-3">الكمية المتوفرة</th>
                          <th className="px-4 py-3">تحديث سريع للكمية</th>
                          <th className="px-4 py-3 text-center">إجراء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#262626]">
                        {variants.map((v) => {
                          const isLowStock = v.stock > 0 && v.stock <= 3;
                          const isOutOfStock = v.stock === 0;

                          return (
                            <tr key={v.id} className="hover:bg-[#141414] transition-colors">
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-4 h-4 rounded-full border border-gray-600 inline-block flex-shrink-0"
                                    style={{ backgroundColor: v.color_hex }}
                                  />
                                  <span className="text-xs font-semibold text-white font-arabic">
                                    {v.color}
                                  </span>
                                </div>
                              </td>

                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <span className="inline-block px-2.5 py-0.5 bg-[#111111] border border-[#333] text-xs font-bold text-white font-mono">
                                  {v.size}
                                </span>
                              </td>

                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-sm font-bold font-mono ${
                                      isOutOfStock
                                        ? 'text-red-400'
                                        : isLowStock
                                        ? 'text-amber-400'
                                        : 'text-emerald-400'
                                    }`}
                                  >
                                    {v.stock}
                                  </span>
                                  {isOutOfStock && (
                                    <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.2 rounded font-arabic">
                                      نفذ
                                    </span>
                                  )}
                                  {isLowStock && (
                                    <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.2 rounded font-arabic">
                                      كمية وشيكة
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleStockUpdate(v, v.stock - 1)}
                                    disabled={v.stock <= 0 || savingVariantId === v.id}
                                    className="w-7 h-7 bg-[#111111] border border-[#333] text-gray-300 hover:text-white hover:border-white disabled:opacity-30 flex items-center justify-center font-bold text-sm"
                                  >
                                    -
                                  </button>

                                  <input
                                    type="number"
                                    min="0"
                                    value={v.stock}
                                    onChange={(e) =>
                                      handleStockUpdate(v, parseInt(e.target.value, 10) || 0)
                                    }
                                    className="w-16 bg-[#111111] border border-[#333] text-white text-center text-xs py-1 focus:outline-none focus:border-white font-mono"
                                  />

                                  <button
                                    onClick={() => handleStockUpdate(v, v.stock + 1)}
                                    disabled={savingVariantId === v.id}
                                    className="w-7 h-7 bg-[#111111] border border-[#333] text-gray-300 hover:text-white hover:border-white flex items-center justify-center font-bold text-sm"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>

                              <td className="px-4 py-3.5 whitespace-nowrap text-center">
                                <button
                                  onClick={() => handleDeleteVariant(product.id, v.id)}
                                  className="text-gray-500 hover:text-red-400 p-1 transition-colors"
                                  title="حذف هذا المتغير"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
