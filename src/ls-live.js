// =========================================================
// Last Signal hero: Nora's laptop is still alive.
// Notifications pop up beside the missing poster, the screen light
// flickers and her photo glitches as if it is being wiped.
// =========================================================
(() => {
  const box = document.querySelector('[data-ls-notes]');
  if (!box) return;
  const t = (s) => (window.ENIGMA_I18N ? window.ENIGMA_I18N.t(s) : s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hero = box.closest('.ls-hero');
  const bg = hero && hero.querySelector('[data-ls-bg]');
  const photo = hero && hero.querySelector('.ls-poster__photo');

  const ICONS = {
    msg: '<path d="M4 5h16v11H9l-5 4z" fill="currentColor"/>',
    rec: '<circle cx="12" cy="12" r="7" fill="currentColor"/>',
    img: '<rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 17l5-6 4 4 2-2 3 4z" fill="currentColor"/>',
    unk: '<path d="M12 3a9 9 0 100 18 9 9 0 000-18zm0 13.5a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4zM12 6.5c2 0 3.4 1.2 3.4 2.9 0 1.5-1 2.2-1.9 2.8-.6.4-.8.7-.8 1.3v.4h-1.6v-.6c0-1.1.5-1.7 1.3-2.2.8-.5 1.3-.9 1.3-1.6 0-.8-.7-1.4-1.7-1.4s-1.8.6-1.9 1.6H8.5C8.6 7.9 10 6.5 12 6.5z" fill="currentColor"/>',
    sys: '<path d="M12 3l9 16H3z" fill="currentColor"/><path d="M12 9v5" stroke="#000" stroke-width="2"/><circle cx="12" cy="16.5" r="1" fill="#000"/>'
  };
  const NOTES = [
    { k: 'msg', app: 'Messages', who: 'Mom', text: 'Nora, please call me back. Just tell me you are okay.' },
    { k: 'rec', app: 'Nora After Dark', who: 'Upload failed', text: 'st_valentine_part2.mp4 could not be published.' },
    { k: 'sys', app: 'System', who: 'Remote session', text: 'Someone is deleting files from this laptop.', warn: true },
    { k: 'img', app: 'Photos', who: '38 photos deleted', text: 'Recently deleted items will be removed permanently.' },
    { k: 'unk', app: 'Messages', who: 'Unknown number', text: 'Stop looking for her.', warn: true },
    { k: 'msg', app: 'Messages', who: 'Mom', text: 'Day 21. I left the porch light on for you.' }
  ];

  const make = (n) => {
    const el = document.createElement('div');
    el.className = 'ls-note' + (n.warn ? ' ls-note--warn' : '');
    el.innerHTML =
      '<span class="ls-note__icon ls-note__icon--' + n.k + '"><svg viewBox="0 0 24 24">' + ICONS[n.k] + '</svg></span>' +
      '<span class="ls-note__body"><span class="ls-note__top"><span class="ls-note__app"></span><span class="ls-note__time"></span></span>' +
      '<span class="ls-note__who"></span><span class="ls-note__text"></span></span>';
    el.querySelector('.ls-note__app').textContent = t(n.app);
    el.querySelector('.ls-note__time').textContent = t('now');
    el.querySelector('.ls-note__who').textContent = t(n.who);
    el.querySelector('.ls-note__text').textContent = t(n.text);
    return el;
  };

  if (reduce) { box.appendChild(make(NOTES[0])).classList.add('is-in'); return; }

  let i = 0, visible = false, timer = 0;
  const MAX = () => (innerWidth < 1181 ? 1 : 2);
  const push = () => {
    const el = make(NOTES[i++ % NOTES.length]);
    box.prepend(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-in')));
    const all = box.querySelectorAll('.ls-note:not(.is-out)');
    for (let j = MAX(); j < all.length; j++) {
      const old = all[j];
      old.classList.add('is-out');
      setTimeout(() => old.remove(), 600);
    }
    // the wipe hits the screen and the photo now and then
    if (el.classList.contains('ls-note--warn')) {
      if (bg) { bg.classList.remove('is-flicker'); void bg.offsetWidth; bg.classList.add('is-flicker'); }
      if (photo) { photo.classList.remove('is-wipe'); void photo.offsetWidth; photo.classList.add('is-wipe'); }
    }
  };
  const loop = () => { if (!visible) return; push(); timer = setTimeout(loop, 4200 + Math.random() * 1800); };

  new IntersectionObserver(([e]) => {
    const was = visible;
    visible = e.isIntersecting && !document.hidden;
    if (visible && !was) timer = setTimeout(loop, box.childElementCount ? 1500 : 1600);
    if (!visible) clearTimeout(timer);
  }).observe(hero);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { visible = false; clearTimeout(timer); }
    else if (!visible) { visible = true; timer = setTimeout(loop, 1200); }
  });
})();
