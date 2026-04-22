'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function PairingForm() {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const searchParams = useSearchParams();

  const deviceUUID = searchParams.get('device') || 'unknown';

  const handleConnect = async () => {
    setStatus('connecting');
    setStatusMessage('Menghubungkan perangkat...');

    try {
      const res = await fetch('/api/mosques/associate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('connected');
        setStatusMessage('Perangkat berhasil terhubung!');
      } else {
        setStatus('error');
        setStatusMessage(data.error || 'Kode tidak valid');
      }
    } catch {
      setStatus('error');
      setStatusMessage('Koneksi gagal');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950" />
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle at 25% 25%, #10B981 0%, transparent 50%), radial-gradient(circle at 75% 75%, #10B981 0%, transparent 50%)',
        }} />
      
      {/* Floating orbs */}
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />

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
          <h1 className="text-2xl font-bold text-white mb-1">Koneksi Perangkat</h1>
          <p className="text-muted-foreground text-sm text-center">Masukkan kode pairing dari perangkat TV</p>
        </div>

        {/* Device Info */}
        <div className="mb-6" style={{ animation: 'fadeSlideUp 0.5s ease-out 0.2s both' }}>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
            <p className="text-muted-foreground text-xs mb-1">Perangkat yang menunggu</p>
            <p className="text-white font-mono text-sm">{deviceUUID}</p>
          </div>
        </div>

        {/* Pairing Code Input */}
        <div className="space-y-4" style={{ animation: 'fadeSlideUp 0.5s ease-out 0.3s both' }}>
          <div className="relative">
            <label htmlFor="pairing-code" className="absolute left-3 -top-2.5 text-xs bg-slate-900 px-1 text-muted-foreground">
              Kode Pairing
            </label>
            <input
              id="pairing-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors bg-slate-800/50 border-slate-700 text-white"
              placeholder="ABCD-1234"
              maxLength={9}
            />
          </div>

          {statusMessage && (
            <div className={`rounded-xl p-3 text-sm ${
              status === 'connected' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
              status === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
              'bg-blue-500/10 border-blue-500/30 text-blue-400'
            } border`}>
              {statusMessage}
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={status === 'connecting'}
            className="w-full inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/80 shadow-lg shadow-primary/30 px-4 py-3 text-base font-semibold"
          >
            {status === 'connecting' ? 'Menghubungkan...' : 'Hubungkan Perangkat'}
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

export default function PairingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">Memuat...</p>
      </div>
    </div>}>
      <PairingForm />
    </Suspense>
  );
}
