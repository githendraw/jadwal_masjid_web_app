# Jadwal Masjid - Dokumentasi Teknis

## Arsitektur

```
┌─────────────────────────────────┐     Socket.io      ┌──────────────────────────────┐
│  jadwal_masjid_web_app          │◄──────────────────► │  jadwal_masjid_app_android_tv │
│  Next.js 16 + Custom Server     │     Real-time sync  │  React + Vite + Ionic         │
│  Port: 4000                     │                      │  (Capacitor untuk APK)         │
│  MySQL + Socket.io              │                      │  localStorage + Adhan.js       │
└─────────────────────────────────┘                      └──────────────────────────────┘
          │
          ▼
    MySQL Database
    (jadwal_masjid)
```

## Database Schema

Lihat file `migrations/000_full_schema.sql` untuk schema lengkap.

Tabel utama:
- **mosques** - Data masjid (name, address, lat, long, calculation_method, settings JSON)
- **users** - User akun (email, password_hash, role, mosque_id)
- **devices** - Perangkat TV yang terhubung (id UUID, mosque_id, name, is_online)
- **pairing_codes** - Kode pairing untuk TV (code, mosque_id, expires_at, used_at)

### Kolom penting di `mosques`:
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `address` | VARCHAR(500) | Alamat masjid, tampil di TV sebagai `location` |
| `lat` | DECIMAL(10,7) | Latitude untuk hitung jadwal sholat |
| `long` | DECIMAL(10,7) | Longitude untuk hitung jadwal sholat |
| `calculation_method` | ENUM | KEMENAG, JAKARTA_IST, ASRA, UM, MECCAH |
| `settings` | JSON | Berisi pengumuman dan config tambahan |

### Settings JSON structure:
```json
{
  "pengumumanJumat": "Teks berjalan baris atas (kuning)",
  "pengumumanKajian": "Teks berjalan baris bawah (merah)",
  "location": "Alamat lokasi (sync dari address)",
  "prayer_times": [...]
}
```

## Data Mapping (TV ConfigData)

TV app menggunakan interface `ConfigData`:
```typescript
interface ConfigData {
  mosqueName: string;      // ← mosques.name
  location: string;        // ← mosques.address
  pengumumanJumat: string; // ← mosques.settings.pengumumanJumat
  pengumumanKajian: string;// ← mosques.settings.pengumumanKajian
  lat: number;             // ← mosques.lat
  long: number;            // ← mosques.long
  calculationMethod: string;// ← mosques.calculation_method
}
```

Semua API endpoint yang mengirim data ke TV **wajib** menggunakan camelCase sesuai interface di atas.

## Flow Aplikasi

### 1. Flow: Scan QR (Masjid Baru)

```
TV (StartupPage)                    Web App (/register)              Server
  ├─ Generate UUID (device_uuid)
  ├─ Tampilkan QR code
  │  URL: app.jadwalmasjid.com/register?token=X&device=UUID
  │
  │   User scan QR di HP ──────►
  │                                ├─ Form registrasi
  │                                ├─ POST /api/auth/register
  │                                │  { email, password, mosque_name,
  │                                │    device_uuid }
  │                                │
  │                                │  ──► INSERT mosques + users + devices
  │                                │  ◄── { mosque_uuid, mosque_id }
  │                                │
  │                                ├─ Redirect ke /login
  │                                └─ User login
  │
  ├─ Polling GET /api/devices/check?device_uuid=UUID
  │  (setiap 3 detik saat mode scan)
  │
  │  ◄── { registered: true, settings: {...} }
  │
  ├─ Save config ke localStorage
  └─ onFinish() → tampil halaman utama
```

### 2. Flow: Input Kode Pairing (TV ke-2 dst)

```
Web App (/settings/perangkat)       TV (StartupPage)                Server
  ├─ Klik "Tambah TV Baru"
  ├─ POST /api/pairing/generate
  │  (auth: JWT)
  │  ◄── { code: "ABC123", expires_at }
  │
  │   Tampilkan kode ────────────►
  │                                 ├─ Input kode 6 digit
  │                                 ├─ POST /api/pairing/verify
  │                                 │  { code: "ABC123", device_uuid }
  │                                 │
  │                                 │  ──► INSERT devices, UPDATE pairing_codes
  │                                 │  ◄── { mosque_uuid, mosque_id, mosque_name,
  │                                 │        settings: { mosqueName, location,
  │                                 │          pengumumanJumat, pengumumanKajian,
  │                                 │          lat, long, calculationMethod } }
  │                                 │
  │                                 ├─ Save config ke localStorage
  │                                 └─ onFinish() → halaman utama
```

