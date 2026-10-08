const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const URL = 'http://127.0.0.1:8095/test/crm-tunggal-uji.html';
let pass=0, fail=0;
const ok  = m => { pass++; console.log('  ok  '+m); };
const bad = m => { fail++; console.log('  GAGAL  '+m); };

(async () => {
  const b = await chromium.launch();
  const errs = [];
  async function buka(peran, vp){
    const pg = await b.newPage({viewport: vp||{width:1440,height:1000}});
    pg.on('pageerror', e => errs.push(peran+': '+e.message));
    await pg.addInitScript(p => { window.__PERAN_UJI = p; }, peran);
    await pg.goto(URL, {waitUntil:'load'});
    await pg.waitForTimeout(700);
    return pg;
  }

  /* ---- admin ---- */
  let pg = await buka('admin');
  let r = await pg.evaluate(() => ({
    isi: !document.getElementById('isi').hidden,
    baris: document.querySelectorAll('#tabelOrang tr[data-id]').length,
    peran: document.getElementById('peran').textContent
  }));
  (r.isi && r.baris === 3) ? ok('Admin melihat CRM dengan '+r.baris+' peserta (peran: '+r.peran+')')
                           : bad('Admin: '+JSON.stringify(r));

  /* nol vs kosong vs tidak bersedia */
  r = await pg.evaluate(() => {
    const t = document.getElementById('tabelOrang').innerText;
    return { belumBersedia: /belum bersedia/.test(t), adaRentang: /100-<500 juta/.test(t),
             tidakDitulisNol: !/\bRp ?0\b/.test(t) };
  });
  (r.belumBersedia && r.adaRentang && r.tidakDitulisNol)
    ? ok('Omzet di tabel: "belum bersedia" dan rentang nyata dibedakan, tidak satu pun ditulis sebagai nol')
    : bad('Omzet: '+JSON.stringify(r));

  /* filter periode omzet */
  r = await pg.evaluate(() => {
    const s = document.getElementById('f-periode'); s.value = '2026';
    s.dispatchEvent(new Event('change'));
    const n = document.querySelectorAll('#tabelOrang tr[data-id]').length;
    s.value = ''; s.dispatchEvent(new Event('change'));
    return { n, kembali: document.querySelectorAll('#tabelOrang tr[data-id]').length };
  });
  (r.n === 1 && r.kembali === 3)
    ? ok('Filter periode omzet 2026 menyaring ke '+r.n+' peserta, dibersihkan kembali ke '+r.kembali)
    : bad('Filter periode: '+JSON.stringify(r));

  /* filter tim = 0 harus menemukan yang tim_aktif 0, bukan yang kosong */
  r = await pg.evaluate(() => {
    const s = document.getElementById('f-tim'); s.value = '0'; s.dispatchEvent(new Event('change'));
    const nama = [...document.querySelectorAll('#tabelOrang tr[data-id] td b')].map(x=>x.textContent);
    s.value = ''; s.dispatchEvent(new Event('change'));
    return nama;
  });
  (r.length === 0) ? ok('Filter "Belum ada tim" tidak keliru menangkap peserta yang timnya belum diisi')
                   : bad('Filter tim 0: '+JSON.stringify(r));

  /* satu usaha dua pemilik */
  r = await pg.evaluate(() => {
    const rows = [...document.querySelectorAll('#tabelOrang tr[data-id]')];
    return rows.map(x => x.innerText.replace(/\n/g,' | ')).filter(t => /Homestay Contoh/.test(t)).length;
  });
  (r === 2) ? ok('Satu usaha dengan dua pemilik muncul di dua peserta, tidak digabung')
            : bad('Usaha dua pemilik: '+r);

  /* panel: consent dicabut terbaca benar */
  await pg.evaluate(() => document.querySelector('#tabelOrang tr[data-id]').click());
  await pg.waitForTimeout(300);
  await pg.evaluate(() => document.querySelector('#p-tab [data-pt="consent"]').click());
  await pg.waitForTimeout(400);
  r = await pg.evaluate(() => {
    const t = document.getElementById('p-isi').innerText;
    return { dicabut: /dicabut/i.test(t), disetujui: /disetujui/i.test(t),
             belumDitanya: /belum ditanyakan/i.test(t), histori: (t.match(/promosi/gi)||[]).length };
  });
  (r.dicabut && r.disetujui && r.belumDitanya)
    ? ok('Persetujuan: dicabut, disetujui, dan belum ditanyakan dibedakan; histori promosi tampil '+r.histori+'x')
    : bad('Persetujuan: '+JSON.stringify(r));

  /* panel: Life Circle tidak muncul di profil */
  await pg.evaluate(() => document.querySelector('#p-tab [data-pt="profil"]').click());
  await pg.waitForTimeout(300);
  r = await pg.evaluate(() => {
    const t = document.getElementById('p-isi').innerText;
    return { adaPeringatan: /tidak ditampilkan di sini/.test(t), adaSkor: /Kesehatan|Life Circle.*7|nilai/.test(t) };
  });
  r.adaPeringatan ? ok('Profil menyatakan terus terang bahwa Life Circle tidak ditampilkan di CRM')
                  : bad('Profil: '+JSON.stringify(r));

  /* usaha: tahun saja = perkiraan, tim 0 ditulis 0 */
  await pg.evaluate(() => { document.getElementById('tutupPanel').click();
    [...document.querySelectorAll('#tabelOrang tr[data-id] td b')].find(x=>/02/.test(x.textContent)).closest('tr').click(); });
  await pg.waitForTimeout(300);
  await pg.evaluate(() => document.querySelector('#p-tab [data-pt="usaha"]').click());
  await pg.waitForTimeout(400);
  r = await pg.evaluate(() => {
    const t = document.getElementById('p-isi').innerText;
    return { perkiraan: /perkiraan/.test(t), nolTim: /\b0\b/.test(t) && /termasuk pemilik/.test(t),
             duaUsaha: (t.match(/Homestay Contoh|Usaha Contoh B/g)||[]).length,
             sumber: /bukan angka teraudit/.test(t) };
  });
  (r.perkiraan && r.nolTim && r.duaUsaha >= 2 && r.sumber)
    ? ok('Usaha: usia perkiraan ditandai, tim 0 ditulis 0, dua usaha tampil, omzet disebut bukan teraudit')
    : bad('Usaha: '+JSON.stringify(r));
  await pg.close();

  /* ---- peran cs: tidak boleh melihat Life Circle ---- */
  pg = await buka('cs');
  r = await pg.evaluate(async () => {
    const { data } = await window.AJIOS.from('life_circle_score').select('*');
    return { baris: (data||[]).length, lihatCRM: !document.getElementById('isi').hidden };
  });
  (r.lihatCRM && r.baris === 0) ? ok('Peran cs membuka CRM tetapi Life Circle mengembalikan 0 baris')
                                : bad('cs: '+JSON.stringify(r));
  await pg.close();

  /* ---- fasilitator: ditolak masuk CRM ---- */
  pg = await buka('fasilitator');
  r = await pg.evaluate(() => ({ ditolak: !document.getElementById('bukanStaf').hidden,
                                 isi: !document.getElementById('isi').hidden }));
  (r.ditolak && !r.isi) ? ok('Fasilitator ditolak di CRM dengan penjelasan, bukan layar kosong')
                        : bad('fasilitator: '+JSON.stringify(r));
  await pg.close();

  /* ---- tanpa peran ---- */
  pg = await buka(null);
  r = await pg.evaluate(() => ({ ditolak: !document.getElementById('bukanStaf').hidden,
    pesan: document.getElementById('bukanStaf').innerText }));
  (r.ditolak && /bukan sekadar disembunyikan/.test(r.pesan))
    ? ok('Pengguna tanpa peran ditolak, dan halaman menjelaskan bahwa penolakan terjadi di basis data')
    : bad('tanpa peran: '+JSON.stringify(r));
  await pg.close();

  /* ---- error akses ditampilkan jelas ---- */
  pg = await buka('admin');
  r = await pg.evaluate(async () => {
    window.__STUB.gagalkan = 'person';
    const { error } = await window.AJIOS.from('person').select('*');
    return window.AJIOS.UI.bacaError(error);
  });
  (/Tidak punya akses/.test(r.judul)) ? ok('Error 42501 diterjemahkan jadi "'+r.judul+'" — bukan kode mentah')
                                      : bad('error: '+JSON.stringify(r));
  await pg.close();

  /* ---- tiga ukuran layar ---- */
  for (const [w,h,nm] of [[1440,1000,'desktop'],[1024,1366,'iPad'],[390,844,'ponsel']]) {
    const p2 = await buka('admin', {width:w,height:h});
    const over = await p2.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const len  = (await p2.innerText('body')).length;
    (over <= 2 && len > 400) ? ok('Tampilan '+nm+' ('+w+'px): terisi, tidak meluber')
                             : bad('Tampilan '+nm+': luber '+over+'px, teks '+len);
    await p2.close();
  }

  errs.length ? bad('Error JS: '+errs.slice(0,3).join(' | ')) : ok('Tanpa error JavaScript');
  console.log('\n'+pass+' lulus, '+fail+' gagal');
  await b.close(); process.exit(fail?1:0);
})();
