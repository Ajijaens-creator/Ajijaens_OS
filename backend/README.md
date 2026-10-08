# NP-V00 — Fondasi Backend AJI JAENS OS

Fondasi yang dibutuhkan **NP-V04 (Portal Peserta)**, **NP-V05 (CRM)**,
**NP-V08 (Kendali Sesi)**, dan **NP-V09 (Evaluasi)**. Tanpa ini, keempatnya
tidak bisa dibangun tanpa melanggar Aturan 5 Pack.

Dibuat 8 Oktober 2026. Diuji pada PostgreSQL 16.15 — versi mayor yang sama
dengan Supabase.

---

## Apa yang ada di sini

| Berkas | Isi |
|---|---|
| `migrations/0001_schema.sql` | 27 tabel: orang, akun, usaha, sesi, aktivitas, Life Circle, CRM |
| `migrations/0002_pdp.sql` | Persetujuan, hak subjek data, catatan kebocoran, audit — PP 33/2026 |
| `migrations/0003_rls.sql` | 57 kebijakan izin tingkat baris + dua view terbatas |
| `test/shim_lokal.sql` | **Hanya untuk uji lokal.** Jangan dijalankan di Supabase |
| `test/uji_rls.sql` | 32 pengujian izin dan PDP |

Ketiga migrasi **dapat dijalankan ulang tanpa duplikasi** — sudah diuji tiga
kali berturut-turut pada basis data yang sudah terisi.

---

## Hasil pengujian

**32 lulus, 0 gagal.** Dijalankan sebagai peran `authenticated` biasa, bukan
superuser — jadi kebijakannya benar-benar berlaku.

Yang dibuktikan, bukan diklaim:

**Peserta A tidak bisa membaca apa pun milik peserta B** — Life Circle, action
plan, feedback, data usaha, bahkan keberadaan B di tabel orang. Percobaan
menulis ke action plan B mengubah **0 baris**: ditolak basis data, bukan
disembunyikan antarmuka.

**Fasilitator melihat daftar hadir, bukan isi kepala peserta.** Roster dan
progres agregat terbaca; Life Circle, feedback perorangan, action plan, dan
omzet mengembalikan **0 baris** — untuk fasilitator yang sah sekalipun.

**Nol dan kosong dibedakan.** Skor Life Circle `0` tersimpan sebagai jawaban
sah; aspek yang belum dijawab tetap `NULL`.

**Persetujuan adalah histori, bukan saklar.** Diberikan → dicabut → ketiga
barisnya tetap ada dan bisa dibuktikan. `boleh_promosi()` membaca yang
terakhir dan langsung berubah saat dicabut.

**Penghapusan tidak menghapus buktinya.** `hapus_data_pribadi()` mengosongkan
data pribadi tetapi **mempertahankan** catatan persetujuan dan jejak audit —
justru itu bukti bahwa penghapusannya sah.

**Batas 3×24 jam dihitung mesin.** Kebocoran yang lewat tenggat muncul sendiri
di `breach_terlambat`.

### Dua kesalahan yang ditemukan pengujian

Keduanya nyata, keduanya sudah diperbaiki:

1. **Urutan persetujuan tidak pasti.** Dua perubahan pada detik yang sama bisa
   terbaca terbalik — artinya persetujuan yang sudah dicabut bisa terbaca masih
   berlaku. Diperbaiki dengan kolom urutan yang tidak bisa seri.
2. **Batas lapor kebocoran** ditulis sebagai kolom terhitung; Postgres
   menolaknya karena bergantung zona waktu. Diganti trigger.

---

## Cara memasangnya di Supabase

Perlu komputer dengan peramban. Sekitar 20 menit.

1. **Buat proyek** di `supabase.com` → New project. Pilih region terdekat
   (Singapore). Simpan kata sandi basis datanya.
2. **SQL Editor** → tempel isi `migrations/0001_schema.sql` → Run.
3. Ulangi untuk `0002_pdp.sql`, lalu `0003_rls.sql`. **Urutannya wajib.**
   Jangan menjalankan `test/shim_lokal.sql` — di Supabase, `auth.uid()` dan
   peran `authenticated` sudah ada, dan menimpanya membuka celah.
4. **Authentication → Providers** → nyalakan Email OTP dan/atau Phone.
5. **Jadikan diri Anda admin.** Daftar lewat aplikasi sekali, lalu di SQL Editor:
   ```sql
   insert into ajios.staff (auth_user_id, peran)
   select id, 'admin' from auth.users where email = 'EMAIL-ANDA';
   ```
6. **Periksa.** Database → pastikan ketiga puluh tabel punya lencana "RLS enabled".
   Satu tabel tanpa lencana itu adalah pintu terbuka.

### Biaya

Paket gratis cukup untuk workshop 48–60 orang: 500 MB basis data, 50.000
pengguna aktif/bulan, 1 GB berkas.

**Satu catatan penting:** proyek gratis **dijeda otomatis setelah menganggur
seminggu** dan harus dinyalakan manual dari dasbor. Untuk sesi terjadwal itu
risiko nyata. Paket Pro $25/bulan menghilangkan jeda itu.

---

## Yang masih terbuka — jangan dianggap selesai

**Belum diuji di Supabase sungguhan.** Diuji di PostgreSQL 16 lokal dengan
tiruan `auth.uid()` yang berperilaku sama. Perbedaan perilaku di Supabase
mungkin ada dan harus diperiksa ulang setelah dipasang.

**Belum ada aplikasinya.** Ini basis data dan aturan izinnya. Portal peserta,
layar sesi, dan CRM adalah NP-V04, V05, V08, V09.

**Transfer data ke luar negeri.** Server Supabase ada di luar Indonesia. PP
33/2026 Pasal 160–166 mensyaratkan perlindungan setara atau persetujuan subjek
data. Perlu dipastikan penasihat hukum, bukan oleh dokumen ini.

**Status "data spesifik" Wellbeing Life Circle belum pasti.** Kalau termasuk,
penilaian dampak wajib dan mungkin perlu menunjuk Pejabat Pelindungan Data.
Sampai itu jelas, perlakukan sebagai data spesifik.

**Belum ada penilaian dampak dan kanal permohonan yang menghadap peserta.**
Tabelnya ada; halaman dan prosedurnya belum.

**Sistem ini belum siap produksi.** Akses multiuser belum pernah diuji dengan
pengguna sungguhan di server sungguhan.
