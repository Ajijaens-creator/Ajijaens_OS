/* ================================================================
   BUSINESS EMPIRE — struktur unit, isu operasional, checklist berulang
   Tidak ada angka keuangan yang dientri di sini: sumbernya tetap Finance Drive.
   Checklist unit memakai mesin Ritme yang sama — satu mekanisme, bukan dua.
   ================================================================ */

/* ---------------- entitas baru: Isu Operasional ---------------- */
const SEV = ['Kritis','Tinggi','Sedang','Rendah'];
const SEV_COLOR = { 'Kritis':'red', 'Tinggi':'orange', 'Sedang':'yellow', 'Rendah':'gray' };
const OPS_OPEN = ['Terbuka','Sedang ditangani','Menunggu pihak lain'];
SCHEMA.OPS = {
  n:'Isu Operasional', ic:'cog', c:'orange', mod:'business', priv:'BUSINESS_UNIT',
  d:'Masalah nyata di satu unit — beserta akar dan tindakannya.',
  t:r=>r.n,
  s:r=>{ const u = r.unit ? recById(r.unit) : null;
    return [u ? SCHEMA.BUS.t(u) : 'tanpa unit', r.sev, r.status].filter(Boolean).join(' · '); },
  f:[{g:'Isu'},
     {k:'n',l:'Judul isu',t:'text',req:1,full:1,ph:'Antrean tamu menumpuk jam 17–19'},
     {k:'unit',l:'Unit',t:'rel',rel:'BUS',req:1},
     {k:'sev',l:'Tingkat',t:'sel',req:1,opt:SEV},
     {k:'status',l:'Status',t:'sel',req:1,opt:OPS_OPEN.concat(['Selesai','Dibatalkan'])},
     {k:'opened',l:'Mulai terlihat',t:'date',req:1},
     {k:'owner',l:'Penanggung jawab',t:'rel',rel:'PER'},
     {k:'due',l:'Target beres',t:'date'},
     {k:'resolved',l:'Selesai pada',t:'date',hint:'Terisi otomatis saat Anda menandainya selesai.'},
     {g:'Analisis'},
     {k:'impact',l:'Dampaknya apa',t:'textarea',full:1,ph:'Ke tamu, ke tim, ke biaya — sekonkret mungkin'},
     {k:'root',l:'Akar masalah',t:'textarea',full:1,
       hint:'Gejala bukan akar. Isu yang ditutup tanpa akar biasanya kembali.'},
     {k:'action',l:'Tindakan yang diambil',t:'textarea',full:1},
     {k:'note',l:'Catatan',t:'textarea',full:1}]
};
SCH_ORDER.splice(SCH_ORDER.indexOf('BUS') + 1, 0, 'OPS');
MODULE_ENTITIES.business = ['BUS','OPS'];

/* Checklist unit = Ritme yang ditempelkan ke satu unit — mesin yang sama */
SCHEMA.RIT.f.splice(2, 0, { k:'unit', l:'Unit bisnis (bila checklist operasional)', t:'rel', rel:'BUS',
  hint:'Kosongkan untuk ritme pribadi. Diisi bila ini checklist milik satu unit.' });

