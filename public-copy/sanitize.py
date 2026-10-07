#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Pembersih salinan publik AJI JAENS OS.

Aturan kerja:
  - Setiap penggantian dicocokkan secara EKSAK. Kalau pola tidak ditemukan,
    skrip melapor GAGAL, bukan diam-diam melewatinya.
  - Angka pengganti dipilih bulat supaya jelas terlihat sebagai DATA CONTOH.
  - Nama orang diganti label peran, bukan nama lain.
Dijalankan dari /home/claude/pub.
"""
import re, sys, pathlib

SRC = pathlib.Path(__file__).parent / 'src'

# ---------------------------------------------------------------- NAMA ORANG
NAMA = {
    'Pak Hendra Wijaya':   'Banker Pembanding',
    'Bank BCA':            'Bank Pembanding',
    'dr. Ayu Laksmi':      'Dokter Keluarga',
    'Klinik Ubud Sehat':   'Klinik Mitra',
    'Pak Komang Astawa':   'Arsitek Utama',
    'Astawa Architects':   'Kantor Arsitek Mitra',
    'Mrs. Chen Li':        'Mitra Internasional A',
    'Lotus Wellness Singapore': 'Mitra Wellness SG',
    'Ibu Sinta Maharani':  'Editor Media',
    'Bali Media Network':  'Jaringan Media Lokal',
    'Pak Agus Setiawan':   'Pengembang Lahan',
    'Setiawan Land':       'Pengembang Mitra',
    'Ibu Dewi Anggraeni':  'Sekjen Asosiasi',
    'Mr. James Whitfield': 'Mitra Internasional B',
    'Whitfield Retreats':  'Mitra Retreat AU',
    'Putu Ardana':         'COO Grup',
    'Ketut Sriani':        'CFO Grup',
    'Pak Made Sudana':     'Mitra Strategis A',
    'Made Sudana':         'Mitra Strategis A',
    'Ibu Fitriani':        'Relationship Manager Bank',
    'Mr. Bruce Halloran':  'Investor A',
    'Mr. Bruce':           'Investor A',
    'Ibu Ratna':           'Penasihat Hukum',
    'Ibu Sinta':           'Editor Media',
    'Kadek Ayu':           'Anak Kedua',
    'Putu Adi':            'Anak Pertama',
    'Ibunda Sri':          'Ibunda',
    'Ni Luh Jaens':        'Pasangan',
    # Nama bank / lembaga nyata yang terikat relasi pribadi
    'BNI Company Visit':   'Company Visit Bank Mitra',
    'BNI Pusat':           'Kantor Pusat Bank Mitra',
    'Ringkasan kunjungan BNI': 'Ringkasan kunjungan bank mitra',
    'kunjungan BNI':       'kunjungan bank mitra',
    'BNI terbuka':         'Bank mitra terbuka',
}

# ------------------------------------------------- ANGKA KEUANGAN (p3_data)
# Nilai asli -> nilai contoh bulat. Dicocokkan sebagai literal di kode.
ANGKA = [
    # --- unit: sparkline & outlet
    ("spark:[2.152,2.170,1.873,2.417,3.222,3.271,3.446]",
     "spark:[1.70,1.75,1.80,1.85,1.90,1.95,2.00]"),
    ("spark:[.293,.274,.254,.301,.405,.383,.367]",
     "spark:[.34,.35,.36,.37,.38,.39,.40]"),
    ("spark:[.149,.113,.109,.345,.216,.242,.193]",
     "spark:[.14,.15,.16,.17,.18,.19,.20]"),
    ("spark:[.215,.217,.187,.242,.322,.327,.345]",
     "spark:[.24,.25,.26,.27,.28,.29,.30]"),
    ("{n:'Center Ubud', rev:1.634, gr:2.4,  np:.513, margin:31.4, cash:1.043}",
     "{n:'Outlet 1', rev:1.000, gr:3.0,  np:.300, margin:30.0, cash:.800}"),
    ("{n:'Triloka',     rev:.794, gr:9.2,  np:.284, margin:35.8, cash:.940}",
     "{n:'Outlet 2',   rev:.500, gr:5.0,  np:.150, margin:30.0, cash:.400}"),
    ("{n:'Shanti',      rev:.514, gr:19.2, np:.120, margin:23.3, cash:.442}",
     "{n:'Outlet 3',   rev:.300, gr:8.0,  np:.060, margin:20.0, cash:.200}"),
    ("{n:'Bisma',       rev:.505, gr:-2.4, np:.043, margin:8.6,  cash:.219}",
     "{n:'Outlet 4',   rev:.200, gr:-2.0, np:.020, margin:10.0, cash:.100}"),
    # --- blok fin
    ("cash:3.223, cashGr:22.5,", "cash:1.500, cashGr:5.0,"),
    ("rev:3.449, revGr:5.4,", "rev:2.000, revGr:4.0,"),
    ("revGross:4.351,", "revGross:2.500,"),
    ("profit:1.309, profitGr:22.5, netMargin:37.9,",
     "profit:.500, profitGr:5.0, netMargin:25.0,"),
    ("gp:3.305, gpMargin:76.0,", "gp:1.400, gpMargin:70.0,"),
    ("ar:.941, ap:.999,", "ar:.500, ap:.500,"),
    ("curLiab:3.994, ltLiab:2.323, totLiab:6.317,",
     "curLiab:2.000, ltLiab:1.000, totLiab:3.000,"),
    ("assets:23.778, curAssets:4.876, fixAssets:15.679, inventory:1.089,",
     "assets:13.000, curAssets:3.000, fixAssets:9.000, inventory:1.000,"),
    ("equity:17.461,", "equity:10.000,"),
    ("ytdRev:20.28, ytdProfit:5.46,", "ytdRev:12.00, ytdProfit:3.00,"),
    ("revTrend:[2.444,2.444,2.126,2.922,3.627,3.274,3.449]",
     "revTrend:[1.70,1.75,1.80,1.85,1.90,1.95,2.00]"),
    ("revGrossTrend:[2.808,2.775,2.423,3.305,4.165,4.223,4.351]",
     "revGrossTrend:[2.20,2.25,2.30,2.35,2.40,2.45,2.50]"),
    ("cashTrend:[2.459,2.385,1.655,1.563,2.154,2.631,3.223]",
     "cashTrend:[1.20,1.25,1.30,1.35,1.40,1.45,1.50]"),
    ("profitTrend:[.423,.522,.046,.952,1.142,1.069,1.309]",
     "profitTrend:[.35,.37,.39,.41,.44,.47,.50]"),
    ("equityTrend:[9.18,8.88,8.91,8.91,15.96,16.61,17.46]",
     "equityTrend:[8.50,8.75,9.00,9.25,9.50,9.75,10.00]"),
    # --- rincian aset / liabilitas / kas
    ("{n:'Aset tetap (net)', v:15.679, c:'blue'}",
     "{n:'Aset tetap (net)', v:9.000, c:'blue'}"),
    ("{n:'Kas & bank', v:3.223, c:'green'}",
     "{n:'Kas & bank', v:1.500, c:'green'}"),
    ("{n:'Persediaan', v:1.089, c:'purple'}",
     "{n:'Persediaan', v:1.000, c:'purple'}"),
    ("{n:'Piutang usaha', v:.941, c:'orange'}",
     "{n:'Piutang usaha', v:.500, c:'orange'}"),
    ("{n:'Aset lancar lain', v:2.846, c:'gray'}",
     "{n:'Aset lancar lain', v:1.000, c:'gray'}"),
    ("{n:'Liabilitas lancar', v:3.994, c:'red'}",
     "{n:'Liabilitas lancar', v:2.000, c:'red'}"),
    ("{n:'Liabilitas jangka panjang', v:2.323, c:'orange'}",
     "{n:'Liabilitas jangka panjang', v:1.000, c:'orange'}"),
    ("{n:'Center Ubud', v:1.043, c:'teal'},{n:'Triloka', v:.940, c:'teal'},",
     "{n:'Outlet 1', v:.800, c:'teal'},{n:'Outlet 2', v:.400, c:'teal'},"),
    ("{n:\"J'Fresh Laundry\", v:.549, c:'blue'},{n:'Shanti', v:.442, c:'teal'},",
     "{n:\"J'Fresh Laundry\", v:.300, c:'blue'},{n:'Outlet 3', v:.200, c:'teal'},"),
    ("{n:'Bisma', v:.219, c:'orange'},{n:'Jaens Essences', v:.029, c:'purple'}",
     "{n:'Outlet 4', v:.100, c:'orange'},{n:'Jaens Essences', v:.050, c:'purple'}"),
]

# --------------------------------------------- NARASI YANG MENGUTIP ANGKA
# Kalimat asli -> kalimat tanpa angka nyata. Kualitatif, bukan angka baru.
NARASI = [
    ("note:'Revenue turun dua bulan berturut dari puncak Rp 0,405 M di Mei.'",
     "note:'Revenue turun dua bulan berturut dari puncaknya di pertengahan tahun.'"),
    ("attention:'Margin 66% belum dibebani management expense — margin riil lebih rendah.'",
     "attention:'Margin unit belum dibebani management expense — margin riil lebih rendah.'"),
    ("note:'Volatil. Lonjakan April (Rp 0,345 M) belum terulang.'",
     "note:'Volatil. Lonjakan awal tahun belum terulang.'"),
    ("attention:'Turun 20% MoM dan kas unit hanya Rp 29 Jt.'",
     "attention:'Turun tajam bulan ini dan kas unit paling tipis di grup.'"),
    ("attention:'Bisma masih 8,6% margin — jauh di bawah tiga outlet lain.'",
     "attention:'Outlet terbaru masih di bawah margin tiga outlet lain.'"),
    ("note:'Penyumbang terbesar revenue grup. Bisma bergabung Mei 2026 dan langsung menambah kontribusi bulanan.'",
     "note:'Penyumbang terbesar revenue grup. Outlet terbaru bergabung pertengahan tahun dan langsung menambah kontribusi bulanan.'"),
    # tasks / decisions / insights
    ("s:'Jaens Spa · margin 8,6% vs grup 27,9%'",
     "s:'Jaens Spa · margin outlet terbaru di bawah rata-rata grup'"),
    ("ctx:'Bisma sudah untung bulanan Rp 43 Jt sejak Juni, tapi akumulasi rugi tahun berjalan masih Rp 1,05 M dan aset tetapnya Rp 10,27 M. Butuh keputusan percepatan ramp-up.'",
     "ctx:'Outlet terbaru sudah untung bulanan, tapi akumulasi rugi tahun berjalan dan aset tetapnya masih besar. Butuh keputusan percepatan ramp-up.'"),
    ("ctx:'Bawa angka Juli: revenue Rp 2,0 M, laba Rp 0,5 M, ekuitas Rp 10,0 M (CONTOH). Ini posisi tawar terkuat tahun ini.'",
     "ctx:'Bawa angka bulan tertutup terakhir dari modul Finance. Ini posisi tawar terkuat tahun ini.'"),
    ("impact:'Rp 10,3 M aset', risk:'High'",
     "impact:'Aset outlet terbaru', risk:'High'"),
    ("ctx:'Bisma buka Mei 2026. Revenue stabil di ±Rp 0,5 M/bulan tetapi turun 2,4% di Juli, margin 8,6% (grup 27,9%), dan akumulasi rugi tahun berjalan Rp 1,05 M. Aset tetapnya Rp 10,27 M dengan liabilitas lancar Rp 3,47 M — beban terbesar di grup.'",
     "ctx:'Outlet terbaru buka pertengahan tahun. Revenue stabil tetapi menurun bulan ini, margin di bawah rata-rata grup, dan masih ada akumulasi rugi tahun berjalan. Aset tetap dan liabilitas lancarnya adalah beban terbesar di grup.'"),
    ("ctx:'Piutang naik dari Rp 0,44 M (April) ke Rp 0,94 M (Juli). Jaens Essences menyumbang Rp 501 Jt dan J\\'Fresh Laundry Rp 218 Jt — keduanya klien korporat/B2B.'",
     "ctx:'Piutang naik hampir dua kali lipat sejak awal kuartal. Penyumbang terbesar: Jaens Essences dan J\\'Fresh Laundry — keduanya klien korporat/B2B.'"),
    ("{id:'d5', n:'Pemanfaatan kas Rp 3,22 M', unit:'Jaens Enterprises', type:'Business', due:'2 minggu', impact:'Rp 3,22 M', risk:'Medium', c:'orange',",
     "{id:'d5', n:'Pemanfaatan kas menganggur', unit:'Jaens Enterprises', type:'Business', due:'2 minggu', impact:'Kas grup', risk:'Medium', c:'orange',"),
    ("ctx:'Kas naik 22,5% dalam sebulan ke Rp 3,22 M — tertinggi tahun ini. Aturan Anda: cash buffer minimal 3 bulan biaya grup sebelum ekspansi.'",
     "ctx:'Kas naik tajam dalam sebulan — tertinggi tahun ini. Aturan Anda: cash buffer minimal 3 bulan biaya grup sebelum ekspansi.'"),
    ("opts:['Percepat ramp-up Bisma','Tahan sebagai buffer sampai Q4','Lunasi sebagian liabilitas lancar Rp 3,99 M']",
     "opts:['Percepat ramp-up outlet terbaru','Tahan sebagai buffer sampai Q4','Lunasi sebagian liabilitas lancar']"),
    ("{id:'i1', t:'Juli 2026 adalah bulan terbaik tahun ini: laba Rp 1,31 M (+22,5%) dan kas Rp 3,22 M (+22,5%). Ini momen terkuat untuk bicara dengan bank dan investor.', c:'green', why:'Data asli Finance Drive, Juli 2026.',",
     "{id:'i1', t:'Bulan tertutup terakhir adalah bulan terbaik tahun ini — laba dan kas sama-sama naik. Ini momen terkuat untuk bicara dengan bank dan investor.', c:'green', why:'Data contoh. Versi asli membaca Finance Drive.',"),
    ("acts:['Bawa angka Juli ke BNI Company Visit','Kirim proposal ke Mr. Bruce hari ini']",
     "acts:['Bawa angka bulan terakhir ke BNI Company Visit','Kirim proposal ke Mr. Bruce hari ini']"),
    ("{id:'i2', t:'Outlet Bisma menahan margin grup: 8,6% vs 27,9%, dengan aset tetap Rp 10,27 M dan akumulasi rugi Rp 1,05 M.', c:'red', why:'Buka Mei 2026, revenue turun 2,4% di Juli.',",
     "{id:'i2', t:'Outlet terbaru menahan margin grup, dengan aset tetap besar dan akumulasi rugi tahun berjalan.', c:'red', why:'Buka pertengahan tahun, revenue menurun bulan ini.',"),
    ("{id:'i3', t:'Piutang naik dua kali lipat sejak April — dari Rp 0,44 M ke Rp 0,94 M. Kas naik, tapi sebagian pertumbuhan masih tertahan di tagihan.', c:'orange', why:'Terbesar: Jaens Essences Rp 501 Jt, J\\'Fresh Rp 218 Jt.',",
     "{id:'i3', t:'Piutang naik hampir dua kali lipat sejak awal kuartal. Kas naik, tapi sebagian pertumbuhan masih tertahan di tagihan.', c:'orange', why:'Terbesar: Jaens Essences dan J\\'Fresh.',"),
    ("area:'Business', t:'Bisma: akumulasi rugi tahun berjalan Rp 1,05 M', s:'Margin 8,6% vs grup 27,9%'",
     "area:'Business', t:'Outlet terbaru: masih akumulasi rugi tahun berjalan', s:'Margin di bawah rata-rata grup'"),
    ("owner:'p_putu', st:'At Risk', prog:34, bud:'Rp 10,3 M', spent:'Rp 10,3 M', dl:'31 Des 2026', risk:'High', pr:'Critical', c:'red', ms:'Kejar margin ke 20%'",
     "owner:'p_putu', st:'At Risk', prog:34, bud:'Rp 10,0 M', spent:'Rp 10,0 M', dl:'31 Des 2026', risk:'High', pr:'Critical', c:'red', ms:'Kejar margin ke 20%'"),
    ("{t:'Bisma: margin 8,6% dan akumulasi rugi Rp 1,05 M', o:'Jaens Spa Bisma', lv:'Critical', c:'red', age:'Sejak Mei 2026'}",
     "{t:'Outlet terbaru: margin rendah dan masih akumulasi rugi', o:'Jaens Spa Outlet 4', lv:'Critical', c:'red', age:'Sejak pertengahan tahun'}"),
    ("res:'Revenue +Rp 0,5 M/bln, tapi akumulasi rugi Rp 1,05 M'",
     "res:'Revenue bulanan naik, tapi masih akumulasi rugi'"),
    ("st:'Konsekuensi aritmetis dari CORE-000008: supaya Bisma turun ke bawah 20%, ekuitas grup perlu mencapai ±Rp 51,4 M — hampir tiga kali posisi sekarang. Jalan lain: tidak menambah aset non-likuid baru sampai rasionya pulih.'",
     "st:'Konsekuensi aritmetis dari CORE-000008: supaya porsi outlet terbaru turun ke bawah 20%, ekuitas grup perlu naik beberapa kali dari posisi sekarang. Jalan lain: tidak menambah aset non-likuid baru sampai rasionya pulih.'"),
    ("basis:'Rp 10,27 M ÷ 20% = Rp 51,35 M. Inferensi, bukan aturan yang Anda nyatakan.'",
     "basis:'Aset tetap outlet terbaru dibagi batas 20%. Inferensi, bukan aturan yang Anda nyatakan.'"),
    ("{t:'Bisma margin 8,6% vs grup 27,9%', s:'Akumulasi rugi Rp 1,05 M sejak Mei', lv:'Critical', c:'red', go:'business'}",
     "{t:'Margin outlet terbaru di bawah rata-rata grup', s:'Masih akumulasi rugi sejak dibuka', lv:'Critical', c:'red', go:'business'}"),
    ("{t:'Kas Rp 3,22 M — tertinggi tahun ini', s:'Naik 22,5% dari Juni', lv:'FYI', c:'green', go:'finance'}",
     "{t:'Kas tertinggi tahun ini', s:'Naik dibanding bulan sebelumnya', lv:'FYI', c:'green', go:'finance'}"),
]

# ------------------------------------------------- NARASI DI MODUL LAIN
NARASI_LAIN = [
    # p6_v2.js
    ("approval kontrak fase 1 senilai Rp 2,4 M</b> — deadline hari ini.",
     "approval kontrak fase 1</b> — deadline hari ini."),
    ("<b>kredit investasi Rp 6 M</b> dengan agunan aset Care Estate",
     "<b>fasilitas kredit investasi</b> dengan agunan aset Care Estate"),
    ("Keputusan Rp 5,1 M menggantung", "Keputusan investasi masih menggantung"),
    # p7_v3.js
    ("'Revenue MTD Rp 3,45 M (+12%). Bisma tertinggal di okupansi 68%.'",
     "'Revenue MTD naik dibanding bulan lalu. Outlet terbaru tertinggal di okupansi.'"),
    ("'Kas Rp 4,28 M — 4,1 bulan biaya operasional. Piutang Rp 340 Jt lewat 60 hari.'",
     "'Kas cukup untuk beberapa bulan biaya operasional. Sebagian piutang lewat 60 hari.'"),
    ("'4 follow up. Mr. Bruce 21 hari tanpa kontak.'",
     "'4 follow up. Mr. Bruce paling lama tanpa kontak.'"),
    ("Aset tetap melonjak dari Rp 5,2 M ke Rp 15,7 M sejak Mei — mayoritas investasi Outlet Bisma.",
     "Aset tetap melonjak sejak pertengahan tahun — mayoritas investasi outlet terbaru.",),
    ("Kas Rp 3,22 M · beban operasional ±Rp 2,0 M/bulan → sekitar 1,6 bulan.",
     "Kas dibandingkan beban operasional bulanan → di bawah 3 bulan."),
    ("Bisma menyerap Rp 10,3 M dari ekuitas Rp 17,5 M.",
     "Outlet terbaru menyerap porsi besar dari ekuitas grup."),
    ("['Total Budget','Rp 13,8 M','wallet','gold']",
     "['Total Budget','Rp 10,0 M','wallet','gold']"),
]

# ------------------------------------------------- BRIEFING AI (p8_ai.js)
# Interpolasi ${money(DB.fin.x)} dibiarkan — nilainya otomatis ikut data contoh.
AI = [
    ("— 21 hari tanpa kontak", "— paling lama tanpa kontak"),
    ("**Pak Agus Setiawan** (73 hari) dan **Ibu Sinta** (61 hari)",
     "**Pak Agus Setiawan** dan **Ibu Sinta**"),
    ("per Juli 2026 — naik 22,5% dari Juni dan tertinggi tahun ini",
     "per bulan tertutup terakhir — tertinggi tahun ini"),
    ("Sebarannya: Center Ubud Rp 1,04 M, Triloka Rp 940 Jt, J'Fresh Rp 549 Jt, Shanti Rp 442 Jt, Bisma Rp 219 Jt, Essences Rp 29 Jt.",
     "Sebaran per unit bisa dilihat di modul Finance."),
    ("dengan beban operasional sekitar Rp 2,0 M per bulan, ini setara **1,6 bulan** — masih di bawah aturan buffer 3 bulan Anda",
     "dibanding beban operasional bulanan, ini **masih di bawah** aturan buffer 3 bulan Anda"),
    ("(+22,5% dari Juni), net margin **37,9%** terhadap revenue setelah eliminasi",
     "naik dari bulan sebelumnya, dengan net margin terhadap revenue setelah eliminasi"),
    ("Titik terendah tahun ini adalah Maret dengan laba hanya Rp 46 Jt.",
     "Titik terendah tahun ini ada di kuartal pertama."),
    ("J'Fresh (66%) dan Essences (35%) belum dibebani",
     "J'Fresh dan Essences belum dibebani"),
    ("revenue Rp 505 Jt (turun 2,4% MoM), margin 8,6% vs grup 27,9%, aset tetap Rp 10,27 M, liabilitas lancar Rp 3,47 M, akumulasi rugi tahun berjalan Rp 1,05 M.",
     "revenue menurun bulan ini, margin di bawah rata-rata grup, aset tetap dan liabilitas lancarnya terbesar di grup, dan masih ada akumulasi rugi tahun berjalan."),
    ("revenue turun 20% MoM dan kas unit tinggal Rp 29 Jt.",
     "revenue turun tajam dan kas unitnya paling tipis di grup."),
    ("Bisma buka Mei 2026 dan sudah untung bulanan sejak Juni (Rp 43 Jt di Juli) — itu kabar baiknya.",
     "Outlet terbaru buka pertengahan tahun dan sudah untung bulanan — itu kabar baiknya."),
    ("Masalahnya skala: margin 8,6% jauh di bawah Triloka (35,8%), Center Ubud (31,4%), dan Shanti (23,3%). Aset tetap Rp 10,27 M membuatnya menyerap 59% ekuitas grup, dan akumulasi rugi tahun berjalan masih Rp 1,05 M.",
     "Masalahnya skala: marginnya jauh di bawah tiga outlet lain, aset tetapnya menyerap porsi besar ekuitas grup, dan akumulasi rugi tahun berjalan masih ada."),
    ("Bawa angka Juli: revenue Rp 3,45 M, laba Rp 1,31 M, ekuitas Rp 17,46 M. Ini posisi tawar terkuat tahun ini.",
     "Bawa angka bulan tertutup terakhir dari modul Finance. Ini posisi tawar terkuat tahun ini."),
    ("**Program penagihan piutang Rp 941 Jt**", "**Program penagihan piutang**"),
    ("Analisis okupansi & bauran layanan Bisma", "Analisis okupansi & bauran layanan outlet terbaru"),
    ("keputusan arah Bisma — itu Rp 10,3 M aset.",
     "keputusan arah outlet terbaru — itu aset terbesar di grup."),
    ("ulang tahun Putu Adi 3 September, konsultasi kampus 12 September",
     "ulang tahun Anak Pertama bulan depan, konsultasi kampus pertengahan bulan depan"),
    ("setelah eliminasi (+5,4% MoM), atau", "setelah eliminasi, naik tipis MoM, atau"),
    ("Per unit: Jaens Spa Rp 3,45 M (79% grup), Management Rp 345 Jt, J'Fresh Rp 367 Jt, Essences Rp 193 Jt.",
     "Rincian per unit ada di modul Business."),
    ("Aset tetap melonjak dari Rp 5,2 M (April) ke Rp 15,7 M (Juli) — hampir seluruhnya investasi Outlet Bisma.",
     "Aset tetap melonjak sejak pertengahan tahun — hampir seluruhnya investasi outlet terbaru."),
    ("closing **Juli 2026** dari Finance Drive",
     "closing bulan tertutup terakhir (data contoh)"),
    ("revenue ${money(DB.fin.rev)} (+5,4%), laba ${money(DB.fin.profit)} (+22,5%), kas ${money(DB.fin.cash)} (+22,5%)",
     "revenue ${money(DB.fin.rev)}, laba ${money(DB.fin.profit)}, kas ${money(DB.fin.cash)}"),
    ("**Bisma** di margin 8,6% dengan akumulasi rugi Rp 1,05 M",
     "**outlet terbaru** dengan margin di bawah rata-rata grup dan akumulasi rugi tahun berjalan"),
]

# ----------------------------------------------- TANGGAL LAHIR KELUARGA
KELUARGA = [
    ("{id:'f_ist', n:'Pasangan', rel:'Istri', bd:'14 Feb',",
     "{id:'f_ist', n:'Pasangan', rel:'Istri', bd:'—',"),
    ("{id:'f_p1',  n:'Anak Pertama', rel:'Putra Sulung', bd:'3 Sep',",
     "{id:'f_p1',  n:'Anak Pertama', rel:'Putra Sulung', bd:'—',"),
    ("{id:'f_p2',  n:'Anak Kedua', rel:'Putri', bd:'22 Jun',",
     "{id:'f_p2',  n:'Anak Kedua', rel:'Putri', bd:'—',"),
    ("{id:'f_ibu', n:'Ibunda', rel:'Ibunda', bd:'9 Jan',",
     "{id:'f_ibu', n:'Ibunda', rel:'Ibunda', bd:'—',"),
    ("{d:'3 Sep', t:'—', n:'🎂 Ulang tahun Putu Adi', c:'blue'}",
     "{d:'Bulan depan', t:'—', n:'🎂 Ulang tahun Anak Pertama', c:'blue'}"),
    ("{d:'12 Sep', t:'08:00', n:'Konsultasi kampus Putu Adi', c:'blue'}",
     "{d:'Bulan depan', t:'08:00', n:'Konsultasi kampus Anak Pertama', c:'blue'}"),
    ("n:'Kunjungan ke Ibunda di Gianyar'", "n:'Kunjungan ke Ibunda'"),
    ("note:'Tinggal di Gianyar — kunjungan rutin akhir pekan'",
     "note:'Kunjungan rutin akhir pekan'"),
    ("<div class=\"lbl\">Ulang tahun Putu Adi · 9 hari lagi</div>",
     "<div class=\"lbl\">Ulang tahun Anak Pertama · bulan depan</div>"),
    ("<div class=\"val\" style=\"font-size:22px\">3 Sep</div>",
     "<div class=\"val\" style=\"font-size:22px\">—</div>"),
    ("Ulang tahun Ibu Fitriani 2 September", "Ulang tahun Relationship Manager Bank"),
]

def apply(path, pairs, label):
    p = SRC / path
    txt = p.read_text(encoding='utf-8')
    hit, miss = 0, []
    for a, b in pairs:
        if a in txt:
            txt = txt.replace(a, b); hit += 1
        else:
            miss.append(a[:70])
    p.write_text(txt, encoding='utf-8')
    print(f"  {label:<22} {path:<14} cocok {hit}/{len(pairs)}")
    for m in miss:
        print(f"      TIDAK COCOK: {m}")
    return len(miss)

def apply_all(pairs, label):
    total = 0
    for p in sorted(SRC.glob('*.js')):
        txt = p.read_text(encoding='utf-8')
        n = 0
        for a, b in pairs.items() if isinstance(pairs, dict) else pairs:
            if a in txt:
                txt = txt.replace(a, b); n += txt.count(b) * 0 + 1
        if n:
            p.write_text(txt, encoding='utf-8')
            total += n
    print(f"  {label:<22} total pola terpakai: {total}")

if __name__ == '__main__':
    # Urutan penting: angka & narasi memakai teks ASLI, baru nama diganti.
    print("ANGKA KEUANGAN")
    bad = apply('p3_data.js', ANGKA, 'angka')
    print("NARASI (p3_data)")
    bad += apply('p3_data.js', NARASI, 'narasi')
    print("NARASI (modul lain)")
    apply_all(NARASI_LAIN, 'narasi-lain')
    print("BRIEFING AI (p8_ai)")
    bad += apply('p8_ai.js', AI, 'briefing')
    print("KELUARGA")
    apply_all(KELUARGA, 'keluarga')
    print("NAMA ORANG & LEMBAGA")
    apply_all(NAMA, 'nama')
    sys.exit(1 if bad else 0)
