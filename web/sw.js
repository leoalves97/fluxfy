const CACHE_NAME = 'fluxfy-pwa-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/abertura-caixa.html',
  '/admin.html',
  '/estoque.html',
  '/financeiro.html',
  '/aprovacoes.html',
  '/cadastro.html',
  '/perfil.html',
  '/configuracoes.html',
  '/style.css',
  '/script.js',
  '/theme.js',
  '/sidebar-loader.js',
  '/header-loader.js',
  '/assets/logo.png',
  '/assets/icon/icon-192.png',
  '/assets/icon/icon-512.png'
];

// Instalação e cache dos arquivos estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// Limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Estratégia Network-First (prioriza internet para dados atualizados, cai no cache se offline)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});