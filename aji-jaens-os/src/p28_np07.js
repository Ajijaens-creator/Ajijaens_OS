/* ================= NP-V07 · DO =================
   Paket pembangunan NP-V07. BUKAN fase roadmap.

   Ketentuan yang dipegang di berkas ini:

   - Entitas tetap PRK dari NP-01. Tidak ada tabel atau form paralel.
   - Papan memakai mesin geser yang sudah teruji (p23_board.js).
   - KOREKSI MOCKUP: di gambar NV-07 tab "Bukti" tampak aktif padahal
     yang semestinya terbuka lebih dulu adalah "Rencana". Mockup adalah
     acuan desain, bukan bukti fitur berjalan — jadi yang dipakai di sini
     urutan yang benar: Rencana lebih dulu, Bukti paling akhir.
   - TIDAK ADA hasil atau tanggal historis palsu. Kolom hasil yang belum
     ditulis tampil sebagai "belum ditulis", bukan diisi kalimat contoh.
     Tanggal yang kosong tetap kosong — tidak diisi hari ini, dan tidak
     ditebak dari tanggal pembuatan record.
   - "Dilakukan" tidak sama dengan "berhasil", dan itu ditulis di layar
     tempat statusnya diubah. */

/* ---------------- 1. SARINGAN ---------------- */

let D7 = { q:'', kind:'', st:'', dari:'', sampai:'', hasil:'', sumber:'' };

function d7Set(k, v){ D7[k] = v; go(CUR); }
function d7Reset(){ D7 = { q:'', kind:'', st:'', dari:'', sampai:'', hasil:'', sumber:'' }; go(CUR); }
const d7Aktif = () => Object.keys(D7).filter(k => D7[k]).length;

function d7Filter(){
  const q = D7.q.toLowerCase();
  return recs('PRK').filter(r => {
    if(D7.kind && (r.kind || '') !== D7.kind) return false;
    if(D7.st && (r.st || '') !== D7.st) return false;
    /* Periode memakai tanggal MULAI. Yang belum punya tanggal tidak ikut
       saat periode dipakai, dan tidak diberi tanggal karangan. */
    if(D7.dari && !(r.start && r.start >= D7.dari)) return false;
    if(D7.sampai && !(r.start && r.start <= D7.sampai)) return false;
    if(D7.hasil === 'ada' && !String(r.res || '').trim()) return false;
    if(D7.hasil === 'belum' && String(r.res || '').trim()) return false;
    if(D7.sumber === 'ada' && !r.learn) return false;
    if(D7.sumber === 'tanpa' && r.learn) return false;
    if(q){
      const bl = [r.n, r.note, r.sit, r.goal, r.act, r.chal, r.res, r.refl, r.next, r.id]
        .map(x => String(x || '').toLowerCase()).join(' ');
      if(bl.indexOf(q) === -1) return false;
    }
    return true;
  });
}

/* ---------------- 2. PAPAN ---------------- */

BOARDS.prk = { id:'prk', n:'Papan praktik & pengalaman', type:'PRK', key:'st',
  keyLabel:'status praktik', ic:'bolt', c:'blue',
  sortNote:'tanggal mulai terbaru lebih dulu, yang tanpa tanggal di bawah',
  colc:{ 'Direncanakan':'gray', 'Dilakukan':'blue', 'Direfleksikan':'green' },
  items: () => d7Filter().slice().sort((a, b) =>
    String(b.start || '').localeCompare(String(a.start || ''))),
  open: id => recDetail(id),
  /* Menggeser ke "Dilakukan" TIDAK mengisi tanggal selesai sendiri, dan
     TIDAK menuliskan hasil. Status adalah pernyataan Anda; hasil adalah
     catatan terpisah yang hanya Anda yang bisa menulis. */
  onMove: (r, to) => {
    if(to === 'Dilakukan' && !String(r.res || '').trim())
      toast('Status naik. Hasilnya belum ditulis — dan tidak diisi sendiri.');
    if(to === 'Direfleksikan' && !String(r.refl || '').trim())
      toast('Status naik. Refleksinya masih kosong.');
  },
  card: r => {
    const src = r.learn ? recById(r.learn) : null;
    const hasil = String(r.res || '').trim();
    return `<span class="kn" style="padding-right:22px">${h(r.n || r.id)}</span>
      <span class="km">${src ? 'dari ' + h(SCHEMA.LRN.t(src) || src.id) : 'tanpa sumber pembelajaran'}</span>
      <div class="flexr" style="gap:6px;margin-top:8px;flex-wrap:wrap">
        ${r.kind ? `<span class="pill gray">${h(r.kind)}</span>` : ''}
        ${r.start ? `<span class="pill gray">${h(relDay(r.start))}</span>`
                  : '<span class="pill dummy">tanpa tanggal mulai</span>'}
        ${hasil ? '<span class="pill green">hasil tercatat</span>'
                : '<span class="pill orange">hasil belum ditulis</span>'}
        ${String(r.ev || '').trim() ? '<span class="pill blue">ada rujukan bukti</span>' : ''}
      </div>`;
  } };

