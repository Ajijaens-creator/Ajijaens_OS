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
| `migrations/0001_schema.sql` | 26 tabel: orang, akun, usaha, sesi, aktivitas, Life Circle, CRM |
| `migrations/0002_pdp.sql` | Persetujuan, hak subjek data, catatan kebocoran, audit — PP 33/2026 |
| `migrations/0003_rls.sql` | 57 kebijakan izin tingkat baris + dua view terbatas |
| `migrations/0004_grants.sql` | Hak akses schema untuk Supabase + pemeriksaan "tidak ada tabel tanpa RLS" |
| `test/shim_lokal.sql` | **Hanya untuk uji lokal.** Jangan dijalankan di Supabase |
| `test/uji_rls.sql` | 32 pengujian izin dan PDP |

Ketiga migrasi **dapat dijalankan ulang tanpa duplikasi** — sudah diuji tiga
kali berturut-turut pada basis data yang sudah terisi.

---

## Hasil pengujian

**32 lulus, 0 gagal.** Dijalankan sebagai peran `authenticated` biasa, bukan
superuser — jadi kebijakannya benar-benar berlaku.

Tiga jalur kegagalan pemasangan juga diuji dan ketiganya berhenti dengan
pesan yang jelas: `0003` dilewati → `0004` menolak dan menyebut tabel mana
yang telanjang; `auth.uid()` tidak ada → `0003` berhenti sebelum membuat satu
tabel pun tanpa pembatasan; satu tabel RLS-nya dimatikan → pemeriksaan
menangkapnya.

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

**Buat PROYEK BARU, bukan menumpang proyek yang sudah ada.** Alasannya di
bagian berikutnya.

1. **New project** di organisasi Anda. Region: **Singapore** (terdekat).
   Simpan kata sandi basis datanya — tidak bisa dilihat lagi nanti.
2. **SQL Editor** → tempel dan Run, **satu per satu, sesuai urutan nomor**:
   `0001_schema.sql` → `0002_pdp.sql` → `0003_rls.sql` → `0004_grants.sql`.
   Setelah `0003` dan `0004` Anda akan melihat pemberitahuan
   *"RLS aktif di seluruh tabel ajios"*. Kalau tidak muncul, berhenti dan
   baca errornya — jangan lanjut.
3. **Settings → API → Exposed schemas** → tambahkan `ajios`.
   **Tanpa langkah ini aplikasi tidak bisa membaca apa pun**, walau seluruh
   migrasi berhasil. Ini kesalahan pemasangan yang paling sering terjadi.
4. **JANGAN** menjalankan `test/shim_lokal.sql` di Supabase. Itu tiruan untuk
   uji lokal; di Supabase ia menimpa `auth.uid()` yang asli dan membuka celah.
5. **Authentication → Providers** → nyalakan Email OTP, dan Phone bila mau
   memakai WhatsApp/SMS.
6. **Jadikan diri Anda admin.** Daftar lewat aplikasi sekali, lalu di SQL Editor:
   ```sql
   insert into ajios.staff (auth_user_id, peran)
   select id, 'admin' from auth.users where email = 'EMAIL-ANDA'
   on conflict (auth_user_id) do update set peran = 'admin';
   ```
7. **Periksa sendiri.** Table Editor → keduapuluh enam tabel harus punya lencana
   **RLS enabled**. Satu tabel tanpa lencana adalah pintu terbuka.

### Kenapa proyek terpisah, bukan menumpang proyek lain

Satu proyek Supabase punya **satu kolam akun** (`auth.users`). Kalau peserta
workshop dan pelanggan usaha lain berada di kolam yang sama, satu celah
kebijakan di salah satu sisi bisa menjangkau sisi lain. Selain itu:

- Pencadangan dan pemulihan jadi satu paket — tidak bisa memulihkan satu
  tanpa menyentuh yang lain.
- PP 33/2026 menuntut dasar pemrosesan **per tujuan**; dua tujuan berbeda
  lebih bersih kalau datanya memang terpisah.
- Kalau satu proyek harus dihentikan sementara karena insiden, yang lain
  tetap jalan.

Schema-nya memang bernama `ajios`, jadi secara teknis tidak akan bentrok
dengan tabel proyek lain. Tapi pemisahan di sini soal batas tanggung jawab,
bukan soal nama tabel.

**Satu catatan pada paket gratis:** satu organisasi hanya boleh punya
**2 proyek aktif**. Kalau proyek lain sudah memakai satu slot, proyek ini
mengisi yang kedua — pas, tetapi tidak ada ruang lagi setelahnya.

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

---

## Status pemasangan

**Terpasang di Supabase 8 Oktober 2026** — proyek `Ajijaens-OS`, region Singapore,
organisasi berpaket Pro (tidak ada jeda otomatis, tidak ada batas 2 proyek).

`periksa.sql` dijalankan di server sungguhan, hasilnya **SEMUA BENAR** —
dan tujuh angkanya sama persis dengan hasil uji lokal:

| Pemeriksaan | Hasil | Diharapkan |
|---|---|---|
| Tabel di schema ajios | 26 | 26 |
| Tabel dengan RLS aktif | 26 | 26 |
| Kebijakan izin terpasang | 57 | 57 |
| Hak akses untuk authenticated | 120 | ada |
| Tujuan persetujuan terisi | 4 | 4 |
| Fungsi penolong izin | 5 | 5 |
| auth.uid() tersedia | 1 | 1 |

Perimeter API diperiksa dari luar: `GET /rest/v1/person` tanpa kunci
mengembalikan **401** — endpoint hidup, permintaan tanpa kunci ditolak.

**Yang masih belum diperiksa:** perilaku RLS lewat API dengan kunci anon yang
sah — yaitu membuktikan bahwa pengunjung tanpa login benar-benar mendapat nol
baris, bukan sekadar ditolak di pintu. Pengujian itu menunggu halaman pertama
dibangun, karena halaman itu memang membawa kunci anon-nya sendiri.
