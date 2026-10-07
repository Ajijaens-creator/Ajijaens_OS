/* ================================================================
   PAPAN GESER — drag & drop yang mengubah status
   Ditulis dari nol: tanpa pustaka luar, satu berkas.
   Tiga jalur yang setara, bukan satu jalur dengan tambalan:
     1. Tetikus  — tekan, geser lebih dari 5px, lepas di kolom tujuan.
     2. Sentuh   — tahan 280ms sampai kartu terangkat, baru geser.
     3. Papan ketik / tombol ⇅ — angkat kartu, pilih kolom, lepas.
   Setiap perpindahan tercatat di linimasa record sebagai perubahan
   kolom (dari nilai apa ke nilai apa), dan bisa diurungkan.
   ================================================================ */

const BOARDS = {};
const boardOf = id => BOARDS[id];

/* Kolom dibaca dari skema — bukan ditulis ulang di sini.
   Kalau pilihan status di skema bertambah, kolomnya ikut bertambah. */
function boardCols(b){
  if(b.cols) return b.cols;
  const f = (SCHEMA[b.type].f || []).find(x => x.k === b.key);
  return (f && f.opt) ? f.opt : [];
}
const boardItems = b => (b.items ? b.items() : recs(b.type));
const colColor = (b, c) => (b.colc && b.colc[c]) || 'gray';

/* ---------------- keadaan angkat lewat papan ketik ---------------- */
let KB = null;      /* { bid, id, from, to }  — kartu terangkat, belum dilepas */
let LASTMOVE = null;

/* ---------------- render ---------------- */
function boardCardHTML(b, r, pend){
  const lifted = KB && KB.bid === b.id && KB.id === r.id;
  return `<div class="kan-c${lifted ? ' kan-pend' : ''}" data-id="${r.id}" data-board="${b.id}"
    tabindex="0" role="button"
    aria-label="${h(SCHEMA[typeOf(r)].t(r))} — kolom ${h(r[b.key] || 'tanpa status')}. Tekan Enter untuk mengangkat kartu."
    aria-grabbed="${lifted ? 'true' : 'false'}">
    <button class="kan-mv" title="Pindahkan kartu" aria-label="Pindahkan kartu ini ke kolom lain"
      onclick="event.stopPropagation();boardMenu('${b.id}','${r.id}')">⇅</button>
    ${b.card(r)}
  </div>`;
}

function boardHTML(id){
  const b = BOARDS[id]; if(!b) return '';
  const all = boardItems(b), cols = boardCols(b);
  return `<div class="kan" id="bd-${id}" data-board="${id}">${cols.map(c => {
    let list = all.filter(r => (r[b.key] || '') === c);
    /* kartu yang sedang diangkat ditampilkan di kolom tujuan sementara */
    if(KB && KB.bid === id){
      list = list.filter(r => r.id !== KB.id);
      if(KB.to === c){ const r = recById(KB.id); if(r) list = [r].concat(list); }
    }
    const cc = colColor(b, c);
    return `<div class="kan-col" data-val="${h(c)}" role="group" aria-label="${h(c)}, ${list.length} kartu">
      <div class="kan-hd"><span style="width:8px;height:8px;border-radius:50%;background:${CV(cc)};flex:0 0 8px"></span>
        <b>${h(c)}</b><span class="cnt" style="margin-left:auto">${list.length}</span></div>
      ${list.length ? list.map(r => boardCardHTML(b, r)).join('') : '<div class="kan-e">kosong</div>'}
    </div>`;
  }).join('')}</div>`;
}

