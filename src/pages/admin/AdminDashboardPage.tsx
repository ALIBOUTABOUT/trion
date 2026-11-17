import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Clock,
  CheckCircle,
  PackageCheck,
  TrendingUp,
  ArrowUpRight,
  Phone,
  RefreshCw,
} from 'lucide-react';
import { getAdminDashboardStats } from '../../lib/services';
import { formatPrice } from '../../lib/validation';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { StatusBadge } from '../../components/ui/Badge';
import type { DashboardStats } from '../../types';

export function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = () => {
    setLoading(true);
    getAdminDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) return <LoadingSpinner text="جاري تحميل مؤشرات المتجر..." />;
  if (!stats) return null;

  const statCards = [
    {
      label: 'إجمالي الطلبات',
      value: stats.total_orders,
      icon: ShoppingBag,
      color: 'text-white',
      desc: 'جميع الطلبات المسجلة',
    },
    {
      label: 'في انتظار التأكيد',
      value: stats.pending_orders,
      icon: Clock,
      color: 'text-amber-400',
      desc: 'تتطلب اتصالاً بالعميل',
    },
    {
      label: 'طلبات مؤكدة',
      value: stats.confirmed_orders,
      icon: CheckCircle,
      color: 'text-blue-400',
      desc: 'جاهزة للتحضير والشحن',
    },
    {
      label: 'تم التسليم بنجاح',
      value: stats.delivered_orders,
      icon: PackageCheck,
      color: 'text-emerald-400',
      desc: 'طلبيات تم تسليمها للعملاء',
    },
    {
      label: 'إجمالي المبيعات المحققة',
      value: formatPrice(stats.total_sales),
      icon: TrendingUp,
      color: 'text-emerald-400',
      desc: 'محسوبة فقط من الطلبيات المسلّمة',
      spanFull: true,
    },
  ];

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#262626]">
        <div>
          <h1 className="text-2xl font-black text-white font-arabic">لوحة المتابعة</h1>
          <p className="text-gray-400 text-xs font-arabic mt-1">
            إحصائيات فورية للمبيعات والمخزون والطلبات
          </p>
        </div>

        <button
          onClick={loadStats}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs text-gray-400 hover:text-white bg-[#1A1A1A] border border-[#262626] transition-colors font-arabic self-start sm:self-auto"
        >
          <RefreshCw size={13} />
          <span>تحديث البيانات</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, desc, spanFull }) => (
          <div
            key={label}
            className={`bg-[#1A1A1A] border border-[#262626] p-5 flex flex-col justify-between ${
              spanFull ? 'col-span-2 lg:col-span-4 bg-gradient-to-l from-[#161616] to-[#1A1A1A]' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-xs sm:text-sm font-arabic font-medium">{label}</span>
              <div className="p-2 bg-[#111111] border border-[#262626]">
                <Icon size={18} className={color} />
              </div>
            </div>

            <div>
              <p className={`font-black font-arabic text-white ${spanFull ? 'text-3xl' : 'text-2xl'}`}>
                {value}
              </p>
              <p className="text-gray-500 text-[11px] font-arabic mt-1">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Action & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders List (2 cols) */}
        <div className="lg:col-span-2 bg-[#1A1A1A] border border-[#262626] p-6">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#262626]">
            <div>
              <h2 className="text-base font-bold text-white font-arabic">أحدث الطلبات</h2>
              <p className="text-gray-500 text-xs font-arabic">آخر المعاملات المسجلة في المتجر</p>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs text-gray-400 hover:text-white font-arabic flex items-center gap-1 transition-colors"
            >
              <span>عرض كل الطلبات</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          {stats.recent_orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag size={36} className="text-gray-700 mx-auto mb-2" />
              <p className="text-gray-400 text-sm font-arabic">لا توجد طلبات مسجلة بعد</p>
              <p className="text-gray-600 text-xs font-arabic mt-1">
                عند قيام العملاء بالطلب، ستظهر البيانات هنا مباشرة
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#262626]">
              {stats.recent_orders.map((order) => (
                <div key={order.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-white font-mono font-bold text-xs block">
                      {order.order_number}
                    </span>
                    <span className="text-gray-500 text-[11px] font-arabic">
                      {new Date(order.created_at).toLocaleDateString('ar-DZ', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="text-left flex items-center gap-4">
                    <StatusBadge status={order.status} />
                    <span className="text-white text-sm font-bold font-arabic min-w-[70px]">
                      {formatPrice(order.total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Shortcuts & Guide Box (1 col) */}
        <div className="bg-[#1A1A1A] border border-[#262626] p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white font-arabic mb-2">إجراءات سريعة</h2>
            <p className="text-gray-500 text-xs font-arabic mb-5">روابط وصول فورية لإدارة المتجر</p>

            <div className="space-y-2.5">
              <Link
                to="/admin/orders"
                className="block p-3 bg-[#111111] border border-[#262626] hover:border-gray-500 text-sm font-arabic text-white transition-colors"
              >
                📦 مراجعة الطلبات المعلقة
              </Link>
              <Link
                to="/admin/inventory"
                className="block p-3 bg-[#111111] border border-[#262626] hover:border-gray-500 text-sm font-arabic text-white transition-colors"
              >
                📊 ضبط المخزون لكل مقاس ولون
              </Link>
              <Link
                to="/admin/products"
                className="block p-3 bg-[#111111] border border-[#262626] hover:border-gray-500 text-sm font-arabic text-white transition-colors"
              >
                🏷️ إضافة وتعديل المنتجات والأسعار
              </Link>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#262626] text-xs text-gray-500 font-arabic space-y-1">
            <p className="font-semibold text-gray-400">💡 تذكير أمان:</p>
            <p>يتم إرسال إشعارات واتساب تلقائياً عبر Supabase Edge Function عند تسجيل أي طلب.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
