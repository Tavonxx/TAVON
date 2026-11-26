// TAVON service worker: lets the app open without internet.
// It only keeps copies of the app's own FILES. It never reads or writes your data (that stays in the browser's storage).
// Strategy: network first (online = you always get the newest version and the copy is refreshed), copy when offline or slow.
// When you change a file listed below, bump nothing: the copy refreshes itself. When you ADD a file, add it to FILES
// (a test fails if you forget).
const CACHE = 'tavon-v1';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "src/styles/base.css",
  "src/styles/components.css",
  "src/styles/tokens.css",
  "src/app/backup-ui.js",
  "src/app/cache-ui.js",
  "src/app/dashboard.js",
  "src/app/datapages.js",
  "src/app/demo.js",
  "src/app/editors.js",
  "src/app/format.js",
  "src/app/home-ui.js",
  "src/app/i18n.js",
  "src/app/install.js",
  "src/app/main.js",
  "src/app/pay-ui.js",
  "src/app/plans.js",
  "src/app/router.js",
  "src/app/shortcuts.js",
  "src/data/backup.js",
  "src/data/categories.js",
  "src/data/subcategories.js",
  "src/data/homelayout.js",
  "src/data/pay.js",
  "src/data/plans.js",
  "src/data/schedule.js",
  "src/data/schema.js",
  "src/data/shortcuts.js",
  "src/data/stats.js",
  "src/data/store.js",
  "src/ui/appearance.js",
  "src/ui/dial.js",
  "src/ui/icons.js",
  "src/ui/restart.js",
  "src/ui/ui.js",
  "assets/fonts/Inter-Medium.woff",
  "assets/fonts/Inter-Regular.woff",
  "assets/fonts/Inter-SemiBold.woff",
  "assets/fonts/InterDisplay-Medium.woff",
  "assets/brand/tavon-logo-ink.svg",
  "assets/brand/tavon-logo-paper.svg",
  "assets/brand/tavon-logo.svg",
  "assets/brand/tavon-symbol-ink.svg",
  "assets/brand/tavon-symbol-paper.svg",
  "assets/brand/tavon-symbol.svg",
  "assets/brand/tavon-wordmark-ink.svg",
  "assets/brand/tavon-wordmark-paper.svg",
  "assets/brand/tavon-wordmark.svg",
  "assets/brand/icons/apple-touch-icon.png",
  "assets/brand/icons/favicon-16.png",
  "assets/brand/icons/favicon-32.png",
  "assets/brand/icons/favicon.ico",
  "assets/brand/icons/favicon.svg",
  "assets/brand/icons/icon-192.png",
  "assets/brand/icons/icon-512.png",
  "assets/brand/icons/icon-maskable-512.png"
];
const SLOW_MS = 3500;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('tavon-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return; // never touch anything else
  e.respondWith(answer(req));
});

async function fromCache(req) {
  return (await caches.match(req, { ignoreSearch: true })) || (req.mode === 'navigate' ? await caches.match('index.html') : undefined);
}

async function answer(req) {
  const network = fetch(req, { cache: 'no-cache' }).then(async (res) => {
    if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {}); }
    return res;
  });
  network.catch(() => {}); // a late failure after the slow timer won is not an error
  const cached = await fromCache(req);
  if (!cached) return network; // nothing saved yet: just go online
  const slow = new Promise((resolve) => setTimeout(() => resolve(cached), SLOW_MS));
  return Promise.race([network.catch(() => cached), slow]);
}
