/* ================================================================
   FORM ENTRY ENGINE — entri, ubah, arsip, pulihkan, ekspor
   Semua record buatan pengguna: is_dummy = false, source_type = MANUAL_ENTRY.
   Disimpan di penyimpanan browser (localStorage) — bertahan saat halaman dibuka ulang.
   Tidak pernah menyentuh folder atau berkas asli di Google Drive.
   ================================================================ */

const STORE_KEY = 'ajios-data';
let STORE = { v:1, seq:{}, rec:{}, log:[] };
try{
  const s = localStorage.getItem(STORE_KEY);
  if(s){ const o = JSON.parse(s); if(o && o.rec){ STORE = Object.assign({v:1,seq:{},rec:{},log:[]}, o); } }
}catch(e){}
function saveStore(){
  try{ localStorage.setItem(STORE_KEY, JSON.stringify(STORE)); return true; }
  catch(e){ toast('Penyimpanan browser penuh — ekspor CSV lalu arsipkan record lama'); return false; }
}
const allRecs = t => STORE.rec[t] || [];
const recs    = t => allRecs(t).filter(r => !r._m.is_archived);
const arcRecs = t => allRecs(t).filter(r =>  r._m.is_archived);
const recById = id => { const t = String(id).split('-')[0]; return allRecs(t).find(r => r.id === id); };
/* Kode entitas selalu dibaca dari awalan ID, bukan dari properti .type.
   Sebagian entitas (Unit Bisnis, Organisasi, Acara) punya kolom isian
   bernama "type" sendiri — "Jenis usaha", "Jenis" — yang akan menimpa
   kode entitas kalau dibaca langsung. Awalan ID tidak pernah bisa tertimpa. */
const typeOf = r => (r && r.id) ? String(r.id).split('-')[0] : '';
function nextId(t){ STORE.seq[t] = (STORE.seq[t]||0) + 1; return t + '-' + String(STORE.seq[t]).padStart(6,'0'); }
function logAct(act, r, note, changes){
  const T = typeOf(r);
  const e = { ts:new Date().toISOString(), act, id:r.id, type:T, label:SCHEMA[T]?SCHEMA[T].t(r):'', note:note||'' };
  if(changes && changes.length) e.ch = changes;
  STORE.log.unshift(e);
  if(STORE.log.length > 600) STORE.log.length = 600;
}
/* Bandingkan record sebelum dan sesudah — dipakai linimasa per record */
function diffRec(before, after, type){
  const S = SCHEMA[type]; if(!S) return [];
  const out = [];
  S.f.filter(x => !x.g).forEach(x => {
    const a = before[x.k] === undefined ? '' : String(before[x.k]);
    const b = after[x.k]  === undefined ? '' : String(after[x.k]);
    if(a !== b) out.push({ k:x.k, l:x.l, from:a, to:b });
  });
  if(before._priv !== undefined && before._priv !== after._priv)
    out.push({ k:'_priv', l:'Tingkat privasi', from:before._priv, to:after._priv });
  return out;
}
const dtID = iso => { try{ const d=new Date(iso); return d.toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}) + ' · ' + d.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}); }catch(e){ return iso; } };
const dOnly = v => { if(!v) return '—'; try{ return new Date(v+'T00:00:00').toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}); }catch(e){ return v; } };

/* ---------------- PILIHAN BERULANG ---------------- */
const PRIV = ['PRIVATE','AJI_ONLY','AJI_AND_SPOUSE','FAMILY','EXECUTIVE','BUSINESS_UNIT','TEAM','PUBLIC'];
const ST_TASK = ['Belum mulai','Sedang dikerjakan','Menunggu orang lain','Selesai','Dibatalkan'];
const ST_PROJ = ['Perencanaan','Berjalan','Tertahan','Selesai','Dibatalkan'];

/* ---------------- SKEMA ENTITAS ----------------
   f: daftar field. {g:'Judul grup'} = pemisah grup.
   t: text | textarea | sel | date | time | num | tel | email | url | rel     */