### 3. Flow: Update Setting dari Web → Real-time ke TV

```
Web App (/settings/umum)            Server (Socket.io)              TV App
  ├─ User edit nama/alamat
  ├─ User edit lat/long (GPS)
  ├─ User edit running text
  ├─ PUT /api/mosque/update
  │  { name, address, lat, long,
  │    calculation_method,
  │    pengumumanJumat, pengumumanKajian }
  │
  │  ──► UPDATE mosques SET ...
  │  ──► emitConfigUpdate(mosque_id)
  │
  │                                  ├─ Query mosques table
  │                                  └─ io.to(mosque_uuid).emit('config_update', {
  │                                       mosqueName, location,
  │                                       pengumumanJumat, pengumumanKajian,
  │                                       lat, long, calculationMethod })
  │
  │                                  │  ───────────────────────────►│
  │                                  │                               ├─ setConfig(prev => {...prev, ...data})
  │                                  │                               ├─ Save ke localStorage
  │                                  │                               └─ calculatePrayerTimes(lat, long, method)
```

### 4. Flow: TV App Menjalankan Jadwal Sholat

```
App.tsx (TV App)
  │
  ├─ Cek localStorage('mosque_uuid') → skip pairing jika sudah ada
  ├─ Load config dari localStorage('jadwal_masjid_config')
  ├─ calculatePrayerTimes(lat, long, method) menggunakan Adhan.js
  │   Method: KEMENAG | JAKARTA_IST | ASRA | UM | MECCAH
  │
  ├─ Hubungkan Socket.io (setelah pairing selesai)
  │   ├─ auth: { device_uuid }
  │   ├─ emit 'join_room' dengan mosque_uuid
  │   └─ listen 'config_update' → update config + recalculate prayer times
  │
  ├─ Render UI:
  │   ├─ Header: Jam | Nama Masjid | Alamat | Tanggal Masehi + Hijri
  │   ├─ Body: Area konten + bar 7 kartu jadwal sholat
  │   └─ Footer: Running text pengumumanJumat (kuning) + pengumumanKajian (merah)
  │
  └─ Recalculate prayer times tiap 60 detik
```

## API Endpoint Reference

### Pairing & Device

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/api/pairing/generate` | JWT | Generate kode pairing 6 karakter (valid 10 menit) |
| POST | `/api/pairing/verify` | - | Verifikasi kode pairing, daftarkan device |
| GET | `/api/pairing/code/[code]` | - | Cek status kode pairing |
| GET | `/api/devices/check?device_uuid=X` | - | Cek apakah device sudah terdaftar (untuk polling TV) |
| GET | `/api/devices` | JWT | List devices milik masjid |
| POST | `/api/devices` | JWT | Tambah device baru |
| PUT | `/api/devices/[deviceId]/disconnect` | JWT | Putus koneksi device |

### Auth

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/api/auth/login` | - | Login, return JWT + cookies |
| POST | `/api/auth/register` | - | Daftar user + masjid baru, opsional device_uuid dari QR |
| POST | `/api/auth/pair` | JWT | Pair device ke masjid yang sudah ada |
| GET | `/api/auth/me` | JWT | Info user login |

### Mosque & Settings

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/mosques/me` | JWT | Info masjid + settings + general_settings |
| PUT | `/api/mosque/update` | JWT | Update nama, alamat, lat/long, metode, pengumuman (**emit config_update ke TV**) |
| GET | `/api/mosque/settings?slug=X` | - | Public settings masjid by slug |
| GET | `/api/mosque/devices` | JWT | List devices milik masjid |
| PUT | `/api/settings` | JWT | Update key-value setting |
| GET/PUT | `/api/settings/[id]` | JWT | Get/update single setting |
| PUT | `/api/settings/[id]/toggle` | JWT | Toggle setting enable/disable |
| PUT | `/api/settings/mosque/[mosque_id]` | JWT | Update settings JSON masjid |

### Admin

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/admin/overview` | superadmin | Dashboard overview |
| GET | `/api/admin/mosques` | superadmin | List semua masjid |
| GET/PUT | `/api/admin/mosque/[slug]` | superadmin | Detail/update masjid by slug |
| GET | `/api/admin/users` | superadmin | List semua user |
| PUT | `/api/admin/users/[userId]/toggle-status` | superadmin | Enable/disable user |

