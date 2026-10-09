// =========================================================
// Site configuration — the only file you need to edit for
// links, YouTube and Steam. (Plain script: works even when
// the site is opened straight from disk.)
// =========================================================

window.ENIGMA_CONFIG = {
  steamUrl: '', // Steam store page of Veil of Fear. Empty = button shows "Coming soon".

  youtube: {
    channelUrl: 'https://www.youtube.com/@enigmastudiomd',
    // Playlist with Veil of Fear videos only.
    playlistId: 'PLCvffitjV9S6at15Yieo6BuvdwiDLa8g9',
    // The newest video of the playlist is found automatically: its real YouTube
    // preview picture, title and date are shown, and that video plays on click.
    // Without a key this uses the playlist's public feed (via the free rss2json service).
    // Optional YouTube Data API v3 key (restrict it to your domain) makes it fully reliable.
    apiKey: '',
    // Optional: always show one specific video (its ID is the part after "v=" in the YouTube link).
    // Empty = the playlist decides (see above).
    videoId: '',
  },

  // Optional: your own video file instead of YouTube. It plays in the site's own player,
  // everywhere, even when the site is opened straight from a folder. Example:
  // trailer: { src: 'assets/video/trailer.mp4', poster: 'assets/art/corridor-1280.webp', title: 'Veil of Fear — Trailer' },
  trailer: { src: '', poster: '', title: '' },

  // Social links: shown on the contact page and in every footer, in this order.
  social: [
    { name: 'YouTube',   handle: '@enigmastudiomd',  url: 'https://www.youtube.com/@enigmastudiomd',   icon: 'assets/brand/youtube.svg' },
    { name: 'Instagram', handle: '@enigmastudio.md', url: 'https://www.instagram.com/enigmastudio.md/', icon: 'assets/brand/instagram.svg' },
    { name: 'TikTok',    handle: '@enigmastudiomd',  url: 'https://www.tiktok.com/@enigmastudiomd',    icon: 'assets/brand/tiktok.png' },
    { name: 'GitHub',    handle: 'd4rv1n17',         url: 'https://github.com/d4rv1n17',               icon: 'assets/brand/github.svg' },
  ],

  // Studio GitHub (the code of all our apps is there)
  githubUrl: 'https://github.com/d4rv1n17',

  // "Support us" buttons (home, contact, footer) lead here.
  supportUrl: 'https://dalink.to/enigma_studio_md',

  // News by e-mail ("Subscribe" forms on the home page and in every footer).
  // action: the form address from your mailing service, e.g.
  //   Buttondown: 'https://buttondown.com/api/emails/embed-subscribe/YOUR_NAME'  (field 'email')
  //   MailerLite: the "action" URL from the form's HTML embed code, e.g.
  //     'https://assets.mailerlite.com/jsonp/123456/forms/987654321/subscribe'  (sent in the background)
  //     doubleOptIn: false  if the form has double opt-in turned off (changes the success message)
  //   Mailchimp: the form "action" URL from their embed code                   (field 'EMAIL')
  // Empty = the visitor's e-mail app opens with a ready "subscribe me" letter to the studio address.
  newsletter: { action: 'https://assets.mailerlite.com/jsonp/2697071/forms/200795927724688837/subscribe', emailField: 'email' },

  email: 'enigmastudio.md@gmail.com',
  // Time zone of the 'Studio time' clock on the contact page.
  studioTimeZone: 'Europe/Chisinau',

  // Enigma Disk: the download button downloads the installer right away.
  // The link always points to EnigmaDiskSetup.exe of the LATEST GitHub release, so a new
  // version needs no change here: publish a release and attach a file with exactly that name.
  enigmaDisk: {
    version: '1.1',
    size: '59 MB',
    url: 'https://github.com/d4rv1n17/Enigma-Disk/releases/latest/download/EnigmaDiskSetup.exe',
    repo: 'https://github.com/d4rv1n17/Enigma-Disk',
  },

  // Enigma Cube download: the installer from GitHub Releases of the Enigma-Cube repository.
  // New version: change `version`, `size` and the version in `url` (and `sha256` if you want it shown).
  enigmaCube: {
    version: '3.1',
    size: '41 MB',
    // the installer attached to the GitHub release v3.1 (push the tag v3.1 and the build workflow attaches it)
    url: 'https://github.com/d4rv1n17/Enigma-Cube/releases/download/v3.1/EnigmaCube-Setup-3.1.exe',
    repo: 'https://github.com/d4rv1n17/Enigma-Cube',   // source code
    sha256: '5d6d76aca2536afc062ec284a85467529b6f7265e61cac8742d79b46de0a5b9f',   // SHA-256 of the installer, shown under the install steps
  },
};
