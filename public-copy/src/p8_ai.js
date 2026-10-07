/* ============ AI CHIEF OF STAFF · GLOBAL SEARCH · INIT ============ */
const AI_Q = [
  'Apa agenda saya hari ini?','Apa keputusan yang belum selesai?','Siapa yang perlu saya follow up?',
  'Bagaimana kondisi cash?','Apa project paling bermasalah?','Hubungan bisnis mana yang mulai dingin?',
  'Bagaimana wellbeing saya minggu ini?','Apa perjalanan berikutnya?','Apa yang harus saya delegasikan?',
  'Apa tiga hal paling penting hari ini?','Apa yang harus saya hentikan?','Bagaimana kondisi Outlet 4?',
  'Berapa piutang grup sekarang?','Angka ini dari mana sumbernya?','Bagaimana posisi neraca grup?'
];

const AI_BRAIN = [
  {k:['tiga','3 hal','penting','prioritas','priority'], a:()=>`Tiga hal paling penting hari ini:\n\n1. **${DB.priorities[0].n}** — ${DB.priorities[0].s}\n2. **${DB.priorities[1].n}** — ${DB.priorities[1].s}\n3. **${DB.priorities[2].n}** — ${DB.priorities[2].s}\n\nSisanya bisa menunggu atau didelegasikan.`},
  {k:['agenda','jadwal','schedule','kalender'], a:()=>`Hari ini ada ${DB.schedule.length} agenda. Dua yang penting: **Leadership Meeting Jaens Spa 09:00** dan **Company Visit Bank Mitra 14:00**.\n\nJendela deep work tersedia 13:00–14:00. Family dinner 19:30 — sesuai Personal Boundaries Anda, jangan dijadwalkan ulang.\n\n(Agenda masih demo — Google Calendar belum disambungkan.)`},
  {k:['keputusan','decision','putus'], a:()=>`Ada ${DB.decisions.length} keputusan menunggu, dua di antaranya kritikal:\n\n1. **${DB.decisions[0].n}** — ${DB.decisions[0].due}, dampak ${DB.decisions[0].impact}.\n   Rekomendasi: ${DB.decisions[0].rec}\n2. **${DB.decisions[1].n}** — ${DB.decisions[1].due}, dampak ${DB.decisions[1].impact}.\n\nAturan Anda: di atas Rp 500 Jt harus keputusan Aji dengan opsi tertulis.`},
  {k:['follow up','hubungi','kontak','relasi','dingin','network'], a:()=>`Empat orang perlu Anda hubungi hari ini:\n\n• **CFO Grup (CFO)** — closing Juli & rencana konsolidasi Academy\n• **Relationship Manager Bank (BNI)** — konfirmasi company visit\n• **Investor A** — paling lama tanpa kontak\n• **Mitra Strategis A** — kepastian lahan fase 2\n\nRelasi yang mendingin: **Pengembang Lahan** dan **Editor Media**.`},
  {k:['cash','kas','uang','likuid'], a:()=>`Kas & bank grup **${money(DB.fin.cash)}** per bulan tertutup terakhir — tertinggi tahun ini.\n\nSebaran per unit bisa dilihat di modul Finance.\n\nCatatan penting: dibanding beban operasional bulanan, ini **masih di bawah** aturan buffer 3 bulan Anda. Piutang ${money(DB.fin.ar)} juga naik dua kali lipat sejak April.`},
  {k:['laba','profit','margin','untung'], a:()=>`Laba bersih Juli **${money(DB.fin.profit)}** naik dari bulan sebelumnya, dengan net margin terhadap revenue setelah eliminasi.\n\nYTD Januari–Juli: revenue ${money(DB.fin.ytdRev)}, laba ${money(DB.fin.ytdProfit)}. Titik terendah tahun ini ada di kuartal pertama.\n\nHati-hati membaca margin per unit: J'Fresh dan Essences belum dibebani management expense.`},
  {k:['project','proyek','bermasalah','risk'], a:()=>`Proyek paling bermasalah: **Ramp-up Outlet 4**.\n\nAngkanya: revenue menurun bulan ini, margin di bawah rata-rata grup, aset tetap dan liabilitas lancarnya terbesar di grup, dan masih ada akumulasi rugi tahun berjalan.\n\nKedua: **Pemulihan Jaens Essences** — revenue turun tajam dan kas unitnya paling tipis di grup.`},
  {k:['bisma','outlet baru'], a:()=>`Outlet terbaru buka pertengahan tahun dan sudah untung bulanan — itu kabar baiknya.\n\nMasalahnya skala: marginnya jauh di bawah tiga outlet lain, aset tetapnya menyerap porsi besar ekuitas grup, dan akumulasi rugi tahun berjalan masih ada.\n\nYang kurang adalah volume, bukan model bisnisnya. Rekomendasi saya: program pemasaran 3 bulan, bukan menahan investasi.`},
  {k:['wellbeing','sehat','kesehatan','energi','tidur'], a:()=>`Health score **${DB.well.score}/100** (Good). Tidur rata-rata ${String(DB.well.sleep).replace('.',',')} jam, energi 4/5, stres 2/5.\n\nYang tertinggal: recovery ${DB.well.focus}% dari target dan waktu keluarga 6,2 dari 10 jam.\n\n(Modul Wellbeing masih demo — belum ada health tracker tersambung.)`},
  {k:['travel','perjalanan','trip','jakarta'], a:()=>`Perjalanan berikutnya: **${DB.trips[0].dest}**, ${DB.trips[0].dep} — ${DB.trips[0].in} hari lagi. Bersama CFO, tiga meeting: Investor A, Relationship Manager Bank, Penasihat Hukum.\n\nBawa angka bulan tertutup terakhir dari modul Finance. Ini posisi tawar terkuat tahun ini.`},
  {k:['delegasi','delegate','delegasikan'], a:()=>`Tiga hal yang sebaiknya didelegasikan:\n\n• **Program penagihan piutang** → CFO, dengan termin dan daftar klien lewat tempo\n• **Analisis okupansi & bauran layanan outlet terbaru** → COO, dalam bentuk opsi tertulis\n• **Mapping akun Academy & Pondok Impian** → CFO\n\nYang tidak bisa didelegasikan: keputusan arah outlet terbaru — itu aset terbesar di grup.`},
  {k:['hentikan','stop','berhenti'], a:()=>`Dua hal yang sebaiknya Anda hentikan:\n\n• **Menunda keputusan Outlet 4 bulan demi bulan.** Sudah tiga bulan berjalan tanpa arah tegas, dan setiap bulan menambah akumulasi rugi.\n• **Menerima dinner bisnis di malam hari kerja** — sumber utama turunnya waktu keluarga tiga minggu berturut.`},
  {k:['keluarga','family','anak','istri'], a:()=>`Waktu keluarga minggu ini **6,2 dari 10 jam** — turun tiga minggu berturut.\n\nAgenda dekat: family dinner malam ini 19:30, ulang tahun Anak Pertama bulan depan, konsultasi kampus pertengahan bulan depan, trip Tokyo 20–27 Oktober.\n\n(Modul Family masih demo.)`},
  {k:['bisnis','business','revenue','unit','empire','omzet'], a:()=>`Revenue konsolidasi Juli **${money(DB.fin.rev)}** setelah eliminasi, naik tipis MoM, atau ${money(DB.fin.revGross)} sebelum eliminasi.\n\nRincian per unit ada di modul Business.\n\nDua hal yang perlu Anda tahu: **Care Estate nol sepanjang 2026** di laporan konsolidasi, dan **Academy serta Pondok Impian tidak ada kolomnya sama sekali**. Anda memimpin tiga unit yang datanya tidak terbaca.`},
  {k:['piutang','tagihan','ar '], a:()=>`Piutang usaha **${money(DB.fin.ar)}** per bulan terakhir — lebih dari dua kali lipat dalam tiga bulan.\n\nTerbesar: Jaens Essences dan J'Fresh Laundry — keduanya klien B2B/korporat.\n\nArtinya sebagian pertumbuhan Anda masih tertahan di tagihan, bukan di kas.`},
  {k:['aset','neraca','ekuitas','net worth','kekayaan'], a:()=>`Neraca grup Juli 2026: total aset **${money(DB.fin.assets)}**, liabilitas ${money(DB.fin.totLiab)}, ekuitas **${money(DB.fin.equity)}**.\n\nAset tetap melonjak sejak pertengahan tahun — hampir seluruhnya investasi outlet terbaru.\n\nCatatan: ini ekuitas bisnis dari laporan konsolidasi, bukan net worth pribadi Anda secara keseluruhan.`},
  {k:['academy','pondok','konsolidasi'], a:()=>`**Jaens Academy** dan **Jaens Pondok Impian** tidak muncul di P&L maupun Balance Sheet konsolidasi 2026 — tidak ada kolomnya sama sekali.\n\n**Care Estate** punya kolom, tetapi nol sepanjang Januari–Juli.\n\nArtinya angka grup yang Anda lihat hari ini belum lengkap. Ada keputusan menunggu soal ini — konsolidasi mulai September atau Januari 2027.`},
  {k:['social','dampak','impact','bali spa'], a:()=>`Dampak sosial kumulatif 2026: **2.450 orang terdampak**, 604 terapis dilatih, 394 lapangan kerja.\n\nBali Spa Bersatu kini 318 anggota. Kongres 2026 progres 55%.\n\n(Modul Social Movement masih demo.)`},
  {k:['brand','konten','content','followers'], a:()=>`Jangkauan konten bulan ini **125K** (+23%), followers 48,6K, engagement 6,8%, 34 lead.\n\nBuku "Life by Design" tertinggal — bab 4 dari 12.\n\n(Modul Brand masih demo.)`},
  {k:['sumber data','data','akurat','dari mana'], a:()=>`Angka keuangan di Aji OS dibaca langsung dari **${DB.meta.source}**, tersinkron ${DB.meta.synced}:\n\n• P&L Consolidation 2026 — Januari s.d. Juli\n• Balance Sheet Consolidation 2026 — Januari s.d. Juli\n• Cash Flow Daily — terbaca tapi berhenti di Mei 2026\n\nModul Wellbeing, Family, Network, Social Movement, Travel, dan Brand masih memakai demo data dan ditandai badge abu-abu.\n\nEmpat catatan kualitas data: ${DB.meta.caveats.map((c,i)=>`\n${i+1}. ${c}`).join('')}`}
];
function aiAnswer(q){
  const s=q.toLowerCase();
  const hit=AI_BRAIN.find(b=>b.k.some(k=>s.includes(k)));
  if(hit) return hit.a();
  return `Saya belum punya jawaban spesifik untuk itu, tapi saya bisa lihat lintas modul. Coba tanya soal agenda, keputusan, cash, proyek, relasi, wellbeing, keluarga, travel, atau dampak sosial.\n\nContoh: "Apa tiga hal paling penting hari ini?"`;
}
let CHAT=[];
function openAI(q){
  document.getElementById('aiDr').classList.add('on');
  if(!CHAT.length){ CHAT.push({r:'ai',t:`Selamat datang, Aji. Saya sudah membaca closing bulan tertutup terakhir (data contoh).\n\nRingkasnya: bulan terbaik tahun ini — revenue ${money(DB.fin.rev)}, laba ${money(DB.fin.profit)}, kas ${money(DB.fin.cash)}.\n\nDua hal yang menahan: **outlet terbaru** dengan margin di bawah rata-rata grup dan akumulasi rugi tahun berjalan, dan **piutang ${money(DB.fin.ar)}** yang naik dua kali lipat sejak April.\n\nApa yang ingin Anda dalami lebih dulu?`}); }
  document.getElementById('aiSug').innerHTML = AI_Q.slice(0,4).map(x=>`<button class="chip" style="font-size:11.5px;padding:4px 10px" onclick="ask('${esc(x)}')">${x}</button>`).join('');
  renderChat();
  if(q) setTimeout(()=>ask(q),160);
}
const closeAI=()=>document.getElementById('aiDr').classList.remove('on');
function renderChat(){
  document.getElementById('chat').innerHTML = CHAT.map(m=>
    `<div class="bub ${m.r}">${m.t.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>')}</div>`).join('');
  const b=document.querySelector('#aiDr .dr-b'); if(b) b.scrollTop=b.scrollHeight;
}
function ask(q){ CHAT.push({r:'me',t:q}); renderChat();
  setTimeout(()=>{ CHAT.push({r:'ai',t:aiAnswer(q)}); renderChat(); },380); }
