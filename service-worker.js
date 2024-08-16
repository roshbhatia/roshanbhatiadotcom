const CACHE_NAME = 'wasm-cache';
const WASM_URL = 'https://github.com/roshbhatia/roshanbhatiadotcom/releases/download/2.0.0/devenv.wasm';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.add(WASM_URL);
        }).then(() => {
            self.skipWaiting();
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Serve the cached WASM file
    if (url.href === WASM_URL) {
        event.respondWith(
            caches.match(WASM_URL).then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
        );
        return;
    }

    // Only modify responses from the same origin
    if (url.origin === location.origin) {
        event.respondWith(
            (async function () {
                const response = await fetch(event.request);
                const newHeaders = new Headers(response.headers);
                newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');
                newHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');

                const moddedResponse = new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: newHeaders
                });

                return moddedResponse;
            })()
        );
    } else {
        // For other origins, just fetch the request normally
        event.respondWith(fetch(event.request));
    }
});