/* ================================================================
   PHASE 1 — LOCK RECORD
   Catatan penguncian yang hidup di dalam sistem, bukan hanya di dokumen.
   Setelah dikunci, perubahan pada cakupan ini butuh alasan tertulis.
   ================================================================ */
const PHASE1 = {
  locked: true,
  lockedOn: '2026-08-28',
  lockedBy: 'Aji Jaens',
  version: 'v1.0 — PHASE 1 LOCKED',
  entities: 22, modules: 15, suites: 10, checks: 259, sources: 17,
  scope: [
    ['Master System Architecture', 'ID global PREFIX-000001, metadata universal, 9 tingkat privasi, klasifikasi data, Global Inbox, System Foundation'],
    ['Google Drive Data Foundation', '20 folder, 12 artefak governance, 10 template entri — semuanya di dalam folder AJI JAENS OS'],
    ['Form Entry Engine', '22 entitas dengan form, validasi wajib-isi, relasi antar entitas, arsip dan pemulihan, ekspor CSV'],
    ['Impor dua arah', 'Tempel dari Google Sheets, cocokkan kolom, pratinjau per baris, kolom id memperbarui record lama tanpa duplikat'],
    ['Kontrol data contoh', 'Tiga keadaan: tampilkan, sembunyikan, hapus lunak — dengan gerbang ketik DELETE DUMMY'],
    ['15 modul sidebar', 'Semuanya membaca record asli; tidak ada modul yang tersisa sebagai tampilan contoh saat mode entri data aktif'],
    ['AI Chief of Staff', 'Membaca 17 sumber data, memisahkan FACT dari AI_INFERENCE, menolak mengarang saat data tidak ada']
  ],
  outside: [
    ['Sinkronisasi lintas perangkat', 'Data masih di penyimpanan peramban. Butuh backend — ditunda ke Phase 2 atas keputusan Anda.'],
    ['Penegakan izin di lapisan data', 'Tingkat privasi sudah tersimpan di tiap record, tetapi belum ditegakkan di API. Pack menuntut ini di lapisan basis data, bukan hanya UI.'],
    ['Phase 1C sesi 3–6', 'Gaya Komunikasi · Hierarki Goal & Visi · Filosofi Keluarga & Keuangan · Narasi Personal. Empat sesi ini yang akan menggantikan sisa prinsip karangan.'],
    ['Tiga observasi AI', 'OBS-000002, OBS-000003, OBS-000004 menunggu keputusan Simpan / Edit / Abaikan.'],
    ['Integrasi hidup', 'Google Calendar, email, dan pembacaan otomatis Finance Drive belum tersambung — angka keuangan masuk lewat pembacaan manual.']
  ],
  honesty: [
    ['Angka keuangan grup tidak pernah dientri ulang', 'Tetap SOURCE_REFERENCE dari Finance Drive, ditampilkan terpisah dan tidak dijumlahkan dengan catatan pribadi.'],
    ['AI memisahkan fakta dari tafsiran', 'FACT dihitung dari record; AI_INFERENCE ditandai sebagai kesimpulan yang boleh Anda tolak.'],
    ['Tidak menyimpulkan kesehatan', 'Angka energi dilaporkan kembali apa adanya, tanpa ditafsirkan menjadi kesimpulan medis.'],
    ['Tidak menebak dampak sosial', 'Gerakan tanpa angka penerima manfaat ditandai kosong, bukan diisi perkiraan.'],
    ['Progres proyek dihitung, bukan diketik', 'Bila belum ada tugas, sistem menyatakan angkanya diisi manual.'],
    ['Prinsip karangan ditandai', 'Prinsip dan aturan keputusan yang saya tulis sendiri dinyatakan sebagai karangan saya di modul Operating System.']
  ],
  governance: [
    ['Drive asli tidak tersentuh', 'Tidak ada berkas atau folder lama yang dipindah, diubah nama, dihapus, disunting, atau diberi subfolder.'],
    ['Care Estate dilindungi', 'Seluruh hal terkait Care Estate tidak disentuh sama sekali — terdaftar sebagai SRC-000008 PROTECTED.'],
    ['Semua artefak baru di dalam AJI JAENS OS', '20 folder, dokumen governance, dan template hanya dibuat di dalam folder itu.'],
    ['Dokumen lama diarsipkan, bukan dihapus', 'Core Intelligence Registry v1 dipindah ke folder 99 — OS ARCHIVE saat digantikan v2.'],
    ['Hapus dummy bergerbang', 'Hanya record is_dummy = true, lewat dialog peringatan dan ketikan DELETE DUMMY, dan berupa hapus lunak yang bisa dipulihkan.']
  ]
};

