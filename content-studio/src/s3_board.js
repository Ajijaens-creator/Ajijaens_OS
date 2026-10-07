/* ================================================================
   PAPAN GESER — sama mesinnya seperti di AJI JAENS OS
   Tiga jalur setara: tetikus · sentuh (tahan dulu) · papan ketik.
   ================================================================ */
const BOARD = { key:'status', cols:CNT_ST };
let KB = null, LASTMOVE = null;

const bdItems = () => recs('CNT').slice().sort((a,b) =>
  String(a.date||'9999').localeCompare(String(b.date||'9999')) || String(a.n||'').localeCompare(String(b.n||'')));

function cntCard(c){
  const late = c.date && c.date < todayISO() && c.status !== 'Tayang' && c.status !== 'Dibatalkan';
  return `<span class="kn" style="padding-right:22px">${h(c.n)}</span>
    <span class="km">${[h(c.channel||''), c.pillar?h(c.pillar):''].filter(Boolean).join(' · ') || 'tanpa kanal'}</span>
    <div class="flexr" style="gap:6px;margin-top:8px">
      ${c.date ? `<span class="pill ${late?'red':'gray'}">${late ? 'lewat '+daysBetween(c.date,todayISO())+' hari' : relDay(c.date)}</span>`
               : '<span class="pill gray">tanpa tanggal</span>'}
      ${c.owner ? `<span class="pill teal">${h(ownerName(c.owner))}</span>` : '<span class="pill orange">belum ada PJ</span>'}
    </div>`;
}

function boardHTML(){
  const all = bdItems();
  return `<div class="kan" id="bd" data-board="cnt">${BOARD.cols.map(col => {
    let list = all.filter(r => (r.status||'') === col);
    if(KB){ list = list.filter(r => r.id !== KB.id);
      if(KB.to === col){ const r = recById(KB.id); if(r) list = [r].concat(list); } }
    return `<div class="kan-col" data-val="${h(col)}" role="group" aria-label="${h(col)}, ${list.length} kartu">
      <div class="kan-hd"><span style="width:8px;height:8px;border-radius:50%;background:${CV(CNT_COLOR[col]||'gray')};flex:0 0 8px"></span>
        <b>${h(col)}</b><span class="cnt" style="margin-left:auto">${list.length}</span></div>
      ${list.length ? list.map(r => {
        const lifted = KB && KB.id === r.id;
        return `<div class="kan-c${lifted?' kan-pend':''}" data-id="${r.id}" tabindex="0" role="button"
          aria-label="${h(r.n)} — kolom ${h(r.status||'')}. Tekan Enter untuk mengangkat kartu."
          aria-grabbed="${lifted?'true':'false'}">
          <button class="kan-mv" title="Pindahkan kartu" aria-label="Pindahkan kartu ke kolom lain"
            onclick="event.stopPropagation();boardMenu('${r.id}')">⇅</button>
          ${cntCard(r)}</div>`;
      }).join('') : '<div class="kan-e">kosong</div>'}
    </div>`;
  }).join('')}</div>`;
}
function renderBoard(){ const el = document.getElementById('bd'); if(el) el.outerHTML = boardHTML(); else go(CUR); }

function boardMove(id, to, silent){
  const r = recById(id); if(!r) return false;
  const from = r.status || '';
  if(from === to) return false;
  const before = Object.assign({}, r);
  r.status = to;
  if(to === 'Tayang'){ if(!r.date) r.date = todayISO(); }
  r._m.updated_at = new Date().toISOString(); r._m.updated_by = whoName();
  logAct('MOVE', r, 'Digeser di papan', diffRec(before, r, 'CNT'));
  bump();
  LASTMOVE = { id, from, to };
  renderBoard();
  if(!silent) undoBar(h(r.n) + ' → ' + to);
  return true;
}
function boardUndo(){
  if(!LASTMOVE) return;
  const m = LASTMOVE; LASTMOVE = null;
  const r = recById(m.id); if(!r){ undoHide(); return; }
  const before = Object.assign({}, r);
  r.status = m.from; r._m.updated_at = new Date().toISOString(); r._m.updated_by = whoName();
  logAct('MOVE', r, 'Geseran diurungkan', diffRec(before, r, 'CNT'));
  bump(); renderBoard(); undoHide();
  toast('Geseran diurungkan — kembali ke "' + m.from + '"');
}
let barT = null;
function undoBar(msg){
  let el = document.getElementById('kanBar');
  if(!el){ el = document.createElement('div'); el.id='kanBar'; el.className='kan-bar'; el.setAttribute('role','status');
    el.innerHTML = `<span id="kanBarT"></span>
      <button class="btn ghost sm" onclick="boardUndo()">Urungkan</button>
      <button class="btn ghost sm" onclick="undoHide()">Tutup</button>`;
    document.body.appendChild(el); }
  el.querySelector('#kanBarT').innerHTML = msg;
  el.classList.add('on'); clearTimeout(barT); barT = setTimeout(undoHide, 8000);
}
function undoHide(){ const el = document.getElementById('kanBar'); if(el) el.classList.remove('on'); clearTimeout(barT); }

