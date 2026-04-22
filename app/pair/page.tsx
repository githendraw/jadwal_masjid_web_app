'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Mail, Eye, EyeOff, Wifi } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export default function PairPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(formSchema),
  });
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [deviceUuid, setDeviceUuid] = useState('');
  const [pairingSuccess, setPairingSuccess] = useState(false);

  // Get device_uuid from URL params (from TV QR)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const device = params.get('device');
    if (device) setDeviceUuid(device);
  }, []);

  const onSubmit = async (data: any) => {
    setErrorMessage('');
    try {
      // First, login
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });
      if (!loginRes.ok) {
        const err = await loginRes.json();
        setErrorMessage(err.error || 'Login gagal');
        return;
      }

      // Then pair the device
      const pairRes = await fetch('/api/auth/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_uuid: deviceUuid }),
      });
      if (!pairRes.ok) {
        const err = await pairRes.json();
        setErrorMessage(err.error || 'Pairing gagal');
        return;
      }

      setPairingSuccess(true);
      setTimeout(() => router.push('/settings'), 2000);
    } catch (err) {
      setErrorMessage('Terjadi kesalahan. Coba lagi.');
    }
  };

  if (pairingSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-800 p-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full shadow-lg mb-6 border border-white/30">
            <Wifi className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Pairing Berhasil!</h1>
          <p className="text-emerald-100 text-lg">TV berhasil ditambahkan</p>
          <p className="text-emerald-200 text-sm mt-4">Mengarahkan ke halaman pengaturan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-800 p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full shadow-lg mb-6 border border-white/30">
            <img src="/logo.png" alt="Jadwal Masjid" className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Tambah TV</h1>
          <p className="text-emerald-100 text-lg font-medium">Scan QR di TV, lalu login</p>
        </div>

        <div className="card p-8 card-shadow backdrop-blur-sm bg-white/95 border border-white/20 rounded-2xl">
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label className="text-slate-700 font-semibold text-sm">Email</Label>
              <div className="relative mt-2">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <Input {...register('email')} placeholder="email@example.com" className="pl-12 text-base py-4" />
              </div>
              {errors.email && <p className="mt-2 text-sm text-red-500 font-medium">{errors.email.message}</p>}
            </div>

            <div>
              <Label className="text-slate-700 font-semibold text-sm">Password</Label>
              <div className="relative mt-2">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <Input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-12 pr-12 text-base py-4" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  {showPassword ? <EyeOff className="h-5 w-5 text-slate-400" /> : <Eye className="h-5 w-5 text-slate-400" />}
                </button>
              </div>
              {errors.password && <p className="mt-2 text-sm text-red-500 font-medium">{errors.password.message}</p>}
            </div>

            <Button className="w-full btn-primary py-4 text-lg font-semibold" disabled={isSubmitting}>
              {isSubmitting ? 'Memproses...' : 'Pair TV'}
            </Button>
          </form>

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
