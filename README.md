# Enigma Studio — website

The official website of **Enigma Studio**, an independent team making dark, story-driven horror games and small free apps.

**Live site:** https://d4rv1n17.github.io/Enigma-Studio-Website/

It is a plain HTML/CSS/JavaScript site: no framework and no dependencies. The pages work as they are, and a small build step creates the language versions for search engines.

## Pages

| File | What it is |
|---|---|
| `index.html` | Studio home: hero, about the studio, games, apps, news, latest video, support and community |
| `veil-of-fear.html` | Veil of Fear: episodic psychological horror for PC, based on the real events of MKUltra |
| `twins-hunt.html` | Twins' Hunt: horror game for Android, trailer and screenshots |
| `enigma-cube.html` | Enigma Cube: free timer and speedcubing school for Windows, download |
| `enigma-disk.html` | Enigma Disk: free Windows app that shows which folders grew, download |
| `news.html` | All news, grouped by year, with a filter by project |
| `contact.html` | Email, contact form (opens the visitor's mail app), FAQ, social links |
| `privacy.html` | Privacy policy |
| `404.html` | "Lost in the dark" page for wrong addresses |

## Languages

The site is in **English, Russian, Romanian and Ukrainian**.

- The pages are written in English. Translations live in `src/i18n-data.js`, a dictionary of "English text → translation" for `ru`, `ro` and `uk`.
- To fix a translation, find the line and change the text on the right.
- If you change English text in an HTML page, add a translation for the new English text in `src/i18n-data.js`, otherwise that piece stays in English.
- Visitors pick a language with the globe button in the header; the choice is remembered. On the first visit the browser language is used.
- Koulen has no Cyrillic or Romanian letters, so Russian, Romanian and Ukrainian use the Oswald font.

## Project structure

```
index.html, veil-of-fear.html, twins-hunt.html, enigma-cube.html, enigma-disk.html,
news.html, contact.html, privacy.html, 404.html
src/
  config.js        links and settings: social networks, YouTube, Steam, downloads, newsletter, email
  news.js          the news posts (in four languages)
  i18n-data.js     translations
  i18n.js          language detection, switcher and translation
  main.js          header and menus, torch effect, news, forms, videos, page transitions
  gallery.js       full-screen image viewer
  veil-of-fear.js  Steam button and the latest YouTube video
  styles.css       all styles
assets/            images, icons, link previews (og/)
tools/build.py     builds the published version (see below)
.github/workflows/pages.yml   publishes the site to GitHub Pages
```

## Running it locally

- **Windows:** double-click `start-site.bat`. The site opens at http://localhost:8080/.
- **Mac:** double-click `start-site.command` (needs Python 3).
- Or: `python3 -m http.server 8080` in this folder.

Opening `index.html` directly also works, but YouTube does not allow its player on pages opened from disk, so videos show a hint instead.

## Publishing

Every push to `main` publishes the site automatically: `.github/workflows/pages.yml` runs `tools/build.py` and deploys the result to GitHub Pages.

`tools/build.py` writes a ready-to-publish copy to `dist/`:

- the English pages, plus already translated copies in `dist/ru/`, `dist/ro/` and `dist/uk/`, each with its own address so search engines see every language;
- `sitemap.xml` and `robots.txt`;
- links between the language versions (hreflang), canonical addresses and structured data for the studio, the games and the apps.

Run it locally with `pip install playwright`, `python -m playwright install chromium`, then `python tools/build.py`.

The site address is `SITE_URL` in `tools/build.py` and `.github/workflows/pages.yml`. Change it in both places when you connect your own domain.

## Common edits

**Add a news post.** Open `src/news.js`, copy one `{ … },` block to the top of the list and change `id`, `date` (`'2026-10-15'`, or `'2026-10'` for month only), `tag` (`studio`, `vof`, `twins`, `cube` or `disk`), `image`, `link`, and the `title` and `text` in each language. The home page shows the 4 newest posts; `news.html` shows all of them.

**New version of an app.** In `src/config.js`, change `version`, `size` and the download `url` in `enigmaCube` or `enigmaDisk`, and update the "What's new" block on the app's page.
- Enigma Cube downloads the installer from the GitHub release of [Enigma-Cube](https://github.com/d4rv1n17/Enigma-Cube) (`releases/download/v3.1/EnigmaCube-Setup-3.1.exe`).
- Enigma Disk downloads `EnigmaDiskSetup.exe` from the latest release of [Enigma-Disk](https://github.com/d4rv1n17/Enigma-Disk), so a new release needs no change here as long as the file name stays the same.

**Steam.** Put the store address of Veil of Fear in `steamUrl` in `src/config.js`. Until then the button says "Coming soon".

**Social links.** The `social` list in `src/config.js` feeds the footer, the contact page and the community block.

**Latest video.** The home page and the Veil of Fear page find the newest video of the playlist (`youtube.playlistId`) and show its real YouTube preview. Without a key this uses the playlist's public feed; a YouTube Data API key in `youtube.apiKey` makes it fully reliable. `youtube.videoId` pins one specific video.

**Newsletter.** The subscribe forms send email addresses to MailerLite (`newsletter.action` in `src/config.js`).

**Support button.** `supportUrl` in `src/config.js`.

**Images.** Large pictures come in two sizes: `name.webp` (full size, used in the full-screen viewer) and `name-1280.webp` (used on the page). The browser picks the right one.

## Privacy

`privacy.html` describes what the site collects (only an email address, for the newsletter) and the third-party services it loads. If you add a new service, such as visit statistics, add it to the "Third-party services" section and update the date.

## Copyright

© 2026 Enigma Studio. All rights reserved.

The code, texts, artwork and logos of this website belong to Enigma Studio. The source code is public so you can read it, but no licence is granted to copy, modify or reuse it. Game, app and studio names and logos may not be used without permission.

Fonts are from Google Fonts under the SIL Open Font License. YouTube, Instagram, TikTok, GitHub, Steam, Google Play and App Store names and logos belong to their owners.
