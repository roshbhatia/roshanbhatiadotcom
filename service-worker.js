const WASM_URL = 'https://github.com/roshbhatia/roshanbhatiadotcom/releases/download/2.0.0/devenv.wasm';

self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Serve the WASM file directly
    if (url.href === WASM_URL) {
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

    // For other requests, just fetch the request normally
    event.respondWith(fetch(event.request));
});