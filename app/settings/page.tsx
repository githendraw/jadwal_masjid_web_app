'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { useSocket } from '@/lib/socket';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type Section = 'general' | 'prayer-times' | 'qibla' | 'adhans' | 'devices';

// === Sidebar Navigation Item ===
function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-emerald-500/15 text-emerald-400'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// === Settings Section Wrapper ===
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

// === Toggle Switch ===
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

// === Prayer Times Row ===
function PrayerTimeRow({
  name,
  time,
  onEdit,
}: {
  name: string;
  time: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border last:border-b-0">
      <span className="text-sm font-medium text-foreground">{name}</span>
      <div className="flex items-center gap-3">
        <span className="text-foreground text-sm font-mono">{time}</span>
        <button onClick={onEdit} className="text-muted-foreground hover:text-foreground transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M11 4.7A2 2 0 0 1 12.7 4h5.1c.98-.02 1.8.72 1.8 1.6 0 .3-.1.6-.25.9l-7.35 10.4a1.3 1.3 0 0 1-1.8.3c-.3-.2-.5-.6-.5-1v-1.8c0-.3.1-.6.3-.8L17.5 5.7h-4.9l-4.6 11.5 4.4-8.8"/></svg>
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<Section>('general');
  const [editingTimes, setEditingTimes] = useState<{ [key: string]: string }>({});
  const [selectedPrayer, setSelectedPrayer] = useState<string>('');
  const [timeModalOpen, setTimeModalOpen] = useState(false);
  const [editingGeneralModalOpen, setEditingGeneralModalOpen] = useState(false);
  const [editingGeneralData, setEditingGeneralData] = useState({ id: '', key: '', value: '', status: 'disabled', order: 0 });
  const [editingQiblaModalOpen, setEditingQiblaModalOpen] = useState(false);
  const [editingQiblaData, setEditingQiblaData] = useState({ id: '', key: '', value: '', status: 'disabled', order: 0 });
  const [editingAdhanModalOpen, setEditingAdhanModalOpen] = useState(false);
  const [editingAdhanData, setEditingAdhanData] = useState({ id: '', key: '', value: '', status: 'disabled', order: 0 });
  const [editingDevicesModalOpen, setEditingDevicesModalOpen] = useState(false);
  const [editingDevicesData, setEditingDevicesData] = useState({ id: '', name: '', status: 'disabled', order: 0 });
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingExpiry, setPairingExpiry] = useState<string | null>(null);
  const [pairingModalOpen, setPairingModalOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // === Fetch mosque data ===
  const { data: mosque, isLoading, error: mosqueError, refetch } = useQuery({
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

  // === Fetch devices ===
  const { data: devices } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const res = await fetch('/api/devices', {
        headers: { 'Authorization': `Bearer ${user?.token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch devices');
      return res.json();
    },
    enabled: !!user,
  });

  // === Fetch prayer times ===
  const { data: prayerTimes } = useQuery({
    queryKey: ['prayer-times'],
    queryFn: async () => {
      const res = await fetch('/api/prayer-times', {
        headers: { 'Authorization': `Bearer ${user?.token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch prayer times');
      return res.json();
    },
    enabled: !!user,
  });

  // === Fetch adhan settings ===
  const { data: adhanSettings } = useQuery({
    queryKey: ['adhan-settings'],
    queryFn: async () => {
      const res = await fetch('/api/adhan-settings', {
        headers: { 'Authorization': `Bearer ${user?.token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch adhan settings');
      return res.json();
    },
    enabled: !!user,
  });

  // === WebSocket listeners ===
  useEffect(() => {
    if (!socket) return;

    socket.on('prayer-times:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['prayer-times'] });
    });

    socket.on('mosque:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['mosque'] });
    });

    socket.on('settings:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['mosque'] });
    });

    return () => {
      socket.off('prayer-times:updated');
      socket.off('mosque:updated');
      socket.off('settings:updated');
    };
  }, [socket, queryClient]);

  // === Prayer Times Management ===
  const togglePrayerStatus = async (id: string) => {
    const prayer = prayerTimes.find((p: typeof prayerTimes[number]) => p.id == id);
    if (!prayer) return;
    try {
      await fetch(`/api/prayer-times/${id}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
        body: JSON.stringify({ status: prayer.status === 'enabled' ? 'disabled' : 'enabled' }),
      });
      queryClient.invalidateQueries({ queryKey: ['prayer-times'] });
    } catch (error) {
      console.error('Failed to toggle prayer status:', error);
    }
  };

  // === General Settings Management ===
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

  // === Qibla Direction ===
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
      setEditingQiblaModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['mosque'] });
    } catch (error) {
      console.error('Failed to update qibla:', error);
    }
  };

  // === Device Management ===
  const disconnectDevice = async (deviceId: string) => {
    try {
      await fetch(`/api/devices/${deviceId}/disconnect`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${user?.token}` },
      });
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    } catch (error) {
      console.error('Failed to disconnect device:', error);
    }
  };

  const generatePairingCode = async () => {
    try {
      const res = await fetch('/api/pairing/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}` 
        },
      });
      if (!res.ok) throw new Error('Failed to generate');
      const data = await res.json();
      setPairingCode(data.code);
      setPairingExpiry(data.expires_at);
      setPairingModalOpen(true);
    } catch (error) {
      console.error('Failed to generate pairing code:', error);
    }
  };

  const closePairingModal = () => {
    setPairingModalOpen(false);
    setPairingCode(null);
    setPairingExpiry(null);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // === Modal handlers ===
  const openPrayerTimeModal = (prayerName: string) => {
    if (!prayerTimes) return;
    const prayer = prayerTimes.find((p: any) => p.name === prayerName);
    if (!prayer) return;
    setSelectedPrayer(prayerName);
    setEditingTimes({ [prayerName]: prayer.time });
    setTimeModalOpen(true);
  };

  const savePrayerTime = async () => {
    const prayer = prayerTimes.find((p: any) => p.name === selectedPrayer);
    if (!prayer) return;

    if (editingTimes[selectedPrayer] && editingTimes[selectedPrayer] !== prayer.time) {
      try {
        await fetch(`/api/prayer-times/${prayer.id}/time`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
          body: JSON.stringify({ time: editingTimes[selectedPrayer] }),
        });
        setTimeModalOpen(false);
        queryClient.invalidateQueries({ queryKey: ['prayer-times'] });
      } catch (error) {
        console.error('Failed to update prayer time:', error);
      }
    } else {
      setTimeModalOpen(false);
    }
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  if (user.role === 'superadmin') {
    router.push('/admin');
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
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-12 h-12 mx-auto text-red-400 mb-4"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
          <p className="text-red-400 text-sm">Gagal memuat data masjid</p>
          <button onClick={() => router.refresh()} className="btn-link mt-2 text-sm">Coba lagi</button>
        </div>
      </div>
    );
  }

  // === Prayer names mapping ===
  const prayerNames: Record<string, string> = {
    subuh: 'Subuh',
    terbit: 'Syuryuk',
    dhuhur: 'Dzuhur',
    ashar: 'Ashar',
    maghrib: 'Maghrib',
    isya: 'Isya',
  };

  return (
    <div className="min-h-screen flex bg-slate-900">
      {/* === Sidebar === */}
      <aside className="w-56 min-h-screen bg-slate-900 border-r border-border flex flex-col">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-6">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden">
              <Image src="/logo.png" alt="Jadwal Masjid" fill className="object-contain" />
            </div>
            <span className="font-bold text-white">Settings</span>
          </div>

          <nav className="space-y-0.5">
            <NavItem
              icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.94.54a2 2 0 0 1-2.46-.54l-.28-.48A2 2 0 0 0 3.12 2H2.5a2 2 0 0 0-2 2v14c0 .55.22 1.08.6.88l2.44-1.4a2 2 0 0 1 2.22 0l.94.54a2 2 0 0 1 1 1.73v.18a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.94-.54a2 2 0 0 1 2.46.54l.28.48A2 2 0 0 0 20.88 22h.62a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-.62a2 2 0 0 0-2 2"/></svg>}
              label="Umum"
              active={activeSection === 'general'}
              onClick={() => setActiveSection('general')}
            />
            <NavItem
              icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
              label="Waktu Sholat"
              active={activeSection === 'prayer-times'}
              onClick={() => setActiveSection('prayer-times')}
            />
            <NavItem
              icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20"/><path d="M2 12a14.5 14.5 0 0 0 20 0"/></svg>}
              label="Arah Kiblat"
              active={activeSection === 'qibla'}
              onClick={() => setActiveSection('qibla')}
            />
            <NavItem
              icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M18 8A6 6 0 0 0 6 8c0 7-6 7-6 7"/><path d="M15 8h.01"/><path d="M9 8h.01"/></svg>}
              label="Adzan"
              active={activeSection === 'adhans'}
              onClick={() => setActiveSection('adhans')}
            />
            <NavItem
              icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12" y2="18"/></svg>}
              label="Perangkat"
              active={activeSection === 'devices'}
              onClick={() => setActiveSection('devices')}
            />
          </nav>
        </div>

        {/* User section at bottom */}
        <div className="mt-auto p-4 border-t border-border">
          <button onClick={handleLogout} className="btn-ghost w-full text-left text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Keluar
          </button>
        </div>
      </aside>

      {/* === Main Content === */}
      <main className="flex-1 overflow-y-auto p-8">
        {/* General Section */}
        {activeSection === 'general' && (
          <div className="max-w-2xl space-y-6" style={{ animation: 'fadeSlideUp 0.3s ease-out' }}>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white mb-1">Pengaturan Umum</h1>
              <p className="text-muted-foreground">Kelola informasi masjid dan pengaturan dasar</p>
            </div>

            {/* Mosque Info Card */}
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

            {/* General Settings */}
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
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M11 4.7A2 2 0 0 1 12.7 4h5.1c.98-.02 1.8.72 1.8 1.6 0 .3-.1.6-.25.9l-7.35 10.4a1.3 1.3 0 0 1-1.8.3c-.3-.2-.5-.6-.5-1v-1.8c0-.3.1-.6.3-.8L17.5 5.7h-4.9l-4.6 11.5 4.4-8.8"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Qibla Section */}
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
          </div>
        )}

        {/* Prayer Times Section */}
        {activeSection === 'prayer-times' && (
          <div className="max-w-2xl space-y-6" style={{ animation: 'fadeSlideUp 0.3s ease-out' }}>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white mb-1">Waktu Sholat</h1>
              <p className="text-muted-foreground">Kelola jadwal waktu sholat untuk display TV</p>
            </div>

            <SectionCard title="Jadwal Waktu Sholat">
              <div>
                {(prayerTimes || []).map((prayer: any) => (
                  <PrayerTimeRow
                    key={prayer.id}
                    name={prayerNames[prayer.name] || prayer.name}
                    time={prayer.time}
                    onEdit={() => openPrayerTimeModal(prayer.name)}
                  />
                ))}
              </div>
            </SectionCard>
          </div>
        )}

        {/* Qibla Section */}
        {activeSection === 'qibla' && (
          <div className="max-w-2xl space-y-6" style={{ animation: 'fadeSlideUp 0.3s ease-out' }}>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white mb-1">Arah Kiblat</h1>
              <p className="text-muted-foreground">Pengaturan arah kiblat untuk TV</p>
            </div>

            <SectionCard title="Bearing Kiblat">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Bearing (derajat)</label>
                  <input
                    value={mosque?.qibla_bearing?.toString() || ''}
                    onChange={(e) => setEditingQiblaData({ ...editingQiblaData, value: e.target.value })}
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
          </div>
        )}

        {/* Adhan Section */}
        {activeSection === 'adhans' && (
          <div className="max-w-2xl space-y-6" style={{ animation: 'fadeSlideUp 0.3s ease-out' }}>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white mb-1">Pengaturan Adzan</h1>
              <p className="text-muted-foreground">Kelola adzan dan iqomah untuk TV</p>
            </div>

            <SectionCard title="Pengaturan Adzan">
              <div className="space-y-4">
                {(adhanSettings || []).map((setting: any) => (
                  <div key={setting.id} className="flex items-center justify-between px-4 py-3 border-b border-border last:border-b-0">
                    <div className="flex-1">
                      <span className="text-sm font-medium text-foreground">{setting.key}</span>
                      {setting.value && <span className="text-muted-foreground text-xs ml-2">({setting.value})</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Toggle
                        enabled={setting.status === 'enabled'}
                        onChange={() => {}}
                      />
                      <button onClick={() => {}} className="text-muted-foreground hover:text-foreground transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M11 4.7A2 2 0 0 1 12.7 4h5.1c.98-.02 1.8.72 1.8 1.6 0 .3-.1.6-.25.9l-7.35 10.4a1.3 1.3 0 0 1-1.8.3c-.3-.2-.5-.6-.5-1v-1.8c0-.3.1-.6.3-.8L17.5 5.7h-4.9l-4.6 11.5 4.4-8.8"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        )}

        {/* Devices Section */}
        {activeSection === 'devices' && (
          <div className="max-w-2xl space-y-6" style={{ animation: 'fadeSlideUp 0.3s ease-out' }}>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white mb-1">Perangkat</h1>
              <p className="text-muted-foreground">Kelola perangkat TV yang terhubung</p>
            </div>

            <SectionCard title="TV yang Terhubung">
              <div className="space-y-4">
                {(devices || []).map((device: any) => (
                  <div key={device.id} className="flex items-center justify-between px-4 py-3 border-b border-border last:border-b-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${device.is_online ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                      <div>
                        <span className="text-sm font-medium text-foreground">{device.name}</span>
                        <p className="text-muted-foreground text-xs">
                          {device.is_online ? 'Online' : 'Offline'}
                          {device.last_seen_at && !device.is_online ? ` - Terakhir: ${new Date(device.last_seen_at).toLocaleString('id-ID')}` : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => disconnectDevice(device.id)}
                      className="btn-ghost text-red-400 text-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M18 6H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12v-6"/><path d="M18 18v-6a2 2 0 0 0-2-2h-2"/></svg>
                      Putus
                    </button>
                  </div>
                ))}
                {(!devices || devices.length === 0) && (
                  <p className="text-muted-foreground text-sm text-center py-4">Belum ada TV yang terhubung</p>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <button
                  onClick={generatePairingCode}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12" y2="18"/></svg>
                  Tambah TV Baru
                </button>
              </div>
            </SectionCard>
          </div>
        )}

        {/* Pairing Code Modal */}
        {pairingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" style={{ animation: 'fadeIn 0.2s ease-out' }}>
            <div className="card max-w-sm w-full p-6 text-center">
              <h2 className="text-lg font-semibold text-white mb-2">Kode Pairing TV</h2>
              <p className="text-muted-foreground text-sm mb-6">Masukkan kode ini di TV Anda</p>
              
              <div className="bg-slate-800 rounded-xl p-6 mb-6">
                <div className="text-4xl font-bold tracking-widest text-emerald-400 font-mono">
                  {pairingCode?.slice(0, 3)} {pairingCode?.slice(3)}
                </div>
              </div>
              
              <p className="text-muted-foreground text-xs mb-6">
                Kode berlaku selama 10 menit
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={closePairingModal}
                  className="flex-1 btn-ghost"
                >
                  Tutup
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(pairingCode || '');
                  }}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 px-4 py-2.5 text-sm font-semibold rounded-lg"
                >
                  Salin
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Prayer Time Modal */}
        {timeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" style={{ animation: 'fadeIn 0.2s ease-out' }}>
            <div className="card max-w-md w-full p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Edit {selectedPrayer}</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Waktu</label>
                  <input
                    value={editingTimes[selectedPrayer] || ''}
                    onChange={(e) => setEditingTimes({ ...editingTimes, [selectedPrayer]: e.target.value })}
                    type="time"
                    className="input mt-1 bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setTimeModalOpen(false)} className="btn-ghost">Batal</button>
                <button onClick={savePrayerTime} className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 px-4 py-2.5 text-sm font-semibold rounded-lg">
                  Simpan
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
