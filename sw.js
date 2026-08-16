/* 오프라인에서도 열리도록 앱 파일을 캐시합니다.
   index.html 을 수정한 뒤에는 아래 CACHE 이름의 숫자를 올리세요 (v1 → v2). */
const CACHE = 'voca-v13';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* 네트워크 우선, 실패하면 캐시 (인터넷이 없어도 열림) */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // 앱 파일과 Firebase SDK만 캐시. 동기화 통신에는 절대 손대지 않는다.
  if (url.origin !== location.origin && url.hostname !== 'www.gstatic.com') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      // 오프라인: 캐시에서 응답. 페이지 이동일 때만 index.html 로 대체한다.
      .catch(() => caches.match(e.request).then(r =>
        r || (e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
  );
});
