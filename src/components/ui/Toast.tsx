import React, { useEffect, useState } from 'react';
import { X, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface ToastData {
  id: string;
  orderNumber: string;
  customerName?: string;
}

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

function OrderToast({ toast, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const enterTimer = setTimeout(() => setVisible(true), 10);
    // Auto-dismiss after 6 seconds
    const dismissTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(toast.id), 400);
    }, 6000);
    return () => {
      clearTimeout(enterTimer);
      clearTimeout(dismissTimer);
    };
  }, [toast.id, onDismiss]);

  return (
    <div
      dir="rtl"
      className={`pointer-events-auto w-80 max-w-full bg-[#1A1A1A] border border-emerald-500/40 shadow-2xl transition-all duration-400 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div className="flex-shrink-0 w-9 h-9 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <ShoppingBag size={16} className="text-emerald-400" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white font-arabic">🛍️ طلب جديد وصل!</p>
          <p className="text-[11px] text-gray-400 font-mono mt-0.5">{toast.orderNumber}</p>
          {toast.customerName && (
            <p className="text-[11px] text-gray-300 font-arabic mt-0.5 truncate">
              {toast.customerName}
            </p>
          )}
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-arabic mt-1.5 transition-colors"
            onClick={() => onDismiss(toast.id)}
          >
            <span>عرض الطلب</span>
            <ArrowLeft size={10} />
          </Link>
        </div>

        {/* Dismiss */}
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(() => onDismiss(toast.id), 400);
          }}
          className="flex-shrink-0 p-1 text-gray-500 hover:text-white transition-colors"
          title="إغلاق"
        >
          <X size={13} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-[#262626]">
        <div
          className="h-full bg-emerald-500/60 origin-right"
          style={{
            animation: 'toast-progress 6s linear forwards',
          }}
        />
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 left-6 z-[9999] flex flex-col gap-3 pointer-events-none"
      aria-live="polite"
      aria-label="إشعارات الطلبات"
    >
      {toasts.map((t) => (
        <OrderToast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
