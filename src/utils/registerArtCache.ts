declare const __ART_CACHE_VERSION__: string;

/** Artwork caching is optional; failures leave ordinary image loading intact. */
export function registerArtCache() {
  if (!window.isSecureContext || !('serviceWorker' in navigator)) return;
  const url = new URL(`${import.meta.env.BASE_URL}art-cache-sw.js`, location.origin);
  url.searchParams.set('v', __ART_CACHE_VERSION__);
  void navigator.serviceWorker.register(url, { scope: import.meta.env.BASE_URL }).catch(() => {});
}
