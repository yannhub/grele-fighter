// main.js - Point d'entrée de l'application avec routage par ?game=

import Game from "./game.js";
import { GAME_CONFIG as CREPERIE_CONFIG } from "./games/creperie/creperie-constants.js";
import CreperieGame from "./games/creperie/creperie-game.js";
import Leaderboard from "./leaderboard.js";
import UI from "./ui.js";

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(location.search);
  const gameId = params.get("game");

  // Toujours afficher le sélecteur en premier
  const selector = document.getElementById("game-selector");
  selector.style.display = "block";

  let selectedGame = gameId || null;

  // Pré-sélectionner la carte si ?game= dans l'URL
  if (selectedGame) {
    _highlightCard(selectedGame);
  }

  // Clics sur les cartes de jeu
  selector.querySelectorAll(".game-card").forEach((card) => {
    card.addEventListener("click", () => {
      const g = card.dataset.game;
      selectedGame = g;
      _highlightCard(g);
      // Mettre à jour l'URL sans rechargement
      history.pushState({}, "", `?game=${g}`);
    });
  });

  // Bouton "JOUER →"
  const launchBtn = document.getElementById("launch-game-btn");
  if (launchBtn) {
    launchBtn.addEventListener("click", () => {
      if (selectedGame) {
        selector.style.display = "none";
        _launchGame(selectedGame);
      }
    });
  }

  // Double-clic sur la carte = sélection + lancement direct
  selector.querySelectorAll(".game-card").forEach((card) => {
    card.addEventListener("dblclick", () => {
      const g = card.dataset.game;
      selectedGame = g;
      selector.style.display = "none";
      _launchGame(g);
    });
  });
});

function _highlightCard(gameId) {
  document.querySelectorAll(".game-card").forEach((c) => {
    c.classList.toggle("selected", c.dataset.game === gameId);
  });
  const launchBtn = document.getElementById("launch-game-btn");
  if (launchBtn) launchBtn.style.display = "block";
}

function _launchGame(gameId) {
  if (gameId === "grele") {
    initGreleGame();
  } else if (gameId === "creperie") {
    initCreperieGame();
  } else {
    document.getElementById("game-selector").style.display = "block";
  }
}

function initGreleGame() {
  document.title = "Grêle Fighter — G2S";

  let game;
  const ui = new UI(
    {
      startGame: () => game.startGame(),
      endGame: () => game.endGame(),
      triggerStormCloud: () => game.triggerStormCloud(),
      resizeGame: () => game.resizeGame(),
    },
    "grele",
  );

  game = new Game(ui);

  const leaderboard = new Leaderboard(ui, "grele");
  leaderboard.updateDisplay();

  game.leaderboard = leaderboard;
  game.resizeGame();
}

function initCreperieGame() {
  document.title = "La Crêperie — G2S";

  // Appliquer la config crêperie à l'écran d'accueil
  const tagline = document.getElementById("welcome-tagline");
  const description = document.getElementById("welcome-description");
  const prize = document.getElementById("welcome-prize");
  if (tagline) tagline.textContent = CREPERIE_CONFIG.title;
  if (description) description.innerHTML = `<p>${CREPERIE_CONFIG.subtitle}</p>`;
  if (prize && CREPERIE_CONFIG.hidePrize) prize.style.display = "none";

  // Masquer les boutons test
  const testBtn = document.getElementById("test-mode-btn");
  if (testBtn) testBtn.style.display = "none";
  const testRecapBtn = document.getElementById("test-recap-btn");
  if (testRecapBtn) testRecapBtn.style.display = "none";

  const creperieGame = new CreperieGame();

  const ui = new UI(
    {
      startGame: (playerInfo) => creperieGame.startGame(playerInfo),
      endGame: () => creperieGame.endGame(),
      triggerStormCloud: () => {},
      resizeGame: () => creperieGame.resizeGame(),
    },
    "creperie",
  );

  creperieGame.setUI(ui);

  const leaderboard = new Leaderboard(ui, "creperie");
  leaderboard.updateDisplay();

  creperieGame.leaderboard = leaderboard;
  creperieGame.resizeGame();
}
