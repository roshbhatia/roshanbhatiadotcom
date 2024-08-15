self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // List of URL patterns to bypass the service worker
    const bypassPatterns = [
        /^https:\/\/github\.com\/roshbhatia\/roshanbhatiadotcom\/releases\/download\/2\.0\.0\/devenv\.wasm$/
    ];

    // Check if the request URL matches any bypass pattern
    const shouldBypass = bypassPatterns.some(pattern => pattern.test(url.href));

    if (shouldBypass) {
        event.respondWith(fetch(event.request));
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