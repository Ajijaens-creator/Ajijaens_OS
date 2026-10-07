/* ============ VIEWS: SOCIAL · TRAVEL · OS · BRAND · FINANCE · OPERATIONS · PROJECTS · AI ============ */

VIEWS.social = () => SOC_HEAD() + SOC_BODY();
function SOC_HEAD(){ return `
  <div class="page-h"><div><h1>Social Movement</h1><p>Dampak, komunitas, dan kontribusi — warisan di luar bisnis.</p></div>
    <div class="sp">${srcPill(false)}<button class="btn gold sm" onclick="openForm('MOV')">${ic('plus')} New Movement</button></div></div>`;
}
function SOC_BODY(){ const k=DB.social.reduce((a,s)=>({impact:a.impact+s.kpi.impact,trained:a.trained+s.kpi.trained,jobs:a.jobs+s.kpi.jobs,events:a.events+s.kpi.events,partners:a.partners+s.kpi.partners}),{impact:0,trained:0,jobs:0,events:0,partners:0});
  return `
  ${dummyBar('DUMMY-2026-08-25-005','Social Movement')}
  <div class="g g4">
    ${[['Orang Terdampak',k.impact.toLocaleString('id-ID'),'orange','globe'],['Terapis Dilatih',k.trained,'green','users'],
       ['Lapangan Kerja',k.jobs,'teal','brief'],['Event & Mitra',k.events+' / '+k.partners,'yellow','flag']].map(x=>
      `<div class="card kpi">${cardH(x[3],x[0],x[2])}<div class="val">${x[1]}</div><div class="lbl">Kumulatif 2026</div></div>`).join('')}
  </div>

  <div class="g g2">${DB.social.map(s=>`
    <div class="card click" onclick="socDetail('${s.id}')">
      <div class="flexr" style="margin-bottom:10px">
        <div class="ic" style="width:36px;height:36px;border-radius:11px;display:grid;place-items:center;background:${CT(s.c)};color:${CV(s.c)};flex:0 0 36px">${ic('globe')}</div>
        <div style="min-width:0"><b style="font-size:15.5px;display:block">${s.n}</b><span class="mini">${s.role}</span></div>
        <span class="pill ${s.c}" style="margin-left:auto">${s.st}</span></div>
      <p class="sub">${s.d}</p>
      <div class="g g4" style="gap:10px;margin:14px 0 0">
        ${[['Impact',s.kpi.impact],['Dilatih',s.kpi.trained],['Kerja',s.kpi.jobs],['Event',s.kpi.events]].map(x=>
          `<div><div class="mini">${x[0]}</div><b style="font-size:15px">${x[1]}</b></div>`).join('')}</div>
    </div>`).join('')}</div>

  <div class="g g21">
    <div class="card">${cardH('chart','Impact Metrics 2026','orange')}
      ${bars([180,240,310,420,560,690,830,1020,1240,1480,1720,1840],'orange',96,['J','F','M','A','M','J','J','A','S','O','N','D'])}
      <div class="card-f mini">Kurva kumulatif orang terdampak — dipimpin Bali Spa Bersatu.</div></div>
    <div class="card">${cardH('users','Tim & Relawan','teal')}
      <div class="rows">${['p_dewi','p_wayan','p_gede'].map(id=>{const p=P(id);return `<div class="row-i" onclick="personDetail('${id}')">${avat(p.n,p.c)}
        <span style="min-width:0"><span class="t">${p.n}</span><span class="s">${p.pos} · ${p.org}</span></span></div>`}).join('')}</div>
      <div class="card-f"><span class="linkr" onclick="go('network')">Semua kontak gerakan →</span></div></div>
  </div>`;
};
function socDetail(id){const s=DB.social.find(x=>x.id===id);if(!s)return;
  modal(s.n,`${s.role} · ${s.st}${s.members?' · '+s.members+' anggota':''}`,
   `<p class="sub" style="color:var(--text)">${s.d}</p><div class="sep" style="margin:16px 0"></div>
    <div class="scorebar">${[['Orang terdampak',s.kpi.impact,2000,'orange'],['Terapis dilatih',s.kpi.trained,500,'green'],['Lapangan kerja',s.kpi.jobs,300,'teal'],['Event',s.kpi.events,20,'yellow'],['Mitra',s.kpi.partners,25,'purple']].map(x=>
      `<div class="l"><b>${x[0]}</b><div class="bar"><i style="width:${Math.min(100,x[1]/x[2]*100)}%;background:${CV(x[3])}"></i></div><i class="v">${x[1]}</i></div>`).join('')}</div>`,
   `<button class="btn gold" onclick="closeModal();go('projects')">Proyek terkait</button><button class="btn ghost" onclick="closeModal();go('knowledge')">Dokumen</button>`);}

