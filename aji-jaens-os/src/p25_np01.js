
/* ================= NP-01 · KNOWLEDGE: LEARN, DO & SHARE =================
   Paket pembangunan NP-01. BUKAN fase roadmap.
   Roadmap resmi tetap 7 fase / 18 Master Prompt; Knowledge ada di Fase 6.

   Dipakai ulang dari yang sudah ada, bukan dibangun baru:
     SCHEMA + mesin form   (p11_form.js)   — validasi, privasi, metadata, arsip
     _m.source_id          (p11/p15/p16)   — tautan "berasal dari"
     backlinks/linimasa    (p22_links.js)  — hubungan dua arah dibaca dari skema
     pencarian KQ          (p19_rest.js)   — catatan Knowledge lama tetap hidup

   Batas yang diakui di tempat (lihat juga bar di Ringkasan):
     - Tidak ada unggahan berkas di aplikasi ini. "Lampiran" dicatat sebagai
       RUJUKAN (tautan + keterangan), bukan berkas tersimpan.
     - Tidak ada login, peran, atau izin backend. Privasi tersimpan sebagai
       kolom, tidak ditegakkan oleh server.
     - Modul, Program, Slide Studio, Sesi, dan Portal Peserta TIDAK dibangun
       di paket ini dan tidak diberi tombol yang seolah-olah aktif. */

/* ---------------- 1. SKEMA ---------------- */

const LRN_JENIS = ['Buku','Seminar','Training','Artikel','Riset','Percakapan','Video','Observasi','Ide','Lainnya'];
const LRN_ST    = ['Draft','Perlu Dirangkum','Sudah Direfleksikan'];
const PRK_ST    = ['Direncanakan','Dilakukan','Direfleksikan'];
const BHN_ST    = ['Draft','Perlu Ditinjau','Disetujui'];
const BHN_IZIN  = ['Belum diputuskan','Boleh dibagikan','Terbatas','Tidak boleh dibagikan'];
const BHN_JENIS = ['Cerita','Insight','Studi kasus','Kutipan','Media','Ide latihan'];

const ATT_HINT = 'Aplikasi ini belum bisa menyimpan berkas. Tulis rujukannya: tautan Drive, nama berkas, atau di mana benda itu berada.';

SCHEMA.LRN = {
  n:'Pembelajaran', ic:'book', c:'green', mod:'knowledge', priv:'PRIVATE',
  d:'Apa yang saya pelajari — dari buku, orang, atau pengamatan.',
  t:r=>r.n, s:r=>[r.jenis, r.st].filter(Boolean).join(' · '),
  f:[{g:'Tangkap dulu'},
     {k:'n',l:'Judul',t:'text',req:1,full:1,ph:'Satu kalimat sudah cukup'},
     {k:'note',l:'Catatan singkat',t:'textarea',req:1,full:1,hint:'Hanya dua kolom ini yang wajib. Sisanya bisa dilengkapi kapan saja.'},
     {g:'Sumber'},
     {k:'jenis',l:'Jenis',t:'sel',opt:LRN_JENIS},
     {k:'date',l:'Tanggal pembelajaran',t:'date'},
     {k:'src',l:'Sumber',t:'text',ph:'Judul buku, nama acara, nama orang'},
     {k:'author',l:'Penulis / pembicara',t:'text'},
     {k:'url',l:'Tautan',t:'url'},
     {k:'topic',l:'Topik',t:'text',full:1,ph:'dipisah koma'},
     {g:'Refleksi'},
     {k:'summary',l:'Ringkasan',t:'textarea',full:1},
     {k:'lesson',l:'Pelajaran yang saya ambil',t:'textarea',full:1,hint:'Bagian yang masih berguna setahun lagi, saat ringkasannya sendiri sudah terlupa.'},
     {k:'apply',l:'Rencana penerapan',t:'textarea',full:1},
     {g:'Lain-lain'},
     {k:'att',l:'Lampiran (rujukan)',t:'textarea',full:1,hint:ATT_HINT},
     {k:'st',l:'Status',t:'sel',opt:LRN_ST}]
};

