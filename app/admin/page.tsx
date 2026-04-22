'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  MapPin,
  Database,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';

interface MosqueRow {
  id: number;
  email: string;
  mosque_id: number | null;
  name: string | null;
  settings: string | null;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'data' | 'log' | 'backup'>('data');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mosqueRows, setMosqueRows] = useState<MosqueRow[]>([]);

  useEffect(() => {
    async function loadMosques() {
      try {
        const res = await fetch('/api/admin/mosques');
        if (!res.ok) {
          console.error('Failed to fetch mosques', res.status);
          return;
        }
        const data = await res.json();
        setMosqueRows(data);
      } catch (err) {
        console.error('Failed to load mosques', err);
      } finally {
        setLoading(false);
      }
    }
    loadMosques();
  }, []);

  const masjidList = mosqueRows.map((row) => ({
    id: row.id,
    name: row.name || 'Tidak diketahui',
    location: row.email,
    status: (row.settings && JSON.parse(row.settings).dark_mode) === true ? 'Aktif' : 'Aktif',
    settings: row.settings ? JSON.parse(row.settings) : {},
    mosque_id: row.mosque_id,
  }));

  const filteredMasjid = masjidList.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentMonth = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-8 px-4 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Dashboard Admin</h1>
          <p className="text-emerald-100 text-lg">Kelola data masjid dan sinkronisasi jadwal</p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="max-w-6xl mx-auto px-4 -mt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Masjid', value: masjidList.length, icon: Building2, color: 'emerald' },
            { label: 'Akun Aktif', value: masjidList.filter((m) => m.status === 'Aktif').length, icon: Users, color: 'blue' },
            { label: 'Lokasi', value: masjidList.length + ' Kota', icon: MapPin, color: 'purple' },
            { label: 'Data Tersimpan', value: (masjidList.length * 0.5).toFixed(1) + ' GB', icon: Database, color: 'orange' },
          ].map((stat) => {
            const Icon = stat.icon;
            const colorClasses = {
              emerald: 'from-emerald-500 to-emerald-600',
              blue: 'from-blue-500 to-blue-600',
              purple: 'from-purple-500 to-purple-600',
              orange: 'from-orange-500 to-orange-600',
            };
            return (
              <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClasses[stat.color as keyof typeof colorClasses]} flex items-center justify-center text-white`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-6xl mx-auto px-4 mt-8">
        <div className="flex gap-1 bg-white rounded-lg p-1 shadow-sm border border-slate-200">
          {[
            { id: 'data', label: 'Data Masjid', icon: Building2 },
            { id: 'log', label: 'Log Aktivitas', icon: RefreshCw },
            { id: 'backup', label: 'Backup & Restore', icon: Database },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setShowForm(false);
                }}
                className={`flex items-center gap-2 px-4 py-3 rounded-md font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'data' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Table Header */}
            <div className="bg-gradient-to-r from-emerald-50 to-emerald-50 px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Data Masjid</h2>
                <p className="text-sm text-slate-500">Menampilkan {filteredMasjid.length} masjid</p>
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary flex items-center gap-2 px-4 py-2 rounded-lg">
                  <Download className="w-5 h-5" />
                  <span className="hidden sm:inline">Ekspor</span>
                </button>
                <button className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg">
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Tambah</span>
                </button>
              </div>
            </div>

            {/* Search & Filter */}
            <div className="px-6 py-4 border-b border-slate-200">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Cari masjid atau lokasi..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  />
                </div>
                <button className="btn-secondary flex items-center gap-2 px-4 py-2 rounded-lg">
                  <Filter className="w-5 h-5" />
                  <span className="hidden sm:inline">Filter</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Nama Masjid</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Email / Lokasi</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Status</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-slate-700">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredMasjid.map((masjid) => (
                    <tr key={masjid.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6 text-base font-medium text-slate-800">{masjid.name}</td>
                      <td className="py-4 px-6 text-base text-slate-600">{masjid.location}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                          masjid.status === 'Aktif'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${
                            masjid.status === 'Aktif' ? 'bg-emerald-500' : 'bg-red-500'
                          }`}></div>
                          {masjid.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="btn-icon-secondary p-2 rounded-lg hover:bg-slate-100">
                            <Edit2 className="w-5 h-5 text-slate-600" />
                          </button>
                          <button className="btn-icon-danger p-2 rounded-lg hover:bg-red-50">
                            <Trash2 className="w-5 h-5 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <p className="text-sm text-slate-500">Menampilkan 1-{filteredMasjid.length} dari {masjidList.length} masjid</p>
              <div className="flex gap-2">
                <button className="btn-secondary p-2 rounded-lg">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button className="btn-primary w-10 h-10 flex items-center justify-center rounded-lg">1</button>
                <button className="btn-secondary w-10 h-10 flex items-center justify-center rounded-lg">2</button>
                <button className="btn-secondary w-10 h-10 flex items-center justify-center rounded-lg">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'log' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-50 to-emerald-50 px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800">Log Aktivitas</h2>
              <p className="text-sm text-slate-500">Riwayat aktivitas {currentMonth}</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {[
                  { time: '14:30', action: 'Sinkronisasi data', user: 'Admin', status: 'Berhasil' },
                  { time: '14:15', action: 'Edit informasi masjid', user: 'Admin', status: 'Berhasil' },
                  { time: '13:45', action: 'Backup database', user: 'System', status: 'Berhasil' },
                  { time: '13:30', action: 'Login pengguna', user: 'Admin', status: 'Berhasil' },
                ].map((log, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">{log.action}</p>
                      <p className="text-sm text-slate-500">{log.user} • {log.time}</p>
                    </div>
                    <span className="text-sm text-emerald-600 font-medium">{log.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'backup' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-50 to-emerald-50 px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800">Backup & Restore</h2>
              <p className="text-sm text-slate-500">Kelola backup database Anda</p>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button className="btn-primary flex items-center justify-center gap-2 py-4 rounded-lg">
                  <Upload className="w-5 h-5" />
                  <span>Backup Sekarang</span>
                </button>
                <button className="btn-secondary flex items-center justify-center gap-2 py-4 rounded-lg">
                  <Download className="w-5 h-5" />
                  <span>Restore dari Backup</span>
                </button>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h3 className="font-semibold text-slate-800 mb-4">Backup Tersimpan</h3>
                <div className="space-y-3">
                  {[
                    { date: '21 Apr 2026, 14:30', size: '2.4 GB' },
                    { date: '20 Apr 2026, 10:15', size: '2.2 GB' },
                    { date: '19 Apr 2026, 08:30', size: '2.1 GB' },
                  ].map((backup, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div>
                        <p className="font-medium text-slate-800">{backup.date}</p>
                        <p className="text-sm text-slate-500">{backup.size}</p>
                      </div>
                      <button className="btn-icon-danger p-2 rounded-lg hover:bg-red-50">
                        <Trash2 className="w-5 h-5 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
