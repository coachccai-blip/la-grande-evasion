/* La Grande Évasion — service worker (offline, standalone PWA) */
const CACHE = 'evasion-v64';

/* Tout ce qu'il faut pour jouer 100 % hors-ligne. */
const ASSETS = [
  './',
  './index.html',
  './theme-glass.css',
  './questions.js',
  './animaux.js',
  './sprites.js',
  './app_l10n.js',
  './hint_i18n.js',
  './phrase_i18n.js',
  './phrase_parts_i18n.js',
  './emp_i18n.js',
  './emp_i18n_log.js',
  './empire.js',
  './vocabdata.js',
  './vocab_i18n.js',
  './vocab.js',
  './manifest.webmanifest',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-180.png',
  './assets/apple-touch-icon.png'
];

/* Installation : on met tout en cache d'un coup. */
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* Activation : on nettoie les anciens caches. */
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* Requêtes : cache d'abord, réseau en secours (+ mise en cache au passage). */
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req)
        .then((res) => {
          /* On ne met en cache que les réponses valides de même origine. */
          if (res && res.ok && new URL(req.url).origin === self.location.origin) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => {
          /* Hors-ligne et non trouvé : on retombe sur la page d'accueil. */
          if (req.mode === 'navigate') return caches.match('./index.html');
        });
    })
  );
});
