/* ================================================================
   IMPOR CSV / GOOGLE SHEETS — jembatan dari template Drive ke OS
   Tempel → cocokkan kolom → pratinjau → setujui.
   Baris dengan kolom id yang cocok memperbarui record lama (bukan duplikat).
   Tidak pernah menyentuh berkas asli di Drive — hanya membaca teks yang Anda tempel.
   ================================================================ */

/* ---------------- parser tabel (CSV & TSV, sadar tanda kutip) ---------------- */
function parseTable(text){
  const t = String(text).replace(/\r\n/g,'\n').replace(/\r/g,'\n');
  if(!t.trim()) return [];
  const firstLine = t.split('\n')[0];
  const delim = firstLine.indexOf('\t') >= 0 ? '\t' : (firstLine.indexOf(';') >= 0 && firstLine.indexOf(',') < 0 ? ';' : ',');
  const rows = []; let row = [], cell = '', q = false;
  for(let i = 0; i < t.length; i++){
    const c = t[i];
    if(q){
      if(c === '"'){ if(t[i+1] === '"'){ cell += '"'; i++; } else q = false; }
      else cell += c;
    } else {
      if(c === '"') q = true;
      else if(c === delim){ row.push(cell); cell = ''; }
      else if(c === '\n'){ row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
  }
  row.push(cell); rows.push(row);
  return rows.map(r => r.map(x => x.trim())).filter(r => r.some(x => x !== ''));
}

/* ---------------- normalisasi nilai ---------------- */
const normKey = s => String(s).toLowerCase().replace(/[^a-z0-9]/g,'');
function mkDate(y,m,d){
  y=Number(y); m=Number(m); d=Number(d);
  const dt = new Date(Date.UTC(y,m-1,d));
  if(dt.getUTCFullYear()!==y || dt.getUTCMonth()!==m-1 || dt.getUTCDate()!==d) return null;
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}
function normDate(v){
  v = String(v).trim(); if(!v) return '';
  let m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);            /* yyyy-mm-dd */
  if(m) return mkDate(m[1], m[2], m[3]);
  m = v.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);   /* dd/mm/yyyy */
  if(m) return mkDate(m[3], m[2], m[1]);
  m = v.match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/);        /* 3 Sep 2026 */
  if(m){
    const i = BLN.findIndex(b => b.toLowerCase().slice(0,3) === m[2].toLowerCase().slice(0,3));
    if(i >= 0) return mkDate(m[3], i+1, m[1]);
  }
  return null;
}
/* Angka gaya Indonesia: titik = pemisah ribuan, koma = desimal.
   "1.250,50" → 1250.50 · "12.000" → 12000 · "1250.50" → 1250.50 */
function normNum(v){
  let s = String(v).replace(/rp/ig,'').replace(/\s/g,'').replace(/(jt|juta|m)$/i,'');
  if(/,\d{1,2}$/.test(s)) return s.replace(/\./g,'').replace(',','.');
  if(/^-?\d{1,3}(\.\d{3})+$/.test(s)) return s.replace(/\./g,'');
  return s.replace(/,/g,'');
}

/* ---------------- kolom khusus (hasil ekspor kita sendiri) ---------------- */
const META_COLS = { id:'id', privacylevel:'_priv', tags:'_tags' };

/* ---------------- state wisaya ---------------- */
let IMP = { step:1, type:'PER', raw:'', head:[], body:[], map:{}, res:null };

function openImport(type){
  IMP = { step:1, type: type || (MODULE_ENTITIES[CUR] || ['PER'])[0], raw:'', head:[], body:[], map:{}, res:null };
  impRender();
}

function impSteps(){
  const names = ['Pilih entitas','Tempel data','Cocokkan kolom','Pratinjau & setujui'];
  return `<div class="chips" style="margin-bottom:16px">${names.map((n,i)=>{
    const s = i+1;
    return `<span class="chip ${IMP.step===s?'on':''}" style="cursor:default;${IMP.step>s?'opacity:.55':''}">${s}. ${n}</span>`;
  }).join('')}</div>`;
}

