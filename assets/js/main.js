// main.js - Point d'entrée de l'application avec routage par ?game=

import Game from "./game.js";
import CreperieGame from "./games/creperie/creperie-game.js";
import Leaderboard from "./leaderboard.js";
import UI from "./ui.js";

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(location.search);
  const gameId = params.get("game");

  if (!gameId) {
    // Aucun jeu sélectionné : afficher le sélecteur de jeu
    document.getElementById("game-selector").style.display = "block";
    return;
  }

  if (gameId === "grele") {
    initGreleGame();
  } else if (gameId === "creperie") {
    initCreperieGame();
  } else {
    // Identifiant de jeu inconnu, rediriger vers le sélecteur
    window.location.href = "./index.html";
  }
});

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

  // Personnaliser l'écran d'accueil pour la crêperie
  const tagline = document.getElementById("welcome-tagline");
  const description = document.getElementById("welcome-description");
  const prize = document.getElementById("welcome-prize");
  if (tagline) tagline.textContent = "Bienvenue dans votre crêperie !";
  if (description)
    description.innerHTML =
      "<p>Préparez et servez un maximum de crêpes délicieuses à vos clients en 1 minute 30 !</p>";
  if (prize) prize.style.display = "none";

  const creperieGame = new CreperieGame();

  const ui = new UI(
    {
      startGame: () => creperieGame.startGame(),
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
