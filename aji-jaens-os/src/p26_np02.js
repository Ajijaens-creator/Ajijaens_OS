
/* ============ NP-V02 · SHARE: BANK BAHAN, MODUL & PROGRAM ============
   Acuan NV-02 + Ketentuan Bersama. Fase 6 roadmap, BUKAN fase selesai.

   Dipakai ulang: SCHEMA + mesin form (p11), source_id & relasi (p22),
   Bank Bahan BHN dari NP-01 (p25) — diperluas, tidak dibangun ulang.

   Tidak dibangun di paket ini (dan tidak diberi tombol palsu):
   editor slide, portal peserta, kendali sesi. */

/* ---------------- 1. BANK BAHAN — perluasan dari NP-01 ---------------- */

/* Jenis bahan bertambah sesuai NV-02; pilihan lama tetap valid. */
(function extendBHN(){
  const f = SCHEMA.BHN.f;
  const kind = f.find(x => x.k === 'kind');
  if(kind) kind.opt = ['Cerita','Insight','Studi kasus','Kutipan','Foto','Video','Dokumen','Ide latihan'];
  /* sumber tambahan: catatan Knowledge lama dan konten */
  if(!f.some(x => x.k === 'knw')){
    const i = f.findIndex(x => x.k === 'prak');
    f.splice(i + 1, 0,
      {k:'knw', l:'Dari catatan lama', t:'rel', rel:'KNW'},
      {k:'cnt', l:'Dari konten', t:'rel', rel:'CNT'});
  }
  if(!f.some(x => x.k === 'media')){
    const i = f.findIndex(x => x.k === 'att');
    f.splice(i, 0, {k:'media', l:'Media (rujukan)', t:'textarea', full:1,
      hint:'Belum ada penyimpanan berkas di aplikasi ini. Tulis tautan atau lokasi medianya.'});
  }
})();

/* ---------------- 2. MODUL ---------------- */

const MOD_ST = ['Draft','Dalam Penyusunan','Siap Ditinjau','Siap Digunakan','Diarsipkan'];
const PRG_ST = ['Draft','Dalam Penyusunan','Siap Ditinjau','Siap Digunakan','Diarsipkan'];
const PRG_FMT = ['Seminar','Workshop','Training','Mentoring'];

SCHEMA.MOD = {
  n:'Modul', ic:'doc', c:'orange', mod:'knowledge', priv:'TEAM',
  d:'Satu bagian pembelajaran yang bisa dipakai di banyak program.',
  t:r=>r.n, s:r=>[r.st, r.dur ? r.dur + ' menit' : ''].filter(Boolean).join(' · '),
  f:[{g:'Dasar'},
     {k:'n',l:'Judul',t:'text',req:1,full:1,hint:'Draft cukup judul. Sisanya menyusul.'},
     {k:'aud',l:'Audiens',t:'text'},
     {k:'dur',l:'Durasi (menit)',t:'num'},
     {k:'obj',l:'Tujuan belajar',t:'textarea',full:1},
     {k:'msg',l:'Pesan utama',t:'textarea',full:1},
     {g:'Isi & cerita'},
     {k:'topics',l:'Pokok bahasan',t:'textarea',full:1},
     {k:'story',l:'Cerita / contoh',t:'textarea',full:1,
      hint:'Cerita pribadi yang belum dikonfirmasi ditandai sebagai kebutuhan bahan, bukan ditulis sendiri oleh sistem.'},
     {k:'media',l:'Media (rujukan)',t:'textarea',full:1},
     {g:'Latihan'},
     {k:'ex',l:'Latihan peserta',t:'textarea',full:1},
     {k:'outcome',l:'Hasil peserta',t:'textarea',full:1},
     {k:'refl',l:'Pertanyaan refleksi',t:'textarea',full:1},
     {g:'Kesiapan'},
     {k:'note',l:'Catatan fasilitator',t:'textarea',full:1,hint:'Tidak pernah ikut ke bahan peserta.'},
     {k:'st',l:'Status',t:'sel',opt:MOD_ST}]
};

SCHEMA.PRG = {
  n:'Program', ic:'layers', c:'gold', mod:'knowledge', priv:'TEAM',
  d:'Susunan modul dan agenda menjadi satu acara yang dibawakan.',
  t:r=>r.n, s:r=>[r.fmt, r.st].filter(Boolean).join(' · '),
  f:[{g:'Dasar'},
     {k:'n',l:'Judul',t:'text',req:1,full:1},
     {k:'sub',l:'Subjudul',t:'textarea',full:1},
     {k:'umb',l:'Payung program',t:'text',ph:'Life by Design'},
     {k:'aud',l:'Audiens',t:'text'},
     {k:'fmt',l:'Format',t:'sel',opt:PRG_FMT},
     {k:'lang',l:'Bahasa',t:'sel',opt:['Indonesia','English','Dua bahasa']},
     {k:'target',l:'Target durasi (menit)',t:'num'},
     {k:'parent',l:'Varian dari program induk',t:'rel',rel:'PRG'},
     {g:'Isi'},
     {k:'desc',l:'Deskripsi',t:'textarea',full:1},
     {k:'goal',l:'Tujuan',t:'textarea',full:1},
     {k:'outcome',l:'Hasil akhir peserta',t:'textarea',full:1},
     {k:'media',l:'Kebutuhan media',t:'textarea',full:1},
     {g:'Status'},
     {k:'st',l:'Status',t:'sel',opt:PRG_ST}]
};

if(SCH_ORDER.indexOf('MOD') === -1) SCH_ORDER.push('MOD','PRG');
MODULE_ENTITIES.knowledge = ['KNW','LRN','PRK','BHN','MOD','PRG'];

/* ---------------- 3. VERSI MODUL ----------------
   Versi naik hanya kalau ISI berubah, bukan tiap kali disimpan.
   Program yang sudah disematkan menyimpan versi + salinannya, sehingga
   revisi modul berikutnya tidak mengubah program yang sudah dipakai. */

