// Service worker: lets Form Coach work offline after the first visit, and lets
// browsers like Chrome offer to "install" it as an app on laptops.
//
// It only ever stores this app's own files, in the browser on this device.
// Nothing is sent anywhere.
//
// If you replace a file that keeps the same name (the pose model or the
// mediapipe engine), change CACHE below (e.g. to v2) so devices fetch the new one.
const CACHE = 'form-coach-v1';

self.addEventListener('install', () => self.skipWaiting());

// Take over right away, and delete saved copies from older versions.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

function save(request, response) {
  if (response.ok) {
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(request, copy));
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    // The page itself: try the internet first so updates show up right away;
    // if that fails (offline), use the saved copy.
    event.respondWith(
      fetch(request)
        .then((response) => save(request, response))
        .catch(() => caches.match(request).then((hit) => hit ?? caches.match('./'))),
    );
    return;
  }

  // Code, fonts, icons and the pose model: use the saved copy if we have one
  // (fast, and works offline), otherwise download and save it.
  event.respondWith(
    caches.match(request).then((hit) => hit ?? fetch(request).then((response) => save(request, response))),
  );
});
