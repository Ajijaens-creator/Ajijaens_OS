/* ================================================================
   FORM ENTRI · DETAIL · LINIMASA · EKSPOR
   ================================================================ */
let FORM_T = null, FORM_ID = null;

function openForm(type, id){
  const S = SCHEMA[type]; if(!S) return;
  FORM_T = type; FORM_ID = id || null;
  const r = id ? recById(id) : null;
  const fld = f => {
    const v = r ? (r[f.k] === undefined ? '' : r[f.k]) : '';
    const cls = 'fld' + (f.full ? ' full' : '');
    let input;
    if(f.t === 'textarea') input = `<textarea data-k="${f.k}" placeholder="${h(f.ph||'')}">${h(v)}</textarea>`;
    else if(f.t === 'sel') input = `<select data-k="${f.k}"><option value="">— pilih —</option>${
      f.opt.map(o => `<option value="${h(o)}"${String(v)===o?' selected':''}>${h(o)}</option>`).join('')}</select>`;
    else if(f.t === 'rel'){
      const list = recs(f.rel);
      input = `<select data-k="${f.k}"><option value="">— belum ditentukan —</option>${
        list.map(x => `<option value="${x.id}"${v===x.id?' selected':''}>${h(SCHEMA[f.rel].t(x))}</option>`).join('')}</select>`;
    }
    else input = `<input data-k="${f.k}" type="${f.t==='date'?'date':f.t==='url'?'url':'text'}" value="${h(v)}" placeholder="${h(f.ph||'')}">`;
    return `<div class="${cls}" data-f="${f.k}">
      <label>${h(f.l)}${f.req?'<i>*</i>':''}</label>${input}
      ${f.hint?`<span class="fhint">${h(f.hint)}</span>`:''}
      <span class="ferr" hidden></span></div>`;
  };
  const body = `<div class="frm" id="formFields">${S.f.map(f =>
    f.g ? `<div class="fgroup">${h(f.g)}</div>` : fld(f)).join('')}</div>`;
  modal((id?'Ubah ':'Tambah ') + S.n, S.d, body,
    `<button class="btn solid" onclick="submitForm()">${ic('check')} Simpan</button>
     <button class="btn ghost" onclick="closeModal()">Batal</button>
     ${id ? `<button class="btn red sm" style="margin-left:auto" onclick="archiveRec('${id}')">Arsipkan</button>` : ''}`, true);
}

function submitForm(){
  const type = FORM_T, S = SCHEMA[type]; if(!S) return;
  const v = {}; let bad = 0;
  S.f.filter(f => !f.g).forEach(f => {
    const el = document.querySelector('#formFields [data-k="' + f.k + '"]');
    if(!el) return;
    const val = (el.value || '').trim();
    const wrap = el.closest('.fld'), err = wrap.querySelector('.ferr');
    wrap.classList.remove('bad'); err.hidden = true;
    if(f.req && !val){ wrap.classList.add('bad'); err.textContent = 'Wajib diisi'; err.hidden = false; bad++; return; }
    v[f.k] = val;
  });
  if(bad){ toast(bad + ' kolom wajib masih kosong'); return; }

  const now = new Date().toISOString();
  let r;
  if(FORM_ID){
    r = recById(FORM_ID); if(!r){ closeModal(); return; }
    const before = Object.assign({}, r);
    Object.assign(r, v);
    r._m.updated_at = now; r._m.updated_by = whoName();
    logAct('UPDATE', r, '', diffRec(before, r, type));
  } else {
    r = Object.assign({ id: nextId(type) }, v);
    r._m = { created_at:now, updated_at:now, created_by:whoName(), updated_by:whoName(), is_archived:false };
    (STORE.rec[type] = STORE.rec[type] || []).unshift(r);
    logAct('CREATE', r);
  }
  bump(); closeModal();
  toast(S.n + ' tersimpan — ' + r.id);
  go(CUR);
}

function archiveRec(id){
  const r = recById(id); if(!r) return;
  modal('Arsipkan ' + SCHEMA[typeOf(r)].n, h(SCHEMA[typeOf(r)].t(r)),
    `<p class="sub" style="margin:0">Arsip bukan hapus. Record tetap tersimpan lengkap dengan linimasanya, hanya tidak muncul di papan dan daftar.
      Bisa dipulihkan kapan saja dari tab <b>Arsip</b>.</p>`,
    `<button class="btn red" onclick="doArchive('${id}')">Arsipkan</button>
     <button class="btn ghost" onclick="closeModal()">Batal</button>`);
}
function doArchive(id){
  const r = recById(id); if(!r) return;
  r._m.is_archived = true; r._m.updated_at = new Date().toISOString(); r._m.updated_by = whoName();
  logAct('ARCHIVE', r); bump(); closeModal(); toast('Diarsipkan — masih bisa dipulihkan'); go(CUR);
}
function restoreRec(id){
  const r = recById(id); if(!r) return;
  r._m.is_archived = false; r._m.updated_at = new Date().toISOString(); r._m.updated_by = whoName();
  logAct('RESTORE', r); bump(); toast('Dipulihkan'); go(CUR);
}

