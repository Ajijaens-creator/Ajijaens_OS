/* ================================================================
   TASK & PROJECT ENGINE
   Papan tugas berfilter · papan proyek · milestone · beban tim.
   Progres proyek dihitung dari tugas yang selesai, bukan diketik manual.
   ================================================================ */

/* ---------------- entitas baru: Milestone ---------------- */
SCHEMA.MLS = {
  n:'Milestone', ic:'flag', c:'orange', mod:'projects', priv:'TEAM',
  d:'Titik capai di dalam proyek — dengan tanggal dan status.',
  t:r=>r.n, s:r=>{ const p = r.proj ? recById(r.proj) : null;
    return [p?SCHEMA.PRO.t(p):'tanpa proyek', r.date?dOnly(r.date):'', r.status].filter(Boolean).join(' · '); },
  f:[{k:'n',l:'Nama milestone',t:'text',req:1,full:1,ph:'Izin operasional terbit'},
     {k:'proj',l:'Proyek',t:'rel',rel:'PRO',req:1},
     {k:'date',l:'Tanggal target',t:'date',req:1},
     {k:'status',l:'Status',t:'sel',req:1,opt:['Belum tercapai','Tercapai','Terlewat','Dibatalkan']},
     {k:'owner',l:'Penanggung jawab',t:'rel',rel:'PER'},
     {k:'proof',l:'Bukti tercapai',t:'text',full:1,hint:'Apa yang membuktikan ini benar-benar selesai?'},
     {k:'note',l:'Catatan',t:'textarea',full:1}]
};
SCH_ORDER.splice(SCH_ORDER.indexOf('PRO') + 1, 0, 'MLS');
MODULE_ENTITIES.projects = ['PRO','TSK','MLS'];

/* ---------------- perhitungan ---------------- */
function projStats(p){
  const ts = recs('TSK').filter(t => t.proj === p.id);
  const done = ts.filter(t => t.status === 'Selesai').length;
  const late = ts.filter(t => t.status !== 'Selesai' && t.due && t.due < todayISO()).length;
  const ms = recs('MLS').filter(m => m.proj === p.id);
  return {
    n: ts.length, done, open: ts.length - done, late,
    pct: ts.length ? Math.round(done / ts.length * 100) : (Number(p.progress) || 0),
    auto: ts.length > 0,
    ms: ms.length, msDone: ms.filter(m => m.status === 'Tercapai').length,
    overdue: p.due && p.due < todayISO() && p.status !== 'Selesai' && p.status !== 'Dibatalkan'
  };
}
function ownerName(id){ const p = id ? recById(id) : null; return p ? SCHEMA.PER.t(p) : 'Belum ditugaskan'; }
function workload(){
  const open = openTsk();
  const map = {};
  open.forEach(t => { const k = t.owner || '_none'; (map[k] = map[k] || []).push(t); });
  recs('PER').forEach(p => { if(!map[p.id]) return; });
  return Object.keys(map).map(k => {
    const list = map[k];
    return {
      id: k, name: k === '_none' ? 'Belum ditugaskan' : ownerName(k),
      open: list.length,
      late: list.filter(t => t.due && t.due < todayISO()).length,
      p1: list.filter(t => t.pri && t.pri.indexOf('P1') === 0).length,
      done30: recs('TSK').filter(t => t.status === 'Selesai' && (t.owner || '_none') === k &&
                t.done && daysBetween(t.done, todayISO()) <= 30).length
    };
  }).sort((a,b) => b.open - a.open);
}

/* ---------------- state tampilan ---------------- */
let PJ_TAB = 'tasks';
let TF = { q:'', st:'open', owner:'', proj:'', pri:'', grp:'status' };

function pjTab(k){ PJ_TAB = k; go('projects'); }
function tfSet(k, v){ TF[k] = v; go('projects'); }

