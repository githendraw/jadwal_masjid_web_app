'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
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

export default function AdzanPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [editingAdhanModalOpen, setEditingAdhanModalOpen] = useState(false);
  const [editingAdhanData, setEditingAdhanData] = useState({ id: '', key: '', value: '', status: 'disabled', order: 0 });

  const { data: adhanSettings, isLoading } = useQuery({
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
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