/* Kartu papan lengkap dengan kepala dan penjelasan cara memakainya */
function boardCard(id, extraHead){
  const b = BOARDS[id]; if(!b) return '';
  const n = boardItems(b).length;
  if(!n && b.empty) return b.empty();
  return `<div class="card" style="margin-bottom:18px">
    ${cardH(b.ic, b.n, b.c, (extraHead || '') + `<span class="mini" style="margin-left:9px">${n} kartu</span>`)}
    <p class="kan-hint">${ic('arrow')} Geser kartu antar kolom untuk mengubah <b>${h(b.keyLabel || 'status')}</b>.
      Di ponsel: tahan sebentar sampai kartu terangkat. Tanpa tetikus: <kbd>Tab</kbd> ke kartu,
      <kbd>Enter</kbd> mengangkat, <kbd>←</kbd> <kbd>→</kbd> memilih kolom, <kbd>Enter</kbd> melepas, <kbd>Esc</kbd> batal.</p>
    ${boardHTML(id)}
    <div class="card-f"><span class="mini">Urutan di dalam kolom mengikuti aturan urut papan ini${b.sortNote ? ' — ' + b.sortNote : ''}, bukan posisi geseran.
      Yang disimpan dari geseran adalah perpindahan kolomnya, dan itu tercatat di linimasa record.</span></div>
  </div>`;
}

function renderBoard(id){
  const el = document.getElementById('bd-' + id);
  if(el) el.outerHTML = boardHTML(id);
  else if(typeof go === 'function' && typeof CUR !== 'undefined') go(CUR);
}

/* ---------------- perpindahan ---------------- */
function boardMove(bid, recId, to, silent){
  const b = BOARDS[bid], r = recById(recId);
  if(!b || !r) return false;
  const from = r[b.key] || '';
  if(from === to) return false;
  const before = Object.assign({}, r, { _priv: r._m.privacy_level });
  r[b.key] = to;
  if(b.onMove) b.onMove(r, to, from);
  r._m.updated_at = new Date().toISOString();
  r._m.updated_by = DB.owner.name;
  logAct('MOVE', r, 'Digeser di ' + b.n, diffRec(before, Object.assign({}, r, { _priv: r._m.privacy_level }), typeOf(r)));
  saveStore();
  LASTMOVE = { bid, id: recId, from, to, at: Date.now() };
  renderBoard(bid);
  if(!silent) boardBar(`${SCHEMA[typeOf(r)].t(r)} → ${to}`);
  return true;
}

function boardUndo(){
  if(!LASTMOVE) return;
  const m = LASTMOVE;
  LASTMOVE = null;
  const b = BOARDS[m.bid], r = recById(m.id);
  if(!b || !r){ boardBarHide(); return; }
  const before = Object.assign({}, r, { _priv: r._m.privacy_level });
  r[b.key] = m.from;
  if(b.onMove) b.onMove(r, m.from, m.to);
  r._m.updated_at = new Date().toISOString();
  logAct('MOVE', r, 'Geseran diurungkan', diffRec(before, Object.assign({}, r, { _priv: r._m.privacy_level }), typeOf(r)));
  saveStore(); renderBoard(m.bid); boardBarHide();
  toast('Geseran diurungkan — kembali ke "' + m.from + '"');
}

/* ---------------- bilah urungkan ---------------- */
let barT = null;
function boardBarEl(){
  let el = document.getElementById('kanBar');
  if(!el){
    el = document.createElement('div');
    el.id = 'kanBar'; el.className = 'kan-bar'; el.setAttribute('role','status');
    el.innerHTML = `<span id="kanBarT"></span>
      <button class="btn ghost sm" onclick="boardUndo()">Urungkan</button>
      <button class="btn ghost sm" onclick="boardBarHide()">Tutup</button>`;
    document.body.appendChild(el);
  }
  return el;
}
function boardBar(msg){
  const el = boardBarEl();
  el.querySelector('#kanBarT').textContent = msg;
  el.classList.add('on');
  clearTimeout(barT); barT = setTimeout(boardBarHide, 8000);
}
function boardBarHide(){ const el = document.getElementById('kanBar'); if(el) el.classList.remove('on'); clearTimeout(barT); }

