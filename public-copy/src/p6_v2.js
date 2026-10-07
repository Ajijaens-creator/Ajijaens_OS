/* ============ VIEWS: KNOWLEDGE · WELLBEING · BUSINESS · FAMILY · NETWORK ============ */
let kFilter='Semua';
VIEWS.knowledge = () => KNW_HEAD() + KNW_BODY();
function KNW_HEAD(){ return `
  <div class="page-h"><div><h1>Knowledge</h1><p>Second brain Aji — semua yang perlu diingat sistem, bukan Anda.</p></div>
    <div class="sp"><button class="btn gold sm" onclick="openForm('KNW')">${ic('plus')} New Note</button></div></div>`;
}
function KNW_BODY(){ const base = dummyOn()?DB.knowledge:DB.knowledge.filter(k=>k.live);
  const items = kFilter==='Semua'?base:base.filter(k=>k.cat===kFilter);
  return `
  <div class="card" style="background:linear-gradient(140deg,var(--purple-t),var(--gold-tint));border-color:var(--border-soft);margin-bottom:18px">
    ${cardH('spark','Ask Knowledge','purple')}
    <div class="askbar" style="background:var(--surface)">
      <input id="kAsk" placeholder="Contoh: Apa keputusan terakhir tentang Care Estate?" onkeydown="if(event.key==='Enter')askK()">
      <button class="btn pur sm" onclick="askK()">Tanya</button>
    </div>
    <div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:11px">
      ${['Ringkas meeting BNI terakhir','Cari kontrak Care Estate','Rangkum ide personal branding saya','Apa prinsip investasi saya?'].map(q=>
        `<button class="chip" onclick="document.getElementById('kAsk').value='${esc(q)}';askK()">${q}</button>`).join('')}
    </div>
    <div id="kAns"></div>
  </div>

  <div class="chips">${['Semua',...DB.kCats].map(c=>`<button class="chip ${kFilter===c?'on':''}" onclick="kFilter='${c}';go('knowledge')">${c}</button>`).join('')}</div>

  <div class="g g3">${items.length?items.map(k=>`
    <div class="card click" onclick="kDetail('${k.id}')">
      <div class="flexr" style="margin-bottom:9px"><span class="pill ${k.c}">${k.type}</span>${k.live?'<span class="pill green">Live</span>':''}<span class="mini" style="margin-left:auto">${k.d}</span></div>
      <b style="font-size:14.5px;line-height:1.35;display:block">${k.t}</b>
      <p class="sub" style="margin-top:7px">${k.ex}</p>
      <div class="card-f mini">${k.cat} · oleh ${k.by}</div>
    </div>`).join(''):'<div class="empty">Belum ada item di kategori ini.</div>'}</div>`;
}
function askK(){
  const q=(document.getElementById('kAsk').value||'').toLowerCase();
  const hits=DB.knowledge.filter(k=>(k.t+' '+k.ex+' '+k.cat).toLowerCase().split(/\W+/).some(w=>w.length>3&&q.includes(w)));
  const ans = q.includes('care estate') ? 'Keputusan terakhir Care Estate: <b>memulai fase 1</b> (14 Jun 2026) dengan alasan diversifikasi ke properti berarus kas panjang. Saat ini progres konstruksi 42%. Yang masih menggantung: <b>approval kontrak fase 1</b> — deadline hari ini.'
    : q.includes('bni') ? 'Ringkasan kunjungan bank mitra Juli 2026: Bank mitra terbuka untuk <b>fasilitas kredit investasi</b> dengan agunan aset Care Estate. Tindak lanjut hari ini: company visit pukul 14:00 bersama Relationship Manager Bank.'
    : q.includes('branding')||q.includes('konten') ? 'Ide personal branding aktif: 8 pilar konten Q4 dengan fokus <b>Jaens Journey</b> dan <b>Leadership</b>. Ada 3 konten published (jangkauan 125K bulan ini), 1 draft buku bab 4, dan 1 artikel menunggu review.'
    : q.includes('investasi')||q.includes('prinsip') ? 'Aturan investasi pribadi Anda: maksimal <b>20% net worth</b> ke aset non-likuid baru per tahun; tidak berinvestasi pada bisnis yang operasionalnya tidak Anda pahami; cash buffer minimal 3 bulan biaya grup sebelum ekspansi.'
    : hits.length ? `Saya menemukan ${hits.length} dokumen relevan. Yang paling dekat: <b>${hits[0].t}</b> — ${hits[0].ex}`
    : 'Belum ada dokumen yang cocok. Coba kata kunci lain, atau tambahkan catatan baru ke Knowledge.';
  document.getElementById('kAns').innerHTML=`<div style="margin-top:13px;padding:13px;border-radius:12px;background:var(--surface);border:1px solid var(--border)">
    <div style="font-size:10.5px;font-weight:800;letter-spacing:1px;color:var(--purple);text-transform:uppercase;margin-bottom:5px">Jawaban dari Knowledge</div>
    <div style="font-size:13.5px;line-height:1.6">${ans}</div></div>`;
}
function kDetail(id){const k=DB.knowledge.find(x=>x.id===id);if(!k)return;
  modal(k.t,`${k.type} · ${k.cat} · ${k.d} · oleh ${k.by}`,
   `<div class="flexr" style="margin-bottom:14px">${idPill(gid('KNW',DB.knowledge,id))}${srcPill(!!k.live)}</div><p class="sub" style="font-size:13.5px;color:var(--text)">${k.ex}</p><div class="sep" style="margin:16px 0"></div>
    <dl class="kv"><dt>Privacy</dt><dd><span class="pill ${k.cat==='Personal'?'red':'blue'}">${k.cat==='Personal'?'AJI ONLY':'TEAM'}</span></dd>
    <dt>Tertaut ke</dt><dd>${k.cat==='Business'?'Business Empire, Projects':k.cat==='Finance'?'Finance & Wealth':k.cat==='Travel'?'Travel':'Operating System'}</dd>
    <dt>Terakhir diubah</dt><dd>${k.d}</dd></dl>`,
   `<button class="btn gold" onclick="toast('Diringkas oleh AI')">Ringkas dengan AI</button><button class="btn ghost" onclick="toast('Dokumen dibagikan')">Bagikan</button>`);}

