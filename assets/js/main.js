// main.js - Point d'entrée de l'application avec routage par ?game=

import { GAME_CONFIG as CREPERIE_CONFIG } from "./games/creperie/creperie-constants.js";
import CreperieGame from "./games/creperie/creperie-game.js";
import { GAME_CONFIG as GRELE_CONFIG } from "./games/grele/grele-constants.js";
import GreleGame from "./games/grele/grele-game.js";
import UI from "./ui.js";

let currentUI;

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(location.search);
  const gameId = params.get("game");

  const selector = document.getElementById("game-selector");
  const welcomeScreen = document.getElementById("welcome-screen");

  if (gameId) {
    // Si jeu dans l'URL, masquer le sélecteur et afficher l'écran d'accueil configuré
    selector.style.display = "none";
    welcomeScreen.style.display = "block";
    configureWelcomeScreen(gameId);
  } else {
    // Sinon, afficher le sélecteur et masquer l'écran d'accueil
    selector.style.display = "block";
    welcomeScreen.style.display = "none";
  }

  // Clics sur les cartes de jeu
  selector.querySelectorAll(".game-card").forEach((card) => {
    card.addEventListener("click", () => {
      const g = card.dataset.game;
      // Mettre à jour l'URL sans rechargement
      history.pushState({}, "", `?game=${g}`);
      // Masquer le sélecteur, afficher l'écran d'accueil configuré
      selector.style.display = "none";
      welcomeScreen.style.display = "block";
      configureWelcomeScreen(g);
    });
  });
});

function configureWelcomeScreen(gameId) {
  const tagline = document.getElementById("welcome-tagline");
  const description = document.getElementById("welcome-description");
  const prize = document.getElementById("welcome-prize");
  const testBtn = document.getElementById("test-mode-btn");
  const testRecapBtn = document.getElementById("test-recap-btn");

  if (gameId === "creperie") {
    if (tagline) tagline.textContent = CREPERIE_CONFIG.title;
    if (description)
      description.innerHTML = `<p>${CREPERIE_CONFIG.subtitle}</p>`;
    if (prize && CREPERIE_CONFIG.hidePrize) prize.style.display = "none";
    if (testBtn) testBtn.style.display = "none";
    if (testRecapBtn) testRecapBtn.style.display = "none";
  } else {
    // Configuration depuis grele-constants.js
    if (tagline) tagline.textContent = GRELE_CONFIG.tagline;
    if (description)
      description.innerHTML = `<p>${GRELE_CONFIG.description}</p>`;
    if (prize) prize.style.display = "block";
    if (testBtn) testBtn.style.display = "block";
    if (testRecapBtn) testRecapBtn.style.display = "block";
  }

  // Initialiser l'UI pour ce jeu
  initUIForGame(gameId);
}

function initUIForGame(gameId) {
  const gameManager = {
    startGame: (playerInfo) => _launchGame(gameId, playerInfo),
    endGame: () => {}, // Sera remplacé par le vrai game
    triggerStormCloud: () => {},
    resizeGame: () => {},
  };

  currentUI = new UI(gameManager, gameId);
}

function _launchGame(gameId, playerInfo) {
  if (gameId === "grele") {
    initGreleGame(playerInfo);
  } else if (gameId === "creperie") {
    initCreperieGame(playerInfo);
  }
}

function initGreleGame(playerInfo = null) {
  document.title = "Grêle Fighter — G2S";

  let game;
  const realGameManager = {
    startGame: (playerInfo) => game.startGame(playerInfo),
    endGame: () => game.endGame(),
    triggerStormCloud: () => game.triggerStormCloud(),
    resizeGame: () => game.resizeGame(),
  };

  currentUI.setGameManager(realGameManager);

  game = new GreleGame(currentUI);

  // Utiliser le leaderboard de l'UI
  game.leaderboard = currentUI.leaderboard;
  game.leaderboard.updateDisplay();

  game.startGame(playerInfo);
}

function initCreperieGame(playerInfo = null) {
  document.title = "La Crêperie — G2S";

  const creperieGame = new CreperieGame();

  const realGameManager = {
    startGame: (playerInfo) => creperieGame.startGame(playerInfo),
    endGame: () => creperieGame.endGame(),
    triggerStormCloud: () => {},
    resizeGame: () => creperieGame.resizeGame(),
  };

  currentUI.setGameManager(realGameManager);

  creperieGame.setUI(currentUI);

  // Utiliser le leaderboard de l'UI
  creperieGame.leaderboard = currentUI.leaderboard;
  creperieGame.leaderboard.updateDisplay();

  creperieGame.startGame(playerInfo || {});
}