/* ---------------- perhitungan ---------------- */
const opsOpen = () => recs('OPS').filter(o => OPS_OPEN.indexOf(o.status) >= 0);
function unitStat(u){
  const iss = recs('OPS').filter(o => o.unit === u.id);
  const open = iss.filter(o => OPS_OPEN.indexOf(o.status) >= 0);
  const rits = recs('RIT').filter(r => r.unit === u.id).map(r => Object.assign({ r }, ritStat(r)));
  const projs = recs('PRO').filter(p => p.unit === u.id).map(p => Object.assign({ p }, projStats(p)));
  const tasks = recs('TSK').filter(t => projs.some(x => x.p.id === t.proj));
  const ages = open.filter(o => o.opened).map(o => daysBetween(o.opened, todayISO()));
  return {
    iss, open, crit: open.filter(o => o.sev === 'Kritis' || o.sev === 'Tinggi'),
    resolved90: iss.filter(o => o.status === 'Selesai' && o.resolved && daysBetween(o.resolved, todayISO()) <= 90).length,
    rits, ritDue: rits.filter(x => x.st === 'due' || x.st === 'broken' || x.st === 'never'),
    projs, projLate: projs.filter(x => x.overdue),
    tasksOpen: tasks.filter(t => DONE_ST.indexOf(t.status) < 0).length,
    oldest: ages.length ? Math.max.apply(null, ages) : 0,
    pic: u.pic ? recById(u.pic) : null
  };
}
function issueDone(id){
  const o = recById(id); if(!o) return;
  const st0 = o.status;
  o.status = 'Selesai'; o.resolved = todayISO(); o._m.updated_at = new Date().toISOString();
  logAct('RESOLVE', o, '', [{k:'status',l:'Status',from:st0,to:'Selesai'},{k:'resolved',l:'Selesai pada',from:'',to:o.resolved}]); saveStore(); closeModal();
  toast(o.root ? 'Isu ditutup' : 'Isu ditutup — akar masalahnya belum diisi, jadi mudah kembali');
  go(CUR);
}
function issueToTask(id){
  const o = recById(id); if(!o) return;
  const u = o.unit ? recById(o.unit) : null;
  const now = new Date().toISOString();
  const t = { id: nextId('TSK'), type:'TSK', n: o.action ? String(o.action).split('\n')[0] : 'Tangani: ' + o.n,
    pri: o.sev === 'Kritis' ? 'P1 — hari ini' : o.sev === 'Tinggi' ? 'P2 — minggu ini' : 'P3 — nanti',
    status:'Belum mulai', due: o.due || '', owner: o.owner || '',
    note: 'Dari isu ' + o.id + (u ? ' di ' + SCHEMA.BUS.t(u) : '') };
  t._m = { created_at:now, updated_at:now, created_by:DB.owner.name, updated_by:DB.owner.name, status:'ACTIVE',
    source_type:'MANUAL_ENTRY', source_id:o.id, source_url:'', privacy_level:'TEAM', is_dummy:false, is_archived:false, tags:[] };
  (STORE.rec.TSK = STORE.rec.TSK || []).unshift(t);
  o.taskId = t.id; o._m.updated_at = now;
  logAct('CREATE', t, 'dari isu ' + o.id); saveStore(); closeModal();
  toast('Dibuat sebagai tugas ' + t.id); go(CUR);
}

