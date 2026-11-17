import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Boxes,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { to: '/admin', label: 'نظرة عامة', icon: LayoutDashboard, exact: true },
  { to: '/admin/orders', label: 'إدارة الطلبات', icon: ShoppingBag },
  { to: '/admin/products', label: 'المنتجات', icon: Package },
  { to: '/admin/inventory', label: 'المخزون والكميات', icon: Boxes },
];

export function AdminLayout() {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/admin/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const isActive = (to: string, exact?: boolean) => {
    if (exact) return location.pathname === to;
    return location.pathname.startsWith(to) && to !== '/admin';
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0A0A0A] border-l border-[#262626]" dir="rtl">
      {/* Brand */}
      <div className="p-6 border-b border-[#262626]">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-white font-bold tracking-widest text-base font-arabic">
              TRION<span className="text-gray-400">.</span>WEAR<span className="text-gray-400">.</span>OFF
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <ShieldCheck size={13} className="text-green-400" />
              <p className="text-gray-500 text-xs font-arabic">لوحة الإدارة والتحكم</p>
            </div>
          </div>
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-white md:hidden"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, exact }) => {
          const active = isActive(to, exact);
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-3 text-sm font-medium transition-colors font-arabic ${
                active
                  ? 'bg-white text-black font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-[#1A1A1A]'
              }`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          );
        })}

        <div className="pt-4 border-t border-[#262626] mt-4">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2.5 text-xs text-gray-500 hover:text-gray-300 font-arabic transition-colors"
          >
            <span>زيارة واجهة المتجر</span>
            <ExternalLink size={14} />
          </Link>
        </div>
      </nav>

      {/* User profile & Sign out */}
      <div className="p-4 border-t border-[#262626] bg-[#0E0E0E]">
        <div className="mb-3 px-1">
          <p className="text-xs text-gray-500 font-arabic">المسؤول الحالي</p>
          <p className="text-xs text-gray-300 font-mono truncate">{user?.email || 'admin@trionwear.dz'}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors w-full border border-red-500/20 font-arabic"
        >
          <LogOut size={14} />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#111111] overflow-hidden" dir="rtl">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col flex-shrink-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-72 max-w-[80vw] h-full z-10 flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-[#0A0A0A] border-b border-[#262626] flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-gray-400 hover:text-white p-1"
              onClick={() => setSidebarOpen(true)}
              aria-label="فتح القائمة"
            >
              <Menu size={22} />
            </button>
            <span className="text-sm font-semibold text-gray-300 font-arabic hidden sm:inline">
              نظام إدارة متجر TRION.WEAR.OFF
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-arabic">
              متصل
            </span>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
