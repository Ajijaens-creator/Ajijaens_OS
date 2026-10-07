/* ================================================================
   PHASE 3.1 — SINKRONISASI & CADANGAN
   Dua hal berbeda, sengaja dipisah:

   1. AWAN (tempat kerja)  — halaman OS menyimpan satu berkas data
      miliknya sendiri. Dibuka dari ponsel atau laptop lewat tautan
      yang sama, isinya sama. Ini yang membuat data tidak lagi
      terkurung di satu peramban.

   2. GOOGLE DRIVE (milik Anda) — cadangan bertanggal ke folder
      96 — LIVE DATA. Menulis berkas baru, tidak pernah menimpa.
      Pemulihan lewat mesin impor yang sudah ada, BUKAN otomatis:
      pembacaan kembali berkas data dari konektor Drive terbukti
      tidak bisa diandalkan, dan saya tidak membangun pemulihan
      di atas sesuatu yang bisa membaca kosong lalu menimpa.

   Aturan yang dipegang seluruh berkas ini: tidak pernah membuang
   data tanpa menyalinnya dulu, dan tidak pernah memilih diam-diam
   saat dua versi berbeda.
   ================================================================ */

const CLOUD_FILE   = 'data/ajios-store.json';
const CLOUD_DRIVE_FOLDER = '1iRTqssz5_zAKVpJjhWUf_9s6-7B_rVRE';  /* 96 — LIVE DATA */
const CLOUD_PREV   = 'ajios-data-prev';
const CLOUD_PREF   = 'ajios-cloud-pref';
const CLOUD_DEBOUNCE = 15000;

let CLOUD = {
  ready:false,        /* sudah selesai memeriksa awan */
  avail:null,         /* null = belum tahu · true/false */
  readOnly:false,
  lastPush:null,      /* ISO */
  lastErr:null,       /* {code, at} */
  remote:null,        /* amplop terakhir yang dibaca dari awan */
  conflict:null,      /* {remote, localDirty} — menunggu keputusan Anda */
  busy:false,
  drive:{ avail:null, lastAt:null, lastUrl:null, lastErr:null, busy:false }
};
let CLOUD_PREFS = { auto:true };
try{ const s = localStorage.getItem(CLOUD_PREF); if(s) CLOUD_PREFS = Object.assign(CLOUD_PREFS, JSON.parse(s) || {}); }catch(e){}
function cloudSavePref(){ try{ localStorage.setItem(CLOUD_PREF, JSON.stringify(CLOUD_PREFS)); }catch(e){} }

/* ---------------- revisi lokal ---------------- */
if(typeof STORE.rev !== 'number')     STORE.rev = 0;
if(typeof STORE.baseRev !== 'number') STORE.baseRev = 0;
const cloudDirty = () => Math.max(0, (STORE.rev || 0) - (STORE.baseRev || 0));

/* Setiap penyimpanan lokal menaikkan revisi — itulah yang dihitung
   sebagai "perubahan belum terkirim". */
let cloudT = null;
const _saveStoreBase = saveStore;
saveStore = function(){
  STORE.rev = (STORE.rev || 0) + 1;
  const okSave = _saveStoreBase.apply(this, arguments);
  cloudChip();
  if(CLOUD_PREFS.auto && CLOUD.avail && !CLOUD.conflict){
    clearTimeout(cloudT);
    cloudT = setTimeout(() => cloudPush(true), CLOUD_DEBOUNCE);
  }
  return okSave;
};

/* ---------------- amplop data ---------------- */
function cloudEnvelope(){
  return {
    v: 1,
    rev: STORE.rev || 0,
    savedAt: new Date().toISOString(),
    savedBy: (typeof DB !== 'undefined' && DB.owner) ? DB.owner.name : 'Aji Jaens',
    counts: SCH_ORDER.reduce((o, t) => { const n = allRecs(t).length; if(n) o[t] = n; return o; }, {}),
    seq: STORE.seq || {},
    rec: STORE.rec || {},
    log: STORE.log || [],
    lock: (typeof LOCKLOG !== 'undefined') ? LOCKLOG : []
  };
}
const envCount = e => Object.keys((e && e.rec) || {}).reduce((s, t) => s + e.rec[t].length, 0);