/* ---------------- ruang kerja unit ---------------- */
function unitWork(id){
  const u = recById(id); if(!u) return;
  const s = unitStat(u);
  modal(SCHEMA.BUS.t(u), [u.type, u.city, u.status].filter(Boolean).join(' · '),
    `<div class="flexr" style="gap:7px;margin-bottom:16px">
       ${idPill(u.id)}
       <span class="pill ${u.status === 'Beroperasi' ? 'green' : u.status === 'Ramp-up' ? 'blue' : u.status === 'Ditutup' ? 'gray' : 'orange'}">${h(u.status || '—')}</span>
       ${s.crit.length ? `<span class="pill red">${s.crit.length} isu berat</span>` : ''}
       <span class="pill blue">${u._m.privacy_level}</span>
     </div>

     <div class="g g4" style="gap:11px;margin:0 0 18px">
       ${[['Isu terbuka', s.open.length, s.open.length?'orange':'green'],
          ['Isu tertua', s.oldest ? s.oldest + ' hari' : '—', s.oldest > 30 ? 'red' : 'gray'],
          ['Checklist jatuh tempo', s.ritDue.length, s.ritDue.length?'orange':'green'],
          ['Tim', u.staff || '—', 'blue']].map(x => `
         <div class="card" style="padding:12px"><div class="mini">${x[0]}</div>
           <b style="font-family:var(--fd);font-size:20px;color:${CV(x[2])}">${x[1]}</b></div>`).join('')}
     </div>

     <dl class="kv" style="margin-bottom:18px">
       <dt>Penanggung jawab</dt><dd>${s.pic ? h(SCHEMA.PER.t(s.pic)) + ' · ' + s.pic.id : '<span class="sub">belum ditetapkan</span>'}</dd>
       <dt>Mulai beroperasi</dt><dd>${u.opened ? dOnly(u.opened) : '—'}</dd>
       <dt>Jenis usaha</dt><dd>${h(u.type || '—')}</dd>
       ${u.note ? `<dt>Catatan</dt><dd>${h(u.note).replace(/\n/g,'<br>')}</dd>` : ''}
     </dl>

     <div class="card-h"><div class="ic" style="background:var(--orange-t);color:var(--orange)">${ic('cog')}</div>
       <h3>Isu terbuka</h3><div class="r"><button class="btn ghost sm" onclick="closeModal();openForm('OPS')">${ic('plus')} Isu</button></div></div>
     ${s.open.length ? `<div class="rows" style="margin-bottom:16px">${s.open.map(o => issueRow(o)).join('')}</div>`
       : '<p class="sub" style="margin:0 0 16px">Tidak ada isu terbuka di unit ini.</p>'}

     <div class="card-h"><div class="ic" style="background:var(--gold-tint);color:var(--gold-dark)">${ic('clock')}</div>
       <h3>Checklist operasional</h3><div class="r"><button class="btn ghost sm" onclick="closeModal();openForm('RIT')">${ic('plus')} Checklist</button></div></div>
     ${s.rits.length ? `<div class="rows" style="margin-bottom:16px">${s.rits.map(x => `
        <div class="row-i" style="align-items:flex-start;cursor:default">
          <span class="pill ${RIT_COLOR[x.st]}" style="margin-top:1px">${RIT_LABEL[x.st]}</span>
          <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">${h(x.r.n)}</span>
            <span class="s">${h(x.r.freq)} · ${ritItems(x.r).length} langkah${x.keep !== null ? ' · kedisiplinan 90 hari ' + x.keep + '%' : ''}</span></span>
          <span class="rt"><button class="btn gold sm" onclick="closeModal();runRitme('${x.r.id}')">Jalankan</button></span>
        </div>`).join('')}</div>`
       : '<p class="sub" style="margin:0 0 16px">Belum ada checklist operasional untuk unit ini. Checklist memakai mesin Ritme yang sama — isi kolom Unit saat membuatnya.</p>'}

     ${s.projs.length ? `<div class="card-h"><div class="ic" style="background:var(--purple-t);color:var(--purple)">${ic('layers')}</div>
        <h3>Proyek di unit ini</h3><div class="r"><span class="cnt">${s.projs.length}</span></div></div>
       <div class="rows" style="margin-bottom:16px">${s.projs.map(x => `
         <div class="row-i" onclick="closeModal();projWork('${x.p.id}')">
           <span style="width:3px;align-self:stretch;border-radius:3px;background:${CV(x.overdue?'red':'purple')};flex:0 0 3px"></span>
           <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">${h(SCHEMA.PRO.t(x.p))}</span>
             <span class="s">${h(x.p.status)} · progres ${x.pct}%${x.late ? ' · ' + x.late + ' tugas terlambat' : ''}</span></span>
         </div>`).join('')}</div>` : ''}

     <div class="statebar" style="margin:0">
       <span class="dbadge" style="background:var(--blue)">KEUANGAN</span>
       <div style="flex:1;min-width:220px">Tidak ada angka keuangan yang dientri di sini. Revenue, laba, kas, dan piutang unit tetap bersumber dari
         laporan konsolidasi di Finance Drive — supaya tidak ada dua versi angka yang berbeda.</div>
     </div>`,
    `<button class="btn solid" onclick="closeModal();openForm('OPS')">${ic('plus')} Catat isu</button>
     <button class="btn ghost" onclick="openForm('BUS','${id}')">Ubah unit</button>
     <button class="btn ghost" style="margin-left:auto" onclick="closeModal()">Tutup</button>`, true);
}

function issueRow(o){
  const age = o.opened ? daysBetween(o.opened, todayISO()) : null;
  const late = o.due && o.due < todayISO() && OPS_OPEN.indexOf(o.status) >= 0;
  const own = o.owner ? recById(o.owner) : null;
  return `<div class="row-i" style="align-items:flex-start" onclick="recDetail('${o.id}')">
    <span class="pill ${SEV_COLOR[o.sev] || 'gray'}" style="margin-top:1px">${h(o.sev || '—')}</span>
    <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">${h(o.n)}</span>
      <span class="s">${[h(o.status||''), age !== null ? 'terbuka ' + age + ' hari' : '', own ? h(SCHEMA.PER.t(own)) : 'tanpa penanggung jawab',
        late ? '<b style="color:var(--red)">lewat target</b>' : '', o.root ? '' : 'akar belum diisi'].filter(Boolean).join(' · ')}</span></span>
    <span class="rt" style="display:flex;gap:5px">
      ${o.taskId ? '' : `<button class="btn ghost sm" onclick="event.stopPropagation();issueToTask('${o.id}')">Jadikan tugas</button>`}
      <button class="btn ghost sm" onclick="event.stopPropagation();issueDone('${o.id}')">Selesai</button>
    </span></div>`;
}

