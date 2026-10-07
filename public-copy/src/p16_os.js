/* ================================================================
   OPERATING SYSTEM — decision log yang menagih, ritme yang tercatat
   Keputusan disimpan bersama asumsinya, lalu ditagih kembali pada tanggal peninjauan.
   Ritme punya daftar periksa dan riwayat pelaksanaan — bukan sekadar niat.
   ================================================================ */

/* ---------------- tambahan pada skema Keputusan ---------------- */
const VERDICTS = ['Tepat','Sebagian tepat','Keliru','Terlalu dini untuk dinilai'];
SCHEMA.DEC.f.push({ k:'verdict', l:'Penilaian setelah ditinjau', t:'sel', opt:VERDICTS,
  hint:'Diisi saat peninjauan — inilah yang membuat kualitas keputusan bisa dilihat dari waktu ke waktu.' });
SCHEMA.DEC.f.push({ k:'reviewed', l:'Ditinjau pada', t:'date', hint:'Terisi otomatis saat Anda menyelesaikan peninjauan.' });

/* ---------------- entitas baru: Ritme & Pelaksanaan ---------------- */
const FREQ_DAYS = { 'Harian':1, 'Mingguan':7, 'Dua mingguan':14, 'Bulanan':30, 'Kuartalan':90, 'Semesteran':180, 'Tahunan':365 };
SCHEMA.RIT = {
  n:'Ritme', ic:'clock', c:'gold', mod:'os', priv:'PRIVATE',
  d:'Peninjauan berulang dengan daftar periksa — harian sampai tahunan.',
  t:r=>r.n, s:r=>[r.freq, r.last ? 'terakhir ' + dOnly(r.last) : 'belum pernah dijalankan'].filter(Boolean).join(' · '),
  f:[{k:'n',l:'Nama ritme',t:'text',req:1,full:1,ph:'Weekly Review — Life by Design'},
     {k:'freq',l:'Frekuensi',t:'sel',req:1,opt:Object.keys(FREQ_DAYS)},
     {k:'when',l:'Kapan biasanya',t:'text',ph:'Minggu pagi, sebelum sarapan'},
     {k:'dur',l:'Perkiraan lama (menit)',t:'num',ph:'45'},
     {k:'purpose',l:'Untuk apa ritme ini ada',t:'textarea',full:1,
       hint:'Ritme tanpa alasan yang jelas adalah yang pertama ditinggalkan saat sibuk.'},
     {k:'items',l:'Daftar periksa',t:'textarea',full:1,ph:'Satu langkah per baris',
       hint:'Tiap baris jadi satu kotak centang saat ritme dijalankan.'},
     {k:'last',l:'Terakhir dijalankan',t:'date',hint:'Terisi otomatis setiap kali Anda menyelesaikannya.'},
     {k:'active',l:'Masih dijalankan',t:'sel',opt:['Ya','Dijeda','Dihentikan']},
     {k:'note',l:'Catatan',t:'textarea',full:1}]
};
SCHEMA.RUN = {
  n:'Pelaksanaan Ritme', ic:'check', c:'green', mod:'os', priv:'PRIVATE',
  d:'Catatan satu kali menjalankan ritme, beserta apa yang dicentang.',
  t:r=>{ const x = r.rit ? recById(r.rit) : null; return (x ? x.n : 'Ritme') + ' — ' + dOnly(r.date); },
  s:r=>[r.doneN !== undefined ? r.doneN + '/' + r.totalN + ' langkah' : '', r.note ? 'ada catatan' : ''].filter(Boolean).join(' · '),
  f:[{k:'rit',l:'Ritme',t:'rel',rel:'RIT',req:1},
     {k:'date',l:'Tanggal',t:'date',req:1},
     {k:'doneN',l:'Langkah selesai',t:'num'},
     {k:'totalN',l:'Total langkah',t:'num'},
     {k:'note',l:'Catatan & keputusan yang muncul',t:'textarea',full:1}]
};
SCH_ORDER.splice(SCH_ORDER.indexOf('DEC') + 1, 0, 'RIT', 'RUN');
MODULE_ENTITIES.os = ['DEC','GOL','RIT'];

