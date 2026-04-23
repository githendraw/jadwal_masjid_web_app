'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Monitor, Smartphone, Wifi, WifiOff, Plus } from 'lucide-react';

const TABS = [
  { id: 'list', label: 'Daftar TV', icon: Monitor },
  { id: 'add', label: 'Tambah TV', icon: Plus },
];

export default function PerangkatPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('list');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
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
      setPairingModalOpen(true);
    } catch (error) {
      console.error('Failed to generate pairing code:', error);
    }
  };

  const closePairingModal = () => {
    setPairingModalOpen(false);
    setPairingCode(null);
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

  const onlineCount = (devices || []).filter((d: any) => d.is_online).length;
  const totalCount = (devices || []).length;

  const TabContent = () => {
    if (activeTab === 'list') {
      return (
        <div>
          {totalCount === 0 ? (
            <div className="py-12 text-center">
              <Monitor className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-sm">Belum ada TV terhubung</p>
              <p className="text-muted-foreground text-xs mt-2">Pilih tab "Tambah TV" untuk menambahkan TV baru</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(devices || []).map((device: any) => (
                <div key={device.id} className="flex items-center justify-between px-4 py-4 border border-border rounded-lg hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${device.is_online ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-slate-600'}`} />
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
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors p-2 rounded-md"
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <Smartphone className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Tambah TV Baru</h3>
        <p className="text-muted-foreground text-sm mb-6">
          Generate kode pairing, lalu masukkan di TV Anda
        </p>

        <button
          onClick={generatePairingCode}
          className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 px-6 py-3 rounded-lg transition-colors font-semibold"
        >
          <Smartphone className="w-5 h-5" />
          Generate Kode Pairing
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto" style={{ animation: 'fadeSlideUp 0.3s ease-out' }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Perangkat</h1>
        <p className="text-muted-foreground">Kelola perangkat TV yang terhubung</p>
      </div>

      {/* Tabs */}
      <div className="card rounded-xl">
        <div className="border-b border-border px-4">
          <div className="flex gap-1 -mb-px overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                    isActive
                      ? 'text-emerald-400 border-b-2 border-emerald-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                  {isActive && tab.id === 'list' && totalCount > 0 && (
                    <span className="ml-1 bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full">
                      {totalCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="card-content p-6">
          <TabContent />
        </div>
      </div>

      {/* Pairing Modal */}
      {pairingModalOpen && pairingCode && (
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
                  navigator.clipboard.writeText(pairingCode);
                }}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 px-4 py-2.5 text-sm font-semibold rounded-lg"
              >
                Salin Kode
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
