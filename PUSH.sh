#!/bin/sh
# Dorong repo ini ke GitHub. Jalankan dari komputer yang sudah login git.
#   chmod +x PUSH.sh && ./PUSH.sh
set -e
echo "Repo harus PRIVAT lebih dulu — lihat docs/FASE.md bagian Peringatan keamanan."
printf "Repo sudah privat? (ketik: ya) "
read JAWAB
[ "$JAWAB" = "ya" ] || { echo "Dibatalkan."; exit 1; }
git remote get-url origin >/dev/null 2>&1 || \
  git remote add origin https://github.com/Ajijaens-creator/Ajijaens_OS.git
git branch -M main
git push -u origin main
echo "Selesai. Buka https://github.com/Ajijaens-creator/Ajijaens_OS"
