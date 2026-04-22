'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useSocket } from '@/lib/socket';
import { useQuery, useQueryClient } from '@tanstack/react-query';

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

export default function ArahKiblatPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editingQiblaData, setEditingQiblaData] = useState({ value: '' });

  const { data: mosque, isLoading } = useQuery({
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
    socket.on('mosque:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['mosque'] });
    });
    return () => {
      socket.off('mosque:updated');
    };
  }, [socket, queryClient]);

  const updateQiblaDirection = async () => {
    try {
      const bearing = parseFloat(editingQiblaData.value);
      if (isNaN(bearing) || bearing < 0 || bearing > 360) {
        alert('Bearing harus antara 0 dan 360 derajat');
        return;
      }
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
        body: JSON.stringify({ key: 'qibla_direction', value: { bearing: parseFloat(editingQiblaData.value), method: '' } }),
      });
      if (!res.ok) throw new Error('Failed to update qibla');
      queryClient.invalidateQueries({ queryKey: ['mosque'] });
    } catch (error) {
      console.error('Failed to update qibla:', error);
    }
  };

  if (!user) {
    router.push('/login');
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
        <h1 className="text-2xl font-bold text-white mb-1">Arah Kiblat</h1>
        <p className="text-muted-foreground">Pengaturan arah kiblat untuk TV</p>
      </div>

      <SectionCard title="Bearing Kiblat">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Bearing (derajat)</label>
            <input
              value={editingQiblaData.value || mosque?.qibla_bearing?.toString() || ''}
              onChange={(e) => setEditingQiblaData({ value: e.target.value })}
              className="input mt-1 bg-slate-800/50 border-slate-700 text-white font-mono"
            />
          </div>
          <button
            onClick={updateQiblaDirection}
            className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 px-4 py-2.5 text-sm font-semibold rounded-lg"
          >
            Simpan
          </button>
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
