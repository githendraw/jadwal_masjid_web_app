'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { Building2, Monitor, ChevronDown, Plus, Tv2, Wifi, WifiOff } from 'lucide-react';

export default function MasjidPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const { data: mosques, isLoading } = useQuery({
    queryKey: ['admin-mosques'],
    queryFn: async () => {
      const res = await fetch('/api/admin/mosques', {
        headers: { 'Authorization': `Bearer ${user?.token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch mosques');
      return res.json();
    },
    enabled: !!user && user.role === 'superadmin',
    retry: 1,
  });

  if (!user) {
    return null;
  }

  if (user.role !== 'superadmin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="card max-w-sm p-6 text-center">
          <p className="text-red-400 text-sm">Akses ditolak — hanya Super Admin</p>
          <button onClick={() => logout()} className="btn-link mt-2 text-sm">Keluar</button>
        </div>
      </div>
    );
  }

  const totalMosques = mosques?.length || 0;
  const activeMosques = (mosques || []).filter((m: any) => m.is_active).length;
  const totalDevices = (mosques || []).reduce((sum: number, m: any) => sum + (m.device_count || 0), 0);
  const totalOnlineDevices = (mosques || []).reduce((sum: number, m: any) => sum + (m.online_devices || 0), 0);

  return (
    <div className="space-y-6" style={{ animation: 'fadeSlideUp 0.3s ease-out' }}>
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-white mb-1">Kelola Masjid</h1>
        <p className="text-muted-foreground">Lihat dan kelola semua masjid beserta TV yang terhubung</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Total Masjid</p>
              <p className="text-2xl font-bold text-white">{totalMosques}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Masjid Aktif</p>
              <p className="text-2xl font-bold text-white">{activeMosques}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <span className="text-green-400 text-sm font-bold">✓</span>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Total TV</p>
              <p className="text-2xl font-bold text-white">{totalDevices}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Tv2 className="w-5 h-5 text-blue-400" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">TV Online</p>
              <p className="text-2xl font-bold text-white">{totalOnlineDevices}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Wifi className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Mosque Cards Grid */}
      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground text-sm">Memuat data...</p>
          </div>
        </div>
      ) : mosques && mosques.length === 0 ? (
        <div className="card py-12 text-center">
          <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-sm">Belum ada masjid terdaftar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(mosques || []).map((mosque: any) => (
            <MosqueCard key={mosque.id} mosque={mosque} />
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function MosqueCard({ mosque }: { mosque: any }) {
  const [expanded, setExpanded] = useState(false);

  const onlineCount = mosque.online_devices || 0;
  const totalCount = mosque.device_count || 0;
  const hasOnline = onlineCount > 0;

  return (
    <div className={`card rounded-xl overflow-hidden transition-all ${hasOnline ? 'border border-emerald-500/40 shadow-lg shadow-emerald-500/5' : 'border border-border'}`}>
      {/* Online pulse indicator */}
      {hasOnline && (
        <div className="h-1 bg-gradient-to-r from-emerald-500 to-emerald-400" />
      )}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-white truncate">{mosque.mosque_name || mosque.name}</h3>
            <p className="text-muted-foreground text-xs mt-1 truncate">{mosque.address || 'Alamat belum diatur'}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 text-xs ml-2 shrink-0 ${mosque.is_active ? 'text-green-400' : 'text-red-400'}`}>
            <span className={`w-2 h-2 rounded-full ${mosque.is_active ? 'bg-green-400' : 'bg-red-400'}`} />
            {mosque.is_active ? 'Aktif' : 'Nonaktif'}
          </span>
        </div>

        {/* Device count summary */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors group ${hasOnline ? 'bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20' : 'bg-slate-800/50 hover:bg-slate-800'}`}
        >
          <div className="flex items-center gap-2">
            <Monitor className={`w-4 h-4 shrink-0 ${hasOnline ? 'text-emerald-400' : 'text-blue-400'}`} />
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-white font-medium">{totalCount}</span>
              <span className="text-muted-foreground">TV terhubung</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasOnline ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                <Wifi className="w-3 h-3" />
                {onlineCount} online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <WifiOff className="w-3 h-3" />
                offline
              </span>
            )}
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Expandable device list */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-border" style={{ animation: 'fadeIn 0.2s ease-out' }}>
            <div className="space-y-1.5">
              {mosque.devices.map((device: any) => (
                <div key={device.id} className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${device.is_online ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-slate-800/30 border border-transparent'}`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full ${device.is_online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                    <span className={`text-sm ${device.is_online ? 'text-white font-medium' : 'text-muted-foreground'}`}>{device.name}</span>
                  </div>
                  <span className={`text-xs font-medium ${device.is_online ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {device.is_online ? 'Online' : 'Offline'}
                  </span>
                </div>
              ))}
              {totalCount === 0 && (
                <div className="px-3 py-4 text-center">
                  <span className="text-muted-foreground text-xs">Belum ada TV terhubung</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
