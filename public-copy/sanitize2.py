#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Pembersih putaran kedua — temuan dari verify.sh putaran pertama."""
import pathlib, sys

SRC = pathlib.Path(__file__).parent / 'src'

P3 = [
    # KPI strip dashboard
    ("{id:'bp', t:'Business Pulse', v:'3,45', u:' M', s:'Revenue Juli 2026', tr:'+5,4% vs Juni', up:1,",
     "{id:'bp', t:'Business Pulse', v:'2,00', u:' M', s:'Revenue bulan terakhir', tr:'naik vs bulan lalu', up:1,"),
    ("{id:'cp', t:'Cash Position', v:'3,22', u:' M', s:'Kas & bank · Juli 2026', tr:'+22,5% vs Juni', up:1,",
     "{id:'cp', t:'Cash Position', v:'1,50', u:' M', s:'Kas & bank · bulan terakhir', tr:'naik vs bulan lalu', up:1,"),
    ("{id:'np', t:'Net Profit', v:'1,31', u:' M', s:'Laba bersih Juli · margin 37,9%', tr:'+22,5% vs Juni', up:1,",
     "{id:'np', t:'Net Profit', v:'0,50', u:' M', s:'Laba bersih bulan terakhir', tr:'naik vs bulan lalu', up:1,"),
    ("{id:'eq', t:'Equity Grup', v:'17,46', u:' M', s:'Ekuitas · Juli 2026', tr:'+5,1% vs Juni', up:1,",
     "{id:'eq', t:'Equity Grup', v:'10,00', u:' M', s:'Ekuitas · bulan terakhir', tr:'naik vs bulan lalu', up:1,"),
    # cash buffer
    ("{t:'Cash buffer 1,6 bulan', s:'Aturan Anda minimal 3 bulan', lv:'Important', c:'orange', go:'finance'}",
     "{t:'Cash buffer di bawah target', s:'Aturan Anda minimal 3 bulan', lv:'Important', c:'orange', go:'finance'}"),
    # piutang
    ("{id:'t3', n:'Tagih piutang Rp 941 Jt', s:'Finance · naik 3 bulan berturut', p:'High', c:'orange', ctx:'Piutang terbesar ada di Jaens Essences (Rp 501 Jt) dan J\\'Fresh Laundry (Rp 218 Jt).'}",
     "{id:'t3', n:'Tagih piutang usaha', s:'Finance · naik 3 bulan berturut', p:'High', c:'orange', ctx:'Piutang terbesar ada di Jaens Essences dan J\\'Fresh Laundry.'}"),
    ("{id:'d2', n:'Penanganan piutang Rp 941 Jt', unit:'Grup', type:'Business', due:'3 hari', impact:'Rp 941 Jt', risk:'Medium', c:'orange',",
     "{id:'d2', n:'Penanganan piutang usaha', unit:'Grup', type:'Business', due:'3 hari', impact:'Piutang grup', risk:'Medium', c:'orange',"),
    ("{lv:'Critical', c:'red', area:'Finance', t:'Piutang grup Rp 941 Jt — naik 2x sejak April', s:'Essences Rp 501 Jt · Laundry Rp 218 Jt'}",
     "{lv:'Critical', c:'red', area:'Finance', t:'Piutang grup naik hampir 2x sejak awal kuartal', s:'Terbesar: Essences · Laundry'}"),
    ("{t:'Piutang Jaens Essences Rp 501 Jt', o:'Produksi Essences', lv:'Critical', c:'red', age:'Naik 3 bulan'}",
     "{t:'Piutang Jaens Essences tertinggi', o:'Produksi Essences', lv:'Critical', c:'red', age:'Naik 3 bulan'}"),
    ("{t:'Piutang Rp 941 Jt — naik 2x sejak April', s:'Essences Rp 501 Jt · Laundry Rp 218 Jt', lv:'Critical', c:'red', go:'finance'}",
     "{t:'Piutang naik hampir 2x sejak awal kuartal', s:'Terbesar: Essences · Laundry', lv:'Critical', c:'red', go:'finance'}"),
    # essences
    ("{id:'i4', t:'Jaens Essences turun 20% MoM dan hanya menyisakan kas Rp 29 Jt di unit — unit terkecil dengan bantalan paling tipis.', c:'orange', why:'Revenue Rp 193 Jt di Juli vs Rp 242 Jt di Juni.',",
     "{id:'i4', t:'Jaens Essences turun tajam bulan ini dan kas unitnya paling tipis di grup — unit terkecil dengan bantalan paling sempit.', c:'orange', why:'Revenue menurun dibanding bulan sebelumnya.',"),
    ("{lv:'Important', c:'orange', area:'Finance', t:'Jaens Essences turun 20% MoM', s:'Kas unit tinggal Rp 29 Jt'}",
     "{lv:'Important', c:'orange', area:'Finance', t:'Jaens Essences turun tajam bulan ini', s:'Kas unit paling tipis di grup'}"),
    ("{t:'Jaens Essences turun 20% MoM', s:'Rp 242 Jt → Rp 193 Jt', lv:'Important', c:'orange', go:'business'}",
     "{t:'Jaens Essences turun tajam bulan ini', s:'Turun dibanding bulan sebelumnya', lv:'Important', c:'orange', go:'business'}"),
    # budget proyek sosial
    ("bud:'Rp 340 Jt', spent:'Rp 96 Jt'", "bud:'Rp 300 Jt', spent:'Rp 100 Jt'"),
    # tanggal lahir kontak yang bertabrakan dengan pola keluarga
    ("city:'Denpasar', last:'48 hari lalu', next:'Bandingkan penawaran fasilitas', bd:'14 Feb',",
     "city:'Denpasar', last:'48 hari lalu', next:'Bandingkan penawaran fasilitas', bd:'—',"),
    # komentar penanda data asli
    ("/* ---------- BUSINESS UNITS — ANGKA ASLI JULI 2026 ---------- */",
     "/* ---------- BUSINESS UNITS — DATA CONTOH ---------- */"),
    ("/* ---------- FINANCE — ANGKA ASLI JULI 2026 ---------- */",
     "/* ---------- FINANCE — DATA CONTOH ---------- */"),
]

