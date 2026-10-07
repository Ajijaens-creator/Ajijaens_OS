/* Uji NP-V02 — tujuh butir pengujian paket + ketahanan data. */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const URL = 'http://127.0.0.1:8096/AJI-JAENS-OS-LIVE.html';
let pass = 0, fail = 0;
const ok  = m => { pass++; console.log('  ok  ' + m); };
const bad = m => { fail++; console.log('  GAGAL  ' + m); };

(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport:{width:1600,height:1100} });
  const errs = [];
  pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(URL, { waitUntil:'load' });
  await pg.evaluate(() => { try{ localStorage.clear(); }catch(e){} });
  await pg.reload({ waitUntil:'load' });
  await pg.waitForTimeout(1600);
  const ev = (f, a) => (a === undefined ? pg.evaluate(f) : pg.evaluate(f, a));

  /* 0. Draft program pertama ter-seed, sekali saja */
  let r = await ev(() => {
    const p = recs('PRG')[0], m = recs('MOD');
    np02Seed(); np02Seed();            // dipanggil ulang — harus idempoten
    return { prg: recs('PRG').length, mod: recs('MOD').length,
             n: p && p.n, st: p && p.st, target: p && p.target,
             total: p ? planTotal(p) : 0, delta: p ? planDelta(p) : null,
             items: p ? p._m.plan.length : 0,
             needs: (JSON.stringify(p) + JSON.stringify(m)).split('KEBUTUHAN BAHAN').length - 1 };
  });
  (r.prg === 1 && r.mod === 3 && r.st === 'Draft' && r.needs >= 3)
    ? ok('0. Draft program pertama dibuat sekali (dipanggil 2x tetap ' + r.prg + ' program, ' + r.mod + ' modul), status Draft, ' + r.needs + ' slot ditandai KEBUTUHAN BAHAN')
    : bad('0. Seed: ' + JSON.stringify(r));

  /* 4. Total durasi benar dan tidak dihitung dua kali */
  (r.total === 120 && r.target === 150 && r.delta === -30 && r.items === 8)
    ? ok('4. Durasi: 8 item = 120 menit dari target 150 → selisih −30. Modul tidak dihitung dua kali.')
    : bad('4. Durasi: ' + JSON.stringify({t:r.total, tg:r.target, d:r.delta, i:r.items}));

  /* 1. Bahan langsung dan bahan dari sumber */
  r = await ev(() => {
    openForm('BHN');
    document.querySelector('#formFields [data-k="n"]').value = 'UJI Bahan langsung';
    document.querySelector('#formFields [data-k="msg"]').value = 'Dibuat tanpa sumber apa pun.';
    document.querySelector('#formFields [data-k="kind"]').value = 'Cerita';
    submitForm();
    const direct = recs('BHN')[0];
    openForm('LRN');
    document.querySelector('#formFields [data-k="n"]').value = 'UJI Sumber';
    document.querySelector('#formFields [data-k="note"]').value = 'Catatan sumber.';
    document.querySelector('#formFields [data-k="lesson"]').value = 'Pelajaran dari sumber.';
    submitForm();
    const l = recs('LRN')[0];
    npMakeMaterial(l.id);
    document.querySelectorAll('.npPick').forEach(c => c.checked = true);
    npBuildMaterial(l.id);
    document.querySelector('#formFields [data-k="msg"]').value = 'Dari sumber Learn.';
    submitForm();
    const fromSrc = recs('BHN')[0];
    return { directSrc: [direct.learn, direct.prak, direct.knw, direct.cnt].filter(Boolean).length,
             directId: direct.id, fromId: fromSrc.id, fromLearn: fromSrc.learn === l.id,
             kinds: SCHEMA.BHN.f.find(x => x.k === 'kind').opt.length,
             hasMedia: !!SCHEMA.BHN.f.find(x => x.k === 'media') };
  });
  (r.directSrc === 0 && r.fromLearn && r.kinds === 8 && r.hasMedia)
    ? ok('1. Bahan langsung (tanpa sumber) dan bahan dari Learn dua-duanya dibuat; 8 jenis bahan; kolom Media ada')
    : bad('1. Bank Bahan: ' + JSON.stringify(r));

  /* 2. Satu modul dipakai di dua program */
  r = await ev(() => {
    const m = recs('MOD').find(x => x.n.indexOf('Melihat Masalah') === 0);
    const p1 = recs('PRG')[0];
    openForm('PRG');
    document.querySelector('#formFields [data-k="n"]').value = 'UJI Program Kedua';
    document.querySelector('#formFields [data-k="target"]').value = '60';
    submitForm();
    const p2 = recs('PRG').find(x => x.n === 'UJI Program Kedua');
    prgAddMod(p2.id, m.id);
    const used = recs('PRG').filter(p => planMods(p).some(x => x.id === m.id));
    return { mid:m.id, p1:p1.id, p2:p2.id, usedIn: used.length,
             p1dur: planTotal(recById(p1.id)), p2dur: planTotal(recById(p2.id)), mdur: Number(m.dur) };
  });
  (r.usedIn === 2 && r.p2dur === r.mdur)
    ? ok('2. Satu modul dipakai di 2 program; durasi program kedua = ' + r.p2dur + ' menit (durasi modulnya sendiri)')
    : bad('2. Modul lintas program: ' + JSON.stringify(r));
  const MID = r.mid, P1 = r.p1, P2 = r.p2;

  /* 3. Melepas hubungan tidak menghapus sumber */
  r = await ev(ids => {
    const beforeMods = recs('MOD').length;
    const p2 = recById(ids.P2);
    const i = p2._m.plan.findIndex(x => x.k === 'mod' && x.id === ids.MID);
    prgDropGo(ids.P2, i);
    const m = recById(ids.MID);
    const p1 = recById(ids.P1);
    return { modAlive: !!m, modCount: recs('MOD').length, beforeMods,
             p2has: planMods(recById(ids.P2)).length,
             p1StillHas: planMods(p1).some(x => x.id === ids.MID) };
  }, { MID, P1, P2 });
  (r.modAlive && r.modCount === r.beforeMods && r.p2has === 0 && r.p1StillHas)
    ? ok('3. Modul dilepas dari program kedua; modulnya tetap ada dan tetap dipakai program pertama')
    : bad('3. Lepas hubungan: ' + JSON.stringify(r));

  /* 5. Versi lama tidak berubah diam-diam */
  r = await ev(ids => {
    const p = recById(ids.P1);
    prgPin(ids.P1);
    const pinned = planMods(recById(ids.P1)).find(x => x.id === ids.MID);
    const verBefore = pinned.ver, snapBefore = JSON.parse(JSON.stringify(pinned.snap));
    const totalBefore = planTotal(recById(ids.P1));
    openForm('MOD', ids.MID);
    document.querySelector('#formFields [data-k="n"]').value = 'Melihat Masalah sebagai Peluang (REVISI)';
    document.querySelector('#formFields [data-k="dur"]').value = '45';
    submitForm();
    const m = recById(ids.MID);
    const after = planMods(recById(ids.P1)).find(x => x.id === ids.MID);
    return { verBefore, verAfter: modVer(m), pinnedVer: after.ver,
             snapName: after.snap.n, liveName: m.n,
             snapDur: after.snap.dur, liveDur: Number(m.dur),
             totalBefore, totalAfter: planTotal(recById(ids.P1)),
             staleFlag: prgStale(recById(ids.P1)).length };
  }, { MID, P1 });
  (r.verAfter > r.verBefore && r.pinnedVer === r.verBefore &&
   r.snapName !== r.liveName && r.snapDur !== r.liveDur &&
   r.totalAfter === r.totalBefore && r.staleFlag === 1)
    ? ok('5. Modul direvisi ke v' + r.verAfter + ' (durasi ' + r.snapDur + '→' + r.liveDur + '); program tetap memakai v' + r.pinnedVer + ', total tetap ' + r.totalAfter + ' menit, ditandai 1 modul berubah')
    : bad('5. Sematan versi: ' + JSON.stringify(r));

  /* 6. Status siap menampilkan kekurangan */
  r = await ev(ids => {
    const p = recById(ids.P1);
    const c = prgChecks(p);
    const gaps = c.filter(x => !x.ok);
    const before = p.st;
    prgReady(ids.P1);                     // harus DITOLAK karena masih ada kekurangan
    const after = recById(ids.P1).st;
    const mods = planMods(p).map(x => recById(x.id)).filter(Boolean);
    const mc = modChecks(mods[0]);
    return { total:c.length, gaps: gaps.length, gapText: gaps.map(x => x.t + (x.sub ? ' — ' + x.sub : '')),
             allClickable: gaps.every(x => !!x.a), stBefore: before, stAfter: after,
             modGaps: mc.filter(x => !x.ok).length };
  }, { P1 });
  (r.gaps > 0 && r.allClickable && r.stAfter === r.stBefore)
    ? ok('6. ' + r.gaps + ' dari ' + r.total + ' kesiapan belum terpenuhi, semuanya bisa diketuk; "Siap Digunakan" DITOLAK — status tetap ' + r.stAfter)
    : bad('6. Kesiapan: ' + JSON.stringify(r));
  console.log('        kekurangan terbaca: ' + r.gapText.slice(0,3).join(' | '));

  /* 6b. Izin bahan dipisah dari peninjauan isi */
  r = await ev(ids => {
    const m = recById(ids.MID);
    const bhn = recs('BHN')[0];
    npAddLink(m.id, bhn.id);
    openForm('BHN', bhn.id);
    document.querySelector('#formFields [data-k="st"]').value = 'Disetujui';
    document.querySelector('#formFields [data-k="perm"]').value = 'Tidak boleh dibagikan';
    submitForm();
    const mc = modChecks(recById(ids.MID));
    const izin = mc.find(x => x.t.indexOf('Izin') === 0);
    return { bhnSt: recById(bhn.id).st, bhnPerm: recById(bhn.id).perm, izinOk: izin ? izin.ok : null };
  }, { MID });
  (r.bhnSt === 'Disetujui' && r.izinOk === false)
    ? ok('6b. Bahan berstatus "Disetujui" tetapi izin "Tidak boleh dibagikan" → kesiapan modul tetap GAGAL. Dua hal itu memang dipisah.')
    : bad('6b. Pemisahan izin: ' + JSON.stringify(r));

  /* 7. Data bertahan setelah dibuka kembali */
  const snap = await ev(ids => ({
    prg: recs('PRG').length, mod: recs('MOD').length, bhn: recs('BHN').length,
    total: planTotal(recById(ids.P1)), pinned: planMods(recById(ids.P1)).filter(x => x.ver).length
  }), { P1 });
  await pg.reload({ waitUntil:'load' });
  await pg.waitForTimeout(1600);
  r = await ev(ids => ({
    prg: recs('PRG').length, mod: recs('MOD').length, bhn: recs('BHN').length,
    total: planTotal(recById(ids.P1)), pinned: planMods(recById(ids.P1)).filter(x => x.ver).length
  }), { P1 });
  (JSON.stringify(r) === JSON.stringify(snap))
    ? ok('7. Setelah halaman dimuat ulang: ' + r.prg + ' program, ' + r.mod + ' modul, ' + r.bhn + ' bahan, total ' + r.total + ' menit, ' + r.pinned + ' sematan — semuanya bertahan')
    : bad('7. Ketahanan data: ' + JSON.stringify({sebelum:snap, sesudah:r}));

  /* tampilan: empat sub-tab Share + detail program, tiga ukuran layar */
  for (const [w,h2,label] of [[1600,1100,'desktop'],[1024,1366,'iPad'],[390,844,'ponsel']]) {
    await pg.setViewportSize({ width:w, height:h2 });
    let worst = 0, empty = [];
    await ev(() => knTab('bhn'));
    for (const t of ['ov','bank','mod','prg']) {
      await ev(k => shTab(k), t); await pg.waitForTimeout(130);
      const o = await pg.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      const len = (await pg.innerText('body')).length;
      if (o > worst) worst = o;
      if (len < 400) empty.push(t);
    }
    for (const t of ['sum','mod','run','bah','sia','riw']) {
      await ev(a => prgOpen(a.id, a.t), { id:P1, t }); await pg.waitForTimeout(130);
      const o = await pg.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      const len = (await pg.innerText('body')).length;
      if (o > worst) worst = o;
      if (len < 400) empty.push('prg:' + t);
    }
    (worst <= 2 && !empty.length)
      ? ok('Tampilan ' + label + ' (' + w + 'px): 4 sub-tab Share + 6 tab program terisi, tidak meluber')
      : bad('Tampilan ' + label + ': luber ' + worst + 'px, kosong: ' + empty.join(','));
  }

  const mods = await ev(() => { const o=[]; NAV.forEach(m => { try{ go(m.id); o.push(m.id+':ok'); }catch(e){ o.push(m.id+':ERR '+e.message); } }); return o; });
  mods.every(x => x.endsWith(':ok')) ? ok('Navigasi: ' + mods.length + ' modul tetap berfungsi')
    : bad('Modul rusak: ' + mods.filter(x => !x.endsWith(':ok')).join(', '));
  errs.length ? bad('Error: ' + errs.slice(0,3).join(' | ')) : ok('Tanpa error JavaScript sepanjang pengujian');

  console.log('\n' + pass + ' lulus, ' + fail + ' gagal');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
