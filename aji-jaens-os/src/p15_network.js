/* ================================================================
   NETWORK / CRM — relationship intelligence
   Entitas Interaksi mencatat: siapa, kapan, lewat apa, membahas apa, janji apa.
   Dari situ sistem menagih: siapa yang lewat ritme kontaknya dan janji apa yang belum ditepati.
   ================================================================ */

SCHEMA.INT = {
  n:'Interaksi', ic:'phone', c:'teal', mod:'network', priv:'PRIVATE',
  d:'Satu percakapan atau pertemuan dengan seseorang.',
  t:r=>{ const p = r.per ? recById(r.per) : null; return (p ? SCHEMA.PER.t(p) : 'Tanpa kontak') + ' — ' + (r.topic || 'tanpa topik'); },
  s:r=>[dOnly(r.date), r.channel, r.next ? 'ada janji tindak lanjut' : ''].filter(Boolean).join(' · '),
  f:[{g:'Pertemuan'},
     {k:'per',l:'Dengan siapa',t:'rel',rel:'PER',req:1},
     {k:'date',l:'Tanggal',t:'date',req:1},
     {k:'channel',l:'Lewat apa',t:'sel',req:1,opt:['Tatap muka','Telepon','WhatsApp','Email','Video call','Pesan singkat','Acara / undangan']},
     {k:'dur',l:'Lama (menit)',t:'num'},
     {k:'topic',l:'Topik utama',t:'text',req:1,full:1,ph:'Kelanjutan sewa lahan fase 2'},
     {g:'Isi & tindak lanjut'},
     {k:'outcome',l:'Hasil pembicaraan',t:'textarea',full:1},
     {k:'theirs',l:'Yang dia butuhkan',t:'textarea',full:1,hint:'Menjaga hubungan berarti tahu apa yang berguna bagi dia, bukan hanya bagi kita.'},
     {k:'next',l:'Janji saya berikutnya',t:'text',full:1,ph:'Kirim draf perjanjian'},
     {k:'nextDate',l:'Kapan janji itu ditepati',t:'date'},
     {k:'nextDone',l:'Janji sudah ditepati pada',t:'date',hint:'Terisi otomatis saat Anda menandainya selesai.'},
     {k:'note',l:'Catatan',t:'textarea',full:1}]
};
SCH_ORDER.splice(SCH_ORDER.indexOf('PER') + 1, 0, 'INT');
MODULE_ENTITIES.network = ['PER','INT','ORG'];

/* ---------------- ritme kontak ---------------- */
const CADENCE_DAYS = { 'Mingguan':7, 'Bulanan':30, 'Kuartalan':90, 'Semester':180, 'Tahunan':365 };
function intsOf(id){ return recs('INT').filter(i => i.per === id).sort((a,b) => (a.date||'') < (b.date||'') ? 1 : -1); }
function contactStat(p){
  const ints = intsOf(p.id);
  const last = ints.length && ints[0].date ? ints[0].date : (p.last || '');
  const days = last ? daysBetween(last, todayISO()) : null;
  const target = CADENCE_DAYS[p.cadence] || null;
  const over = (target !== null && days !== null) ? days - target : null;
  let st = 'none';
  if(target){
    if(days === null) st = 'never';
    else if(over > target * 0.5) st = 'cold';
    else if(over > 0) st = 'due';
    else st = 'ok';
  }
  const y1 = shiftISO(todayISO(), -365);
  const recent = ints.filter(i => i.date && i.date >= y1).length;
  return { ints, n: ints.length, last, days, target, over, st, recent,
           tier: recent >= 6 ? 'A' : recent >= 3 ? 'B' : recent >= 1 ? 'C' : 'D' };
}
const ST_LABEL = { never:'Belum pernah dicatat', cold:'Mendingin', due:'Sudah waktunya', ok:'Terjaga', none:'Tanpa ritme' };
const ST_COLOR = { never:'orange', cold:'red', due:'orange', ok:'green', none:'gray' };

