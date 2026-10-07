/* Uji 12 kriteria penerimaan NP-01, bagian 16.
   Dijalankan pada berkas hasil build lewat HTTP (file:// tidak bisa fetch). */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const URL = 'http://127.0.0.1:8096/AJI-JAENS-OS-LIVE.html';

let pass = 0, fail = 0;
const ok   = m => { pass++; console.log('  ok  ' + m); };
const bad  = m => { fail++; console.log('  GAGAL  ' + m); };

(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport:{width:1600,height:1100} });
  const errs = [];
  pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(URL, { waitUntil:'load' });
  await pg.waitForTimeout(1500);

  // data uji terpisah: namespace localStorage dibersihkan lebih dulu
  await pg.evaluate(() => { try{ localStorage.clear(); }catch(e){} });

  const ev = (f, arg) => (arg === undefined ? pg.evaluate(f) : pg.evaluate(f, arg));

  /* 1. Membuat Learn, menyimpan, membukanya kembali */
  let r = await ev(() => {
    openForm('LRN');
    document.querySelector('#formFields [data-k="n"]').value   = 'UJI Buku Deep Work';
    document.querySelector('#formFields [data-k="note"]').value = 'Blok waktu tanpa gangguan.';
    submitForm();
    const l = recs('LRN')[0];
    return { id:l && l.id, n:l && l.n, found: !!recById(l && l.id) };
  });
  (r.id && /^LRN-\d{6}$/.test(r.id) && r.n === 'UJI Buku Deep Work' && r.found)
    ? ok('1. Learn dibuat, tersimpan, dan ditemukan kembali — ' + r.id)
    : bad('1. Learn: ' + JSON.stringify(r));
  const L1 = r.id;

  /* 2. Mengedit tanpa membuat duplikat */
  r = await ev(id => {
    const before = recs('LRN').length;
    openForm('LRN', id);
    document.querySelector('#formFields [data-k="lesson"]').value = 'Konteks mahal; lindungi blok pagi.';
    submitForm();
    return { before, after: recs('LRN').length, lesson: recById(id).lesson };
  }, L1);
  (r.before === r.after && r.lesson.indexOf('Konteks mahal') === 0)
    ? ok('2. Edit tersimpan tanpa duplikat (' + r.before + ' → ' + r.after + ')')
    : bad('2. Edit: ' + JSON.stringify(r));

  /* 3. Learn → Do, hubungan dua arah */
  r = await ev(id => {
    recById(id).apply = 'Coba dua pekan di Jaens Spa.';
    npOpenPractice(id);
    submitForm();
    const p = recs('PRK')[0];
    const back = backlinks(id).some(g => g.items.some(x => x.id === p.id));
    const fwd  = forwardLinks(p).some(x => x.id === id);
    return { pid:p.id, learnField:p.learn, srcId:p._m.source_id, back, fwd, srcType:p._m.source_type };
  }, L1);
  (r.learnField === L1 && r.srcId === L1 && r.back && r.fwd)
    ? ok('3. Learn → Do dua arah — ' + r.pid + ' (kolom rel + source_id, backlink ✓, forward ✓)')
    : bad('3. Dua arah: ' + JSON.stringify(r));
  const P1 = r.pid;

  /* 4. Do langsung tanpa Learn */
  r = await ev(() => {
    openForm('PRK');
    document.querySelector('#formFields [data-k="n"]').value   = 'UJI Rapat tanpa agenda';
    document.querySelector('#formFields [data-k="note"]').value = 'Pengalaman langsung, tidak dari bacaan.';
    submitForm();
    const p = recs('PRK')[0];
    return { id:p.id, learn:p.learn || '', src:p._m.source_id || '' };
  });
  (r.id && !r.learn && !r.src)
    ? ok('4. Do dibuat langsung tanpa sumber Learn — ' + r.id)
    : bad('4. Do mandiri: ' + JSON.stringify(r));
  const P2 = r.id;

  /* 5. Tindakan, hasil, refleksi tersimpan di kolom terpisah */
  r = await ev(id => {
    openForm('PRK', id);
    document.querySelector('#formFields [data-k="act"]').value  = 'Blok 2 jam, notifikasi mati.';
    document.querySelector('#formFields [data-k="res"]').value  = 'Dua dari sepuluh hari gagal.';
    document.querySelector('#formFields [data-k="refl"]').value = 'Hambatannya rapat pagi, bukan niat.';
    document.querySelector('#formFields [data-k="st"]').value   = 'Direfleksikan';
    submitForm();
    const p = recById(id);
    return { act:p.act, res:p.res, refl:p.refl, st:p.st, distinct: p.act !== p.res && p.res !== p.refl };
  }, P1);
  (r.distinct && r.act && r.res && r.refl)
    ? ok('5. Tindakan, hasil, dan refleksi tersimpan terpisah')
    : bad('5. Kolom terpisah: ' + JSON.stringify(r));

  /* 5b. Status tidak mengarang hasil */
  r = await ev(() => {
    openForm('PRK');
    document.querySelector('#formFields [data-k="n"]').value   = 'UJI Status tanpa hasil';
    document.querySelector('#formFields [data-k="note"]').value = 'Cek bahwa status tidak mengisi hasil.';
    document.querySelector('#formFields [data-k="st"]').value   = 'Direfleksikan';
    submitForm();
    const p = recs('PRK')[0];
    return { st:p.st, res:p.res || '', refl:p.refl || '' };
  });
  (r.st === 'Direfleksikan' && !r.res && !r.refl)
    ? ok('5b. Status "Direfleksikan" TIDAK mengarang hasil atau refleksi')
    : bad('5b. Status mengarang isi: ' + JSON.stringify(r));

  /* 6. Bahan Share dari Learn dan dari Do */
  r = await ev(ids => {
    npMakeMaterial(ids.L);
    document.querySelectorAll('.npPick').forEach(c => c.checked = true);
    npBuildMaterial(ids.L);
    document.querySelector('#formFields [data-k="msg"]').value = 'Blok waktu itu keputusan, bukan sisa waktu.';
    submitForm();
    const b1 = recs('BHN')[0];
    npMakeMaterial(ids.P);
    document.querySelectorAll('.npPick').forEach(c => c.checked = true);
    npBuildMaterial(ids.P);
    document.querySelector('#formFields [data-k="n"]').value = 'UJI Bahan dari praktik';
    document.querySelector('#formFields [data-k="msg"]').value = 'Yang gagal bukan niatnya, tapi jadwalnya.';
    submitForm();
    const b2 = recs('BHN')[0];
    return { b1:{id:b1.id, learn:b1.learn, st:b1.st, perm:b1.perm, picked:(b1.picked||'').length},
             b2:{id:b2.id, prak:b2.prak, src:b2._m.source_id} };
  }, { L:L1, P:P1 });
  (r.b1.learn === L1 && r.b1.st === 'Draft' && r.b1.perm === 'Belum diputuskan' && r.b1.picked > 0 && r.b2.prak === P1)
    ? ok('6. Bahan dibuat dari Learn (' + r.b1.id + ') dan dari Do (' + r.b2.id + '), keduanya Draft')
    : bad('6. Bahan: ' + JSON.stringify(r));
  const B1 = r.b1.id;

  /* 7. Catatan internal tidak otomatis menjadi bahan publik */
  r = await ev(ids => {
    openForm('LRN', ids.L);
    document.querySelector('#formFields [data-k="att"]').value = 'RAHASIA-LAMPIRAN-INTERNAL';
    submitForm();
    openForm('PRK', ids.P);
    document.querySelector('#formFields [data-k="ev"]').value = 'RAHASIA-BUKTI-INTERNAL';
    submitForm();
    npMakeMaterial(ids.L);
    document.querySelectorAll('.npPick').forEach(c => c.checked = true);
    const offered = Array.from(document.querySelectorAll('.npPick')).map(c => c.dataset.lab);
    npBuildMaterial(ids.L);
    document.querySelector('#formFields [data-k="n"]').value = 'UJI Bocor?';
    document.querySelector('#formFields [data-k="msg"]').value = 'Cek kebocoran lampiran.';
    submitForm();
    const b = recs('BHN')[0];
    const blob = JSON.stringify(b);
    return { offered, leak: blob.indexOf('RAHASIA') !== -1, inote: b.inote || '' };
  }, { L:L1, P:P1 });
  (!r.leak && !r.inote && r.offered.indexOf('Lampiran') === -1)
    ? ok('7. Lampiran dan catatan internal TIDAK ikut ke bahan — yang ditawarkan hanya: ' + r.offered.join(', '))
    : bad('7. Kebocoran ke bahan: ' + JSON.stringify(r));

  /* 8. Arsip sumber tidak menghapus turunannya */
  r = await ev(ids => {
    const beforePRK = recs('PRK').length, beforeBHN = recs('BHN').length;
    archiveRec(ids.L);
    const src = recById(ids.L);
    const p = recById(ids.P), b = recById(ids.B);
    const fwd = forwardLinks(p).find(x => x.id === ids.L);
    return { archived: src._m.is_archived, prkAlive: !!p, bhnAlive: !!b,
             prkCount: recs('PRK').length, bhnCount: recs('BHN').length,
             beforePRK, beforeBHN, flagged: !!(fwd && fwd.archived) };
  }, { L:L1, P:P1, B:B1 });
  (r.archived && r.prkAlive && r.bhnAlive && r.prkCount === r.beforePRK && r.bhnCount === r.beforeBHN && r.flagged)
    ? ok('8. Sumber diarsipkan; turunannya utuh dan relasinya diberi tanda "diarsipkan"')
    : bad('8. Arsip: ' + JSON.stringify(r));
  await ev(id => restoreRec(id), L1);

  /* 9. Catatan Knowledge lama tetap ditemukan */
  r = await ev(() => {
    openForm('KNW');
    document.querySelector('#formFields [data-k="n"]').value = 'UJI Catatan lama';
    document.querySelector('#formFields [data-k="cat"]').value = 'Personal';
    document.querySelector('#formFields [data-k="summary"]').value = 'Record KNW gaya lama.';
    submitForm();
    const k = recs('KNW')[0];
    knTab('old');
    const listed = document.body.innerText.indexOf('UJI Catatan lama') !== -1;
    npPromote(k.id);
    submitForm();
    const l = recs('LRN')[0];
    const kStill = recById(k.id);
    npPromote(k.id);
    const twice = recs('LRN').filter(x => x._m.source_id === k.id).length;
    return { kid:k.id, listed, promoted:l.id, kStillThere: !!kStill, kIdSame: kStill.id === k.id,
             kContent: kStill.summary, dupes: twice };
  });
  (r.listed && r.kStillThere && r.kIdSame && r.dupes === 1)
    ? ok('9. Catatan lama tetap tampil, ID dan isinya utuh, salinan tidak menggandakan (dipanggil 2x → ' + r.dupes + ' salinan)')
    : bad('9. Catatan lama: ' + JSON.stringify(r));

  /* 10. Kegagalan simpan ditampilkan */
  r = await ev(() => {
    openForm('LRN');
    document.querySelector('#formFields [data-k="n"]').value = '';
    const before = recs('LRN').length;
    submitForm();
    const bad = document.querySelectorAll('#formFields .fld.bad').length;
    const toastOn = document.getElementById('toast').classList.contains('on');
    return { before, after: recs('LRN').length, bad, toastOn,
             msg: document.getElementById('toast').textContent };
  });
  (r.before === r.after && r.bad > 0 && r.toastOn)
    ? ok('10. Isian wajib kosong ditolak, ' + r.bad + ' kolom ditandai, pesan: "' + r.msg + '" — tidak ada yang disimpan')
    : bad('10. Validasi: ' + JSON.stringify(r));
  await ev(() => closeModal());

  /* 11. Sumber berubah → bahan ditandai, tidak diubah diam-diam */
  r = await ev(ids => {
    const b = recById(ids.B);
    const beforePicked = b.picked;
    const beforeFlag = npSrcChanged(b);
    openForm('LRN', ids.L);
    document.querySelector('#formFields [data-k="lesson"]').value = 'DIUBAH setelah bahan dibuat.';
    submitForm();
    const after = recById(ids.B);
    return { beforeFlag, afterFlag: npSrcChanged(after), unchanged: after.picked === beforePicked };
  }, { L:L1, B:B1 });
  (!r.beforeFlag && r.afterFlag && r.unchanged)
    ? ok('11. Sumber berubah → bahan ditandai "tinjau kembali"; isinya TIDAK diubah diam-diam')
    : bad('11. Cap sumber: ' + JSON.stringify(r));

  /* 12. Saran berbasis aturan punya alasan yang dapat dibaca */
  r = await ev(() => {
    const s = npSuggest();
    return { n:s.length, allHaveWhy: s.every(x => x.w && x.w.length > 10), sample: s.slice(0,2).map(x=>x.w) };
  });
  (r.n > 0 && r.allHaveWhy)
    ? ok('12. ' + r.n + ' saran, semuanya menyertakan alasan — contoh: "' + r.sample[0] + '"')
    : bad('12. Saran: ' + JSON.stringify(r));

  /* tampilan: tiga ukuran layar, lima tab */
  for (const [w,h2,label] of [[1600,1100,'desktop'],[1024,1366,'iPad'],[390,844,'ponsel']]) {
    await pg.setViewportSize({ width:w, height:h2 });
    let worst = 0, empty = [];
    for (const t of ['ov','lrn','prk','bhn','old']) {
      await ev(k => knTab(k), t);
      await pg.waitForTimeout(140);
      const o = await pg.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      const len = (await pg.innerText('body')).length;
      if (o > worst) worst = o;
      if (len < 400) empty.push(t);
    }
    (worst <= 2 && !empty.length)
      ? ok('Tampilan ' + label + ' (' + w + 'px): lima tab terisi, tidak meluber')
      : bad('Tampilan ' + label + ': luber ' + worst + 'px, tab kosong: ' + empty.join(','));
  }

  /* modul lain tetap jalan */
  const mods = await ev(() => {
    const out = [];
    NAV.forEach(m => { try { go(m.id); out.push(m.id + ':ok'); } catch(e){ out.push(m.id + ':ERR ' + e.message); } });
    return out;
  });
  mods.every(x => x.endsWith(':ok'))
    ? ok('Navigasi: ' + mods.length + ' modul tetap berfungsi')
    : bad('Modul rusak: ' + mods.filter(x => !x.endsWith(':ok')).join(', '));

  errs.length ? bad('Console/page error: ' + errs.slice(0,3).join(' | '))
              : ok('Tanpa error JavaScript sepanjang pengujian');

  console.log('\n' + pass + ' lulus, ' + fail + ' gagal');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
