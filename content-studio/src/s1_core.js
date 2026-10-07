/* ================================================================
   JAENS CONTENT STUDIO — ruang kerja tim untuk konten
   Terpisah dari AJI JAENS OS. Berisi HANYA konten dan tim konten.
   Tidak ada Family, Finance, Wellbeing, keputusan, atau kontak
   pribadi di sini — bukan disembunyikan, memang tidak ada datanya.
   ================================================================ */

const ic = (n,cls='') => `<svg viewBox="0 0 24 24" class="${cls}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[n]||ICONS.grid}</svg>`;
const CV = c => `var(--${c})`, CT = c => `var(--${c}-t)`;
const h  = s => String(s===undefined||s===null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

let toastT;
function toast(m){ const t=document.getElementById('toast'); t.textContent=m; t.classList.add('on');
  clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('on'),3200); }
function modal(title,sub,body,foot,wide){
  document.getElementById('modalSheet').className='sheet'+(wide?' wide':'');
  document.getElementById('modalSheet').innerHTML=
    `<div class="sheet-h"><div style="flex:1;min-width:0"><h3>${title}</h3>${sub?`<p>${sub}</p>`:''}</div><button class="x" onclick="closeModal()" aria-label="Tutup">×</button></div>
     <div class="sheet-b">${body}</div>${foot?`<div class="sheet-f">${foot}</div>`:''}`;
  document.getElementById('modalOv').classList.add('on');
}
function closeModal(){ document.getElementById('modalOv').classList.remove('on'); }
const cardH = (icn,title,color,right='') => `<div class="card-h">
  <div class="ic" style="background:${CT(color)};color:${CV(color)}">${ic(icn)}</div>
  <h3>${title}</h3>${right?`<div class="r">${right}</div>`:''}</div>`;
const idPill = id => `<span class="pill gray" style="font-family:ui-monospace,Menlo,monospace;font-size:10.5px">${h(id)}</span>`;