function dueContacts(){
  return recs('PER').map(p => Object.assign({ p }, contactStat(p)))
    .filter(x => x.st === 'due' || x.st === 'cold' || x.st === 'never')
    .sort((a,b) => {
      if(a.st === 'never' && b.st !== 'never') return -1;
      if(b.st === 'never' && a.st !== 'never') return 1;
      return (b.over || 0) - (a.over || 0);
    });
}
/* Janji yang belum ditepati */
function promises(){
  return recs('INT').filter(i => i.next && !i.nextDone)
    .sort((a,b) => (a.nextDate || '9999') < (b.nextDate || '9999') ? -1 : 1);
}

/* ---------------- sinkron "terakhir kontak" ---------------- */
function syncLastContact(){
  let changed = false;
  recs('PER').forEach(p => {
    const dates = intsOf(p.id).map(i => i.date).filter(Boolean).sort();
    if(!dates.length) return;
    const mx = dates[dates.length - 1];
    if(!p.last || p.last < mx){ p.last = mx; p._m.updated_at = new Date().toISOString(); changed = true; }
  });
  if(changed) saveStore();
  return changed;
}
/* Pasang sesudah simpan form dan sesudah impor */
const _submitFormBase = submitForm;
submitForm = function(){ const t = FORM_T; _submitFormBase(); if(t === 'INT' && syncLastContact()) go(CUR); };
const _impCommitBase = impCommit;
impCommit = function(){ const t = IMP.type; _impCommitBase(); if(t === 'INT' && syncLastContact()) go(CUR); };

/* ---------------- aksi janji ---------------- */
function promiseDone(id){
  const i = recById(id); if(!i) return;
  i.nextDone = todayISO(); i._m.updated_at = new Date().toISOString();
  logAct('UPDATE', i, 'janji ditepati'); saveStore(); closeModal();
  toast('Janji ditandai ditepati'); go(CUR);
}
function promiseToTask(id){
  const i = recById(id); if(!i) return;
  const p = i.per ? recById(i.per) : null;
  const now = new Date().toISOString();
  const t = { id: nextId('TSK'), type:'TSK', n: i.next,
    pri: i.nextDate && i.nextDate <= shiftISO(todayISO(),1) ? 'P1 — hari ini' : 'P2 — minggu ini',
    status:'Belum mulai', due: i.nextDate || '', note: 'Janji kepada ' + (p ? SCHEMA.PER.t(p) : '—') + ' · dari ' + i.id };
  t._m = { created_at:now, updated_at:now, created_by:DB.owner.name, updated_by:DB.owner.name, status:'ACTIVE',
    source_type:'MANUAL_ENTRY', source_id:i.id, source_url:'', privacy_level:'TEAM', is_dummy:false, is_archived:false, tags:[] };
  (STORE.rec.TSK = STORE.rec.TSK || []).unshift(t);
  i.taskId = t.id; i._m.updated_at = now;
  logAct('CREATE', t, 'dari janji ' + i.id); saveStore(); closeModal();
  toast('Dibuat sebagai tugas ' + t.id); go(CUR);
}

