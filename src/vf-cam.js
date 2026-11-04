// =========================================================
// Veil of Fear hero: tape noise on a tiny canvas and a rare glitch.
// Runs only while the hero is on screen.
// =========================================================
(() => {
  const cam = document.querySelector('[data-vf-cam]');
  if (!cam || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cv = cam.querySelector('.vf-cam__noise');
  const g = cv.getContext('2d');
  const img = g.createImageData(cv.width, cv.height);
  let on = true, last = 0;
  new IntersectionObserver((e) => { on = e[0].isIntersecting; }).observe(cam);
  function noise(now) {
    requestAnimationFrame(noise);
    if (!on || document.hidden || now - last < 70) return;
    last = now;
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = Math.random() * 255;
      d[i] = v * 0.7; d[i + 1] = v; d[i + 2] = v * 0.7; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }
  requestAnimationFrame(noise);
  (function glitch() {
    setTimeout(() => {
      if (on && !document.hidden) {
        cam.classList.add('is-glitch');
        setTimeout(() => cam.classList.remove('is-glitch'), 240);
      }
      glitch();
    }, 6000 + Math.random() * 7000);
  })();
})();
