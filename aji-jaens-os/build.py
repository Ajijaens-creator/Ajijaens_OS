import pathlib
d = pathlib.Path(__file__).parent / 'src'
ORDER = ['p3_data.js', 'p4_core.js', 'p5_v1.js', 'p6_v2.js', 'p7_v3.js', 'p9_1a.js', 'p10_dummy.js', 'p11_form.js', 'p12_myday.js', 'p13_import.js', 'p14_tasks.js', 'p15_network.js', 'p16_os.js', 'p17_ai.js', 'p18_business.js', 'p19_rest.js', 'p20_final.js', 'p21_lock.js', 'p22_links.js', 'p23_board.js', 'p24_cloud.js', 'p25_np01.js', 'p26_np02.js', 'p8_ai.js']
css   = (d/'head.css').read_text()
shell = (d/'shell.html').read_text()
js    = "".join((d/f).read_text() for f in ORDER)
page  = "<title>Aji Jaens OS</title>\n<style>" + css + "</style>" + shell + "<script>" + js + "</" + "script>"
dist = d.parent / 'dist'; dist.mkdir(exist_ok=True)
# 1) versi untuk Artifact — tanpa pembungkus dokumen, kerangkanya ditambahkan saat terbit
(dist/'AJI-JAENS-OS.html').write_text(page)
# 2) versi mandiri — bisa dibuka langsung sebagai berkas
standalone = ('<!doctype html>\n<html lang="id">\n<head>\n<meta charset="utf-8">\n'
  '<meta name="viewport" content="width=device-width,initial-scale=1">\n'
  '<title>Aji Jaens OS — Life by Design</title>\n<style>' + css + '</style>\n</head>\n<body>\n'
  + shell + '<script>' + js + '</' + 'script>\n</body>\n</html>\n')
(dist/'AJI-JAENS-OS-LIVE.html').write_text(standalone)
for f in ['AJI-JAENS-OS.html','AJI-JAENS-OS-LIVE.html']:
    print(f, round((dist/f).stat().st_size/1024,1), 'KB')