/* ---------------- kartu orang ---------------- */
function crmPerson(id){
  const p = recById(id); if(!p) return;
  const s = contactStat(p);
  const open = promises().filter(i => i.per === id);
  modal(SCHEMA.PER.t(p), [p.pos, p.org, p.city].filter(Boolean).join(' · ') || p.cat,
    `<div class="flexr" style="gap:7px;margin-bottom:16px">
       ${idPill(p.id)}
       <span class="pill ${ST_COLOR[s.st]}">${ST_LABEL[s.st]}</span>
       <span class="pill gray">Tier ${s.tier}</span>
       ${p.cat ? `<span class="pill teal">${h(p.cat)}</span>` : ''}
       <span class="pill blue">${p._m.privacy_level}</span>
     </div>

     <div class="g g3" style="gap:12px;margin:0 0 18px">
       <div class="card" style="padding:13px"><div class="mini">Terakhir kontak</div>
         <b style="font-family:var(--fd);font-size:19px">${s.last ? dOnly(s.last) : '—'}</b>
         <div class="mini">${s.days === null ? 'belum ada catatan' : s.days + ' hari lalu'}</div></div>
       <div class="card" style="padding:13px"><div class="mini">Ritme yang Anda tetapkan</div>
         <b style="font-family:var(--fd);font-size:19px">${p.cadence ? h(p.cadence) : '—'}</b>
         <div class="mini">${s.target ? 'target tiap ' + s.target + ' hari' : 'tidak ditagih sistem'}</div></div>
       <div class="card" style="padding:13px"><div class="mini">Interaksi tercatat</div>
         <b style="font-family:var(--fd);font-size:19px">${s.n}</b>
         <div class="mini">${s.recent} dalam 12 bulan terakhir</div></div>
     </div>

     ${p.value ? `<div class="card" style="padding:14px;margin-bottom:16px;background:var(--gold-tint)">
        <div class="mini" style="margin-bottom:4px">Apa yang dia butuhkan / bisa saya bantu</div>
        <div style="font-size:13px">${h(p.value).replace(/\n/g,'<br>')}</div></div>` : ''}

     ${open.length ? `<div class="card-h"><div class="ic" style="background:var(--orange-t);color:var(--orange)">${ic('flag')}</div>
        <h3>Janji yang belum ditepati</h3><div class="r"><span class="cnt">${open.length}</span></div></div>
       <div class="rows" style="margin-bottom:16px">${open.map(i => promiseRow(i, true)).join('')}</div>` : ''}

     <div class="card-h"><div class="ic" style="background:var(--teal-t);color:var(--teal)">${ic('phone')}</div>
       <h3>Riwayat interaksi</h3><div class="r"><button class="btn ghost sm" onclick="closeModal();openForm('INT')">${ic('plus')} Catat</button></div></div>
     ${s.ints.length ? `<div class="tl">${s.ints.slice(0,15).map(i => `
        <div class="tl-i" onclick="closeModal();recDetail('${i.id}')">
          <span class="tm">${i.date ? dOnly(i.date).slice(0,6) : '—'}</span>
          <span class="bar" style="background:var(--teal)"></span>
          <span class="bd"><b>${h(i.topic || '—')}</b><span>${[h(i.channel||''), i.outcome ? h(i.outcome).slice(0,70) : ''].filter(Boolean).join(' · ')}</span></span>
        </div>`).join('')}</div>
        ${s.ints.length > 15 ? `<div class="mini" style="margin-top:8px">Menampilkan 15 dari ${s.ints.length}.</div>` : ''}`
      : `<p class="sub" style="margin:0">Belum ada interaksi tercatat. Kontak tanpa catatan interaksi hanya buku telepon.</p>`}

     <div class="sep" style="margin:18px 0"></div>
     <div class="fgroup" style="border:0;padding:0;margin:0 0 10px">Metadata universal</div>
     <dl class="kv">
       <dt>Dibuat</dt><dd>${dtID(p._m.created_at)} oleh ${h(p._m.created_by)}</dd>
       <dt>Diperbarui</dt><dd>${dtID(p._m.updated_at)} oleh ${h(p._m.updated_by)}</dd>
       <dt>Sumber</dt><dd>${p._m.source_type} · is_dummy = ${p._m.is_dummy}</dd>
       <dt>Privasi</dt><dd>${p._m.privacy_level}</dd>
     </dl>`,
    `<button class="btn solid" onclick="closeModal();openForm('INT')">${ic('plus')} Catat interaksi</button>
     <button class="btn ghost" onclick="openForm('PER','${id}')">Ubah kontak</button>
     ${p.phone ? `<button class="btn grn" onclick="toast('Nomor: ${esc(p.phone)}')">${ic('wa')} ${h(p.phone)}</button>` : ''}
     <button class="btn ghost" style="margin-left:auto" onclick="closeModal()">Tutup</button>`, true);
}
/* Buka kartu CRM untuk kontak, detail biasa untuk entitas lain */
const _recDetailBase = recDetail;
recDetail = function(id){
  if(String(id).indexOf('PER-') === 0 && recById(id)) return crmPerson(id);
  return _recDetailBase(id);
};

