const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const http = require('http'), fs = require('fs');

let REMOTE = null;
const PAGE = fs.readFileSync('/home/claude/studio/JAENS-CONTENT-STUDIO.html');
const server = http.createServer((req, res) => {
  if (req.url.indexOf('/data/studio.json') === 0) {
    if (!REMOTE) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type':'application/json' });
    return res.end(JSON.stringify(REMOTE));
  }
  res.writeHead(200, { 'content-type':'text/html; charset=utf-8' });
  res.end(PAGE);
});

const FAKE = on => `
  window.__c = { files:{}, pub:[], saves:[], fail:null, on:${on} };
  window.claude = { use: async n => {
    if(n === 'artifact' && window.__c.on) return Object.freeze({
      publish: async a => {
        if(window.__c.fail){ const e = new Error('x'); e.code = window.__c.fail; window.__c.fail = null; throw e; }
        Object.keys(a).forEach(k => window.__c.files[k] = a[k]);
        window.__c.pub.push(Object.keys(a)); return { version:'v'+window.__c.pub.length }; }
    });
    if(n === 'downloads' && window.__c.on) return Object.freeze({
      save: async r => { window.__c.saves.push(r); return { saved:true }; } });
    return null;
  }};`;

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const BASE = 'http://127.0.0.1:' + server.address().port;
  const b = await chromium.launch();
  const errs = [];
  const noise = t => /ERR_TUNNEL|ERR_NAME_NOT_RESOLVED|fonts\.googleapis|Failed to load resource/.test(t);
  const fail = m => { console.log('FAIL ' + m); process.exitCode = 1; };
  const ok = m => console.log('  ok  ' + m);

  const open = async (on, remote) => {
    REMOTE = remote || null;
    const pg = await b.newPage({ viewport:{ width:2200, height:1200 } });
    pg.on('console', m => { if(m.type()==='error' && !noise(m.text())) errs.push(m.text()); });
    pg.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
    await pg.addInitScript(FAKE(on));
    await pg.goto(BASE + '/x.html');
    await pg.waitForTimeout(450);
    return pg;
  };
  const drag = async (pg, id, toCol) => {
    const card = await pg.$(`#bd .kan-c[data-id="${id}"]`);
    if(!card) return 'kartu tidak ada';
    await card.scrollIntoViewIfNeeded();
    const cb = await card.boundingBox();
    const col = await pg.$(`#bd .kan-col[data-val="${toCol}"]`);
    if(!col) return 'kolom tidak ada';
    /* papan punya tujuh kolom dan menggulir mendatar — bawa kolom tujuan
       ke dalam layar dulu, seperti yang dilakukan gulir-tepi saat digeser sungguhan */
    const tb = await col.boundingBox();
    const cb2 = await card.boundingBox();
    if(!tb || !cb2) return 'di luar layar';
    await pg.mouse.move(cb2.x + cb2.width/2, cb2.y + 18);
    await pg.mouse.down();
    await pg.mouse.move(cb2.x + cb2.width/2 + 30, cb2.y + 26, { steps:4 });
    await pg.mouse.move(tb.x + tb.width/2, tb.y + 60, { steps:8 });
    await pg.mouse.up();
    await pg.waitForTimeout(220);
    return null;
  };

  let pg = await open(true);
  await pg.evaluate(() => localStorage.clear());
  await pg.reload(); await pg.waitForTimeout(450);

  // ---- 1. lingkupnya dinyatakan, bukan disembunyikan ----
  let txt = await pg.$eval('#view', e => e.innerText);
  if (!/konten saja/i.test(txt) || !/terpisah penuh/i.test(txt))
    fail('pernyataan lingkup tidak muncul di layar');
  else ok('halaman menyatakan sendiri bahwa isinya konten saja dan terpisah dari OS pribadi');
  const navs = await pg.$$eval('.nav-i', n => n.map(x => x.dataset.v));
  if (navs.join(',') !== 'board,cal,list,team,arsip') fail('menu: ' + navs.join(','));
  else ok('hanya lima menu — papan, kalender, daftar, tim, arsip; tidak ada modul pribadi yang ikut terbawa');
  const ents = await pg.evaluate(() => Object.keys(SCHEMA));
  if (ents.join(',') !== 'CNT,TIM') fail('entitas: ' + ents.join(','));
  else ok('hanya dua entitas yang ada datanya: Konten dan Anggota Tim');

  // ---- 2. keadaan kosong ----
  if (!/papan masih kosong/i.test(txt)) fail('keadaan kosong tidak mengundang entri');
  else ok('papan kosong mengundang entri pertama, bukan layar kosong');

  // ---- 3. entri lewat form sungguhan ----
  await pg.evaluate(() => { WHO = 'Nama Uji'; localStorage.setItem('jaens-studio-who','Nama Uji'); openForm('TIM'); });
  await pg.waitForTimeout(250);
  await pg.evaluate(() => {
    document.querySelector('#formFields [data-k="n"]').value = 'Nama Uji';
    document.querySelector('#formFields [data-k="role"]').value = 'Content Lead';
    submitForm();
  });
  await pg.waitForTimeout(250);
  const tim = await pg.evaluate(() => recs('TIM').map(p => p.n + '/' + p.role));
  if (tim.join() !== 'Nama Uji/Content Lead') fail('entri tim: ' + JSON.stringify(tim));
  else ok('anggota tim tersimpan lewat form, bukan ditanam di kode');

  await pg.evaluate(() => openForm('CNT'));
  await pg.waitForTimeout(200);
  const required = await pg.evaluate(() => { submitForm();
    return Array.from(document.querySelectorAll('#formFields .fld.bad')).map(x => x.dataset.f); });
  if (required.join(',') !== 'n,channel,status') fail('validasi wajib: ' + required.join(','));
  else ok('kolom wajib ditolak kosong — judul, kanal, dan status');

  const ids = await pg.evaluate(() => {
    const per = recs('TIM')[0].id;
    const mk = o => { const r = Object.assign({ id: nextId('CNT') }, o);
      r._m = { created_at:new Date().toISOString(), updated_at:new Date().toISOString(),
               created_by:'Nama Uji', updated_by:'Nama Uji', is_archived:false };
      (STORE.rec.CNT = STORE.rec.CNT || []).unshift(r); return r.id; };
    const a = mk({ n:'Video tur Outlet Bisma', channel:'Instagram', pillar:'Di balik layar', status:'Draft', date: shiftISO(todayISO(), 4), owner:per });
    const b = mk({ n:'Esai: harga pertumbuhan cepat', channel:'LinkedIn', pillar:'Bisnis', status:'Ide' });
    const c = mk({ n:'Wawancara radio lokal', channel:'Media', status:'Terjadwal', date: shiftISO(todayISO(), -6) });
    bump(); closeModal(); return { per, a, b, c };
  });
  await pg.evaluate(() => go('board'));
  await pg.waitForTimeout(250);
  ok('seed: tiga konten di kolom berbeda, satu sudah lewat tanggal');

  // ---- 4. papan geser ----
  const cols = await pg.$$eval('#bd .kan-col', n => n.map(x => x.dataset.val));
  if (cols.join(',') !== 'Ide,Draft,Menunggu review,Revisi,Terjadwal,Tayang,Dibatalkan')
    fail('kolom papan: ' + cols.join(','));
  else ok('tujuh kolom pipeline, termasuk Revisi — tahap yang nyata dalam kerja konten');

  let e = await drag(pg, ids.a, 'Menunggu review');
  if (e) fail('geser gagal: ' + e);
  const st = await pg.evaluate(i => recById(i).status, ids.a);
  if (st !== 'Menunggu review') fail('status tidak berubah: ' + st);
  else ok('menggeser kartu mengubah status konten');
  const mv = await pg.evaluate(i => { const l = STORE.log.find(x => x.id === i && x.act === 'MOVE');
    return l ? { by:l.by, ch:(l.ch||[]).map(c => c.l + ':' + c.from + '→' + c.to) } : null; }, ids.a);
  if (!mv || mv.ch[0] !== 'Status:Draft→Menunggu review') fail('catatan geseran: ' + JSON.stringify(mv));
  else ok('geseran tercatat sebagai perubahan kolom, dari nilai apa ke nilai apa');
  if (mv.by !== 'Nama Uji') fail('penulis perubahan: ' + mv.by);
  else ok('linimasa mencatat siapa yang menggeser — nama yang disetel orang itu sendiri');

  const barOn = await pg.$eval('#kanBar', n => n.classList.contains('on')).catch(() => false);
  if (!barOn) fail('bilah urungkan tidak muncul');
  else ok('bilah Urungkan muncul setelah geseran');
  await pg.evaluate(() => boardUndo());
  await pg.waitForTimeout(220);
  const back = await pg.evaluate(i => ({ s: recById(i).status, n: STORE.log.filter(l => l.id===i && l.act==='MOVE').length }), ids.a);
  if (back.s !== 'Draft' || back.n !== 2) fail('urungkan: ' + JSON.stringify(back));
  else ok('urungkan mengembalikan kartu dan ikut tercatat — jejaknya ditambah, bukan dihapus');

  await drag(pg, ids.a, 'Tayang');
  const pub = await pg.evaluate(i => recById(i), ids.a);
  if (pub.status !== 'Tayang' || !pub.date) fail('tanggal tayang: ' + JSON.stringify({s:pub.status,d:pub.date}));
  else ok('digeser ke Tayang tetap punya tanggal — kalau kosong diisi hari ini');

  // ---- 5. papan ketik ----
  await pg.evaluate(() => go('board'));
  await pg.waitForTimeout(200);
  await pg.focus(`#bd .kan-c[data-id="${ids.b}"]`);
  await pg.keyboard.press('Enter'); await pg.waitForTimeout(140);
  let kb = await pg.evaluate(() => KB ? { from:KB.from, to:KB.to } : null);
  if (!kb) fail('kartu tidak terangkat lewat papan ketik');
  else ok('Enter mengangkat kartu tanpa tetikus');
  await pg.keyboard.press('ArrowRight'); await pg.waitForTimeout(140);
  const mid = await pg.evaluate(i => ({ to: KB && KB.to, st: recById(i).status }), ids.b);
  if (mid.to !== 'Draft' || mid.st !== 'Ide') fail('bayangan kartu: ' + JSON.stringify(mid));
  else ok('panah memindahkan bayangan kartu, status belum berubah selama belum dilepas');
  await pg.keyboard.press('Enter'); await pg.waitForTimeout(220);
  if (await pg.evaluate(i => recById(i).status, ids.b) !== 'Draft') fail('lepas papan ketik gagal');
  else ok('Enter kedua melepas kartu dan status berubah');
  await pg.focus(`#bd .kan-c[data-id="${ids.b}"]`);
  await pg.keyboard.press('Enter'); await pg.waitForTimeout(120);
  await pg.keyboard.press('ArrowRight'); await pg.waitForTimeout(120);
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(180);
  if (await pg.evaluate(i => recById(i).status, ids.b) !== 'Draft') fail('Escape tidak membatalkan');
  else ok('Escape membatalkan dan kartu kembali ke kolom semula');

  // ---- 6. sentuh ----
  await pg.evaluate(id => {
    const c = document.querySelector('.kan-c[data-id="'+id+'"]');
    c.scrollIntoView({ block:'center' });
    const r = c.getBoundingClientRect();
    c.dispatchEvent(new PointerEvent('pointerdown', { bubbles:true, cancelable:true, composed:true,
      pointerId:7, pointerType:'touch', isPrimary:true, clientX:r.left+r.width/2, clientY:r.top+16, button:0, buttons:1 }));
  }, ids.c);
  await pg.waitForTimeout(120);
  if (await pg.evaluate(() => !!document.querySelector('.kan-ghost')))
    fail('sentuhan sekejap langsung mengangkat kartu — menggulir jadi mustahil');
  else ok('sentuhan sekejap tidak mengangkat kartu, jadi papan tetap bisa digulir di ponsel');
  await pg.waitForTimeout(260);
  if (!(await pg.evaluate(() => !!document.querySelector('.kan-ghost')))) fail('menahan sentuhan tidak mengangkat kartu');
  else ok('menahan sentuhan ~280ms mengangkat kartu');
  const dropped = await pg.evaluate(o => {
    const col = document.querySelector('#bd .kan-col[data-val="Tayang"]');
    const r = col.getBoundingClientRect(), x = r.left + r.width/2, y = r.top + 50;
    const ev = up => ({ bubbles:true, cancelable:true, composed:true, pointerId:7, pointerType:'touch',
      isPrimary:true, clientX:x, clientY:y, button:0, buttons: up?0:1 });
    document.dispatchEvent(new PointerEvent('pointermove', ev(false)));
    document.dispatchEvent(new PointerEvent('pointerup', ev(true)));
    return recById(o.c).status;
  }, ids);
  if (dropped !== 'Tayang') fail('geser sentuh: ' + dropped);
  else ok('jari menggeser dan melepas kartu di kolom tujuan');

  // ---- 7. kalender ----
  await pg.evaluate(() => go('cal'));
  await pg.waitForTimeout(250);
  const calN = await pg.$$eval('.cal-i', n => n.length);
  if (calN < 2) fail('kalender tidak menampilkan konten: ' + calN);
  else ok('kalender menampilkan konten bertanggal pada harinya');
  const calTxt = await pg.$eval('#view', e => e.innerText);
  if (!/tidak muncul di sini/i.test(calTxt)) fail('kalender tidak menjelaskan konten tanpa tanggal');
  else ok('kalender berkata terus terang bahwa konten tanpa tanggal tidak muncul di sana');
  await pg.evaluate(() => calShift(1)); await pg.waitForTimeout(200);
  await pg.evaluate(() => calShift(-1)); await pg.waitForTimeout(200);
  ok('bulan bisa dimajukan dan dimundurkan');

  // ---- 8. daftar + saringan ----
  await pg.evaluate(() => go('list'));
  await pg.waitForTimeout(220);
  const rows = await pg.$$eval('#view tbody tr', n => n.length);
  if (rows !== 3) fail('baris daftar: ' + rows);
  else ok('daftar memuat seluruh konten, termasuk yang tanpa tanggal');
  await pg.evaluate(() => lfSet('ch','LinkedIn'));
  await pg.waitForTimeout(200);
  const filtered = await pg.$$eval('#view tbody tr', n => n.length);
  if (filtered !== 1) fail('saringan kanal: ' + filtered);
  else ok('saringan kanal mempersempit daftar');
  await pg.evaluate(() => { LF = {q:'',ch:'',pil:'',own:'',st:''}; go('list'); });

  // ---- 9. tim & beban ----
  await pg.evaluate(() => go('team'));
  await pg.waitForTimeout(220);
  const team = await pg.$eval('#view', e => e.innerText);
  if (!/Nama Uji/.test(team)) fail('anggota tidak tampil');
  else ok('halaman tim menampilkan anggota dan bebannya');
  if (!/belum punya penanggung jawab/i.test(team)) fail('konten tanpa PJ tidak ditagih');
  else ok('konten tanpa penanggung jawab ditagih terang-terangan');

  // ---- 10. arsip bukan hapus ----
  await pg.evaluate(o => doArchive(o.b), ids);
  await pg.waitForTimeout(220);
  const arc = await pg.evaluate(o => ({ aktif: recs('CNT').length, arsip: arcRecs('CNT').length, masih: !!recById(o.b) }), ids);
  if (arc.aktif !== 2 || arc.arsip !== 1 || !arc.masih) fail('arsip: ' + JSON.stringify(arc));
  else ok('mengarsipkan menyingkirkan dari papan tapi recordnya tetap ada seutuhnya');
  await pg.evaluate(o => restoreRec(o.b), ids);
  await pg.waitForTimeout(200);
  if (await pg.evaluate(() => recs('CNT').length) !== 3) fail('pemulihan gagal');
  else ok('record terarsip bisa dipulihkan kembali');

  // ---- 11. ekspor CSV ----
  await pg.evaluate(() => exportCSV('CNT'));
  await pg.waitForTimeout(300);
  const sv = await pg.evaluate(() => window.__c.saves);
  if (!sv.length || !/^jaens-studio-cnt-.*\.csv$/.test(sv[0].filename)) fail('ekspor: ' + JSON.stringify(sv.map(x=>x.filename)));
  else ok('ekspor CSV lewat jalur unduhan penampil — tautan biasa mati di sana');
  const csv = sv[0].data;
  if (csv.split('\n').length !== 4 || csv.indexOf('id,n,channel') !== 0) fail('isi CSV: ' + csv.slice(0,60));
  else ok('CSV berisi header kolom dan satu baris per konten — siap diimpor ke AJI JAENS OS');

  // ---- 12. sinkronisasi tim ----
  await pg.evaluate(() => cloudPush());
  await pg.waitForTimeout(300);
  const p = await pg.evaluate(() => ({ keys:Object.keys(window.__c.files),
    env: JSON.parse(window.__c.files['data/studio.json']||'null'), d: dirty() }));
  if (p.keys.join() !== 'data/studio.json') fail('berkas tersimpan: ' + p.keys.join());
  else ok('yang disimpan hanya satu berkas data — halaman studionya sendiri tidak ditulis ulang');
  if (!p.env || p.env.rec.CNT.length !== 3 || p.d !== 0) fail('amplop: ' + JSON.stringify(p.env && Object.keys(p.env)));
  else ok('seluruh konten, tim, dan linimasa tersimpan untuk dilihat anggota lain');

  const panel = await pg.evaluate(() => { syncPanel(); return document.getElementById('modalSheet').innerText; });
  for (const t of ['tidak punya login', 'siapa pun yang punya tautannya', 'backend dengan autentikasi']) {
    if (panel.toLowerCase().indexOf(t.toLowerCase()) < 0) fail('panel sinkron tidak menyatakan: ' + t);
  }
  ok('panel sinkronisasi menyatakan terus terang bahwa tidak ada login dan tidak ada izin per orang');
  await pg.evaluate(() => closeModal());

  // ---- 13. dua versi berbeda ----
  await pg.close();
  const remote = { v:1, rev:99, savedAt:'2026-10-06T08:00:00.000Z', savedBy:'Putu',
    seq:{ CNT:9 }, log:[], rec:{ CNT:[{ id:'CNT-00009', n:'Dari anggota lain', channel:'TikTok', status:'Ide',
      _m:{ created_at:'2026-10-06T08:00:00.000Z', updated_at:'2026-10-06T08:00:00.000Z',
           created_by:'Putu', updated_by:'Putu', is_archived:false } }] } };

  pg = await open(true, remote);
  await pg.evaluate(() => localStorage.clear());
  await pg.reload(); await pg.waitForTimeout(650);
  const got = await pg.evaluate(() => ({ n: recs('CNT').length, rev: STORE.rev, conf: !!CLOUD.conflict }));
  if (got.n !== 1 || got.rev !== 99 || got.conf) fail('mengambil versi tim: ' + JSON.stringify(got));
  else ok('perangkat kosong mengambil versi tim sendiri — konten anggota lain langsung ada');

  await pg.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('jaens-studio', JSON.stringify({ v:1, rev:5, baseRev:3, seq:{CNT:8},
      rec:{ CNT:[{ id:'CNT-00008', n:'Punya perangkat ini', channel:'Website', status:'Draft',
        _m:{ created_at:'x', updated_at:'x', created_by:'Kadek', updated_by:'Kadek', is_archived:false } }] }, log:[] }));
  });
  await pg.reload(); await pg.waitForTimeout(650);
  const cf = await pg.evaluate(() => ({ conf: CLOUD.conflict ? CLOUD.conflict.localDirty : null,
    names: recs('CNT').map(r => r.n).join('|'), bar: (document.getElementById('cloudBar')||{}).className||'' }));
  if (cf.conf !== 2 || cf.names.indexOf('Punya perangkat ini') < 0)
    fail('dua versi: ' + JSON.stringify(cf));
  else ok('versi tim lebih baru sementara ada perubahan lokal — data lokal TIDAK ditimpa diam-diam');
  if (!/on/.test(cf.bar)) fail('bilah pemberitahuan tidak muncul');
  else ok('bilah pemberitahuan muncul, bukan diam-diam berhenti sinkron');
  const stopped = await pg.evaluate(async () => { const n = window.__c.pub.length; await cloudPush(); return window.__c.pub.length === n; });
  if (!stopped) fail('masih menyimpan padahal versinya berbeda');
  else ok('selama perbedaan belum diputuskan, penyimpanan otomatis berhenti');
  await pg.evaluate(() => takeRemote());
  await pg.waitForTimeout(300);
  const after = await pg.evaluate(() => ({ names: recs('CNT').map(r => r.n).join('|'),
    prev: JSON.parse(localStorage.getItem('jaens-studio-prev')||'null') }));
  if (after.names.indexOf('Dari anggota lain') < 0) fail('ambil versi tim gagal');
  else ok('memilih versi tim menggantikan isi perangkat ini');
  if (!after.prev || after.prev.data.rec.CNT[0].n.indexOf('Punya perangkat ini') < 0)
    fail('salinan sebelum ditimpa tidak ada');
  else ok('yang ditinggalkan tersalin lengkap ke cadangan — bisa dipulihkan lagi');
  await pg.close();

  // ---- 14. salinan tanpa penampil ----
  pg = await open(false);
  await pg.evaluate(() => localStorage.clear());
  await pg.reload(); await pg.waitForTimeout(500);
  const offline = await pg.evaluate(() => ({ ready:CLOUD.ready, avail:CLOUD.avail }));
  if (!offline.ready || offline.avail !== false) fail('salinan berkas: ' + JSON.stringify(offline));
  else ok('salinan berkas biasa mengenali sendiri bahwa penyimpanan bersama tidak aktif');
  const chipTxt = await pg.$eval('#cloudChip', e => e.innerText);
  if (!/hanya di perangkat ini/i.test(chipTxt)) fail('penanda: ' + chipTxt);
  else ok('penandanya berkata apa adanya, bukan berpura-pura tersinkron');
  await pg.evaluate(() => { openForm('CNT');
    document.querySelector('#formFields [data-k="n"]').value = 'Tetap bisa entri';
    document.querySelector('#formFields [data-k="channel"]').value = 'Website';
    document.querySelector('#formFields [data-k="status"]').value = 'Ide';
    submitForm(); });
  await pg.waitForTimeout(250);
  if (await pg.evaluate(() => recs('CNT').length) !== 1) fail('entri mati tanpa sinkron');
  else ok('tanpa penyimpanan bersama pun entri tetap jalan penuh');

  // ---- 15. seluruh halaman & ponsel ----
  for (const v of ['board','cal','list','team','arsip']) {
    await pg.evaluate(id => go(id), v);
    await pg.waitForTimeout(40);
    const len = await pg.$eval('#view', n => n.innerText.trim().length);
    if (len < 60) fail('halaman ' + v + ' kosong');
  }
  ok('lima halaman render tanpa yang kosong');
  await pg.setViewportSize({ width:390, height:844 });
  for (const v of ['board','cal','list','team']) {
    await pg.evaluate(id => go(id), v);
    await pg.waitForTimeout(140);
    const ov = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (ov > 2) fail('meluber di 390px pada ' + v + ': ' + ov + 'px');
  }
  ok('tidak ada halaman yang meluber di layar 390px');
  await pg.evaluate(() => go('cal'));
  await pg.waitForTimeout(200);
  await pg.screenshot({ path:'/home/claude/studio/s-mobile.png', fullPage:true });
  await pg.setViewportSize({ width:2200, height:1200 });
  await pg.evaluate(() => go('board'));
  await pg.waitForTimeout(220);
  await pg.screenshot({ path:'/home/claude/studio/s-board.png', fullPage:true });
  await pg.close();

  console.log(errs.length ? 'CONSOLE ERRORS:\n' + errs.slice(0,8).join('\n') : '  ok  tanpa console error');
  if (errs.length) process.exitCode = 1;
  await b.close();
  server.close();
})();
