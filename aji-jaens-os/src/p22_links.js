/* ================================================================
   PHASE 2.1 — SISTEM TERHUBUNG
   Tautan balik universal · linimasa per record · pemeriksa keutuhan tautan.
   Peta relasinya dibaca langsung dari skema: tiap kolom bertipe rel adalah
   satu sisi hubungan, dan sisi sebaliknya dihitung di sini.
   ================================================================ */

/* ---------------- peta relasi dari skema ---------------- */
const relFields = type => (SCHEMA[type] && SCHEMA[type].f ? SCHEMA[type].f.filter(f => !f.g && f.t === 'rel') : []);

/* Semua record yang menunjuk ke id ini, dikelompokkan per entitas + kolom */
function backlinks(id){
  const groups = [];
  SCH_ORDER.forEach(t => {
    relFields(t).forEach(f => {
      const hits = recs(t).filter(r => r[f.k] === id);
      if(hits.length) groups.push({ type:t, label: SCHEMA[t].n + ' — ' + f.l, field:f.k, items:hits });
    });
  });
  /* tautan yang lahir dari tindakan, bukan dari kolom rel */
  const born = [];
  SCH_ORDER.forEach(t => recs(t).forEach(r => { if(r._m && r._m.source_id === id) born.push(r); }));
  if(born.length) groups.push({ type:null, label:'Dibuat dari record ini', field:'_source', items:born });
  return groups;
}
/* Sisi sebaliknya: record yang ditunjuk OLEH record ini */
function forwardLinks(r){
  if(!r) return [];
  const out = [];
  relFields(typeOf(r)).forEach(f => {
    if(!r[f.k]) return;
    const tgt = recById(r[f.k]);
    out.push({ label:f.l, id:r[f.k], rec:tgt, missing: !tgt, archived: tgt && tgt._m.is_archived });
  });
  if(r._m && r._m.source_id){
    const src = recById(r._m.source_id);
    out.push({ label:'Berasal dari', id:r._m.source_id, rec:src, missing: !src, archived: src && src._m.is_archived });
  }
  return out;
}
const backlinkCount = id => backlinks(id).reduce((s,g) => s + g.items.length, 0);

/* ---------------- blok tautan ---------------- */
function backlinkBlock(id){
  const r = recById(id); if(!r) return '';
  const back = backlinks(id), fwd = forwardLinks(r);
  const n = back.reduce((s,g) => s + g.items.length, 0);
  return `
  <div id="relBlocks">
    <div class="sep" style="margin:18px 0"></div>
    <div class="card-h"><div class="ic" style="background:var(--teal-t);color:var(--teal)">${ic('net')}</div>
      <h3>Tertaut</h3><div class="r"><span class="pill teal">${n} menunjuk ke sini</span>
      ${fwd.length ? `<span class="pill gray" style="margin-left:6px">${fwd.length} ditunjuk dari sini</span>` : ''}</div></div>

    ${fwd.length ? `<div class="mini" style="font-weight:700;margin:4px 0 6px">DITUNJUK DARI RECORD INI</div>
      <div class="rows" style="margin-bottom:14px">${fwd.map(x => `
        <div class="row-i" style="align-items:flex-start" ${x.rec ? `onclick="closeModal();recDetail('${x.id}')"` : 'style="cursor:default"'}>
          <span class="pill ${x.missing ? 'red' : x.archived ? 'orange' : 'gray'}" style="margin-top:1px">${h(x.label)}</span>
          <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">${x.rec ? h(SCHEMA[typeOf(x.rec)].t(x.rec)) : 'Record tidak ditemukan'}</span>
            <span class="s">${h(x.id)}${x.missing ? ' · <b style="color:var(--red)">tautan putus</b>' : x.archived ? ' · <b style="color:var(--orange)">sudah diarsipkan</b>' : ''}</span></span>
        </div>`).join('')}</div>` : ''}

    ${n ? back.map(g => `
      <div class="mini" style="font-weight:700;margin:4px 0 6px">${h(g.label).toUpperCase()} · ${g.items.length}</div>
      <div class="rows" style="margin-bottom:12px">${g.items.slice(0,8).map(x => `
        <div class="row-i" style="align-items:flex-start" onclick="closeModal();recDetail('${x.id}')">
          <div class="ic" style="width:26px;height:26px;border-radius:8px;display:grid;place-items:center;flex:0 0 26px;background:${CT(SCHEMA[typeOf(x)].c)};color:${CV(SCHEMA[typeOf(x)].c)}">${ic(SCHEMA[typeOf(x)].ic)}</div>
          <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">${h(SCHEMA[typeOf(x)].t(x))}</span>
            <span class="s">${h(SCHEMA[typeOf(x)].s(x) || '')}</span></span>
          <span class="rt">${idPill(x.id)}</span>
        </div>`).join('')}
        ${g.items.length > 8 ? `<div class="mini" style="padding:6px 8px">…dan ${g.items.length - 8} lagi</div>` : ''}</div>`).join('')
      : `<p class="sub" style="margin:0">Belum ada record lain yang menunjuk ke sini. Begitu ada tugas, isu, proyek, atau interaksi yang menautkannya, semuanya muncul di bagian ini.</p>`}
  </div>`;
}

