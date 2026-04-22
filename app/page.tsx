'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950" />
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle at 25% 25%, #10B981 0%, transparent 50%), radial-gradient(circle at 75% 75%, #10B981 0%, transparent 50%)',
        }} />
      
      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        {/* Logo */}
        <div className="mb-8" style={{ animation: 'fadeSlideUp 0.5s ease-out' }}>
          <div className="relative w-20 h-20 mx-auto">
            <Image src="/logo.png" alt="Jadwal Masjid" fill className="object-contain" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-white mb-2 text-center" style={{ animation: 'fadeSlideUp 0.5s ease-out 0.1s both' }}>Jadwal Masjid</h1>
        <p className="text-muted-foreground text-lg mb-12 text-center max-w-md" style={{ animation: 'fadeSlideUp 0.5s ease-out 0.2s both' }}>
          Sistem manajemen jadwal sholat masjid — dari pengaturan hingga display TV
        </p>

        {/* Auth CTA */}
        <div className="flex flex-col items-center gap-4" style={{ animation: 'fadeSlideUp 0.5s ease-out 0.3s both' }}>
          {user ? (
            <button
              onClick={() => router.push('/settings')}
              className="relative px-3 py-1.5 text-sm font-semibold rounded-lg overflow-hidden group"
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.4)',
              }}
            >
              <span className="relative z-10 text-white">Buka Pengaturan</span>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="relative px-3 py-1.5 text-sm font-semibold rounded-lg overflow-hidden group"
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.4)',
              }}
            >
              <span className="relative z-10 text-white">Masuk</span>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          )}
          <p className="text-muted-foreground text-sm">
            {user ? '' : 'Atau '}
            {!user && (
              <a href="/register" className="text-emerald-400 hover:text-emerald-300 font-medium">
                daftar masjid baru
              </a>
            )}
          </p>
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