/* ---------------- WELLBEING ---------------- */
VIEWS.wellbeing = () => WEL_HEAD() + WEL_BODY();
function WEL_HEAD(){ return `
  <div class="page-h"><div><h1>Wellbeing</h1><p>Body · Mind · Energy · Recovery — modal kerja pertama.</p></div>
    <div class="sp">${srcPill(false)}<span class="pill red">AJI ONLY</span><button class="btn gold sm" onclick="checkin()">${ic('heart')} Daily Check-in</button></div></div>`;
}
function WEL_BODY(){ const w=DB.well;
  return `
  ${dummyBar('DUMMY-2026-08-25-003','Wellbeing')}
  <div class="g g4">
    <div class="card kpi">${cardH('heart',"Today's Health Score",'green')}
      <div class="row"><div><div class="val">${w.score}<small>/100</small></div><div class="lbl">Good</div></div>${ring(w.score,'green',66,7,'')}</div>
      ${trend('+8% vs kemarin',1)}</div>
    <div class="card kpi">${cardH('clock','Sleep','blue')}
      <div class="val">${String(w.sleep).replace('.',',')}<small> jam</small></div><div class="lbl">Kualitas ${w.sleepQ}/5</div>
      <div style="margin-top:8px">${spark(w.sleepTrend,'blue',104,30)}</div></div>
    <div class="card kpi">${cardH('bolt','Energy','yellow')}
      <div class="val">${w.energy}<small>/5</small></div><div class="lbl">High — siap menaklukkan</div>
      <div class="meter" style="margin-top:12px">${[1,2,3,4,5].map(i=>`<i style="background:${i<=w.energy?'var(--yellow)':'var(--surface-3)'}"></i>`).join('')}</div></div>
    <div class="card kpi">${cardH('shield','Stress','teal')}
      <div class="val">${w.stress}<small>/5</small></div><div class="lbl">Rendah &amp; terkendali</div>
      <div class="meter" style="margin-top:12px">${[1,2,3,4,5].map(i=>`<i style="background:${i<=w.stress?'var(--teal)':'var(--surface-3)'}"></i>`).join('')}</div></div>
  </div>

  <div class="g g21">
    <div class="card">${cardH('chart','Trend 7 Hari','green',`<span class="mini">Health score</span>`)}
      ${spark(w.trend,'green',420,110)}
      <div style="display:flex;justify-content:space-between;margin-top:6px" class="mini">${['Sen','Sel','Rab','Kam','Jum','Sab','Min'].map(d=>`<span>${d}</span>`).join('')}</div>
      <div class="card-f g g4" style="margin:14px 0 0;padding-top:14px">
        ${[['Recovery',w.focus+'%','teal'],['Exercise',w.exercise+'x/mgg','orange'],['Weight',String(w.weight).replace('.',',')+' kg','blue'],['Mood',w.mood+'/5','pink']].map(x=>
          `<div><div class="mini">${x[0]}</div><b style="font-size:16px;color:${CV(x[2])}">${x[1]}</b></div>`).join('')}
      </div></div>
    <div class="card">${cardH('doc','Check-in Log','purple')}
      <div class="rows">${w.log.map(l=>`<div class="row-i" style="align-items:flex-start" onclick="toast('${esc(l.note)}')">
        <span class="pill ${l.f==='Excellent'?'green':l.f==='Good'?'blue':'gray'}" style="margin-top:2px">${l.f}</span>
        <span style="min-width:0"><span class="t">${l.d}</span><span class="s">E${l.e} · S${l.s} · M${l.m} · ${String(l.sl).replace('.',',')}j — ${l.note}</span></span></div>`).join('')}</div>
      <div class="card-f"><span class="linkr" onclick="checkin()">Check-in hari ini →</span></div></div>
  </div>

  <div class="g g3">
    <div class="card">${cardH('bolt','Movement','orange')}<p class="sub">4 sesi minggu ini dari target 4. Strength &amp; mobility konsisten.</p>
      <div class="bar" style="margin-top:12px"><i style="width:100%;background:var(--orange)"></i></div></div>
    <div class="card">${cardH('heart','Nutrition','green')}<p class="sub">Pola makan stabil. Makan siang tertunda 2 hari terakhir karena meeting beruntun.</p>
      <div class="bar" style="margin-top:12px"><i style="width:72%;background:var(--green)"></i></div></div>
    <div class="card">${cardH('bulb','Reflection','purple')}<p class="sub">"Pertumbuhan bisnis tidak boleh dibayar dengan absennya kehadiran di rumah." — refleksi minggu lalu</p>
      <div class="card-f"><span class="linkr" onclick="go('knowledge')">Buka jurnal →</span></div></div>
  </div>`;
}
function checkin(){
  modal('Daily Check-in','Bagaimana perasaan Anda hari ini?',
   `<div class="chips">${['Excellent','Good','Normal','Low','Exhausted'].map((f,i)=>`<button class="chip ${i===1?'on':''}" onclick="[...this.parentNode.children].forEach(c=>c.classList.remove('on'));this.classList.add('on')">${f}</button>`).join('')}</div>
    ${['Energy','Stress','Mood','Sleep quality'].map(l=>`
      <div style="margin-bottom:14px"><div class="mini" style="margin-bottom:6px;font-weight:700">${l}</div>
      <div class="chips" style="margin:0">${[1,2,3,4,5].map(n=>`<button class="chip" style="width:42px;text-align:center" onclick="[...this.parentNode.children].forEach(c=>c.classList.remove('on'));this.classList.add('on')">${n}</button>`).join('')}</div></div>`).join('')}
    <div class="askbar"><input placeholder="Catatan singkat hari ini…"></div>`,
   `<button class="btn solid" onclick="closeModal();toast('Check-in tersimpan — health score diperbarui')">Simpan Check-in</button>`);
}