const PHASE2 = {
  locked: true,
  lockedOn: '2026-08-28',
  lockedBy: 'Aji Jaens',
  version: 'v2.0 — PHASE 2 LOCKED',
  boards: 6, suites: 13, checks: 347, entities: 22,
  scope: [
    ['Tautan balik universal', 'Setiap record memperlihatkan apa yang ditunjuknya dan apa saja yang menunjuknya. Peta relasi dibaca otomatis dari skema, bukan ditulis manual.'],
    ['Linimasa per record', 'Riwayat tiap record: dibuat, diubah, digeser, ditandai selesai — beserta kolom apa yang berubah, dari nilai apa ke nilai apa.'],
    ['Pemeriksa keutuhan tautan', 'Memindai tautan putus, salah tipe, dan yang menunjuk record arsip. Mengosongkan tautan tidak pernah menghapus record.'],
    ['Papan geser di enam tempat', 'Tugas, milestone, proyek, pipeline konten, isu operasional, keputusan — menggeser kartu mengubah status dan tercatat di linimasa.'],
    ['Tiga jalur memakai papan', 'Tetikus, sentuh dengan tahan-dulu, dan papan ketik penuh (Enter mengangkat, panah memilih kolom, Esc batal) — ditambah tombol pindah di tiap kartu.'],
    ['Urungkan geseran', 'Bilah Urungkan selama delapan detik; pengurungannya ikut tercatat, tidak menghapus jejak.']
  ],
  outside: [
    ['Urutan kartu di dalam kolom', 'Sengaja tidak disimpan. Urutan mengikuti prioritas dan tenggat supaya tetap punya arti, bukan hasil kebetulan geseran.'],
    ['Hierarki Goal', 'Memindahkan anak-goal ke induk lain adalah gerakan berbeda dari memindahkan status; dirancang tersendiri, bukan ditempelkan ke papan ini.'],
    ['Papan untuk Interaksi CRM', 'Entitas Interaksi tidak punya kolom status. Memaksakan papan berarti mengarang tahapan yang tidak ada di kenyataan.'],
    ['Sinkronisasi lintas perangkat', 'Data masih di penyimpanan peramban. Ini isi Phase 3, dan tempat tinggal datanya keputusan Anda.']
  ],
  honesty: [
    ['Geseran tidak mengarang tanggal', 'Digeser ke Selesai mengisi tanggal selesai; digeser keluar membersihkannya kembali, tidak meninggalkan angka yang tidak benar.'],
    ['Record lama tidak diberi riwayat palsu', 'Record yang dibuat sebelum linimasa dipasang dinyatakan tidak punya catatan mundur, bukan diisi tebakan.'],
    ['Papan tidak menyentuh data contoh', 'Kartu di papan hanya record asli; data contoh tidak pernah ikut bergeser.'],
    ['Bug lama dinyatakan, bukan disembunyikan', 'Kolom isian bernama "type" pada Unit Bisnis, Organisasi, dan Acara ternyata menimpa kode entitas sejak Phase 1. Diperbaiki lewat awalan ID dan diberi uji regresi sendiri.']
  ],
  governance: [
    ['Drive asli tetap tidak tersentuh', 'Tidak ada berkas atau folder lama yang dipindah, diubah, atau diberi subfolder selama Phase 2.'],
    ['Peta jalan ditulis ke luar aplikasi', 'Dokumen PETA JALAN 5 FASE disimpan di folder 00 — SYSTEM & GOVERNANCE supaya kesepakatan tidak hanya hidup di percakapan.'],
    ['Phase 1 tidak dibuka untuk Phase 2', 'Seluruh pekerjaan Phase 2 berdiri di atas Phase 1 tanpa mengubah cakupan yang dikunci.']
  ]
};
const PHASES = { 1: PHASE1, 2: PHASE2 };