/* ---------------- jalur 3: tombol ⇅ dan papan ketik ---------------- */
function boardMenu(bid, recId){
  const b = BOARDS[bid], r = recById(recId); if(!b || !r) return;
  const cur = r[b.key] || '';
  modal('Pindahkan kartu', SCHEMA[typeOf(r)].t(r),
    `<p class="sub" style="margin:0 0 14px">Memindahkan kartu hanya mengubah <b>${h(b.keyLabel || 'status')}</b> —
       isi record lainnya tidak tersentuh, dan perpindahannya tercatat di linimasa record ini.</p>
     <div class="rows">${boardCols(b).map(c => `
       <div class="row-i" ${c === cur ? '' : `onclick="closeModal();boardMove('${bid}','${recId}','${h(c).replace(/'/g,"\\'")}')"`}
            style="${c === cur ? 'opacity:.55;cursor:default' : ''}">
         <span style="width:9px;height:9px;border-radius:50%;background:${CV(colColor(b,c))};flex:0 0 9px"></span>
         <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">${h(c)}</span>
           ${c === cur ? '<span class="s">kolom sekarang</span>' : ''}</span>
         ${c === cur ? '<span class="pill gray">di sini</span>' : '<span class="rt mini">pindahkan →</span>'}
       </div>`).join('')}</div>`,
    `<button class="btn ghost" onclick="closeModal()">Batal</button>`);
}

function boardLift(bid, recId){
  const b = BOARDS[bid], r = recById(recId); if(!b || !r) return;
  KB = { bid, id: recId, from: r[b.key] || '', to: r[b.key] || '' };
  renderBoard(bid); boardFocus(recId);
  toast('Kartu diangkat — panah kiri/kanan memilih kolom, Enter melepas, Esc batal');
}
function boardKbShift(dir){
  if(!KB) return;
  const b = BOARDS[KB.bid], cols = boardCols(b);
  let i = cols.indexOf(KB.to); if(i < 0) i = 0;
  i = Math.max(0, Math.min(cols.length - 1, i + dir));
  if(cols[i] === KB.to) return;
  KB.to = cols[i];
  renderBoard(KB.bid); boardFocus(KB.id);
}
function boardKbDrop(){
  if(!KB) return;
  const k = KB; KB = null;
  if(k.to !== k.from) boardMove(k.bid, k.id, k.to);
  else renderBoard(k.bid);
  boardFocus(k.id);
}
function boardKbCancel(){
  if(!KB) return;
  const k = KB; KB = null; renderBoard(k.bid); boardFocus(k.id);
  toast('Batal — kartu kembali ke kolom semula');
}
function boardFocus(recId){
  const el = document.querySelector('.kan-c[data-id="' + recId + '"]');
  if(el){ try{ el.focus({ preventScroll:true }); }catch(e){ el.focus(); } }
}

document.addEventListener('keydown', e => {
  const card = e.target && e.target.closest ? e.target.closest('.kan-c[data-id]') : null;
  if(KB){
    if(e.key === 'Escape'){ e.preventDefault(); boardKbCancel(); return; }
    if(e.key === 'ArrowLeft'){ e.preventDefault(); boardKbShift(-1); return; }
    if(e.key === 'ArrowRight'){ e.preventDefault(); boardKbShift(1); return; }
    if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); boardKbDrop(); return; }
  }
  if(!card) return;
  if(e.key === 'Enter' || e.key === ' '){
    e.preventDefault();
    boardLift(card.dataset.board, card.dataset.id);
  }
});

/* ---------------- jalur 1 & 2: geser dengan tetikus / sentuh ---------------- */
let DRAG = null;
const noScroll = e => { if(DRAG && DRAG.started) e.preventDefault(); };