const SCHEMA = {

  LOG:{ n:'Catatan Harian', ic:'sun', c:'blue', mod:'myday', priv:'AJI_ONLY',
    d:'Check-in harian — energi, fokus, kemenangan, hambatan.',
    t:r=>'Check-in ' + dOnly(r.date), s:r=>'Energi ' + (r.energy||'—') + '/10 · Fokus: ' + (r.focus||'—'),
    f:[{g:'Hari ini'},
       {k:'date',l:'Tanggal',t:'date',req:1},
       {k:'energy',l:'Energi (1–10)',t:'num',req:1,ph:'7'},
       {k:'focus',l:'Fokus utama hari ini',t:'text',full:1,ph:'Menutup negosiasi sewa outlet baru'},
       {g:'Refleksi'},
       {k:'win',l:'Kemenangan hari ini',t:'textarea',full:1,ph:'Apa yang berjalan baik?'},
       {k:'block',l:'Hambatan',t:'textarea',full:1,ph:'Apa yang menghambat, dan siapa yang bisa membukanya?'},
       {k:'grateful',l:'Yang disyukuri',t:'text',full:1},
       {k:'tomorrow',l:'Satu hal untuk besok',t:'text',full:1}]},

  TSK:{ n:'Tugas', ic:'check', c:'blue', mod:'projects', priv:'TEAM',
    d:'Satu pekerjaan dengan pemilik dan tenggat.',
    t:r=>r.n, s:r=>[r.status, r.due?'jatuh tempo '+dOnly(r.due):''].filter(Boolean).join(' · '),
    f:[{g:'Tugas'},
       {k:'n',l:'Judul tugas',t:'text',req:1,full:1,ph:'Tinjau kontrak sewa Outlet 4'},
       {k:'pri',l:'Prioritas',t:'sel',opt:['P1 — hari ini','P2 — minggu ini','P3 — nanti'],req:1},
       {k:'status',l:'Status',t:'sel',opt:ST_TASK,req:1},
       {k:'due',l:'Jatuh tempo',t:'date'},
       {k:'est',l:'Perkiraan waktu (menit)',t:'num',ph:'45'},
       {k:'done',l:'Tanggal selesai',t:'date',hint:'Terisi otomatis saat tugas dicentang di My Day.'},
       {g:'Keterkaitan'},
       {k:'proj',l:'Proyek',t:'rel',rel:'PRO'},
       {k:'owner',l:'Penanggung jawab',t:'rel',rel:'PER',hint:'Kosongkan bila Anda sendiri yang mengerjakan.'},
       {k:'note',l:'Catatan',t:'textarea',full:1}]},

  MTG:{ n:'Meeting', ic:'clock', c:'purple', mod:'myday', priv:'EXECUTIVE',
    d:'Pertemuan dengan agenda dan hasil.',
    t:r=>r.n, s:r=>[dOnly(r.date), r.time, r.loc].filter(Boolean).join(' · '),
    f:[{g:'Jadwal'},
       {k:'n',l:'Judul pertemuan',t:'text',req:1,full:1,ph:'Review bulanan unit F&B'},
       {k:'date',l:'Tanggal',t:'date',req:1},
       {k:'time',l:'Jam',t:'time'},
       {k:'dur',l:'Durasi (menit)',t:'num',ph:'60'},
       {k:'loc',l:'Tempat / tautan',t:'text'},
       {g:'Isi'},
       {k:'att',l:'Peserta',t:'text',full:1,ph:'Nama dipisah koma'},
       {k:'agenda',l:'Agenda',t:'textarea',full:1},
       {k:'outcome',l:'Hasil & tindak lanjut',t:'textarea',full:1,hint:'Diisi setelah pertemuan selesai.'}]},

  PER:{ n:'Kontak', ic:'net', c:'teal', mod:'network', priv:'PRIVATE',
    d:'Orang dalam jaringan Anda, beserta ritme menjaganya.',
    t:r=>r.n, s:r=>[r.pos, r.org].filter(Boolean).join(' · ') || r.cat || '',
    f:[{g:'Identitas'},
       {k:'n',l:'Nama',t:'text',req:1,ph:'Mitra Strategis A'},
       {k:'cat',l:'Kategori',t:'sel',req:1,opt:['Mitra Strategis','Mentor','Klien','Vendor','Tim Internal','Pemerintah','Komunitas','Investor','Teman','Keluarga Besar','Lainnya']},
       {k:'pos',l:'Jabatan',t:'text'},
       {k:'org',l:'Organisasi',t:'text'},
       {k:'city',l:'Kota',t:'text',ph:'Ubud, Bali'},
       {g:'Kontak'},
       {k:'phone',l:'Telepon / WhatsApp',t:'tel'},
       {k:'email',l:'Email',t:'email'},
       {g:'Ritme hubungan'},
       {k:'cadence',l:'Ritme kontak',t:'sel',opt:['Mingguan','Bulanan','Kuartalan','Semester','Tahunan','Sesuai kebutuhan'],hint:'Sistem akan mengingatkan bila lewat dari ritme ini.'},
       {k:'last',l:'Terakhir kontak',t:'date'},
       {k:'value',l:'Apa yang dia butuhkan / bisa saya bantu',t:'textarea',full:1},
       {k:'note',l:'Catatan',t:'textarea',full:1}]},

  ORG:{ n:'Organisasi', ic:'brief', c:'teal', mod:'network', priv:'TEAM',
    d:'Lembaga, perusahaan, atau komunitas dalam jaringan.',
    t:r=>r.n, s:r=>[r.type, r.city].filter(Boolean).join(' · '),
    f:[{k:'n',l:'Nama organisasi',t:'text',req:1,full:1},
       {k:'type',l:'Jenis',t:'sel',opt:['Perusahaan','Pemerintah','Komunitas','Yayasan','Asosiasi','Media','Lainnya']},
       {k:'city',l:'Kota',t:'text'},
       {k:'pic',l:'Kontak utama',t:'rel',rel:'PER'},
       {k:'rel',l:'Hubungan dengan kita',t:'sel',opt:['Mitra','Pemasok','Pelanggan','Regulator','Calon mitra','Belum ada']},
       {k:'note',l:'Catatan',t:'textarea',full:1}]},

  FAM:{ n:'Anggota Keluarga', ic:'users', c:'pink', mod:'family', priv:'FAMILY',
    d:'Anggota keluarga dan hal penting tentang mereka.',
    t:r=>r.n, s:r=>[r.rel, r.dob?'lahir '+dOnly(r.dob):''].filter(Boolean).join(' · '),
    f:[{k:'n',l:'Nama',t:'text',req:1},
       {k:'rel',l:'Hubungan',t:'sel',req:1,opt:['Istri','Suami','Anak','Ayah','Ibu','Saudara','Mertua','Keponakan','Lainnya']},
       {k:'dob',l:'Tanggal lahir',t:'date'},
       {k:'phone',l:'Telepon',t:'tel'},
       {k:'act',l:'Sekolah / pekerjaan',t:'text',full:1},
       {k:'care',l:'Yang sedang dia butuhkan dari saya',t:'textarea',full:1},
       {k:'note',l:'Catatan',t:'textarea',full:1}]},

  EVT:{ n:'Acara', ic:'gift', c:'pink', mod:'family', priv:'FAMILY',
    d:'Ulang tahun, upacara, acara keluarga atau komunitas.',
    t:r=>r.n, s:r=>[dOnly(r.date), r.loc].filter(Boolean).join(' · '),
    f:[{k:'n',l:'Nama acara',t:'text',req:1,full:1},
       {k:'date',l:'Tanggal',t:'date',req:1},
       {k:'time',l:'Jam',t:'time'},
       {k:'type',l:'Jenis',t:'sel',opt:['Ulang tahun','Upacara adat','Keagamaan','Sekolah','Komunitas','Bisnis','Lainnya']},
       {k:'loc',l:'Tempat',t:'text',full:1},
       {k:'repeat',l:'Berulang',t:'sel',opt:['Tidak','Setiap tahun','Setiap bulan']},
       {k:'note',l:'Catatan',t:'textarea',full:1}]},

  BUS:{ n:'Unit Bisnis', ic:'brief', c:'gold', mod:'business', priv:'EXECUTIVE',
    d:'Unit usaha atau outlet — struktur, bukan angka keuangan.',
    t:r=>r.n, s:r=>[r.type, r.city, r.status].filter(Boolean).join(' · '),
    f:[{g:'Identitas unit'},
       {k:'n',l:'Nama unit / outlet',t:'text',req:1},
       {k:'type',l:'Jenis usaha',t:'sel',req:1,opt:['F&B','Laundry','Properti','Retail','Jasa','Wellness','Agrikultur','Lainnya']},
       {k:'city',l:'Lokasi',t:'text'},
       {k:'opened',l:'Mulai beroperasi',t:'date'},
       {k:'status',l:'Status',t:'sel',opt:['Perencanaan','Ramp-up','Beroperasi','Perbaikan','Tutup sementara','Ditutup']},
       {g:'Kepemimpinan'},
       {k:'pic',l:'Penanggung jawab',t:'rel',rel:'PER'},
       {k:'staff',l:'Jumlah tim',t:'num'},
       {k:'note',l:'Catatan',t:'textarea',full:1,hint:'Angka keuangan tidak dientri di sini — sumbernya tetap Finance Drive.'}]},

  PRO:{ n:'Proyek', ic:'layers', c:'purple', mod:'projects', priv:'TEAM',
    d:'Inisiatif dengan tujuan, pemilik, dan tenggat.',
    t:r=>r.n, s:r=>[r.status, r.due?'target '+dOnly(r.due):''].filter(Boolean).join(' · '),
    f:[{g:'Proyek'},
       {k:'n',l:'Nama proyek',t:'text',req:1,full:1},
       {k:'goal',l:'Tujuan — apa yang berubah kalau ini berhasil',t:'textarea',full:1,req:1},
       {k:'status',l:'Status',t:'sel',req:1,opt:ST_PROJ},
       {k:'progress',l:'Progres (%)',t:'num',ph:'0'},
       {k:'start',l:'Mulai',t:'date'},
       {k:'due',l:'Target selesai',t:'date'},
       {g:'Keterkaitan'},
       {k:'owner',l:'Pemilik proyek',t:'rel',rel:'PER'},
       {k:'unit',l:'Unit bisnis terkait',t:'rel',rel:'BUS'},
       {k:'budget',l:'Anggaran (juta Rp)',t:'num'},
       {k:'risk',l:'Risiko utama',t:'textarea',full:1},
       {k:'note',l:'Catatan',t:'textarea',full:1}]},

  KNW:{ n:'Catatan Knowledge', ic:'book', c:'purple', mod:'knowledge', priv:'PRIVATE',
    d:'Pelajaran, ringkasan, atau referensi yang layak diingat.',
    t:r=>r.n, s:r=>[r.cat, r.src].filter(Boolean).join(' · '),
    f:[{g:'Isi'},
       {k:'n',l:'Judul',t:'text',req:1,full:1},
       {k:'cat',l:'Kategori',t:'sel',req:1,opt:['Bisnis','Kepemimpinan','Keuangan','Operasional','Pemasaran','Personal','Spiritual','Kesehatan','Teknologi','Lainnya']},
       {k:'src',l:'Sumber',t:'text',ph:'Buku, orang, pengalaman'},
       {k:'url',l:'Tautan',t:'url'},
       {k:'summary',l:'Ringkasan',t:'textarea',full:1,req:1},
       {k:'lesson',l:'Pelajaran yang saya ambil',t:'textarea',full:1,hint:'Bagian ini yang membuat catatan berguna setahun lagi.'},
       {k:'apply',l:'Di mana ini akan saya pakai',t:'text',full:1},
       {k:'tags',l:'Tag',t:'text',full:1,ph:'dipisah koma'}]},

  DEC:{ n:'Keputusan', ic:'scale', c:'red', mod:'os', priv:'EXECUTIVE',
    d:'Keputusan beserta alasannya — agar bisa dinilai ulang kemudian.',
    t:r=>r.n, s:r=>[dOnly(r.date), r.impact].filter(Boolean).join(' · '),
    f:[{g:'Keputusan'},
       {k:'n',l:'Keputusan apa',t:'text',req:1,full:1},
       {k:'date',l:'Tanggal diputuskan',t:'date',req:1},
       {k:'impact',l:'Bobot',t:'sel',req:1,opt:['Kecil — mudah dibalik','Sedang','Besar — sulit dibalik']},
       {k:'status',l:'Status',t:'sel',opt:['Diputuskan','Dijalankan','Ditinjau ulang','Dibatalkan']},
       {g:'Dasar berpikir'},
       {k:'ctx',l:'Situasi saat itu',t:'textarea',full:1},
       {k:'opts',l:'Pilihan yang dipertimbangkan',t:'textarea',full:1},
       {k:'why',l:'Alasan memilih ini',t:'textarea',full:1,req:1},
       {k:'assume',l:'Asumsi yang harus benar',t:'textarea',full:1,hint:'Kalau asumsi ini runtuh, keputusan perlu ditinjau.'},
       {k:'review',l:'Ditinjau ulang pada',t:'date'},
       {k:'result',l:'Hasil sebenarnya',t:'textarea',full:1,hint:'Diisi saat peninjauan.'}]},

  GOL:{ n:'Goal', ic:'target', c:'gold', mod:'os', priv:'PRIVATE',
    d:'Sasaran dalam hierarki — dari visi panjang sampai target bulan ini.',
    t:r=>r.n, s:r=>[r.horizon, r.target?'target '+r.target:''].filter(Boolean).join(' · '),
    f:[{k:'n',l:'Sasaran',t:'text',req:1,full:1},
       {k:'horizon',l:'Horizon',t:'sel',req:1,opt:['10 tahun','5 tahun','3 tahun','1 tahun','Kuartal ini','Bulan ini']},
       {k:'area',l:'Area hidup',t:'sel',opt:['Bisnis','Keuangan','Keluarga','Kesehatan','Pembelajaran','Kontribusi Sosial','Spiritual']},
       {k:'metric',l:'Ukuran keberhasilan',t:'text',full:1,ph:'Angka atau kondisi yang bisa dicek'},
       {k:'target',l:'Target',t:'text'},
       {k:'due',l:'Tenggat',t:'date'},
       {k:'parent',l:'Bagian dari sasaran',t:'rel',rel:'GOL'},
       {k:'status',l:'Status',t:'sel',opt:['Belum mulai','Berjalan','Di depan target','Tertinggal','Tercapai','Dilepas']},
       {k:'note',l:'Catatan',t:'textarea',full:1}]},

  TRP:{ n:'Perjalanan', ic:'plane', c:'blue', mod:'travel', priv:'PRIVATE',
    d:'Rencana perjalanan beserta tujuan dan biayanya.',
    t:r=>r.n, s:r=>[r.dest, r.start?dOnly(r.start):''].filter(Boolean).join(' · '),
    f:[{k:'n',l:'Nama perjalanan',t:'text',req:1,full:1},
       {k:'dest',l:'Tujuan',t:'text',req:1},
       {k:'purpose',l:'Keperluan',t:'sel',opt:['Bisnis','Keluarga','Belajar','Istirahat','Sosial','Campuran']},
       {k:'start',l:'Berangkat',t:'date'},
       {k:'end',l:'Kembali',t:'date'},
       {k:'budget',l:'Anggaran (juta Rp)',t:'num'},
       {k:'who',l:'Bersama siapa',t:'text',full:1},
       {k:'todo',l:'Yang harus disiapkan',t:'textarea',full:1},
       {k:'note',l:'Catatan',t:'textarea',full:1}]},

  CNT:{ n:'Konten', ic:'mega', c:'pink', mod:'brand', priv:'TEAM',
    d:'Ide sampai tayang, per kanal.',
    t:r=>r.n, s:r=>[r.channel, r.status, r.date?dOnly(r.date):''].filter(Boolean).join(' · '),
    f:[{k:'n',l:'Judul / ide konten',t:'text',req:1,full:1},
       {k:'channel',l:'Kanal',t:'sel',req:1,opt:['Instagram','TikTok','YouTube','LinkedIn','Website','Newsletter','Media','Offline']},
       {k:'pillar',l:'Pilar konten',t:'sel',opt:['Kepemimpinan','Bisnis','Budaya Bali','Keluarga','Sosial','Di balik layar','Edukasi']},
       {k:'status',l:'Status',t:'sel',req:1,opt:['Ide','Draft','Menunggu review','Terjadwal','Tayang','Dibatalkan']},
       {k:'date',l:'Tanggal tayang',t:'date'},
       {k:'owner',l:'Penanggung jawab',t:'rel',rel:'PER'},
       {k:'url',l:'Tautan',t:'url'},
       {k:'brief',l:'Pesan utama',t:'textarea',full:1},
       {k:'note',l:'Catatan',t:'textarea',full:1}]},

  MOV:{ n:'Gerakan Sosial', ic:'globe', c:'orange', mod:'social', priv:'PUBLIC',
    d:'Inisiatif sosial dan dampaknya.',
    t:r=>r.n, s:r=>[r.cause, r.status].filter(Boolean).join(' · '),
    f:[{k:'n',l:'Nama gerakan',t:'text',req:1,full:1},
       {k:'cause',l:'Isu yang diangkat',t:'text',req:1,full:1},
       {k:'start',l:'Mulai',t:'date'},
       {k:'status',l:'Status',t:'sel',opt:['Ide','Persiapan','Berjalan','Selesai','Dihentikan']},
       {k:'ben',l:'Jumlah penerima manfaat',t:'num'},
       {k:'partner',l:'Mitra',t:'text',full:1},
       {k:'impact',l:'Dampak yang diharapkan / tercapai',t:'textarea',full:1},
       {k:'note',l:'Catatan',t:'textarea',full:1}]},

  TXN:{ n:'Catatan Keuangan', ic:'wallet', c:'green', mod:'finance', priv:'AJI_ONLY',
    d:'Catatan pemasukan atau pengeluaran pribadi. Bukan pengganti pembukuan.',
    t:r=>r.n, s:r=>[r.dir, r.amount?'Rp '+r.amount+' Jt':'', dOnly(r.date)].filter(Boolean).join(' · '),
    f:[{k:'n',l:'Keterangan',t:'text',req:1,full:1},
       {k:'date',l:'Tanggal',t:'date',req:1},
       {k:'dir',l:'Arah',t:'sel',req:1,opt:['Masuk','Keluar']},
       {k:'amount',l:'Jumlah (juta Rp)',t:'num',req:1},
       {k:'cat',l:'Kategori',t:'sel',opt:['Operasional','Investasi','Pribadi','Keluarga','Sosial','Pajak','Pinjaman','Lainnya']},
       {k:'unit',l:'Unit terkait',t:'rel',rel:'BUS'},
       {k:'note',l:'Catatan',t:'textarea',full:1,hint:'Angka resmi tetap bersumber dari Finance Drive — ini catatan pribadi.'}]},

  AST:{ n:'Aset', ic:'crown', c:'gold', mod:'finance', priv:'AJI_ONLY',
    d:'Aset yang dimiliki dan nilainya.',
    t:r=>r.n, s:r=>[r.cat, r.value?'Rp '+r.value+' Jt':''].filter(Boolean).join(' · '),
    f:[{k:'n',l:'Nama aset',t:'text',req:1,full:1},
       {k:'cat',l:'Jenis',t:'sel',req:1,opt:['Tanah','Bangunan','Kendaraan','Peralatan','Surat berharga','Kas & setara','Lainnya']},
       {k:'value',l:'Nilai perkiraan (juta Rp)',t:'num'},
       {k:'acq',l:'Tanggal perolehan',t:'date'},
       {k:'loc',l:'Lokasi / penyimpanan',t:'text',full:1},
       {k:'doc',l:'Dokumen kepemilikan',t:'text',full:1},
       {k:'note',l:'Catatan',t:'textarea',full:1}]}
};
const SCH_ORDER = ['LOG','TSK','MTG','PER','ORG','FAM','EVT','BUS','PRO','KNW','DEC','GOL','TRP','CNT','MOV','TXN','AST'];

