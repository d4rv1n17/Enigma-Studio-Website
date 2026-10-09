// =========================================================
// Enigma Studio — shared behaviour for every page
// =========================================================
(() => {
const CONFIG = window.ENIGMA_CONFIG || {};

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const I18N = window.ENIGMA_I18N || { lang: 'en', t: (x) => x };
const t = I18N.t;
const LANG = I18N.lang;
const ROOT = window.ENIGMA_ROOT || '';            // '../' on the /ru/ /ro/ /uk/ pages
const asset = (p) => (p && !/^(https?:|data:|\/|#)/.test(p) ? ROOT + p : p);

document.documentElement.classList.add('js');

// ---- Year, steam badge ------------------------------------
document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

document.querySelectorAll('[data-steam-badge]').forEach((a) => {
  if (CONFIG.steamUrl) {
    a.href = CONFIG.steamUrl;
    a.target = '_blank';
    a.rel = 'noopener';
  }
});

// ---- Support links (from config) ---------------------------
if (CONFIG.supportUrl) document.querySelectorAll('[data-support]').forEach((a) => { a.href = CONFIG.supportUrl; });

// ---- Enigma Disk + source-code links (from config) ----------
const disk = CONFIG.enigmaDisk;
if (disk) {
  document.querySelectorAll('[data-disk-download]').forEach((a) => { a.href = disk.url; });
  document.querySelectorAll('[data-disk-repo]').forEach((a) => { a.href = disk.repo; });
  document.querySelectorAll('[data-disk-version]').forEach((el) => { el.textContent = disk.version; });
  if (disk.size) document.querySelectorAll('[data-disk-size]').forEach((el) => { el.textContent = t(disk.size); });
}
if (CONFIG.enigmaCube && CONFIG.enigmaCube.repo) document.querySelectorAll('[data-cube-repo]').forEach((a) => { a.href = CONFIG.enigmaCube.repo; });
if (CONFIG.githubUrl) document.querySelectorAll('[data-github]').forEach((a) => { a.href = CONFIG.githubUrl; });

// ---- Enigma Cube download (link, version and size come from config) ----
const cube = CONFIG.enigmaCube;
if (cube) {
  const file = cube.url.split('/').pop();
  document.querySelectorAll('[data-cube-download]').forEach((a) => {
    a.href = /^https?:/.test(cube.url) ? cube.url : (window.ENIGMA_ROOT || '') + cube.url;
    if (/^https?:/.test(cube.url)) a.removeAttribute('download'); // cross-site links ignore it anyway
    else a.setAttribute('download', file);
  });
  document.querySelectorAll('[data-cube-version]').forEach((el) => { el.textContent = cube.version; });
  document.querySelectorAll('[data-cube-size]').forEach((el) => { el.textContent = cube.size; });
  document.querySelectorAll('[data-cube-filename]').forEach((el) => { el.textContent = file; });
  document.querySelectorAll('[data-cube-sha]').forEach((el) => { el.textContent = cube.sha256 || ''; });
  document.querySelectorAll('[data-cube-hash]').forEach((el) => { el.hidden = !cube.sha256; });
}

// ---- Social links (from config) ---------------------------
document.querySelectorAll('[data-social]').forEach((box) => {
  const large = box.dataset.socialSize === 'large';
  (CONFIG.social || []).forEach((s) => {
    const a = document.createElement('a');
    a.href = s.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.setAttribute('aria-label', `Enigma Studio — ${s.name}`);
    const size = box.dataset.socialSize;
    if (size === 'card') {
      a.className = 'social-card';
      a.innerHTML = `<img src="${asset(s.icon)}" alt="" width="48" height="48"><span class="social-card__name">${s.name}</span><span class="social-card__handle">${s.handle || ''}</span><span class="social-card__go" aria-hidden="true">${t('Open')}</span>`;
    } else {
      a.innerHTML = large
        ? `<span class="social__icon"><img src="${asset(s.icon)}" alt="" width="56" height="56"></span><span class="social__name">${s.name}</span>`
        : `<img src="${asset(s.icon)}" alt="" width="28" height="28">`;
    }
    box.appendChild(a);
  });
});


// ---- News (posts in src/news.js) ------------------------------
// Home: [data-news] shows the newest 4. News page: [data-news="all"] shows
// every post with a filter by project and a link to each post (news.html#id).
const newsBox = document.querySelector('[data-news]');
if (newsBox && Array.isArray(window.ENIGMA_NEWS)) {
  const all = newsBox.dataset.news === 'all';
  const TAGS = {
    studio: 'Enigma Studio', vof: 'Veil of Fear', twins: 'Twins’ Hunt', cube: 'Enigma Cube', disk: 'Enigma Disk',
  };
  const pick = (v) => (v && typeof v === 'object' ? (v[LANG] || v.en || '') : (v || ''));
  const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmtDate = (d) => {
    const [y, m, day] = String(d).split('-').map(Number);
    if (!y) return '';
    const date = new Date(Date.UTC(y, (m || 1) - 1, day || 1));
    const opts = day ? { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' } : { month: 'long', year: 'numeric', timeZone: 'UTC' };
    try { return new Intl.DateTimeFormat(({ en: 'en-GB', uk: 'uk-UA' })[LANG] || LANG, opts).format(date); } catch (e) { return d; }
  };
  const posts = window.ENIGMA_NEWS.slice(0, all ? undefined : 4);
  newsBox.replaceChildren();
  let year = null;
  posts.forEach((n, i) => {
    const y = String(n.date).slice(0, 4);
    if (all && y !== year) {
      year = y;
      const h = document.createElement('h2');
      h.className = 'news-year';
      h.dataset.year = y;
      h.textContent = y;
      newsBox.appendChild(h);
    }
    const el = document.createElement('article');
    el.className = `news-card news-card--${n.tag || 'studio'}${!all && i === 0 ? ' news-card--lead' : ''}${all ? ' news-card--row' : ''}`;
    el.dataset.tag = n.tag || 'studio';
    el.dataset.year = y;
    if (all && n.id) el.id = n.id;
    const ext = /^https?:/.test(n.link || '');
    const share = all && n.id
      ? `<button class="news-card__share" type="button" data-share="${esc(n.id)}"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.5 9.5 9.5 6.5M7 4.5l1.3-1.3a2.8 2.8 0 0 1 4 4L11 8.5M9 11.5l-1.3 1.3a2.8 2.8 0 0 1-4-4L5 7.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg><span>${esc(t('Copy link'))}</span></button>` : '';
    el.innerHTML = `
      <a class="news-card__link" href="${esc(n.link || '#')}"${ext ? ' target="_blank" rel="noopener"' : ''}>
        <div class="frame news-card__media">${n.image ? `<img src="${esc(asset(n.image))}" alt="" loading="lazy">` : ''}</div>
        <div class="news-card__body">
          <p class="news-card__meta"><span class="news-card__tag">${esc(TAGS[n.tag] || TAGS.studio)}</span><time datetime="${esc(n.date)}">${esc(fmtDate(n.date))}</time></p>
          <h3 class="news-card__title">${esc(pick(n.title))}</h3>
          <p class="news-card__text">${esc(pick(n.text))}</p>
          <span class="link-arrow">${esc(t('Read more'))}</span>
        </div>
      </a>${share}`;
    if (!all) el.setAttribute('data-reveal', '');
    newsBox.appendChild(el);
  });

  // copy a link to one post
  newsBox.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-share]');
    if (!b) return;
    const url = `${location.href.split('#')[0]}#${b.dataset.share}`;
    const label = b.querySelector('span');
    try {
      if (navigator.share && matchMedia('(pointer: coarse)').matches) await navigator.share({ url });
      else { await navigator.clipboard.writeText(url); label.textContent = t('Link copied'); }
    } catch (err) { /* cancelled */ }
    setTimeout(() => { label.textContent = t('Copy link'); }, 1800);
  });

  // filter by project on the news page
  const filters = document.querySelectorAll('[data-news-filter]');
  const applyFilter = (tag) => {
    filters.forEach((f) => f.setAttribute('aria-pressed', String(f.dataset.newsFilter === tag)));
    const shownYears = new Set();
    newsBox.querySelectorAll('.news-card').forEach((c) => {
      const show = tag === 'all' || c.dataset.tag === tag;
      c.hidden = !show;
      if (show) shownYears.add(c.dataset.year);
    });
    newsBox.querySelectorAll('.news-year').forEach((h) => { h.hidden = !shownYears.has(h.dataset.year); });
  };
  filters.forEach((f) => f.addEventListener('click', () => applyFilter(f.dataset.newsFilter)));

  // opened with #post-id: highlight that post
  if (all && location.hash) {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target && target.classList.contains('news-card')) {
      target.classList.add('is-target');
      requestAnimationFrame(() => target.scrollIntoView({ block: 'center' }));
    }
  }
}

// ---- Newsletter: "Subscribe" forms ---------------------------
// With CONFIG.newsletter.action set, the address goes to the mailing service
// (opens its confirmation page in a new tab). Without it, the visitor's e-mail
// app opens with a ready "subscribe me" letter to the studio.
document.querySelectorAll('[data-subscribe]').forEach((form) => {
  const input = form.querySelector('input[type="email"]');
  const msg = form.querySelector('[data-subscribe-msg]');
  const say = (text, kind) => { msg.textContent = text; form.dataset.state = kind || ''; };
  input.addEventListener('input', () => { if (form.dataset.state === 'error') say('', ''); });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = input.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { say(t('Please enter a valid email.'), 'error'); input.focus(); return; }
    const nl = CONFIG.newsletter || {};
    const postInNewTab = (fields) => {
      const f = document.createElement('form');
      f.method = 'post'; f.action = nl.action; f.target = '_blank'; f.hidden = true;
      Object.entries(fields).forEach(([k, v]) => { const i = document.createElement('input'); i.type = 'hidden'; i.name = k; i.value = v; f.appendChild(i); });
      document.body.appendChild(f); f.submit(); f.remove();
      say(t('Almost done! Check your inbox to confirm.'), 'ok');
    };
    if (nl.action && /mailerlite\.com/.test(nl.action)) {
      // MailerLite: sent in the background, the visitor stays on the page
      const fields = { 'fields[email]': email, 'ml-submit': '1', anticsrf: 'true', ...(nl.extra || {}) };
      const body = new FormData();
      Object.entries(fields).forEach(([k, v]) => body.append(k, v));
      const btn = form.querySelector('button');
      btn.disabled = true;
      say(t('Sending…'), '');
      fetch(nl.action, { method: 'POST', body, headers: { Accept: 'application/json' } })
        .then((r) => r.json().catch(() => ({})).then((j) => ({ ok: r.ok, j })))
        .then(({ ok, j }) => {
          if (ok && j.success !== false) {
            say(nl.doubleOptIn === false ? t('You are subscribed. Welcome to the dark!') : t('Almost done! Check your inbox to confirm.'), 'ok');
            input.value = '';
          } else say(t('Something went wrong. Please try again.'), 'error');
        })
        .catch(() => postInNewTab(fields))
        .finally(() => { btn.disabled = false; });
      return;
    }
    if (nl.action) {
      postInNewTab({ [nl.emailField || 'email']: email, ...(nl.extra || {}) });
    } else {
      const to = CONFIG.email || 'enigmastudio.md@gmail.com';
      const subject = 'Newsletter: subscribe';
      const body = `Please add me to the Enigma Studio newsletter.\nEmail: ${email}\nLanguage: ${LANG}`;
      const href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      if (window.__enigmaMailto) window.__enigmaMailto(href); else window.location.href = href;
      say(t('Your email app opened. Just press send and you are in.'), 'ok');
    }
    input.value = '';
  });
});

