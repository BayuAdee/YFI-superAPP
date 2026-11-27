# Superapps — PT Yahata Fastener Indonesia (YFI)

Website pintu masuk tunggal untuk sistem-sistem internal YFI. Karyawan login SEKALI di sini (NIK + password),
lalu memilih card sistem (Safety Patrol, Mesin, Tooling, ...) dan langsung masuk TANPA login lagi (SSO).
Dirancang 2026-11-21 bersama pemilik saat membangun sistem Safety Patrol
(`E:\PROJECT YAHATA\systeminformasisafetypatrol`, sisi penerima SSO-nya SUDAH jadi dan teruji).

## Cara kerja dengan pemilik proyek
- Jelaskan dulu, tunggu persetujuan sebelum implementasi besar. Pemilik ingin paham konsepnya.
- Gaya `/ponytail`: solusi paling sedikit kode, stdlib/native dulu, tanpa abstraksi spekulatif.
- Jawaban singkat dan terstruktur, bahasa Indonesia. Koreksi satu hal per langkah.
- Setelah sistem selesai / menjelang produksi: ingatkan pemilik menjalankan `/threat-model deep web with privacy`.

## Stack (sama dengan Safety Patrol)
Satu folder (2026-11-27, `backend/` dilebur ke root): React (Vite) + Tailwind di `src/` + `index.html`, Laravel 13 + Sanctum (token) di `app/`, `routes/api.php`, `config/`, `database/`, `tests/` (API saja, tanpa `routes/web.php`/`resources/`). `public/` = web root Laravel, BUKAN folder aset Vite (`publicDir: false`; logo di `src/logo.jpg`, diimpor). PostgreSQL 16 lokal
(database `superapps`, uji: `superapps_test`).
- PHP dari Laragon: `E:\laragon\bin\php\php-8.4.12-nts-Win32-vs17-x64\php.exe` (pdo_pgsql, pgsql, zip aktif). Composer: `E:\laragon\bin\composer\composer.phar`.
- Dev: `php artisan serve --port=8001` + `npx vite --host` (keduanya dari root). Vite meneruskan `/api` ke Laravel (proxy di `vite.config.js`). Pakai port berbeda dari Safety Patrol (mis. Laravel 8001, Vite 5174) agar bisa jalan bersamaan.
- Pola yang sudah terbukti di Safety Patrol (boleh dicontoh, lihat foldernya): `src/api.js` (fetch + token di localStorage), aturan isian sebagai CHECK di database, tolakan database dijadikan pesan 422 di `bootstrap/app.php`, uji di `tests/Feature`.
- Windows: `vite build` butuh `@rolldown/binding-win32-x64-msvc`.

## Konsep (FINAL, jangan dibuka lagi tanpa diminta)
- Superapps = BOLEH MASUK sistem mana. Tiap sistem = JADI APA di dalamnya (role/departemen diatur di menu Kelola sistem itu sendiri).
- Masuk ke sebuah sistem hanya bila: dicentang aksesnya di Superapps DAN punya akun aktif ber-NIK sama di sistem itu. NIK tak terdaftar di sistem tujuan = ditolak oleh sistem itu (tanpa buat akun otomatis).
- Akses PER ORANG (NIK): tabel `akses(nik, sistem)`. "Satu departemen boleh masuk" = superadmin mencentang semua orang di departemen itu. Card dan tiket hanya untuk sistem yang dicentang.
- Sistem TIDAK saling memanggil API untuk login. Satu-satunya penghubung SSO = redirect browser + kunci rahasia bersama. JANGAN kirim NIK polos di URL.
- Tiket dibuat di SERVER Laravel Superapps (kunci rahasia tidak pernah sampai ke browser): browser minta tiket untuk sistem X (dengan token login) -> server cek akses -> balas URL -> browser pindah ke URL itu.
- Logout Superapps tidak mengeluarkan dari sistem lain (token Sanctum sistem lain belum punya masa berlaku; diputuskan diterima dulu).

## Peran
- `user`: melihat card sistem yang dicentang untuknya, masuk lewat SSO.
- `admin`: KHUSUS layar monitor di ruangan office. Menampilkan rekap per bulan (bulan bisa dipilih bebas) dengan diagram/bar chart dari sistem-sistem. Hanya melihat rekap; TIDAK bisa melihat/mengubah akun, NIK, atau akses (alasan: menjaga privasi data yang hanya boleh dilihat superadmin).
- `superadmin`: kelola akun (NIK, nama, departemen, peran, aktif/nonaktif, reset password) dan centang akses sistem per orang.

## Akun awal (seeder) — NIK HARUS SAMA dengan seeder tiap sistem
Password awal semua akun = `SEED_PASSWORD` di `.env`. NIK uji = 900 + nomor departemen + 1/2. Diganti NIK asli lewat menu Kelola.

| Akun | Peran | NIK |
|---|---|---|
| Superadmin | superadmin | 90000 |
| Admin (monitor office) | admin | 90100 |
| Engineering 1 / 2 | user | 90011 / 90012 |
| HRGA 1 / 2 | user | 90021 / 90022 |
| Maintenance 1 / 2 | user | 90031 / 90032 |
| PPIC 1 / 2 | user | 90041 / 90042 |
| Produksi 1 / 2 | user | 90051 / 90052 |
| Purchasing 1 / 2 | user | 90061 / 90062 |
| Quality 1 / 2 | user | 90071 / 90072 |
| Sales & Marketing 1 / 2 | user | 90081 / 90082 |

Safety Patrol sudah memakai daftar NIK yang sama persis (seeder-nya diperbarui 2026-11-21).