function boardMenu(id){
  const r = recById(id); if(!r) return;
  const cur = r.status || '';
  modal('Pindahkan kartu', h(r.n),
    `<p class="sub" style="margin:0 0 14px">Memindahkan kartu hanya mengubah <b>status</b> — isi lainnya tidak tersentuh,
       dan perpindahannya tercatat di linimasa konten ini.</p>
     <div class="rows">${BOARD.cols.map(c => `
       <div class="row-i" ${c===cur?'':`onclick="closeModal();boardMove('${id}','${h(c)}')"`}
            style="${c===cur?'opacity:.55;cursor:default':''}">
         <span style="width:9px;height:9px;border-radius:50%;background:${CV(CNT_COLOR[c]||'gray')};flex:0 0 9px"></span>
         <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">${h(c)}</span>
           ${c===cur?'<span class="s">kolom sekarang</span>':''}</span>
         ${c===cur?'<span class="pill gray">di sini</span>':'<span class="rt mini">pindahkan →</span>'}
       </div>`).join('')}</div>`,
    `<button class="btn ghost" onclick="closeModal()">Batal</button>`);
}

/* ---- papan ketik ---- */
function boardLift(id){ const r = recById(id); if(!r) return;
  KB = { id, from:r.status||'', to:r.status||'' }; renderBoard(); boardFocus(id);
  toast('Kartu diangkat — panah kiri/kanan memilih kolom, Enter melepas, Esc batal'); }
function boardKbShift(d){ if(!KB) return;
  let i = BOARD.cols.indexOf(KB.to); if(i<0) i=0;
  i = Math.max(0, Math.min(BOARD.cols.length-1, i+d));
  if(BOARD.cols[i] === KB.to) return;
  KB.to = BOARD.cols[i]; renderBoard(); boardFocus(KB.id); }
function boardKbDrop(){ if(!KB) return; const k = KB; KB = null;
  if(k.to !== k.from) boardMove(k.id, k.to); else renderBoard(); boardFocus(k.id); }
function boardKbCancel(){ if(!KB) return; const k = KB; KB = null; renderBoard(); boardFocus(k.id);
  toast('Batal — kartu kembali ke kolom semula'); }
function boardFocus(id){ const el = document.querySelector('.kan-c[data-id="'+id+'"]');
  if(el){ try{ el.focus({preventScroll:true}); }catch(e){ el.focus(); } } }

document.addEventListener('keydown', e => {
  const card = e.target && e.target.closest ? e.target.closest('.kan-c[data-id]') : null;
  if(KB){
    if(e.key === 'Escape'){ e.preventDefault(); boardKbCancel(); return; }
    if(e.key === 'ArrowLeft'){ e.preventDefault(); boardKbShift(-1); return; }
    if(e.key === 'ArrowRight'){ e.preventDefault(); boardKbShift(1); return; }
    if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); boardKbDrop(); return; }
  }
  if(!card) return;
  if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); boardLift(card.dataset.id); }
});

/* ---- tetikus & sentuh ---- */
let DRAG = null;
const noScroll = e => { if(DRAG && DRAG.started) e.preventDefault(); };
function boardDown(e){
  if(e.button !== undefined && e.button !== 0) return;
  const t = e.target; if(!t || !t.closest) return;
  if(t.closest('button') || t.closest('a') || t.closest('input') || t.closest('select')) return;
  const card = t.closest('.kan-c[data-id]'); if(!card) return;
  const board = card.closest('.kan'); if(!board) return;
  if(KB) boardKbCancel();
  DRAG = { card, board, id:card.dataset.id, x0:e.clientX, y0:e.clientY,
           started:false, moved:false, touch:(e.pointerType==='touch'||e.pointerType==='pen'), hold:null, ghost:null, over:null };
  if(DRAG.touch) DRAG.hold = setTimeout(() => { if(DRAG && !DRAG.moved) boardStart(e.clientX, e.clientY); }, 280);
  document.addEventListener('pointermove', boardMoveEv);
  document.addEventListener('pointerup', boardUp);
  document.addEventListener('pointercancel', boardUp);
  document.addEventListener('touchmove', noScroll, { passive:false });
}
function boardStart(x, y){
  const c = DRAG.card, r = c.getBoundingClientRect();
  DRAG.started = true; DRAG.dx = x - r.left; DRAG.dy = y - r.top;
  const g = c.cloneNode(true); const mv = g.querySelector('.kan-mv'); if(mv) mv.remove();
  g.className = 'kan-c kan-ghost';
  g.style.width = r.width+'px'; g.style.left = r.left+'px'; g.style.top = r.top+'px';
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
  DRAG.ghost.style.left = (e.clientX - DRAG.dx)+'px';
  DRAG.ghost.style.top  = (e.clientY - DRAG.dy)+'px';
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const col = el && el.closest ? el.closest('.kan-col') : null;
  const inB = col && col.parentElement === DRAG.board;
  if(DRAG.over && DRAG.over !== col) DRAG.over.classList.remove('kan-over');
  DRAG.over = inB ? col : null;
  if(DRAG.over) DRAG.over.classList.add('kan-over');
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
  if(!d.started){ if(!d.moved) recDetail(d.id); return; }
  if(e && e.type === 'pointercancel') return;
  if(d.over){ if(!boardMove(d.id, d.over.dataset.val)) renderBoard(); }
}
document.addEventListener('pointerdown', boardDown);
