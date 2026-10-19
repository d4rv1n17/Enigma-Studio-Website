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

  // full game: itch.io page, in a new tab
  const buy = document.querySelector('[data-ls-buy]');
  if (buy) {
    const small = buy.querySelector('[data-ls-buy-small]');
    if (cfg.buyUrl) {
      buy.href = cfg.buyUrl;
      buy.target = '_blank';
      buy.rel = 'noopener';
      if (small) small.textContent = cfg.price || '';
    } else if (small) {
      small.textContent = t('Coming soon');
    }
  }
})();