function modStamp(m){
  return ['n','aud','dur','obj','msg','topics','story','ex','outcome','refl']
    .map(k => m[k] || '').join('\u0001');
}
function modVer(m){
  if(!m || !m._m) return 1;
  const s = modStamp(m);
  if(m._m.mstamp === undefined){ m._m.mstamp = s; m._m.ver = m._m.ver || 1; saveStore(); }
  else if(m._m.mstamp !== s){ m._m.mstamp = s; m._m.ver = (m._m.ver || 1) + 1; saveStore(); }
  return m._m.ver;
}

/* ---------------- 4. SUSUNAN PROGRAM & RUNDOWN ----------------
   _m.plan = daftar item berurutan. Durasi dihitung SEKALI per item:
   item modul memakai durasi modulnya, item lain memakai durasinya sendiri. */

const OTH_KIND = ['MC','Video','Aji masuk','Aktivitas','Jeda','Tanya jawab','Penutup','Lainnya'];
const plan = p => (p && p._m && Array.isArray(p._m.plan)) ? p._m.plan : [];
function planSet(p, items){ p._m.plan = items; p._m.updated_at = new Date().toISOString(); saveStore(); }

function itemDur(it){
  if(it.k === 'mod'){
    if(it.ver && it.snap) return Number(it.snap.dur) || 0;      /* sudah disematkan */
    const m = recById(it.id); return m ? (Number(m.dur) || 0) : 0;
  }
  return Number(it.dur) || 0;
}
function itemName(it){
  if(it.k === 'mod'){
    if(it.ver && it.snap) return it.snap.n;
    const m = recById(it.id); return m ? m.n : '(modul tidak ditemukan)';
  }
  return it.n || it.t;
}
const planTotal = p => plan(p).reduce((s,it) => s + itemDur(it), 0);
function planDelta(p){
  const t = Number(p.target) || 0;
  return t ? planTotal(p) - t : null;
}
/* modul yang dipakai program ini, tanpa duplikat hitungan */
const planMods = p => plan(p).filter(x => x.k === 'mod');

function prgAddMod(pid, mid){
  const p = recById(pid), m = recById(mid); if(!p || !m) return;
  planSet(p, plan(p).concat([{ k:'mod', id:mid }]));
  logAct('UPDATE', p, 'Modul ditambahkan: ' + m.id);
  go('knowledge');
}
function prgAddOther(pid){
  const p = recById(pid); if(!p) return;
  modal('Tambah agenda nonmodul', 'Item ini punya durasinya sendiri dan tidak mengambil dari modul mana pun.',
    `<div class="frm">
      <div class="fld"><label>Jenis</label><select id="ohK">${OTH_KIND.map(k=>`<option>${k}</option>`).join('')}</select></div>
      <div class="fld"><label>Durasi (menit)</label><input id="ohD" type="number" min="0" value="10"></div>
      <div class="fld full"><label>Nama</label><input id="ohN" type="text" placeholder="Pembukaan MC"></div>
    </div>`,
    `<button class="btn solid" onclick="prgAddOtherSave('${pid}')">${ic('check')} Tambah</button>
     <button class="btn ghost" onclick="closeModal()">Batal</button>`);
}
function prgAddOtherSave(pid){
  const p = recById(pid); if(!p) return;
  const t = document.getElementById('ohK').value;
  const d = Number(document.getElementById('ohD').value) || 0;
  const n = (document.getElementById('ohN').value || '').trim() || t;
  planSet(p, plan(p).concat([{ k:'oth', t, n, dur:d }]));
  closeModal(); go('knowledge');
}
/* Melepas hanya memutus hubungan. Modulnya tetap ada. */
function prgDrop(pid, i){
  const p = recById(pid); if(!p) return;
  const it = plan(p)[i]; if(!it) return;
  if(it.k === 'mod'){
    modal('Lepas modul dari program?',
      'Yang dihapus hanya hubungannya dengan program ini. <b>Modulnya sendiri tetap ada</b> di daftar Modul dan tetap bisa dipakai program lain.',
      `<div class="mini">Modul: <b>${h(itemName(it))}</b></div>`,
      `<button class="btn red" onclick="prgDropGo('${pid}',${i})">Lepas dari program</button>
       <button class="btn ghost" onclick="closeModal()">Batal</button>`);
    return;
  }
  prgDropGo(pid, i);
}
function prgDropGo(pid, i){
  const p = recById(pid); if(!p) return;
  const items = plan(p).slice(); const [it] = items.splice(i,1);
  planSet(p, items); logAct('UPDATE', p, 'Dilepas dari susunan: ' + itemName(it));
  closeModal(); go('knowledge');
}
function prgMove(pid, i, d){
  const p = recById(pid); if(!p) return;
  const items = plan(p).slice(), j = i + d;
  if(j < 0 || j >= items.length) return;
  const t = items[i]; items[i] = items[j]; items[j] = t;
  planSet(p, items); go('knowledge');
}

/* Sematkan versi modul saat program dipakai */
function prgPin(pid){
  const p = recById(pid); if(!p) return;
  const items = plan(p).map(it => {
    if(it.k !== 'mod') return it;
    const m = recById(it.id); if(!m) return it;
    return { k:'mod', id:it.id, ver:modVer(m), snap:{ n:m.n, dur:Number(m.dur)||0 } };
  });
  planSet(p, items);
  logAct('UPDATE', p, 'Versi modul disematkan');
  toast('Versi modul disematkan — revisi berikutnya tidak mengubah program ini');
  go('knowledge');
}
function prgUnpin(pid){
  const p = recById(pid); if(!p) return;
  planSet(p, plan(p).map(it => it.k === 'mod' ? { k:'mod', id:it.id } : it));
  logAct('UPDATE', p, 'Sematan versi dilepas');
  go('knowledge');
}
/* modul yang sudah berubah sejak disematkan */
function prgStale(p){
  return planMods(p).filter(it => {
    if(!it.ver) return false;
    const m = recById(it.id);
    return m && modVer(m) !== it.ver;
  });
}

/* ---------------- 5. KESIAPAN ----------------
   Setiap kekurangan bisa dibuka untuk diperbaiki. */

