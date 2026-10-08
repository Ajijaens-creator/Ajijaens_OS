# STATUS FASE — AJI JAENS OS

Dokumen ini adalah **papan status**, bukan roadmap. Roadmapnya satu, dan ada
di Google Drive: `2026-08-26__SISTEM__MASTER-TRANSFER-PACK__v1.0__LOCKED`
(folder `00 — SYSTEM & GOVERNANCE`). Dokumen ini hanya mencatat apa yang
sudah berdiri terhadap roadmap itu.

Terakhir diperbarui: **7 Oktober 2026**

---

## Peringatan yang harus dibaca lebih dulu

Aplikasi memuat dua penomoran "Phase" yang **tidak cocok** dengan roadmap resmi:

1. Tabel `DB.phases` di dalam aplikasi — Phase 1–7 berdasarkan *kelompok menu
   sidebar*, bukan fase roadmap. Kebetulan sama-sama tujuh, dan kebetulan itu
   menyesatkan.
2. Catatan kunci `PHASE1` / `PHASE2` — definisi **buatan Claude**, bukan
   Master Transfer Pack, dan **tidak pernah disetujui Aji**.

Label-label itu belum diperbaiki karena menunggu keputusan Aji (lihat
"Keputusan yang menunggu" di bawah). Sampai itu diputuskan:

> **"Phase 2 terkunci" di aplikasi TIDAK sama dengan Fase 2 roadmap selesai.**

Rincian lengkap: `docs/LAPORAN-PEMERIKSAAN-AJI-JAENS-OS-2026-10-07.txt`

---

## Roadmap resmi — 7 fase, 18 master prompt

| Fase | Master Prompt | Status |
|---|---|---|
| **1 — CORE FOUNDATION** | 1A Master System Architecture | Terimplementasi, belum terverifikasi independen |
| | 1B Google Drive Data Foundation | **Berfungsi dan terverifikasi** |
| | 1C Aji Core Intelligence | Sebagian — 2 dari 6 sesi |
| **2 — PERSONAL OFFICE** | 4 Personal Office | Belum ditemukan |
| | 5 OS Admin Team | Belum ditemukan |
| | 6 Roles, Permissions & Privacy | Rancangan saja |
| **3 — MEMORY & ACTION** | 7 Unified Memory & Knowledge Graph | Sebagian |
| | 8 Conversation Intelligence | Belum ditemukan |
| | 9 Meeting & Decision Intelligence | Sebagian |
| | 10 Task, Priority & Commitment Engine | Terimplementasi, belum terverifikasi |
| **4 — FAMILY OS** | 11 Aji Family OS | Sebagian (dasar) |
| | 12 Child Growth & Parenting | Belum ditemukan |
| | 13 Family Safety & Digital Wellbeing | Belum ditemukan |
| **5 — ASSET OS** | 14 Personal & Family Asset Registry | Sebagian (registri dasar) |
| | 15 Vehicle, Maintenance & QR | Belum ditemukan |
| **6 — KNOWLEDGE & BRAND** | 16 Learning & Personal Knowledge Engine | Sebagian — tanpa Learn/Do/Share |
| | 17 Personal Narrative & Branding Engine | Sebagian |
| **7 — AI COMMAND CENTER** | 18 AI Chief of Staff & Multi-Agent | Sebagian — satu agen, bukan multi-agen |

Arti status: **Belum ditemukan** · **Rancangan saja** · **Tampilan/demo saja** ·
**Sebagian terimplementasi** · **Terimplementasi, belum terverifikasi** ·
**Berfungsi dan terverifikasi**

---

## Yang benar-benar sudah dibangun

Diurutkan menurut pekerjaannya, bukan menurut label "Phase":

**Fondasi data**
- 22 entitas dengan skema, validasi wajib-isi, dan relasi antar entitas
- ID global (`PER-000001`), 12 kolom metadata universal, 9 tingkat privasi
- Klasifikasi data: SOURCE_REFERENCE · DUMMY · LIVE · HISTORICAL · ARCHIVED
- Kontrol data contoh: tampilkan · sembunyikan · hapus lunak, bergerbang `DELETE DUMMY`

**Alat kerja**
- 15 modul sidebar + Dashboard, semuanya membaca record asli
- Mesin entri: buat · ubah · arsipkan · pulihkan · ekspor CSV
- Impor dari CSV/Google Sheets: pemetaan kolom, validasi per baris, pembatalan impor
- My Day sebagai halaman kerja harian

**Keterhubungan**
- Tautan balik universal — dibaca otomatis dari skema, dua arah
- Linimasa per record — kolom apa berubah, dari nilai apa ke apa
- Pemeriksa keutuhan tautan — putus, salah tipe, menunjuk arsip
- Enam papan geser (tugas, milestone, proyek, konten, isu, keputusan)
  dengan tiga jalur setara: tetikus, sentuh tahan-dulu, papan ketik penuh

