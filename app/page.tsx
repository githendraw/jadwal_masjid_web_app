'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

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
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18M9 17h1M5 21V11l7-10 7 10v10" />
                <path d="M9 21v-6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6" />
                <circle cx="12" cy="11" r="2" />
              </svg>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-white mb-2 text-center" style={{ animation: 'fadeSlideUp 0.5s ease-out 0.1s both' }}>Jadwal Masjid</h1>
        <p className="text-muted-foreground text-lg mb-8 text-center max-w-md" style={{ animation: 'fadeSlideUp 0.5s ease-out 0.2s both' }}>
          Sistem manajemen jadwal sholat masjid — dari pengaturan hingga display TV
        </p>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg w-full mb-8" style={{ animation: 'fadeSlideUp 0.5s ease-out 0.3s both' }}>
          {/* Feature 1 */}
          <button
            onClick={() => router.push('/settings')}
            className="card p-6 text-left hover:shadow-lg hover:shadow-emerald-500/10 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-3 group-hover:bg-emerald-500/30 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-emerald-400"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.94.54a2 2 0 0 1-2.46-.54l-.28-.48A2 2 0 0 0 3.12 2H2.5a2 2 0 0 0-2 2v14c0 .55.22 1.08.6.88l2.44-1.4a2 2 0 0 1 2.22 0l.94.54a2 2 0 0 1 1 1.73v.18a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.94-.54a2 2 0 0 1 2.46.54l.28.48A2 2 0 0 0 20.88 22h.62a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-.62a2 2 0 0 0-2 2"/></svg>
            </div>
            <h3 className="text-white font-semibold mb-1">Pengaturan</h3>
            <p className="text-muted-foreground text-sm">Kelola waktu sholat, arah kiblat, dan adzan</p>
          </button>

          {/* Feature 2 */}
          <button
            onClick={() => router.push('/pair')}
            className="card p-6 text-left hover:shadow-lg hover:shadow-emerald-500/10 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-3 group-hover:bg-emerald-500/30 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-emerald-400"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12" y2="18"/></svg>
            </div>
            <h3 className="text-white font-semibold mb-1">Koneksi TV</h3>
            <p className="text-muted-foreground text-sm">Pasang dan kelola perangkat display TV</p>
          </button>
        </div>

        {/* Auth links */}
        <div className="flex gap-3" style={{ animation: 'fadeSlideUp 0.5s ease-out 0.4s both' }}>
          {user ? (
            <button
              onClick={() => router.push('/settings')}
              className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 px-6 py-3 text-base font-semibold rounded-xl"
            >
              Buka Pengaturan
            </button>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 px-6 py-3 text-base font-semibold rounded-xl"
            >
              Masuk
            </button>
          )}
          {user && (
            <button
              onClick={() => router.push('/login')}
              className="btn-outline px-6 py-3 text-base font-medium rounded-xl"
            >
              Pairing
            </button>
          )}
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
