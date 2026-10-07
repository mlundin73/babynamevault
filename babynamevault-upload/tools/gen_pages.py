#!/usr/bin/env python3
"""Generate static, crawlable per-name pages + letter hubs + sitemap + robots.
Usage: gen_pages.py [--base https://example.com/path] [--out DIR]"""
import json, re, os, sys, unicodedata, html, collections, shutil, datetime
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
base = "https://SITE_URL_PLACEHOLDER"; out = ROOT
a = sys.argv[1:]
if "--base" in a: base = a[a.index("--base")+1].rstrip("/")
if "--out" in a: out = a[a.index("--out")+1]
CUL = {"african":"African","african-american":"African American","arabic":"Arabic","east-asian":"East Asian","indian":"Indian / South Asian","irish":"Irish / Celtic","jewish":"Jewish / Hebrew","latino":"Latino / Hispanic","pacific-islander":"Pacific Islander","southeast-asian":"Southeast Asian","western":"Western / English"}
CAT = {"traditional":"Traditional","trendy":"Modern trendy respelling","distinctive":"Distinctive & inventive"}
GEN = {"boy":"Boy","girl":"Girl","neutral":"Gender-neutral"}
SRC = {"n":"Nurturepedia open baby-names dataset","d":"name-db open dataset","j":"JapaneseNamer open data","i":"Indonesian baby-name corpus (CC BY 4.0), translated to English","c":"General etymology compiled for BabyNameVault","a":"Etymology compiled for BabyNameVault from general references (not individually verified)"}
def fold(s): return re.sub(r"[ʻ’'\s-]","",re.sub(r"[̀-ͯ]","",unicodedata.normalize("NFD",s))).lower()
def slug(s):
    f=re.sub(r"[^a-z0-9]","",fold(s)); return f
E=html.escape
names=json.load(open(f"{ROOT}/data/names.json")); mean=json.load(open(f"{ROOT}/data/meanings.json"))
by=collections.defaultdict(list); disp={}
for g in names:
    for v in g["variants"]:
        s=slug(v)
        if not s: continue
        if g not in by[s]: by[s].append(g)
        disp.setdefault(s,v)
        if v.lower()==g["variants"][0].lower() and g is by[s][0]: disp[s]=v
def gmean(g,s):
    cand=[s]+[slug(x) for x in g["variants"]]
    for k in cand:
        for kk in (k,):
            for mk,mv in ((kk,mean.get(kk)),):
                if mv: return mv
    return None
def best_meaning(s):
    for g in by[s]:
        m=gmean(g,s)
        if m: return m
    return None
ph=out+"/name"
if os.path.isdir(ph): shutil.rmtree(ph)
os.makedirs(ph); os.makedirs(out+"/names",exist_ok=True)
CSS_LINK='<link rel="stylesheet" href="{r}css/styles.css"><link rel="stylesheet" href="{r}css/pages.css">'
def shell(title,desc,canon,body,r,robots=None,extra=""):
    rb=f'<meta name="robots" content="{robots}">' if robots else ""
    return f'''<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{E(title)}</title><meta name="description" content="{E(desc)}"><link rel="canonical" href="{E(canon)}">{rb}
<meta property="og:title" content="{E(title)}"><meta property="og:description" content="{E(desc)}"><meta property="og:type" content="website"><meta property="og:url" content="{E(canon)}">
{CSS_LINK.format(r=r)}{extra}</head><body>
<header class="site-header"><a href="{r}index.html" class="wordmark">Baby<span>Name</span>Vault</a><p class="tagline">Discover, spell &amp; create baby names - across every culture and style</p></header>
<main class="page">{body}</main>
<footer class="page-foot"><a href="{r}index.html">Name finder</a> · <a href="{r}names/a.html">Browse A–Z</a></footer></body></html>'''
slugs=sorted(by); indexable=[]; sorted_by_cg=collections.defaultdict(list)
for s in slugs:
    for g in by[s]: sorted_by_cg[(g["culture"],g["gender"])].append(s)
