'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  Settings,
  Clock,
  Compass,
  Bell,
  Smartphone,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  ChevronDown,
} from 'lucide-react';

const navItems = [
  { id: 'umum', label: 'Umum', href: '/settings/umum', icon: <Settings className="w-5 h-5" /> },
  { id: 'waktu-sholat', label: 'Waktu Sholat', href: '/settings/waktu-sholat', icon: <Clock className="w-5 h-5" /> },
  { id: 'arah-kiblat', label: 'Arah Kiblat', href: '/settings/arah-kiblat', icon: <Compass className="w-5 h-5" /> },
  { id: 'adzan', label: 'Adzan', href: '/settings/adzan', icon: <Bell className="w-5 h-5" /> },
  { id: 'perangkat', label: 'Perangkat', href: '/settings/perangkat', icon: <Smartphone className="w-5 h-5" /> },
];

const breadcrumbMap: Record<string, { label: string; parent?: string }> = {
  '/settings/umum': { label: 'Umum', parent: 'Settings' },
  '/settings/waktu-sholat': { label: 'Waktu Sholat', parent: 'Settings' },
  '/settings/arah-kiblat': { label: 'Arah Kiblat', parent: 'Settings' },
  '/settings/adzan': { label: 'Adzan', parent: 'Settings' },
  '/settings/perangkat': { label: 'Perangkat', parent: 'Settings' },
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  const breadcrumbs = breadcrumbMap[pathname]
    ? [
        { label: 'Settings', href: '/settings/umum' },
        { label: breadcrumbMap[pathname].label },
      ]
    : [{ label: 'Settings', href: '/settings/umum' }];

  const handleLogout = () => {
    setUserMenuOpen(false);
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 text-slate-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-white">Settings</span>

          {/* User dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-2 -mr-2 text-slate-400 hover:text-white"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            </button>

            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-700">
                    <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                    <p className="text-xs text-slate-400">{user?.email || user?.role}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Keluar
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Desktop header */}
      <header
        className="hidden lg:flex fixed top-0 right-0 z-20 h-14 items-center justify-between px-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm transition-all duration-300"
        style={{ left: sidebarCollapsed ? '4rem' : '14rem' }}
      >
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-slate-600" />
              )}
              {crumb.href && index < breadcrumbs.length - 1 ? (
                <Link href={crumb.href} className="text-slate-400 hover:text-white transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-white font-medium">{crumb.label}</span>
              )}
            </div>
          ))}
        </nav>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-3 px-3 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium">{user?.name || 'User'}</span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-700">
                  <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                  <p className="text-xs text-slate-400">{user?.email || user?.role}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Keluar
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 relative">
                  <Image src="/logo.png" alt="Settings" fill className="object-contain" />
                </div>
                <span className="font-bold text-white">Settings</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 -mr-2 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-800">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 w-full text-left text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg text-sm font-medium transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Keluar</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:bg-slate-900 lg:border-r lg:border-slate-800 transition-all duration-300 ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-56'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 h-14 shrink-0">
          {sidebarCollapsed ? (
            <div className="w-8 h-8 mx-auto relative">
              <Image src="/logo.png" alt="Settings" fill className="object-contain" />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 relative">
                <Image src="/logo.png" alt="Settings" fill className="object-contain" />
              </div>
              <span className="font-bold text-white">Settings</span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors ${sidebarCollapsed ? 'mx-auto' : ''}`}
          >
            <ChevronLeft className={`w-5 h-5 transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}`} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                {item.icon}
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-slate-800 shrink-0">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-slate-400 hover:bg-slate-800 hover:text-white w-full ${sidebarCollapsed ? 'justify-center' : ''}`}
            title={sidebarCollapsed ? 'Keluar' : undefined}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!sidebarCollapsed && <span>Keluar</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div
        className={`pt-14 lg:pt-14 transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-56'}`}
      >
        {/* Breadcrumbs mobile */}
        <div className="lg:hidden px-4 py-3 border-b border-slate-800 bg-slate-900">
          <nav className="flex items-center gap-2 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center gap-2">
                {index > 0 && (
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                )}
                <span className={index < breadcrumbs.length - 1 ? 'text-slate-400' : 'text-white font-medium'}>
                  {crumb.label}
                </span>
              </div>
            ))}
          </nav>
        </div>

        <main className="p-4 lg:p-8 min-h-[calc(100vh-3.5rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
