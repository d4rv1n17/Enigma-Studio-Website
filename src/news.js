// =========================================================
// Enigma Studio — news (home page shows the newest 4, news.html shows all).
// Newest first. To add a post, copy one block and change it.
//   id:    short name for the link to this post (news.html#id), latin letters and dashes
//   date:  'YYYY-MM-DD' (shows the day) or 'YYYY-MM' (month only)
//   tag:   'studio' | 'vof' | 'twins' | 'cube' | 'disk'  (sets the colour)
//   image: a picture from assets/ (the -1280 versions load faster)
//   link:  where "Read more" leads (a page of the site or any URL)
//   title / text: one line per language — en, ru, ro, uk.
//   A missing language falls back to English.
// =========================================================
window.ENIGMA_NEWS = [
  {
    id: 'enigma-cube-3-1',
    date: '2026-10-09',
    tag: 'cube',
    image: 'assets/app/cube-banner-1280.webp',
    link: 'enigma-cube.html#whats-new',
    title: {
      en: 'Enigma Cube 3.1: a speedcubing school inside the timer',
      ru: 'Enigma Cube 3.1: школа спидкубинга внутри таймера',
      ro: 'Enigma Cube 3.1: o școală de speedcubing în cronometru',
      uk: 'Enigma Cube 3.1: школа спідкубінгу всередині таймера',
    },
    text: {
      en: 'Courses for all 14 WCA events, 342 algorithms with pictures, a smart trainer and 40 achievements. Version 3.1 opens any section in its own window and adds new lessons.',
      ru: 'Курсы по всем 14 дисциплинам WCA, 342 алгоритма с картинками, умный тренажёр и 40 достижений. Версия 3.1 открывает любой раздел в отдельном окне и добавляет новые уроки.',
      ro: 'Cursuri pentru toate cele 14 probe WCA, 342 de algoritmi cu imagini, un antrenor inteligent și 40 de realizări. Versiunea 3.1 deschide orice secțiune într-o fereastră separată și aduce lecții noi.',
      uk: 'Курси з усіх 14 дисциплін WCA, 342 алгоритми з картинками, розумний тренажер і 40 досягнень. Версія 3.1 відкриває будь-який розділ в окремому вікні й додає нові уроки.',
    },
  },
  {
    id: 'enigma-disk',
    date: '2026-10-09',
    tag: 'disk',
    image: 'assets/og/enigma-disk.jpg',
    link: 'enigma-disk.html',
    title: {
      en: 'Meet Enigma Disk',
      ru: 'Встречайте Enigma Disk',
      ro: 'Faceți cunoștință cu Enigma Disk',
      uk: 'Зустрічайте Enigma Disk',
    },
    text: {
      en: 'Our new free app for Windows shows which folders grew this week and helps you clean up safely. As with all our apps, its source code is on GitHub.',
      ru: 'Наше новое бесплатное приложение для Windows показывает, какие папки выросли за неделю, и помогает безопасно освободить место. Как и у всех наших приложений, его код лежит на GitHub.',
      ro: 'Noua noastră aplicație gratuită pentru Windows arată ce foldere au crescut săptămâna aceasta și te ajută să faci curat în siguranță. Ca la toate aplicațiile noastre, codul este pe GitHub.',
      uk: 'Наш новий безкоштовний застосунок для Windows показує, які папки виросли за тиждень, і допомагає безпечно звільнити місце. Як і в усіх наших застосунків, його код є на GitHub.',
    },
  },
  {
    id: 'vof-mkultra',
    date: '2026-10',
    tag: 'vof',
    image: 'assets/art/key-art-1280.webp',
    link: 'veil-of-fear.html',
    title: {
      en: 'Veil of Fear: based on real events',
      ru: 'Veil of Fear: основано на реальных событиях',
      ro: 'Veil of Fear: inspirat din evenimente reale',
      uk: 'Veil of Fear: засновано на реальних подіях',
    },
    text: {
      en: 'The first episode, He Never Left, is in development. The story draws on MKUltra, the CIA’s secret mind-control program of the 1950s–70s.',
      ru: 'Первый эпизод, He Never Left, в разработке. В основе сюжета — MKUltra, секретная программа ЦРУ по контролю сознания 1950–70-х годов.',
      ro: 'Primul episod, He Never Left, este în dezvoltare. Povestea pornește de la MKUltra, programul secret al CIA de control al minții din anii 1950–70.',
      uk: 'Перший епізод, He Never Left, у розробці. В основі сюжету — MKUltra, секретна програма ЦРУ з контролю свідомості 1950–70-х років.',
    },
  },
  {
    id: 'twins-update-app-store',
    date: '2026-10',
    tag: 'twins',
    image: 'assets/twins/banner-1280.webp',
    link: 'twins-hunt.html',
    title: {
      en: 'Twins’ Hunt: a big update and the App Store',
      ru: 'Twins’ Hunt: большое обновление и App Store',
      ro: 'Twins’ Hunt: o actualizare mare și App Store',
      uk: 'Twins’ Hunt: велике оновлення та App Store',
    },
    text: {
      en: 'More than 500 downloads on Google Play. Next up: a major update for all players and the release on iPhone and iPad.',
      ru: 'Больше 500 загрузок в Google Play. Дальше — крупное обновление для всех игроков и выход на iPhone и iPad.',
      ro: 'Peste 500 de descărcări pe Google Play. Urmează o actualizare majoră pentru toți jucătorii și lansarea pe iPhone și iPad.',
      uk: 'Понад 500 завантажень у Google Play. Далі — велике оновлення для всіх гравців і вихід на iPhone та iPad.',
    },
  },
  {
    id: 'new-website',
    date: '2026-10',
    tag: 'studio',
    image: 'assets/art/studio-desk-1280.webp',
    link: 'index.html#games',
    title: {
      en: 'Our new website is live',
      ru: 'Наш новый сайт открыт',
      ro: 'Noul nostru site este online',
      uk: 'Наш новий сайт відкрито',
    },
    text: {
      en: 'All our games and apps in one place: news, videos, screenshots and downloads, now in four languages.',
      ru: 'Все наши игры и приложения в одном месте: новости, видео, скриншоты и загрузки — теперь на четырёх языках.',
      ro: 'Toate jocurile și aplicațiile noastre într-un singur loc: noutăți, videoclipuri, capturi și descărcări, acum în patru limbi.',
      uk: 'Усі наші ігри та застосунки в одному місці: новини, відео, скриншоти й завантаження — тепер чотирма мовами.',
    },
  },
  {
    id: 'twins-hunt-release',
    date: '2023-09-25',
    tag: 'twins',
    image: 'assets/twins/shot-get-out-1280.webp',
    link: 'twins-hunt.html',
    title: {
      en: 'Twins’ Hunt is out on Android',
      ru: 'Twins’ Hunt вышла на Android',
      ro: 'Twins’ Hunt a apărut pe Android',
      uk: 'Twins’ Hunt вийшла на Android',
    },
    text: {
      en: 'The twins have locked you inside the school. Find the keys, fight the monsters and get out in three days. Free on Google Play.',
      ru: 'Близнецы заперли тебя в школе. Найди ключи, отбейся от монстров и выберись за три дня. Бесплатно в Google Play.',
      ro: 'Gemenii te-au încuiat în școală. Găsește cheile, luptă cu monștrii și ieși în trei zile. Gratuit pe Google Play.',
      uk: 'Близнюки замкнули тебе в школі. Знайди ключі, відбийся від монстрів і виберися за три дні. Безкоштовно в Google Play.',
    },
  },
  {
    id: 'enigma-cube-release',
    date: '2022-04-09',
    tag: 'cube',
    image: 'assets/app/cube-banner-1280.webp',
    link: 'enigma-cube.html',
    title: {
      en: 'Enigma Cube is out',
      ru: 'Вышел Enigma Cube',
      ro: 'Enigma Cube a fost lansat',
      uk: 'Вийшов Enigma Cube',
    },
    text: {
      en: 'A free speedcubing timer for Windows: WCA scrambles, inspection, averages and personal bests. Works offline.',
      ru: 'Бесплатный таймер для спидкубинга под Windows: скрамблы WCA, инспекция, средние и личные рекорды. Работает без интернета.',
      ro: 'Un cronometru gratuit de speedcubing pentru Windows: amestecări WCA, inspecție, medii și recorduri personale. Funcționează offline.',
      uk: 'Безкоштовний таймер для спідкубінгу під Windows: скрамбли WCA, інспекція, середні та особисті рекорди. Працює без інтернету.',
    },
  },
  {
    id: 'studio-founded',
    date: '2022-01',
    tag: 'studio',
    image: 'assets/art/studio-banner-1280.webp',
    link: 'index.html#about',
    title: {
      en: 'Enigma Studio is founded',
      ru: 'Основана Enigma Studio',
      ro: 'Se naște Enigma Studio',
      uk: 'Засновано Enigma Studio',
    },
    text: {
      en: 'A small team with a love for mystery and horror starts its first projects. The beginning of the enigma.',
      ru: 'Небольшая команда, влюблённая в тайны и хорроры, берётся за первые проекты. Так начинается загадка.',
      ro: 'O echipă mică, pasionată de mister și horror, își începe primele proiecte. Așa începe enigma.',
      uk: 'Невелика команда, закохана в таємниці та горор, береться за перші проєкти. Так починається загадка.',
    },
  },
];
