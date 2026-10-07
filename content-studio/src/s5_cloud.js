/* ================================================================
   SINKRONISASI TIM
   Halaman menyimpan satu berkas datanya sendiri. Setiap anggota tim
   yang membuka tautan ini melihat isi yang sama.

   Yang TIDAK ada di sini, dan dikatakan apa adanya di layar:
   tidak ada login, tidak ada peran, tidak ada izin per orang.
   Siapa pun yang punya tautannya bisa membuka dan mengubah.
   ================================================================ */
const CLOUD_FILE = 'data/studio.json';
const CLOUD_PREV = 'jaens-studio-prev';
const CLOUD_PREF = 'jaens-studio-pref';
const CLOUD_DEBOUNCE = 12000;

let CLOUD = { ready:false, avail:null, readOnly:false, busy:false,
  lastPush:null, lastErr:null, remote:null, conflict:null };
let CLOUD_PREFS = { auto:true };
try{ const s = localStorage.getItem(CLOUD_PREF); if(s) CLOUD_PREFS = Object.assign(CLOUD_PREFS, JSON.parse(s)||{}); }catch(e){}
const savePref = () => { try{ localStorage.setItem(CLOUD_PREF, JSON.stringify(CLOUD_PREFS)); }catch(e){} };

const dirty = () => Math.max(0, (STORE.rev||0) - (STORE.baseRev||0));

/* bump() = simpan lokal + naikkan revisi + jadwalkan kirim */
let cloudT = null;
function bump(){
  STORE.rev = (STORE.rev||0) + 1;
  saveLocal(); chip();
  if(CLOUD_PREFS.auto && CLOUD.avail && !CLOUD.conflict){
    clearTimeout(cloudT); cloudT = setTimeout(() => cloudPush(true), CLOUD_DEBOUNCE);
  }
}

function envelope(){
  return { v:1, rev:STORE.rev||0, savedAt:new Date().toISOString(), savedBy:whoName(),
    seq:STORE.seq||{}, rec:STORE.rec||{}, log:STORE.log||[] };
}
const envCount = e => Object.keys((e&&e.rec)||{}).reduce((s,t) => s + e.rec[t].length, 0);
function keepPrev(why){
  try{ localStorage.setItem(CLOUD_PREV, JSON.stringify({ why, at:new Date().toISOString(), data:envelope() })); }catch(e){}
}
function adopt(env, why){
  keepPrev(why || 'sebelum mengambil versi bersama');
  STORE.seq = env.seq||{}; STORE.rec = env.rec||{}; STORE.log = env.log||[];
  STORE.rev = env.rev||0;  STORE.baseRev = env.rev||0;
  saveLocal(); CLOUD.remote = env; CLOUD.conflict = null; chip();
}

let _ns;
async function cloudNs(){
  if(_ns !== undefined) return _ns;
  _ns = null;
  try{ if(typeof window!=='undefined' && window.claude && window.claude.use) _ns = await window.claude.use('artifact'); }
  catch(e){ _ns = null; }
  return _ns;
}
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
  if(!CLOUD.avail){ chip(); return; }
  const env = await cloudFetch();
  CLOUD.remote = env;
  if(env){
    const d = dirty();
    if(env.rev > (STORE.baseRev||0) && d > 0){ CLOUD.conflict = { remote:env, localDirty:d }; conflictBar(); }
    else if(env.rev > (STORE.baseRev||0)){
      adopt(env, 'mengambil versi tim yang lebih baru saat halaman dibuka');
      toast('Data terbaru diambil — ' + envCount(env) + ' record'); go(CUR);
    }
  }
  chip();
}

