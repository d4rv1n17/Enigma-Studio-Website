// =========================================================
// Full-screen image viewer (lightbox), shared by every page.
// Any element with data-full="path/to/image.webp" opens it;
// all such elements on the page form one set to browse.
// =========================================================
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tr = (window.ENIGMA_I18N || { t: (x) => x }).t;

  // ---------------------------------------------------------
  // Gallery + lightbox
  // ---------------------------------------------------------
  const dialog = document.querySelector('[data-lightbox]');
  if (dialog && document.querySelector('[data-full]')) setupLightbox(dialog);

  function setupLightbox(dlg) {
    // every element with data-full on the page joins the viewer, in page order
    const tiles = [...document.querySelectorAll('[data-full]')];
    // alt is read when shown, so it is already in the visitor's language
    const items = tiles.map((t) => ({ src: t.dataset.full, get alt() { return t.querySelector('img').alt; } }));
    const img = dlg.querySelector('[data-lb-img]');
    const caption = dlg.querySelector('[data-lb-caption]');
    const count = dlg.querySelector('[data-lb-count]');
    const thumbs = dlg.querySelector('[data-lb-thumbs]');
    const fsBtn = dlg.querySelector('[data-lb-fullscreen]');
    let index = 0;
    let opener = null;

    const thumbBtns = items.map((it, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'lb-thumb';
      b.setAttribute('aria-label', `${tr('Image')} ${i + 1}: ${it.alt}`);
      b.innerHTML = `<img src="${it.src.replace(/\.webp$/, '-1280.webp')}" alt="" loading="lazy">`;
      b.addEventListener('click', () => show(i));
      thumbs.appendChild(b);
      return b;
    });

    function preload(i) {
      const it = items[(i + items.length) % items.length];
      const im = new Image();
      im.src = it.src;
    }

    function show(i, dir = 0) {
      index = (i + items.length) % items.length;
      const it = items[index];
      img.classList.remove('is-in', 'from-left', 'from-right');
      void img.offsetWidth; // restart the entrance animation
      img.src = it.src;
      img.alt = it.alt;
      if (!reduceMotion) img.classList.add('is-in', dir < 0 ? 'from-left' : dir > 0 ? 'from-right' : 'is-in');
      caption.textContent = it.alt;
      count.textContent = `${index + 1} / ${items.length}`;
      thumbBtns.forEach((b, j) => b.classList.toggle('is-active', j === index));
      const b = thumbBtns[index];
      thumbs.scrollTo({ left: b.offsetLeft - (thumbs.clientWidth - b.offsetWidth) / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
      preload(index + 1);
      preload(index - 1);
    }

    const next = () => show(index + 1, 1);
    const prev = () => show(index - 1, -1);

    function open(i, from) {
      // labels use the alt texts as they are now (already in the visitor's language)
      thumbBtns.forEach((b, j) => b.setAttribute('aria-label', `${tr('Image')} ${j + 1}: ${items[j].alt}`));
      opener = from;
      if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
      document.documentElement.classList.add('lb-open');
      show(i);
    }
    function close() {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      if (dlg.open) dlg.close();
    }
    dlg.addEventListener('close', () => {
      document.documentElement.classList.remove('lb-open');
      if (opener) opener.focus();
    });

    tiles.forEach((t, i) => t.addEventListener('click', () => open(i, t)));
    // other images on the page that open the same viewer
    document.querySelectorAll('[data-open-full]').forEach((el) => {
      el.addEventListener('click', () => {
        const i = items.findIndex((it) => it.src === el.dataset.openFull);
        open(i < 0 ? 0 : i, el);
      });
    });
    dlg.querySelector('[data-lb-next]').addEventListener('click', next);
    dlg.querySelector('[data-lb-prev]').addEventListener('click', prev);
    dlg.querySelector('[data-lb-close]').addEventListener('click', close);

    // click on the dark backdrop (outside the image) closes
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg || e.target.classList.contains('lightbox__stage')) close();
    });

    // true full screen
    const canFs = !!document.documentElement.requestFullscreen;
    if (!canFs) fsBtn.hidden = true;
    const toggleFs = () => {
      if (!canFs) return;
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      else dlg.requestFullscreen().catch(() => {});
    };
    fsBtn.addEventListener('click', toggleFs);
    document.addEventListener('fullscreenchange', () => {
      dlg.classList.toggle('is-fullscreen', !!document.fullscreenElement);
      fsBtn.setAttribute('aria-label', document.fullscreenElement ? tr('Exit full screen') : tr('Full screen'));
    });

    dlg.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      else if (e.key === 'f' || e.key === 'F') { e.preventDefault(); toggleFs(); }
      else if (e.key === 'Home') { e.preventDefault(); show(0); }
      else if (e.key === 'End') { e.preventDefault(); show(items.length - 1); }
    });

    // swipe
    let sx = null;
    let sy = null;
    img.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; });
    img.addEventListener('pointerup', (e) => {
      if (sx === null) return;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) (dx < 0 ? next : prev)();
      else if (dy > 90) close(); // swipe down to close
      sx = sy = null;
    });
    img.addEventListener('dragstart', (e) => e.preventDefault());
  }
})();
