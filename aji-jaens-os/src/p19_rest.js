/* ================================================================
   BRANDING · FAMILY · TRAVEL · WELLBEING · KNOWLEDGE
   Lima modul ruang khusus, semuanya berdiri di atas entitas yang sudah ada.
   Tidak ada mesin baru — hanya cara melihat yang tepat untuk tiap ruang.
   ================================================================ */

/* ---------------- helper bersama ---------------- */
function liveHead(title, sub, buttons){
  return `<div class="page-h"><div><h1>${title}</h1><p>${sub}</p></div>
    <div class="sp">${buttons}</div></div>${dummyOn() ? '' : dummyStateBar()}`;
}
function emptyCard(icon, color, title, body, buttons){
  return `<div class="card" style="text-align:center;padding:46px 26px;margin-bottom:18px">
    <div style="width:60px;height:60px;border-radius:18px;background:${CT(color)};color:${CV(color)};display:grid;place-items:center;margin:0 auto 16px">
      <span style="display:block;width:28px;height:28px">${ic(icon)}</span></div>
    <h2 style="font-family:var(--fd);font-size:24px;font-weight:600;margin:0 0 8px">${title}</h2>
    <p class="sub" style="max-width:480px;margin:0 auto 20px">${body}</p>
    <div style="display:flex;gap:9px;justify-content:center;flex-wrap:wrap">${buttons}</div></div>`;
}
function kpiRow(items){
  return `<div class="g g4" style="margin-bottom:18px">${items.map(s => `
    <div class="card"><div class="kpi">
      <div class="ic" style="width:38px;height:38px;border-radius:11px;display:grid;place-items:center;flex:0 0 38px;background:${CT(s[2])};color:${CV(s[2])}">${ic(s[3])}</div>
      <div style="min-width:0"><b>${s[1]}</b><span>${s[0]}</span></div></div></div>`).join('')}</div>`;
}
function demoTail(bodyFn, title, note){
  if(!dummyOn()) return '';
  return `<div class="sect" style="margin-top:30px">
    <div><h2>${title || 'Tampilan contoh'}</h2><p>${note || 'Versi contoh — untuk melihat wujudnya saat sudah penuh terisi.'}</p></div>
    <div class="sp"><span class="pill dummy">⚠ DUMMY DATA</span>
      <button class="btn ghost sm" onclick="setDummyMode('hidden')">Sembunyikan</button></div>
  </div>${bodyFn()}`;
}
/* Ulang tahun / peringatan tahunan berikutnya */
function nextAnniv(iso){
  if(!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const T = todayISO(), y = Number(T.slice(0,4)), mm = iso.slice(5,7), dd = iso.slice(8,10);
  let cand = y + '-' + mm + '-' + dd;
  if(!mkDate(y, Number(mm), Number(dd))) cand = y + '-03-01';          /* 29 Feb di tahun biasa */
  if(cand < T){
    cand = (y + 1) + '-' + mm + '-' + dd;
    if(!mkDate(y + 1, Number(mm), Number(dd))) cand = (y + 1) + '-03-01';
  }
  return { date: cand, inDays: daysBetween(T, cand), years: Number(cand.slice(0,4)) - Number(iso.slice(0,4)) };
}

/* ================================================================
   ⑨ BRANDING & CRM — pipeline konten
   ================================================================ */
const CNT_ST = ['Ide','Draft','Menunggu review','Terjadwal','Tayang'];
const CNT_COLOR = { 'Ide':'gray', 'Draft':'blue', 'Menunggu review':'orange', 'Terjadwal':'purple', 'Tayang':'green' };
const cntLate = () => recs('CNT').filter(c => c.date && c.date < todayISO() && c.status !== 'Tayang' && c.status !== 'Dibatalkan');

VIEWS.brand = () => {
  const all = recs('CNT');
  const head = liveHead('Branding &amp; CRM',
    'Pipeline konten dari ide sampai tayang. Database relasi tetap hanya hidup di Network.',
    `<button class="btn gold sm" onclick="openForm('CNT')">${ic('plus')} Konten</button>
     <button class="btn ghost sm" onclick="openImport('CNT')">${ic('doc')} Impor</button>
     <button class="btn ghost sm" onclick="go('network')">Relasi → Network</button>`);
  if(!all.length) return head + emptyCard('mega','pink','Pipeline masih kosong',
    'Catat ide konten beserta kanal dan pilarnya. Statusnya bergerak Ide → Draft → Menunggu review → Terjadwal → Tayang, dan yang lewat tanggal tayang akan ditagih.',
    `<button class="btn solid" onclick="openForm('CNT')">${ic('plus')} Ide pertama</button>
     <button class="btn gold" onclick="openImport('CNT')">${ic('doc')} Impor dari Sheets</button>`) + demoTail(BRD_BODY);

  const T = todayISO(), late = cntLate();
  const wk = all.filter(c => c.status === 'Terjadwal' && c.date && c.date >= T && c.date <= shiftISO(T,7));
  const pub30 = all.filter(c => c.status === 'Tayang' && c.date && daysBetween(c.date, T) <= 30 && c.date <= T);
  const noDate = all.filter(c => !c.date && c.status !== 'Ide');
  const byChan = {}, byPil = {};
  all.forEach(c => { byChan[c.channel || '—'] = (byChan[c.channel || '—'] || 0) + 1;
                     if(c.pillar) byPil[c.pillar] = (byPil[c.pillar] || 0) + 1; });
  const mxC = Math.max.apply(null, Object.values(byChan)) || 1;
  const upcoming = all.filter(c => c.date && c.date >= T && c.status !== 'Tayang')
    .sort((a,b) => a.date < b.date ? -1 : 1).slice(0, 10);

  return head +
  (late.length ? `<div class="statebar del" style="margin-bottom:18px">
    <span class="dbadge" style="background:var(--red)">MENAGIH</span>
    <div style="flex:1;min-width:220px"><b>${late.length} konten lewat tanggal tayang</b> tetapi statusnya belum Tayang.</div>
  </div>` : '') +
  kpiRow([['Total konten', all.length, 'pink','mega'],
          ['Tayang 30 hari', pub30.length, 'green','check'],
          ['Terjadwal 7 hari', wk.length, 'purple','clock'],
          ['Lewat tanggal', late.length, late.length?'red':'gray','flag']]) + `

  <div class="card" style="margin-bottom:18px">
    ${cardH('mega','Pipeline','pink',`<button class="btn gold sm" onclick="openForm('CNT')">${ic('plus')} Konten</button>`)}
    ${boardHTML('cnt')}
  </div>

  <div class="g g21 top" style="margin:0 0 18px">
    <div class="card">
      ${cardH('clock','Kalender tayang','purple',`<span class="mini">${upcoming.length} akan datang</span>`)}
      ${upcoming.length ? `<div class="tl">${upcoming.map(c => `
        <div class="tl-i" onclick="recDetail('${c.id}')">
          <span class="tm">${dOnly(c.date).slice(0,6)}</span>
          <span class="bar" style="background:${CV(CNT_COLOR[c.status] || 'gray')}"></span>
          <span class="bd"><b>${h(c.n)}</b><span>${h(c.channel || '—')} · ${h(c.status)}</span></span>
        </div>`).join('')}</div>`
        : '<p class="sub" style="margin:0">Belum ada konten dengan tanggal tayang ke depan.</p>'}
      ${noDate.length ? `<div class="card-f"><span class="mini">${noDate.length} konten sudah lewat tahap Ide tetapi belum punya tanggal tayang.</span></div>` : ''}
    </div>
    <div class="card">
      ${cardH('chart','Kanal & pilar','pink')}
      <div class="mini" style="margin-bottom:8px;font-weight:700">KANAL</div>
      ${Object.keys(byChan).sort((a,b) => byChan[b] - byChan[a]).map(k => barLine(k, byChan[k], mxC, 'pink')).join('')}
      ${Object.keys(byPil).length ? `<div class="mini" style="margin:14px 0 8px;font-weight:700">PILAR</div>
        ${Object.keys(byPil).sort((a,b) => byPil[b] - byPil[a]).map(k =>
          barLine(k, byPil[k], Math.max.apply(null, Object.values(byPil)), 'purple')).join('')}` : ''}
      <div class="card-f"><span class="mini">Pilar yang tidak pernah muncul di pipeline adalah pilar yang sebenarnya tidak Anda jalankan.</span></div>
    </div>
  </div>` + demoTail(BRD_BODY, 'Angka jangkauan contoh', 'KPI jangkauan dan followers di bawah ini masih data contoh.');
};

/* ================================================================
   ⑩ FAMILY — orang, momen, dan yang mendekat
   ================================================================ */
VIEWS.family = () => {
  const fam = recs('FAM'), evt = recs('EVT');
  const head = liveHead('Family', 'Kehadiran di rumah bukan sisa waktu — itu jadwal utama.',
    `<button class="btn gold sm" onclick="openForm('EVT')">${ic('plus')} Acara</button>
     <button class="btn ghost sm" onclick="openForm('FAM')">${ic('users')} Anggota</button>
     <span class="pill red">FAMILY</span>`);
  if(!fam.length && !evt.length) return head + emptyCard('users','pink','Ruang keluarga masih kosong',
    'Catat anggota keluarga beserta tanggal lahirnya, dan acara penting. Sistem akan mengingatkan ulang tahun dan momen yang mendekat — supaya tidak bergantung pada ingatan Anda di hari yang sibuk.',
    `<button class="btn solid" onclick="openForm('FAM')">${ic('plus')} Anggota pertama</button>
     <button class="btn gold" onclick="openForm('EVT')">${ic('gift')} Acara pertama</button>`) + demoTail(FAM_BODY);

  const T = todayISO();
  /* ulang tahun mendekat */
  const bdays = fam.filter(f => f.dob).map(f => Object.assign({ f }, nextAnniv(f.dob)))
    .filter(x => x.date).sort((a,b) => a.inDays - b.inDays);
  /* acara mendekat — termasuk yang berulang tahunan */
  const events = evt.map(e => {
    if(e.repeat === 'Setiap tahun'){ const n = nextAnniv(e.date); return n ? Object.assign({ e }, n) : null; }
    return e.date && e.date >= T ? { e, date: e.date, inDays: daysBetween(T, e.date) } : null;
  }).filter(Boolean).sort((a,b) => a.inDays - b.inDays);
  const soon = bdays.filter(x => x.inDays <= 60).concat(events.filter(x => x.inDays <= 60).map(x => x))
    .sort((a,b) => a.inDays - b.inDays);
  const needs = fam.filter(f => f.care);

  return head +
  (soon.filter(x => x.inDays <= 14).length ? `<div class="statebar" style="margin-bottom:18px">
    <span class="dbadge" style="background:var(--pink)">DEKAT</span>
    <div style="flex:1;min-width:220px"><b>${soon.filter(x => x.inDays <= 14).length} momen dalam 14 hari ke depan.</b>
      ${soon.filter(x => x.inDays <= 14).slice(0,3).map(x => h(x.f ? SCHEMA.FAM.t(x.f) : SCHEMA.EVT.t(x.e)) + ' (' + (x.inDays === 0 ? 'hari ini' : x.inDays + ' hari') + ')').join(' · ')}</div>
  </div>` : '') +
  kpiRow([['Anggota keluarga', fam.length, 'pink','users'],
          ['Acara tercatat', evt.length, 'purple','gift'],
          ['Momen 30 hari', soon.filter(x => x.inDays <= 30).length, 'orange','clock'],
          ['Tanpa tanggal lahir', fam.filter(f => !f.dob).length, fam.filter(f=>!f.dob).length?'orange':'green','flag']]) + `

  <div class="g g21 top" style="margin:0 0 18px">
    <div class="card">
      ${cardH('clock','Yang mendekat','pink',`<span class="mini">60 hari ke depan</span>`)}
      ${soon.length ? `<div class="rows">${soon.slice(0,12).map(x => {
        const isB = !!x.f;
        return `<div class="row-i" style="align-items:flex-start" onclick="recDetail('${isB ? x.f.id : x.e.id}')">
          <span class="pill ${x.inDays <= 7 ? 'pink' : 'gray'}" style="margin-top:1px">${x.inDays === 0 ? 'hari ini' : x.inDays + ' hari'}</span>
          <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">${isB ? h(SCHEMA.FAM.t(x.f)) + ' ulang tahun ke-' + x.years : h(x.e.n)}</span>
            <span class="s">${dOnly(x.date)}${isB ? ' · ' + h(x.f.rel || '') : (x.e.type ? ' · ' + h(x.e.type) : '') + (x.e.loc ? ' · ' + h(x.e.loc) : '')}</span></span>
        </div>`; }).join('')}</div>`
        : '<p class="sub" style="margin:0">Tidak ada momen dalam 60 hari ke depan.</p>'}
      <div class="card-f"><span class="linkr" onclick="openForm('EVT')">Tambah acara →</span></div>
    </div>
    <div class="card">
      ${cardH('heart','Yang mereka butuhkan','red',`<span class="cnt">${needs.length}</span>`)}
      ${needs.length ? `<div class="rows">${needs.map(f => `
        <div class="row-i" style="align-items:flex-start" onclick="recDetail('${f.id}')">
          <span style="width:3px;align-self:stretch;border-radius:3px;background:var(--pink);flex:0 0 3px"></span>
          <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">${h(SCHEMA.FAM.t(f))}</span>
            <span class="s">${h(String(f.care).slice(0,110))}</span></span>
        </div>`).join('')}</div>`
        : '<p class="sub" style="margin:0">Kolom "yang sedang dia butuhkan dari saya" belum diisi pada siapa pun. Itu kolom yang paling berguna saat minggu sedang padat.</p>'}
    </div>
  </div>

  ${fam.length ? `<div class="card" style="margin-bottom:18px">
    ${cardH('users','Anggota keluarga','pink',`<button class="btn gold sm" onclick="openForm('FAM')">${ic('plus')} Anggota</button>`)}
    <div class="g g3" style="margin:0">${fam.map(f => {
      const b = f.dob ? nextAnniv(f.dob) : null;
      return `<div class="card click" style="padding:14px" onclick="recDetail('${f.id}')">
        <div class="flexr" style="gap:10px;margin-bottom:7px">
          ${avat(SCHEMA.FAM.t(f), 'pink')}
          <span style="min-width:0;flex:1"><span class="tt">${h(SCHEMA.FAM.t(f))}</span>
            <span class="ts">${h(f.rel || '—')}${f.act ? ' · ' + h(f.act) : ''}</span></span>
        </div>
        ${b ? `<span class="pill ${b.inDays <= 30 ? 'pink' : 'gray'}">ulang tahun ${b.inDays === 0 ? 'hari ini' : b.inDays + ' hari lagi'} · ke-${b.years}</span>`
            : '<span class="pill orange">tanggal lahir belum diisi</span>'}
      </div>`; }).join('')}</div>
  </div>` : ''}

  <div class="statebar" style="margin:0">
    <span class="dbadge" style="background:var(--red)">PRIVASI</span>
    <div style="flex:1;min-width:240px">Record di modul ini otomatis bertingkat privasi <code>FAMILY</code>.
      Bila nanti sistem ini dibagikan ke tim, isi modul ini tidak ikut terbuka.</div>
  </div>` + demoTail(FAM_BODY);
};

/* ================================================================
   ⑪ TRAVEL — perjalanan dan persiapannya
   ================================================================ */
SCHEMA.TRP.f.push({ k:'todoDone', l:'Persiapan yang sudah selesai', t:'text',
  hint:'Terisi otomatis saat Anda mencentang daftar persiapan.' });
const tripItems = t => String(t.todo || '').split('\n').map(s => s.trim()).filter(Boolean);
const tripDoneSet = t => String(t.todoDone || '').split(',').filter(x => x !== '');
function tripToggle(id, i){
  const t = recById(id); if(!t) return;
  const set = tripDoneSet(t), k = String(i);
  const at = set.indexOf(k);
  if(at >= 0) set.splice(at, 1); else set.push(k);
  t.todoDone = set.join(','); t._m.updated_at = new Date().toISOString();
  saveStore(); go(CUR);
}
function tripStat(t){
  const items = tripItems(t), done = tripDoneSet(t).length;
  const T = todayISO();
  const upcoming = t.start && t.start >= T;
  const ongoing = t.start && t.end && t.start <= T && t.end >= T;
  return { items, done, pct: items.length ? Math.round(Math.min(done, items.length) / items.length * 100) : null,
    upcoming, ongoing, past: t.end ? t.end < T : (t.start ? t.start < T : false),
    inDays: t.start ? daysBetween(T, t.start) : null,
    nights: (t.start && t.end) ? daysBetween(t.start, t.end) : null };
}

VIEWS.travel = () => {
  const all = recs('TRP');
  const head = liveHead('Travel', 'Perjalanan bisnis, keluarga, dan pembelajaran dalam satu tempat.',
    `<button class="btn gold sm" onclick="openForm('TRP')">${ic('plus')} Perjalanan</button>
     <button class="btn ghost sm" onclick="openImport('TRP')">${ic('doc')} Impor</button>`);
  if(!all.length) return head + emptyCard('plane','blue','Belum ada perjalanan tercatat',
    'Catat tujuan, tanggal, keperluan, anggaran, dan daftar persiapan. Daftar persiapan bisa dicentang langsung dari halaman ini.',
    `<button class="btn solid" onclick="openForm('TRP')">${ic('plus')} Perjalanan pertama</button>`) + demoTail(TRV_BODY);

  const stats = all.map(t => Object.assign({ t }, tripStat(t)));
  const next = stats.filter(x => x.upcoming || x.ongoing).sort((a,b) => (a.t.start || '9') < (b.t.start || '9') ? -1 : 1);
  const past = stats.filter(x => x.past).sort((a,b) => (a.t.start || '') < (b.t.start || '') ? 1 : -1);
  const budget = all.reduce((s,t) => s + (Number(t.budget) || 0), 0);
  const active = next[0];

  return head + kpiRow([
    ['Perjalanan mendatang', next.length, 'blue','plane'],
    ['Berikutnya', active ? (active.ongoing ? 'sedang berjalan' : active.inDays + ' hari') : '—', 'purple','clock'],
    ['Riwayat', past.length, 'gray','layers'],
    ['Total anggaran tercatat', budget ? 'Rp ' + budget + ' Jt' : '—', 'green','wallet']]) + `

  ${active ? `<div class="card" style="margin-bottom:18px;border-color:var(--blue)">
    ${cardH('plane', (active.ongoing ? 'Sedang berjalan: ' : 'Berikutnya: ') + h(SCHEMA.TRP.t(active.t)), 'blue',
      `<span class="pill blue">${active.ongoing ? 'berlangsung' : relDay(active.t.start)}</span>
       <button class="btn ghost sm" style="margin-left:9px" onclick="recDetail('${active.t.id}')">Detail</button>`)}
    <dl class="kv" style="margin-bottom:14px">
      <dt>Tujuan</dt><dd>${h(active.t.dest || '—')}</dd>
      <dt>Tanggal</dt><dd>${active.t.start ? dOnly(active.t.start) : '—'}${active.t.end ? ' — ' + dOnly(active.t.end) : ''}${active.nights ? ' · ' + active.nights + ' hari' : ''}</dd>
      <dt>Keperluan</dt><dd>${h(active.t.purpose || '—')}</dd>
      ${active.t.who ? `<dt>Bersama</dt><dd>${h(active.t.who)}</dd>` : ''}
      ${active.t.budget ? `<dt>Anggaran</dt><dd>Rp ${h(active.t.budget)} Jt</dd>` : ''}
    </dl>
    <div class="flexr" style="gap:12px;margin-bottom:10px">
      <div style="flex:1"><div class="flexr" style="justify-content:space-between;margin-bottom:5px">
        <span class="mini">Persiapan</span><b>${active.items.length ? active.done + '/' + active.items.length : '—'}</b></div>
        <div class="bar" style="height:9px"><i style="width:${active.pct || 0}%;background:var(--green)"></i></div></div>
    </div>
    ${active.items.length ? active.items.map((it,i) => {
      const on = tripDoneSet(active.t).indexOf(String(i)) >= 0;
      return `<div class="tline" style="cursor:pointer" onclick="tripToggle('${active.t.id}',${i})">
        <span class="chk ${on?'on':''}" role="checkbox" tabindex="0" aria-checked="${on}"
          onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}">${ic('check')}</span>
        <span style="min-width:0;flex:1"><span class="tt" style="${on?'text-decoration:line-through;color:var(--text-3)':''}">${h(it)}</span></span>
      </div>`; }).join('')
      : `<p class="sub" style="margin:0">Belum ada daftar persiapan. Isi kolom "Yang harus disiapkan" — satu langkah per baris — lalu bisa dicentang di sini.</p>`}
  </div>` : ''}

  <div class="g g21 top" style="margin:0 0 18px">
    <div class="card">
      ${cardH('plane','Perjalanan mendatang','blue',`<button class="btn gold sm" onclick="openForm('TRP')">${ic('plus')} Perjalanan</button>`)}
      ${next.length ? `<div class="rows">${next.map(x => `
        <div class="row-i" style="align-items:flex-start" onclick="recDetail('${x.t.id}')">
          <span class="pill ${x.ongoing ? 'green' : x.inDays <= 14 ? 'blue' : 'gray'}" style="margin-top:1px">${x.ongoing ? 'berlangsung' : x.inDays + ' hari'}</span>
          <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">${h(SCHEMA.TRP.t(x.t))}</span>
            <span class="s">${[h(x.t.dest||''), x.t.start ? dOnly(x.t.start) : '', h(x.t.purpose||''), x.pct !== null ? 'persiapan ' + x.pct + '%' : ''].filter(Boolean).join(' · ')}</span></span>
        </div>`).join('')}</div>`
        : '<p class="sub" style="margin:0">Tidak ada perjalanan yang dijadwalkan.</p>'}
    </div>
    <div class="card">
      ${cardH('layers','Riwayat perjalanan','gray',`<span class="cnt">${past.length}</span>`)}
      ${past.length ? `<div class="rows">${past.slice(0,10).map(x => `
        <div class="row-i" onclick="recDetail('${x.t.id}')">
          <span style="width:3px;align-self:stretch;border-radius:3px;background:var(--gray);flex:0 0 3px"></span>
          <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">${h(SCHEMA.TRP.t(x.t))}</span>
            <span class="s">${[h(x.t.dest||''), x.t.start ? dOnly(x.t.start) : '', x.t.budget ? 'Rp ' + h(x.t.budget) + ' Jt' : ''].filter(Boolean).join(' · ')}</span></span>
        </div>`).join('')}</div>`
        : '<p class="sub" style="margin:0">Belum ada perjalanan yang sudah lewat.</p>'}
    </div>
  </div>` + demoTail(TRV_BODY);
};

/* ================================================================
   ⑫ WELLBEING — tren dari check-in Anda sendiri
   ================================================================ */
function wellStats(){
  const T = todayISO();
  const logs = recs('LOG').filter(l => l.date).sort((a,b) => a.date < b.date ? 1 : -1);
  const last30 = logs.filter(l => daysBetween(l.date, T) <= 30 && l.date <= T);
  const last7 = logs.filter(l => daysBetween(l.date, T) <= 7 && l.date <= T);
  const avg = a => a.length ? Math.round(a.reduce((s,l) => s + (Number(l.energy)||0), 0) / a.length * 10) / 10 : null;
  /* rentetan hari berturut-turut yang punya check-in, dihitung mundur dari hari ini */
  let streak = 0, cur = T;
  const set = {}; logs.forEach(l => set[l.date] = 1);
  if(!set[T]) cur = shiftISO(T, -1);
  while(set[cur]){ streak++; cur = shiftISO(cur, -1); }
  return { logs, last30, last7, avg30: avg(last30), avg7: avg(last7), streak,
    coverage: Math.round(last30.length / 30 * 100),
    best: last30.slice().sort((a,b) => (Number(b.energy)||0) - (Number(a.energy)||0))[0],
    low: last30.slice().sort((a,b) => (Number(a.energy)||0) - (Number(b.energy)||0))[0] };
}

VIEWS.wellbeing = () => {
  const s = wellStats();
  const head = liveHead('Wellbeing', 'Tren dari check-in harian Anda sendiri — angka Anda, bukan tafsiran saya.',
    `<button class="btn gold sm" onclick="openForm('LOG')">${ic('plus')} Check-in</button>
     <span class="pill red">AJI_ONLY</span>`);
  if(!s.logs.length) return head + emptyCard('heart','green','Belum ada check-in',
    'Wellbeing di sini bukan pelacak kesehatan — ia hanya menampilkan kembali angka energi, fokus, dan refleksi yang Anda catat sendiri di My Day, supaya polanya terlihat dari waktu ke waktu.',
    `<button class="btn solid" onclick="openForm('LOG')">${ic('sun')} Check-in pertama</button>
     <button class="btn ghost" onclick="go('myday')">Buka My Day</button>`) + demoTail(WEL_BODY);

  const trend = s.last30.slice(0, 14).reverse();
  const labels = trend.map(l => { const d = new Date(l.date + 'T12:00:00'); return d.getDate(); });
  const eColor = s.avg7 === null ? 'gray' : s.avg7 >= 7 ? 'green' : s.avg7 >= 4 ? 'yellow' : 'red';
  const wins = s.last30.filter(l => l.win).slice(0, 6);
  const blocks = s.last30.filter(l => l.block).slice(0, 6);

  return head + kpiRow([
    ['Rata-rata 7 hari', s.avg7 === null ? '—' : String(s.avg7).replace('.',',') + '/10', eColor, 'bolt'],
    ['Rata-rata 30 hari', s.avg30 === null ? '—' : String(s.avg30).replace('.',',') + '/10', 'blue', 'chart'],
    ['Rentetan check-in', s.streak + ' hari', s.streak >= 5 ? 'green' : 'gray', 'fire'],
    ['Tercatat dari 30 hari', s.coverage + '%', s.coverage >= 70 ? 'green' : s.coverage >= 40 ? 'orange' : 'red', 'check']]) + `

  <div class="card" style="margin-bottom:18px">
    ${cardH('chart','Energi 14 check-in terakhir','green',`<span class="mini">tinggi batang = angka yang Anda catat</span>`)}
    ${trend.length > 1 ? bars(trend.map(l => Number(l.energy) || 0), 'green', 96, labels)
      : '<p class="sub" style="margin:0">Butuh minimal dua check-in untuk menggambar tren.</p>'}
    <div class="card-f"><span class="mini">Grafik ini menampilkan kembali angka Anda sendiri. Sistem tidak menyimpulkan apa pun tentang kesehatan dari sini —
      untuk itu, orangnya adalah dokter, bukan perangkat lunak.</span></div>
  </div>

  <div class="g g21 top" style="margin:0 0 18px">
    <div class="card">
      ${cardH('sun','Fokus yang Anda tetapkan','blue',`<span class="mini">${s.last30.filter(l => l.focus).length} dari ${s.last30.length} check-in</span>`)}
      ${s.last30.filter(l => l.focus).length ? `<div class="rows">${s.last30.filter(l => l.focus).slice(0,8).map(l => `
        <div class="row-i" style="align-items:flex-start" onclick="mdGo('${l.date}')">
          <span class="pill ${(Number(l.energy)||0) >= 7 ? 'green' : (Number(l.energy)||0) >= 4 ? 'yellow' : 'red'}" style="margin-top:1px">${h(String(l.energy||'—'))}</span>
          <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">${h(l.focus)}</span>
            <span class="s">${dOnly(l.date)}</span></span>
        </div>`).join('')}</div>`
        : '<p class="sub" style="margin:0">Kolom fokus belum pernah diisi. Satu kalimat per hari sudah cukup untuk membuat pola ini terbaca.</p>'}
    </div>
    <div class="stack">
      <div class="card">
        ${cardH('check','Kemenangan yang Anda catat','green',`<span class="cnt">${wins.length}</span>`)}
        ${wins.length ? `<div class="rows">${wins.slice(0,4).map(l => `
          <div class="row-i" style="align-items:flex-start;cursor:pointer" onclick="mdGo('${l.date}')">
            <span style="width:3px;align-self:stretch;border-radius:3px;background:var(--green);flex:0 0 3px"></span>
            <span style="min-width:0"><span class="t" style="font-size:12.5px">${h(String(l.win).slice(0,90))}</span>
              <span class="s">${dOnly(l.date)}</span></span></div>`).join('')}</div>`
          : '<p class="sub" style="margin:0">Belum ada yang dicatat.</p>'}
      </div>
      <div class="card">
        ${cardH('flag','Hambatan yang berulang','red',`<span class="cnt">${blocks.length}</span>`)}
        ${blocks.length ? `<div class="rows">${blocks.slice(0,4).map(l => `
          <div class="row-i" style="align-items:flex-start;cursor:pointer" onclick="mdGo('${l.date}')">
            <span style="width:3px;align-self:stretch;border-radius:3px;background:var(--red);flex:0 0 3px"></span>
            <span style="min-width:0"><span class="t" style="font-size:12.5px">${h(String(l.block).slice(0,90))}</span>
              <span class="s">${dOnly(l.date)}</span></span></div>`).join('')}</div>`
          : '<p class="sub" style="margin:0">Belum ada yang dicatat.</p>'}
      </div>
    </div>
  </div>

  ${s.coverage < 50 ? `<div class="statebar" style="margin:0">
    <span class="dbadge" style="background:var(--orange)">CAKUPAN</span>
    <div style="flex:1;min-width:220px">Baru <b>${s.last30.length} dari 30 hari</b> terakhir yang punya check-in.
      Rata-rata di atas dihitung hanya dari hari yang tercatat — bukan dari seluruh bulan.</div>
  </div>` : ''}` + demoTail(WEL_BODY);
};

/* ================================================================
   ⑬ KNOWLEDGE — second brain
   ================================================================ */
let KQ = { q:'', cat:'', tag:'' };
function kwCapture(){
  const el = document.getElementById('kwIn');
  const v = el ? (el.value || '').trim() : '';
  if(!v){ toast('Tulis dulu sesuatu untuk ditangkap'); return; }
  const now = new Date().toISOString();
  const r = { id: nextId('KNW'), type:'KNW', n: v.slice(0, 80), cat:'Lainnya', summary: v };
  r._m = { created_at:now, updated_at:now, created_by:DB.owner.name, updated_by:DB.owner.name, status:'ACTIVE',
    source_type:'MANUAL_ENTRY', source_id:'', source_url:'', privacy_level:'PRIVATE', is_dummy:false, is_archived:false, tags:[] };
  (STORE.rec.KNW = STORE.rec.KNW || []).unshift(r);
  logAct('CREATE', r, 'quick capture'); saveStore();
  el.value = '';
  toast('Tertangkap sebagai ' + r.id + ' — lengkapi kategori dan pelajarannya kapan saja');
  go('knowledge');
}
function kwTags(){
  const m = {};
  recs('KNW').forEach(k => String(k.tags || '').split(',').map(s => s.trim()).filter(Boolean)
    .forEach(t => m[t] = (m[t] || 0) + 1));
  return m;
}
function kwFiltered(){
  let list = recs('KNW');
  if(KQ.cat) list = list.filter(k => k.cat === KQ.cat);
  if(KQ.tag) list = list.filter(k => String(k.tags || '').toLowerCase().includes(KQ.tag.toLowerCase()));
  if(KQ.q){ const q = KQ.q.toLowerCase();
    list = list.filter(k => (k.n + ' ' + (k.summary||'') + ' ' + (k.lesson||'') + ' ' + (k.src||'') + ' ' + (k.apply||'') + ' ' + (k.tags||'')).toLowerCase().includes(q)); }
  return list;
}
function kwAsk(){
  const el = document.getElementById('kwAskIn');
  const q = el ? (el.value || '').trim() : '';
  if(!q){ toast('Tulis pertanyaannya dulu'); return; }
  const terms = q.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const scored = recs('KNW').map(k => {
    const blob = (k.n + ' ' + (k.summary||'') + ' ' + (k.lesson||'') + ' ' + (k.apply||'') + ' ' + (k.tags||'')).toLowerCase();
    const words = blob.split(/[^a-z0-9]+/).filter(Boolean);
    /* kata utuh, bukan potongan — supaya "cara" tidak cocok dengan "tercapai" */
    return { k, score: terms.filter(t => words.indexOf(t) >= 0).length };
  }).filter(x => x.score > 0).sort((a,b) => b.score - a.score).slice(0, 5);
  modal('Jawaban dari arsip Anda', h(q),
    scored.length
      ? `<p class="sub" style="margin-bottom:14px">${scored.length} catatan Anda menyinggung pertanyaan ini. Saya tidak menambahkan pengetahuan dari luar —
           yang di bawah ini kata-kata Anda sendiri.</p>` +
        scored.map(x => `<div class="card" style="padding:14px;margin-bottom:11px">
          <div class="flexr" style="gap:7px;margin-bottom:6px">
            ${idPill(x.k.id)}<span class="pill purple">${h(x.k.cat || '—')}</span>
            <span class="mini" style="margin-left:auto">${x.score} kata cocok</span></div>
          <b style="font-size:14px;line-height:1.4;display:block">${h(x.k.n)}</b>
          ${x.k.lesson ? `<div style="margin-top:8px"><div class="mini" style="font-weight:700">PELAJARAN YANG ANDA AMBIL</div>
            <div style="font-size:13px;margin-top:3px">${h(x.k.lesson).replace(/\n/g,'<br>')}</div></div>` : ''}
          ${x.k.summary ? `<div style="margin-top:8px"><div class="mini" style="font-weight:700">RINGKASAN</div>
            <div class="sub" style="margin:3px 0 0;font-size:12.5px">${h(String(x.k.summary).slice(0,220))}</div></div>` : ''}
          <div class="card-f"><button class="btn ghost sm" onclick="closeModal();recDetail('${x.k.id}')">Buka catatan →</button></div>
        </div>`).join('')
      : `<p class="sub">Tidak ada catatan Anda yang menyinggung itu. Saya tidak akan menjawabnya dari pengetahuan umum —
           arsip ini hanya berisi apa yang Anda tulis sendiri.</p>
         <button class="btn gold sm" style="margin-top:12px" onclick="closeModal();openForm('KNW')">${ic('plus')} Tulis catatan tentang ini</button>`,
    `<button class="btn ghost" onclick="closeModal()">Tutup</button>`, true);
}

VIEWS.knowledge = () => {
  const all = recs('KNW');
  const head = liveHead('Knowledge', 'Second brain — semua yang perlu diingat sistem, bukan Anda.',
    `<button class="btn gold sm" onclick="openForm('KNW')">${ic('plus')} Catatan</button>
     <button class="btn ghost sm" onclick="openImport('KNW')">${ic('doc')} Impor</button>`);
  const capture = `<div class="card" style="margin-bottom:18px">
    ${cardH('bolt','Tangkap cepat','gold',`<span class="mini">satu baris sudah cukup — rapikan nanti</span>`)}
    <div class="flexr" style="gap:8px">
      <input id="kwIn" type="text" placeholder="Pelajaran, kutipan, ide, atau apa pun yang tidak boleh hilang…"
        onkeydown="if(event.key==='Enter'){event.preventDefault();kwCapture()}"
        style="flex:1;min-width:180px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:10px;padding:9px 12px;font:inherit;font-size:13.5px;outline:0">
      <button class="btn solid" onclick="kwCapture()">${ic('plus')} Tangkap</button>
    </div>
    <div class="mini" style="margin-top:8px">Tersimpan langsung sebagai catatan dengan kategori "Lainnya". Kategori dan kolom pelajaran bisa dilengkapi kapan saja.</div>
  </div>`;

  if(!all.length) return head + capture + emptyCard('book','purple','Arsip masih kosong',
    'Catatan di sini punya satu kolom yang membedakannya dari tumpukan: <b>pelajaran yang saya ambil</b>. Itu bagian yang masih berguna setahun lagi, saat ringkasannya sendiri sudah terlupa.',
    `<button class="btn solid" onclick="openForm('KNW')">${ic('plus')} Catatan pertama</button>
     <button class="btn gold" onclick="openImport('KNW')">${ic('doc')} Impor dari Sheets</button>`) + demoTail(KNW_BODY);

  const list = kwFiltered();
  const cats = []; all.forEach(k => { if(k.cat && cats.indexOf(k.cat) < 0) cats.push(k.cat); });
  const tags = kwTags();
  const noLesson = all.filter(k => !k.lesson);
  const recent30 = all.filter(k => daysBetween(k._m.created_at.slice(0,10), todayISO()) <= 30).length;

  return head + capture + kpiRow([
    ['Catatan tersimpan', all.length, 'purple','book'],
    ['Punya pelajaran', all.length - noLesson.length, 'green','bulb'],
    ['Ditambah 30 hari', recent30, 'blue','plus'],
    ['Tag berbeda', Object.keys(tags).length, 'gold','layers']]) + `

  <div class="card" style="margin-bottom:18px">
    ${cardH('spark','Tanya arsip saya','purple')}
    <div class="flexr" style="gap:8px">
      <input id="kwAskIn" type="text" placeholder="Misal: apa pelajaran saya soal delegasi?"
        onkeydown="if(event.key==='Enter'){event.preventDefault();kwAsk()}"
        style="flex:1;min-width:180px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:10px;padding:9px 12px;font:inherit;font-size:13.5px;outline:0">
      <button class="btn pur" onclick="kwAsk()">${ic('spark')} Tanya</button>
    </div>
    <div class="mini" style="margin-top:8px">Mencari hanya di dalam catatan Anda sendiri. Bila tidak ketemu, sistem mengatakan tidak ketemu — bukan menjawab dari pengetahuan umum.</div>
  </div>

  <div class="card" style="margin-bottom:18px">
    ${cardH('book','Arsip','purple',
      `<span class="mini">${list.length} dari ${all.length}</span>
       <button class="btn gold sm" style="margin-left:9px" onclick="openForm('KNW')">${ic('plus')} Catatan</button>`)}
    <div class="flexr" style="gap:8px;margin-bottom:11px">
      <input type="text" value="${h(KQ.q)}" placeholder="Cari di judul, ringkasan, pelajaran, sumber…" oninput="KQ.q=this.value;renderKwList()"
        style="flex:1;min-width:170px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:10px;padding:7px 11px;font:inherit;font-size:13px;outline:0">
      <select onchange="KQ.cat=this.value;go('knowledge')" style="border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:10px;padding:6px 10px;font:inherit;font-size:12.5px">
        <option value="">Semua kategori</option>${cats.map(c => `<option value="${h(c)}"${KQ.cat===c?' selected':''}>${h(c)}</option>`).join('')}</select>
      ${(KQ.q||KQ.cat||KQ.tag) ? `<button class="btn ghost sm" onclick="KQ={q:'',cat:'',tag:''};go('knowledge')">Bersihkan</button>` : ''}
    </div>
    ${Object.keys(tags).length ? `<div class="chips" style="margin-bottom:12px">${Object.keys(tags).sort((a,b) => tags[b] - tags[a]).slice(0,14).map(t =>
      `<button class="chip ${KQ.tag===t?'on':''}" onclick="KQ.tag='${esc(t)}';go('knowledge')">${h(t)} · ${tags[t]}</button>`).join('')}</div>` : ''}
    <div id="kwList">${kwListHTML(list)}</div>
  </div>

  ${noLesson.length ? `<div class="statebar" style="margin:0">
    <span class="dbadge" style="background:var(--orange)">CATATAN</span>
    <div style="flex:1;min-width:220px"><b>${noLesson.length} catatan belum mengisi "pelajaran yang saya ambil".</b>
      Tanpa itu, catatan hanya menyimpan apa yang Anda baca — bukan apa yang berubah karenanya.</div>
  </div>` : ''}` + demoTail(KNW_BODY);
};
function kwListHTML(list){
  if(!list.length) return '<div class="empty">Tidak ada catatan yang cocok.</div>';
  return `<div class="g g2" style="margin:0">${list.slice(0, 30).map(k => `
    <div class="card click" style="padding:15px" onclick="recDetail('${k.id}')">
      <div class="flexr" style="gap:7px;margin-bottom:7px">
        <span class="pill purple">${h(k.cat || '—')}</span>
        ${k.lesson ? '<span class="pill green">ada pelajaran</span>' : '<span class="pill orange">belum ada pelajaran</span>'}
        <span class="mini" style="margin-left:auto">${dOnly(k._m.created_at.slice(0,10))}</span>
      </div>
      <b style="font-size:14px;line-height:1.4;display:block">${h(k.n)}</b>
      ${k.summary ? `<p class="sub" style="margin:6px 0 0;font-size:12.5px">${h(String(k.summary).slice(0,150))}${String(k.summary).length > 150 ? '…' : ''}</p>` : ''}
      ${k.src ? `<div class="mini" style="margin-top:7px">Sumber: ${h(k.src)}</div>` : ''}
    </div>`).join('')}</div>
    ${list.length > 30 ? `<div class="mini" style="margin-top:10px">Menampilkan 30 dari ${list.length}.</div>` : ''}`;
}
function renderKwList(){
  const el = document.getElementById('kwList');
  if(el) el.innerHTML = kwListHTML(kwFiltered());
}

