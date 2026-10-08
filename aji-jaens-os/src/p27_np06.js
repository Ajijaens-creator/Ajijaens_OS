/* ================= NP-V06 · LEARN =================
   Paket pembangunan NP-V06. BUKAN fase roadmap.
   Roadmap resmi tetap 7 fase / 18 Master Prompt.

   Ketentuan yang dipegang di berkas ini:

   - TIDAK ada tabel, form, atau record paralel. Entitas tetap LRN dari
     NP-01, mesin form tetap p11_form.js, tautan tetap p22_links.js.
     Yang ditambah di sini hanya cara melihat dan menyaringnya.
   - Papan memakai mesin geser yang sudah teruji (p23_board.js), bukan
     mesin geser kedua. Satu perpindahan kartu = satu perubahan kolom
     status, tercatat di linimasa record dan bisa diurungkan.
   - TIDAK ada insight AI di sini. Angka yang muncul adalah hasil
     HITUNGAN dari record yang ada, dan dikatakan begitu. Tidak ada
     kesimpulan yang dibuat seolah-olah tahu lebih banyak daripada isi
     catatannya sendiri.
   - Tangkap cepat menyimpan apa yang benar-benar diketik, sebagai Draft,
     dan baru mengatakan "tersimpan" setelah penyimpanan berhasil. */

/* ---------------- 1. SARINGAN ---------------- */

let L6 = { q:'', jenis:'', topik:'', st:'', dari:'', sampai:'', refl:'' };

function l6Set(k, v){ L6[k] = v; go(CUR); }
function l6Reset(){ L6 = { q:'', jenis:'', topik:'', st:'', dari:'', sampai:'', refl:'' }; go(CUR); }
const l6Aktif = () => Object.keys(L6).filter(k => L6[k]).length;

/* Topik dibaca dari record, bukan dari daftar tetap: kalau Anda menulis
   topik baru, saringannya langsung mengenalnya. */
function l6Topik(){
  const set = {};
  recs('LRN').forEach(r => String(r.topic || '').split(',').map(s => s.trim())
    .filter(Boolean).forEach(t => { set[t] = (set[t] || 0) + 1; }));
  return Object.keys(set).sort((a, b) => set[b] - set[a] || a.localeCompare(b));
}

function l6Filter(){
  const q = L6.q.toLowerCase();
  return recs('LRN').filter(r => {
    if(L6.jenis && (r.jenis || '') !== L6.jenis) return false;
    if(L6.st && (r.st || '') !== L6.st) return false;
    if(L6.topik){
      const ts = String(r.topic || '').split(',').map(s => s.trim());
      if(ts.indexOf(L6.topik) === -1) return false;
    }
    /* Record tanpa tanggal TIDAK dibuang oleh saringan periode, dan tidak
       diberi tanggal karangan. Ia hanya tidak ikut saat periode dipakai —
       dan itu dikatakan di layar. */
    if(L6.dari && !(r.date && r.date >= L6.dari)) return false;
    if(L6.sampai && !(r.date && r.date <= L6.sampai)) return false;
    if(L6.refl === 'ada' && !String(r.lesson || '').trim()) return false;
    if(L6.refl === 'belum' && String(r.lesson || '').trim()) return false;
    if(q){
      const bl = [r.n, r.note, r.summary, r.lesson, r.apply, r.src, r.author, r.topic, r.id]
        .map(x => String(x || '').toLowerCase()).join(' ');
      if(bl.indexOf(q) === -1) return false;
    }
    return true;
  });
}

/* ---------------- 2. PAPAN ---------------- */