/* ================================================================
   RIWAYAT KUNCI — mencatat penguncian DAN pembukaan kembali
   Kunci ini kesepakatan kerja, bukan kunci teknis. Yang dijaga bukan
   aksesnya, melainkan alasannya: setiap pembukaan wajib menyebut sebab.
   ================================================================ */
const LOCK_KEY = 'ajios-lock';
let LOCKLOG = [];
try{ const s = localStorage.getItem(LOCK_KEY); if(s) LOCKLOG = JSON.parse(s) || []; }catch(e){}
if(!Array.isArray(LOCKLOG)) LOCKLOG = [];
/* Baris lama tanpa penanda fase berarti Phase 1 — riwayat lama tidak ditulis ulang. */
LOCKLOG.forEach(e => { if(!e.phase) e.phase = 1; });
function seedLock(p, area, reason){
  if(LOCKLOG.some(e => e.phase === p)) return;
  LOCKLOG.push({ act:'LOCK', phase:p, at: PHASES[p].lockedOn + 'T00:00:00.000Z', by: PHASES[p].lockedBy, area, reason });
}
seedLock(1, 'Seluruh cakupan Phase 1',
  'Phase 1 dinyatakan selesai: 15 modul, 22 entitas, 259 pemeriksaan lolos. Dikunci sesuai Master Transfer Pack — fase berikutnya tidak dijalankan sebelum fase berjalan ditinjau dan dikunci.');
seedLock(2, 'Seluruh cakupan Phase 2',
  'Phase 2 dinyatakan selesai: tautan balik universal, linimasa per record, pemeriksa keutuhan tautan, dan papan geser di enam tempat. 13 rangkaian uji, 347 pemeriksaan lolos.');
function saveLockLog(){ try{ localStorage.setItem(LOCK_KEY, JSON.stringify(LOCKLOG)); }catch(e){} }
const lockEntries = p => LOCKLOG.filter(x => (x.phase || 1) === (p || 1));
function lockState(p){
  const rows = lockEntries(p || 1);
  const last = rows[rows.length - 1];
  if(!last) return { last:null, locked:true, opens:0, since:0 };
  return { last, locked: last.act !== 'UNLOCK',
    opens: rows.filter(x => x.act === 'UNLOCK').length,
    since: daysBetween(String(last.at).slice(0,10), todayISO()) };
}
const LOCK_LABEL = { LOCK:'DIKUNCI', UNLOCK:'DIBUKA KEMBALI', RELOCK:'DIKUNCI ULANG' };
const LOCK_COLOR = { LOCK:'purple', UNLOCK:'orange', RELOCK:'green' };