/* ---------------- tanggal ---------------- */
const todayISO = () => new Date().toISOString().slice(0,10);
function shiftISO(iso,d){ const t=new Date(iso+'T00:00:00Z'); t.setUTCDate(t.getUTCDate()+d); return t.toISOString().slice(0,10); }
function daysBetween(a,b){ return Math.round((new Date(b+'T00:00:00Z')-new Date(a+'T00:00:00Z'))/86400000); }
const dOnly = v => { if(!v) return '—'; try{ return new Date(v+'T00:00:00').toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}); }catch(e){ return v; } };
const dtID  = iso => { try{ const d=new Date(iso); return d.toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'})+' · '+d.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}); }catch(e){ return iso; } };
function relDay(iso){ if(!iso) return '—'; const n=daysBetween(todayISO(),iso);
  return n===0?'hari ini':n===1?'besok':n===-1?'kemarin':n>0?('dalam '+n+' hari'):(Math.abs(n)+' hari lalu'); }

/* ================================================================
   PENYIMPANAN
   ================================================================ */
const STORE_KEY = 'jaens-studio';
let STORE = { v:1, rev:0, baseRev:0, seq:{}, rec:{}, log:[] };
try{ const s = localStorage.getItem(STORE_KEY);
  if(s){ const o = JSON.parse(s); if(o && o.rec) STORE = Object.assign(STORE, o); }
}catch(e){}
function saveLocal(){ try{ localStorage.setItem(STORE_KEY, JSON.stringify(STORE)); return true; }
  catch(e){ toast('Penyimpanan peramban penuh — ekspor CSV lalu arsipkan konten lama'); return false; } }

const allRecs = t => STORE.rec[t] || [];
const recs    = t => allRecs(t).filter(r => !r._m.is_archived);
const arcRecs = t => allRecs(t).filter(r =>  r._m.is_archived);
const recById = id => { const t = String(id).split('-')[0]; return allRecs(t).find(r => r.id === id); };
const typeOf  = r => (r && r.id) ? String(r.id).split('-')[0] : '';
function nextId(t){ STORE.seq[t] = (STORE.seq[t]||0) + 1; return t + '-' + String(STORE.seq[t]).padStart(5,'0'); }

/* Siapa yang sedang memakai — dipakai sebagai penulis perubahan.
   Bukan pengamanan: ini penanda kerja tim, dan halaman mengatakannya terus terang. */
const WHO_KEY = 'jaens-studio-who';
let WHO = '';
try{ WHO = localStorage.getItem(WHO_KEY) || ''; }catch(e){}
const whoName = () => WHO || 'Belum menyebut nama';

function logAct(act, r, note, changes){
  const T = typeOf(r);
  const e = { ts:new Date().toISOString(), act, id:r.id, type:T, by:whoName(),
    label: SCHEMA[T] ? SCHEMA[T].t(r) : '', note:note||'' };
  if(changes && changes.length) e.ch = changes;
  STORE.log.unshift(e);
  if(STORE.log.length > 700) STORE.log.length = 700;
}
function diffRec(before, after, type){
  const S = SCHEMA[type]; if(!S) return [];
  const out = [];
  S.f.filter(x => !x.g).forEach(x => {
    const a = before[x.k] === undefined ? '' : String(before[x.k]);
    const b = after[x.k]  === undefined ? '' : String(after[x.k]);
    if(a !== b) out.push({ k:x.k, l:x.l, from:a, to:b });
  });
  return out;
}

/* ================================================================
   SKEMA — dua entitas saja, dan itu disengaja
   ================================================================ */
const CNT_ST = ['Ide','Draft','Menunggu review','Revisi','Terjadwal','Tayang','Dibatalkan'];
const CNT_COLOR = { 'Ide':'gray','Draft':'blue','Menunggu review':'orange','Revisi':'red','Terjadwal':'purple','Tayang':'green','Dibatalkan':'gray' };
const CHANNELS = ['Instagram','TikTok','YouTube','LinkedIn','Website','Newsletter','Media','Offline'];
const PILLARS  = ['Kepemimpinan','Bisnis','Budaya Bali','Keluarga','Sosial','Di balik layar','Edukasi'];
const ROLES    = ['Content Lead','Penulis','Desainer','Videografer','Editor','Social Media','Fotografer','Lainnya'];

const SCHEMA = {
  CNT:{ n:'Konten', ic:'mega', c:'pink',
    d:'Satu karya konten — dari ide sampai tayang.',
    t:r=>r.n || '(tanpa judul)',
    s:r=>[r.channel, r.status, r.date?dOnly(r.date):''].filter(Boolean).join(' · '),
    f:[{g:'Konten'},
       {k:'n',l:'Judul / ide konten',t:'text',req:1,full:1,ph:'Seri: membangun tim yang tidak bergantung pada saya'},
       {k:'channel',l:'Kanal',t:'sel',req:1,opt:CHANNELS},
       {k:'pillar',l:'Pilar konten',t:'sel',opt:PILLARS},
       {k:'status',l:'Status',t:'sel',req:1,opt:CNT_ST},
       {k:'date',l:'Tanggal tayang',t:'date'},
       {k:'owner',l:'Penanggung jawab',t:'rel',rel:'TIM'},
       {g:'Isi'},
       {k:'brief',l:'Pesan utama',t:'textarea',full:1,ph:'Satu kalimat: apa yang harus diingat orang setelah melihat ini?'},
       {k:'notes',l:'Catatan pengerjaan',t:'textarea',full:1},
       {k:'assets',l:'Tautan aset (foto, video, draf)',t:'url',full:1},
       {k:'url',l:'Tautan tayang',t:'url',full:1,hint:'Diisi setelah konten benar-benar tayang.'}]},

  TIM:{ n:'Anggota Tim', ic:'users', c:'teal',
    d:'Orang yang mengerjakan konten.',
    t:r=>r.n || '(tanpa nama)',
    s:r=>[r.role, r.note].filter(Boolean).join(' · '),
    f:[{k:'n',l:'Nama',t:'text',req:1,full:1},
       {k:'role',l:'Peran',t:'sel',req:1,opt:ROLES},
       {k:'note',l:'Catatan',t:'text',full:1}]}
};
const SCH_ORDER = ['CNT','TIM'];
const ownerName = id => { const p = id ? recById(id) : null; return p ? p.n : ''; };