/* ---------------- TRAVEL ---------------- */
VIEWS.travel = () => TRV_HEAD() + TRV_BODY();
function TRV_HEAD(){ return `
  <div class="page-h"><div><h1>Travel</h1><p>Perjalanan bisnis, keluarga, dan pembelajaran dalam satu workspace.</p></div>
    <div class="sp">${srcPill(false)}<button class="btn gold sm" onclick="openForm('TRP')">${ic('plus')} New Trip</button></div></div>`;
}
function TRV_BODY(){ const n=DB.trips[0];
  return `
  ${dummyBar('DUMMY-2026-08-25-004','Travel')}
  <div class="g g21">
    <div class="hero" style="background:linear-gradient(135deg,#14477E,#2874B8 52%,#63B0DC)">
      <div class="z"><div class="lb">Next Trip · ${n.type}</div><h3>${n.dest}, ${n.country}</h3>
        <p>${n.dep} — ${n.ret} · ${n.in} hari lagi</p>
        <div style="display:flex;gap:14px;margin-top:14px;font-size:12px;opacity:.92;flex-wrap:wrap">
          <span>✈️ ${n.flight}</span><span>🏨 ${n.hotel}</span><span>⛅ ${n.wx}</span><span>👤 ${n.comp}</span></div>
        <button class="btn-w" style="margin-top:16px" onclick="tripDetail('${n.id}')">Buka Trip Workspace →</button></div></div>
    <div class="card">${cardH('flag','Tujuan Perjalanan','blue')}
      <p class="sub" style="color:var(--text)">${n.purpose}</p>
      <div class="sep" style="margin:14px 0"></div>
      <div class="card-h"><h3>Meeting terjadwal</h3></div>
      <div class="rows">${n.meetings.map(id=>{const p=P(id);return `<div class="row-i" onclick="personDetail('${id}')">${avat(p.n,p.c)}
        <span style="min-width:0"><span class="t">${p.n}</span><span class="s">${p.org}</span></span></div>`}).join('')}</div>
      <div class="card-f flexr"><span class="pill gold">Budget ${n.budget}</span><span class="mini">Dokumen lengkap</span></div></div>
  </div>

  <div class="sect"><div><h2>Semua Perjalanan</h2><p>${DB.trips.length} trip terjadwal</p></div></div>
  <div class="g g4">${DB.trips.map(t=>`
    <div class="card click" onclick="tripDetail('${t.id}')">
      <div class="flexr" style="margin-bottom:10px"><span class="pill ${t.c}">${t.type}</span><span class="mini" style="margin-left:auto">${t.in} hari lagi</span></div>
      <b style="font-size:18px;font-family:var(--fd)">${t.dest}</b><div class="mini">${t.country}</div>
      <div class="sep" style="margin:11px 0"></div>
      <div class="mini">${t.dep} — ${t.ret}</div><div class="mini">👤 ${t.comp}</div>
      <div class="card-f flexr"><span class="pill gold">${t.budget}</span></div>
    </div>`).join('')}</div>`;
}
function tripDetail(id){const t=DB.trips.find(x=>x.id===id);if(!t)return;
  modal(`Trip Workspace — ${t.dest}`,`${t.type} · ${t.dep} — ${t.ret} · ${t.country}`,
   `<div class="flexr" style="margin-bottom:14px">${idPill(gid('TRP',DB.trips,id))}${srcPill(false)}</div>
    <div class="chips">${['Overview','Flights','Hotels','Itinerary','Meetings','Documents','Budget'].map((x,i)=>`<button class="chip ${i===0?'on':''}" onclick="[...this.parentNode.children].forEach(c=>c.classList.remove('on'));this.classList.add('on');toast('Tab ${x}')">${x}</button>`).join('')}</div>
    <dl class="kv"><dt>Tujuan</dt><dd>${t.purpose}</dd><dt>Penerbangan</dt><dd>${t.flight}</dd><dt>Hotel</dt><dd>${t.hotel}</dd>
      <dt>Pendamping</dt><dd>${t.comp}</dd><dt>Cuaca</dt><dd>${t.wx}</dd><dt>Budget</dt><dd>${t.budget}</dd></dl>
    <div class="sep" style="margin:16px 0"></div><div class="card-h"><h3>Itinerary</h3></div>
    <div class="tl">${t.itin.map(i=>`<div class="tl-i"><span class="tm" style="flex:0 0 62px">${i.d}</span><span class="bar" style="background:${CV(t.c)}"></span><span class="bd"><b style="font-weight:500;font-size:13px">${i.x}</b></span></div>`).join('')}</div>
    ${t.meetings.length?`<div class="sep" style="margin:16px 0"></div><div class="card-h"><h3>Kontak di ${t.dest}</h3></div>
    <div class="rows">${t.meetings.map(id=>{const p=P(id);return `<div class="row-i" onclick="closeModal();personDetail('${id}')">${avat(p.n,p.c)}<span><span class="t">${p.n}</span><span class="s">${p.org}</span></span></div>`}).join('')}</div>`:''}`,
   `<button class="btn gold" onclick="toast('Dokumen perjalanan dibuka')">Dokumen</button>
    <button class="btn ghost" onclick="toast('Expense tracker dibuka')">Expenses</button>
    <button class="btn solid" style="margin-left:auto" onclick="setMode('travel')">Aktifkan Travel Mode</button>`,true);}

