/* ============ DUMMY DATA CONTROL — HIDE · SOFT DELETE · RESTORE ============
   Hanya menyentuh record yang dibuat sistem ini (is_dummy = true).
   Tidak pernah menyentuh folder atau berkas asli di Google Drive. */

let DUMMY_MODE = 'show';   /* show | hidden | deleted */
try{ const s=localStorage.getItem('ajios-dummy'); if(s) DUMMY_MODE=s; }catch(e){}

const dummyOn = () => DUMMY_MODE==='show';
const dummyLabel = () => DUMMY_MODE==='show' ? 'Ditampilkan' : DUMMY_MODE==='hidden' ? 'Disembunyikan' : 'Dihapus (soft delete)';

function setDummyMode(m, quiet){
  DUMMY_MODE=m;
  try{ localStorage.setItem('ajios-dummy',m); }catch(e){}
  DB.dummyBatches.forEach(b=> b.st = m==='show'?'ACTIVE' : m==='hidden'?'HIDDEN' : 'ARCHIVED');
  if(!quiet){
    toast(m==='show' ? 'Data contoh ditampilkan kembali'
      : m==='hidden' ? 'Data contoh disembunyikan — sistem siap untuk entri data'
      : 'Data contoh dihapus (soft delete) — is_archived = true, masih bisa dipulihkan');
  }
  go(CUR);
}

/* Banner tetap di atas layar selama data contoh tidak ditampilkan */
function dummyStateBar(){
  if(DUMMY_MODE==='show') return '';
  const del = DUMMY_MODE==='deleted';
  return `<div class="statebar ${del?'del':''}">
    <span class="dbadge" style="background:${del?'var(--red)':'var(--blue)'}">${del?'SOFT DELETED':'MODE ENTRI DATA'}</span>
    <div style="flex:1;min-width:220px">
      <b>${del?'Data contoh dihapus.':'Data contoh disembunyikan.'}</b>
      ${del?'Record ditandai <code>is_archived = true</code> — tidak hilang, masih bisa dipulihkan.'
           :'Sistem siap menerima data asli. Struktur, modul, dan template tetap utuh.'}
      Folder dan berkas asli di Google Drive tidak tersentuh.
    </div>
    <button class="btn ghost sm" onclick="setDummyMode('show')">${ic('arrow')} Pulihkan data contoh</button>
    <button class="btn gold sm" onclick="go('foundation');fTab='dummy';go('foundation')">Kelola →</button>
  </div>`;
}

/* Empty state per modul — bukan layar kosong, tapi undangan entri */
function emptyModule(id, mod, what, batch, icon, color){
  const del = DUMMY_MODE==='deleted';
  return `
  <div class="page-h">
    <div><h1>${mod}</h1><p>Modul siap. Belum ada data — silakan mulai entri.</p></div>
    <div class="sp"><span class="pill ${del?'red':'blue'}">${del?'DUMMY SOFT DELETED':'DUMMY HIDDEN'}</span></div>
  </div>
  ${dummyStateBar()}
  <div class="card" style="text-align:center;padding:52px 26px">
    <div style="width:66px;height:66px;border-radius:20px;background:${CT(color)};color:${CV(color)};display:grid;place-items:center;margin:0 auto 18px">
      <span style="display:block;width:30px;height:30px">${ic(icon)}</span></div>
    <h2 style="font-family:var(--fd);font-size:25px;font-weight:600;margin:0 0 8px">Belum ada ${what}</h2>
    <p class="sub" style="max-width:460px;margin:0 auto 22px">Data contoh untuk modul ini ${del?'sudah dihapus':'sedang disembunyikan'} (batch <code style="background:var(--surface-2);padding:1px 5px;border-radius:5px">${batch}</code>).
      Tambahkan entri pertama Anda, atau isi lewat template di Google Drive lalu impor.</p>
    <div style="display:flex;gap:9px;justify-content:center;flex-wrap:wrap">
      <button class="btn solid" onclick="openCreate()">${ic('plus')} Tambah ${what} pertama</button>
      <button class="btn gold" onclick="toast('Template entri ada di folder Drive modul ini — isi, lalu impor lewat 90 IMPORT STAGING')">${ic('doc')} Buka template Drive</button>
      <button class="btn ghost" onclick="setDummyMode('show')">Lihat contoh dulu</button>
    </div>
  </div>
  <div class="g g3" style="margin-top:18px">
    <div class="card">${cardH('layers','Struktur siap','green')}
      <p class="sub">Modul, entity, ID global, metadata universal, dan privacy level untuk ${mod} sudah terdefinisi. Yang kosong hanya isinya.</p></div>
    <div class="card">${cardH('doc','Template Drive','gold')}
      <p class="sub">Template entri tersedia di folder modul ini dengan kolom yang sudah cocok dengan Data Dictionary.</p></div>
    <div class="card">${cardH('shield','Data asli aman','red')}
      <p class="sub">Menyembunyikan atau menghapus data contoh tidak pernah menyentuh folder, berkas, atau sistem asli di Drive.</p></div>
  </div>`;
}

