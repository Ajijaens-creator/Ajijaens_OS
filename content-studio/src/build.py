import pathlib
d = pathlib.Path('/home/claude/studio')
css   = (d/'base.css').read_text() + "\n" + (d/'extra.css').read_text()
logo  = (d/'logo.txt').read_text().strip()
shell = (d/'shell.html').read_text().replace('__LOGO__', logo)
js = "\n".join((d/f).read_text() for f in
      ['icons.js','s1_core.js','s2_form.js','s3_board.js','s4_views.js','s5_cloud.js'])
theme = """
function toggleTheme(){
  const r = document.documentElement;
  const cur = r.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const nxt = cur === 'dark' ? 'light' : 'dark';
  r.setAttribute('data-theme', nxt);
  try{ localStorage.setItem('jaens-studio-theme', nxt); }catch(e){}
}
try{ const t = localStorage.getItem('jaens-studio-theme'); if(t) document.documentElement.setAttribute('data-theme', t); }catch(e){}
"""
body = "<title>Jaens Content Studio</title>\n<style>\n" + css + "\n</style>\n" + shell + "\n<script>\n" + theme + "\n" + js + "\n</" + "script>\n"
(d/'studio.html').write_text(body)
standalone = ("<!doctype html>\n<html lang=\"id\">\n<head>\n<meta charset=\"utf-8\">\n"
  "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n"
  "<title>Jaens Content Studio</title>\n<style>\n" + css + "\n</style>\n</head>\n<body>\n"
  + shell + "\n<script>\n" + theme + "\n" + js + "\n</" + "script>\n</body>\n</html>\n")
(d/'JAENS-CONTENT-STUDIO.html').write_text(standalone)
for f in ['studio.html','JAENS-CONTENT-STUDIO.html']:
    print(f, round((d/f).stat().st_size/1024,1), 'KB')
