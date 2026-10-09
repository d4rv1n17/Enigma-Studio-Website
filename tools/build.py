"""
Enigma Studio — build the published version of the site (for Google).

Takes the site as it is (English pages + translations in src/i18n-data.js)
and writes a ready-to-publish copy to dist/:

  dist/            English pages (as now)
  dist/ru/ ro/ uk/ the same pages, already translated, with their own address
  dist/sitemap.xml list of all pages and their language versions
  dist/robots.txt  points Google to the sitemap

Every page also gets: canonical address, links to its other languages
(hreflang), full addresses for link previews, and a short description of the
studio / game / app for Google (structured data).

Run:   python tools/build.py            (needs: pip install playwright
                                         and: python -m playwright install chromium)
The GitHub workflow in .github/workflows/pages.yml runs this automatically
on every push and publishes dist/ to GitHub Pages.

The address of the published site is SITE_URL below (or the SITE_URL
environment variable). Change it when you connect your own domain.
"""
import json
import os
import re
import shutil
import sys
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

SITE_URL = os.environ.get("SITE_URL", "https://d4rv1n17.github.io/Enigma-Studio-Website/").rstrip("/") + "/"
ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
LANGS = ["ru", "ro", "uk"]
OG_LOCALE = {"en": "en_GB", "ru": "ru_RU", "ro": "ro_RO", "uk": "uk_UA"}
SKIP = {"dist", "tools", ".github", ".git", "README.md", "start-site.bat", "start-site.ps1", "start-site.command"}
NO_LANG_PAGES = {"404.html"}                  # one page for the whole site
ASSET_PREFIXES = ("assets/", "src/", "downloads/", "favicon.ico", "site.webmanifest")


def log(*a):
    print(*a, flush=True)


# ---------------------------------------------------------------- copy
def copy_site():
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()
    for item in ROOT.iterdir():
        if item.name in SKIP or item.name.startswith("."):
            continue
        if item.is_dir():
            shutil.copytree(item, DIST / item.name)
        else:
            shutil.copy2(item, DIST / item.name)


def pages():
    return sorted(p.name for p in ROOT.glob("*.html"))


# ---------------------------------------------------------------- local server for the browser
def serve(directory):
    class Quiet(SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    handler = partial(Quiet, directory=str(directory))
    httpd = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


# ---------------------------------------------------------------- translation (in a real browser,
# with exactly the same code the visitors run, so the result always matches)
def prerender(port):
    from playwright.sync_api import sync_playwright
    out = {}
    exe = os.environ.get("CHROMIUM_PATH")
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=exe or None, args=["--no-sandbox"])
        for lang in LANGS:
            ctx = browser.new_context()
            ctx.add_init_script(f"try{{localStorage.setItem('enigma-lang','{lang}')}}catch(e){{}}")
            # only the translation runs; everything else (menus, videos, news...) runs later in the visitor's browser
            allowed = ("config.js", "i18n-data.js", "i18n.js")
            ctx.route(re.compile(r".*/src/.*\.js$"),
                      lambda route: route.continue_() if route.request.url.endswith(allowed) else route.abort())
            ctx.route(re.compile(r"^https?://(?!127\.0\.0\.1).*"), lambda route: route.abort())
            page = ctx.new_page()
            for name in pages():
                if name in NO_LANG_PAGES:
                    continue
                page.goto(f"http://127.0.0.1:{port}/{name}", wait_until="domcontentloaded")
                page.wait_for_function("!document.documentElement.classList.contains('i18n-wait') && window.ENIGMA_I18N")
                html = page.evaluate("""() => {
                    const d = document.documentElement;
                    d.querySelectorAll('.lang').forEach((e) => e.remove());
                    d.removeAttribute('class');
                    return '<!doctype html>\\n' + d.outerHTML;
                }""")
                out[(lang, name)] = html
            ctx.close()
        browser.close()
    return out


# ---------------------------------------------------------------- page helpers
def page_url(lang, name):
    path = "" if name == "index.html" else name
    return SITE_URL + ("" if lang == "en" else f"{lang}/") + path