/* ---------------- TAB: unit ---------------- */
function bzUnits(){
  const all = recs('BUS');
  if(!all.length) return `<div class="card" style="text-align:center;padding:46px 26px">
    <div style="width:60px;height:60px;border-radius:18px;background:var(--gold-tint);color:var(--gold-dark);display:grid;place-items:center;margin:0 auto 16px">
      <span style="display:block;width:28px;height:28px">${ic('brief')}</span></div>
    <h2 style="font-family:var(--fd);font-size:24px;font-weight:600;margin:0 0 8px">Belum ada unit bisnis</h2>
    <p class="sub" style="max-width:480px;margin:0 auto 20px">Daftarkan unit dan outlet beserta penanggung jawabnya.
      Angka keuangannya tidak perlu — itu tetap bersumber dari Finance Drive. Yang dibangun di sini struktur, isu, dan checklist operasionalnya.</p>
    <div style="display:flex;gap:9px;justify-content:center;flex-wrap:wrap">
      <button class="btn solid" onclick="openForm('BUS')">${ic('plus')} Unit pertama</button>
      <button class="btn gold" onclick="openImport('BUS')">${ic('doc')} Impor dari Sheets</button></div></div>`;
  const stats = all.map(u => Object.assign({ u }, unitStat(u)));
  const noPic = stats.filter(x => !x.pic);
  return `
  <div class="g g4" style="margin-bottom:18px">
    ${[['Unit tercatat', all.length, 'gold','brief'],
       ['Isu terbuka', opsOpen().length, opsOpen().length?'orange':'green','cog'],
       ['Isu berat', stats.reduce((s,x) => s + x.crit.length, 0), stats.reduce((s,x)=>s+x.crit.length,0)?'red':'gray','flag'],
       ['Tanpa penanggung jawab', noPic.length, noPic.length?'orange':'green','users']].map(s=>`
      <div class="card"><div class="kpi">
        <div class="ic" style="width:38px;height:38px;border-radius:11px;display:grid;place-items:center;flex:0 0 38px;background:${CT(s[2])};color:${CV(s[2])}">${ic(s[3])}</div>
        <div style="min-width:0"><b>${s[1]}</b><span>${s[0]}</span></div></div></div>`).join('')}
  </div>

  <div class="card">
    ${cardH('brief','Unit & outlet','gold',`<button class="btn gold sm" onclick="openForm('BUS')">${ic('plus')} Unit</button>`)}
    <div class="g g2" style="margin:0">${stats.map(x => {
      const c = x.crit.length ? 'red' : x.open.length ? 'orange' : x.u.status === 'Beroperasi' ? 'green' : 'blue';
      return `<div class="card click" style="padding:15px" onclick="unitWork('${x.u.id}')">
        <div class="flexr" style="gap:10px;margin-bottom:9px">
          <div class="ic" style="width:34px;height:34px;border-radius:11px;display:grid;place-items:center;flex:0 0 34px;background:${CT(c)};color:${CV(c)}">${ic('brief')}</div>
          <span style="min-width:0;flex:1"><span class="tt">${h(SCHEMA.BUS.t(x.u))}</span>
            <span class="ts">${[h(x.u.type||''), h(x.u.city||'')].filter(Boolean).join(' · ') || '—'}</span></span>
          <span class="pill ${x.u.status === 'Beroperasi' ? 'green' : x.u.status === 'Ramp-up' ? 'blue' : x.u.status === 'Ditutup' ? 'gray' : 'orange'}">${h(x.u.status || '—')}</span>
        </div>
        <div class="flexr" style="gap:6px">
          ${x.open.length ? `<span class="pill ${x.crit.length ? 'red' : 'orange'}">${x.open.length} isu terbuka</span>` : '<span class="pill green">tanpa isu terbuka</span>'}
          ${x.oldest > 30 ? `<span class="pill red">tertua ${x.oldest} hari</span>` : ''}
          ${x.ritDue.length ? `<span class="pill orange">${x.ritDue.length} checklist jatuh tempo</span>` : x.rits.length ? `<span class="pill green">${x.rits.length} checklist terjaga</span>` : ''}
          ${x.projs.length ? `<span class="pill purple">${x.projs.length} proyek</span>` : ''}
        </div>
        <div class="card-f flexr" style="gap:8px">
          ${x.pic ? avat(SCHEMA.PER.t(x.pic), 'gold') : ''}
          <span class="mini" style="flex:1;min-width:0">${x.pic ? h(SCHEMA.PER.t(x.pic)) : '<b style="color:var(--orange)">Penanggung jawab belum ditetapkan</b>'}</span>
          ${x.u.staff ? `<span class="mini">${h(x.u.staff)} orang</span>` : ''}
        </div>
      </div>`; }).join('')}</div>
  </div>

  ${noPic.length ? `<div class="statebar" style="margin-top:18px">
    <span class="dbadge" style="background:var(--orange)">CATATAN</span>
    <div style="flex:1;min-width:220px"><b>${noPic.length} unit belum punya penanggung jawab.</b>
      Unit tanpa nama di belakangnya cenderung kembali ke meja Anda sendiri.</div>
  </div>` : ''}`;
}