/* ---------------- daftar tugas berfilter ---------------- */
function tskFiltered(){
  const today = todayISO(), wk = shiftISO(today, 7);
  let list = recs('TSK');
  if(TF.st === 'open')      list = list.filter(t => DONE_ST.indexOf(t.status) < 0);
  else if(TF.st === 'late') list = list.filter(t => DONE_ST.indexOf(t.status) < 0 && t.due && t.due < today);
  else if(TF.st === 'today')list = list.filter(t => DONE_ST.indexOf(t.status) < 0 && t.due && t.due <= today);
  else if(TF.st === 'week') list = list.filter(t => DONE_ST.indexOf(t.status) < 0 && t.due && t.due <= wk);
  else if(TF.st === 'done') list = list.filter(t => t.status === 'Selesai');
  if(TF.owner) list = list.filter(t => (t.owner || '_none') === TF.owner);
  if(TF.proj)  list = list.filter(t => (t.proj  || '_none') === TF.proj);
  if(TF.pri)   list = list.filter(t => t.pri === TF.pri);
  if(TF.q){
    const q = TF.q.toLowerCase();
    list = list.filter(t => (t.n + ' ' + (t.note||'')).toLowerCase().includes(q));
  }
  return list;
}
function tskGroups(list){
  const today = todayISO();
  if(TF.grp === 'status') return ST_TASK.map(s => [s, list.filter(t => t.status === s)]);
  if(TF.grp === 'pri')    return ['P1 — hari ini','P2 — minggu ini','P3 — nanti'].map(p => [p, list.filter(t => t.pri === p)])
                                  .concat([['Tanpa prioritas', list.filter(t => !t.pri)]]);
  if(TF.grp === 'proj')   return recs('PRO').map(p => [SCHEMA.PRO.t(p), list.filter(t => t.proj === p.id)])
                                  .concat([['Tanpa proyek', list.filter(t => !t.proj)]]);
  if(TF.grp === 'owner'){
    /* setiap pemegang yang muncul di daftar ini — termasuk tugas yang sudah selesai */
    const keys = []; list.forEach(t => { const k = t.owner || '_none'; if(keys.indexOf(k) < 0) keys.push(k); });
    keys.sort((a,b) => a === '_none' ? 1 : b === '_none' ? -1 : 0);
    return keys.map(k => [k === '_none' ? 'Belum ditugaskan' : ownerName(k), list.filter(t => (t.owner || '_none') === k)]);
  }
  /* tenggat — tugas selesai tetap masuk kotak tanggalnya, tampil tercoret */
  return [
    ['Lewat tenggat',   list.filter(t => t.due && t.due <  today)],
    ['Hari ini',        list.filter(t => t.due === today)],
    ['7 hari ke depan', list.filter(t => t.due && t.due > today && t.due <= shiftISO(today,7))],
    ['Lebih jauh',      list.filter(t => t.due && t.due >  shiftISO(today,7))],
    ['Tanpa tenggat',   list.filter(t => !t.due)]
  ];
}
function taskListHTML(){
  const list = tskFiltered();
  if(!list.length) return `<div class="empty">Tidak ada tugas yang cocok dengan saringan ini.</div>`;
  const today = todayISO();
  return tskGroups(list).filter(g => g[1].length).map(g => `
    <div style="margin-bottom:15px">
      <div class="flexr" style="gap:8px;margin:0 0 5px">
        <b style="font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--text-3)">${h(g[0])}</b>
        <span class="cnt">${g[1].length}</span></div>
      ${g[1].map(t => taskLine(t, today)).join('')}
    </div>`).join('');
}
function renderTaskList(){
  const el = document.getElementById('tskList');
  if(el) el.innerHTML = taskListHTML();
  const c = document.getElementById('tskCount');
  if(c) c.textContent = tskFiltered().length;
}

