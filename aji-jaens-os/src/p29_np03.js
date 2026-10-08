/* ================= NP-V03 · SLIDE STUDIO & PRESENTASI =================
   Paket pembangunan NP-V03. BUKAN fase roadmap.

   Ketentuan yang dipegang ketat di berkas ini:

   - TIDAK ada janji editor Canva lengkap di dalam aplikasi ini. Tidak ada
     iframe Canva sama sekali: aplikasi ini tidak bisa menjamin Canva
     mengizinkan dirinya disematkan, dan kotak kosong yang gagal memuat
     akan terbaca sebagai slide yang rusak. Yang ada tombol membuka Canva
     di tab baru — itu yang benar-benar bekerja.
   - Kode embed yang ditempel TIDAK PERNAH disisipkan mentah. Yang diambil
     hanya alamatnya, setelah diperiksa: harus https, dan host-nya harus
     ada di daftar yang diizinkan. Seluruh markup dibuang.
   - Status awal setiap desain adalah "Belum diverifikasi". Aplikasi ini
     tidak bisa membuka Canva untuk memeriksa, jadi verifikasi adalah
     PERNYATAAN MANUSIA, dan dicatat sebagai pernyataan.
   - Melepas desain dari Program hanya memutus tautannya di sini. Desain
     aslinya di Canva tidak tersentuh dan tidak terhapus.
   - TIDAK ada klaim ekspor otomatis. Ekspor belum dibangun, dan tidak
     diberi tombol yang seolah-olah aktif.
   - Mode proyektor hanya menampilkan judul dan tautan tampilan. Catatan
     presenter, tautan edit, dan data pribadi tidak pernah ikut. */

/* ---------------- 1. SKEMA ---------------- */

const SLD_ST = ['Belum diverifikasi', 'Dikonfirmasi manual', 'Perlu diperbaiki'];

/* Host yang boleh. Daftar putih, bukan daftar hitam: apa pun yang tidak
   ada di sini ditolak, termasuk yang belum terpikirkan hari ini. */
const SLD_HOST = ['canva.com', 'www.canva.com', 'canva.link', 'www.canva.link', 'canva.site'];

SCHEMA.SLD = {
  n:'Desain Slide', ic:'layers', c:'pink', mod:'knowledge', priv:'TEAM',
  d:'Tautan ke desain slide di Canva, beserta kaitannya ke modul dan program.',
  t:r=>r.n, s:r=>[r.st, r.jml ? r.jml + ' slide' : ''].filter(Boolean).join(' · '),
  f:[{g:'Desain'},
     {k:'n',l:'Judul desain',t:'text',req:1,full:1},
     {k:'link',l:'Tautan tampilan (Canva)',t:'text',req:1,full:1,
      ph:'https://canva.link/… atau tempel kode embed-nya',
      hint:'Boleh ditempel mentah dari Canva. Yang disimpan hanya alamatnya setelah diperiksa — markup dibuang.'},
     {k:'edit',l:'Tautan edit (internal)',t:'text',full:1,
      hint:'Tidak pernah ikut ke mode proyektor dan tidak pernah ditampilkan ke peserta.'},
     {k:'jml',l:'Jumlah slide',t:'num',
      hint:'Diisi tangan. Aplikasi ini tidak membuka Canva, jadi tidak bisa menghitungnya sendiri.'},
     {g:'Kaitan'},
     {k:'mod',l:'Modul',t:'rel',rel:'MOD'},
     {k:'prg',l:'Program',t:'rel',rel:'PRG'},
     {g:'Kendali'},
     {k:'note',l:'Catatan presenter',t:'textarea',full:1,
      hint:'Hanya untuk Anda. Tidak pernah tampil di proyektor.'},
     /* Sengaja TIDAK wajib: status awal tidak boleh jadi pertanyaan yang
        harus dijawab pemilik. Yang kosong diisi "Belum diverifikasi" oleh
        sldSimpanBersih() — satu tempat, berlaku untuk semua jalan masuk. */
     {k:'st',l:'Status',t:'sel',opt:SLD_ST,
      hint:'Dibiarkan kosong berarti "Belum diverifikasi". Naik hanya setelah Anda sendiri membuka tautannya.'},
     {k:'cek',l:'Dikonfirmasi pada',t:'date',
      hint:'Terisi saat Anda menekan "Sudah saya buka dan benar".'}]
};

