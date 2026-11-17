import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function AdminLoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      console.error(err);
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة، أو ليس لديك صلاحية مسؤول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-4" dir="rtl">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#1A1A1A] border border-[#333] flex items-center justify-center mx-auto mb-4">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-widest block font-arabic">
            TRION<span className="text-gray-400">.</span>WEAR<span className="text-gray-400">.</span>OFF
          </span>
          <p className="text-gray-400 text-sm mt-1.5 font-arabic">تسجيل دخول المسؤول</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#1A1A1A] border border-[#262626] p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="البريد الإلكتروني للمسؤول"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@trionwear.dz"
              required
              autoComplete="email"
            />

            <Input
              label="كلمة المرور"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-arabic flex items-start gap-2">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              loading={loading}
              className="mt-2 font-arabic py-3.5"
            >
              {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#262626] text-center">
            <a
              href="/"
              className="text-xs text-gray-500 hover:text-gray-300 font-arabic inline-flex items-center gap-1 transition-colors"
            >
              <ArrowLeft size={14} />
              <span>العودة إلى متجر TRION</span>
            </a>
          </div>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6 font-arabic leading-relaxed">
          هذه الصفحة مخصصة فقط لإدارة المتجر. لا يوجد تسجيل حسابات عامة.
        </p>
      </div>
    </div>
  );
}