/* --- membuka kembali --- */
function openLockFlow(ph){
  const P = ph || 1;
  const areas = PHASES[P].scope.map(s => s[0]).concat(['Beberapa bagian sekaligus','Lainnya — dijelaskan di alasan']);
  modal('Buka kembali kunci Phase ' + P, 'Kuncinya kesepakatan kerja, bukan kunci teknis — tidak ada yang perlu dipaksa.',
    `<div class="statebar" style="margin:0 0 16px">
       <span class="dbadge" style="background:var(--blue)">YANG TIDAK BERUBAH</span>
       <div style="flex:1;min-width:220px">Catatan penguncian ${dOnly(PHASES[P].lockedOn)} <b>tetap berdiri</b> dan tidak terhapus.
         Pembukaan ini ditambahkan sebagai baris baru di riwayat, sehingga nanti terlihat: dikunci kapan, dibuka kapan, karena apa.</div>
     </div>
     <p class="sub" style="margin-bottom:14px">Anda tidak perlu membuka kunci untuk: entri data, impor, memperbaiki bug, menjalankan Phase 1C, atau memutuskan observasi AI —
       semuanya sudah berada di luar kunci. Formulir ini untuk perubahan pada <b>cakupan yang dikunci</b>.</p>
     <div class="frm">
       <input type="hidden" id="lkPhase" value="${P}">
       <div class="fld full"><label>Bagian mana yang dibuka<i>*</i></label>
         <select id="lkArea">${areas.map(a => `<option value="${h(a)}">${h(a)}</option>`).join('')}</select></div>
       <div class="fld full"><label>Kenapa perlu dibuka<i>*</i></label>
         <textarea id="lkReason" placeholder="Apa yang mendorong perubahan ini? Sebutkan sekonkret mungkin — enam bulan lagi kalimat ini yang menjawab &quot;kenapa dulu diubah&quot;."></textarea>
         <span class="fhint">Minimal satu kalimat utuh. Sistem menolak alasan yang terlalu pendek — bukan untuk mempersulit, tapi supaya catatannya berguna.</span></div>
       <div class="fld full"><label>Yang akan diubah</label>
         <textarea id="lkPlan" placeholder="Opsional — perkiraan perubahannya apa saja."></textarea></div>
     </div>`,
    `<button class="btn red" onclick="doUnlock()">${ic('arrow')} Catat pembukaan</button>
     <button class="btn ghost" onclick="closeModal()">Batal</button>`, true);
}
function doUnlock(){
  const P = Number((document.getElementById('lkPhase') || {}).value || 1);
  const area = document.getElementById('lkArea').value;
  const reason = (document.getElementById('lkReason').value || '').trim();
  const plan = (document.getElementById('lkPlan').value || '').trim();
  if(reason.length < 15){ toast('Alasannya masih terlalu pendek — tulis satu kalimat utuh'); return; }
  LOCKLOG.push({ act:'UNLOCK', phase:P, at:new Date().toISOString(), by:DB.owner.name, area, reason, plan });
  saveLockLog(); closeModal();
  toast('Kunci dibuka dan dicatat — catatan penguncian lama tetap berdiri');
  go(CUR);
}

/* --- mengunci kembali --- */
function relockFlow(ph){
  const P = ph || 1;
  const s = lockState(P);
  modal('Kunci kembali Phase ' + P, 'Dibuka ' + s.since + ' hari lalu untuk: ' + h(s.last.area || '—'),
    `<div class="card" style="padding:14px;margin-bottom:16px;background:var(--orange-t)">
       <div class="mini" style="margin-bottom:4px">Alasan pembukaan waktu itu</div>
       <div style="font-size:13px">${h(s.last.reason || '—')}</div>
       ${s.last.plan ? `<div class="mini" style="margin-top:8px">Rencana perubahan: ${h(s.last.plan)}</div>` : ''}
     </div>
     <div class="frm">
       <input type="hidden" id="lkPhase" value="${P}">
       <div class="fld full"><label>Apa yang benar-benar berubah<i>*</i></label>
         <textarea id="lkDone" placeholder="Tulis hasil nyatanya — termasuk bila ternyata tidak jadi diubah."></textarea>
         <span class="fhint">Ini yang membuat riwayat berguna: bukan hanya niatnya, tapi hasilnya.</span></div>
     </div>`,
    `<button class="btn solid" onclick="doRelock()">${ic('shield')} Kunci kembali</button>
     <button class="btn ghost" onclick="closeModal()">Batal</button>`, true);
}
function doRelock(){
  const P = Number((document.getElementById('lkPhase') || {}).value || 1);
  const done = (document.getElementById('lkDone').value || '').trim();
  if(done.length < 10){ toast('Tulis dulu apa yang berubah selama kunci dibuka'); return; }
  LOCKLOG.push({ act:'RELOCK', phase:P, at:new Date().toISOString(), by:DB.owner.name, area: lockState(P).last.area, reason: done });
  saveLockLog(); closeModal();
  toast('Phase ' + P + ' dikunci kembali — riwayatnya lengkap');
  go(CUR);
}

