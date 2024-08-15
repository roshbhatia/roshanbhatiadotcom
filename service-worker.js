self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
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
});