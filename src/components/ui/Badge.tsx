import React from 'react';
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '../../lib/constants';

interface BadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: BadgeProps) {
  const colorClass = ORDER_STATUS_COLORS[status] || 'text-gray-400 bg-gray-400/10';
  const label = ORDER_STATUS_LABELS[status] || status;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${colorClass} ${className}`}>
      {label}
    </span>
  );
}