/* Menyalin keadaan sekarang sebelum ditimpa — selalu, tanpa kecuali. */
function cloudKeepPrev(why){
  try{ localStorage.setItem(CLOUD_PREV, JSON.stringify({ why, at:new Date().toISOString(), data: cloudEnvelope() })); }catch(e){}
}
function cloudAdopt(env, why){
  cloudKeepPrev(why || 'sebelum mengambil versi awan');
  STORE.seq = env.seq || {};
  STORE.rec = env.rec || {};
  STORE.log = env.log || [];
  STORE.rev = env.rev || 0;
  STORE.baseRev = env.rev || 0;
  if(typeof LOCKLOG !== 'undefined' && Array.isArray(env.lock) && env.lock.length){
    LOCKLOG = env.lock; if(typeof saveLockLog === 'function') saveLockLog();
  }
  _saveStoreBase();
  CLOUD.remote = env; CLOUD.conflict = null;
  cloudChip();
}

/* ---------------- jembatan ke penyimpanan halaman ---------------- */
let _artifactNs;
async function cloudNs(){
  if(_artifactNs !== undefined) return _artifactNs;
  _artifactNs = null;
  try{
    if(typeof window !== 'undefined' && window.claude && window.claude.use)
      _artifactNs = await window.claude.use('artifact');
  }catch(e){ _artifactNs = null; }
  return _artifactNs;
}

/* Membaca berkas data milik halaman ini. Berkas belum ada = wajar,
   bukan kesalahan: itu keadaan sebelum penyimpanan pertama. */
async function cloudFetch(){
  try{
    const r = await fetch(CLOUD_FILE, { cache:'no-store' });
    if(!r.ok) return null;
    const t = await r.text();
    if(!t || !t.trim()) return null;
    const o = JSON.parse(t);
    return (o && o.rec) ? o : null;
  }catch(e){ return null; }
}

async function cloudBoot(){
  const ns = await cloudNs();
  CLOUD.avail = !!(ns && ns.publish);
  CLOUD.ready = true;
  if(!CLOUD.avail){ cloudChip(); return; }
  const env = await cloudFetch();
  CLOUD.remote = env;
  if(env){
    const dirty = cloudDirty();
    if(env.rev > (STORE.baseRev || 0) && dirty > 0){
      /* Dua versi berbeda. Tidak dipilih diam-diam. */
      CLOUD.conflict = { remote: env, localDirty: dirty };
      cloudConflictBar();
    } else if(env.rev > (STORE.baseRev || 0)){
      cloudAdopt(env, 'mengambil versi awan yang lebih baru saat halaman dibuka');
      toast('Data terbaru diambil dari awan — ' + envCount(env) + ' record');
      if(typeof go === 'function' && typeof CUR !== 'undefined') go(CUR);
    }
  }
  cloudChip();
}

