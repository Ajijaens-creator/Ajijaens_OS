/* ================================================================
   MY DAY — ALAT KERJA HARIAN
   Berjalan di atas record asli: LOG (check-in), TSK (tugas), MTG (agenda).
   Tugas yang lewat tenggat terbawa otomatis ke hari berjalan.
   ================================================================ */

const isoOf = d => new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,10);
const todayISO = () => isoOf(new Date());
const shiftISO = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return isoOf(d); };
const daysBetween = (a, b) => Math.round((new Date(b+'T12:00:00') - new Date(a+'T12:00:00')) / 86400000);
function fmtDay(iso){
  const d = new Date(iso + 'T12:00:00');
  return `${HARI[d.getDay()]}, ${d.getDate()} ${BLN[d.getMonth()]} ${d.getFullYear()}`;
}
function relDay(iso){
  const n = daysBetween(todayISO(), iso);
  return n===0 ? 'Hari ini' : n===1 ? 'Besok' : n===-1 ? 'Kemarin' : n>0 ? n+' hari lagi' : Math.abs(n)+' hari lalu';
}

let MD_DATE = todayISO();
function mdGo(iso){ MD_DATE = iso; go('myday'); }
function mdShift(n){ mdGo(shiftISO(MD_DATE, n)); }

/* ---------------- kueri ---------------- */
const DONE_ST = ['Selesai','Dibatalkan'];
const logFor   = d => recs('LOG').find(r => r.date === d);
const openTsk  = () => recs('TSK').filter(t => DONE_ST.indexOf(t.status) < 0);
const carryTsk = d => openTsk().filter(t => t.due && t.due <  d).sort((a,b)=> a.due < b.due ? -1 : 1);
const dueTsk   = d => openTsk().filter(t => t.due === d);
const someday  = () => openTsk().filter(t => !t.due);
const doneTsk  = d => recs('TSK').filter(t => t.status === 'Selesai' && t.done === d);
const mtgFor   = d => recs('MTG').filter(m => m.date === d).sort((a,b)=> (a.time||'99') < (b.time||'99') ? -1 : 1);
/* Tiga prioritas: P1 dulu, lalu yang terlambat paling lama, lalu jatuh tempo hari ini */
function top3(d){
  const pool = carryTsk(d).concat(dueTsk(d), someday().filter(t => t.pri && t.pri.indexOf('P1') === 0));
  const seen = {}, out = [];
  pool.forEach(t => { if(!seen[t.id]){ seen[t.id] = 1; out.push(t); } });
  out.sort((a,b) => {
    const p = x => x.pri ? Number(x.pri[1]) || 9 : 9;
    if(p(a) !== p(b)) return p(a) - p(b);
    return (a.due || '9999') < (b.due || '9999') ? -1 : 1;
  });
  return out.slice(0,3);
}

/* ---------------- aksi ---------------- */
function taskDone(id){
  const t = recById(id); if(!t) return;
  const st0 = t.status;
  t.status = 'Selesai'; t.done = MD_DATE;
  t._m.updated_at = new Date().toISOString(); t._m.updated_by = DB.owner.name;
  logAct('DONE', t, '', [{k:'status',l:'Status',from:st0,to:t.status},{k:'done',l:'Tanggal selesai',from:'',to:t.done}]); saveStore(); toast('Selesai — ' + SCHEMA.TSK.t(t)); go(CUR);
}
function taskUndone(id){
  const t = recById(id); if(!t) return;
  t.status = 'Sedang dikerjakan'; t.done = '';
  t._m.updated_at = new Date().toISOString();
  logAct('REOPEN', t, '', [{k:'status',l:'Status',from:'Selesai',to:t.status}]); saveStore(); go(CUR);
}
function taskMove(id, iso){
  const t = recById(id); if(!t) return;
  const from = t.due || '(tanpa tenggat)';
  t.due = iso; t._m.updated_at = new Date().toISOString();
  logAct('RESCHEDULE', t, '', [{k:'due',l:'Jatuh tempo',from:from,to:iso}]); saveStore();
  toast('Dipindah ke ' + relDay(iso).toLowerCase()); go(CUR);
}
function carryAll(){
  const list = carryTsk(MD_DATE); if(!list.length) return;
  list.forEach(t => { t.due = MD_DATE; t._m.updated_at = new Date().toISOString(); logAct('RESCHEDULE', t, 'carry-over'); });
  saveStore(); toast(list.length + ' tugas terbawa ditarik ke ' + relDay(MD_DATE).toLowerCase()); go(CUR);
}

