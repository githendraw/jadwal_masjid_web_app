'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useSocket } from '@/lib/socket';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, MapPin, Save, XCircle, Loader2, MessageSquare, Image as ImageIcon } from 'lucide-react';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

const TABS = [
  { id: 'info', label: 'Informasi', icon: Building2 },
  { id: 'location', label: 'Lokasi', icon: MapPin },
  { id: 'running-text', label: 'Running Text', icon: MessageSquare },
  { id: 'background', label: 'Background', icon: ImageIcon },
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
  const [activeTab, setActiveTab] = useState('info');
  const [toast, setToast] = useState<string | null>(null);
  const [mapFullscreen, setMapFullscreen] = useState(false);

  const [formState, setFormState] = useState({
    name: '',
    address: '',
    lat: '',
    long: '',
    calculationMethod: 'KEMENAG',
    runningText1: '',
    runningText2: '',
    background: '',
  });

  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        background: mosque.background || '',
      });
      if (mosque.background) {
        setBackgroundPreview(mosque.background);
      }
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

  const handleMapChange = (newLat: number, newLng: number) => {
    setFormState(prev => ({
      ...prev,
      lat: String(newLat),
      long: String(newLng),
    }));
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const openMapFullscreen = () => {
    setMapFullscreen(true);
  };

  const closeMapFullscreen = () => {
    setMapFullscreen(false);
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast('File terlalu besar (max 10MB)');
      return;
    }

    const compressed = await compressImage(file);
    setBackgroundPreview(compressed);
    setFormState(prev => ({ ...prev, background: compressed }));
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          const maxWidth = 1920;
          const maxHeight = 1080;
          let width = img.naturalWidth;
          let height = img.naturalHeight;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          const compressed = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressed);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const saveBackground = async () => {
    if (!backgroundPreview) {
      showToast('Pilih gambar terlebih dahulu');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/mosque/upload-background', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
        body: JSON.stringify({ background: formState.background }),
      });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || 'Gagal menyimpan background');
      } else {
        showToast('Background berhasil disimpan & dikirim ke TV');
        queryClient.invalidateQueries({ queryKey: ['mosque'] });
      }
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
    void router.push('/admin/masjid');
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

  const TabContent = () => {
    if (activeTab === 'info') {
      return (
        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium text-foreground">Nama Masjid</label>
            <input
              value={formState.name}
              onChange={e => setFormState(prev => ({ ...prev, name: e.target.value }))}
              className="input mt-1 bg-slate-800/50 border-slate-700 text-white w-full"
              placeholder="Masukkan nama masjid anda"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Alamat</label>
            <input
              value={formState.address}
              onChange={e => setFormState(prev => ({ ...prev, address: e.target.value }))}
              className="input mt-1 bg-slate-800/50 border-slate-700 text-white w-full"
              placeholder="Masukkan alamat masjid anda"
            />
          </div>

          <button
            onClick={() => {
              setSaving(true);
              fetch('/api/mosque/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
                body: JSON.stringify({ name: formState.name, address: formState.address }),
              }).then(res => {
                if (!res.ok) return res.json().then(d => { throw d; });
                return res.json();
              }).then(() => {
                showToast('Informasi berhasil disimpan');
                queryClient.invalidateQueries({ queryKey: ['mosque'] });
              }).catch(() => {
                showToast('Gagal menyimpan');
              }).finally(() => setSaving(false));
            }}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan Informasi & Update TV
          </button>
        </div>
      );
    }
              if (activeTab === 'location') {
      const hasCoords = formState.lat && formState.long;
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Latitude</label>
              <input
                value={formState.lat}
                onChange={e => setFormState(prev => ({ ...prev, lat: e.target.value }))}
                className="input mt-1 bg-slate-800/50 border-slate-700 text-white font-mono"
                placeholder="-6.200000"
                type="text"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Longitude</label>
              <div className="flex gap-2 mt-1">
                <input
                  value={formState.long}
                  onChange={e => setFormState(prev => ({ ...prev, long: e.target.value }))}
                  className="input flex-1 bg-slate-800/50 border-slate-700 text-white font-mono"
                  placeholder="106.816667"
                  type="text"
                />
                <button
                  onClick={handleGetGeoLocation}
                  disabled={geoLoading}
                  className="shrink-0 w-10 h-10 flex items-center justify-center bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  title="Deteksi lokasi dari GPS browser"
                >
                  {geoLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  ) : (
                    <MapPin className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {hasCoords && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Koordinat terdeteksi — klik "Simpan Lokasi" untuk menyimpan
            </div>
          )}

          {hasCoords ? (
            <div className={`relative rounded-lg overflow-hidden ${mapFullscreen ? 'fixed inset-0 z-[9999] bg-slate-900' : ''}`}>
              <div style={{ height: mapFullscreen ? '100vh' : '256px' }}>
                <MapPicker
                  key={`${formState.lat}-${formState.long}`}
                  lat={parseFloat(formState.lat)}
                  lng={parseFloat(formState.long)}
                  onChange={handleMapChange}
                  fullscreen={mapFullscreen}
                  onCloseFullscreen={closeMapFullscreen}
                />
              </div>
              {!mapFullscreen && (
                <button
                  onClick={openMapFullscreen}
                  className="absolute bottom-2 right-3 p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors shadow-lg"
                  style={{ zIndex: 1000 }}
                  title="Buka peta fullscreen"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
                </button>
              )}
            </div>
          ) : (
            <div className="w-full h-64 rounded-lg bg-slate-800/50 flex items-center justify-center">
              <p className="text-slate-400 text-sm">Klik tombol <MapPin className="inline w-4 h-4" /> untuk mendapatkan koordinat</p>
            </div>
          )}

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

   if (activeTab === 'background') {
      const hasBackground = backgroundPreview || formState.background;
      return (
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium text-foreground">Background TV</label>
            <p className="text-muted-foreground text-xs mb-4">Gambar latar belakang untuk tampilan TV masjid (max 10MB, akan di-compress otomatis)</p>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-500/5 transition-all"
            >
              <ImageIcon className="w-12 h-12 mx-auto text-slate-500 mb-3" />
              <p className="text-white font-medium">Klik untuk pilih gambar</p>
              <p className="text-muted-foreground text-xs mt-1">PNG, JPG, WebP</p>
            </div>
          </div>

          {hasBackground && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Preview</label>
                {hasBackground && (
                  <button
                    onClick={() => {
                      setBackgroundPreview(null);
                      setFormState(prev => ({ ...prev, background: '' }));
                    }}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Hapus
                  </button>
                )}
              </div>
              <div className="rounded-xl overflow-hidden border border-slate-700 shadow-lg">
                <img src={backgroundPreview || formState.background} alt="Background Preview" className="w-full h-auto max-h-[500px] object-cover bg-black" />
              </div>
            </div>
          )}

          <button
            onClick={saveBackground}
            disabled={saving || !hasBackground}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 px-4 py-3 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan & Update TV
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium text-foreground">Running Text 1</label>
          <p className="text-muted-foreground text-xs mb-2">Teks berjalan baris atas (latar kuning)</p>
         <textarea
            value={formState.runningText1}
            onChange={e => setFormState(prev => ({ ...prev, runningText1: e.target.value }))}
            className="input mt-1 bg-slate-800/50 border-slate-700 text-white w-full min-h-[80px] resize-y"
            placeholder="Contoh: SALDO KAS MASJID HARI JUMAT SEBESAR Rp. 80.345.609 TERIMAKASIH"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Running Text 2</label>
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
    <>
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
  </>
  );
}
