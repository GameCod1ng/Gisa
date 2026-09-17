/* 정보처리기사 실기 문제은행 — 서비스워커
   앱 파일을 캐시에 저장해 두고, 오프라인에서는 캐시로 응답한다.
   앱을 수정하면 아래 VERSION 숫자를 올려야 갱신된다. */
const VERSION = 'gisa-v2';
const SHELL = [
  './', './index.html', './manifest.json',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'
];

/* 1) 설치 — 앱 파일을 미리 캐시에 담는다 */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

/* 2) 활성화 — 예전 버전 캐시를 지운다 */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* 3) 요청 가로채기 — 캐시 우선, 없으면 네트워크(받아서 캐시에 보관) */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit => {
      if (hit) return hit;
      return fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match('./index.html'));   // 오프라인 폴백
    })
  );
});