function impRender(){
  const S = SCHEMA[IMP.type];
  let body = impSteps(), foot = '';

  if(IMP.step === 1){
    body += `<p class="sub" style="margin-bottom:14px">Pilih entitas yang datanya akan diimpor. Kolom template di folder Drive sudah cocok dengan Data Dictionary tiap entitas.</p>
      <div class="g g3" style="gap:11px;margin:0">${SCH_ORDER.map(t=>{ const X = SCHEMA[t]; return `
        <div class="card click" style="padding:13px;${IMP.type===t?`border-color:${CV(X.c)};background:${CT(X.c)}`:''}" onclick="IMP.type='${t}';impRender()">
          <div class="flexr" style="gap:9px;margin-bottom:5px">
            <div class="ic" style="width:28px;height:28px;border-radius:9px;display:grid;place-items:center;flex:0 0 28px;background:${CT(X.c)};color:${CV(X.c)}">${ic(X.ic)}</div>
            <b style="font-size:13.5px">${X.n}</b>${recs(t).length?`<span class="cnt" style="margin-left:auto">${recs(t).length}</span>`:''}</div>
          <p class="sub" style="margin:0;font-size:11.5px">${X.d}</p></div>`; }).join('')}</div>`;
    foot = `<button class="btn solid" onclick="IMP.step=2;impRender()">Lanjut ${ic('arrow')}</button>
            <button class="btn ghost" onclick="closeModal()">Batal</button>`;
  }

  if(IMP.step === 2){
    body += `<p class="sub" style="margin-bottom:10px">Buka template <b>${h(S.n)}</b> di Google Sheets, blok seluruh tabel termasuk baris judul, salin, lalu tempel di bawah. Format CSV yang dipisah koma juga diterima.</p>
      <textarea class="csvbox" id="impIn" placeholder="Tempel di sini — baris pertama harus berisi judul kolom">${h(IMP.raw)}</textarea>
      <div class="mini" style="margin-top:9px">Baris contoh dan baris panduan dari template akan dilewati otomatis. Tanggal dibaca sebagai <b>hari/bulan/tahun</b>.</div>`;
    foot = `<button class="btn solid" onclick="impParse()">Baca data ${ic('arrow')}</button>
            <button class="btn ghost" onclick="IMP.step=1;impRender()">Kembali</button>`;
  }

  if(IMP.step === 3){
    const fields = S.f.filter(f => !f.g);
    const opts = k => `<option value="">— abaikan kolom ini —</option>` +
      fields.map(f => `<option value="${f.k}"${IMP.map[k]===f.k?' selected':''}>${h(f.l)}</option>`).join('') +
      `<option value="id"${IMP.map[k]==='id'?' selected':''}>ID record (perbarui data lama)</option>` +
      `<option value="_priv"${IMP.map[k]==='_priv'?' selected':''}>Tingkat privasi</option>` +
      `<option value="_tags"${IMP.map[k]==='_tags'?' selected':''}>Tag</option>`;
    const matched = Object.keys(IMP.map).filter(k => IMP.map[k]).length;
    const reqMissing = fields.filter(f => f.req && Object.keys(IMP.map).every(k => IMP.map[k] !== f.k));
    body += `<p class="sub" style="margin-bottom:6px"><b>${IMP.body.length} baris</b> terbaca, <b>${matched} dari ${IMP.head.length} kolom</b> cocok otomatis. Perbaiki yang meleset di bawah.</p>
      ${reqMissing.length ? `<div class="statebar del" style="margin:12px 0"><span class="dbadge" style="background:var(--red)">WAJIB</span>
        <div style="flex:1;min-width:200px">Kolom wajib belum terpetakan: <b>${reqMissing.map(f=>h(f.l)).join(', ')}</b>. Baris tanpa isian ini akan ditolak.</div></div>` : ''}
      <div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Kolom di lembar Anda</th><th>Contoh isi</th><th>Dipetakan ke</th></tr></thead><tbody>
      ${IMP.head.map((c,i)=>`<tr>
        <td><b>${h(c||'(tanpa judul)')}</b></td>
        <td class="mini" style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${h((IMP.body.find(r=>r[i])||[])[i] || '—')}</td>
        <td><select onchange="IMP.map['${i}']=this.value;impRender()" style="width:100%;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:9px;padding:6px 9px;font:inherit;font-size:12.5px">${opts(String(i))}</select></td>
      </tr>`).join('')}</tbody></table></div>`;
    foot = `<button class="btn solid" onclick="impValidate()">Pratinjau ${ic('arrow')}</button>
            <button class="btn ghost" onclick="IMP.step=2;impRender()">Kembali</button>`;
  }

  if(IMP.step === 4){
    const r = IMP.res;
    const okN = r.rows.filter(x => x.st !== 'error').length;
    const upd = r.rows.filter(x => x.st !== 'error' && x.upd).length;
    body += `
      <div class="g g4" style="margin-bottom:16px">
        ${[['Siap diimpor', okN, 'green','check'],['Memperbarui data lama', upd,'blue','arrow'],
           ['Peringatan', r.rows.filter(x=>x.st==='warn').length,'orange','flag'],
           ['Ditolak', r.rows.filter(x=>x.st==='error').length,'red','shield']].map(s=>`
          <div class="card"><div class="kpi">
            <div class="ic" style="width:34px;height:34px;border-radius:10px;display:grid;place-items:center;flex:0 0 34px;background:${CT(s[2])};color:${CV(s[2])}">${ic(s[3])}</div>
            <div style="min-width:0"><b>${s[1]}</b><span>${s[0]}</span></div></div></div>`).join('')}
      </div>
      ${r.skipped ? `<div class="mini" style="margin-bottom:10px">${r.skipped} baris contoh/panduan dari template dilewati.</div>` : ''}
      <div style="overflow-x:auto;max-height:340px;overflow-y:auto"><table class="tbl"><thead><tr>
        <th>#</th><th>Status</th><th>${h(SCHEMA[IMP.type].n)}</th><th>Catatan</th></tr></thead><tbody>
        ${r.rows.slice(0,60).map((x,i)=>`<tr>
          <td class="mini">${x.line}</td>
          <td><span class="pill ${x.st==='ok'?'green':x.st==='warn'?'orange':'red'}">${x.st==='ok'?'SIAP':x.st==='warn'?'PERINGATAN':'DITOLAK'}</span></td>
          <td><b>${h(x.title || '(tanpa judul)')}</b>${x.upd?` <span class="pill blue">perbarui ${x.upd}</span>`:''}</td>
          <td class="mini">${x.msgs.length ? h(x.msgs.join(' · ')) : '—'}</td>
        </tr>`).join('')}
      </tbody></table></div>
      ${r.rows.length > 60 ? `<div class="mini" style="margin-top:9px">Menampilkan 60 dari ${r.rows.length} baris.</div>` : ''}`;
    foot = okN
      ? `<button class="btn solid" onclick="impCommit()">${ic('check')} Impor ${okN} baris</button>
         <button class="btn ghost" onclick="IMP.step=3;impRender()">Kembali</button>
         <span class="mini" style="margin-left:auto;align-self:center">Bisa dibatalkan setelah impor lewat Data Saya.</span>`
      : `<button class="btn ghost" onclick="IMP.step=3;impRender()">Kembali</button>
         <span class="mini" style="align-self:center">Tidak ada baris yang bisa diimpor.</span>`;
  }

  modal('Impor dari Google Sheets', `Entitas: <b>${h(S.n)}</b> · prefix <code>${IMP.type}</code>`, body, foot, true);
}

