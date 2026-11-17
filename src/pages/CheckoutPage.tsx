import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ShoppingBag, Truck, ShieldCheck, ArrowRight } from 'lucide-react';
import { useCartContext } from '../context/CartContext';
import { getStoreSettings, getSettingValue, submitOrder } from '../lib/services';
import { validateAlgerianPhone, validateRequired, formatPrice } from '../lib/validation';
import { WILAYAS } from '../lib/constants';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import type { CheckoutFormData, StoreSettings } from '../types';

type FormErrors = Partial<Record<keyof CheckoutFormData, string>>;

export function CheckoutPage() {
  const { cart, total, clear } = useCartContext();
  const navigate = useNavigate();

  const [settings, setSettings] = useState<StoreSettings[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderResult, setOrderResult] = useState<{ order_number: string } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [form, setForm] = useState<CheckoutFormData>({
    full_name: '',
    phone: '',
    wilaya: '',
    commune: '',
    address: '',
    notes: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    getStoreSettings().then(setSettings).catch(console.error);
  }, []);

  const deliveryFee = parseInt(getSettingValue(settings, 'delivery_fee', '500'), 10) || 500;
  const grandTotal = total + deliveryFee;

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!validateRequired(form.full_name)) {
      newErrors.full_name = 'يرجى إدخال الاسم الكامل';
    }
    if (!form.phone.trim()) {
      newErrors.phone = 'يرجى إدخال رقم الهاتف';
    } else if (!validateAlgerianPhone(form.phone)) {
      newErrors.phone = 'رقم هاتف جزائري غير صالح (مثال: 0550123456 أو 0661123456)';
    }
    if (!validateRequired(form.wilaya)) {
      newErrors.wilaya = 'يرجى اختيار الولاية';
    }
    if (!validateRequired(form.commune)) {
      newErrors.commune = 'يرجى كتابة البلدية';
    }
    if (!validateRequired(form.address)) {
      newErrors.address = 'يرجى كتابة العنوان بالتفصيل';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof CheckoutFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.items.length === 0) return;
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const result = await submitOrder({
        customer: form,
        items: cart.items,
        deliveryFee,
      });

      setOrderResult({ order_number: result.order_number });
      setOrderConfirmed(true);
      clear();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل إرسال الطلب، يرجى المحاولة لاحقاً';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Success view
  if (orderConfirmed && orderResult) {
    return (
      <div className="pt-28 pb-24 min-h-screen flex items-center justify-center px-4" dir="rtl">
        <div className="max-w-lg w-full bg-[#1A1A1A] border border-[#262626] p-8 md:p-10 text-center shadow-2xl">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>

          <span className="inline-block text-xs text-gray-400 tracking-widest uppercase font-arabic border border-[#333] px-3 py-1 mb-3">
            تم تسجيل طلبك بنجاح
          </span>

          <h1 className="text-2xl md:text-3xl font-black text-white font-arabic mb-3">
            شكراً لثقتكم في TRION
          </h1>

          <div className="bg-[#111111] border border-[#262626] p-4 my-6">
            <p className="text-xs text-gray-400 font-arabic mb-1">رقم الطلب الخاص بك</p>
            <p className="text-xl font-mono font-bold text-white tracking-wider">{orderResult.order_number}</p>
          </div>

          <div className="space-y-3 text-right text-sm text-gray-300 font-arabic border-y border-[#262626] py-5 my-6">
            <div className="flex items-center gap-2">
              <Truck size={18} className="text-white flex-shrink-0" />
              <span>سيتصل بك فريقنا هاتفياً خلال 24 ساعة لتأكيد موعد التوصيل.</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-white flex-shrink-0" />
              <span>الدفع نقداً عند استلام طلبيتك وفحصها.</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/products" className="flex-1">
              <Button variant="primary" fullWidth size="lg">
                متابعة التسوق
              </Button>
            </Link>
            <Link to="/" className="flex-1">
              <Button variant="secondary" fullWidth size="lg">
                الرئيسية
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Empty cart view
  if (cart.items.length === 0) {
    return (
      <div className="pt-32 pb-24 min-h-screen flex items-center justify-center px-4" dir="rtl">
        <div className="text-center max-w-md">
          <ShoppingBag size={56} className="text-gray-700 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white font-arabic mb-2">سلة التسوق فارغة</h2>
          <p className="text-gray-400 text-sm font-arabic mb-6">
            لم تقم بإضافة أي منتج إلى السلة بعد. تصفح منتجاتنا واختر ما يناسبك!
          </p>
          <Link to="/products">
            <Button variant="primary" size="lg">
              تصفح المنتجات
              <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-20 min-h-screen" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8 border-b border-[#1A1A1A] pb-6">
          <p className="text-gray-500 text-xs tracking-widest uppercase mb-1 font-arabic">الدفع والشحن</p>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-arabic">إتمام الطلب</h1>
          <p className="text-gray-400 text-sm font-arabic mt-1">
            املأ بيانات التوصيل وسيتم معالجة طلبك فوراً بدون الحاجة لحساب
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Customer Information (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Delivery info box */}
              <div className="bg-[#1A1A1A] border border-[#262626] p-6">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#262626]">
                  <Truck className="text-white" size={20} />
                  <h2 className="text-lg font-bold text-white font-arabic">معلومات التوصيل</h2>
                </div>

                <div className="space-y-4">
                  <Input
                    label="الاسم واللقب *"
                    value={form.full_name}
                    onChange={(e) => handleChange('full_name', e.target.value)}
                    error={errors.full_name}
                    placeholder="مثال: يوسف بلقاسم"
                    autoComplete="name"
                  />

                  <Input
                    label="رقم الهاتف (لتأكيد الطلب والتوصيل) *"
                    value={form.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    error={errors.phone}
                    placeholder="05 / 06 / 07 XX XX XX XX"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    hint="سيتصل بك موزع البريد على هذا الرقم"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="الولاية (58 ولاية) *"
                      value={form.wilaya}
                      onChange={(e) => handleChange('wilaya', e.target.value)}
                      error={errors.wilaya}
                      placeholder="اختر الولاية"
                      options={WILAYAS.map((w) => ({
                        value: `${w.code} - ${w.name}`,
                        label: `${w.code} - ${w.name}`,
                      }))}
                    />

                    <Input
                      label="البلدية *"
                      value={form.commune}
                      onChange={(e) => handleChange('commune', e.target.value)}
                      error={errors.commune}
                      placeholder="اسم البلدية"
                    />
                  </div>

                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-300 mb-1.5 font-arabic">
                      العنوان بالتفصيل (الحي، الشارع، رقم المنزل) *
                    </label>
                    <textarea
                      value={form.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      placeholder="حي النصر، عمارة 12، الشقة 4..."
                      rows={2}
                      className={`input-field resize-none ${errors.address ? 'border-red-500' : ''}`}
                    />
                    {errors.address && <p className="mt-1 text-xs text-red-400 font-arabic">{errors.address}</p>}
                  </div>

                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-300 mb-1.5 font-arabic">
                      ملاحظات خاصة بالتوصيل (اختياري)
                    </label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => handleChange('notes', e.target.value)}
                      placeholder="مثال: الاتصال بعد الساعة الثانية زوالاً..."
                      rows={2}
                      className="input-field resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method box */}
              <div className="bg-[#1A1A1A] border border-[#262626] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck className="text-white" size={20} />
                  <h2 className="text-lg font-bold text-white font-arabic">طريقة الدفع</h2>
                </div>

                <div className="p-4 border-2 border-white bg-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                    <div>
                      <span className="text-white font-arabic font-semibold block text-sm">
                        الدفع عند الاستلام (COD)
                      </span>
                      <span className="text-gray-400 text-xs font-arabic">
                        ادفع نقداً عند وصول الطلبية لباب منزلك
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-white border border-[#444] px-2.5 py-1 font-arabic">
                    آمن 100%
                  </span>
                </div>
              </div>
            </div>

            {/* Order Summary (5 cols) */}
            <div className="lg:col-span-5">
              <div className="bg-[#1A1A1A] border border-[#262626] p-6 sticky top-24">
                <div className="flex items-center justify-between pb-4 border-b border-[#262626] mb-5">
                  <h2 className="text-lg font-bold text-white font-arabic">ملخص الطلب</h2>
                  <span className="text-xs text-gray-400 font-arabic">{cart.items.length} منتجات</span>
                </div>

                {/* Items list */}
                <div className="space-y-4 max-h-72 overflow-y-auto pr-1 mb-6">
                  {cart.items.map((item) => (
                    <div key={item.variant_id} className="flex gap-3 bg-[#111111] p-3 border border-[#262626]">
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-16 h-16 object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold font-arabic truncate">{item.product_name}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 font-arabic">
                          <span
                            className="w-3 h-3 rounded-full border border-gray-600 inline-block"
                            style={{ backgroundColor: item.color_hex }}
                          />
                          <span>{item.color}</span>
                          <span>•</span>
                          <span>المقاس: {item.size}</span>
                          <span>•</span>
                          <span>الكمية: {item.quantity}</span>
                        </div>
                        <p className="text-white text-sm font-bold font-arabic mt-1.5">
                          {formatPrice(item.unit_price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pricing Breakdown */}
                <div className="border-t border-[#262626] pt-4 space-y-3 font-arabic text-sm">
                  <div className="flex justify-between text-gray-300">
                    <span>المجموع الفرعي:</span>
                    <span className="font-semibold text-white">{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>رسوم التوصيل لجميع الولايات:</span>
                    <span className="font-semibold text-white">{formatPrice(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-white border-t border-[#262626] pt-3">
                    <span>المجموع النهائي:</span>
                    <span className="text-lg">{formatPrice(grandTotal)}</span>
                  </div>
                </div>

                {/* Submit Error */}
                {submitError && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-arabic flex items-center gap-2">
                    <AlertCircle size={16} className="flex-shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={submitting}
                  className="mt-6 font-arabic text-base py-4"
                >
                  {submitting ? 'جاري تأكيد الطلب...' : 'تأكيد الطلب الآن (الدفع عند الاستلام)'}
                </Button>

                <p className="text-[11px] text-gray-500 text-center mt-3 font-arabic leading-relaxed">
                  بالنقر على تأكيد الطلب، نلتزم بإرسال طلبيتك والتواصل معك قبل الشحن.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