function modChecks(m){
  const srcs = npLinks(m).map(recById).filter(x => x && typeOf(x) === 'BHN');
  const noPerm = srcs.filter(b => b.perm !== 'Boleh dibagikan');
  return [
    { ok: !!m.obj,      t:'Tujuan belajar terisi',            a:`openForm('MOD','${m.id}')` },
    { ok: !!m.aud,      t:'Audiens ditentukan',               a:`openForm('MOD','${m.id}')` },
    { ok: !!(m.topics || m.story), t:'Isi atau cerita terisi', a:`openForm('MOD','${m.id}')` },
    { ok: !!Number(m.dur), t:'Durasi ditentukan',             a:`openForm('MOD','${m.id}')` },
    { ok: !!m.outcome,  t:'Hasil peserta terisi',             a:`openForm('MOD','${m.id}')` },
    { ok: noPerm.length === 0,
      t: srcs.length ? 'Izin seluruh bahan sumber sudah diputuskan' : 'Belum ada bahan sumber yang ditautkan',
      sub: noPerm.length ? noPerm.length + ' bahan belum berizin bagikan' : (srcs.length ? '' : 'Boleh saja, tapi modul tanpa sumber tidak punya jejak asal'),
      a:`shTab('bank')`, soft: !srcs.length }
  ];
}
function prgChecks(p){
  const mods = planMods(p).map(it => recById(it.id)).filter(Boolean);
  const notReady = mods.filter(m => m.st !== 'Siap Digunakan');
  const d = planDelta(p);
  const stale = prgStale(p);
  return [
    { ok: !!p.aud,     t:'Audiens ditentukan',      a:`openForm('PRG','${p.id}')` },
    { ok: !!p.goal,    t:'Tujuan belajar tersedia', a:`openForm('PRG','${p.id}')` },
    { ok: !!p.outcome, t:'Hasil akhir peserta terisi', a:`openForm('PRG','${p.id}')` },
    { ok: mods.length > 0, t:'Program punya modul', a:`prgOpen('${p.id}','mod')` },
    { ok: notReady.length === 0, t:'Semua modul siap digunakan',
      sub: notReady.length ? notReady.length + ' modul belum siap' : '', a:`prgOpen('${p.id}','mod')` },
    { ok: d !== null && Math.abs(d) <= 5, t:'Durasi sesuai target',
      sub: d === null ? 'Target durasi belum diisi' : (d === 0 ? '' : (d > 0 ? 'Kelebihan ' + d + ' menit' : 'Kurang ' + (-d) + ' menit')),
      a:`prgOpen('${p.id}','run')` },
    { ok: stale.length === 0, t:'Versi modul yang dipakai masih mutakhir',
      sub: stale.length ? stale.length + ' modul berubah setelah disematkan' : '', a:`prgOpen('${p.id}','mod')` }
  ];
}
function checkList(rows){
  return `<div class="list">${rows.map(c => `
    <div class="row-i" style="align-items:flex-start;cursor:${c.ok?'default':'pointer'}" ${c.ok?'':`onclick="${c.a}"`}>
      <span style="flex:0 0 18px;color:${c.ok?'var(--green)':(c.soft?'var(--text-3)':'var(--orange)')};font-weight:800">${c.ok?'✓':'○'}</span>
      <span style="flex:1"><span class="t" style="font-weight:${c.ok?500:600}">${h(c.t)}</span>
      ${c.sub?`<span class="s">${h(c.sub)}</span>`:''}</span>
      ${c.ok?'':'<span class="mini">perbaiki →</span>'}</div>`).join('')}</div>`;
}

/* ---------------- 6. TAMPILAN SHARE ---------------- */

let SH_TAB = 'ov', PRG_OPEN_ID = null, PRG_TAB = 'sum';
const SH_TABS = [['ov','Overview'],['bank','Bank Bahan'],['mod','Modul'],['prg','Program']];
function shTab(k){ SH_TAB = k; PRG_OPEN_ID = null; KN_TAB = 'bhn'; go('knowledge'); }
function prgOpen(id, tab){ PRG_OPEN_ID = id; PRG_TAB = tab || 'sum'; SH_TAB = 'prg'; KN_TAB = 'bhn'; go('knowledge'); }
function prgTab(k){ PRG_TAB = k; go('knowledge'); }

let BK_FILTER = '';
function bkFilter(v){ BK_FILTER = v; go('knowledge'); }

function shOverview(){
  const B = recs('BHN'), M = recs('MOD'), P = recs('PRG');
  const tile = (name, cnt, sub, col, tab, act, al) => `
    <div class="card" style="flex:1;min-width:205px">
      ${cardH('doc', name, col, `<span class="mini">${cnt}</span>`)}
      <div class="mini" style="margin-bottom:10px">${sub}</div>
      <div class="flexr" style="gap:8px">
        <button class="btn solid sm" onclick="${act}">${ic('plus')} ${al}</button>
        <button class="btn ghost sm" onclick="shTab('${tab}')">Lihat →</button></div></div>`;
  const draftP = P.filter(x => x.st !== 'Siap Digunakan' && x.st !== 'Diarsipkan');
  return `
  <div class="flexr" style="gap:14px;flex-wrap:wrap;align-items:stretch">
    ${tile('Bank Bahan', B.length + ' bahan', 'Cerita, insight, studi kasus — bahan mentah mengajar.', 'orange', 'bank', "openForm('BHN')", 'Tambah Bahan')}
    ${tile('Modul', M.length + ' modul', 'Satu bagian pembelajaran, bisa dipakai banyak program.', 'orange', 'mod', "openForm('MOD')", 'Buat Modul')}
    ${tile('Program', P.length + ' program', 'Susunan modul dan agenda menjadi satu acara.', 'gold', 'prg', "openForm('PRG')", 'Buat Program')}
  </div>
  <div class="card" style="margin-top:18px">
    ${cardH('target','Alur Share','gold')}
    <div class="flexr" style="gap:10px;flex-wrap:wrap;align-items:center">
      <span class="pill orange">Bahan</span><span class="mini">→</span>
      <span class="pill orange">Modul</span><span class="mini">→</span>
      <span class="pill gold">Program</span>
      <span class="mini" style="margin-left:auto">Satu modul bisa dipakai banyak program. Melepasnya tidak menghapus modulnya.</span>
    </div></div>
  ${draftP.length ? `<div class="card" style="margin-top:18px">
    ${cardH('layers','Program yang sedang disusun','gold',`<span class="mini">${draftP.length}</span>`)}
    <div class="list">${draftP.map(p => {
      const c = prgChecks(p), done = c.filter(x => x.ok).length;
      return `<button class="row-i" style="width:100%;text-align:left" onclick="prgOpen('${p.id}')">
        ${ic('layers')}<span style="flex:1"><span class="t">${h(p.n)}</span>
        <span class="s">${h([p.fmt, p.aud].filter(Boolean).join(' · '))} · kesiapan ${done}/${c.length}</span></span>
        <span class="pill gold">${h(p.st || 'Draft')}</span></button>`;
    }).join('')}</div></div>` : ''}`;
}