/* ---------------- TAB 1: papan tugas ---------------- */
function pjTasks(){
  const all = recs('TSK'), today = todayISO();
  const open = all.filter(t => DONE_ST.indexOf(t.status) < 0);
  const late = open.filter(t => t.due && t.due < today);
  const noOwner = open.filter(t => !t.owner);
  const done30 = all.filter(t => t.status === 'Selesai' && t.done && daysBetween(t.done, todayISO()) <= 30);
  const sel = (k, opts, ph) => `<select onchange="tfSet('${k}',this.value)"
      style="border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:10px;padding:6px 10px;font:inherit;font-size:12.5px;max-width:190px">
      <option value="">${ph}</option>${opts.map(o=>`<option value="${o[0]}"${TF[k]===o[0]?' selected':''}>${h(o[1])}</option>`).join('')}</select>`;

  return `
  <div class="g g4" style="margin-bottom:18px">
    ${[['Tugas terbuka', open.length, 'blue','check'],
       ['Terlambat', late.length, late.length?'red':'gray','clock'],
       ['Belum ditugaskan', noOwner.length, noOwner.length?'orange':'gray','users'],
       ['Selesai 30 hari', done30.length, 'green','flag']].map(s=>`
      <div class="card"><div class="kpi">
        <div class="ic" style="width:38px;height:38px;border-radius:11px;display:grid;place-items:center;flex:0 0 38px;background:${CT(s[2])};color:${CV(s[2])}">${ic(s[3])}</div>
        <div style="min-width:0"><b>${s[1]}</b><span>${s[0]}</span></div></div></div>`).join('')}
  </div>

  <div class="card">
    ${cardH('layers','Papan tugas','blue',
      `<span class="mini">menampilkan <b id="tskCount">${tskFiltered().length}</b> tugas</span>
       <button class="btn gold sm" style="margin-left:9px" onclick="openForm('TSK')">${ic('plus')} Tugas</button>`)}

    <div class="chips" style="margin-bottom:10px">
      ${[['open','Terbuka'],['late','Terlambat'],['today','Jatuh tempo hari ini'],['week','7 hari'],['done','Selesai'],['all','Semua']]
        .map(o=>`<button class="chip ${TF.st===o[0]?'on':''}" onclick="tfSet('st','${o[0]}')">${o[1]}</button>`).join('')}
    </div>

    <div class="flexr" style="gap:8px;margin-bottom:14px">
      <input id="tskQ" type="text" value="${h(TF.q)}" placeholder="Cari judul atau catatan…" oninput="TF.q=this.value;renderTaskList()"
        style="flex:1;min-width:170px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:10px;padding:7px 11px;font:inherit;font-size:13px;outline:0">
      ${sel('owner', [['_none','Belum ditugaskan']].concat(recs('PER').map(p=>[p.id, SCHEMA.PER.t(p)])), 'Semua penanggung jawab')}
      ${sel('proj',  [['_none','Tanpa proyek']].concat(recs('PRO').map(p=>[p.id, SCHEMA.PRO.t(p)])), 'Semua proyek')}
      ${sel('pri',   [['P1 — hari ini','P1'],['P2 — minggu ini','P2'],['P3 — nanti','P3']], 'Semua prioritas')}
      ${sel('grp',   [['status','Status'],['pri','Prioritas'],['proj','Proyek'],['owner','Penanggung jawab'],['due','Tenggat']], 'Kelompokkan: Status')}
      ${(TF.q||TF.owner||TF.proj||TF.pri) ? `<button class="btn ghost sm" onclick="TF={q:'',st:TF.st,owner:'',proj:'',pri:'',grp:TF.grp};go('projects')">Bersihkan</button>` : ''}
    </div>

    <div id="tskList">${taskListHTML()}</div>
  </div>`;
}

