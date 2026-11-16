// Enigma Cube page: a light timer right in the browser.
// - "Scramble of the day": the same 20-move scramble for everyone, picked by the date.
// - The scrambled cube is drawn as a flat net, so you can check your scramble.
// - Hold Space (or press and hold the pad) until it turns green, release to start,
//   press any key or tap to stop. The last 50 times stay in this browser.
(() => {
  const box = document.querySelector('[data-cube-try]');
  if (!box) return;
  const t = (window.ENIGMA_I18N && window.ENIGMA_I18N.t) || ((s) => s);
  const $ = (sel) => box.querySelector(sel);

  // ---- scrambles -----------------------------------------------
  const FACES = ['U', 'D', 'L', 'R', 'F', 'B'];
  const AXIS = { U: 0, D: 0, L: 1, R: 1, F: 2, B: 2 };
  const SUFFIX = ['', "'", '2'];
  const mulberry = (seed) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
  const makeScramble = (rnd, n = 20) => {
    const out = [];
    while (out.length < n) {
      const f = FACES[Math.floor(rnd() * 6)];
      const a = out[out.length - 1];
      const b = out[out.length - 2];
      if (a && a[0] === f) continue;
      if (a && b && AXIS[a[0]] === AXIS[f] && AXIS[b[0]] === AXIS[f]) continue;
      out.push(f + SUFFIX[Math.floor(rnd() * 3)]);
    }
    return out;
  };
  const today = new Date();
  const dayKey = today.getUTCFullYear() * 10000 + (today.getUTCMonth() + 1) * 100 + today.getUTCDate();
  const dayNumber = Math.floor((Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - Date.UTC(2026, 0, 1)) / 864e5) + 1;

  // ---- a 3x3 cube as 54 stickers (position + facing) -----------
  const NORMAL = { U: [0, 1, 0], D: [0, -1, 0], R: [1, 0, 0], L: [-1, 0, 0], F: [0, 0, 1], B: [0, 0, -1] };
  const COLOR = { U: '#f4f4f4', D: '#ffd23f', R: '#e8423a', L: '#ff8f2b', F: '#2fbf5b', B: '#2f7cf6' };
  const solved = () => {
    const s = [];
    for (const f of FACES) {
      const n = NORMAL[f];
      for (let i = -1; i <= 1; i += 1) for (let j = -1; j <= 1; j += 1) {
        const p = n.map((c) => c);
        const free = [0, 1, 2].filter((k) => n[k] === 0);
        p[free[0]] = i; p[free[1]] = j;
        s.push({ p, n: n.slice(), c: f });
      }
    }
    return s;
  };
  // clockwise quarter turn of face f, seen from outside: rotate -90° about its normal
  const rot = (v, a) => {
    const cross = [a[1] * v[2] - a[2] * v[1], a[2] * v[0] - a[0] * v[2], a[0] * v[1] - a[1] * v[0]];
    const dot = a[0] * v[0] + a[1] * v[1] + a[2] * v[2];
    return [0, 1, 2].map((k) => -cross[k] + a[k] * dot);
  };
  const turn = (cube, move) => {
    const a = NORMAL[move[0]];
    const times = move[1] === '2' ? 2 : move[1] === "'" ? 3 : 1;
    for (let k = 0; k < times; k += 1) {
      cube.forEach((s) => {
        if (s.p[0] * a[0] + s.p[1] * a[1] + s.p[2] * a[2] === 1) { s.p = rot(s.p, a); s.n = rot(s.n, a); }
      });
    }
    return cube;
  };
  // where each sticker sits on the flat net: [column, row] inside its face
  const CELL = {
    U: (p) => [p[0] + 1, p[2] + 1],
    D: (p) => [p[0] + 1, 1 - p[2]],
    F: (p) => [p[0] + 1, 1 - p[1]],
    B: (p) => [1 - p[0], 1 - p[1]],
    R: (p) => [1 - p[2], 1 - p[1]],
    L: (p) => [p[2] + 1, 1 - p[1]],
  };
  const NET = { U: [1, 0], L: [0, 1], F: [1, 1], R: [2, 1], B: [3, 1], D: [1, 2] };
  const faceOf = (n) => FACES.find((f) => NORMAL[f].every((c, i) => c === n[i]));
  const drawNet = (moves) => {
    const cube = solved();
    moves.forEach((m) => turn(cube, m));
    const S = 10; const G = 1.2; const F = S * 3 + G * 4;
    let svg = '';
    cube.forEach((s) => {
      const f = faceOf(s.n);
      const [col, row] = CELL[f](s.p);
      const x = NET[f][0] * (F + 3) + G + col * (S + G);
      const y = NET[f][1] * (F + 3) + G + row * (S + G);
      svg += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${S}" height="${S}" rx="1.6" fill="${COLOR[s.c]}"/>`;
    });
    $('[data-try-net]').innerHTML = `<svg viewBox="0 0 ${4 * (F + 3)} ${3 * (F + 3)}" role="img" aria-label="${t('The cube after this scramble (white on top, green in front)')}">${svg}</svg>`;
  };

  // ---- current scramble ----------------------------------------
  let daily = true;
  let scramble = [];
  const setScramble = (isDaily) => {
    daily = isDaily;
    scramble = makeScramble(isDaily ? mulberry(dayKey) : Math.random);
    $('[data-try-scramble]').textContent = scramble.join(' ');
    $('[data-try-label]').textContent = isDaily ? `${t('Scramble of the day')} · #${dayNumber}` : t('Random scramble');
    $('[data-try-daily]').hidden = isDaily;
    drawNet(scramble);
  };

  // ---- times ---------------------------------------------------
  const KEY = 'enigma-cube-web-times';
  let times = [];
  try { times = JSON.parse(localStorage.getItem(KEY) || '[]').filter((x) => x && typeof x.ms === 'number'); } catch (e) { times = []; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(times.slice(-50))); } catch (e) { /* private mode */ } };
  const fmt = (ms) => {
    if (ms == null) return '–';
    const cs = Math.floor(ms / 10);
    const m = Math.floor(cs / 6000);
    const s = Math.floor((cs % 6000) / 100);
    const c = String(cs % 100).padStart(2, '0');
    return m ? `${m}:${String(s).padStart(2, '0')}.${c}` : `${s}.${c}`;
  };
  // WCA average: drop the best and the worst, mean of the rest
  const avg = (n) => {
    if (times.length < n) return null;
    const last = times.slice(-n).map((x) => x.ms).sort((a, b) => a - b).slice(1, -1);
    return last.reduce((a, b) => a + b, 0) / last.length;
  };
  const render = () => {
    const best = times.length ? Math.min(...times.map((x) => x.ms)) : null;
    $('[data-try-best]').textContent = fmt(best);
    $('[data-try-ao5]').textContent = fmt(avg(5));
    $('[data-try-ao12]').textContent = fmt(avg(12));
    $('[data-try-count]').textContent = String(times.length);
    const list = $('[data-try-list]');
    list.replaceChildren(...times.slice(-12).reverse().map((x) => {
      const li = document.createElement('li');
      li.textContent = fmt(x.ms);
      if (x.ms === best) li.className = 'is-best';
      if (x.daily) li.title = t('Scramble of the day');
      return li;
    }));
    $('[data-try-undo]').disabled = !times.length;
    $('[data-try-clear]').disabled = !times.length;
  };

  // ---- the timer -----------------------------------------------
  const pad = $('[data-try-pad]');
  const clock = $('[data-try-time]');
  const hint = $('[data-try-hint]');
  const HOLD_MS = 300;
  let state = 'idle'; // idle | holding | ready | running
  let holdTimer = 0; let start = 0; let raf = 0; let stoppedAt = 0;
  const setState = (s) => { state = s; pad.dataset.state = s; };
  const tick = () => { clock.textContent = fmt(performance.now() - start); raf = requestAnimationFrame(tick); };
  const press = () => {
    if (state === 'running') { stop(); return; }
    if (state !== 'idle' || performance.now() - stoppedAt < 400) return;
    setState('holding');
    hint.textContent = t('Keep holding…');
    holdTimer = setTimeout(() => { setState('ready'); clock.textContent = fmt(0); hint.textContent = t('Release to start'); }, HOLD_MS);
  };
  const release = () => {
    if (state === 'holding') { clearTimeout(holdTimer); setState('idle'); hint.textContent = t('Hold Space or press and hold here, release to start'); return; }
    if (state !== 'ready') return;
    setState('running');
    hint.textContent = t('Press any key or tap to stop');
    start = performance.now();
    raf = requestAnimationFrame(tick);
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    const ms = performance.now() - start;
    stoppedAt = performance.now();
    clock.textContent = fmt(ms);
    setState('idle');
    hint.textContent = t('Hold Space or press and hold here, release to start');
    if (ms > 300) { times.push({ ms: Math.round(ms), daily, at: Date.now() }); save(); render(); }
    setScramble(false);
  };

  // keyboard works while the timer is on screen and nothing else is being typed in
  const onScreen = () => {
    const r = pad.getBoundingClientRect();
    const seen = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0);
    return seen > r.height * 0.4;
  };
  const typing = () => /^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || '');
  document.addEventListener('keydown', (e) => {
    if (typing() || (state !== 'running' && !onScreen())) return;
    if (state === 'running') { e.preventDefault(); stop(); return; }
    if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) press(); }
  });
  document.addEventListener('keyup', (e) => {
    if (e.code === 'Space' && state !== 'idle' && !typing()) { e.preventDefault(); release(); }
  });
  pad.addEventListener('pointerdown', (e) => { e.preventDefault(); pad.setPointerCapture?.(e.pointerId); press(); });
  pad.addEventListener('pointerup', release);
  pad.addEventListener('pointercancel', () => { if (state !== 'running') { clearTimeout(holdTimer); setState('idle'); } });
  pad.addEventListener('contextmenu', (e) => e.preventDefault());

  $('[data-try-new]').addEventListener('click', () => setScramble(false));
  $('[data-try-daily]').addEventListener('click', () => setScramble(true));
  $('[data-try-undo]').addEventListener('click', () => { times.pop(); save(); render(); });
  $('[data-try-clear]').addEventListener('click', () => { times = []; save(); render(); });
  $('[data-try-copy]').addEventListener('click', async (e) => {
    const b = e.currentTarget;
    try { await navigator.clipboard.writeText(scramble.join(' ')); b.dataset.done = '1'; setTimeout(() => { delete b.dataset.done; }, 1400); } catch (err) { /* no clipboard */ }
  });

  hint.textContent = t('Hold Space or press and hold here, release to start');
  setScramble(true);
  render();

  // for checks: window.ENIGMA_CUBE_TEST(moves) -> true when the moves bring the cube back to solved
  window.ENIGMA_CUBE_TEST = (moves) => {
    const c = solved();
    moves.forEach((m) => turn(c, m));
    return c.every((s) => faceOf(s.n) === s.c);
  };
})();