/* Perbarui papan fase supaya statusnya jujur */
if(typeof DB !== 'undefined' && DB.phases){
  DB.phases.unshift({ p:'PHASE 1', m:'Terkunci ' + PHASE1.lockedOn + ' — 15 modul, ' + PHASE1.entities + ' entitas, ' + PHASE1.checks + ' pemeriksaan lolos', st:'LOCKED', c:'purple' });
  const c = DB.phases.find(x => x.p === '1C');
  if(c){ c.m = 'Aji Core Intelligence — 2 dari 6 sesi selesai; sesi 3–6 di luar kunci Phase 1'; c.st = 'Berjalan'; c.c = 'orange'; }
  DB.phases.push({ p:'PHASE 2', m:'Terkunci ' + PHASE2.lockedOn + ' — tautan balik, linimasa per record, ' + PHASE2.boards + ' papan geser, ' + PHASE2.checks + ' pemeriksaan lolos', st:'LOCKED', c:'purple' });
  DB.phases.push({ p:'PHASE 3', m:'Backend, sinkronisasi lintas perangkat, penegakan izin di lapisan data — menunggu keputusan tempat tinggal data', st:'Menunggu', c:'gray' });
}

/* Tab baru di System Foundation */
if(typeof F_TABS !== 'undefined') F_TABS.push(['lock','Kunci Fase']);