/* ---------------- OPERATING SYSTEM (personal) ---------------- */
VIEWS.os = () => OS_HEAD() + OS_BODY();
function OS_HEAD(){ return `
  <div class="page-h"><div><h1>Operating System</h1><p>Sistem pribadi Aji — prinsip, aturan keputusan, ritme, dan log. Bukan operasional perusahaan.</p></div>
    <div class="sp"><button class="btn gold sm" onclick="openForm('DEC')">${ic('plus')} Catat Keputusan</button>
      <button class="btn ghost sm" onclick="openForm('GOL')">${ic('target')} Goal Baru</button>
      <button class="btn ghost sm" onclick="go('operations')">Cari Operations? →</button></div></div>`;
}
function OS_BODY(){ return `

  <div class="g g4">
    <div class="card kpi">${cardH('scale','Keputusan Menunggu','red')}<div class="val">${DB.decisions.length}</div><div class="lbl">Perlu keputusan Anda</div>
      <div class="card-f"><span class="linkr" onclick="document.getElementById('decs').scrollIntoView({behavior:'smooth'})">Lihat semua →</span></div></div>
    <div class="card kpi">${cardH('doc','Decision Log','gold')}<div class="val">${DB.decisionLog.length}</div><div class="lbl">Keputusan tercatat 2026</div></div>
    <div class="card kpi">${cardH('clock','Daily Rhythm','blue')}<div class="val" style="font-size:22px">3 blok</div><div class="lbl">Morning · Midday · Evening</div></div>
    <div class="card kpi">${cardH('shield','Prinsip Aktif','purple')}<div class="val">${Object.values(DB.principles).flat().length}</div><div class="lbl">Di 8 kategori</div></div>
  </div>

  <div class="card" id="decs" style="margin-bottom:18px">
    ${cardH('scale','Decisions Needed','red',`<span class="pill red">${DB.decisions.length} menunggu</span>`)}
    <div class="tw"><table class="tbl"><thead><tr><th>Keputusan</th><th>Unit</th><th>Deadline</th><th class="num">Dampak</th><th>Risiko</th><th></th></tr></thead>
    <tbody>${DB.decisions.map(d=>`<tr onclick="decDetail('${d.id}')"><td><b>${d.n}</b><div class="mini">${d.type}</div></td>
      <td class="mini">${d.unit}</td><td><span class="pill ${d.c}">${d.due}</span></td><td class="num">${d.impact}</td>
      <td><span class="pill ${d.risk==='High'?'red':d.risk==='Medium'?'orange':'green'}">${d.risk}</span></td>
      <td><button class="btn gold sm" onclick="event.stopPropagation();decDetail('${d.id}')">Review</button></td></tr>`).join('')}</tbody></table></div>
  </div>

  <div class="sect"><div><h2>Personal Principles</h2><p>Aturan yang membuat keputusan tidak bergantung pada suasana hati</p></div></div>
  <div class="g g2">${Object.entries(DB.principles).map(([k,v])=>`
    <div class="card">${cardH('shield',k,'gold')}
      <ol style="margin:0;padding-left:18px;font-size:13px;color:var(--text-2);line-height:1.75">${v.map(x=>`<li>${x}</li>`).join('')}</ol></div>`).join('')}</div>

  <div class="g g21">
    <div class="card">${cardH('doc','Decision Log','blue',`<button class="btn ghost sm" onclick="toast('Entri keputusan baru')">${ic('plus')} Entry</button>`)}
      <div class="tw"><table class="tbl"><thead><tr><th>Tanggal</th><th>Keputusan</th><th>Pilihan</th><th>Hasil</th></tr></thead>
      <tbody>${DB.decisionLog.map(l=>`<tr onclick="modal('${esc(l.n)}','${l.d} · Pilihan: ${l.ch}','<dl class=&quot;kv&quot;><dt>Alasan</dt><dd>${esc(l.why)}</dd><dt>Hasil</dt><dd>${esc(l.res)}</dd><dt>Review berikutnya</dt><dd>Kuartal depan</dd></dl>')">
        <td class="mini">${l.d}</td><td><b>${l.n}</b><div class="mini">${l.why}</div></td>
        <td><span class="pill ${l.ch==='Approve'?'green':l.ch==='Tolak'?'red':'orange'}">${l.ch}</span></td>
        <td class="mini" style="color:${CV(l.c)}">${l.res}</td></tr>`).join('')}</tbody></table></div></div>
    <div class="card">${cardH('clock','Daily Rhythm','teal',`<button class="btn ghost sm" onclick="toast('Ritme harian dapat diubah')">Edit</button>`)}
      ${Object.entries(DB.rhythm).map(([k,v])=>`<div style="margin-bottom:14px">
        <div class="pill ${k==='Morning'?'yellow':k==='Midday'?'blue':'purple'}" style="margin-bottom:7px">${k}</div>
        ${v.map(x=>`<div class="row-i" style="padding:5px 8px" onclick="toast('${esc(x)}')"><span style="width:5px;height:5px;border-radius:50%;background:var(--gold);flex:0 0 5px"></span><span class="t" style="font-size:12.5px;font-weight:500">${x}</span></div>`).join('')}</div>`).join('')}</div>
  </div>

  <div class="g g3">
    <div class="card">${cardH('users','Role Based Access','purple')}
      <div class="rows">${DB.roles.slice(0,7).map((r,i)=>`<div class="row-i" style="cursor:default"><span class="pill ${i===0?'gold':'gray'}">${i===0?'OWNER':'TEAM'}</span><span class="t" style="font-size:12.5px">${r}</span></div>`).join('')}</div>
      <div class="card-f"><span class="linkr" onclick="toast('${DB.roles.length} role terdefinisi di Aji OS')">Lihat ${DB.roles.length} role →</span></div></div>
    <div class="card">${cardH('shield','Privacy Level','red')}
      <div class="rows">${[['PUBLIC','Dapat dilihat siapa pun','gray'],['TEAM','Tim internal','blue'],['PRIVATE','Terbatas','orange'],['AJI ONLY','Hanya Aji','red'],['SENSITIVE','Terenkripsi + audit','purple']].map(x=>
        `<div class="row-i" style="cursor:default"><span class="pill ${x[2]}">${x[0]}</span><span class="s">${x[1]}</span></div>`).join('')}</div>
      <div class="card-f mini">Default AJI ONLY: Health, Family, Personal Finance, Personal Notes, Private Contacts, Reflection.</div></div>
    <div class="card">${cardH('cpu','Data Sources','blue')}
      <div class="rows">${DB.sources.map(s=>`<div class="row-i" style="cursor:default"><span style="width:8px;height:8px;border-radius:50%;background:${CV(s.c)};flex:0 0 8px"></span>
        <span style="min-width:0"><span class="t" style="font-size:12.5px">${s.n}</span></span><span class="rt mini">${s.st}</span></div>`).join('')}</div></div>
  </div>

  <div class="sect"><div><h2>Review Rhythm</h2><p>Morning brief, evening reflection, weekly review</p></div></div>
  <div class="g g3">
    <div class="card click" onclick="morningBrief()">${cardH('sun','Morning Dharma Briefing','yellow')}<p class="sub">Personal state, jadwal, prioritas, keluarga, business pulse, keuangan, keputusan, relasi, travel, risiko, rekomendasi AI.</p>
      <div class="card-f"><span class="linkr">Buka briefing →</span></div></div>
    <div class="card click" onclick="eveningReview()">${cardH('clock','Evening Reflection','purple')}<p class="sub">Hasil hari ini, prioritas tercapai &amp; terlewat, keputusan penting, pelajaran, fokus besok.</p>
      <div class="card-f"><span class="linkr">Buka refleksi →</span></div></div>
    <div class="card click" onclick="weeklyReview()">${cardH('chart','Weekly Life by Design Review','gold')}<p class="sub">Skor 10 dimensi: wellbeing, keluarga, bisnis, keuangan, network, dampak, learning, brand, travel, recovery.</p>
      <div class="card-f"><span class="linkr">Buka review →</span></div></div>
  </div>

  <div class="card click" style="background:linear-gradient(140deg,var(--purple-t),var(--gold-tint));margin-bottom:18px" onclick="go('foundation')">
    ${cardH('cpu','System Foundation','purple',`<span class="pill purple">PHASE 1</span>`)}
    <p class="sub" style="color:var(--text)">Halaman admin Phase 1: arsitektur, data sources, data dictionary, import staging, dummy data, core intelligence, permissions, audit, dan system health.</p>
    <div class="card-f"><span class="linkr">Buka System Foundation →</span></div></div>

  <div class="sect"><div><h2>Drive Folder Map</h2><p>Lapisan berkas Aji OS — nomor folder mengikuti nomor menu</p></div>
    <div class="sp"><button class="btn ghost sm" onclick="folderRules()">Aturan penamaan &amp; rutinitas</button></div></div>
  <div class="card" style="margin-bottom:18px">
    <div class="tw"><table class="tbl"><thead><tr><th>Folder Google Drive</th><th>Modul</th><th>Privacy default</th><th></th></tr></thead>
    <tbody>${DB.driveFolders.map(d=>`<tr onclick="${d.go?`go('${d.go}')`:`toast('${esc(d.f)} — ${esc(d.m)}')`}">
      <td><b style="font-variant-numeric:tabular-nums">${d.f}</b></td>
      <td class="mini">${d.m}</td>
      <td><span class="pill ${d.p.includes('AJI')?'red':d.p==='Team'?'blue':d.p==='Sementara'?'yellow':'gray'}">${d.p}</span></td>
      <td>${d.go?'<span class="linkr">Buka modul →</span>':''}</td></tr>`).join('')}</tbody></table></div>
    <div class="card-f mini">Folder 11 bernama <b>BRANDING &amp; CRM</b> di Drive dan <b>BRAND &amp; PERSONAL</b> di sidebar — modul yang sama. Database relasi tetap hanya hidup di folder 07 — NETWORK.</div>
  </div>

  <div class="sect"><div><h2>Development Phases</h2><p>Status pembangunan Aji Jaens OS</p></div></div>
  <div class="card"><div class="tw"><table class="tbl"><thead><tr><th>Fase</th><th>Modul</th><th>Status</th></tr></thead>
    <tbody>${DB.phases.map(p=>`<tr onclick="toast('${p.p}: ${esc(p.m)}')"><td><b>${p.p}</b></td><td class="mini">${p.m}</td><td><span class="pill ${p.c}">${p.st}</span></td></tr>`).join('')}</tbody></table></div></div>`;
}

