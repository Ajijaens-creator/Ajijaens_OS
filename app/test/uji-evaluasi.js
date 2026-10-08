/* =====================================================================
   NP-V09 — pengujian Evaluasi & Tindak Lanjut.

   Yang diuji di sini terutama hal-hal yang MUDAH dilanggar tanpa
   kelihatan: nol respons jadi rata-rata nol, batang progres kosong yang
   terbaca sebagai nol, "belum mengisi" yang berubah jadi "gagal",
   "dilaporkan selesai" yang dilaporkan sebagai terverifikasi, klik
   Spotify yang dihitung sebagai pendengar, dan wellbeing yang ditampilkan
   sebagai peringkat.
   ===================================================================== */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const TUNGGAL = !!process.env.TUNGGAL;
const DASAR = 'http://127.0.0.1:8095/test/';
const H_EV = TUNGGAL ? 'evaluasi-tunggal-uji.html' : 'evaluasi-uji.html';
const H_PORTAL = TUNGGAL ? 'portal-tunggal-uji.html' : 'portal-uji.html';
let pass = 0, fail = 0;
const ok  = m => { pass++; console.log('  ok  ' + m); };
const bad = m => { fail++; console.log('  GAGAL  ' + m); };

(async () => {
  const b = await chromium.launch(); const errs = [];

  async function buka(hal, opts) {
    const o = opts || {};
    const pg = await b.newPage({ viewport: o.vp || { width: 1280, height: 900 } });
    pg.on('pageerror', e => errs.push(hal + ': ' + e.message));
    await pg.addInitScript(cfg => {
      window.__PERAN_UJI = cfg.peran;
      window.__MASUK_UJI = cfg.masuk;
      window.__TANPA_PROFIL = false;
      window.__PROFIL_SAYA = cfg.profil || null;
    }, { peran: o.peran === undefined ? 'fasilitator' : o.peran,
         masuk: o.masuk === undefined ? true : !!o.masuk,
         profil: o.profil || null });
    await pg.goto(DASAR + hal + (o.cari || ''), { waitUntil: 'load' });
    await pg.waitForTimeout(700);
    return pg;
  }
  async function bukaSesi(pg, id) {
    await pg.evaluate(s => document.querySelector('[data-sesi="' + s + '"]').click(), id || 's2');
    await pg.waitForTimeout(900);
  }
  const tab = async (pg, t) => {
    await pg.evaluate(k => document.querySelector('#tabEv [data-t="' + k + '"]').click(), t);
    await pg.waitForTimeout(300);
    return pg.evaluate(() => document.getElementById('isiTab').innerText);
  };

  /* ================= akses ================= */
  let pg = await buka(H_EV, { masuk: false });
  let r = await pg.evaluate(() => ({ g: !document.getElementById('gerbang').hidden,
                                     i: !document.getElementById('isi').hidden }));
  (r.g && !r.i) ? ok('Belum masuk: hanya gerbang yang tampil')
                : bad('Gerbang: ' + JSON.stringify(r));
  await pg.close();

  pg = await buka(H_EV, { peran: null });
  r = await pg.evaluate(() => document.body.innerText);
  (/Tidak punya akses/.test(r) && /sisi basis data/.test(r))
    ? ok('Bukan pengelola: ditolak, dan disebut penolakannya di basis data')
    : bad('Bukan staf');
  await pg.close();

  /* ================= ringkasan: ada respons ================= */
  pg = await buka(H_EV);
  await bukaSesi(pg, 's2');
  r = await pg.evaluate(() => document.getElementById('isiTab').innerText);

  (/Terdaftar\n3/.test(r) && /Hadir\n2/.test(r) && /dari 3 terdaftar/.test(r))
    ? ok('Terdaftar dan hadir dua angka terpisah, penyebutnya disebut')
    : bad('Angka dasar: ' + r.slice(0, 200));
  (/Mengisi evaluasi\n2/.test(r) && /dari 2 yang hadir/.test(r))
    ? ok('Jumlah pengisi evaluasi disebut dengan penyebut kehadiran')
    : bad('Responden: ' + r.slice(0, 260));

  /* rata-rata memperhitungkan nilai 0 sebagai jawaban sah */
  (/keseluruhan|bermanfaat sesi ini/i.test(r) && /\b4\.5\b/.test(r) && /Terendah 0/.test(r))
    ? ok('Nilai 0 ikut dihitung sebagai jawaban sah (rata-rata 4.5, terendah 0)')
    : bad('Rata-rata dengan nilai 0: ' + r.slice(0, 400));

  /* penyebut berbeda per pertanyaan, dan yang melewati tidak dihitung 0 */
  (/Dari 1 orang yang menjawab pertanyaan ini/.test(r) &&
   /tidak dihitung sebagai 0/.test(r))
    ? ok('Pertanyaan yang dilewati: penyebut lebih kecil, dan dinyatakan bukan nol')
    : bad('Penyebut per pertanyaan: ' + r.slice(0, 400));

  /* klik Spotify tidak dilaporkan sebagai pendengar */
  (/peristiwa klik/.test(r) && /bukan bukti ada yang selesai mendengarkan/.test(r))
    ? ok('Klik Spotify disebut peristiwa klik, bukan jumlah pendengar')
    : bad('Spotify: ' + r.slice(-400));
  /* Yang dilarang bukan katanya, melainkan klaimnya: "N pendengar". */
  (!/\d+\s+(orang\s+)?pendengar/i.test(r) && !/jumlah pendengar\s*[:=]/i.test(r))
    ? ok('Tidak ada satu pun angka yang diberi label pendengar')
    : bad('Ada klaim jumlah pendengar: ' + r.slice(0, 300));

  /* CSV: pencegahan formula injection */
  r = await pg.evaluate(() => {
    const asli = URL.createObjectURL; let isi = '';
    URL.createObjectURL = (blob) => { window.__BLOB = blob; return 'blob:uji'; };
    document.querySelector('[data-csv]').click();
    URL.createObjectURL = asli;
    return window.__BLOB ? window.__BLOB.text() : '';
  });
  const csv = await r;
  (/^﻿?"pertanyaan"/.test(csv) && /tidak dihitung sebagai 0/.test(csv))
    ? ok('CSV terunduh dengan catatan bahwa yang melewati tidak dihitung nol')
    : bad('CSV: ' + String(csv).slice(0, 200));
  await pg.close();

  /* ================= ringkasan: NOL respons ================= */
  pg = await buka(H_EV);
  await bukaSesi(pg, 's1');   /* s1 tidak punya feedback */
  r = await pg.evaluate(() => ({
    teks: document.getElementById('isiTab').innerText,
    batang: document.querySelectorAll('#isiTab i[style*="width"]').length,
    nolTertulis: /\b0(\.0+)?\b/.test((document.querySelector('#isiTab .kartu-h') || {}).innerText || '')
  }));
  (/Belum ada respons/.test(r.teks) && /bukan berarti nilainya nol/.test(r.teks))
    ? ok('Nol respons: ditulis "belum ada respons", dan dinyatakan bukan nilai nol')
    : bad('Nol respons: ' + r.teks.slice(0, 300));
  (r.batang === 0)
    ? ok('Nol respons: tidak ada satu batang progres pun digambar (batang kosong = nol)')
    : bad('Batang digambar saat nol respons: ' + r.batang);
  (/bukan peserta yang menilai buruk/.test(r.teks))
    ? ok('Peserta yang belum mengisi tidak disebut menilai buruk')
    : bad('Klaim gagal: ' + r.teks.slice(0, 300));
  (!/rata-rata 0|rata-rata 0\.0/i.test(r.teks))
    ? ok('Tidak ada "rata-rata 0" di layar nol respons')
    : bad('Ada rata-rata 0');

  /* ================= jawaban teks ================= */
  await bukaSesi(pg, 's2');
  let t = await tab(pg, 'jawaban');
  (/Bagian menghitung harga kamar/.test(t) && /boleh dikutip/.test(t))
    ? ok('Jawaban teks tampil beserta penanda izin kutipan')
    : bad('Jawaban teks: ' + t.slice(0, 300));
  (!/Peserta Contoh/.test(t) && !/@contoh\.id/.test(t))
    ? ok('Jawaban teks tidak membawa nama atau email pengirim')
    : bad('Identitas bocor di jawaban teks');
  (/bukan perintah menerbitkan/.test(t) && /tidak ada yang terbit/.test(t))
    ? ok('Izin kutipan dinyatakan bukan perintah menerbitkan')
    : bad('Klaim kutipan: ' + t.slice(0, 300));
  /* Satu-satunya jawaban untuk "perlu diperbaiki" hanyalah spasi, jadi
     pertanyaan itu tidak boleh muncul sama sekali di daftar jawaban. */
  (!/Apa yang perlu diperbaiki/.test(t))
    ? ok('Jawaban teks yang hanya berisi spasi tidak dianggap jawaban')
    : bad('Spasi ikut tampil sebagai jawaban: ' + t.slice(0, 300));

  /* ================= tindak lanjut ================= */
  t = await tab(pg, 'tindak');
  (/laporan peserta, bukan hasil yang sudah diverifikasi/.test(t))
    ? ok('"Dilaporkan selesai" dinyatakan bukan hasil terverifikasi')
    : bad('Klaim verifikasi: ' + t.slice(0, 300));
  (/"Belum diperbarui" bukan kegagalan|Belum diperbarui.{0,40}bukan kegagalan/.test(t))
    ? ok('"Belum diperbarui" dinyatakan bukan kegagalan')
    : bad('Klaim gagal tindak lanjut: ' + t.slice(0, 300));
  (/Pasang harga baru|Buka akun usaha/.test(t) === false)
    ? ok('Isi tujuan dan langkah rencana peserta TIDAK ditampilkan ke staf')
    : bad('Isi rencana pribadi bocor ke layar tindak lanjut');
  (/ada catatan bukti/.test(t) && /lewat tenggat/.test(t))
    ? ok('Yang ditampilkan hanya status: ada/tidaknya bukti dan lewat tenggat')
    : bad('Status tindak lanjut: ' + t.slice(0, 300));
  (/tidak mengirim pesan apa pun/.test(t))
    ? ok('Dinyatakan bahwa membuat tugas tidak mengirim pesan apa pun')
    : bad('Klaim kirim pesan');

  /* buat tugas: tercatat, dan tidak mengaku mengirim */
  await pg.evaluate(() => document.querySelector('[data-tugas]').click());
  await pg.waitForTimeout(300);
  r = await pg.evaluate(() => (document.querySelector('.lapis') || {}).innerText || '');
  /tidak mengirim pesan apa pun/.test(r)
    ? ok('Dialog tugas mengulang bahwa tidak ada pesan yang dikirim')
    : bad('Dialog tugas: ' + r.slice(0, 200));
  await pg.fill('#f-tujuan', 'Tanyakan hambatan langkah pertama');
  await pg.evaluate(() => document.querySelector('.lapis [data-ok]').click());
  await pg.waitForTimeout(800);
  r = await pg.evaluate(() => ({
    jml: window.__STUB.DB.follow_up_task.filter(x => x.sesi_id === 's2').length,
    toast: (document.querySelector('.toast') || {}).textContent || ''
  }));
  (r.jml === 1 && /Tidak ada pesan yang dikirim/.test(r.toast))
    ? ok('Tugas tercatat, dan pesan konfirmasinya menyebut tidak ada pengiriman')
    : bad('Buat tugas: ' + JSON.stringify(r));

  /* ================= wellbeing ================= */
  t = await tab(pg, 'wellbeing');
  (/bukan ranking peserta/.test(t) && /bukan skor kelayakan/.test(t) && /bukan diagnosis/.test(t))
    ? ok('Wellbeing dinyatakan bukan ranking, bukan skor kelayakan, bukan diagnosis')
    : bad('Klaim wellbeing: ' + t.slice(0, 300));
  (/Kesehatan & energi/.test(t) && /tidak dianggap nol/.test(t))
    ? ok('Agregat wellbeing tampil (pengisi cukup), aspek dilewati dinyatakan bukan nol')
    : bad('Agregat wellbeing: ' + t.slice(0, 400));
  (!/Peserta Contoh/.test(t))
    ? ok('Agregat wellbeing tidak membawa nama siapa pun')
    : bad('Nama bocor di wellbeing');

  /* sesi dengan pengisi di bawah batas: ditahan, dan bukan disebut nol */
  await bukaSesi(pg, 's1');
  t = await tab(pg, 'wellbeing');
  (/Belum bisa ditampilkan/.test(t) && /bukan berarti nilainya nol/.test(t))
    ? ok('Pengisi di bawah batas minimum: agregat ditahan, dan dinyatakan bukan nol')
    : bad('Batas wellbeing: ' + t.slice(0, 300));
  await pg.close();

  /* ================= peran yang tidak berhak menghitung ================= */
  pg = await buka(H_EV, { peran: 'cs' });
  await bukaSesi(pg, 's2');
  r = await pg.evaluate(() => document.getElementById('isiTab').innerText);
  (/tidak berhak menghitung/.test(r) && /bukan karena tidak ada respons/.test(r) && !/\n0\n/.test(r))
    ? ok('Peran tanpa hak hitung: dikatakan tidak berhak, dan dibedakan dari nol respons')
    : bad('Peran cs: ' + r.slice(0, 400));
  await pg.close();

  /* ================= portal: formulir evaluasi ================= */
  pg = await buka(H_PORTAL, { peran: null, profil: 'p3', vp: { width: 390, height: 844 } });
  await pg.waitForTimeout(900);
  r = await pg.evaluate(() => ({
    teks: document.getElementById('isiSesi').innerText,
    tombol: document.querySelectorAll('[data-eval]').length
  }));
  (r.tombol >= 1 && /Evaluasi sesi/.test(r.teks))
    ? ok('Portal: kartu evaluasi muncul untuk sesi yang sudah selesai')
    : bad('Kartu evaluasi: ' + JSON.stringify(r).slice(0, 300));
  (/rata-rata dan jawaban teks tanpa nama/.test(r.teks) && /tidak membuat apa pun terbit otomatis/.test(r.teks))
    ? ok('Portal menjelaskan apa yang dilihat pengelola, dan bahwa kutipan tidak terbit otomatis')
    : bad('Penjelasan portal: ' + r.teks.slice(0, 300));

  await pg.evaluate(() => document.querySelector('[data-eval]').click());
  await pg.waitForTimeout(400);
  r = await pg.evaluate(() => {
    const l = document.querySelector('.lapis');
    return { ada: !!l, teks: l ? l.innerText : '',
             belum: Array.from(l.querySelectorAll('.nilai-lc')).every(x => /belum dijawab/.test(x.textContent)),
             centang: (l.querySelector('#ev-kutip') || {}).checked };
  });
  (r.ada && r.belum)
    ? ok('Formulir evaluasi: semua skala mulai dari "belum dijawab", bukan dari angka tengah')
    : bad('Awal skala: ' + JSON.stringify(r).slice(0, 300));
  (r.centang === false && /tidak menerbitkan apa pun/.test(r.teks))
    ? ok('Izin kutipan tidak tercentang otomatis, dan dijelaskan apa artinya')
    : bad('Centang kutipan: ' + JSON.stringify(r).slice(0, 300));
  (/berbeda dari memberi nilai 0/.test(r.teks))
    ? ok('Dibedakan: dilewati ≠ nilai 0')
    : bad('Beda lewati vs 0: ' + r.teks.slice(0, 300));
  (/tidak menghilangkan/.test(r.teks))
    ? ok('Dinyatakan: tidak mengisi evaluasi tidak menghilangkan materi atau bonus')
    : bad('Klaim konsekuensi');

  /* pilih nilai 0 pada satu skala, lewati sisanya, kirim */
  await pg.evaluate(() => {
    const l = document.querySelector('.lapis');
    l.querySelector('#ev0').value = '0';
    l.querySelector('[data-set="0"]').click();
    l.querySelector('[data-kirim]').click();
  });
  await pg.waitForTimeout(900);
  r = await pg.evaluate(() => {
    const f = window.__STUB.DB.feedback.find(x => x.person_id === 'p3');
    return f ? { ada: true, kunci: Object.keys(f.jawaban), nol: f.jawaban.keseluruhan,
                 kutip: f.boleh_dikutip } : { ada: false };
  });
  (r.ada && r.nol === 0 && r.kunci.length === 1 && r.kutip === false)
    ? ok('Kirim evaluasi: nilai 0 tersimpan sebagai 0, yang dilewati TIDAK dikirim sebagai 0')
    : bad('Simpan evaluasi: ' + JSON.stringify(r));
  await pg.close();

  /* ================= tampilan ================= */
  for (const [nama, vp] of [['desktop 1440', { width: 1440, height: 900 }],
                            ['iPad 1024', { width: 1024, height: 768 }],
                            ['ponsel 390', { width: 390, height: 844 }]]) {
    pg = await buka(H_EV, { vp });
    await bukaSesi(pg, 's2');
    const g = await pg.evaluate(() => ({
      luber: document.documentElement.scrollWidth > window.innerWidth + 2,
      isi: document.body.innerText.trim().length }));
    (!g.luber && g.isi > 200) ? ok('Tampilan ' + nama + ': terisi, tidak meluber')
                              : bad('Tampilan ' + nama + ': ' + JSON.stringify(g));
    await pg.close();
  }

  errs.length === 0 ? ok('Tanpa error JavaScript')
                    : bad('Error JS: ' + errs.slice(0, 4).join(' | '));

  await b.close();
  console.log('\n' + pass + ' lulus, ' + fail + ' gagal' + (TUNGGAL ? ' (berkas tunggal)' : ''));
  process.exit(fail ? 1 : 0);
})();