F_VIEW.lock = () => {
  const sec = (icn, color, title, rows, note) => `
    <div class="card" style="margin-bottom:18px">
      ${cardH(icn, title, color, `<span class="cnt">${rows.length}</span>`)}
      <div class="rows">${rows.map(r => `
        <div class="row-i" style="cursor:default;align-items:flex-start">
          <span style="width:3px;align-self:stretch;border-radius:3px;background:${CV(color)};flex:0 0 3px"></span>
          <span style="min-width:0;flex:1"><span class="t" style="font-size:13px">${h(r[0])}</span>
            <span class="s">${h(r[1])}</span></span>
          <span class="rt"><span class="pill gray">P${r[2]}</span></span></div>`).join('')}</div>
      ${note ? `<div class="card-f"><span class="mini">${note}</span></div>` : ''}
    </div>`;
  const phaseCard = P => {
    const D = PHASES[P], st = lockState(P), C = st.locked ? 'purple' : 'orange';
    const kpi = P === 1
      ? [['Modul sidebar', D.modules], ['Entitas terdaftar', D.entities], ['Sumber dibaca AI', D.sources], ['Pemeriksaan lolos', D.checks]]
      : [['Papan geser', D.boards], ['Entitas tertaut', D.entities], ['Rangkaian uji', D.suites], ['Pemeriksaan lolos', D.checks]];
    return `
    <div class="card" style="margin-bottom:18px;border-color:${CV(C)};background:linear-gradient(150deg,${CT(C)},var(--surface))">
      <div class="flexr" style="gap:12px;margin-bottom:10px">
        <div class="ic" style="width:42px;height:42px;border-radius:13px;display:grid;place-items:center;flex:0 0 42px;background:${CV(C)};color:#fff">${ic(st.locked ? 'shield' : 'arrow')}</div>
        <div style="flex:1;min-width:200px">
          <div class="mini" style="font-weight:800;letter-spacing:1px">CATATAN PENGUNCIAN</div>
          <h2 style="font-family:var(--fd);font-size:25px;font-weight:600;margin:2px 0 0">Phase ${P} — ${st.locked ? 'TERKUNCI' : 'DIBUKA KEMBALI'}</h2>
        </div>
        <span class="pill ${C}">${h(D.version)}</span>
        ${st.locked ? `<button class="btn ghost sm" onclick="openLockFlow(${P})">Buka kembali</button>`
                    : `<button class="btn solid sm" onclick="relockFlow(${P})">${ic('shield')} Kunci kembali</button>`}
      </div>
      <p class="sub" style="margin:0 0 14px">Dikunci ${dOnly(D.lockedOn)} oleh ${h(D.lockedBy)}.
        ${st.locked
          ? (st.opens ? `Pernah dibuka kembali ${st.opens} kali — riwayatnya di bawah.`
                      : 'Belum pernah dibuka kembali sejak tanggal itu.')
          : `<b style="color:var(--orange)">Sedang dibuka sejak ${st.since} hari lalu</b> untuk: ${h(st.last.area || '—')}.`}
        Sesuai Master Transfer Pack: fase berikutnya tidak dijalankan sebelum fase berjalan ditinjau dan dikunci.</p>
      <div class="g g4" style="gap:12px;margin:0">
        ${kpi.map(x => `
          <div class="card" style="padding:13px"><div class="mini">${x[0]}</div>
            <b style="font-family:var(--fd);font-size:22px">${x[1]}</b></div>`).join('')}
      </div>
    </div>`;
  };
  const tag = (P, k) => PHASES[P][k].map(r => [r[0], r[1], P]);
  const both = k => tag(1, k).concat(tag(2, k));
  const st = lockState(1);
  return phaseCard(1) + phaseCard(2) + `

  ${sec('check','green','Yang termasuk di dalam kunci', both('scope'),
    'Perubahan pada cakupan ini setelah tanggal kunci sebaiknya dicatat sebagai keputusan di Operating System, supaya alasannya bisa ditinjau kemudian.')}

  ${sec('shield','red','Yang sengaja berada di luar kunci', both('outside'),
    'Daftar ini ditulis supaya tidak ada yang mengira kunci mencakupnya. Semuanya masuk antrean fase berikutnya atau menunggu keputusan Anda.')}

  ${sec('scale','blue','Batas kejujuran yang dipasang permanen', both('honesty'),
    'Aturan-aturan ini tertanam di dalam tampilan, bukan hanya di dokumen — sistem menyatakannya sendiri di halaman yang bersangkutan.')}

  ${sec('flag','gold','Kepatuhan pada aturan Master Transfer Pack', both('governance'),
    'Aturan pusat: COPY — NEVER MOVE. Drive lama adalah sumber baca saja.')}

  <div class="card" style="margin-bottom:18px">
    ${cardH('clock','Riwayat kunci','blue',`<span class="cnt">${LOCKLOG.length}</span>`)}
    <p class="sub" style="margin-bottom:12px">Dua arah: penguncian <b>dan</b> pembukaan. Baris lama tidak pernah dihapus atau ditimpa —
      itulah gunanya, supaya terlihat apa yang berubah dan karena apa.</p>
    <div class="tl">${LOCKLOG.slice().reverse().map(e => `
      <div class="tl-i" style="cursor:default">
        <span class="tm">${dOnly(String(e.at).slice(0,10)).slice(0,6)}</span>
        <span class="bar" style="background:${CV(LOCK_COLOR[e.act] || 'gray')}"></span>
        <span class="bd"><b>${LOCK_LABEL[e.act] || e.act}${e.area ? ' — ' + h(e.area) : ''}</b>
          <span>${dtID(e.at)} · ${h(e.by || '—')}</span>
          <span style="display:block;margin-top:4px;color:var(--text-2);font-size:12.5px">${h(e.reason || '')}</span>
          ${e.plan ? `<span style="display:block;margin-top:3px;font-size:11.5px;color:var(--text-3)">Rencana: ${h(e.plan)}</span>` : ''}
        </span>
      </div>`).join('')}</div>
    <div class="card-f"><span class="mini">Riwayat ini tersimpan di peramban ini bersama data Anda. Ekspor CSV berkala tetap disarankan sampai sinkronisasi tersedia.</span></div>
  </div>

  <div class="statebar" style="margin:0">
    <span class="dbadge" style="background:var(--purple)">SETELAH KUNCI</span>
    <div style="flex:1;min-width:240px">Yang paling berguna sekarang bukan modul baru, melainkan pemakaian nyata:
      isi data seminggu, geser kartu yang benar-benar bergerak, catat apa yang terasa salah — perbaikan itu yang dikerjakan lebih dulu.
      Phase 3 menunggu satu keputusan Anda: di mana data ini akan tinggal. Ketik <b>NEXT FASE</b> bila sudah diputuskan.</div>
  </div>`;
};

/* Penanda kunci di kepala halaman System Foundation */
const _foundationBase = VIEWS.foundation;
VIEWS.foundation = () => {
  const s1 = lockState(1), s2 = lockState(2);
  const pill = (P, st, D) => `<span class="pill ${st.locked ? 'purple' : 'orange'}">PHASE ${P} · ${st.locked ? 'TERKUNCI ' + dOnly(D.lockedOn) : 'DIBUKA KEMBALI'}</span>`;
  return _foundationBase().replace('<span class="pill purple">PHASE 1 · CORE FOUNDATION</span>',
    pill(1, s1, PHASE1) + ' ' + pill(2, s2, PHASE2));
};