/* ---------------- potongan tampilan ---------------- */
function taskLine(t, d){
  const done = t.status === 'Selesai';
  const late = !done && t.due && t.due < d ? daysBetween(t.due, d) : 0;
  const owner = t.owner ? recById(t.owner) : null;
  const sub = [
    late ? `<b style="color:var(--red)">terlambat ${late} hari</b>` : (t.due ? 'tenggat ' + relDay(t.due).toLowerCase() : 'tanpa tenggat'),
    t.pri ? h(t.pri) : '', owner ? h(SCHEMA.PER.t(owner)) : '', t.est ? h(t.est) + ' menit' : ''
  ].filter(Boolean).join(' · ');
  return `<div class="tline ${done?'done':''}">
    <span class="chk ${done?'on':''}" role="checkbox" tabindex="0" aria-checked="${done}"
      onclick="${done?`taskUndone('${t.id}')`:`taskDone('${t.id}')`}"
      onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}">${ic('check')}</span>
    <span style="min-width:0;flex:1" onclick="recDetail('${t.id}')">
      <span class="tt">${h(SCHEMA.TSK.t(t))}</span><span class="ts">${sub}</span></span>
    <span class="ta">
      ${!done && t.due !== d ? `<button class="btn ghost sm" onclick="taskMove('${t.id}','${d}')" title="Tarik ke hari ini">Hari ini</button>` : ''}
      ${!done ? `<button class="btn ghost sm" onclick="taskMove('${t.id}','${shiftISO(d,1)}')" title="Tunda ke besok">Besok</button>` : ''}
    </span></div>`;
}

function mdStarter(){
  return `<div class="card" style="text-align:center;padding:44px 26px;margin-bottom:18px">
    <div style="width:60px;height:60px;border-radius:18px;background:var(--blue-t);color:var(--blue);display:grid;place-items:center;margin:0 auto 16px">
      <span style="display:block;width:28px;height:28px">${ic('sun')}</span></div>
    <h2 style="font-family:var(--fd);font-size:24px;font-weight:600;margin:0 0 8px">Mulai hari Anda</h2>
    <p class="sub" style="max-width:470px;margin:0 auto 20px">My Day bekerja dari tiga hal: check-in harian, tugas, dan agenda.
      Isi salah satu saja — sisanya akan mengikuti setiap hari.</p>
    <div style="display:flex;gap:9px;justify-content:center;flex-wrap:wrap">
      <button class="btn solid" onclick="openForm('LOG')">${ic('sun')} Check-in hari ini</button>
      <button class="btn gold" onclick="openForm('TSK')">${ic('check')} Tambah tugas</button>
      <button class="btn ghost" onclick="openForm('MTG')">${ic('clock')} Tambah agenda</button>
    </div></div>`;
}

function mdHistory(){
  const list = recs('LOG').slice().sort((a,b)=> a.date < b.date ? 1 : -1).slice(0,7).reverse();
  if(list.length < 2) return '';
  return `<div class="card">
    ${cardH('chart','Riwayat check-in','green',`<span class="mini">${recs('LOG').length} catatan</span>`)}
    <div class="hist">${list.map(l=>{
      const e = Math.max(1, Math.min(10, Number(l.energy)||0));
      const c = e>=7?'green':e>=4?'yellow':'red';
      const d = new Date(l.date+'T12:00:00');
      return `<div onclick="mdGo('${l.date}')" title="${h(l.focus||'')}">
        <i style="height:${8+e*3.6}px;background:${CV(c)}"></i>
        <span>${d.getDate()}/${d.getMonth()+1}</span></div>`;
    }).join('')}</div>
    <div class="card-f"><span class="mini">Tinggi batang = energi yang Anda catat. Klik untuk membuka hari itu.</span></div>
  </div>`;
}

function mdReflect(l){
  if(!l) return `<div class="card">
    ${cardH('bulb','Refleksi','gold')}
    <p class="sub" style="margin:0 0 14px">Belum ada check-in untuk ${relDay(MD_DATE).toLowerCase()}. Lima menit menutup hari membuat besok jauh lebih jelas.</p>
    <button class="btn gold sm" onclick="openForm('LOG')">${ic('plus')} Tulis check-in</button></div>`;
  const rows = [['win','Kemenangan','green'],['block','Hambatan','red'],['grateful','Disyukuri','gold'],['tomorrow','Untuk besok','blue']]
    .filter(r => l[r[0]]);
  return `<div class="card">
    ${cardH('bulb','Refleksi','gold',`<button class="btn ghost sm" onclick="openForm('LOG','${l.id}')">Ubah</button>`)}
    ${rows.length ? `<div class="rows">${rows.map(r=>`
      <div class="row-i" style="cursor:default;align-items:flex-start">
        <span style="width:3px;align-self:stretch;border-radius:3px;background:${CV(r[2])};flex:0 0 3px"></span>
        <span style="min-width:0"><span class="t" style="font-size:12.5px">${r[1]}</span><span class="s">${h(l[r[0]]).replace(/\n/g,'<br>')}</span></span>
      </div>`).join('')}</div>` : '<p class="sub" style="margin:0">Check-in tercatat, tetapi bagian refleksi masih kosong.</p>'}
  </div>`;
}