function shBank(){
  const all = recs('BHN');
  const kinds = ['Semua','Cerita','Insight','Studi kasus','Media'];
  const inKind = b => BK_FILTER === '' || BK_FILTER === 'Semua' ? true
    : BK_FILTER === 'Media' ? ['Foto','Video','Dokumen'].indexOf(b.kind) !== -1
    : b.kind === BK_FILTER;
  const rows = all.filter(inKind);
  const head = `<div class="card" style="margin-bottom:16px">
    <div class="flexr" style="gap:8px;flex-wrap:wrap">
      ${kinds.map(k => `<button class="chip ${(BK_FILTER||'Semua')===k?'on':''}" onclick="bkFilter('${k}')">${k}</button>`).join('')}
      <button class="btn solid sm" style="margin-left:auto" onclick="openForm('BHN')">${ic('plus')} Tambah Bahan</button>
    </div>
    <div class="mini" style="margin-top:9px">Sumber tetap terhubung, tanpa duplikasi record. Status peninjauan dan izin berbagi dipisah.</div></div>`;
  if(!all.length) return head + emptyCard('users','orange','Bank Bahan masih kosong',
    'Bahan lahir dari pembelajaran dan pengalaman yang sudah ada — lewat pilihan Anda, tidak pernah disalin otomatis.',
    `<button class="btn solid" onclick="knTab('lrn')">Lihat Learn</button>`);
  if(!rows.length) return head + `<div class="card"><div class="mini">Tidak ada bahan berjenis "${h(BK_FILTER)}". ${all.length} bahan lain tetap ada.</div></div>`;
  return head + `<div class="card"><div class="list">${rows.map(b => {
    const src = [b.learn, b.prak, b.knw, b.cnt].filter(Boolean);
    const warn = npSrcChanged(b);
    return `<div class="row-i" style="align-items:flex-start">
      ${ic('users')}<span style="flex:1">
      <span class="t">${h(b.n)}</span>
      <span class="s">${h(b.msg || '').slice(0,110)}${(b.msg||'').length>110?'…':''}</span>
      <span class="flexr" style="gap:6px;margin-top:7px;flex-wrap:wrap">
        ${b.kind?`<span class="pill gray">${h(b.kind)}</span>`:''}
        <span class="pill ${b.st==='Disetujui'?'green':'orange'}">${h(b.st||'Draft')}</span>
        <span class="pill ${b.perm==='Boleh dibagikan'?'green':'gray'}">${h(b.perm||'Izin belum diputuskan')}</span>
        ${src.length?`<span class="pill blue">${src.length} sumber</span>`:'<span class="pill gray">input langsung</span>'}
        ${warn?`<span class="pill red">SUMBER BERUBAH</span>`:''}
        <button class="btn ghost sm" onclick="recDetail('${b.id}')">Buka</button>
        <button class="btn ghost sm" onclick="bhnToMod('${b.id}')">Gunakan di Modul</button>
      </span></span></div>`;
  }).join('')}</div></div>`;
}

/* Menautkan bahan ke modul — tanpa menyalin isinya */
function bhnToMod(bid){
  const b = recById(bid); if(!b) return;
  const mods = recs('MOD');
  modal('Gunakan bahan di modul', 'Bahan <b>' + h(b.n) + '</b> ditautkan ke modul. Isinya tidak disalin — modul merujuk sumber yang sama.',
    mods.length ? `<div class="list">${mods.map(m => `
      <button class="row-i" style="width:100%;text-align:left" onclick="bhnToModGo('${bid}','${m.id}')">
        ${ic('doc')}<span style="flex:1"><span class="t">${h(m.n)}</span><span class="s">${h(m.st||'Draft')} · ${m.id}</span></span>
        ${npLinks(m).indexOf(bid)!==-1?'<span class="pill green">sudah tertaut</span>':''}</button>`).join('')}</div>`
      : `<p class="mini">Belum ada modul. Buat satu dulu.</p>`,
    `<button class="btn ghost" onclick="closeModal();openForm('MOD')">${ic('plus')} Modul baru</button>
     <button class="btn ghost" onclick="closeModal()">Tutup</button>`, true);
}
function bhnToModGo(bid, mid){
  npAddLink(mid, bid) ? toast('Bahan ditautkan ke modul') : toast('Bahan itu sudah tertaut di modul ini');
  closeModal(); go('knowledge');
}

