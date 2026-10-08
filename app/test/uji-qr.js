/* =====================================================================
   Pengujian QR: matriks yang dihasilkan lib/qr.js dibandingkan dengan
   pembuat QR acuan (OpenCV), lalu DIBACA KEMBALI oleh pembaca QR
   sungguhan. QR yang tidak bisa dibaca adalah QR yang gagal, sekalipun
   gambarnya tampak benar.
   ===================================================================== */
const fs = require('fs');
const path = require('path');
require(path.join(__dirname, '..', 'lib', 'qr.js'));

const KASUS = [
  'https://os.ajijaens.com/portal/?sesi=UJI-2',
  'https://os.ajijaens.com/portal/?sesi=LBD-2026-11-01',
  'https://os.ajijaens.com/portal/?sesi=3f1c9a62-7b44-4e1d-9f0a-2c5d8e7a1b33',
  'https://ajijaens-creator.github.io/Ajijaens_OS/app/portal/?sesi=UJI-2',
  'A',
  'Life by Design — Aji Jaens · sesi Ubud'   /* bukan ASCII, uji UTF-8 */
];

const keluar = path.join(__dirname, '..', '..', '.qr-uji');
fs.mkdirSync(keluar, { recursive: true });

const hasil = KASUS.map((t, i) => {
  const m = global.AJIQR.matriks(t);
  const nama = path.join(keluar, 'kasus' + i + '.txt');
  fs.writeFileSync(nama, m.map(r => r.join('')).join('\n'));
  fs.writeFileSync(path.join(keluar, 'kasus' + i + '.svg'), global.AJIQR.svg(t));
  return { teks: t, ukuran: m.length, berkas: nama };
});
fs.writeFileSync(path.join(keluar, 'kasus.json'), JSON.stringify(hasil, null, 1));
console.log('matriks ditulis: ' + hasil.map(h => h.ukuran + 'x' + h.ukuran).join(', '));