SCHEMA.PRK = {
  n:'Praktik & Pengalaman', ic:'bolt', c:'blue', mod:'knowledge', priv:'PRIVATE',
  d:'Apa yang saya praktikkan — rencana, tindakan, dan apa yang benar-benar terjadi.',
  t:r=>r.n, s:r=>[r.kind, r.st].filter(Boolean).join(' · '),
  f:[{g:'Tangkap dulu'},
     {k:'n',l:'Judul',t:'text',req:1,full:1},
     {k:'note',l:'Catatan singkat',t:'textarea',req:1,full:1,hint:'Hanya dua kolom ini yang wajib.'},
     {g:'Rencana'},
     {k:'kind',l:'Jenis',t:'sel',opt:['Praktik terencana','Pengalaman langsung']},
     {k:'learn',l:'Berasal dari pembelajaran',t:'rel',rel:'LRN',hint:'Boleh dikosongkan — pengalaman tidak harus lahir dari bacaan.'},
     {k:'sit',l:'Situasi',t:'textarea',full:1},
     {k:'goal',l:'Tujuan',t:'textarea',full:1},
     {k:'start',l:'Mulai',t:'date'},
     {k:'end',l:'Selesai',t:'date'},
     {g:'Tindakan'},
     {k:'act',l:'Tindakan',t:'textarea',full:1},
     {k:'chal',l:'Tantangan',t:'textarea',full:1},
     {g:'Hasil & refleksi'},
     {k:'res',l:'Hasil yang tercatat',t:'textarea',full:1,hint:'Tulis apa yang terjadi, bukan apa yang seharusnya terjadi. Selesai tidak sama dengan berhasil.'},
     {k:'refl',l:'Pelajaran / refleksi',t:'textarea',full:1},
     {k:'next',l:'Langkah berikutnya',t:'textarea',full:1},
     {g:'Lain-lain'},
     {k:'ev',l:'Bukti (rujukan)',t:'textarea',full:1,hint:ATT_HINT},
     {k:'st',l:'Status',t:'sel',opt:PRK_ST}]
};

SCHEMA.BHN = {
  n:'Bahan Mengajar', ic:'users', c:'orange', mod:'knowledge', priv:'TEAM',
  d:'Apa yang saya ajarkan — bahan yang sudah dipilih untuk dibagikan.',
  t:r=>r.n, s:r=>[r.kind, r.st, r.perm].filter(Boolean).join(' · '),
  f:[{g:'Bahan'},
     {k:'n',l:'Judul',t:'text',req:1,full:1},
     {k:'msg',l:'Ringkasan / pesan utama',t:'textarea',req:1,full:1},
     {k:'kind',l:'Jenis',t:'sel',opt:BHN_JENIS},
     {k:'aud',l:'Audiens yang relevan',t:'text',ph:'Siswa SMA, mahasiswa, pengusaha pemula…'},
     {k:'topic',l:'Topik',t:'text',full:1,ph:'dipisah koma'},
     {g:'Sumber'},
     {k:'learn',l:'Dari pembelajaran',t:'rel',rel:'LRN'},
     {k:'prak',l:'Dari praktik',t:'rel',rel:'PRK'},
     {k:'picked',l:'Materi yang dipilih untuk dibagikan',t:'textarea',full:1,
      hint:'Hanya bagian yang Anda pilih sendiri. Tidak ada yang disalin otomatis dari sumber.'},
     {g:'Kendali'},
     {k:'inote',l:'Catatan internal',t:'textarea',full:1,hint:'Tidak pernah ikut menjadi bahan publik.'},
     {k:'att',l:'Lampiran (rujukan)',t:'textarea',full:1,hint:ATT_HINT},
     {k:'st',l:'Status peninjauan',t:'sel',opt:BHN_ST},
     {k:'perm',l:'Izin berbagi',t:'sel',opt:BHN_IZIN,
      hint:'Berbeda dari status peninjauan. Catatan yang benar belum tentu boleh diberikan kepada peserta.'}]
};

if(typeof SCH_ORDER !== 'undefined' && SCH_ORDER.indexOf('LRN') === -1)
  SCH_ORDER.push('LRN','PRK','BHN');
if(typeof MODULE_ENTITIES !== 'undefined' && MODULE_ENTITIES.knowledge)
  MODULE_ENTITIES.knowledge = ['KNW','LRN','PRK','BHN'];

/* ---------------- 2. HUBUNGAN TAMBAHAN (banyak-ke-banyak) ----------------
   Kolom rel sudah memberi satu-ke-banyak dua arah lewat p22_links.
   _m.links menampung sumber tambahan supaya satu bahan bisa menunjuk
   lebih dari satu pembelajaran atau praktik. */

