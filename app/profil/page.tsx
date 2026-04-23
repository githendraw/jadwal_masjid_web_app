'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { User, KeyRound, Loader2, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react';

export default function ProfilPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (!user) router.push('/login');
  }, [user, router]);

  if (!user) return null;

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(null), 3000);
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      showToast('Password lama harus diisi', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password baru minimal 6 karakter', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Konfirmasi password tidak cocok', 'error');
      return;
    }
    if (currentPassword === newPassword) {
      showToast('Password baru tidak boleh sama dengan password lama', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Gagal mengubah password', 'error');
        return;
      }
      showToast('Password berhasil diubah!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      showToast('Gagal mengubah password', 'error');
    }
    setLoading(false);
  };

  const goBack = () => {
    if (user?.role === 'superadmin') {
      router.push('/admin/masjid');
    } else {
      router.push('/settings/umum');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-medium ${toastType === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {toast}
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-8" style={{ animation: 'fadeSlideUp 0.3s ease-out' }}>
        <button onClick={goBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Kembali</span>
        </button>

        {/* User Info */}
        <div className="card rounded-xl p-6 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
              <User className="w-7 h-7 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold text-white truncate">{user.name}</p>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400">
                {user.role === 'superadmin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'User'}
              </span>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="card rounded-xl">
          <div className="p-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <KeyRound className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Ubah Password</h2>
                <p className="text-xs text-muted-foreground">Minimal 6 karakter</p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground">Password Lama</label>
              <div className="relative mt-1">
                <input
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  type={showCurrent ? 'text' : 'password'}
                  className="input bg-slate-800/50 border-slate-700 text-white w-full pr-10"
                  placeholder="Masukkan password lama"
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground">Password Baru</label>
              <div className="relative mt-1">
                <input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  type={showNew ? 'text' : 'password'}
                  className="input bg-slate-800/50 border-slate-700 text-white w-full pr-10"
                  placeholder="Minimal 6 karakter"
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {newPassword && newPassword.length < 6 && (
                <p className="text-xs text-red-400 mt-1">Password minimal 6 karakter</p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-foreground">Konfirmasi Password Baru</label>
              <div className="relative mt-1">
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type={showConfirm ? 'text' : 'password'}
                  className="input bg-slate-800/50 border-slate-700 text-white w-full pr-10"
                  placeholder="Ulangi password baru"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-xs text-red-400 mt-1">Password tidak cocok</p>
              )}
              {confirmPassword && confirmPassword === newPassword && newPassword.length >= 6 && (
                <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Password cocok
                </p>
              )}
            </div>

            <button
              onClick={handleChangePassword}
              disabled={loading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 6}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              Ubah Password
            </button>
          </div>
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