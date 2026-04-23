'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Building2, Mail, Lock } from 'lucide-react';

const formSchema = z.object({
  mosqueName: z.string().min(3, 'Nama masjid minimal 3 karakter'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export default function RegisterPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(formSchema),
  });
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pairingToken, setPairingToken] = useState('');
  const [deviceUuid, setDeviceUuid] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const device = params.get('device');
    if (token) setPairingToken(token);
    if (device) setDeviceUuid(device);
  }, []);

  const onSubmit = async (data: any) => {
    setErrorMessage('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          mosque_name: data.mosqueName || null,
          device_uuid: deviceUuid,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        setErrorMessage(result.error || 'Pendaftaran gagal');
        return;
      }
      if (result.mosque_id) {
        localStorage.setItem('mosque_id', result.mosque_id);
      }
      if (result.mosque_uuid) {
        localStorage.setItem('mosque_uuid', result.mosque_uuid);
      }
      if (data.mosqueName) {
        localStorage.setItem('mosque_slug', data.mosqueName.toLowerCase().replace(/\s+/g, '-'));
      }
      if (pairingToken) {
        localStorage.setItem('pairing_token', pairingToken);
      }
      router.push('/login');
    } catch (err) {
      setErrorMessage('Terjadi kesalahan. Coba lagi.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950" />
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle at 25% 25%, #10B981 0%, transparent 50%), radial-gradient(circle at 75% 75%, #10B981 0%, transparent 50%)',
        }} />

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="w-full max-w-md p-8 relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8" style={{ animation: 'fadeSlideUp 0.5s ease-out' }}>
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Image src="/logo.png" alt="Jadwal Masjid" fill className="object-contain" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Jadwal Masjid</h1>
          <p className="text-muted-foreground text-sm text-center">Daftar masjid baru</p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" style={{ animation: 'fadeSlideUp 0.5s ease-out 0.2s both' }}>
          {/* Mosque Name */}
          <div className="space-y-2">
            <Label htmlFor="mosqueName" className="text-white text-sm font-medium">
              <span className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-400" />
                Nama Masjid
              </span>
            </Label>
            <Input
              id="mosqueName"
              type="text"
              {...register('mosqueName')}
              className="bg-slate-800/50 border-slate-700 text-white h-11 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
              placeholder="Masjid Al-Ikhlas"
            />
            {errors.mosqueName && (
              <p className="text-red-400 text-sm">{errors.mosqueName.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white text-sm font-medium">
              <span className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-emerald-400" />
                Email
              </span>
            </Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              className="bg-slate-800/50 border-slate-700 text-white h-11 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
              placeholder="email@example.com"
            />
            {errors.email && (
              <p className="text-red-400 text-sm">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white text-sm font-medium">
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-400" />
                Password
              </span>
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                className="bg-slate-800/50 border-slate-700 text-white h-11 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-300" />
                ) : (
                  <Eye className="h-5 w-5 text-slate-400 hover:text-slate-300" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-400 text-sm">{errors.password.message}</p>
            )}
          </div>

          {/* Error */}
          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm">
              {errorMessage}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="relative w-full inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 px-3 py-1.5 text-sm font-semibold overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.4)',
            }}
          >
            <span className="relative z-10 text-white">
              {isSubmitting ? 'Memproses...' : 'Daftar'}
            </span>
            {!isSubmitting && (
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-500 opacity-0 hover:opacity-100 transition-opacity" />
            )}
          </button>
        </form>

        {/* Back to Home */}
        <div className="mt-8 text-center" style={{ animation: 'fadeSlideUp 0.5s ease-out 0.4s both' }}>
          <a href="/login" className="text-muted-foreground hover:text-emerald-400 transition-colors text-sm">
            ← Kembali ke Beranda
          </a>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