/* ---------------- perhitungan ---------------- */
function decNeedsReview(){
  const today = todayISO();
  return recs('DEC').filter(d => d.review && !d.reviewed && d.review <= today)
    .sort((a,b) => a.review < b.review ? -1 : 1);
}
function ritStat(r){
  const runs = recs('RUN').filter(x => x.rit === r.id).sort((a,b) => (a.date||'') < (b.date||'') ? 1 : -1);
  const last = runs.length && runs[0].date ? runs[0].date : (r.last || '');
  const days = last ? daysBetween(last, todayISO()) : null;
  const target = FREQ_DAYS[r.freq] || null;
  const over = (target !== null && days !== null) ? days - target : null;
  const paused = r.active === 'Dijeda' || r.active === 'Dihentikan';
  let st = 'ok';
  if(paused) st = 'paused';
  else if(!target) st = 'ok';
  else if(days === null) st = 'never';
  else if(over > target) st = 'broken';
  else if(over >= 0) st = 'due';
  const y90 = shiftISO(todayISO(), -90);
  const recent = runs.filter(x => x.date && x.date >= y90).length;
  const expected = target ? Math.max(1, Math.round(90 / target)) : null;
  return { runs, n: runs.length, last, days, target, over, st, recent, expected,
           keep: expected ? Math.min(100, Math.round(recent / expected * 100)) : null };
}
const RIT_LABEL = { never:'Belum pernah dijalankan', broken:'Terputus', due:'Jatuh tempo', ok:'Terjaga', paused:'Dijeda' };
const RIT_COLOR = { never:'orange', broken:'red', due:'orange', ok:'green', paused:'gray' };
const ritItems = r => String(r.items || '').split('\n').map(s => s.trim()).filter(Boolean);

/* ---------------- menjalankan ritme ---------------- */
let RUN_STATE = null;
function runRitme(id){
  const r = recById(id); if(!r) return;
  const items = ritItems(r);
  RUN_STATE = { rit: id, checked: items.map(() => false) };
  renderRun();
}
function runToggle(i){ RUN_STATE.checked[i] = !RUN_STATE.checked[i]; renderRun(); }
function renderRun(){
  const r = recById(RUN_STATE.rit), items = ritItems(r);
  const done = RUN_STATE.checked.filter(Boolean).length;
  const s = ritStat(r);
  modal('Jalankan: ' + h(r.n), `${h(r.freq)}${r.when ? ' · ' + h(r.when) : ''}${r.dur ? ' · sekitar ' + h(r.dur) + ' menit' : ''}`,
    `${r.purpose ? `<div class="card" style="padding:14px;margin-bottom:16px;background:var(--gold-tint)">
        <div class="mini" style="margin-bottom:4px">Untuk apa ritme ini ada</div>
        <div style="font-size:13px">${h(r.purpose).replace(/\n/g,'<br>')}</div></div>` : ''}
     <div class="flexr" style="gap:12px;margin-bottom:14px">
       <div style="flex:1"><div class="flexr" style="justify-content:space-between;margin-bottom:5px">
         <span class="mini">Langkah selesai</span><b>${done}/${items.length}</b></div>
         <div class="bar" style="height:9px"><i style="width:${items.length ? done/items.length*100 : 0}%;background:var(--green)"></i></div></div>
     </div>
     ${items.length ? items.map((it,i) => `
       <div class="tline" style="cursor:pointer" onclick="runToggle(${i})">
         <span class="chk ${RUN_STATE.checked[i]?'on':''}" role="checkbox" tabindex="0" aria-checked="${RUN_STATE.checked[i]}"
           onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}">${ic('check')}</span>
         <span style="min-width:0;flex:1"><span class="tt" style="${RUN_STATE.checked[i]?'text-decoration:line-through;color:var(--text-3)':''}">${h(it)}</span></span>
       </div>`).join('')
      : `<p class="sub">Ritme ini belum punya daftar periksa. Tambahkan langkah-langkahnya lewat <b>Ubah ritme</b> agar tiap pelaksanaan punya bentuk yang sama.</p>`}
     <div class="sep" style="margin:16px 0"></div>
     <div class="fld full"><label>Catatan &amp; keputusan yang muncul</label>
       <textarea id="runNote" placeholder="Apa yang Anda putuskan atau sadari selama peninjauan ini?"></textarea></div>
     ${s.last ? `<div class="mini" style="margin-top:10px">Terakhir dijalankan ${dOnly(s.last)} — ${s.days} hari lalu.</div>` : ''}`,
    `<button class="btn solid" onclick="saveRun()">${ic('check')} Selesai${items.length ? ' · ' + done + '/' + items.length : ''}</button>
     <button class="btn ghost" onclick="closeModal();openForm('RIT','${r.id}')">Ubah ritme</button>
     <button class="btn ghost" onclick="closeModal()">Batal</button>`, true);
}
function saveRun(){
  const r = recById(RUN_STATE.rit), items = ritItems(r);
  const el = document.getElementById('runNote');
  const now = new Date().toISOString();
  const rec = { id: nextId('RUN'), type:'RUN', rit: r.id, date: todayISO(),
    doneN: String(RUN_STATE.checked.filter(Boolean).length), totalN: String(items.length),
    note: el ? el.value.trim() : '' };
  rec._m = { created_at:now, updated_at:now, created_by:DB.owner.name, updated_by:DB.owner.name, status:'ACTIVE',
    source_type:'MANUAL_ENTRY', source_id:r.id, source_url:'', privacy_level:'PRIVATE', is_dummy:false, is_archived:false, tags:[] };
  (STORE.rec.RUN = STORE.rec.RUN || []).unshift(rec);
  r.last = rec.date; r._m.updated_at = now;
  logAct('RUN', rec, r.n); saveStore(); closeModal(); RUN_STATE = null;
  toast(r.n + ' dijalankan — ' + rec.doneN + '/' + rec.totalN + ' langkah');
  go(CUR);
}