function npLinks(r){ return (r && r._m && Array.isArray(r._m.links)) ? r._m.links : []; }
function npAddLink(recId, otherId){
  const r = recById(recId), o = recById(otherId);
  if(!r || !o || recId === otherId) return false;
  r._m.links = npLinks(r).slice();
  if(r._m.links.indexOf(otherId) === -1){ r._m.links.push(otherId); saveStore(); return true; }
  return false;
}
function npDropLink(recId, otherId){
  const r = recById(recId); if(!r) return;
  r._m.links = npLinks(r).filter(x => x !== otherId); saveStore(); go(CUR);
}

/* p22 membaca kolom rel dan source_id. Dibungkus supaya _m.links ikut terbaca
   dari kedua arah — bukan menggantikan, hanya menambah. */
const _npBack = backlinks, _npFwd = forwardLinks;
backlinks = function(id){
  const g = _npBack(id);
  const extra = [];
  SCH_ORDER.forEach(t => recs(t).forEach(r => { if(npLinks(r).indexOf(id) !== -1) extra.push(r); }));
  if(extra.length) g.push({ type:null, label:'Ditautkan ke record ini', field:'_links', items:extra });
  return g;
};
forwardLinks = function(r){
  const out = _npFwd(r);
  npLinks(r).forEach(id => {
    const t = recById(id);
    out.push({ label:'Tautan tambahan', id, rec:t, missing:!t, archived: t && t._m.is_archived });
  });
  return out;
};

/* ---------------- 3. CAP SUMBER ("Sumber diperbarui — tinjau kembali") ---- */

function npStamp(r){
  if(!r) return '';
  return [r.n, r.note, r.summary, r.lesson, r.apply, r.res, r.refl, r.next]
    .map(x => x || '').join('\u0001');
}
function npSrcIds(r){
  return [r.learn, r.prak, (r._m && r._m.source_id) || ''].concat(npLinks(r)).filter(Boolean);
}
/* true bila salah satu sumbernya berubah sejak bahan ini terakhir ditinjau */
function npSrcChanged(r){
  const snap = (r._m && r._m.src_snap) || null;
  if(!snap) return false;
  return npSrcIds(r).some(id => {
    const s = recById(id);
    return s && snap[id] !== undefined && snap[id] !== npStamp(s);
  });
}
function npTakeSnap(r){
  const snap = {};
  npSrcIds(r).forEach(id => { const s = recById(id); if(s) snap[id] = npStamp(s); });
  r._m.src_snap = snap;
}
function npReviewed(id){
  const r = recById(id); if(!r) return;
  npTakeSnap(r); r._m.updated_at = new Date().toISOString();
  logAct('UPDATE', r, 'Sumber ditinjau kembali');
  saveStore(); toast('Ditandai sudah ditinjau terhadap sumbernya'); go(CUR);
}

/* ---------------- 4. JADIKAN PRAKTIK / JADIKAN BAHAN ---------------- */

function npMakePractice(srcId){
  const s = recById(srcId); if(!s) return;
  const already = recs('PRK').filter(p => p.learn === srcId || (p._m.source_id === srcId));
  const pre = {
    n: 'Menerapkan: ' + (s.n || ''),
    note: s.apply || s.lesson || '',
    kind: 'Praktik terencana',
    learn: srcId,
    goal: s.apply || '',
    st: 'Direncanakan'
  };
  if(already.length){
    modal('Sudah ada praktik dari catatan ini',
      already.length + ' praktik sudah menunjuk ke "' + h(SCHEMA.LRN.t(s)) + '". Lanjutkan yang ada, atau buat yang baru.',
      `<div class="list">${already.map(p => `<button class="row-i" style="width:100%;text-align:left" onclick="closeModal();recDetail('${p.id}')">
         ${ic('bolt')}<span><span class="t">${h(p.n)}</span><span class="s">${p.id} · ${h(p.st||'—')}</span></span></button>`).join('')}</div>`,
      `<button class="btn solid" onclick="closeModal();npOpenPractice('${srcId}')">${ic('plus')} Buat praktik baru</button>
       <button class="btn ghost" onclick="closeModal()">Batal</button>`, true);
    return;
  }
  npOpenPractice(srcId);
}
function npOpenPractice(srcId){
  const s = recById(srcId); if(!s) return;
  openForm('PRK', null, {
    n: 'Menerapkan: ' + (s.n || ''),
    note: s.apply || s.lesson || '',
    kind: 'Praktik terencana',
    learn: srcId,
    goal: s.apply || '',
    st: 'Direncanakan'
  }, srcId);
}

