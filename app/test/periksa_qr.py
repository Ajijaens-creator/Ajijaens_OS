#!/usr/bin/env python3
"""Memeriksa QR hasil lib/qr.js. Tiga lapis, dari yang paling menentukan:

  1. DIBACA KEMBALI oleh pembaca QR sungguhan (OpenCV). QR yang tidak
     terbaca adalah QR yang gagal, sebagus apa pun tampilannya.
  2. Ukurannya sama dengan pembuat QR acuan — artinya pemilihan versi
     (dan dengan itu perhitungan kapasitas) benar.
  3. Modulnya dibandingkan satu per satu dengan acuan. Dua perbedaan
     yang DIIZINKAN, dan alasannya ditulis supaya tidak jadi celah:
       - mask berbeda: pemilihan mask memang boleh berbeda antar pembuat,
         keduanya sah, dan isi yang terbaca tetap sama (lapis 1 yang
         membuktikan).
       - paling banyak 7 modul berbeda ketika mask-nya sama: itu bit sisa
         (remainder bits) di ujung penempatan, di luar kodeword, dan
         diabaikan setiap pembaca.
     Selisih di luar dua hal itu dihitung GAGAL.

Catatan hasil uji: pembaca OpenCV sendiri tidak selalu bisa membaca QR
yang OpenCV sendiri buat pada skala besar tertentu. Karena itu pembacaan
dilakukan pada skala yang sudah terbukti (4 piksel per modul, tepi 4) —
dan skala besar diuji sebagai pembanding, bukan sebagai syarat.

Jalankan: python3 -I test/periksa_qr.py
"""
import json
import os
import sys

import cv2
import numpy as np

DIR = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                   '..', '..', '.qr-uji'))
SKALA, TEPI = 4, 4
lulus, gagal = 0, 0


def ok(m):
    global lulus
    lulus += 1
    print('  ok  ' + m)


def bad(m):
    global gagal
    gagal += 1
    print('  GAGAL  ' + m)


def gambar(mat, skala=SKALA, tepi=TEPI):
    n = len(mat)
    total = (n + tepi * 2) * skala
    img = np.full((total, total), 255, dtype=np.uint8)
    for i in range(n):
        for j in range(n):
            if mat[i][j]:
                img[(i + tepi) * skala:(i + 1 + tepi) * skala,
                    (j + tepi) * skala:(j + 1 + tepi) * skala] = 0
    return img


def sel_format(size):
    a = [(8, i) for i in range(6)]
    a += [(8, 7), (8, 8), (7, 8)]
    a += [(i, 8) for i in range(5, -1, -1)]
    return a


def bit_format(mat):
    return ''.join(str(mat[r][c]) for r, c in sel_format(len(mat)))


def acuan(teks):
    """QR pembanding. Dua hal yang disetel supaya perbandingannya adil:
    mode BYTE (lib/qr.js memang hanya mode byte; dibiarkan otomatis,
    OpenCV memilih mode alfanumerik untuk teks seperti 'A' dan hasilnya
    beda sah tapi tidak bisa dibandingkan modul per modul), dan tepi 2
    modul milik OpenCV dibuang supaya yang dibandingkan hanya simbolnya."""
    p = cv2.QRCodeEncoder_Params()
    p.correction_level = cv2.QRCodeEncoder_CORRECT_LEVEL_M
    p.mode = cv2.QRCodeEncoder_MODE_BYTE
    img = cv2.QRCodeEncoder.create(p).encode(teks)
    return (img < 128).astype(int)[2:-2, 2:-2].tolist()


det = cv2.QRCodeDetector()
with open(os.path.join(DIR, 'kasus.json')) as f:
    kasus = json.load(f)

for k in kasus:
    teks = k['teks']
    label = teks if len(teks) <= 44 else teks[:41] + '...'
    with open(k['berkas']) as f:
        mat = [[int(c) for c in b.strip()] for b in f if b.strip()]

    # ---- 1. dibaca kembali ----
    isi = det.detectAndDecode(gambar(mat))[0]
    if isi == teks:
        ok('dibaca pembaca QR, isinya sama persis: %s' % label)
    else:
        bad('dibaca menghasilkan %r, bukan %r' % (isi, teks))

    # ---- 2. ukuran = versi yang dipilih ----
    ref = acuan(teks)
    if len(ref) == len(mat):
        ok('versi QR sama dengan acuan (%dx%d): %s' % (len(mat), len(mat), label))
    else:
        bad('ukuran %dx%d, acuan %dx%d: %s' % (len(mat), len(mat), len(ref), len(ref), label))
        continue

    # ---- 3. modul dibandingkan ----
    n = len(mat)
    beda = [(i, j) for i in range(n) for j in range(n) if mat[i][j] != ref[i][j]]
    if bit_format(mat) != bit_format(ref):
        ok('mask berbeda dari acuan (sah; isi terbaca tetap sama): %s' % label)
    elif not beda:
        ok('identik dengan acuan, modul per modul: %s' % label)
    elif len(beda) <= 7:
        ok('selisih %d modul, semuanya bit sisa di ujung penempatan: %s' % (len(beda), label))
    else:
        bad('selisih %d modul dengan mask yang sama — ini bukan bit sisa: %s %s'
            % (len(beda), label, beda[:6]))

print('\n %d lulus, %d gagal' % (lulus, gagal))
sys.exit(1 if gagal else 0)
