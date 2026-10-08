#!/bin/bash
# Merakit artefak lalu menjalankan seluruh pengujiannya.
# Pemakaian: ./jalankan_uji.sh
set -e
cd "$(dirname "$0")"

python3 build.py

# Pengujian memuat halaman lewat HTTP: file:// tidak boleh fetch,
# dan localStorage pada file:// berperilaku lain.
if ! curl -s -o /dev/null http://127.0.0.1:8096/ ; then
  (cd dist && python3 -m http.server 8096 >/dev/null 2>&1 &)
  SERVER=$!
  sleep 1.5
fi

TOTAL=0
GAGAL=0
for t in testnp01.js testnp02.js testnp0607.js testnp03.js; do
  echo ""
  echo "=== $t ==="
  HASIL=$(node "$t" 2>&1 | tail -1) || GAGAL=1
  echo "$HASIL"
  N=$(echo "$HASIL" | grep -oE '^[0-9]+' || echo 0)
  TOTAL=$((TOTAL + N))
  echo "$HASIL" | grep -q ", 0 gagal" || GAGAL=1
done

echo ""
echo "Artefak OS: $TOTAL pengujian"
[ $GAGAL -eq 0 ] && echo ">>> SELURUH PENGUJIAN ARTEFAK LULUS" || echo ">>> ADA YANG GAGAL"
exit $GAGAL