BOARDS.lrn = { id:'lrn', n:'Papan pembelajaran', type:'LRN', key:'st',
  keyLabel:'status pembelajaran', ic:'book', c:'green',
  sortNote:'tanggal pembelajaran terbaru lebih dulu, yang tanpa tanggal di bawah',
  colc:{ 'Draft':'gray', 'Perlu Dirangkum':'orange', 'Sudah Direfleksikan':'green' },
  items: () => l6Filter().slice().sort((a, b) =>
    String(b.date || '').localeCompare(String(a.date || ''))),
  open: id => recDetail(id),
  card: r => {
    const ada = String(r.lesson || '').trim();
    const topik = String(r.topic || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 2);
    return `<span class="kn" style="padding-right:22px">${h(r.n || r.id)}</span>
      <span class="km">${h(r.src || 'tanpa sumber tertulis')}${r.author ? ' · ' + h(r.author) : ''}</span>
      <div class="flexr" style="gap:6px;margin-top:8px;flex-wrap:wrap">
        ${r.jenis ? `<span class="pill gray">${h(r.jenis)}</span>` : ''}
        ${r.date ? `<span class="pill gray">${h(relDay(r.date))}</span>`
                 : '<span class="pill dummy">tanpa tanggal</span>'}
        ${ada ? '<span class="pill green">ada pelajaran</span>'
              : '<span class="pill orange">pelajaran belum ditulis</span>'}
        ${topik.map(t => `<span class="pill blue">${h(t)}</span>`).join('')}
      </div>`;
  } };

/* ---------------- 3. TANGKAP CEPAT ---------------- */
/* Satu kotak, dua kolom wajib terisi otomatis: baris pertama jadi judul,
   seluruh teks jadi catatan. Statusnya Draft — bukan "sudah direfleksikan",
   karena yang baru ditangkap memang belum direfleksikan. */
function l6Capture(){
  const el = document.getElementById('l6in');
  const v = el ? String(el.value || '').trim() : '';
  if(!v){ toast('Tulis dulu sesuatu untuk ditangkap'); return; }
  const judul = v.split('\n')[0].trim().slice(0, 120) || v.slice(0, 120);
  const now = new Date().toISOString();
  const r = { id: nextId('LRN'), type:'LRN', n: judul, note: v, st:'Draft' };
  r._m = { created_at:now, updated_at:now, created_by:DB.owner.name, updated_by:DB.owner.name,
           status:'ACTIVE', source_type:'MANUAL_ENTRY', source_id:'', source_url:'',
           privacy_level: SCHEMA.LRN.priv, is_dummy:false, is_archived:false, tags:[] };
  (STORE.rec.LRN = STORE.rec.LRN || []).unshift(r);
  logAct('CREATE', r, 'tangkap cepat');
  /* "Tersimpan" baru diucapkan setelah penyimpanan benar-benar berhasil. */
  if(!saveStore()){ toast('Belum tersimpan — periksa ruang penyimpanan peramban'); return; }
  el.value = '';
  toast('Tertangkap sebagai ' + r.id + ' · status Draft');
  go(CUR);
}

/* ---------------- 4. TAMPILAN LEARN ---------------- */

function l6Hitung(rows){
  const n = rows.length;
  const pel = rows.filter(r => String(r.lesson || '').trim()).length;
  const tap = rows.filter(r => String(r.apply || '').trim()).length;
  const noDate = rows.filter(r => !r.date).length;
  return { n, pel, tap, noDate };
}

