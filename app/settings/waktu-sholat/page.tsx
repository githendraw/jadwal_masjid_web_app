'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useSocket } from '@/lib/socket';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';

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
          <Pencil className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

const prayerNames: Record<string, string> = {
  subuh: 'Subuh',
  terbit: 'Syuryuk',
  dhuhur: 'Dzuhur',
  ashar: 'Ashar',
  maghrib: 'Maghrib',
  isya: 'Isya',
};

export default function WaktuSholatPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editingTimes, setEditingTimes] = useState<{ [key: string]: string }>({});
  const [selectedPrayer, setSelectedPrayer] = useState<string>('');
  const [timeModalOpen, setTimeModalOpen] = useState(false);

  const { data: prayerTimes, isLoading } = useQuery({
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

  useEffect(() => {
    if (!socket) return;
    socket.on('prayer-times:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['prayer-times'] });
    });
    return () => {
      socket.off('prayer-times:updated');
    };
  }, [socket, queryClient]);

  const openPrayerTimeModal = (prayerName: string) => {
    if (!prayerTimes) return;
    const prayer = prayerTimes.find((p: any) => p.name === prayerName);
    if (!prayer) return;
    setSelectedPrayer(prayerName);
    setEditingTimes({ [prayerName]: prayer.time });
    setTimeModalOpen(true);
  };

  const savePrayerTime = async () => {
    const prayer = prayerTimes?.find((p: any) => p.name === selectedPrayer);
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

      {timeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <div className="card max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Edit {prayerNames[selectedPrayer] || selectedPrayer}</h2>
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
    </div>
  );
}