function shModul(){
  const all = recs('MOD');
  const head = `<div class="card" style="margin-bottom:16px">
    <div class="flexr" style="gap:8px;flex-wrap:wrap">
      <span class="mini" style="flex:1">Draft cukup judul. Status naik saat Anda melengkapinya, dan kesiapan menunjukkan apa yang masih kurang.</span>
      <button class="btn solid sm" onclick="openForm('MOD')">${ic('plus')} Buat Modul</button></div></div>`;
  if(!all.length) return head + emptyCard('doc','orange','Belum ada modul',
    'Modul adalah satu bagian pembelajaran yang berdiri sendiri — bisa dipakai di banyak program tanpa digandakan.',
    `<button class="btn solid" onclick="openForm('MOD')">${ic('plus')} Modul pertama</button>`);
  return head + `<div class="card"><div class="list">${all.map(m => {
    const c = modChecks(m), done = c.filter(x => x.ok).length;
    const used = recs('PRG').filter(p => planMods(p).some(x => x.id === m.id));
    return `<div class="row-i" style="align-items:flex-start">
      ${ic('doc')}<span style="flex:1">
      <span class="t">${h(m.n)}</span>
      <span class="s">${h(m.aud || 'audiens belum ditentukan')} · ${m.dur ? m.dur + ' menit' : 'durasi belum diisi'} · v${modVer(m)}</span>
      <span class="flexr" style="gap:6px;margin-top:7px;flex-wrap:wrap">
        <span class="pill ${m.st==='Siap Digunakan'?'green':'orange'}">${h(m.st||'Draft')}</span>
        <span class="pill gray">kesiapan ${done}/${c.length}</span>
        ${used.length?`<span class="pill blue">dipakai ${used.length} program</span>`:'<span class="pill gray">belum dipakai</span>'}
        <button class="btn ghost sm" onclick="openForm('MOD','${m.id}')">Ubah</button>
        <button class="btn ghost sm" onclick="modReady('${m.id}')">Kesiapan</button>
      </span></span></div>`;
  }).join('')}</div></div>`;
}
function modReady(id){
  const m = recById(id); if(!m) return;
  const c = modChecks(m), done = c.filter(x => x.ok).length;
  const srcs = npLinks(m).map(recById).filter(x => x && typeOf(x) === 'BHN');
  modal('Kesiapan modul', h(m.n) + ' · versi ' + modVer(m) + ' · ' + done + ' dari ' + c.length + ' terpenuhi',
    checkList(c) + (srcs.length ? `<div class="sep" style="margin:16px 0"></div>
      <div class="fgroup" style="border:0;padding:0;margin:0 0 8px">Bahan sumber</div>
      <div class="list">${srcs.map(b => `<div class="row-i">
        <span style="flex:1"><span class="t">${h(b.n)}</span><span class="s">${h(b.st||'Draft')}</span></span>
        <span class="pill ${b.perm==='Boleh dibagikan'?'green':'orange'}">${h(b.perm||'Izin belum diputuskan')}</span></div>`).join('')}</div>` : ''),
    `<button class="btn solid" onclick="closeModal();openForm('MOD','${id}')">Lengkapi modul</button>
     <button class="btn ghost" onclick="closeModal()">Tutup</button>`, true);
}

/* ---------------- 7. PROGRAM ---------------- */

const PRG_TABS = [['sum','Ringkasan'],['mod','Susunan Modul'],['run','Rundown'],
                  ['bah','Bahan & Media'],['sia','Kesiapan'],['riw','Riwayat']];

function shProgram(){
  if(PRG_OPEN_ID) return prgDetail(PRG_OPEN_ID);
  const all = recs('PRG');
  const head = `<div class="card" style="margin-bottom:16px">
    <div class="flexr" style="gap:8px;flex-wrap:wrap">
      <span class="mini" style="flex:1">Program menggabungkan modul dengan agenda nonmodul. Durasi dihitung sekali per item.</span>
      <button class="btn solid sm" onclick="openForm('PRG')">${ic('plus')} Buat Program</button></div></div>`;
  if(!all.length) return head + emptyCard('layers','gold','Belum ada program',
    'Program adalah bentuk akhir: modul, MC, video, jeda, dan penutup disusun jadi satu acara dengan durasi yang benar.',
    `<button class="btn solid" onclick="openForm('PRG')">${ic('plus')} Program pertama</button>`);
  return head + `<div class="card"><div class="list">${all.map(p => {
    const c = prgChecks(p), done = c.filter(x => x.ok).length, d = planDelta(p);
    return `<button class="row-i" style="width:100%;text-align:left;align-items:flex-start" onclick="prgOpen('${p.id}')">
      ${ic('layers')}<span style="flex:1">
      <span class="t">${h(p.n)}</span>
      <span class="s">${h([p.fmt, p.aud].filter(Boolean).join(' · '))} · ${planTotal(p)} menit${d!==null?' dari target '+p.target:''}</span>
      <span class="flexr" style="gap:6px;margin-top:7px;flex-wrap:wrap">
        <span class="pill gold">${h(p.st||'Draft')}</span>
        <span class="pill gray">kesiapan ${done}/${c.length}</span>
        <span class="pill blue">${planMods(p).length} modul</span>
      </span></span></button>`;
  }).join('')}</div></div>`;
}

function prgDetail(id){
  const p = recById(id); if(!p){ PRG_OPEN_ID = null; return shProgram(); }
  const c = prgChecks(p), done = c.filter(x => x.ok).length;
  const head = `
  <div class="flexr" style="gap:10px;margin-bottom:14px">
    <button class="btn ghost sm" onclick="PRG_OPEN_ID=null;go('knowledge')">← Semua program</button>
    <span class="mini">${p.id}</span>
  </div>
  <div class="card" style="margin-bottom:16px">
    <div class="flexr" style="align-items:flex-start;gap:14px">
      <div style="flex:1;min-width:220px">
        <h2 style="font-family:var(--fd);font-size:25px;margin:0 0 3px">${h(p.n)}</h2>
        <div class="mini">${h(p.sub || '')}</div>
        <div class="flexr" style="gap:6px;margin-top:10px;flex-wrap:wrap">
          <span class="pill gold">${h(p.st || 'Draft')}</span>
          ${p.fmt?`<span class="pill blue">${h(p.fmt)}</span>`:''}
          ${p.aud?`<span class="pill gray">${h(p.aud)}</span>`:''}
          <span class="pill ${done===c.length?'green':'orange'}">kesiapan ${done}/${c.length}</span>
        </div>
      </div>
      <div class="flexr" style="gap:7px;flex-wrap:wrap">
        <button class="btn ghost sm" onclick="openForm('PRG','${p.id}')">Ubah</button>
      </div>
    </div>
  </div>
  <div class="tabbar">${PRG_TABS.map(([k,n]) => {
    const b = k === 'sia' ? (c.length - done) : 0;
    return `<button class="${PRG_TAB===k?'on':''}" onclick="prgTab('${k}')">${n}${b?` <span class="cnt">${b}</span>`:''}</button>`;
  }).join('')}</div>`;
  const V = { sum:prgSum, mod:prgModTab, run:prgRun, bah:prgBahan, sia:prgSiap, riw:prgRiwayat };
  return head + (V[PRG_TAB] || prgSum)(p);
}