def head_links(name, lang):
    tags = [f'<link rel="canonical" href="{page_url(lang, name)}">']
    for l in ["en"] + LANGS:
        tags.append(f'<link rel="alternate" hreflang="{l}" href="{page_url(l, name)}">')
    tags.append(f'<link rel="alternate" hreflang="x-default" href="{page_url("en", name)}">')
    tags.append(f'<meta property="og:url" content="{page_url(lang, name)}">')
    tags.append(f'<meta property="og:locale" content="{OG_LOCALE[lang]}">')
    for l in ["en"] + LANGS:
        if l != lang:
            tags.append(f'<meta property="og:locale:alternate" content="{OG_LOCALE[l]}">')
    return "\n  ".join(tags)


def meta(html, name, attr="name"):
    m = re.search(rf'<meta {attr}="{re.escape(name)}" content="([^"]*)"', html)
    return m.group(1) if m else ""


def structured_data(name, html, lang):
    desc = meta(html, "description")
    studio = {
        "@type": "Organization",
        "@id": SITE_URL + "#studio",
        "name": "Enigma Studio",
        "url": SITE_URL,
        "logo": SITE_URL + "assets/brand/logo.png",
        "email": "enigmastudio.md@gmail.com",
        "foundingDate": "2022-01",
        "slogan": "Not Just a Studio, An Enigma.",
        "sameAs": [
            "https://www.youtube.com/@enigmastudiomd",
            "https://www.instagram.com/enigmastudio.md/",
            "https://www.tiktok.com/@enigmastudiomd",
            "https://github.com/d4rv1n17",
        ],
    }
    url = page_url(lang, name)
    if name == "index.html":
        data = [dict(studio, **{"@context": "https://schema.org", "description": desc}),
                {"@context": "https://schema.org", "@type": "WebSite", "name": "Enigma Studio", "url": SITE_URL,
                 "inLanguage": ["en", "ru", "ro", "uk"], "publisher": {"@id": SITE_URL + "#studio"}}]
    elif name == "veil-of-fear.html":
        data = {"@context": "https://schema.org", "@type": "VideoGame", "name": "Veil of Fear", "url": url,
                "description": desc, "genre": ["Psychological horror", "Horror"], "gamePlatform": "PC",
                "operatingSystem": "Windows", "inLanguage": lang,
                "image": SITE_URL + "assets/art/game-banner.webp",
                "author": studio, "publisher": studio}
    elif name == "twins-hunt.html":
        data = {"@context": "https://schema.org", "@type": "VideoGame", "name": "Twins’ Hunt", "url": url,
                "description": desc, "genre": ["Action", "Horror"], "gamePlatform": "Android",
                "operatingSystem": "Android", "applicationCategory": "GameApplication", "datePublished": "2023-09-25",
                "contentRating": "12+", "inLanguage": lang,
                "image": SITE_URL + "assets/twins/banner.webp",
                "sameAs": "https://play.google.com/store/apps/details?id=com.EnigmaStudio.TwinsHunt",
                "trailer": {"@type": "VideoObject", "name": "Twins’ Hunt — Trailer", "embedUrl": "https://www.youtube.com/embed/vwAguZZrS5o",
                            "thumbnailUrl": "https://i.ytimg.com/vi/vwAguZZrS5o/hqdefault.jpg", "uploadDate": "2023-09-25",
                            "description": desc},
                "author": studio, "publisher": studio}
    elif name == "enigma-cube.html":
        data = {"@context": "https://schema.org", "@type": "SoftwareApplication", "name": "Enigma Cube", "url": url,
                "description": desc, "applicationCategory": "UtilitiesApplication", "operatingSystem": "Windows 10, Windows 11",
                "softwareVersion": "3.1", "datePublished": "2022-04-09", "dateModified": "2026-10-09", "inLanguage": lang,
                "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
                "image": SITE_URL + "assets/app/cube-banner.webp",
                "isAccessibleForFree": True, "codeRepository": "https://github.com/d4rv1n17/Enigma-Cube",
                "author": studio, "publisher": studio}
    elif name == "enigma-disk.html":
        data = {"@context": "https://schema.org", "@type": "SoftwareApplication", "name": "Enigma Disk", "url": url,
                "description": desc, "applicationCategory": "UtilitiesApplication", "operatingSystem": "Windows 10, Windows 11",
                "softwareVersion": "1.1", "datePublished": "2026-10-09", "inLanguage": lang, "isAccessibleForFree": True,
                "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
                "downloadUrl": "https://github.com/d4rv1n17/Enigma-Disk/releases/latest",
                "codeRepository": "https://github.com/d4rv1n17/Enigma-Disk",
                "image": SITE_URL + "assets/og/enigma-disk.jpg",
                "author": studio, "publisher": studio}
    else:
        return ""
    return '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False) + "</script>"