/* ---------------- meninjau keputusan ---------------- */
function reviewDec(id){
  const d = recById(id); if(!d) return;
  const late = d.review && d.review < todayISO() ? daysBetween(d.review, todayISO()) : 0;
  modal('Tinjau keputusan', h(d.n),
    `<div class="flexr" style="gap:7px;margin-bottom:16px">
       ${idPill(d.id)}
       <span class="pill ${d.impact && d.impact.indexOf('Besar')===0 ? 'red' : d.impact && d.impact.indexOf('Sedang')===0 ? 'orange' : 'blue'}">${h(d.impact||'—')}</span>
       <span class="pill gray">diputuskan ${d.date ? dOnly(d.date) : '—'}</span>
       ${late ? `<span class="pill red">peninjauan telat ${late} hari</span>` : ''}
     </div>
     <p class="sub" style="margin-bottom:16px">Bacalah dulu apa yang Anda tulis saat itu — sebelum menilai. Ini satu-satunya cara menghindari menilai keputusan dengan informasi yang belum Anda punya waktu itu.</p>

     ${[['ctx','Situasi saat itu','gray'],['opts','Pilihan yang dipertimbangkan','blue'],
        ['why','Alasan memilih ini','gold'],['assume','Asumsi yang harus benar','red']]
       .filter(x => d[x[0]]).map(x => `
       <div class="card" style="padding:14px;margin-bottom:11px">
         <div class="flexr" style="gap:8px;margin-bottom:5px">
           <span style="width:3px;align-self:stretch;border-radius:3px;background:${CV(x[2])};flex:0 0 3px"></span>
           <b style="font-size:11.5px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:var(--text-3)">${x[1]}</b></div>
         <div style="font-size:13px">${h(d[x[0]]).replace(/\n/g,'<br>')}</div></div>`).join('')}

     <div class="sep" style="margin:18px 0"></div>
     <div class="frm">
       <div class="fld full"><label>Apa yang sebenarnya terjadi<i>*</i></label>
         <textarea id="decResult" placeholder="Hasil nyatanya — termasuk yang tidak Anda duga.">${h(d.result||'')}</textarea></div>
       <div class="fld"><label>Penilaian<i>*</i></label>
         <select id="decVerdict"><option value="">— pilih —</option>
           ${VERDICTS.map(v => `<option value="${h(v)}"${d.verdict===v?' selected':''}>${h(v)}</option>`).join('')}</select>
         <span class="fhint">Menilai "keliru" bukan hukuman — itu yang membuat catatan ini berguna.</span></div>
       <div class="fld"><label>Status keputusan</label>
         <select id="decStatus">${['Diputuskan','Dijalankan','Ditinjau ulang','Dibatalkan'].map(s =>
           `<option value="${s}"${d.status===s?' selected':''}>${s}</option>`).join('')}</select></div>
       <div class="fld"><label>Tinjau lagi pada</label>
         <input id="decNext" type="date" value="">
         <span class="fhint">Kosongkan bila keputusan ini sudah tuntas dinilai.</span></div>
     </div>`,
    `<button class="btn solid" onclick="saveReview('${id}')">${ic('check')} Simpan peninjauan</button>
     <button class="btn ghost" onclick="closeModal();openForm('DEC','${id}')">Ubah keputusan</button>
     <button class="btn ghost" onclick="closeModal()">Nanti saja</button>`, true);
}
function saveReview(id){
  const d = recById(id); if(!d) return;
  const res = (document.getElementById('decResult').value || '').trim();
  const ver = document.getElementById('decVerdict').value;
  if(!res || !ver){ toast('Isi hasil nyatanya dan penilaiannya dulu'); return; }
  const next = document.getElementById('decNext').value;
  d.result = res; d.verdict = ver;
  d.status = document.getElementById('decStatus').value || d.status;
  d.reviewed = todayISO();
  d.review = next || '';
  if(next) d.reviewed = '';          /* dijadwalkan lagi → belum tuntas */
  d._m.updated_at = new Date().toISOString(); d._m.updated_by = DB.owner.name;
  logAct('REVIEW', d, ver); saveStore(); closeModal();
  toast(next ? 'Peninjauan tersimpan — dijadwalkan lagi ' + dOnly(next) : 'Peninjauan tersimpan — ' + ver);
  go(CUR);
}