/* Dari Learn ATAU Do. Tidak menyalin lampiran, catatan internal, atau kontak. */
function npMakeMaterial(srcId){
  const s = recById(srcId); if(!s) return;
  const T = typeOf(s);
  const priv = s._m.privacy_level;
  const bits = [
    ['Ringkasan', s.summary], ['Pelajaran', s.lesson], ['Rencana penerapan', s.apply],
    ['Situasi', s.sit], ['Tindakan', s.act], ['Hasil yang tercatat', s.res],
    ['Refleksi', s.refl], ['Langkah berikutnya', s.next]
  ].filter(x => x[1]);
  modal('Jadikan bahan mengajar',
    'Sumber: ' + s.id + ' · tingkat privasi <b>' + h(priv) + '</b>. Pilih sendiri bagian yang boleh menjadi bahan. Tidak ada yang ikut otomatis.',
    `<div class="frm">
      ${bits.length ? bits.map((b,i) => `<label class="fld full" style="display:flex;gap:10px;align-items:flex-start;cursor:pointer">
         <input type="checkbox" class="npPick" data-lab="${h(b[0])}" data-val="${h(b[1])}" ${i===0?'checked':''} style="margin-top:4px">
         <span><b>${h(b[0])}</b><br><span class="mini">${h(String(b[1]).slice(0,180))}${String(b[1]).length>180?'…':''}</span></span></label>`).join('')
       : `<p class="mini">Sumber ini belum punya isi yang bisa dipilih. Bahan akan dibuat kosong dan Anda isi sendiri.</p>`}
      <div class="fld full"><span class="mini">Lampiran, catatan internal, dan kontak tidak pernah ikut disalin. Bahan disimpan sebagai <b>Draft</b> dengan izin berbagi <b>Belum diputuskan</b>.</span></div>
    </div>`,
    `<button class="btn solid" onclick="npBuildMaterial('${srcId}')">${ic('check')} Buat draft bahan</button>
     <button class="btn ghost" onclick="closeModal()">Batal</button>`, true);
}
function npBuildMaterial(srcId){
  const s = recById(srcId); if(!s) return;
  const T = typeOf(s);
  const picked = [];
  document.querySelectorAll('.npPick').forEach(el => {
    if(el.checked) picked.push(el.dataset.lab + ':\n' + el.dataset.val);
  });
  closeModal();
  openForm('BHN', null, {
    n: s.n || '',
    msg: '',
    learn: T === 'LRN' ? srcId : (s.learn || ''),
    prak:  T === 'PRK' ? srcId : '',
    topic: s.topic || '',
    picked: picked.join('\n\n'),
    st: 'Draft',
    perm: 'Belum diputuskan'
  }, srcId);
}

/* ---------------- 5. SARAN LANGKAH BERIKUTNYA (berbasis aturan) ----------
   Aturan sederhana yang bisa dijelaskan. BUKAN keluaran model AI. */

