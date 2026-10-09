// =========================================================
// Veil of Fear page: Steam button, latest YouTube video,
// screenshot gallery with a full-screen viewer.
// Plain script (no modules) so it also works opened from disk.
// =========================================================
(() => {
  const CONFIG = window.ENIGMA_CONFIG || {};
  const YT = CONFIG.youtube || {};
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isFile = location.protocol === 'file:';
  const I18N = window.ENIGMA_I18N || { t: (x) => x };
  const t = I18N.t;

  // ---------------------------------------------------------
  // Steam button
  // ---------------------------------------------------------
  document.querySelectorAll('[data-steam]').forEach((a) => {
    const small = a.querySelector('[data-steam-small]');
    if (CONFIG.steamUrl) {
      a.href = CONFIG.steamUrl;
      a.target = '_blank';
      a.rel = 'noopener';
      if (small) small.textContent = t('Out on PC');
    } else {
      a.setAttribute('role', 'note');
      a.setAttribute('aria-label', t('Veil of Fear is coming soon to Steam'));
    }
  });

  // ---------------------------------------------------------
  // Latest video — always plays inside the page.
  //  1) CONFIG.trailer.src set  -> your own video file (mp4/webm) in a native player,
  //     works everywhere, even when the site is opened straight from disk
  //  2) otherwise YouTube, embedded in the page:
  //     - with an API key: the newest video of the playlist, with its title and date
  //     - without a key: the playlist player (starts with the playlist's first video)
  //     YouTube refuses to embed on pages opened from disk (file://), so there the
  //     frame explains how to preview locally instead of leaving the site.
  // ---------------------------------------------------------
  const videoRoot = document.querySelector('[data-latest-video]');
  if (videoRoot) setupVideo(videoRoot);

  function setupVideo(root) {
    const frame = root.querySelector('[data-video-frame]');
    const poster = root.querySelector('[data-video-poster]');
    const thumb = root.querySelector('[data-video-thumb]');
    const hint = root.querySelector('[data-video-hint]');
    const titleEl = root.querySelector('[data-video-title]');
    const dateEl = root.querySelector('[data-video-date]');
    const playlistId = YT.playlistId;
    const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
    const trailer = CONFIG.trailer || {};
    document.querySelectorAll('[data-video-all]').forEach((a) => { a.href = playlistUrl; });

    let videoId = YT.videoId || null; // a fixed video, or the newest one found with an API key

    if (trailer.src) {
      if (trailer.poster) thumb.src = trailer.poster;
      if (trailer.title) titleEl.textContent = trailer.title;
      hint.textContent = t('Play');
    }

    const playOwnFile = () => {
      const v = document.createElement('video');
      v.src = trailer.src;
      if (trailer.poster) v.poster = trailer.poster;
      v.controls = true;
      v.autoplay = true;
      v.playsInline = true;
      v.preload = 'auto';
      v.setAttribute('title', trailer.title || 'Veil of Fear');
      frame.replaceChildren(v);
      v.play().catch(() => {});
    };

    const playYouTube = () => {
      if (isFile) {
        frame.replaceChildren(localNotice());
        return;
      }
      const list = encodeURIComponent(playlistId);
      const src = videoId
        ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&list=${list}`
        : `https://www.youtube-nocookie.com/embed/videoseries?list=${list}&autoplay=1&rel=0&modestbranding=1`;
      const iframe = document.createElement('iframe');
      iframe.src = src;
      iframe.title = titleEl.textContent || 'Veil of Fear — latest video';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.allowFullscreen = true;
      frame.replaceChildren(iframe);
    };

    function localNotice() {
      const box = document.createElement('div');
      box.className = 'video__notice';
      const watch = videoId ? `https://www.youtube.com/watch?v=${videoId}&list=${playlistId}` : playlistUrl;
      box.innerHTML = `
        <p class="video__notice-title">The video plays here once the site is online</p>
        <p class="video__notice-text">YouTube does not allow its player on pages opened straight from a folder. To preview locally, start the site with <span class="mono">start-site.bat</span> (Windows) or <span class="mono">start-site.command</span> (Mac).</p>
        <a class="ghost-btn" href="${watch}" target="_blank" rel="noopener">Watch on YouTube instead</a>`;
      if (I18N.translate) I18N.translate(box);
      return box;
    }

    poster.addEventListener('click', () => (trailer.src ? playOwnFile() : playYouTube()));

    // Show the real YouTube preview of the newest video, not game art.
    //  1) a fixed videoId from config
    //  2) API key: newest video of the playlist (most reliable)
    //  3) no key: the playlist's public feed (newest by date), read through rss2json
    //  4) last resort: the playlist's cover picture from noembed
    // If everything fails (offline, service down) the game art stays.
    const show = (v) => {
      if (!v || !v.id) return false;
      videoId = v.id;
      window.ENIGMA_YT_THUMB && window.ENIGMA_YT_THUMB(thumb, v.id);
      if (v.title) {
        titleEl.textContent = v.title;
        poster.setAttribute('aria-label', `${t('Play')}: ${v.title}`);
      }
      if (v.date) dateEl.textContent = v.date;
      return true;
    };
    if (trailer.src) return;
    if (YT.videoId) { show({ id: YT.videoId }); return; }
    (async () => {
      const sources = [];
      if (YT.apiKey) sources.push(() => fetchLatest(playlistId, YT.apiKey));
      sources.push(() => fetchFromFeed(playlistId), () => fetchCover(playlistId));
      for (const src of sources) {
        try { if (show(await src())) return; } catch (err) { /* try the next source */ }
      }
    })();
  }

  function fmtDate(d) {
    const lang = ({ en: 'en-GB', uk: 'uk-UA' })[I18N.lang] || I18N.lang || 'en-GB';
    try { return new Date(d).toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return ''; }
  }
  function withTimeout(url, ms = 6000) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), ms);
    return fetch(url, { signal: ctl.signal }).finally(() => clearTimeout(timer));
  }

  async function fetchFromFeed(playlistId) {
    const feed = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`;
    const res = await withTimeout(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed)}`);
    if (!res.ok) throw new Error(`feed ${res.status}`);
    const data = await res.json();
    const items = (data.items || [])
      .map((it) => ({ ...it, id: ((it.link || it.guid || '').match(/(?:v=|video:)([\w-]{11})/) || [])[1] }))
      .filter((it) => it.id)
      .sort((a, b) => new Date(b.pubDate.replace(' ', 'T')) - new Date(a.pubDate.replace(' ', 'T')));
    if (!items.length) return null;
    const v = items[0];
    return { id: v.id, title: v.title, date: fmtDate(v.pubDate.replace(' ', 'T') + 'Z') };
  }

  async function fetchCover(playlistId) {
    const url = `https://www.youtube.com/playlist?list=${playlistId}`;
    const res = await withTimeout(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
    const data = await res.json();
    const id = ((data.thumbnail_url || '').match(/\/vi\/([\w-]{11})\//) || [])[1];
    return id ? { id } : null;
  }

  async function fetchLatest(playlistId, key) {
    const items = [];
    let pageToken = '';
    for (let i = 0; i < 4; i += 1) {
      const params = new URLSearchParams({ part: 'snippet,contentDetails', maxResults: '50', playlistId, key });
      if (pageToken) params.set('pageToken', pageToken);
      const res = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?${params}`);
      if (!res.ok) throw new Error(`YouTube API ${res.status}`);
      const data = await res.json();
      items.push(...(data.items || []));
      if (!data.nextPageToken) break;
      pageToken = data.nextPageToken;
    }
    const videos = items
      .filter((it) => it.contentDetails && it.contentDetails.videoPublishedAt)
      .sort((a, b) => new Date(b.contentDetails.videoPublishedAt) - new Date(a.contentDetails.videoPublishedAt));
    if (!videos.length) return null;
    const v = videos[0];
    const t = v.snippet.thumbnails;
    return {
      id: v.contentDetails.videoId,
      title: v.snippet.title,
      poster: (t.maxres || t.standard || t.high || t.medium).url,
      date: fmtDate(v.contentDetails.videoPublishedAt),
    };
  }

})();