/* ---------------- linimasa per record ---------------- */
const ACT_LABEL = { CREATE:'Dibuat', UPDATE:'Diubah', ARCHIVE:'Diarsipkan', RESTORE:'Dipulihkan',
  DONE:'Ditandai selesai', REOPEN:'Dibuka lagi', RESCHEDULE:'Dijadwalkan ulang', REVIEW:'Ditinjau',
  RESOLVE:'Ditutup', RUN:'Dijalankan', IMPORT:'Diimpor', 'IMPORT-UPDATE':'Diperbarui lewat impor', MOVE:'Dipindahkan' };
const ACT_COLOR = { CREATE:'green', UPDATE:'blue', ARCHIVE:'orange', RESTORE:'green', DONE:'green',
  REOPEN:'orange', RESCHEDULE:'blue', REVIEW:'purple', RESOLVE:'green', RUN:'green', IMPORT:'teal',
  'IMPORT-UPDATE':'teal', MOVE:'purple' };
const shortVal = v => { const s = String(v === undefined || v === null || v === '' ? '—' : v);
  return s.length > 44 ? s.slice(0,44) + '…' : s; };

function recTimelineBlock(id){
  const ev = (STORE.log || []).filter(l => l.id === id);
  return `
  <div class="sep" style="margin:18px 0"></div>
  <div class="card-h"><div class="ic" style="background:var(--blue-t);color:var(--blue)">${ic('clock')}</div>
    <h3>Linimasa record ini</h3><div class="r"><span class="cnt">${ev.length}</span></div></div>
  ${ev.length ? `<div class="tl">${ev.slice(0,20).map(e => `
      <div class="tl-i" style="cursor:default">
        <span class="tm">${dtID(e.ts).slice(0,6)}</span>
        <span class="bar" style="background:${CV(ACT_COLOR[e.act] || 'gray')}"></span>
        <span class="bd"><b>${h(ACT_LABEL[e.act] || e.act)}</b>
          <span>${dtID(e.ts)}${e.note ? ' · ' + h(e.note) : ''}</span>
          ${e.ch && e.ch.length ? `<span style="display:block;margin-top:5px">${e.ch.map(c => `
            <span style="display:block;font-size:12px;margin-bottom:2px">
              <b style="color:var(--text-2)">${h(c.l)}:</b>
              <span style="color:var(--text-3)">${h(shortVal(c.from))}</span>
              <span style="color:var(--text-3)"> → </span>
              <span style="color:var(--text)">${h(shortVal(c.to))}</span></span>`).join('')}</span>` : ''}
        </span></div>`).join('')}</div>
      ${ev.length > 20 ? `<div class="mini" style="margin-top:8px">Menampilkan 20 dari ${ev.length} peristiwa.</div>` : ''}`
    : `<p class="sub" style="margin:0">Belum ada peristiwa tercatat untuk record ini. Riwayat mulai terbentuk sejak perubahan berikutnya —
        record yang dibuat sebelum linimasa ini dipasang tidak punya catatan mundur, dan saya tidak mengarangnya.</p>`}`;
}

/* ---------------- pasang ke seluruh jendela detail ---------------- */
function appendRelBlocks(id){
  if(document.getElementById('relBlocks')) return;
  const b = document.querySelector('#modalSheet .sheet-b');
  if(b && recById(id)) b.insertAdjacentHTML('beforeend', backlinkBlock(id) + recTimelineBlock(id));
}
['recDetail','crmPerson','projWork','unitWork'].forEach(fn => {
  if(typeof window[fn] !== 'function') return;
  const base = window[fn];
  window[fn] = function(id){ base(id); appendRelBlocks(id); };
});

