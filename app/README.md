# Aplikasi web AJI JAENS OS

Portal peserta dan sisi pengelola. **Terpisah dari artefak Claude** — lihat alasannya di bawah.

## Kenapa ini bukan bagian dari artefak OS

Penampil artefak Claude **memblokir seluruh permintaan jaringan ke host luar**.
Artefak hanya boleh memuat skrip dari beberapa CDN dan huruf dari Google Fonts;
`fetch` ke `supabase.co` tidak akan pernah sampai, dan gagalnya tanpa pesan.

Jadi pembagiannya tetap:

| | Di mana | Datanya |
|---|---|---|
| **AJI JAENS OS** (artefak) | tautan Claude | localStorage + berkas sinkronisasi |
| **Portal & pengelola** (folder ini) | GitHub Pages / os.ajijaens.com | Supabase |

Portal memang butuh alamat sendiri untuk QR sesi, jadi pemisahan ini bukan kompromi.

## Cara memasang

1. Isi `config.js` dengan Project URL dan **anon public key**.
   Jangan pernah menaruh `service_role` di sana.
2. Unggah seluruh folder `app/` ke repo, aktifkan GitHub Pages.
3. Buka `admin/crm.html` untuk CRM, `sesi/` untuk kendali sesi.

Kalau mengunggah dari iPad dan lebih mudah satu berkas per halaman, pakai
berkas tunggal di akar `app/` — isinya sama, semuanya sudah di dalam:

| Berkas tunggal | Untuk |
|---|---|
| `index.html` | portal peserta |
| `crm.html` | database peserta & funnel |
| `sesi.html` | kendali sesi fasilitator |
| `proyektor.html` | layar proyektor di ruangan |

Keempatnya dirakit dengan `python3 rakit_tunggal.py` dari sumber di
`portal/`, `admin/`, dan `sesi/` — jangan disunting langsung, suntingannya
hilang pada perakitan berikutnya.

Akun pertama: daftar lewat halaman masuk, lalu di SQL Editor Supabase:

```sql
insert into ajios.staff (auth_user_id, peran)
select id, 'admin' from auth.users where email = 'EMAIL-ANDA'
on conflict (auth_user_id) do update set peran = 'admin';
```

## Peran

| Peran | Boleh | Tidak boleh |
|---|---|---|
| `admin` | CRM penuh termasuk usaha dan omzet | — |
| `cs` | kontak, komunitas, tindak lanjut | Life Circle, feedback, action plan |
| `fasilitator` | daftar hadir, progres agregat, pertanyaan | CRM, omzet, jawaban pribadi |
| `operator` | check-in, buka/tutup aktivitas | sisanya |
| peserta | miliknya sendiri | milik peserta lain |

Pembatasan itu **ditegakkan basis data**, bukan oleh halaman ini. Halaman hanya
menjelaskan penolakannya.

## Alamat sesi dan QR

QR sesi dibuat dari alamat **portal peserta**, bukan halaman kendali:

```
<origin>/portal/?sesi=KODE-SESI
```

`origin` diambil dari `config.js`. Isi dengan alamat jadi (misalnya
`https://os.ajijaens.com`) begitu domainnya terpasang — kalau dibiarkan
kosong, alamatnya dihitung dari halaman yang sedang dibuka, dan itu
menghasilkan alamat yang benar hanya kalau strukturnya tidak berubah.

Peserta yang membuka alamat itu didaftarkan ke sesi tersebut setelah masuk.
**Terdaftar bukan hadir**; kehadiran tetap dicatat terpisah lewat check-in.

QR dibuat `lib/qr.js`, ditulis sendiri dan tidak mengambil dari CDN — layar
sesi dipakai di ruangan yang internetnya bisa buruk, dan QR yang gagal muat
berarti peserta tidak bisa bergabung. Kalau pembuat QR gagal, halaman
**tidak menggambar apa pun** dan mengatakannya; kotak hiasan lebih berbahaya
daripada tidak ada gambar.

## Pengujian

```
cd app && ./jalankan_uji.sh
```

Satu perintah: berkas tunggal dirakit ulang, lalu seluruh rangkaian
dijalankan di peramban sungguhan lewat Playwright.

| Rangkaian | Jumlah |
|---|---|
| QR — dibandingkan pembuat QR acuan, lalu **dibaca pembaca QR sungguhan** | 18 |
| NP-V05 CRM (sumber + berkas tunggal) | 16 + 16 |
| NP-V04 Portal (sumber + berkas tunggal) | 25 + 20 |
| NP-V08 Sesi & Proyektor (sumber + berkas tunggal) | 41 + 41 |

Pengujian QR tidak menganggap QR benar karena gambarnya ada: matriksnya
dibandingkan modul per modul dengan pembuat QR acuan (OpenCV), lalu gambarnya
dibaca ulang oleh pembaca QR dan isinya harus sama persis dengan alamat sesi.

**Tiruan bukan Supabase.** Yang diuji di sini logika tampilan, saringan,
pembedaan nol/kosong, dan perilaku penolakan. Perilaku RLS yang sebenarnya
diuji terpisah di PostgreSQL 16 (`backend/test/uji_rls.sql`, 36 lulus).
Yang belum pernah diuji adalah keduanya **bersama lewat HTTP** — itu terjadi
saat `config.js` diisi dan halaman ini dibuka pertama kali.