/* ---------------- TAB 2: papan proyek ---------------- */
function projCard(p){
  const s = projStats(p);
  const c = s.overdue ? 'red' : s.late ? 'orange' : p.status === 'Selesai' ? 'green' : 'purple';
  return `<div class="kan-c" onclick="projWork('${p.id}')">
    <span class="kn">${h(SCHEMA.PRO.t(p))}</span>
    <span class="km">${p.owner ? h(ownerName(p.owner)) : 'tanpa pemilik'}${p.due ? ' · ' + relDay(p.due).toLowerCase() : ''}</span>
    <div class="flexr" style="gap:7px;margin-top:9px">
      <div class="bar" style="flex:1"><i style="width:${s.pct}%;background:${CV(c)}"></i></div>
      <b style="font-size:12px;font-variant-numeric:tabular-nums">${s.pct}%</b>
    </div>
    <div class="flexr" style="gap:6px;margin-top:9px">
      <span class="pill gray">${s.done}/${s.n} tugas</span>
      ${s.ms ? `<span class="pill blue">${s.msDone}/${s.ms} milestone</span>` : ''}
      ${s.late ? `<span class="pill red">${s.late} terlambat</span>` : ''}
      ${s.overdue ? `<span class="pill red">lewat target</span>` : ''}
    </div></div>`;
}
function pjProjects(){
  const all = recs('PRO');
  if(!all.length) return `<div class="card" style="text-align:center;padding:44px 26px">
    <div style="width:58px;height:58px;border-radius:17px;background:var(--purple-t);color:var(--purple);display:grid;place-items:center;margin:0 auto 15px">
      <span style="display:block;width:27px;height:27px">${ic('layers')}</span></div>
    <h2 style="font-family:var(--fd);font-size:23px;font-weight:600;margin:0 0 8px">Belum ada proyek</h2>
    <p class="sub" style="max-width:430px;margin:0 auto 18px">Proyek mengikat tugas dan milestone jadi satu, dan progresnya dihitung sendiri dari tugas yang selesai.</p>
    <div style="display:flex;gap:9px;justify-content:center;flex-wrap:wrap">
      <button class="btn solid" onclick="openForm('PRO')">${ic('plus')} Proyek pertama</button>
      <button class="btn gold" onclick="openImport('PRO')">${ic('doc')} Impor dari Sheets</button></div></div>`;
  const cols = ST_PROJ;
  const tot = all.reduce((s,p) => s + projStats(p).pct, 0);
  return `
  <div class="g g4" style="margin-bottom:18px">
    ${[['Proyek berjalan', all.filter(p=>p.status==='Berjalan').length, 'purple','layers'],
       ['Tertahan', all.filter(p=>p.status==='Tertahan').length, 'orange','flag'],
       ['Lewat target', all.filter(p=>projStats(p).overdue).length, 'red','clock'],
       ['Rata-rata progres', (all.length?Math.round(tot/all.length):0) + '%', 'green','chart']].map(s=>`
      <div class="card"><div class="kpi">
        <div class="ic" style="width:38px;height:38px;border-radius:11px;display:grid;place-items:center;flex:0 0 38px;background:${CT(s[2])};color:${CV(s[2])}">${ic(s[3])}</div>
        <div style="min-width:0"><b>${s[1]}</b><span>${s[0]}</span></div></div></div>`).join('')}
  </div>
  <div class="card">
    ${cardH('layers','Papan proyek','purple',`<button class="btn gold sm" onclick="openForm('PRO')">${ic('plus')} Proyek</button>`)}
    ${boardHTML('proj')}
  </div>`;
}