/* ---------------- detail + linimasa ---------------- */
const ACT_LABEL = { CREATE:'Dibuat', UPDATE:'Diubah', MOVE:'Dipindahkan', ARCHIVE:'Diarsipkan', RESTORE:'Dipulihkan' };
const ACT_COLOR = { CREATE:'green', UPDATE:'blue', MOVE:'purple', ARCHIVE:'orange', RESTORE:'green' };
const shortVal = v => { const s = String(v===undefined||v===null||v===''?'—':v); return s.length>44 ? s.slice(0,44)+'…' : s; };

function recTimeline(id){
  const ev = (STORE.log || []).filter(l => l.id === id);
  return `<div class="sep" style="margin:18px 0"></div>
  <div class="card-h"><div class="ic" style="background:var(--blue-t);color:var(--blue)">${ic('clock')}</div>
    <h3>Linimasa</h3><div class="r"><span class="cnt">${ev.length}</span></div></div>
  ${ev.length ? `<div class="tl">${ev.slice(0,20).map(e => `
    <div class="tl-i" style="cursor:default">
      <span class="tm">${dtID(e.ts).slice(0,6)}</span>
      <span class="bar" style="background:${CV(ACT_COLOR[e.act]||'gray')}"></span>
      <span class="bd"><b>${h(ACT_LABEL[e.act]||e.act)}</b>
        <span>${dtID(e.ts)} · ${h(e.by||'—')}${e.note?' · '+h(e.note):''}</span>
        ${e.ch && e.ch.length ? `<span style="display:block;margin-top:5px">${e.ch.map(c => `
          <span style="display:block;font-size:12px;margin-bottom:2px">
            <b style="color:var(--text-2)">${h(c.l)}:</b>
            <span style="color:var(--text-3)">${h(shortVal(c.from))}</span>
            <span style="color:var(--text-3)"> → </span>
            <span style="color:var(--text)">${h(shortVal(c.to))}</span></span>`).join('')}</span>` : ''}
      </span></div>`).join('')}</div>`
    : `<p class="sub" style="margin:0">Belum ada peristiwa tercatat. Riwayat mulai terbentuk sejak perubahan berikutnya —
        konten yang dibuat sebelum linimasa ini dipasang tidak punya catatan mundur, dan sistem tidak mengarangnya.</p>`}`;
}

function recDetail(id){
  const r = recById(id); if(!r) return;
  const S = SCHEMA[typeOf(r)];
  const rows = S.f.filter(f => !f.g).map(f => {
    let val = r[f.k];
    if(f.t === 'rel') val = val ? (ownerName(val) || val) : '';
    else if(f.t === 'date') val = val ? dOnly(val) : '';
    if(f.t === 'url' && r[f.k]) return `<dt>${h(f.l)}</dt><dd><a href="${h(r[f.k])}" target="_blank" rel="noopener" class="linkr">${h(r[f.k])}</a></dd>`;
    return `<dt>${h(f.l)}</dt><dd>${val ? h(val).replace(/\n/g,'<br>') : '<span class="mini">—</span>'}</dd>`;
  }).join('');
  modal(S.t(r), S.s(r),
    `<div class="flexr" style="gap:7px;margin-bottom:16px">${idPill(r.id)}
      ${typeOf(r)==='CNT' ? `<span class="pill ${CNT_COLOR[r.status]||'gray'}">${h(r.status||'—')}</span>` : ''}
      ${r._m.is_archived ? '<span class="pill orange">diarsipkan</span>' : ''}</div>
     <dl class="kv">${rows}</dl>
     <div class="sep" style="margin:18px 0"></div>
     <p class="mini">Dibuat ${dtID(r._m.created_at)} oleh ${h(r._m.created_by||'—')} ·
       diubah terakhir ${dtID(r._m.updated_at)} oleh ${h(r._m.updated_by||'—')}</p>
     ${recTimeline(id)}`,
    r._m.is_archived
      ? `<button class="btn solid" onclick="closeModal();restoreRec('${r.id}')">Pulihkan</button>
         <button class="btn ghost" onclick="closeModal()">Tutup</button>`
      : `<button class="btn solid" onclick="openForm('${typeOf(r)}','${r.id}')">Ubah</button>
         <button class="btn ghost" onclick="closeModal()">Tutup</button>`, true);
}

/* ---------------- ekspor ---------------- */
function csvOf(type){
  const S = SCHEMA[type], keys = S.f.filter(f => !f.g).map(f => f.k);
  const head = ['id'].concat(keys).concat(['dibuat','diubah_oleh']);
  const esc = v => { const s = String(v===undefined||v===null?'':v); return /[",\n]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s; };
  const lines = [head.join(',')];
  allRecs(type).forEach(r => lines.push(
    [r.id].concat(keys.map(k => r[k])).concat([r._m.created_at, r._m.updated_by]).map(esc).join(',')));
  return lines.join('\n');
}
async function exportCSV(type){
  const name = 'jaens-studio-' + type.toLowerCase() + '-' + todayISO() + '.csv';
  await offerFile(name, csvOf(type), 'text/csv');
}