### Jadwal Sholat

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/prayer-times` | JWT | Hitung jadwal sholat berdasarkan lat/long masjid |
| PUT | `/api/prayer-times/[id]/time` | JWT | Update waktu sholat manual |
| PUT | `/api/prayer-times/[id]/toggle` | JWT | Toggle sholat on/off |

## Konfigurasi Environment

### Web App (.env)
```
DB_HOST=localhost
DB_USER=masjid
DB_PASSWORD=masjid123
DB_NAME=jadwal_masjid
PORT=4000
JWT_SECRET=jadwal-masjid-secret
```

### Android TV App (.env atau VITE_BACKEND_URL)
```
VITE_BACKEND_URL=https://app.jadwalmasjid.com
```

## Perintah Build & Deploy

### Web App
```bash
cd jadwal_masjid_web_app
npm install
npm run build        # Next.js build
npm run dev           # Development (port 4000)
# atau production:
NODE_ENV=production node server.ts
```

### Android TV App
```bash
cd jadwal_masjid_app_android_tv
npm install
npm run build         # Vite build
npm run dev           # Development (Vite dev server)
# Build APK:
npx cap sync android
cd android && ./gradlew assembleDebug
```

### Database Migration
```bash
mysql -u masjid -p jadwal_masjid < migrations/000_full_schema.sql
```

## Bug Fix Log

### Bug #1: TV tetap di halaman QR scan setelah pairing
**Penyebab:**  
- `BACKEND_URL` default ke `localhost` yang salah  
- QR URL tidak menyertakan `device_uuid`  
- Tidak ada polling mechanism untuk deteksi device terdaftar  
- Socket.io connect sebelum pairing selesai

**Fix:**  
- BACKEND_URL default ke `https://app.jadwalmasjid.com`  
- QR URL menyertakan `&device=UUID`  
- StartupPage polling `GET /api/devices/check` setiap 3 detik  
- Socket.io hanya connect setelah `isPairing = false`

### Bug #2: Config mapping tidak sinkron antara web, server, dan TV
**Penyebab:**  
- Field `address` tidak ada di DB schema  
- API endpoint return snake_case tapi TV expect camelCase  
- `/api/pairing/verify` tidak return `lat`, `long`, `calculation_method`  
- `socket.emit('config_update')` tidak pernah dipanggil  
- `general_settings` selalu empty array  

**Fix:**  
- Tambah kolom `address VARCHAR(500)` ke tabel mosques  
- Semua API yang mengirim ke TV pakai camelCase: `mosqueName`, `location`, `pengumumanJumat`, `pengumumanKajian`, `lat`, `long`, `calculationMethod`  
- Buat `lib/socket-emit.ts` dengan `emitConfigUpdate()`  
- Semua setting update API sekarang emit `config_update` ke TV via Socket.io  
- `general_settings` sekarang dikonversi dari JSON settings  

### Bug #3: lat/long tidak bisa diisi dari web
**Penyebab:**  
- Field lat/long di web app readonly  
- Tidak ada tombol Get GPS Location  
- Tidak ada API untuk update lat/long  

**Fix:**  
- Buat `PUT /api/mosque/update` dengan validasi lat (-90~90) long (-180~180)  
- Settings page sekarang editable dengan tombol "Dapatkan Lat/Long Otomatis"  
- Setiap perubahan langsung emit ke TV via Socket.io  

### Bug #4: Socket.io `config_update` event tidak pernah terkirim
**Penyebab:**  
- Server Socket.io instance tidak di-share ke API routes  

**Fix:**  
- Set `globalThis.io = io` di `server.ts`  
- Import `emitConfigUpdate` dari `lib/socket-emit.ts` di semua settings update routes  

### Bug #5: App.tsx calculatePrayerTimes crash jika lat/long null
**Penyebab:**  
- `calculatePrayerTimes(lat, long, method)` tidak handle null lat/long  

**Fix:**  
- Fungsi sekarang menerima `number | null` dan fallback ke DEFAULT_CONFIG values