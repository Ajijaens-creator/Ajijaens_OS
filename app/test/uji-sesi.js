/* =====================================================================
   NP-V08 — pengujian layar kendali fasilitator + layar proyektor.

   Yang diuji di sini bukan "apakah tampilannya bagus", tetapi
   pernyataan-pernyataan yang tidak boleh dilanggar:
     - Terdaftar dan hadir dua angka terpisah, keduanya disebut.
     - Timer dihitung dari waktu tersimpan, muat ulang tidak mengulang.
     - Jumlah pengirim: NULL (tidak berhak) tidak pernah tampil sebagai 0.
     - Menutup aktivitas tidak menghapus jawaban.
     - QR dibuat dari alamat PORTAL yang benar; kalau gagal, dikatakan.
     - Mengakhiri sesi butuh konfirmasi dan tidak menghapus data.
     - Proyektor tidak pernah menampilkan nama, kontak, omzet, jawaban
       perorangan, atau tombol kendali.
     - Pembaruan disebut polling, tidak pernah disebut realtime.
   ===================================================================== */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const DASAR = 'http://127.0.0.1:8095/test/';
/* Rangkaian uji yang sama dijalankan dua kali: pada halaman bersumber
   banyak berkas, dan pada berkas tunggal yang benar-benar diunggah.
   TUNGGAL=1 memilih yang kedua. */
const TUNGGAL = !!process.env.TUNGGAL;
const H_KENDALI   = TUNGGAL ? 'sesi-tunggal-uji.html'      : 'sesi-uji.html';
const H_PROYEKTOR = TUNGGAL ? 'proyektor-tunggal-uji.html' : 'proyektor-uji.html';
let pass = 0, fail = 0;
const ok  = m => { pass++; console.log('  ok  ' + m); };
const bad = m => { fail++; console.log('  GAGAL  ' + m); };