/* ---------------- halaman My Day ---------------- */
VIEWS.myday = () => {
  const d = MD_DATE, isToday = d === todayISO();
  const l = logFor(d), carry = carryTsk(d), due = dueTsk(d), done = doneTsk(d), mtg = mtgFor(d), sd = someday();
  const t3 = top3(d);
  const hasAny = recs('LOG').length || recs('TSK').length || recs('MTG').length;
  const totalToday = carry.length + due.length + done.length;
  const pctDone = totalToday ? Math.round(done.length / totalToday * 100) : 0;
  const energy = l ? Math.max(0, Math.min(10, Number(l.energy)||0)) : null;
  const eColor = energy===null ? 'gray' : energy>=7 ? 'green' : energy>=4 ? 'yellow' : 'red';

  const head = `
  <div class="page-h">
    <div><h1>My Day <span style="font-size:26px">☀️</span></h1>
      <p>${isToday ? 'Fokus pada yang paling penting. Jadikan hari ini berarti.' : 'Melihat ' + fmtDay(d) + '.'}</p></div>
    <div class="sp">
      <div class="datenav">
        <button onclick="mdShift(-1)" title="Hari sebelumnya">‹</button>
        <button class="nowd" onclick="mdGo('${todayISO()}')">${isToday ? fmtDay(d) : relDay(d) + ' · ' + fmtDay(d)}</button>
        <button onclick="mdShift(1)" title="Hari berikutnya">›</button>
      </div>
      <button class="btn gold sm" onclick="openForm('${l?'LOG':'LOG'}'${l?`,'${l.id}'`:''})">${ic(l?'check':'plus')} ${l?'Ubah check-in':'Check-in'}</button>
      <button class="btn ghost sm" onclick="openForm('TSK')">${ic('plus')} Tugas</button>
    </div>
  </div>
  ${dummyOn() ? '' : dummyStateBar()}`;

  if(!hasAny) return head + mdStarter() + (dummyOn() ? mdDemoBlock() : '');

  const kpi = `
  <div class="g g4" style="margin-bottom:18px">
    <div class="card click" onclick="${l?`recDetail('${l.id}')`:`openForm('LOG')`}">
      ${cardH('bolt','Energi', eColor)}
      <div class="row" style="align-items:center;gap:14px;flex-wrap:nowrap">
        <div><div class="val" style="color:${CV(eColor)}">${energy===null?'—':energy}<small>/10</small></div>
          <div class="lbl">${energy===null?'Belum check-in':energy>=7?'Siap bekerja':energy>=4?'Cukup':'Perlu pemulihan'}</div></div>
        ${energy===null?'':ring(energy*10, eColor, 58, 7, '')}
      </div></div>

    <div class="card">
      ${cardH('target','Fokus hari ini','purple')}
      <p style="font-family:var(--fd);font-size:${l&&l.focus?'17px':'14px'};line-height:1.4;margin:4px 0 0;color:var(--text)">
        ${l && l.focus ? h(l.focus) : '<span class="sub">Belum ditetapkan — satu kalimat sudah cukup.</span>'}</p>
      ${l && l.focus ? '' : `<div class="card-f"><span class="linkr" onclick="openForm('LOG'${l?`,'${l.id}'`:''})">Tetapkan fokus →</span></div>`}
    </div>

    <div class="card click" onclick="go('projects')">
      ${cardH('check','Selesai','green',`<span class="mini">${done.length}/${totalToday||0}</span>`)}
      <div class="val">${pctDone}<small>%</small></div>
      <div class="bar" style="margin-top:9px"><i style="width:${pctDone}%;background:var(--green)"></i></div>
      <div class="lbl" style="margin-top:8px">${done.length ? done.length + ' tugas ditutup' : 'Belum ada yang ditutup'}</div>
    </div>

    <div class="card ${carry.length?'click':''}" ${carry.length?'onclick="carryAll()"':''}>
      ${cardH('clock','Terbawa', carry.length?'red':'gray',`<span class="pill ${carry.length?'red':'gray'}">${carry.length}</span>`)}
      <div class="val" style="color:${carry.length?'var(--red)':'var(--text-3)'}">${carry.length}</div>
      <div class="lbl">${carry.length ? 'lewat tenggat — klik untuk tarik semua ke ' + relDay(d).toLowerCase() : 'tidak ada yang tertinggal'}</div>
    </div>
  </div>`;

  const prio = `
  <div class="g g21 top" style="margin-bottom:18px">
    <div class="card">
      ${cardH('flag','Tiga hal terpenting','yellow', t3.length ? `<span class="mini">dipilih otomatis dari prioritas & tenggat</span>` : '')}
      ${t3.length ? t3.map((t,i)=>{
        const c = ['red','orange','blue'][i];
        return `<div class="prio" style="background:${CT(c)}">
          <span class="num" style="background:${CV(c)}">${i+1}</span>
          <span class="chk" role="checkbox" tabindex="0" aria-checked="false" onclick="taskDone('${t.id}')"
            onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}">${ic('check')}</span>
          <span style="min-width:0;flex:1;cursor:pointer" onclick="recDetail('${t.id}')">
            <span class="tt">${h(SCHEMA.TSK.t(t))}</span>
            <span class="ts">${[t.pri?h(t.pri):'', t.due?'tenggat '+relDay(t.due).toLowerCase():'tanpa tenggat'].filter(Boolean).join(' · ')}</span></span>
        </div>`; }).join('')
      : `<p class="sub" style="margin:0 0 14px">Belum ada tugas terbuka untuk hari ini. Tiga hal terpenting akan muncul sendiri begitu Anda menambahkannya.</p>
         <button class="btn gold sm" onclick="openForm('TSK')">${ic('plus')} Tambah tugas</button>`}
      ${t3.length ? `<div class="card-f"><span class="linkr" onclick="openForm('TSK')">Tambah tugas →</span></div>` : ''}
    </div>

    <div class="card">
      ${cardH('clock','Agenda','blue',`<span class="mini">${mtg.length} agenda</span>`)}
      ${mtg.length ? `<div class="tl">${mtg.map(m=>`
        <div class="tl-i" onclick="recDetail('${m.id}')">
          <span class="tm">${h(m.time||'—')}</span><span class="bar" style="background:var(--blue)"></span>
          <span class="bd"><b>${h(m.n)}</b><span>${[m.loc?h(m.loc):'', m.dur?h(m.dur)+' menit':''].filter(Boolean).join(' · ')||'—'}</span></span>
        </div>`).join('')}</div>`
      : `<p class="sub" style="margin:0 0 14px">Tidak ada agenda ${relDay(d).toLowerCase()}. Hari yang bagus untuk kerja mendalam.</p>`}
      <div class="card-f"><span class="linkr" onclick="openForm('MTG')">Tambah agenda →</span></div>
    </div>
  </div>`;

  const group = (title, list, color, note) => list.length ? `
    <div style="margin-bottom:16px">
      <div class="flexr" style="gap:8px;margin:0 0 6px">
        <b style="font-size:11.5px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--text-3)">${title}</b>
        <span class="cnt">${list.length}</span>
        ${note||''}
      </div>
      ${list.map(t=>taskLine(t,d)).join('')}
    </div>` : '';

  const tasks = `
  <div class="card" style="margin-bottom:18px">
    ${cardH('layers','Tugas hari ini','blue', `<button class="btn ghost sm" onclick="openForm('TSK')">${ic('plus')} Tugas</button>`)}
    ${group('Terbawa dari hari sebelumnya', carry, 'red',
        carry.length ? `<button class="btn ghost sm" style="margin-left:auto" onclick="carryAll()">Tarik semua ke ${relDay(d).toLowerCase()}</button>` : '')}
    ${group('Jatuh tempo ' + relDay(d).toLowerCase(), due, 'blue')}
    ${group('Tanpa tenggat', sd.slice(0,6), 'gray')}
    ${group('Selesai ' + relDay(d).toLowerCase(), done, 'green')}
    ${(carry.length + due.length + sd.length + done.length) === 0
      ? `<p class="sub" style="margin:0">Tidak ada tugas untuk hari ini. Bersih.</p>` : ''}
  </div>`;

  const bottom = `<div class="g g2" style="margin-bottom:18px">${mdReflect(l)}${mdHistory()}</div>`;

  return head + kpi + prio + tasks + bottom + (dummyOn() ? mdDemoBlock() : '');
};

/* Blok contoh lama disimpan di bawah, jelas ditandai sebagai demo */
function mdDemoBlock(){
  return `
  <div class="sect" style="margin-top:30px">
    <div><h2>Tampilan contoh</h2><p>Bagian di bawah ini masih memakai data contoh — untuk melihat wujud My Day saat sudah penuh terisi.</p></div>
    <div class="sp"><span class="pill dummy">⚠ DUMMY DATA</span>
      <button class="btn ghost sm" onclick="setDummyMode('hidden')">Sembunyikan</button></div>
  </div>
  ${MYDAY_BODY()}`;
}