/* ---------------- TAB: keputusan ---------------- */
function osDec(){
  const all = recs('DEC'), due = decNeedsReview();
  const scheduled = all.filter(d => d.review && !d.reviewed && d.review > todayISO());
  const judged = all.filter(d => d.verdict);
  const noAssume = all.filter(d => !d.assume);
  const vCount = VERDICTS.map(v => ({ v, n: judged.filter(d => d.verdict === v).length }));
  const mxV = Math.max(...vCount.map(x => x.n)) || 1;
  if(!all.length) return `<div class="card" style="text-align:center;padding:44px 26px">
    <div style="width:58px;height:58px;border-radius:17px;background:var(--red-t);color:var(--red);display:grid;place-items:center;margin:0 auto 15px">
      <span style="display:block;width:27px;height:27px">${ic('scale')}</span></div>
    <h2 style="font-family:var(--fd);font-size:23px;font-weight:600;margin:0 0 8px">Belum ada keputusan tercatat</h2>
    <p class="sub" style="max-width:470px;margin:0 auto 18px">Catat keputusan besar beserta <b>asumsi yang harus benar</b> dan tanggal peninjauannya.
      Sistem akan menagihnya kembali pada tanggal itu — dengan alasan Anda saat itu, bukan ingatan Anda sekarang.</p>
    <button class="btn solid" onclick="openForm('DEC')">${ic('plus')} Keputusan pertama</button></div>`;
  return `
  <div class="g g4" style="margin-bottom:18px">
    ${[['Menunggu peninjauan', due.length, due.length?'red':'green','clock'],
       ['Terjadwal ditinjau', scheduled.length, 'blue','flag'],
       ['Sudah dinilai', judged.length, 'green','check'],
       ['Tanpa asumsi tertulis', noAssume.length, noAssume.length?'orange':'gray','shield']].map(s=>`
      <div class="card"><div class="kpi">
        <div class="ic" style="width:38px;height:38px;border-radius:11px;display:grid;place-items:center;flex:0 0 38px;background:${CT(s[2])};color:${CV(s[2])}">${ic(s[3])}</div>
        <div style="min-width:0"><b>${s[1]}</b><span>${s[0]}</span></div></div></div>`).join('')}
  </div>

  ${due.length ? `<div class="card" style="margin-bottom:18px;border-color:var(--red)">
    ${cardH('clock','Sudah waktunya ditinjau','red',`<span class="cnt">${due.length}</span>`)}
    <div class="rows">${due.map(d => {
      const late = daysBetween(d.review, todayISO());
      return `<div class="row-i" style="align-items:flex-start" onclick="reviewDec('${d.id}')">
        <span class="pill red" style="margin-top:1px">${late === 0 ? 'hari ini' : late + ' hari telat'}</span>
        <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">${h(d.n)}</span>
          <span class="s">diputuskan ${d.date ? dOnly(d.date) : '—'} · ${h(d.impact || '—')}${d.assume ? ' · ada asumsi tertulis' : ' · tanpa asumsi tertulis'}</span></span>
        <span class="rt"><button class="btn gold sm" onclick="event.stopPropagation();reviewDec('${d.id}')">Tinjau</button></span></div>`; }).join('')}</div>
  </div>` : ''}

  <div class="g g21 top" style="margin:0 0 18px">
    <div class="card">
      ${cardH('scale','Semua keputusan','red',`<button class="btn gold sm" onclick="openForm('DEC')">${ic('plus')} Keputusan</button>`)}
      <div style="overflow-x:auto"><table class="tbl"><thead><tr>
        <th>Keputusan</th><th>Bobot</th><th>Diputuskan</th><th>Peninjauan</th><th>Penilaian</th>
      </tr></thead><tbody>${all.slice().sort((a,b) => (a.date||'') < (b.date||'') ? 1 : -1).map(d => `
        <tr style="cursor:pointer" onclick="${d.review && !d.reviewed ? `reviewDec('${d.id}')` : `recDetail('${d.id}')`}">
          <td><b>${h(d.n)}</b><div class="mini">${h(d.status || '—')}</div></td>
          <td><span class="pill ${d.impact && d.impact.indexOf('Besar')===0 ? 'red' : d.impact && d.impact.indexOf('Sedang')===0 ? 'orange' : 'blue'}">${h((d.impact||'—').split('—')[0].trim())}</span></td>
          <td class="mini">${d.date ? dOnly(d.date) : '—'}</td>
          <td class="mini">${d.reviewed ? 'selesai ' + dOnly(d.reviewed) : d.review ? (d.review <= todayISO() ? '<b style="color:var(--red)">jatuh tempo</b> ' : '') + dOnly(d.review) : 'tidak dijadwalkan'}</td>
          <td>${d.verdict ? `<span class="pill ${d.verdict==='Tepat'?'green':d.verdict==='Sebagian tepat'?'blue':d.verdict==='Keliru'?'red':'gray'}">${h(d.verdict)}</span>` : '<span class="mini">—</span>'}</td>
        </tr>`).join('')}</tbody></table></div>
    </div>

    <div class="card">
      ${cardH('chart','Kualitas keputusan','purple',`<span class="mini">${judged.length} dinilai</span>`)}
      ${judged.length ? vCount.map(x => barLine(x.v, x.n, mxV,
          x.v==='Tepat'?'green':x.v==='Sebagian tepat'?'blue':x.v==='Keliru'?'red':'gray')).join('')
        : '<p class="sub" style="margin:0">Belum ada keputusan yang selesai ditinjau. Angka ini baru berarti setelah beberapa siklus.</p>'}
      <div class="card-f"><span class="mini">Ini menilai <b>kualitas proses berpikir</b>, bukan keberuntungan hasil. Keputusan tepat bisa berhasil buruk, dan sebaliknya.</span></div>
    </div>
  </div>

  ${noAssume.length ? `<div class="statebar" style="margin:0">
    <span class="dbadge" style="background:var(--orange)">CATATAN</span>
    <div style="flex:1;min-width:220px"><b>${noAssume.length} keputusan belum menuliskan asumsinya.</b>
      Tanpa asumsi tertulis, peninjauan nanti hanya bisa menilai hasil — bukan apakah cara berpikirnya benar.</div>
  </div>` : ''}`;
}

