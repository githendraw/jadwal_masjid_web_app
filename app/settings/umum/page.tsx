'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useSocket } from '@/lib/socket';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, MapPin, Save, Pencil, XCircle, Loader2, MessageSquare, Monitor, RefreshCw } from 'lucide-react';

const TABS = [
  { id: 'info', label: 'Informasi', icon: Building2 },
  { id: 'location', label: 'Lokasi', icon: MapPin },
  { id: 'running-text', label: 'Running Text', icon: MessageSquare },
];

const CALCULATION_METHODS = [
  { value: 'KEMENAG', label: 'KEMENAG (Indonesia)' },
  { value: 'JAKARTA_IST', label: 'Jakarta IST' },
  { value: 'ASRA', label: 'ASRA' },
  { value: 'UM', label: 'Umm Al Qura' },
  { value: 'MECCAH', label: 'Meccah (Saudi)' },
];

export default function UmumPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [editField, setEditField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('info');
  const [toast, setToast] = useState<string | null>(null);

  const [formState, setFormState] = useState({
    name: '',
    address: '',
    lat: '',
    long: '',
    calculationMethod: 'KEMENAG',
    runningText1: '',
    runningText2: '',
  });

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
    if (mosque) {
      setFormState({
        name: mosque.name || '',
        address: mosque.address || '',
        lat: mosque.latitude != null ? String(mosque.latitude) : '',
        long: mosque.longitude != null ? String(mosque.longitude) : '',
        calculationMethod: mosque.calculation_method || 'KEMENAG',
        runningText1: mosque.runningText1 || '',
        runningText2: mosque.runningText2 || '',
      });
    }
  }, [mosque]);

  useEffect(() => {
    if (!socket) return;
    socket.on('settings:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['mosque'] });
    });
    return () => {
      socket.off('settings:updated');
    };
  }, [socket, queryClient]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const saveField = async (field: string, value: string | number) => {
    setSaving(true);
    try {
      const body: Record<string, any> = {};
      body[field] = value;
      if (field === 'address') {
        body.runningText1 = formState.runningText1;
        body.runningText2 = formState.runningText2;
      }
      const res = await fetch('/api/mosque/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || 'Gagal menyimpan');
        return;
      }
      showToast('Berhasil disimpan');
      setEditField(null);
      queryClient.invalidateQueries({ queryKey: ['mosque'] });
    } catch {
      showToast('Gagal menyimpan');
    }
    setSaving(false);
  };

  const handleGetGeoLocation = () => {
    if (!navigator.geolocation) {
      showToast('Browser tidak mendukung geolocation');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormState(prev => ({
          ...prev,
          lat: String(position.coords.latitude),
          long: String(position.coords.longitude),
        }));
        setGeoLoading(false);
        showToast('Lat/Long berhasil didapat! Klik simpan untuk menyimpan.');
      },
      (err) => {
        setGeoLoading(false);
        showToast('Gagal mendapatkan lokasi: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const saveLatLong = async () => {
    if (!formState.lat || !formState.long) {
      showToast('Latitude dan Longitude harus diisi');
      return;
    }
    const latNum = Number(formState.lat);
    const longNum = Number(formState.long);
    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      showToast('Latitude harus antara -90 dan 90');
      return;
    }
    if (isNaN(longNum) || longNum < -180 || longNum > 180) {
      showToast('Longitude harus antara -180 dan 180');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/mosque/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
        body: JSON.stringify({
          lat: latNum,
          long: longNum,
          calculation_method: formState.calculationMethod,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || 'Gagal menyimpan');
        return;
      }
      showToast('Lat/Long berhasil disimpan & dikirim ke TV');
      queryClient.invalidateQueries({ queryKey: ['mosque'] });
    } catch {
      showToast('Gagal menyimpan');
    }
    setSaving(false);
  };

  const saveRunningText = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/mosque/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
        body: JSON.stringify({
          runningText1: formState.runningText1,
          runningText2: formState.runningText2,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || 'Gagal menyimpan');
        return;
      }
      showToast('Running text berhasil disimpan & dikirim ke TV');
      queryClient.invalidateQueries({ queryKey: ['mosque'] });
    } catch {
      showToast('Gagal menyimpan');
    }
    setSaving(false);
  };

  useEffect(() => {
    if (!user) router.push('/login');
  }, [user, router]);

  if (!user) {
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

  const InputField = ({ label, value, onChange, placeholder, disabled, type = 'text', className = '' }: any) => (
    <div>
      <label className="text-sm font-medium text-foreground">{label}</label>
      <input
        value={value}
        onChange={onChange}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        className={`input ${className}`}
      />
    </div>
  );

  const TabContent = () => {
    if (activeTab === 'info') {
      return (
        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium text-foreground">Nama Masjid</label>
            <div className="flex gap-2 mt-1">
              <input
                value={formState.name}
                onChange={e => setFormState(prev => ({ ...prev, name: e.target.value }))}
                className="input flex-1 bg-slate-800/50 border-slate-700 text-white"
                placeholder="Masukkan nama masjid anda"
                disabled={editField !== 'name'}
              />
              {editField === 'name' ? (
                <button
                  onClick={() => saveField('name', formState.name)}
                  disabled={saving}
                  className="btn-primary flex items-center gap-1 px-3 py-1.5 text-sm"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Simpan
                </button>
              ) : (
                <button
                  onClick={() => setEditField('name')}
                  className="text-muted-foreground hover:text-foreground transition-colors p-2"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Alamat</label>
            <div className="flex gap-2 mt-1">
              <input
                value={formState.address}
                onChange={e => setFormState(prev => ({ ...prev, address: e.target.value }))}
                className="input flex-1 bg-slate-800/50 border-slate-700 text-white"
                placeholder="Masukkan alamat masjid anda"
                disabled={editField !== 'address'}
              />
              {editField === 'address' ? (
                <button
                  onClick={() => saveField('address', formState.address)}
                  disabled={saving}
                  className="btn-primary flex items-center gap-1 px-3 py-1.5 text-sm"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Simpan
                </button>
              ) : (
                <button
                  onClick={() => setEditField('address')}
                  className="text-muted-foreground hover:text-foreground transition-colors p-2"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'location') {
      return (
        <div className="space-y-5">
          <button
            onClick={handleGetGeoLocation}
            disabled={geoLoading}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {geoLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Mendapatkan lokasi...
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4" />
                Dapatkan Lat/Long Otomatis
              </>
            )}
          </button>
          <p className="text-muted-foreground text-xs">
            Klik tombol di atas untuk mendapatkan koordinat lokasi masjid secara otomatis dari GPS HP Anda
          </p>

          <div>
            <label className="text-sm font-medium text-foreground">Latitude</label>
            <input
              value={formState.lat}
              onChange={e => setFormState(prev => ({ ...prev, lat: e.target.value }))}
              className="input mt-1 bg-slate-800/50 border-slate-700 text-white font-mono"
              placeholder="-6.200000 (contoh: -6.2 untuk Jakarta)"
              type="text"
            />
            <p className="text-muted-foreground text-xs mt-1">Rentang: -90 sampai 90. Negatif = Selatan khatulistiwa</p>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Longitude</label>
            <input
              value={formState.long}
              onChange={e => setFormState(prev => ({ ...prev, long: e.target.value }))}
              className="input mt-1 bg-slate-800/50 border-slate-700 text-white font-mono"
              placeholder="106.816667 (contoh: 106.8 untuk Jakarta)"
              type="text"
            />
            <p className="text-muted-foreground text-xs mt-1">Rentang: -180 sampai 180. Positif = Timur Greenwich</p>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Metode Perhitungan</label>
            <select
              value={formState.calculationMethod}
              onChange={e => setFormState(prev => ({ ...prev, calculationMethod: e.target.value }))}
              className="input mt-1 bg-slate-800/50 border-slate-700 text-white w-full"
            >
              {CALCULATION_METHODS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <p className="text-muted-foreground text-xs mt-1">
              KEMENAG = Indonesia standar, Jakarta IST = Jakarta spesifik
            </p>
          </div>

          <button
            onClick={saveLatLong}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan Lokasi & Update TV
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium text-foreground">runningText1</label>
          <p className="text-muted-foreground text-xs mb-2">Teks berjalan baris atas (latar kuning)</p>
         <textarea
             value={formState.runningText1}
             onChange={e => setFormState(prev => ({ ...prev, runningText1: e.target.value }))}
             className="input mt-1 bg-slate-800/50 border-slate-700 text-white w-full min-h-[80px] resize-y"
             placeholder="Contoh: SALDO KAS MASJID HARI JUMAT SEBESAR Rp. 80.345.609 TERIMAKASIH"
           />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">runningText2</label>
          <p className="text-muted-foreground text-xs mb-2">Teks berjalan baris bawah (latar merah)</p>
      <textarea
             value={formState.runningText2}
             onChange={e => setFormState(prev => ({ ...prev, runningText2: e.target.value }))}
             className="input mt-1 bg-slate-800/50 border-slate-700 text-white w-full min-h-[80px] resize-y"
             placeholder="Contoh: BARANGSIAPA YANG BERSHOLAWAT KEPADAKU SEKALI, MAKA ALLAH AKAN BERSHOLAWAT KEPADANYA SEPULUH KALI"
           />
        </div>

        <button
          onClick={saveRunningText}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Simpan & Update TV
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto" style={{ animation: 'fadeSlideUp 0.3s ease-out' }}>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Pengaturan Umum</h1>
        <p className="text-muted-foreground">Kelola informasi masjid dan pengaturan tampilan TV</p>
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
                      : 'text-slate-400 hover:text-white hover:text-muted-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="card-content p-6">
          <TabContent />
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .btn-primary {
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          color: white;
          border-radius: 0.5rem;
          box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.4);
        }
        .btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
        }
      `}</style>
    </div>
  );
}
