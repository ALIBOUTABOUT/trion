import React, { useEffect, useState } from 'react';
import {
  Phone,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Calendar,
  MapPin,
  Package,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { getAllOrders, updateOrderStatus } from '../../lib/services';
import { ORDER_STATUS_LABELS } from '../../lib/constants';
import { formatPrice } from '../../lib/validation';
import { StatusBadge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import type { Order, OrderStatus } from '../../types';

const STATUS_KEYS: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadOrders = () => {
    setLoading(true);
    getAllOrders()
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as OrderStatus } : o))
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus as OrderStatus } : null));
      }
    } catch (err) {
      console.error(err);
      alert('فشل تحديث حالة الطلب');
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      order.order_number.toLowerCase().includes(query) ||
      (order.customer?.full_name || '').toLowerCase().includes(query) ||
      (order.customer?.phone || '').includes(query) ||
      (order.customer?.wilaya || '').toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#262626]">
        <div>
          <h1 className="text-2xl font-black text-white font-arabic">إدارة الطلبات</h1>
          <p className="text-gray-400 text-xs font-arabic mt-1">
            متابعة طلبيات الزبائن والاتصال لتأكيد الشحن
          </p>
        </div>

        <button
          onClick={loadOrders}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs text-gray-400 hover:text-white bg-[#1A1A1A] border border-[#262626] transition-colors font-arabic self-start sm:self-auto"
        >
          <RefreshCw size={13} />
          <span>تحديث القائمة</span>
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-[#1A1A1A] border border-[#262626] p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث برقم الطلب، اسم العميل، الهاتف أو الولاية..."
            className="w-full bg-[#111111] border border-[#262626] text-white text-xs pr-9 pl-3 py-2.5 focus:outline-none focus:border-white font-arabic"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-500 flex-shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#111111] border border-[#262626] text-white text-xs px-3 py-2.5 focus:outline-none focus:border-white font-arabic"
          >
            <option value="all">جميع الحالات ({orders.length})</option>
            {STATUS_KEYS.map((k) => (
              <option key={k} value={k}>
                {ORDER_STATUS_LABELS[k]} ({orders.filter((o) => o.status === k).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <LoadingSpinner text="جاري تحميل الطلبات..." />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          title="لم يتم العثور على أي طلب"
          description={
            searchQuery || statusFilter !== 'all'
              ? 'جرّب تغيير معايير البحث أو الفلتر'
              : 'ستظهر الطلبات هنا بمجرد أن يطلب العملاء من المتجر'
          }
        />
      ) : (
        <div className="bg-[#1A1A1A] border border-[#262626] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-[#111111] border-b border-[#262626]">
                <tr>
                  <th className="px-4 py-3.5 text-xs font-bold text-gray-400 font-arabic">رقم الطلب</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-gray-400 font-arabic">العميل والهاتف</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-gray-400 font-arabic">الولاية والبلدية</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-gray-400 font-arabic">المبلغ الإجمالي</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-gray-400 font-arabic">الحالة</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-gray-400 font-arabic">تاريخ الطلب</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-gray-400 font-arabic text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-[#141414] transition-colors cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="px-4 py-3.5 whitespace-nowrap font-mono font-bold text-xs text-white">
                      {order.order_number}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <p className="text-xs font-semibold text-white font-arabic">
                        {order.customer?.full_name || 'غير معروف'}
                      </p>
                      {order.customer?.phone && (
                        <a
                          href={`tel:${order.customer.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-mono mt-0.5"
                        >
                          <Phone size={11} />
                          <span>{order.customer.phone}</span>
                        </a>
                      )}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-300 font-arabic">
                      <span>{order.customer?.wilaya || '—'}</span>
                      {order.customer?.commune && (
                        <span className="text-gray-500 text-[11px] block">{order.customer.commune}</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap font-bold text-xs text-white font-arabic">
                      {formatPrice(order.total)}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <StatusBadge status={order.status} />
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-[11px] text-gray-500 font-arabic">
                      {new Date(order.created_at).toLocaleDateString('ar-DZ')}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 text-gray-400 hover:text-white bg-[#111111] border border-[#262626] transition-colors"
                          title="عرض التفاصيل"
                        >
                          <Eye size={14} />
                        </button>

                        <select
                          value={order.status}
                          disabled={updatingId === order.id}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className="bg-[#111111] border border-[#262626] text-white text-xs px-2 py-1 focus:outline-none focus:border-white font-arabic cursor-pointer"
                        >
                          {STATUS_KEYS.map((k) => (
                            <option key={k} value={k}>
                              {ORDER_STATUS_LABELS[k]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      <Modal
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title={`تفاصيل الطلب: ${selectedOrder?.order_number || ''}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6" dir="rtl">
            {/* Status change bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#111111] border border-[#262626]">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 font-arabic">الحالة الحالية:</span>
                <StatusBadge status={selectedOrder.status} />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-arabic">تغيير الحالة:</span>
                <select
                  value={selectedOrder.status}
                  disabled={updatingId === selectedOrder.id}
                  onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                  className="bg-[#1A1A1A] border border-[#404040] text-white text-xs px-3 py-1.5 focus:outline-none focus:border-white font-arabic"
                >
                  {STATUS_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {ORDER_STATUS_LABELS[k]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Customer Details Box */}
            <div className="bg-[#111111] border border-[#262626] p-5">
              <h3 className="text-sm font-bold text-white font-arabic mb-3 pb-2 border-b border-[#262626]">
                معلومات الزبون والشحن
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-arabic">
                <div>
                  <span className="text-gray-500 block">الاسم واللقب:</span>
                  <span className="text-white font-semibold text-sm">
                    {selectedOrder.customer?.full_name}
                  </span>
                </div>

                <div>
                  <span className="text-gray-500 block">رقم الهاتف:</span>
                  <a
                    href={`tel:${selectedOrder.customer?.phone}`}
                    className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-bold text-sm font-mono mt-0.5"
                  >
                    <Phone size={14} />
                    <span>{selectedOrder.customer?.phone}</span>
                    <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded font-arabic">
                      انقر للاتصال
                    </span>
                  </a>
                </div>

                <div>
                  <span className="text-gray-500 block">الولاية والبلدية:</span>
                  <span className="text-white font-medium">
                    {selectedOrder.customer?.wilaya} — {selectedOrder.customer?.commune}
                  </span>
                </div>

                <div>
                  <span className="text-gray-500 block">طريقة الدفع:</span>
                  <span className="text-emerald-400 font-medium">الدفع عند الاستلام (COD)</span>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-gray-500 block">العنوان المفصل:</span>
                  <p className="text-gray-200 mt-0.5 bg-[#161616] p-2 border border-[#222]">
                    {selectedOrder.customer?.address}
                  </p>
                </div>

                {selectedOrder.notes && (
                  <div className="sm:col-span-2">
                    <span className="text-gray-500 block">ملاحظات الزبون:</span>
                    <p className="text-amber-400/90 mt-0.5 bg-[#161616] p-2 border border-[#222]">
                      {selectedOrder.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Products List */}
            <div className="bg-[#111111] border border-[#262626] p-5">
              <h3 className="text-sm font-bold text-white font-arabic mb-3 pb-2 border-b border-[#262626]">
                المنتجات المطلوبة
              </h3>

              <div className="space-y-3">
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 py-2 border-b border-[#222] last:border-0"
                    >
                      <div>
                        <p className="text-xs font-bold text-white font-arabic">{item.product_name}</p>
                        <p className="text-[11px] text-gray-400 font-arabic mt-0.5">
                          اللون: {item.color} | المقاس: {item.size} | الكمية: {item.quantity}
                        </p>
                      </div>

                      <div className="text-left font-arabic">
                        <span className="text-xs font-bold text-white block">
                          {formatPrice(item.total_price)}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          ({formatPrice(item.unit_price)} × {item.quantity})
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 font-arabic py-2 text-center">لا توجد عناصر مسجلة</p>
                )}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-[#111111] border border-[#262626] p-5">
              <div className="space-y-2 text-xs font-arabic">
                <div className="flex justify-between text-gray-400">
                  <span>المجموع الفرعي:</span>
                  <span className="text-white">{formatPrice(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>رسوم الشحن والتوصيل:</span>
                  <span className="text-white">{formatPrice(selectedOrder.delivery_fee)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-[#262626]">
                  <span>المجموع الإجمالي الواجب تحصيله:</span>
                  <span className="text-base text-emerald-400">{formatPrice(selectedOrder.total)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setSelectedOrder(null)} size="sm">
                إغلاق النافذة
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
