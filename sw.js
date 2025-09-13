const CACHE_NAME = "grele-fighter-v1";
const urlsToCache = [
  // Pages principales
  "./",
  "./index.html",
  "./manifest.json",
  "./offline.html",

  // CSS
  "./assets/css/style.css",
  "./assets/css/base.css",
  "./assets/css/game.css",
  "./assets/css/game-over.css",
  "./assets/css/layout.css",
  "./assets/css/leaderboard.css",
  "./assets/css/responsive.css",
  "./assets/css/welcome.css",

  // JavaScript
  "./assets/js/main.js",
  "./assets/js/game.js",
  "./assets/js/player.js",
  "./assets/js/hail.js",
  "./assets/js/corn.js",
  "./assets/js/collision.js",
  "./assets/js/constants.js",
  "./assets/js/leaderboard.js",
  "./assets/js/powerups.js",
  "./assets/js/ui.js",

  // Images
  "./assets/img/logo-one.png",
  "./assets/img/logo-two.png",
  "./assets/img/gift.png",
  "./assets/img/sketchnote.png",
  "./assets/img/background-tile.png",
];

// Installation du Service Worker
self.addEventListener("install", (event) => {
  console.log("[SW] Installation du Service Worker");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Mise en cache des fichiers");
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log("[SW] Tous les fichiers ont été mis en cache");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("[SW] Erreur lors de la mise en cache:", error);
      })
  );
});

// Activation du Service Worker
self.addEventListener("activate", (event) => {
  console.log("[SW] Activation du Service Worker");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("[SW] Suppression de l'ancien cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("[SW] Service Worker activé");
        return self.clients.claim();
      })
  );
});

// Interception des requêtes
self.addEventListener("fetch", (event) => {
  // Ignorer les requêtes non-GET
  if (event.request.method !== "GET") {
    return;
  }

  // Ignorer les requêtes vers des API externes ou des domaines différents
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        // Retourner la réponse du cache si elle existe
        if (response) {
          console.log("[SW] Fichier servi depuis le cache:", event.request.url);
          return response;
        }

        // Sinon, faire la requête réseau
        console.log(
          "[SW] Fichier récupéré depuis le réseau:",
          event.request.url
        );
        return fetch(event.request).then((response) => {
          // Vérifier si la réponse est valide
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          // Cloner la réponse car elle ne peut être utilisée qu'une fois
          const responseToCache = response.clone();

          // Ajouter la réponse au cache
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        });
      })
      .catch((error) => {
        console.error("[SW] Erreur lors de la récupération:", error);

        // En cas d'erreur réseau, essayer de servir index.html pour les navigations
        if (event.request.mode === "navigate") {
          return caches.match("./index.html");
        }

        // Pour les autres ressources, servir la page offline si disponible
        return caches.match("./offline.html");
      })
  );
});

// Gestion des messages du client
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Notification de mise à jour disponible
self.addEventListener("updatefound", () => {
  console.log("[SW] Mise à jour disponible");
});