/* ---------------- langkah 2 → 3 ---------------- */
function impParse(){
  const el = document.getElementById('impIn');
  IMP.raw = el ? el.value : '';
  const rows = parseTable(IMP.raw);
  if(rows.length < 2){ toast('Belum ada data terbaca — pastikan baris judul dan minimal satu baris isi ikut tersalin'); return; }
  IMP.head = rows[0];
  IMP.body = rows.slice(1);
  impAutoMap();
  IMP.step = 3; impRender();
}
function impAutoMap(){
  const S = SCHEMA[IMP.type], fields = S.f.filter(f => !f.g);
  IMP.map = {};
  IMP.head.forEach((c, i) => {
    const n = normKey(c);
    if(!n) return;
    if(META_COLS[n]){ IMP.map[String(i)] = META_COLS[n]; return; }
    let f = fields.find(x => normKey(x.k) === n) || fields.find(x => normKey(x.l) === n);
    if(!f) f = fields.find(x => normKey(x.l).indexOf(n) === 0 || n.indexOf(normKey(x.l)) === 0);
    if(f) IMP.map[String(i)] = f.k;
  });
}

/* ---------------- langkah 3 → 4 ---------------- */
function impValidate(){
  const S = SCHEMA[IMP.type], fields = S.f.filter(f => !f.g);
  const byKey = {}; fields.forEach(f => byKey[f.k] = f);
  const rows = []; let skipped = 0;

  IMP.body.forEach((r, idx) => {
    const first = String(r[0] || '').toUpperCase();
    if(first.indexOf('CONTOH') === 0 || first.indexOf('PANDUAN') === 0 || r.every(c => !c)){ skipped++; return; }

    const vals = {}, msgs = []; let st = 'ok', upd = '';
    Object.keys(IMP.map).forEach(ci => {
      const key = IMP.map[ci]; if(!key) return;
      let v = String(r[Number(ci)] || '').trim(); if(!v) return;

      if(key === 'id'){
        const ex = recById(v);
        if(ex && ex.type === IMP.type) upd = v;
        else msgs.push('ID ' + v + ' tidak ditemukan — dibuat sebagai record baru');
        return;
      }
      if(key === '_priv'){ vals._priv = PRIV.indexOf(v) >= 0 ? v : S.priv; return; }
      if(key === '_tags'){ vals._tags = v; return; }

      const f = byKey[key]; if(!f) return;
      if(f.t === 'date'){
        const d = normDate(v);
        if(d === null){ msgs.push(h(f.l) + ': tanggal "' + v + '" tidak terbaca'); st = 'warn'; return; }
        v = d;
      } else if(f.t === 'num'){
        const n = normNum(v);
        if(isNaN(Number(n))){ msgs.push(h(f.l) + ': "' + v + '" bukan angka'); st = 'warn'; return; }
        v = n;
      } else if(f.t === 'sel'){
        const hit = f.opt.find(o => normKey(o) === normKey(v));
        if(!hit){
          const other = f.opt.find(o => normKey(o) === 'lainnya');
          if(other){ msgs.push(h(f.l) + ': "' + v + '" tidak dikenal — disetel ke ' + other); v = other; }
          else { msgs.push(h(f.l) + ': "' + v + '" bukan pilihan yang dikenal'); st = 'warn'; return; }
          st = 'warn';
        } else v = hit;
      } else if(f.t === 'rel'){
        const ex = recById(v);
        if(!ex || typeOf(ex) !== f.rel){ msgs.push(h(f.l) + ': ' + v + ' bukan ID ' + SCHEMA[f.rel].n); st = 'warn'; return; }
      } else if(f.t === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)){
        msgs.push('Email "' + v + '" tidak wajar'); st = 'warn';
      }
      vals[f.k] = v;
    });

    fields.filter(f => f.req).forEach(f => {
      if(!vals[f.k] && !upd){ msgs.push(h(f.l) + ' kosong'); st = 'error'; }
    });

    /* duplikat berdasarkan judul, hanya untuk record baru */
    if(!upd && st !== 'error'){
      const title = S.t(Object.assign({}, vals));
      const dup = recs(IMP.type).find(x => S.t(x) && title && normKey(S.t(x)) === normKey(title));
      if(dup){ msgs.push('Mirip dengan ' + dup.id + ' yang sudah ada'); if(st === 'ok') st = 'warn'; }
    }

    rows.push({ line: idx + 2, vals, msgs, st, upd, title: (()=>{ try{ return S.t(vals); }catch(e){ return ''; } })() });
  });

  IMP.res = { rows, skipped };
  IMP.step = 4; impRender();
}