**Penyimpanan**
- Sinkronisasi antar perangkat lewat berkas data milik halaman
- Cadangan bertanggal ke Google Drive folder `96 — LIVE DATA`
- Dua versi berbeda tidak pernah digabung diam-diam — pemilik yang memutuskan

**Kecerdasan**
- AI Chief of Staff membaca 17 sumber data, memisahkan `FACT` dari `AI_INFERENCE`

**Ruang kerja tim** (`content-studio/`, aplikasi terpisah)
- Pipeline konten tujuh kolom, kalender tayang, beban per anggota, linimasa
- Tidak memuat satu pun data pribadi — bukan disembunyikan, memang tidak ada

---

## Paket NP — keadaan per 8 Oktober 2026

Daftar ini **bukan** pernyataan bahwa Fase 6 selesai. Satu paket selesai
berarti satu paket selesai. Kolom "Teruji" hanya diisi kalau ada rangkaian
pengujian yang benar-benar dijalankan dan hasilnya tercatat.

| Paket | Terimplementasi | Teruji | Kekurangan | Ketergantungan |
|---|---|---|---|---|
| **NP-01** Knowledge: Learn, Do & Share | Ya — artefak OS v21 | 18 pengujian | Bank bahan belum punya penelusuran penuh | artefak OS |
| **NP-V02** Share: Bank Bahan, Modul & Program | Ya — artefak OS v22 | 14 pengujian | Tanpa editor slide (memang di luar lingkup) | NP-01 |
| **NP-V00** Fondasi backend | Ya — 26 tabel, 57 kebijakan RLS, PDP PP 33/2026 | 36 pengujian di PostgreSQL 16.15 | — | Supabase |
| **NP-V04** Portal Peserta | Ya — `app/portal/` | 25 pengujian | Belum pernah diuji bersama RLS lewat HTTP | NP-V00, anon key |
| **NP-V05** Database Peserta, CRM & Funnel | Ya — `app/admin/crm.html` | 16 + 16 pengujian | Belum ada kirim WhatsApp/email (memang pencatatan saja) | NP-V00 |
| **NP-V08** Sesi & Kendali Fasilitator | Ya — `app/sesi/` + layar proyektor | 41 + 41 pengujian, QR 18 pengujian | QR belum dipindai dengan ponsel sungguhan oleh manusia | NP-V00, alamat tetap |
| **NP-V03** Slide Studio | Belum | — | — | NP-V02 |
| **NP-V06** Learn | Belum | — | — | NP-01 |
| **NP-V07** Do | Belum | — | — | NP-01 |
| **NP-V09** Evaluasi & Tindak Lanjut | Belum | — | — | NP-V04, NP-V08 |

Yang **tidak** boleh disimpulkan dari tabel ini: bahwa sistemnya siap
produksi. Akses multiuser, penyimpanan, dan alur peserta belum pernah diuji
bersama lewat HTTP terhadap Supabase sungguhan — hanya terhadap tiruan klien
dan terhadap PostgreSQL lokal, terpisah.

### Satu kesalahan yang ditemukan pengujian, dan cara memperbaikinya

Kebijakan RLS membuat `activity_response` hanya terbaca pemiliknya — itu
benar, fasilitator memang tidak boleh membaca jawaban perorangan. Tetapi
akibatnya hitungan `count(distinct person_id)` yang dijalankan fasilitator
selalu menghasilkan **0**, dan layar kendali akan menuliskan
"0 dari 12 peserta hadir sudah mengirim": sebuah pernyataan salah yang
terlihat seperti data.

Diperbaiki di `backend/migrations/0005_progres.sql` dengan satu fungsi
SECURITY DEFINER yang mengembalikan **hanya cacahnya**, dan `NULL` — bukan
nol — bagi yang tidak berhak menghitung. Antarmuka menuliskan NULL sebagai
"belum bisa dihitung di sini", dan **tidak menggambar batang progres** untuk
angka yang tidak diketahui, karena batang kosong terbaca sebagai nol.

Basis data yang sudah memakai `pasang_semua.sql` versi empat bagian cukup
menjalankan `backend/pasang_tambahan_0005.sql` sekali.

---

## Batas yang diakui, bukan ditutupi

| Hal | Keadaan |
|---|---|
| **Izin per orang** | Tidak ada. `privacy_level` tersimpan tapi **tidak ditegakkan**. Melanggar Aturan 5 Pack ("privacy ditegakkan di backend"). |
| **Autentikasi** | Tidak ada. Tidak ada pengguna, peran, atau login. |
| **Angka pemeriksaan** | Klaim dokumentasi. Log pengujian sesi-sesi lama hilang saat lingkungan kerja dibersihkan. |
| **Salinan di hosting statis** | Tidak tersinkron antar perangkat — kemampuan itu hanya ada di penampil Claude. |
| **Sesi 1C 3–6** | Belum dijalankan: Gaya Komunikasi · Hierarki Goal · Filosofi Keluarga & Keuangan · Narasi Personal |

