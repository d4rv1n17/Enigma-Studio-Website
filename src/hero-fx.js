// =========================================================
// Living hero pictures. Each [data-fx-hero] holds the picture and small
// effect layers pinned to places inside it (data-spot="cx,cy,w,h", fractions
// of the picture): TV static, rain on a window, a lamp that breathes, fog,
// dust in the air. Runs only while the hero is on screen.
// =========================================================
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-fx-hero]').forEach((hero) => {
    const scene = hero.querySelector('.xh__scene') || hero;
    const img = scene.querySelector('.xh__img');
    const spots = [...scene.querySelectorAll('[data-spot]')];
    const canvases = [...scene.querySelectorAll('canvas[data-fx]')];

    // where the picture really is inside the box (object-fit cover/contain + object-position)
    const place = () => {
      if (!img) return;
      const W = scene.clientWidth, H = scene.clientHeight;
      const iw = img.naturalWidth || 16, ih = img.naturalHeight || 9;
      const cs = getComputedStyle(img);
      const k = cs.objectFit === 'contain' ? Math.min(W / iw, H / ih) : Math.max(W / iw, H / ih);
      const dw = iw * k, dh = ih * k;
      const [px, py] = cs.objectPosition.split(' ').map((v) => (v.endsWith('%') ? parseFloat(v) / 100 : 0.5));
      const ox = (W - dw) * px, oy = (H - dh) * py;
      spots.forEach((el) => {
        const [cx, cy, w, h] = el.dataset.spot.split(',').map(Number);
        el.style.left = ox + (cx - w / 2) * dw + 'px';
        el.style.top = oy + (cy - h / 2) * dh + 'px';
        el.style.width = w * dw + 'px';
        el.style.height = h * dh + 'px';
      });
      canvases.forEach(size);
    };
    const size = (cv) => {
      if (cv.dataset.fx === 'noise') return;           // fixed tiny resolution, stretched
      const r = cv.getBoundingClientRect();
      const d = Math.min(devicePixelRatio || 1, 1.5);
      cv.width = Math.max(1, Math.round(r.width * d)); cv.height = Math.max(1, Math.round(r.height * d));
      cv._d = d; cv._parts = null;
    };
    if (img && !img.complete) img.addEventListener('load', place, { once: true });
    if (window.ResizeObserver) new ResizeObserver(place).observe(scene);
    place();
    if (reduce) return;

    // ---- drawing ----
    const noise = (cv) => {
      const g = cv.getContext('2d');
      const [r, gg, b] = (cv.dataset.tint || '255,255,255').split(',').map(Number);
      const img2 = g.createImageData(cv.width, cv.height), d = img2.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.random();
        d[i] = r * v; d[i + 1] = gg * v; d[i + 2] = b * v; d[i + 3] = 255;
      }
      g.putImageData(img2, 0, 0);
    };
    const rain = (cv, dt) => {
      const g = cv.getContext('2d'), W = cv.width, H = cv.height, d = cv._d || 1;
      if (!cv._parts) {
        const n = Math.round((W * H) / (2600 * d * d)) + 20;
        cv._parts = Array.from({ length: Math.min(n, 380) }, () => ({ x: Math.random() * W, y: Math.random() * H, v: (0.7 + Math.random() * 0.6) * H * 1.1, l: (8 + Math.random() * 16) * d }));
      }
      g.clearRect(0, 0, W, H);
      g.strokeStyle = cv.classList.contains('fx-rain--nv') ? 'rgba(190,255,180,.32)' : 'rgba(200,215,235,.32)';
      g.lineWidth = Math.max(1, d * 0.9);
      g.beginPath();
      for (const p of cv._parts) {
        p.y += p.v * dt; p.x -= p.v * dt * 0.08;
        if (p.y > H) { p.y = -p.l; p.x = Math.random() * W * 1.1; }
        g.moveTo(p.x, p.y); g.lineTo(p.x - p.l * 0.08, p.y + p.l);
      }
      g.stroke();
    };
    const dust = (cv, dt, t) => {
      const g = cv.getContext('2d'), W = cv.width, H = cv.height, d = cv._d || 1;
      if (!cv._parts) {
        const n = Math.min(110, Math.round((W * H) / (14000 * d * d)));
        cv._parts = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, r: (0.6 + Math.random() * 1.6) * d, vx: (Math.random() - 0.5) * 8 * d, vy: (-3 - Math.random() * 9) * d, ph: Math.random() * 6.3, a: 0.15 + Math.random() * 0.45 }));
      }
      const [r, gg, b] = (cv.dataset.color || '255,246,230').split(',');
      g.clearRect(0, 0, W, H);
      for (const p of cv._parts) {
        p.x += (p.vx + Math.sin(t / 1300 + p.ph) * 6 * d) * dt; p.y += p.vy * dt;
        if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
        if (p.x < -5) p.x = W + 5; else if (p.x > W + 5) p.x = -5;
        const tw = 0.6 + 0.4 * Math.sin(t / 700 + p.ph * 3);
        g.fillStyle = `rgba(${r},${gg},${b},${(p.a * tw).toFixed(3)})`;
        g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.283); g.fill();
      }
    };

    let on = false, raf = 0, last = 0, lastNoise = 0;
    const frame = (t) => {
      raf = on && !document.hidden ? requestAnimationFrame(frame) : 0;
      const dt = Math.min(0.05, (t - (last || t)) / 1000); last = t;
      const doNoise = t - lastNoise > 60; if (doNoise) lastNoise = t;
      canvases.forEach((cv) => {
        const kind = cv.dataset.fx;
        if (kind === 'noise') { if (doNoise) noise(cv); }
        else if (kind === 'rain') rain(cv, dt);
        else if (kind === 'dust') dust(cv, dt, t);
      });
    };
    const start = () => { if (!raf && on && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } };
    new IntersectionObserver(([e]) => { on = e.isIntersecting; hero.classList.toggle('is-live', on); start(); }).observe(hero);
    document.addEventListener('visibilitychange', start);

    // rare glitches and lightning, so the picture never feels like a loop
    const flash = scene.querySelector('.fx-flash');
    (function rare() {
      setTimeout(() => {
        if (on && !document.hidden) {
          hero.classList.add('is-glitch'); setTimeout(() => hero.classList.remove('is-glitch'), 260);
          if (flash) { flash.classList.remove('is-on'); void flash.offsetWidth; flash.classList.add('is-on'); }
        }
        rare();
      }, 5000 + Math.random() * 7000);
    })();
  });
})();
