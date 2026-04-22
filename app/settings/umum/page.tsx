'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useSocket } from '@/lib/socket';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, XCircle } from 'lucide-react';

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

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className="toggle"
      role="switch"
      aria-checked={enabled}
    />
  );
}

export default function UmumPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editingGeneralModalOpen, setEditingGeneralModalOpen] = useState(false);
  const [editingGeneralData, setEditingGeneralData] = useState({ id: '', key: '', value: '', status: 'disabled', order: 0 });

  const { data: mosque, isLoading, error: mosqueError } = useQuery({
    queryKey: ['mosque'],
    queryFn: async () => {
      const res = await fetch('/api/mosques/me', {
        headers: { 'Authorization': `Bearer ${user?.token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: !!user,
    retry: 1,
  });

  useEffect(() => {
    if (!socket) return;
    socket.on('settings:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['mosque'] });
    });
    return () => {
      socket.off('settings:updated');
    };
  }, [socket, queryClient]);

  const updateGeneralSetting = async () => {
    try {
      const res = await fetch(`/api/settings/${editingGeneralData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
        body: JSON.stringify({ value: editingGeneralData.value, status: editingGeneralData.status }),
      });
      if (!res.ok) throw new Error('Failed to update');
      setEditingGeneralModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['mosque'] });
    } catch (error) {
      console.error('Failed to update setting:', error);
    }
  };

  const editGeneralSetting = async (id: string) => {
    try {
      const res = await fetch(`/api/settings/${id}`, {
        headers: { 'Authorization': `Bearer ${user?.token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch setting');
      const setting = await res.json();
      setEditingGeneralData({ id, key: setting.key, value: setting.value, status: setting.status, order: setting.order });
      setEditingGeneralModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch setting:', error);
    }
  };

  const toggleGeneralStatus = async (id: string) => {
    const setting = (mosque?.general_settings || []).find((s: any) => s.id == id);
    if (!setting) return;
    try {
      await fetch(`/api/settings/${id}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
        body: JSON.stringify({ status: setting.status === 'enabled' ? 'disabled' : 'enabled' }),
      });
      queryClient.invalidateQueries({ queryKey: ['mosque'] });
    } catch (error) {
      console.error('Failed to toggle setting status:', error);
    }
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  if (user.role === 'superadmin') {
    router.push('/admin/masjid');
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

  if (mosqueError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="card max-w-sm p-6 text-center">
          <XCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
          <p className="text-red-400 text-sm">Gagal memuat data masjid</p>
          <button onClick={() => router.refresh()} className="btn-link mt-2 text-sm">Coba lagi</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ animation: 'fadeSlideUp 0.3s ease-out' }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Pengaturan Umum</h1>
        <p className="text-muted-foreground">Kelola informasi masjid dan pengaturan dasar</p>
      </div>

      <SectionCard title="Informasi Masjid" description="Nama dan lokasi masjid">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Nama Masjid</label>
            <input
              value={mosque?.name || ''}
              className="input mt-1 bg-slate-800/50 border-slate-700 text-white"
              readOnly
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Alamat</label>
            <input
              value={mosque?.address || ''}
              className="input mt-1 bg-slate-800/50 border-slate-700 text-white"
              readOnly
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Latitude</label>
              <input
                value={mosque?.latitude?.toString() || ''}
                className="input mt-1 bg-slate-800/50 border-slate-700 text-white font-mono"
                readOnly
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Longitude</label>
              <input
                value={mosque?.longitude?.toString() || ''}
                className="input mt-1 bg-slate-800/50 border-slate-700 text-white font-mono"
                readOnly
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Timezone</label>
              <input
                value={mosque?.timezone || ''}
                className="input mt-1 bg-slate-800/50 border-slate-700 text-white font-mono"
                readOnly
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Tasbih method</label>
              <input
                value={mosque?.fajr_angle?.toString() || ''}
                className="input mt-1 bg-slate-800/50 border-slate-700 text-white font-mono"
                readOnly
              />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Pengaturan" description="Fitur dan tampilan">
        <div className="space-y-4">
          {(mosque?.general_settings || []).map((setting: any) => (
            <div key={setting.id} className="flex items-center justify-between px-4 py-3 border-b border-border last:border-b-0">
              <div className="flex-1">
                <span className="text-sm font-medium text-foreground">{setting.key}</span>
                {setting.value && <span className="text-muted-foreground text-xs ml-2">({setting.value})</span>}
              </div>
              <div className="flex items-center gap-2">
                <Toggle
                  enabled={setting.status === 'enabled'}
                  onChange={() => toggleGeneralStatus(setting.id)}
                />
                <button onClick={() => editGeneralSetting(setting.id)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Arah Kiblat" description="Pengaturan arah kiblat untuk TV">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Bearing (derajat)</label>
            <input
              value={mosque?.qibla_bearing?.toString() || ''}
              className="input mt-1 bg-slate-800/50 border-slate-700 text-white font-mono"
              readOnly
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Metode Hitung</label>
            <input
              value={mosque?.qibla_method || ''}
              className="input mt-1 bg-slate-800/50 border-slate-700 text-white"
              readOnly
            />
          </div>
        </div>
      </SectionCard>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
