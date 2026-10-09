// =========================================================
// Enigma Studio — languages (English, Русский, Română, Українська)
//
// The pages are written in English. Translations live in
// src/i18n-data.js as { ru: { "English text": "перевод" }, ... }.
// After the page has loaded, every piece of text whose English
// original is in the dictionary is swapped for the translation.
// Text that is not in the dictionary (game names, e-mail...) stays.
//
// The language is picked in the head of every page (saved choice,
// otherwise the browser language) and stored in <html lang>.
// =========================================================
(() => {
  const root = document.documentElement;
  const LANGS = [
    { code: 'en', short: 'EN', name: 'English' },
    { code: 'ru', short: 'RU', name: 'Русский' },
    { code: 'ro', short: 'RO', name: 'Română' },
    { code: 'uk', short: 'UA', name: 'Українська' },
  ];
  const known = (c) => LANGS.some((l) => l.code === c);
  const lang = known(root.lang) ? root.lang : 'en';
  const DATA = window.ENIGMA_I18N_DATA || {};
  const dict = lang === 'en' ? {} : (DATA[lang] || {});
  const norm = (s) => String(s).replace(/\s+/g, ' ').trim();

  // translate one English string (used by the other scripts for text they set later)
  const t = (s) => {
    if (lang === 'en' || s == null) return s;
    const hit = dict[norm(s)];
    return hit == null ? s : hit;
  };

  // ---------- walking the page ----------
  const SKIP = 'script, style, svg, noscript, template, [data-i18n-skip], [translate="no"]';
  const INLINE = new Set(['STRONG', 'EM', 'B', 'I', 'BR', 'SPAN', 'SMALL', 'ABBR', 'TIME', 'MARK', 'SUP', 'SUB', 'CODE', 'KBD']);
  const ATTRS = ['alt', 'aria-label', 'placeholder', 'title'];

  // an element whose whole inner HTML is one sentence (text plus simple inline tags)
  const isUnit = (el) => {
    if (el.hasAttribute('data-i18n-unit')) return true;   // a sentence with links inside, translated as a whole
    let text = false;
    el.childNodes.forEach((n) => { if (n.nodeType === 3 && n.nodeValue.trim()) text = true; });
    if (!text) return false;
    for (const d of el.querySelectorAll('*')) {
      if (!INLINE.has(d.tagName)) return false;
      for (const a of d.attributes) if (a.name.startsWith('data-') || a.name === 'id') return false;
    }
    return true;
  };

  const collect = (start) => {
    const units = [];
    const texts = [];
    const walk = (el) => {
      if (el.matches(SKIP)) return;
      if (isUnit(el)) { units.push(el); return; }
      el.childNodes.forEach((n) => {
        if (n.nodeType === 3) { if (n.nodeValue.trim()) texts.push(n); }
        else if (n.nodeType === 1) walk(n);
      });
    };
    walk(start);
    const attrs = [];
    start.querySelectorAll(ATTRS.map((a) => `[${a}]`).join(',')).forEach((el) => {
      if (el.closest(SKIP)) return;
      ATTRS.forEach((a) => { if (el.hasAttribute(a) && el.getAttribute(a).trim()) attrs.push([el, a]); });
    });
    return { units, texts, attrs };
  };

  const translate = (start = document.body) => {
    if (lang === 'en') return;
    const { units, texts, attrs } = collect(start);
    units.forEach((el) => {
      const hit = dict[norm(el.innerHTML)];
      if (hit != null) el.innerHTML = hit;
    });
    texts.forEach((n) => {
      const hit = dict[norm(n.nodeValue)];
      if (hit == null) return;
      const lead = /^\s/.test(n.nodeValue) ? ' ' : '';
      const tail = /\s$/.test(n.nodeValue) ? ' ' : '';
      n.nodeValue = lead + hit + tail;
    });
    attrs.forEach(([el, a]) => {
      const hit = dict[norm(el.getAttribute(a))];
      if (hit != null) el.setAttribute(a, hit);
    });
    const title = dict[norm(document.title)];
    if (title) document.title = title;
    const desc = document.querySelector('meta[name="description"]');
    if (desc && dict[norm(desc.content)]) desc.content = dict[norm(desc.content)];
  };

  // every English string on the page — used to build the dictionary
  const strings = () => {
    const out = new Set();
    const { units, texts, attrs } = collect(document.body);
    units.forEach((el) => out.add(norm(el.innerHTML)));
    texts.forEach((n) => out.add(norm(n.nodeValue)));
    attrs.forEach(([el, a]) => out.add(norm(el.getAttribute(a))));
    out.add(norm(document.title));
    const desc = document.querySelector('meta[name="description"]');
    if (desc) out.add(norm(desc.content));
    return [...out].filter((s) => /[A-Za-z]/.test(s));
  };

  // ---------- the switcher in the header ----------
  const setLang = (code) => {
    if (code === lang) return;
    try { localStorage.setItem('enigma-lang', code); } catch (e) { /* private mode */ }
    // the published site has its own page per language (/ru/, /ro/, /uk/): go there;
    // the plain source version just reloads and translates in place
    let go = () => location.reload();
    const fixed = root.getAttribute('data-lang-fixed');
    if (fixed || root.hasAttribute('data-built')) {
      const page = (location.pathname.split('/').pop() || 'index.html') + location.hash;
      const base = fixed ? '../' : '';
      const url = base + (code === 'en' ? '' : `${code}/`) + page;
      go = () => location.assign(url);
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { go(); return; }
    try { sessionStorage.setItem('enigma-pt', '1'); } catch (e) { /* ignore */ }
    root.classList.add('pt-leave');
    setTimeout(go, 450);
  };

  const buildSwitcher = () => {
    const header = document.querySelector('[data-header]');
    if (!header) return;
    const cur = LANGS.find((l) => l.code === lang);
    const box = document.createElement('div');
    box.className = 'lang';
    box.setAttribute('data-i18n-skip', '');
    box.innerHTML = `
      <button class="lang__btn" type="button" aria-haspopup="true" aria-expanded="false" aria-label="${t('Language')}: ${cur.name}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M3 12h18M12 3c2.6 2.8 3.9 5.8 3.9 9s-1.3 6.2-3.9 9c-2.6-2.8-3.9-5.8-3.9-9S9.4 5.8 12 3Z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
        <span class="lang__cur">${cur.short}</span>
        <svg class="lang__chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <ul class="lang__menu" role="menu">
        ${LANGS.map((l) => `<li role="none"><button type="button" role="menuitemradio" aria-checked="${l.code === lang}" lang="${l.code}" data-lang="${l.code}"><span class="lang__short">${l.short}</span>${l.name}</button></li>`).join('')}
      </ul>`;
    header.appendChild(box);
    const btn = box.querySelector('.lang__btn');
    const open = (v) => { box.classList.toggle('is-open', v); btn.setAttribute('aria-expanded', String(v)); };
    btn.addEventListener('click', (e) => { e.stopPropagation(); open(!box.classList.contains('is-open')); });
    box.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => { open(false); setLang(b.dataset.lang); }));
    document.addEventListener('click', (e) => { if (!box.contains(e.target)) open(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { open(false); } });
  };

  window.ENIGMA_I18N = { lang, langs: LANGS, t, translate, strings, setLang };

  const run = () => {
    buildSwitcher();
    translate();
    root.classList.remove('i18n-wait');
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