/* ---------------- 3. DETAIL BERTAB ----------------
   Panel semuanya digambar sekaligus lalu disembunyikan, bukan digambar
   ulang per klik: lebih sederhana, dan tidak ada keadaan setengah jadi
   kalau satu panel gagal dirender.

   Urutan tab: Rencana → Tindakan → Hasil → Bukti. Yang aktif saat dibuka
   adalah Rencana. Mockup NV-07 memperlihatkan Bukti yang aktif; itu
   dikoreksi di sini, dan dicatat supaya tidak "diperbaiki" kembali. */

function npTabGo(grup, kunci){
  const wrap = document.getElementById('tabs-' + grup);
  if(!wrap) return;
  wrap.querySelectorAll('[data-tabk]').forEach(b => {
    const on = b.getAttribute('data-tabk') === kunci;
    b.classList.toggle('on', on);
    b.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  wrap.querySelectorAll('[data-panelk]').forEach(p => {
    p.hidden = p.getAttribute('data-panelk') !== kunci;
  });
}

/* Satu blok teks. Kosong ditulis "belum ditulis" — tidak diisi contoh,
   tidak diisi kalimat penyemangat, tidak diisi apa pun. */
function d7Blok(label, isi, bantu){
  const v = String(isi || '').trim();
  return `<div style="margin-bottom:14px">
    <div class="mini" style="font-weight:600;color:var(--text)">${h(label)}</div>
    ${v ? `<div style="white-space:pre-wrap;font-size:14.5px;margin-top:4px">${h(v)}</div>`
        : '<div class="mini" style="margin-top:4px"><i>belum ditulis</i></div>'}
    ${bantu ? `<div class="mini" style="margin-top:4px">${bantu}</div>` : ''}</div>`;
}

function d7Tanggal(label, v){
  return `<div style="flex:1;min-width:130px">
    <div class="mini">${h(label)}</div>
    ${v ? `<div style="font-size:14.5px">${h(v)} · ${h(relDay(v))}</div>`
        : '<div class="mini"><i>belum diisi</i></div>'}</div>`;
}

function d7Detail(r){
  const src = r.learn ? recById(r.learn) : null;
  const TAB = [
    ['rencana','Rencana'],
    ['tindakan','Tindakan'],
    ['hasil','Hasil & refleksi'],
    ['bukti','Bukti']
  ];
  const panel = {
    rencana:
      `<div class="flexr" style="gap:12px;flex-wrap:wrap;margin-bottom:12px">
        ${d7Tanggal('Mulai', r.start)}${d7Tanggal('Selesai', r.end)}
        <div style="flex:1;min-width:130px"><div class="mini">Jenis</div>
          <div style="font-size:14.5px">${r.kind ? h(r.kind) : '<i class="mini">belum diisi</i>'}</div></div>
      </div>
      ${src ? `<div class="mini" style="margin-bottom:12px">Berasal dari
        <button class="btn ghost sm" onclick="recDetail('${src.id}')">${h(SCHEMA.LRN.t(src) || src.id)}</button></div>`
            : '<div class="mini" style="margin-bottom:12px">Tidak ditautkan ke pembelajaran mana pun — dan itu sah, pengalaman tidak harus lahir dari bacaan.</div>'}
      ${d7Blok('Situasi', r.sit)}
      ${d7Blok('Tujuan', r.goal)}`,
    tindakan:
      d7Blok('Tindakan', r.act) +
      d7Blok('Tantangan', r.chal),
    hasil:
      d7Blok('Hasil yang tercatat', r.res,
        'Yang tertulis di sini adalah apa yang terjadi menurut catatan Anda. ' +
        '<b>Status "Dilakukan" tidak berarti berhasil</b>, dan tidak ada hasil yang diisi sendiri oleh sistem.') +
      d7Blok('Pelajaran / refleksi', r.refl) +
      d7Blok('Langkah berikutnya', r.next),
    bukti:
      d7Blok('Bukti (rujukan)', r.ev,
        'Aplikasi ini <b>belum bisa menyimpan berkas</b>. Yang tercatat di sini rujukan — tautan Drive, ' +
        'nama berkas, atau di mana benda itu berada. Kosong berarti belum ada rujukan yang ditulis, ' +
        'bukan berarti buktinya hilang.')
  };

  return `<div id="tabs-prk-${r.id}" class="np-tabs">
    <div class="tabbar" role="tablist">${TAB.map(([k, n], i) =>
      `<button role="tab" data-tabk="${k}" class="${i === 0 ? 'on' : ''}"
        aria-selected="${i === 0 ? 'true' : 'false'}"
        onclick="npTabGo('prk-${r.id}','${k}')">${n}</button>`).join('')}</div>
    ${TAB.map(([k], i) => `<div data-panelk="${k}"${i === 0 ? '' : ' hidden'}>${panel[k]}</div>`).join('')}
  </div>`;
}

/* Menyisip ke detail record yang sudah ada, dengan membungkus kait NP-01
   alih-alih menggantinya — supaya peringatan "sumber berubah" milik BHN
   dan sisipan lainnya tetap jalan. */
if(typeof npDetailExtra === 'function'){
  const _d7Extra = npDetailExtra;
  npDetailExtra = function(r){
    const dasar = _d7Extra(r);
    if(typeOf(r) !== 'PRK') return dasar;
    return dasar + d7Detail(r);
  };
}

/* ---------------- 4. TAMPILAN DO ---------------- */

function d7Hitung(rows){
  return {
    n: rows.length,
    hasil: rows.filter(r => String(r.res || '').trim()).length,
    refl: rows.filter(r => String(r.refl || '').trim()).length,
    bukti: rows.filter(r => String(r.ev || '').trim()).length,
    noDate: rows.filter(r => !r.start).length
  };
}

function d7View(){
  const semua = recs('PRK');
  const rows = d7Filter();
  const st = d7Hitung(rows);

  if(!semua.length) return emptyCard('bolt','blue','Belum ada praktik atau pengalaman',
    'Di sini pengetahuan berubah jadi pengalaman. Rencana, tindakan, dan hasil dicatat terpisah — ' +
    'supaya "selesai" tidak diam-diam terbaca sebagai "berhasil".',
    `<button class="btn solid" onclick="openForm('PRK')">${ic('plus')} Praktik pertama</button>`);

  const saring = `<div class="card" style="margin-bottom:16px">
    ${cardH('search','Saringan','blue', d7Aktif()
      ? `<span class="pill blue">${d7Aktif()} saringan aktif</span>
         <button class="btn ghost sm" style="margin-left:8px" onclick="d7Reset()">Bersihkan</button>`
      : '<span class="mini">belum ada saringan</span>')}
    <div class="grid2" style="gap:10px">
      <label class="fld" style="margin:0"><span>Cari</span>
        <input type="text" value="${h(D7.q)}" placeholder="judul, situasi, tindakan, hasil…"
          onchange="d7Set('q',this.value)"
          onkeydown="if(event.key==='Enter'){event.preventDefault();d7Set('q',this.value)}"></label>
      <label class="fld" style="margin:0"><span>Jenis</span>
        <select onchange="d7Set('kind',this.value)">
          <option value="">Semua jenis</option>
          ${['Praktik terencana','Pengalaman langsung'].map(x =>
            `<option${D7.kind === x ? ' selected' : ''}>${h(x)}</option>`).join('')}
        </select></label>
      <label class="fld" style="margin:0"><span>Status</span>
        <select onchange="d7Set('st',this.value)">
          <option value="">Semua status</option>
          ${PRK_ST.map(x => `<option${D7.st === x ? ' selected' : ''}>${h(x)}</option>`).join('')}
        </select></label>
      <label class="fld" style="margin:0"><span>Sumber pembelajaran</span>
        <select onchange="d7Set('sumber',this.value)">
          <option value="">Semua</option>
          <option value="ada"${D7.sumber === 'ada' ? ' selected' : ''}>Ditautkan</option>
          <option value="tanpa"${D7.sumber === 'tanpa' ? ' selected' : ''}>Tanpa tautan</option>
        </select></label>
      <label class="fld" style="margin:0"><span>Mulai dari</span>
        <input type="date" value="${h(D7.dari)}" onchange="d7Set('dari',this.value)"></label>
      <label class="fld" style="margin:0"><span>Mulai sampai</span>
        <input type="date" value="${h(D7.sampai)}" onchange="d7Set('sampai',this.value)"></label>
      <label class="fld" style="margin:0"><span>Hasil</span>
        <select onchange="d7Set('hasil',this.value)">
          <option value="">Semua</option>
          <option value="ada"${D7.hasil === 'ada' ? ' selected' : ''}>Sudah ditulis</option>
          <option value="belum"${D7.hasil === 'belum' ? ' selected' : ''}>Belum ditulis</option>
        </select></label>
    </div>
    <div class="mini" style="margin-top:10px"><b>${rows.length} dari ${semua.length}</b> praktik cocok.
      ${(D7.dari || D7.sampai)
        ? 'Saringan periode memakai tanggal mulai; yang belum punya tanggal tidak ikut sekarang dan <b>tidak diberi tanggal karangan</b>.'
        : (st.noDate ? st.noDate + ' di antaranya belum punya tanggal mulai — dibiarkan kosong.' : 'Semua punya tanggal mulai.')}
    </div></div>`;

  const angka = `<div class="card" style="margin-bottom:16px">
    ${cardH('check','Hitungan','gray','<span class="mini">dihitung, bukan dinilai</span>')}
    <div class="flexr" style="gap:10px;flex-wrap:wrap">
      ${[['Cocok saringan', st.n, 'dari ' + semua.length + ' record'],
         ['Hasil tercatat', st.hasil, st.n ? st.n - st.hasil + ' belum ditulis' : '—'],
         ['Sudah direfleksikan', st.refl, st.n ? st.n - st.refl + ' belum' : '—'],
         ['Ada rujukan bukti', st.bukti, 'rujukan, bukan berkas tersimpan']]
        .map(([l, v, k]) => `<div style="flex:1;min-width:130px">
          <div class="mini">${l}</div>
          <div style="font-family:var(--fd);font-size:26px;line-height:1.1">${v}</div>
          <div class="mini">${k}</div></div>`).join('')}
    </div>
    <div class="card-f"><span class="mini"><b>Hasil tercatat bukan hasil yang berhasil.</b>
      Yang dihitung di sini hanya ada atau tidaknya catatan hasil — bukan isi, bukan mutunya,
      dan bukan kesimpulan apa pun tentang keberhasilannya.</span></div></div>`;

  const papan = rows.length
    ? boardCard('prk', `<button class="btn gold sm" onclick="openForm('PRK')">${ic('plus')} Praktik</button>`)
    : `<div class="card"><div class="mini">Tidak ada praktik yang cocok dengan saringan ini.
        ${semua.length} record lain tetap ada dan tidak terhapus.</div></div>`;

  return saring + angka + papan + knLuar('PRK', rows, PRK_ST);
}

if(typeof KN_VIEW !== 'undefined') KN_VIEW.prk = d7View;
