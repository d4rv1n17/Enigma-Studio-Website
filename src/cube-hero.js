// =========================================================
// Enigma Cube page: the hero cube scrambles, a timer runs while it
// solves itself sticker by sticker, then it stops on the time and repeats.
// =========================================================
(() => {
  const stage = document.querySelector('[data-cube3d]');
  if (!stage) return;
  // with WebGL the real 3D cube (cube-hero3d.js) takes over
  try { const c = document.createElement('canvas'); if (c.getContext('webgl2') || c.getContext('webgl')) return; } catch (e) { /* use the CSS cube */ }
  const COLORS = { u: '#f2f2f2', d: '#f5cb0b', f: '#1fa055', b: '#2f6fe0', r: '#d8342c', l: '#f08a1c' };
  const all = Object.values(COLORS);
  const cube = stage.querySelector('.cube3d');
  const timeEl = stage.querySelector('[data-cube3d-time]');
  const solveEl = stage.querySelector('[data-cube3d-solve]');
  const scrEl = stage.querySelector('[data-cube3d-scr]');
  const stickers = [];
  stage.querySelectorAll('[data-face]').forEach((face) => {
    const home = COLORS[face.dataset.face];
    for (let i = 0; i < 9; i++) {
      const el = document.createElement('i');
      el.style.setProperty('--c', home);
      face.appendChild(el);
      stickers.push({ el, home, center: i === 4 });
    }
  });
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { timeEl.textContent = '9.87'; timeEl.classList.add('is-done'); cube.classList.add('is-solved'); return; }

  const MOVES = ['R', 'L', 'U', 'D', 'F', 'B'];
  const SUF = ['', "'", '2'];
  const rnd = (n) => Math.floor(Math.random() * n);
  const scramble = () => {
    const out = []; let last = '';
    while (out.length < 12) { const m = MOVES[rnd(6)]; if (m === last) continue; last = m; out.push(m + SUF[rnd(3)]); }
    return out.join(' ');
  };
  const paint = (s, c) => { s.el.classList.add('is-flip'); s.el.style.setProperty('--c', c); setTimeout(() => s.el.classList.remove('is-flip'), 180); };

  let n = 0;
  const visible = () => document.visibilityState === 'visible';
  function round() {
    n++;
    solveEl.textContent = `#${n}`;
    scrEl.textContent = scramble();
    cube.classList.remove('is-solved');
    timeEl.classList.remove('is-done');
    timeEl.textContent = '0.00';
    // scramble: every non-centre sticker gets a random colour
    stickers.forEach((s) => { if (!s.center) paint(s, all[rnd(6)]); });
    const total = 7000 + rnd(5000);               // a "solve" of 7-12 seconds
    const order = stickers.filter((s) => !s.center).sort(() => Math.random() - 0.5);
    setTimeout(() => {
      const t0 = performance.now();
      let fixed = 0;
      const tick = (now) => {
        const t = Math.min(now - t0, total);
        timeEl.textContent = (t / 1000).toFixed(2);
        const want = Math.floor((t / total) * order.length);
        while (fixed < want) { paint(order[fixed], order[fixed].home); fixed++; }
        if (t < total) { requestAnimationFrame(tick); return; }
        order.forEach((s) => paint(s, s.home));
        timeEl.classList.add('is-done');
        cube.classList.add('is-solved');
        setTimeout(() => (visible() ? round() : document.addEventListener('visibilitychange', function once() { if (visible()) { document.removeEventListener('visibilitychange', once); round(); } })), 2600);
      };
      requestAnimationFrame(tick);
    }, 1200);                                      // "inspection"
  }
  setTimeout(round, 900);
})();