/* ---------------- TAB: ritme ---------------- */
function osRit(){
  const all = recs('RIT');
  if(!all.length) return `<div class="card" style="text-align:center;padding:44px 26px">
    <div style="width:58px;height:58px;border-radius:17px;background:var(--gold-tint);color:var(--gold-dark);display:grid;place-items:center;margin:0 auto 15px">
      <span style="display:block;width:27px;height:27px">${ic('clock')}</span></div>
    <h2 style="font-family:var(--fd);font-size:23px;font-weight:600;margin:0 0 8px">Belum ada ritme</h2>
    <p class="sub" style="max-width:470px;margin:0 auto 18px">Ritme adalah peninjauan berulang dengan daftar periksa — review mingguan, tutup bulan, evaluasi kuartal.
      Sistem mencatat tiap pelaksanaan, jadi Anda bisa melihat apakah ritmenya benar-benar dijalankan atau hanya diniatkan.</p>
    <button class="btn solid" onclick="openForm('RIT')">${ic('plus')} Ritme pertama</button></div>`;
  const stats = all.map(r => Object.assign({ r }, ritStat(r)));
  const dueList = stats.filter(x => x.st === 'due' || x.st === 'broken' || x.st === 'never')
    .sort((a,b) => (b.over || 9999) - (a.over || 9999));
  const runs = recs('RUN').sort((a,b) => (a.date||'') < (b.date||'') ? 1 : -1);
  return `
  <div class="g g4" style="margin-bottom:18px">
    ${[['Ritme aktif', stats.filter(x => x.st !== 'paused').length, 'gold','clock'],
       ['Jatuh tempo', dueList.filter(x => x.st === 'due').length, 'orange','flag'],
       ['Terputus', stats.filter(x => x.st === 'broken').length, stats.filter(x=>x.st==='broken').length?'red':'gray','shield'],
       ['Pelaksanaan tercatat', runs.length, 'green','check']].map(s=>`
      <div class="card"><div class="kpi">
        <div class="ic" style="width:38px;height:38px;border-radius:11px;display:grid;place-items:center;flex:0 0 38px;background:${CT(s[2])};color:${CV(s[2])}">${ic(s[3])}</div>
        <div style="min-width:0"><b>${s[1]}</b><span>${s[0]}</span></div></div></div>`).join('')}
  </div>

  <div class="card" style="margin-bottom:18px">
    ${cardH('clock','Ritme Anda','gold',`<button class="btn gold sm" onclick="openForm('RIT')">${ic('plus')} Ritme</button>`)}
    ${stats.map(x => `
      <div class="card" style="padding:14px;margin-bottom:10px">
        <div class="flexr" style="gap:10px;margin-bottom:8px">
          <div class="ic" style="width:32px;height:32px;border-radius:10px;display:grid;place-items:center;flex:0 0 32px;background:${CT(RIT_COLOR[x.st])};color:${CV(RIT_COLOR[x.st])}">${ic('clock')}</div>
          <span style="min-width:0;flex:1"><span class="tt">${h(x.r.n)}</span>
            <span class="ts">${h(x.r.freq)}${x.r.when ? ' · ' + h(x.r.when) : ''} · ${ritItems(x.r).length} langkah</span></span>
          <span class="pill ${RIT_COLOR[x.st]}">${RIT_LABEL[x.st]}${x.st==='due'||x.st==='broken' ? ' · lewat ' + x.over + ' hari' : ''}</span>
          ${x.st !== 'paused' ? `<button class="btn gold sm" onclick="runRitme('${x.r.id}')">Jalankan</button>` : ''}
          <button class="btn ghost sm" onclick="recDetail('${x.r.id}')">Detail</button>
        </div>
        <div class="flexr" style="gap:12px">
          <div style="flex:1;min-width:120px"><div class="flexr" style="justify-content:space-between;margin-bottom:4px">
            <span class="mini">Kedisiplinan 90 hari${x.expected ? ' — ' + x.recent + ' dari ' + x.expected + ' kali yang seharusnya' : ''}</span>
            <b style="font-size:12px">${x.keep === null ? '—' : x.keep + '%'}</b></div>
            <div class="bar"><i style="width:${x.keep || 0}%;background:${CV(x.keep >= 80 ? 'green' : x.keep >= 50 ? 'orange' : 'red')}"></i></div></div>
          <span class="mini" style="flex:0 0 auto">${x.last ? 'terakhir ' + dOnly(x.last) + ' · ' + x.days + ' hari lalu' : 'belum pernah dijalankan'}</span>
        </div>
      </div>`).join('')}
  </div>

  ${runs.length ? `<div class="card">
    ${cardH('check','Riwayat pelaksanaan','green',`<span class="cnt">${runs.length}</span>`)}
    <div class="rows">${runs.slice(0,15).map(x => { const r = x.rit ? recById(x.rit) : null;
      const full = Number(x.doneN) === Number(x.totalN) && Number(x.totalN) > 0;
      return `<div class="row-i" style="align-items:flex-start" onclick="recDetail('${x.id}')">
        <span class="pill ${full ? 'green' : 'orange'}" style="margin-top:1px">${x.doneN}/${x.totalN}</span>
        <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">${r ? h(r.n) : '—'}</span>
          <span class="s">${dOnly(x.date)}${x.note ? ' · ' + h(String(x.note).slice(0,80)) : ''}</span></span>
      </div>`; }).join('')}</div>
  </div>` : ''}`;
}