function promiseRow(i, inModal){
  const p = i.per ? recById(i.per) : null;
  const late = i.nextDate && i.nextDate < todayISO();
  return `<div class="row-i" style="align-items:flex-start;cursor:default">
    <span style="width:8px;height:8px;border-radius:50%;background:${CV(late?'red':'orange')};margin-top:6px;flex:0 0 8px"></span>
    <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">${h(i.next)}</span>
      <span class="s">${p ? h(SCHEMA.PER.t(p)) : '—'} · ${i.nextDate ? (late ? 'terlambat ' + daysBetween(i.nextDate, todayISO()) + ' hari' : relDay(i.nextDate).toLowerCase()) : 'tanpa tanggal'}${i.taskId ? ' · sudah jadi ' + i.taskId : ''}</span></span>
    <span class="rt" style="display:flex;gap:5px">
      <button class="btn ghost sm" onclick="promiseDone('${i.id}')">Ditepati</button>
      ${i.taskId ? '' : `<button class="btn ghost sm" onclick="promiseToTask('${i.id}')">Jadikan tugas</button>`}
    </span></div>`;
}

/* ---------------- TAB: perlu dihubungi ---------------- */
function nwDue(){
  const due = dueContacts(), prom = promises();
  const late = prom.filter(i => i.nextDate && i.nextDate < todayISO());
  return `
  <div class="g g4" style="margin-bottom:18px">
    ${[['Perlu dihubungi', due.length, due.length?'orange':'green','phone'],
       ['Mendingin', due.filter(x=>x.st==='cold').length, 'red','clock'],
       ['Janji belum ditepati', prom.length, prom.length?'orange':'green','flag'],
       ['Janji terlambat', late.length, late.length?'red':'gray','shield']].map(s=>`
      <div class="card"><div class="kpi">
        <div class="ic" style="width:38px;height:38px;border-radius:11px;display:grid;place-items:center;flex:0 0 38px;background:${CT(s[2])};color:${CV(s[2])}">${ic(s[3])}</div>
        <div style="min-width:0"><b>${s[1]}</b><span>${s[0]}</span></div></div></div>`).join('')}
  </div>

  <div class="g g21 top" style="margin:0">
    <div class="card">
      ${cardH('phone','Sudah waktunya dihubungi','orange',`<span class="mini">diurut dari yang paling lama terlewat</span>`)}
      ${due.length ? `<div class="rows">${due.map(x => `
        <div class="row-i" style="align-items:flex-start" onclick="crmPerson('${x.p.id}')">
          ${avat(SCHEMA.PER.t(x.p), ST_COLOR[x.st])}
          <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">${h(SCHEMA.PER.t(x.p))}</span>
            <span class="s">${[x.p.pos, x.p.org].filter(Boolean).join(' · ') || h(x.p.cat||'')} · ritme ${h(x.p.cadence||'—')}</span></span>
          <span class="rt"><span class="pill ${ST_COLOR[x.st]}">${x.st === 'never' ? 'belum pernah' : x.over + ' hari lewat'}</span></span>
        </div>`).join('')}</div>`
        : `<p class="sub" style="margin:0">Tidak ada yang terlewat dari ritmenya. ${recs('PER').filter(p=>p.cadence).length ? 'Jaringan Anda terjaga.' : 'Isi kolom "Ritme kontak" pada kontak agar sistem bisa menagih.'}</p>`}
      <div class="card-f"><span class="linkr" onclick="openForm('INT')">Catat interaksi →</span></div>
    </div>

    <div class="card">
      ${cardH('flag','Janji saya','orange',`<span class="cnt">${prom.length}</span>`)}
      ${prom.length ? `<div class="rows">${prom.slice(0,10).map(i => promiseRow(i)).join('')}</div>`
        : `<p class="sub" style="margin:0">Tidak ada janji yang menggantung. Janji dicatat di kolom "Janji saya berikutnya" saat Anda mencatat interaksi.</p>`}
    </div>
  </div>`;
}

