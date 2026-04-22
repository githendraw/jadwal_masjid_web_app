'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';

interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: 'superadmin' | 'admin' | 'owner' | 'user';
  status: string;
  mosque_id: number | null;
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', password: '', role: 'user' as 'superadmin' | 'admin' | 'owner' | 'user', mosque_id: '' });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`, {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`, {
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
      window.location.reload();
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
      const newStatus = userData.status === 'active' ? 'disabled' : 'active';
      const res = await fetch(`/api/admin/users/${userId}/toggle-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to toggle status');
      window.location.reload();
    } catch (err) {
      alert('Failed to toggle status');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
        body: JSON.stringify({ name: editingUser.name, role: editingUser.role, mosque_id: editingUser.mosque_id }),
      });
      if (!res.ok) throw new Error('Failed to update');
      setShowModal(false);
      setEditingUser(null);
      window.location.reload();
    } catch (err) {
      alert('Failed to update user');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  if (user.role !== 'superadmin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="card max-w-sm p-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-12 h-12 mx-auto text-red-400 mb-4"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
          <p className="text-red-400 text-sm">Akses ditolak — hanya Super Admin</p>
          <button onClick={handleLogout} className="btn-link mt-2 text-sm">Keluar</button>
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
    <div className="min-h-screen flex bg-slate-900">
      {/* Sidebar */}
      <aside className="w-56 min-h-screen bg-slate-900 border-r border-border flex flex-col">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18M9 17h1M5 21V11l7-10 7 10v10" />
                <path d="M9 21v-6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6" />
                <circle cx="12" cy="11" r="2" />
              </svg>
            </div>
            <span className="font-bold text-white">Admin</span>
          </div>

          <nav className="space-y-0.5">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-emerald-500/15 text-emerald-400">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Pengguna
            </button>
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-border">
          <button onClick={handleLogout} className="btn-ghost w-full text-left text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between" style={{ animation: 'fadeSlideUp 0.3s ease-out' }}>
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Dashboard Admin</h1>
              <p className="text-muted-foreground">Kelola pengguna, role, dan masjid</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/80 shadow-lg shadow-primary/30 px-4 py-2.5 text-sm font-semibold"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
              Tambah Pengguna
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6" style={{ animation: 'fadeSlideUp 0.3s ease-out 0.1s both' }}>
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Pengguna</p>
                  <p className="text-2xl font-bold text-white">{users?.length || 0}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-emerald-400"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Akun Aktif</p>
                  <p className="text-2xl font-bold text-white">{(users || []).filter((u: AdminUser) => u.status === 'active').length}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-green-400"><path d="M22 11.04V12a4 4 0 0 1-4.12 3.8"/><path d="M16.17 2.94a6 6 0 0 0-3.68-.89"/><path d="M12 12a4 4 0 0 0-4 4"/><circle cx="12" cy="12" r="10"/></svg>
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
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-amber-400"><path d="M12 22s8-4 8-10"/><path d="M2 12a10 10 0 0 1 20 0"/></svg>
                </div>
              </div>
            </div>
          </div>

          {/* Search + Filter */}
          <div className="flex gap-3 mb-6" style={{ animation: 'fadeSlideUp 0.3s ease-out 0.2s both' }}>
            <div className="flex-1">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input bg-slate-800/50 border-slate-700 text-white placeholder:text-muted-foreground"
                placeholder="Cari email atau nama..."
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="input bg-slate-800/50 border-slate-700 text-white w-36"
            >
              <option value="">Semua Role</option>
              <option value="superadmin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
              <option value="user">User</option>
            </select>
          </div>

          {/* Users Table */}
          <div className="card" style={{ animation: 'fadeSlideUp 0.3s ease-out 0.3s both' }}>
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
                          u.role === 'owner' ? 'badge-green' :
                          'badge-amber'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs ${
                          u.status === 'active' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${u.status === 'active' ? 'bg-green-400' : 'bg-red-400'}`} />
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setEditingUser(u); setShowModal(true); }}
                            className="btn-ghost"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M11 4.7A2 2 0 0 1 12.7 4h5.1c.98-.02 1.8.72 1.8 1.6 0 .3-.1.6-.25.9l-7.35 10.4a1.3 1.3 0 0 1-1.8.3c-.3-.2-.5-.6-.5-1v-1.8c0-.3.1-.6.3-.8L17.5 5.7h-4.9l-4.6 11.5 4.4-8.8"/></svg>
                          </button>
                          <button
                            onClick={() => handleToggleStatus(u.id)}
                            className="btn-ghost text-red-400"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M18 6H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12v-6"/><path d="M18 18v-6a2 2 0 0 0-2-2h-2"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

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
                    <option value="owner">Owner</option>
                    <option value="user">User</option>
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
                    <option value="owner">Owner</option>
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
      </main>
    </div>
  );
}