const ERR = {
  not_writer:'Tampilan ini hanya bisa membaca — perubahan tidak akan tersimpan untuk tim',
  not_granted:'Halaman ini tidak diberi izin menyimpan',
  not_declared:'Versi halaman ini tidak lagi menyatakan kemampuan menyimpan',
  too_large:'Data sudah terlalu besar untuk satu berkas — arsipkan konten lama lalu coba lagi',
  rate_limited:'Terlalu sering menyimpan — tunggu sebentar, perubahan tetap aman di perangkat ini',
  capability_disabled:'Penyimpanan bersama tidak tersedia di tampilan ini'
};
async function cloudPush(silent){
  if(CLOUD.busy) return false;
  if(CLOUD.conflict){ if(!silent) toast('Selesaikan dulu perbedaan versinya'); return false; }
  const ns = await cloudNs();
  if(!ns || !ns.publish){ CLOUD.avail = false; chip(); if(!silent) notShared(); return false; }
  CLOUD.busy = true; chip();
  const env = envelope();
  try{
    const files = {}; files[CLOUD_FILE] = JSON.stringify(env);
    await ns.publish(files);
    STORE.baseRev = env.rev; saveLocal();
    CLOUD.lastPush = env.savedAt; CLOUD.lastErr = null; CLOUD.remote = env; CLOUD.avail = true;
    if(!silent) toast('Tersimpan untuk tim — ' + envCount(env) + ' record, revisi ' + env.rev);
  }catch(err){
    const code = (err && err.code) || 'upstream_error';
    CLOUD.lastErr = { code, at:new Date().toISOString() };
    if(['not_writer','not_granted','not_declared','capability_disabled','capability_removed'].indexOf(code) >= 0){
      CLOUD.readOnly = true; CLOUD.avail = false;
    }
    if(code === 'conflict'){
      if(!silent) toast('Anggota lain menyimpan lebih dulu — perubahan Anda tetap aman di perangkat ini');
    } else if(!silent) toast(ERR[code] || ('Gagal menyimpan (' + code + ') — data tetap aman di perangkat ini'));
  }
  CLOUD.busy = false; chip();
  return !CLOUD.lastErr;
}
function notShared(){
  modal('Penyimpanan bersama tidak aktif di salinan ini',
    'Data Anda tidak hilang — semuanya tetap tersimpan di peramban ini.',
    `<p class="sub" style="margin:0 0 14px">Salinan yang Anda buka berjalan sebagai berkas biasa, bukan lewat tautan studio.
       Berkas seperti itu tidak punya tempat penyimpanan bersama, jadi perubahannya tidak sampai ke anggota tim lain.</p>
     <div class="rows">
       <div class="row-i" style="cursor:default"><span class="pill green">TETAP BISA</span>
         <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">Semua entri, papan, kalender, ekspor CSV</span>
           <span class="s">Tidak ada fitur yang mati — hanya berbaginya yang tidak jalan.</span></span></div>
       <div class="row-i" style="cursor:default"><span class="pill orange">PERLU TAUTAN STUDIO</span>
         <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">Satu papan yang dilihat seluruh tim</span>
           <span class="s">Buka studio lewat tautannya, bukan lewat berkas unduhan.</span></span></div>
     </div>`,
    `<button class="btn ghost" onclick="closeModal()">Mengerti</button>`, true);
}

/* ---------------- perbedaan versi ---------------- */
function conflictBar(){
  let el = document.getElementById('cloudBar');
  if(!el){ el = document.createElement('div'); el.id='cloudBar'; el.className='kan-bar'; el.setAttribute('role','alert');
    document.body.appendChild(el); }
  const c = CLOUD.conflict; if(!c){ el.classList.remove('on'); return; }
  el.innerHTML = `<span><b>Dua versi berbeda.</b> Versi tim revisi ${c.remote.rev} · di sini ${c.localDirty} perubahan belum terkirim.</span>
    <button class="btn solid sm" onclick="resolveConflict()">Lihat bedanya</button>`;
  el.classList.add('on');
}
function resolveConflict(){
  const c = CLOUD.conflict; if(!c) return;
  const r = c.remote, localN = SCH_ORDER.reduce((s,t) => s + allRecs(t).length, 0);
  const row = (l,a,b) => `<tr><td class="mini">${h(l)}</td><td><b>${h(String(a))}</b></td><td><b>${h(String(b))}</b></td></tr>`;
  modal('Dua versi berbeda', 'Tidak ada yang dipilih sendiri oleh sistem — keduanya kerja tim Anda.',
    `<p class="sub" style="margin:0 0 14px">Versi tim disimpan dari perangkat lain, sementara di perangkat ini ada
       ${c.localDirty} perubahan yang belum terkirim. Menggabungkan keduanya baris per baris bisa membuat konten ganda,
       jadi sistem tidak melakukannya diam-diam.</p>
     <div style="overflow-x:auto;margin-bottom:14px"><table class="tbl"><thead><tr>
       <th></th><th>Versi tim</th><th>Perangkat ini</th></tr></thead><tbody>
       ${row('Revisi', r.rev, STORE.rev||0)}
       ${row('Jumlah record', envCount(r), localN)}
       ${row('Disimpan', r.savedAt ? dtID(r.savedAt) : '—', CLOUD.lastPush ? dtID(CLOUD.lastPush) : 'belum pernah')}
       ${row('Oleh', r.savedBy || '—', whoName())}
     </tbody></table></div>
     <div class="statebar" style="margin:0 0 14px">
       <span class="dbadge" style="background:var(--green)">SEBELUM APA PUN</span>
       <div style="flex:1;min-width:220px">Apa pun yang dipilih, keadaan sekarang disalin dulu ke cadangan di peramban ini.</div>
     </div>
     <div class="rows">
       <div class="row-i" onclick="takeRemote()"><span class="pill blue">AMBIL VERSI TIM</span>
         <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">Pakai versi tim</span>
           <span class="s">${c.localDirty} perubahan di perangkat ini ditinggalkan (tersalin ke cadangan).</span></span>
         <span class="rt mini">→</span></div>
       <div class="row-i" onclick="keepLocal()"><span class="pill orange">KIRIM PERANGKAT INI</span>
         <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">Pakai versi perangkat ini</span>
           <span class="s">Versi tim akan digantikan oleh yang ada di sini.</span></span>
         <span class="rt mini">→</span></div>
       <div class="row-i" onclick="closeModal()"><span class="pill gray">NANTI</span>
         <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">Belum memutuskan</span>
           <span class="s">Penyimpanan otomatis berhenti sampai ini diputuskan. Tidak ada data yang berubah.</span></span>
         <span class="rt mini">→</span></div>
     </div>`,
    `<button class="btn ghost" onclick="closeModal()">Tutup</button>`, true);
}
function takeRemote(){
  const c = CLOUD.conflict; if(!c) return;
  adopt(c.remote, 'mengambil versi tim saat dua versi berbeda');
  closeModal(); conflictBar();
  toast('Versi tim dipakai — keadaan sebelumnya tersalin ke cadangan'); go(CUR);
}
function keepLocal(){
  if(!CLOUD.conflict) return;
  keepPrev('sebelum menimpa versi tim dengan versi perangkat ini');
  STORE.baseRev = CLOUD.conflict.remote.rev;
  STORE.rev = Math.max(STORE.rev||0, CLOUD.conflict.remote.rev) + 1;
  CLOUD.conflict = null; saveLocal(); closeModal(); conflictBar(); cloudPush();
}