/* ---------------- TAB: isu ---------------- */
let BF = { unit:'', sev:'', st:'open' };
function bzIssues(){
  const all = recs('OPS');
  if(!all.length) return `<div class="card" style="text-align:center;padding:44px 26px">
    <div style="width:58px;height:58px;border-radius:17px;background:var(--orange-t);color:var(--orange);display:grid;place-items:center;margin:0 auto 15px">
      <span style="display:block;width:27px;height:27px">${ic('cog')}</span></div>
    <h2 style="font-family:var(--fd);font-size:23px;font-weight:600;margin:0 0 8px">Belum ada isu tercatat</h2>
    <p class="sub" style="max-width:460px;margin:0 auto 18px">Isu operasional dicatat beserta dampak dan <b>akar masalahnya</b> —
      karena isu yang ditutup tanpa akar biasanya kembali dalam bentuk lain.</p>
    <button class="btn solid" onclick="openForm('OPS')">${ic('plus')} Isu pertama</button></div>`;
  let list = all;
  if(BF.st === 'open') list = list.filter(o => OPS_OPEN.indexOf(o.status) >= 0);
  else if(BF.st === 'done') list = list.filter(o => o.status === 'Selesai');
  if(BF.unit) list = list.filter(o => o.unit === BF.unit);
  if(BF.sev)  list = list.filter(o => o.sev === BF.sev);
  const open = opsOpen();
  const noRoot = open.filter(o => !o.root);
  const aged = open.filter(o => o.opened && daysBetween(o.opened, todayISO()) > 30);
  return `
  <div class="g g4" style="margin-bottom:18px">
    ${[['Isu terbuka', open.length, open.length?'orange':'green','cog'],
       ['Kritis & tinggi', open.filter(o => o.sev === 'Kritis' || o.sev === 'Tinggi').length, 'red','flag'],
       ['Terbuka > 30 hari', aged.length, aged.length?'red':'gray','clock'],
       ['Selesai 90 hari', all.filter(o => o.status === 'Selesai' && o.resolved && daysBetween(o.resolved, todayISO()) <= 90).length, 'green','check']].map(s=>`
      <div class="card"><div class="kpi">
        <div class="ic" style="width:38px;height:38px;border-radius:11px;display:grid;place-items:center;flex:0 0 38px;background:${CT(s[2])};color:${CV(s[2])}">${ic(s[3])}</div>
        <div style="min-width:0"><b>${s[1]}</b><span>${s[0]}</span></div></div></div>`).join('')}
  </div>

  <div class="card">
    ${cardH('cog','Isu operasional','orange',
      `<span class="mini">${list.length} ditampilkan</span>
       <button class="btn gold sm" style="margin-left:9px" onclick="openForm('OPS')">${ic('plus')} Isu</button>`)}
    <div class="chips" style="margin-bottom:10px">
      ${[['open','Terbuka'],['done','Selesai'],['all','Semua']].map(o =>
        `<button class="chip ${BF.st===o[0]?'on':''}" onclick="BF.st='${o[0]}';go('business')">${o[1]}</button>`).join('')}
    </div>
    <div class="flexr" style="gap:8px;margin-bottom:14px">
      <select onchange="BF.unit=this.value;go('business')" style="border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:10px;padding:6px 10px;font:inherit;font-size:12.5px">
        <option value="">Semua unit</option>${recs('BUS').map(u => `<option value="${u.id}"${BF.unit===u.id?' selected':''}>${h(SCHEMA.BUS.t(u))}</option>`).join('')}</select>
      <select onchange="BF.sev=this.value;go('business')" style="border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:10px;padding:6px 10px;font:inherit;font-size:12.5px">
        <option value="">Semua tingkat</option>${SEV.map(s => `<option value="${s}"${BF.sev===s?' selected':''}>${s}</option>`).join('')}</select>
      ${(BF.unit||BF.sev) ? `<button class="btn ghost sm" onclick="BF={unit:'',sev:'',st:BF.st};go('business')">Bersihkan</button>` : ''}
    </div>
    ${SEV.map(sv => { const g = list.filter(o => o.sev === sv); if(!g.length) return '';
      return `<div style="margin-bottom:15px">
        <div class="flexr" style="gap:8px;margin:0 0 5px">
          <b style="font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:${CV(SEV_COLOR[sv])}">${sv}</b>
          <span class="cnt">${g.length}</span></div>
        <div class="rows">${g.map(o => issueRow(o)).join('')}</div>
      </div>`; }).join('')}
    ${list.length ? '' : '<div class="empty">Tidak ada isu yang cocok dengan saringan ini.</div>'}
  </div>

  ${noRoot.length ? `<div class="statebar" style="margin-top:18px">
    <span class="dbadge" style="background:var(--orange)">CATATAN</span>
    <div style="flex:1;min-width:220px"><b>${noRoot.length} isu terbuka belum menuliskan akar masalahnya.</b>
      Menutup gejala tanpa akar biasanya berarti isu yang sama kembali dengan nama lain.</div>
  </div>` : ''}`;
}