/* ---------------- TAB: goal ---------------- */
const HORIZONS = ['10 tahun','5 tahun','3 tahun','1 tahun','Kuartal ini','Bulan ini'];
function osGoal(){
  const all = recs('GOL');
  if(!all.length) return `<div class="card" style="text-align:center;padding:44px 26px">
    <div style="width:58px;height:58px;border-radius:17px;background:var(--gold-tint);color:var(--gold-dark);display:grid;place-items:center;margin:0 auto 15px">
      <span style="display:block;width:27px;height:27px">${ic('target')}</span></div>
    <h2 style="font-family:var(--fd);font-size:23px;font-weight:600;margin:0 0 8px">Belum ada sasaran</h2>
    <p class="sub" style="max-width:460px;margin:0 auto 18px">Sasaran disusun berjenjang — dari visi sepuluh tahun sampai target bulan ini, saling menempel lewat kolom "bagian dari sasaran".</p>
    <button class="btn solid" onclick="openForm('GOL')">${ic('plus')} Sasaran pertama</button></div>`;
  const orphan = all.filter(g => !g.parent && g.horizon && HORIZONS.indexOf(g.horizon) > 2);
  const children = id => all.filter(g => g.parent === id);
  const goalRow = (g, depth) => {
    const kids = children(g.id);
    const c = g.status === 'Tercapai' ? 'green' : g.status === 'Tertinggal' ? 'red' : g.status === 'Di depan target' ? 'blue' : g.status === 'Dilepas' ? 'gray' : 'gold';
    return `<div class="row-i" style="align-items:flex-start;padding-left:${8 + depth * 22}px" onclick="recDetail('${g.id}')">
        <span style="width:3px;align-self:stretch;border-radius:3px;background:${CV(c)};flex:0 0 3px"></span>
        <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">${h(g.n)}</span>
          <span class="s">${[h(g.horizon||''), g.area ? h(g.area) : '', g.metric ? h(g.metric) : '', g.due ? 'tenggat ' + dOnly(g.due) : ''].filter(Boolean).join(' · ')}</span></span>
        <span class="rt"><span class="pill ${c}">${h(g.status || 'Belum mulai')}</span></span>
      </div>` + kids.map(k => goalRow(k, depth + 1)).join('');
  };
  const roots = all.filter(g => !g.parent || !recById(g.parent));
  const byArea = {};
  all.forEach(g => { const k = g.area || 'Tanpa area'; byArea[k] = (byArea[k] || 0) + 1; });
  return `
  <div class="g g4" style="margin-bottom:18px">
    ${[['Total sasaran', all.length, 'gold','target'],
       ['Tercapai', all.filter(g => g.status === 'Tercapai').length, 'green','check'],
       ['Tertinggal', all.filter(g => g.status === 'Tertinggal').length, all.filter(g=>g.status==='Tertinggal').length?'red':'gray','flag'],
       ['Tanpa ukuran', all.filter(g => !g.metric).length, all.filter(g=>!g.metric).length?'orange':'gray','scale']].map(s=>`
      <div class="card"><div class="kpi">
        <div class="ic" style="width:38px;height:38px;border-radius:11px;display:grid;place-items:center;flex:0 0 38px;background:${CT(s[2])};color:${CV(s[2])}">${ic(s[3])}</div>
        <div style="min-width:0"><b>${s[1]}</b><span>${s[0]}</span></div></div></div>`).join('')}
  </div>
  <div class="g g21 top" style="margin:0">
    <div class="card">
      ${cardH('target','Hierarki sasaran','gold',`<button class="btn gold sm" onclick="openForm('GOL')">${ic('plus')} Sasaran</button>`)}
      <div class="rows">${roots.map(g => goalRow(g, 0)).join('')}</div>
      ${orphan.length ? `<div class="card-f"><span class="mini">${orphan.length} sasaran jangka pendek belum ditempelkan ke sasaran yang lebih besar — isi kolom "bagian dari sasaran" agar rantainya terlihat.</span></div>` : ''}
    </div>
    <div class="card">
      ${cardH('scale','Sebaran area hidup','purple')}
      ${Object.keys(byArea).sort((a,b) => byArea[b] - byArea[a]).map(k =>
        barLine(k, byArea[k], Math.max(...Object.values(byArea)), 'purple')).join('')}
      <div class="card-f"><span class="mini">Area yang tidak punya satu pun sasaran biasanya area yang paling mudah tergerus.</span></div>
    </div>
  </div>`;
}