/* ---------------- menyimpan ke awan ---------------- */
async function cloudPush(silent){
  if(CLOUD.busy) return false;
  if(CLOUD.conflict){ if(!silent) toast('Selesaikan dulu perbedaan versi di bawah'); return false; }
  const ns = await cloudNs();
  if(!ns || !ns.publish){ CLOUD.avail = false; cloudChip(); if(!silent) cloudUnavailable(); return false; }
  CLOUD.busy = true; cloudChip();
  const env = cloudEnvelope();
  try{
    const files = {}; files[CLOUD_FILE] = JSON.stringify(env);
    await ns.publish(files);
    STORE.baseRev = env.rev;
    _saveStoreBase();
    CLOUD.lastPush = env.savedAt; CLOUD.lastErr = null; CLOUD.remote = env; CLOUD.avail = true;
    if(!silent) toast('Tersimpan ke awan — ' + envCount(env) + ' record, revisi ' + env.rev);
  }catch(err){
    const code = (err && err.code) || 'upstream_error';
    CLOUD.lastErr = { code, at:new Date().toISOString() };
    if(code === 'not_writer' || code === 'not_granted' || code === 'not_declared' ||
       code === 'capability_disabled' || code === 'capability_removed'){
      CLOUD.readOnly = true; CLOUD.avail = false;
    }
    if(code === 'conflict'){
      /* Ada yang menyimpan lebih dulu. Perangkat lain akan memuat ulang
         ke versi pemenang; yang di sini tetap disimpan lokal. */
      if(!silent) toast('Perangkat lain menyimpan lebih dulu — perubahan Anda tetap aman di perangkat ini');
    } else if(!silent){
      toast(CLOUD_ERR[code] || ('Gagal menyimpan ke awan (' + code + ') — data tetap aman di perangkat ini'));
    }
  }
  CLOUD.busy = false; cloudChip();
  return !CLOUD.lastErr;
}
const CLOUD_ERR = {
  not_writer:'Tampilan ini hanya bisa membaca — penyimpanan ke awan dimatikan',
  not_granted:'Halaman ini tidak diberi izin menyimpan ke awan',
  not_declared:'Versi halaman ini tidak lagi menyatakan kemampuan menyimpan',
  too_large:'Data sudah terlalu besar untuk satu berkas — arsipkan record lama lalu coba lagi',
  rate_limited:'Terlalu sering menyimpan — tunggu sebentar, perubahan tetap aman di perangkat ini',
  capability_disabled:'Penyimpanan ke awan tidak tersedia di tampilan ini'
};
function cloudUnavailable(){
  modal('Penyimpanan awan tidak tersedia di salinan ini',
    'Data Anda tidak hilang — semuanya tetap tersimpan di peramban ini.',
    `<p class="sub" style="margin:0 0 14px">Salinan OS yang Anda buka sekarang berjalan sebagai berkas biasa
       (misalnya berkas yang diunduh, atau dibuka dari Google Drive). Berkas seperti itu tidak punya tempat
       penyimpanan bersama, jadi datanya hanya hidup di peramban ini saja.</p>
     <div class="rows">
       <div class="row-i" style="cursor:default"><span class="pill green">TETAP BISA</span>
         <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">Semua entri, papan, dan laporan</span>
           <span class="s">Tidak ada fitur yang mati — hanya sinkronisasinya yang tidak jalan.</span></span></div>
       <div class="row-i" style="cursor:default"><span class="pill green">TETAP BISA</span>
         <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">Ekspor CSV per entitas</span>
           <span class="s">Buka System Foundation › Data Saya untuk mengunduh isinya.</span></span></div>
       <div class="row-i" style="cursor:default"><span class="pill orange">PERLU TAUTAN OS</span>
         <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">Sinkron antar perangkat dan cadangan Drive</span>
           <span class="s">Buka OS lewat tautannya, bukan lewat berkas unduhan, lalu keduanya menyala sendiri.</span></span></div>
     </div>`,
    `<button class="btn ghost" onclick="closeModal()">Mengerti</button>`, true);
}

