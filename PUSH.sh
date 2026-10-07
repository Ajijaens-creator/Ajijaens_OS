#!/bin/sh
# Dorong seluruh proyek ke GitHub, menggantikan arsip yang sekarang ada di sana.
# Jalankan dari dalam folder "repo" hasil ekstrak.
set -e

echo
echo "Ini akan MENGGANTI isi repo GitHub dengan 49 berkas proyek."
echo "Commit lama (\"Add files via upload\" berisi .tar.gz) akan hilang."
echo
echo "PENTING: repo harus PRIVAT. Isinya memuat keuangan grup dan data keluarga."
printf "Repo sudah privat? ketik ya lalu Enter: "
read JAWAB
[ "$JAWAB" = "ya" ] || { echo "Dibatalkan. Jadikan privat dulu di Settings > Danger Zone."; exit 1; }

git remote get-url origin >/dev/null 2>&1 || \
  git remote add origin https://github.com/Ajijaens-creator/Ajijaens_OS.git
git branch -M main
git push -u origin main --force

echo
echo "SELESAI. Buka https://github.com/Ajijaens-creator/Ajijaens_OS"
echo "Sekarang berisi 49 berkas, bukan satu arsip."
