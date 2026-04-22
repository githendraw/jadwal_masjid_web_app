import { Metadata } from 'next'
import './globals.css'
import { ReactQueryClientProvider } from '@/lib/providers'

export const metadata: Metadata = {
  title: 'Jadwal Masjid - Settings',
  description: 'Pengaturan masjid Anda',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" href="/favicon.ico?v=3" type="image/x-icon" />
      </head>
      <body>
        <ReactQueryClientProvider>
          {children}
        </ReactQueryClientProvider>
      </body>
    </html>
  )
}