/* ---------------- TAB: checklist ---------------- */
function bzChecklist(){
  const list = recs('RIT').filter(r => r.unit).map(r => Object.assign({ r }, ritStat(r), { u: recById(r.unit) }));
  if(!list.length) return `<div class="card" style="text-align:center;padding:44px 26px">
    <div style="width:58px;height:58px;border-radius:17px;background:var(--gold-tint);color:var(--gold-dark);display:grid;place-items:center;margin:0 auto 15px">
      <span style="display:block;width:27px;height:27px">${ic('check')}</span></div>
    <h2 style="font-family:var(--fd);font-size:23px;font-weight:600;margin:0 0 8px">Belum ada checklist operasional</h2>
    <p class="sub" style="max-width:490px;margin:0 auto 18px">Checklist unit memakai mesin <b>Ritme</b> yang sama dengan review pribadi Anda —
      satu mekanisme, bukan dua. Buat Ritme baru lalu isi kolom <b>Unit bisnis</b>.</p>
    <div style="display:flex;gap:9px;justify-content:center;flex-wrap:wrap">
      <button class="btn solid" onclick="openForm('RIT')">${ic('plus')} Checklist pertama</button>
      <button class="btn ghost" onclick="OS_TAB='rit';go('os')">Lihat ritme pribadi →</button></div></div>`;
  const due = list.filter(x => x.st === 'due' || x.st === 'broken' || x.st === 'never');
  return `
  <div class="g g4" style="margin-bottom:18px">
    ${[['Checklist unit', list.length, 'gold','check'],
       ['Jatuh tempo', due.filter(x => x.st === 'due').length, 'orange','clock'],
       ['Terputus', list.filter(x => x.st === 'broken').length, list.filter(x=>x.st==='broken').length?'red':'gray','flag'],
       ['Pelaksanaan tercatat', recs('RUN').filter(r => { const x = r.rit ? recById(r.rit) : null; return x && x.unit; }).length, 'green','layers']].map(s=>`
      <div class="card"><div class="kpi">
        <div class="ic" style="width:38px;height:38px;border-radius:11px;display:grid;place-items:center;flex:0 0 38px;background:${CT(s[2])};color:${CV(s[2])}">${ic(s[3])}</div>
        <div style="min-width:0"><b>${s[1]}</b><span>${s[0]}</span></div></div></div>`).join('')}
  </div>
  <div class="card">
    ${cardH('check','Checklist per unit','gold',`<button class="btn gold sm" onclick="openForm('RIT')">${ic('plus')} Checklist</button>`)}
    ${recs('BUS').filter(u => list.some(x => x.r.unit === u.id)).map(u => `
      <div style="margin-bottom:16px">
        <div class="flexr" style="gap:8px;margin:0 0 6px">
          <b style="font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--text-3)">${h(SCHEMA.BUS.t(u))}</b>
          <span class="cnt">${list.filter(x => x.r.unit === u.id).length}</span></div>
        ${list.filter(x => x.r.unit === u.id).map(x => `
          <div class="card" style="padding:13px;margin-bottom:9px">
            <div class="flexr" style="gap:10px">
              <span class="pill ${RIT_COLOR[x.st]}">${RIT_LABEL[x.st]}${(x.st==='due'||x.st==='broken') ? ' · lewat ' + x.over + ' hari' : ''}</span>
              <span style="min-width:0;flex:1"><span class="tt">${h(x.r.n)}</span>
                <span class="ts">${h(x.r.freq)} · ${ritItems(x.r).length} langkah${x.last ? ' · terakhir ' + dOnly(x.last) : ''}</span></span>
              ${x.st !== 'paused' ? `<button class="btn gold sm" onclick="runRitme('${x.r.id}')">Jalankan</button>` : ''}
              <button class="btn ghost sm" onclick="recDetail('${x.r.id}')">Detail</button>
            </div>
            ${x.keep !== null ? `<div class="flexr" style="gap:10px;margin-top:9px">
              <div style="flex:1"><div class="bar"><i style="width:${x.keep}%;background:${CV(x.keep >= 80 ? 'green' : x.keep >= 50 ? 'orange' : 'red')}"></i></div></div>
              <span class="mini">kedisiplinan 90 hari ${x.keep}%</span></div>` : ''}
          </div>`).join('')}
      </div>`).join('')}
  </div>`;
}

