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
3. Buka `admin/crm.html` untuk sisi pengelola.

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

## Pengujian

`test/uji-crm.js` — 16 pengujian terhadap tiruan klien yang meniru RLS,
dijalankan di peramban sungguhan lewat Playwright.

```
cd app && python3 -m http.server 8095 &
node test/uji-crm.js
```

**Tiruan bukan Supabase.** Yang diuji di sini logika tampilan, saringan,
pembedaan nol/kosong, dan perilaku penolakan. Perilaku RLS yang sebenarnya
sudah diuji terpisah di PostgreSQL 16 (`backend/test/uji_rls.sql`, 32 lulus).
Yang belum pernah diuji adalah keduanya **bersama lewat HTTP** — itu terjadi
saat `config.js` diisi dan halaman ini dibuka pertama kali.