function npSuggest(){
  const out = [];
  recs('LRN').forEach(r => {
    if(r.lesson && !r.apply)
      out.push({ id:r.id, t:r.n, w:'Sudah punya pelajaran utama, belum punya rencana penerapan.',
                 a:`openForm('LRN','${r.id}')`, al:'Isi rencana penerapan', c:'green' });
    else if(r.apply && !recs('PRK').some(p => p.learn === r.id || p._m.source_id === r.id))
      out.push({ id:r.id, t:r.n, w:'Rencana penerapan sudah ada, tetapi belum ada praktik yang mencatatnya.',
                 a:`npMakePractice('${r.id}')`, al:'Jadikan praktik', c:'blue' });
    else if(!r.lesson && (r.summary || r.note))
      out.push({ id:r.id, t:r.n, w:'Catatan sudah ada, pelajaran utamanya belum ditulis.',
                 a:`openForm('LRN','${r.id}')`, al:'Tulis pelajaran', c:'green' });
  });
  recs('PRK').forEach(r => {
    if(r.st === 'Dilakukan' && !r.res)
      out.push({ id:r.id, t:r.n, w:'Ditandai sudah dilakukan, hasilnya belum dicatat.',
                 a:`openForm('PRK','${r.id}')`, al:'Catat hasil', c:'blue' });
    else if(r.res && !r.refl)
      out.push({ id:r.id, t:r.n, w:'Hasil sudah tercatat, refleksinya belum ditulis.',
                 a:`openForm('PRK','${r.id}')`, al:'Tulis refleksi', c:'blue' });
    else if(r.refl && !recs('BHN').some(b => b.prak === r.id || b._m.source_id === r.id))
      out.push({ id:r.id, t:r.n, w:'Sudah direfleksikan dan belum pernah dijadikan bahan mengajar.',
                 a:`npMakeMaterial('${r.id}')`, al:'Jadikan bahan', c:'orange' });
  });
  recs('BHN').forEach(r => {
    if(npSrcChanged(r))
      out.push({ id:r.id, t:r.n, w:'Sumbernya berubah sejak bahan ini terakhir ditinjau.',
                 a:`recDetail('${r.id}')`, al:'Tinjau kembali', c:'red' });
    else if(r.st === 'Disetujui' && r.perm === 'Belum diputuskan')
      out.push({ id:r.id, t:r.n, w:'Isinya sudah disetujui, izin berbagi belum diputuskan.',
                 a:`openForm('BHN','${r.id}')`, al:'Putuskan izin', c:'orange' });
  });
  return out;
}

/* ---------------- 6. TAMPILAN ---------------- */

let KN_TAB = 'ov';
const KN_TABS = [['ov','Ringkasan'],['lrn','Learn'],['prk','Do'],['bhn','Share'],['old','Catatan lama']];
function knTab(k){ KN_TAB = k; go('knowledge'); }

let KNQ = { lrn:'', prk:'', bhn:'' };
function knQ(k, v){ KNQ[k] = v; go('knowledge'); }

const npHas = (r, keys) => keys.some(k => r[k]);
function npMatch(r, q){
  if(!q) return true;
  const s = JSON.stringify(Object.keys(r).filter(k=>k!=='_m').map(k=>r[k])).toLowerCase();
  return s.indexOf(q.toLowerCase()) !== -1;
}

function npStateBar(){
  return `<div class="statebar" style="margin-bottom:18px">
    <span class="dbadge" style="background:var(--ink-2,#6b7280)">BATAS</span>
    <div style="flex:1;min-width:220px">
      Aplikasi ini <b>belum bisa menyimpan berkas</b> — lampiran dan bukti dicatat sebagai rujukan, bukan unggahan.
      <b>Belum ada login, peran, atau izin backend</b>; tingkat privasi tersimpan sebagai kolom, tidak ditegakkan server.
      Modul, Slide Studio, Sesi, dan Portal Peserta belum dibangun di paket ini.
    </div></div>`;
}