/* ---------------- pemeriksa keutuhan tautan ---------------- */
function linkIssues(){
  const out = [];
  SCH_ORDER.forEach(t => {
    allRecs(t).forEach(r => {
      relFields(t).forEach(f => {
        const v = r[f.k]; if(!v) return;
        const tgt = recById(v);
        if(!tgt) out.push({ r, t, f, v, why:'Record tujuan tidak ditemukan', sev:'red' });
        else if(typeOf(tgt) !== String(f.rel)) out.push({ r, t, f, v, why:'Tipe tidak cocok — seharusnya ' + SCHEMA[f.rel].n, sev:'red' });
        else if(tgt._m.is_archived) out.push({ r, t, f, v, why:'Record tujuan sudah diarsipkan', sev:'orange' });
      });
      if(r._m && r._m.source_id && !recById(r._m.source_id))
        out.push({ r, t, f:{ k:'_source', l:'Berasal dari' }, v:r._m.source_id, why:'Record asal tidak ditemukan', sev:'orange' });
    });
  });
  return out;
}
function clearLink(recId, key){
  const r = recById(recId); if(!r) return;
  const from = key === '_source' ? r._m.source_id : r[key];
  if(key === '_source') r._m.source_id = ''; else r[key] = '';
  r._m.updated_at = new Date().toISOString();
  const f = relFields(typeOf(r)).find(x => x.k === key);
  logAct('UPDATE', r, 'tautan putus dikosongkan', [{ k:key, l:(f ? f.l : 'Berasal dari'), from:from, to:'' }]);
  saveStore(); closeModal(); toast('Tautan dikosongkan — record-nya sendiri tidak disentuh'); go(CUR);
}

if(typeof F_TABS !== 'undefined'){
  const at = F_TABS.findIndex(x => x[0] === 'lock');
  F_TABS.splice(at < 0 ? F_TABS.length : at, 0, ['links','Keutuhan Tautan']);
}

