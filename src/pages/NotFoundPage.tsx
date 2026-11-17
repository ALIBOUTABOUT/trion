import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" dir="rtl">
      <div className="text-center">
        <p className="text-8xl font-black text-[#1A1A1A] mb-4">404</p>
        <h1 className="text-2xl font-bold text-white font-arabic mb-3">الصفحة غير موجودة</h1>
        <p className="text-gray-500 font-arabic mb-8">الصفحة التي تبحث عنها غير متوفرة.</p>
        <Link to="/">
          <Button variant="primary">العودة للرئيسية</Button>
        </Link>
      </div>
    </div>
  );
}