/* ---------------- TAB: semua kontak ---------------- */
let NF = { q:'', cat:'', st:'' };
function nwAll(){
  let list = recs('PER').map(p => Object.assign({ p }, contactStat(p)));
  if(NF.cat) list = list.filter(x => x.p.cat === NF.cat);
  if(NF.st)  list = list.filter(x => x.st === NF.st);
  if(NF.q){ const q = NF.q.toLowerCase();
    list = list.filter(x => (x.p.n + ' ' + (x.p.org||'') + ' ' + (x.p.pos||'') + ' ' + (x.p.city||'')).toLowerCase().includes(q)); }
  list.sort((a,b) => (a.last || '') < (b.last || '') ? 1 : -1);
  const cats = [];
  recs('PER').forEach(p => { if(p.cat && cats.indexOf(p.cat) < 0) cats.push(p.cat); });
  return `
  <div class="card">
    ${cardH('net','Semua kontak','teal',
      `<span class="mini">${list.length} dari ${recs('PER').length}</span>
       <button class="btn gold sm" style="margin-left:9px" onclick="openForm('PER')">${ic('plus')} Kontak</button>`)}
    <div class="flexr" style="gap:8px;margin-bottom:13px">
      <input type="text" value="${h(NF.q)}" placeholder="Cari nama, organisasi, jabatan, kota…" oninput="NF.q=this.value;renderNwList()"
        style="flex:1;min-width:170px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:10px;padding:7px 11px;font:inherit;font-size:13px;outline:0">
      <select onchange="NF.cat=this.value;go('network')" style="border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:10px;padding:6px 10px;font:inherit;font-size:12.5px">
        <option value="">Semua kategori</option>${cats.map(c=>`<option value="${h(c)}"${NF.cat===c?' selected':''}>${h(c)}</option>`).join('')}</select>
      <select onchange="NF.st=this.value;go('network')" style="border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:10px;padding:6px 10px;font:inherit;font-size:12.5px">
        <option value="">Semua status</option>${Object.keys(ST_LABEL).map(k=>`<option value="${k}"${NF.st===k?' selected':''}>${ST_LABEL[k]}</option>`).join('')}</select>
      ${(NF.q||NF.cat||NF.st) ? `<button class="btn ghost sm" onclick="NF={q:'',cat:'',st:''};go('network')">Bersihkan</button>` : ''}
    </div>
    <div id="nwList">${nwListHTML(list)}</div>
  </div>`;
}
function nwListHTML(list){
  if(!list.length) return `<div class="empty">Tidak ada kontak yang cocok.</div>`;
  return `<div style="overflow-x:auto"><table class="tbl"><thead><tr>
    <th>Kontak</th><th>Kategori</th><th>Tier</th><th>Ritme</th><th>Terakhir</th><th>Status</th><th style="text-align:right">Interaksi</th>
  </tr></thead><tbody>${list.map(x => `<tr class="click" onclick="crmPerson('${x.p.id}')" style="cursor:pointer">
    <td><b>${h(SCHEMA.PER.t(x.p))}</b><div class="mini">${h([x.p.pos, x.p.org].filter(Boolean).join(' · ') || '—')}</div></td>
    <td>${h(x.p.cat || '—')}</td>
    <td><span class="pill ${x.tier==='A'?'green':x.tier==='B'?'blue':x.tier==='C'?'orange':'gray'}">${x.tier}</span></td>
    <td class="mini">${h(x.p.cadence || '—')}</td>
    <td class="mini">${x.last ? dOnly(x.last) + ' · ' + x.days + ' hari' : '—'}</td>
    <td><span class="pill ${ST_COLOR[x.st]}">${ST_LABEL[x.st]}</span></td>
    <td style="text-align:right;font-variant-numeric:tabular-nums">${x.n}</td>
  </tr>`).join('')}</tbody></table></div>`;
}
function renderNwList(){
  let list = recs('PER').map(p => Object.assign({ p }, contactStat(p)));
  if(NF.cat) list = list.filter(x => x.p.cat === NF.cat);
  if(NF.st)  list = list.filter(x => x.st === NF.st);
  if(NF.q){ const q = NF.q.toLowerCase();
    list = list.filter(x => (x.p.n + ' ' + (x.p.org||'') + ' ' + (x.p.pos||'') + ' ' + (x.p.city||'')).toLowerCase().includes(q)); }
  list.sort((a,b) => (a.last || '') < (b.last || '') ? 1 : -1);
  const el = document.getElementById('nwList');
  if(el) el.innerHTML = nwListHTML(list);
}