/* --- Ringkasan --- */
function knOverview(){
  const L = recs('LRN'), P = recs('PRK'), B = recs('BHN');
  const sug = npSuggest();
  const card = (code, name, sub, cnt, col, act, al) => `
    <div class="card" style="flex:1;min-width:210px">
      ${cardH(SCHEMA[code].ic, name, col, `<span class="mini">${cnt} record</span>`)}
      <div class="mini" style="margin-bottom:10px">${sub}</div>
      <div class="flexr" style="gap:8px;flex-wrap:wrap">
        <button class="btn solid sm" onclick="${act}">${ic('plus')} ${al}</button>
        <button class="btn ghost sm" onclick="knTab('${code==='LRN'?'lrn':code==='PRK'?'prk':'bhn'}')">Lihat semua →</button>
      </div></div>`;

  const recent = ['LRN','PRK','BHN'].reduce((a,t) => a.concat(recs(t)), [])
    .sort((a,b) => String(b._m.updated_at).localeCompare(String(a._m.updated_at))).slice(0,6);

  const flow = `<div class="card" style="margin-top:18px">
    <div class="flexr" style="gap:10px;flex-wrap:wrap;align-items:center">
      <span class="mini"><b>Alur Knowledge:</b></span>
      <span class="pill green">Pembelajaran</span><span class="mini">→</span>
      <span class="pill blue">Pengalaman</span><span class="mini">→</span>
      <span class="pill orange">Bahan mengajar</span>
      <span class="mini" style="margin-left:auto">Satu arah, tetapi tidak wajib: pengalaman boleh dibuat langsung tanpa pembelajaran.</span>
    </div></div>`;

  return npStateBar() + `
  <div class="flexr" style="gap:14px;flex-wrap:wrap;align-items:stretch">
    ${card('LRN','Learn','Apa yang saya pelajari.', L.length, 'green', "openForm('LRN')", 'Tambah Pembelajaran')}
    ${card('PRK','Do','Apa yang saya praktikkan.', P.length, 'blue', "openForm('PRK')", 'Catat Pengalaman')}
    ${card('BHN','Share','Apa yang saya ajarkan.', B.length, 'orange', "openForm('BHN')", 'Tambah Bahan Mengajar')}
  </div>` + flow + `
  <div class="flexr" style="gap:14px;flex-wrap:wrap;align-items:flex-start;margin-top:18px">
    <div class="card" style="flex:2;min-width:290px">
      ${cardH('clock','Lanjutkan pekerjaan','gold')}
      ${recent.length ? `<div class="list">${recent.map(r => {
        const T = typeOf(r), c = SCHEMA[T].c;
        return `<button class="row-i" style="width:100%;text-align:left" onclick="recDetail('${r.id}')">
          ${ic(SCHEMA[T].ic)}<span><span class="t">${h(SCHEMA[T].t(r) || r.id)}</span>
          <span class="s">${h(SCHEMA[T].s(r) || '')}</span></span>
          <span class="pill ${c}">${T === 'LRN' ? 'Learn' : T === 'PRK' ? 'Do' : 'Share'}</span></button>`;
      }).join('')}</div>` : `<div class="mini">Belum ada apa pun di Learn, Do, atau Share. Mulai dari satu pembelajaran — judul dan catatan singkat sudah cukup.</div>`}
    </div>
    <div class="card" style="flex:1;min-width:250px">
      ${cardH('spark','Langkah berikutnya','purple',`<span class="mini">${sug.length}</span>`)}
      <div class="mini" style="margin-bottom:10px">Dibaca dari kondisi record dengan aturan tetap. Bukan hasil model AI.</div>
      ${sug.length ? `<div class="list">${sug.slice(0,5).map(s => `
        <div class="row-i" style="align-items:flex-start">
          <span style="flex:1"><span class="t">${h(s.t)}</span>
          <span class="s">${h(s.w)}</span>
          <button class="btn ghost sm" style="margin-top:7px" onclick="${s.a}">${h(s.al)}</button></span>
        </div>`).join('')}</div>`
        : `<div class="mini">Tidak ada yang menggantung. Setiap pembelajaran dengan pelajaran utama sudah punya rencana, dan setiap praktik yang selesai sudah direfleksikan.</div>`}
    </div>
  </div>`;
}

/* --- daftar generik --- */
function knList(T, key, intro, emptyBody){
  const S = SCHEMA[T];
  const q = KNQ[key];
  const all = recs(T);
  const rows = all.filter(r => npMatch(r, q));
  const search = `<div class="card" style="margin-bottom:16px">
    <div class="flexr" style="gap:8px;flex-wrap:wrap">
      <input type="text" value="${h(q)}" placeholder="Cari di ${h(S.n)}…"
        oninput="KNQ['${key}']=this.value" onchange="knQ('${key}',this.value)"
        onkeydown="if(event.key==='Enter'){event.preventDefault();knQ('${key}',this.value)}"
        style="flex:1;min-width:170px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:10px;padding:9px 12px;font:inherit;font-size:13.5px;outline:0">
      <button class="btn solid sm" onclick="openForm('${T}')">${ic('plus')} Tambah</button>
      ${q ? `<button class="btn ghost sm" onclick="knQ('${key}','')">Bersihkan</button>` : ''}
    </div>
    <div class="mini" style="margin-top:8px">${intro}</div></div>`;

  if(!all.length) return search + emptyCard(S.ic, S.c, S.n + ' masih kosong', emptyBody,
    `<button class="btn solid" onclick="openForm('${T}')">${ic('plus')} ${h(S.n)} pertama</button>`);
  if(!rows.length) return search + `<div class="card"><div class="mini">Tidak ada yang cocok dengan "${h(q)}". ${all.length} record lain tetap ada.</div></div>`;

  return search + `<div class="card"><div class="list">${rows.map(r => {
    const warn = T === 'BHN' && npSrcChanged(r);
    return `<button class="row-i" style="width:100%;text-align:left" onclick="recDetail('${r.id}')">
      ${ic(S.ic)}<span style="flex:1"><span class="t">${h(S.t(r) || r.id)}</span>
      <span class="s">${h(S.s(r) || '')} · ${r.id}</span></span>
      ${warn ? `<span class="pill red">SUMBER BERUBAH</span>` : ''}
      ${r.st ? `<span class="pill ${S.c}">${h(r.st)}</span>` : ''}</button>`;
  }).join('')}</div></div>`;
}