function folderRules(){
  modal('Aturan Berkas Aji Jaens OS','Empat folder terakhir yang membuat sistem arsip tidak jebol.',
   `<div class="card-h"><h3>Penamaan</h3></div>
    <div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px;background:var(--surface-2);padding:11px 13px;border-radius:10px;margin-bottom:6px">YYYY-MM-DD__TIPE__Judul-Singkat__vN.ext</div>
    <p class="sub">Contoh: <b style="color:var(--text)">2026-07-31__LAPORAN__Konsolidasi-Juli__v1.pdf</b><br>
    TIPE: LAPORAN · KONTRAK · NOTULEN · SOP · ANALISIS · PRESENTASI · CATATAN · ASET · DATA<br>
    Akhiran <b style="color:var(--text)">__AJI-ONLY</b> untuk berkas yang hanya boleh Anda baca.</p>
    <div class="sep" style="margin:16px 0"></div>
    <div class="card-h"><h3>Empat folder alur</h3></div>
    <div class="rows">
      <div class="row-i" style="cursor:default;align-items:flex-start"><span class="pill yellow" style="margin-top:2px">90</span><span><span class="t">Import Staging — satu pintu masuk</span><span class="s">Semua berkas baru mendarat di sini dulu. Target: kosong setiap akhir minggu.</span></span></div>
      <div class="row-i" style="cursor:default;align-items:flex-start"><span class="pill gray" style="margin-top:2px">95</span><span><span class="t">Dummy Data — dipisah supaya tidak menyesatkan</span><span class="s">Wajib diawali DUMMY__. Tidak boleh jadi dasar keputusan.</span></span></div>
      <div class="row-i" style="cursor:default;align-items:flex-start"><span class="pill yellow" style="margin-top:2px">98</span><span><span class="t">Unsorted / Review — triase, bukan tumpukan</span><span class="s">Keluar dengan satu dari tiga keputusan: pindah, arsipkan, atau buang.</span></span></div>
      <div class="row-i" style="cursor:default;align-items:flex-start"><span class="pill gray" style="margin-top:2px">99</span><span><span class="t">OS Archive — beku, tidak dihapus</span><span class="s">Arsip yang baik membuat Anda berani membersihkan folder aktif.</span></span></div>
    </div>
    <div class="sep" style="margin:16px 0"></div>
    <div class="card-h"><h3>Ritme perawatan</h3></div>
    <dl class="kv"><dt>Setiap hari</dt><dd>Apa pun yang masuk → folder 90. Tidak perlu memilah saat itu juga.</dd>
      <dt>Weekly Review</dt><dd>Kosongkan 90, triase 98, arsipkan versi lama ke 99. Sepuluh menit.</dd>
      <dt>Tutup bulan</dt><dd>Snapshot konsolidasi → folder 12. Perbarui status data contoh di folder 95.</dd>
      <dt>Rilis versi</dt><dd>Master prompt lama → folder 99, versi baru → folder 00.</dd></dl>`,
   `<button class="btn gold" onclick="closeModal();weeklyReview()">Buka Weekly Review</button>`,true);
}
function morningBrief(){
  modal('Morning Dharma Briefing',today(),
   `${[['Personal state','Energi tinggi (4/5), tidur 7,1 jam, stres rendah. Health score 82.','green'],
      ['Jadwal hari ini','8 agenda · 2 penting: Leadership Meeting 09:00 dan Company Visit Bank Mitra 14:00.','blue'],
      ['Top priorities','1) Approve kontrak Care Estate 2) Persiapan BNI 3) Review content plan.','yellow'],
      ['Family','Family dinner 19:30 — jangan dijadwalkan ulang. Waktu keluarga minggu ini 6,2 dari 10 jam.','pink'],
      ['Business pulse','Revenue MTD naik dibanding bulan lalu. Outlet terbaru tertinggal di okupansi.','gold'],
      ['Finance','Kas cukup untuk beberapa bulan biaya operasional. Sebagian piutang lewat 60 hari.','green'],
      ['Decisions','5 menunggu; 1 kritikal jatuh tempo hari ini.','red'],
      ['Relationships','4 follow up. Investor A paling lama tanpa kontak.','teal'],
      ['Travel','Jakarta 3 hari lagi — check-in dibuka besok.','blue'],
      ['Risk','Turnover terapis outlet terbaru tertinggi — isu tertua 12 hari.','orange'],
      ['AI recommendation','Lindungi 90 menit pemulihan sebelum komitmen malam.','purple']].map(x=>
     `<div style="margin-bottom:13px"><div class="pill ${x[2]}" style="margin-bottom:5px">${x[0]}</div><div style="font-size:13.5px;line-height:1.55">${x[1]}</div></div>`).join('')}`,
   `<button class="btn solid" onclick="closeModal();toast('Briefing selesai — hari dimulai')">Mulai Hari</button>`,true);
}
function eveningReview(){
  modal('Evening Reflection',today(),
   `<div class="g g2" style="gap:12px;margin-bottom:16px">
      ${[['Prioritas tercapai','2 / 3','green'],['Keputusan diambil','1 / 5','orange'],['Waktu keluarga','1,5 jam','pink'],['Deep work','2,0 jam','purple']].map(x=>
      `<div class="card" style="padding:13px;box-shadow:none"><div class="mini">${x[0]}</div><b style="font-size:19px;color:${CV(x[2])}">${x[1]}</b></div>`).join('')}</div>
    <div class="card-h"><h3>Refleksi</h3></div>
    <div class="askbar" style="margin-bottom:10px"><input placeholder="Apa pelajaran hari ini?"></div>
    <div class="askbar" style="margin-bottom:10px"><input placeholder="Apa yang harus saya hentikan?"></div>
    <div class="askbar"><input placeholder="Fokus utama besok…"></div>`,
   `<button class="btn solid" onclick="closeModal();toast('Refleksi tersimpan ke Knowledge')">Simpan Refleksi</button>`);
}
function weeklyReview(){
  modal('Weekly Life by Design Review','Minggu ini · skor per dimensi (tidak disederhanakan jadi satu angka)',
   `<div class="scorebar">${DB.lifeScore.map(s=>barLine(s.n,s.v,100,s.c)).join('')}</div>
    <div class="sep" style="margin:18px 0"></div>
    <p class="sub"><b style="color:var(--text)">Naik:</b> Social Impact (+7), Business (+3), Network (+4).<br>
    <b style="color:var(--text)">Turun:</b> Family (-9), Recovery (-6), Travel (-2).<br>
    <b style="color:var(--text)">Rekomendasi:</b> pindahkan satu dinner bisnis minggu depan dan blok Sabtu pagi untuk keluarga.</p>`,
   `<button class="btn gold" onclick="closeModal();go('family')">Buka Family</button><button class="btn solid" onclick="closeModal();toast('Review tersimpan')">Simpan Review</button>`,true);
}

