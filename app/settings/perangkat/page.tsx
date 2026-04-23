'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Unplug, Smartphone } from 'lucide-react';

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card rounded-xl">
      <div className="card-header">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description && <p className="text-muted-foreground text-sm mt-1">{description}</p>}
      </div>
      <div className="card-content space-y-5">
        {children}
      </div>
    </div>
  );
}

export default function PerangkatPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingExpiry, setPairingExpiry] = useState<string | null>(null);
  const [pairingModalOpen, setPairingModalOpen] = useState(false);

  const { data: devices, isLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const res = await fetch('/api/devices', {
        headers: { 'Authorization': `Bearer ${user?.token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch devices');
      return res.json();
    },
    enabled: !!user,
  });

  const disconnectDevice = async (deviceId: string) => {
    try {
      await fetch(`/api/devices/${deviceId}/disconnect`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${user?.token}` },
      });
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    } catch (error) {
      console.error('Failed to disconnect device:', error);
    }
  };

  const generatePairingCode = async () => {
    try {
      const res = await fetch('/api/pairing/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
      });
      if (!res.ok) throw new Error('Failed to generate');
      const data = await res.json();
      setPairingCode(data.code);
      setPairingExpiry(data.expires_at);
      setPairingModalOpen(true);
    } catch (error) {
      console.error('Failed to generate pairing code:', error);
    }
  };

  const closePairingModal = () => {
    setPairingModalOpen(false);
    setPairingCode(null);
    setPairingExpiry(null);
  };

  useEffect(() => {
    if (!user) router.push('/login');
  }, [user, router]);

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ animation: 'fadeSlideUp 0.3s ease-out' }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Perangkat</h1>
        <p className="text-muted-foreground">Kelola perangkat TV yang terhubung</p>
      </div>

      <SectionCard title="TV yang Terhubung">
        <div className="space-y-4">
          {(devices || []).map((device: any) => (
            <div key={device.id} className="flex items-center justify-between px-4 py-3 border-b border-border last:border-b-0">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${device.is_online ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                <div>
                  <span className="text-sm font-medium text-foreground">{device.name}</span>
                  <p className="text-muted-foreground text-xs">
                    {device.is_online ? 'Online' : 'Offline'}
                    {device.last_seen_at && !device.is_online ? ` - Terakhir: ${new Date(device.last_seen_at).toLocaleString('id-ID')}` : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => disconnectDevice(device.id)}
                className="btn-ghost text-red-400 text-sm"
              >
                <Unplug className="w-5 h-5" />
                Putus
              </button>
            </div>
          ))}
          {(!devices || devices.length === 0) && (
            <p className="text-muted-foreground text-sm text-center py-4">Belum ada TV yang terhubung</p>
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <button
            onClick={generatePairingCode}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors"
          >
            <Smartphone className="w-5 h-5" />
            Tambah TV Baru
          </button>
        </div>
      </SectionCard>

      {pairingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <div className="card max-w-sm w-full p-6 text-center">
            <h2 className="text-lg font-semibold text-white mb-2">Kode Pairing TV</h2>
            <p className="text-muted-foreground text-sm mb-6">Masukkan kode ini di TV Anda</p>

            <div className="bg-slate-800 rounded-xl p-6 mb-6">
              <div className="text-4xl font-bold tracking-widest text-emerald-400 font-mono">
                {pairingCode?.slice(0, 3)} {pairingCode?.slice(3)}
              </div>
            </div>

            <p className="text-muted-foreground text-xs mb-6">
              Kode berlaku selama 10 menit
            </p>

            <div className="flex gap-3">
              <button
                onClick={closePairingModal}
                className="flex-1 btn-ghost"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(pairingCode || '');
                }}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 px-4 py-2.5 text-sm font-semibold rounded-lg"
              >
                Salin
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
