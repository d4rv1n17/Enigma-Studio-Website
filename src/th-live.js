// =========================================================
// Twins' Hunt hero: the school is dark, your flashlight shows the way.
// The battery drains while you look around, the day counter ticks,
// and now and then two pairs of eyes light up somewhere in the dark.
// =========================================================
(() => {
  const stage = document.querySelector('[data-th-stage]');
  if (!stage) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const bat = stage.querySelector('[data-th-bat]');
  const fill = stage.querySelector('[data-th-bat-fill]');
  const day = stage.querySelector('[data-th-day]');
  const eyes = stage.querySelector('[data-th-eyes]');
  let level = 99, d = 1, on = false;

  const draw = () => {
    bat.textContent = level + '%';
    fill.style.width = level + '%';
    stage.classList.toggle('is-low', level <= 20);
    stage.style.setProperty('--bat', (0.55 + level / 220).toFixed(3));
  };
  draw();
  new IntersectionObserver(([e]) => { on = e.isIntersecting; }).observe(stage);
  if (reduce) return;

  setInterval(() => {
    if (!on || document.hidden) return;
    level -= 1;
    if (level < 6) {               // the battery dies: darkness, then a new one
      stage.classList.add('is-dead');
      setTimeout(() => { level = 99; d = d % 3 + 1; day.textContent = d; stage.classList.remove('is-dead'); draw(); }, 1400);
      level = 0;
    }
    draw();
  }, 700);

  // the twins: eyes that appear in the dark, never where the light is
  const SPOTS = [[0.14, 0.42], [0.86, 0.38], [0.22, 0.6], [0.78, 0.62], [0.08, 0.3], [0.93, 0.5]];
  const blink = () => {
    if (on && !document.hidden) {
      const lx = parseFloat(stage.style.getPropertyValue('--x')) / 100 || 0.5;
      const far = SPOTS.filter(([x]) => Math.abs(x - lx) > 0.3);
      const [x, y] = far[Math.floor(Math.random() * far.length)] || SPOTS[0];
      eyes.style.left = (x * 100) + '%';
      eyes.style.top = (y * 100) + '%';
      eyes.classList.remove('is-on'); void eyes.offsetWidth; eyes.classList.add('is-on');
    }
    setTimeout(blink, 3500 + Math.random() * 4000);
  };
  setTimeout(blink, 2500);
})();