/* ---------------- BUSINESS EMPIRE ---------------- */
VIEWS.business = () => BUS_HEAD() + BUS_BODY();
function BUS_HEAD(){ return `
  <div class="page-h"><div><h1>Business Empire</h1><p>Portofolio Jaens Enterprises — angka konsolidasi ${DB.meta.period} (${DB.meta.periodNote}).</p></div>
    <div class="sp">${srcPill(true)}<button class="btn ghost sm" onclick="go('finance')">Finance →</button></div></div>`;
}
function BUS_BODY(){
  const L=DB.units.filter(u=>u.live&&u.rev);
  const tot=DB.fin.rev, gross=DB.fin.revGross, cash=DB.fin.cash, ppl=DB.units.reduce((s,u)=>s+u.people,0);
  return `

  <div class="g g4">
    <div class="card kpi">${cardH('brief','Revenue Konsolidasi','gold')}<div class="val" style="font-size:27px">${money(tot)}</div>
      <div class="lbl">Setelah eliminasi · ${money(gross)} sebelum</div>${trend('+5,4% vs Juni',1)}</div>
    <div class="card kpi">${cardH('chart','Laba Bersih','green')}<div class="val" style="font-size:27px">${money(DB.fin.profit)}</div>
      <div class="lbl">Net margin ${String(DB.fin.netMargin).replace('.',',')}%</div>${trend('naik vs bulan lalu',1)}</div>
    <div class="card kpi">${cardH('wallet','Kas Grup','green')}<div class="val" style="font-size:27px">${money(cash)}</div>
      <div class="lbl">Tertinggi tahun ini</div>${trend('naik vs bulan lalu',1)}</div>
    <div class="card kpi">${cardH('users','People','teal')}<div class="val" style="font-size:27px">${ppl}</div>
      <div class="lbl">Orang · seluruh unit</div>${trend('estimasi internal',2)}</div>
  </div>

  <div class="card" style="margin-bottom:18px">${cardH('chart','Revenue Konsolidasi Jan–Jul 2026','gold',srcPill(true))}
    ${bars(DB.fin.revTrend.map(x=>+x.toFixed(2)),'gold',96,DB.meta.months)}
    <div class="card-f flexr"><span class="mini">YTD revenue ${money(DB.fin.ytdRev)} · YTD laba ${money(DB.fin.ytdProfit)}</span>
      <span class="mini" style="margin-left:auto">Outlet 4 bergabung Mei 2026 — lompatan Apr→Mei berasal dari sana.</span></div></div>

  <div class="sect"><div><h2>Portfolio</h2><p>Lima unit terbaca di konsolidasi, dua belum</p></div></div>
  <div class="g g3">${DB.units.map(u=>`
    <div class="card click" onclick="unitDetail('${u.id}')" ${u.live&&u.rev?'':'style="opacity:.82"'}>
      <div class="flexr" style="margin-bottom:12px">
        <div class="ic" style="width:36px;height:36px;border-radius:11px;display:grid;place-items:center;background:${CT(u.color)};color:${CV(u.color)};flex:0 0 36px">${ic('brief')}</div>
        <div style="min-width:0"><b style="font-size:15px;display:block">${u.name}</b><span class="mini">${u.cat}</span></div>
        <span class="pill ${u.status==='Sehat'?'green':u.status==='Perlu perhatian'?'orange':u.status==='Belum ada data'?'yellow':'gray'}" style="margin-left:auto">${u.status}</span>
      </div>
      ${u.live&&u.rev?`<div class="g g2" style="gap:10px;margin:0 0 10px">
        <div><div class="mini">Revenue Juli</div><b style="font-size:15px">${money(u.rev)}</b></div>
        <div><div class="mini">MoM</div><b style="font-size:15px;color:${u.gr>0?'var(--green)':'var(--red)'}">${pct(u.gr)}</b></div>
        <div><div class="mini">Laba bersih</div><b style="font-size:15px">${money(u.profit)}</b></div>
        <div><div class="mini">Net margin</div><b style="font-size:15px">${String(u.margin).replace('.',',')}%</b></div>
      </div>
      ${spark(u.spark,u.color,220,40)}`
      :`<p class="sub" style="margin:4px 0 14px">${u.note}</p>`}
      <div class="card-f"><span class="mini">${u.attention}</span></div>
    </div>`).join('')}</div>

  <div class="card"><div class="mini" style="font-weight:700;margin-bottom:8px">CATATAN KUALITAS DATA</div>
    <ul style="margin:0;padding-left:18px;font-size:12.5px;color:var(--text-2);line-height:1.7">
      ${DB.meta.caveats.map(c=>`<li>${c}</li>`).join('')}</ul></div>`;
}
function unitDetail(id){const u=DB.units.find(x=>x.id===id);if(!u)return;
  modal(u.name,`${u.cat} · ${u.live&&u.rev?DB.meta.period+' · sumber '+DB.meta.source:u.status}`,
   `<div class="flexr" style="margin-bottom:14px">${idPill(gid('BUS',DB.units,id))}${srcPill(!!(u.live&&u.rev))}</div>${u.live&&u.rev?`<div class="g g4" style="gap:12px;margin-bottom:16px">
      ${[['Revenue',money(u.rev)],['Laba bersih',money(u.profit)],['Net margin',String(u.margin).replace('.',',')+'%'],['Kas',money(u.cash)]].map(x=>
      `<div class="card" style="padding:12px;box-shadow:none"><div class="mini">${x[0]}</div><b style="font-size:16px">${x[1]}</b></div>`).join('')}
    </div>
    <div style="margin-bottom:16px">${spark(u.spark,u.color,560,90)}
      <div style="display:flex;justify-content:space-between;margin-top:4px" class="mini">${DB.meta.months.map(m=>`<span>${m}</span>`).join('')}</div></div>`:''}
    <p class="sub" style="color:var(--text)">${u.note}</p>
    ${u.outlets.length?`<div class="sep" style="margin:16px 0"></div><div class="card-h"><h3>Outlet · Juli 2026</h3></div>
      <div class="tw"><table class="tbl"><thead><tr><th>Outlet</th><th class="num">Revenue</th><th class="num">MoM</th><th class="num">Laba bersih</th><th class="num">Margin</th><th class="num">Kas</th></tr></thead>
      <tbody>${u.outlets.map(o=>`<tr onclick="toast('${esc(o.n)} — revenue ${money(o.rev)}, margin ${o.margin}%')"><td><b>${o.n}</b></td>
      <td class="num">${money(o.rev)}</td>
      <td class="num" style="color:${o.gr>0?'var(--green)':'var(--red)'}">${pct(o.gr)}</td>
      <td class="num">${money(o.np)}</td>
      <td class="num"><span class="pill ${o.margin>=30?'green':o.margin>=20?'blue':'orange'}">${String(o.margin).replace('.',',')}%</span></td>
      <td class="num">${money(o.cash)}</td></tr>`).join('')}</tbody></table></div>`:''}
    <div style="margin-top:16px;padding:13px;border-radius:12px;background:var(--orange-t)">
      <div style="font-size:10.5px;font-weight:800;letter-spacing:1px;color:var(--orange);text-transform:uppercase">CEO Attention Needed</div>
      <div style="margin-top:4px;font-size:13.5px">${u.attention}</div></div>`,
   `<button class="btn gold" onclick="closeModal();go('operations')">Operations</button>
    <button class="btn ghost" onclick="closeModal();go('finance')">Finance</button>
    <button class="btn ghost" onclick="closeModal();go('projects')">Projects</button>`,true);}

