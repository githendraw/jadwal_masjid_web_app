'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { Pencil, Trash2, Plus, Users, CheckCircle, Shield, AlertTriangle, X } from 'lucide-react';

interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: 'superadmin' | 'admin' | 'user';
  status: string;
  mosque_id: number | null;
}

export default function PenggunaPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', password: '', role: 'user' as 'superadmin' | 'admin' | 'user', mosque_id: '' });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');

  const { data: users, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${user?.token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
    enabled: !!user && user.role === 'superadmin',
    retry: 1,
  });

  const filteredUsers = (users || []).filter((u: AdminUser) => {
    const matchesSearch = !searchQuery || u.email.toLowerCase().includes(searchQuery.toLowerCase()) || u.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !filterRole || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create user');
      }
      setShowCreateModal(false);
      setForm({ email: '', name: '', password: '', role: 'user' as const, mosque_id: '' });
      refetch();
    } catch (err: any) {
      alert(err.message);
    }
    setLoading(false);
  };

  const handleToggleStatus = async (userId: number) => {
    try {
      const userRes = await fetch(`/api/admin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${user?.token}` },
      });
      const userData = await userRes.json();
      const newStatus = userData.status === 'active' || String(userData.status) === '1' ? 'disabled' : 'active';
      const res = await fetch(`/api/admin/users/${userId}/toggle-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to toggle status');
      refetch();
    } catch (err) {
      alert('Failed to toggle status');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    setShowDeleteConfirm(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
        body: JSON.stringify({ status: 'disabled' }),
      });
      if (!res.ok) throw new Error('Failed to disable user');
      refetch();
    } catch (err) {
      alert('Gagal menonaktifkan pengguna');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
        body: JSON.stringify({ name: editingUser.name, role: editingUser.role, mosque_id: editingUser.mosque_id, status: editingUser.status }),
      });
      if (!res.ok) throw new Error('Failed to update');
      setShowModal(false);
      setEditingUser(null);
      refetch();
    } catch (err) {
      alert('Failed to update user');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user) router.push('/login');
  }, [user, router]);

  if (!user) {
    return null;
  }

  if (user.role !== 'superadmin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="card max-w-sm p-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-12 h-12 mx-auto text-red-400 mb-4"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="card max-w-sm p-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-12 h-12 mx-auto text-red-400 mb-4"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
          <p className="text-red-400 text-sm">Gagal memuat data pengguna</p>
          <button onClick={() => router.refresh()} className="btn-link mt-2 text-sm">Coba lagi</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeSlideUp 0.3s ease-out' }}>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Kelola Pengguna</h1>
          <p className="text-muted-foreground">Kelola pengguna dan role</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center rounded-xl font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/80 shadow-lg shadow-primary/30 px-4 py-2.5 text-sm font-semibold"
        >
          <Plus className="w-5 h-5 mr-2" />
          Tambah Pengguna
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Total Pengguna</p>
              <p className="text-2xl font-bold text-white">{users?.length || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Akun Aktif</p>
              <p className="text-2xl font-bold text-white">{(users || []).filter((u: AdminUser) => u.status === 'active' || String(u.status) === '1').length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Super Admin</p>
              <p className="text-2xl font-bold text-white">{(users || []).filter((u: AdminUser) => u.role === 'superadmin').length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input bg-slate-800/50 border-slate-700 text-white placeholder:text-muted-foreground w-full"
            placeholder="Cari email atau nama..."
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="input bg-slate-800/50 border-slate-700 text-white sm:w-40"
        >
<option value="">Semua Role</option>
            <option value="superadmin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider">Nama</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider">Email</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider">Role</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider">Status</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u: AdminUser) => (
                <tr key={u.id} className="border-b border-border last:border-b-0 hover:bg-muted/20">
                  <td className="px-4 py-3 text-sm text-foreground">{u.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${
                      u.role === 'superadmin' ? 'badge-amber' :
                      u.role === 'admin' ? 'badge-emerald' :
                      'badge-blue'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs ${
                      u.status === 'active' || String(u.status) === '1' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${u.status === 'active' || String(u.status) === '1' ? 'bg-green-400' : 'bg-red-400'}`} />
                      {u.status === 'active' || String(u.status) === '1' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditingUser(u); setShowModal(true); }}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-transparent hover:border-slate-500 hover:bg-slate-800 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(u.id)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-transparent hover:border-red-500 hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <div className="card max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Konfirmasi Hapus</h2>
                <p className="text-sm text-muted-foreground">Menonaktifkan pengguna ini</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Pengguna akan diubah ke status "Nonaktif". Data tidak akan dihapus.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="btn-ghost">Batal</button>
              <button onClick={() => handleDeleteUser(showDeleteConfirm)} className="bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 px-4 py-2.5 text-sm font-semibold rounded-lg">
                Nonaktifkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <div className="card max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Edit Pengguna</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Nama</label>
                <input
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="input mt-1 bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Email</label>
                <input
                  value={editingUser.email}
                  className="input mt-1 bg-slate-800/50 border-slate-700 text-white"
                  readOnly
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as AdminUser['role'] })}
                  className="input mt-1 bg-slate-800/50 border-slate-700 text-white"
                >
                  <option value="superadmin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Status</label>
                <select
                  value={editingUser.status}
                  onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                  className="input mt-1 bg-slate-800/50 border-slate-700 text-white"
                >
                  <option value="active">Aktif</option>
                  <option value="disabled">Nonaktif</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowModal(false); setEditingUser(null); }} className="btn-ghost">Batal</button>
              <button onClick={handleSaveEdit} disabled={loading} className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 px-4 py-2.5 text-sm font-semibold rounded-lg">
                {loading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <div className="card max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Tambah Pengguna Baru</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Nama</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input mt-1 bg-slate-800/50 border-slate-700 text-white"
                  placeholder="Nama lengkap"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Email</label>
                <input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  type="email"
                  className="input mt-1 bg-slate-800/50 border-slate-700 text-white"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Password</label>
                <input
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  type="password"
                  className="input mt-1 bg-slate-800/50 border-slate-700 text-white"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as AdminUser['role'] })}
                  className="input mt-1 bg-slate-800/50 border-slate-700 text-white"
                >
                  <option value="superadmin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Mosque ID (opsional)</label>
                <input
                  value={form.mosque_id}
                  onChange={(e) => setForm({ ...form, mosque_id: e.target.value })}
                  className="input mt-1 bg-slate-800/50 border-slate-700 text-white"
                  placeholder="Kosongkan untuk admin global"
                />
              </div>
            </form>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="btn-ghost">Batal</button>
              <button onClick={handleCreateUser} disabled={loading} className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 px-4 py-2.5 text-sm font-semibold rounded-lg">
                {loading ? 'Menyimpan...' : 'Buat Pengguna'}
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
