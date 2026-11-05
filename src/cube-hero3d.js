// =========================================================
// Enigma Cube page: a real 3D cube in the hero (three.js).
// It scrambles itself with real layer turns, then "solves" at human tempo
// while the timer card counts; the time stops when the cube is solved.
// Drag to turn it. Falls back to the CSS cube if WebGL is not available.
// =========================================================
import * as THREE from 'three';
import { RoundedBoxGeometry } from '../assets/vendor/three/RoundedBoxGeometry.js';
import { RoomEnvironment } from '../assets/vendor/three/RoomEnvironment.js';

const stage = document.querySelector('[data-cube3d]');
const host = stage && stage.querySelector('[data-cube3d-canvas]');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

if (stage && host && webglOK()) start();

function start() {
  const timeEl = stage.querySelector('[data-cube3d-time]');
  const solveEl = stage.querySelector('[data-cube3d-solve]');
  const scrEl = stage.querySelector('[data-cube3d-scr]');

  // ---------- renderer / scene ----------
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);
  stage.classList.add('is-3d');

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.02).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 11.5);

  // lights: soft key, cool fill, warm yellow rim from behind (brand colour)
  scene.add(new THREE.HemisphereLight(0xffffff, 0x0a0a0a, 0.45));
  const key = new THREE.DirectionalLight(0xfff6e8, 2.6); key.position.set(4, 6, 7);
  key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 4; key.shadow.bias = -0.0004;
  Object.assign(key.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 1, far: 20 });
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xbcd2ff, 0.55); fill.position.set(-6, 1, 5); scene.add(fill);
  const rim = new THREE.PointLight(0xf5cb0b, 40, 20, 2); rim.position.set(-3.5, 2.5, -4); scene.add(rim);
  const rim2 = new THREE.PointLight(0xf5cb0b, 18, 20, 2); rim2.position.set(4, -3, -3); scene.add(rim2);

  // ---------- the cube ----------
  const COLORS = { U: 0xf7f7f4, D: 0xffd21a, F: 0x12b04a, B: 0x1f5fe0, R: 0xe0242a, L: 0xff7a12 };
  const tilt = new THREE.Group();          // fixed tilt towards the viewer (drag up/down)
  const root = new THREE.Group();          // spin around the vertical axis (drag left/right, idle orbit)
  tilt.add(root);
  const lift = new THREE.Group(); lift.position.set(-0.35, 0.45, 0); scene.add(lift);
  const cubeGroup = new THREE.Group();     // holds the 27 cubies
  root.add(cubeGroup); lift.add(tilt);
  tilt.rotation.x = 0.52; root.rotation.y = -0.7;

  const bodyGeo = new RoundedBoxGeometry(0.97, 0.97, 0.97, 4, 0.12);
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0x070707, roughness: 0.32, metalness: 0.0, clearcoat: 1, clearcoatRoughness: 0.18, envMapIntensity: 0.9 });

  function roundedRect(w, r) {
    const s = new THREE.Shape(), h = w / 2;
    s.moveTo(-h + r, -h); s.lineTo(h - r, -h); s.quadraticCurveTo(h, -h, h, -h + r);
    s.lineTo(h, h - r); s.quadraticCurveTo(h, h, h - r, h); s.lineTo(-h + r, h);
    s.quadraticCurveTo(-h, h, -h, h - r); s.lineTo(-h, -h + r); s.quadraticCurveTo(-h, -h, -h + r, -h);
    // a raised tile with a soft bevel, like the stickers of a premium speedcube
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.014, bevelSegments: 4, curveSegments: 8 });
    // ShapeGeometry UVs are in shape units; map them to 0..1 so a texture covers the sticker
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / w + 0.5, uv.getY(i) / w + 0.5);
    return geo;
  }
  const stickerGeo = roundedRect(0.8, 0.15);
  const mats = {};
  for (const [k, c] of Object.entries(COLORS)) {
    mats[k] = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.22, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 0.45 });
  }
  // the Enigma Cube logo on the white centre, like in the app
  const logoMat = mats.U.clone();
  {
    const cv = document.createElement('canvas'); cv.width = cv.height = 256;
    const g = cv.getContext('2d'); g.fillStyle = '#f4f4f2'; g.fillRect(0, 0, 256, 256);
    const img = new Image();
    img.onload = () => { g.drawImage(img, 14, 14, 228, 228); tex.needsUpdate = true; };
    img.src = '/assets/brand/enigma-cube.png';
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    logoMat.map = tex; logoMat.color.set(0xffffff);
  }

  const FACES = [
    { k: 'R', n: [1, 0, 0] }, { k: 'L', n: [-1, 0, 0] }, { k: 'U', n: [0, 1, 0] },
    { k: 'D', n: [0, -1, 0] }, { k: 'F', n: [0, 0, 1] }, { k: 'B', n: [0, 0, -1] },
  ];
  const cubies = [];
  for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
    const c = new THREE.Group();
    const body = new THREE.Mesh(bodyGeo, bodyMat); body.castShadow = true; body.receiveShadow = true;
    c.add(body);
    for (const f of FACES) {
      const [nx, ny, nz] = f.n;
      if ((nx && nx !== x) || (ny && ny !== y) || (nz && nz !== z)) continue;
      const isLogo = f.k === 'U' && x === 0 && z === 0;
      const m = new THREE.Mesh(stickerGeo, isLogo ? logoMat : mats[f.k]);
      m.position.set(nx * 0.476, ny * 0.476, nz * 0.476);
      m.castShadow = true; m.receiveShadow = true;
      m.lookAt(nx * 2, ny * 2, nz * 2);
      if (isLogo) m.rotateZ(Math.PI);
      c.add(m);
    }
    c.position.set(x, y, z);
    c.userData.home = c.position.clone();
    cubeGroup.add(c); cubies.push(c);
  }

  // soft contact shadow under the floating cube
  const shadowTex = (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const g = cv.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(0,0,0,.75)'); gr.addColorStop(.5, 'rgba(0,0,0,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(cv);
  })();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 5.2), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -2.85; lift.add(floor);
  // a yellow glow on the floor, the brand colour
  const glowTex = (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const g = cv.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(245,203,11,.35)'); gr.addColorStop(1, 'rgba(245,203,11,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(cv);
  })();
  const floorGlow = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 7.5), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  floorGlow.rotation.x = -Math.PI / 2; floorGlow.position.y = -2.9; lift.add(floorGlow);

  // ---------- layer turns ----------
  const AX = { R: ['x', 1], L: ['x', -1], U: ['y', 1], D: ['y', -1], F: ['z', 1], B: ['z', -1] };
  const pivot = new THREE.Group(); cubeGroup.add(pivot);
  const queue = [];
  let turning = null;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function turn(face, amount, dur) {   // amount: 1 = clockwise, -1 = counter, 2 = double
    return new Promise((res) => queue.push({ face, amount, dur, res }));
  }
  function beginTurn(m) {
    const [axis, side] = AX[m.face];
    pivot.rotation.set(0, 0, 0); pivot.updateMatrixWorld();
    const layer = cubies.filter((c) => Math.round(c.position[axis]) === side);
    layer.forEach((c) => pivot.attach(c));
    // clockwise when looking at the face
    turning = { ...m, axis, layer, target: -side * (Math.PI / 2) * m.amount, t0: performance.now() };
  }
  function stepTurn(now) {
    if (!turning && queue.length) beginTurn(queue.shift());
    if (!turning) return;
    const p = Math.min(1, (now - turning.t0) / turning.dur);
    pivot.rotation[turning.axis] = turning.target * ease(p);
    if (p >= 1) {
      pivot.updateMatrixWorld();
      turning.layer.forEach((c) => {
        cubeGroup.attach(c);
        c.position.set(Math.round(c.position.x), Math.round(c.position.y), Math.round(c.position.z));
        // snap the orientation to exact right angles (round the rotation matrix)
        const m4 = new THREE.Matrix4().makeRotationFromQuaternion(c.quaternion);
        m4.elements = m4.elements.map((v, i) => (i % 4 === 3 || i >= 12 ? v : Math.round(v)));
        c.quaternion.setFromRotationMatrix(m4);
      });
      const done = turning.res; turning = null; done();
    }
  }

  // ---------- drag to rotate (with inertia) + idle orbit ----------
  let drag = null, velX = 0, velY = 0, lastUser = -1e9;
  const el = renderer.domElement;
  el.style.touchAction = 'pan-y';
  el.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY }; el.setPointerCapture(e.pointerId); stage.classList.add('is-grabbing'); });
  el.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag = { x: e.clientX, y: e.clientY };
    velY = dx * 0.008; velX = dy * 0.008; lastUser = performance.now();
  });
  const up = () => { drag = null; stage.classList.remove('is-grabbing'); };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);

  // ---------- sizing / visibility ----------
  let visible = true;
  function resize() {
    const r = host.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / Math.max(1, r.height);
    camera.position.z = window.innerWidth < 900 ? 12.5 : 16;
    lift.position.x = 0;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host); resize();
  new IntersectionObserver((en) => { visible = en[0].isIntersecting; }).observe(host);

  // ---------- render loop ----------
  let solved = true, solvedAt = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    stepTurn(now);
    if (!drag) { velX *= 0.94; velY *= 0.94; }
    const idle = now - lastUser > 2500 && !drag;
    const dt = Math.min(0.05, (now - (frame.last || now)) / 1000); frame.last = now;
    root.rotation.y += velY + (idle && !reduce ? 0.32 * dt : 0);
    tilt.rotation.x = Math.max(-0.2, Math.min(1.1, tilt.rotation.x + velX));
    if (idle) tilt.rotation.x += (0.52 - tilt.rotation.x) * Math.min(1, 2 * dt);
    // a soft pulse of the rim light when solved
    const glow = solved ? Math.max(0, 1 - (now - solvedAt) / 1600) : 0;
    rim.intensity = 40 + 70 * glow; rim2.intensity = 18 + 40 * glow;
    root.position.y = reduce ? 0 : Math.sin(now / 1400) * 0.08;
    const sc = 1 - root.position.y * 0.6; floor.scale.set(sc, sc, 1); floor.material.opacity = 0.9 - root.position.y * 1.5;
    floorGlow.material.opacity = 0.6 + 0.4 * glow;
    // the key light slowly sweeps, so reflections glide over the tiles
    if (!reduce) key.position.set(4 + Math.sin(now / 3200) * 2.5, 6, 7 + Math.cos(now / 3200) * 1.5);
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);

  if (reduce) { timeEl.textContent = '9.87'; timeEl.classList.add('is-done'); return; }

  // ---------- the show: scramble -> inspection -> timed solve ----------
  const FACESN = ['R', 'L', 'U', 'D', 'F', 'B'];
  const OPP = { R: 'L', L: 'R', U: 'D', D: 'U', F: 'B', B: 'F' };
  const rnd = (n) => Math.floor(Math.random() * n);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const name = (m) => m.face + (m.amount === -1 ? "'" : m.amount === 2 ? '2' : '');
  function makeScramble(len) {
    const out = [];
    while (out.length < len) {
      const f = FACESN[rnd(6)], p = out[out.length - 1], q = out[out.length - 2];
      if (p && (p.face === f || (OPP[f] === p.face && q && q.face === f))) continue;
      out.push({ face: f, amount: [1, -1, 2][rnd(3)] });
    }
    return out;
  }
  async function waitVisible() { while (!visible || document.hidden) await sleep(400); }

  let n = 0;
  async function loop() {
    await sleep(900);
    for (;;) {
      await waitVisible();
      n++; solveEl.textContent = `#${n}`;
      const scr = makeScramble(14);
      scrEl.textContent = scr.map(name).join(' ');
      timeEl.classList.remove('is-done'); timeEl.textContent = '0.00';
      solved = false;
      for (const m of scr) await turn(m.face, m.amount, m.amount === 2 ? 170 : 120);
      await sleep(1100);                                     // inspection
      // solve = the scramble undone, at a human rhythm with small look-ahead pauses
      const sol = scr.slice().reverse().map((m) => ({ face: m.face, amount: m.amount === 2 ? 2 : -m.amount }));
      const t0 = performance.now();
      let ticking = true;
      (function tick() { if (!ticking) return; timeEl.textContent = ((performance.now() - t0) / 1000).toFixed(2); requestAnimationFrame(tick); })();
      for (let i = 0; i < sol.length; i++) {
        if (i && Math.random() < 0.35) await sleep(220 + rnd(520));
        await turn(sol[i].face, sol[i].amount, sol[i].amount === 2 ? 380 : 260);
      }
      ticking = false;
      timeEl.textContent = ((performance.now() - t0) / 1000).toFixed(2);
      timeEl.classList.add('is-done');
      solved = true; solvedAt = performance.now();
      await sleep(3200);
    }
  }
  loop();
}
