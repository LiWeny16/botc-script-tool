/* Private, bounded IndexedDB cache for bundled artwork and public proxy images. */
const DB_NAME = 'botc-art-assets-v1';
const STORE = 'images';
const MAX_BYTES = 128 * 1024 * 1024;
const MAX_ITEMS = 600;
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const REMOTE_TTL = 60 * 60 * 1000;
const ART_PROXY = 'https://ecs.zingspark.tech/botc-image-proxy';
const CANONICAL_ICON_HOST = 'oss.gstonegames.com';
const expectedVersion = new URL(self.location.href).searchParams.get('v');
let writes = 0;
let warming = 0;
const warmQueue = [];
const warmingIcons = new Map();

const manifest = fetch(new URL('art-cache-manifest.json', self.registration.scope), { cache: 'no-store' })
  .then(response => response.ok ? response.json() : null)
  .then(value => value?.version === expectedVersion && value.assets ? value.assets : null)
  .catch(() => null);

const db = new Promise(resolve => {
  try {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'key' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = request.onblocked = () => resolve(null);
  } catch { resolve(null); }
});

async function read(key) {
  const connection = await db;
  if (!connection) return null;
  return new Promise(resolve => {
    try {
      const request = connection.transaction(STORE, 'readonly').objectStore(STORE).get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    } catch { resolve(null); }
  });
}

async function put(entry) {
  const connection = await db;
  if (!connection) return;
  await new Promise(resolve => {
    try {
      const transaction = connection.transaction(STORE, 'readwrite');
      transaction.objectStore(STORE).put(entry);
      transaction.oncomplete = transaction.onerror = transaction.onabort = () => resolve();
    } catch { resolve(); }
  });
  if (++writes % 16 === 0) await prune();
}

async function prune(assets) {
  const connection = await db;
  if (!connection) return;
  await new Promise(resolve => {
    try {
      const transaction = connection.transaction(STORE, 'readwrite');
      const store = transaction.objectStore(STORE);
      const records = [];
      const cursor = store.openCursor();
      cursor.onsuccess = () => {
        const item = cursor.result;
        if (item) {
          const value = item.value;
          if ((assets && value.kind === 'bundled' && assets[value.key] !== value.revision) ||
              (value.kind === 'remote' && Date.now() - value.savedAt > REMOTE_TTL * 24)) item.delete();
          else records.push({ key: value.key, size: value.size || 0, savedAt: value.savedAt || 0 });
          item.continue();
        } else {
          records.sort((a, b) => a.savedAt - b.savedAt);
          let bytes = records.reduce((total, value) => total + value.size, 0);
          let count = records.length;
          for (const value of records) {
            if (bytes <= MAX_BYTES && count <= MAX_ITEMS) break;
            store.delete(value.key); bytes -= value.size; count--;
          }
        }
      };
      transaction.oncomplete = transaction.onerror = transaction.onabort = () => resolve();
    } catch { resolve(); }
  });
}

function publicProxyTarget(request, url) {
  if (request.mode !== 'cors' || request.credentials !== 'omit' ||
      url.origin + url.pathname !== ART_PROXY) return null;
  try {
    const target = new URL(url.searchParams.get('url'));
    return (target.protocol === 'https:' || target.protocol === 'http:') &&
      !target.username && !target.password && !target.search ? target.href : null;
  } catch { return null; }
}

function isCanonicalIcon(url) {
  return url.protocol === 'https:' && url.hostname === CANONICAL_ICON_HOST && !url.search &&
    (url.pathname.startsWith('/data_file/clocktower/web/icons/') || url.pathname.startsWith('/data_file/clocktower/role_icon/'));
}

// Display the original immediately, then warm a readable copy via the already
// configured public-image proxy. Signed or arbitrary user URLs never use this path.
function warmIcon(url) {
  if (warmingIcons.has(url)) return warmingIcons.get(url);
  const work = (async () => {
    if (warming >= 4) await new Promise(resolve => warmQueue.push(resolve));
    warming++;
    try {
      const response = await fetch(`${ART_PROXY}?url=${encodeURIComponent(url)}`, { mode: 'cors', credentials: 'omit', signal: AbortSignal.timeout(25000) });
      const type = response.headers.get('content-type') || '';
      const length = Number(response.headers.get('content-length'));
      if (!response.ok || !type.startsWith('image/') || length > MAX_IMAGE_BYTES || /no-store/i.test(response.headers.get('cache-control') || '')) return;
      const blob = await response.blob();
      if (blob.size && blob.size <= MAX_IMAGE_BYTES) await put({ key: `remote:${url}`, kind: 'remote', type, blob, size: blob.size, savedAt: Date.now() });
    } catch { /* The original image still loads normally. */ }
    finally { warming--; warmQueue.shift()?.(); }
  })().finally(() => warmingIcons.delete(url));
  warmingIcons.set(url, work);
  return work;
}

async function handle(request) {
  const url = new URL(request.url);
  const bundled = url.origin === self.location.origin && url.pathname.startsWith('/imgs/') && !url.search;
  const target = publicProxyTarget(request, url);
  const icon = isCanonicalIcon(url) && (request.destination === 'image' || (request.mode === 'cors' && request.credentials === 'omit'));
  const remote = Boolean(target || icon);
  if (!bundled && !remote) return { response: await fetch(request) };
  const assets = bundled ? await manifest : null;
  const revision = bundled ? assets?.[url.pathname] : undefined;
  // A missing or mismatched manifest must never make an old image look current.
  if (bundled && !revision) return { response: await fetch(request) };
  const key = bundled ? url.pathname : `remote:${target || url.href}`;
  const cached = await read(key);
  if (cached && (bundled ? cached.revision === revision : Date.now() - cached.savedAt < REMOTE_TTL)) {
    return { response: new Response(cached.blob, { headers: { 'Content-Type': cached.type, 'Content-Length': String(cached.size) } }) };
  }
  if (icon) {
    const save = request.destination === 'image' && request.mode === 'no-cors' ? warmIcon(url.href) : undefined;
    return { response: await fetch(request), save };
  }
  // The URL is stable between releases. Do not repopulate a new revision from
  // the browser's older HTTP cache before the CDN has revalidated the file.
  const response = bundled ? await fetch(request, { cache: 'reload' }) : await fetch(request);
  const type = response.headers.get('content-type') || '';
  const length = Number(response.headers.get('content-length'));
  if (!response.ok || !type.startsWith('image/') || length > MAX_IMAGE_BYTES || /no-store/i.test(response.headers.get('cache-control') || '')) {
    return { response };
  }
  const save = response.clone().blob().then(blob => {
    if (!blob.size || blob.size > MAX_IMAGE_BYTES) return;
    return put({ key, kind: bundled ? 'bundled' : 'remote', revision, type, blob, size: blob.size, savedAt: Date.now() });
  }).catch(() => {});
  return { response, save };
}

self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  await self.clients.claim();
  // Remove only this application's obsolete Cache Storage versions; other
  // applications' caches and user-uploaded IndexedDB data are left alone.
  try { await Promise.all((await caches.keys()).filter(key => /^botc-static-v\d+$/.test(key)).map(key => caches.delete(key))); } catch { /* Storage may be disabled. */ }
  const assets = await manifest;
  if (assets) await prune(assets);
})()));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (!(url.origin === self.location.origin && url.pathname.startsWith('/imgs/')) &&
      !publicProxyTarget(event.request, url) && !isCanonicalIcon(url)) return;
  const result = handle(event.request);
  event.respondWith(result.then(value => value.response));
  event.waitUntil(result.then(value => value.save).catch(() => {}));
});
