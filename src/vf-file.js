// =========================================================
// Veil of Fear: a classified Greywood file with the secrets blacked out.
// A flashlight follows the pointer (or wanders by itself) and, inside its
// circle, the redactions turn into glowing ink you can read.
// =========================================================
(() => {
  const box = document.querySelector('[data-vf-file]');
  if (!box) return;
  const paper = box.querySelector('[data-vf-file-paper]');
  const lit = paper.cloneNode(true);
  lit.removeAttribute('data-vf-file-paper');
  lit.classList.add('vf-file__paper--lit');
  lit.setAttribute('aria-hidden', 'true');
  box.insertBefore(lit, paper.nextSibling);
  // the lit copy lies exactly on top of the file
  const fit = () => {
    lit.style.left = paper.offsetLeft + 'px';
    lit.style.top = paper.offsetTop + 'px';
    lit.style.width = paper.offsetWidth + 'px';
    lit.style.height = paper.offsetHeight + 'px';
  };
  fit();
  addEventListener('resize', fit, { passive: true });
  if (document.fonts) document.fonts.ready.then(fit);

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hint = box.querySelector('[data-vf-file-hint]');
  if (hint && !matchMedia('(hover: hover)').matches) hint.textContent = (window.ENIGMA_I18N ? window.ENIGMA_I18N.t('Drag the light to read what was hidden') : 'Drag the light to read what was hidden');
  const target = { x: 0.5, y: 0.5 }, pos = { x: 0.5, y: 0.5 };
  let last = 0, raf = 0, visible = false;

  const move = (e) => {
    const r = box.getBoundingClientRect();
    target.x = (e.clientX - r.left) / r.width;
    target.y = (e.clientY - r.top) / r.height;
    last = performance.now();
    box.classList.add('is-touched');
  };
  box.addEventListener('pointermove', move);
  box.addEventListener('pointerdown', move);

  const tick = (t) => {
    if (reduce) { target.x = 0.5; target.y = 0.55; }
    else if (t - last > 2500) {
      // nobody is holding the light: it searches the page by itself
      target.x = 0.5 + Math.sin(t / 2300) * 0.32;
      target.y = 0.52 + Math.sin(t / 1700) * 0.3;
    }
    const k = reduce ? 1 : 0.12;
    pos.x += (target.x - pos.x) * k;
    pos.y += (target.y - pos.y) * k;
    box.style.setProperty('--lx', (pos.x * 100).toFixed(2) + '%');
    box.style.setProperty('--ly', (pos.y * 100).toFixed(2) + '%');
    lit.style.setProperty('--px', (pos.x * box.clientWidth - paper.offsetLeft).toFixed(1) + 'px');
    lit.style.setProperty('--py', (pos.y * box.clientHeight - paper.offsetTop).toFixed(1) + 'px');
    raf = visible ? requestAnimationFrame(tick) : 0;
  };
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(tick);
  }).observe(box);
})();