## Format tiket SSO (HARUS persis sama; sisi penerima Safety Patrol sudah jadi)
```
tiket = B . "." . hex( HMAC-SHA256(B, SSO_SECRET_sistem) )
B     = base64url("<nik>|<exp>")   tanpa padding "=", exp = detik unix UTC (sekarang + 60)
URL   = <alamat sistem>/sso#tiket=<tiket>        (setelah "#", tidak tercatat di log server)
```
Kode pembuat tiket (salinan dari `systeminformasisafetypatrol/backend/app/SsoTicket.php`):
```php
$b = rtrim(strtr(base64_encode($nik.'|'.(time() + 60)), '+/', '-_'), '=');
$tiket = $b.'.'.hash_hmac('sha256', $b, $secret);
```
Sisi penerima menolak bila: tanda tangan salah, exp sudah lewat atau > 120 detik ke depan (jam server harus sinkron), tiket sudah pernah dipakai, NIK tidak terdaftar/nonaktif.
- Kunci rahasia BEDA untuk tiap sistem, minimal 32 karakter, disimpan di `.env` Superapps dan `backend/.env` Safety Patrol (mis. `SSO_SECRET_SAFETY=` di Superapps = `SSO_SECRET=` di Safety Patrol). Kunci dev Safety Patrol ada di `systeminformasisafetypatrol/backend/.env`.
- Uji sisi penerima tanpa Superapps: di Safety Patrol `php artisan sso:tiket <nik>`.

## Daftar sistem
| Sistem | Alamat dev | Status SSO |
|---|---|---|
| Safety Patrol & 5S/5R | `http://localhost:5173` (`/sso`) | penerima SUDAH jadi |
| Mesin | - | belum |
| Tooling | - | belum |

Daftar sistem ada di `config/sistem.php` (kode, nama, ket, `URL_<KODE>`, `SSO_SECRET_<KODE>` dari `.env`), bukan tabel, karena menambah sistem selalu butuh kunci baru di `.env`. Akses = tabel `akses(nik, sistem)` (FK ke users.nik, ikut berubah bila NIK diganti). API: `GET /api/sistem` (card), `POST /api/sso/{kode}` (URL bertiket). Uji: `tests/Feature/SsoTest.php`.

## Tema UI (sama dengan Safety Patrol, agar terasa satu keluarga)
Monokrom mengikuti logo YFI (`src/logo.jpg`, salinan `systeminformasisafetypatrol/public/logo.jpg`): warna utama `gray-900`, tanpa hijau/biru/amber; merah hanya untuk makna bahaya/error.
Tata letak (2026-11-24, disamakan dengan Safety Patrol): desktop = sidebar kiri hitam `gray-950` (logo, menu, akun + NIK + Keluar); HP = bar atas hitam, menu bawah hanya bila menu > 1 (superadmin: Beranda/Kelola). Baris judul putih + tanggal. Beranda = kartu sambutan hitam bermotif garis diagonal + card sistem berikon (`ICON` per kode di `Beranda.jsx`, default LayoutGrid). Login = panel hitam bermotif (desktop) + form. Kelola: pesan berhasil/gagal dibedakan, inisial nama, badge status. Memuat = `Skeleton`, animasi `animate-muncul`, Back HP lewat `history.pushState`. Kolom `max-w-6xl`; datar, garis tipis, sudut kecil; font sistem (tanpa Google Fonts); ikon lucide, tanpa emoji. Contoh token gaya: `systeminformasisafetypatrol/src/ui.jsx` (`INPUT`, `CARD`, `CARD_TITLE`, `BTN`, `BTN2`, `Tabs`). Skill `ui-ux-pro-max` tersedia di `.claude/skills/`.

## Urutan bangun yang disarankan
1. Kerangka: Laravel + Sanctum + React + Tailwind dalam satu folder root, database `superapps`.
2. (SELESAI) Login NIK + password, tabel users (nik unik, name, dept, role, active), seeder akun di atas.
3. Halaman card + pembuat tiket di server -> uji nyata masuk ke Safety Patrol. (SELESAI 2026-11-23)
4. Menu Kelola (superadmin): akun + centang akses per orang. (SELESAI 2026-11-23: `KelolaController`, `src/pages/Kelola.jsx`, `tests/Feature/KelolaTest.php`)
5. Layar monitor office (admin) — lihat bagian berikut.

## Layar monitor office (peran admin) — dirancang belakangan, tunggu kebutuhan data jelas
Rekap per bulan (bulan bebas dipilih) dengan diagram, ditampilkan di monitor ruangan office.
Rencana teknis (dari Safety Patrol): server Superapps memanggil API tiap sistem (server ke server, BUKAN dari browser) memakai akun layanan `superapps` ber-role `admin` di sistem itu + token Sanctum di `.env` Superapps (`Http::withToken(...)->timeout(5)`). Admin di sistem tujuan hanya bisa melihat, jadi token bocor = bocor baca saja.
Safety Patrol sudah punya `GET /api/findings?from=&to=` (temuan dalam rentang waktu) dan `GET /api/tasks`; endpoint ringkasan baru dibuat bila itu tidak cukup.
Layar monitor: huruf besar, tanpa data pribadi, bisa diperbarui otomatis (tanpa perlu disentuh).

## Belum diputuskan
- Halaman login langsung di tiap sistem tetap ada sebagai cadangan (saran: ya, minimal untuk superadmin bila Superapps mati).
- Email di Superapps: wajib atau tidak (karyawan pabrik belum tentu punya email; login cukup NIK).
