const CACHE_NAME = 'botc-static-v1';

// 只缓存这些 URL 模式的资源（角色图标 + 背景图）
const CACHE_PATTERNS = [
  /^\/imgs\/icons\//,
  /^\/bg\.png$/,
];

function shouldCache(url) {
  const pathname = new URL(url).pathname;
  return CACHE_PATTERNS.some((re) => re.test(pathname));
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!shouldCache(event.request.url)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) return cached;

      try {
        const response = await fetch(event.request);
        if (response.ok) {
          cache.put(event.request, response.clone());
        }
        return response;
      } catch {
        return new Response('', { status: 504, statusText: 'Offline' });
      }
    }),
  );
});
