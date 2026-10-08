#!/bin/bash
# Menjalankan seluruh pengujian aplikasi web.
# Berkas tunggal dirakit ulang lebih dulu, supaya yang diuji selalu
# berkas yang sama dengan yang diunggah.
set -e
cd "$(dirname "$0")"

python3 rakit_tunggal.py

# server lokal diperlukan: file:// tidak boleh melakukan fetch
if ! curl -s -o /dev/null http://127.0.0.1:8095/ ; then
  python3 -m http.server 8095 >/dev/null 2>&1 &
  SERVER=$!
  trap 'kill $SERVER 2>/dev/null' EXIT
  sleep 1.5
fi

GAGAL=0
jalan() {
  echo ""
  echo "=== $1 ==="
  shift
  "$@" || GAGAL=1
}

jalan "QR: dibandingkan acuan + dibaca pembaca QR sungguhan" \
  bash -c 'node test/uji-qr.js >/dev/null && python3 -I test/periksa_qr.py | tail -3'
jalan "NP-V05 CRM"                 bash -c 'node test/uji-crm.js | tail -2'
jalan "NP-V05 CRM (berkas tunggal)" bash -c 'node test/uji-tunggal.js | tail -2'
jalan "NP-V04 Portal"              bash -c 'node test/uji-portal.js | tail -2'
jalan "NP-V04 Portal (berkas tunggal)" bash -c 'node test/uji-portal-tunggal.js | tail -2'
jalan "NP-V08 Sesi & Proyektor"    bash -c 'node test/uji-sesi.js | tail -2'
jalan "NP-V08 Sesi & Proyektor (berkas tunggal)" bash -c 'TUNGGAL=1 node test/uji-sesi.js | tail -2'

echo ""
[ $GAGAL -eq 0 ] && echo ">>> SELURUH PENGUJIAN APLIKASI LULUS" || echo ">>> ADA YANG GAGAL"
exit $GAGAL