// ---- "Apps" group in the menu: opens on hover, click/tap or keyboard ----
document.querySelectorAll('[data-nav-group]').forEach((g) => {
  const btn = g.querySelector('.nav-group__btn');
  const set = (v) => { g.classList.toggle('is-open', v); btn.setAttribute('aria-expanded', String(v)); };
  btn.addEventListener('click', (e) => { e.stopPropagation(); set(!g.classList.contains('is-open')); });
  document.addEventListener('click', (e) => { if (!g.contains(e.target)) set(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
});

// ---- Mobile menu: a button that opens the nav on small screens ----
const navEl = document.querySelector('.site-nav');
const headerEl = document.querySelector('[data-header]');
if (navEl && headerEl) {
  navEl.id = navEl.id || 'site-nav';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'nav-toggle';
  btn.setAttribute('aria-controls', navEl.id);
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<span class="nav-toggle__bar"></span><span class="nav-toggle__bar"></span><span class="nav-toggle__bar"></span><span class="visually-hidden">Menu</span>';
  headerEl.appendChild(btn);
  const setOpen = (open) => {
    btn.setAttribute('aria-expanded', String(open));
    headerEl.classList.toggle('is-menu-open', open);
    document.documentElement.classList.toggle('menu-open', open);
  };
  btn.addEventListener('click', () => setOpen(btn.getAttribute('aria-expanded') !== 'true'));
  navEl.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  window.matchMedia('(min-width: 921px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
}

// ---- Header: glass background after scrolling -------------
const header = document.querySelector('[data-header]');
if (header) {
  const update = () => header.classList.toggle('is-scrolled', window.scrollY > 30);
  update();
  window.addEventListener('scroll', update, { passive: true });
}

// ---- Torch: soft light follows the pointer ----------------
document.querySelectorAll('[data-torch]').forEach((el) => {
  const target = { x: 0.5, y: 0.45 };
  const pos = { ...target };
  let lastInput = 0;
  let raf = 0;
  let visible = true;
  const hintEl = el.querySelector('[data-torch-hint]');
  if (hintEl && !window.matchMedia('(hover: hover)').matches) hintEl.textContent = t('Touch the screen to look around');

  const move = (e) => {
    const r = el.getBoundingClientRect();
    target.x = (e.clientX - r.left) / r.width;
    target.y = (e.clientY - r.top) / r.height;
    lastInput = performance.now();
    const hint = el.querySelector('[data-torch-hint]');
    if (hint) hint.classList.add('is-hidden');
  };
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerdown', move);

  const tick = (t) => {
    if (!reduceMotion && t - lastInput > 3000) {
      // idle: the light slowly wanders, like someone searching with a flashlight
      target.x = 0.5 + Math.sin(t / 2800) * 0.22;
      target.y = 0.45 + Math.sin(t / 2100) * 0.12;
    }
    const k = reduceMotion ? 1 : 0.1;
    pos.x += (target.x - pos.x) * k;
    pos.y += (target.y - pos.y) * k;
    el.style.setProperty('--x', `${(pos.x * 100).toFixed(2)}%`);
    el.style.setProperty('--y', `${(pos.y * 100).toFixed(2)}%`);
    raf = visible ? requestAnimationFrame(tick) : 0;
  };

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(tick);
  }).observe(el);
});

// ---- Parallax ---------------------------------------------
const parallax = [...document.querySelectorAll('[data-parallax]')];
if (parallax.length && !reduceMotion) {
  let ticking = false;
  const update = () => {
    parallax.forEach((frame) => {
      const img = frame.querySelector('img');
      const r = frame.getBoundingClientRect();
      const progress = (window.innerHeight - r.top) / (window.innerHeight + r.height);
      if (progress > 0 && progress < 1) img.style.transform = `scale(1.08) translate3d(0, ${(progress - 0.5) * -6}%, 0)`;
    });
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();
}

// ---- Scroll reveal ----------------------------------------
// Blocks already on screen when the page opens are shown at once (no second fade on top of
// the page transition); the rest fade up as they scroll in. Threshold 0 so tall blocks
// (galleries on phones) always trigger, plus a safety net so nothing can stay hidden.
const revealEls = [...document.querySelectorAll('[data-reveal]')];
const showNow = (el) => { el.classList.add('is-visible', 'no-anim'); };
revealEls.forEach((el) => {
  const r = el.getBoundingClientRect();
  if (r.top < window.innerHeight * 0.95 && r.bottom > 0) showNow(el);
});
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
revealEls.filter((el) => !el.classList.contains('is-visible')).forEach((el) => revealObserver.observe(el));
// anything above the viewport (page restored mid-scroll, jump to an anchor) appears instantly
const revealAbove = () => revealEls.forEach((el) => { if (!el.classList.contains('is-visible') && el.getBoundingClientRect().bottom < 0) showNow(el); });
window.addEventListener('scroll', revealAbove, { passive: true });
window.addEventListener('hashchange', revealAbove);
window.addEventListener('pageshow', (e) => { if (e.persisted) revealEls.forEach(showNow); });

// ---- Copy email -------------------------------------------
document.querySelectorAll('[data-copy]').forEach((btn) => {
  const label = btn.querySelector('[data-copy-label]');
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      label.textContent = t('Copied');
    } catch {
      label.textContent = t('Select and copy');
    }
    setTimeout(() => { label.textContent = t('Copy'); }, 1800);
  });
});

