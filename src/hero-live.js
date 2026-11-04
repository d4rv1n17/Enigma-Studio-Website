// =========================================================
// Home hero: the studio at night.
// The old CRT on the desk breathes and flickers, and dust floats
// through the air, catching the torch light as it passes.
// =========================================================
(() => {
  const hero = document.querySelector('[data-hero-live]');
  if (!hero) return;
  const img = hero.querySelector('.hero__img');
  const crt = hero.querySelector('[data-hero-crt]');
  const cv = hero.querySelector('[data-hero-dust]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // the monitor screen inside studio-desk.webp, as fractions of the picture
  const SCREEN = { cx: 0.503, cy: 0.519, w: 0.15, h: 0.215 };
  const OBJ = { x: 0.5, y: 0.6 }; // matches object-position of .hero__img

  const place = () => {
    if (!crt || !img) return;
    const W = hero.clientWidth, H = hero.clientHeight;
    const iw = img.naturalWidth || 2560, ih = img.naturalHeight || 1429;
    const k = Math.max(W / iw, H / ih);
    const dw = iw * k, dh = ih * k;
    const ox = (W - dw) * OBJ.x, oy = (H - dh) * OBJ.y;
    crt.style.left = (ox + SCREEN.cx * dw) + 'px';
    crt.style.top = (oy + SCREEN.cy * dh) + 'px';
    crt.style.width = (SCREEN.w * dw) + 'px';
    crt.style.height = (SCREEN.h * dh) + 'px';
  };
  place();
  if (img && !img.complete) img.addEventListener('load', place, { once: true });
  addEventListener('resize', place, { passive: true });

  if (reduce || !cv) return;

  // ---- dust ----
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1, motes = [];
  const size = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = hero.clientWidth; H = hero.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    const n = Math.round(Math.min(120, (W * H) / 12000));
    motes = Array.from({ length: n }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: 0.8 + Math.random() * 1.8,
      vx: (Math.random() - 0.5) * 0.12, vy: -0.04 - Math.random() * 0.12,
      ph: Math.random() * 6.28, a: 0.15 + Math.random() * 0.35
    }));
  };
  size();
  addEventListener('resize', size, { passive: true });

  let raf = 0, visible = true;
  const frame = (t) => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const st = hero.style;
    const lx = (parseFloat(st.getPropertyValue('--x')) || 50) / 100 * W;
    const ly = (parseFloat(st.getPropertyValue('--y')) || 45) / 100 * H;
    const R = Math.max(W, H) * 0.32;
    for (const m of motes) {
      m.ph += 0.01;
      m.x += m.vx + Math.sin(m.ph) * 0.08;
      m.y += m.vy;
      if (m.y < -5) { m.y = H + 5; m.x = Math.random() * W; }
      if (m.x < -5) m.x = W + 5; else if (m.x > W + 5) m.x = -5;
      const d = Math.hypot(m.x - lx, m.y - ly);
      const lit = Math.max(0, 1 - d / R);
      const a = m.a * (0.3 + lit * lit * 3.2);
      if (a < 0.02) continue;
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255,246,230,' + Math.min(a, 0.9).toFixed(3) + ')';
      ctx.arc(m.x, m.y, m.r * (1 + lit * 0.6), 0, 6.283);
      ctx.fill();
    }
    raf = visible ? requestAnimationFrame(frame) : 0;
  };
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(frame);
  }).observe(hero);
})();