/* ---------------- perbedaan versi: diputuskan Anda ---------------- */
function cloudConflictBar(){
  let el = document.getElementById('cloudBar');
  if(!el){
    el = document.createElement('div');
    el.id = 'cloudBar'; el.className = 'kan-bar'; el.setAttribute('role','alert');
    document.body.appendChild(el);
  }
  const c = CLOUD.conflict; if(!c){ el.classList.remove('on'); return; }
  el.innerHTML = `<span><b>Dua versi berbeda.</b> Awan revisi ${c.remote.rev} · perangkat ini ${c.localDirty} perubahan belum terkirim.</span>
    <button class="btn solid sm" onclick="cloudResolve()">Lihat bedanya</button>`;
  el.classList.add('on');
}
function cloudResolve(){
  const c = CLOUD.conflict; if(!c) return;
  const r = c.remote, localN = SCH_ORDER.reduce((s,t) => s + allRecs(t).length, 0);
  const row = (lbl, a, b) => `<tr><td class="mini">${h(lbl)}</td><td><b>${h(String(a))}</b></td><td><b>${h(String(b))}</b></td></tr>`;
  modal('Dua versi berbeda', 'Tidak ada yang saya pilih sendiri — keduanya data Anda.',
    `<p class="sub" style="margin:0 0 14px">Versi di awan disimpan dari perangkat lain, sementara di perangkat ini ada
       ${c.localDirty} perubahan yang belum terkirim. Menggabungkan keduanya baris per baris bisa membuat record ganda,
       jadi saya tidak melakukannya diam-diam.</p>
     <div style="overflow-x:auto;margin-bottom:14px"><table class="tbl"><thead><tr>
       <th></th><th>Versi awan</th><th>Perangkat ini</th></tr></thead><tbody>
       ${row('Revisi', r.rev, STORE.rev || 0)}
       ${row('Jumlah record', envCount(r), localN)}
       ${row('Disimpan', r.savedAt ? dtID(r.savedAt) : '—', CLOUD.lastPush ? dtID(CLOUD.lastPush) : 'belum pernah')}
       ${row('Oleh', r.savedBy || '—', (DB.owner && DB.owner.name) || '—')}
     </tbody></table></div>
     <div class="statebar" style="margin:0 0 14px">
       <span class="dbadge" style="background:var(--green)">SEBELUM APA PUN</span>
       <div style="flex:1;min-width:220px">Apa pun yang Anda pilih, keadaan sekarang disalin dulu ke penyimpanan cadangan
         di peramban ini, jadi tidak ada yang benar-benar hilang.</div>
     </div>
     <div class="rows">
       <div class="row-i" onclick="cloudTakeRemote()"><span class="pill blue">AMBIL AWAN</span>
         <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">Pakai versi awan</span>
           <span class="s">${c.localDirty} perubahan di perangkat ini ditinggalkan (tersalin ke cadangan).</span></span>
         <span class="rt mini">→</span></div>
       <div class="row-i" onclick="cloudKeepLocal()"><span class="pill orange">KIRIM PERANGKAT INI</span>
         <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">Pakai versi perangkat ini</span>
           <span class="s">Versi awan akan digantikan oleh yang ada di sini.</span></span>
         <span class="rt mini">→</span></div>
       <div class="row-i" onclick="closeModal()"><span class="pill gray">NANTI</span>
         <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">Belum memutuskan</span>
           <span class="s">Sinkronisasi otomatis berhenti sampai ini diputuskan. Tidak ada data yang berubah.</span></span>
         <span class="rt mini">→</span></div>
     </div>`,
    `<button class="btn ghost" onclick="closeModal()">Tutup</button>`, true);
}
function cloudTakeRemote(){
  const c = CLOUD.conflict; if(!c) return;
  cloudAdopt(c.remote, 'mengambil versi awan saat dua versi berbeda');
  closeModal(); cloudConflictBar();
  toast('Versi awan dipakai — keadaan sebelumnya tersalin ke cadangan peramban');
  if(typeof go === 'function' && typeof CUR !== 'undefined') go(CUR);
}
function cloudKeepLocal(){
  if(!CLOUD.conflict) return;
  cloudKeepPrev('sebelum menimpa versi awan dengan versi perangkat ini');
  STORE.baseRev = CLOUD.conflict.remote.rev;   /* supaya push berikutnya menang */
  STORE.rev = Math.max(STORE.rev || 0, CLOUD.conflict.remote.rev) + 1;
  CLOUD.conflict = null;
  _saveStoreBase(); closeModal(); cloudConflictBar();
  cloudPush();
}

