"""Build an isolated static working copy from the retained public page snapshots."""
from pathlib import Path
from bs4 import BeautifulSoup
import html as html_module
import re, urllib.request, urllib.parse, hashlib, concurrent.futures, json
ROOT=Path(__file__).resolve().parent
OUT=ROOT/'dist'; OUT.mkdir(exist_ok=True)
ASSETS=OUT/'assets';ASSETS.mkdir(exist_ok=True)
pages={p.stem:p.read_text() for p in (ROOT/'source-pages').glob('*.html')}
assets={}; failures=[]
def local(url):
 url=urllib.parse.urljoin('https://osteporten.dk/',html_module.unescape(url))
 if url not in assets:
  ext=Path(urllib.parse.urlparse(url).path).suffix or '.css'
  assets[url]='/assets/'+hashlib.sha256(url.encode()).hexdigest()[:20]+ext
 return assets[url]
# Identify original images, fonts, styles, and CSS background URLs.
pattern=re.compile(r'https?://[^\s\"\x27<>\\)]+')
def eligible(u):
 p=urllib.parse.urlparse(u)
 return p.hostname in ('osteporten.dk','fonts.bunny.net') and ((p.path.startswith(('/wp-content/','/wp-includes/')) and bool(Path(p.path).suffix)) or p.hostname=='fonts.bunny.net')
for html in pages.values():
 for u in pattern.findall(html):
  if eligible(u) and not any(x in u for x in ['.php','/js/','frontend.js','/main.js']): local(u)
def fetch(item):
 u,dest=item
 p=OUT/dest.lstrip('/')
 if p.exists():return
 try:
  req=urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'})
  data=urllib.request.urlopen(req,timeout=40).read();p.write_bytes(data)
 except Exception as e:failures.append((u,str(e)))
for turn in range(4):
 pending=[x for x in list(assets.items()) if not (OUT/x[1].lstrip('/')).exists()]
 with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:list(pool.map(fetch,pending))
 before=len(assets)
 for u,d in list(assets.items()):
  p=OUT/d.lstrip('/')
  if p.exists() and ('.css' in d):
   css=p.read_text()
   if 'fonts.bunny.net/css' in u:
    css='\n'.join(block for block in re.findall(r'/\*[^*]*\*/\s*@font-face\s*\{[^}]+\}',css) if block.startswith(('/* latin */','/* latin-ext */')))
    css=re.sub(r",\s*url\([^)]*\) format\('woff'\)", '', css)
    p.write_text(css)
   for relative in re.findall(r'url\([\"\x27]?([^\)\"\x27]+)',css):
    if not relative.startswith(('data:','#','/assets/')):local(urllib.parse.urljoin(u,relative))
 if len(assets)==before:break
for u,d in list(assets.items()):
 p=OUT/d.lstrip('/')
 if p.exists() and '.css' in d:
  css=p.read_text()
  def rewrite(m):
   v=m.group(1).strip('\"\x27 ');full=urllib.parse.urljoin(u,v)
   return 'url("'+assets.get(full,v)+'")'
  p.write_text(re.sub(r'url\(([^)]+)\)',rewrite,css))
for slug,html in pages.items():
 soup=BeautifulSoup(html,'html.parser')
 for node in soup.select('script,iframe,link[rel="canonical"],link[rel="alternate"],link[rel="pingback"],link[rel="profile"]'):node.decompose()
 for node in soup.find_all(True):
  for attr in list(node.attrs):
   if attr.startswith('on'):del node[attr]
 for form in soup.select('form'):
  form['action']='#';form['data-demo-form']='true'
 for btn in soup.select('form button,form input[type="submit"]'):
  if btn.name=='button':btn.string='Afprøv formular'
 soup.head.append(soup.new_tag('meta',attrs={'name':'robots','content':'noindex, nofollow, noarchive'}))
 soup.head.append(soup.new_tag('meta',attrs={'http-equiv':'Content-Security-Policy','content':"connect-src 'none'; form-action 'none'; frame-src 'none'; object-src 'none'"}))
 soup.title.string=(soup.title.string or 'Osteporten')+' · Arbejdskopi'
 for a in soup.select('a[href]'):
  parsed=urllib.parse.urlparse(a['href'])
  if parsed.hostname=='osteporten.dk':
   a['href']=(parsed.path or '/')+('#'+parsed.fragment if parsed.fragment else '')
  elif parsed.scheme in ('tel','mailto'):
   a['data-disabled-contact']='true';a['href']='#demo-information'
 for img in soup.select('img'):
  if '{{brizy' in img.get('alt',''):img['alt']='Osteporten'
 text=str(soup)
 for u,d in sorted(assets.items(),key=lambda x:-len(x[0])):
  text=text.replace(u,d).replace(u.replace('&','&amp;'),d)
 # Original animation depended on Brizy JavaScript. Keep all content visible.
 style='''<style>.brz [data-animation],.brz .brz-animated{opacity:1!important;visibility:visible!important;animation:none!important;transform:none!important}.brz select{display:block!important;visibility:visible!important;opacity:1!important;width:100%;min-height:48px;padding:10px;background:#fff;color:#333;border:1px solid #ddd}.workcopy-banner{position:relative;z-index:999999;background:#f6e9b3;color:#2d3025;font:14px/1.5 Arial,sans-serif;text-align:center;padding:10px 20px}.demo-dialog{border:0;border-radius:12px;padding:28px;max-width:440px;box-shadow:0 12px 60px #0005;font:16px/1.6 Arial,sans-serif}.demo-dialog::backdrop{background:#0007}.demo-dialog button{background:#474e39;color:white;border:0;padding:10px 20px;border-radius:5px;cursor:pointer}html{scroll-behavior:smooth}</style>'''
 banner='<aside class="workcopy-banner" id="demo-information">Arbejdskopi af Osteporten · Kun til udvikling og afprøvning · Formularer sender ingen bestillinger eller beskeder.</aside>'
 dialog='<dialog class="demo-dialog" id="demo-dialog"><h2>Dette er en test</h2><p>Formularen er afprøvet. Der er ikke sendt eller gemt en bestilling eller besked.</p><button type="button" id="close-demo">Luk</button></dialog><script src="/demo.js" defer></script>'
 text=text.replace('</head>',style+'</head>').replace('<body ', '<body ',1)
 text=re.sub(r'(<body[^>]*>)',lambda m:m[0]+banner,text,count=1)
 text=text.replace('</body>',dialog+'</body>')
 dest=OUT/('index.html' if slug=='index' else slug+'/index.html');dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(text)
(OUT/'demo.js').write_text('''document.addEventListener('submit',event=>{event.preventDefault();event.stopImmediatePropagation();document.getElementById('demo-dialog').showModal();},true);document.getElementById('close-demo').addEventListener('click',()=>document.getElementById('demo-dialog').close());document.querySelectorAll('[data-disabled-contact]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();document.getElementById('demo-dialog').showModal();}));''')
(OUT/'demo.js').write_text((OUT/'demo.js').read_text()+"\ndocument.querySelectorAll('.brz-btn-submit').forEach(button=>{button.type='button';button.textContent='Afprøv formular';button.addEventListener('click',event=>{event.preventDefault();document.getElementById('demo-dialog').showModal();});});\n")
(OUT/'robots.txt').write_text('User-agent: *\nDisallow: /\n')
(ROOT/'asset-manifest.json').write_text(json.dumps(assets,indent=2))
print(json.dumps({'pages':len(pages),'assets':len(assets),'failures':failures},ensure_ascii=False))
