// =========================================================
// Veil of Fear: night-vision tape noise on a tiny canvas and a rare glitch,
// for every [data-vf-cam] block (the series banner in the hero and the
// Episode 1 footage). Each one runs only while it is on screen.
// =========================================================
(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('[data-vf-cam]').forEach((cam) => {
    const cv = cam.querySelector('.vf-cam__noise');
    if (!cv) return;
    const g = cv.getContext('2d');
    const img = g.createImageData(cv.width, cv.height);
    let on = false, last = 0, raf = 0;
    const noise = (now) => {
      raf = on ? requestAnimationFrame(noise) : 0;
      if (document.hidden || now - last < 70) return;
      last = now;
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.random() * 255;
        d[i] = v * 0.7; d[i + 1] = v; d[i + 2] = v * 0.7; d[i + 3] = 255;
      }
      g.putImageData(img, 0, 0);
    };
    new IntersectionObserver((e) => {
      on = e[0].isIntersecting;
      if (on && !raf) raf = requestAnimationFrame(noise);
    }).observe(cam);
    (function glitch() {
      setTimeout(() => {
        if (on && !document.hidden) {
          cam.classList.add('is-glitch');
          setTimeout(() => cam.classList.remove('is-glitch'), 240);
        }
        glitch();
      }, 6000 + Math.random() * 7000);
    })();
  });
})();
