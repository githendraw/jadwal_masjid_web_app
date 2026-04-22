'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Mail, Eye, EyeOff, Building2 } from 'lucide-react';

const formSchema = z.object({
  mosqueName: z.string().min(3, 'Nama masjid minimal 3 karakter'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export default function RegisterPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm({
    resolver: zodResolver(formSchema),
  });
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pairingToken, setPairingToken] = useState('');
  const [deviceUuid, setDeviceUuid] = useState('');

  // Read token & device from URL params (QR scan flow)
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
          mosque_name: data.mosqueName || null, // Send mosque name
          device_uuid: deviceUuid, // Register this TV as a device
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        setErrorMessage(result.error || 'Pendaftaran gagal');
        return;
      }
      // Store mosque info from backend response
      if (result.mosque_id) {
        localStorage.setItem('mosque_id', result.mosque_id);
      }
      if (result.mosque_uuid) {
        localStorage.setItem('mosque_uuid', result.mosque_uuid); // UUID for socket room naming
      }
      if (data.mosqueName) {
        localStorage.setItem('mosque_slug', data.mosqueName.toLowerCase().replace(/\s+/g, '-'));
      }
      // Store pairing token in localStorage for TV app
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

      {/* Register Card */}
        <div className="w-full max-w-md p-8 relative z-10" style={{ animation: 'fadeSlideUp 0.5s ease-out 0.2s both' }}>
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Image src="/logo.png" alt="Jadwal Masjid" fill className="object-contain" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Jadwal Masjid</h1>
            <p className="text-muted-foreground text-sm text-center">Daftar masjid baru</p>
          </div>

          {/* Form Card */}
          <div className="card p-8 card-shadow backdrop-blur-sm bg-slate-800/80 border border-slate-700/50 rounded-2xl">
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm font-medium">
                {errorMessage}
              </div>
            )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Mosque Name Field */}
            <div>
              <Label className="text-slate-300 font-semibold text-sm">Nama Masjid</Label>
              <div className="relative mt-2">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  {...register('mosqueName')}
                  placeholder="Masjid Al-Ikhlas"
                  className="pl-12 text-base py-4 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              {errors.mosqueName && (
                <p className="mt-2 text-sm text-red-400 font-medium">{errors.mosqueName.message}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <Label className="text-slate-300 font-semibold text-sm">Email</Label>
              <div className="relative mt-2">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  {...register('email')}
                  placeholder="email@example.com"
                  className="pl-12 text-base py-4 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-400 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <Label className="text-slate-300 font-semibold text-sm">Password</Label>
              <div className="relative mt-2">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-12 pr-12 text-base py-4 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-300 transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-400 hover:text-slate-300 transition-colors" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-400 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="relative w-full inline-flex items-center justify-center rounded-xl font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 px-4 py-4 text-lg font-semibold overflow-hidden"
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

          {/* Footer Links */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-400">
              Sudah terdaftar?{' '}
              <a href="/login" className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors">
                Masuk di sini
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