/* ---------------- BRAND & PERSONAL ---------------- */
VIEWS.brand = () => BRD_HEAD() + BRD_BODY();
function BRD_HEAD(){ return `
  <div class="page-h"><div><h1>Branding &amp; CRM</h1><p>Personal brand, konten, dan kehadiran publik. Database relasi tetap hanya hidup di Network.</p></div>
    <div class="sp">${srcPill(false)}<button class="btn gold sm" onclick="openForm('CNT')">${ic('plus')} New Content</button></div></div>`;
}
function BRD_BODY(){ const b=DB.brandKpi;
  return `
  ${dummyBar('DUMMY-2026-08-25-006','Branding & CRM')}
  <div class="g g4">
    ${[['Content Reach',b.reach,'+23%',1,'pink','mega'],['Followers',b.followers,'+2,1K',1,'purple','users'],
       ['Engagement',b.eng,'+0,6pt',1,'blue','bolt'],['Leads dari konten',b.leads,'+9',1,'green','flag']].map(x=>
      `<div class="card kpi">${cardH(x[5],x[0],x[4])}<div class="val" style="font-size:27px">${x[1]}</div>${trend(x[2],x[3])}</div>`).join('')}
  </div>

  <div class="g g21">
    <div class="card">${cardH('layers','Content Pipeline','purple')}
      <div class="tw"><table class="tbl"><thead><tr><th>Judul</th><th>Pillar</th><th>Kanal</th><th>Status</th><th class="num">Reach</th></tr></thead>
      <tbody>${DB.content.map(c=>`<tr onclick="modal('${esc(c.t)}','${c.pil} · ${c.ch} · ${c.st}','<dl class=&quot;kv&quot;><dt>Pillar</dt><dd>${c.pil}</dd><dt>Kanal</dt><dd>${c.ch}</dd><dt>Status</dt><dd>${c.st}</dd><dt>Reach</dt><dd>${c.reach}</dd><dt>Engagement</dt><dd>${c.eng}</dd></dl>')">
        <td><b>${c.t}</b></td><td class="mini">${c.pil}</td><td class="mini">${c.ch}</td>
        <td><span class="pill ${c.c}">${c.st}</span></td><td class="num">${c.reach}</td></tr>`).join('')}</tbody></table></div>
      <div class="card-f flexr">${['Idea','Draft','Review','Design','Scheduled','Published','Performance'].map((s,i)=>
        `<span class="pill ${i<5?'gray':'green'}">${s}</span>`).join('')}</div></div>
    <div class="stack">
      <div class="card">${cardH('flag','Content Pillars','pink')}
        <div style="display:flex;gap:7px;flex-wrap:wrap">${DB.pillars.map(p=>`<span class="chip" onclick="toast('Filter pillar: ${p}')">${p}</span>`).join('')}</div></div>
      <div class="card">${cardH('mega','Public Presence','purple')}
        <div class="rows">
          <div class="row-i" style="cursor:default">${ic('flag','')}<span><span class="t">Speaking</span><span class="s">${b.speaking} panggung tahun ini</span></span></div>
          <div class="row-i" style="cursor:default">${ic('doc','')}<span><span class="t">Media</span><span class="s">${b.media} liputan &amp; wawancara</span></span></div>
          <div class="row-i" style="cursor:default">${ic('book','')}<span><span class="t">Buku</span><span class="s">"Life by Design" — bab 4 dari 12</span></span></div>
          <div class="row-i" style="cursor:default">${ic('heart','')}<span><span class="t">Sentiment</span><span class="s">${b.sentiment}</span></span></div>
        </div></div>
    </div>
  </div>

  <div class="card">${cardH('chart','Content Performance — 7 bulan','pink')}
    ${bars([48,56,63,71,88,104,125],'pink',96,['Feb','Mar','Apr','Mei','Jun','Jul','Agu'])}
    <div class="card-f mini">Jangkauan bulanan (ribu). Pertumbuhan didorong pilar Jaens Journey &amp; Business Lessons.</div></div>`;
}