/* ---------------- TAB: riwayat interaksi ---------------- */
function nwLog(){
  const all = recs('INT').sort((a,b) => (a.date||'') < (b.date||'') ? 1 : -1);
  if(!all.length) return `<div class="card" style="text-align:center;padding:44px 26px">
    <div style="width:58px;height:58px;border-radius:17px;background:var(--teal-t);color:var(--teal);display:grid;place-items:center;margin:0 auto 15px">
      <span style="display:block;width:27px;height:27px">${ic('phone')}</span></div>
    <h2 style="font-family:var(--fd);font-size:23px;font-weight:600;margin:0 0 8px">Belum ada interaksi tercatat</h2>
    <p class="sub" style="max-width:450px;margin:0 auto 18px">Setiap kali Anda bertemu, menelepon, atau berkirim pesan penting — catat satu baris.
      Dari catatan itulah sistem tahu siapa yang mulai terabaikan.</p>
    <button class="btn solid" onclick="openForm('INT')">${ic('plus')} Catat interaksi pertama</button></div>`;
  const byMonth = {};
  all.forEach(i => { const k = (i.date || '').slice(0,7) || 'tanpa tanggal'; (byMonth[k] = byMonth[k] || []).push(i); });
  const chan = {};
  all.forEach(i => { chan[i.channel || '—'] = (chan[i.channel || '—'] || 0) + 1; });
  return `
  <div class="g g4" style="margin-bottom:18px">
    ${[['Interaksi tercatat', all.length, 'teal','phone'],
       ['30 hari terakhir', all.filter(i => i.date && daysBetween(i.date, todayISO()) <= 30).length, 'blue','clock'],
       ['Tatap muka', all.filter(i => i.channel === 'Tatap muka').length, 'green','users'],
       ['Orang berbeda', Object.keys(all.reduce((m,i)=>{ if(i.per) m[i.per]=1; return m; },{})).length, 'purple','net']].map(s=>`
      <div class="card"><div class="kpi">
        <div class="ic" style="width:38px;height:38px;border-radius:11px;display:grid;place-items:center;flex:0 0 38px;background:${CT(s[2])};color:${CV(s[2])}">${ic(s[3])}</div>
        <div style="min-width:0"><b>${s[1]}</b><span>${s[0]}</span></div></div></div>`).join('')}
  </div>
  <div class="card">
    ${cardH('phone','Riwayat interaksi','teal',`<button class="btn gold sm" onclick="openForm('INT')">${ic('plus')} Catat</button>`)}
    ${Object.keys(byMonth).sort().reverse().map(k => {
      const label = k === 'tanpa tanggal' ? k : BLN[Number(k.slice(5,7)) - 1] + ' ' + k.slice(0,4);
      return `<div style="margin-bottom:16px">
        <div class="flexr" style="gap:8px;margin:0 0 6px">
          <b style="font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--text-3)">${label}</b>
          <span class="cnt">${byMonth[k].length}</span></div>
        <div class="rows">${byMonth[k].map(i => { const p = i.per ? recById(i.per) : null;
          return `<div class="row-i" style="align-items:flex-start" onclick="recDetail('${i.id}')">
            <span class="pill teal" style="margin-top:1px">${h(i.channel || '—')}</span>
            <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">${h(i.topic || '—')}</span>
              <span class="s">${p ? h(SCHEMA.PER.t(p)) : 'tanpa kontak'} · ${i.date ? dOnly(i.date) : '—'}${i.next ? ' · ada janji' : ''}</span></span>
          </div>`; }).join('')}</div></div>`; }).join('')}
  </div>`;
}

