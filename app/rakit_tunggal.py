#!/usr/bin/env python3
"""Merakit berkas tunggal (satu .html berisi semuanya) dari halaman di
folder app/.

Mengapa ada: berkas tunggal itu yang diunggah Aji dari iPad. Sebelumnya
dirakit dengan tangan, dan berkas tangan selalu ketinggalan dari sumbernya
— perubahan di lib/portal.js tidak ikut, lalu yang diuji dan yang diunggah
jadi dua hal berbeda. Sekarang dirakit ulang dengan satu perintah.

Yang dilakukan:
  - <link rel="stylesheet" href="../lib/ui.css">  -> <style> isi berkasnya
  - <script src="../config.js">                   -> isi config.js
  - <script src="../lib/x.js">                    -> isi berkasnya
  - <script src="https://cdn...supabase...">      -> DIBIARKAN (perlu internet)
  - @import font di ui.css dipindah ke <link> di <head>, karena @import
    di tengah <style> yang disuntik bisa diabaikan peramban.

Pemakaian: python3 rakit_tunggal.py
"""
import os
import re
import sys

APP = os.path.dirname(os.path.abspath(__file__))
FONT = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?'
        'family=Cormorant+Garamond:wght@600;700&family=Inter:wght@400;500;600;700;800'
        '&display=swap">')

# (sumber, hasil, halaman uji berkas-tunggal)
HALAMAN = [
    ('portal/index.html',   'index.html',     'test/portal-tunggal-uji.html'),
    ('admin/crm.html',      'crm.html',       'test/crm-tunggal-uji.html'),
    ('sesi/index.html',     'sesi.html',      'test/sesi-tunggal-uji.html'),
    ('sesi/proyektor.html', 'proyektor.html', 'test/proyektor-tunggal-uji.html'),
]

SUPABASE_CDN = ('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4'
                '/dist/umd/supabase.js"></script>')

UJI_CONFIG = """window.AJIOS_CONFIG = {
  /* Nilai uji. Klien Supabase sendiri diganti tiruan di stub.js. */
  url:  'https://uji.local',
  anon: 'eyJUJI',
  schema: 'ajios', origin: 'https://os.ajijaens.com'
};"""


def baca(rel):
    with open(os.path.join(APP, rel), encoding='utf-8') as f:
        return f.read()


def rakit(sumber):
    html = baca(sumber)
    dasar = os.path.dirname(sumber)

    def jalur(href):
        return os.path.normpath(os.path.join(dasar, href))

    # ---- gaya ----
    def ganti_css(m):
        href = m.group(1)
        if href.startswith('http'):
            return m.group(0)
        isi = baca(jalur(href))
        isi = re.sub(r"@import url\([^)]*\);\s*", '', isi)
        return '<style>\n' + isi + '</style>'

    html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', ganti_css, html)

    # ---- skrip ----
    def ganti_js(m):
        src = m.group(1)
        if src.startswith('http'):
            return m.group(0)
        return '<script>\n' + baca(jalur(src)) + '</script>'

    html = re.sub(r'<script src="([^"]+)"></script>', ganti_js, html)

    # ---- font di head ----
    if 'fonts.googleapis.com/css2' not in html:
        html = html.replace('<style>', FONT + '\n<style>', 1)

    tersisa = re.findall(r'(?:src|href)="((?!http|#|mailto)[^"]+\.(?:js|css))"', html)
    if tersisa:
        print('  ! masih menunjuk berkas luar: ' + ', '.join(sorted(set(tersisa))))
        return None
    return html


def versi_uji(html):
    """Halaman uji: CDN Supabase diganti tiruan lokal, dan nilai
    AJIOS_CONFIG diganti nilai uji. Sisanya persis sama dengan yang
    diunggah — itu justru intinya: yang diuji harus berkas yang sama."""
    if SUPABASE_CDN not in html:
        return None
    html = html.replace(SUPABASE_CDN, '<script src="stub.js"></script>', 1)
    baru, jml = re.subn(r'window\.AJIOS_CONFIG\s*=\s*\{.*?\};', UJI_CONFIG, html,
                        count=1, flags=re.S)
    if jml != 1:
        return None
    return baru


gagal = 0
for sumber, hasil, hasil_uji in HALAMAN:
    html = rakit(sumber)
    if html is None:
        gagal += 1
        print('GAGAL  ' + hasil)
        continue
    with open(os.path.join(APP, hasil), 'w', encoding='utf-8') as f:
        f.write(html)
    uji = versi_uji(html)
    if uji is None:
        gagal += 1
        print('GAGAL  %s: tag Supabase CDN tidak ditemukan, halaman uji tidak dibuat' % hasil)
        continue
    with open(os.path.join(APP, hasil_uji), 'w', encoding='utf-8') as f:
        f.write(uji)
    print('  ok   %-16s <- %-20s %7d bita   (+ %s)' % (hasil, sumber, len(html.encode()), hasil_uji))

sys.exit(1 if gagal else 0)
