// main.js - Point d'entrée de l'application

import Game from "./game.js";
import UI from "./ui.js";
import Leaderboard from "./leaderboard.js";

// Attendre que le DOM soit chargé
document.addEventListener("DOMContentLoaded", () => {
  // Créer une référence temporaire pour l'UI et le Game
  let game;

  // Créer l'interface utilisateur et lui passer une référence au gestionnaire de jeu
  const ui = new UI({
    startGame: () => game.startGame(),
    endGame: () => game.endGame(),
    triggerStormCloud: () => game.triggerStormCloud(),
    resizeGame: () => game.resizeGame(),
  });

  // Créer le gestionnaire de jeu
  game = new Game(ui);

  // Mettre à jour l'affichage du classement avec référence à l'UI
  const leaderboard = new Leaderboard(ui);
  leaderboard.updateDisplay();

  // Référencer le leaderboard dans le jeu
  game.leaderboard = leaderboard;

  // Au chargement initial de la page, s'assurer que le canvas est adapté à la taille de son conteneur
  game.resizeGame();
});