/* ---------------- TAB: peta relasi ---------------- */
function nwMap(){
  const all = recs('PER');
  if(!all.length) return `<div class="empty">Belum ada kontak.</div>`;
  const stats = all.map(p => Object.assign({ p }, contactStat(p)));
  const cats = {};
  all.forEach(p => { const k = p.cat || 'Tanpa kategori'; cats[k] = (cats[k] || 0) + 1; });
  const palette = ['teal','blue','purple','gold','pink','orange','green','red','gray'];
  const catItems = Object.keys(cats).sort((a,b) => cats[b] - cats[a]).map((k,i) => ({ n:k, v:cats[k], c:palette[i % palette.length] }));
  const orgs = {};
  all.forEach(p => { if(p.org) orgs[p.org] = (orgs[p.org] || 0) + 1; });
  const orgList = Object.keys(orgs).sort((a,b) => orgs[b] - orgs[a]).slice(0,10);
  const tiers = ['A','B','C','D'].map(t => ({ t, n: stats.filter(x => x.tier === t).length }));
  const mxT = Math.max(...tiers.map(x => x.n)) || 1;
  const cities = {};
  all.forEach(p => { if(p.city) cities[p.city] = (cities[p.city] || 0) + 1; });
  return `
  <div class="g g21 top" style="margin:0 0 18px">
    <div class="card">
      ${cardH('net','Sebaran kategori','teal',`<span class="mini">${all.length} kontak</span>`)}
      <div class="flexr" style="gap:20px;align-items:center">
        ${donut(catItems.map(x => ({ v:x.v, c:x.c })), 132)}
        <div style="flex:1;min-width:150px">${catItems.map(x => `
          <div class="flexr" style="gap:8px;margin-bottom:6px;flex-wrap:nowrap">
            <span style="width:9px;height:9px;border-radius:3px;background:${CV(x.c)};flex:0 0 9px"></span>
            <span style="flex:1;min-width:0;font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${h(x.n)}</span>
            <b style="font-size:12.5px;font-variant-numeric:tabular-nums">${x.v}</b></div>`).join('')}</div>
      </div>
    </div>

    <div class="card">
      ${cardH('chart','Kekuatan hubungan','purple')}
      <p class="sub" style="margin:0 0 12px;font-size:12px">Tier dihitung dari jumlah interaksi tercatat dalam 12 bulan terakhir — bukan dari perasaan dekat.</p>
      ${tiers.map(x => barLine(
        'Tier ' + x.t + (x.t==='A'?' · 6+ kali':x.t==='B'?' · 3–5 kali':x.t==='C'?' · 1–2 kali':' · belum ada'),
        x.n, mxT, x.t==='A'?'green':x.t==='B'?'blue':x.t==='C'?'orange':'gray')).join('')}
      <div class="card-f"><span class="mini">Tier D berarti belum ada interaksi tercatat — bukan berarti hubungannya buruk.</span></div>
    </div>
  </div>

  <div class="g g2" style="margin:0">
    <div class="card">
      ${cardH('brief','Organisasi terbanyak','gold',`<span class="mini">${Object.keys(orgs).length} organisasi</span>`)}
      ${orgList.length ? `<div class="rows">${orgList.map(o => `
        <div class="row-i" style="cursor:pointer" onclick="NF={q:'${esc(o)}',cat:'',st:''};NW_TAB='all';go('network')">
          <span style="width:3px;align-self:stretch;border-radius:3px;background:var(--gold);flex:0 0 3px"></span>
          <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">${h(o)}</span></span>
          <span class="rt"><span class="cnt">${orgs[o]}</span></span></div>`).join('')}</div>`
        : '<p class="sub" style="margin:0">Belum ada kontak dengan kolom organisasi terisi.</p>'}
    </div>
    <div class="card">
      ${cardH('pin','Sebaran kota','blue',`<span class="mini">${Object.keys(cities).length} kota</span>`)}
      ${Object.keys(cities).length ? `<div class="rows">${Object.keys(cities).sort((a,b)=>cities[b]-cities[a]).slice(0,10).map(c => `
        <div class="row-i" style="cursor:default">
          <span style="width:3px;align-self:stretch;border-radius:3px;background:var(--blue);flex:0 0 3px"></span>
          <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">${h(c)}</span></span>
          <span class="rt"><span class="cnt">${cities[c]}</span></span></div>`).join('')}</div>`
        : '<p class="sub" style="margin:0">Belum ada kontak dengan kolom kota terisi.</p>'}
    </div>
  </div>`;
}