/* Modul → entitas yang muncul di dalamnya */
const MODULE_ENTITIES = {
  myday:[ 'LOG','TSK','MTG'], wellbeing:['LOG'], network:['PER','ORG'], family:['FAM','EVT'],
  business:['BUS'], projects:['PRO','TSK'], knowledge:['KNW'], os:['DEC','GOL'],
  travel:['TRP'], brand:['CNT'], social:['MOV'], finance:['TXN','AST'], operations:['TSK']
};

/* ================= RENDER FORM ================= */
let FORM_T = null, FORM_ID = null;

function fieldHTML(f, v, err){
  const val = v === undefined || v === null ? '' : String(v);
  const bad = err ? ' bad' : '';
  const lab = `<label>${h(f.l)}${f.req?'<i title="Wajib diisi">*</i>':''}</label>`;
  const hint = f.hint ? `<span class="fhint">${h(f.hint)}</span>` : '';
  const e = err ? `<span class="ferr">${h(err)}</span>` : '';
  let inp = '';
  if(f.t === 'textarea'){
    inp = `<textarea data-k="${f.k}" placeholder="${h(f.ph||'')}">${h(val)}</textarea>`;
  } else if(f.t === 'sel'){
    inp = `<select data-k="${f.k}"><option value="">— pilih —</option>` +
      f.opt.map(o=>`<option value="${h(o)}"${val===o?' selected':''}>${h(o)}</option>`).join('') + `</select>`;
  } else if(f.t === 'rel'){
    const list = recs(f.rel);
    const S2 = SCHEMA[f.rel];
    inp = list.length
      ? `<select data-k="${f.k}"><option value="">— tidak ditautkan —</option>` +
        list.map(r=>`<option value="${r.id}"${val===r.id?' selected':''}>${h(S2.t(r))} · ${r.id}</option>`).join('') + `</select>`
      : `<select data-k="${f.k}" disabled><option value="">Belum ada ${h(S2.n)} — tambahkan dulu</option></select>`;
  } else {
    const type = f.t==='num'?'number' : f.t==='date'?'date' : f.t==='time'?'time' : f.t==='tel'?'tel' : f.t==='email'?'email' : f.t==='url'?'url' : 'text';
    inp = `<input data-k="${f.k}" type="${type}" value="${h(val)}" placeholder="${h(f.ph||'')}">`;
  }
  return `<div class="fld${f.full||f.t==='textarea'?' full':''}${bad}">${lab}${inp}${e}${hint}</div>`;
}

