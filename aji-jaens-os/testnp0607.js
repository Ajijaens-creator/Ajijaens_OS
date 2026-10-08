/* Uji NP-V06 (Learn) dan NP-V07 (Do).

   Yang diuji terutama hal yang mudah dilanggar tanpa kelihatan:
   record paralel, tanggal karangan, hasil karangan, mesin geser kedua,
   insight AI tanpa sumber, dan tab yang aktif di tempat yang salah. */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const URL = 'http://127.0.0.1:8096/AJI-JAENS-OS-LIVE.html';
let pass = 0, fail = 0;
const ok  = m => { pass++; console.log('  ok  ' + m); };
const bad = m => { fail++; console.log('  GAGAL  ' + m); };

(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1600, height: 1100 } });
  const errs = [];
  pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(URL, { waitUntil: 'load' });
  await pg.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await pg.reload({ waitUntil: 'load' });
  await pg.waitForTimeout(1600);
  const ev = (f, a) => (a === undefined ? pg.evaluate(f) : pg.evaluate(f, a));

  /* ============ 1. Tidak ada entitas / store paralel ============ */
  let r = await ev(() => ({
    kunci: Object.keys(SCHEMA).filter(k => /^(LRN|PRK|L6|D7|LEARN|DO)/.test(k)).sort(),
    store: Object.keys(STORE.rec).filter(k => /LEARN|DO6|DO7|L6|D7/.test(k)),
    papanBaru: Object.keys(BOARDS).sort(),
    mesinGeser: typeof boardDown === 'function' && typeof boardMove === 'function'
  }));
  (r.kunci.join(',') === 'LRN,PRK' && r.store.length === 0)
    ? ok('1. Tidak ada entitas atau penyimpanan paralel — tetap LRN dan PRK dari NP-01')
    : bad('1. Entitas: ' + JSON.stringify(r));
  (r.papanBaru.indexOf('lrn') !== -1 && r.papanBaru.indexOf('prk') !== -1 && r.mesinGeser)
    ? ok('2. Papan Learn dan Do terdaftar di mesin geser yang sudah ada, bukan mesin kedua')
    : bad('2. Papan: ' + JSON.stringify(r));

  /* ============ 3. Kolom papan dibaca dari skema ============ */
  r = await ev(() => ({
    lrn: boardCols(BOARDS.lrn), prk: boardCols(BOARDS.prk),
    lrnSkema: (SCHEMA.LRN.f.find(f => f.k === 'st') || {}).opt,
    prkSkema: (SCHEMA.PRK.f.find(f => f.k === 'st') || {}).opt
  }));
  (JSON.stringify(r.lrn) === JSON.stringify(r.lrnSkema) &&
   JSON.stringify(r.prk) === JSON.stringify(r.prkSkema))
    ? ok('3. Kolom papan dibaca dari skema (' + r.lrn.join(' / ') + '), tidak ditulis ulang')
    : bad('3. Kolom: ' + JSON.stringify(r));

  /* ============ 4. Tangkap cepat: Draft, tanpa tanggal karangan ============ */
  r = await ev(() => {
    go('knowledge'); knTab('lrn');
    const el = document.getElementById('l6in');
    el.value = 'Harga kamar harus menutup biaya tetap\nDari percakapan dengan pemilik homestay lain.';
    l6Capture();
    const x = recs('LRN')[0];
    return { n: x.n, note: x.note, st: x.st, date: x.date, src: x._m.source_type,
             dummy: x._m.is_dummy, jml: recs('LRN').length,
             kosong: !document.getElementById('l6in').value };
  });
  (r.jml === 1 && r.st === 'Draft' && r.n === 'Harga kamar harus menutup biaya tetap' &&
   /pemilik homestay/.test(r.note) && r.kosong)
    ? ok('4. Tangkap cepat: baris pertama jadi judul, seluruh teks jadi catatan, status Draft')
    : bad('4. Tangkap cepat: ' + JSON.stringify(r));
  (r.date === undefined || r.date === '' || r.date === null)
    ? ok('5. Tangkap cepat TIDAK mengisi tanggal pembelajaran — kosong tetap kosong')
    : bad('5. Tanggal dikarang: ' + JSON.stringify(r.date));
  (r.dummy === false && r.src === 'MANUAL_ENTRY')
    ? ok('6. Record tangkapan ditandai MANUAL_ENTRY dan is_dummy = false')
    : bad('6. Metadata: ' + JSON.stringify(r));

  /* ============ 7. Saringan Learn ============ */
  r = await ev(() => {
    /* dua record tambahan lewat form resmi, bukan jalur lain */
    const buat = (n, o) => {
      openForm('LRN');
      const set = (k, v) => { const f = document.querySelector('#formFields [data-k="' + k + '"]'); if(f) f.value = v; };
      set('n', n); set('note', 'catatan ' + n);
      Object.keys(o).forEach(k => set(k, o[k]));
      submitForm();
    };
    buat('UJI Buku tarif', { jenis:'Buku', date:'2026-03-10', topic:'harga, operasional',
                             lesson:'Hitung dulu biaya tetap', st:'Sudah Direfleksikan' });
    buat('UJI Seminar layanan', { jenis:'Seminar', date:'2026-08-02', topic:'layanan',
                                  st:'Perlu Dirangkum' });
    const semua = recs('LRN').length;
    l6Set('jenis','Buku');     const a = l6Filter().length;
    l6Set('jenis','');
    l6Set('refl','belum');     const bb = l6Filter().length;
    l6Set('refl','');
    l6Set('topik','harga');    const c = l6Filter().length;
    l6Set('topik','');
    l6Set('dari','2026-06-01');const d = l6Filter().map(x => x.n);
    l6Set('dari','');
    l6Set('q','homestay');     const e = l6Filter().length;
    l6Reset();
    return { semua, a, bb, c, d, e, topik: l6Topik(), setelahReset: l6Filter().length };
  });
  (r.semua === 3 && r.a === 1 && r.bb === 2 && r.c === 1 && r.e === 1 && r.setelahReset === 3)
    ? ok('7. Saringan Learn: jenis, pelajaran, topik, dan pencarian menyaring dengan benar')
    : bad('7. Saringan: ' + JSON.stringify(r));
  (r.d.length === 1 && r.d[0] === 'UJI Seminar layanan')
    ? ok('8. Saringan periode hanya mengenai record bertanggal; yang tanpa tanggal tidak dipaksa masuk')
    : bad('8. Periode: ' + JSON.stringify(r.d));
  (r.topik.indexOf('harga') !== -1 && r.topik.indexOf('operasional') !== -1)
    ? ok('9. Daftar topik dibaca dari record, bukan dari daftar tetap')
    : bad('9. Topik: ' + JSON.stringify(r.topik));

  /* ============ 10. Tidak ada klaim insight AI di Learn ============ */
  r = await ev(() => {
    go('knowledge'); knTab('lrn');
    return document.getElementById('view').innerText;
  });
  (/dihitung, bukan disimpulkan/.test(r) && /Tidak ada kesimpulan AI di layar ini/.test(r))
    ? ok('10. Angka Learn dinyatakan hasil hitungan, dan ketiadaan insight AI dikatakan')
    : bad('10. Klaim AI: ' + r.slice(0, 300));
  (!/AI menyarankan|insight AI:|rekomendasi AI/i.test(r))
    ? ok('11. Tidak ada satu pun kesimpulan yang disajikan sebagai insight AI')
    : bad('11. Ada klaim AI di Learn');

  /* ============ 12. Geser kartu Learn = ubah status + linimasa ============ */
  r = await ev(() => {
    const id = recs('LRN').find(x => x.n === 'UJI Seminar layanan').id;
    const sebelum = recById(id).st;
    boardMove('lrn', id, 'Sudah Direfleksikan');
    const sesudah = recById(id).st;
    const log = (STORE.log || []).filter(l => l.id === id);
    boardUndo();
    return { sebelum, sesudah, urung: recById(id).st, adaLog: log.length > 0,
             logTeks: JSON.stringify(log.slice(-1)) };
  });
  (r.sebelum === 'Perlu Dirangkum' && r.sesudah === 'Sudah Direfleksikan' && r.urung === 'Perlu Dirangkum')
    ? ok('12. Geser kartu Learn mengubah status, dan bisa diurungkan kembali')
    : bad('12. Geser: ' + JSON.stringify(r));
  r.adaLog ? ok('13. Perpindahan kartu tercatat di linimasa record')
           : bad('13. Linimasa: ' + r.logTeks);

  /* ============ 14. Do: hasil dan tanggal tidak pernah dikarang ============ */
  r = await ev(() => {
    const lrn = recs('LRN')[0].id;
    openForm('PRK');
    const set = (k, v) => { const f = document.querySelector('#formFields [data-k="' + k + '"]'); if(f) f.value = v; };
    set('n', 'UJI Praktik tarif baru'); set('note', 'Coba tarif baru seminggu');
    set('kind', 'Praktik terencana'); set('learn', lrn);
    set('sit', 'Okupansi turun'); set('goal', 'Menutup biaya tetap');
    submitForm();
    const p = recs('PRK')[0];
    const awal = { st: p.st, res: p.res, end: p.end, refl: p.refl, ev: p.ev };
    boardMove('prk', p.id, 'Dilakukan');
    const q = recById(p.id);
    return { awal, st: q.st, res: q.res, end: q.end, refl: q.refl, bukti: q.ev };
  });
  (r.st === 'Dilakukan')
    ? ok('14. Papan Do mengubah status praktik lewat mesin geser yang sama')
    : bad('14. Geser Do: ' + JSON.stringify(r));
  ((!r.res || !String(r.res).trim()) && (!r.end || !String(r.end).trim()) &&
   (!r.refl || !String(r.refl).trim()) && (!r.bukti || !String(r.bukti).trim()))
    ? ok('15. Naik ke "Dilakukan" TIDAK mengisi hasil, tanggal selesai, refleksi, atau bukti')
    : bad('15. Ada yang dikarang saat status naik: ' + JSON.stringify(r));

  /* ============ 16. Detail Do: tab Rencana aktif, Bukti terakhir ============ */
  r = await ev(() => {
    const p = recs('PRK')[0];
    recDetail(p.id);
    const wrap = document.getElementById('tabs-prk-' + p.id);
    const tabs = Array.from(wrap.querySelectorAll('[data-tabk]'));
    const aktif = tabs.filter(t => t.classList.contains('on')).map(t => t.getAttribute('data-tabk'));
    const panel = Array.from(wrap.querySelectorAll('[data-panelk]'))
      .filter(p2 => !p2.hidden).map(p2 => p2.getAttribute('data-panelk'));
    const urut = tabs.map(t => t.getAttribute('data-tabk'));
    return { urut, aktif, panel, jmlAktif: aktif.length,
             ariaBenar: tabs.filter(t => t.getAttribute('aria-selected') === 'true').length };
  });
  (JSON.stringify(r.urut) === JSON.stringify(['rencana','tindakan','hasil','bukti']))
    ? ok('16. Urutan tab detail Do: Rencana → Tindakan → Hasil → Bukti')
    : bad('16. Urutan tab: ' + JSON.stringify(r.urut));
  (r.jmlAktif === 1 && r.aktif[0] === 'rencana' && r.panel.length === 1 && r.panel[0] === 'rencana'
   && r.ariaBenar === 1)
    ? ok('17. KOREKSI MOCKUP: yang aktif saat dibuka adalah Rencana, bukan Bukti — satu tab saja')
    : bad('17. Tab aktif: ' + JSON.stringify(r));

  /* ============ 18. Pindah tab tidak mengubah data ============ */
  r = await ev(() => {
    const p = recs('PRK')[0];
    const sebelum = JSON.stringify(recById(p.id));
    npTabGo('prk-' + p.id, 'bukti');
    const wrap = document.getElementById('tabs-prk-' + p.id);
    const panel = Array.from(wrap.querySelectorAll('[data-panelk]'))
      .filter(x => !x.hidden).map(x => x.getAttribute('data-panelk'));
    const teks = wrap.querySelector('[data-panelk="bukti"]').innerText;
    return { panel, sama: JSON.stringify(recById(p.id)) === sebelum, teks };
  });
  (r.panel.length === 1 && r.panel[0] === 'bukti' && r.sama)
    ? ok('18. Berpindah tab hanya mengubah tampilan, tidak menyentuh data record')
    : bad('18. Pindah tab: ' + JSON.stringify(r).slice(0, 300));
  (/belum ditulis/.test(r.teks) && /belum bisa menyimpan berkas/.test(r.teks) &&
   /bukan berarti buktinya hilang/.test(r.teks))
    ? ok('19. Tab Bukti yang kosong berkata "belum ditulis" dan menjelaskan batasnya, tanpa contoh karangan')
    : bad('19. Teks bukti: ' + String(r.teks).slice(0, 300));

  /* ============ 20. Hasil kosong tidak ditulis sebagai hasil ============ */
  r = await ev(() => {
    const p = recs('PRK')[0];
    npTabGo('prk-' + p.id, 'hasil');
    const t = document.querySelector('#tabs-prk-' + p.id + ' [data-panelk="hasil"]').innerText;
    return t;
  });
  (/belum ditulis/.test(r) && /tidak berarti berhasil/.test(r))
    ? ok('20. Hasil yang kosong tampil "belum ditulis", dan "Dilakukan ≠ berhasil" dikatakan di tempatnya')
    : bad('20. Panel hasil: ' + r.slice(0, 300));

  /* ============ 21. Saringan Do ============ */
  r = await ev(() => {
    closeModal();
    const semua = recs('PRK').length;
    d7Set('hasil','belum'); const a = d7Filter().length;
    d7Set('hasil','ada');   const bb = d7Filter().length;
    d7Set('hasil','');
    d7Set('sumber','ada');  const c = d7Filter().length;
    d7Set('sumber','tanpa');const d = d7Filter().length;
    d7Reset();
    return { semua, a, bb, c, d, reset: d7Filter().length };
  });
  (r.semua === 1 && r.a === 1 && r.bb === 0 && r.c === 1 && r.d === 0 && r.reset === 1)
    ? ok('21. Saringan Do: hasil ada/belum dan sumber ditautkan/tidak menyaring dengan benar')
    : bad('21. Saringan Do: ' + JSON.stringify(r));

  /* ============ 22. Menu 15 modul dan urutannya utuh ============ */
  r = await ev(() => NAV.map(x => x.id));
  (Array.isArray(r) && r.length === 15 && r.indexOf('knowledge') !== -1)
    ? ok('22. Tetap 15 menu utama (' + r.length + '), urutannya tidak diubah paket ini')
    : bad('22. Menu: ' + JSON.stringify(r));

  /* ============ 23. Data bertahan setelah muat ulang ============ */
  await pg.reload({ waitUntil: 'load' });
  await pg.waitForTimeout(1400);
  r = await ev(() => ({ lrn: recs('LRN').length, prk: recs('PRK').length,
    st: (recs('PRK')[0] || {}).st, res: (recs('PRK')[0] || {}).res }));
  (r.lrn === 3 && r.prk === 1 && r.st === 'Dilakukan' && (!r.res || !String(r.res).trim()))
    ? ok('23. Setelah muat ulang: record utuh, status tersimpan, hasil tetap kosong')
    : bad('23. Setelah muat ulang: ' + JSON.stringify(r));


  /* ============ 26. Record tanpa status tidak hilang dari pandangan ============
     Kolom papan dibaca dari pilihan status. Record yang statusnya masih
     kosong karena itu tidak punya kolom — dan tanpa penanganan ia hilang
     dari layar tanpa pemberitahuan. Ini yang diuji di sini. */
  r = await ev(() => {
    /* satu pembelajaran dengan status dikosongkan dengan sengaja */
    const x = recs('LRN')[0];
    x.st = '';
    saveStore();
    go('knowledge'); knTab('lrn');
    const teks = document.getElementById('view').innerText;
    const dipapan = Array.from(document.querySelectorAll('#bd-lrn .kan-c'))
      .map(c => c.getAttribute('data-id'));
    return { id: x.id, teks, dipapan, adaSeksi: /belum muncul di papan/i.test(teks),
             adaTombol: !!document.querySelector('[onclick^="knSetSt(\'' + x.id + '\'"]') };
  });
  (r.dipapan.indexOf(r.id) === -1 && r.adaSeksi && r.adaTombol)
    ? ok('26. Record tanpa status tidak muncul di papan, tetapi DIKATAKAN — bukan hilang diam-diam')
    : bad('26. Record tanpa status: ' + JSON.stringify({ dipapan: r.dipapan, id: r.id, seksi: r.adaSeksi, tombol: r.adaTombol }));
  (/Statusnya tidak diisi sendiri/.test(r.teks))
    ? ok('27. Dinyatakan bahwa status tidak diisi sendiri oleh sistem')
    : bad('27. Klaim isi otomatis: ' + r.teks.slice(0, 300));

  /* mengisi status dari daftar itu: tercatat, dan kartunya masuk papan */
  r = await ev(() => {
    const id = recs('LRN').find(x => !String(x.st || '').trim()).id;
    knSetSt(id, 'Draft');
    const log = (STORE.log || []).filter(l => l.id === id);
    return { st: recById(id).st, id,
             dipapan: Array.from(document.querySelectorAll('#bd-lrn .kan-c'))
               .map(c => c.getAttribute('data-id')).indexOf(id) !== -1,
             adaLog: log.length > 0, adaCh: !!(log[0] && log[0].ch && log[0].ch.length) };
  });
  (r.st === 'Draft' && r.dipapan && r.adaLog && r.adaCh)
    ? ok('28. Mengisi status dari daftar itu: kartunya masuk papan, dan perubahannya tercatat di linimasa')
    : bad('28. knSetSt: ' + JSON.stringify(r));

  /* ============ 24. Tiga ukuran layar ============ */
  for (const [w, hh, nm] of [[390, 844, 'ponsel'], [1024, 1366, 'iPad'], [1600, 1100, 'desktop']]) {
    const p2 = await b.newPage({ viewport: { width: w, height: hh } });
    p2.on('pageerror', e => errs.push(nm + ': ' + e.message));
    await p2.goto(URL, { waitUntil: 'load' });
    await p2.waitForTimeout(1400);
    await p2.evaluate(() => { go('knowledge'); knTab('lrn'); });
    await p2.waitForTimeout(300);
    const g = await p2.evaluate(() => ({
      luber: document.documentElement.scrollWidth > window.innerWidth + 2,
      isi: document.body.innerText.trim().length }));
    (!g.luber && g.isi > 200) ? ok('24. Tampilan ' + nm + ' (' + w + 'px): terisi, tidak meluber')
                              : bad('24. Tampilan ' + nm + ': ' + JSON.stringify(g));
    await p2.close();
  }

  errs.length === 0 ? ok('25. Tanpa error JavaScript')
                    : bad('25. Error JS: ' + errs.slice(0, 4).join(' | '));

  await b.close();
  console.log('\n' + pass + ' lulus, ' + fail + ' gagal');
  process.exit(fail ? 1 : 0);
})();