def absolutize_social(html, lang, name):
    # link previews need full addresses
    html = re.sub(r'(<meta (?:property="og:image"|name="twitter:image") content=")(?!https?:)([^"]+)"',
                  lambda m: m.group(1) + SITE_URL + m.group(2) + '"', html)
    title = re.search(r"<title>(.*?)</title>", html, re.S).group(1).strip()
    desc = meta(html, "description")
    for key, val in (('property="og:title"', title), ('name="twitter:title"', title),
                     ('property="og:description"', desc), ('name="twitter:description"', desc)):
        html = re.sub(rf'(<meta {key} content=")[^"]*"', lambda m: m.group(1) + val.replace("\\", "") + '"', html)
    return html


def finish(html, name, lang):
    extra = head_links(name, lang)
    ld = structured_data(name, html, lang)
    if ld:
        extra += "\n  " + ld
    html = html.replace("</head>", f"  {extra}\n</head>", 1)
    return absolutize_social(html, lang, name)


def to_subfolder(html):
    # assets live one folder up
    pref = "|".join(re.escape(p) for p in ASSET_PREFIXES)
    html = re.sub(rf'((?:src|href|data-full|poster)=")(?=(?:{pref}))', r"\1../", html)
    html = re.sub(rf'(srcset="[^"]*")', lambda m: re.sub(rf'(^srcset="|,\s*)(?=(?:{pref}))', r"\1../", m.group(1)), html)
    # tell the scripts where the assets are, before anything else runs
    html = html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n  <script>window.ENIGMA_ROOT=\'../\'</script>', 1)
    return html


# ---------------------------------------------------------------- sitemap / robots / 404
def sitemap():
    rows = []
    for name in pages():
        if name in NO_LANG_PAGES:
            continue
        for lang in ["en"] + LANGS:
            alts = "".join(f'\n    <xhtml:link rel="alternate" hreflang="{l}" href="{page_url(l, name)}"/>' for l in ["en"] + LANGS)
            alts += f'\n    <xhtml:link rel="alternate" hreflang="x-default" href="{page_url("en", name)}"/>'
            prio = "1.0" if name == "index.html" else ("0.3" if name == "privacy.html" else "0.8")
            rows.append(f"  <url>\n    <loc>{page_url(lang, name)}</loc>{alts}\n    <priority>{prio}</priority>\n  </url>")
    xml = ('<?xml version="1.0" encoding="UTF-8"?>\n'
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
           + "\n".join(rows) + "\n</urlset>\n")
    (DIST / "sitemap.xml").write_text(xml, encoding="utf-8")
    (DIST / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {SITE_URL}sitemap.xml\n", encoding="utf-8")


def fix_404():
    # the 404 page is shown for any wrong address, also inside /ru/ etc., so its links must be absolute
    p = DIST / "404.html"
    if p.exists():
        html = p.read_text(encoding="utf-8")
        html = html.replace("<head>", f'<head>\n  <base href="{SITE_URL}">', 1)
        p.write_text(html, encoding="utf-8")


# ---------------------------------------------------------------- main
def main():
    log(f"Building for {SITE_URL}")
    copy_site()
    httpd = serve(ROOT)
    try:
        translated = prerender(httpd.server_address[1])
    finally:
        httpd.shutdown()

    for name in pages():
        src = (ROOT / name).read_text(encoding="utf-8")
        if name in NO_LANG_PAGES:
            continue
        # English pages: mark them as built (so visitors are sent to their language's address)
        html = src.replace("<html lang=\"en\">", "<html lang=\"en\" data-built>", 1)
        (DIST / name).write_text(finish(html, name, "en"), encoding="utf-8")

    for (lang, name), html in translated.items():
        html = re.sub(r"<html[^>]*>", f'<html lang="{lang}" data-lang-fixed="{lang}">', html, count=1)
        html = finish(to_subfolder(html), name, lang)
        (DIST / lang).mkdir(exist_ok=True)
        (DIST / lang / name).write_text(html, encoding="utf-8")

    sitemap()
    fix_404()
    log(f"Done: {len(pages())} pages x {1 + len(LANGS)} languages -> {DIST}")


if __name__ == "__main__":
    sys.exit(main())