function fieldsHTML(type, vals, errs){
  const S = SCHEMA[type];
  const body = S.f.map(f => f.g
    ? `<div class="fgroup">${h(f.g)}</div>`
    : fieldHTML(f, vals[f.k], errs[f.k])).join('');
  const priv = `<div class="fgroup">Governance</div>
    <div class="fld"><label>Tingkat privasi</label>
      <select data-k="_priv">${PRIV.map(p=>`<option value="${p}"${(vals._priv||S.priv)===p?' selected':''}>${p}</option>`).join('')}</select>
      <span class="fhint">Menentukan siapa yang boleh melihat record ini.</span></div>
    <div class="fld"><label>Tag</label>
      <input data-k="_tags" type="text" value="${h(vals._tags||'')}" placeholder="dipisah koma">
      <span class="fhint">Membantu pencarian lintas modul.</span></div>`;
  return body + priv;
}

function openForm(type, id){
  const S = SCHEMA[type]; if(!S) return;
  FORM_T = type; FORM_ID = id || null;
  const r = id ? recById(id) : null;
  const vals = {};
  if(r){ Object.keys(r).forEach(k=>{ if(k!=='_m'&&k!=='id'&&k!=='type') vals[k]=r[k]; });
         vals._priv = r._m.privacy_level; vals._tags = (r._m.tags||[]).join(', '); }
  else { const f0 = S.f.find(x=>x.k==='date'); if(f0) vals.date = new Date().toISOString().slice(0,10); }
  modal(
    (r ? 'Ubah ' : 'Tambah ') + S.n,
    r ? `${r.id} · dibuat ${dtID(r._m.created_at)}` : `${S.d} Setiap record baru otomatis mendapat ID global, metadata universal, dan tingkat privasi.`,
    `<form id="formFields" class="frm" onsubmit="return false">${fieldsHTML(type, vals, {})}</form>`,
    `<button class="btn solid" onclick="submitForm()">${ic('check')} ${r?'Simpan perubahan':'Simpan'}</button>
     <button class="btn ghost" onclick="closeModal()">Batal</button>
     ${r?`<button class="btn red" style="margin-left:auto" onclick="archiveRec('${r.id}')">Arsipkan</button>`:
        `<span class="mini" style="margin-left:auto;align-self:center">ID berikutnya · ${type}-${String((STORE.seq[type]||0)+1).padStart(6,'0')}</span>`}`,
    true);
}