function l6View(){
  const semua = recs('LRN');
  const rows = l6Filter();
  const st = l6Hitung(rows);
  const topik = l6Topik();

  const tangkap = `<div class="card" style="margin-bottom:16px">
    ${cardH('plus','Tangkap cepat','green','<span class="mini">dua kolom wajib terisi sendiri</span>')}
    <textarea id="l6in" rows="2" placeholder="Apa yang baru Anda pelajari? Baris pertama jadi judulnya."
      style="width:100%;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:10px;padding:10px 12px;font:inherit;font-size:14px;outline:0;resize:vertical"></textarea>
    <div class="flexr" style="gap:8px;margin-top:9px;flex-wrap:wrap">
      <button class="btn solid sm" onclick="l6Capture()">${ic('plus')} Tangkap</button>
      <button class="btn ghost sm" onclick="openForm('LRN')">Form lengkap</button>
      <span class="mini" style="flex:1;min-width:180px">Tersimpan sebagai <b>Draft</b>. Sumber, topik, dan
        pelajarannya bisa dilengkapi kapan saja — dan status tidak naik sendiri.</span>
    </div></div>`;

  if(!semua.length) return tangkap + emptyCard('book','green','Belum ada pembelajaran',
    'Catatan di sini punya satu kolom yang membedakannya dari tumpukan: <b>pelajaran yang saya ambil</b>. ' +
    'Itu bagian yang masih berguna setahun lagi.',
    `<button class="btn solid" onclick="openForm('LRN')">${ic('plus')} Pembelajaran pertama</button>`);

  const saring = `<div class="card" style="margin-bottom:16px">
    ${cardH('search','Saringan','blue', l6Aktif()
      ? `<span class="pill blue">${l6Aktif()} saringan aktif</span>
         <button class="btn ghost sm" style="margin-left:8px" onclick="l6Reset()">Bersihkan</button>`
      : '<span class="mini">belum ada saringan</span>')}
    <div class="grid2" style="gap:10px">
      <label class="fld" style="margin:0"><span>Cari</span>
        <input type="text" value="${h(L6.q)}" placeholder="judul, catatan, sumber, pelajaran…"
          onchange="l6Set('q',this.value)"
          onkeydown="if(event.key==='Enter'){event.preventDefault();l6Set('q',this.value)}"></label>
      <label class="fld" style="margin:0"><span>Jenis</span>
        <select onchange="l6Set('jenis',this.value)">
          <option value="">Semua jenis</option>
          ${LRN_JENIS.map(x => `<option${L6.jenis === x ? ' selected' : ''}>${h(x)}</option>`).join('')}
        </select></label>
      <label class="fld" style="margin:0"><span>Status</span>
        <select onchange="l6Set('st',this.value)">
          <option value="">Semua status</option>
          ${LRN_ST.map(x => `<option${L6.st === x ? ' selected' : ''}>${h(x)}</option>`).join('')}
        </select></label>
      <label class="fld" style="margin:0"><span>Topik</span>
        <select onchange="l6Set('topik',this.value)">
          <option value="">Semua topik</option>
          ${topik.map(x => `<option${L6.topik === x ? ' selected' : ''}>${h(x)}</option>`).join('')}
        </select></label>
      <label class="fld" style="margin:0"><span>Dari tanggal</span>
        <input type="date" value="${h(L6.dari)}" onchange="l6Set('dari',this.value)"></label>
      <label class="fld" style="margin:0"><span>Sampai tanggal</span>
        <input type="date" value="${h(L6.sampai)}" onchange="l6Set('sampai',this.value)"></label>
      <label class="fld" style="margin:0"><span>Pelajaran</span>
        <select onchange="l6Set('refl',this.value)">
          <option value="">Semua</option>
          <option value="ada"${L6.refl === 'ada' ? ' selected' : ''}>Sudah ditulis</option>
          <option value="belum"${L6.refl === 'belum' ? ' selected' : ''}>Belum ditulis</option>
        </select></label>
    </div>
    <div class="mini" style="margin-top:10px"><b>${rows.length} dari ${semua.length}</b> pembelajaran cocok.
      ${(L6.dari || L6.sampai)
        ? `Saringan periode hanya mengenai record yang punya tanggal; yang tanpa tanggal tidak ikut
           ditampilkan sekarang, dan <b>tidak diberi tanggal karangan</b>.`
        : `${st.noDate ? st.noDate + ' di antaranya belum punya tanggal pembelajaran — dibiarkan kosong, bukan diisi hari ini.' : 'Semua punya tanggal pembelajaran.'}`}
    </div></div>`;

  const angka = `<div class="card" style="margin-bottom:16px">
    ${cardH('check','Hitungan','gray','<span class="mini">dihitung, bukan disimpulkan</span>')}
    <div class="flexr" style="gap:10px;flex-wrap:wrap">
      ${[['Cocok saringan', st.n, 'dari ' + semua.length + ' record'],
         ['Ada pelajaran', st.pel, st.n ? Math.round(st.pel / st.n * 100) + '% dari yang cocok' : 'belum ada yang cocok'],
         ['Ada rencana penerapan', st.tap, st.n ? Math.round(st.tap / st.n * 100) + '% dari yang cocok' : '—']]
        .map(([l, v, k]) => `<div style="flex:1;min-width:140px">
          <div class="mini">${l}</div>
          <div style="font-family:var(--fd);font-size:26px;line-height:1.1">${v}</div>
          <div class="mini">${k}</div></div>`).join('')}
    </div>
    <div class="card-f"><span class="mini">Angka di atas adalah <b>cacah record</b>, bukan penilaian.
      Tidak ada kesimpulan AI di layar ini: tidak ada integrasi yang menghasilkannya, jadi tidak
      ada yang ditampilkan seolah-olah ada.</span></div></div>`;

  const papan = rows.length
    ? boardCard('lrn', `<button class="btn gold sm" onclick="openForm('LRN')">${ic('plus')} Pembelajaran</button>`)
    : `<div class="card"><div class="mini">Tidak ada pembelajaran yang cocok dengan saringan ini.
        ${semua.length} record lain tetap ada dan tidak terhapus.</div></div>`;

  return tangkap + saring + angka + papan + knLuar('LRN', rows, LRN_ST);
}

