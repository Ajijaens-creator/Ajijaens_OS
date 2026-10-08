/* Uji NP-V03 — Slide Studio & Presentasi.

   Titik beratnya pada hal yang bisa melukai kalau dibiarkan lewat:
   kode embed mentah yang tersisip, host asing yang lolos, klaim editor
   Canva di dalam aplikasi, klaim ekspor otomatis, status yang naik
   sendiri, melepas tautan yang disalahartikan sebagai menghapus desain,
   dan proyektor yang membocorkan catatan presenter. */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const URL_ = 'http://127.0.0.1:8096/AJI-JAENS-OS-LIVE.html';
let pass = 0, fail = 0;
const ok  = m => { pass++; console.log('  ok  ' + m); };
const bad = m => { fail++; console.log('  GAGAL  ' + m); };

(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1600, height: 1100 } });
  const errs = [];
  pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(URL_, { waitUntil: 'load' });
  await pg.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await pg.reload({ waitUntil: 'load' });
  await pg.waitForTimeout(1600);
  const ev = (f, a) => (a === undefined ? pg.evaluate(f) : pg.evaluate(f, a));

  /* ============ 1. Seed: satu desain, status Belum diverifikasi ============ */
  let r = await ev(() => {
    np03Seed(); np03Seed();            /* dipanggil ulang — harus idempoten */
    const s = recs('SLD')[0];
    return { jml: recs('SLD').length, n: s && s.n, link: s && s.link, st: s && s.st,
             cek: s && s.cek, prg: s && s.prg, dummy: s && s._m.is_dummy };
  });
  (r.jml === 1 && r.st === 'Belum diverifikasi' && !r.cek)
    ? ok('1. Satu desain ter-seed sekali, status awal "Belum diverifikasi", tanpa tanggal konfirmasi')
    : bad('1. Seed: ' + JSON.stringify(r));
  (r.link === 'https://canva.link/vjagyqpeq6ajfas')
    ? ok('2. Tautan Canva dari Aji tersimpan utuh setelah lolos pemeriksaan')
    : bad('2. Tautan: ' + JSON.stringify(r.link));
  (r.prg && r.prg.indexOf('PRG-') === 0 && r.dummy === false)
    ? ok('3. Tertaut ke program yang ada, dan is_dummy = false')
    : bad('3. Kaitan: ' + JSON.stringify(r));

  /* ============ 4. Sanitasi: yang harus LOLOS ============ */
  r = await ev(() => {
    const t = {
      polos:   sldBersih('https://canva.link/abc123'),
      www:     sldBersih('https://www.canva.com/design/DAF/view'),
      embed:   sldBersih('<iframe loading="lazy" src="https://www.canva.com/design/DAF/view?embed" ' +
                         'allowfullscreen="allowfullscreen" allow="fullscreen"></iframe>'),
      hrefTag: sldBersih('<a href="https://canva.com/design/XYZ/view" target="_blank">Lihat</a>'),
      spasi:   sldBersih('   https://canva.link/spasi   '),
      query:   sldBersih('https://www.canva.com/design/DAF/view?embed&utm=x')
    };
    return t;
  });
  (r.polos === 'https://canva.link/abc123' &&
   r.www === 'https://www.canva.com/design/DAF/view' &&
   r.embed === 'https://www.canva.com/design/DAF/view?embed' &&
   r.hrefTag === 'https://canva.com/design/XYZ/view' &&
   r.spasi === 'https://canva.link/spasi')
    ? ok('4. Sanitasi meloloskan alamat Canva yang sah, termasuk yang diambil dari kode embed')
    : bad('4. Sanitasi lolos: ' + JSON.stringify(r));
  (r.embed.indexOf('<') === -1 && r.embed.indexOf('iframe') === -1 && r.hrefTag.indexOf('<') === -1)
    ? ok('5. Markup kode embed DIBUANG seluruhnya — yang tersisa hanya alamatnya')
    : bad('5. Markup ikut: ' + JSON.stringify(r));

  /* ============ 6. Sanitasi: yang harus DITOLAK ============ */
  r = await ev(() => {
    const kasus = [
      'javascript:alert(1)',
      '<img src=x onerror="alert(1)">',
      '<iframe src="javascript:alert(1)"></iframe>',
      'http://canva.link/abc',                            /* bukan https */
      'https://canva.link.jahat.com/abc',                 /* host menyerupai */
      'https://evil.com/design/view',
      'https://canva.com.evil.com/x',
      'data:text/html,<script>alert(1)</script>',
      '<iframe src="https://docs.google.com/presentation/d/x/embed"></iframe>',
      '<svg onload="alert(1)">',
      '"><script>alert(1)</script>',
      ''
    ];
    return kasus.map(k => ({ k, hasil: sldBersih(k), alasan: sldAlasan(k) }));
  });
  const lolos = r.filter(x => x.hasil !== '');
  (lolos.length === 0)
    ? ok('6. Dua belas masukan berbahaya atau host asing semuanya ditolak (hasil kosong)')
    : bad('6. Ada yang lolos: ' + JSON.stringify(lolos));
  (r.every(x => typeof x.alasan === 'string' && x.alasan.length > 5))
    ? ok('7. Setiap penolakan punya alasan yang bisa dijelaskan, bukan diam saja')
    : bad('7. Alasan: ' + JSON.stringify(r.map(x => x.alasan)));

  /* ============ 8. Sanitasi berlaku saat menyimpan lewat form ============ */
  r = await ev(() => {
    openForm('SLD');
    const set = (k, v) => { const f = document.querySelector('#formFields [data-k="' + k + '"]'); if(f) f.value = v; };
    set('n', 'UJI Deck tempel embed');
    set('link', '<iframe src="https://www.canva.com/design/UJI/view?embed"></iframe>');
    set('edit', '<a href="https://evil.com/edit">edit</a>');
    submitForm();
    const s = recs('SLD')[0];
    return { link: s.link, edit: s.edit, st: s.st,
             storeBersih: JSON.stringify(STORE.rec.SLD).indexOf('<iframe') === -1 &&
                          JSON.stringify(STORE.rec.SLD).indexOf('evil.com') === -1 };
  });
  (r.link === 'https://www.canva.com/design/UJI/view?embed' && r.edit === '')
    ? ok('8. Simpan lewat form: embed dibersihkan jadi alamat, tautan edit ke host asing dibuang')
    : bad('8. Simpan: ' + JSON.stringify(r));
  r.storeBersih
    ? ok('9. Tidak ada satu pun markup atau host asing yang tersisa di penyimpanan')
    : bad('9. Store tercemar');
  (r.st === 'Belum diverifikasi')
    ? ok('10. Desain baru dari form juga mulai dari "Belum diverifikasi"')
    : bad('10. Status awal form: ' + r.st);

  /* ============ 10b. Status awal dijaga dari jalur mana pun ============ */
  r = await ev(() => {
    const a = { st:'', cek:'2020-01-01' };
    sldSimpanBersih(a);
    const bb = { st:'Dikonfirmasi manual', cek:'2026-01-02' };
    sldSimpanBersih(bb);
    const c = { st:'Perlu diperbaiki', cek:'2026-01-02' };
    sldSimpanBersih(c);
    return { a, bb, c };
  });
  (r.a.st === 'Belum diverifikasi' && r.a.cek === '')
    ? ok('10b. Status kosong dari jalur apa pun diisi ke "Belum diverifikasi", bukan ke yang lebih tinggi')
    : bad('10b. Status kosong: ' + JSON.stringify(r.a));
  (r.bb.cek === '2026-01-02' && r.c.cek === '')
    ? ok('10c. Tanggal konfirmasi hanya bertahan kalau statusnya memang terkonfirmasi')
    : bad('10c. Tanggal konfirmasi: ' + JSON.stringify(r));

  /* ============ 11. Tidak ada iframe Canva di halaman ============ */
  r = await ev(() => {
    go('knowledge'); knTab('bhn'); shTab('sld');
    const teks = document.getElementById('view').innerText;
    return { teks,
      iframe: document.querySelectorAll('#view iframe').length,
      tautanCanva: Array.from(document.querySelectorAll('#view a[href]'))
        .map(a => a.getAttribute('href')).filter(x => /canva/.test(x)),
      targetBlank: Array.from(document.querySelectorAll('#view a[href*="canva"]'))
        .every(a => a.getAttribute('target') === '_blank' && /noopener/.test(a.getAttribute('rel') || '')) };
  });
  (r.iframe === 0)
    ? ok('11. Tidak ada satu pun iframe di layar Slide Studio')
    : bad('11. Ada iframe: ' + r.iframe);
  (r.tautanCanva.length >= 1 && r.targetBlank)
    ? ok('12. Tautan Canva membuka tab baru dengan rel noopener, bukan disematkan')
    : bad('12. Tautan: ' + JSON.stringify(r.tautanCanva));
  (/Tidak ada editor Canva di dalam aplikasi ini/.test(r.teks))
    ? ok('13. Dinyatakan terang-terangan bahwa editor Canva tidak ada di dalam aplikasi')
    : bad('13. Klaim editor: ' + r.teks.slice(0, 300));
  (/Ekspor belum dibangun/.test(r.teks) &&
   !/Ekspor PDF<|Ekspor PPT<|onclick="sldEkspor/.test(r.teks))
    ? ok('14. Ekspor dinyatakan belum dibangun, dan tidak ada tombol yang seolah-olah aktif')
    : bad('14. Klaim ekspor: ' + r.teks.slice(0, 400));

  /* tidak ada tombol ekspor sama sekali */
  r = await ev(() => Array.from(document.querySelectorAll('#view button, #view a'))
    .map(x => x.innerText.trim()).filter(t => /ekspor|export|unduh pdf|download/i.test(t)));
  (r.length === 0)
    ? ok('15. Tidak ada satu pun tombol ekspor atau unduh di Slide Studio')
    : bad('15. Ada tombol ekspor: ' + JSON.stringify(r));

  /* ============ 16. Konfirmasi manual ============ */
  r = await ev(() => {
    const id = recs('SLD').find(s => s.n === 'UJI Deck tempel embed').id;
    const sebelum = recById(id).st;
    sldKonfirmasi(id);
    const s = recById(id);
    const log = (STORE.log || []).filter(l => l.id === id);
    return { sebelum, st: s.st, cek: s.cek, hariIni: todayISO(),
             catatan: (log[0] || {}).note || '' };
  });
  (r.sebelum === 'Belum diverifikasi' && r.st === 'Dikonfirmasi manual' && r.cek === r.hariIni)
    ? ok('16. Konfirmasi manual menaikkan status dan mencatat tanggalnya')
    : bad('16. Konfirmasi: ' + JSON.stringify(r));
  (/bukan pemeriksaan otomatis/.test(r.catatan))
    ? ok('17. Jejak audit menyebut bahwa itu pernyataan manusia, bukan pemeriksaan otomatis')
    : bad('17. Catatan audit: ' + JSON.stringify(r.catatan));

  /* ============ 18. Status tidak naik sendiri ============ */
  r = await ev(() => {
    const id = recs('SLD').find(s => s.st === 'Belum diverifikasi');
    if(!id) return { adaYgBelum: false };
    const s0 = JSON.stringify(id);
    go('knowledge'); knTab('bhn'); shTab('sld');
    recDetail(id.id); closeModal();
    go('knowledge');
    return { adaYgBelum: true, sama: JSON.stringify(recById(id.id)) === s0, st: recById(id.id).st };
  });
  (r.adaYgBelum && r.sama && r.st === 'Belum diverifikasi')
    ? ok('18. Membuka layar dan detailnya TIDAK menaikkan status dengan sendirinya')
    : bad('18. Status naik sendiri: ' + JSON.stringify(r));

  /* ============ 19. Lepas dari program ============ */
  r = await ev(() => {
    const id = recs('SLD').find(s => s.prg).id;
    const prgSebelum = recById(id).prg;
    const jmlPrg = recs('PRG').length;
    const link = recById(id).link;
    sldLepas(id);
    const s = recById(id);
    const log = (STORE.log || []).filter(l => l.id === id);
    return { prgSebelum, prgSesudah: s.prg, link: s.link, linkSama: s.link === link,
             jmlPrgSesudah: recs('PRG').length, jmlPrg,
             adaDesain: !!recById(id), catatan: (log[0] || {}).note || '' };
  });
  (r.prgSebelum && r.prgSesudah === '' && r.adaDesain && r.linkSama &&
   r.jmlPrgSesudah === r.jmlPrg)
    ? ok('19. Lepas dari program memutus tautannya saja — record, tautan Canva, dan program tetap ada')
    : bad('19. Lepas: ' + JSON.stringify(r));
  (/desain di Canva tidak diubah/i.test(r.catatan))
    ? ok('20. Jejak audit menyebut bahwa desain di Canva tidak diubah')
    : bad('20. Catatan lepas: ' + JSON.stringify(r.catatan));

  /* ============ 21. Mode proyektor: yang tampil dan yang tidak ============ */
  r = await ev(() => {
    /* satu desain dengan catatan presenter dan tautan edit yang sah */
    const id = recs('SLD')[0].id;
    const s = recById(id);
    s.note = 'RAHASIA catatan presenter: sebut angka omzet 450 juta di sini';
    s.edit = 'https://www.canva.com/design/RAHASIAEDIT/edit';
    s.prg = recs('PRG')[0].id;
    saveStore();
    go('knowledge'); knTab('bhn'); shTab('sld');
    sldProyektor(recs('PRG')[0].id);
    const el = document.getElementById('sldProy');
    return { ada: !!el, teks: el ? el.innerText : '',
             html: el ? el.innerHTML : '',
             tautan: el ? Array.from(el.querySelectorAll('a[href]')).map(a => a.getAttribute('href')) : [] };
  });
  r.ada ? ok('21. Mode proyektor terbuka untuk satu program')
        : bad('21. Mode proyektor tidak muncul');
  (!/RAHASIA catatan presenter/.test(r.html) && !/450 juta/.test(r.html))
    ? ok('22. Proyektor tidak menampilkan catatan presenter')
    : bad('22. Catatan presenter bocor ke proyektor');
  (!/RAHASIAEDIT/.test(r.html) && r.tautan.every(x => !/\/edit/.test(x)))
    ? ok('23. Proyektor tidak menampilkan tautan edit')
    : bad('23. Tautan edit bocor: ' + JSON.stringify(r.tautan));
  (/tidak menampilkan/.test(r.teks) && /catatan presenter/.test(r.teks) && /data pribadi/.test(r.teks))
    ? ok('24. Proyektor menyebutkan sendiri apa yang tidak ditampilkannya')
    : bad('24. Pernyataan proyektor: ' + r.teks.slice(0, 300));
  (r.tautan.length >= 1 && r.tautan.every(x => /^https:\/\/(www\.)?canva\.(com|link|site)\//.test(x)))
    ? ok('25. Tautan di proyektor hanya alamat tampilan Canva yang sudah lolos pemeriksaan')
    : bad('25. Tautan proyektor: ' + JSON.stringify(r.tautan));

  /* ============ 26. Proyektor tanpa desain tidak mengarang slide ============ */
  r = await ev(() => {
    sldProyTutup();
    recs('SLD').forEach(s => { s.prg = ''; });
    saveStore();
    const p = recs('PRG')[0].id;
    sldProyektor(p);
    const el = document.getElementById('sldProy');
    return el ? el.innerText : '';
  });
  (/Belum ada desain slide/.test(r) && /Tidak ada slide contoh/.test(r))
    ? ok('26. Program tanpa desain: dikatakan kosong, tidak diisi slide contoh')
    : bad('26. Proyektor kosong: ' + r.slice(0, 250));

  /* ============ 27. Sub-tab Share bertambah, 15 menu utama tetap ============ */
  r = await ev(() => ({ sh: SH_TABS.map(t => t[0]), nav: NAV.length,
                        navId: NAV.map(x => x.id) }));
  (JSON.stringify(r.sh) === JSON.stringify(['ov','bank','mod','prg','sld']) && r.nav === 15)
    ? ok('27. Slide ditambahkan sebagai sub-tab Share; 15 menu utama tidak berubah')
    : bad('27. Tab: ' + JSON.stringify(r));

  /* ============ 28. Bertahan setelah muat ulang ============ */
  await pg.reload({ waitUntil: 'load' });
  await pg.waitForTimeout(1500);
  r = await ev(() => ({ jml: recs('SLD').length,
    bersih: JSON.stringify(STORE.rec.SLD).indexOf('<') === -1,
    seed: recs('SLD').filter(s => /canva\.link\/vjagyqpeq6ajfas/.test(s.link || '')).length }));
  (r.jml === 2 && r.bersih && r.seed === 1)
    ? ok('28. Setelah muat ulang: dua desain utuh, tanpa markup, seed tidak dibuat dua kali')
    : bad('28. Setelah muat ulang: ' + JSON.stringify(r));

  /* ============ 29. Tiga ukuran layar ============ */
  for (const [w, hh, nm] of [[390, 844, 'ponsel'], [1024, 1366, 'iPad'], [1600, 1100, 'desktop']]) {
    const p2 = await b.newPage({ viewport: { width: w, height: hh } });
    p2.on('pageerror', e => errs.push(nm + ': ' + e.message));
    await p2.goto(URL_, { waitUntil: 'load' });
    await p2.waitForTimeout(1400);
    await p2.evaluate(() => { go('knowledge'); knTab('bhn'); shTab('sld'); });
    await p2.waitForTimeout(300);
    const g = await p2.evaluate(() => ({
      luber: document.documentElement.scrollWidth > window.innerWidth + 2,
      isi: document.body.innerText.trim().length }));
    (!g.luber && g.isi > 200) ? ok('29. Tampilan ' + nm + ' (' + w + 'px): terisi, tidak meluber')
                              : bad('29. Tampilan ' + nm + ': ' + JSON.stringify(g));
    await p2.close();
  }

  errs.length === 0 ? ok('30. Tanpa error JavaScript')
                    : bad('30. Error JS: ' + errs.slice(0, 4).join(' | '));

  await b.close();
  console.log('\n' + pass + ' lulus, ' + fail + ' gagal');
  process.exit(fail ? 1 : 0);
})();