function collectForm(){
  const o = {};
  document.querySelectorAll('#formFields [data-k]').forEach(el => { o[el.dataset.k] = (el.value||'').trim(); });
  return o;
}

function submitForm(){
  const type = FORM_T, S = SCHEMA[type]; if(!S) return;
  const v = collectForm(), errs = {};
  S.f.forEach(f => {
    if(f.g) return;
    const val = v[f.k] || '';
    if(f.req && !val) errs[f.k] = 'Wajib diisi';
    else if(val && f.t === 'num' && isNaN(Number(val))) errs[f.k] = 'Harus berupa angka';
    else if(val && f.t === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val)) errs[f.k] = 'Format email belum benar';
  });
  if(v.start && v.end && v.end < v.start) errs.end = 'Lebih awal dari tanggal mulai';
  if(v.start && v.due && v.due < v.start) errs.due = 'Lebih awal dari tanggal mulai';
  if(Object.keys(errs).length){
    const vals = Object.assign({}, v);
    document.getElementById('formFields').innerHTML = fieldsHTML(type, vals, errs);
    const first = document.querySelector('#formFields .fld.bad');
    if(first) first.scrollIntoView({block:'center', behavior:'smooth'});
    toast(Object.keys(errs).length + ' isian perlu diperbaiki');
    return;
  }
  const now = new Date().toISOString();
  const tags = (v._tags||'').split(',').map(s=>s.trim()).filter(Boolean);
  const priv = v._priv || S.priv;
  delete v._tags; delete v._priv;
  let r;
  if(FORM_ID){
    r = recById(FORM_ID); if(!r){ closeModal(); return; }
    const before = Object.assign({}, r, { _priv: r._m.privacy_level });
    Object.assign(r, v);
    r._m.updated_at = now; r._m.updated_by = DB.owner.name;
    r._m.privacy_level = priv; r._m.tags = tags;
    logAct('UPDATE', r, '', diffRec(before, Object.assign({}, r, { _priv: priv }), type));
  } else {
    r = Object.assign({ id: nextId(type), type }, v);
    r._m = { created_at:now, updated_at:now, created_by:DB.owner.name, updated_by:DB.owner.name,
             status:'ACTIVE', source_type:'MANUAL_ENTRY', source_id:'', source_url:'',
             privacy_level:priv, is_dummy:false, is_archived:false, tags };
    (STORE.rec[type] = STORE.rec[type] || []).unshift(r);
    logAct('CREATE', r);
  }
  saveStore(); closeModal();
  toast(`${S.n} tersimpan — ${r.id} · is_dummy = false`);
  go(CUR);
}

