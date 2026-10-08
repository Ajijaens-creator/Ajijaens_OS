#!/bin/bash
# Merakit pasang_semua.sql dari berkas migrasi.
# Dijalankan ulang setiap kali ada migrasi baru, supaya berkas tempel-sekali
# tidak pernah ketinggalan dari isi folder migrations/.
set -e
cd "$(dirname "$0")"

OUT=pasang_semua.sql
URUT="0001_schema.sql 0002_pdp.sql 0003_rls.sql 0004_grants.sql 0005_progres.sql"
JML=$(echo $URUT | wc -w)

{
cat <<HEAD
-- =====================================================================
-- PASANG SEMUA — AJI JAENS OS, fondasi backend (NP-V00)
--
-- Satu berkas, satu kali tempel, satu kali Run.
-- Dibungkus transaksi: kalau ada satu saja yang gagal, SELURUHNYA
-- dibatalkan dan basis data kembali seperti semula. Tidak ada keadaan
-- setengah jadi — dan keadaan setengah jadi itulah yang berbahaya,
-- karena tabel bisa berdiri tanpa pembatasan akses.
--
-- Berkas ini DIRAKIT oleh rakit.sh dari folder migrations/. Jangan diedit
-- langsung: suntingan di sini akan hilang pada perakitan berikutnya.
--
-- Setelah ini berhasil, jalankan periksa.sql di query terpisah.
-- =====================================================================
BEGIN;

HEAD

for f in $URUT; do
  printf '\n-- ################################################################\n'
  printf -- '-- ###  BAGIAN: %s\n' "$f"
  printf -- '-- ################################################################\n\n'
  cat "migrations/$f"
done

cat <<FOOT

COMMIT;

-- Kalau Anda sampai di sini tanpa pesan merah, $JML bagian masuk utuh.
-- Langkah berikutnya: jalankan periksa.sql.
FOOT
} > "$OUT"

# Berkas tambahan untuk basis data yang SUDAH terpasang 0001-0004.
{
cat <<HEAD2
-- =====================================================================
-- TAMBAHAN 0005 — untuk basis data yang sudah memakai pasang_semua.sql
-- versi empat bagian (0001-0004).
--
-- Aman dijalankan ulang. Tidak menghapus data apa pun.
-- Kalau basis data Anda masih kosong, pakai pasang_semua.sql saja —
-- berkas itu sudah memuat bagian ini.
-- =====================================================================
BEGIN;

HEAD2
cat migrations/0005_progres.sql
printf '\nCOMMIT;\n'
} > pasang_tambahan_0005.sql

echo "pasang_semua.sql dirakit dari $JML migrasi ($(wc -c < "$OUT") bita)"
echo "pasang_tambahan_0005.sql ($(wc -c < pasang_tambahan_0005.sql) bita)"