/* ---------------- ruang kerja satu proyek ---------------- */
function projWork(id){
  const p = recById(id); if(!p) return;
  const s = projStats(p);
  const ts = recs('TSK').filter(t => t.proj === id);
  const ms = recs('MLS').filter(m => m.proj === id).sort((a,b) => (a.date||'9') < (b.date||'9') ? -1 : 1);
  const today = todayISO();
  modal(SCHEMA.PRO.t(p), `${p.status} · ${s.done}/${s.n} tugas selesai${p.due ? ' · target ' + dOnly(p.due) : ''}`,
    `<div class="flexr" style="gap:7px;margin-bottom:16px">
       ${idPill(p.id)}
       <span class="pill ${p.status==='Selesai'?'green':p.status==='Tertahan'?'orange':'purple'}">${h(p.status)}</span>
       ${s.overdue ? '<span class="pill red">lewat target</span>' : ''}
       ${p.owner ? `<span class="pill gray">${h(ownerName(p.owner))}</span>` : ''}
     </div>

     <div class="flexr" style="gap:12px;margin-bottom:6px">
       <div style="flex:1"><div class="flexr" style="justify-content:space-between;margin-bottom:5px">
         <span class="mini">Progres ${s.auto ? '— dihitung dari tugas selesai' : '— diisi manual, belum ada tugas'}</span>
         <b>${s.pct}%</b></div>
         <div class="bar" style="height:9px"><i style="width:${s.pct}%;background:var(--purple)"></i></div></div>
     </div>
     ${p.goal ? `<p class="sub" style="margin:14px 0 0">${h(p.goal).replace(/\n/g,'<br>')}</p>` : ''}
     ${p.risk ? `<div class="statebar del" style="margin:14px 0 0"><span class="dbadge" style="background:var(--red)">RISIKO</span>
        <div style="flex:1;min-width:200px">${h(p.risk)}</div></div>` : ''}

     <div class="sep" style="margin:18px 0"></div>
     <div class="card-h"><div class="ic" style="background:var(--orange-t);color:var(--orange)">${ic('flag')}</div>
       <h3>Milestone</h3><div class="r"><button class="btn ghost sm" onclick="closeModal();openForm('MLS')">${ic('plus')} Milestone</button></div></div>
     ${ms.length ? `<div class="tl">${ms.map(m=>{
        const late = m.status === 'Belum tercapai' && m.date && m.date < today;
        const c = m.status === 'Tercapai' ? 'green' : late ? 'red' : m.status === 'Dibatalkan' ? 'gray' : 'orange';
        return `<div class="tl-i" onclick="closeModal();recDetail('${m.id}')">
          <span class="tm">${m.date ? dOnly(m.date).slice(0,6) : '—'}</span>
          <span class="bar" style="background:${CV(c)}"></span>
          <span class="bd"><b>${h(m.n)}</b><span>${h(m.status)}${late ? ' · terlambat ' + daysBetween(m.date, today) + ' hari' : ''}</span></span>
        </div>`; }).join('')}</div>`
      : '<p class="sub" style="margin:0">Belum ada milestone. Tanpa titik capai, proyek panjang sulit dinilai sedang di mana.</p>'}

     <div class="sep" style="margin:18px 0"></div>
     <div class="card-h"><div class="ic" style="background:var(--blue-t);color:var(--blue)">${ic('check')}</div>
       <h3>Tugas</h3><div class="r"><span class="cnt">${ts.length}</span>
       <button class="btn ghost sm" style="margin-left:8px" onclick="closeModal();TF={q:'',st:'all',owner:'',proj:'${id}',pri:'',grp:'status'};PJ_TAB='tasks';go('projects')">Buka di papan</button></div></div>
     ${ts.length ? ts.slice(0,12).map(t => taskLine(t, today)).join('')
       : '<p class="sub" style="margin:0">Belum ada tugas di proyek ini — selama itu progres harus diisi manual.</p>'}
     ${ts.length > 12 ? `<div class="mini" style="margin-top:8px">Menampilkan 12 dari ${ts.length}.</div>` : ''}`,
    `<button class="btn solid" onclick="closeModal();openForm('TSK')">${ic('plus')} Tugas baru</button>
     <button class="btn ghost" onclick="openForm('PRO','${id}')">Ubah proyek</button>
     <button class="btn ghost" onclick="closeModal()">Tutup</button>`, true);
}

/* ---------------- TAB 3: milestone ---------------- */
function pjMilestones(){
  const all = recs('MLS').sort((a,b) => (a.date||'9') < (b.date||'9') ? -1 : 1);
  const today = todayISO();
  if(!all.length) return `<div class="card" style="text-align:center;padding:42px 26px">
    <div style="width:56px;height:56px;border-radius:17px;background:var(--orange-t);color:var(--orange);display:grid;place-items:center;margin:0 auto 15px">
      <span style="display:block;width:26px;height:26px">${ic('flag')}</span></div>
    <h2 style="font-family:var(--fd);font-size:23px;font-weight:600;margin:0 0 8px">Belum ada milestone</h2>
    <p class="sub" style="max-width:430px;margin:0 auto 18px">Milestone adalah titik capai yang bisa dibuktikan — bukan persentase perasaan.</p>
    <button class="btn solid" onclick="openForm('MLS')">${ic('plus')} Milestone pertama</button></div>`;
  const late = all.filter(m => m.status === 'Belum tercapai' && m.date && m.date < today);
  const soon = all.filter(m => m.status === 'Belum tercapai' && m.date && m.date >= today && m.date <= shiftISO(today,30));
  const grp = [['Terlambat', late, 'red'], ['30 hari ke depan', soon, 'orange'],
               ['Tercapai', all.filter(m => m.status === 'Tercapai'), 'green'],
               ['Lainnya', all.filter(m => late.indexOf(m)<0 && soon.indexOf(m)<0 && m.status !== 'Tercapai'), 'gray']];
  return `
  <div class="card">
    ${cardH('flag','Milestone','orange',`<button class="btn gold sm" onclick="openForm('MLS')">${ic('plus')} Milestone</button>`)}
    ${grp.filter(g => g[1].length).map(g => `
      <div style="margin-bottom:16px">
        <div class="flexr" style="gap:8px;margin:0 0 6px">
          <b style="font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:${CV(g[2])}">${g[0]}</b>
          <span class="cnt">${g[1].length}</span></div>
        <div class="rows">${g[1].map(m => { const p = m.proj ? recById(m.proj) : null;
          return `<div class="row-i" style="align-items:flex-start" onclick="recDetail('${m.id}')">
            <span style="width:8px;height:8px;border-radius:50%;background:${CV(g[2])};margin-top:6px;flex:0 0 8px"></span>
            <span style="min-width:0"><span class="t" style="font-size:13px">${h(m.n)}</span>
              <span class="s">${p ? h(SCHEMA.PRO.t(p)) : 'tanpa proyek'} · ${m.date ? dOnly(m.date) : '—'}${m.owner ? ' · ' + h(ownerName(m.owner)) : ''}</span></span>
            <span class="rt"><span class="pill ${g[2]}">${m.date ? relDay(m.date) : '—'}</span></span></div>`; }).join('')}</div>
      </div>`).join('')}
  </div>`;
}