/* ---------------- FINANCE & WEALTH ---------------- */
VIEWS.finance = () => FIN_HEAD() + FIN_BODY();
function FIN_HEAD(){ return `
  <div class="page-h"><div><h1>Finance &amp; Wealth</h1><p>Konsolidasi Jaens Enterprises · ${DB.meta.period} — dibaca langsung dari Finance Drive.</p></div>
    <div class="sp">${srcPill(true)}</div></div>`;
}
function FIN_BODY(){ const f=DB.fin;
  return `
  <div class="g g4">
    ${[['Kas & Bank',money(f.cash),'naik vs bulan lalu',1,'green','wallet'],
       ['Revenue',money(f.rev),'+5,4% vs Juni',1,'gold','chart'],
       ['Laba Bersih',money(f.profit),'margin bersih',1,'green','bolt'],
       ['Gross Profit',money(f.gp),'margin kotor',2,'blue','arrow'],
       ['Piutang (AR)',money(f.ar),'↑ naik 2x sejak April',3,'orange','doc'],
       ['Utang Usaha (AP)',money(f.ap),'stabil',2,'blue','doc'],
       ['Total Liabilitas',money(f.totLiab),'lancar '+money(f.curLiab),2,'red','scale'],
       ['Ekuitas Grup',money(f.equity),'+5,1% vs Juni',1,'gold','crown']].map(x=>
      `<div class="card kpi">${cardH(x[5],x[0],x[4])}<div class="val" style="font-size:25px">${x[1]}</div>${trend(x[2],x[3])}</div>`).join('')}
  </div>

  <div class="g g21">
    <div class="card">${cardH('chart','Revenue · Laba · Kas — Jan s.d. Jul 2026','gold',srcPill(true))}
      <div class="mini" style="font-weight:700;margin-bottom:4px">Revenue konsolidasi (setelah eliminasi)</div>
      <div style="height:96px">${spark(f.revTrend,'gold',420,96)}</div>
      <div class="mini" style="font-weight:700;margin:12px 0 4px">Laba bersih</div>
      <div style="height:70px">${spark(f.profitTrend,'green',420,70)}</div>
      <div class="mini" style="font-weight:700;margin:12px 0 4px">Kas &amp; bank</div>
      <div style="height:70px">${spark(f.cashTrend,'blue',420,70)}</div>
      <div style="display:flex;justify-content:space-between;margin-top:6px" class="mini">${DB.meta.months.map(m=>`<span>${m}</span>`).join('')}</div>
      <div class="card-f mini">Titik terendah tahun ini ada di kuartal pertama. Sejak itu tren naik konsisten.</div></div>
    <div class="stack">
      <div class="card">${cardH('crown','Neraca Grup','purple',`<span class="pill gold">${money(f.assets)} aset</span>`)}
        <div class="flexr" style="align-items:center;gap:16px;margin-bottom:12px">
          ${donut(f.assetBreak,116)}
          <div style="flex:1;min-width:0">
            <div class="mini">Ekuitas</div><div style="font-family:var(--fd);font-size:26px;font-weight:600">${money(f.equity)}</div>
            <div class="mini">Aset ${money(f.assets)} − Liabilitas ${money(f.totLiab)}</div></div></div>
        <div class="rows">${f.assetBreak.map(a=>`<div class="row-i" style="cursor:default;padding:6px 8px">
          <span style="width:9px;height:9px;border-radius:3px;background:${CV(a.c)};flex:0 0 9px"></span>
          <span class="t" style="font-size:12.5px;font-weight:500">${a.n}</span><span class="rt"><b>${money(a.v)}</b></span></div>`).join('')}
          <div class="sep"></div>
          ${f.liabBreak.map(a=>`<div class="row-i" style="cursor:default;padding:6px 8px">
          <span style="width:9px;height:9px;border-radius:3px;background:${CV(a.c)};flex:0 0 9px"></span>
          <span class="t" style="font-size:12.5px;font-weight:500">${a.n}</span><span class="rt" style="color:var(--red)"><b>−${money(a.v)}</b></span></div>`).join('')}</div>
        <div class="card-f mini">Aset tetap melonjak sejak pertengahan tahun — mayoritas investasi outlet terbaru.</div></div>
      <div class="card">${cardH('wallet','Kas per Unit','green')}
        <div class="scorebar">${f.cashByUnit.map(c=>`<div class="l"><b>${c.n}</b><div class="bar"><i style="width:${c.v/1.05*100}%;background:${CV(c.c)}"></i></div><i class="v" style="flex:0 0 62px">${money(c.v)}</i></div>`).join('')}</div>
        <div class="card-f mini">Jaens Essences punya bantalan kas paling tipis di grup.</div></div>
    </div>
  </div>

  <div class="card">${cardH('brief','Kontribusi per Unit · Juli 2026','blue',srcPill(true))}
    <div class="tw"><table class="tbl"><thead><tr><th>Unit</th><th class="num">Revenue</th><th class="num">Laba bersih</th><th class="num">Net margin</th><th class="num">Kas</th><th>Kontribusi revenue</th></tr></thead>
    <tbody>${DB.units.filter(u=>u.live&&u.rev).map(u=>`<tr onclick="unitDetail('${u.id}')"><td><b>${u.name}</b></td><td class="num">${money(u.rev)}</td>
      <td class="num">${money(u.profit)}</td><td class="num">${String(u.margin).replace('.',',')}%</td><td class="num">${money(u.cash)}</td>
      <td><div class="bar" style="width:120px"><i style="width:${u.rev/DB.fin.revGross*100}%;background:${CV(u.color)}"></i></div></td></tr>`).join('')}</tbody></table></div>
    <div class="card-f mini">YTD Jan–Jul: revenue ${money(f.ytdRev)} · laba bersih ${money(f.ytdProfit)}. ${DB.meta.caveats[0]}</div></div>

  <div class="card" style="margin-top:16px">${cardH('shield','Aturan Investasi Anda vs Posisi Hari Ini','gold')}
    <div class="rows">
      <div class="row-i" style="cursor:default">${ic('check','')}<span><span class="t">Cash buffer minimal 3 bulan biaya grup</span><span class="s">Kas dibandingkan beban operasional bulanan → di bawah 3 bulan. <b style="color:var(--orange)">Belum terpenuhi.</b></span></span></div>
      <div class="row-i" style="cursor:default">${ic('check','')}<span><span class="t">Maksimal 20% net worth ke aset non-likuid baru per tahun</span><span class="s">Outlet terbaru menyerap porsi besar dari ekuitas grup. <b style="color:var(--red)">Terlampaui jauh.</b></span></span></div>
      <div class="row-i" style="cursor:default">${ic('check','')}<span><span class="t">Tidak berinvestasi pada bisnis yang operasionalnya tidak dipahami</span><span class="s">Terpenuhi — seluruh unit berada di rantai wellness yang Anda jalankan sendiri.</span></span></div>
    </div>
    <div class="card-f mini">Ini perbandingan otomatis antara Personal Principles di Operating System dengan angka Finance Drive.</div></div>`;
}

