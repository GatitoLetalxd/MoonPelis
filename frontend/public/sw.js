// Service Worker Interceptor (Opción 2)
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Interceptar únicamente peticiones dirigidas a nuestro proxy de embed
  if (url.includes('/api/v1/content/proxy/embed')) {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          // Si la respuesta es exitosa (HTML)
          if (response.ok) {
            let text = await response.text();

            // Parchear/modificar detecciones de iframe antes de entregar al browser
            text = text.replace(/window\.top\s*!==\s*window/g, 'false');
            text = text.replace(/window\.top\s*===\s*window\.self/g, 'true');
            text = text.replace(/top\.location/g, 'window.self.location');
            text = text.replace(/localStorage\.setItem/g, 'void');

            // Devolver la respuesta modificada manteniendo las cabeceras originales
            return new Response(text, {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers,
            });
          }
          return response;
        })
        .catch((err) => {
          console.error('[SW Proxy Interceptor Error]', err);
          return fetch(event.request);
        })
    );
  }
});
