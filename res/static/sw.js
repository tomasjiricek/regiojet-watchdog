String.prototype.regexIndexOf = function(regex) {
    const match = this.match(regex);
    return match ? this.indexOf(match[0]) : -1;
}

const CACHE_NAME = 'RJCacheStore';
const CACHE_ASSETS = [
    'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css',
    'https://unpkg.com/react-bootstrap-typeahead/css/Typeahead.css',
    '/',
    '/index.html',
    '/static/images/security-images.jpg',
    '/static/images/icons/favicon-64.ico',
    '/static/images/icons/favicon-256.ico',
    '/static/images/icons/icon-32.png',
    '/static/images/icons/icon-64.png',
    '/static/images/icons/icon-128.png',
    '/static/images/icons/icon-192.png',
    '/static/images/icons/icon-256.png',
    '/static/images/icons/icon-512.png',
    '/static/offline-fallback.js',
    '/static/pwa-manifest.json',
];

self.addEventListener('fetch', event => {
    const url = event.request.url;
    const isMainJS = url.regexIndexOf(/\/main\.[^\.]+\.js/i) !== -1;

    if (isMainJS) {
        event.respondWith(
            fetch(event.request).catch(
                () => (
                    self.caches.open(CACHE_NAME).then(
                        (cache) => cache.match('/static/offline-fallback.js')
                    )
                )
            )
        );
    } else {
        event.respondWith(
            fetch(event.request).catch(
                () => caches.match(event.request).then(response => response)
            )
        );
    }
});

self.addEventListener('install', event => {
    event.waitUntil(
        self.caches
            .open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(CACHE_ASSETS);
            })
            .catch(err => console.error(err))
    );
});

self.addEventListener('push', (event) => {
    const options = {
        body: event.data.text(),
        icon: '/static/images/icons/icon-256.png',
    };

    event.waitUntil(
        self.registration.showNotification('RegioJet hlídač', options)
    );
});
