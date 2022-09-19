const staticCacheName = 'site-static-v1';
const dynamicCacheName = 'site-dynamic-v1';

const staticAssets = [
    'index.html',
    './js/script.js',
    './css/style.css',
    './images/broken-clouds.png',
    './images/clear-sky.png',
    './images/few-clouds.png',
    './images/humidity.png',
    './images/mist.png',
    './images/pressure.png',
    './images/rain.png',
    './images/scattered-clouds.png',
    './images/shower-rain.png',
    './images/snow.png',
    './images/thunderstorm.png',
    './images/wind.png',
    './fallback.json',
    './fonts/OpenSans-Bold.woff2',
    './fonts/OpenSans-Bold.woff',
    './fonts/OpenSans-Light.woff2',
    './fonts/OpenSans-Light.woff',
    './fonts/OpenSans-Semibold.woff2',
    './fonts/OpenSans-Semibold.woff',
    './fonts/OpenSans.woff2',
    './fonts/OpenSans.woff'
];
    

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(staticCacheName).then(cache => {
            cache.addAll(staticAssets);
        })
    )
});

self.addEventListener('activate', async event => {
    const cacheList = await caches.keys();
    cacheList.forEach(cache => {
        if(cache !== staticCacheName && cache !== dynamicCacheName) {
            caches.delete(cache);
        }
    })
});

self.addEventListener('fetch', event => {
    const {request} = event;
    const url = new URL(request.url);
    if(url.origin === location.origin) {
        event.respondWith(cacheFirst(request));
    } else {
        event.respondWith(networkFirst(request));
    }
});

async function cacheFirst(req) {
    const cached = await caches.match(req);
    return cached ?? fetch(req);
}

async function networkFirst(req) {
    const cache = await caches.open(dynamicCacheName);
    try {
        const res = await fetch(req);
        await cache.put(req, res.clone());
        return res;
    } catch (error) {
        const cached = await cache.match(req);
        return cached ?? await caches.match('./fallback.json');
    }
}