/* ---------------- TAB: peta ---------------- */
function bzMap(){
  const all = recs('BUS');
  if(!all.length) return `<div class="empty">Belum ada unit.</div>`;
  const byType = {}, byCity = {}, byStatus = {};
  all.forEach(u => {
    byType[u.type || 'Tanpa jenis'] = (byType[u.type || 'Tanpa jenis'] || 0) + 1;
    if(u.city) byCity[u.city] = (byCity[u.city] || 0) + 1;
    byStatus[u.status || 'Tanpa status'] = (byStatus[u.status || 'Tanpa status'] || 0) + 1;
  });
  const palette = ['gold','blue','green','purple','teal','pink','orange','red','gray'];
  const typeItems = Object.keys(byType).sort((a,b) => byType[b] - byType[a]).map((k,i) => ({ n:k, v:byType[k], c:palette[i % palette.length] }));
  const staff = all.reduce((s,u) => s + (Number(u.staff) || 0), 0);
  const picMap = {};
  all.forEach(u => { if(u.pic) picMap[u.pic] = (picMap[u.pic] || 0) + 1; });
  const mxS = Math.max.apply(null, Object.values(byStatus)) || 1;
  return `
  <div class="g g4" style="margin-bottom:18px">
    ${[['Unit', all.length, 'gold','brief'],
       ['Jenis usaha', Object.keys(byType).length, 'purple','layers'],
       ['Kota', Object.keys(byCity).length, 'blue','pin'],
       ['Total tim tercatat', staff || '—', 'teal','users']].map(s=>`
      <div class="card"><div class="kpi">
        <div class="ic" style="width:38px;height:38px;border-radius:11px;display:grid;place-items:center;flex:0 0 38px;background:${CT(s[2])};color:${CV(s[2])}">${ic(s[3])}</div>
        <div style="min-width:0"><b>${s[1]}</b><span>${s[0]}</span></div></div></div>`).join('')}
  </div>
  <div class="g g21 top" style="margin:0 0 18px">
    <div class="card">
      ${cardH('layers','Sebaran jenis usaha','purple')}
      <div class="flexr" style="gap:20px;align-items:center">
        ${donut(typeItems.map(x => ({ v:x.v, c:x.c })), 132)}
        <div style="flex:1;min-width:150px">${typeItems.map(x => `
          <div class="flexr" style="gap:8px;margin-bottom:6px;flex-wrap:nowrap">
            <span style="width:9px;height:9px;border-radius:3px;background:${CV(x.c)};flex:0 0 9px"></span>
            <span style="flex:1;min-width:0;font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${h(x.n)}</span>
            <b style="font-size:12.5px;font-variant-numeric:tabular-nums">${x.v}</b></div>`).join('')}</div>
      </div>
    </div>
    <div class="card">
      ${cardH('flag','Tahap unit','blue')}
      ${Object.keys(byStatus).map(k => barLine(k, byStatus[k], mxS,
        k === 'Beroperasi' ? 'green' : k === 'Ramp-up' ? 'blue' : k === 'Ditutup' ? 'gray' : 'orange')).join('')}
      <div class="card-f"><span class="mini">Unit dalam tahap Ramp-up wajar bermargin rendah — itu bagian dari tahapnya, bukan otomatis masalah.</span></div>
    </div>
  </div>
  <div class="g g2" style="margin:0">
    <div class="card">
      ${cardH('users','Beban kepemimpinan','teal',`<span class="mini">${Object.keys(picMap).length} penanggung jawab</span>`)}
      ${Object.keys(picMap).length ? `<div class="rows">${Object.keys(picMap).sort((a,b) => picMap[b] - picMap[a]).map(id => {
        const p = recById(id);
        return `<div class="row-i" onclick="recDetail('${id}')">
          ${avat(p ? SCHEMA.PER.t(p) : '—', 'gold')}
          <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">${p ? h(SCHEMA.PER.t(p)) : id}</span>
            <span class="s">${recs('BUS').filter(u => u.pic === id).map(u => h(SCHEMA.BUS.t(u))).join(' · ')}</span></span>
          <span class="rt"><span class="cnt">${picMap[id]}</span></span></div>`; }).join('')}</div>`
        : '<p class="sub" style="margin:0">Belum ada unit yang punya penanggung jawab.</p>'}
    </div>
    <div class="card">
      ${cardH('pin','Sebaran lokasi','blue')}
      ${Object.keys(byCity).length ? `<div class="rows">${Object.keys(byCity).sort((a,b) => byCity[b] - byCity[a]).map(c => `
        <div class="row-i" style="cursor:default">
          <span style="width:3px;align-self:stretch;border-radius:3px;background:var(--blue);flex:0 0 3px"></span>
          <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">${h(c)}</span></span>
          <span class="rt"><span class="cnt">${byCity[c]}</span></span></div>`).join('')}</div>`
        : '<p class="sub" style="margin:0">Belum ada unit dengan kolom lokasi terisi.</p>'}
    </div>
  </div>`;
}

