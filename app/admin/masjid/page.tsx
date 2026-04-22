'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { Building2, CheckCircle, Tv2 } from 'lucide-react';

export default function MasjidPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

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
    router.push('/login');
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
    <div style={{ animation: 'fadeSlideUp 0.3s ease-out' }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Kelola Masjid</h1>
        <p className="text-muted-foreground">Lihat dan kelola semua masjid</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Total Masjid</p>
              <p className="text-2xl font-bold text-white">{mosques?.length || 0}</p>
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
              <p className="text-2xl font-bold text-white">{(mosques || []).filter((m: any) => m.is_active).length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">TV Online</p>
              <p className="text-2xl font-bold text-white">{(mosques || []).filter((m: any) => m.is_online).length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Tv2 className="w-5 h-5 text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Mosques Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider">Nama Masjid</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider">Slug</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider">Status</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider">TV Status</th>
              </tr>
            </thead>
            <tbody>
              {(mosques || []).map((m: any) => (
                <tr key={m.mosque_id || m.id} className="border-b border-border last:border-b-0 hover:bg-muted/20">
                  <td className="px-4 py-3 text-sm text-foreground font-medium">{m.mosque_name || m.name || '-'}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{m.mosque_slug || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs ${m.is_active ? 'text-green-400' : 'text-red-400'}`}>
                      <span className={`w-2 h-2 rounded-full ${m.is_active ? 'bg-green-400' : 'bg-red-400'}`} />
                      {m.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs ${m.is_online ? 'text-blue-400' : 'text-slate-500'}`}>
                      <span className={`w-2 h-2 rounded-full ${m.is_online ? 'bg-blue-400 animate-pulse' : 'bg-slate-500'}`} />
                      {m.is_online ? 'Online' : 'Offline'}
                    </span>
                  </td>
                </tr>
              ))}
              {(!mosques || mosques.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">
                    Belum ada masjid
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