/* ---------------- TAB 4: beban tim ---------------- */
function pjWorkload(){
  const w = workload();
  if(!w.length) return `<div class="card" style="text-align:center;padding:42px 26px">
    <div style="width:56px;height:56px;border-radius:17px;background:var(--teal-t);color:var(--teal);display:grid;place-items:center;margin:0 auto 15px">
      <span style="display:block;width:26px;height:26px">${ic('users')}</span></div>
    <h2 style="font-family:var(--fd);font-size:23px;font-weight:600;margin:0 0 8px">Belum ada tugas terbuka</h2>
    <p class="sub" style="max-width:430px;margin:0 auto">Beban tim muncul begitu ada tugas dengan penanggung jawab.</p></div>`;
  const mx = Math.max(...w.map(x => x.open)) || 1;
  return `
  <div class="card" style="margin-bottom:18px">
    ${cardH('users','Beban kerja terbuka','teal',`<span class="mini">${w.reduce((s,x)=>s+x.open,0)} tugas terbuka pada ${w.length} pemegang</span>`)}
    ${w.map(x => `
      <div class="wl" style="cursor:pointer" onclick="TF={q:'',st:'open',owner:'${x.id}',proj:'',pri:'',grp:'status'};PJ_TAB='tasks';go('projects')">
        <span class="wn" title="${h(x.name)}">${h(x.name)}</span>
        <span class="wb">
          <i style="width:${x.late/mx*100}%;background:var(--red)" title="terlambat"></i>
          <i style="width:${(x.p1-Math.min(x.p1,x.late))/mx*100}%;background:var(--orange)" title="P1"></i>
          <i style="width:${Math.max(0,(x.open-x.late-Math.max(0,x.p1-Math.min(x.p1,x.late))))/mx*100}%;background:var(--blue)" title="lainnya"></i>
        </span>
        <span class="wv">${x.open} terbuka${x.late ? ' · ' + x.late + ' telat' : ''}</span>
      </div>`).join('')}
    <div class="card-f flexr" style="gap:14px">
      <span class="mini"><i style="display:inline-block;width:9px;height:9px;border-radius:3px;background:var(--red);margin-right:5px"></i>terlambat</span>
      <span class="mini"><i style="display:inline-block;width:9px;height:9px;border-radius:3px;background:var(--orange);margin-right:5px"></i>P1</span>
      <span class="mini"><i style="display:inline-block;width:9px;height:9px;border-radius:3px;background:var(--blue);margin-right:5px"></i>lainnya</span>
      <span class="mini" style="margin-left:auto">Klik satu baris untuk melihat tugasnya di papan.</span>
    </div>
  </div>

  <div class="card">
    ${cardH('chart','Ditutup dalam 30 hari','green')}
    <div style="overflow-x:auto"><table class="tbl"><thead><tr>
      <th>Pemegang</th><th style="text-align:right">Terbuka</th><th style="text-align:right">Terlambat</th>
      <th style="text-align:right">P1</th><th style="text-align:right">Selesai 30 hari</th></tr></thead>
      <tbody>${w.map(x => `<tr>
        <td><b>${h(x.name)}</b></td>
        <td style="text-align:right;font-variant-numeric:tabular-nums">${x.open}</td>
        <td style="text-align:right;font-variant-numeric:tabular-nums;${x.late?'color:var(--red);font-weight:700':''}">${x.late}</td>
        <td style="text-align:right;font-variant-numeric:tabular-nums">${x.p1}</td>
        <td style="text-align:right;font-variant-numeric:tabular-nums">${x.done30}</td>
      </tr>`).join('')}</tbody></table></div>
    <div class="card-f"><span class="mini">Angka "selesai 30 hari" hanya menghitung tugas yang dicentang di dalam sistem — bukan seluruh pekerjaan orang tersebut.</span></div>
  </div>`;
}