function prgSum(p){
  const kv = (k,v) => v ? `<dt>${k}</dt><dd>${h(String(v)).replace(/\n/g,'<br>')}</dd>` : '';
  const d = planDelta(p);
  return `<div class="flexr" style="gap:14px;flex-wrap:wrap;align-items:flex-start">
    <div class="card" style="flex:2;min-width:290px">
      ${cardH('doc','Ringkasan','gold')}
      <dl class="kv">
        ${kv('Payung', p.umb)}${kv('Audiens', p.aud)}${kv('Format', p.fmt)}${kv('Bahasa', p.lang)}
        ${kv('Target durasi', p.target ? p.target + ' menit' : '')}
        ${kv('Deskripsi', p.desc)}${kv('Tujuan', p.goal)}${kv('Hasil akhir', p.outcome)}
      </dl>
      ${!p.desc && !p.goal ? '<div class="mini">Deskripsi dan tujuan belum diisi.</div>' : ''}
    </div>
    <div class="card" style="flex:1;min-width:230px">
      ${cardH('clock','Durasi','blue')}
      <div class="kpi"><div><b>${planTotal(p)}</b><span>menit tersusun</span></div></div>
      <div class="sep" style="margin:12px 0"></div>
      ${p.target ? `<div class="mini">Target <b>${p.target} menit</b> · ${
        d === 0 ? '<span style="color:var(--green)">pas</span>'
        : d > 0 ? `<span style="color:var(--orange)">kelebihan ${d} menit</span>`
        : `<span style="color:var(--orange)">kurang ${-d} menit</span>`}</div>`
        : '<div class="mini">Target durasi belum diisi.</div>'}
      <div class="mini" style="margin-top:8px">${planMods(p).length} modul · ${plan(p).length - planMods(p).length} agenda nonmodul</div>
    </div></div>`;
}

function prgModTab(p){
  const mods = planMods(p);
  const avail = recs('MOD').filter(m => !mods.some(x => x.id === m.id));
  const pinned = mods.some(x => x.ver);
  const stale = prgStale(p);
  return `
  ${pinned ? `<div class="statebar" style="margin-bottom:16px">
    <span class="dbadge" style="background:var(--blue)">DISEMATKAN</span>
    <div style="flex:1;min-width:200px">Program ini memakai <b>versi modul yang disematkan</b>. Revisi modul berikutnya tidak mengubah program ini.
    ${stale.length ? `<b style="color:var(--orange)"> ${stale.length} modul sudah berubah sejak disematkan.</b>` : ''}</div>
    <button class="btn ghost sm" onclick="prgUnpin('${p.id}')">Lepas sematan</button>
    ${stale.length ? `<button class="btn ghost sm" onclick="prgPin('${p.id}')">Sematkan ulang</button>` : ''}</div>`
   : `<div class="statebar" style="margin-bottom:16px">
    <span class="dbadge" style="background:var(--gray)">MENGIKUTI</span>
    <div style="flex:1;min-width:200px">Program ini mengikuti versi modul terbaru. Sematkan versi saat program dipakai, supaya revisi berikutnya tidak mengubahnya.</div>
    ${mods.length ? `<button class="btn ghost sm" onclick="prgPin('${p.id}')">Sematkan versi sekarang</button>` : ''}</div>`}
  <div class="card" style="margin-bottom:16px">
    ${cardH('layers','Modul dalam program','gold',`<span class="mini">${mods.length}</span>`)}
    ${mods.length ? `<div class="list">${plan(p).map((it,i) => it.k !== 'mod' ? '' : (() => {
      const m = recById(it.id);
      const changed = it.ver && m && modVer(m) !== it.ver;
      return `<div class="row-i" style="align-items:flex-start">
        ${ic('doc')}<span style="flex:1"><span class="t">${h(itemName(it))}</span>
        <span class="s">${itemDur(it)} menit${it.ver?` · versi ${it.ver} disematkan`:(m?` · versi ${modVer(m)}`:'')}${m?'':' · modul tidak ditemukan'}</span>
        <span class="flexr" style="gap:6px;margin-top:7px;flex-wrap:wrap">
          ${m?`<span class="pill ${m.st==='Siap Digunakan'?'green':'orange'}">${h(m.st||'Draft')}</span>`:'<span class="pill red">hilang</span>'}
          ${changed?`<span class="pill orange">modul berubah ke v${modVer(m)}</span>`:''}
          ${m?`<button class="btn ghost sm" onclick="openForm('MOD','${m.id}')">Ubah modul</button>`:''}
          <button class="btn ghost sm" onclick="prgDrop('${p.id}',${i})">Lepas</button>
        </span></span></div>`;
    })()).join('')}</div>` : '<div class="mini">Belum ada modul dalam program ini.</div>'}
  </div>
  <div class="card">
    ${cardH('plus','Tambahkan modul','orange')}
    ${avail.length ? `<div class="list">${avail.map(m => `
      <div class="row-i"><span style="flex:1"><span class="t">${h(m.n)}</span>
      <span class="s">${m.dur?m.dur+' menit':'durasi belum diisi'} · ${h(m.st||'Draft')}</span></span>
      <button class="btn ghost sm" onclick="prgAddMod('${p.id}','${m.id}')">Tambahkan</button></div>`).join('')}</div>`
     : `<div class="mini">Semua modul yang ada sudah dipakai di program ini. <button class="btn ghost sm" onclick="openForm('MOD')">Buat modul baru</button></div>`}
  </div>`;
}