/* ---------------- FAMILY ---------------- */
VIEWS.family = () => FAM_HEAD() + FAM_BODY();
function FAM_HEAD(){ return `
  <div class="page-h"><div><h1>Family</h1><p>Kehadiran di rumah bukan sisa waktu — itu jadwal utama.</p></div>
    <div class="sp">${srcPill(false)}<span class="pill red">PRIVATE — AJI ONLY</span></div></div>`;
}
function FAM_BODY(){ 
  return `
  ${dummyBar('DUMMY-2026-08-25-002','Family')}
  <div class="g g4">
    <div class="card kpi">${cardH('heart','Quality Time','pink')}<div class="val">6,2<small> jam</small></div><div class="lbl">Minggu ini · target 10 jam</div>
      <div class="bar" style="margin-top:10px"><i style="width:62%;background:var(--pink)"></i></div>${trend('-1,4 jam vs minggu lalu',0)}</div>
    <div class="card kpi">${cardH('gift','Tanggal Penting','purple')}<div class="val" style="font-size:22px">—</div><div class="lbl">Ulang tahun Anak Pertama · bulan depan</div>
      <div class="card-f"><span class="linkr" onclick="openForm('EVT')">Buat pengingat →</span></div></div>
    <div class="card kpi">${cardH('book','Education','blue')}<div class="val" style="font-size:22px">Kelas akhir</div><div class="lbl">Anak Pertama — persiapan kuliah</div>
      <div class="card-f"><span class="mini">Konsultasi kampus 12 Sep</span></div></div>
    <div class="card kpi">${cardH('plane','Family Trip','teal')}<div class="val" style="font-size:22px">Tokyo</div><div class="lbl">20–27 Okt · 56 hari lagi</div>
      <div class="card-f"><span class="linkr" onclick="go('travel')">Buka Travel →</span></div></div>
  </div>

  <div class="g g21">
    <div class="card">${cardH('clock','Family Calendar','pink')}
      <div class="rows">${DB.familyEvents.map(e=>`<div class="row-i" onclick="toast('${esc(e.n)}')">
        <span style="width:3px;height:30px;border-radius:3px;background:${CV(e.c)};flex:0 0 3px"></span>
        <span style="min-width:0"><span class="t">${e.n}</span><span class="s">${e.d}${e.t!=='—'?' · '+e.t:''}</span></span></div>`).join('')}</div>
      <div class="card-f"><span class="linkr" onclick="openForm('EVT')">Tambah agenda →</span></div></div>
    <div class="card">${cardH('users','Anggota Keluarga','purple')}
      <div class="rows">${DB.family.map(f=>`<div class="row-i" onclick="famDetail('${f.id}')">
        ${avat(f.n,f.c)}<span style="min-width:0"><span class="t">${f.n}</span><span class="s">${f.rel} · 🎂 ${f.bd}</span></span></div>`).join('')}</div></div>
  </div>

  <div class="g g3">
    <div class="card">${cardH('flag','Family Goals','green')}
      <div class="stack" style="gap:11px">
        ${[['Minimal 10 jam berkualitas per minggu',62,'pink'],['Satu trip keluarga per tahun',80,'teal'],['Makan malam bersama 5x/minggu',68,'green'],['Kunjungan Ibunda 2x/bulan',100,'purple']].map(g=>
        `<div><div class="flexr" style="justify-content:space-between;margin-bottom:5px"><span style="font-size:12.5px">${g[0]}</span><b class="mini">${g[1]}%</b></div>
         <div class="bar"><i style="width:${g[1]}%;background:${CV(g[2])}"></i></div></div>`).join('')}</div></div>
    <div class="card">${cardH('doc','Dokumen Keluarga','blue')}
      <div class="rows">${[['Paspor & visa (4 orang)','Berlaku s.d. 2029'],['Asuransi kesehatan keluarga','Renewal Nov 2026'],['Dokumen pendidikan','Lengkap'],['Akta & dokumen legal','Tersimpan aman']].map(d=>
        `<div class="row-i" onclick="toast('Dokumen bersifat AJI ONLY')">${ic('doc','')}<span><span class="t">${d[0]}</span><span class="s">${d[1]}</span></span></div>`).join('')}</div></div>
    <div class="card">${cardH('shield','Privacy','red')}
      <p class="sub">Semua data Family default <b>AJI ONLY</b>. Hanya Anda atau Family Admin yang ditunjuk dapat mengakses.</p>
      <div class="rows" style="margin-top:8px">
        <div class="row-i" style="cursor:default">${ic('check','')}<span><span class="t">Aji Jaens</span><span class="s">Super Owner — akses penuh</span></span></div>
        <div class="row-i" style="cursor:default">${ic('users','')}<span><span class="t">Family Admin</span><span class="s">Belum ditunjuk</span></span></div>
      </div></div>
  </div>`;
}
function famDetail(id){const f=DB.family.find(x=>x.id===id);if(!f)return;
  modal(f.n,f.rel,`<div class="flexr" style="margin-bottom:14px">${idPill(gid('FAM',DB.family,id))}${srcPill(false)}</div><dl class="kv"><dt>Hubungan</dt><dd>${f.rel}</dd><dt>Ulang tahun</dt><dd>${f.bd}</dd><dt>Catatan</dt><dd>${f.note}</dd>
  <dt>Privacy</dt><dd><span class="pill red">AJI ONLY</span></dd></dl>`,
  `<button class="btn gold" onclick="toast('Pengingat ulang tahun aktif')">Pengingat ulang tahun</button>`);}

