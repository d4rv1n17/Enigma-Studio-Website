// =========================================================
// Greywood Archive: codes hidden in our games, trailers and on this site
// decrypt classified files. The files are sealed with AES-GCM; the key comes
// from the code itself (PBKDF2), so the page holds nothing readable until the
// right code is typed. Opened codes are remembered in this browser.
// =========================================================
(() => {
  const root = document.querySelector('[data-gw]');
  if (!root) return;
  const I18N = window.ENIGMA_I18N || { lang: 'en', t: (s) => s };
  const t = I18N.t;
  const lang = ['ru', 'ro', 'uk'].includes(I18N.lang) ? I18N.lang : 'en';
  const KEY = 'enigma-gw-codes';
  const form = root.querySelector('[data-gw-form]');
  const input = root.querySelector('[data-gw-input]');
  const out = root.querySelector('[data-gw-out]');
  const cards = [...document.querySelectorAll('[data-gw-slot]')];
  const dlg = document.querySelector('[data-gw-dialog]');
  const opened = new Map(); // slot -> dossier
  let vault = null;

  const norm = (s) => String(s || '').normalize('NFC').toUpperCase().replace(/Ё/g, 'Е').replace(/[^0-9A-ZА-ЯІЇЄҐ]/g, '');
  const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const say = (text, kind) => { out.textContent = '> ' + text; out.dataset.kind = kind || ''; };
  let codes = [];
  try { codes = JSON.parse(localStorage.getItem(KEY) || '[]').filter((c) => typeof c === 'string'); } catch (e) { codes = []; }
  const remember = (c) => { if (!codes.includes(c)) codes.push(c); try { localStorage.setItem(KEY, JSON.stringify(codes)); } catch (e) { /* private mode */ } };

  const loadVault = async () => {
    if (vault) return vault;
    const res = await fetch((window.ENIGMA_ROOT || '') + 'assets/archive/vault.json', { cache: 'no-cache' });
    vault = await res.json();
    return vault;
  };
  // the code becomes a key; every sealed entry is tried, only the right one opens
  const unlock = async (code) => {
    const v = await loadVault();
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(code), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: b64(v.salt), iterations: v.iter }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    for (const it of v.items) {
      try {
        const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(it.iv) }, key, b64(it.ct));
        return JSON.parse(new TextDecoder().decode(plain));
      } catch (e) { /* not this one */ }
    }
    return null;
  };

  const progress = () => {
    const n = opened.size;
    root.querySelector('[data-gw-count]').textContent = `${n} / ${cards.length}`;
    root.querySelectorAll('[data-gw-seg]').forEach((s, i) => s.classList.toggle('is-on', i < n));
    const marks = [...opened.values()].filter((d) => d.frag).sort((a, b) => a.slot - b.slot);
    const box = root.querySelector('[data-gw-marks]');
    box.replaceChildren(...cards.slice(0, 6).map((c, i) => {
      const s = document.createElement('span');
      const d = marks.find((m) => m.slot === i);
      s.textContent = d ? d.frag : '·';
      if (d) s.className = 'is-on';
      return s;
    }));
  };

  const showCard = (d) => {
    const card = cards[d.slot];
    if (!card) return;
    card.classList.add('is-open');
    card.querySelector('[data-gw-title]').textContent = d.title[lang] || d.title.en;
    card.querySelector('[data-gw-state]').textContent = t('Declassified');
    const btn = card.querySelector('[data-gw-open]');
    btn.hidden = false;
    btn.onclick = () => openFile(d);
  };

  const openFile = (d) => {
    const paper = dlg.querySelector('[data-gw-paper]');
    const old = dlg.querySelector('.vf-file__paper--lit');
    if (old) old.remove();
    dlg.querySelector('[data-vf-file]').removeAttribute('data-vf-ready');
    paper.querySelector('[data-gw-no]').textContent = d.no;
    paper.querySelector('[data-gw-ptitle]').textContent = d.title[lang] || d.title.en;
    // the dossier text is our own content, decrypted from our own file
    paper.querySelector('[data-gw-body]').innerHTML = d.body[lang] || d.body.en;
    const mark = paper.querySelector('[data-gw-mark]');
    mark.hidden = !d.frag;
    mark.textContent = d.frag || '';
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    requestAnimationFrame(() => window.ENIGMA_VF_FILE && window.ENIGMA_VF_FILE(dlg.querySelector('[data-vf-file]')));
  };
  dlg.querySelector('[data-gw-close]').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });

  let busy = false;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = norm(input.value);
    if (busy || !code) return;
    if (!window.crypto || !crypto.subtle) { say(t('This browser cannot decrypt files. Open the site over https.'), 'error'); return; }
    busy = true;
    form.classList.add('is-busy');
    say(t('Decrypting…'));
    try {
      const [d] = await Promise.all([unlock(code), new Promise((r) => setTimeout(r, 900))]);
      if (!d) { say(t('Access denied. No file matches this code.'), 'error'); form.classList.add('is-shake'); setTimeout(() => form.classList.remove('is-shake'), 500); return; }
      const fresh = !opened.has(d.slot);
      opened.set(d.slot, d);
      remember(code);
      showCard(d);
      progress();
      input.value = '';
      say(fresh ? `${t('Access granted.')} ${d.no} ${t('decrypted.')}` : `${d.no}: ${t('this file is already open.')}`, 'ok');
      openFile(d);
    } catch (err) {
      say(t('The archive is not responding. Try again later.'), 'error');
    } finally {
      busy = false;
      form.classList.remove('is-busy');
    }
  });

  // reopen the files this browser already decrypted
  (async () => {
    progress();
    if (!codes.length || !window.crypto || !crypto.subtle) { say(t('Awaiting clearance code')); return; }
    say(t('Restoring your files…'));
    for (const c of codes) {
      try { const d = await unlock(c); if (d) { opened.set(d.slot, d); showCard(d); } } catch (e) { /* skip */ }
    }
    progress();
    say(t('Awaiting clearance code'));
  })();
})();
