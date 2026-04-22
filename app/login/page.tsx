'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(formSchema),
  });
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const onSubmit = async (data: any) => {
    setErrorMessage('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        setErrorMessage(result.error || 'Login gagal');
        return;
      }
      // Set role cookie client-side (not httpOnly so middleware can read it)
      const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      document.cookie = `role=${result.role}; path=/; expires=${expires.toUTCString()}; SameSite=lax`;
      router.push(result.role === 'superadmin' ? '/admin' : '/settings');
    } catch (err) {
      setErrorMessage('Terjadi kesalahan. Coba lagi.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-800 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-emerald-200/30 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full shadow-lg mb-6 border border-white/30 transform hover:scale-105 transition-transform duration-300">
            <img src="/logo.png" alt="Jadwal Masjid" className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight drop-shadow-lg">Jadwal Masjid</h1>
          <p className="text-emerald-100 text-lg font-medium">Masuk ke akun masjid Anda</p>
        </div>

        {/* Login Card */}
        <div className="card p-8 card-shadow backdrop-blur-sm bg-white/95 border border-white/20 rounded-2xl">
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-medium">
              {errorMessage}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <Label className="text-slate-700 font-semibold text-sm">Email</Label>
              <div className="relative mt-2">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  {...register('email')}
                  placeholder="email@example.com"
                  className="pl-12 text-base py-4"
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-500 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <Label className="text-slate-700 font-semibold text-sm">Password</Label>
              <div className="relative mt-2">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-12 pr-12 py-4 text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600 transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600 transition-colors" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-500 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button className="w-full btn-primary py-4 text-lg font-semibold" disabled={isSubmitting}>
              {isSubmitting ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-600">
              Belum terdaftar?{' '}
              <a href="/register" className="text-emerald-600 font-semibold hover:text-emerald-700 transition-colors">
                Daftar masjid baru
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
