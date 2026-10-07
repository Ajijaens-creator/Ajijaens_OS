
/* ================= AJI JAENS OS — DATA LAYER v1.1 =================
   ANGKA KEUANGAN = DATA ASLI dari Jaens Enterprises Finance Drive.
   Sumber: "PROFIT & LOSS CONSOLIDATION REPORT JAENS ENTERPRISES 2026"
           "BALANCE SHEET CONSOLIDATION REPORT JAENS ENTERPRISES 2026"
   Periode tertutup terakhir: JULI 2026. Semua nilai dalam miliar Rupiah.
   Modul non-keuangan masih memakai demo data dan ditandai badge "Demo". */

const DB = {
  meta:{
    period:'Juli 2026', periodNote:'bulan tertutup terakhir',
    source:'Jaens Enterprises Finance Drive',
    synced:'25 Agu 2026',
    files:['PROFIT & LOSS CONSOLIDATION REPORT JAENS ENTERPRISES 2026','BALANCE SHEET CONSOLIDATION REPORT JAENS ENTERPRISES 2026'],
    months:['Jan','Feb','Mar','Apr','Mei','Jun','Jul'],
    caveats:[
      "J'Fresh Laundry dan Jaens Essences belum dibebani management expense di P&L, sehingga margin unit tampak lebih tinggi dari margin sebenarnya.",
      'Jaens Academy dan Jaens Pondok Impian belum masuk laporan konsolidasi 2026.',
      'Care Estate punya kolom di laporan tetapi belum mencatat revenue Jan–Juli 2026.',
      'File cash flow harian berhenti di Mei 2026 — angka kas memakai Balance Sheet Juli 2026.'
    ]
  },

  owner:{ id:'p_aji', name:'Aji Jaens', role:'CEO & Founder', initials:'AJ', city:'Ubud, Bali' },

  modes:[
    {id:'founder', name:'Founder Mode', ic:'crown', c:'gold', desc:'Default. Bisnis, keputusan, dan eksekusi harian seimbang.'},
    {id:'focus',   name:'Focus Mode',   ic:'target',c:'blue', desc:'Deep work. Notifikasi bisnis ditahan, kalender diblok.'},
    {id:'travel',  name:'Travel Mode',  ic:'plane', c:'teal', desc:'Penerbangan, hotel, meeting, dokumen, kontak lokal naik ke atas.'},
    {id:'recovery',name:'Recovery Mode',ic:'heart', c:'green',desc:'Wellbeing, tidur, olahraga, keluarga. Notifikasi bisnis dikurangi.'},
    {id:'family',  name:'Family Mode',  ic:'users', c:'pink', desc:'Keluarga di depan. Hanya alert kritikal yang lewat.'},
    {id:'learning',name:'Learning Mode',ic:'book',  c:'purple',desc:'Knowledge, buku, riset, dan refleksi jadi prioritas.'}
  ],

  /* ---------- BUSINESS UNITS — ANGKA ASLI JULI 2026 ---------- */
  units:[
    {id:'u_spa', name:'Jaens Spa', cat:'Wellness / Spa · 4 outlet', color:'teal', live:true,
     rev:3.446, gr:5.4, profit:.960, margin:27.9, cash:2.644, people:96, status:'Sehat', risk:'low',
     spark:[2.152,2.170,1.873,2.417,3.222,3.271,3.446],
     note:'Penyumbang 79% revenue grup. Bisma bergabung Mei 2026 dan langsung menambah ±Rp 0,5 M per bulan.',
     attention:'Bisma masih 8,6% margin — jauh di bawah tiga outlet lain.',
     outlets:[
       {n:'Center Ubud', rev:1.634, gr:2.4,  np:.513, margin:31.4, cash:1.043},
       {n:'Triloka',     rev:.794, gr:9.2,  np:.284, margin:35.8, cash:.940},
       {n:'Shanti',      rev:.514, gr:19.2, np:.120, margin:23.3, cash:.442},
       {n:'Bisma',       rev:.505, gr:-2.4, np:.043, margin:8.6,  cash:.219}
     ]},
    {id:'u_lau', name:"J'Fresh Laundry", cat:'Service / Support', color:'blue', live:true,
     rev:.367, gr:-4.3, profit:.244, margin:66.4, cash:.549, people:19, status:'Perlu perhatian', risk:'low',
     spark:[.293,.274,.254,.301,.405,.383,.367], outlets:[],
     note:'Revenue turun dua bulan berturut dari puncak Rp 0,405 M di Mei.',
     attention:'Margin 66% belum dibebani management expense — margin riil lebih rendah.'},
    {id:'u_ess', name:'Jaens Essences', cat:'Production / Product', color:'purple', live:true,
     rev:.193, gr:-20.0, profit:.068, margin:35.3, cash:.029, people:22, status:'Perlu perhatian', risk:'med',
     spark:[.149,.113,.109,.345,.216,.242,.193], outlets:[],
     note:'Volatil. Lonjakan April (Rp 0,345 M) belum terulang.',
     attention:'Turun 20% MoM dan kas unit hanya Rp 29 Jt.'},
    {id:'u_mgt', name:'Management / HQ', cat:'Holding & Shared Service', color:'gold', live:true,
     rev:.345, gr:5.4, profit:.041, margin:12.0, cash:0, people:14, status:'Sehat', risk:'low',
     spark:[.215,.217,.187,.242,.322,.327,.345], outlets:[],
     note:'Pendapatan dari management fee unit. Sempat rugi Jan–April, positif sejak Mei.',
     attention:'Seluruh pendapatannya tereliminasi di konsolidasi grup.'},
    {id:'u_care', name:'Care Estate', cat:'Property / Estate', color:'blue', live:true,
     rev:0, gr:0, profit:0, margin:0, cash:0, people:18, status:'Belum ada data', risk:'med',
     spark:[0,0,0,0,0,0,0], outlets:[],
     note:'Kolomnya ada di laporan konsolidasi, tetapi nol Januari–Juli 2026.',
     attention:'Belum mencatat revenue sama sekali di 2026 — perlu kejelasan status pembukuan.'},
    {id:'u_aca', name:'Jaens Academy', cat:'Education / Training', color:'orange', live:false,
     rev:null, gr:null, profit:null, margin:null, cash:null, people:11, status:'Di luar konsolidasi', risk:'med',
     spark:null, outlets:[],
     note:'Tidak muncul di laporan konsolidasi 2026 sehingga kinerjanya tidak terbaca di level grup.',
     attention:'Perlu keputusan: konsolidasikan mulai September atau Januari 2027.'},
    {id:'u_pon', name:'Jaens Pondok Impian', cat:'Hospitality / Villa', color:'green', live:false,
     rev:null, gr:null, profit:null, margin:null, cash:null, people:9, status:'Di luar konsolidasi', risk:'low',
     spark:null, outlets:[],
     note:'Belum masuk laporan konsolidasi 2026.',
     attention:'Sama seperti Academy — belum terbaca di level grup.'}
  ],

  /* ---------- PEOPLE / NETWORK (demo) ---------- */
  people:[
    {id:'p_made', n:'Pak Made Sudana', org:'Sudana Group', pos:'Strategic Partner', cat:'Business Partners', tier:'A', str:92, city:'Denpasar', last:'3 hari lalu', next:'Follow up kerja sama lahan Care Estate', bd:'12 Mar', c:'teal', op:'Joint venture lahan fase 2'},
    {id:'p_fitri',n:'Ibu Fitriani', org:'BNI Kantor Wilayah Bali', pos:'Relationship Manager', cat:'Bankers', tier:'A', str:88, city:'Denpasar', last:'6 hari lalu', next:'Konfirmasi agenda company visit', bd:'2 Sep', c:'orange', op:'Fasilitas kredit investasi'},
    {id:'p_bruce',n:'Mr. Bruce Halloran', org:'Halloran Capital', pos:'Investor', cat:'Investors', tier:'A', str:74, city:'Sydney', last:'21 hari lalu', next:'Kirim proposal investasi', bd:'18 Nov', c:'blue', op:'Ticket size AUD 500k — menunggu review'},
    {id:'p_wayan',n:'Pak Wayan Sudiarta', org:'Dinas Pariwisata Bali', pos:'Kepala Bidang', cat:'Government', tier:'B', str:66, city:'Denpasar', last:'34 hari lalu', next:'Audiensi regulasi standar spa', bd:'7 Jun', c:'green', op:'Dukungan sertifikasi Bali Spa Bersatu'},
    {id:'p_gede', n:'Pak Gede Arya', org:'HIPMI Bali', pos:'Ketua Bidang', cat:'Community Leaders', tier:'B', str:71, city:'Denpasar', last:'11 hari lalu', next:'Undangan forum bisnis September', bd:'23 Jan', c:'orange', op:'Panggung thought leadership'},
    {id:'p_ratna',n:'Ibu Ratna Dewanti', org:'Dewanti & Partners', pos:'Legal Counsel', cat:'Lawyers', tier:'B', str:80, city:'Jakarta', last:'2 hari lalu', next:'Review klausul kontrak Care Estate', bd:'30 Apr', c:'red', op:'—'},
    {id:'p_hendra',n:'Pak Hendra Wijaya', org:'Bank BCA', pos:'Senior Banker', cat:'Bankers', tier:'B', str:63, city:'Denpasar', last:'48 hari lalu', next:'Bandingkan penawaran fasilitas', bd:'14 Feb', c:'blue', op:'Refinancing pinjaman existing'},
    {id:'p_ayu',  n:'dr. Ayu Laksmi', org:'Klinik Ubud Sehat', pos:'Dokter Keluarga', cat:'Doctors', tier:'C', str:70, city:'Ubud', last:'19 hari lalu', next:'Jadwalkan medical check-up tahunan', bd:'5 Agu', c:'green', op:'—'},
    {id:'p_komang',n:'Pak Komang Astawa', org:'Astawa Architects', pos:'Principal Architect', cat:'Architects', tier:'B', str:78, city:'Ubud', last:'5 hari lalu', next:'Presentasi desain villa 3', bd:'9 Okt', c:'purple', op:'Desain outlet baru & villa 3'},
    {id:'p_chen', n:'Mrs. Chen Li', org:'Lotus Wellness Singapore', pos:'Founder', cat:'International Partners', tier:'A', str:69, city:'Singapore', last:'27 hari lalu', next:'Diskusi distribusi Jaens Essences', bd:'21 Des', c:'teal', op:'Distribusi produk ke 6 outlet SG'},
    {id:'p_sinta',n:'Ibu Sinta Maharani', org:'Bali Media Network', pos:'Editor in Chief', cat:'Media', tier:'C', str:58, city:'Denpasar', last:'61 hari lalu', next:'Tawarkan artikel Life by Design', bd:'3 Mei', c:'pink', op:'Feature story journey Jaens'},
    {id:'p_agus', n:'Pak Agus Setiawan', org:'Setiawan Land', pos:'Developer', cat:'Developers', tier:'C', str:52, city:'Gianyar', last:'73 hari lalu', next:'Reconnect — relasi mulai dingin', bd:'16 Jul', c:'gray', op:'Info lahan strategis'},
    {id:'p_dewi', n:'Ibu Dewi Anggraeni', org:'Bali Spa Bersatu', pos:'Sekretaris Jenderal', cat:'Community Leaders', tier:'A', str:86, city:'Ubud', last:'Kemarin', next:'Finalisasi agenda kongres', bd:'11 Nov', c:'orange', op:'—'},
    {id:'p_james',n:'Mr. James Whitfield', org:'Whitfield Retreats', pos:'Managing Director', cat:'International Partners', tier:'B', str:61, city:'Melbourne', last:'39 hari lalu', next:'Follow up paket retreat 2027', bd:'28 Agu', c:'blue', op:'Paket retreat 40 pax/kuartal'},
    {id:'p_putu', n:'Putu Ardana', org:'Jaens Enterprises', pos:'COO', cat:'Business Partners', tier:'A', str:95, city:'Ubud', last:'Hari ini', next:'Review operasional mingguan', bd:'19 Mar', c:'teal', op:'—'},
    {id:'p_ketut',n:'Ketut Sriani', org:'Jaens Enterprises', pos:'CFO', cat:'Business Partners', tier:'A', str:94, city:'Ubud', last:'Hari ini', next:'Closing laporan Agustus', bd:'8 Des', c:'green', op:'—'}
  ],

  /* ---------- FAMILY (demo, private by default) ---------- */
  family:[
    {id:'f_ist', n:'Ni Luh Jaens', rel:'Istri', bd:'14 Feb', note:'Partner hidup & co-founder gerakan wellness', c:'pink'},
    {id:'f_p1',  n:'Putu Adi Jaens', rel:'Putra Sulung', bd:'3 Sep', note:'Kelas akhir — persiapan kuliah', c:'blue'},
    {id:'f_p2',  n:'Kadek Ayu Jaens', rel:'Putri', bd:'22 Jun', note:'Aktif menari & musik', c:'purple'},
    {id:'f_ibu', n:'Ibunda Sri', rel:'Ibunda', bd:'9 Jan', note:'Tinggal di Gianyar — kunjungan rutin akhir pekan', c:'green'}
  ],
  familyEvents:[
    {d:'Hari ini', t:'19:30', n:'Family Dinner di rumah', c:'pink'},
    {d:'Kamis', t:'16:00', n:'Antar Kadek Ayu latihan tari', c:'purple'},
    {d:'Sabtu', t:'09:00', n:'Kunjungan ke Ibunda di Gianyar', c:'green'},
    {d:'3 Sep', t:'—', n:'🎂 Ulang tahun Putu Adi', c:'blue'},
    {d:'12 Sep', t:'08:00', n:'Konsultasi kampus Putu Adi', c:'blue'},
    {d:'20 Okt', t:'—', n:'Family trip Tokyo (7 hari)', c:'teal'}
  ],

  /* ---------- SCHEDULE HARI INI (demo) ---------- */
  schedule:[
    {t:'07:00', n:'Morning Dharma & Refleksi', tag:'Personal', c:'purple', dur:'45m'},
    {t:'08:30', n:'Exercise — Strength & Mobility', tag:'Wellbeing', c:'green', dur:'60m'},
    {t:'09:00', n:'Leadership Meeting — Jaens Spa', tag:'Business', c:'blue', dur:'90m', imp:true},
    {t:'11:00', n:'Review Closing Juli bersama CFO', tag:'Business', c:'blue', dur:'60m'},
    {t:'13:00', n:'Deep Work — Review kontrak', tag:'Focus', c:'gold', dur:'90m'},
    {t:'14:00', n:'BNI Company Visit', tag:'Networking', c:'orange', dur:'120m', imp:true},
    {t:'17:00', n:'Personal Time & Recovery', tag:'Personal', c:'teal', dur:'60m'},
    {t:'19:30', n:'Family Dinner', tag:'Family', c:'pink', dur:'90m'}
  ],

  priorities:[
    {id:'t1', n:'Putuskan langkah Outlet Bisma', s:'Jaens Spa · margin 8,6% vs grup 27,9%', p:'Critical', c:'red', ctx:'Bisma sudah untung bulanan Rp 43 Jt sejak Juni, tapi akumulasi rugi tahun berjalan masih Rp 1,05 M dan aset tetapnya Rp 10,27 M. Butuh keputusan percepatan ramp-up.'},
    {id:'t2', n:'Persiapan BNI Company Visit', s:'Networking · 14:00', p:'High', c:'orange', ctx:'Bawa angka Juli: revenue Rp 3,45 M, laba Rp 1,31 M, ekuitas Rp 17,46 M. Ini posisi tawar terkuat tahun ini.'},
    {id:'t3', n:'Tagih piutang Rp 941 Jt', s:'Finance · naik 3 bulan berturut', p:'High', c:'orange', ctx:'Piutang terbesar ada di Jaens Essences (Rp 501 Jt) dan J\'Fresh Laundry (Rp 218 Jt).'},
    {id:'t4', n:'Masukkan Academy & Pondok Impian ke konsolidasi', s:'Finance · minggu ini', p:'Medium', c:'green', ctx:'Dua unit ini tidak terbaca di laporan grup sepanjang 2026.'},
    {id:'t5', n:'Review Content Plan September', s:'Brand & Personal · minggu ini', p:'Medium', c:'green', ctx:'8 konten pilar Leadership & Jaens Journey.'}
  ],

  decisions:[
    {id:'d1', n:'Langkah percepatan Outlet Bisma', unit:'Jaens Spa', type:'Business', due:'Minggu ini', impact:'Rp 10,3 M aset', risk:'High', c:'red',
     ctx:'Bisma buka Mei 2026. Revenue stabil di ±Rp 0,5 M/bulan tetapi turun 2,4% di Juli, margin 8,6% (grup 27,9%), dan akumulasi rugi tahun berjalan Rp 1,05 M. Aset tetapnya Rp 10,27 M dengan liabilitas lancar Rp 3,47 M — beban terbesar di grup.',
     opts:['Suntik program pemasaran 3 bulan untuk kejar okupansi','Reposisi segmen ke paket retreat & korporat','Tahan investasi, jalankan apa adanya sampai Q4'],
     rec:'Suntik pemasaran 3 bulan — revenue sudah terbukti stabil, yang kurang adalah volume. Menahan investasi memperpanjang periode akumulasi rugi.', owner:'Aji Jaens + COO'},
    {id:'d2', n:'Penanganan piutang Rp 941 Jt', unit:'Grup', type:'Business', due:'3 hari', impact:'Rp 941 Jt', risk:'Medium', c:'orange',
     ctx:'Piutang naik dari Rp 0,44 M (April) ke Rp 0,94 M (Juli). Jaens Essences menyumbang Rp 501 Jt dan J\'Fresh Laundry Rp 218 Jt — keduanya klien korporat/B2B.',
     opts:['Tetapkan termin 30 hari + denda keterlambatan','Hentikan layanan untuk klien lewat 60 hari','Faktoring piutang ke bank'],
     rec:'Termin 30 hari + denda — kas grup sedang kuat, jadi belum perlu faktoring yang mahal.', owner:'CFO'},
    {id:'d3', n:'Konsolidasi Academy & Pondok Impian', unit:'Jaens Enterprises', type:'Business', due:'1 minggu', impact:'Visibilitas grup', risk:'Low', c:'blue',
     ctx:'Dua unit ini tidak muncul di laporan konsolidasi 2026, sehingga kinerja grup yang Anda lihat belum lengkap.',
     opts:['Konsolidasi penuh mulai September 2026','Konsolidasi mulai Januari 2027','Tetap terpisah'],
     rec:'Konsolidasi penuh mulai September — visibilitas grup lebih penting daripada kerapian historis.', owner:'CFO'},
    {id:'d4', n:'Status pembukuan Care Estate', unit:'Care Estate', type:'Business', due:'1 minggu', impact:'—', risk:'Medium', c:'yellow',
     ctx:'Care Estate punya kolom di P&L dan Balance Sheet konsolidasi tetapi nol sepanjang Januari–Juli 2026, padahal proyeknya berjalan.',
     opts:['Aktifkan pembukuan terpisah Care Estate mulai Agustus','Gabungkan ke Management sementara','Audit dulu transaksi yang ada'],
     rec:'Aktifkan pembukuan terpisah mulai Agustus — proyek sebesar ini tidak boleh tak terbaca.', owner:'CFO + Aji'},
    {id:'d5', n:'Pemanfaatan kas Rp 3,22 M', unit:'Jaens Enterprises', type:'Business', due:'2 minggu', impact:'Rp 3,22 M', risk:'Medium', c:'orange',
     ctx:'Kas naik 22,5% dalam sebulan ke Rp 3,22 M — tertinggi tahun ini. Aturan Anda: cash buffer minimal 3 bulan biaya grup sebelum ekspansi.',
     opts:['Percepat ramp-up Bisma','Tahan sebagai buffer sampai Q4','Lunasi sebagian liabilitas lancar Rp 3,99 M'],
     rec:'Bagi dua: sebagian untuk pemasaran Bisma, sisanya tahan sebagai buffer. Liabilitas lancar mayoritas melekat di Bisma dan berjangka panjang secara substansi.', owner:'Aji Jaens + CFO'}
  ],

  followups:[
    {pid:'p_ketut', why:'Closing Juli & rencana konsolidasi Academy', ch:'Call'},
    {pid:'p_fitri', why:'Konfirmasi agenda company visit hari ini', ch:'WhatsApp'},
    {pid:'p_bruce', why:'Proposal belum dikirim — 21 hari tanpa kontak', ch:'Email'},
    {pid:'p_made', why:'Menunggu kepastian lahan fase 2', ch:'WhatsApp'}
  ],

  insights:[
    {id:'i1', t:'Juli 2026 adalah bulan terbaik tahun ini: laba Rp 1,31 M (+22,5%) dan kas Rp 3,22 M (+22,5%). Ini momen terkuat untuk bicara dengan bank dan investor.', c:'green', why:'Data asli Finance Drive, Juli 2026.',
     acts:['Bawa angka Juli ke BNI Company Visit','Kirim proposal ke Mr. Bruce hari ini']},
    {id:'i2', t:'Outlet Bisma menahan margin grup: 8,6% vs 27,9%, dengan aset tetap Rp 10,27 M dan akumulasi rugi Rp 1,05 M.', c:'red', why:'Buka Mei 2026, revenue turun 2,4% di Juli.',
     acts:['Putuskan program percepatan Bisma','Minta analisis okupansi ke COO']},
    {id:'i3', t:'Piutang naik dua kali lipat sejak April — dari Rp 0,44 M ke Rp 0,94 M. Kas naik, tapi sebagian pertumbuhan masih tertahan di tagihan.', c:'orange', why:'Terbesar: Jaens Essences Rp 501 Jt, J\'Fresh Rp 218 Jt.',
     acts:['Tetapkan termin 30 hari','Review daftar klien lewat tempo']},
    {id:'i4', t:'Jaens Essences turun 20% MoM dan hanya menyisakan kas Rp 29 Jt di unit — unit terkecil dengan bantalan paling tipis.', c:'orange', why:'Revenue Rp 193 Jt di Juli vs Rp 242 Jt di Juni.',
     acts:['Minta rencana pemulihan produksi','Pertimbangkan transfer kas dari HQ']},
    {id:'i5', t:'Jaens Academy dan Pondok Impian tidak muncul sama sekali di laporan konsolidasi 2026 — Anda memimpin dua unit yang tidak terbaca datanya.', c:'purple', why:'Tidak ada kolomnya di P&L maupun Balance Sheet.',
     acts:['Putuskan konsolidasi mulai September','Minta CFO siapkan mapping akun']}
  ],

  notifications:[
    {lv:'Critical', c:'red', area:'Business', t:'Bisma: akumulasi rugi tahun berjalan Rp 1,05 M', s:'Margin 8,6% vs grup 27,9%'},
    {lv:'Critical', c:'red', area:'Finance', t:'Piutang grup Rp 941 Jt — naik 2x sejak April', s:'Essences Rp 501 Jt · Laundry Rp 218 Jt'},
    {lv:'Important', c:'orange', area:'Finance', t:'Jaens Essences turun 20% MoM', s:'Kas unit tinggal Rp 29 Jt'},
    {lv:'Important', c:'orange', area:'Network', t:'BNI Company Visit dimulai 14:00', s:'Ibu Fitriani + 4 tamu'},
    {lv:'Important', c:'orange', area:'Finance', t:'Academy & Pondok Impian di luar konsolidasi', s:'Tidak terbaca sepanjang 2026'},
    {lv:'Reminder', c:'blue', area:'Finance', t:'Closing Agustus dalam 6 hari', s:'Data Juli sudah final'},
    {lv:'Reminder', c:'blue', area:'Family', t:'Family dinner 19:30', s:'Jangan dijadwalkan ulang'},
    {lv:'FYI', c:'gray', area:'Social Movement', t:'Bali Spa Bersatu: 42 anggota baru bulan ini', s:'Total 318 anggota'}
  ],

  /* ---------- PROJECTS (demo, kecuali yang bertanda angka asli) ---------- */
  projects:[
    {id:'pr1', n:'Ramp-up Outlet Jaens Spa Bisma', cat:'Business', unit:'Jaens Spa', owner:'p_putu', st:'At Risk', prog:34, bud:'Rp 10,3 M', spent:'Rp 10,3 M', dl:'31 Des 2026', risk:'High', pr:'Critical', c:'red', ms:'Kejar margin ke 20%'},
    {id:'pr2', n:'Care Estate Fase 1 — Konstruksi', cat:'Construction', unit:'Care Estate', owner:'p_made', st:'On Track', prog:42, bud:'Rp 8,4 M', spent:'Rp 3,5 M', dl:'30 Jun 2027', risk:'Medium', pr:'Critical', c:'blue', ms:'Struktur blok A selesai'},
    {id:'pr3', n:'Pemulihan produksi Jaens Essences', cat:'Business', unit:'Jaens Essences', owner:'p_putu', st:'Behind', prog:22, bud:'Rp 180 Jt', spent:'Rp 41 Jt', dl:'31 Okt 2026', risk:'High', pr:'High', c:'purple', ms:'Rencana pemulihan volume'},
    {id:'pr4', n:'Program penagihan piutang grup', cat:'Business', unit:'Jaens Enterprises', owner:'p_ketut', st:'On Track', prog:15, bud:'—', spent:'—', dl:'30 Sep 2026', risk:'Medium', pr:'High', c:'orange', ms:'Termin 30 hari diberlakukan'},
    {id:'pr5', n:'Konsolidasi Academy & Pondok Impian', cat:'Business', unit:'Jaens Enterprises', owner:'p_ketut', st:'Planning', prog:8, bud:'—', spent:'—', dl:'30 Sep 2026', risk:'Low', pr:'High', c:'blue', ms:'Mapping akun'},
    {id:'pr6', n:'Kurikulum Jaens Academy v3', cat:'Business', unit:'Jaens Academy', owner:'p_putu', st:'On Track', prog:71, bud:'Rp 180 Jt', spent:'Rp 128 Jt', dl:'20 Okt 2026', risk:'Low', pr:'Medium', c:'orange', ms:'Modul praktik final review'},
    {id:'pr7', n:'Buku "Life by Design"', cat:'Brand', unit:'Personal', owner:'p_aji', st:'Behind', prog:35, bud:'Rp 150 Jt', spent:'Rp 58 Jt', dl:'1 Mei 2027', risk:'Medium', pr:'Medium', c:'pink', ms:'Bab 4 dari 12'},
    {id:'pr8', n:'Kongres Bali Spa Bersatu 2026', cat:'Social', unit:'Social Movement', owner:'p_dewi', st:'On Track', prog:55, bud:'Rp 340 Jt', spent:'Rp 96 Jt', dl:'22 Okt 2026', risk:'Low', pr:'High', c:'teal', ms:'Konfirmasi venue & sponsor'},
    {id:'pr9', n:'Pondok Impian — Villa 3', cat:'Investment', unit:'Jaens Pondok Impian', owner:'p_komang', st:'Planning', prog:8, bud:'Rp 2,1 M', spent:'Rp 84 Jt', dl:'1 Sep 2027', risk:'Medium', pr:'Low', c:'green', ms:'Studi kelayakan'},
    {id:'pr10',n:'Sistem POS terintegrasi 4 outlet', cat:'Business', unit:'Jaens Spa', owner:'p_putu', st:'On Track', prog:78, bud:'Rp 210 Jt', spent:'Rp 164 Jt', dl:'30 Sep 2026', risk:'Low', pr:'High', c:'blue', ms:'Migrasi data outlet Triloka'},
    {id:'pr11',n:'Beasiswa Terapis Muda Bali', cat:'Social', unit:'Social Movement', owner:'p_dewi', st:'On Track', prog:48, bud:'Rp 220 Jt', spent:'Rp 104 Jt', dl:'31 Des 2026', risk:'Low', pr:'Medium', c:'orange', ms:'Angkatan 3 — 40 peserta'},
    {id:'pr12',n:'Medical check-up & program kebugaran', cat:'Personal', unit:'Personal', owner:'p_ayu', st:'Planning', prog:15, bud:'Rp 45 Jt', spent:'Rp 0', dl:'30 Sep 2026', risk:'Low', pr:'Medium', c:'green', ms:'Jadwalkan dengan dr. Ayu'}
  ],

  /* ---------- KNOWLEDGE (demo + dokumen Finance Drive asli) ---------- */
  knowledge:[
    {id:'k1', t:'PROFIT & LOSS CONSOLIDATION REPORT JAENS ENTERPRISES 2026', cat:'Finance', type:'Report', d:'21 Agu 2026', c:'green', by:'Finance Drive', ex:'P&L per unit per bulan, Januari–Juli 2026. Sumber resmi angka revenue dan laba di Aji OS.', live:true},
    {id:'k2', t:'BALANCE SHEET CONSOLIDATION REPORT JAENS ENTERPRISES 2026', cat:'Finance', type:'Report', d:'21 Agu 2026', c:'green', by:'Finance Drive', ex:'Neraca per unit per bulan. Sumber angka kas, piutang, aset, dan ekuitas di Aji OS.', live:true},
    {id:'k3', t:'LIST PAYMENT DAN CASH FLOW DAILY REPORT JAENS 2024–2026', cat:'Finance', type:'Report', d:'25 Agu 2026', c:'orange', by:'Finance Drive', ex:'Cash flow harian. Data berhenti di Mei 2026 — belum bisa dipakai untuk posisi kas terkini.', live:true},
    {id:'k4', t:'Notulen Leadership Meeting Jaens Spa — Agustus', cat:'Business', type:'Meeting', d:'3 hari lalu', c:'blue', by:'COO', ex:'Fokus: ramp-up Bisma, retensi terapis, migrasi POS.'},
    {id:'k5', t:'Prinsip Kepemimpinan Aji — v2', cat:'Leadership', type:'Reflection', d:'2 minggu lalu', c:'gold', by:'Aji', ex:'10 prinsip. Inti: keputusan lambat lebih mahal daripada keputusan salah yang cepat diperbaiki.'},
    {id:'k6', t:'Riset Pasar Wellness Bali 2026', cat:'Business', type:'Research', d:'1 bulan lalu', c:'teal', by:'Tim Riset', ex:'Segmen retreat tumbuh 24% YoY. Sanur naik sebagai hub wellness baru.'},
    {id:'k7', t:'SOP Standar Layanan Terapis v4', cat:'Business', type:'SOP', d:'2 bulan lalu', c:'purple', by:'Academy', ex:'Standar 7 langkah layanan + protokol kebersihan.'},
    {id:'k8', t:'Catatan Buku: The Almanack of Naval Ravikant', cat:'Books', type:'Book', d:'3 minggu lalu', c:'purple', by:'Aji', ex:'Leverage: modal, tenaga kerja, produk tanpa biaya marginal.'},
    {id:'k9', t:'Refleksi Pribadi — Menyeimbangkan Skala & Keluarga', cat:'Personal', type:'Reflection', d:'1 minggu lalu', c:'pink', by:'Aji', ex:'Pertumbuhan bisnis tidak boleh dibayar dengan absennya kehadiran di rumah.'},
    {id:'k10',t:'Manifesto Bali Spa Bersatu', cat:'Social Movement', type:'Document', d:'4 bulan lalu', c:'orange', by:'Aji + Sekjen', ex:'Standar, martabat, dan kesejahteraan pekerja spa Bali.'},
    {id:'k11',t:'Rencana Konten Personal Brand Q4', cat:'Business', type:'Plan', d:'5 hari lalu', c:'pink', by:'Tim Konten', ex:'8 pilar konten, 3 posting/minggu, fokus Jaens Journey.'},
    {id:'k12',t:'Itinerary & Kontak Trip Jakarta', cat:'Travel', type:'Document', d:'2 hari lalu', c:'blue', by:'Travel Admin', ex:'3 hari, 6 meeting, hotel SCBD.'},
    {id:'k13',t:'Aturan Investasi Pribadi Aji', cat:'Finance', type:'Principle', d:'3 bulan lalu', c:'green', by:'Aji', ex:'Maksimal 20% net worth di aset non-likuid baru per tahun.'},
    {id:'k14',t:'Program Latihan & Pemulihan 2026', cat:'Wellbeing', type:'Plan', d:'6 minggu lalu', c:'green', by:'Aji', ex:'4x/minggu strength + mobility, 1x long walk.'}
  ],
  kCats:['Inbox','Personal','Business','Finance','Leadership','Wellbeing','Family','Travel','Networking','Social Movement','Projects','Learning','Books','AI Research','Archive'],

  /* ---------- WELLBEING (demo) ---------- */
  well:{ score:82, sleep:7.1, sleepQ:4, energy:4, stress:2, mood:4, weight:74.2, exercise:4, focus:78,
    trend:[76,79,74,81,83,80,82], sleepTrend:[6.4,7.2,6.8,7.6,7.0,7.4,7.1],
    log:[
      {d:'Hari ini', f:'Good', e:4, s:2, m:4, sl:7.1, note:'Bangun sebelum alarm. Dharma pagi lancar.'},
      {d:'Kemarin', f:'Excellent', e:5, s:2, m:5, sl:7.4, note:'Latihan pagi + waktu keluarga malam.'},
      {d:'2 hari lalu', f:'Normal', e:3, s:3, m:3, sl:7.0, note:'Meeting padat, makan siang terlambat.'},
      {d:'3 hari lalu', f:'Good', e:4, s:2, m:4, sl:7.6, note:'Tidur cukup, energi stabil.'}
    ]},

  /* ---------- FINANCE — ANGKA ASLI JULI 2026 ---------- */
  fin:{
    cash:3.223, cashGr:22.5,
    rev:3.449, revGr:5.4,            /* setelah eliminasi */
    revGross:4.351,                  /* sebelum eliminasi */
    profit:1.309, profitGr:22.5, netMargin:37.9,
    gp:3.305, gpMargin:76.0,
    ar:.941, ap:.999,
    curLiab:3.994, ltLiab:2.323, totLiab:6.317,
    assets:23.778, curAssets:4.876, fixAssets:15.679, inventory:1.089,
    equity:17.461,
    ytdRev:20.28, ytdProfit:5.46,
    revTrend:[2.444,2.444,2.126,2.922,3.627,3.274,3.449],
    revGrossTrend:[2.808,2.775,2.423,3.305,4.165,4.223,4.351],
    cashTrend:[2.459,2.385,1.655,1.563,2.154,2.631,3.223],
    profitTrend:[.423,.522,.046,.952,1.142,1.069,1.309],
    equityTrend:[9.18,8.88,8.91,8.91,15.96,16.61,17.46],
    assetBreak:[
      {n:'Aset tetap (net)', v:15.679, c:'blue'},
      {n:'Kas & bank', v:3.223, c:'green'},
      {n:'Persediaan', v:1.089, c:'purple'},
      {n:'Piutang usaha', v:.941, c:'orange'},
      {n:'Aset lancar lain', v:2.846, c:'gray'}
    ],
    liabBreak:[
      {n:'Liabilitas lancar', v:3.994, c:'red'},
      {n:'Liabilitas jangka panjang', v:2.323, c:'orange'}
    ],
    cashByUnit:[
      {n:'Center Ubud', v:1.043, c:'teal'},{n:'Triloka', v:.940, c:'teal'},
      {n:"J'Fresh Laundry", v:.549, c:'blue'},{n:'Shanti', v:.442, c:'teal'},
      {n:'Bisma', v:.219, c:'orange'},{n:'Jaens Essences', v:.029, c:'purple'}
    ]
  },

  /* ---------- TRAVEL (demo) ---------- */
  trips:[
    {id:'tr1', dest:'Jakarta', country:'Indonesia', type:'Business', in:3, dep:'28 Agu 2026', ret:'30 Agu 2026', c:'blue',
     hotel:'Hotel SCBD Residence', flight:'GA 407 · 07:10 DPS–CGK', comp:'CFO', budget:'Rp 42 Jt', wx:'32°C berawan',
     purpose:'Pertemuan investor & bank dengan bekal angka Juli 2026', meetings:['p_bruce','p_fitri','p_ratna'],
     itin:[{d:'Hari 1',x:'Tiba 09:40 · Meeting BNI Pusat 13:00 · Dinner Ibu Ratna'},{d:'Hari 2',x:'Halloran Capital 10:00 · Site visit mitra 15:00'},{d:'Hari 3',x:'Forum asosiasi 09:00 · Kembali 17:20'}]},
    {id:'tr2', dest:'Singapore', country:'Singapura', type:'Conference', in:34, dep:'28 Sep 2026', ret:'1 Okt 2026', c:'teal',
     hotel:'Marina Bay Area', flight:'SQ 939 · 11:20 DPS–SIN', comp:'Solo', budget:'Rp 68 Jt', wx:'31°C hujan ringan',
     purpose:'Asia Wellness Expo + diskusi distribusi Jaens Essences', meetings:['p_chen'],
     itin:[{d:'Hari 1',x:'Expo opening'},{d:'Hari 2',x:'Meeting Lotus Wellness'},{d:'Hari 3',x:'Panel & networking'},{d:'Hari 4',x:'Kembali'}]},
    {id:'tr3', dest:'Tokyo', country:'Jepang', type:'Family', in:56, dep:'20 Okt 2026', ret:'27 Okt 2026', c:'pink',
     hotel:'Shinjuku', flight:'JL 720 · 23:55 DPS–HND', comp:'Keluarga (4 orang)', budget:'Rp 210 Jt', wx:'18°C sejuk',
     purpose:'Liburan keluarga tahunan', meetings:[],
     itin:[{d:'Hari 1–3',x:'Tokyo'},{d:'Hari 4–5',x:'Hakone'},{d:'Hari 6–7',x:'Kyoto & pulang'}]},
    {id:'tr4', dest:'Melbourne', country:'Australia', type:'Business', in:98, dep:'1 Des 2026', ret:'5 Des 2026', c:'blue',
     hotel:'CBD', flight:'JQ 38 · 22:40 DPS–MEL', comp:'COO', budget:'Rp 96 Jt', wx:'22°C cerah',
     purpose:'Kemitraan retreat Whitfield', meetings:['p_james'], itin:[{d:'Hari 1–4',x:'Meeting & site visit'}]}
  ],

  /* ---------- SOCIAL MOVEMENT (demo) ---------- */
  social:[
    {id:'s1', n:'Bali Spa Bersatu', c:'orange', role:'Founder & Ketua Pembina', st:'Aktif', members:318,
     d:'Gerakan menyatukan pelaku spa Bali: standar layanan, martabat profesi, dan kesejahteraan terapis.',
     kpi:{impact:1840, trained:420, jobs:260, events:14, partners:22}},
    {id:'s2', n:'Beasiswa Terapis Muda Bali', c:'green', role:'Penggagas', st:'Angkatan 3', members:40,
     d:'Beasiswa pelatihan penuh untuk pemuda desa agar masuk industri wellness dengan sertifikasi.',
     kpi:{impact:120, trained:120, jobs:96, events:6, partners:8}},
    {id:'s3', n:'Wellness Village Program', c:'teal', role:'Inisiator', st:'Pilot 2 desa', members:64,
     d:'Membangun ekosistem wellness berbasis desa: pelatihan, produk lokal, dan rantai pasok.',
     kpi:{impact:310, trained:64, jobs:38, events:5, partners:6}},
    {id:'s4', n:'Forum Bisnis HIPMI Bali', c:'yellow', role:'Pembicara tetap', st:'Berjalan', members:0,
     d:'Berbagi praktik membangun bisnis wellness yang berkelanjutan kepada pengusaha muda.',
     kpi:{impact:180, trained:0, jobs:0, events:9, partners:4}}
  ],

  /* ---------- BRAND & PERSONAL (demo) ---------- */
  pillars:['Leadership','Entrepreneurship','Wellness','Business Lessons','Jaens Journey','Family','Social Impact','Travel','Reflection','Bali'],
  content:[
    {id:'c1', t:'Kenapa saya berhenti mengejar cabang ke-5', pil:'Business Lessons', st:'Published', ch:'LinkedIn', reach:'34,2K', eng:'8,1%', c:'green'},
    {id:'c2', t:'Pagi seorang founder di Ubud', pil:'Jaens Journey', st:'Published', ch:'Instagram', reach:'52,7K', eng:'6,4%', c:'green'},
    {id:'c3', t:'Life by Design — Bab 4: Sistem, bukan disiplin', pil:'Reflection', st:'Draft', ch:'Buku', reach:'—', eng:'—', c:'gray'},
    {id:'c4', t:'Standar profesi terapis: apa yang harus berubah', pil:'Social Impact', st:'Review', ch:'LinkedIn', reach:'—', eng:'—', c:'orange'},
    {id:'c5', t:'3 keputusan yang menyelamatkan bisnis saya', pil:'Leadership', st:'Scheduled', ch:'YouTube', reach:'—', eng:'—', c:'blue'},
    {id:'c6', t:'Cara saya menjaga energi di jadwal padat', pil:'Wellness', st:'Idea', ch:'Instagram', reach:'—', eng:'—', c:'yellow'},
    {id:'c7', t:'Bali bukan hanya destinasi, tapi cara hidup', pil:'Bali', st:'Design', ch:'Instagram', reach:'—', eng:'—', c:'purple'},
    {id:'c8', t:'Yang tidak dilihat orang dari pertumbuhan cepat', pil:'Entrepreneurship', st:'Published', ch:'LinkedIn', reach:'28,9K', eng:'7,2%', c:'green'}
  ],
  brandKpi:{reach:'125K', followers:'48,6K', eng:'6,8%', leads:34, sentiment:'92% positif', speaking:7, media:12},

  /* ---------- OPERATIONS (health = net margin asli Juli 2026) ---------- */
  ops:[
    {n:'Jaens Spa Triloka', unit:'Jaens Spa', health:36, issues:1, sla:94, tasks:14, comp:2, c:'green', live:true},
    {n:'Jaens Spa Center Ubud', unit:'Jaens Spa', health:31, issues:0, sla:98, tasks:12, comp:1, c:'green', live:true},
    {n:'Jaens Spa Shanti', unit:'Jaens Spa', health:23, issues:1, sla:96, tasks:9, comp:2, c:'blue', live:true},
    {n:'Jaens Spa Bisma', unit:'Jaens Spa', health:9, issues:3, sla:88, tasks:18, comp:5, c:'red', live:true},
    {n:"J'Fresh Laundry — Ubud", unit:"J'Fresh Laundry", health:66, issues:2, sla:91, tasks:11, comp:3, c:'green', live:true},
    {n:'Produksi Essences — Gianyar', unit:'Jaens Essences', health:35, issues:2, sla:93, tasks:7, comp:0, c:'orange', live:true},
    {n:'Management / HQ', unit:'Management', health:12, issues:1, sla:95, tasks:8, comp:0, c:'blue', live:true}
  ],
  opsIssues:[
    {t:'Bisma: margin 8,6% dan akumulasi rugi Rp 1,05 M', o:'Jaens Spa Bisma', lv:'Critical', c:'red', age:'Sejak Mei 2026'},
    {t:'Piutang Jaens Essences Rp 501 Jt', o:'Produksi Essences', lv:'Critical', c:'red', age:'Naik 3 bulan'},
    {t:'Revenue Essences turun 20% MoM', o:'Produksi Essences', lv:'Important', c:'orange', age:'1 bulan'},
    {t:"J'Fresh Laundry turun 2 bulan berturut dari puncak Mei", o:"J'Fresh Laundry", lv:'Important', c:'orange', age:'2 bulan'},
    {t:'Rotasi terapis Bisma tinggi', o:'Jaens Spa Bisma', lv:'Normal', c:'blue', age:'12 hari'}
  ],

  /* ---------- OPERATING SYSTEM ---------- */
  principles:{
    'Life Principles':['Hidup dirancang, bukan kebetulan.','Kehadiran di rumah bukan sisa waktu — itu jadwal utama.','Kesehatan adalah modal kerja pertama.','Cukup itu keputusan, bukan pencapaian.'],
    'Leadership Principles':['Keputusan lambat lebih mahal daripada keputusan salah yang cepat diperbaiki.','Bangun orang, bukan ketergantungan.','Standar dijaga oleh sistem, bukan oleh mood.','Yang tidak diukur tidak bisa dipimpin.'],
    'Decision Rules':['Di bawah Rp 50 Jt → delegasikan penuh.','Rp 50–500 Jt → COO memutuskan, Aji diberi tahu.','Di atas Rp 500 Jt → keputusan Aji dengan opsi tertulis.','Keputusan reversible diambil cepat; irreversible ditidurkan semalam.'],
    'Meeting Rules':['Tidak ada meeting tanpa agenda dan pemilik keputusan.','Maksimal 60 menit. Default 25 menit.','Selasa & Kamis pagi bebas meeting untuk deep work.','Setiap meeting berakhir dengan owner + deadline.'],
    'Delegation Rules':['Delegasikan hasil, bukan langkah.','Yang berulang lebih dari 3x harus jadi SOP.','Jangan ambil kembali tugas yang sudah didelegasikan tanpa membicarakannya.'],
    'Investment Rules':['Maksimal 20% net worth ke aset non-likuid baru per tahun.','Tidak berinvestasi pada bisnis yang tidak saya pahami operasionalnya.','Cash buffer minimal 3 bulan biaya grup sebelum ekspansi.'],
    'Relationship Rules':['Relasi tier A dihubungi minimal 1x per bulan.','Tidak ada permintaan tanpa memberi lebih dulu.','Janji kecil ditepati sekecil apa pun.'],
    'Personal Boundaries':['Setelah 19:00 tidak ada panggilan bisnis kecuali kritikal.','Minggu adalah hari keluarga.','Tidak ada keputusan besar saat lelah.']
  },
  decisionLog:[
    {d:'Mei 2026', n:'Membuka Outlet Jaens Spa Bisma', ch:'Approve', why:'Menambah kapasitas di lokasi strategis Ubud.', res:'Revenue +Rp 0,5 M/bln, tapi akumulasi rugi Rp 1,05 M', c:'orange'},
    {d:'18 Agu 2026', n:'Menunda pembukaan outlet ke-5 ke 2027', ch:'Tunda', why:'Cash buffer & kualitas terapis lebih penting daripada kecepatan ekspansi.', res:'Positif — retensi terapis naik 6%', c:'green'},
    {d:'2 Agu 2026', n:'Migrasi POS terintegrasi 4 outlet', ch:'Approve', why:'Data outlet tidak terbaca real-time, keputusan selalu telat 2 minggu.', res:'Berjalan — 78%', c:'blue'},
    {d:'21 Jul 2026', n:'Menaikkan standar upah terapis 12%', ch:'Approve', why:'Turnover 21% terlalu mahal dibanding kenaikan biaya.', res:'Positif — turnover turun ke 14%', c:'green'},
    {d:'9 Jul 2026', n:'Menolak tawaran akuisisi 30% Jaens Spa', ch:'Tolak', why:'Valuasi di bawah proyeksi 3 tahun & kehilangan kendali standar.', res:'Ditinjau ulang Q1 2027', c:'gold'}
  ],
  rhythm:{
    Morning:['Morning Dharma & refleksi','Cek kalender & 3 prioritas','Business pulse (revenue, kas, margin)','Latihan fisik'],
    Midday:['Review keputusan yang menggantung','Delegasi & follow up orang','Deep work block'],
    Evening:['Review CEO/CFO singkat','Refleksi harian & jurnal','Waktu keluarga tanpa layar']
  },
  lifeScore:[
    {n:'Wellbeing', v:82, c:'green'},{n:'Family', v:74, c:'pink'},{n:'Business', v:86, c:'gold'},
    {n:'Finance', v:88, c:'green'},{n:'Network', v:76, c:'teal'},{n:'Social Impact', v:89, c:'orange'},
    {n:'Growth', v:80, c:'purple'},{n:'Brand', v:78, c:'pink'},{n:'Travel', v:71, c:'blue'},{n:'Recovery', v:68, c:'teal'}
  ],
  roles:['Aji Jaens — Super Owner','Executive Assistant','Personal Assistant','CEO Office','CFO','COO','CMO','HRD','Content Team','Travel Admin','Social Movement Team','Family Admin','System Admin'],
  sources:[
    {n:'Google Drive — Finance Drive', st:'Tersambung · sync 25 Agu 2026', c:'green'},
    {n:'P&L Consolidation 2026', st:'Terbaca · Jan–Jul', c:'green'},
    {n:'Balance Sheet Consolidation 2026', st:'Terbaca · Jan–Jul', c:'green'},
    {n:'Cash Flow Daily Report', st:'Terbaca · berhenti Mei 2026', c:'orange'},
    {n:'Spreadsheet COO — P&L Outlet', st:'Belum disambungkan', c:'orange'},
    {n:'Google Calendar', st:'Belum disambungkan', c:'orange'},
    {n:'Gmail', st:'Belum disambungkan', c:'orange'},
    {n:'WhatsApp Business', st:'Belum disambungkan', c:'orange'},
    {n:'POS Jaens Spa', st:'Direncanakan', c:'gray'},
    {n:'Care Estate OS', st:'Direncanakan', c:'gray'}
  ],
  /* ---------- PHASE 1C: AJI CORE INTELLIGENCE ---------- */
  coreMeta:{ started:'26 Agu 2026', sessions:2, domainsTotal:21, domainsFilled:4 },
  core:[
    {id:'CORE-000001', dom:'Decision Framework', sub:'decision_speed',
     st:'Menunggu sampai datanya cukup sebelum memutuskan. Tidak nyaman memutuskan di atas asumsi — lebih baik telat sedikit daripada salah arah.',
     type:'USER_STATEMENT', conf:'CONFIRMED', src:'Wawancara 1C sesi 1', from:'26 Agu 2026', until:'—', priv:'AJI_ONLY', pri:'High'},
    {id:'CORE-000002', dom:'Decision Framework', sub:'data_preference',
     st:'Angka dan laporan adalah sandaran utama keputusan besar. Keputusan berdiri di atas data yang bisa ditelusuri; kalau angkanya tidak ada, keputusannya ditunda.',
     type:'USER_STATEMENT', conf:'CONFIRMED', src:'Wawancara 1C sesi 1', from:'26 Agu 2026', until:'—', priv:'AJI_ONLY', pri:'High'},
    {id:'CORE-000003', dom:'Risk Appetite', sub:'risk_preference',
     st:'Konservatif. Prioritas melindungi apa yang sudah dibangun sebelum menambah yang baru.',
     type:'USER_STATEMENT', conf:'CONFIRMED', src:'Wawancara 1C sesi 1', from:'26 Agu 2026', until:'—', priv:'AJI_ONLY', pri:'High'},
    {id:'CORE-000004', dom:'Decision Framework', sub:'delegation_style',
     st:'Cek berkala di titik tertentu. Menetapkan beberapa checkpoint; di luar itu orangnya jalan sendiri.',
     type:'USER_STATEMENT', conf:'CONFIRMED', src:'Wawancara 1C sesi 1', from:'26 Agu 2026', until:'—', priv:'AJI_ONLY', pri:'Medium'},
    {id:'CORE-000005', dom:'Values', sub:'non_negotiable',
     st:'Kesehatan diri adalah yang tidak boleh dikorbankan. Tanpa badan yang sehat semuanya berhenti — ini modal kerja pertama.',
     type:'USER_STATEMENT', conf:'CONFIRMED', src:'Wawancara 1C sesi 2', from:'26 Agu 2026', until:'—', priv:'AJI_ONLY', pri:'High'},
    {id:'CORE-000006', dom:'Values', sub:'anti_behavior',
     st:'Yang paling cepat menghilangkan hormat saya pada seseorang: menutupi kesalahan. Salah itu wajar — menyembunyikannya yang tidak bisa dimaafkan.',
     type:'USER_STATEMENT', conf:'CONFIRMED', src:'Wawancara 1C sesi 2', from:'26 Agu 2026', until:'—', priv:'AJI_ONLY', pri:'High'},
    {id:'CORE-000007', dom:'Leadership Philosophy', sub:'underperformance_response',
     st:'Kalau orang kunci kinerjanya turun terus: bicara langsung, gali akar masalahnya dulu sebelum menilai.',
     type:'USER_STATEMENT', conf:'CONFIRMED', src:'Wawancara 1C sesi 2', from:'26 Agu 2026', until:'—', priv:'AJI_ONLY', pri:'High'},
    {id:'CORE-000008', dom:'Risk Appetite', sub:'rule_vs_position',
     st:'Posisi Bisma memang kelewatan. Aturan maksimal 20% net worth ke aset non-likuid baru per tahun tetap benar — posisinya yang salah dan perlu dikoreksi ke depan.',
     type:'USER_STATEMENT', conf:'CONFIRMED', src:'Wawancara 1C sesi 2 — mengonfirmasi OBS-000001', from:'26 Agu 2026', until:'—', priv:'AJI_ONLY', pri:'High'}
  ],
  coreObs:[
    {id:'OBS-000002', dom:'Decision Framework', type:'AI_INFERENCE', conf:'MEDIUM',
     st:'Preferensi "tunggu sampai data cukup" berpotensi bertabrakan dengan keputusan Bisma yang menggantung sejak Mei — akumulasi rugi bertambah setiap bulan sementara datanya sudah tersedia sejak Juli.',
     basis:'Inferensi dari jawaban wawancara + status keputusan DEC-000001. Bukan fakta.', act:'Butuh konfirmasi: apakah yang kurang memang data, atau ada pertimbangan lain?'},
    {id:'OBS-000003', dom:'Risk Appetite', type:'AI_INFERENCE', conf:'MEDIUM',
     st:'Konsekuensi aritmetis dari CORE-000008: supaya Bisma turun ke bawah 20%, ekuitas grup perlu mencapai ±Rp 51,4 M — hampir tiga kali posisi sekarang. Jalan lain: tidak menambah aset non-likuid baru sampai rasionya pulih.',
     basis:'Rp 10,27 M ÷ 20% = Rp 51,35 M. Inferensi, bukan aturan yang Anda nyatakan.', act:'Perlu keputusan: jadikan aturan operasional "tidak ada capex non-likuid baru sampai rasio pulih"?'},
    {id:'OBS-000004', dom:'Values', type:'OBSERVATION', conf:'LOW',
     st:'Kesehatan diri Anda tetapkan sebagai hal yang tidak boleh dikorbankan, tetapi modul Wellbeing seluruhnya masih data contoh — sistem belum bisa memeriksa apakah prinsip ini benar-benar terjaga.',
     basis:'Batch DUMMY-2026-08-25-003. Tidak ada data nyata untuk diperiksa.', act:'Menyarankan health tracker jadi integrasi prioritas, bukan yang terakhir.'}
  ],
  coreDomains:['Identity','Values','Beliefs','Life Philosophy','Leadership Philosophy','Business Philosophy','Family Philosophy','Financial Philosophy','Learning Philosophy','Communication Style','Decision Framework','Risk Appetite','Priority Rules','Relationship Principles','Personal Brand Voice','Personal Narrative','Goals','Vision','Legacy','Current Focus','Lessons Learned'],

  /* ---------- PHASE 1A: PRIVACY, INBOX, ALERTS, AUDIT, GOVERNANCE ---------- */
  privacyLevels:[
    {k:'AJI_ONLY', d:'Hanya Aji', c:'red'},
    {k:'PRIVATE', d:'Terbatas pemilik record', c:'red'},
    {k:'AJI_AND_SPOUSE', d:'Aji + pasangan', c:'pink'},
    {k:'FAMILY', d:'Keluarga inti', c:'pink'},
    {k:'EXECUTIVE', d:'Jajaran eksekutif', c:'gold'},
    {k:'BUSINESS_UNIT', d:'Terbatas unit usaha terkait', c:'blue'},
    {k:'TEAM', d:'Tim internal', c:'blue'},
    {k:'PUBLIC', d:'Boleh dilihat siapa pun', c:'gray'},
    {k:'SYSTEM_ONLY', d:'Hanya sistem & admin', c:'purple'}
  ],

  waitingFor:[
    {id:'w1', what:'Proposal investasi fase 2', who:'p_bruce', since:'21 hari', due:'Lewat tempo', c:'red'},
    {id:'w2', what:'Analisis okupansi & bauran layanan Bisma', who:'p_putu', since:'6 hari', due:'2 hari lagi', c:'orange'},
    {id:'w3', what:'Mapping akun Academy & Pondok Impian', who:'p_ketut', since:'3 hari', due:'Minggu ini', c:'blue'},
    {id:'w4', what:'Kepastian lahan fase 2 Care Estate', who:'p_made', since:'12 hari', due:'Belum ada', c:'orange'},
    {id:'w5', what:'Klausul penalti kontrak', who:'p_ratna', since:'2 hari', due:'Besok', c:'blue'}
  ],

  alerts:{
    business:[
      {t:'Bisma margin 8,6% vs grup 27,9%', s:'Akumulasi rugi Rp 1,05 M sejak Mei', lv:'Critical', c:'red', go:'business'},
      {t:'Jaens Essences turun 20% MoM', s:'Rp 242 Jt → Rp 193 Jt', lv:'Important', c:'orange', go:'business'},
      {t:"J'Fresh turun 2 bulan berturut", s:'Dari puncak Rp 405 Jt di Mei', lv:'Normal', c:'blue', go:'business'}
    ],
    money:[
      {t:'Piutang Rp 941 Jt — naik 2x sejak April', s:'Essences Rp 501 Jt · Laundry Rp 218 Jt', lv:'Critical', c:'red', go:'finance'},
      {t:'Cash buffer 1,6 bulan', s:'Aturan Anda minimal 3 bulan', lv:'Important', c:'orange', go:'finance'},
      {t:'Kas Rp 3,22 M — tertinggi tahun ini', s:'Naik 22,5% dari Juni', lv:'FYI', c:'green', go:'finance'}
    ],
    project:[
      {t:'Ramp-up Bisma — At Risk', s:'Progres 34% · risiko tinggi', lv:'Critical', c:'red', go:'projects'},
      {t:'Pemulihan Essences — Behind', s:'Progres 22% dari target', lv:'Important', c:'orange', go:'projects'},
      {t:'POS 4 outlet — 78%', s:'Migrasi data Triloka', lv:'FYI', c:'green', go:'projects'}
    ]
  },

  inbox:[
    {id:'in1', t:'Foto kontrak vendor renovasi Bisma', src:'Scan WhatsApp', type:'Document', st:'NEW', d:'Hari ini', c:'blue'},
    {id:'in2', t:'Ide: paket retreat korporat 3 hari', src:'Catatan suara', type:'Idea', st:'NEW', d:'Hari ini', c:'yellow'},
    {id:'in3', t:'Permintaan sponsor dari komunitas yoga Ubud', src:'Email', type:'Request', st:'REVIEW', d:'Kemarin', c:'orange'},
    {id:'in4', t:'Ringkasan AI: pola turnover terapis Bisma', src:'AI capture', type:'AI Capture', st:'REVIEW', d:'Kemarin', c:'purple'},
    {id:'in5', t:'Draft caption Jaens Journey minggu ini', src:'Tim Konten', type:'Note', st:'ROUTED', d:'2 hari lalu', c:'pink'},
    {id:'in6', t:'Invoice supplier base oil', src:'Email', type:'Document', st:'ROUTED', d:'3 hari lalu', c:'blue'},
    {id:'in7', t:'Catatan meeting BNI Juli', src:'Notulen', type:'Note', st:'ACTIONED', d:'6 minggu lalu', c:'green'}
  ],

  audit:[
    {ts:'26 Agu 16:15', user:'Aji Jaens', role:'SUPER OWNER', act:'CREATE', ent:'Governance Doc', eid:'12 — OS Configuration', st:'SUCCESS', c:'green'},
    {ts:'26 Agu 16:12', user:'Aji Jaens', role:'SUPER OWNER', act:'CREATE', ent:'Registry', eid:'01 — Data Source Registry', st:'SUCCESS', c:'green'},
    {ts:'26 Agu 16:11', user:'Aji Jaens', role:'SUPER OWNER', act:'IMPORT', ent:'System Doc', eid:'MASTER TRANSFER PACK v1.0', st:'SUCCESS', c:'green'},
    {ts:'26 Agu 01:02', user:'Aji Jaens', role:'SUPER OWNER', act:'CREATE', ent:'Drive Folder', eid:'20 folder root AJI JAENS OS', st:'SUCCESS', c:'green'},
    {ts:'26 Agu 01:01', user:'System', role:'SYSTEM', act:'PERMISSION_CHANGE', eid:'Google Drive connector → write', ent:'Integration', st:'SUCCESS', c:'blue'},
    {ts:'25 Agu 22:40', user:'Aji Jaens', role:'SUPER OWNER', act:'IMPORT', ent:'Finance Data', eid:'SRC-000001 P&L Konsolidasi 2026', st:'SUCCESS', c:'green'},
    {ts:'25 Agu 22:38', user:'Aji Jaens', role:'SUPER OWNER', act:'IMPORT', ent:'Finance Data', eid:'SRC-000002 Balance Sheet 2026', st:'SUCCESS', c:'green'},
    {ts:'25 Agu 22:30', user:'System', role:'SYSTEM', act:'AI_ACTION', ent:'Data Read', eid:'SRC-000003 Cash Flow — berhenti Mei', st:'PARTIAL', c:'orange'},
    {ts:'25 Agu 14:50', user:'Aji Jaens', role:'SUPER OWNER', act:'CREATE', ent:'Dummy Batch', eid:'DUMMY-2026-08-25-001 s.d. 010', st:'SUCCESS', c:'gray'}
  ],

  dummyBatches:[
    {id:'DUMMY-2026-08-25-001', mod:'Network', recs:16, st:'ACTIVE'},
    {id:'DUMMY-2026-08-25-002', mod:'Family', recs:10, st:'ACTIVE'},
    {id:'DUMMY-2026-08-25-003', mod:'Wellbeing', recs:11, st:'ACTIVE'},
    {id:'DUMMY-2026-08-25-004', mod:'Travel', recs:4, st:'ACTIVE'},
    {id:'DUMMY-2026-08-25-005', mod:'Social Movement', recs:4, st:'ACTIVE'},
    {id:'DUMMY-2026-08-25-006', mod:'Branding & CRM', recs:8, st:'ACTIVE'},
    {id:'DUMMY-2026-08-25-007', mod:'My Day', recs:13, st:'ACTIVE'},
    {id:'DUMMY-2026-08-25-008', mod:'Knowledge', recs:11, st:'ACTIVE'},
    {id:'DUMMY-2026-08-25-009', mod:'Projects', recs:8, st:'ACTIVE'},
    {id:'DUMMY-2026-08-25-010', mod:'Operations', recs:5, st:'ACTIVE'}
  ],

  dataSources:[
    {id:'SRC-000001', n:'P&L Consolidation 2026', type:'Google Sheet', cls:'SOURCE_REFERENCE', st:'READ_ONLY_CONNECTED', risk:'LOW', c:'green'},
    {id:'SRC-000002', n:'Balance Sheet Consolidation 2026', type:'Google Sheet', cls:'SOURCE_REFERENCE', st:'READ_ONLY_CONNECTED', risk:'LOW', c:'green'},
    {id:'SRC-000003', n:'Cash Flow Daily Report', type:'Google Sheet', cls:'SOURCE_REFERENCE', st:'NOT_USED — berhenti Mei 2026', risk:'MEDIUM', c:'orange'},
    {id:'SRC-000004', n:'Recheck Transaksi Neraca', type:'Google Sheet', cls:'SOURCE_REFERENCE', st:'NOT_READ', risk:'LOW', c:'gray'},
    {id:'SRC-000005', n:'Finance Drive (folder induk)', type:'Drive Folder', cls:'SOURCE_REFERENCE', st:'READ_ONLY_CONNECTED', risk:'LOW', c:'green'},
    {id:'SRC-000006', n:'COO — PNL All Outlets Jaens Spa', type:'Google Sheet', cls:'SOURCE_REFERENCE', st:'NOT_CONNECTED', risk:'MEDIUM', c:'gray'},
    {id:'SRC-000007', n:'OGS 2026 — RACE per divisi', type:'Drive Folder', cls:'SOURCE_REFERENCE', st:'NOT_CONNECTED', risk:'MEDIUM', c:'gray'},
    {id:'SRC-000008', n:'Care Estate — seluruh sistem', type:'PROTECTED', cls:'PROTECTED', st:'DO_NOT_TOUCH', risk:'PROTECTED', c:'red'}
  ],

  health:{
    data_sources:8, active_integrations:2, dummy_records:90, live_records:0, source_reference_records:47,
    unclassified:2, duplicate_candidates:1, broken_links:0, stale_data:1, permission_issues:0, ai_context_conflicts:0
  },

  reflection:'Pertumbuhan bisnis tidak boleh dibayar dengan absennya kehadiran di rumah.',

  driveFolders:[
    {f:'00 — SYSTEM & GOVERNANCE', m:'Lintas sistem', go:'os', c:'gold', p:'Aji Only'},
    {f:'01 — MY DAY', m:'My Day', go:'myday', c:'blue', p:'Aji Only'},
    {f:'02 — DASHBOARD', m:'Dashboard', go:'dashboard', c:'blue', p:'Team'},
    {f:'03 — KNOWLEDGE', m:'Knowledge', go:'knowledge', c:'purple', p:'Campuran'},
    {f:'04 — WELLBEING', m:'Wellbeing', go:'wellbeing', c:'green', p:'AJI ONLY'},
    {f:'05 — BUSINESS EMPIRE', m:'Business Empire', go:'business', c:'gold', p:'Team'},
    {f:'06 — FAMILY', m:'Family', go:'family', c:'pink', p:'AJI ONLY'},
    {f:'07 — NETWORK', m:'Network', go:'network', c:'teal', p:'Campuran'},
    {f:'08 — SOCIAL MOVEMENT', m:'Social Movement', go:'social', c:'orange', p:'Team'},
    {f:'09 — TRAVEL', m:'Travel', go:'travel', c:'blue', p:'Campuran'},
    {f:'10 — OPERATING SYSTEM', m:'Operating System', go:'os', c:'gold', p:'AJI ONLY'},
    {f:'11 — BRANDING & CRM', m:'Branding & CRM', go:'brand', c:'pink', p:'Team'},
    {f:'12 — FINANCE & WEALTH', m:'Finance & Wealth', go:'finance', c:'green', p:'AJI ONLY / CFO'},
    {f:'13 — OPERATIONS', m:'Operations', go:'operations', c:'orange', p:'Team'},
    {f:'14 — PROJECTS', m:'Projects', go:'projects', c:'purple', p:'Campuran'},
    {f:'15 — AI COMMAND CENTER', m:'AI Command Center', go:'ai', c:'purple', p:'Aji Only'},
    {f:'90 — IMPORT STAGING', m:'Pintu masuk semua berkas baru', go:null, c:'yellow', p:'Sementara'},
    {f:'95 — DUMMY DATA', m:'Data contoh — bukan dasar keputusan', go:null, c:'gray', p:'Team'},
    {f:'98 — UNSORTED / REVIEW', m:'Triase saat Weekly Review', go:null, c:'yellow', p:'Sementara'},
    {f:'99 — OS ARCHIVE', m:'Arsip beku — tidak dihapus', go:null, c:'gray', p:'Team'}
  ],
  phases:[
    {p:'Phase 1', m:'My Day · Dashboard · Sidebar · Global Search', st:'Live', c:'green'},
    {p:'Phase 2', m:'Knowledge · Wellbeing', st:'Live', c:'green'},
    {p:'Phase 3', m:'Business Empire · Family · Network', st:'Live', c:'green'},
    {p:'Phase 4', m:'Social Movement · Travel', st:'Live', c:'green'},
    {p:'Phase 5', m:'Operating System · Branding & CRM', st:'Live', c:'green'},
    {p:'Phase 6', m:'Finance & Wealth · Operations · Projects', st:'Live', c:'green'},
    {p:'Phase 7', m:'AI Command Center', st:'Live', c:'green'},
    {p:'v1.1', m:'Finance Drive tersambung — angka asli Jan–Jul 2026', st:'Live', c:'green'},
    {p:'v1.1b', m:'Struktur 20 folder Drive — lapisan berkas Aji OS', st:'Live', c:'green'},
    {p:'1B', m:'Google Drive Data Foundation — 12 artefak governance', st:'Live', c:'green'},
    {p:'1A', m:'Master System Architecture — ID global, Inbox, Create, System Foundation', st:'Live', c:'green'},
    {p:'1C', m:'Aji Core Intelligence — sesi 1 dari 6 selesai (Decision Framework, Risk Appetite)', st:'Berjalan', c:'orange'},
    {p:'v1.2', m:'Google Calendar & Gmail → My Day dan Network', st:'Berikutnya', c:'blue'}
  ]
};