function prgRun(p){
  const items = plan(p), d = planDelta(p);
  return `
  <div class="card" style="margin-bottom:16px">
    <div class="flexr" style="gap:10px;flex-wrap:wrap;align-items:center">
      <div style="flex:1;min-width:200px"><b style="font-family:var(--fd);font-size:22px">${planTotal(p)} menit</b>
      <span class="mini"> tersusun${p.target?` dari target ${p.target} menit`:''}</span></div>
      ${p.target ? `<span class="pill ${d===0?'green':'orange'}">${d===0?'pas':(d>0?'kelebihan '+d+' menit':'kurang '+(-d)+' menit')}</span>` : '<span class="pill gray">target belum diisi</span>'}
      <button class="btn ghost sm" onclick="prgAddOther('${p.id}')">${ic('plus')} Agenda nonmodul</button>
      <button class="btn ghost sm" onclick="prgOpen('${p.id}','mod')">${ic('plus')} Modul</button>
    </div>
    <div class="mini" style="margin-top:8px">Durasi dihitung sekali per item. Item modul memakai durasi modulnya; agenda nonmodul memakai durasinya sendiri.</div>
  </div>
  <div class="card">
    ${cardH('clock','Rundown','blue',`<span class="mini">${items.length} item</span>`)}
    ${items.length ? `<div class="list">${items.map((it,i) => `
      <div class="row-i" style="align-items:flex-start">
        <span style="flex:0 0 26px;font-family:var(--fd);font-size:17px;color:var(--gold-dark)">${i+1}</span>
        <span style="flex:1"><span class="t">${h(itemName(it))}</span>
        <span class="s">${it.k==='mod'?'Modul':h(it.t||'Agenda')} · ${itemDur(it)} menit</span></span>
        <span class="flexr" style="gap:4px">
          <button class="btn ghost sm" onclick="prgMove('${p.id}',${i},-1)" ${i===0?'disabled style="opacity:.4"':''} aria-label="Naikkan">↑</button>
          <button class="btn ghost sm" onclick="prgMove('${p.id}',${i},1)" ${i===items.length-1?'disabled style="opacity:.4"':''} aria-label="Turunkan">↓</button>
          <button class="btn ghost sm" onclick="prgDrop('${p.id}',${i})">Lepas</button>
        </span></div>`).join('')}</div>`
     : '<div class="mini">Rundown masih kosong. Tambahkan modul atau agenda nonmodul.</div>'}
  </div>`;
}

function prgBahan(p){
  const mods = planMods(p).map(it => recById(it.id)).filter(Boolean);
  const bahan = [];
  mods.forEach(m => npLinks(m).forEach(bid => {
    const b = recById(bid);
    if(b && typeOf(b) === 'BHN' && !bahan.some(x => x.b.id === bid)) bahan.push({ b, via:m });
  }));
  const noPerm = bahan.filter(x => x.b.perm !== 'Boleh dibagikan');
  return `
  ${noPerm.length ? `<div class="statebar del" style="margin-bottom:16px">
    <span class="dbadge" style="background:var(--red)">IZIN</span>
    <div style="flex:1;min-width:200px"><b>${noPerm.length} bahan</b> belum berizin dibagikan. Peninjauan isi dan izin berbagi memang dipisah —
    bahan yang benar belum tentu boleh diberikan kepada peserta.</div></div>` : ''}
  <div class="card" style="margin-bottom:16px">
    ${cardH('users','Bahan yang dipakai lewat modul','orange',`<span class="mini">${bahan.length}</span>`)}
    ${bahan.length ? `<div class="list">${bahan.map(({b,via}) => `
      <div class="row-i" style="align-items:flex-start">
        <span style="flex:1"><span class="t">${h(b.n)}</span>
        <span class="s">lewat modul ${h(via.n)}</span>
        <span class="flexr" style="gap:6px;margin-top:6px;flex-wrap:wrap">
          <span class="pill ${b.st==='Disetujui'?'green':'orange'}">${h(b.st||'Draft')}</span>
          <span class="pill ${b.perm==='Boleh dibagikan'?'green':'red'}">${h(b.perm||'Izin belum diputuskan')}</span>
        </span></span>
        <button class="btn ghost sm" onclick="recDetail('${b.id}')">Buka</button></div>`).join('')}</div>`
     : '<div class="mini">Belum ada bahan yang tertaut lewat modul program ini.</div>'}
  </div>
  <div class="card">
    ${cardH('mega','Kebutuhan media','gold')}
    <div>${p.media ? h(p.media).replace(/\n/g,'<br>') : '<span class="mini">Belum diisi.</span>'}</div>
    <div class="mini" style="margin-top:10px">Slide Studio dan presentasi bukan bagian paket ini — belum dibangun, jadi belum ada tombolnya.</div>
  </div>`;
}

function prgSiap(p){
  const c = prgChecks(p), done = c.filter(x => x.ok).length;
  return `<div class="card">
    ${cardH('check','Kesiapan program','gold',`<span class="mini">${done} dari ${c.length}</span>`)}
    <div class="mini" style="margin-bottom:12px">Setiap baris yang belum terpenuhi bisa diketuk untuk langsung diperbaiki.</div>
    ${checkList(c)}
    <div class="sep" style="margin:16px 0"></div>
    <div class="flexr" style="gap:8px;flex-wrap:wrap">
      <button class="btn solid sm" onclick="openForm('PRG','${p.id}')">Ubah program</button>
      ${done === c.length && p.st !== 'Siap Digunakan'
        ? `<button class="btn grn sm" onclick="prgReady('${p.id}')">Tandai Siap Digunakan</button>`
        : `<span class="mini">${done===c.length?'Sudah ditandai siap digunakan.':'Lengkapi kekurangan di atas sebelum bisa ditandai siap.'}</span>`}
    </div></div>`;
}
function prgReady(id){
  const p = recById(id); if(!p) return;
  if(prgChecks(p).some(x => !x.ok)){ toast('Masih ada kekurangan — tidak ditandai siap'); return; }
  p.st = 'Siap Digunakan'; prgPin(id);
  logAct('UPDATE', p, 'Ditandai Siap Digunakan');
  toast('Program ditandai siap digunakan, versi modul disematkan');
}