if(typeof KN_VIEW !== 'undefined') KN_VIEW.lrn = l6View;

/* ---------------- 5. RECORD YANG TIDAK MUNCUL DI PAPAN ----------------
   Papan menyusun kartu menurut kolom status. Record yang statusnya masih
   kosong karena itu TIDAK punya kolom, dan kalau dibiarkan ia hilang dari
   pandangan tanpa pemberitahuan — padahal datanya ada.

   Status tidak diisi sendiri di sini: mengisi diam-diam berarti sistem
   menyatakan sesuatu atas nama pemiliknya. Yang dilakukan hanya
   mengatakan bahwa record itu ada, lalu menyediakan tombolnya. */
function knLuar(T, rows, opt){
  const luar = rows.filter(r => !String(r.st || '').trim());
  if(!luar.length) return '';
  const S = SCHEMA[T];
  return `<div class="card" style="margin-top:16px">
    ${cardH('info','Belum muncul di papan','orange',`<span class="pill orange">${luar.length}</span>`)}
    <div class="mini" style="margin-bottom:10px">Record ini <b>belum punya status</b>, jadi tidak ada kolom
      yang bisa menampungnya di papan. Datanya tetap ada dan tidak terhapus.
      <b>Statusnya tidak diisi sendiri</b> — Anda yang menentukan, karena status adalah pernyataan Anda.</div>
    <div class="list">${luar.map(r => `
      <div class="row-i" style="align-items:flex-start">
        ${ic(S.ic)}<span style="flex:1"><span class="t">${h(S.t(r) || r.id)}</span>
        <span class="s">${r.id}</span>
        <span class="flexr" style="gap:7px;margin-top:8px;flex-wrap:wrap">
          ${opt.map(o => `<button class="btn ghost sm" onclick="knSetSt('${r.id}','${h(o)}')">${h(o)}</button>`).join('')}
          <button class="btn ghost sm" onclick="recDetail('${r.id}')">Buka</button>
        </span></span>
        <span class="pill dummy">TANPA STATUS</span></div>`).join('')}</div></div>`;
}

/* Satu perubahan kolom, dicatat seperti perpindahan kartu biasa. */
function knSetSt(id, st){
  const r = recById(id); if(!r) return;
  const T = typeOf(r);
  const before = Object.assign({}, r, { _priv: r._m.privacy_level });
  r.st = st;
  r._m.updated_at = new Date().toISOString(); r._m.updated_by = DB.owner.name;
  logAct('UPDATE', r, 'status diisi dari daftar tanpa status',
    diffRec(before, Object.assign({}, r, { _priv: r._m.privacy_level }), T));
  if(!saveStore()){ toast('Belum tersimpan — periksa ruang penyimpanan peramban'); return; }
  toast(r.id + ' → ' + st);
  go(CUR);
}