/* ---------------- halaman Business Empire ---------------- */
let BZ_TAB = 'units';
const BZ_TABS = [['units','Unit & Outlet'],['iss','Isu Operasional'],['chk','Checklist'],['map','Peta Struktur']];
const BZ_VIEW = { units:bzUnits, iss:bzIssues, chk:bzChecklist, map:bzMap };
function bzTab(k){ BZ_TAB = k; go('business'); }

VIEWS.business = () => {
  const hasAny = recs('BUS').length || recs('OPS').length;
  const crit = opsOpen().filter(o => o.sev === 'Kritis').length;
  const chkDue = recs('RIT').filter(r => r.unit).map(r => ritStat(r)).filter(x => x.st === 'due' || x.st === 'broken').length;
  const head = `
  <div class="page-h">
    <div><h1>Business Empire</h1><p>Struktur unit, penanggung jawab, isu operasional, dan checklist yang benar-benar dijalankan.</p></div>
    <div class="sp">
      <button class="btn gold sm" onclick="openForm('OPS')">${ic('plus')} Isu</button>
      <button class="btn ghost sm" onclick="openForm('BUS')">${ic('brief')} Unit</button>
      <button class="btn ghost sm" onclick="go('finance')">Angka keuangan → Finance</button>
    </div>
  </div>
  ${dummyOn() ? '' : dummyStateBar()}
  ${(crit || chkDue) ? `<div class="statebar del" style="margin-bottom:18px">
    <span class="dbadge" style="background:var(--red)">MENAGIH</span>
    <div style="flex:1;min-width:220px">
      ${crit ? `<b>${crit} isu kritis</b> masih terbuka. ` : ''}
      ${chkDue ? `<b>${chkDue} checklist unit</b> lewat jadwalnya. ` : ''}</div>
    ${crit ? `<button class="btn ghost sm" onclick="BF={unit:'',sev:'Kritis',st:'open'};bzTab('iss')">Lihat isu</button>` : ''}
    ${chkDue ? `<button class="btn ghost sm" onclick="bzTab('chk')">Lihat checklist</button>` : ''}
  </div>` : ''}`;

  if(!hasAny) return head + bzUnits() + bzFinanceBlock();

  return head +
    `<div class="tabbar">${BZ_TABS.map(([k,n]) => {
      const b = k === 'iss' ? crit : k === 'chk' ? chkDue : 0;
      return `<button class="${BZ_TAB===k?'on':''}" onclick="bzTab('${k}')">${n}${b ? ` <span class="cnt" style="background:var(--red);color:#fff">${b}</span>` : ''}</button>`;
    }).join('')}</div>` +
    (BZ_VIEW[BZ_TAB] || bzUnits)() +
    bzFinanceBlock();
};

function bzFinanceBlock(){
  return `
  <div class="sect" style="margin-top:30px">
    <div><h2>Angka konsolidasi</h2><p>Bagian ini membaca laporan Finance Drive — bukan data yang dientri di modul ini.</p></div>
    <div class="sp">${srcPill(true)}</div>
  </div>
  ${BUS_BODY()}`;
}