/* ---------------- halaman Projects ---------------- */
const PJ_TABS = [['tasks','Papan Tugas'],['board','Proyek'],['ms','Milestone'],['load','Beban Tim']];
const PJ_VIEW = { tasks: pjTasks, board: pjProjects, ms: pjMilestones, load: pjWorkload };

VIEWS.projects = () => {
  const hasAny = recs('TSK').length || recs('PRO').length || recs('MLS').length;
  const head = `
  <div class="page-h">
    <div><h1>Projects</h1><p>Seluruh pekerjaan yang berjalan — tugas, proyek, titik capai, dan siapa memikul apa.</p></div>
    <div class="sp">
      <button class="btn gold sm" onclick="openForm('TSK')">${ic('plus')} Tugas</button>
      <button class="btn ghost sm" onclick="openForm('PRO')">${ic('layers')} Proyek</button>
      <button class="btn ghost sm" onclick="openImport('TSK')">${ic('doc')} Impor</button>
    </div>
  </div>
  ${dummyOn() ? '' : dummyStateBar()}`;

  if(!hasAny) return head + `
    <div class="card" style="text-align:center;padding:48px 26px;margin-bottom:18px">
      <div style="width:62px;height:62px;border-radius:19px;background:var(--purple-t);color:var(--purple);display:grid;place-items:center;margin:0 auto 16px">
        <span style="display:block;width:29px;height:29px">${ic('layers')}</span></div>
      <h2 style="font-family:var(--fd);font-size:24px;font-weight:600;margin:0 0 8px">Papan kerja masih kosong</h2>
      <p class="sub" style="max-width:470px;margin:0 auto 20px">Mulai dari satu tugas. Proyek dan milestone menyusul saat pekerjaan mulai bercabang —
        progres proyek nanti dihitung sendiri dari tugas yang Anda centang.</p>
      <div style="display:flex;gap:9px;justify-content:center;flex-wrap:wrap">
        <button class="btn solid" onclick="openForm('TSK')">${ic('plus')} Tugas pertama</button>
        <button class="btn gold" onclick="openForm('PRO')">${ic('layers')} Proyek pertama</button>
        <button class="btn ghost" onclick="openImport('TSK')">${ic('doc')} Impor dari Sheets</button>
      </div></div>` + (dummyOn() ? pjDemoBlock() : '');

  return head +
    `<div class="tabbar">${PJ_TABS.map(([k,n])=>`<button class="${PJ_TAB===k?'on':''}" onclick="pjTab('${k}')">${n}</button>`).join('')}</div>` +
    (PJ_VIEW[PJ_TAB] || pjTasks)() +
    (dummyOn() ? pjDemoBlock() : '');
};

function pjDemoBlock(){
  return `
  <div class="sect" style="margin-top:30px">
    <div><h2>Tampilan contoh</h2><p>Portofolio proyek contoh — untuk melihat wujudnya saat sudah penuh terisi.</p></div>
    <div class="sp"><span class="pill dummy">⚠ DUMMY DATA</span>
      <button class="btn ghost sm" onclick="setDummyMode('hidden')">Sembunyikan</button></div>
  </div>
  ${PROJ_BODY()}`;
}

