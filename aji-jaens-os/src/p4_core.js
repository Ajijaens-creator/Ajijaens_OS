/* ================= CORE: ICONS, CHARTS, HELPERS, ROUTER ================= */
const ICONS = {
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  grid:'<rect x="3" y="3" width="7" height="8" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="11" width="7" height="10" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/>',
  book:'<path d="M4 5a2 2 0 012-2h12v18H6a2 2 0 01-2-2z"/><path d="M8 7h7M8 11h7"/>',
  heart:'<path d="M20.8 6.6a5 5 0 00-7.1 0L12 8.3l-1.7-1.7a5 5 0 10-7.1 7.1l8.8 8.8 8.8-8.8a5 5 0 000-7.1z"/>',
  brief:'<rect x="2" y="7" width="20" height="14" rx="3"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M2 13h20"/>',
  users:'<path d="M16 20v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 20v-2a4 4 0 00-3-3.9"/><path d="M16 3.1a4 4 0 010 7.8"/>',
  net:'<circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="18" r="2.5"/><circle cx="19" cy="18" r="2.5"/><path d="M12 7.5v4M10 13l-3.4 3M14 13l3.4 3"/>',
  globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 010 18a15 15 0 010-18z"/>',
  plane:'<path d="M17.8 19.8L16 14l-4-1.5V8.5a1.5 1.5 0 00-3 0v4L5 14l-1.8 5.8 4.3-2.3L9 22l1.5-1 1.5 1 1.5-4.5z" transform="rotate(45 12 12)"/>',
  cpu:'<rect x="5" y="5" width="14" height="14" rx="3"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
  mega:'<path d="M3 11v2a1 1 0 001 1h2l5 4V6L6 10H4a1 1 0 00-1 1z"/><path d="M16 8.5a4 4 0 010 7M18.5 6a7.5 7.5 0 010 12"/>',
  wallet:'<rect x="2.5" y="6" width="19" height="14" rx="3"/><path d="M2.5 10h19M17 15h1.5"/><path d="M18 6V4.5a1.5 1.5 0 00-1.9-1.4L4 6"/>',
  cog:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>',
  layers:'<path d="M12 2.5l9 5-9 5-9-5z"/><path d="M3 12.5l9 5 9-5M3 17l9 5 9-5"/>',
  spark:'<path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/><path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
  scale:'<path d="M12 3v18M7 21h10M5 7l-3 6h6zM19 7l-3 6h6zM5 7h14"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  flag:'<path d="M5 21V4M5 4h11l-1.5 3.5L16 11H5"/>',
  shield:'<path d="M12 2.5l8 3v6c0 5-3.4 8.8-8 10-4.6-1.2-8-5-8-10v-6z"/><path d="M9 12l2 2 4-4"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  crown:'<path d="M3 18h18M4 8l4 4 4-7 4 7 4-4-2 10H6z"/>',
  chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  doc:'<path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  bulb:'<path d="M9.5 18h5M10 21h4"/><path d="M12 2a6 6 0 00-3.5 10.9c.6.5.9 1.2.9 2h5.2c0-.8.3-1.5.9-2A6 6 0 0012 2z"/>',
  bolt:'<path d="M13 2L4 14h6l-1 8 9-12h-6z"/>',
  home:'<path d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 20z"/><path d="M9.5 21.5V13h5v8.5"/>',
  pin:'<path d="M12 21s7-5.6 7-11a7 7 0 10-14 0c0 5.4 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  check:'<path d="M4 12.5l5 5L20 6.5"/>',
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  phone:'<path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.2a2 2 0 012.1-.5c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z"/>',
  mail:'<rect x="2.5" y="4.5" width="19" height="15" rx="3"/><path d="M3 7l9 6 9-6"/>',
  wa:'<path d="M3 21l1.6-4.4A8.4 8.4 0 1121 12a8.4 8.4 0 01-13.3 6.9z"/><path d="M8.6 9.2c.2-.5.4-.5.7-.5h.5c.2 0 .4 0 .6.5l.7 1.6c.1.2 0 .4-.1.6l-.4.5c-.1.2-.2.3 0 .6a6 6 0 002.7 2.3c.3.1.5.1.6-.1l.5-.6c.2-.2.4-.2.6-.1l1.5.8c.2.1.4.3.3.6a2 2 0 01-1.9 1.4 7 7 0 01-6.4-6.3c0-.5.1-1 .3-1.3z"/>',
  fire:'<path d="M12 22c4 0 7-2.7 7-6.5 0-4-3-5.5-3-9.5 0 0-2 1.5-2 4 0 0-2-2-2-6-3 3-7 6.5-7 11.5C5 19.3 8 22 12 22z"/>',
  gift:'<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M3 12h18M12 8v13M12 8S9 8 8 6.5 9 3 12 8zM12 8s3 0 4-1.5S15 3 12 8z"/>'
};
const ic = (n,cls='') => `<svg viewBox="0 0 24 24" class="${cls}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[n]||ICONS.grid}</svg>`;