/* ---------------- TAB: prinsip (Core Intelligence, dari Aji sendiri) ---------------- */
function osCore(){
  const core = DB.core || [];
  const byDom = {};
  core.forEach(c => { (byDom[c.dom] = byDom[c.dom] || []).push(c); });
  return `
  <div class="card" style="margin-bottom:18px">
    ${cardH('spark','Prinsip yang Anda nyatakan sendiri','purple',
      `<span class="pill green">${core.length} CONFIRMED</span>
       <button class="btn ghost sm" style="margin-left:9px" onclick="fTab='core';go('foundation')">Kelola →</button>`)}
    <p class="sub" style="margin-bottom:14px">Semua baris di bawah ini berasal dari kata-kata Anda sendiri dalam sesi Core Intelligence —
      bukan tafsiran saya. Itulah sebabnya bagian ini terpisah dari data operasional.</p>
    ${Object.keys(byDom).map(dom => `
      <div style="margin-bottom:15px">
        <div class="flexr" style="gap:8px;margin:0 0 6px">
          <b style="font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--text-3)">${h(dom)}</b>
          <span class="cnt">${byDom[dom].length}</span></div>
        <div class="rows">${byDom[dom].map(c => `
          <div class="row-i" style="align-items:flex-start" onclick="coreDetail('${c.id}')">
            <span class="pill purple" style="margin-top:1px">${c.conf}</span>
            <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">${h(c.sub)}</span>
              <span class="s">${h(String(c.st).slice(0,150))}${String(c.st).length > 150 ? '…' : ''}</span></span>
          </div>`).join('')}</div>
      </div>`).join('')}
    <div class="card-f"><span class="mini">Sesi Core Intelligence berikutnya: Gaya Komunikasi · Hierarki Goal &amp; Visi · Filosofi Keluarga &amp; Keuangan · Narasi Personal.</span></div>
  </div>
  <div class="statebar" style="margin:0">
    <span class="dbadge" style="background:var(--blue)">CATATAN JUJUR</span>
    <div style="flex:1;min-width:220px">Prinsip, aturan keputusan, dan aturan investasi yang tampil di tampilan contoh di bawah halaman ini
      <b>saya yang mengarang</b> — bukan pernyataan Anda. Bagian inilah yang menggantikannya, satu sesi demi satu sesi.</div>
  </div>`;
}

