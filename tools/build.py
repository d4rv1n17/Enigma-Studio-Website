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

SITE_URL = os.environ.get("SITE_URL", "https://enigmastudioo.com/").rstrip("/") + "/"
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


# ---------------------------------------------------------------- news posts (one page per post)
NEWS_JS = """() => {
    const L = window.ENIGMA_I18N ? window.ENIGMA_I18N.lang : 'en';
    const t = (s) => (window.ENIGMA_I18N ? window.ENIGMA_I18N.t(s) : s);
    const pick = (v) => (v && typeof v === 'object' ? (v[L] || v.en || '') : (v || ''));
    const fmt = (d) => {
        const [y, m, day] = String(d).split('-').map(Number);
        const date = new Date(Date.UTC(y, (m || 1) - 1, day || 1));
        const o = day ? { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' } : { month: 'long', year: 'numeric', timeZone: 'UTC' };
        try { return new Intl.DateTimeFormat(({ en: 'en-GB', uk: 'uk-UA' })[L] || L, o).format(date); } catch (e) { return d; }
    };
    const ui = {};
    for (const k of ['All news', 'Read more', 'More news', 'Copy link', 'Link copied', 'News', 'Newsletter', 'Get the news first'])
        ui[k] = t(k);
    return { ui, posts: (window.ENIGMA_NEWS || []).map((n) => ({
        id: n.id, date: String(n.date), tag: n.tag || 'studio', image: n.image || '', link: n.link || '',
        title: pick(n.title), text: pick(n.text), dateText: fmt(n.date) })) };
}"""
NEWS_TAGS = {"studio": "Enigma Studio", "vof": "Veil of Fear", "twins": "Twins’ Hunt", "cube": "Enigma Cube", "disk": "Enigma Disk"}
POSTS = {}          # page name -> {lang: post}


def post_page(name):
    return name.startswith("news-") and name.endswith(".html")


def esc(x):
    return (str(x).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;"))


def big_image(path):
    big = path.replace("-1280.", ".")
    return big if (ROOT / big).exists() else path


def render_post(shell, post, others, ui):
    tag = post["tag"]
    ext = post["link"].startswith("http")
    target = ' target="_blank" rel="noopener"' if ext else ""
    img = big_image(post["image"])
    small = post["image"]
    srcset = f' srcset="{esc(small)} 1280w, {esc(img)} 2560w" sizes="(max-width: 960px) 100vw, 900px"' if img != small else ""
    cards = "".join(f'''
          <article class="news-card news-card--{esc(o["tag"])}">
            <a class="news-card__link" href="news-{esc(o["id"])}.html">
              <div class="frame news-card__media"><img src="{esc(o["image"])}" alt="" loading="lazy"></div>
              <div class="news-card__body">
                <p class="news-card__meta"><span class="news-card__tag">{esc(NEWS_TAGS.get(o["tag"], "Enigma Studio"))}</span><time datetime="{esc(o["date"])}">{esc(o["dateText"])}</time></p>
                <h3 class="news-card__title">{esc(o["title"])}</h3>
              </div>
            </a>
          </article>''' for o in others)
    main = f'''<main id="main" class="news-post" data-i18n-skip>
    <article class="container news-post__inner news-card--{esc(tag)}">
      <a class="news-post__back" href="news.html"><span aria-hidden="true">←</span> {esc(ui["All news"])}</a>
      <p class="news-card__meta news-post__meta"><span class="news-card__tag">{esc(NEWS_TAGS.get(tag, "Enigma Studio"))}</span><time datetime="{esc(post["date"])}">{esc(post["dateText"])}</time></p>
      <h1 class="news-post__title">{esc(post["title"])}</h1>
      <div class="frame news-post__media"><img src="{esc(small)}"{srcset} alt="{esc(post["title"])}"></div>
      <p class="lead news-post__text">{esc(post["text"])}</p>
      <div class="news-post__actions">
        <a class="ghost-btn news-post__cta" href="{esc(post["link"] or "news.html")}"{target}>{esc(ui["Read more"])} <span aria-hidden="true">→</span></a>
        <button class="news-card__share" type="button" data-share-url data-copied="{esc(ui["Link copied"])}"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.5 9.5 9.5 6.5M7 4.5l1.3-1.3a2.8 2.8 0 0 1 4 4L11 8.5M9 11.5l-1.3 1.3a2.8 2.8 0 0 1-4-4L5 7.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg><span>{esc(ui["Copy link"])}</span></button>
      </div>
    </article>
    <section class="section news-post__more" aria-labelledby="more-news">
      <div class="container">
        <h2 class="h2" id="more-news">{esc(ui["More news"])}</h2>
        <div class="news">{cards}
        </div>
      </div>
    </section>
  </main>'''
    html = re.sub(r"<main\b.*?</main>", lambda m: main, shell, count=1, flags=re.S)
    title = f'{post["title"]} — Enigma Studio'
    html = re.sub(r"<title>.*?</title>", lambda m: f"<title>{esc(title)}</title>", html, count=1, flags=re.S)
    html = re.sub(r'(<meta name="description" content=")[^"]*"', lambda m: m.group(1) + esc(post["text"]) + '"', html, count=1)
    og = f'assets/og/news/{post["id"]}.jpg'
    og = og if (ROOT / og).exists() else small
    html = re.sub(r'(<meta (?:property="og:image"|name="twitter:image") content=")[^"]*"', lambda m: m.group(1) + og + '"', html)
    html = html.replace('<meta property="og:type" content="website">', '<meta property="og:type" content="article">', 1)
    return html


def build_posts(port, translated):
    from playwright.sync_api import sync_playwright
    exe = os.environ.get("CHROMIUM_PATH")
    data = {}
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=exe or None, args=["--no-sandbox"])
        for lang in ["en"] + LANGS:
            ctx = browser.new_context()
            ctx.add_init_script(f"try{{localStorage.setItem('enigma-lang','{lang}')}}catch(e){{}}")
            allowed = ("config.js", "i18n-data.js", "i18n.js", "news.js")
            ctx.route(re.compile(r".*/src/.*\.js$"),
                      lambda route: route.continue_() if route.request.url.endswith(allowed) else route.abort())
            ctx.route(re.compile(r"^https?://(?!127\.0\.0\.1).*"), lambda route: route.abort())
            page = ctx.new_page()
            page.goto(f"http://127.0.0.1:{port}/news.html", wait_until="domcontentloaded")
            page.wait_for_function("!document.documentElement.classList.contains('i18n-wait') && window.ENIGMA_I18N && window.ENIGMA_NEWS")
            data[lang] = page.evaluate(NEWS_JS)
            ctx.close()
        browser.close()
    out = {}
    for lang, d in data.items():
        posts = [x for x in d["posts"] if x["id"]]
        shell = (ROOT / "news.html").read_text(encoding="utf-8") if lang == "en" else translated[(lang, "news.html")]
        for i, post in enumerate(posts):
            others = [o for o in posts if o["id"] != post["id"]][:3] if i else posts[1:4]
            name = f"news-{post['id']}.html"
            POSTS.setdefault(name, {})[lang] = post
            out[(lang, name)] = render_post(shell, post, others, d["ui"])
    return out, data