/* ---------------- OPERATIONS ---------------- */
VIEWS.operations = () => OPSV_HEAD() + OPSV_BODY();
function OPSV_HEAD(){ return `
  <div class="page-h"><div><h1>Operations</h1><p>Pengawasan operasional unit &amp; outlet. Sistem pribadi Anda ada di Operating System.</p></div>
    <div class="sp">${srcPill(true)}<button class="btn ghost sm" onclick="go('business')">Business Empire →</button></div></div>`;
}
function OPSV_BODY(){ 
  return `
  <div class="g g4">
    ${[['Net margin tertinggi',"J'Fresh",'shield','green'],
       ['Open Issues',DB.ops.reduce((s,o)=>s+o.issues,0),'flag','red'],
       ['SLA Rata-rata',Math.round(DB.ops.reduce((s,o)=>s+o.sla,0)/DB.ops.length)+'%','clock','blue'],
       ['Komplain Aktif',DB.ops.reduce((s,o)=>s+o.comp,0),'mega','orange']].map(x=>
      `<div class="card kpi">${cardH(x[2],x[0],x[3])}<div class="val">${x[1]}</div><div class="lbl">Seluruh unit</div></div>`).join('')}
  </div>

  <div class="g g21">
    <div class="card">${cardH('cog','Kinerja per Lokasi · Juli 2026','orange',srcPill(true))}
      <div class="tw"><table class="tbl"><thead><tr><th>Lokasi</th><th>Unit</th><th class="num">Net margin</th><th class="num">Issues</th><th class="num">SLA</th><th class="num">Tasks</th><th class="num">Komplain</th></tr></thead>
      <tbody>${DB.ops.map(o=>`<tr onclick="toast('${esc(o.n)} — net margin ${o.health}%, ${o.issues} isu terbuka')">
        <td><b>${o.n}</b></td><td class="mini">${o.unit}</td>
        <td class="num"><span class="pill ${o.health>=30?'green':o.health>=20?'blue':'orange'}">${o.health}%</span></td>
        <td class="num" style="color:${o.issues>2?'var(--red)':'var(--text-2)'}">${o.issues}</td>
        <td class="num">${o.sla}%</td><td class="num">${o.tasks}</td><td class="num">${o.comp}</td></tr>`).join('')}</tbody></table></div></div>
    <div class="card">${cardH('flag','Issues','red',srcPill(true))}
      <div class="rows">${(dummyOn()?DB.opsIssues:[]).map(i=>`<div class="row-i" style="align-items:flex-start" onclick="toast('Isu diteruskan ke COO')">
        <span style="width:8px;height:8px;border-radius:50%;background:${CV(i.c)};margin-top:6px;flex:0 0 8px"></span>
        <span style="min-width:0"><span class="t">${i.t}</span><span class="s">${i.o} · ${i.age}</span></span>
        <span class="rt"><span class="pill ${i.c}">${i.lv}</span></span></div>`).join('')}</div>
      ${dummyOn()?'':'<div class="empty">Belum ada isu tercatat.<br><span class="mini">Tambahkan lewat + Add atau template Drive.</span></div>'}
      <div class="card-f"><span class="linkr" onclick="toast('Isu kritikal diangkat menjadi keputusan CEO')">Angkat ke Decision Engine →</span></div></div>
  </div>`;
}

/* ---------------- PROJECTS ---------------- */
let pFilter='Semua';
VIEWS.projects = () => PROJ_HEAD() + PROJ_BODY();
function PROJ_HEAD(){ return `
  <div class="page-h"><div><h1>Projects</h1><p>${DB.projects.length} proyek lintas bisnis, sosial, brand, keluarga, dan investasi.</p></div>
    <div class="sp"><button class="btn gold sm" onclick="openForm('PRO')">${ic('plus')} New Project</button></div></div>`;
}
function PROJ_BODY(){
  const cats=['Semua',...new Set(DB.projects.map(p=>p.cat))];
  const items=pFilter==='Semua'?DB.projects:DB.projects.filter(p=>p.cat===pFilter);
  return `
  <div class="g g4">
    ${[['Aktif',DB.projects.filter(p=>p.st!=='Planning').length,'layers','purple'],
       ['On Track',DB.projects.filter(p=>p.st==='On Track').length,'check','green'],
       ['At Risk / Behind',DB.projects.filter(p=>p.st==='At Risk'||p.st==='Behind').length,'flag','red'],
       ['Total Budget','Rp 10,0 M','wallet','gold']].map(x=>
      `<div class="card kpi">${cardH(x[2],x[0],x[3])}<div class="val">${x[1]}</div><div class="lbl">Portofolio proyek</div></div>`).join('')}
  </div>

  <div class="chips">${cats.map(c=>`<button class="chip ${pFilter===c?'on':''}" onclick="pFilter='${c}';go('projects')">${c}</button>`).join('')}</div>

  <div class="g g3">${items.map(p=>{const o=P(p.owner);return `
    <div class="card click" onclick="prjDetail('${p.id}')">
      <div class="flexr" style="margin-bottom:9px"><span class="pill ${p.c}">${p.cat}</span>
        <span class="pill ${p.st==='On Track'?'green':p.st==='At Risk'?'red':p.st==='Behind'?'orange':'gray'}" style="margin-left:auto">${p.st}</span></div>
      <b style="font-size:15px;line-height:1.35;display:block">${p.n}</b>
      <div class="mini" style="margin-top:3px">${p.unit}</div>
      <div style="margin:13px 0 6px"><div class="flexr" style="justify-content:space-between;margin-bottom:5px"><span class="mini">Progress</span><b class="mini">${p.prog}%</b></div>
        <div class="bar"><i style="width:${p.prog}%;background:${CV(p.c)}"></i></div></div>
      <div class="g g2" style="gap:8px;margin:12px 0 0">
        <div><div class="mini">Budget</div><b style="font-size:13px">${p.bud}</b></div>
        <div><div class="mini">Deadline</div><b style="font-size:13px">${p.dl}</b></div></div>
      <div class="card-f flexr">${avat(o.n,o.c)}<span class="mini" style="flex:1;min-width:0">${o.id==='p_aji'?'Aji Jaens':o.n}</span>
        <span class="pill ${p.pr==='Critical'?'red':p.pr==='High'?'orange':p.pr==='Medium'?'blue':'gray'}">${p.pr}</span></div>
    </div>`}).join('')}</div>`;
}
function prjDetail(id){const p=DB.projects.find(x=>x.id===id);if(!p)return;const o=P(p.owner);
  modal(p.n,`${p.cat} · ${p.unit} · ${p.st}`,
   `<div class="flexr" style="margin-bottom:16px">${idPill(gid('PRO',DB.projects,id))}<span class="pill ${p.c}">${p.cat}</span>
      <span class="pill ${p.pr==='Critical'?'red':p.pr==='High'?'orange':'blue'}">Priority ${p.pr}</span>
      <span class="pill ${p.risk==='High'?'red':p.risk==='Medium'?'orange':'green'}">Risk ${p.risk}</span></div>
    <div style="margin-bottom:16px"><div class="flexr" style="justify-content:space-between;margin-bottom:5px"><span class="mini">Progress</span><b>${p.prog}%</b></div>
      <div class="bar" style="height:9px"><i style="width:${p.prog}%;background:${CV(p.c)}"></i></div></div>
    <dl class="kv"><dt>Owner</dt><dd>${o.id==='p_aji'?'Aji Jaens':o.n}${o.org?' — '+o.org:''}</dd><dt>Budget</dt><dd>${p.bud} (terpakai ${p.spent})</dd>
      <dt>Deadline</dt><dd>${p.dl}</dd><dt>Milestone berikutnya</dt><dd>${p.ms}</dd><dt>Unit</dt><dd>${p.unit}</dd></dl>`,
   `<button class="btn gold" onclick="closeModal();personDetail('${p.owner}')">Buka Owner</button>
    <button class="btn ghost" onclick="toast('Update progress diminta ke owner')">Minta Update</button>
    <button class="btn solid" style="margin-left:auto" onclick="toast('Proyek diangkat ke prioritas hari ini')">Jadikan Prioritas</button>`);}