/* ---------------- halaman Operating System ---------------- */
let OS_TAB = 'dec';
const OS_TABS = [['dec','Keputusan'],['rit','Ritme'],['goal','Goal'],['core','Prinsip']];
const OS_VIEW = { dec:osDec, rit:osRit, goal:osGoal, core:osCore };
function osTab(k){ OS_TAB = k; go('os'); }

VIEWS.os = () => {
  const due = decNeedsReview().length;
  const ritDue = recs('RIT').map(r => ritStat(r)).filter(x => x.st === 'due' || x.st === 'broken').length;
  const head = `
  <div class="page-h">
    <div><h1>Operating System</h1><p>Sistem pribadi Aji — keputusan beserta alasannya, ritme yang benar-benar dijalankan, dan sasaran berjenjang.</p></div>
    <div class="sp">
      <button class="btn gold sm" onclick="openForm('DEC')">${ic('plus')} Keputusan</button>
      <button class="btn ghost sm" onclick="openForm('RIT')">${ic('clock')} Ritme</button>
      <button class="btn ghost sm" onclick="openForm('GOL')">${ic('target')} Goal</button>
      <button class="btn ghost sm" onclick="go('operations')">Cari Operations? →</button>
    </div>
  </div>
  ${dummyOn() ? '' : dummyStateBar()}
  ${(due || ritDue) ? `<div class="statebar del" style="margin-bottom:18px">
    <span class="dbadge" style="background:var(--red)">MENAGIH</span>
    <div style="flex:1;min-width:220px">
      ${due ? `<b>${due} keputusan</b> sudah waktunya ditinjau. ` : ''}
      ${ritDue ? `<b>${ritDue} ritme</b> lewat jadwalnya. ` : ''}
      Sistem menagih supaya Anda tidak perlu mengingat sendiri.</div>
    ${due ? `<button class="btn ghost sm" onclick="osTab('dec')">Lihat keputusan</button>` : ''}
    ${ritDue ? `<button class="btn ghost sm" onclick="osTab('rit')">Lihat ritme</button>` : ''}
  </div>` : ''}`;

  return head +
    `<div class="tabbar">${OS_TABS.map(([k,n]) => {
      const b = k === 'dec' ? due : k === 'rit' ? ritDue : 0;
      return `<button class="${OS_TAB===k?'on':''}" onclick="osTab('${k}')">${n}${b ? ` <span class="cnt" style="background:var(--red);color:#fff">${b}</span>` : ''}</button>`;
    }).join('')}</div>` +
    (OS_VIEW[OS_TAB] || osDec)() +
    (dummyOn() ? osDemoBlock() : '');
};

function osDemoBlock(){
  return `
  <div class="sect" style="margin-top:30px">
    <div><h2>Tampilan contoh</h2><p>Prinsip, ritme, dan log versi contoh — termasuk peta folder Drive dan status fase pembangunan.</p></div>
    <div class="sp"><span class="pill dummy">⚠ DUMMY DATA</span>
      <button class="btn ghost sm" onclick="setDummyMode('hidden')">Sembunyikan</button></div>
  </div>
  ${OS_BODY()}`;
}