// ---- Contact page: studio clock, topics, message form ------
const clock = document.querySelector('[data-studio-clock]');
if (clock) {
  const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: CONFIG.studioTimeZone || 'Europe/Chisinau' });
  const tick = () => { clock.textContent = fmt.format(new Date()); };
  tick(); setInterval(tick, 15000);
}

const form = document.querySelector('[data-contact-form]');
if (form) {
  const topicSel = form.querySelector('[name="topic"]');
  const nameIn = form.querySelector('[name="name"]');
  const msgIn = form.querySelector('[name="message"]');
  const err = form.querySelector('[data-error]');
  const topicNames = { Press: 'Press', Creators: 'Streamer / creator', Business: 'Business', Players: 'Player' };

  document.querySelectorAll('[data-topic]').forEach((btn) => {
    btn.addEventListener('click', () => {
      topicSel.value = btn.dataset.topic;
      document.querySelectorAll('[data-topic]').forEach((b) => b.classList.toggle('is-picked', b === btn));
      document.getElementById('message').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      setTimeout(() => msgIn.focus({ preventScroll: true }), reduceMotion ? 0 : 500);
    });
  });
  topicSel.addEventListener('change', () => {
    document.querySelectorAll('[data-topic]').forEach((b) => b.classList.toggle('is-picked', b.dataset.topic === topicSel.value));
  });

  const compose = () => {
    const who = nameIn.value.trim();
    const subject = `[${topicNames[topicSel.value] || topicSel.value}] ${who ? `Message from ${who}` : 'Message from the website'}`;
    const body = `${msgIn.value.trim()}\n\n${who ? `— ${who}` : ''}`.trim();
    return { subject, body };
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!msgIn.value.trim()) {
      err.hidden = false; msgIn.setAttribute('aria-invalid', 'true'); msgIn.focus();
      return;
    }
    err.hidden = true; msgIn.removeAttribute('aria-invalid');
    const { subject, body } = compose();
    (window.__enigmaMailto || ((u) => { window.location.href = u; }))(`mailto:${CONFIG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  });
  msgIn.addEventListener('input', () => { if (msgIn.value.trim()) { err.hidden = true; msgIn.removeAttribute('aria-invalid'); } });

  const copyBtn = form.querySelector('[data-copy-message]');
  const copyLabel = form.querySelector('[data-copy-message-label]');
  copyBtn.addEventListener('click', async () => {
    const { subject, body } = compose();
    try {
      await navigator.clipboard.writeText(`To: ${CONFIG.email}\nSubject: ${subject}\n\n${body}`);
      copyLabel.textContent = t('Copied');
    } catch { copyLabel.textContent = t('Could not copy'); }
    setTimeout(() => { copyLabel.textContent = t('Copy message'); }, 1800);
  });
}

// ---- YouTube preview pictures ------------------------------------
// Shows the video's own YouTube thumbnail instead of game art.
// maxresdefault exists only for HD uploads; when it is missing YouTube
// returns a tiny 120x90 placeholder, so we step down to the next size.
window.ENIGMA_YT_THUMB = (img, id) => {
  if (!img || !id) return;
  const sizes = ['maxresdefault', 'sddefault', 'hqdefault'];
  let i = 0;
  const fallback = img.currentSrc || img.src;
  const tryNext = () => {
    if (i >= sizes.length) { img.src = fallback; return; }
    const url = `https://i.ytimg.com/vi/${id}/${sizes[i++]}.jpg`;
    const probe = new Image();
    probe.onload = () => {
      if (probe.naturalWidth <= 120) { tryNext(); return; }
      img.removeAttribute('srcset');
      img.removeAttribute('sizes');
      img.src = url;
      img.classList.add('is-yt-thumb');
    };
    probe.onerror = tryNext;
    probe.src = url;
  };
  tryNext();
};

