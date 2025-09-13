// Service Worker Registration
// Enregistrement du Service Worker pour le fonctionnement hors ligne
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((registration) => {
        console.log(
          "✅ Service Worker enregistré avec succès:",
          registration.scope
        );

        // Vérifier les mises à jour
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // Nouvelle version disponible
                console.log("🔄 Nouvelle version disponible");
                if (
                  confirm(
                    "Une nouvelle version est disponible. Voulez-vous recharger la page ?"
                  )
                ) {
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error("❌ Échec de l'enregistrement du Service Worker:", error);
      });
  });

  // Gérer les mises à jour du Service Worker
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    console.log("🔄 Service Worker mis à jour");
    window.location.reload();
  });
} else {
  console.warn("⚠️ Service Workers ne sont pas supportés par ce navigateur");
}

// Détecter si l'app est installée
let deferredPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
  console.log("💾 L'application peut être installée");
  e.preventDefault();
  deferredPrompt = e;

  // Vous pouvez ajouter un bouton d'installation ici si souhaité
  // showInstallButton();
});

// Gérer l'installation de l'app
window.addEventListener("appinstalled", (evt) => {
  console.log("✅ Application installée avec succès");
});