/* Dashboard card registry — dapat dikustomisasi (add/remove/pin/move) */
const DASH_CARDS = [
  {id:'bp', t:'Business Pulse', v:'3,45', u:' M', s:'Revenue Juli 2026', tr:'+5,4% vs Juni', up:1, c:'gold', ic:'brief', go:'business', sp:DB.fin.revTrend, live:1},
  {id:'cp', t:'Cash Position', v:'3,22', u:' M', s:'Kas & bank · Juli 2026', tr:'+22,5% vs Juni', up:1, c:'green', ic:'wallet', go:'finance', sp:DB.fin.cashTrend, live:1},
  {id:'np', t:'Net Profit', v:'1,31', u:' M', s:'Laba bersih Juli · margin 37,9%', tr:'+22,5% vs Juni', up:1, c:'green', ic:'chart', go:'finance', sp:DB.fin.profitTrend, live:1},
  {id:'eq', t:'Equity Grup', v:'17,46', u:' M', s:'Ekuitas · Juli 2026', tr:'+5,1% vs Juni', up:1, c:'gold', ic:'crown', go:'finance', sp:DB.fin.equityTrend, live:1},
  {id:'ar', t:'Piutang Usaha', v:'941', u:' Jt', s:'Naik 2x sejak April', tr:'+14,6% vs Juni', up:0, c:'orange', ic:'doc', go:'finance', sp:[.882,.421,.457,.436,.769,.821,.941], live:1},
  {id:'pd', t:'Pending Decisions', v:'5', u:'', s:'Menunggu Anda', tr:'2 kritikal', up:2, c:'red', ic:'scale', go:'os', sp:[8,7,7,6,6,7,5]},
  {id:'wb', t:'Wellbeing Score', v:'82', u:'/100', s:'Good', tr:'+8%', up:1, c:'green', ic:'heart', go:'wellbeing', sp:[74,78,72,80,83,79,82]},
  {id:'ap', t:'Active Projects', v:'12', u:'', s:'Proyek berjalan', tr:'2 at risk', up:2, c:'purple', ic:'layers', go:'projects', sp:[9,9,10,10,11,11,12]},
  {id:'tv', t:'Travel Next', v:'Jakarta', u:'', s:'28 Agu · 3 hari lagi', tr:'Business', up:2, c:'blue', ic:'plane', go:'travel', sp:[1,2,1,3,2,3,3]},
  {id:'ft', t:'Family Time', v:'6,2', u:' jam', s:'Minggu ini · target 10', tr:'-1,4 jam', up:0, c:'pink', ic:'users', go:'family', sp:[9,8.5,7.8,8,7.2,6.8,6.2]},
  {id:'ns', t:'Network Strength', v:'78', u:'/100', s:'Strong', tr:'+6%', up:1, c:'teal', ic:'net', go:'network', sp:[70,72,71,74,75,76,78]},
  {id:'si', t:'Social Impact', v:'2.450', u:'', s:'Orang terdampak', tr:'+320 bulan ini', up:1, c:'orange', ic:'globe', go:'social', sp:[1800,1950,2050,2130,2250,2340,2450]},
  {id:'cr', t:'Content Reach', v:'125K', u:'', s:'Jangkauan bulan ini', tr:'+23%', up:1, c:'pink', ic:'mega', go:'brand', sp:[78,86,92,99,108,116,125]},
  {id:'sh', t:'System Health', v:'3', u:'/10', s:'Sumber data tersambung', tr:'Finance Drive live', up:2, c:'blue', ic:'shield', go:'os', sp:[0,0,0,1,1,2,3]}
];