F_VIEW.links = () => {
  const iss = linkIssues();
  /* peta hubungan antar entitas, dibaca dari skema */
  const edges = [];
  SCH_ORDER.forEach(t => relFields(t).forEach(f => {
    const n = recs(t).filter(r => r[f.k]).length;
    edges.push({ from:t, to:f.rel, label:f.l, n });
  }));
  const linked = edges.filter(e => e.n).length;
  const total = SCH_ORDER.reduce((s,t) => s + recs(t).length, 0);
  const withLinks = SCH_ORDER.reduce((s,t) => s + recs(t).filter(r =>
    relFields(t).some(f => r[f.k]) || backlinkCount(r.id) > 0).length, 0);
  const orphans = [];
  SCH_ORDER.forEach(t => recs(t).forEach(r => {
    if(!relFields(t).some(f => r[f.k]) && backlinkCount(r.id) === 0) orphans.push(r);
  }));

  return `
  <div class="g g4" style="margin-bottom:18px">
    ${[['Tautan putus', iss.filter(x => x.sev === 'red').length, iss.filter(x=>x.sev==='red').length?'red':'green','shield'],
       ['Menunjuk record arsip', iss.filter(x => x.sev === 'orange').length, iss.filter(x=>x.sev==='orange').length?'orange':'green','flag'],
       ['Record bertaut', withLinks + ' / ' + total, 'teal','net'],
       ['Jalur relasi aktif', linked + ' / ' + edges.length, 'purple','layers']].map(s => `
      <div class="card"><div class="kpi">
        <div class="ic" style="width:38px;height:38px;border-radius:11px;display:grid;place-items:center;flex:0 0 38px;background:${CT(s[2])};color:${CV(s[2])}">${ic(s[3])}</div>
        <div style="min-width:0"><b>${s[1]}</b><span>${s[0]}</span></div></div></div>`).join('')}
  </div>

  ${iss.length ? `<div class="card" style="margin-bottom:18px;border-color:var(--red)">
    ${cardH('shield','Sambungan yang bermasalah','red',`<span class="cnt" style="background:var(--red);color:#fff">${iss.length}</span>`)}
    <p class="sub" style="margin-bottom:12px">Mengosongkan tautan tidak menghapus record mana pun — hanya melepas sambungan yang sudah tidak menunjuk ke mana-mana.</p>
    <div class="rows">${iss.slice(0,25).map(x => `
      <div class="row-i" style="align-items:flex-start">
        <span class="pill ${x.sev}" style="margin-top:1px">${x.sev === 'red' ? 'PUTUS' : 'ARSIP'}</span>
        <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">${h(SCHEMA[x.t].t(x.r))}</span>
          <span class="s">${h(SCHEMA[x.t].n)} · ${x.r.id} · kolom <b>${h(x.f.l)}</b> menunjuk <code>${h(x.v)}</code> — ${h(x.why)}</span></span>
        <span class="rt" style="display:flex;gap:5px">
          <button class="btn ghost sm" onclick="recDetail('${x.r.id}')">Buka</button>
          <button class="btn ghost sm" onclick="clearLink('${x.r.id}','${x.f.k}')">Kosongkan</button>
        </span></div>`).join('')}</div>
    ${iss.length > 25 ? `<div class="card-f"><span class="mini">Menampilkan 25 dari ${iss.length}.</span></div>` : ''}
  </div>` : `<div class="statebar" style="margin-bottom:18px">
    <span class="dbadge" style="background:var(--green)">UTUH</span>
    <div style="flex:1;min-width:220px">Tidak ada tautan yang putus, salah tipe, atau menunjuk record yang sudah diarsipkan.
      Diperiksa pada ${total} record di ${SCH_ORDER.length} entitas.</div>
  </div>`}

  <div class="g g21 top" style="margin:0 0 18px">
    <div class="card">
      ${cardH('layers','Peta hubungan antar entitas','purple',`<span class="mini">dibaca dari skema, bukan ditulis manual</span>`)}
      <div style="overflow-x:auto"><table class="tbl"><thead><tr>
        <th>Dari</th><th>Kolom</th><th>Menunjuk ke</th><th style="text-align:right">Terpakai</th></tr></thead>
        <tbody>${edges.sort((a,b) => b.n - a.n).map(e => `<tr>
          <td><b>${h(SCHEMA[e.from].n)}</b></td>
          <td class="mini">${h(e.label)}</td>
          <td>${h(SCHEMA[e.to] ? SCHEMA[e.to].n : e.to)}</td>
          <td style="text-align:right;font-variant-numeric:tabular-nums;${e.n ? '' : 'color:var(--text-3)'}">${e.n}</td>
        </tr>`).join('')}</tbody></table></div>
      <div class="card-f"><span class="mini">Jalur dengan angka nol berarti hubungannya tersedia tetapi belum pernah dipakai — bukan kesalahan.</span></div>
    </div>
    <div class="card">
      ${cardH('net','Record yang berdiri sendiri','teal',`<span class="cnt">${orphans.length}</span>`)}
      <p class="sub" style="margin-bottom:12px">Tidak menunjuk ke mana pun dan tidak ditunjuk siapa pun. Wajar untuk catatan lepas dan check-in harian —
        tetapi tugas atau isu yang berdiri sendiri biasanya tanda ada tautan yang lupa diisi.</p>
      ${orphans.length ? `<div class="rows">${orphans.slice(0,12).map(r => `
        <div class="row-i" onclick="recDetail('${r.id}')">
          <div class="ic" style="width:26px;height:26px;border-radius:8px;display:grid;place-items:center;flex:0 0 26px;background:${CT(SCHEMA[typeOf(r)].c)};color:${CV(SCHEMA[typeOf(r)].c)}">${ic(SCHEMA[typeOf(r)].ic)}</div>
          <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">${h(SCHEMA[typeOf(r)].t(r))}</span>
            <span class="s">${h(SCHEMA[typeOf(r)].n)} · ${r.id}</span></span></div>`).join('')}</div>
        ${orphans.length > 12 ? `<div class="card-f"><span class="mini">Menampilkan 12 dari ${orphans.length}.</span></div>` : ''}`
        : '<p class="sub" style="margin:0">Semua record tersambung ke setidaknya satu record lain.</p>'}
    </div>
  </div>

  <div class="statebar" style="margin:0">
    <span class="dbadge" style="background:var(--blue)">CARA KERJANYA</span>
    <div style="flex:1;min-width:240px">Peta ini tidak ditulis tangan. Setiap kolom bertipe relasi di skema otomatis jadi satu jalur,
      dan sisi sebaliknya dihitung saat Anda membuka record. Menambah kolom relasi baru berarti peta ini ikut bertambah dengan sendirinya.</div>
  </div>`;
};