/* ---------------- halaman Network ---------------- */
let NW_TAB = 'due';
const NW_TABS = [['due','Perlu Dihubungi'],['all','Semua Kontak'],['log','Riwayat Interaksi'],['map','Peta Relasi']];
const NW_VIEW = { due:nwDue, all:nwAll, log:nwLog, map:nwMap };
function nwTab(k){ NW_TAB = k; go('network'); }

VIEWS.network = () => {
  const hasAny = recs('PER').length || recs('INT').length || recs('ORG').length;
  const head = `
  <div class="page-h">
    <div><h1>Network</h1><p>Relationship intelligence — siapa yang perlu Anda hubungi, dan janji apa yang belum ditepati.</p></div>
    <div class="sp">
      <button class="btn gold sm" onclick="openForm('INT')">${ic('plus')} Catat interaksi</button>
      <button class="btn ghost sm" onclick="openForm('PER')">${ic('net')} Kontak</button>
      <button class="btn ghost sm" onclick="openImport('PER')">${ic('doc')} Impor</button>
    </div>
  </div>
  ${dummyOn() ? '' : dummyStateBar()}`;

  if(!hasAny) return head + `
    <div class="card" style="text-align:center;padding:48px 26px;margin-bottom:18px">
      <div style="width:62px;height:62px;border-radius:19px;background:var(--teal-t);color:var(--teal);display:grid;place-items:center;margin:0 auto 16px">
        <span style="display:block;width:29px;height:29px">${ic('net')}</span></div>
      <h2 style="font-family:var(--fd);font-size:24px;font-weight:600;margin:0 0 8px">Jaringan masih kosong</h2>
      <p class="sub" style="max-width:480px;margin:0 auto 20px">Isi kontak, tetapkan ritme berapa sering Anda ingin menjaganya, lalu catat tiap interaksi.
        Sistem yang akan mengingatkan siapa yang mulai terabaikan — bukan ingatan Anda.</p>
      <div style="display:flex;gap:9px;justify-content:center;flex-wrap:wrap">
        <button class="btn solid" onclick="openForm('PER')">${ic('plus')} Kontak pertama</button>
        <button class="btn gold" onclick="openImport('PER')">${ic('doc')} Impor dari Sheets</button>
      </div></div>` + (dummyOn() ? nwDemoBlock() : '');

  return head +
    `<div class="tabbar">${NW_TABS.map(([k,n])=>`<button class="${NW_TAB===k?'on':''}" onclick="nwTab('${k}')">${n}</button>`).join('')}</div>` +
    (NW_VIEW[NW_TAB] || nwDue)() +
    (dummyOn() ? nwDemoBlock() : '');
};

function nwDemoBlock(){
  return `
  <div class="sect" style="margin-top:30px">
    <div><h2>Tampilan contoh</h2><p>Jaringan contoh — untuk melihat wujudnya saat sudah penuh terisi.</p></div>
    <div class="sp"><span class="pill dummy">⚠ DUMMY DATA</span>
      <button class="btn ghost sm" onclick="setDummyMode('hidden')">Sembunyikan</button></div>
  </div>
  ${NET_BODY()}`;
}

