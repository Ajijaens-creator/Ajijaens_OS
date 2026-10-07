# Ajijaens OS

Dua sistem yang dibangun bersama Claude, disimpan di sini supaya sumbernya tidak hilang
lagi saat lingkungan kerja sementara dibersihkan.

## `aji-jaens-os/`

**AJI JAENS OS — Life by Design.** Personal + business operating system milik Aji Jaens.
Satu berkas HTML mandiri, tanpa pustaka luar.

- 15 modul, 22 entitas, mesin entri, impor CSV/Sheets, AI Chief of Staff
- Tautan balik universal, linimasa per record, pemeriksa keutuhan tautan
- Enam papan geser (tugas, milestone, proyek, konten, isu, keputusan)
- Sinkronisasi antar perangkat + cadangan ke Google Drive

Status: **Phase 1 dan Phase 2 terkunci**, Phase 3.1 (sinkronisasi) berdiri.
Pemeriksaan terakhir: 15 rangkaian uji, 393 pemeriksaan hijau.

`dist/AJI-JAENS-OS.html` adalah hasil bangun yang sedang terbit. Berkas-berkas
sumbernya (p1…p24) hilang saat container sesi di-reclaim — yang tersisa dan
terpulihkan adalah hasil bangun ini, dan itu dinyatakan apa adanya di sini,
bukan disamarkan seolah sumbernya lengkap.

## `content-studio/`

**Jaens Content Studio.** Ruang kerja tim untuk pipeline konten — **terpisah penuh**
dari AJI JAENS OS. Hanya berisi konten dan anggota tim konten; tidak ada data keluarga,
keuangan, kesehatan, keputusan, atau kontak pribadi, bukan disembunyikan tapi memang
tidak ada datanya.

- Papan geser tujuh kolom: Ide → Draft → Menunggu review → Revisi → Terjadwal → Tayang → Dibatalkan
- Kalender tayang, daftar bersaringan, beban per anggota tim
- Linimasa per konten (siapa mengubah apa, dari nilai apa ke apa)
- Penyimpanan bersama: satu papan yang dilihat semua yang punya tautannya
- Ekspor CSV untuk dimasukkan ke AJI JAENS OS

**Batas yang perlu diketahui:** studio ini tidak punya login dan tidak punya izin per
orang. Siapa pun yang punya tautannya bisa membuka dan mengubah seluruh isinya. Nama
yang muncul di linimasa adalah yang diketik sendiri oleh tiap orang, jadi bukan bukti.
Untuk pembatasan yang sungguhan diperlukan backend dengan autentikasi.

### Membangun ulang

```bash
cd content-studio/src
python3 build.py      # menghasilkan studio.html dan JAENS-CONTENT-STUDIO.html
node test.js          # 47 pemeriksaan
```

Pengujian memakai Playwright dan menyajikan halaman lewat server HTTP lokal, supaya
jalur penyimpanan bersamanya diuji seperti keadaan sebenarnya.

## Aturan tata kelola yang berlaku di kedua sistem

- Google Drive lama **hanya baca**. SALIN — JANGAN PERNAH PINDAHKAN.
- Seluruh hal terkait Care Estate **dilindungi, tidak disentuh**.
- Fase berikutnya tidak dikerjakan sebelum fase berjalan ditinjau dan dikunci.
- Saat ragu: simpan datanya dan alihkan ke tinjauan, jangan mengambil asumsi yang merusak.