/* ================= DETAIL · ARSIP · PULIHKAN ================= */
function recDetail(id){
  const r = recById(id); if(!r) return;
  const S = SCHEMA[typeOf(r)];
  const rows = S.f.filter(f=>!f.g && (r[f.k]!==undefined && r[f.k]!=='')).map(f=>{
    let val = r[f.k];
    if(f.t==='date') val = dOnly(val);
    else if(f.t==='rel'){ const t2 = recById(val); val = t2 ? SCHEMA[typeOf(t2)].t(t2) + ' · ' + t2.id : val; }
    else if(f.t==='num' && (f.k==='budget'||f.k==='amount'||f.k==='value')) val = 'Rp ' + val + ' Jt';
    return `<dt>${h(f.l)}</dt><dd>${h(String(val)).replace(/\n/g,'<br>')}</dd>`;
  }).join('');
  const m = r._m;
  modal(S.t(r), `${S.n} · ${r.id}`,
    `<div class="flexr" style="gap:7px;margin-bottom:16px">
       ${idPill(r.id)}
       <span class="pill green">DATA ASLI · is_dummy = false</span>
       <span class="pill blue">${m.privacy_level}</span>
       ${m.is_archived?'<span class="pill red">ARSIP</span>':''}
       ${(m.tags||[]).map(t=>`<span class="pill gray">${h(t)}</span>`).join('')}
     </div>
     <dl class="kv">${rows || '<dt>—</dt><dd>Belum ada isian.</dd>'}</dl>
     <div class="sep" style="margin:18px 0"></div>
     <div class="fgroup" style="border:0;padding:0;margin:0 0 10px">Metadata universal</div>
     <dl class="kv">
       <dt>Dibuat</dt><dd>${dtID(m.created_at)} oleh ${h(m.created_by)}</dd>
       <dt>Diperbarui</dt><dd>${dtID(m.updated_at)} oleh ${h(m.updated_by)}</dd>
       <dt>Sumber</dt><dd>${m.source_type}</dd>
       <dt>Status</dt><dd>${m.status}</dd>
       <dt>Arsip</dt><dd>is_archived = ${m.is_archived}</dd>
     </dl>`,
    m.is_archived
      ? `<button class="btn grn" onclick="restoreRec('${r.id}')">${ic('arrow')} Pulihkan</button>
         <button class="btn ghost" onclick="closeModal()">Tutup</button>`
      : `<button class="btn solid" onclick="openForm('${typeOf(r)}','${r.id}')">Ubah</button>
         <button class="btn ghost" onclick="closeModal()">Tutup</button>
         <button class="btn red" style="margin-left:auto" onclick="archiveRec('${r.id}')">Arsipkan</button>`,
    true);
}

function archiveRec(id){
  const r = recById(id); if(!r) return;
  r._m.is_archived = true; r._m.status = 'ARCHIVED'; r._m.updated_at = new Date().toISOString();
  logAct('ARCHIVE', r); saveStore(); closeModal();
  toast('Diarsipkan — tidak hilang, bisa dipulihkan di System Foundation › Data Saya');
  go(CUR);
}
function restoreRec(id){
  const r = recById(id); if(!r) return;
  r._m.is_archived = false; r._m.status = 'ACTIVE'; r._m.updated_at = new Date().toISOString();
  logAct('RESTORE', r); saveStore(); closeModal(); toast('Dipulihkan'); go(CUR);
}

/* ================= PEMILIH ENTITAS (tombol + Add) ================= */
function openCreate(){
  const here = MODULE_ENTITIES[CUR] || [];
  const ctx = NAV.find(n=>n.id===CUR);
  const card = t => { const S = SCHEMA[t]; const n = recs(t).length; return `
    <div class="card click" style="padding:14px" onclick="closeModal();openForm('${t}')">
      <div class="flexr" style="gap:9px;margin-bottom:6px">
        <div class="ic" style="width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:${CT(S.c)};color:${CV(S.c)};flex:0 0 30px">${ic(S.ic)}</div>
        <b style="font-size:14px">${S.n}</b>${n?`<span class="cnt" style="margin-left:auto">${n}</span>`:''}</div>
      <p class="sub" style="margin:0;font-size:12px">${S.d}</p>
      <div class="mini" style="margin-top:7px;font-family:ui-monospace,Menlo,monospace">${t}-${String((STORE.seq[t]||0)+1).padStart(6,'0')}</div>
    </div>`; };
  const rest = SCH_ORDER.filter(t=>here.indexOf(t)<0);
  modal('Tambah Baru', `Konteks saat ini: <b>${ctx?ctx.n:'System'}</b>`,
    (here.length ? `<div class="fgroup" style="border:0;padding:0;margin:0 0 10px">Sering dipakai di ${ctx?ctx.n:'sini'}</div>
      <div class="g g3" style="gap:11px;margin:0 0 20px">${here.map(card).join('')}</div>` : '') +
    `<div class="fgroup" style="border:0;padding:0;margin:0 0 10px">Semua entitas</div>
     <div class="g g3" style="gap:11px;margin:0">${rest.map(card).join('')}</div>`,
    `<button class="btn gold" onclick="closeModal();openImport()">${ic('doc')} Impor dari Google Sheets</button>
     <span class="mini" style="margin-left:auto;align-self:center">Tersimpan dengan <code>is_dummy = false</code>. Ekspor CSV ada di System Foundation › Data Saya.</span>`,
    true);
}