/* ---------------- langkah 4: simpan ---------------- */
function impCommit(){
  const S = SCHEMA[IMP.type], now = new Date().toISOString();
  const ids = []; let created = 0, updated = 0;
  IMP.res.rows.filter(x => x.st !== 'error').forEach(x => {
    const v = Object.assign({}, x.vals);
    const tags = (v._tags || '').split(',').map(s => s.trim()).filter(Boolean);
    const priv = v._priv || S.priv;
    delete v._tags; delete v._priv;
    if(x.upd){
      const r = recById(x.upd);
      Object.assign(r, v);
      r._m.updated_at = now; r._m.updated_by = DB.owner.name;
      if(tags.length) r._m.tags = tags;
      r._m.privacy_level = priv;
      logAct('IMPORT-UPDATE', r); ids.push(r.id); updated++;
    } else {
      const r = Object.assign({ id: nextId(IMP.type), type: IMP.type }, v);
      r._m = { created_at:now, updated_at:now, created_by:DB.owner.name, updated_by:DB.owner.name,
               status:'ACTIVE', source_type:'IMPORT_CSV', source_id:'', source_url:'',
               privacy_level:priv, is_dummy:false, is_archived:false, tags };
      (STORE.rec[IMP.type] = STORE.rec[IMP.type] || []).unshift(r);
      logAct('IMPORT', r); ids.push(r.id); created++;
    }
  });
  STORE.imports = STORE.imports || [];
  STORE.imports.unshift({ id:'IMP-' + String(STORE.imports.length + 1).padStart(6,'0'), ts:now, type:IMP.type, created, updated, ids });
  saveStore(); closeModal();
  toast(`${created} record baru · ${updated} diperbarui — ${S.n}`);
  go(CUR);
}

