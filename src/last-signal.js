// =========================================================
// Last Signal page: "Play the demo" and "Buy" buttons.
// Addresses and price come from ENIGMA_CONFIG.lastSignal (src/config.js).
// =========================================================
(() => {
  const cfg = (window.ENIGMA_CONFIG || {}).lastSignal || {};
  const t = (s) => (window.ENIGMA_I18N ? window.ENIGMA_I18N.t(s) : s);

  document.querySelectorAll('[data-ls-price]').forEach((el) => { if (cfg.price) el.textContent = cfg.price; });

  // demo
  document.querySelectorAll('[data-ls-play]').forEach((a) => {
    const small = a.querySelector('[data-ls-play-small]');
    if (cfg.playUrl) {
      a.href = cfg.playUrl;
      a.target = '_blank';
      a.rel = 'noopener';
    } else if (small) {
      // the big button waits for the game; plain links keep pointing to "How to play"
      a.removeAttribute('href');
      small.textContent = t('Coming soon');
    }
  });

  // full game
  const buy = document.querySelector('[data-ls-buy]');
  if (buy) {
    const small = buy.querySelector('[data-ls-buy-small]');
    if (cfg.buyUrl) {
      buy.href = cfg.buyUrl;
      if (small) small.textContent = cfg.price || '';
      // Lemon Squeezy overlay checkout: their script turns links with this class into a pop-up
      buy.classList.add('lemonsqueezy-button');
      const s = document.createElement('script');
      s.src = 'https://app.lemonsqueezy.com/js/lemon.js';
      s.defer = true;
      s.onload = () => { if (window.createLemonSqueezy) window.createLemonSqueezy(); };
      document.head.appendChild(s);
    } else if (small) {
      small.textContent = t('Coming soon');
    }
  }
})();
