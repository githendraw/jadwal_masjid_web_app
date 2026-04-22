# Jadwal Masjid - Web App (Admin Dashboard)

Sistem manajemen jadwal sholat masjid — dari pengaturan web hingga display TV.

## Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm

## Setup

### 1. Clone & Install

```bash
git clone https://github.com/githendraw/jadwal-mosque-settings.git
cd jadwal-mosque-settings
npm install
```

### 2. Database Migration

Jalankan migrasi database untuk membuat/memperbarui schema:

```bash
# Lokal
mysql -u root -p jadwal_masjid < migrations/000_full_schema.sql

# Remote via Cloudflared tunnel (contoh)
mysql -u masjid -p -h 127.0.0.1 -P 3307 jadwal_masjid < migrations/000_full_schema.sql
```

Migrasi ini akan:
- Membuat semua tabel (`users`, `mosques`, `devices`, `payments`, `pairing_codes`)
- Menambahkan kolom `address` di tabel `mosques` jika belum ada
- Mengisi default settings JSON (`pengumumanJumat`, `pengumumanKajian`, `location`)
- Menyinkronkan `address` dari `settings.location` untuk data yang sudah ada
- Insert superadmin user (`admin@jadwalmasjid.com` / `password`)
- Insert sample mosque (Masjid Al-Ikhlas Bandung)

### 3. Environment Variables

Buat file `.env` di root project:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root
DB_NAME=jadwal_masjid
PORT=4000
JWT_SECRET=jadwal-masjid-secret
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 4. Run Development

```bash
npm run dev
```

Server berjalan di `http://localhost:4000` (Next.js + Socket.io).

### 5. Run Production

```bash
npm run build
NODE_ENV=production npm run start
```

### 6. Docker

```bash
docker-compose up -d
```

## API Endpoints

Lihat [DOCUMENTATION.md](./DOCUMENTATION.md) untuk daftar lengkap API endpoints dan flow diagram.

## Default Login

| Role | Email | Password |
|------|-------|----------|
| Superadmin | admin@jadwalmasjid.com | password |

## Struktur Database

Lihat `migrations/000_full_schema.sql` untuk schema lengkap.

Kolom penting di tabel `mosques`:
- `address` — Alamat masjid, tampil di TV sebagai location
- `lat` / `long` — Koordinat untuk perhitungan jadwal sholat (Adhan.js)
- `calculation_method` — Metode perhitungan (KEMENAG, JAKARTA_IST, ASRA, UM, MECCAH)
- `settings` (JSON) — Berisi `pengumumanJumat`, `pengumumanKajian`, dan config lainnya

## License

Private