/* ---------------- batalkan satu batch impor ---------------- */
function undoImport(id){
  const b = (STORE.imports || []).find(x => x.id === id); if(!b) return;
  modal('Batalkan impor ' + b.id, `${b.created} record baru dan ${b.updated} pembaruan dari ${dtID(b.ts)}.`,
    `<p class="sub">Record baru dari batch ini akan diarsipkan — ditandai <code>is_archived = true</code>, tidak dihapus, dan masih bisa dipulihkan satu per satu.</p>
     <p class="sub" style="margin-top:10px"><b>Yang tidak bisa dikembalikan:</b> ${b.updated} record lama yang diperbarui oleh impor ini tetap memakai nilai baru — nilai lamanya tidak disimpan.</p>`,
    `<button class="btn red" onclick="doUndoImport('${id}')">Arsipkan ${b.created} record baru</button>
     <button class="btn ghost" onclick="closeModal()">Batal</button>`);
}
function doUndoImport(id){
  const b = (STORE.imports || []).find(x => x.id === id); if(!b) return;
  let n = 0;
  b.ids.forEach(rid => {
    const r = recById(rid);
    if(r && r._m.source_type === 'IMPORT_CSV' && !r._m.is_archived){
      r._m.is_archived = true; r._m.status = 'ARCHIVED'; r._m.updated_at = new Date().toISOString();
      logAct('ARCHIVE', r, 'undo ' + id); n++;
    }
  });
  b.undone = true; saveStore(); closeModal();
  toast(n + ' record dari ' + id + ' diarsipkan'); go(CUR);
}

/* ---------------- panel di System Foundation › Import Staging ---------------- */
function impPanel(){
  const list = STORE.imports || [];
  return `
  <div class="card" style="margin-bottom:18px">
    ${cardH('doc','Impor dari template Drive','green',`<button class="btn solid sm" onclick="openImport()">${ic('plus')} Mulai impor</button>`)}
    <p class="sub" style="margin-bottom:14px">Isi template di folder modul, salin seluruh tabel dari Google Sheets, lalu tempel di sini. Sistem mencocokkan kolom, memeriksa tiap baris, dan menampilkan pratinjau sebelum apa pun tersimpan.</p>
    <div class="g g4" style="gap:12px;margin:0">
      ${[['1','Isi template','Kolom template sudah cocok dengan Data Dictionary tiap entitas.','gold','doc'],
         ['2','Salin & tempel','Blok seluruh tabel termasuk baris judul. CSV maupun salinan langsung dari Sheets diterima.','blue','layers'],
         ['3','Periksa','Tanggal, angka, pilihan, dan relasi diperiksa per baris. Baris bermasalah ditolak, bukan diselundupkan.','orange','shield'],
         ['4','Setujui','Baris dengan kolom id yang cocok memperbarui record lama — tidak membuat duplikat.','green','check']].map(s=>`
        <div class="card" style="padding:14px">
          <div class="flexr" style="gap:9px;margin-bottom:6px">
            <div class="ic" style="width:28px;height:28px;border-radius:9px;display:grid;place-items:center;flex:0 0 28px;background:${CT(s[3])};color:${CV(s[3])}">${ic(s[4])}</div>
            <b style="font-size:13.5px">${s[0]}. ${s[1]}</b></div>
          <p class="sub" style="margin:0;font-size:11.5px">${s[2]}</p></div>`).join('')}
    </div>
  </div>
  ${list.length ? `<div class="card" style="margin-bottom:18px">
    ${cardH('clock','Riwayat impor','blue',`<span class="cnt">${list.length}</span>`)}
    <div style="overflow-x:auto"><table class="tbl"><thead><tr>
      <th>Batch</th><th>Entitas</th><th style="text-align:right">Baru</th><th style="text-align:right">Diperbarui</th><th>Waktu</th><th>Aksi</th>
    </tr></thead><tbody>${list.map(b=>`<tr>
      <td><code>${b.id}</code></td>
      <td>${h(SCHEMA[b.type] ? SCHEMA[b.type].n : b.type)}</td>
      <td style="text-align:right;font-variant-numeric:tabular-nums">${b.created}</td>
      <td style="text-align:right;font-variant-numeric:tabular-nums">${b.updated}</td>
      <td class="mini">${dtID(b.ts)}</td>
      <td>${b.undone ? '<span class="pill gray">sudah dibatalkan</span>' : `<button class="btn ghost sm" onclick="undoImport('${b.id}')">Batalkan</button>`}</td>
    </tr>`).join('')}</tbody></table></div>
  </div>` : ''}`;
}

if(typeof F_VIEW !== 'undefined' && F_VIEW.staging){
  const _stg = F_VIEW.staging;
  F_VIEW.staging = () => impPanel() + _stg();
}