(async () => {
  const b = await chromium.launch(); const errs = [];

  async function buka(halaman, opts) {
    const o = opts || {};
    const pg = await b.newPage({ viewport: o.vp || { width: 1280, height: 900 } });
    pg.on('pageerror', e => errs.push(halaman + ': ' + e.message));
    await pg.addInitScript(cfg => {
      window.__PERAN_UJI = cfg.peran;
      window.__MASUK_UJI = cfg.masuk;
      window.__TANPA_PROFIL = false;
      /* Meniru pembuat QR yang tidak tersedia — berlaku baik pada halaman
         bersumber banyak berkas maupun pada berkas tunggal. */
      if (cfg.tanpaQR) Object.defineProperty(window, 'AJIQR',
        { get: () => undefined, set: () => {}, configurable: true });
    }, { peran: o.peran === undefined ? 'fasilitator' : o.peran,
         masuk: o.masuk === undefined ? true : !!o.masuk,
         tanpaQR: !!o.tanpaQR });
    await pg.goto(DASAR + halaman + (o.hash || ''), { waitUntil: 'load' });
    await pg.waitForTimeout(600);
    return pg;
  }

  /* ================= gerbang & peran ================= */
  let pg = await buka(H_KENDALI, { masuk: false });
  let r = await pg.evaluate(() => ({
    gerbang: !document.getElementById('gerbang').hidden,
    isi: !document.getElementById('isi').hidden,
    adaSandi: !!document.querySelector('input[type="password"]')
  }));
  (r.gerbang && !r.isi && !r.adaSandi)
    ? ok('Belum masuk: hanya gerbang yang tampil, dan tidak pernah meminta kata sandi')
    : bad('Gerbang: ' + JSON.stringify(r));
  await pg.close();

  pg = await buka(H_KENDALI, { peran: null });
  r = await pg.evaluate(() => ({
    bukanStaf: !document.getElementById('bukanStaf').hidden,
    isi: !document.getElementById('isi').hidden,
    kataBasisData: /sisi basis data/i.test(document.body.innerText)
  }));
  (r.bukanStaf && !r.isi && r.kataBasisData)
    ? ok('Bukan pengelola: ditolak, dan disebut bahwa penolakannya di basis data')
    : bad('Bukan staf: ' + JSON.stringify(r));
  await pg.close();

  /* ================= daftar sesi ================= */
  pg = await buka(H_KENDALI);
  r = await pg.evaluate(() => ({
    jml: document.querySelectorAll('#daftarSesi [data-sesi]').length,
    teks: document.getElementById('daftarSesi').innerText,
    adaBuat: !!document.getElementById('buatSesi')
  }));
  (r.jml === 3 && /UJI-2/.test(r.teks) && /UJI-3/.test(r.teks) && r.adaBuat)
    ? ok('Daftar sesi tampil dengan kode sesi, plus tombol sesi baru')
    : bad('Daftar sesi: ' + JSON.stringify(r));

  /* ================= buka sesi berlangsung ================= */
  await pg.evaluate(() => document.querySelector('[data-sesi="s2"]').click());
  await pg.waitForTimeout(700);
  r = await pg.evaluate(() => ({
    judul: document.getElementById('judulSesi').textContent,
    sub: document.getElementById('subSesi').textContent,
    status: document.getElementById('statusSesi').innerText,
    angka: document.getElementById('angka').innerText,
    koneksi: document.getElementById('koneksi').innerText,
    polling: /polling/i.test(document.body.innerText),
    realtime: /realtime/i.test(document.body.innerText)
  }));
  (/Sesi Uji Berlangsung/.test(r.judul) && /150 menit/.test(r.sub) && /Berlangsung/.test(r.status))
    ? ok('Sesi terbuka: judul, durasi, kode, dan status tampil')
    : bad('Kepala sesi: ' + JSON.stringify(r));

  /* terdaftar vs hadir — dua angka, penyebut disebut */
  (/Terdaftar\n3/.test(r.angka) && /Hadir\n2/.test(r.angka) && /dari 3 terdaftar/.test(r.angka))
    ? ok('Terdaftar (3) dan Hadir (2) dua angka terpisah, penyebutnya disebut')
    : bad('Angka: ' + JSON.stringify(r.angka));

  (r.polling && /diperbarui/.test(r.koneksi))
    ? ok('Pembaruan disebut polling dan menunjukkan kapan terakhir diperbarui')
    : bad('Polling: ' + JSON.stringify(r));
  (!/\brealtime\b/i.test(r.angka) && /bukan realtime/i.test(await pg.evaluate(() => document.body.innerText)))
    ? ok('Halaman menyatakan terang-terangan bahwa ini bukan realtime')
    : bad('Klaim realtime: ' + r.realtime);

  /* ================= timer dari waktu tersimpan ================= */
  const t1 = await pg.evaluate(() => document.getElementById('timer').textContent);
  await pg.reload({ waitUntil: 'load' }); await pg.waitForTimeout(600);
  await pg.evaluate(() => document.querySelector('[data-sesi="s2"]').click());
  await pg.waitForTimeout(600);
  const t2 = await pg.evaluate(() => document.getElementById('timer').textContent);
  const detik = s => { const m = /(\d+):(\d+)/.exec(s); return m ? +m[1] * 60 + +m[2] : -1; };
  (detik(t1) > 60 && detik(t2) >= detik(t1))
    ? ok('Timer dihitung dari waktu mulai tersimpan — muat ulang tidak mengulanginya (' + t1 + ' → ' + t2 + ')')
    : bad('Timer: ' + t1 + ' → ' + t2);

  /* ================= QR ================= */
  r = await pg.evaluate(() => {
    const k = document.getElementById('qr');
    return { url: k.dataset.url, keadaan: k.dataset.qr, svg: k.querySelectorAll('svg').length,
             modul: (k.querySelector('path') || {}).getAttribute
               ? k.querySelector('path').getAttribute('d').split('M').length - 1 : 0,
             teks: document.getElementById('isiTab').innerText };
  });
  (r.url === 'https://os.ajijaens.com/portal/?sesi=UJI-2')
    ? ok('QR dibuat dari alamat PORTAL peserta yang benar: ' + r.url)
    : bad('Alamat QR: ' + r.url);
  (r.keadaan === 'nyata' && r.svg === 1 && r.modul > 100)
    ? ok('QR nyata tergambar (' + r.modul + ' modul), bukan kotak hiasan')
    : bad('QR: ' + JSON.stringify(r).slice(0, 200));
  (/tidak membawa hak akses/.test(r.teks) && /Pindai sendiri sekali/.test(r.teks))
    ? ok('Disebut bahwa QR publik tidak membawa hak akses, dan diminta dipindai sendiri sekali')
    : bad('Keterangan QR: ' + r.teks.slice(0, 200));
  (/Membuka aktivitas tidak otomatis menampilkannya di proyektor/.test(r.teks))
    ? ok('Dibedakan: membuka aktivitas di portal ≠ menampilkan di proyektor')
    : bad('Beda buka vs tayang tidak disebut');
  await pg.close();

  /* QR gagal dibuat: tidak menggambar apa pun */
  pg = await buka(H_KENDALI, { tanpaQR: true });
  await pg.evaluate(() => document.querySelector('[data-sesi="s2"]').click());
  await pg.waitForTimeout(700);
  r = await pg.evaluate(() => {
    const k = document.getElementById('qr');
    return { keadaan: k.dataset.qr, svg: k.querySelectorAll('svg,canvas,img').length, teks: k.innerText };
  });
  (r.keadaan === 'gagal' && r.svg === 0 && /tidak bisa dibuat/i.test(r.teks))
    ? ok('Pembuat QR gagal: tidak ada gambar apa pun, dan kegagalannya dikatakan')
    : bad('QR gagal: ' + JSON.stringify(r));
  await pg.close();

  /* ================= progres: NULL bukan nol ================= */
  pg = await buka(H_KENDALI, { peran: 'fasilitator' });
  await pg.evaluate(() => document.querySelector('[data-sesi="s2"]').click());
  await pg.waitForTimeout(700);
  await pg.evaluate(() => document.querySelector('#tabSesi [data-t="aktivitas"]').click());
  await pg.waitForTimeout(300);
  r = await pg.evaluate(() => document.getElementById('isiTab').innerText);
  (/1 peserta unik/.test(r) && /2 yang hadir/.test(r) && /Penyebutnya kehadiran, bukan pendaftaran/.test(r))
    ? ok('Progres: 1 pengirim unik dari 2 hadir — draft tidak dihitung, penyebut disebut')
    : bad('Progres fasilitator: ' + r.slice(0, 260));
  (/tidak menghapus/.test(r))
    ? ok('Disebut bahwa menutup aktivitas tidak menghapus jawaban yang sudah terkirim')
    : bad('Pernyataan tutup-tidak-hapus tidak ada');
  await pg.close();

  /* peran cs: tidak berhak menghitung → NULL, bukan 0 */
  pg = await buka(H_KENDALI, { peran: 'cs' });
  r = await pg.evaluate(() => ({ bukanStaf: !document.getElementById('bukanStaf').hidden }));
  r.bukanStaf
    ? ok('Peran cs tidak diberi layar kendali sesi')
    : bad('cs masuk layar kendali');
  await pg.close();

  /* operator: berhak, dan angkanya muncul */
  pg = await buka(H_KENDALI, { peran: 'operator' });
  await pg.evaluate(() => document.querySelector('[data-sesi="s2"]').click());
  await pg.waitForTimeout(700);
  r = await pg.evaluate(() => document.getElementById('angka').innerText);
  /Hadir\n2/.test(r) ? ok('Operator melihat angka kehadiran sesinya')
                     : bad('Operator: ' + r.slice(0, 160));

  /* ================= peserta & check-in ganda ================= */
  await pg.evaluate(() => document.querySelector('#tabSesi [data-t="peserta"]').click());
  await pg.waitForTimeout(300);
  r = await pg.evaluate(() => ({
    teks: document.getElementById('isiTab').innerText,
    belum: document.querySelectorAll('[data-checkin]').length,
    sudah: document.querySelectorAll('[data-koreksi]').length
  }));
  (/Terdaftar berbeda dari hadir/.test(r.teks) && r.belum === 1 && r.sudah === 2)
    ? ok('Tab Peserta: 2 sudah check-in, 1 belum — dan "terdaftar ≠ hadir" ditulis')
    : bad('Tab peserta: ' + JSON.stringify(r).slice(0, 220));
  (/belum check-in bukan berarti tidak datang/.test(r.teks))
    ? ok('Belum check-in tidak diklaim sebagai tidak datang')
    : bad('Klaim belum check-in');

  /* check-in peserta ke-3, lalu coba lagi → harus 23505, tidak dihitung dua kali */
  await pg.evaluate(() => document.querySelector('[data-checkin]').click());
  await pg.waitForTimeout(700);
  r = await pg.evaluate(() => ({
    hadir: window.__STUB.DB.attendance.filter(a => a.sesi_id === 's2' && a.hadir).length,
    angka: document.getElementById('angka').innerText,
    metode: (window.__STUB.DB.attendance.find(a => a.sesi_id === 's2' && a.person_id === 'p3') || {}).metode,
    pencatat: !!(window.__STUB.DB.attendance.find(a => a.sesi_id === 's2' && a.person_id === 'p3') || {}).dicatat_oleh
  }));
  (r.hadir === 3 && /Hadir\n3/.test(r.angka) && r.metode === 'Operator' && r.pencatat)
    ? ok('Check-in operator tercatat beserta metode dan siapa yang mencatat')
    : bad('Check-in: ' + JSON.stringify(r).slice(0, 220));

  r = await pg.evaluate(async () => {
    const A = window.AJIOS;
    const { error } = await A.from('attendance').insert({ sesi_id: 's2', person_id: 'p3', hadir: true });
    return error ? error.code : 'tidak ada error';
  });
  (r === '23505') ? ok('Check-in kedua untuk orang yang sama ditolak basis data (23505), tidak ganda')
                  : bad('Check-in ganda: ' + r);
  await pg.close();

  /* ================= pertanyaan ================= */
  pg = await buka(H_KENDALI);
  await pg.evaluate(() => document.querySelector('[data-sesi="s2"]').click());
  await pg.waitForTimeout(700);
  await pg.evaluate(() => document.querySelector('#tabSesi [data-t="tanya"]').click());
  await pg.waitForTimeout(300);
  r = await pg.evaluate(() => ({
    teks: document.getElementById('isiTab').innerText,
    tombol: Array.from(document.querySelectorAll('[data-tayang]')).map(b => b.textContent)
  }));
  (/meninjau sebelum menayangkan/.test(r.teks) && /identitasnya tetap terlihat oleh pengelola/.test(r.teks))
    ? ok('Pertanyaan ditinjau sebelum tayang, dan batas "tanpa nama" dijelaskan apa adanya')
    : bad('Pertanyaan: ' + r.teks.slice(0, 220));
  (r.tombol.indexOf('Tayangkan') !== -1 && r.tombol.indexOf('Tandai terjawab') !== -1)
    ? ok('Pertanyaan baru → Tayangkan; yang sudah tayang → Tandai terjawab')
    : bad('Tombol tayang: ' + JSON.stringify(r.tombol));

  /* ================= akhiri sesi ================= */
  await pg.evaluate(() => document.querySelector('#tabSesi [data-t="kendali"]').click());
  await pg.waitForTimeout(300);
  await pg.evaluate(() => document.querySelector('[data-akhiri]').click());
  await pg.waitForTimeout(300);
  r = await pg.evaluate(() => ({
    dialog: !!document.querySelector('.lapis'),
    teks: (document.querySelector('.lapis') || {}).innerText || ''
  }));
  (r.dialog && /tidak menghapus data apa pun/.test(r.teks) && /AKHIRI/.test(r.teks))
    ? ok('Akhiri sesi: minta konfirmasi ketik AKHIRI, dan menyatakan tidak ada data yang dihapus')
    : bad('Dialog akhiri: ' + JSON.stringify(r).slice(0, 220));

  /* salah ketik → tidak berubah */
  await pg.fill('#f-ya', 'ya');
  await pg.evaluate(() => document.querySelector('.lapis [data-ok]').click());
  await pg.waitForTimeout(300);
  r = await pg.evaluate(() => ({
    masih: !!document.querySelector('.lapis'),
    status: window.__STUB.DB.sesi.find(s => s.id === 's2').status
  }));
  (r.masih && r.status === 'Berlangsung')
    ? ok('Konfirmasi salah ketik: sesi TIDAK berubah statusnya')
    : bad('Konfirmasi salah: ' + JSON.stringify(r));

  await pg.fill('#f-ya', 'AKHIRI');
  await pg.evaluate(() => document.querySelector('.lapis [data-ok]').click());
  await pg.waitForTimeout(800);
  r = await pg.evaluate(() => ({
    status: window.__STUB.DB.sesi.find(s => s.id === 's2').status,
    diakhiri: !!window.__STUB.DB.sesi.find(s => s.id === 's2').diakhiri_pada,
    jawaban: window.__STUB.DB.activity_response.length,
    hadir: window.__STUB.DB.attendance.length,
    tanya: window.__STUB.DB.pertanyaan.length
  }));
  (r.status === 'Selesai' && r.diakhiri && r.jawaban === 2 && r.hadir >= 3 && r.tanya === 2)
    ? ok('Sesi selesai: jawaban, kehadiran, dan pertanyaan tetap utuh — tidak ada yang dihapus')
    : bad('Akhiri sesi: ' + JSON.stringify(r));
  await pg.close();

  /* ================= aktivitas: tutup tidak hapus ================= */
  pg = await buka(H_KENDALI);
  await pg.evaluate(() => document.querySelector('[data-sesi="s2"]').click());
  await pg.waitForTimeout(700);
  await pg.evaluate(() => document.querySelector('[data-akt]').click());
  await pg.waitForTimeout(300);
  r = await pg.evaluate(() => (document.querySelector('.lapis') || {}).innerText || '');
  /tidak menghapus jawaban/.test(r)
    ? ok('Dialog tutup aktivitas menyatakan jawaban terkirim tidak dihapus')
    : bad('Dialog aktivitas: ' + r.slice(0, 200));
  await pg.evaluate(() => {
    document.querySelector('#f-status').value = 'Ditutup';
    document.querySelector('.lapis [data-ok]').click();
  });
  await pg.waitForTimeout(800);
  r = await pg.evaluate(() => ({
    status: window.__STUB.DB.activity.find(a => a.id === 'ak3').status,
    jawaban: window.__STUB.DB.activity_response.filter(x => x.activity_id === 'ak3').length,
    audit: window.__STUB.DB.audit_log.filter(a => /AKTIVITAS_/.test(a.aksi)).length
  }));
  (r.status === 'Ditutup' && r.jawaban === 2 && r.audit === 1)
    ? ok('Aktivitas ditutup: jawaban tetap ada, dan perubahannya masuk jejak audit')
    : bad('Tutup aktivitas: ' + JSON.stringify(r));
  await pg.close();

  /* ================= PROYEKTOR ================= */
  pg = await buka(H_PROYEKTOR, { hash: '#s2' });
  r = await pg.evaluate(() => ({
    judul: document.getElementById('judul').textContent,
    badan: document.body.innerText,
    qrUrl: (document.getElementById('qr') || {}).dataset ? document.getElementById('qr').dataset.url : '',
    qr: (document.getElementById('qr') || {}).dataset ? document.getElementById('qr').dataset.qr : '',
    tombol: Array.from(document.querySelectorAll('button')).map(x => x.textContent)
  }));
  /Sesi Uji Berlangsung/.test(r.judul) ? ok('Proyektor: judul sesi tampil')
                                       : bad('Proyektor judul: ' + r.judul);
  (r.qrUrl === 'https://os.ajijaens.com/portal/?sesi=UJI-2' && r.qr === 'nyata')
    ? ok('Proyektor menayangkan QR nyata ke alamat portal yang benar')
    : bad('Proyektor QR: ' + JSON.stringify(r).slice(0, 200));

  /* yang TIDAK boleh ada di layar ruangan */
  const bocor = [
    ['nama peserta', /Peserta Contoh/],
    ['email', /@contoh\.id/],
    ['nomor WhatsApp', /0812/],
    ['omzet', /juta|miliar/i],
    ['nama usaha', /Homestay|Usaha Contoh/],
    ['jawaban perorangan', /refleksi|Life Circle Dasar/]
  ];
  const ketemu = bocor.filter(([, re]) => re.test(r.badan)).map(([n]) => n);
  (ketemu.length === 0)
    ? ok('Proyektor tidak menampilkan nama, kontak, omzet, nama usaha, atau jawaban perorangan')
    : bad('Proyektor membocorkan: ' + ketemu.join(', '));

  const kendali = r.tombol.filter(t => /mulai|akhiri|check-in|koreksi|tutup aktivitas|ubah/i.test(t));
  (kendali.length === 0)
    ? ok('Proyektor tidak punya tombol kendali sesi — hanya kendali tampilan')
    : bad('Tombol kendali di proyektor: ' + JSON.stringify(kendali));

  (/Terdaftar berbeda dari hadir/.test(r.badan) && /2/.test(r.badan))
    ? ok('Proyektor menyebut hadir dan terdaftar sebagai dua angka')
    : bad('Proyektor angka: ' + r.badan.slice(0, 200));
  (/polling, bukan realtime/i.test(r.badan))
    ? ok('Proyektor menyatakan pembaruannya polling, bukan realtime')
    : bad('Proyektor klaim realtime');

  /* hanya pertanyaan yang sudah ditayangkan */
  (/izin usaha wajib/.test(r.badan) && !/tanpa modal/.test(r.badan))
    ? ok('Proyektor hanya menayangkan pertanyaan yang sudah disetujui fasilitator')
    : bad('Pertanyaan di proyektor: ' + r.badan.slice(0, 300));

  /* aktivitas yang dibuka + progres agregat */
  /* huruf besar di layar berasal dari CSS, jadi cocokkan tanpa peduli huruf */
  (/sedang berjalan/i.test(r.badan) && /Wellbeing Life Circle/.test(r.badan)
   && /1 dari 2 yang hadir/.test(r.badan))
    ? ok('Proyektor menampilkan aktivitas yang dibuka beserta progres agregatnya')
    : bad('Aktivitas proyektor: ' + r.badan.slice(0, 300));
  await pg.close();

  /* proyektor tanpa sesi di alamat */
  pg = await buka(H_PROYEKTOR);
  r = await pg.evaluate(() => document.body.innerText);
  /Sesi belum dipilih/.test(r) ? ok('Proyektor tanpa sesi: menjelaskan, bukan menampilkan angka kosong')
                               : bad('Proyektor tanpa sesi: ' + r.slice(0, 160));
  await pg.close();

  /* ================= tampilan ================= */
  for (const [nama, vp] of [['proyektor 1920', { width: 1920, height: 1080 }],
                            ['kendali iPad 1024', { width: 1024, height: 768 }],
                            ['kendali ponsel 390', { width: 390, height: 844 }]]) {
    const hal = /proyektor/.test(nama) ? H_PROYEKTOR : H_KENDALI;
    pg = await buka(hal, { vp, hash: /proyektor/.test(nama) ? '#s2' : '' });
    if (!/proyektor/.test(nama)) {
      await pg.evaluate(() => document.querySelector('[data-sesi="s2"]').click());
      await pg.waitForTimeout(600);
    }
    const g = await pg.evaluate(() => ({
      meluber: document.documentElement.scrollWidth > window.innerWidth + 2,
      isi: document.body.innerText.trim().length
    }));
    (!g.meluber && g.isi > 180) ? ok('Tampilan ' + nama + ': terisi, tidak meluber')
                                : bad('Tampilan ' + nama + ': ' + JSON.stringify(g));
    await pg.close();
  }

  errs.length === 0 ? ok('Tanpa error JavaScript')
                    : bad('Error JS: ' + errs.slice(0, 4).join(' | '));

  await b.close();
  console.log('\n' + pass + ' lulus, ' + fail + ' gagal' + (TUNGGAL ? ' (berkas tunggal)' : ''));
  process.exit(fail ? 1 : 0);
})();