function sendAI(){ const i=document.getElementById('aiIn'); const v=(i.value||'').trim(); if(!v)return; i.value=''; ask(v); }

/* ---------------- GLOBAL SEARCH / COMMAND PALETTE ---------------- */
function searchAll(q){
  const s=q.toLowerCase().trim(); const R=[];
  const add=(g,t,sub,fn,k)=>R.push({g,t,sub,fn,k});
  if(!s){
    add('Perintah','Ask Aji AI Chief of Staff','Tanya apa saja tentang hidup & bisnis Anda','openAI()','↵');
    add('Perintah','Morning Dharma Briefing','Ringkasan pagi 11 bagian','morningBrief()');
    add('Perintah','Daily Check-in','Catat energi, stres, mood, tidur','checkin()');
    add('Perintah','Weekly Life by Design Review','Skor 10 dimensi','weeklyReview()');
    add('Perintah','Customize Dashboard','Tambah, hapus, urutkan kartu','customizeDash()');
    add('Perintah','Tambah Baru (+ Add)','Task, Meeting, Person, Note, Idea, Project, Decision…','openCreate()');
    add('Perintah','Buka Global Inbox','Antrean tangkapan yang belum dirutekan','openInbox()');
    add('Perintah','Data Saya','Semua record asli yang Anda entri · ekspor CSV','fTab=\'mydata\';go(\'foundation\')');
    add('Perintah','System Foundation','Arsitektur, sumber data, dummy data, audit','go(\'foundation\')');
    NAV.forEach(n=>add('Navigasi',n.n,'Buka modul','go(\''+n.id+'\')'));
    return R;
  }
  NAV.filter(n=>n.n.toLowerCase().includes(s)).forEach(n=>add('Navigasi',n.n,'Modul','go(\''+n.id+'\')'));
  /* Record asli buatan pengguna — selalu ikut dicari, apa pun mode data contoh */
  SCH_ORDER.forEach(ty=>{
    const S=SCHEMA[ty];
    recs(ty).filter(r=>JSON.stringify(r).toLowerCase().includes(s))
      .forEach(r=>add(S.n+' · data asli', S.t(r), (S.s(r)||'')+' · '+r.id, `recDetail('${r.id}')`));
  });
  if(dummyOn()){
  DB.people.filter(p=>(p.n+p.org+p.pos+p.cat).toLowerCase().includes(s)).forEach(p=>add('People',p.n,p.pos+' · '+p.org,`personDetail('${p.id}')`));
  DB.units.filter(u=>(u.name+u.cat).toLowerCase().includes(s)).forEach(u=>add('Business Unit',u.name,u.cat,`unitDetail('${u.id}')`));
  DB.projects.filter(p=>(p.n+p.unit+p.cat).toLowerCase().includes(s)).forEach(p=>add('Projects',p.n,p.unit+' · '+p.st,`prjDetail('${p.id}')`));
  DB.decisions.filter(d=>(d.n+d.unit).toLowerCase().includes(s)).forEach(d=>add('Decisions',d.n,d.unit+' · '+d.due,`decDetail('${d.id}')`));
  DB.knowledge.filter(k=>(k.t+k.cat+k.type+k.ex).toLowerCase().includes(s)).forEach(k=>add('Knowledge',k.t,k.type+' · '+k.cat,`kDetail('${k.id}')`));
  DB.trips.filter(t=>(t.dest+t.country+t.type).toLowerCase().includes(s)).forEach(t=>add('Travel','Trip '+t.dest,t.dep+' · '+t.type,`tripDetail('${t.id}')`));
  DB.social.filter(x=>x.n.toLowerCase().includes(s)).forEach(x=>add('Social Movement',x.n,x.role,`socDetail('${x.id}')`));
  DB.content.filter(c=>c.t.toLowerCase().includes(s)).forEach(c=>add('Content',c.t,c.pil+' · '+c.st,`go('brand')`));
  DB.schedule.filter(e=>e.n.toLowerCase().includes(s)).forEach(e=>add('Kalender',e.n,e.t+' · '+e.tag,`go('myday')`));
  DB.family.filter(f=>f.n.toLowerCase().includes(s)).forEach(f=>add('Family',f.n,f.rel,`famDetail('${f.id}')`));
  DB.ops.filter(o=>o.n.toLowerCase().includes(s)).forEach(o=>add('Operations',o.n,o.unit+' · health '+o.health,`go('operations')`));
  }
  add('AI','Tanya "'+h(q)+'" ke AI Chief of Staff','Jawaban lintas modul',`openAI('${esc(q)}')`,'↵');
  return R;
}
let palSel=0, palRes=[];
function renderPal(){
  const q=document.getElementById('palIn').value; palRes=searchAll(q); palSel=0;
  let html='', last='';
  palRes.slice(0,40).forEach((r,i)=>{
    if(r.g!==last){html+=`<div class="pal-g">${r.g}</div>`;last=r.g;}
    html+=`<div class="pal-i ${i===0?'sel':''}" data-i="${i}" onclick="runPal(${i})">
      <div style="width:26px;height:26px;border-radius:8px;background:var(--gold-tint);color:var(--gold-dark);display:grid;place-items:center;flex:0 0 26px">${ic(r.g==='People'?'users':r.g==='Projects'?'layers':r.g==='Decisions'?'scale':r.g==='Knowledge'?'book':r.g==='Travel'?'plane':r.g==='AI'?'spark':r.g==='Perintah'?'bolt':'grid')}</div>
      <div style="min-width:0"><div class="t">${r.t}</div><div class="s">${r.sub}</div></div>${r.k?`<span class="k">${r.k}</span>`:''}</div>`;
  });
  document.getElementById('palB').innerHTML = html||'<div class="empty">Tidak ada hasil. Coba kata kunci lain.</div>';
}
function runPal(i){const r=palRes[i]; if(!r)return; closePal(); try{eval(r.fn)}catch(e){toast('Membuka '+r.t)}}
function openPal(){document.getElementById('palOv').classList.add('on');const i=document.getElementById('palIn');i.value='';renderPal();setTimeout(()=>i.focus(),40);}
const closePal=()=>document.getElementById('palOv').classList.remove('on');

/* ---------------- INIT ---------------- */
document.getElementById('palIn').addEventListener('input',renderPal);
document.addEventListener('keydown',e=>{
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openPal();return;}
  if(e.key==='Escape'){closePal();closeModal();closeNotif();closeAI();closeInbox();}
  if(document.getElementById('palOv').classList.contains('on')){
    const n=document.querySelectorAll('.pal-i');
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();
      n[palSel]&&n[palSel].classList.remove('sel');
      palSel=(palSel+(e.key==='ArrowDown'?1:-1)+n.length)%n.length;
      n[palSel]&&n[palSel].classList.add('sel'); n[palSel]&&n[palSel].scrollIntoView({block:'nearest'});}
    if(e.key==='Enter'){e.preventDefault();runPal(palSel);}
  }
});
try{const t=localStorage.getItem('ajios-theme'); if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}
renderNav();
renderInbox();
go((location.hash||'').replace('#','')||'myday');
setTimeout(()=>toast('Aji Jaens OS siap — tekan ⌘K untuk mencari apa saja'),900);