const CV = c => `var(--${c})`, CT = c => `var(--${c}-t)`;
const money = v => (v===null||v===undefined) ? '—' : 'Rp ' + (Math.abs(v)>=1 ? v.toFixed(2).replace('.',',')+' M' : Math.round(v*1000)+' Jt');
const pct = v => (v===null||v===undefined) ? '—' : (v>0?'+':'')+String(v).replace('.',',')+'%';
/* Badge sumber data: live = angka asli Finance Drive, demo = data contoh */
const srcPill = live => live
  ? `<span class="pill green" title="SOURCE_REFERENCE — dibaca langsung dari ${DB.meta.source}, tidak disalin">● SOURCE_REFERENCE · ${DB.meta.period}</span>`
  : `<span class="pill dummy" title="is_dummy = true — data contoh, tidak boleh jadi dasar keputusan">⚠ DUMMY DATA</span>`;
/* Strip peringatan besar untuk modul yang seluruh datanya dummy */
const dummyBar = (batch,mod) => `<div class="dummybar">
  <span class="dbadge">DEMO MODE</span>
  <div style="flex:1;min-width:200px"><b>Seluruh angka di modul ${mod} adalah data contoh.</b> Tidak boleh dipakai sebagai dasar keputusan. Batch <code>${batch}</code> · <code>is_dummy = true</code>.</div>
  <button class="btn ghost sm" onclick="go('foundation')">Kelola Dummy Data →</button></div>`;