/* ---------------- AI COMMAND CENTER ---------------- */
VIEWS.ai = () => AI_HEAD() + AI_BODY();
function AI_HEAD(){ return `
  <div class="page-h"><div><h1>AI Command Center</h1><p>Aji AI Chief of Staff — bukan chatbot. Meringkas, memprioritaskan, memperingatkan, dan menyiapkan keputusan.</p></div>
    <div class="sp"><button class="btn pur sm" onclick="openAI()">${ic('spark')} Buka Chat</button></div></div>`;
}
function AI_BODY(){ return `

  <div class="aibanner" style="margin-bottom:18px">
    <div class="z" style="flex:1;min-width:240px"><div class="lb">Executive Summary</div>
      <h4>Hari ini beban bisnis tinggi dengan 1 keputusan kritikal jatuh tempo. Prioritaskan approval kontrak Care Estate sebelum 12:00, lalu lindungi 90 menit pemulihan.</h4></div>
    <div class="btnw"><button class="btn-w" onclick="morningBrief()">Morning Brief →</button></div>
  </div>

  <div class="sect"><div><h2>Insight → Recommendation → Action</h2><p>Setiap insight menghasilkan aksi dengan owner dan deadline</p></div></div>
  <div class="g g2">${DB.insights.map(i=>`
    <div class="card">
      <div class="flexr" style="margin-bottom:10px"><span class="pill ${i.c}">Insight</span><span class="mini" style="margin-left:auto">${i.why}</span></div>
      <b style="font-size:14.5px;line-height:1.45;display:block">${i.t}</b>
      <div class="sep" style="margin:13px 0"></div>
      <div class="mini" style="font-weight:700;margin-bottom:7px">RECOMMENDED ACTIONS</div>
      ${i.acts.map(a=>`<div class="row-i" onclick="toast('Action dibuat: ${esc(a)} — owner Aji, deadline hari ini')">
        <span class="bx" style="width:16px;height:16px;border-radius:5px;border:1.6px solid ${CV(i.c)};display:grid;place-items:center;font-size:10px;color:${CV(i.c)};flex:0 0 16px">✓</span>
        <span class="t" style="font-size:13px;font-weight:500">${a}</span>
        <span class="rt mini">Owner: Aji</span></div>`).join('')}
    </div>`).join('')}</div>

  <div class="sect"><div><h2>Executive Decision Engine</h2><p>Setiap isu diubah jadi paket keputusan siap eksekusi</p></div></div>
  <div class="card" style="margin-bottom:18px">
    <div class="tw"><table class="tbl"><thead><tr><th>Isu</th><th>Dampak</th><th>Risiko</th><th>Rekomendasi AI</th><th></th></tr></thead>
    <tbody>${DB.decisions.map(d=>`<tr onclick="decDetail('${d.id}')"><td><b>${d.n}</b><div class="mini">${d.unit}</div></td>
      <td class="num">${d.impact}</td><td><span class="pill ${d.risk==='High'?'red':d.risk==='Medium'?'orange':'green'}">${d.risk}</span></td>
      <td class="mini" style="max-width:320px">${d.rec}</td>
      <td><button class="btn pur sm" onclick="event.stopPropagation();decDetail('${d.id}')">Siapkan</button></td></tr>`).join('')}</tbody></table></div>
  </div>

  <div class="sect"><div><h2>Tanya AI Chief of Staff</h2><p>Contoh pertanyaan yang dipahami sistem</p></div></div>
  <div class="g g3">${AI_Q.map(q=>`<div class="card click" onclick="openAI('${esc(q)}')">
    <div class="flexr" style="gap:9px"><div class="ic" style="width:28px;height:28px;border-radius:9px;display:grid;place-items:center;background:var(--purple-t);color:var(--purple);flex:0 0 28px">${ic('spark')}</div>
    <b style="font-size:13.5px;line-height:1.4">${q}</b></div></div>`).join('')}</div>`;
}

