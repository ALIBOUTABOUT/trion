import React, { useEffect, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  RefreshCw,
  AlertCircle,
  X,
} from 'lucide-react';
import {
  getAllProductsAdmin,
  upsertProduct,
  deleteProduct,
  uploadProductImage,
} from '../../lib/services';
import { formatPrice } from '../../lib/validation';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import type { Product } from '../../types';

export function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const loadProducts = () => {
    setLoading(true);
    getAllProductsAdmin()
      .then(setProducts)
      .catch((err) => setActionError(err.message || 'فشل تحميل المنتجات'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleOpenAdd = () => {
    setEditingProduct({
      name: '',
      description: '',
      base_price: 2500,
      images: [],
      is_available: true,
    });
    setNewImageUrl('');
    setActionError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct({ ...p });
    setNewImageUrl('');
    setActionError(null);
    setModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف المنتج "${name}" وكل متغيراته ومخزونه؟`)) return;
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'فشل حذف المنتج');
    }
  };

  const handleToggleAvailability = async (product: Product) => {
    try {
      const updated = await upsertProduct({
        ...product,
        is_available: !product.is_available,
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_available: !product.is_available } : p))
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'فشل تغيير حالة المنتج');
    }
  };

  const handleSaveProduct = async () => {
    if (!editingProduct) return;
    if (!editingProduct.name?.trim()) {
      setActionError('اسم المنتج مطلوب');
      return;
    }
    if (!editingProduct.base_price || editingProduct.base_price <= 0) {
      setActionError('يرجى تحديد سعر صالح للمنتج');
      return;
    }

    setSaving(true);
    setActionError(null);

    try {
      const saved = await upsertProduct(editingProduct);
      setProducts((prev) => {
        const index = prev.findIndex((p) => p.id === saved.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...saved };
          return updated;
        }
        return [saved, ...prev];
      });
      setModalOpen(false);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'فشل حفظ المنتج');
    } finally {
      setSaving(false);
    }
  };

  const handleAddImageUrl = () => {
    if (!newImageUrl.trim() || !editingProduct) return;
    setEditingProduct((prev) =>
      prev ? { ...prev, images: [...(prev.images || []), newImageUrl.trim()] } : prev
    );
    setNewImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    if (!editingProduct) return;
    setEditingProduct((prev) =>
      prev ? { ...prev, images: (prev.images || []).filter((_, i) => i !== index) } : prev
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProduct) return;

    setUploadingImage(true);
    try {
      const url = await uploadProductImage(file);
      setEditingProduct((prev) =>
        prev ? { ...prev, images: [...(prev.images || []), url] } : prev
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'فشل رفع الصورة إلى Supabase Storage');
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#262626]">
        <div>
          <h1 className="text-2xl font-black text-white font-arabic">إدارة المنتجات</h1>
          <p className="text-gray-400 text-xs font-arabic mt-1">
            إضافة وتعديل ملابس العلامة، الأسعار، الصور والحالة
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadProducts}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-white bg-[#1A1A1A] border border-[#262626] transition-colors font-arabic"
          >
            <RefreshCw size={13} />
            <span>تحديث</span>
          </button>
          <Button onClick={handleOpenAdd} size="sm">
            <Plus size={15} />
            <span className="font-arabic">إضافة منتج جديد</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="جاري تحميل المنتجات..." />
      ) : products.length === 0 ? (
        <EmptyState
          title="لا توجد منتجات مسجلة في المتجر"
          description="أضف منتجك الأول الآن لتتمكن من عرضه للزبائن"
          action={
            <Button onClick={handleOpenAdd} size="sm">
              <Plus size={15} />
              <span className="font-arabic">إضافة منتج</span>
            </Button>
          }
        />
      ) : (
        <div className="bg-[#1A1A1A] border border-[#262626] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-[#111111] border-b border-[#262626]">
                <tr>
                  <th className="px-4 py-3.5 text-xs font-bold text-gray-400 font-arabic">المنتج والصورة</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-gray-400 font-arabic">السعر الأساسي</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-gray-400 font-arabic">المتغيرات</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-gray-400 font-arabic">إجمالي المخزون</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-gray-400 font-arabic">الحالة</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-gray-400 font-arabic text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {products.map((product) => {
                  const totalStock = (product.variants || []).reduce((acc, v) => acc + v.stock, 0);
                  const firstImg = product.images?.[0] || 'https://via.placeholder.com/100';

                  return (
                    <tr key={product.id} className="hover:bg-[#141414] transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <img
                            src={firstImg}
                            alt={product.name}
                            className="w-12 h-14 object-cover bg-[#111111] border border-[#262626] flex-shrink-0"
                          />
                          <div>
                            <p className="text-sm font-bold text-white font-arabic">{product.name}</p>
                            <p className="text-[11px] text-gray-500 font-arabic line-clamp-1 max-w-xs">
                              {product.description}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-sm font-bold text-white font-arabic">
                        {formatPrice(product.base_price)}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-400 font-arabic">
                        {product.variants?.length || 0} متغيرات (مقاس/لون)
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-xs font-arabic">
                        <span
                          className={`font-bold ${
                            totalStock === 0
                              ? 'text-red-400'
                              : totalStock < 5
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {totalStock} قطعة
                        </span>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 text-xs font-medium ${
                            product.is_available
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                          } font-arabic`}
                        >
                          {product.is_available ? 'معروض للبيع' : 'مخفي من المتجر'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleToggleAvailability(product)}
                            className={`p-2 border transition-colors ${
                              product.is_available
                                ? 'border-[#333] text-gray-400 hover:text-white hover:border-gray-400'
                                : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                            title={product.is_available ? 'إخفاء من المتجر' : 'إظهار في المتجر'}
                          >
                            {product.is_available ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>

                          <button
                            onClick={() => handleOpenEdit(product)}
                            className="p-2 border border-[#333] text-gray-400 hover:text-white hover:border-gray-400 transition-colors"
                            title="تعديل المنتج"
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            className="p-2 border border-[#333] text-gray-500 hover:text-red-400 hover:border-red-500/30 transition-colors"
                            title="حذف المنتج"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct?.id ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد لـ TRION'}
        size="lg"
      >
        {editingProduct && (
          <div className="space-y-5" dir="rtl">
            {actionError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-arabic flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{actionError}</span>
              </div>
            )}

            <Input
              label="اسم المنتج *"
              value={editingProduct.name || ''}
              onChange={(e) => setEditingProduct((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="مثال: هودي TRION كلاسيك أسود"
            />

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5 font-arabic">
                وصف المنتج *
              </label>
              <textarea
                value={editingProduct.description || ''}
                onChange={(e) => setEditingProduct((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="تفاصيل القماش، الجودة، القصّة..."
                rows={3}
                className="input-field resize-none text-xs"
              />
            </div>

            <Input
              label="السعر الأساسي بالدينار الجزائري (DA) *"
              type="number"
              value={editingProduct.base_price || 0}
              onChange={(e) =>
                setEditingProduct((prev) => ({
                  ...prev,
                  base_price: parseFloat(e.target.value) || 0,
                }))
              }
              placeholder="3500"
            />

            {/* Product Images Management */}
            <div className="p-4 bg-[#111111] border border-[#262626] space-y-3">
              <label className="block text-xs font-bold text-white font-arabic">
                صور المنتج (معرض الصور)
              </label>

              {/* Existing Images Thumbnails */}
              <div className="flex flex-wrap gap-2">
                {(editingProduct.images || []).map((img, i) => (
                  <div
                    key={i}
                    className="relative w-20 h-24 border border-[#333] group overflow-hidden bg-[#0A0A0A]"
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(i)}
                      className="absolute top-1 right-1 p-1 bg-red-600/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      title="حذف الصورة"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add by URL */}
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="أدخل رابط صورة مباشر (URL)..."
                  className="flex-1 bg-[#1A1A1A] border border-[#333] text-white text-xs px-3 py-2 focus:outline-none focus:border-white font-mono"
                />
                <Button type="button" variant="secondary" size="sm" onClick={handleAddImageUrl}>
                  إضافة رابط
                </Button>
              </div>

              {/* Upload to Supabase Storage */}
              <div className="pt-2 border-t border-[#222]">
                <label className="cursor-pointer inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white font-arabic transition-colors">
                  <ImageIcon size={15} />
                  <span>{uploadingImage ? 'جاري رفع الملف...' : 'أو رفع صورة من جهازك (Supabase Storage)'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Availability Checkbox */}
            <div className="flex items-center gap-3 p-3 bg-[#111111] border border-[#262626]">
              <input
                type="checkbox"
                id="is_available_chk"
                checked={editingProduct.is_available ?? true}
                onChange={(e) =>
                  setEditingProduct((prev) => ({ ...prev, is_available: e.target.checked }))
                }
                className="w-4 h-4 cursor-pointer accent-white"
              />
              <label htmlFor="is_available_chk" className="text-xs text-gray-200 font-arabic cursor-pointer">
                عرض هذا المنتج في واجهة المتجر للزبائن (متاح للشراء)
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-[#262626]">
              <Button variant="secondary" onClick={() => setModalOpen(false)} size="sm">
                إلغاء
              </Button>
              <Button onClick={handleSaveProduct} loading={saving} size="sm">
                {editingProduct.id ? 'حفظ التعديلات' : 'إضافة المنتج'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