/* ID global stabil — PER-000001, BUS-000001, dst. */
function gid(prefix, arr, id){ const i=arr.findIndex(x=>x.id===id); return i<0?'—':prefix+'-'+String(i+1).padStart(6,'0'); }
const idPill = code => `<span class="pill gray" style="font-variant-numeric:tabular-nums;letter-spacing:.4px">${code}</span>`;
/* esc(): aman dipakai di dalam string JS yang berada di atribut HTML (onclick) */
const esc = s => String(s).replace(/\\/g,'\\\\').replace(/&/g,'&amp;').replace(/'/g,"\\'").replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
/* h(): escape HTML biasa */
const h = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const P = id => DB.people.find(p=>p.id===id) || {n:'—',org:'',pos:'',c:'gray'};
const initials = n => n.replace(/^(Pak|Ibu|Mr\.|Mrs\.|dr\.|Dr\.)\s+/,'').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();

/* ---- charts (inline SVG, no libs) ---- */
function spark(data,color,w=104,h=34,fill=true){
  const mn=Math.min(...data), mx=Math.max(...data), r=(mx-mn)||1;
  const pts=data.map((v,i)=>[i/(data.length-1)*w, h-4-((v-mn)/r)*(h-8)]);
  const d=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  const id='g'+Math.random().toString(36).slice(2,8);
  return `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:${h}px;overflow:visible" preserveAspectRatio="none">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${CV(color)}" stop-opacity=".26"/><stop offset="1" stop-color="${CV(color)}" stop-opacity="0"/></linearGradient></defs>
    ${fill?`<path d="${d} L${w} ${h} L0 ${h} Z" fill="url(#${id})"/>`:''}
    <path d="${d}" fill="none" stroke="${CV(color)}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
    <circle cx="${pts[pts.length-1][0]}" cy="${pts[pts.length-1][1]}" r="2.6" fill="${CV(color)}"/></svg>`;
}
function ring(pct,color,size=78,sw=8,label){
  const r=(size-sw)/2, c=2*Math.PI*r;
  return `<div class="ring-w" style="width:${size}px;height:${size}px;flex-basis:${size}px">
   <svg viewBox="0 0 ${size} ${size}" style="width:${size}px;height:${size}px;transform:rotate(-90deg)">
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--surface-3)" stroke-width="${sw}"/>
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${CV(color)}" stroke-width="${sw}" stroke-linecap="round"
      stroke-dasharray="${c}" stroke-dashoffset="${c*(1-pct/100)}" style="transition:stroke-dashoffset 1s cubic-bezier(.2,.8,.3,1)"/>
   </svg><b>${label!==undefined?label:pct}</b></div>`;
}
function bars(data,color,h=64,labels){
  const mx=Math.max(...data)||1;
  return `<div style="display:flex;align-items:flex-end;gap:5px;height:${h}px">${data.map((v,i)=>
    `<div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%;gap:4px" title="${v}">
      <div style="height:${Math.max(4,v/mx*(h-14))}px;background:${CV(color)};border-radius:5px;opacity:${.42+.58*(v/mx)}"></div>
      ${labels?`<span style="font-size:9px;color:var(--text-3);text-align:center">${labels[i]}</span>`:''}
    </div>`).join('')}</div>`;
}
function donut(items,size=124){
  const tot=items.reduce((s,i)=>s+i.v,0)||1; let a=0; const r=size/2-9, cx=size/2;
  const segs=items.map(it=>{
    const frac=it.v/tot, s=a*2*Math.PI-Math.PI/2; a+=frac; const e=a*2*Math.PI-Math.PI/2;
    const lg=frac>.5?1:0;
    const d=`M ${cx+r*Math.cos(s)} ${cx+r*Math.sin(s)} A ${r} ${r} 0 ${lg} 1 ${cx+r*Math.cos(e)} ${cx+r*Math.sin(e)}`;
    return `<path d="${d}" fill="none" stroke="${CV(it.c)}" stroke-width="16" stroke-linecap="butt"/>`;
  }).join('');
  return `<svg viewBox="0 0 ${size} ${size}" style="width:${size}px;height:${size}px;flex:0 0 ${size}px">${segs}</svg>`;
}
const barLine = (label,v,mx,color) => `<div class="l"><b>${label}</b><div class="bar"><i style="width:${Math.min(100,v/mx*100)}%;background:${CV(color)}"></i></div><i class="v">${v}</i></div>`;

/* ---- UI atoms ---- */
const cardH=(icn,title,color,right='')=>`<div class="card-h"><div class="ic" style="background:${CT(color)};color:${CV(color)}">${ic(icn)}</div><h3>${title}</h3>${right?`<div class="r">${right}</div>`:''}</div>`;
const trend=(txt,dir)=>`<div class="trend ${dir===1?'up':dir===0?'dn':dir===3?'dn':'fl'}">${dir===2||dir===3?'':dir===1?'↑':'↓'} ${txt}</div>`;
const avat=(name,color='gold')=>`<div class="avatar sm" style="background:linear-gradient(140deg,${CV(color)},color-mix(in srgb,${CV(color)} 55%, #6b5220))">${initials(name)}</div>`;

/* ---- toast / modal ---- */
let toastT;
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),3200);}
function modal(title,sub,body,foot,wide){
  document.getElementById('modalSheet').className='sheet'+(wide?' wide':'');
  document.getElementById('modalSheet').innerHTML=
    `<div class="sheet-h"><div style="flex:1;min-width:0"><h3>${title}</h3>${sub?`<p>${sub}</p>`:''}</div><button class="x" onclick="closeModal()">×</button></div>
     <div class="sheet-b">${body}</div>${foot?`<div class="sheet-f">${foot}</div>`:''}`;
  document.getElementById('modalOv').classList.add('on');
}
const closeModal=()=>document.getElementById('modalOv').classList.remove('on');

