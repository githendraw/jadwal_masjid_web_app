'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Building2, TrendingUp, CheckCircle, XCircle, Monitor } from 'lucide-react';

interface MosqueData {
  settings?: Record<string, any>;
  mosque_slug?: string;
  is_active?: number;
  is_online?: number;
  mosque_uuid?: string;
}

interface Tenant {
  id: number;
  email: string;
  mosque_id: number | null;
  mosque_name: string | null;
  settings: MosqueData | null;
  is_active: number | null;
  is_online: number | null;
  mosque_slug?: string;
  mosque_uuid?: string;
}

interface Device {
  device_id: string;
  name: string;
  is_active: number | null;
  is_online: number | null;
  last_seen_at: string | null;
  created_at: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [stats, setStats] = useState<{
    total_mosques: number;
    active_tenants: number;
    online_count: number;
    total_devices_online: number;
  } | null>(null);
  const [devices, setDevices] = useState<Record<string, Device[]>>({});

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch overview stats
        const statsRes = await fetch('/api/admin/overview');
        if (!statsRes.ok) {
          if (statsRes.status === 403) {
            router.push('/settings'); // Not superadmin
            return;
          }
        }
        const statsData = await statsRes.json();
        setStats(statsData);

        // Fetch all tenants
        const tenantsRes = await fetch('/api/admin/mosques');
        if (tenantsRes.ok) {
          const data = await tenantsRes.json();
          setTenants(data);

          // Fetch devices for each mosque
          const devicePromises = data.map(async (tenant: Tenant) => {
            try {
              const slug = tenant.mosque_slug || tenant.mosque_name?.toLowerCase().replace(/\s+/g, '-');
              const devicesRes = await fetch(`/api/admin/mosque/${slug}/devices`);
              if (devicesRes.ok) {
                const deviceData = await devicesRes.json();
                return { [slug]: deviceData };
              }
            } catch (err) {
              console.error('Failed to fetch devices for', tenant.mosque_slug);
            }
            return {};
          });

          const deviceResults = await Promise.all(devicePromises);
          const combinedDevices = deviceResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
          setDevices(combinedDevices);
        }
      } catch (err) {
        console.error('Failed to load admin data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

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
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <img src="/logo.png" alt="Jadwal Masjid" className="w-14 h-14 rounded-full border-2 border-white/30" />
            <div>
              <h1 className="text-2xl font-bold">Dashboard Superadmin</h1>
              <p className="text-emerald-100 text-sm">Manajemen semua tenant (masjid)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <Building2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Masjid</p>
                <p className="text-2xl font-bold text-slate-800">{stats?.total_mosques || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Tenant Aktif</p>
                <p className="text-2xl font-bold text-slate-800">{stats?.active_tenants || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Online</p>
                <p className="text-2xl font-bold text-slate-800">{stats?.online_count || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Monitor className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">TV Online</p>
                <p className="text-2xl font-bold text-slate-800">{stats?.total_devices_online || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tenant List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-50 to-emerald-50 px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">Daftar Tenant (Masjid)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Nama Masjid</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Email User</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">TV</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Status</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {tenants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      Belum ada tenant terdaftar
                    </td>
                  </tr>
                ) : (
                  tenants.map((tenant) => {
                    const slug = tenant.mosque_slug || tenant.mosque_name?.toLowerCase().replace(/\s+/g, '-');
                    const deviceList = devices[slug] || [];
                    const deviceCount = deviceList.length;
                    const onlineDeviceCount = deviceList.filter((d: Device) => d.is_online === 1).length;

                    return (
                      <tr key={tenant.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-800">
                          {tenant.mosque_name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {tenant.email}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Monitor className="w-4 h-4 text-purple-500" />
                            <span className="text-sm text-slate-600">
                              {deviceCount} device
                              {onlineDeviceCount > 0 && (
                                <span className="ml-1 text-green-500 text-xs">({onlineDeviceCount} online)</span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {tenant.is_active !== null && tenant.is_active === 1 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                <CheckCircle className="w-3 h-3" /> Aktif
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                                <XCircle className="w-3 h-3" /> Tidak Aktif
                              </span>
                            )}
                            {tenant.is_online !== null && tenant.is_online === 1 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                <CheckCircle className="w-3 h-3" /> Online
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                                <XCircle className="w-3 h-3" /> Offline
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => router.push(`/settings?mosque=${slug}`)}
                              className="btn-primary px-3 py-1 text-sm rounded-lg"
                            >
                              Settings
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Logout Button */}
        <div className="mt-6">
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
  );
}