/* ---------------- cadangan ke Google Drive ---------------- */
let _mcpNs;
async function driveNs(){
  if(_mcpNs !== undefined) return _mcpNs;
  _mcpNs = null;
  try{
    if(typeof window !== 'undefined' && window.claude && window.claude.use)
      _mcpNs = await window.claude.use('mcp');
  }catch(e){ _mcpNs = null; }
  CLOUD.drive.avail = !!(_mcpNs && _mcpNs.callTool);
  return _mcpNs;
}
async function driveBackup(){
  if(CLOUD.drive.busy) return false;
  const ns = await driveNs();
  if(!ns || !ns.callTool){
    CLOUD.drive.avail = false; cloudChip();
    toast('Cadangan Drive hanya jalan saat OS dibuka lewat tautannya');
    return false;
  }
  CLOUD.drive.busy = true; cloudChip();
  const env = cloudEnvelope();
  const stamp = env.savedAt.slice(0,19).replace(/[:T]/g,'-');
  try{
    const res = await ns.callTool('Google Drive', 'create_file', {
      title: 'ajios-cadangan-' + stamp + '.json',
      parentId: CLOUD_DRIVE_FOLDER,
      contentMimeType: 'application/json',
      disableConversionToGoogleType: true,
      textContent: JSON.stringify(env)
    });
    const p = (res && res.payload) || {};
    CLOUD.drive.lastAt = env.savedAt;
    CLOUD.drive.lastUrl = p.viewUrl || '';
    CLOUD.drive.lastErr = null;
    toast('Cadangan tersimpan di Drive — folder 96 — LIVE DATA');
  }catch(err){
    CLOUD.drive.lastErr = (err && err.code) || 'upstream_error';
    toast('Cadangan Drive gagal (' + CLOUD.drive.lastErr + ') — data tetap aman di perangkat ini');
  }
  CLOUD.drive.busy = false; cloudChip();
  return !CLOUD.drive.lastErr;
}

/* Unduhan berkas cadangan.
   Di dalam penampil, berkas diserahkan lewat jalur unduhan resmi —
   tautan biasa tidak berfungsi di sana, dan halaman yang menawarkan
   tombol mati lebih buruk daripada tidak menawarkannya sama sekali.
   Di salinan berkas biasa, tautan biasa yang dipakai. */
