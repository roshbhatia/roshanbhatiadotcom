const WASM_URL = 'https://github.com/roshbhatia/roshanbhatiadotcom/releases/download/2.0.0/devenv.wasm';

self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
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

    // For other requests, set CORS and COOP/COEP headers
    event.respondWith(
        fetch(event.request).then((response) => {
            if (!response.ok) {
                throw new Error(`Failed to fetch ${event.request.url}: ${response.statusText}`);
            }
            const newHeaders = new Headers(response.headers);
            newHeaders.set('Access-Control-Allow-Origin', '*');
            newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');
            newHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');

            // Handle CORP headers
            if (!newHeaders.has('Cross-Origin-Resource-Policy')) {
                newHeaders.set('Cross-Origin-Resource-Policy', 'cross-origin');
            }

            const modifiedResponse = new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: newHeaders
            });

            return modifiedResponse;
        }).catch((error) => {
            console.error('Error fetching resource:', error);
            return new Response('Failed to fetch resource', { status: 500 });
        })
    );
});