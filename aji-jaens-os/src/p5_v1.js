/* ================= VIEWS: MY DAY + DASHBOARD ================= */
const HARI=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const BLN=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
function today(){const d=new Date();return `${HARI[d.getDay()]}, ${d.getDate()} ${BLN[d.getMonth()]} ${d.getFullYear()}`;}
function greet(){const h=new Date().getHours();return h<11?'Good Morning':h<15?'Good Afternoon':h<19?'Good Evening':'Good Night';}
function jam(){const d=new Date();return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');}

const VIEWS = {};

VIEWS.myday = () => MYDAY_HEAD() + MYDAY_BODY();

function MYDAY_HEAD(){
  const dayStatus = MODE==='travel'?['Travel Day','blue']:MODE==='recovery'?['Recovery Day','green']:MODE==='family'?['Family Day','pink']:MODE==='focus'?['Strategic Day','purple']:['Busy Day','orange'];
  return `
  <div class="page-h">
    <div><h1>My Day <span style="font-size:26px">☀️</span></h1>
      <p>Fokus pada yang paling penting. Jadikan hari ini berarti.</p></div>
    <div class="sp">
      <span class="pill ${dayStatus[1]}">${dayStatus[0]}</span>
      ${srcPill(true)}
      <button class="chip" onclick="toast('Pilih tanggal — Google Calendar belum disambungkan')">📅 ${today()}</button>
    </div>
  </div>`;
}

function MYDAY_BODY(){
  return `
  <div class="g g4">
    <div class="card" style="padding:0;overflow:hidden;background:linear-gradient(150deg,#1E5B8E,#2E86B8 48%,#7FC4D9);color:#fff;border:0">
      <div style="padding:20px;position:relative;z-index:2">
        <div style="font-size:10.5px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;opacity:.85">${greet()}, Aji</div>
        <div style="font-family:var(--fd);font-size:26px;font-weight:600;margin-top:8px;line-height:1.15">Have a great day</div>
        <div style="font-size:12.5px;opacity:.92;margin-top:4px">Full of impact and joy</div>
        <div style="display:flex;gap:12px;margin-top:16px;font-size:11.5px;opacity:.9;flex-wrap:wrap">
          <span>🕐 ${jam()} WITA</span><span>📍 Ubud, Bali</span><span>⛅ 29°C</span>
        </div>
      </div>
      <div style="position:absolute;right:-30px;bottom:-20px;width:170px;height:170px;border-radius:50%;background:rgba(255,255,255,.12)"></div>
    </div>

    <div class="card click kpi" onclick="scoreDetail()">
      ${cardH('target',"Today's Score",'green')}
      <div class="row"><div><div class="val">87<small>/100</small></div><div class="lbl">Great day ahead!</div></div>${ring(87,'green',66,7,'')}</div>
      ${trend('Naik 4 poin dari kemarin',1)}
    </div>

    <div class="card click kpi" onclick="go('wellbeing')">
      ${cardH('bolt','Energy Level','yellow')}
      <div class="val" style="color:var(--yellow);font-size:29px">⚡ High</div>
      <div class="lbl" style="margin-bottom:10px">You're ready to conquer!</div>
      <div class="meter">${[1,2,3,4,5].map(i=>`<i style="background:${i<=4?'var(--green)':'var(--surface-3)'}"></i>`).join('')}</div>
    </div>

    <div class="card click kpi" onclick="focusDetail()">
      ${cardH('target','Focus Mode','red')}
      <div class="val" style="font-size:26px">🎯 Deep Work</div>
      <div style="margin-top:12px;display:flex;align-items:baseline;gap:8px">
        <div style="font-family:var(--fd);font-size:24px;font-weight:600">2j 30m</div>
        <div class="mini">sampai meeting berikutnya</div></div>
      <div class="bar" style="margin-top:9px"><i style="width:38%;background:var(--red)"></i></div>
    </div>
  </div>

  <div class="g g4 top gsched">
    <div class="card">
      ${cardH('clock',"Today's Schedule",'blue',`<span class="mini">${DB.schedule.length} agenda</span>`)}
      <div class="tl">${DB.schedule.map(s=>`
        <div class="tl-i" onclick="evDetail('${esc(s.n)}','${s.t}','${s.tag}','${s.dur}','${s.c}')">
          <span class="tm">${s.t}</span><span class="bar" style="background:${CV(s.c)}"></span>
          <span class="bd"><b>${s.n}</b><span>${s.tag} · ${s.dur}</span></span>
          ${s.imp?'<span class="pill orange" style="align-self:center">Important</span>':''}
        </div>`).join('')}</div>
      <div class="card-f"><span class="linkr" onclick="toast('Kalender penuh — sinkron Google Calendar')">View full calendar →</span></div>
    </div>

    <div class="card">
      ${cardH('flag','Top 3 Priorities','yellow',`<span class="mini">${DB.priorities.length} total</span>`)}
      ${DB.priorities.slice(0,3).map((p,i)=>`
        <div class="pr" style="background:${CT(p.c)}" onclick="taskDetail('${p.id}')">
          <span class="n" style="background:${CV(p.c)}">${i+1}</span>
          <span style="min-width:0"><b>${p.n}</b><span>${p.s}</span></span>
        </div>`).join('')}
      <div class="card-f"><span class="linkr" onclick="go('projects')">View all tasks →</span></div>
    </div>

    <div class="card">
      ${cardH('scale','Decisions Needed','red',`<span class="pill red">${DB.decisions.length}</span>`)}
      ${DB.decisions.slice(0,3).map(d=>`
        <div class="pr" style="background:${CT(d.c)}" onclick="decDetail('${d.id}')">
          <span style="width:8px;height:8px;border-radius:50%;background:${CV(d.c)};margin-top:6px;flex:0 0 8px"></span>
          <span style="min-width:0"><b>${d.n}</b><span>${d.unit} · ${d.due} · ${d.impact}</span></span>
        </div>`).join('')}
      <div class="card-f"><span class="linkr" onclick="go('os')">View all decisions →</span></div>
    </div>

    <div class="card">
      ${cardH('users','Follow Up Today','teal',`<span class="mini">${DB.followups.length} orang</span>`)}
      <div class="rows">${DB.followups.map(f=>{const p=P(f.pid);return `
        <div class="row-i" onclick="personDetail('${p.id}')">
          ${avat(p.n,p.c)}
          <span style="min-width:0"><span class="t">${p.n}</span><span class="s">${p.pos}</span></span>
          <span class="rt"><button class="icobtn" style="color:var(--green)" onclick="event.stopPropagation();toast('Membuka ${f.ch} ke ${esc(p.n)}')">${ic('wa')}</button></span>
        </div>`}).join('')}</div>
      <div class="card-f"><span class="linkr" onclick="go('network')">View all contacts →</span></div>
    </div>
  </div>

  <div class="g g4 top">
    <div class="card">
      ${cardH('clock','Waiting For','orange',`<span class="pill orange">${DB.waitingFor.length}</span>`)}
      <div class="rows">${DB.waitingFor.map(w=>{const p=P(w.who);return `
        <div class="row-i" style="align-items:flex-start" onclick="personDetail('${w.who}')">
          <span style="width:8px;height:8px;border-radius:50%;background:${CV(w.c)};margin-top:6px;flex:0 0 8px"></span>
          <span style="min-width:0"><span class="t" style="font-size:13px">${w.what}</span><span class="s">${p.n} · menunggu ${w.since}</span></span>
          <span class="rt"><span class="pill ${w.c}">${w.due}</span></span></div>`}).join('')}</div>
      <div class="card-f"><span class="linkr" onclick="toast('Semua komitmen yang menunggu orang lain')">Semua yang ditunggu →</span></div>
    </div>

    <div class="card">
      ${cardH('brief','Business Alerts','red',srcPill(true))}
      <div class="rows">${DB.alerts.business.map(a=>`
        <div class="row-i" style="align-items:flex-start" onclick="go('${a.go}')">
          <span class="pill ${a.c}" style="margin-top:2px">${a.lv}</span>
          <span style="min-width:0"><span class="t" style="font-size:13px">${a.t}</span><span class="s">${a.s}</span></span></div>`).join('')}</div>
      <div class="card-f"><span class="linkr" onclick="go('business')">Business Empire →</span></div>
    </div>

    <div class="card">
      ${cardH('wallet','Money Alerts','green',srcPill(true))}
      <div class="rows">${DB.alerts.money.map(a=>`
        <div class="row-i" style="align-items:flex-start" onclick="go('${a.go}')">
          <span class="pill ${a.c}" style="margin-top:2px">${a.lv}</span>
          <span style="min-width:0"><span class="t" style="font-size:13px">${a.t}</span><span class="s">${a.s}</span></span></div>`).join('')}</div>
      <div class="card-f"><span class="linkr" onclick="go('finance')">Finance & Wealth →</span></div>
    </div>

    <div class="stack">
      <div class="card">
        ${cardH('users','Family Today','pink',srcPill(false))}
        <div class="rows">${DB.familyEvents.slice(0,2).map(e=>`
          <div class="row-i" onclick="go('family')"><span style="width:3px;height:26px;border-radius:3px;background:${CV(e.c)};flex:0 0 3px"></span>
          <span style="min-width:0"><span class="t" style="font-size:13px">${e.n}</span><span class="s">${e.d}${e.t!=='—'?' · '+e.t:''}</span></span></div>`).join('')}</div>
      </div>
      <div class="card">
        ${cardH('layers','Project Alerts','purple')}
        <div class="rows">${DB.alerts.project.slice(0,2).map(a=>`
          <div class="row-i" onclick="go('${a.go}')"><span class="pill ${a.c}">${a.lv}</span>
          <span style="min-width:0"><span class="t" style="font-size:12.5px">${a.t}</span></span></div>`).join('')}</div>
      </div>
      <div class="card" style="background:linear-gradient(150deg,var(--gold-tint),var(--surface))">
        ${cardH('bulb','Reflection','gold')}
        <p style="font-family:var(--fd);font-size:15.5px;line-height:1.5;margin:0;color:var(--text)">"${DB.reflection}"</p>
        <div class="card-f"><span class="linkr" onclick="eveningReview()">Evening Reflection →</span></div>
      </div>
    </div>
  </div>

  <div class="aibanner" style="margin-bottom:20px">
    <div class="z" style="position:relative;flex:1;min-width:240px">
      <div class="lb">AI Chief of Staff Insight</div>
      <h4>${DB.insights[0].t}</h4>
    </div>
    <div class="acts">
      <div class="t">Suggested Action</div>
      ${DB.insights[0].acts.map((a,i)=>`<div class="ai-act" onclick="this.classList.toggle('done');toast('Action: ${esc(a)}')"><span class="bx">✓</span>${a}</div>`).join('')}
    </div>
    <div class="btnw"><button class="btn-w" onclick="go('ai')">See All Insights ${ic('arrow','')}</button></div>
  </div>

  <div class="sect">
    <div><h2>Dashboard</h2><p>Gambaran hidup &amp; bisnis Anda sekilas</p></div>
    <div class="sp"><button class="btn ghost sm" onclick="customizeDash()">${ic('cog')} Customize Dashboard</button></div>
  </div>
  <div class="g g4">${DASH_CARDS.filter(c=>dummyOn()||c.live).map(dashCard).join('')}</div>
  ${dataFoot()}`;
}

function dataFoot(){
  return `<div class="datafoot">
    <div style="flex:1;min-width:240px"><b>Sumber angka keuangan:</b> ${DB.meta.source} — P&amp;L dan Balance Sheet Konsolidasi 2026, periode ${DB.meta.period}. Tersinkron ${DB.meta.synced}.</div>
    <div style="flex:1;min-width:240px">Kartu bertanda <span class="pill green">● SOURCE_REFERENCE</span> dibaca langsung dari laporan konsolidasi — tidak disalin, bukan data produksi. Kartu bertanda <span class="pill dummy">⚠ DUMMY DATA</span> memakai <code>is_dummy = true</code> dan tidak boleh jadi dasar keputusan.</div>
    <button class="btn gold sm" onclick="go('os')">Lihat status semua sumber →</button>
  </div>`;
}

function dashCard(c){
  return `<div class="card click kpi" onclick="go('${c.go}')">
    ${cardH(c.ic,c.t,c.c)}
    <div class="row" style="align-items:flex-end">
      <div style="min-width:0"><div class="val">${c.v}<small>${c.u}</small></div><div class="lbl">${c.s}</div></div>
      <div style="width:96px;flex:0 0 96px">${spark(c.sp,c.c)}</div>
    </div>
    ${trend(c.tr,c.up)}</div>`;
}

/* ---------- DASHBOARD (big picture, KPI summary only) ---------- */
VIEWS.dashboard = () => DSH_HEAD() + DSH_BODY();
function DSH_HEAD(){ return `
  <div class="page-h">
    <div><h1>Dashboard</h1><p>Big picture — bukan duplikasi modul. Hanya ringkasan KPI &amp; sinyal.</p></div>
    <div class="sp">
      <button class="chip on">Bulan ini</button><button class="chip" onclick="toast('Rentang: Kuartal berjalan')">Kuartal</button>
      <button class="chip" onclick="toast('Rentang: Tahun 2026')">Tahun</button>
      <button class="btn gold sm" onclick="customizeDash()">${ic('cog')} Customize</button>
    </div>
  </div>
`;
}
function DSH_BODY(){
  return `
  <div class="g g21">
    <div class="card">
      ${cardH('chart','Life by Design Score','gold',`<span class="pill gold">Rata-rata 79</span>`)}
      <div class="flexr" style="align-items:flex-start;gap:24px">
        ${ring(79,'gold',112,10)}
        <div class="scorebar" style="flex:1;min-width:220px">
          ${DB.lifeScore.map(s=>barLine(s.n,s.v,100,s.c)).join('')}
        </div>
      </div>
      <div class="card-f"><span class="linkr" onclick="weeklyReview()">Buka Weekly Life by Design Review →</span></div>
    </div>
    <div class="stack">
      <div class="card">
        ${cardH('bulb','Sinyal Utama Minggu Ini','purple')}
        <div class="rows">${DB.insights.slice(1,4).map(i=>`
          <div class="row-i" onclick="go('ai')"><span style="width:8px;height:8px;border-radius:50%;background:${CV(i.c)};flex:0 0 8px"></span>
          <span style="min-width:0"><span class="t" style="font-size:12.5px;font-weight:500;line-height:1.4">${i.t}</span></span></div>`).join('')}</div>
      </div>
      <div class="card">
        ${cardH('shield','System Health','blue',`<span class="pill green">100%</span>`)}
        <p class="sub" style="margin-bottom:10px">Kelengkapan data Aji OS per modul</p>
        <div class="scorebar">${[['Business',96,'gold'],['Finance',92,'green'],['Network',81,'teal'],['Family',64,'pink'],['Wellbeing',88,'green']].map(x=>barLine(x[0],x[1],100,x[2])).join('')}</div>
      </div>
    </div>
  </div>

  <div class="sect"><div><h2>KPI Summary</h2><p>Klik kartu untuk masuk ke modulnya</p></div></div>
  <div class="g g4">${DASH_CARDS.filter(c=>dummyOn()||c.live).map(dashCard).join('')}</div>

  <div class="sect"><div><h2>Business Pulse per Unit</h2><p>Angka asli Juli 2026 — detail lengkap ada di Business Empire</p></div>
    <div class="sp">${srcPill(true)}<button class="btn gold sm" onclick="go('business')">Buka Business Empire →</button></div></div>
  <div class="card" style="padding:8px 10px 14px">
    <div class="tw"><table class="tbl"><thead><tr><th>Unit</th><th class="num">Revenue</th><th class="num">MoM</th><th class="num">Laba bersih</th><th class="num">Net margin</th><th class="num">Kas</th><th>Perhatian CEO</th></tr></thead>
    <tbody>${DB.units.map(u=>`<tr onclick="unitDetail('${u.id}')">
      <td><b>${u.name}</b><div class="mini">${u.cat}</div></td>
      <td class="num">${u.live?money(u.rev):'—'}</td>
      <td class="num" style="color:${u.gr>0?'var(--green)':u.gr<0?'var(--red)':'var(--text-3)'};font-weight:700">${u.live&&u.rev?pct(u.gr):'—'}</td>
      <td class="num">${u.live?money(u.profit):'—'}</td>
      <td class="num">${u.live&&u.rev?`<span class="pill ${u.margin>=25?'green':u.margin>=15?'blue':'orange'}">${String(u.margin).replace('.',',')}%</span>`:'<span class="pill gray">—</span>'}</td>
      <td class="num">${u.live?money(u.cash):'—'}</td>
      <td class="mini">${u.attention}</td></tr>`).join('')}</tbody></table></div>
    <div class="card-f mini">${DB.meta.caveats[0]}</div>
  </div>
  ${dataFoot()}`;
}

/* customize dashboard */
function customizeDash(){
  modal('Customize Dashboard','Tambah, hapus, pin, atau urutkan kartu. Perubahan berlaku di My Day &amp; Dashboard.',
   `<div class="rows">${DASH_CARDS.map((c,i)=>`
     <div class="row-i" style="cursor:default">
       <div class="ic" style="width:28px;height:28px;border-radius:9px;display:grid;place-items:center;background:${CT(c.c)};color:${CV(c.c)};flex:0 0 28px">${ic(c.ic)}</div>
       <span style="min-width:0"><span class="t">${c.t}</span><span class="s">Sumber: ${c.go}</span></span>
       <span class="rt" style="display:flex;gap:5px">
         <button class="btn ghost sm" onclick="toast('${esc(c.t)} di-pin ke atas')">Pin</button>
         <button class="btn ghost sm" onclick="moveCard(${i},-1)">↑</button>
         <button class="btn ghost sm" onclick="moveCard(${i},1)">↓</button>
         <button class="btn ghost sm" style="color:var(--red);border-color:var(--red)" onclick="removeCard('${c.id}')">Hapus</button>
       </span></div>`).join('')}</div>`,
   `<button class="btn gold" onclick="toast('Kartu baru — pilih sumber data dari 24 entity Aji OS')">${ic('plus')} Add Card</button>
    <button class="btn solid" style="margin-left:auto" onclick="closeModal();go(CUR)">Selesai</button>`);
}
function moveCard(i,d){const j=i+d; if(j<0||j>=DASH_CARDS.length)return; const t=DASH_CARDS[i];DASH_CARDS[i]=DASH_CARDS[j];DASH_CARDS[j]=t; customizeDash();}
function removeCard(id){const i=DASH_CARDS.findIndex(c=>c.id===id); if(i>-1)DASH_CARDS.splice(i,1); customizeDash(); toast('Kartu dihapus dari dashboard');}

/* detail modals dipakai lintas modul */
function scoreDetail(){
  modal("Today's Score — 87/100",'Gabungan wellbeing, beban kerja, prioritas, jadwal, keputusan, pemulihan, keluarga, dan fokus.',
   `<div class="scorebar">${[['Wellbeing',82,'green'],['Beban kerja',71,'orange'],['Prioritas jelas',95,'blue'],['Kepadatan jadwal',64,'orange'],['Keputusan tertunda',60,'red'],['Pemulihan',58,'teal'],['Keluarga',74,'pink'],['Fokus tersedia',88,'purple']].map(x=>barLine(x[0],x[1],100,x[2])).join('')}</div>
    <div class="sep" style="margin:16px 0"></div>
    <p class="sub"><b style="color:var(--text)">Yang menaikkan skor:</b> prioritas sangat jelas dan energi tinggi.<br>
    <b style="color:var(--text)">Yang menahan skor:</b> 5 keputusan menggantung dan hanya 58% waktu pemulihan tercapai.</p>`,
   `<button class="btn gold" onclick="closeModal();go('wellbeing')">Buka Wellbeing</button><button class="btn solid" onclick="closeModal();go('os')">Selesaikan Keputusan</button>`);
}
function focusDetail(){
  modal('Focus Mode — Deep Work','Blok fokus berikutnya 2 jam 30 menit sebelum Care Estate Project Review.',
   `<p class="sub">Aturan meeting Anda: <em>Selasa &amp; Kamis pagi bebas meeting untuk deep work.</em></p>
    <div class="sep" style="margin:14px 0"></div>
    <div class="rows">
      <div class="row-i" onclick="toast('Blok 90 menit ditambahkan ke kalender')">${ic('clock','')}<span><span class="t">Blok 90 menit deep work</span><span class="s">Tambahkan ke Google Calendar</span></span></div>
      <div class="row-i" onclick="toast('Notifikasi bisnis dibisukan 90 menit')">${ic('shield','')}<span><span class="t">Bisukan notifikasi bisnis</span><span class="s">Kecuali kritikal</span></span></div>
      <div class="row-i" onclick="setMode('focus')">${ic('target','')}<span><span class="t">Aktifkan Focus Mode</span><span class="s">Tugas, keputusan, dan deep work naik ke atas</span></span></div>
    </div>`);
}
function evDetail(n,t,tag,dur,c){
  modal(n,`${t} · ${tag} · ${dur}`,
   `<dl class="kv"><dt>Waktu</dt><dd>${t} WITA (${dur})</dd><dt>Kategori</dt><dd><span class="pill ${c}">${tag}</span></dd>
    <dt>Lokasi</dt><dd>Ubud, Bali</dd><dt>Sumber</dt><dd>Google Calendar</dd></dl>
    <div class="sep" style="margin:16px 0"></div>
    <p class="sub">Semua catatan meeting otomatis tersimpan ke Knowledge dan tertaut ke orang serta proyek terkait.</p>`,
   `<button class="btn gold" onclick="closeModal();go('knowledge')">Catatan Meeting</button>
    <button class="btn ghost" onclick="toast('Agenda dijadwalkan ulang')">Jadwalkan ulang</button>
    <button class="btn ghost" onclick="toast('Didelegasikan ke COO')">Delegasikan</button>`);
}
function taskDetail(id){
  const t=DB.priorities.find(x=>x.id===id); if(!t)return;
  modal(t.n,`${t.s}`,
   `<div class="flexr" style="margin-bottom:14px"><span class="pill ${t.c}">${t.p}</span><span class="pill gray">Owner: Aji Jaens</span></div>
    <p class="sub">${t.ctx}</p>`,
   `<button class="btn grn" onclick="closeModal();toast('Selesai: ${esc(t.n)}')">${ic('check')} Tandai selesai</button>
    <button class="btn ghost" onclick="toast('Didelegasikan — owner & deadline diminta')">Delegasikan</button>
    <button class="btn ghost" onclick="toast('Dijadwalkan ulang ke besok')">Tunda</button>`);
}
function decDetail(id){
  const d=DB.decisions.find(x=>x.id===id); if(!d)return;
  modal(d.n,`${d.unit} · ${d.type} · Deadline ${d.due}`,
   `<div class="flexr" style="margin-bottom:16px">
      ${idPill(gid('DEC',DB.decisions,id))}<span class="pill ${d.c}">Deadline ${d.due}</span><span class="pill gold">Dampak ${d.impact}</span>
      <span class="pill ${d.risk==='High'?'red':d.risk==='Medium'?'orange':'green'}">Risiko ${d.risk}</span></div>
    <p class="sub" style="font-size:13.5px;color:var(--text)">${d.ctx}</p>
    <div class="sep" style="margin:16px 0"></div>
    <div class="card-h" style="margin-bottom:10px"><h3>Opsi</h3></div>
    ${d.opts.map((o,i)=>`<div class="pr" style="background:var(--surface-2)" onclick="toast('Opsi dipilih: ${esc(o)}')">
      <span class="n" style="background:var(--gold)">${String.fromCharCode(65+i)}</span><span><b>${o}</b></span></div>`).join('')}
    <div style="margin-top:14px;padding:13px;border-radius:12px;background:var(--purple-t);border:1px solid var(--border-soft)">
      <div style="font-size:10.5px;font-weight:800;letter-spacing:1px;color:var(--purple);text-transform:uppercase">Rekomendasi AI Chief of Staff</div>
      <div style="margin-top:5px;font-size:13.5px">${d.rec}</div></div>
    <dl class="kv" style="margin-top:16px"><dt>Owner keputusan</dt><dd>${d.owner}</dd><dt>Aturan berlaku</dt><dd>Di atas Rp 500 Jt → keputusan Aji dengan opsi tertulis</dd></dl>`,
   `<button class="btn grn" onclick="closeModal();toast('Disetujui — tercatat di Decision Log')">${ic('check')} Decide &amp; Approve</button>
    <button class="btn ghost" onclick="toast('Didelegasikan ke ${esc(d.owner)}')">Delegasikan</button>
    <button class="btn red" onclick="toast('Ditunda — pengingat dibuat')">Tunda</button>`,true);
}

