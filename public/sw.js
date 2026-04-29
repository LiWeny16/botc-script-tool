const CACHE_NAME = 'botc-static-v2';

// 本地资源匹配（pathname）
const LOCAL_PATTERNS = [
  /^\/imgs\/icons\//,
  /^\/imgs\/images\/sources\//,
  /^\/bg\.png$/,
  /^\/assets\/.*-vendor-.*\.js$/,   // react/mui/state/dnd vendor chunks
];

// 外部 CDN 图标匹配
const EXTERNAL_HOSTS = {
  'oss.gstonegames.com': /^\/data_file\/clocktower\/web\/icons\//,
  'botcgrimoire.top': /^\/img\//,
};

function shouldCache(url) {
  const { host, pathname } = new URL(url);
  if (LOCAL_PATTERNS.some((re) => re.test(pathname))) return true;
  const pattern = EXTERNAL_HOSTS[host];
  return pattern ? pattern.test(pathname) : false;
}

// 新版本激活时清除旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!shouldCache(event.request.url)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) return cached;

      try {
        const response = await fetch(event.request);
        // ok = 本地资源；opaque = 外部 CDN 跨域资源（status 不可见但请求成功）
        if (response.ok || response.type === 'opaque') {
          try {
            cache.put(event.request, response.clone());
          } catch {
            // CDN Content-Length 不匹配等情况下缓存失败，忽略
          }
        }
        return response;
      } catch {
        return new Response('', { status: 504, statusText: 'Offline' });
      }
    }),
  );
});