function boardDown(e){
  if(e.button !== undefined && e.button !== 0) return;
  const t = e.target;
  if(!t || !t.closest) return;
  if(t.closest('button') || t.closest('a') || t.closest('input') || t.closest('select')) return;
  const card = t.closest('.kan-c[data-id]'); if(!card) return;
  const board = card.closest('.kan'); if(!board) return;
  if(KB) boardKbCancel();
  DRAG = { card, board, bid: board.dataset.board, id: card.dataset.id,
           x0: e.clientX, y0: e.clientY, started:false, moved:false,
           touch: e.pointerType === 'touch' || e.pointerType === 'pen', hold:null, ghost:null, over:null };
  if(DRAG.touch) DRAG.hold = setTimeout(() => { if(DRAG && !DRAG.moved) boardStart(e.clientX, e.clientY); }, 280);
  document.addEventListener('pointermove', boardMoveEv);
  document.addEventListener('pointerup', boardUp);
  document.addEventListener('pointercancel', boardUp);
  document.addEventListener('touchmove', noScroll, { passive:false });
}

function boardStart(x, y){
  const c = DRAG.card, r = c.getBoundingClientRect();
  DRAG.started = true; DRAG.dx = x - r.left; DRAG.dy = y - r.top;
  const g = c.cloneNode(true);
  const mv = g.querySelector('.kan-mv'); if(mv) mv.remove();
  g.className = 'kan-c kan-ghost';
  g.style.width = r.width + 'px'; g.style.left = r.left + 'px'; g.style.top = r.top + 'px';
  document.body.appendChild(g); DRAG.ghost = g;
  c.classList.add('kan-src'); c.setAttribute('aria-grabbed','true');
  document.body.classList.add('kan-dragging');
  if(navigator.vibrate){ try{ navigator.vibrate(8); }catch(e){} }
}