// ---- YouTube video embedded in the page (poster first, player on click) ----
document.querySelectorAll('[data-yt-frame]').forEach((frame) => {
  const btn = frame.querySelector('button');
  if (!btn) return;
  window.ENIGMA_YT_THUMB(btn.querySelector('img'), frame.dataset.ytId);
  btn.addEventListener('click', () => {
    const id = frame.dataset.ytId;
    if (location.protocol === 'file:') {
      // YouTube refuses its player on pages opened straight from a folder
      const box = document.createElement('div');
      box.className = 'video__notice';
      box.innerHTML = `<p class="video__notice-title">The video plays here once the site is online</p>
        <p class="video__notice-text">To preview locally, start the site with <span class="mono">start-site.bat</span> (Windows) or <span class="mono">start-site.command</span> (Mac).</p>
        <a class="ghost-btn" href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener">Watch on YouTube instead</a>`;
      if (I18N.translate) I18N.translate(box);
      frame.replaceChildren(box);
      return;
    }
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
    iframe.title = frame.dataset.ytTitle || 'Video';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allowFullscreen = true;
    frame.replaceChildren(iframe);
  });
});

// ---- Page transitions: fade through black ---------------------
(() => {
  const root = document.documentElement;
  const LEAVE_MS = 450;

  // arriving: wait for the hero image (or at most 700 ms), then fade in
  if (root.classList.contains('pt-enter')) {
    const hero = document.querySelector('.vf-hero__art img, .hero__img--dark, .hero__scene img');
    let done = false;
    const reveal = () => {
      if (done) return; done = true;
      requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('pt-enter')));
    };
    if (!hero || hero.complete) reveal();
    else {
      hero.addEventListener('load', reveal, { once: true });
      hero.addEventListener('error', reveal, { once: true });
    }
    setTimeout(reveal, 700);
  }

  if (reduceMotion) return;

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if ((a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !/(\.html?|\/)$/.test(url.pathname)) return;
    if (url.pathname === location.pathname) {          // same page: just scroll, no fade
      if (!url.hash) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
      return;
    }
    e.preventDefault();
    if (root.classList.contains('pt-leave')) return;   // already leaving (double click)
    try { sessionStorage.setItem('enigma-pt', '1'); } catch (err) { /* private mode: still navigates */ }
    root.classList.add('pt-leave');
    setTimeout(() => { location.href = url.href; }, LEAVE_MS);
  });

  // back/forward from the browser cache: show the page again
  window.addEventListener('pageshow', (e) => { if (e.persisted) root.classList.remove('pt-leave', 'pt-enter'); });
})();

// ---- Back to top + reading progress -------------------------
document.querySelectorAll('[data-to-top]').forEach((a) => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
});
if (!reduceMotion) {
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  let ticking = false;
  const update = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.setProperty('--p', max > 0 ? Math.min(1, window.scrollY / max).toFixed(4) : 0);
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update);
  update();
}
})();