for k in sorted_by_cg: sorted_by_cg[k]=sorted(set(sorted_by_cg[k]))
for s in slugs:
    gs=by[s]; name=disp[s]; m=best_meaning(s)
    spell=[]; 
    for g in gs:
        for v in g["variants"]:
            if slug(v)!=s and v not in spell: spell.append(v)
    cults=[]; 
    for g in gs:
        c=CUL[g["culture"]]
        if c not in cults: cults.append(c)
    genders=sorted({g["gender"] for g in gs})
    gtxt=" / ".join(GEN[x].lower() for x in genders)
    thin = not m and len(spell)<2
    if m: desc=f"{name} is a {gtxt} name ({', '.join(cults[:2])}). Meaning: {m[1][:110].rstrip('. ')}. Spellings and similar names."
    else: desc=f"{name}: a {gtxt} baby name in {', '.join(cults[:2])} naming traditions, with {len(spell)+1} spelling{'s' if spell else ''} and similar names."
    body=f'<h1>{E(name)} <span class="sub">name meaning, origin &amp; spellings</span></h1>'
    if m:
        body+=f'<div class="meaning-card"><p class="meaning-text">{E(m[1])}</p><p class="meaning-src">{"Origin: "+E(m[3])+" · " if m[3] else ""}Source: {E(SRC.get(m[2],""))}</p></div>'
    else:
        body+=f'<p class="muted">We don’t have a documented meaning on file for {E(name)} yet.</p>'
    for g in gs:
        nat=f' <span class="native-script">{E(g["native"])}</span>' if g.get("native") else ""
        pills="".join(f'<a class="variant-pill" href="{slug(v)}.html">{E(v)}</a>' if slug(v)!=s else f'<span class="variant-pill cur">{E(v)}</span>' for v in g["variants"] if slug(v))
        body+=f'<section class="grp"><h2>{E(CUL[g["culture"]])}{nat}</h2><div class="meaning-chips"><span>{E(CAT[g["category"]])}</span><span>{GEN[g["gender"]]}</span></div><p>Spellings &amp; variants</p><div class="variants">{pills}</div></section>'
    g0=gs[0]; lst=sorted_by_cg[(g0["culture"],g0["gender"])]; i=lst.index(s)
    near=[x for x in lst[max(0,i-6):i+7] if x!=s][:10]
    body+='<section class="grp"><h2>Similar names</h2><div class="variants">'+"".join(f'<a class="variant-pill" href="{x}.html">{E(disp[x])}</a>' for x in near)+f'</div></section>'
    body+=f'<p><a class="cta" href="../index.html">Find more {E(CUL[g0["culture"]])} names →</a> · <a href="../names/{s[0] if s[0].isalpha() else "a"}.html">More names starting with {E(s[0].upper())}</a></p>'
    canon=f"{base}/name/{s}.html"
    open(f"{ph}/{s}.html","w").write(shell(f"{name} – Name Meaning, Origin & Spellings | BabyNameVault",desc,canon,body,"../","noindex,follow" if thin else None))
    if not thin: indexable.append(s)
# letter hubs
letters=collections.defaultdict(list)
for s in slugs: letters[s[0] if s[0].isalpha() else "#"].append(s)
nav=lambda r:"".join(f'<a href="{r}{l.lower()}.html">{l}</a>' for l in sorted(letters) if l!="#")
for l,ss in letters.items():
    if l=="#": continue
    body=f'<h1>Baby names starting with {l}</h1><p class="muted">{len(ss):,} names and spellings.</p><nav class="az">{nav("")}</nav><ul class="namelist">'+"".join(f'<li><a href="../name/{s}.html">{E(disp[s])}</a></li>' for s in ss)+"</ul>"
    open(f"{out}/names/{l.lower()}.html","w").write(shell(f"Baby Names Starting with {l} – {len(ss):,} Names | BabyNameVault",f"Browse {len(ss):,} baby names and spellings that start with {l}, with meanings, origins and variants from many cultures.",f"{base}/names/{l.lower()}.html",body,"../"))
open(f"{out}/css/pages.css","w").write('''.page{max-width:820px;margin:0 auto;padding:16px}
.page h1{font-size:1.8rem;margin:.4em 0}.page h1 .sub{display:block;font-size:.95rem;font-weight:400;opacity:.7;margin-top:.2em}
.grp{margin:18px 0;padding:14px;border:1px solid rgba(128,128,128,.3);border-radius:12px}.grp h2{margin:0 0 8px;font-size:1.1rem}
.muted{opacity:.7}.cta{font-weight:600}a.variant-pill{text-decoration:none}.variant-pill.cur{font-weight:700}
.az{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.az a{padding:4px 9px;border:1px solid rgba(128,128,128,.35);border-radius:8px;text-decoration:none}
.namelist{columns:3 180px;list-style:none;padding:0}.namelist li{padding:2px 0}
.page-foot{text-align:center;padding:24px;opacity:.8}''')
today=datetime.date.today().isoformat()
urls=[f"{base}/"]+[f"{base}/names/{l.lower()}.html" for l in sorted(letters) if l!="#"]+[f"{base}/name/{s}.html" for s in indexable]
CH=40000; files=[]
for i in range(0,len(urls),CH):
    fn=f"sitemap-{i//CH+1}.xml"; files.append(fn)
    open(f"{out}/{fn}","w").write('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+"".join(f"<url><loc>{E(u)}</loc><lastmod>{today}</lastmod></url>" for u in urls[i:i+CH])+"</urlset>")
open(f"{out}/sitemap.xml","w").write('<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+"".join(f"<sitemap><loc>{base}/{f}</loc><lastmod>{today}</lastmod></sitemap>" for f in files)+"</sitemapindex>")
open(f"{out}/robots.txt","w").write(f"User-agent: *\nAllow: /\n\nSitemap: {base}/sitemap.xml\n")
print("pages",len(slugs),"indexable",len(indexable),"thin/noindex",len(slugs)-len(indexable),"with meaning",sum(1 for s in slugs if best_meaning(s)))
