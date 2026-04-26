'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useSocket } from '@/lib/socket';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, MapPin, Save, XCircle, Loader2, MessageSquare, Image as ImageIcon, Timer, Bell, Table, Trash2, Plus } from 'lucide-react';
import dynamic from 'next/dynamic';
import { AccordionItem } from '@/components/ui/accordion';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

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
    isMuadzin: false,
  });

  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Background Slider TV state
  const [sliderBackgrounds, setSliderBackgrounds] = useState<string[]>([]);
  const [slideInterval, setSlideInterval] = useState(30); // in seconds
  const [animationType, setAnimationType] = useState('slide_ltr');
  const [isInfiniteLoop, setIsInfiniteLoop] = useState(true);
  const sliderFileInputRef = useRef<HTMLInputElement>(null);

  // Timer & Announcement state
  const [timerPreAdhanMinutes, setTimerPreAdhanMinutes] = useState(2);
  const [timerIqamahSubuh, setTimerIqamahSubuh] = useState(5);
  const [timerIqamahDzuhur, setTimerIqamahDzuhur] = useState(3);
  const [timerIqamahAshar, setTimerIqamahAshar] = useState(2);
  const [timerIqamahMaghrib, setTimerIqamahMaghrib] = useState(1);
  const [timerIqamahIsya, setTimerIqamahIsya] = useState(2);
  const [timerBeepEnabled, setTimerBeepEnabled] = useState(true);
  const [timerBeepCount, setTimerBeepCount] = useState(3);
  const [showSilentIcon, setShowSilentIcon] = useState(true);
  const [adhanDisplayDuration, setAdhanDisplayDuration] = useState(5);

  // Announcement state
  interface Announcement {
    id: string;
    type: 'pengajian' | 'jumat_hari_raya' | 'table';
    title: string;
    subtitle?: string;
    date?: string;
    time_start?: string;
    time_end?: string;
    location?: string;
    headers?: string[];
    rows?: string[][];
  }

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activeAnnouncementType, setActiveAnnouncementType] = useState<'pengajian' | 'jumat_hari_raya' | 'table'>('pengajian');
  const [newAnnouncement, setNewAnnouncement] = useState<Omit<Announcement, 'id' | 'type'>>({
    title: '', subtitle: '', date: '', time_start: '', time_end: '', location: '', headers: [], rows: []
  });

  // Table announcement state
  const [tableHeaders, setTableHeaders] = useState<string[]>(['No', 'Nama', 'Jumlah', 'Keterangan']);
  const [tableRows, setTableRows] = useState<string[][]>([]);

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
        isMuadzin: mosque.is_muadzin || false,
      });
      if (mosque.background) {
        setBackgroundPreview(mosque.background);
      }
      
      // Load background slider data from mosque.settings
      if (mosque.settings) {
        const settings = typeof mosque.settings === 'string' ? JSON.parse(mosque.settings) : mosque.settings || {};
        
        // Load background slider data
        if (settings.backgrounds && Array.isArray(settings.backgrounds)) {
          setSliderBackgrounds(settings.backgrounds);
        }
        if (settings.slideInterval !== undefined) {
          setSlideInterval(Math.floor((settings.slideInterval ?? 30000) / 1000)); // convert ms to seconds for UI
        } else {
          setSlideInterval(30);
        }
        setAnimationType(settings.animationType || 'slide_ltr');
        setIsInfiniteLoop(typeof settings.isInfiniteLoop !== 'undefined' ? settings.isInfiniteLoop : true);

        // Load timer settings
        if (settings.timerSettings) {
          setTimerPreAdhanMinutes(settings.timerSettings.pre_adhan_countdown_minutes ?? 2);
          setTimerIqamahSubuh(settings.timerSettings.iqamah_duration_minutes?.subuh ?? 5);
          setTimerIqamahDzuhur(settings.timerSettings.iqamah_duration_minutes?.dzuhur ?? 3);
          setTimerIqamahAshar(settings.timerSettings.iqamah_duration_minutes?.ashar ?? 2);
          setTimerIqamahMaghrib(settings.timerSettings.iqamah_duration_minutes?.maghrib ?? 1);
          setTimerIqamahIsya(settings.timerSettings.iqamah_duration_minutes?.isya ?? 2);
          setTimerBeepEnabled(typeof settings.timerSettings.beep_sound_enabled === 'boolean' ? settings.timerSettings.beep_sound_enabled : true);
          setTimerBeepCount(settings.timerSettings.beep_count ?? 3);
          setShowSilentIcon(typeof settings.timerSettings.show_silent_icon_during_prayer !== 'undefined' ? settings.timerSettings.show_silent_icon_during_prayer : true);
          setAdhanDisplayDuration(settings.timerSettings.adhan_display_duration ?? 5);
        }

        // Load announcements
        if (settings.announcements && Array.isArray(settings.announcements)) {
          setAnnouncements(settings.announcements);
        }
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

  const handleSliderFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingCount = 10 - sliderBackgrounds.length;
    if (files.length > remainingCount) {
      showToast(`Maksimal 10 gambar. Tersisa ${remainingCount} slot.`);
      return;
    }

    const compressedImages: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        showToast(`File ${file.name} terlalu besar (max 10MB)`);
        return;
      }

      try {
        const compressed = await compressImage(file);
        compressedImages.push(compressed);
      } catch (error) {
        console.error('Error compressing image:', error);
        showToast('Gagal memproses gambar');
        return;
      }
    }

    setSliderBackgrounds(prev => [...prev, ...compressedImages]);
  };

  const moveSliderImage = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= sliderBackgrounds.length) return;
    
    const copy = [...sliderBackgrounds];
    const [moved] = copy.splice(index, 1);
    copy.splice(newIndex, 0, moved);
    setSliderBackgrounds(copy);
  };

  const removeSliderImage = (index: number) => {
    const copy = [...sliderBackgrounds];
    copy.splice(index, 1);
    setSliderBackgrounds(copy);
  };

  const saveBackgroundSlider = async () => {
    if (sliderBackgrounds.length === 0) {
      showToast('Tambahkan minimal 1 gambar');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/mosque/upload-backgrounds', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
        body: JSON.stringify({
          backgrounds: sliderBackgrounds,
          slideInterval: slideInterval * 1000, // convert seconds to ms
          animationType: animationType,
          isInfiniteLoop: isInfiniteLoop,
        }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || 'Gagal menyimpan background slider');
      } else {
        showToast('Background Slider berhasil disimpan & dikirim ke TV');
        queryClient.invalidateQueries({ queryKey: ['mosque'] });
      }
    } catch (error) {
      showToast('Gagal menyimpan');
    }
    setSaving(false);
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

  const saveAuto = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/mosque/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
        body: JSON.stringify({ is_muadzin: formState.isMuadzin }),
      });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || 'Gagal menyimpan');
        return;
      }
      showToast(formState.isMuadzin ? 'Mode Muadzin diaktifkan' : 'Mode Muadzin dinonaktifkan');
      queryClient.invalidateQueries({ queryKey: ['mosque'] });
    } catch {
      showToast('Gagal menyimpan');
    }
    setSaving(false);
  };

  const saveInfo = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/mosque/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
        body: JSON.stringify({ name: formState.name, address: formState.address }),
      });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || 'Gagal menyimpan');
        return;
      }
      showToast('Informasi berhasil disimpan & dikirim ke TV');
      queryClient.invalidateQueries({ queryKey: ['mosque'] });
    } catch {
      showToast('Gagal menyimpan');
    }
    setSaving(false);
  };

  const saveTimerSettings = async () => {
    if (!formState.isMuadzin) {
      showToast('Mode Muadzin harus diaktifkan terlebih dahulu untuk menggunakan timer');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/mosque/upload-timer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
        body: JSON.stringify({
          timerSettings: {
            pre_adhan_countdown_minutes: timerPreAdhanMinutes,
            iqamah_duration_minutes: {
              subuh: timerIqamahSubuh,
              dzuhur: timerIqamahDzuhur,
              ashar: timerIqamahAshar,
              maghrib: timerIqamahMaghrib,
              isya: timerIqamahIsya,
            },
            beep_sound_enabled: timerBeepEnabled,
            beep_count: timerBeepCount,
            show_silent_icon_during_prayer: showSilentIcon,
            adhan_display_duration: adhanDisplayDuration,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || 'Gagal menyimpan timer');
      } else {
        showToast('Timer berhasil disimpan & dikirim ke TV');
        queryClient.invalidateQueries({ queryKey: ['mosque'] });
      }
    } catch (error) {
      showToast('Gagal menyimpan');
    }
    setSaving(false);
  };

  const saveAnnouncements = async () => {
    if (!formState.isMuadzin) {
      showToast('Mode Muadzin harus diaktifkan terlebih dahulu untuk menggunakan pengumuman');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/mosque/upload-timer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
        body: JSON.stringify({
          announcements: announcements,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || 'Gagal menyimpan pengumuman');
      } else {
        showToast('Pengumuman berhasil disimpan & dikirim ke TV');
        queryClient.invalidateQueries({ queryKey: ['mosque'] });
      }
    } catch (error) {
      showToast('Gagal menyimpan');
    }
    setSaving(false);
  };

  const addAnnouncement = () => {
    if (!newAnnouncement.title) {
      showToast('Judul pengumuman harus diisi');
      return;
    }

    const newAnn: Announcement = {
      id: Date.now().toString(),
      type: activeAnnouncementType,
      ...newAnnouncement,
    };

    setAnnouncements(prev => [...prev, newAnn]);
    setNewAnnouncement({ title: '', subtitle: '', date: '', time_start: '', time_end: '', location: '', headers: [], rows: [] });
    showToast('Pengumuman berhasil ditambahkan');
  };

  const removeAnnouncement = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  // Table management functions
  const updateTableHeader = (index: number, value: string) => {
    const newHeaders = [...tableHeaders];
    newHeaders[index] = value;
    setTableHeaders(newHeaders);
  };

  const removeTableHeader = (index: number) => {
    if (tableHeaders.length <= 1) {
      showToast('Minimal harus ada 1 kolom');
      return;
    }
    setTableHeaders(prev => prev.filter((_, i) => i !== index));
    setTableRows(prev => prev.map(row => row.filter((_, i) => i !== index)));
  };

  const addTableRow = () => {
    const newRow = new Array(tableHeaders.length).fill('');
    setTableRows(prev => [...prev, newRow]);
  };

  const updateTableCell = (rowIndex: number, cellIndex: number, value: string) => {
    const newRows = [...tableRows];
    newRows[rowIndex] = [...newRows[rowIndex]];
    newRows[rowIndex][cellIndex] = value;
    setTableRows(newRows);
  };

  const removeTableRow = (index: number) => {
    if (tableRows.length <= 1) {
      showToast('Minimal harus ada 1 baris');
      return;
    }
    setTableRows(prev => prev.filter((_, i) => i !== index));
  };

  const saveTableData = async () => {
    if (!formState.isMuadzin) {
      showToast('Mode Muadzin harus diaktifkan terlebih dahulu untuk menggunakan tabel');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/mosque/upload-timer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
        body: JSON.stringify({
          tableAnnouncement: {
            headers: tableHeaders,
            rows: tableRows,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || 'Gagal menyimpan tabel');
      } else {
        showToast('Tabel berhasil disimpan & dikirim ke TV');
        queryClient.invalidateQueries({ queryKey: ['mosque'] });
      }
    } catch (error) {
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

  const hasCoords = formState.lat && formState.long;
  const hasBackground = backgroundPreview || formState.background;

  return (
    <>
    <style jsx global>{`
      /* Fix z-index for Leaflet map in accordion - map must stay below topbar and notifications */
      .leaflet-pane {
        z-index: 10 !important;
      }
      .leaflet-marker-pane,
      .leaflet-icon-pane,
      .leaflet-overlay-pane {
        z-index: 11 !important;
      }
      .leaflet-interactive {
        z-index: 12 !important;
      }
      .leaflet-popup-pane {
        z-index: 15 !important;
      }
      .leaflet-tooltip-pane {
        z-index: 16 !important;
      }
    `}</style>
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

      <div className="space-y-3">
        {/* INFO ACCORDION */}
        <AccordionItem
          title="Informasi Masjid"
          icon={<Building2 className="w-5 h-5" />}
        >
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
              onClick={saveInfo}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Simpan Informasi & Update TV
            </button>
          </div>
        </AccordionItem>

        {/* LOCATION ACCORDION */}
        <AccordionItem
          title="Lokasi & Koordinat"
          icon={<MapPin className="w-5 h-5" />}
        >
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
                    onCloseFullscreen={() => setMapFullscreen(false)}
                  />
                </div>
                {!mapFullscreen && (
                  <button
                    onClick={() => setMapFullscreen(true)}
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
        </AccordionItem>

        {/* RUNNING TEXT ACCORDION */}
        <AccordionItem
          title="Running Text"
          icon={<MessageSquare className="w-5 h-5" />}
        >
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
        </AccordionItem>

        {/* BACKGROUND ACCORDION */}
        <AccordionItem
          title="Background TV"
          icon={<ImageIcon className="w-5 h-5" />}
        >
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
                  <button
                    onClick={() => {
                      setBackgroundPreview(null);
                      setFormState(prev => ({ ...prev, background: '' }));
                    }}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Hapus
                  </button>
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
         </AccordionItem>

        {/* BACKGROUND SLIDER TV ACCORDION */}
        <AccordionItem
          title="Background Slider TV"
          icon={<ImageIcon className="w-5 h-5" />}
        >
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-foreground">Upload Gambar</label>
              <p className="text-muted-foreground text-xs mb-3">
                Upload minimal 1 gambar untuk slideshow (max 10 gambar). Setiap gambar max 10MB.
              </p>
              <input
                type="file"
                accept="image/*"
                multiple
                ref={sliderFileInputRef}
                onChange={handleSliderFileSelect}
                className="hidden"
              />
              <div
                onClick={() => sliderFileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-600 rounded-xl p-6 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-500/5 transition-all"
              >
                <ImageIcon className="w-10 h-10 mx-auto text-slate-500 mb-2" />
                <p className="text-white font-medium">Klik untuk tambah gambar</p>
                <p className="text-muted-foreground text-xs mt-1">PNG, JPG, WebP • Tersisa {10 - sliderBackgrounds.length} slot</p>
              </div>
            </div>

            {sliderBackgrounds.length > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">
                  Urutan Slide ({sliderBackgrounds.length} gambar)
                </label>
                
                <div className="grid gap-3">
                  {sliderBackgrounds.map((bg, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50 border border-slate-700">
                      <span className="text-xs text-muted-foreground font-bold w-6 text-center">{index + 1}</span>
                      <img src={bg} alt={`Slide ${index + 1}`} className="w-24 h-16 object-cover rounded" />
                      
                      <div className="flex gap-1">
                        <button
                          onClick={() => moveSliderImage(index, -1)}
                          disabled={index === 0}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                          title="Geser ke atas"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveSliderImage(index, 1)}
                          disabled={index === sliderBackgrounds.length - 1}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                          title="Geser ke bawah"
                        >
                          ↓
                        </button>
                      </div>
                      
                      <button
                        onClick={() => removeSliderImage(index)}
                        className="ml-auto p-1 text-red-400 hover:text-red-300 transition-colors"
                        title="Hapus gambar"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>

                <p className="text-muted-foreground text-xs">
                  Gunakan tombol ↑↓ untuk mengubah urutan slide. Gambar pertama akan tampil paling awal.
                </p>
              </div>
            )}

            {sliderBackgrounds.length > 0 && (
              <div className="space-y-4 pt-2 border-t border-slate-700">
                <label className="text-sm font-medium text-foreground">Pengaturan Slide</label>
                
                {/* Duration Setting */}
                <div>
                  <label htmlFor="slideInterval" className="text-sm font-medium text-foreground">Durasi Tampil (detik)</label>
                  <input
                    id="slideInterval"
                    type="number"
                    min={5}
                    max={300}
                    value={slideInterval}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val >= 5 && val <= 300) setSlideInterval(val);
                    }}
                    className="input mt-1 bg-slate-800/50 border-slate-700 text-white w-[200px]"
                  />
                  <p className="text-muted-foreground text-xs mt-1">Animasi otomatis ~{Math.min(Math.floor(slideInterval / 2), 2)} detik</p>
                </div>

                {/* Animation Type */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Jenis Animasi</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setAnimationType('slide_ltr')}
                      className={`p-3 rounded-lg border transition-all ${animationType === 'slide_ltr' ? 'border-emerald-500 bg-emerald-500/10 text-white' : 'border-slate-700 bg-slate-800/50 text-muted-foreground hover:border-slate-600'}`}
                    >
                      <div className="text-sm font-medium">Slide Kiri→Kanan</div>
                      <div className="text-xs mt-1 opacity-75">Gambar baru masuk dari kiri</div>
                    </button>
                    <button
                      onClick={() => setAnimationType('fade')}
                      className={`p-3 rounded-lg border transition-all ${animationType === 'fade' ? 'border-emerald-500 bg-emerald-500/10 text-white' : 'border-slate-700 bg-slate-800/50 text-muted-foreground hover:border-slate-600'}`}
                    >
                      <div className="text-sm font-medium">Fade Crossfade</div>
                      <div className="text-xs mt-1 opacity-75">Transisi halus (opacity)</div>
                    </button>
                  </div>
                </div>

                {/* Infinite Loop Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="flex-1">
                    <p className="text-white font-medium">Looping Otomatis</p>
                    <p className="text-muted-foreground text-sm mt-1">Kembali ke gambar pertama setelah selesai</p>
                  </div>
                  <button
                    onClick={() => setIsInfiniteLoop(!isInfiniteLoop)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${isInfiniteLoop ? 'bg-emerald-500' : 'bg-slate-600'}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${isInfiniteLoop ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                {/* Save Button */}
                <button
                  onClick={saveBackgroundSlider}
                  disabled={saving || sliderBackgrounds.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 px-4 py-3 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Simpan & Update TV
                </button>

                <p className="text-muted-foreground text-xs text-center">
                  {sliderBackgrounds.length === 1 ? 'Satu gambar akan tampil statis (tanpa slideshow)' : `${sliderBackgrounds.length} gambar siap ditampilkan sebagai slideshow`}
                </p>
              </div>
            )}

            {sliderBackgrounds.length === 0 && (
              <button
                onClick={saveBackgroundSlider}
                disabled={true}
                className="w-full flex items-center justify-center gap-2 bg-slate-600 text-white shadow-lg px-4 py-3 text-sm font-semibold rounded-lg transition-colors opacity-50 cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                Simpan & Update TV
              </button>
            )}
          </div>
        </AccordionItem>

        {/* AUTO ACCORDION */}
        <AccordionItem
          title="Mode Muadzin (Auto)"
          icon={<Zap className="w-5 h-5" />}
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="flex-1">
                <p className="text-white font-medium">Mode Muadzin</p>
                <p className="text-muted-foreground text-sm mt-1">Tampilkan badge "Mode Muadzin" di TV Android</p>
              </div>
              <button
                onClick={() => setFormState(prev => ({ ...prev, isMuadzin: !prev.isMuadzin }))}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${formState.isMuadzin ? 'bg-emerald-500' : 'bg-slate-600'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${formState.isMuadzin ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <button
               onClick={saveAuto}
               disabled={saving}
               className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
             >
               {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
               Simpan & Update TV
             </button>
           </div>
         </AccordionItem>

        {/* TIMER ACCORDION */}
        <AccordionItem
          title="Pengaturan Timer Countdown"
          icon={<Timer className="w-5 h-5" />}
        >
          {!formState.isMuadzin ? (
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-center">
              <p className="text-yellow-400 font-medium">Mode Muadzin harus diaktifkan terlebih dahulu</p>
              <p className="text-muted-foreground text-sm mt-2">Klik toggle "Mode Muadzin" untuk mengaktifkan timer countdown</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Pre-Adhan Countdown */}
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <label className="text-sm font-medium text-white block mb-2">Countdown sebelum Adhan (menit)</label>
                <input
                  type="number"
                  value={timerPreAdhanMinutes}
                  onChange={(e) => setTimerPreAdhanMinutes(Number(e.target.value))}
                  min={1} max={30}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-emerald-500"
                />
                <p className="text-muted-foreground text-xs mt-1">Timer countdown akan berjalan sebelum adhan berkumandang</p>
              </div>

              {/* Iqamah Durations */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-white block">Durasi Iqamah per Waktu Sholat (menit)</label>
                {[
                  ['Subuh', timerIqamahSubuh, 'subuh'],
                  ['Dzuhur', timerIqamahDzuhur, 'dzuhur'],
                  ['Ashar', timerIqamahAshar, 'ashar'],
                  ['Maghrib', timerIqamahMaghrib, 'maghrib'],
                  ['Isya', timerIqamahIsya, 'isya']
                ].map(([name, value, key]) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-24">{name}</span>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => {
                        if (key === 'subuh') setTimerIqamahSubuh(Number(e.target.value));
                        else if (key === 'dzuhur') setTimerIqamahDzuhur(Number(e.target.value));
                        else if (key === 'ashar') setTimerIqamahAshar(Number(e.target.value));
                        else if (key === 'maghrib') setTimerIqamahMaghrib(Number(e.target.value));
                        else if (key === 'isya') setTimerIqamahIsya(Number(e.target.value));
                      }}
                      min={1} max={30}
                      className="flex-1 px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-xs text-muted-foreground">{value} menit</span>
                  </div>
                ))}
              </div>

              {/* Beep Settings */}
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 space-y-3">
                <label className="text-sm font-medium text-white block">Pengaturan Bunyi</label>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Aktifkan Beep Countdown</p>
                    <p className="text-muted-foreground text-xs">Suarakan beep saat countdown berakhir</p>
                  </div>
                  <button
                    onClick={() => setTimerBeepEnabled(!timerBeepEnabled)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${timerBeepEnabled ? 'bg-emerald-500' : 'bg-slate-600'}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${timerBeepEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-24">Jumlah Beep</span>
                  <input type="number" value={timerBeepCount} onChange={(e) => setTimerBeepCount(Number(e.target.value))} min={1} max={20} className="flex-1 px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-emerald-500" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Tampilkan Ikon Hening</p>
                    <p className="text-muted-foreground text-xs">Ikon hening saat waktu sholat dimulai</p>
                  </div>
                  <button onClick={() => setShowSilentIcon(!showSilentIcon)} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${showSilentIcon ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${showSilentIcon ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              <button onClick={saveTimerSettings} disabled={saving} className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 px-4 py-3 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Simpan Timer & Update TV
              </button>
            </div>
          )}
        </AccordionItem>

        {/* ANNOUNCEMENT ACCORDION */}
        <AccordionItem title="Pengumuman & Info Jadwal" icon={<Bell className="w-5 h-5" />}>
          {!formState.isMuadzin ? (
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-center">
              <p className="text-yellow-400 font-medium">Mode Muadzin harus diaktifkan terlebih dahulu</p>
              <p className="text-muted-foreground text-sm mt-2">Klik toggle "Mode Muadzin" untuk mengaktifkan pengumuman</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex gap-2">
                {[{ key: 'pengajian', label: 'Pengajian' }, { key: 'jumat_hari_raya', label: 'Jumat / Hari Raya' }].map(tab => (
                  <button key={tab.key} onClick={() => setActiveAnnouncementType(tab.key as 'pengajian' | 'jumat_hari_raya')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${activeAnnouncementType === tab.key ? 'bg-emerald-500 text-white' : 'bg-slate-800/50 text-muted-foreground hover:bg-slate-700'}`}>{tab.label}</button>
                ))}
              </div>

              <div className="space-y-3 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <label className="text-sm font-medium text-white block">Tambah Pengumuman Baru</label>
                <input type="text" placeholder="Judul pengumuman" value={newAnnouncement.title} onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))} className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500" />
                <input type="text" placeholder="Subtitle (opsional)" value={newAnnouncement.subtitle} onChange={(e) => setNewAnnouncement(prev => ({ ...prev, subtitle: e.target.value }))} className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500" />
                <div className="grid grid-cols-3 gap-2">
                  <input type="date" value={newAnnouncement.date} onChange={(e) => setNewAnnouncement(prev => ({ ...prev, date: e.target.value }))} className="px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-emerald-500" />
                  <input type="time" value={newAnnouncement.time_start} onChange={(e) => setNewAnnouncement(prev => ({ ...prev, time_start: e.target.value }))} placeholder="Mulai" className="px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-emerald-500" />
                  <input type="time" value={newAnnouncement.time_end} onChange={(e) => setNewAnnouncement(prev => ({ ...prev, time_end: e.target.value }))} placeholder="Selesai" className="px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-emerald-500" />
                </div>
                <input type="text" placeholder="Lokasi / Tempat (opsional)" value={newAnnouncement.location} onChange={(e) => setNewAnnouncement(prev => ({ ...prev, location: e.target.value }))} className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500" />
                <button onClick={addAnnouncement} disabled={!newAnnouncement.title || saving} className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
                  <Plus className="w-4 h-4" /> Tambahkan Pengumuman
                </button>
              </div>

              {announcements.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white block">Pengumuman Tersimpan ({announcements.length})</label>
                  {announcements.map(ann => (
                    <div key={ann.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                      <div className="flex-1">
                        <p className="text-white font-medium">{ann.title}</p>
                        {ann.subtitle && <p className="text-muted-foreground text-xs">{ann.subtitle}</p>}
                        {(ann.date || ann.time_start) && <p className="text-emerald-400 text-xs mt-1">{ann.date} • {ann.time_start}{ann.time_end ? ` - ${ann.time_end}` : ''}{ann.location ? ` • ${ann.location}` : ''}</p>}
                      </div>
                      <button onClick={() => removeAnnouncement(ann.id)} className="p-2 text-red-400 hover:text-red-300 transition-colors" title="Hapus pengumuman"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={saveAnnouncements} disabled={saving || announcements.length === 0} className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 px-4 py-3 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Simpan Pengumuman & Update TV
              </button>
            </div>
          )}
        </AccordionItem>

        {/* TABLE ANNOUNCEMENT ACCORDION */}
        <AccordionItem title="Pengumuman Bentuk Tabel" icon={<Table className="w-5 h-5" />}>
          {!formState.isMuadzin ? (
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-center">
              <p className="text-yellow-400 font-medium">Mode Muadzin harus diaktifkan terlebih dahulu</p>
              <p className="text-muted-foreground text-sm mt-2">Klik toggle "Mode Muadzin" untuk mengaktifkan pengumuman bentuk tabel</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Table Headers */}
              <div className="space-y-3 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <label className="text-sm font-medium text-white block">Kolom Tabel</label>
                {tableHeaders.map((header, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={header}
                      onChange={(e) => updateTableHeader(index, e.target.value)}
                      placeholder={`Kolom ${index + 1}`}
                      className="flex-1 px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-emerald-500"
                    />
                    <button onClick={() => removeTableHeader(index)} className="p-2 text-red-400 hover:text-red-300 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button onClick={() => setTableHeaders(prev => [...prev, 'Kolom Baru'])} className="w-full py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                  + Tambah Kolom
                </button>
              </div>

              {/* Table Rows */}
              <div className="space-y-3 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <label className="text-sm font-medium text-white block">Baris Data</label>
                {tableRows.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">Belum ada baris data. Klik "Tambah Baris" untuk memulai.</p>
                ) : (
                  tableRows.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex items-center gap-2 mb-2 flex-wrap">
                      {row.map((cell, cellIndex) => (
                        <input
                          key={`${rowIndex}-${cellIndex}`}
                          type="text"
                          value={cell}
                          onChange={(e) => updateTableCell(rowIndex, cellIndex, e.target.value)}
                          placeholder={`Baris ${rowIndex + 1}, Kolom ${cellIndex + 1}`}
                          className="flex-1 min-w-[200px] px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-emerald-500"
                        />
                      ))}
                      <button onClick={() => removeTableRow(rowIndex)} className="p-2 text-red-400 hover:text-red-300 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
                <button onClick={addTableRow} className="w-full py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                  + Tambah Baris
                </button>
              </div>

              {/* Save Button */}
              <button onClick={saveTableData} disabled={saving || tableRows.length === 0} className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 px-4 py-3 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Simpan Tabel & Update TV
              </button>

              <p className="text-muted-foreground text-xs text-center">
                Buat tabel untuk pengumuman jadwal, daftar nama, atau informasi lainnya di TV Android
              </p>
            </div>
          )}
        </AccordionItem>

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
