const WASM_URL = 'https://objects.githubusercontent.com/github-production-release-asset-2e65be/648902575/5449b67a-f83f-40c6-b1bb-e5b6daa9c295?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=releaseassetproduction%2F20241024%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20241024T200635Z&X-Amz-Expires=300&X-Amz-Signature=42a5a0f2b2168f390320e582c24c242dc53b162dea2f96fa950fb1291578c322&X-Amz-SignedHeaders=host&response-content-disposition=attachment%3B%20filename%3Ddevenv.wasm&response-content-type=application%2Foctet-stream';

self.addEventListener('install', (event) => {
    console.log('Service Worker: Install event');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activate event');
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    console.log('Service Worker: Fetch event for', event.request.url);
    const url = new URL(event.request.url);

    // Check if the request URL matches the WASM URL
    if (event.request.url === WASM_URL) {
        console.log('Service Worker: Fetching WASM URL');
        event.respondWith(
            (async () => {
                try {
                    const response = await fetch(WASM_URL, {
                        mode: 'cors',
                        credentials: 'include' // Include credentials in the request
                    });

                    console.log('Service Worker: Response received', response);

                    if (response.status === 302) {
                        const redirectUrl = response.headers.get('location');
                        console.log(`Redirecting to: ${redirectUrl}`);
                        const redirectResponse = await fetch(redirectUrl, {
                            mode: 'cors',
                            credentials: 'include'
                        });
                        if (!redirectResponse.ok) {
                            throw new Error(`Failed to fetch redirected URL: ${redirectResponse.statusText}`);
                        }
                        return redirectResponse;
                    }

                    if (!response.ok) {
                        throw new Error(`Failed to fetch ${WASM_URL}: ${response.statusText}`);
                    }

                    return response;
                } catch (error) {
                    console.error('Error fetching WASM file:', error);
                    return new Response('Failed to fetch WASM file', { status: 500 });
                }
            })()
        );
        return;
    }

    // Only modify responses from the same origin
    if (url.origin === location.origin) {
        console.log('Service Worker: Modifying response headers for same origin');
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
        console.log('Service Worker: Fetching normally for other origin');
        event.respondWith(fetch(event.request));
    }
});
