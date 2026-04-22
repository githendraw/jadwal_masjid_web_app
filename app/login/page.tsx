'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState<{email: boolean, password: boolean}>({
    email: false,
    password: false,
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    
    if (res.ok && data.user) {
      login(data.user, data.token);
      const redirect = searchParams.get('redirect') || '/settings';
      router.push(redirect);
    } else {
      setError(data.error || 'Login failed');
    }
    setLoading(false);
  };

  const labelClass = (field: keyof typeof focused) => 
    `absolute left-3 transition-all duration-200 pointer-events-none ${
      focused[field] || (field === 'email' ? email.length > 0 : password.length > 0)
        ? '-top-2.5 text-xs bg-slate-900 px-1 text-muted-foreground'
        : 'top-3 text-muted-foreground text-sm'
    }`;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
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
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18M9 17h1M5 21V11l7-10 7 10v10" />
              <path d="M9 21v-6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6" />
              <circle cx="12" cy="11" r="2" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">Jadwal Masjid</h1>
        <p className="text-muted-foreground text-sm text-center">Masuk ke akun masjid Anda</p>
      </div>

      {/* Login Form */}
      <form onSubmit={onSubmit} className="space-y-5" style={{ animation: 'fadeSlideUp 0.5s ease-out 0.2s both' }}>
        {/* Email */}
        <div className="relative">
          <Label htmlFor="email" className={labelClass('email')}>
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setFocused({ ...focused, email: true })}
            onBlur={() => setFocused({ ...focused, email: false })}
            className="bg-slate-800/50 border-slate-700 text-white h-11 pt-6 placeholder:opacity-0 placeholder:text-muted-foreground"
            placeholder="admin@masjid.com"
          />
        </div>

        {/* Password */}
        <div className="relative">
          <Label htmlFor="password" className={labelClass('password')}>
            Password
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setFocused({ ...focused, password: true })}
            onBlur={() => setFocused({ ...focused, password: false })}
            className="bg-slate-800/50 border-slate-700 text-white h-11 pt-6 placeholder:opacity-0 placeholder:text-muted-foreground"
            placeholder="••••••••"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/80 shadow-lg shadow-primary/30 px-4 py-3 text-base font-semibold"
        >
          {loading ? 'Memproses...' : 'Masuk'}
        </button>
      </form>

      {/* Back to Home */}
      <div className="mt-8 text-center" style={{ animation: 'fadeSlideUp 0.5s ease-out 0.4s both' }}>
        <button
          onClick={() => router.push('/')}
          className="btn-link text-muted-foreground hover:text-emerald-400 transition-colors"
        >
          ← Kembali ke Beranda
        </button>
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">Memuat...</p>
      </div>
    </div>}>
      <LoginForm />
    </Suspense>
  );
}