P7 = [
    ("['Laba Bersih',money(f.profit),'margin 37,9%',1,'green','bolt']",
     "['Laba Bersih',money(f.profit),'margin bersih',1,'green','bolt']"),
    ("['Gross Profit',money(f.gp),'margin 76,0%',2,'blue','arrow']",
     "['Gross Profit',money(f.gp),'margin kotor',2,'blue','arrow']"),
    ("[['Net margin tertinggi',\"J'Fresh 66%\",'shield','green'],",
     "[['Net margin tertinggi',\"J'Fresh\",'shield','green'],"),
    ("<div class=\"card-f mini\">Maret adalah titik terendah tahun ini (laba Rp 46 Jt). Sejak April tren naik konsisten.</div>",
     "<div class=\"card-f mini\">Titik terendah tahun ini ada di kuartal pertama. Sejak itu tren naik konsisten.</div>"),
    ("<div class=\"card-f mini\">Jaens Essences hanya menyisakan Rp 29 Jt — bantalan paling tipis di grup.</div>",
     "<div class=\"card-f mini\">Jaens Essences punya bantalan kas paling tipis di grup.</div>"),
]

P6 = [
    ("${trend('+22,5% vs Juni',1)}", "${trend('naik vs bulan lalu',1)}"),
]

P8 = [
    ("Piutang usaha **${money(DB.fin.ar)}** per Juli — naik dari Rp 436 Jt di April, lebih dari dua kali lipat dalam tiga bulan.\\n\\nTerbesar: Jaens Essences Rp 501 Jt dan J'Fresh Laundry Rp 218 Jt — keduanya klien B2B/korporat.",
     "Piutang usaha **${money(DB.fin.ar)}** per bulan terakhir — lebih dari dua kali lipat dalam tiga bulan.\\n\\nTerbesar: Jaens Essences dan J'Fresh Laundry — keduanya klien B2B/korporat."),
]

def apply(path, pairs):
    p = SRC / path
    txt = p.read_text(encoding='utf-8')
    hit, miss = 0, []
    for a, b in pairs:
        if a in txt:
            txt = txt.replace(a, b); hit += 1
        else:
            miss.append(a[:75])
    p.write_text(txt, encoding='utf-8')
    print(f"  {path:<14} cocok {hit}/{len(pairs)}")
    for m in miss:
        print(f"      TIDAK COCOK: {m}")
    return len(miss)

if __name__ == '__main__':
    bad = 0
    for f, pairs in [('p3_data.js', P3), ('p7_v3.js', P7), ('p6_v2.js', P6), ('p8_ai.js', P8)]:
        bad += apply(f, pairs)
    sys.exit(1 if bad else 0)