const knLearn = () => knList('LRN','lrn',
  'Dua kolom wajib: judul dan catatan singkat. Status Draft → Perlu Dirangkum → Sudah Direfleksikan Anda sendiri yang menaikkan — sistem tidak menebaknya.',
  'Catatan di sini punya satu kolom yang membedakannya dari tumpukan: <b>pelajaran yang saya ambil</b>. Itu bagian yang masih berguna setahun lagi.');

const knDo = () => knList('PRK','prk',
  'Pengalaman boleh dibuat langsung tanpa sumber pembelajaran, atau ditautkan ke sumbernya kemudian.',
  'Di sini pengetahuan berubah jadi pengalaman. Rencana, tindakan, dan hasil dicatat terpisah — supaya "selesai" tidak diam-diam terbaca sebagai "berhasil".');

const knShare = () => knList('BHN','bhn',
  'Status peninjauan dan izin berbagi dipisah: catatan yang benar belum tentu boleh diberikan kepada peserta.',
  'Bahan mengajar lahir dari pembelajaran dan pengalaman yang sudah ada — selalu lewat pilihan Anda, tidak pernah disalin otomatis.');

/* --- catatan lama --- */
function knOld(){
  const all = recs('KNW');
  const head = `<div class="card" style="margin-bottom:16px">
    ${cardH('book','Catatan Knowledge lama','purple',`<span class="mini">${all.length} record</span>`)}
    <div class="mini">Catatan lama tidak dipaksa menjadi Learn. ID, isi, lampiran, privasi, dan relasinya dipertahankan apa adanya.
    Anda yang memutuskan kategorinya — atau membiarkannya di sini. Pencarian Knowledge tetap menemukannya.</div></div>`;
  if(!all.length) return head + emptyCard('book','purple','Tidak ada catatan lama',
    'Tidak ada record KNW di perangkat ini, jadi tidak ada yang perlu dikategorikan.', '');
  return head + `<div class="card"><div class="list">${all.map(r => `
    <div class="row-i" style="align-items:flex-start">
      ${ic('book')}<span style="flex:1"><span class="t">${h(r.n || r.id)}</span>
      <span class="s">${h([r.cat, r.src].filter(Boolean).join(' · '))} · ${r.id}</span>
      <span class="flexr" style="gap:7px;margin-top:8px;flex-wrap:wrap">
        <button class="btn ghost sm" onclick="recDetail('${r.id}')">Buka</button>
        <button class="btn ghost sm" onclick="npPromote('${r.id}')">Salin jadi Pembelajaran</button>
      </span></span>
      <span class="pill dummy">BELUM DIKATEGORIKAN</span></div>`).join('')}</div></div>`;
}

/* Menyalin, bukan memindahkan: record KNW lama tetap utuh dengan ID aslinya. */
function npPromote(id){
  const s = recById(id); if(!s) return;
  const dup = recs('LRN').find(l => l._m.source_id === id);
  if(dup){ toast('Sudah pernah disalin — ' + dup.id); recDetail(dup.id); return; }
  openForm('LRN', null, {
    n: s.n || '', note: s.summary || s.lesson || '', summary: s.summary || '',
    lesson: s.lesson || '', apply: s.apply || '', src: s.src || '', url: s.url || '',
    topic: s.tags || '', jenis: 'Lainnya', st: s.lesson ? 'Sudah Direfleksikan' : 'Draft'
  }, id);
}

const KN_VIEW = { ov:knOverview, lrn:knLearn, prk:knDo, bhn:knShare, old:knOld };

