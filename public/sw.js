const CACHE_NAME = 'botc-static-v1';

// 本地资源匹配（pathname）
const LOCAL_PATTERNS = [
  /^\/imgs\/icons\//,
  /^\/bg\.png$/,
];

// 外部 CDN 图标匹配（pathname）
const EXTERNAL_ICON_HOST = 'oss.gstonegames.com';
const EXTERNAL_ICON_PATH = /^\/data_file\/clocktower\/web\/icons\//;

function shouldCache(url) {
  const { host, pathname } = new URL(url);
  if (LOCAL_PATTERNS.some((re) => re.test(pathname))) return true;
  if (host === EXTERNAL_ICON_HOST && EXTERNAL_ICON_PATH.test(pathname)) return true;
  return false;
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