/* ---------------- berkas keluar ---------------- */
let _dl;
async function dlNs(){
  if(_dl !== undefined) return _dl;
  _dl = null;
  try{ if(typeof window!=='undefined' && window.claude && window.claude.use) _dl = await window.claude.use('downloads'); }
  catch(e){ _dl = null; }
  return _dl;
}
async function offerFile(name, body, mime){
  const ns = await dlNs();
  if(ns && ns.save){
    try{ await ns.save({ filename:name, data:body }); toast('Berkas disimpan — ' + name); }
    catch(err){ const c = (err&&err.code)||'upstream_error';
      toast(c==='user_cancelled'||c==='cancelled' ? 'Dibatalkan' : 'Gagal menyimpan berkas (' + c + ')'); }
    return;
  }
  const blob = new Blob([body], { type: mime || 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 400);
  toast('Berkas diunduh — ' + name);
}

/* ---------------- penanda keadaan ---------------- */
function chip(){
  let el = document.getElementById('cloudChip');
  if(!el){ el = document.createElement('button'); el.id='cloudChip'; el.className='cloudchip';
    el.setAttribute('aria-live','polite'); el.onclick = () => syncPanel(); document.body.appendChild(el); }
  const d = dirty();
  let cls='ok', txt='Tersinkron', icn='check';
  if(!CLOUD.ready)        { cls='idle'; txt='Memeriksa…'; icn='clock'; }
  else if(CLOUD.conflict) { cls='warn'; txt='Dua versi berbeda'; icn='flag'; }
  else if(CLOUD.busy)     { cls='idle'; txt='Menyimpan…'; icn='clock'; }
  else if(!CLOUD.avail)   { cls='idle'; txt='Hanya di perangkat ini'; icn='shield'; }
  else if(d)              { cls='warn'; txt=d+' belum terkirim'; icn='arrow'; }
  el.className = 'cloudchip ' + cls;
  el.innerHTML = `<span class="ci">${ic(icn)}</span><span>${h(txt)}</span>`;
  el.title = txt + (CLOUD.lastPush ? ' · terakhir tersimpan ' + dtID(CLOUD.lastPush) : '');
}
function syncPanel(){
  const d = dirty(), n = SCH_ORDER.reduce((s,t) => s + allRecs(t).length, 0);
  let prev = null; try{ prev = JSON.parse(localStorage.getItem(CLOUD_PREV) || 'null'); }catch(e){}
  modal('Sinkronisasi tim', CLOUD.avail ? 'Satu papan, dilihat semua yang punya tautannya.' : 'Salinan ini menyimpan ke peramban saja.',
    `<div class="g g2" style="gap:12px;margin-bottom:16px">
       ${[['Record di sini', n], ['Belum terkirim', d], ['Revisi lokal', STORE.rev||0],
          ['Revisi bersama', CLOUD.remote ? CLOUD.remote.rev : '—']].map(x => `
         <div class="card" style="padding:13px"><div class="mini">${x[0]}</div>
           <b style="font-family:var(--fd);font-size:22px">${x[1]}</b></div>`).join('')}
     </div>
     ${CLOUD.lastErr ? `<div class="statebar del" style="margin:0 0 14px">
       <span class="dbadge" style="background:var(--red)">GAGAL TERAKHIR</span>
       <div style="flex:1;min-width:220px">${h(ERR[CLOUD.lastErr.code] || CLOUD.lastErr.code)} —
         ${h(dtID(CLOUD.lastErr.at))}. Data tetap utuh di perangkat ini.</div></div>` : ''}
     <div class="rows">
       <div class="row-i" style="cursor:default"><span class="pill gray">Terakhir tersimpan</span>
         <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">${CLOUD.lastPush ? h(dtID(CLOUD.lastPush)) : 'Belum pernah dari perangkat ini'}</span>
           <span class="s">${CLOUD.remote ? 'Versi bersama berisi ' + envCount(CLOUD.remote) + ' record' : 'Belum ada versi bersama'}</span></span></div>
       <div class="row-i" style="cursor:default"><span class="pill ${CLOUD_PREFS.auto?'green':'gray'}">Otomatis</span>
         <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">Simpan sendiri ${Math.round(CLOUD_DEBOUNCE/1000)} detik setelah perubahan terakhir</span>
           <span class="s">Juga saat Anda meninggalkan halaman.</span></span>
         <span class="rt"><button class="btn ghost sm" onclick="toggleAuto()">${CLOUD_PREFS.auto?'Matikan':'Nyalakan'}</button></span></div>
       ${prev ? `<div class="row-i" style="cursor:default"><span class="pill purple">Salinan</span>
         <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">${h(prev.why||'—')}</span>
           <span class="s">${envCount(prev.data)} record · ${h(dtID(prev.at))}</span></span>
         <span class="rt"><button class="btn ghost sm" onclick="restorePrev()">Pulihkan</button></span></div>` : ''}
     </div>
     <div class="sep" style="margin:16px 0"></div>
     <div class="statebar del" style="margin:0">
       <span class="dbadge" style="background:var(--red)">BATAS YANG HARUS DIKETAHUI</span>
       <div style="flex:1;min-width:240px">Studio ini <b>tidak punya login dan tidak punya izin per orang</b>.
         Siapa pun yang punya tautannya bisa membuka dan mengubah seluruh isinya. Nama di linimasa adalah yang diketik
         sendiri oleh tiap orang, jadi bisa saja keliru. Untuk pembatasan yang sungguhan, perlu backend dengan autentikasi.</div>
     </div>`,
    `${CLOUD.avail ? `<button class="btn solid" onclick="closeModal();cloudPush()">${ic('arrow')} Simpan sekarang</button>` : ''}
     <button class="btn gold" onclick="backupFile()">${ic('doc')} Unduh cadangan</button>
     <button class="btn ghost" onclick="closeModal()">Tutup</button>`, true);
}
function toggleAuto(){ CLOUD_PREFS.auto = !CLOUD_PREFS.auto; savePref();
  toast(CLOUD_PREFS.auto ? 'Penyimpanan otomatis dinyalakan' : 'Penyimpanan otomatis dimatikan'); closeModal(); }
async function backupFile(){
  const env = envelope();
  await offerFile('jaens-studio-' + env.savedAt.slice(0,19).replace(/[:T]/g,'-') + '.json',
    JSON.stringify(env, null, 1), 'application/json');
}
function restorePrev(){
  let prev = null; try{ prev = JSON.parse(localStorage.getItem(CLOUD_PREV) || 'null'); }catch(e){}
  if(!prev || !prev.data){ toast('Tidak ada salinan tersimpan'); return; }
  const env = prev.data;
  adopt(Object.assign({}, env, { rev: Math.max(STORE.rev||0, env.rev||0) + 1 }), 'sebelum memulihkan salinan lama');
  STORE.baseRev = STORE.baseRev - 1; saveLocal();
  closeModal(); toast('Salinan dipulihkan — ' + envCount(env) + ' record'); go(CUR);
}

document.addEventListener('visibilitychange', () => {
  if(document.visibilityState === 'hidden' && CLOUD_PREFS.auto && CLOUD.avail && dirty() && !CLOUD.conflict) cloudPush(true);
});

/* ================================================================
   MULAI
   ================================================================ */
document.getElementById('scrim').onclick = () => {
  document.getElementById('sidebar').classList.remove('on');
  document.getElementById('scrim').classList.remove('on');
};
document.getElementById('modalOv').onclick = e => { if(e.target.id === 'modalOv') closeModal(); };
document.addEventListener('keydown', e => { if(e.key === 'Escape' && !KB) closeModal(); });

renderNav();
go('board');
chip();
setTimeout(cloudBoot, 0);