function prgRiwayat(p){
  const rows = (STORE.log || []).filter(e => e.id === p.id);
  return `<div class="card">
    ${cardH('clock','Riwayat perubahan','gray',`<span class="mini">${rows.length}</span>`)}
    ${rows.length ? `<div class="list">${rows.map(e => `
      <div class="row-i"><span style="flex:1"><span class="t">${h(ACT_LABEL[e.act] || e.act)}</span>
      <span class="s">${dtID(e.ts)}${e.note?' · '+h(e.note):''}</span></span></div>`).join('')}</div>`
     : '<div class="mini">Belum ada perubahan tercatat.</div>'}
    <div class="mini" style="margin-top:10px">Hanya perubahan yang benar-benar terjadi. Tidak ada riwayat lama yang dibuat-buat.</div>
  </div>`;
}

/* ---------------- 8. PASANG KE TAB SHARE ---------------- */

const SH_VIEW = { ov:shOverview, bank:shBank, mod:shModul, prg:shProgram };
/* Tab Share NP-01 diganti dengan empat sub-tab NV-02.
   knShare lama tetap utuh sebagai const di p25 — yang diubah hanya rute tampilannya. */
KN_VIEW.bhn = function(){
  const bar = `<div class="chips" style="margin-bottom:16px">${SH_TABS.map(([k,n]) =>
    `<button class="chip ${SH_TAB===k?'on':''}" onclick="shTab('${k}')">${n}</button>`).join('')}</div>`;
  return bar + (SH_VIEW[SH_TAB] || shOverview)();
};

/* ---------------- 9. DRAFT PROGRAM PERTAMA ----------------
   Dibuat SEKALI, semuanya Draft. Cerita pribadi, foto, angka usaha, dan
   kutipan yang belum dikonfirmasi ditandai sebagai KEBUTUHAN BAHAN —
   tidak ditulis sendiri oleh sistem. */

const NEED = '[KEBUTUHAN BAHAN — menunggu Aji]';

function np02Seed(){
  if(STORE.np02seed) return;
  STORE.np02seed = true;
  const now = new Date().toISOString();
  const mk = (type, v, note) => {
    const r = Object.assign({ id: nextId(type), type }, v);
    r._m = { created_at:now, updated_at:now, created_by:DB.owner.name, updated_by:DB.owner.name,
             status:'ACTIVE', source_type:'MANUAL_ENTRY', source_id:'', source_url:'',
             privacy_level:'TEAM', is_dummy:false, is_archived:false, tags:[] };
    (STORE.rec[type] = STORE.rec[type] || []).unshift(r);
    logAct('CREATE', r, note || 'Draft awal NP-V02');
    return r;
  };

  const m1 = mk('MOD', { n:'Skill Hospitality sebagai Modal', aud:'Mahasiswa pariwisata', dur:15,
    obj:'Mahasiswa mengenali skill hospitality yang sudah dimiliki sebagai modal usaha.',
    msg:'Yang Anda pelajari di kelas dan magang sudah bernilai sebelum ada modal uang.',
    topics:'Pilar: Human Dignity · Business Owner Mentality', story:NEED + ' cerita pribadi Aji',
    ex:'Tulis tiga skill yang paling sering dipuji orang lain.',
    outcome:'Daftar skill pribadi yang bisa dijual.', st:'Draft' });

  const m2 = mk('MOD', { n:'Melihat Masalah sebagai Peluang', aud:'Mahasiswa pariwisata', dur:20,
    obj:'Mahasiswa mengenali masalah pelanggan sebagai peluang usaha.',
    msg:'Peluang tidak dicari, tetapi dikenali dari keluhan yang berulang.',
    topics:'Pilar: Kepuasan Pelanggan · Omzet',
    story:NEED + ' contoh nyata dari unit usaha, termasuk angka yang boleh disebut',
    ex:'Tulis satu skill, satu masalah, dan satu solusi.',
    outcome:'Satu ide usaha yang berasal dari masalah nyata.', st:'Draft' });

  const m3 = mk('MOD', { n:'Rancang Peluang Pertamamu', aud:'Mahasiswa pariwisata', dur:15,
    obj:'Mahasiswa menyusun uji coba tujuh hari yang bisa benar-benar dijalankan.',
    msg:'Rancangan kecil yang diuji mengalahkan rencana besar yang ditunda.',
    topics:'Pilar: Cost · Organization · Kinerja/SDM',
    ex:'Tentukan calon pelanggan pertama, perkiraan biaya, dan langkah hari ke-1 sampai ke-7.',
    outcome:'Rencana uji coba tujuh hari beserta calon pelanggan dan perkiraan biaya.',
    refl:'Apa langkah terkecil yang bisa saya lakukan besok?', st:'Draft' });

  const p = mk('PRG', {
    n:'Your Hospitality Skills Can Be a Business: From Student to Hospitality Entrepreneur',
    sub:'Mengubah Skill, Masalah, dan Pengalaman Hospitality Menjadi Peluang Bisnis.',
    umb:'Life by Design', aud:'Mahasiswa pariwisata', fmt:'Workshop', lang:'Indonesia', target:150,
    desc:'Kerangka sembilan pilar: Spirituality/Ideology · Human Dignity · Business Owner Mentality · Leadership · Organization · Omzet · Kepuasan Pelanggan · Cost · Kinerja/SDM.',
    goal:'Satu peluang bisnis yang bisa diuji dalam tujuh hari.',
    outcome:'Ide usaha, calon pelanggan, gambaran biaya, dan uji coba tujuh hari.',
    media:NEED + ' foto hospitality, video profil 2–3 menit, dan slide.',
    st:'Draft' }, 'Draft program pertama NP-V02');

  p._m.plan = [
    { k:'oth', t:'MC',         n:'Pembukaan MC',            dur:10 },
    { k:'oth', t:'Video',      n:'Video profil 2–3 menit',  dur:5  },
    { k:'oth', t:'Aji masuk',  n:'Aji masuk & pembukaan',   dur:15 },
    { k:'mod', id:m1.id },
    { k:'oth', t:'Aktivitas',  n:'Wellbeing Life Circle',   dur:30 },
    { k:'mod', id:m2.id },
    { k:'oth', t:'Jeda',       n:'Jeda',                    dur:10 },
    { k:'mod', id:m3.id }
  ];
  saveStore();
}
np02Seed();