VIEWS.knowledge = () => {
  const sug = npSuggest().length;
  const old = recs('KNW').length;
  const head = `<div class="page-h">
    <div><h1>Knowledge</h1><p>Pelajari. Praktikkan. Bagikan.</p></div>
    <div class="sp">
      <button class="btn gold sm" onclick="openForm('LRN')">${ic('plus')} Pembelajaran</button>
      <button class="btn ghost sm" onclick="openForm('PRK')">${ic('bolt')} Pengalaman</button>
      <button class="btn ghost sm" onclick="openForm('BHN')">${ic('users')} Bahan</button>
    </div></div>`;
  const bar = `<div class="tabbar">${KN_TABS.map(([k,n]) => {
    const b = k === 'ov' ? sug : k === 'old' ? old : 0;
    return `<button class="${KN_TAB===k?'on':''}" onclick="knTab('${k}')">${n}${b ? ` <span class="cnt">${b}</span>` : ''}</button>`;
  }).join('')}</div>`;
  return head + bar + (KN_VIEW[KN_TAB] || knOverview)();
};

/* ---------------- 7. SISIPAN DI DETAIL RECORD ----------------
   Dipanggil oleh recDetail() lewat kait opsional di p11_form.js. */

function npDetailExtra(r){
  const T = typeOf(r); if(['LRN','PRK','BHN'].indexOf(T) === -1) return '';
  let out = '';

  if(T === 'BHN'){
    if(npSrcChanged(r)) out += `<div class="statebar del" style="margin-bottom:14px">
      <span class="dbadge" style="background:var(--red)">TINJAU</span>
      <div style="flex:1;min-width:200px"><b>Sumber diperbarui.</b> Salah satu sumber bahan ini berubah sejak terakhir ditinjau.
      Isinya tidak diubah diam-diam — Anda yang memutuskan apakah bahan perlu menyusul.</div>
      <button class="btn ghost sm" onclick="npReviewed('${r.id}')">Sudah saya tinjau</button></div>`;
    if(r.st === 'Disetujui' && r.perm !== 'Boleh dibagikan') out += `<div class="statebar" style="margin-bottom:14px">
      <span class="dbadge" style="background:var(--orange)">IZIN</span>
      <div style="flex:1;min-width:200px">Isinya sudah disetujui, tetapi izin berbagi masih
      <b>${h(r.perm || 'Belum diputuskan')}</b>. Peninjauan isi dan izin berbagi memang dipisah.</div></div>`;
  }

  /* praktik: kalau hasil/refleksi sudah ada, itu yang ditonjolkan — bukan bukti */
  if(T === 'PRK' && (r.res || r.refl)) out += `<div class="card" style="margin-bottom:14px;border-color:var(--blue)">
    ${cardH('bolt','Hasil & refleksi','blue')}
    ${r.res  ? `<div style="margin-bottom:8px"><span class="mini">Hasil yang tercatat</span><div>${h(r.res).replace(/\n/g,'<br>')}</div></div>` : ''}
    ${r.refl ? `<div><span class="mini">Refleksi</span><div>${h(r.refl).replace(/\n/g,'<br>')}</div></div>` : ''}
    ${!r.refl ? `<div class="mini">Hasil sudah ada, refleksi belum ditulis.</div>` : ''}</div>`;

  const extra = npLinks(r);
  if(extra.length) out += `<div class="card" style="margin-bottom:14px">
    ${cardH('net','Tautan tambahan','teal',`<span class="mini">${extra.length}</span>`)}
    <div class="list">${extra.map(id => { const o = recById(id);
      return `<div class="row-i"><span style="flex:1"><span class="t">${o ? h(SCHEMA[typeOf(o)].t(o)) : id}</span>
        <span class="s">${id}${o && o._m.is_archived ? ' · diarsipkan' : (o ? '' : ' · tidak ditemukan')}</span></span>
        <button class="btn ghost sm" onclick="npDropLink('${r.id}','${id}')">Lepas</button></div>`;
    }).join('')}</div></div>`;

  return out;
}

function npDetailFoot(r){
  const T = typeOf(r);
  if(T === 'LRN') return `<button class="btn ghost" onclick="closeModal();npMakePractice('${r.id}')">${ic('bolt')} Jadikan praktik</button>
    <button class="btn ghost" onclick="closeModal();npMakeMaterial('${r.id}')">${ic('users')} Jadikan bahan</button>`;
  if(T === 'PRK') return `<button class="btn ghost" onclick="closeModal();npMakeMaterial('${r.id}')">${ic('users')} Jadikan bahan</button>`;
  return '';
}
