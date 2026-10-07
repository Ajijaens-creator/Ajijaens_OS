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

### Catatan tentang sumbernya

Berkas sumber asli hilang saat container sesi dibersihkan. Modul di `src/` adalah
hasil **pemulihan dari berkas terbangun**, dipecah di batas spanduk komentar tiap modul.

Pemulihan itu bukan perkiraan: `build.py` menyusun ulang ke-22 modul dan hasilnya
**identik bita-per-bita** dengan halaman yang sedang terbit (SHA-256 `133d0d4b593b598f…`,
703.801 karakter). Jadi `src/` benar-benar membangun `dist/`, bukan mendekatinya.

Yang tidak pulih: nama berkas asli hanya sebagian yang pasti, dan komentar antar-modul
yang berada di luar spanduk ikut masuk ke modul sebelumnya. Keduanya tidak memengaruhi
hasil bangun.

```bash
cd aji-jaens-os && python3 build.py   # menghasilkan dist/AJI-JAENS-OS.html + versi mandiri
```

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

---

## Hosting di domain sendiri (GitHub Pages)

Repo ini sudah siap disajikan apa adanya sebagai situs statis:

```
index.html      halaman depan — memilih antara dua aplikasi
os/index.html   AJI JAENS OS
studio/index.html   Jaens Content Studio
.nojekyll       supaya GitHub Pages menyajikan berkas apa adanya
```

### Langkah

1. Dorong repo ini ke GitHub.
2. **Settings → Pages → Source: Deploy from a branch → `main` / `/ (root)`**.
   Beberapa menit kemudian situsnya hidup di `https://ajijaens-creator.github.io/Ajijaens_OS/`.
3. Untuk domain sendiri: di **Settings → Pages → Custom domain** isikan domainnya
   (misalnya `os.namadomain.com`), lalu di penyedia DNS tambahkan rekaman `CNAME`
   dari subdomain itu ke `ajijaens-creator.github.io`. GitHub akan membuat berkas
   `CNAME` di repo dan menerbitkan sertifikat HTTPS sendiri.

### Yang HILANG saat disajikan dari domain sendiri

Ini bukan kekurangan yang bisa ditambal dengan pengaturan — ini perbedaan mendasar:

| | Tautan Claude | Domain sendiri |
|---|---|---|
| Entri, papan geser, kalender, ekspor | ✅ | ✅ |
| Sinkronisasi antar perangkat | ✅ | ❌ |
| Satu papan yang dilihat seluruh tim | ✅ | ❌ |
| Cadangan ke Google Drive | ✅ | ❌ |

Sinkronisasi di Phase 3.1 bersandar pada kemampuan yang hanya diberikan oleh penampil
Claude kepada halamannya. Di hosting statis biasa kemampuan itu tidak ada, jadi data
kembali hidup di peramban masing-masing. Kedua aplikasi mendeteksi ini sendiri dan
menyatakannya di sudut layar: **"Hanya di perangkat ini"** — bukan berpura-pura tersinkron.

**Dua tautan berarti dua kumpulan data.** Konten yang dientri di salinan domain tidak
akan muncul di salinan Claude, dan sebaliknya. Pilih satu sebagai tempat kerja utama.

Untuk mendapatkan domain sendiri **dan** sinkronisasi sekaligus, diperlukan backend
sungguhan (misalnya Supabase) — itu juga satu-satunya jalan ke izin per orang yang
sebenarnya, yang dibutuhkan kalau tim hanya boleh membuka Content Studio.