/* Terapkan ke modul yang seluruh isinya data contoh */
const DUMMY_MODULES = {
  myday:      ['My Day','agenda & prioritas','DUMMY-2026-08-25-007','sun','blue'],
  wellbeing:  ['Wellbeing','catatan check-in','DUMMY-2026-08-25-003','heart','green'],
  family:     ['Family','anggota keluarga','DUMMY-2026-08-25-002','users','pink'],
  network:    ['Network','kontak','DUMMY-2026-08-25-001','net','teal'],
  social:     ['Social Movement','gerakan','DUMMY-2026-08-25-005','globe','orange'],
  travel:     ['Travel','perjalanan','DUMMY-2026-08-25-004','plane','blue'],
  brand:      ['Branding & CRM','konten','DUMMY-2026-08-25-006','mega','pink'],
  projects:   ['Projects','proyek','DUMMY-2026-08-25-009','layers','purple']
};
Object.keys(DUMMY_MODULES).forEach(k=>{
  const orig = VIEWS[k];
  VIEWS[k] = () => dummyOn() ? orig() : emptyModule(k, ...DUMMY_MODULES[k]);
});

/* Modul campuran — sisipkan banner status di atas */
['dashboard','knowledge','operations','business','finance','os','ai'].forEach(k=>{
  const orig = VIEWS[k];
  VIEWS[k] = () => dummyOn() ? orig() : dummyStateBar() + orig();
});

/* Panel kontrol — dipakai di System Foundation */
function dummyControl(){
  const tot=DB.dummyBatches.reduce((s,b)=>s+b.recs,0);
  return `
  <div class="card" style="margin-bottom:18px">${cardH('cog','Kontrol Data Contoh','blue',`<span class="pill ${DUMMY_MODE==='show'?'orange':DUMMY_MODE==='hidden'?'blue':'red'}">${dummyLabel()}</span>`)}
    <p class="sub" style="margin-bottom:16px">Satu saklar untuk seluruh ${tot} record contoh di ${DB.dummyBatches.length} modul. Pilihan ini tersimpan dan bertahan saat halaman dibuka ulang.</p>
    <div class="g g3" style="gap:12px;margin:0">
      ${[['show','Tampilkan','Data contoh terlihat. Berguna untuk demo, pelatihan tim, dan menguji tampilan.','orange','check'],
         ['hidden','Sembunyikan','Modul jadi kosong dan siap entri data asli. Record tetap tersimpan dan bisa dipulihkan kapan saja.','blue','shield'],
         ['deleted','Hapus (soft delete)','Record ditandai is_archived = true dan hilang dari seluruh tampilan. Masih bisa dipulihkan.','red','flag']].map(o=>`
        <div class="card click" style="padding:15px;${DUMMY_MODE===o[0]?`border-color:${CV(o[3])};background:${CT(o[3])}`:''}"
             onclick="${o[0]==='deleted'?'deleteDummyFlow()':`setDummyMode('${o[0]}')`}">
          <div class="flexr" style="gap:9px;margin-bottom:7px">
            <div class="ic" style="width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:${CT(o[3])};color:${CV(o[3])};flex:0 0 30px">${ic(o[4])}</div>
            <b style="font-size:14px">${o[1]}</b>
            ${DUMMY_MODE===o[0]?`<span class="pill ${o[3]}" style="margin-left:auto">Aktif</span>`:''}</div>
          <p class="sub" style="margin:0;font-size:12px">${o[2]}</p></div>`).join('')}
    </div>
    <div class="card-f">
      <div class="rows">
        <div class="row-i" style="cursor:default;align-items:flex-start">${ic('shield','')}<span><span class="t" style="font-size:12.5px">Yang tidak pernah tersentuh</span><span class="s">Folder dan berkas asli di Google Drive · seluruh sistem Care Estate · Data Source Registry · konfigurasi sistem · struktur modul dan template</span></span></div>
        <div class="row-i" style="cursor:default;align-items:flex-start">${ic('check','')}<span><span class="t" style="font-size:12.5px">Yang terpengaruh</span><span class="s">Hanya record bertanda <code>is_dummy = true</code> yang dibuat sistem ini</span></span></div>
      </div>
    </div>
  </div>`;
}