---

## Peringatan keamanan — baca sebelum mengubah visibilitas repo

`aji-jaens-os/dist/` dan `os/index.html` memuat **data nyata yang tertanam di
dalam kode**, bukan di penyimpanan peramban:

- Keuangan grup Jan–Jul 2026 (revenue, laba, margin, kas, ekuitas per unit)
- Jumlah karyawan per unit
- Penilaian internal per unit
- Relasi bernama beserta skor kedekatan dan kapan terakhir dihubungi
- Nama dan tanggal lahir anggota keluarga

Angka keuangan diklasifikasikan `SOURCE_REFERENCE` oleh Pack — **data nyata,
bukan contoh.**

**Repo ini harus PRIVAT.** Dan repo privat hanya melindungi sumbernya: kalau
situsnya disajikan ke domain publik, isi yang sama terbaca siapa pun yang tahu
alamatnya. Untuk itu diperlukan dinding akses di depan `/os`, atau angka
nyatanya dibersihkan dari salinan hosting.

`content-studio/` dan `studio/` tidak terkena peringatan ini.

---

## TEMUAN TERBUKA — paparan data di repo publik

**Tanggal temuan: 8 Oktober 2026, 01:45. Status: DIBIARKAN atas keputusan Aji.**

Berkas `Ajijaens_OS-repo.tar.gz` (2,6 MB, commit `7af5db0`, 08 Okt 01:11) ada
di repo **publik** `Ajijaens-creator/Ajijaens_OS`. Isinya seluruh repo privat
termasuk direktori `.git`-nya.

Dibuktikan, bukan diduga: `git clone` anonim tanpa login berhasil; arsip
diekstrak dan dipindai dengan `public-copy/verify.sh` — **puluhan pola data
nyata ditemukan**, termasuk `equity:17.461` di `aji-jaens-os/src/p3_data.js`.

Yang terpapar: keuangan grup Jan–Jul 2026 per unit dan konsolidasi, jumlah
karyawan, penilaian internal, nama relasi dengan skor kedekatan dan tanggal
kontak terakhir, nama dan tanggal lahir anggota keluarga, serta laporan
pemeriksaan internal.

Tidak terpapar: kredensial. Dipindai untuk token GitHub, kunci API, AWS,
Slack, dan private key — **tidak ada**. Tidak ada yang perlu dirotasi.

Catatan penting: menghapus berkasnya saja **tidak menyelesaikan**. Commit
`7af5db0` tetap menyimpannya, dan di repo publik riwayat terbuka bagi siapa
pun. Penyelesaian tuntas butuh salah satu dari: repo dihapus dan dibuat ulang,
atau riwayat ditulis ulang dari komputer.

Pintu keluar termurah dan bisa dibalik: Settings → Change visibility →
Private. Berhenti dalam hitungan detik; Pages mati selama privat.

Tiga berkas hosting (`index.html`, `os.html`, `studio.html`) **tidak** terkena
temuan ini — terverifikasi 0 dari 171 pola, dicek pada berkas yang benar-benar
ada di GitHub, bukan pada salinan lokal.

---

## Keputusan yang menunggu Aji

1. Rencana "5 fase" buatan Claude: **dicabut**, **diturunkan derajatnya**
   menjadi tahap implementasi teknis di dalam Fase 1 Pack, atau **disahkan**
   sebagai revisi resmi? (Saran: diturunkan derajatnya.)
2. Label kunci di aplikasi diganti jadi "Tahap Teknis 1 / 2"?
3. Dokumen "PETA JALAN 5 FASE" dipindah ke `99 — OS ARCHIVE`?
4. Knowledge = Learn / Do / Share → masuk Fase 6 (prompt 16 & 17).
   Portal peserta + QR bergantung pada Fase 2 (autentikasi) yang belum ada.
   Dikerjakan sesuai urutan Pack, atau didahulukan?

---

## Cara memperbarui dokumen ini

Perbarui setiap kali sebuah pekerjaan selesai. Aturannya:

- Status hanya naik bila ada **bukti**, bukan bila terasa selesai.
- Bedakan bukti: percakapan · dokumentasi · kode · pengujian langsung.
- "Live", "Locked", dan jumlah pemeriksaan tetap ditulis sebagai **klaim
  dokumentasi** sampai log pendukungnya ada.
- Fase berikutnya tidak dikerjakan sebelum fase berjalan ditinjau dan dikunci
  (Aturan 14 Pack). Perintah lanjut dari Aji: **NEXT FASE**.
