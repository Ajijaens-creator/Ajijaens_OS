const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const URL = 'http://127.0.0.1:8095/test/portal-uji.html';
let pass=0, fail=0;
const ok  = m => { pass++; console.log('  ok  '+m); };
const bad = m => { fail++; console.log('  GAGAL  '+m); };

(async () => {
  const b = await chromium.launch(); const errs=[];
  async function buka(opts){
    const o = opts||{};
    const pg = await b.newPage({viewport:o.vp||{width:390,height:844}});
    pg.on('pageerror', e => errs.push(e.message));
    await pg.addInitScript(cfg => {
      window.__PERAN_UJI = null;
      window.__TANPA_PROFIL = cfg.tanpaProfil;
      window.__MASUK_UJI = cfg.masuk;
      window.__PROFIL_SAYA = cfg.profil || null;
    }, { tanpaProfil: !!o.tanpaProfil, masuk: !!o.masuk, profil: o.profil || null });
    await pg.goto(URL + (o.cari || ''),{waitUntil:'load'});
    await pg.waitForTimeout(500);
    return pg;
  }

  /* --- pembuka --- */
  let pg = await buka({tanpaProfil:true});
  let r = await pg.evaluate(() => {
    const s = document.getElementById('l-pembuka');
    return { tampil: !s.hidden, skrip: document.querySelector('.skrip').textContent,
      judul: document.querySelector('.sampul h1').textContent,
      slotFoto: /belum tersedia/.test(document.querySelector('.ganti-foto').textContent),
      adaTombolMasuk: !!document.getElementById('keMasuk'),
      adaProfilPembicara: /Aji Jaens Suputtra/.test(document.body.innerText) };
  });
  (r.tampil && /Life by Design/.test(r.skrip) && /Hospitality Skills/.test(r.judul) && r.adaTombolMasuk && r.adaProfilPembicara)
    ? ok('Pembuka: tulisan emas "Life by Design", judul program, profil Aji, tombol masuk')
    : bad('Pembuka: '+JSON.stringify(r));
  r.slotFoto ? ok('Slot foto hospitality dibiarkan kosong, bukan diisi gambar karangan')
             : bad('Slot foto: '+JSON.stringify(r));

  /* --- landing tidak langsung jadi form --- */
  r = await pg.evaluate(() => ({ adaFormDaftar: !document.getElementById('l-daftar').hidden }));
  (!r.adaFormDaftar) ? ok('Halaman pembuka tidak diganti jadi formulir registrasi langsung')
                     : bad('Pembuka jadi form');

  /* --- alur masuk --- */
  await pg.click('#keMasuk'); await pg.waitForTimeout(200);
  await pg.fill('#m-email','bukan-email'); await pg.click('#kirimKode'); await pg.waitForTimeout(200);
  r = await pg.evaluate(() => document.getElementById('i-m-email').classList.contains('salah'));
  r ? ok('Email tidak sah ditolak sebelum dikirim') : bad('Validasi email');
  await pg.fill('#m-email','peserta@contoh.id'); await pg.click('#kirimKode'); await pg.waitForTimeout(400);
  await pg.fill('#m-kode','123456'); await pg.click('#verifKode'); await pg.waitForTimeout(700);
  r = await pg.evaluate(() => ({ daftar: !document.getElementById('l-daftar').hidden,
    ket: (document.getElementById('ketLangkah')||{}).textContent }));
  (r.daftar && /1 dari 3/.test(r.ket)) ? ok('Setelah masuk tanpa profil: langsung ke pendaftaran langkah 1')
                                       : bad('Alur masuk: '+JSON.stringify(r));

  /* --- langkah 1 wajib --- */
  await pg.click('[data-lanjut]'); await pg.waitForTimeout(200);
  r = await pg.evaluate(() => ({
    salah: document.querySelectorAll('#isiDaftar .isian.salah').length,
    kat: !document.getElementById('g-kat').hidden,
    masihL1: /1 dari 3/.test(document.getElementById('ketLangkah').textContent) }));
  (r.salah >= 3 && r.kat && r.masihL1)
    ? ok('Langkah 1 menolak maju: '+r.salah+' isian ditandai dan kategori diminta')
    : bad('Langkah 1: '+JSON.stringify(r));

  /* --- kategori mahasiswa -> langkah 2 pendidikan, bukan usaha --- */
  await pg.fill('#f-nama','Peserta Uji'); await pg.fill('#f-whatsapp','0812000');
  await pg.fill('#f-email','peserta@contoh.id');
  await pg.evaluate(() => { document.querySelector('input[name="kat"][value="Mahasiswa"]').checked = true; });
  await pg.click('[data-lanjut]'); await pg.waitForTimeout(300);
  r = await pg.evaluate(() => {
    const t = document.getElementById('isiDaftar').innerText;
    return { pendidikan: /Profil Pendidikan/.test(t), adaKampus: !!document.getElementById('f-institusi'),
             adaOmzet: !!document.getElementById('f-usaha_omzet'), tidakBerlaku: /tidak berlaku/.test(t) };
  });
  (r.pendidikan && r.adaKampus && !r.adaOmzet && r.tidakBerlaku)
    ? ok('Mahasiswa → langkah 2 menampilkan pendidikan, kolom usaha dinyatakan TIDAK BERLAKU')
    : bad('Kondisional mahasiswa: '+JSON.stringify(r));

  /* --- ganti ke pengusaha -> muncul kolom usaha lengkap --- */
  await pg.click('[data-mundur]'); await pg.waitForTimeout(250);
  await pg.evaluate(() => { document.querySelector('input[name="kat"][value="Pengusaha Pemula"]').checked = true; });
  await pg.click('[data-lanjut]'); await pg.waitForTimeout(300);
  r = await pg.evaluate(() => {
    const t = document.getElementById('isiDaftar').innerText;
    const omzet = [...document.querySelectorAll('#f-usaha_omzet option')].map(o=>o.textContent);
    return { usaha: /Profil Usaha/.test(t), omzetOpsi: omzet.length,
      adaBelumBersedia: omzet.includes('Belum bersedia mengisi'),
      adaBelumMenghasilkan: omzet.includes('Belum menghasilkan'),
      bentuk: [...document.querySelectorAll('#f-usaha_bentuk option')].length,
      sebelumBiaya: /sebelum biaya/.test(t), bukanTeraudit: /bukan angka teraudit/.test(t),
      timJelas: /termasuk pemilik yang ikut bekerja/i.test(t), tidakPublik: /tidak tampil di profil publik/.test(t) };
  });
  (r.usaha && r.omzetOpsi === 9 && r.adaBelumBersedia && r.adaBelumMenghasilkan && r.bentuk === 10 &&
   r.sebelumBiaya && r.bukanTeraudit && r.timJelas && r.tidakPublik)
    ? ok('Pengusaha → 8 rentang omzet + belum bersedia, 9 bentuk usaha, omzet disebut sebelum biaya & bukan teraudit')
    : bad('Kondisional pengusaha: '+JSON.stringify(r));

  /* --- langkah 3: consent terpisah, tidak tercentang otomatis --- */
  await pg.fill('#f-usaha_nama','Usaha Uji');
  await pg.click('[data-lanjut]'); await pg.waitForTimeout(300);
  r = await pg.evaluate(() => {
    const c = [...document.querySelectorAll('[data-setuju]')];
    return { jumlah: c.length, adaYangTercentang: c.some(x=>x.checked),
      kode: c.map(x=>x.dataset.setuju),
      tidakSyarat: /tidak memengaruhi materi yang Anda terima/.test(document.body.innerText) };
  });
  (r.jumlah === 3 && !r.adaYangTercentang && r.tidakSyarat)
    ? ok('Langkah 3: '+r.jumlah+' persetujuan terpisah ('+r.kode.join(', ')+'), tidak satu pun tercentang otomatis')
    : bad('Consent: '+JSON.stringify(r));

  /* --- tanpa consent kegiatan: ditolak --- */
  await pg.click('[data-simpan]'); await pg.waitForTimeout(300);
  r = await pg.evaluate(() => ({ galat: !document.getElementById('g-setuju').hidden,
    masihDaftar: !document.getElementById('l-daftar').hidden,
    pesan: document.getElementById('g-setuju').textContent }));
  (r.galat && r.masihDaftar && /tetap bebas/.test(r.pesan))
    ? ok('Tanpa persetujuan kegiatan: pendaftaran ditolak, dan dijelaskan dua pilihan lain tetap bebas')
    : bad('Consent wajib: '+JSON.stringify(r));

  /* --- selesaikan pendaftaran --- */
  await pg.evaluate(() => { document.querySelector('[data-setuju="kegiatan"]').checked = true; });
  await pg.click('[data-simpan]'); await pg.waitForTimeout(900);
  r = await pg.evaluate(() => {
    const DB = window.__STUB.DB;
    return { sesi: !document.getElementById('l-sesi').hidden,
      orang: DB.person.length, usaha: DB.business.length, relasi: DB.business_relationship.length,
      consent: DB.consent.filter(c=>c.person_id && String(c.id).indexOf('x')===0).map(c=>c.purpose+':'+c.diberikan),
      kom: DB.community_membership.length };
  });
  (r.sesi && r.orang === 1 && r.usaha === 4 && r.consent.length === 3)
    ? ok('Pendaftaran tersimpan: 1 orang, usaha baru tercatat, 3 baris persetujuan ('+r.consent.join(' ')+')')
    : bad('Simpan: '+JSON.stringify(r));

  await pg.close();

  /* --- peserta yang SUDAH terdaftar: Sesi Saya versi penuh --- */
  pg = await buka({ masuk:true, profil:'p1' });
  await pg.waitForTimeout(700);

  /* --- Sesi Saya: pernyataan jujur --- */
  r = await pg.evaluate(() => {
    const t = document.getElementById('isiSesi').innerText;
    return { terdaftarBukanHadir: /Terdaftar belum berarti hadir/.test(t),
      bukanDiagnosis: /bukan diagnosis dan bukan peringkat/.test(t),
      bukanPremium: /Bukan Spotify Premium/.test(t),
      terbukaUmum: /terbuka untuk umum/.test(t),
      tanpaKataSandi: /tidak pernah meminta kata sandi/.test(t),
      adaHakData: /Minta penghapusan/.test(t) };
  });
  (r.terdaftarBukanHadir && r.bukanDiagnosis && r.bukanPremium && r.terbukaUmum && r.tanpaKataSandi && r.adaHakData)
    ? ok('Sesi Saya menyatakan terus terang: terdaftar≠hadir, bukan diagnosis, bukan Premium, konten publik, tanpa kata sandi, hak data tersedia')
    : bad('Sesi Saya: '+JSON.stringify(r));

  /* --- p1 SUDAH konfirmasi follow: tombol Spotify terbuka, tapi kliknya tetap disebut klik --- */
  r = await pg.evaluate(() => {
    const a = document.getElementById('keSpotify'), t = document.getElementById('isiSesi').innerText;
    return { terbuka: a.getAttribute('aria-disabled') === null,
             cekTerkunci: document.getElementById('cekIG').disabled,
             bukanBukti: /bukan bukti Anda selesai mendengarkan/.test(t) };
  });
  (r.terbuka && r.cekTerkunci && r.bukanBukti)
    ? ok('Peserta yang sudah konfirmasi: Spotify terbuka, centang dikunci, dan klik disebut bukan bukti mendengarkan')
    : bad('Spotify p1: '+JSON.stringify(r));

  /* --- p2 BELUM konfirmasi: tombol Spotify masih terkunci --- */
  const pg2 = await buka({ masuk:true, profil:'p2' });
  await pg2.waitForTimeout(700);
  r = await pg2.evaluate(() => {
    const a = document.getElementById('keSpotify');
    return { hantu: a.className.indexOf('hantu') !== -1, disabled: a.getAttribute('aria-disabled'),
             tanpaSandi: /tidak pernah meminta kata sandi/.test(document.body.innerText) };
  });
  (r.hantu && r.disabled === 'true' && r.tanpaSandi)
    ? ok('Peserta yang belum konfirmasi: tombol Spotify masih terkunci, dan tidak ada permintaan kata sandi')
    : bad('Spotify p2: '+JSON.stringify(r));
  await pg2.close();

  /* --- Life Circle: null awal, 0 sah --- */
  await pg.click('#bukaLC'); await pg.waitForTimeout(400);
  r = await pg.evaluate(() => {
    const t = document.querySelector('.lapis-kotak').innerText;
    return { aspek: document.querySelectorAll('.lapis-kotak [data-aspek]').length,
      semuaBelum: [...document.querySelectorAll('.lapis-kotak .nilai-lc')].every(x=>/belum dijawab/.test(x.textContent)),
      bedakan: /berbeda dari nilai 0/.test(t), privat: /bukan isinya/.test(t) };
  });
  (r.aspek === 8 && r.semuaBelum && r.bedakan && r.privat)
    ? ok('Life Circle: '+r.aspek+' aspek semua mulai "belum dijawab", dinyatakan berbeda dari nilai 0, hasil privat')
    : bad('Life Circle: '+JSON.stringify(r));

  /* isi satu aspek dengan 0, lewati satu, simpan */
  await pg.evaluate(() => {
    const r0 = document.querySelector('#lc0'); r0.value = '0';
    document.querySelector('[data-set="0"]').click();
    document.querySelector('[data-lewati="1"]').click();
  });
  await pg.click('.lapis-kotak [data-simpan]'); await pg.waitForTimeout(800);
  r = await pg.evaluate(() => {
    const s = window.__STUB.DB.life_circle_score;
    const e = window.__STUB.DB.life_circle_entry[0];
    const a0 = s.find(x=>x.aspek==='Kesehatan & energi'), a1 = s.find(x=>x.aspek==='Keuangan');
    return { nol: a0 && a0.nilai === 0, lewati: a1 && a1.nilai === null, baseline: e && e.baseline,
             jumlah: s.filter(x=>x.entry_id===(e||{}).id).length };
  });
  (r.nol && r.lewati && r.baseline && r.jumlah === 8)
    ? ok('Life Circle tersimpan: nilai 0 tercatat sebagai 0, yang dilewati tercatat NULL, ditandai baseline')
    : bad('Simpan Life Circle: '+JSON.stringify(r));

  /* ================= tautan / QR sesi (?sesi=KODE) ================= */
  await pg.close();

  /* belum masuk: tautan sesi dijelaskan, tidak langsung mendaftarkan */
  pg = await buka({masuk:false, tanpaProfil:true, cari:'?sesi=UJI-2'});
  r = await pg.evaluate(() => ({
    tanda: (document.getElementById('tautanSesi')||{}).hidden === false,
    teks: (document.getElementById('tautanSesi')||{}).innerText || '',
    terdaftar: window.__STUB.DB.session_registration.length
  }));
  (r.tanda && /UJI-2/.test(r.teks) && /tidak memberi akses apa pun/.test(r.teks))
    ? ok('Tautan sesi: dijelaskan di halaman pembuka, dan dinyatakan tidak memberi akses sendiri')
    : bad('Tanda tautan sesi: '+JSON.stringify(r));
  await pg.close();

  /* sesi yang belum pernah diikuti: didaftarkan sekali, kehadiran tidak tersentuh */
  pg = await buka({masuk:true, profil:'p1', cari:'?sesi=UJI-3'});
  await pg.waitForTimeout(1200);
  r = await pg.evaluate(() => ({
    teks: document.getElementById('isiSesi').innerText,
    baris: window.__STUB.DB.session_registration.filter(x => x.sesi_id === 's3' && x.person_id === 'p1').length,
    hadir: window.__STUB.DB.attendance.filter(x => x.sesi_id === 's3').length
  }));
  (r.baris === 1 && /Terdaftar belum berarti hadir/.test(r.teks) && /terdaftar/i.test(r.teks))
    ? ok('Tautan sesi: peserta didaftarkan sekali, dan "terdaftar bukan hadir" dikatakan')
    : bad('Gabung sesi: '+JSON.stringify(r).slice(0,300));
  (r.hadir === 0)
    ? ok('Mendaftar lewat tautan TIDAK membuat catatan kehadiran apa pun')
    : bad('Kehadiran ikut berubah: '+r.hadir);
  await pg.close();

  /* sesi yang sudah diikuti: tidak didaftarkan dua kali */
  pg = await buka({masuk:true, profil:'p1', cari:'?sesi=UJI-2'});
  await pg.waitForTimeout(1200);
  r = await pg.evaluate(() => ({
    teks: document.getElementById('isiSesi').innerText,
    baris: window.__STUB.DB.session_registration.filter(x => x.sesi_id === 's2' && x.person_id === 'p1').length
  }));
  (r.baris === 1 && /sudah terdaftar/i.test(r.teks) && /tidak didaftarkan dua kali/.test(r.teks))
    ? ok('Tautan sesi dibuka dua kali: tidak didaftarkan dua kali, dan itu dikatakan')
    : bad('Daftar ganda: '+JSON.stringify(r).slice(0,300));
  await pg.close();

  /* kode yang tidak ada: dikatakan tidak terdaftar, bukan diam-diam dianggap berhasil */
  pg = await buka({masuk:true, profil:'p1', cari:'?sesi=TIDAK-ADA'});
  await pg.waitForTimeout(1200);
  r = await pg.evaluate(() => ({
    teks: document.getElementById('isiSesi').innerText,
    jml: window.__STUB.DB.session_registration.length
  }));
  (/tidak ditemukan/.test(r.teks) && /tidak terdaftar/i.test(r.teks))
    ? ok('Kode sesi yang tidak ada: dikatakan tidak ditemukan dan tidak terdaftar')
    : bad('Kode salah: '+JSON.stringify(r).slice(0,240));
  await pg.close();

  /* --- tiga ukuran layar --- */
  await pg.close();
  for (const [w,h,nm] of [[390,844,'ponsel'],[1024,1366,'iPad'],[1440,900,'desktop']]) {
    const p2 = await buka({vp:{width:w,height:h}, tanpaProfil:true});
    const over = await p2.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const len = (await p2.innerText('body')).length;
    (over <= 2 && len > 300) ? ok('Tampilan '+nm+' ('+w+'px): terisi, tidak meluber')
                             : bad('Tampilan '+nm+': luber '+over+'px, teks '+len);
    await p2.close();
  }

  errs.length ? bad('Error JS: '+errs.slice(0,3).join(' | ')) : ok('Tanpa error JavaScript');
  console.log('\n'+pass+' lulus, '+fail+' gagal');
  await b.close(); process.exit(fail?1:0);
})();