if(typeof SCH_ORDER !== 'undefined' && SCH_ORDER.indexOf('SLD') === -1) SCH_ORDER.push('SLD');
if(typeof MODULE_ENTITIES !== 'undefined' && MODULE_ENTITIES.knowledge &&
   MODULE_ENTITIES.knowledge.indexOf('SLD') === -1) MODULE_ENTITIES.knowledge.push('SLD');

/* ---------------- 2. SANITASI TAUTAN ----------------
   Masukan bisa berupa alamat biasa, atau kode embed lengkap yang ditempel
   dari Canva. Keduanya diperlakukan sama: cari calon alamat, periksa satu
   per satu, ambil yang pertama lolos, buang sisanya.

   Yang TIDAK pernah terjadi di sini: menyimpan atau menyisipkan markup,
   menerima skema selain https, dan menerima host di luar daftar putih. */

function sldCalon(teks){
  const s = String(teks || '');
  const out = [];
  /* src="…" dan href="…" lebih dulu, karena itu bentuk kode embed */
  const atr = /(?:src|href)\s*=\s*["']([^"']+)["']/gi;
  let m;
  while((m = atr.exec(s))) out.push(m[1]);
  /* lalu alamat yang berdiri sendiri */
  const polos = /https?:\/\/[^\s"'<>]+/gi;
  while((m = polos.exec(s))) out.push(m[0]);
  return out;
}

function sldBersih(teks){
  const calon = sldCalon(teks);
  for(let i = 0; i < calon.length; i++){
    let u = null;
    try { u = new URL(String(calon[i]).trim()); } catch(e) { continue; }
    if(u.protocol !== 'https:') continue;
    const host = u.hostname.toLowerCase();
    if(SLD_HOST.indexOf(host) === -1) continue;
    /* Dibangun ulang dari bagian yang sudah diperiksa, bukan dipakai
       apa adanya — supaya tidak ada sisa yang lolos ikut. */
    return u.origin + u.pathname + (u.search || '');
  }
  return '';
}

/* Alasan penolakan, supaya layar bisa menjelaskan dan bukan hanya menolak. */
function sldAlasan(teks){
  const s = String(teks || '').trim();
  if(!s) return 'Belum ada yang ditempel.';
  const calon = sldCalon(s);
  if(!calon.length) return 'Tidak ada alamat https di dalam yang Anda tempel.';
  for(let i = 0; i < calon.length; i++){
    let u = null;
    try { u = new URL(String(calon[i]).trim()); } catch(e) { continue; }
    if(u.protocol !== 'https:')
      return 'Alamatnya memakai ' + u.protocol + ' — hanya https yang diterima.';
    if(SLD_HOST.indexOf(u.hostname.toLowerCase()) === -1)
      return 'Host "' + u.hostname + '" tidak ada di daftar yang diizinkan (' + SLD_HOST.join(', ') + ').';
  }
  return 'Alamatnya tidak bisa dibaca.';
}

/* Dipanggil saat menyimpan: kolom link dan edit dibersihkan dulu.

   Di sini juga dijaga satu hal yang mudah bocor lewat jalur lain: STATUS
   AWAL. Ketentuan NP-V03 menyebut status awal "Belum diverifikasi", dan
   itu harus berlaku apa pun jalan masuknya — form, impor, atau pemulihan
   data. Status yang kosong DIISI ke "Belum diverifikasi", tidak pernah ke
   nilai yang lebih tinggi, dan status yang sudah terisi tidak disentuh. */
function sldSimpanBersih(r){
  ['link', 'edit'].forEach(k => {
    if(r[k] === undefined) return;
    const bersih = sldBersih(r[k]);
    if(bersih !== String(r[k] || '').trim()) r[k] = bersih;
  });
  if(!String(r.st || '').trim()) r.st = SLD_ST[0];
  /* Tanggal konfirmasi tanpa status terkonfirmasi tidak berarti apa-apa,
     dan kalau dibiarkan ia terbaca sebagai sudah diperiksa. */
  if(r.st !== 'Dikonfirmasi manual') r.cek = '';
  return r;
}

/* ---------------- 3. VERIFIKASI MANUAL ---------------- */
function sldKonfirmasi(id){
  const r = recById(id); if(!r) return;
  if(!r.link){ toast('Tautannya belum ada — tidak ada yang bisa dikonfirmasi'); return; }
  const before = Object.assign({}, r, { _priv: r._m.privacy_level });
  r.st = 'Dikonfirmasi manual';
  r.cek = todayISO();
  r._m.updated_at = new Date().toISOString(); r._m.updated_by = DB.owner.name;
  logAct('UPDATE', r, 'dikonfirmasi manual oleh pemilik — bukan pemeriksaan otomatis',
    diffRec(before, Object.assign({}, r, { _priv: r._m.privacy_level }), 'SLD'));
  if(!saveStore()){ toast('Belum tersimpan — periksa ruang penyimpanan peramban'); return; }
  toast('Dicatat sebagai pernyataan Anda, bukan hasil pemeriksaan otomatis');
  go(CUR);
}

function sldPerluPerbaikan(id){
  const r = recById(id); if(!r) return;
  const before = Object.assign({}, r, { _priv: r._m.privacy_level });
  r.st = 'Perlu diperbaiki'; r.cek = '';
  r._m.updated_at = new Date().toISOString(); r._m.updated_by = DB.owner.name;
  logAct('UPDATE', r, 'ditandai perlu diperbaiki',
    diffRec(before, Object.assign({}, r, { _priv: r._m.privacy_level }), 'SLD'));
  saveStore(); toast(r.id + ' ditandai perlu diperbaiki'); go(CUR);
}

/* ---------------- 4. LEPAS DARI PROGRAM ----------------
   Memutus tautan di sini saja. Desain di Canva tidak tersentuh. */
function sldLepas(id){
  const r = recById(id); if(!r) return;
  if(!r.prg){ toast('Desain ini belum tertaut ke program mana pun'); return; }
  const nama = (recById(r.prg) || {}).n || r.prg;
  const before = Object.assign({}, r, { _priv: r._m.privacy_level });
  r.prg = '';
  r._m.updated_at = new Date().toISOString(); r._m.updated_by = DB.owner.name;
  logAct('UPDATE', r, 'dilepas dari program ' + nama + ' — desain di Canva tidak diubah',
    diffRec(before, Object.assign({}, r, { _priv: r._m.privacy_level }), 'SLD'));
  if(!saveStore()){ toast('Belum tersimpan'); return; }
  toast('Dilepas dari ' + nama + '. Desain aslinya di Canva tidak tersentuh.');
  go(CUR);
}

/* ---------------- 5. MODE PROYEKTOR ----------------
   Yang tampil: judul program, judul desain, dan tautan tampilan.
   Yang TIDAK tampil: catatan presenter, tautan edit, nama peserta, dan
   data pribadi apa pun. Daftar itu disebutkan di layarnya sendiri. */

let SLD_PROY = null;

function sldProyektor(prgId){
  SLD_PROY = prgId || '';
  go(CUR);
  setTimeout(() => {
    const el = document.getElementById('sldProy');
    if(el) el.scrollIntoView({ block:'start', behavior:'smooth' });
  }, 60);
}
function sldProyTutup(){ SLD_PROY = null; go(CUR); }

function sldProyHTML(){
  if(SLD_PROY === null) return '';
  const prg = SLD_PROY ? recById(SLD_PROY) : null;
  const list = recs('SLD').filter(s => (SLD_PROY ? s.prg === SLD_PROY : !s.prg));
  return `<div class="card" id="sldProy" style="margin-bottom:16px;border-color:var(--gold)">
    ${cardH('layers', 'Mode proyektor', 'gold',
      `<button class="btn ghost sm" onclick="sldProyTutup()">Tutup</button>`)}
    <div class="mini" style="margin-bottom:12px">
      ${prg ? `Program: <b>${h(prg.n)}</b>` : 'Desain yang belum tertaut program'}
    </div>
    ${list.length ? `<div class="list">${list.map(s => `
      <div class="row-i" style="align-items:flex-start">
        ${ic('layers')}<span style="flex:1"><span class="t">${h(s.n)}</span>
        <span class="s">${s.jml ? h(s.jml + ' slide') : 'jumlah slide belum diisi'}</span>
        <span class="flexr" style="gap:7px;margin-top:8px;flex-wrap:wrap">
          ${s.link
            ? `<a class="btn solid sm" href="${h(s.link)}" target="_blank" rel="noopener noreferrer">Buka slide</a>`
            : '<span class="pill red">tautan belum ada</span>'}
          ${s.st === 'Belum diverifikasi' ? '<span class="pill orange">belum diverifikasi</span>' : ''}
          ${s.st === 'Perlu diperbaiki' ? '<span class="pill red">perlu diperbaiki</span>' : ''}
        </span></span></div>`).join('')}</div>`
      : `<div class="mini">Belum ada desain slide untuk ${prg ? 'program ini' : 'kelompok ini'}.
         Tidak ada slide contoh yang ditampilkan di tempatnya.</div>`}
    <div class="card-f"><span class="mini">Layar ini <b>tidak menampilkan</b> catatan presenter,
      tautan edit, nama peserta, atau data pribadi apa pun — bukan disembunyikan dari pandangan,
      memang tidak diambil. Yang ditampilkan hanya judul dan tautan tampilan.</span></div></div>`;
}

/* ---------------- 6. TAMPILAN SLIDE STUDIO ---------------- */

let SLD_PRG = '';
function sldSetPrg(v){ SLD_PRG = v; go(CUR); }

function sldView(){
  const semua = recs('SLD');
  const rows = SLD_PRG ? semua.filter(s => s.prg === SLD_PRG) : semua;
  const prgs = recs('PRG');
  const belum = semua.filter(s => s.st === 'Belum diverifikasi').length;

  const proy = sldProyHTML();

  const batas = `<div class="card" style="margin-bottom:16px">
    ${cardH('info','Batas yang diakui','gray','')}
    <ul style="margin:0;padding-left:20px;font-size:13.5px;line-height:1.7">
      <li><b>Tidak ada editor Canva di dalam aplikasi ini.</b> Tidak ada iframe Canva sama sekali —
        tombolnya membuka Canva di tab baru, dan itu yang benar-benar bekerja.</li>
      <li><b>Ekspor belum dibangun.</b> Tidak ada ekspor PDF atau PPT otomatis dari sini, jadi
        tidak ada tombolnya. Ekspor dilakukan dari Canva sendiri.</li>
      <li><b>Verifikasi adalah pernyataan Anda.</b> Aplikasi ini tidak membuka Canva untuk
        memeriksa apakah tautannya hidup, jumlah slidenya benar, atau isinya sudah final.</li>
      <li><b>Kode embed tidak pernah disisipkan mentah.</b> Yang disimpan hanya alamatnya setelah
        diperiksa https dan host-nya.</li>
    </ul></div>`;

  if(!semua.length) return proy + batas + emptyCard('layers','pink','Belum ada desain slide',
    'Tautkan desain Canva ke modul dan program di sini. Yang disimpan tautannya — ' +
    'desainnya sendiri tetap tinggal di Canva.',
    `<button class="btn solid" onclick="openForm('SLD')">${ic('plus')} Desain pertama</button>`);

  const kepala = `<div class="card" style="margin-bottom:16px">
    ${cardH('layers','Desain slide','pink',
      `<button class="btn gold sm" onclick="openForm('SLD')">${ic('plus')} Desain</button>`)}
    <div class="flexr" style="gap:10px;flex-wrap:wrap;align-items:flex-end">
      <label class="fld" style="margin:0;flex:1;min-width:200px"><span>Program</span>
        <select onchange="sldSetPrg(this.value)">
          <option value="">Semua program</option>
          ${prgs.map(p => `<option value="${h(p.id)}"${SLD_PRG === p.id ? ' selected' : ''}>${h(p.n)}</option>`).join('')}
        </select></label>
      <button class="btn ghost sm" onclick="sldProyektor('${h(SLD_PRG)}')">Mode proyektor</button>
    </div>
    <div class="mini" style="margin-top:10px"><b>${rows.length} dari ${semua.length}</b> desain.
      ${belum ? `<b>${belum}</b> masih "Belum diverifikasi" — status awal setiap desain, dan tidak naik sendiri.`
              : 'Semuanya sudah Anda konfirmasi sendiri.'}</div></div>`;

  const daftar = `<div class="card"><div class="list">${rows.map(s => {
    const m = s.mod ? recById(s.mod) : null;
    const p = s.prg ? recById(s.prg) : null;
    return `<div class="row-i" style="align-items:flex-start">
      ${ic('layers')}<span style="flex:1"><span class="t">${h(s.n)}</span>
      <span class="s">${m ? h(SCHEMA.MOD.t(m)) : 'tanpa modul'} · ${p ? h(SCHEMA.PRG.t(p)) : 'tanpa program'} · ${s.id}</span>
      <span class="flexr" style="gap:7px;margin-top:8px;flex-wrap:wrap">
        ${s.link
          ? `<a class="btn ghost sm" href="${h(s.link)}" target="_blank" rel="noopener noreferrer">Buka di Canva</a>`
          : '<span class="pill red">tautan belum lolos pemeriksaan</span>'}
        <button class="btn ghost sm" onclick="recDetail('${s.id}')">Detail</button>
        ${s.st !== 'Dikonfirmasi manual'
          ? `<button class="btn ghost sm" onclick="sldKonfirmasi('${s.id}')">Sudah saya buka dan benar</button>`
          : `<button class="btn ghost sm" onclick="sldPerluPerbaikan('${s.id}')">Tandai perlu diperbaiki</button>`}
        ${s.prg ? `<button class="btn ghost sm" onclick="sldLepas('${s.id}')">Lepas dari program</button>` : ''}
      </span></span>
      <span class="pill ${s.st === 'Dikonfirmasi manual' ? 'green' : s.st === 'Perlu diperbaiki' ? 'red' : 'orange'}">${h(s.st || 'tanpa status')}</span>
    </div>`;
  }).join('')}</div>
    <div class="card-f"><span class="mini">"Dikonfirmasi manual" berarti <b>Anda</b> yang membuka dan
      menyatakannya benar pada tanggal itu. Itu bukan pemeriksaan otomatis, dan bukan jaminan
      tautannya masih hidup hari ini.</span></div></div>`;

  return proy + kepala + batas + daftar;
}

/* ---------------- 7. SISIPAN DI DETAIL ---------------- */
if(typeof npDetailExtra === 'function'){
  const _sldExtra = npDetailExtra;
  npDetailExtra = function(r){
    const dasar = _sldExtra(r);
    if(typeOf(r) !== 'SLD') return dasar;
    let out = '';
    if(r.st === 'Belum diverifikasi') out += `<div class="statebar" style="margin-bottom:14px">
      <span class="dbadge" style="background:var(--orange)">BELUM DIVERIFIKASI</span>
      <div style="flex:1;min-width:200px">Status awal setiap desain. Aplikasi ini tidak bisa membuka
      Canva untuk memeriksa, jadi yang bisa menaikkannya hanya Anda sendiri setelah membukanya.</div>
      <button class="btn ghost sm" onclick="closeModal();sldKonfirmasi('${r.id}')">Sudah saya buka dan benar</button></div>`;
    if(r.note) out += `<div class="statebar" style="margin-bottom:14px">
      <span class="dbadge" style="background:var(--blue)">INTERNAL</span>
      <div style="flex:1;min-width:200px">Catatan presenter dan tautan edit di record ini
      <b>tidak pernah ikut ke mode proyektor</b>.</div></div>`;
    return dasar + out;
  };
}

/* ---------------- 8. PASANG KE TAB SHARE ---------------- */
if(typeof SH_TABS !== 'undefined' && !SH_TABS.some(t => t[0] === 'sld')){
  SH_TABS.push(['sld', 'Slide']);
  SH_VIEW.sld = sldView;
}

/* ---------------- 9. DESAIN PERTAMA ----------------
   Satu record, dibuat SEKALI, dari tautan yang Aji berikan. Statusnya
   "Belum diverifikasi" — karena memang belum ada yang memeriksanya. */
function np03Seed(){
  if(STORE.np03seed) return;
  STORE.np03seed = true;
  const prg = recs('PRG')[0];
  const now = new Date().toISOString();
  const link = sldBersih('https://canva.link/vjagyqpeq6ajfas');
  const r = { id: nextId('SLD'), type:'SLD',
    n:'Deck Life by Design (dari Canva)',
    link: link, edit:'', jml:'',
    mod:'', prg: prg ? prg.id : '',
    note:'', st:'Belum diverifikasi', cek:'' };
  r._m = { created_at:now, updated_at:now, created_by:DB.owner.name, updated_by:DB.owner.name,
           status:'ACTIVE', source_type:'MANUAL_ENTRY', source_id:'', source_url:'',
           privacy_level:'TEAM', is_dummy:false, is_archived:false, tags:[] };
  (STORE.rec.SLD = STORE.rec.SLD || []).unshift(r);
  logAct('CREATE', r, 'tautan Canva dari Aji — belum diverifikasi');
  saveStore();
}
/* np02Seed() sudah dijalankan saat p26 dimuat, jadi membungkusnya di sini
   tidak akan kena pada muat pertama. Dipanggil langsung saja — idempoten
   lewat penanda STORE.np03seed. */
np03Seed();
