const WASM_URL = 'https://github.com/roshbhatia/roshanbhatiadotcom/releases/download/2.0.0/devenv.wasm';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Rewrite the URL for the WASM file
    if (url.pathname.endsWith('devenv.wasm')) {
        event.respondWith(
            fetch(WASM_URL, {
                mode: 'cors'
            }).then((response) => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch ${WASM_URL}: ${response.statusText}`);
                }
                return response;
            }).catch((error) => {
                console.error('Error fetching WASM file:', error);
                return new Response('Failed to fetch WASM file', { status: 500 });
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