/* ---- sidebar / theme ---- */
const NAV=[
  {id:'myday', n:'My Day', ic:'sun', c:'blue'},
  {id:'dashboard', n:'Dashboard', ic:'grid', c:'blue'},
  {id:'knowledge', n:'Knowledge', ic:'book', c:'purple'},
  {id:'wellbeing', n:'Wellbeing', ic:'heart', c:'green'},
  {id:'business', n:'Business Empire', ic:'brief', c:'gold'},
  {id:'family', n:'Family', ic:'users', c:'pink'},
  {id:'network', n:'Network', ic:'net', c:'teal'},
  {id:'social', n:'Social Movement', ic:'globe', c:'orange'},
  {id:'travel', n:'Travel', ic:'plane', c:'blue'},
  {id:'os', n:'Operating System', ic:'cpu', c:'gold'},
  {id:'brand', n:'Branding & CRM', ic:'mega', c:'pink'},
  {id:'finance', n:'Finance & Wealth', ic:'wallet', c:'green'},
  {id:'operations', n:'Operations', ic:'cog', c:'orange'},
  {id:'projects', n:'Projects', ic:'layers', c:'purple'},
  {id:'ai', n:'AI Command Center', ic:'spark', c:'purple'}
];
let CUR='myday', MODE='founder';
function renderNav(){
  document.getElementById('nav').innerHTML = NAV.map(x=>{
    const b = x.id==='os'?5 : x.id==='ai'?5 : 0;
    return `<button class="nav-i ${CUR===x.id?'on':''}" onclick="go('${x.id}')">${ic(x.ic)}<span>${x.n}</span>${b?`<span class="badge">${b}</span>`:''}</button>`;
  }).join('');
}
function toggleSidebar(){document.getElementById('sidebar').classList.toggle('on');document.getElementById('scrim').classList.toggle('on');}
function toggleTheme(){
  const r=document.documentElement;
  const cur=r.getAttribute('data-theme')|| (window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
  const nx=cur==='dark'?'light':'dark'; r.setAttribute('data-theme',nx);
  try{localStorage.setItem('ajios-theme',nx)}catch(e){}
  toast(nx==='dark'?'Mode gelap aktif':'Mode terang aktif');
}
function go(id){
  CUR=id; renderNav();
  const v=document.getElementById('view');
  v.innerHTML = (VIEWS[id]||VIEWS.myday)();
  v.style.animation='none'; void v.offsetWidth; v.style.animation='';
  window.scrollTo({top:0,behavior:'instant'});
  if(window.innerWidth<=1080 && document.getElementById('sidebar').classList.contains('on')) toggleSidebar();
  try{location.hash=id}catch(e){}
}

/* ---- notifications drawer ---- */
function openNotif(){
  document.getElementById('notifB').innerHTML = ['Critical','Important','Reminder','FYI'].map(lv=>{
    const items=DB.notifications.filter(n=>n.lv===lv); if(!items.length)return '';
    return `<div class="pal-g">${lv} · ${items.length}</div>` + items.map(n=>
      `<div class="row-i" onclick="toast('Dibuka: ${esc(n.t)}')">
        <div style="width:8px;height:8px;border-radius:50%;background:${CV(n.c)};flex:0 0 8px"></div>
        <div style="min-width:0"><div class="t">${n.t}</div><div class="s">${n.area} · ${n.s}</div></div></div>`).join('');
  }).join('') + `<div style="padding:14px 8px"><button class="btn ghost sm" style="width:100%;justify-content:center" onclick="toast('Semua notifikasi ditandai terbaca')">Tandai semua terbaca</button></div>`;
  document.getElementById('notifDr').classList.add('on');
}
const closeNotif=()=>document.getElementById('notifDr').classList.remove('on');

/* ---- modes ---- */
function openModes(){
  modal('Personal Mode','Mode mengubah apa yang naik ke permukaan di seluruh sistem.',
   `<div class="g g2" style="margin:0">${DB.modes.map(m=>`
     <div class="card click" style="padding:15px;${MODE===m.id?`border-color:${CV(m.c)};background:${CT(m.c)}`:''}" onclick="setMode('${m.id}')">
       <div style="display:flex;gap:10px;align-items:center;margin-bottom:6px">
         <div class="ic" style="width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:${CT(m.c)};color:${CV(m.c)}">${ic(m.ic)}</div>
         <b style="font-size:14px">${m.name}</b>${MODE===m.id?`<span class="pill ${m.c}" style="margin-left:auto">Aktif</span>`:''}</div>
       <p class="sub" style="margin:0">${m.desc}</p></div>`).join('')}</div>
    <div class="sep" style="margin:18px 0"></div>
    <div class="mini">Profil · ${DB.owner.name} — ${DB.owner.role} · ${DB.owner.city}</div>`);
}
function setMode(id){
  MODE=id; const m=DB.modes.find(x=>x.id===id);
  document.getElementById('modeLabel').textContent = DB.owner.role+' · '+m.name;
  closeModal(); toast(m.name+' aktif — '+m.desc); go(CUR);
}

