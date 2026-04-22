'use client';

import { useState, useEffect } from 'react';
import {
  Bell,
  Database,
  Globe,
  Moon,
  Sun,
  Settings as SettingsIcon,
  MapPin,
  Play,
  Pause,
  RefreshCw,
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
  MonitorCog,
  MonitorX,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MosqueData {
  name?: string;
  settings?: {
    prayer_times?: { imsak?: boolean; shubuh?: boolean; dhuhr?: boolean; ashar?: boolean; maghrib?: boolean; isya?: boolean };
    ihror?: boolean;
    mazhab?: boolean;
    hijri?: boolean;
    imsak?: boolean;
    dark_mode?: boolean;
    animations?: boolean;
    push_notifications?: boolean;
  };
  lat?: number;
  long?: number;
  calculation_method?: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'akun' | 'sinkronisasi' | 'umum'>('akun');
  const [ihror, setIhror] = useState(true);
  const [showMazhab, setShowMazhab] = useState(true);
  const [showHijriyah, setShowHijriyah] = useState(true);
  const [showImsak, setShowImsak] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [animations, setAnimations] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mosqueName, setMosqueName] = useState('');
  const [location, setLocation] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [mosqueId, setMosqueId] = useState<number | null>(null);
  const [mosqueUuid, setMosqueUuid] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [devices, setDevices] = useState<Device[]>([]);
  const [addingDevice, setAddingDevice] = useState(false);

  interface Device {
    device_id: string;
    name: string;
    is_active: number | null;
    is_online: number | null;
    last_seen_at: string | null;
    created_at: string;
  }

  // Tab configuration
  const tabs = [
    { id: 'akun', label: 'Akun & Profil', icon: SettingsIcon },
    { id: 'sinkronisasi', label: 'Sinkronisasi', icon: Database },
    { id: 'umum', label: 'Tampilan Umum', icon: Globe },
    { id: 'peralatan', label: 'Peralatan', icon: MonitorCog },
  ];

  // Load user and mosque data on mount
  useEffect(() => {
    async function loadUser() {
      try {
        // Get UUID from URL params (QR flow) or localStorage
        const params = new URLSearchParams(window.location.search);
        const uuidFromUrl = params.get('mosque'); // UUID from QR URL
        const uuidFromStorage = localStorage.getItem('mosque_uuid');
        const uuid = uuidFromUrl || uuidFromStorage || null;
        if (uuid) setMosqueUuid(uuid);
        
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const user = await res.json();
        setUserEmail(user.email);
        setMosqueId(user.mosque_id);
        
        // Load mosque settings
        if (user.mosque_id) {
          // Get mosque slug from localStorage (saved during registration)
          const slug = localStorage.getItem('mosque_slug') || 'masjid-al-ikhlas';
          const mosqueRes = await fetch(`/api/mosque/settings?slug=${slug}`);
          if (mosqueRes.ok) {
            const mosque = await mosqueRes.json();
            setMosqueName(mosque.name || mosqueName);
            const settings = mosque.settings || {};
            setIhror(settings.ihror !== false);
            setShowMazhab(settings.mazhab !== false);
            setShowHijriyah(settings.hijri !== false);
            setShowImsak(!!settings.imsak);
            setDarkMode(!!settings.dark_mode);
            setAnimations(settings.animations !== false);
            setPushNotifications(settings.push_notifications !== false);
            setLocation(`Lat: ${mosque.lat}, Long: ${mosque.long}`);
          }
        }

        // Load devices list
        await loadDevices();
      } catch (err) {
        console.error('Failed to load user data', err);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const loadDevices = async () => {
    try {
      const res = await fetch('/api/mosque/devices');
      if (res.ok) {
        setDevices(await res.json());
      }
    } catch (err) {
      console.error('Failed to load devices', err);
    }
  };

  const handleAddDevice = async () => {
    try {
      setAddingDevice(true);
      const res = await fetch('/api/mosque/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok && data.device_uuid) {
        window.open(`https://app.jadwalmasjid.com/pair?device=${data.device_uuid}`, '_blank');
        await loadDevices();
      } else {
        alert(data.error || 'Gagal menambah device');
      }
    } catch (err) {
      console.error('Failed to add device', err);
      alert('Terjadi kesalahan');
    } finally {
      setAddingDevice(false);
    }
  };

  const handleDeleteDevice = async (deviceUuid: string) => {
    try {
      const res = await fetch(`/api/mosque/devices/${deviceUuid}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await loadDevices();
      } else {
        alert('Gagal menghapus device');
      }
    } catch (err) {
      console.error('Failed to delete device', err);
      alert('Terjadi kesalahan');
    }
  };

  // Save settings
  const handleSaveSettings = async () => {
    if (!mosqueId) return;
    setSaving(true);
    setSuccessMessage('');
    try {
      const res = await fetch(`/api/settings/${mosqueId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prayer_times: {},
          ihror,
          mazhab: showMazhab,
          hijri: showHijriyah,
          imsak: showImsak,
          dark_mode: darkMode,
          animations,
          push_notifications: pushNotifications,
          mosque_uuid: mosqueUuid, // UUID for socket room naming
        }),
      });
      if (res.ok) {
        setSuccessMessage('Pengaturan berhasil disimpan!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        alert('Gagal menyimpan pengaturan');
      }
    } catch (err) {
      console.error('Failed to save settings', err);
      alert('Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-10 px-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <img src="/logo.png" alt="Jadwal Masjid" className="w-14 h-14 rounded-full border-2 border-white/30" />
            <div>
              <h1 className="text-2xl font-bold">{mosqueName || 'Memuat...'}</h1>
              <div className="flex items-center gap-2 text-emerald-100">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{location}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white shadow-md border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1 py-2 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-500 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {activeTab === 'akun' && (
          <div className="space-y-6">
            {/* Akun Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-50 px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800">Informasi Akun</h2>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Nama Masjid</label>
                    <input
                      type="text"
                      value={mosqueName}
                      onChange={(e) => setMosqueName(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Email</label>
                    <input
                      type="email"
                      value={userEmail}
                      readOnly
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-slate-50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">Lokasi</label>
                  <input
                    type="text"
                    value={location}
                    readOnly
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-slate-50"
                  />
                </div>
                <button
                  onClick={() => {
                    document.cookie.split(';').forEach(c => {
                      document.cookie = c.replace(/=.*/, '; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/');
                    });
                    router.push('/login');
                  }}
                  className="btn-danger w-full py-4"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sinkronisasi' && (
          <div className="space-y-6">
            {/* Sinkronisasi Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-50 px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800">Sinkronisasi Jadwal</h2>
              </div>
              <div className="p-6 space-y-6">
                {/* Status */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <p className="font-medium text-slate-800">Status Sinkronisasi</p>
                    <p className="text-sm text-slate-500">Terakhir disinkronkan: Baru saja</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-emerald-600 font-medium text-sm">Aktif</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button className="btn-primary flex items-center justify-center gap-2 py-3 rounded-lg">
                    <RefreshCw className="w-5 h-5" />
                    Sinkronkan Sekarang
                  </button>
                  <button className="btn-secondary flex items-center justify-center gap-2 py-3 rounded-lg">
                    <Database className="w-5 h-5" />
                    Backup Data
                  </button>
                </div>
              </div>
            </div>

            {/* Pengaturan Sholat Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-50 px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800">Pengaturan Sholat</h2>
              </div>
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">Menampilkan Ihror</p>
                    <p className="text-sm text-slate-500">Tampilkan adzan Ihror di halaman</p>
                  </div>
                  <button
                    onClick={() => setIhror(!ihror)}
                    className={`w-12 h-7 rounded-full transition-colors ${ihror ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${ihror ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">Menampilkan Mazhab</p>
                    <p className="text-sm text-slate-500">Tampilkan informasi Mazhab</p>
                  </div>
                  <button
                    onClick={() => setShowMazhab(!showMazhab)}
                    className={`w-12 h-7 rounded-full transition-colors ${showMazhab ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${showMazhab ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">Menampilkan Kalender Hijriyah</p>
                    <p className="text-sm text-slate-500">Tampilkan tanggal Hijriyah</p>
                  </div>
                  <button
                    onClick={() => setShowHijriyah(!showHijriyah)}
                    className={`w-12 h-7 rounded-full transition-colors ${showHijriyah ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${showHijriyah ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">Menampilkan Waktu Imsak</p>
                    <p className="text-sm text-slate-500">Tampilkan waktu Imsak</p>
                  </div>
                  <button
                    onClick={() => setShowImsak(!showImsak)}
                    className={`w-12 h-7 rounded-full transition-colors ${showImsak ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${showImsak ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </button>
                </div>

                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="btn-primary flex items-center justify-center gap-2 py-3 rounded-lg"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </button>
                {successMessage && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm font-medium text-center">
                    {successMessage}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'umum' && (
          <div className="space-y-6">
            {/* Tampilan Umum Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-50 px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800">Pengaturan Tampilan</h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">Mode Gelap</p>
                    <p className="text-sm text-slate-500">Aktifkan mode gelap untuk tampilan yang lebih nyaman</p>
                  </div>
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className={`w-12 h-7 rounded-full transition-colors ${darkMode ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">Animasi Transisi</p>
                    <p className="text-sm text-slate-500">Tampilkan animasi saat berpindah halaman</p>
                  </div>
                  <button
                    onClick={() => setAnimations(!animations)}
                    className={`w-12 h-7 rounded-full transition-colors ${animations ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${animations ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">Notifikasi Push</p>
                    <p className="text-sm text-slate-500">Kirim notifikasi untuk waktu sholat</p>
                  </div>
                  <button
                    onClick={() => setPushNotifications(!pushNotifications)}
                    className={`w-12 h-7 rounded-full transition-colors ${pushNotifications ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${pushNotifications ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </button>
                </div>

                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="btn-primary flex items-center justify-center gap-2 py-3 rounded-lg w-full"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </button>
                {successMessage && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm font-medium text-center">
                    {successMessage}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'peralatan' && (
          <div className="space-y-6">
            {/* Devices Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-50 px-6 py-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-800">Peralatan TV</h2>
                  <button
                    onClick={handleAddDevice}
                    disabled={addingDevice}
                    className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg"
                  >
                    <MonitorPlus className="w-5 h-5" />
                    {addingDevice ? 'Memuat...' : 'Tambah TV'}
                  </button>
                </div>
              </div>
              <div className="p-6">
                {devices.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <MonitorX className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p className="font-medium">Belum ada TV terdaftar</p>
                    <p className="text-sm">Klik "Tambah TV" untuk mendaftarkan TV baru</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {devices.map((device) => (
                      <div key={device.device_id} className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${device.is_online === 1 ? 'bg-green-100' : 'bg-slate-200'}`}>
                              <MonitorX className={`w-5 h-5 ${device.is_online === 1 ? 'text-green-600' : 'text-slate-400'}`} />
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{device.name}</p>
                              <p className="text-xs text-slate-500">
                                {device.is_online === 1 ? '✅ Online' : '❌ Offline'}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteDevice(device.device_id)}
                            className="text-red-400 hover:text-red-600 p-1"
                            title="Hapus TV"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {device.last_seen_at && (
                          <p className="text-xs text-slate-400">
                            Terakhir: {new Date(device.last_seen_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