let _dlNs;
async function dlNs(){
  if(_dlNs !== undefined) return _dlNs;
  _dlNs = null;
  try{
    if(typeof window !== 'undefined' && window.claude && window.claude.use)
      _dlNs = await window.claude.use('downloads');
  }catch(e){ _dlNs = null; }
  return _dlNs;
}
async function cloudDownload(){
  const env = cloudEnvelope();
  const name = 'ajios-cadangan-' + env.savedAt.slice(0,19).replace(/[:T]/g,'-') + '.json';
  const body = JSON.stringify(env, null, 1);
  const ns = await dlNs();
  if(ns && ns.save){
    try{
      await ns.save({ filename:name, data:body });
      toast('Berkas cadangan disimpan — ' + envCount(env) + ' record');
    }catch(err){
      const code = (err && err.code) || 'upstream_error';
      if(code === 'user_cancelled' || code === 'cancelled') toast('Unduhan dibatalkan');
      else toast('Unduhan gagal (' + code + ') — coba Cadangkan ke Drive');
    }
    return;
  }
  const blob = new Blob([body], { type:'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 400);
  toast('Berkas cadangan diunduh — ' + envCount(env) + ' record');
}

/* ---------------- penanda keadaan di sudut layar ---------------- */
function cloudChip(){
  let el = document.getElementById('cloudChip');
  if(!el){
    el = document.createElement('button');
    el.id = 'cloudChip'; el.className = 'cloudchip';
    el.setAttribute('aria-live','polite');
    el.onclick = () => { fTab = 'cloud'; go('foundation'); };
    document.body.appendChild(el);
  }
  const d = cloudDirty();
  let cls = 'ok', txt = 'Tersinkron', ico = 'check';
  if(!CLOUD.ready)          { cls = 'idle'; txt = 'Memeriksa…'; ico = 'clock'; }
  else if(CLOUD.conflict)   { cls = 'warn'; txt = 'Dua versi berbeda'; ico = 'flag'; }
  else if(CLOUD.busy)       { cls = 'idle'; txt = 'Menyimpan…'; ico = 'clock'; }
  else if(!CLOUD.avail)     { cls = 'idle'; txt = 'Hanya di perangkat ini'; ico = 'shield'; }
  else if(d)                { cls = 'warn'; txt = d + ' belum terkirim'; ico = 'arrow'; }
  el.className = 'cloudchip ' + cls;
  el.innerHTML = `<span class="ci">${ic(ico)}</span><span>${h(txt)}</span>`;
  el.title = txt + (CLOUD.lastPush ? ' · terakhir tersimpan ' + dtID(CLOUD.lastPush) : '');
}

/* Simpan sisa perubahan saat halaman ditinggalkan */
document.addEventListener('visibilitychange', () => {
  if(document.visibilityState === 'hidden' && CLOUD_PREFS.auto && CLOUD.avail && cloudDirty() && !CLOUD.conflict)
    cloudPush(true);
});

/* ---------------- tab Sinkronisasi ---------------- */
if(typeof F_TABS !== 'undefined'){
  const at = F_TABS.findIndex(x => x[0] === 'lock');
  F_TABS.splice(at < 0 ? F_TABS.length : at, 0, ['cloud','Sinkronisasi']);
}

F_VIEW.cloud = () => {
  const d = cloudDirty();
  const n = SCH_ORDER.reduce((s,t) => s + allRecs(t).length, 0);
  const prev = (() => { try{ return JSON.parse(localStorage.getItem(CLOUD_PREV) || 'null'); }catch(e){ return null; } })();
  const state = CLOUD.conflict ? ['orange','Dua versi berbeda menunggu keputusan Anda']
    : !CLOUD.ready ? ['gray','Sedang memeriksa']
    : !CLOUD.avail ? ['gray','Hanya tersimpan di perangkat ini']
    : d ? ['orange', d + ' perubahan belum terkirim']
    : ['green','Tersinkron'];

  return `
  <div class="card" style="margin-bottom:18px;border-color:${CV(state[0])};background:linear-gradient(150deg,${CT(state[0])},var(--surface))">
    <div class="flexr" style="gap:12px;margin-bottom:10px">
      <div class="ic" style="width:42px;height:42px;border-radius:13px;display:grid;place-items:center;flex:0 0 42px;background:${CV(state[0])};color:#fff">${ic('globe')}</div>
      <div style="flex:1;min-width:200px">
        <div class="mini" style="font-weight:800;letter-spacing:1px">PHASE 3 · SINKRONISASI</div>
        <h2 style="font-family:var(--fd);font-size:25px;font-weight:600;margin:2px 0 0">${h(state[1])}</h2>
      </div>
      ${CLOUD.avail ? `<button class="btn gold sm" onclick="cloudPush()"${CLOUD.busy?' disabled':''}>${ic('arrow')} Simpan ke awan</button>` : ''}
      <button class="btn ghost sm" onclick="cloudDownload()">${ic('doc')} Unduh cadangan</button>
    </div>
    <div class="g g4" style="gap:12px;margin:0">
      ${[['Record di perangkat ini', n],
         ['Belum terkirim', d],
         ['Revisi lokal', STORE.rev || 0],
         ['Revisi awan', CLOUD.remote ? CLOUD.remote.rev : '—']].map(x => `
        <div class="card" style="padding:13px"><div class="mini">${x[0]}</div>
          <b style="font-family:var(--fd);font-size:22px">${x[1]}</b></div>`).join('')}
    </div>
  </div>

  ${CLOUD.conflict ? `<div class="statebar del" style="margin:0 0 18px">
    <span class="dbadge" style="background:var(--orange)">PERLU DIPUTUSKAN</span>
    <div style="flex:1;min-width:240px">Versi awan (revisi ${CLOUD.conflict.remote.rev}) berbeda dengan yang ada di perangkat ini
      (${CLOUD.conflict.localDirty} perubahan belum terkirim). Sinkronisasi otomatis berhenti sampai Anda memilih.</div>
    <button class="btn solid sm" onclick="cloudResolve()">Lihat bedanya</button>
  </div>` : ''}

  <div class="g g21 top" style="margin:0 0 18px">
    <div class="card">
      ${cardH('globe','Tempat kerja — penyimpanan halaman','blue',
        `<span class="pill ${CLOUD.avail ? 'green' : 'gray'}">${CLOUD.avail ? 'aktif' : 'tidak aktif di salinan ini'}</span>`)}
      <p class="sub" style="margin:0 0 12px">Halaman OS menyimpan satu berkas datanya sendiri. Dibuka dari ponsel atau laptop
        lewat tautan yang sama, isinya sama. Inilah yang membuat data tidak lagi terkurung di satu peramban.</p>
      <div class="rows">
        <div class="row-i" style="cursor:default"><span class="pill gray">Terakhir tersimpan</span>
          <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">${CLOUD.lastPush ? h(dtID(CLOUD.lastPush)) : 'Belum pernah dari perangkat ini'}</span>
            <span class="s">${CLOUD.remote ? 'Awan berisi ' + envCount(CLOUD.remote) + ' record, revisi ' + CLOUD.remote.rev : 'Belum ada berkas data di awan'}</span></span></div>
        <div class="row-i" style="cursor:default"><span class="pill ${CLOUD_PREFS.auto ? 'green' : 'gray'}">Otomatis</span>
          <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">Simpan sendiri ${Math.round(CLOUD_DEBOUNCE/1000)} detik setelah perubahan terakhir</span>
            <span class="s">Juga saat Anda meninggalkan halaman. Bisa dimatikan bila Anda lebih suka menyimpan manual.</span></span>
          <span class="rt"><button class="btn ghost sm" onclick="cloudToggleAuto()">${CLOUD_PREFS.auto ? 'Matikan' : 'Nyalakan'}</button></span></div>
        ${CLOUD.lastErr ? `<div class="row-i" style="cursor:default"><span class="pill red">Terakhir gagal</span>
          <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">${h(CLOUD_ERR[CLOUD.lastErr.code] || CLOUD.lastErr.code)}</span>
            <span class="s">${h(dtID(CLOUD.lastErr.at))} · data tetap utuh di perangkat ini</span></span></div>` : ''}
      </div>
      <div class="card-f"><span class="mini">Satu tautan berarti satu salinan data. Bila dua perangkat mengubah bersamaan,
        sistem tidak memilih diam-diam — perbedaannya ditunjukkan dan Anda yang memutuskan.</span></div>
    </div>

    <div class="card">
      ${cardH('shield','Cadangan — Google Drive Anda','gold',
        `<span class="pill ${CLOUD.drive.avail === false ? 'gray' : 'green'}">96 — LIVE DATA</span>`)}
      <p class="sub" style="margin:0 0 12px">Menulis berkas cadangan bertanggal ke folder Drive Anda sendiri. Selalu berkas baru,
        tidak pernah menimpa yang lama — jadi setiap cadangan tetap bisa dibuka.</p>
      <div class="rows">
        <div class="row-i" style="cursor:default"><span class="pill gray">Terakhir</span>
          <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">${CLOUD.drive.lastAt ? h(dtID(CLOUD.drive.lastAt)) : 'Belum pernah'}</span>
            <span class="s">${CLOUD.drive.lastErr ? 'Percobaan terakhir gagal: ' + h(CLOUD.drive.lastErr) : 'Cadangan disimpan sebagai berkas JSON'}</span></span>
          ${CLOUD.drive.lastUrl ? `<span class="rt"><a class="btn ghost sm" href="${h(CLOUD.drive.lastUrl)}" target="_blank" rel="noopener">Buka</a></span>` : ''}</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
        <button class="btn gold sm" onclick="driveBackup()"${CLOUD.drive.busy?' disabled':''}>${ic('shield')} Cadangkan ke Drive sekarang</button>
        <button class="btn ghost sm" onclick="cloudDownload()">${ic('doc')} Unduh berkasnya</button>
      </div>
      <div class="card-f"><span class="mini">Pemulihan dari cadangan dilakukan lewat impor, bukan otomatis — lihat catatan di bawah.</span></div>
    </div>
  </div>

  <div class="card" style="margin-bottom:18px;border-color:var(--red)">
    ${cardH('scale','Kenapa pemulihan dari Drive tidak dibuat otomatis','red')}
    <p class="sub" style="margin:0 0 12px">Ini keputusan sadar, bukan pekerjaan yang belum sempat. Sebelum membangun bagian ini
      saya menguji konektor Google Drive dengan berkas sungguhan:</p>
    <div class="rows">
      <div class="row-i" style="cursor:default"><span class="pill green">BISA</span>
        <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">Membuat berkas baru berisi data</span>
          <span class="s">Itulah sebabnya cadangan berfungsi dan dipakai.</span></span></div>
      <div class="row-i" style="cursor:default"><span class="pill red">TIDAK BISA</span>
        <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">Menulis ulang isi berkas yang sudah ada</span>
          <span class="s">Konektor hanya bisa mengubah nama dan lokasi berkas, bukan isinya.</span></span></div>
      <div class="row-i" style="cursor:default"><span class="pill red">TIDAK BISA DIPERCAYA</span>
        <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">Membaca kembali berkas data</span>
          <span class="s">Berkas uji berisi karakter biasa seperti * dan % terbaca <b>kosong</b>. Aplikasi akan mengira data belum ada, lalu menimpanya.</span></span></div>
    </div>
    <div class="card-f"><span class="mini">Karena itu Drive dipakai sebagai tempat cadangan yang Anda miliki penuh, bukan sebagai basis data
      yang dibaca-tulis terus-menerus. Untuk memulihkan: unduh berkas cadangannya dari Drive, lalu masukkan lewat Impor.</span></div>
  </div>

  ${prev ? `<div class="card" style="margin-bottom:18px">
    ${cardH('clock','Salinan sebelum perubahan terakhir','purple')}
    <p class="sub" style="margin:0 0 10px">Setiap kali versi data diganti — mengambil versi awan atau menimpanya —
      keadaan sebelumnya disalin lebih dulu ke peramban ini. Salinan terakhir:</p>
    <div class="rows"><div class="row-i" style="cursor:default"><span class="pill purple">${h(dtID(prev.at))}</span>
      <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">${h(prev.why || '—')}</span>
        <span class="s">${envCount(prev.data)} record · revisi ${prev.data.rev}</span></span>
      <span class="rt"><button class="btn ghost sm" onclick="cloudRestorePrev()">Pulihkan salinan ini</button></span></div></div>
  </div>` : ''}

  <div class="statebar" style="margin:0">
    <span class="dbadge" style="background:var(--blue)">BATAS YANG PERLU ANDA TAHU</span>
    <div style="flex:1;min-width:240px">Ini belum penegakan izin di lapisan basis data seperti bunyi rencana Phase 3 penuh —
      itu tetap butuh backend sungguhan. Yang berdiri sekarang: data keluar dari satu peramban, ada di semua perangkat
      lewat satu tautan, dan Anda memegang salinannya sendiri di Drive.</div>
  </div>`;
};

function cloudToggleAuto(){
  CLOUD_PREFS.auto = !CLOUD_PREFS.auto; cloudSavePref();
  toast(CLOUD_PREFS.auto ? 'Sinkronisasi otomatis dinyalakan' : 'Sinkronisasi otomatis dimatikan — simpan manual lewat tombol');
  go(CUR);
}
function cloudRestorePrev(){
  let prev = null;
  try{ prev = JSON.parse(localStorage.getItem(CLOUD_PREV) || 'null'); }catch(e){}
  if(!prev || !prev.data){ toast('Tidak ada salinan tersimpan'); return; }
  modal('Pulihkan salinan sebelumnya', h(prev.why || ''),
    `<p class="sub" style="margin:0 0 12px">Salinan ini berisi <b>${envCount(prev.data)} record</b> dari ${h(dtID(prev.at))}.
       Memulihkannya akan mengganti isi di perangkat ini — dan keadaan sekarang akan disalin lebih dulu, seperti biasa.</p>`,
    `<button class="btn solid" onclick="doCloudRestorePrev()">${ic('arrow')} Pulihkan</button>
     <button class="btn ghost" onclick="closeModal()">Batal</button>`);
}
function doCloudRestorePrev(){
  let prev = null;
  try{ prev = JSON.parse(localStorage.getItem(CLOUD_PREV) || 'null'); }catch(e){}
  if(!prev || !prev.data) return;
  const env = prev.data;
  cloudAdopt(Object.assign({}, env, { rev: Math.max(STORE.rev || 0, env.rev || 0) + 1 }), 'sebelum memulihkan salinan lama');
  STORE.baseRev = STORE.baseRev - 1;   /* tandai perlu dikirim ulang */
  _saveStoreBase(); closeModal();
  toast('Salinan dipulihkan — ' + envCount(env) + ' record');
  go(CUR);
}

/* Nyalakan setelah halaman siap; tidak pernah menghambat tampilan */
setTimeout(() => { cloudChip(); cloudBoot(); }, 0);