/* ================= TAMPILAN RECORD DI DALAM MODUL ================= */
function recRows(t, lim){
  const S = SCHEMA[t];
  const list = recs(t).slice(0, lim||8);
  return list.map(r=>`
    <div class="rec-row" onclick="recDetail('${r.id}')">
      <div class="ic" style="width:28px;height:28px;border-radius:9px;display:grid;place-items:center;background:${CT(S.c)};color:${CV(S.c)};flex:0 0 28px">${ic(S.ic)}</div>
      <span style="min-width:0;flex:1"><span class="rt">${h(S.t(r))}</span><span class="rs">${h(S.s(r)||'—')}</span></span>
      <span class="rd">${idPill(r.id)}</span>
    </div>`).join('');
}
function recCard(t){
  const S = SCHEMA[t], n = recs(t).length;
  return `<div class="card mine">
    ${cardH(S.ic, S.n, S.c, `<span class="cnt">${n}</span>`)}
    <div class="rows">${recRows(t)}</div>
    <div class="card-f" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <button class="btn ghost sm" onclick="openForm('${t}')">${ic('plus')} Tambah</button>
      ${n>8?`<span class="mini">Menampilkan 8 dari ${n} — semuanya ada di System Foundation › Data Saya</span>`:
            `<span class="mini">Data asli Anda · <code>is_dummy = false</code></span>`}
    </div></div>`;
}
function myBlock(mod){
  const types = (MODULE_ENTITIES[mod]||[]).filter(t=>recs(t).length);
  if(!types.length) return '';
  return `<div class="card-h" style="margin:24px 0 12px"><div class="ic" style="background:var(--green-t);color:var(--green)">${ic('check')}</div>
      <h3>Data Anda</h3><div class="r"><span class="pill green">DATA ASLI · ${types.reduce((s,t)=>s+recs(t).length,0)} record</span></div></div>
    <div class="g ${types.length>1?'g2':''}" style="margin:0">${types.map(recCard).join('')}</div>`;
}
function addStrip(mod){
  const types = MODULE_ENTITIES[mod]||[]; if(!types.length) return '';
  return `<div class="card" style="margin-top:24px;display:flex;gap:12px;align-items:center;flex-wrap:wrap">
    <div class="ic" style="width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:var(--green-t);color:var(--green);flex:0 0 34px">${ic('plus')}</div>
    <div style="flex:1;min-width:200px"><b style="font-size:13.5px">Mulai masukkan data asli</b>
      <p class="sub" style="margin:2px 0 0;font-size:12px">Record Anda akan muncul di sini dengan penanda <code>is_dummy = false</code>, terpisah dari data contoh.</p></div>
    ${types.map(t=>`<button class="btn gold sm" onclick="openForm('${t}')">${ic('plus')} ${SCHEMA[t].n}</button>`).join('')}
    <button class="btn ghost sm" onclick="openImport('${types[0]}')">${ic('doc')} Impor</button>
  </div>`;
}
function myPage(mod){
  const nav = NAV.find(n=>n.id===mod) || {n:mod};
  const types = MODULE_ENTITIES[mod]||[];
  const have = types.filter(t=>recs(t).length);
  return `
  <div class="page-h">
    <div><h1>${nav.n}</h1><p>Data asli Anda. Data contoh sedang tidak ditampilkan.</p></div>
    <div class="sp"><span class="pill green">${have.reduce((s,t)=>s+recs(t).length,0)} record asli</span></div>
  </div>
  ${dummyStateBar()}
  <div class="chips" style="margin-bottom:16px">${types.map(t=>`<button class="chip" onclick="openForm('${t}')">+ ${SCHEMA[t].n}</button>`).join('')}</div>
  <div class="g ${have.length>1?'g2':''}" style="margin:0">${have.map(recCard).join('')}</div>`;
}

/* Bungkus ulang view — dijalankan setelah pembungkus data contoh */
Object.keys(MODULE_ENTITIES).forEach(k=>{
  if(!VIEWS[k]) return;
  const orig = VIEWS[k];
  /* Modul yang dikosongkan sepenuhnya saat data contoh disembunyikan */
  const blanked = typeof DUMMY_MODULES !== 'undefined' && !!DUMMY_MODULES[k];
  VIEWS[k] = () => {
    const has = (MODULE_ENTITIES[k]||[]).some(t=>recs(t).length);
    if(dummyOn() || !blanked) return orig() + (has ? myBlock(k) : addStrip(k));
    return has ? myPage(k) : orig();
  };
});

