import { Metadata } from 'next';
import './globals.css';
import { ReactQueryClientProvider } from '@/lib/providers';
import { AuthProvider } from '@/lib/auth';
import { SocketProvider } from '@/lib/socket';
import { Plus_Jakarta_Sans, Sora } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
});

const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sora',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Jadwal Masjid',
  description: 'Sistem manajemen jadwal sholat masjid',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${jakarta.variable} ${sora.variable}`}>
      <body className="bg-background text-foreground font-sans antialiased">
        <ReactQueryClientProvider>
          <AuthProvider>
            <SocketProvider>{children}</SocketProvider>
          </AuthProvider>
        </ReactQueryClientProvider>
      </body>
    </html>
  );
}