function boardMoveEv(e){
  if(!DRAG) return;
  const dx = e.clientX - DRAG.x0, dy = e.clientY - DRAG.y0;
  if(Math.abs(dx) > 4 || Math.abs(dy) > 4) DRAG.moved = true;
  if(!DRAG.started){
    if(DRAG.touch){ if(DRAG.moved && DRAG.hold){ clearTimeout(DRAG.hold); DRAG.hold = null; } return; }
    if(Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
    boardStart(e.clientX, e.clientY);
  }
  DRAG.ghost.style.left = (e.clientX - DRAG.dx) + 'px';
  DRAG.ghost.style.top  = (e.clientY - DRAG.dy) + 'px';

  /* kolom di bawah jari / kursor */
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const col = el && el.closest ? el.closest('.kan-col') : null;
  const inBoard = col && col.parentElement === DRAG.board;
  if(DRAG.over && DRAG.over !== col) DRAG.over.classList.remove('kan-over');
  DRAG.over = inBoard ? col : null;
  if(DRAG.over) DRAG.over.classList.add('kan-over');

  /* gulir papan sendiri saat kartu didekatkan ke tepi */
  const br = DRAG.board.getBoundingClientRect();
  if(e.clientX > br.right - 46) DRAG.board.scrollLeft += 14;
  else if(e.clientX < br.left + 46) DRAG.board.scrollLeft -= 14;
}

function boardUp(e){
  if(!DRAG) return;
  const d = DRAG; DRAG = null;
  if(d.hold) clearTimeout(d.hold);
  document.removeEventListener('pointermove', boardMoveEv);
  document.removeEventListener('pointerup', boardUp);
  document.removeEventListener('pointercancel', boardUp);
  document.removeEventListener('touchmove', noScroll);
  document.body.classList.remove('kan-dragging');
  if(d.ghost) d.ghost.remove();
  if(d.over) d.over.classList.remove('kan-over');
  d.card.classList.remove('kan-src'); d.card.setAttribute('aria-grabbed','false');

  if(!d.started){
    /* bukan geseran — ini ketukan biasa, buka recordnya */
    if(!d.moved){ const b = BOARDS[d.bid]; if(b && b.open) b.open(d.id); }
    return;
  }
  if(e && e.type === 'pointercancel') return;
  if(d.over){
    const to = d.over.dataset.val;
    if(!boardMove(d.bid, d.id, to)) renderBoard(d.bid);
  }
}
document.addEventListener('pointerdown', boardDown);

/* ================================================================
   ENAM PAPAN
   ================================================================ */
const pillOwner = o => o ? `<span class="pill gray">${h(ownerName(o))}</span>` : '';

/* 1. Tugas */
BOARDS.tsk = { id:'tsk', n:'Papan tugas', type:'TSK', key:'status', keyLabel:'status tugas',
  ic:'check', c:'blue', sortNote:'prioritas lalu tenggat',
  colc:{ 'Belum mulai':'gray','Sedang dikerjakan':'blue','Menunggu orang lain':'orange','Selesai':'green','Dibatalkan':'gray' },
  items: () => recs('TSK').slice().sort((a,b) =>
    (a.pri || 'P9').localeCompare(b.pri || 'P9') || String(a.due || '9999').localeCompare(String(b.due || '9999'))),
  open: id => recDetail(id),
  onMove: (r, to) => { if(to === 'Selesai'){ if(!r.done) r.done = todayISO(); } else r.done = ''; },
  card: t => { const late = t.due && t.due < todayISO() && t.status !== 'Selesai';
    return `<span class="kn" style="padding-right:22px">${h(t.n)}</span>
      <span class="km">${t.proj ? h(SCHEMA.PRO.t(recById(t.proj) || { n:'—' })) : 'tanpa proyek'}</span>
      <div class="flexr" style="gap:6px;margin-top:8px">
        <span class="pill ${(t.pri || '').indexOf('P1') === 0 ? 'red' : (t.pri || '').indexOf('P2') === 0 ? 'orange' : 'gray'}">${h((t.pri || '—').split(' ')[0])}</span>
        ${t.due ? `<span class="pill ${late ? 'red' : 'gray'}">${late ? 'lewat ' + daysBetween(t.due, todayISO()) + ' hari' : relDay(t.due)}</span>` : ''}
        ${pillOwner(t.owner)}
      </div>`; } };

/* 2. Proyek */
BOARDS.proj = { id:'proj', n:'Papan proyek', type:'PRO', key:'status', keyLabel:'status proyek',
  ic:'layers', c:'purple', sortNote:'target terdekat lebih dulu',
  colc:{ 'Perencanaan':'blue','Berjalan':'purple','Tertahan':'orange','Selesai':'green','Dibatalkan':'gray' },
  items: () => recs('PRO').slice().sort((a,b) => String(a.due || '9999').localeCompare(String(b.due || '9999'))),
  open: id => projWork(id),
  card: p => { const s = projStats(p);
    const c = s.overdue ? 'red' : s.late ? 'orange' : p.status === 'Selesai' ? 'green' : 'purple';
    return `<span class="kn" style="padding-right:22px">${h(SCHEMA.PRO.t(p))}</span>
      <span class="km">${p.owner ? h(ownerName(p.owner)) : 'tanpa pemilik'}${p.due ? ' · ' + relDay(p.due).toLowerCase() : ''}</span>
      <div class="flexr" style="gap:7px;margin-top:9px">
        <div class="bar" style="flex:1"><i style="width:${s.pct}%;background:${CV(c)}"></i></div>
        <b style="font-size:12px;font-variant-numeric:tabular-nums">${s.pct}%</b></div>
      <div class="flexr" style="gap:6px;margin-top:9px">
        <span class="pill gray">${s.done}/${s.n} tugas</span>
        ${s.ms ? `<span class="pill blue">${s.msDone}/${s.ms} milestone</span>` : ''}
        ${s.late ? `<span class="pill red">${s.late} terlambat</span>` : ''}
      </div>`; } };

/* 3. Milestone */
BOARDS.mls = { id:'mls', n:'Papan milestone', type:'MLS', key:'status', keyLabel:'status milestone',
  ic:'flag', c:'orange', sortNote:'tanggal target',
  colc:{ 'Belum tercapai':'orange','Tercapai':'green','Terlewat':'red','Dibatalkan':'gray' },
  items: () => recs('MLS').slice().sort((a,b) => String(a.date || '9999').localeCompare(String(b.date || '9999'))),
  open: id => recDetail(id),
  card: m => { const p = m.proj ? recById(m.proj) : null;
    const late = m.status === 'Belum tercapai' && m.date && m.date < todayISO();
    return `<span class="kn" style="padding-right:22px">${h(m.n)}</span>
      <span class="km">${p ? h(SCHEMA.PRO.t(p)) : 'tanpa proyek'}</span>
      <div class="flexr" style="gap:6px;margin-top:8px">
        <span class="pill ${late ? 'red' : 'gray'}">${m.date ? (late ? 'terlambat ' + daysBetween(m.date, todayISO()) + ' hari' : relDay(m.date)) : 'tanpa tanggal'}</span>
        ${m.proof ? '<span class="pill green">ada bukti</span>' : ''}
        ${pillOwner(m.owner)}
      </div>`; } };

/* 4. Konten */
BOARDS.cnt = { id:'cnt', n:'Pipeline konten', type:'CNT', key:'status', keyLabel:'tahap konten',
  ic:'mega', c:'pink', sortNote:'tanggal tayang',
  cols: ['Ide','Draft','Menunggu review','Terjadwal','Tayang','Dibatalkan'],
  colc:{ 'Ide':'gray','Draft':'blue','Menunggu review':'orange','Terjadwal':'purple','Tayang':'green','Dibatalkan':'gray' },
  items: () => recs('CNT').slice().sort((a,b) => String(a.date || '9999').localeCompare(String(b.date || '9999'))),
  open: id => recDetail(id),
  card: c => { const late = c.date && c.date < todayISO() && c.status !== 'Tayang' && c.status !== 'Dibatalkan';
    return `<span class="kn" style="padding-right:22px">${h(c.n)}</span>
      <span class="km">${[h(c.channel || ''), c.pillar ? h(c.pillar) : ''].filter(Boolean).join(' · ') || 'tanpa kanal'}</span>
      <div class="flexr" style="gap:6px;margin-top:8px">
        ${c.date ? `<span class="pill ${late ? 'red' : 'gray'}">${late ? 'lewat ' + daysBetween(c.date, todayISO()) + ' hari' : relDay(c.date)}</span>`
                 : '<span class="pill gray">tanpa tanggal</span>'}
        ${pillOwner(c.owner)}
      </div>`; } };

/* 5. Isu operasional */
BOARDS.ops = { id:'ops', n:'Papan isu operasional', type:'OPS', key:'status', keyLabel:'status isu',
  ic:'cog', c:'orange', sortNote:'tingkat keparahan',
  colc:{ 'Terbuka':'red','Sedang ditangani':'orange','Menunggu pihak lain':'yellow','Selesai':'green','Dibatalkan':'gray' },
  items: () => recs('OPS').slice().sort((a,b) => SEV.indexOf(a.sev) - SEV.indexOf(b.sev)),
  open: id => recDetail(id),
  onMove: (r, to) => { if(to === 'Selesai'){ if(!r.resolved) r.resolved = todayISO(); } else r.resolved = ''; },
  card: o => { const u = o.unit ? recById(o.unit) : null;
    return `<span class="kn" style="padding-right:22px">${h(o.n)}</span>
      <span class="km">${u ? h(SCHEMA.BUS.t(u)) : 'tanpa unit'}</span>
      <div class="flexr" style="gap:6px;margin-top:8px">
        <span class="pill ${SEV_COLOR[o.sev] || 'gray'}">${h(o.sev || '—')}</span>
        ${o.root ? '' : '<span class="pill gray">akar belum diisi</span>'}
        ${pillOwner(o.owner)}
      </div>`; } };

/* 6. Keputusan */
BOARDS.dec = { id:'dec', n:'Papan keputusan', type:'DEC', key:'status', keyLabel:'status keputusan',
  ic:'scale', c:'red', sortNote:'terbaru lebih dulu',
  cols: ['Diputuskan','Dijalankan','Ditinjau ulang','Dibatalkan'],
  colc:{ 'Diputuskan':'blue','Dijalankan':'purple','Ditinjau ulang':'orange','Dibatalkan':'gray' },
  items: () => recs('DEC').slice().sort((a,b) => String(b.date || '').localeCompare(String(a.date || ''))),
  open: id => recDetail(id),
  card: d => `<span class="kn" style="padding-right:22px">${h(d.n)}</span>
      <span class="km">${d.date ? h(dOnly(d.date)) : 'tanpa tanggal'}</span>
      <div class="flexr" style="gap:6px;margin-top:8px">
        <span class="pill ${(d.impact || '').indexOf('Besar') === 0 ? 'red' : (d.impact || '').indexOf('Sedang') === 0 ? 'orange' : 'gray'}">${h((d.impact || '—').split(' —')[0])}</span>
        ${d.review ? `<span class="pill blue">tinjau ${relDay(d.review).toLowerCase()}</span>` : ''}
        ${d.assume ? '' : '<span class="pill gray">asumsi belum ditulis</span>'}
      </div>` };

/* ================================================================
   PEMASANGAN KE HALAMAN
   ================================================================ */

/* Projects — tab baru khusus papan geser, daftar lama tetap ada */
if(typeof PJ_TABS !== 'undefined'){
  PJ_TABS[0][1] = 'Daftar Tugas';
  PJ_TABS.splice(1, 0, ['kanban','Papan Geser']);
  PJ_VIEW.kanban = () => {
    if(!recs('TSK').length && !recs('MLS').length) return `<div class="card" style="text-align:center;padding:44px 26px">
      <div style="width:58px;height:58px;border-radius:17px;background:var(--blue-t);color:var(--blue);display:grid;place-items:center;margin:0 auto 15px">
        <span style="display:block;width:27px;height:27px">${ic('check')}</span></div>
      <h2 style="font-family:var(--fd);font-size:23px;font-weight:600;margin:0 0 8px">Papan masih kosong</h2>
      <p class="sub" style="max-width:440px;margin:0 auto 18px">Papan geser menampilkan tugas dan milestone yang sudah ada.
        Buat satu tugas dulu, kartunya langsung muncul di sini.</p>
      <button class="btn solid" onclick="openForm('TSK')">${ic('plus')} Tugas pertama</button></div>`;
    return boardCard('tsk', `<button class="btn gold sm" onclick="openForm('TSK')">${ic('plus')} Tugas</button>`)
         + (recs('MLS').length ? boardCard('mls', `<button class="btn ghost sm" onclick="openForm('MLS')">${ic('plus')} Milestone</button>`) : '');
  };
}

/* Isu operasional — papan disisipkan di atas daftar */
if(typeof bzIssues === 'function'){
  const baseIss = bzIssues;
  bzIssues = function(){
    const b = recs('OPS').length ? boardCard('ops', `<button class="btn gold sm" onclick="openForm('OPS')">${ic('plus')} Isu</button>`) : '';
    return b + baseIss.apply(this, arguments);
  };
  if(typeof BZ_VIEW !== 'undefined') BZ_VIEW.iss = bzIssues;
}

/* Keputusan — papan disisipkan di atas daftar */
if(typeof osDec === 'function'){
  const baseDec = osDec;
  osDec = function(){
    const b = recs('DEC').length ? boardCard('dec', `<button class="btn gold sm" onclick="openForm('DEC')">${ic('plus')} Keputusan</button>`) : '';
    return b + baseDec.apply(this, arguments);
  };
  if(typeof OS_VIEW !== 'undefined') OS_VIEW.dec = osDec;
}