/* ================= EKSPOR CSV ================= */
function csvOf(type){
  const S = SCHEMA[type], keys = S.f.filter(f=>!f.g).map(f=>f.k);
  const head = ['id'].concat(keys, ['privacy_level','tags','created_at','updated_at','is_dummy','is_archived']);
  const q = s => '"' + String(s===undefined||s===null?'':s).replace(/"/g,'""') + '"';
  const lines = [head.map(q).join(',')];
  allRecs(type).forEach(r=>{
    lines.push([q(r.id)].concat(
      keys.map(k=>q(r[k])),
      [q(r._m.privacy_level), q((r._m.tags||[]).join('; ')), q(r._m.created_at), q(r._m.updated_at), q(r._m.is_dummy), q(r._m.is_archived)]
    ).join(','));
  });
  return lines.join('\n');
}
function exportCSV(type){
  const S = SCHEMA[type], n = allRecs(type).length;
  if(!n){ toast('Belum ada record ' + S.n + ' untuk diekspor'); return; }
  modal('Ekspor ' + S.n, `${n} record · format CSV, siap ditempel ke template Google Sheets di folder modul.`,
    `<p class="sub" style="margin-bottom:12px">Salin seluruh isi kotak di bawah, lalu di Google Sheets pilih <b>Tempel</b> pada sel A1. Kolom sudah cocok dengan Data Dictionary.</p>
     <textarea class="csvbox" id="csvOut" readonly>${h(csvOf(type))}</textarea>`,
    `<button class="btn solid" onclick="copyCSV()">${ic('doc')} Salin ke papan klip</button>
     <button class="btn ghost" onclick="closeModal()">Tutup</button>`, true);
}
function copyCSV(){
  const el = document.getElementById('csvOut'); if(!el) return;
  el.focus(); el.select();
  let ok = false;
  try{ ok = document.execCommand('copy'); }catch(e){}
  if(!ok && navigator.clipboard){ navigator.clipboard.writeText(el.value).then(()=>toast('Tersalin')).catch(()=>toast('Salin manual: Ctrl/Cmd + C')); return; }
  toast(ok ? 'Tersalin ke papan klip' : 'Salin manual: Ctrl/Cmd + C');
}

/* ================= TAB: DATA SAYA ================= */
if(typeof F_TABS !== 'undefined') F_TABS.splice(4, 0, ['mydata','Data Saya']);

F_VIEW.mydata = () => {
  const active = SCH_ORDER.reduce((s,t)=>s+recs(t).length,0);
  const arch   = SCH_ORDER.reduce((s,t)=>s+arcRecs(t).length,0);
  const withRec = SCH_ORDER.filter(t=>allRecs(t).length);
  return `
  <div class="g g4" style="margin-bottom:18px">
    ${[['Record aktif',active,'green','check'],['Diarsipkan',arch,'orange','flag'],
       ['Jenis entitas terpakai',withRec.length+' / '+SCH_ORDER.length,'purple','layers'],
       ['Aktivitas tercatat',(STORE.log||[]).length,'blue','clock']].map(s=>`
      <div class="card"><div class="kpi">
        <div class="ic" style="width:38px;height:38px;border-radius:11px;display:grid;place-items:center;flex:0 0 38px;background:${CT(s[2])};color:${CV(s[2])}">${ic(s[3])}</div>
        <div style="min-width:0"><b>${s[1]}</b><span>${s[0]}</span></div></div></div>`).join('')}
  </div>

  <div class="card" style="margin-bottom:18px">
    ${cardH('shield','Aturan data Anda','green')}
    <div class="rows">
      <div class="row-i" style="cursor:default;align-items:flex-start">${ic('check','')}<span><span class="t" style="font-size:12.5px">Terpisah dari data contoh</span><span class="s">Semua record di sini bertanda <code>is_dummy = false</code> dan <code>source_type = MANUAL_ENTRY</code>. Menghapus data contoh tidak menyentuhnya.</span></span></div>
      <div class="row-i" style="cursor:default;align-items:flex-start">${ic('shield','')}<span><span class="t" style="font-size:12.5px">Tersimpan di peramban ini</span><span class="s">Bertahan saat halaman dibuka ulang, tetapi belum tersinkron antar perangkat. Ekspor CSV secara berkala ke template Google Drive sebagai salinan aman.</span></span></div>
      <div class="row-i" style="cursor:default;align-items:flex-start">${ic('flag','')}<span><span class="t" style="font-size:12.5px">Arsip, bukan hapus</span><span class="s">Mengarsipkan menandai <code>is_archived = true</code>. Record tetap ada dan bisa dipulihkan kapan saja.</span></span></div>
    </div>
  </div>

  ${active+arch===0 ? `
  <div class="card" style="text-align:center;padding:46px 26px">
    <div style="width:60px;height:60px;border-radius:18px;background:var(--green-t);color:var(--green);display:grid;place-items:center;margin:0 auto 16px">
      <span style="display:block;width:28px;height:28px">${ic('plus')}</span></div>
    <h2 style="font-family:var(--fd);font-size:24px;font-weight:600;margin:0 0 8px">Belum ada data asli</h2>
    <p class="sub" style="max-width:440px;margin:0 auto 20px">Mulai dari satu record saja — kontak, tugas, atau catatan harian. Sisanya bisa menyusul.</p>
    <div style="display:flex;gap:9px;justify-content:center;flex-wrap:wrap">
      <button class="btn solid" onclick="openCreate()">${ic('plus')} Tambah record pertama</button>
      <button class="btn gold" onclick="openImport()">${ic('doc')} Impor dari template Drive</button></div>
  </div>` : `
  <div class="card" style="margin-bottom:18px">
    ${cardH('layers','Record per entitas','purple',`<button class="btn gold sm" onclick="openImport()">${ic('doc')} Impor dari Sheets</button>`)}
    <div style="overflow-x:auto"><table class="tbl"><thead><tr>
      <th>Entitas</th><th>Prefix</th><th>Modul</th><th style="text-align:right">Aktif</th><th style="text-align:right">Arsip</th><th>Aksi</th>
    </tr></thead><tbody>${withRec.map(t=>{ const S=SCHEMA[t]; return `<tr>
      <td><b>${S.n}</b></td>
      <td><code>${t}</code></td>
      <td>${(NAV.find(n=>n.id===S.mod)||{n:'—'}).n}</td>
      <td style="text-align:right;font-variant-numeric:tabular-nums">${recs(t).length}</td>
      <td style="text-align:right;font-variant-numeric:tabular-nums">${arcRecs(t).length}</td>
      <td><button class="btn ghost sm" onclick="openForm('${t}')">+ Baru</button>
          <button class="btn ghost sm" onclick="openImport('${t}')">Impor</button>
          <button class="btn ghost sm" onclick="exportCSV('${t}')">Ekspor CSV</button></td>
    </tr>`; }).join('')}</tbody></table></div>
  </div>

  <div class="g g2" style="margin:0 0 18px">
    ${withRec.filter(t=>recs(t).length).map(recCard).join('')}
  </div>

  ${arch ? `<div class="card" style="margin-bottom:18px">
    ${cardH('flag','Arsip',"orange",`<span class="cnt">${arch}</span>`)}
    <div class="rows">${SCH_ORDER.map(t=>arcRecs(t).map(r=>`
      <div class="rec-row" onclick="recDetail('${r.id}')">
        <span class="pill red" style="margin-top:1px">ARSIP</span>
        <span style="min-width:0;flex:1"><span class="rt">${h(SCHEMA[t].t(r))}</span><span class="rs">${SCHEMA[t].n} · ${r.id}</span></span>
        <span class="rd"><button class="btn ghost sm" onclick="event.stopPropagation();restoreRec('${r.id}')">Pulihkan</button></span>
      </div>`).join('')).join('')}</div></div>` : ''}
  `}

  ${(STORE.log||[]).length ? `<div class="card">
    ${cardH('clock','Jejak aktivitas','blue',`<span class="mini">${STORE.log.length} tercatat</span>`)}
    <div class="rows">${STORE.log.slice(0,12).map(l=>`
      <div class="row-i" style="cursor:default;align-items:flex-start">
        <span class="pill ${l.act==='CREATE'?'green':l.act==='UPDATE'?'blue':l.act==='ARCHIVE'?'orange':'gray'}" style="margin-top:1px">${l.act}</span>
        <span style="min-width:0"><span class="t" style="font-size:12.5px">${h(l.label||l.id)}</span><span class="s">${l.id} · ${dtID(l.ts)}</span></span>
      </div>`).join('')}</div></div>` : ''}
  `;
};

