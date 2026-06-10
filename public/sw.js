/**
 * fastry.ru — Service Worker
 *
 * Стратегия:
 * - Статические ресурсы (_astro/*, fonts/*): Cache First (из кэша, потом сеть)
 * - Навигационные запросы (HTML): Network First (сеть, при ошибке — кэш)
 * - Шрифты, CSS, JS: Cache First с фоновым обновлением
 *
 * Кэширование CDN (Vercel/Netlify) уже настроено на 1 год с immutable.
 * Этот SW добавляет offline-поддержку и мгновенную загрузку при повторных
 * визитах, минуя сеть даже при медленном соединении.
 */

const CACHE_NAME = 'fastry-v1';

// Ресурсы для pre-cache при установке (критичные для offline-first)
const PRECACHE_URLS = [
  '/favicon.svg',
  '/favicon-32x32.png',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
];

// Типы ресурсов, которые кэшируем по схеме Cache First
const CACHE_FIRST_TYPES = [
  'font',
  'style',
  'script',
  'image',
];

/**
 * Проверяет, нужно ли кэшировать запрос по Cache First стратегии
 */
function isCacheFirst(url) {
  // Astro-ресурсы (_astro/*) — хэшированные имена, immutable
  if (url.pathname.includes('/_astro/')) return true;

  // Шрифты
  if (url.pathname.startsWith('/fonts/')) return true;

  // Статические ресурсы с хэшем в имени
  if (/\.(woff2?|css|js|svg|png|jpg|jpeg|webp|avif|ico)(\?|$)/.test(url.pathname)) {
    // Исключаем HTML-страницы
    if (url.pathname.endsWith('.html')) return false;
    return true;
  }

  return false;
}

/**
 * Устанавливаем Service Worker и кэшируем pre-cache ресурсы
 */
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(PRECACHE_URLS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

/**
 * Активируем SW и удаляем старые кэши
 */
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function (name) { return name !== CACHE_NAME; })
          .map(function (name) { return caches.delete(name); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

/**
 * Перехватываем запросы и применяем стратегии кэширования
 */
self.addEventListener('fetch', function (event) {
  var request = event.request;
  var url = new URL(request.url);

  // Только same-origin запросы
  if (url.origin !== location.origin) return;

  // Пропускаем запросы не-GET
  if (request.method !== 'GET') return;

  // Пропускаем запросы к API
  if (url.pathname.startsWith('/api/')) return;

  // Пропускаем запросы к Partytown (они уже в Web Worker)
  if (url.pathname.includes('/~partytown/')) return;

  // Навигационные запросы (HTML-страницы) — Network First
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(function (response) {
        // Кэшируем успешный ответ
        if (response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(request, clone);
          });
        }
        return response;
      }).catch(function () {
        // При ошибке сети — отдаём из кэша
        return caches.match(request).then(function (cached) {
          return cached || caches.match('/404');
        });
      })
    );
    return;
  }

  // Статические ресурсы — Cache First
  if (isCacheFirst(url)) {
    event.respondWith(
      caches.match(request).then(function (cached) {
        if (cached) {
          // Фоновое обновление кэша (stale-while-revalidate)
          fetch(request).then(function (response) {
            if (response.status === 200) {
              caches.open(CACHE_NAME).then(function (cache) {
                cache.put(request, response);
              });
            }
          }).catch(function () { /* offline — используем кэш */ });
          return cached;
        }

        // Нет в кэше — загружаем из сети
        return fetch(request).then(function (response) {
          if (response.status === 200) {
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(request, clone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Все остальные запросы — Network Only (не кэшируем)
  return;
});