/* ---------------- NETWORK ---------------- */
let nFilter='Semua';
VIEWS.network = () => NET_HEAD() + NET_BODY();
function NET_HEAD(){ return `
  <div class="page-h"><div><h1>Network</h1><p>Personal relationship intelligence — satu-satunya CRM relasi di Aji OS.</p></div>
    <div class="sp">${srcPill(false)}<button class="btn gold sm" onclick="openForm('PER')">${ic('plus')} Add Contact</button></div></div>`;
}
function NET_BODY(){
  const cats=['Semua',...new Set(DB.people.map(p=>p.cat))];
  const items=nFilter==='Semua'?DB.people:DB.people.filter(p=>p.cat===nFilter);
  const cold=DB.people.filter(p=>parseInt(p.last)>=30&&p.last.includes('hari'));
  return `
  ${dummyBar('DUMMY-2026-08-25-001','Network')}
  <div class="g g4">
    <div class="card kpi">${cardH('net','Network Strength','teal')}<div class="val">78<small>/100</small></div><div class="lbl">Strong</div>${trend('+6% vs minggu lalu',1)}</div>
    <div class="card kpi">${cardH('users','Total Kontak','blue')}<div class="val">${DB.people.length}</div><div class="lbl">${DB.people.filter(p=>p.tier==='A').length} strategic (Tier A)</div></div>
    <div class="card kpi">${cardH('clock','Perlu Follow Up','orange')}<div class="val">${DB.followups.length}</div><div class="lbl">Hari ini</div></div>
    <div class="card kpi">${cardH('bolt','Relasi Mendingin','red')}<div class="val">${cold.length}</div><div class="lbl">30+ hari tanpa interaksi</div></div>
  </div>

  <div class="card" style="background:linear-gradient(140deg,var(--purple-t),var(--surface));margin-bottom:18px">
    ${cardH('spark','Network AI','purple')}
    <div class="rows">
      <div class="row-i" onclick="personDetail('p_agus')">🔔<span><span class="t">Anda belum menghubungi Pengembang Lahan selama 73 hari</span><span class="s">Relasi turun ke tier C — dormant</span></span></div>
      <div class="row-i" onclick="personDetail('p_fitri')">🎂<span><span class="t">Ulang tahun Relationship Manager Bank</span><span class="s">8 hari lagi — siapkan ucapan personal</span></span></div>
      <div class="row-i" onclick="personDetail('p_bruce')">⚠️<span><span class="t">Follow up Investor A lewat jatuh tempo</span><span class="s">Keputusan investasi masih menggantung</span></span></div>
      <div class="row-i" onclick="personDetail('p_chen')">💡<span><span class="t">Peluang kolaborasi: distribusi Jaens Essences ke Singapura</span><span class="s">Mitra Internasional A — 6 outlet</span></span></div>
    </div>
  </div>

  <div class="chips">${cats.map(c=>`<button class="chip ${nFilter===c?'on':''}" onclick="nFilter='${c}';go('network')">${c}</button>`).join('')}</div>

  <div class="card" style="padding:8px 10px 14px">
    <div class="tw"><table class="tbl"><thead><tr><th>Kontak</th><th>Kategori</th><th>Tier</th><th class="num">Strength</th><th>Terakhir</th><th>Next action</th><th></th></tr></thead>
    <tbody>${items.map(p=>`<tr onclick="personDetail('${p.id}')">
      <td><div style="display:flex;gap:9px;align-items:center">${avat(p.n,p.c)}<div style="min-width:0"><b>${p.n}</b><div class="mini">${p.pos} · ${p.org}</div></div></div></td>
      <td class="mini">${p.cat}</td>
      <td><span class="pill ${p.tier==='A'?'gold':p.tier==='B'?'blue':'gray'}">${p.tier}</span></td>
      <td class="num"><div style="display:flex;align-items:center;gap:7px;justify-content:flex-end"><div class="bar" style="width:52px"><i style="width:${p.str}%;background:${p.str>=80?'var(--green)':p.str>=65?'var(--blue)':'var(--orange)'}"></i></div><b>${p.str}</b></div></td>
      <td class="mini">${p.last}</td><td class="mini">${p.next}</td>
      <td><button class="icobtn" style="color:var(--green)" onclick="event.stopPropagation();toast('WhatsApp ke ${esc(p.n)}')">${ic('wa')}</button></td>
    </tr>`).join('')}</tbody></table></div>
  </div>

  <div class="mini" style="margin-top:10px">Tier: <b>A</b> Strategic · <b>B</b> Important · <b>C</b> Regular · <b>D</b> Dormant. Relasi tier A dihubungi minimal 1x per bulan (Relationship Rules).</div>`;
}
function personDetail(id){const p=P(id);
  const prj=DB.projects.filter(x=>x.owner===id), trp=DB.trips.filter(t=>t.meetings.includes(id));
  modal(p.n,`${p.pos} · ${p.org}`,
   `<div class="flexr" style="margin-bottom:16px">${idPill(gid('PER',DB.people,id))}${avat(p.n,p.c)}
     <span class="pill ${p.tier==='A'?'gold':p.tier==='B'?'blue':'gray'}">Tier ${p.tier}</span>
     <span class="pill teal">Strength ${p.str}</span><span class="pill gray">${p.city}</span></div>
    <dl class="kv"><dt>Kategori relasi</dt><dd>${p.cat}</dd><dt>Interaksi terakhir</dt><dd>${p.last}</dd>
      <dt>Next action</dt><dd>${p.next}</dd><dt>Ulang tahun</dt><dd>${p.bd}</dd><dt>Peluang</dt><dd>${p.op}</dd></dl>
    ${(prj.length||trp.length)?`<div class="sep" style="margin:16px 0"></div><div class="card-h"><h3>Tertaut ke</h3></div>
      <div class="rows">${prj.map(x=>`<div class="row-i" onclick="closeModal();go('projects')">${ic('layers','')}<span><span class="t">${x.n}</span><span class="s">Project · ${x.st}</span></span></div>`).join('')}
      ${trp.map(x=>`<div class="row-i" onclick="closeModal();go('travel')">${ic('plane','')}<span><span class="t">Trip ${x.dest}</span><span class="s">${x.dep}</span></span></div>`).join('')}</div>`:''}
    <div class="mini" style="margin-top:14px"><span class="pill orange">DUMMY</span> is_dummy = true · batch DUMMY-2026-08-25-001<br>ENTER ONCE — USE EVERYWHERE: kontak ini dirujuk lewat person_id di Projects, Travel, Meeting, dan Social Movement.</div>`,
   `<button class="btn grn" onclick="toast('WhatsApp ke ${esc(p.n)}')">${ic('wa')} WhatsApp</button>
    <button class="btn ghost" onclick="toast('Menelepon ${esc(p.n)}')">${ic('phone')} Call</button>
    <button class="btn ghost" onclick="toast('Email ke ${esc(p.n)}')">${ic('mail')} Email</button>
    <button class="btn gold" style="margin-left:auto" onclick="toast('Follow up dijadwalkan')">Jadwalkan follow up</button>`,true);}