def rss(data):
    from email.utils import format_datetime
    from datetime import datetime, timezone
    for lang, d in data.items():
        items = []
        for post in d["posts"][:20]:
            y, m, *rest = (post["date"].split("-") + ["1"])[:3]
            when = datetime(int(y), int(m), int(rest[0] or 1), 9, 0, tzinfo=timezone.utc)
            url = page_url(lang, f"news-{post['id']}.html")
            img = SITE_URL + big_image(post["image"])
            items.append(f"""  <item>
    <title>{esc(post['title'])}</title>
    <link>{url}</link>
    <guid isPermaLink="true">{url}</guid>
    <pubDate>{format_datetime(when)}</pubDate>
    <description>{esc(post['text'])}</description>
    <enclosure url="{esc(img)}" type="image/{'jpeg' if img.endswith('.jpg') else 'webp'}" length="0"/>
  </item>""")
        feed = page_url(lang, "news.xml")
        xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Enigma Studio — {esc(d['ui']['News'])}</title>
  <link>{page_url(lang, 'news.html')}</link>
  <atom:link href="{feed}" rel="self" type="application/rss+xml"/>
  <description>Enigma Studio</description>
  <language>{lang}</language>
{chr(10).join(items)}
</channel>
</rss>
"""
        folder = DIST if lang == "en" else DIST / lang
        folder.mkdir(exist_ok=True)
        (folder / "news.xml").write_text(xml, encoding="utf-8")


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
    elif name == "last-signal.html":
        data = {"@context": "https://schema.org", "@type": "VideoGame", "name": "Last Signal", "url": url,
                "description": desc, "genre": ["Detective", "Horror", "Puzzle"], "gamePlatform": "Web browser",
                "playMode": "CoOp", "numberOfPlayers": {"@type": "QuantitativeValue", "value": 2},
                "inLanguage": lang, "image": SITE_URL + "assets/og/last-signal.jpg",
                "isPartOf": {"@type": "VideoGameSeries", "name": "Veil of Fear"},
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
    elif post_page(name) and lang in POSTS.get(name, {}):
        post = POSTS[name][lang]
        data = {"@context": "https://schema.org", "@type": "NewsArticle", "headline": post["title"], "url": url,
                "description": post["text"], "inLanguage": lang, "datePublished": post["date"],
                "image": SITE_URL + big_image(post["image"]), "author": studio, "publisher": studio}
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
    for name in pages() + sorted(POSTS):
        if name in NO_LANG_PAGES:
            continue
        for lang in ["en"] + LANGS:
            alts = "".join(f'\n    <xhtml:link rel="alternate" hreflang="{l}" href="{page_url(l, name)}"/>' for l in ["en"] + LANGS)
            alts += f'\n    <xhtml:link rel="alternate" hreflang="x-default" href="{page_url("en", name)}"/>'
            prio = "1.0" if name == "index.html" else ("0.3" if name == "privacy.html" else ("0.6" if post_page(name) else "0.8"))
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
        posts, news_data = build_posts(httpd.server_address[1], translated)
    finally:
        httpd.shutdown()

    for name in pages():
        src = (ROOT / name).read_text(encoding="utf-8")
        if name in NO_LANG_PAGES:
            continue
        # English pages: mark them as built (so visitors are sent to their language's address)
        html = src.replace("<html lang=\"en\">", "<html lang=\"en\" data-built>", 1)
        (DIST / name).write_text(finish(html, name, "en"), encoding="utf-8")

    for (lang, name), html in posts.items():
        if lang == "en":
            html = html.replace("<html lang=\"en\">", "<html lang=\"en\" data-built>", 1)
            (DIST / name).write_text(finish(html, name, "en"), encoding="utf-8")
        else:
            translated[(lang, name)] = html

    for (lang, name), html in translated.items():
        html = re.sub(r"<html[^>]*>", f'<html lang="{lang}" data-lang-fixed="{lang}">', html, count=1)
        html = finish(to_subfolder(html), name, lang)
        (DIST / lang).mkdir(exist_ok=True)
        (DIST / lang / name).write_text(html, encoding="utf-8")

    sitemap()
    rss(news_data)
    fix_404()
    log(f"Done: {len(pages()) + len(POSTS)} pages x {1 + len(LANGS)} languages -> {DIST}")


if __name__ == "__main__":
    sys.exit(main())
