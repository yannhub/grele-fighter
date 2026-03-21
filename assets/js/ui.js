// ui.js - Gestion de l'interface utilisateur et la navigation entre Ã©crans

import {
  CLOUD_DROPS_DEFAULT,
  CORN_DEFAULT,
  GAME_TIME_IN_SECS,
  HAIL_DEFAULT,
  POWERUP_TYPES,
} from "./constants.js";
import Leaderboard from "./leaderboard.js";

export default class UI {
  constructor(gameManager, gameId = "grele") {
    this.gameManager = gameManager;
    this.gameId = gameId;
    this.leaderboard = new Leaderboard(this, gameId);

    // Ã‰lÃ©ments DOM partagÃ©s
    this.welcomeScreen = document.getElementById("welcome-screen");
    this.registerForm = document.getElementById("register-form");
    this.gameCanvas = document.getElementById("game-canvas");
    this.scoreDisplay = document.getElementById("score-display");
    this.currentScoreEl = document.getElementById("current-score");
    this.timerDisplay = document.getElementById("timer");

    // Ã‰lÃ©ments spÃ©cifiques au jeu actif
    if (gameId === "grele") {
      this.gameInstructions = document.getElementById("game-instructions");
      this.gameOverScreen = document.getElementById("game-over");
      this.finalScoreEl = document.getElementById("final-score");
      this.playBtn = document.getElementById("play-btn");
      this.homeBtn = document.getElementById("home-btn");
      this.playAgainBtn = document.getElementById("play-again-btn");
      this.testModeBtn = document.getElementById("test-mode-btn");
      this.testRecapBtn = document.getElementById("test-recap-btn");
    } else {
      // CrÃªperie ou autre jeu
      this.gameInstructions = document.getElementById(
        "game-instructions-creperie",
      );
      this.gameOverScreen = document.getElementById("game-over-creperie");
      this.finalScoreEl = document.getElementById("creperie-final-score");
      this.playBtn = document.getElementById("play-btn-creperie");
      this.homeBtn = document.getElementById("creperie-home-btn");
      this.playAgainBtn = document.getElementById("creperie-play-again-btn");
      this.testModeBtn = null;
      this.testRecapBtn = null;
      // Masquer les boutons de test spÃ©cifiques Ã  grÃªle
      const testBtn = document.getElementById("test-mode-btn");
      if (testBtn) testBtn.style.display = "none";
      const testRecapBtn = document.getElementById("test-recap-btn");
      if (testRecapBtn) testRecapBtn.style.display = "none";
    }

    // Timer
    this.timeRemaining = GAME_TIME_IN_SECS;
    this.timerInterval = null;

    // Ã‰tat du jeu
    this.playerInfo = {};
    this.gameEndReason = "";

    // Initialiser les valeurs d'interface depuis les constantes (grÃªle uniquement)
    if (gameId === "grele") {
      this.initializeUIValues();
    }

    // Initialiser les Ã©vÃ©nements
    this.setupEventListeners();
  }

  // Initialise les valeurs de l'interface Ã  partir des constantes (grÃªle)
  initializeUIValues() {
    const hailPointsEl = document.getElementById("hail-points");
    const cloudPointsEl = document.getElementById("cloud-points");
    const cornPointsEl = document.getElementById("corn-points-value");
    const hailPointsRecapEl = document.getElementById("hail-points-recap");
    const cloudPointsRecapEl = document.getElementById("cloud-points-recap");
    const cornPointsRecapEl = document.getElementById("corn-points-recap");

    if (hailPointsEl) hailPointsEl.textContent = HAIL_DEFAULT.points;
    if (cloudPointsEl) cloudPointsEl.textContent = CLOUD_DROPS_DEFAULT.points;
    if (cornPointsEl) cornPointsEl.textContent = CORN_DEFAULT.points;
    if (hailPointsRecapEl) hailPointsRecapEl.textContent = HAIL_DEFAULT.points;
    if (cloudPointsRecapEl)
      cloudPointsRecapEl.textContent = CLOUD_DROPS_DEFAULT.points;
    if (cornPointsRecapEl) cornPointsRecapEl.textContent = CORN_DEFAULT.points;

    const gameTimeInMinutes = Math.floor(GAME_TIME_IN_SECS / 60);
    const gameTimeInSeconds = GAME_TIME_IN_SECS % 60;
    const formattedTime = `${gameTimeInMinutes}:${
      gameTimeInSeconds < 10 ? "0" : ""
    }${gameTimeInSeconds}`;
    const gameTimeEl = document.getElementById("game-time");
    if (gameTimeEl) gameTimeEl.textContent = formattedTime;
    if (this.timerDisplay)
      this.timerDisplay.textContent = `${gameTimeInMinutes}:00`;
  }

  // Configuration des Ã©couteurs d'Ã©vÃ©nements
  setupEventListeners() {
    const startBtn = document.getElementById("start-btn");
    if (startBtn) {
      startBtn.addEventListener("click", () => {
        this.welcomeScreen.style.display = "none";
        this.registerForm.style.display = "block";
      });
    }

    const nicknameInput = document.getElementById("nickname");
    const nicknameError = document.getElementById("nickname-error");
    if (nicknameInput) {
      nicknameInput.addEventListener("input", () => {
        nicknameError.style.display = "none";
      });
    }

    this.registerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const nickname = document.getElementById("nickname").value;
      const organization = document.getElementById("organization").value;

      const nicknameExists = this.leaderboard.checkNicknameExists(nickname);
      if (nicknameExists) {
        nicknameError.style.display = "block";
        return;
      }
      nicknameError.style.display = "none";
      this.playerInfo = { nickname, organization };
      this.registerForm.style.display = "none";
      this.gameInstructions.style.display = "block";
    });

    this.playBtn.addEventListener("click", () => {
      this.gameInstructions.style.display = "none";
      this.gameCanvas.style.display = "block";
      this.scoreDisplay.style.display = "block";
      this.gameManager.startGame();
    });

    this.playAgainBtn.addEventListener("click", () => {
      this.gameOverScreen.style.display = "none";
      this.gameCanvas.style.display = "block";
      this.scoreDisplay.style.display = "block";
      this.gameManager.startGame();
    });

    this.homeBtn.addEventListener("click", () => {
      this.gameCanvas.style.display = "none";
      this.scoreDisplay.style.display = "none";
      this.gameOverScreen.style.display = "none";
      this.welcomeScreen.style.display = "block";
      document.getElementById("register-form").reset();
      this.playerInfo = {};
    });

    if (this.testModeBtn) {
      this.testModeBtn.addEventListener("click", () => {
        this.startTestMode();
      });
    }

    if (this.testRecapBtn) {
      this.testRecapBtn.addEventListener("click", () => {
        this.showTestRecap();
      });
    }

    window.addEventListener("resize", () => {
      this.gameManager.resizeGame();
    });
  }

  // Mode test pour dÃ©marrer rapidement (grÃªle)
  startTestMode() {
    this.playerInfo = { nickname: "TesteurG2S", organization: "G2S" };
    this.welcomeScreen.style.display = "none";
    this.gameCanvas.style.display = "block";
    this.scoreDisplay.style.display = "block";
    this.gameManager.startGame();
  }

  // DÃ©marrer le timer (utilisÃ© par le jeu grÃªle uniquement)
  startTimer() {
    this.timeRemaining = GAME_TIME_IN_SECS;
    this.updateTimer();
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      this.updateTimer();
      const elapsedTime = GAME_TIME_IN_SECS - this.timeRemaining;
      if (elapsedTime === 60) {
        this.gameManager.triggerStormCloud();
      }
      if (this.timeRemaining <= 0) {
        this.gameEndReason = "time";
        this.gameManager.endGame();
      }
    }, 1000);
  }

  // Mettre Ã  jour l'affichage du timer (grÃªle â€” utilise this.timeRemaining)
  updateTimer() {
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    if (this.timerDisplay) {
      this.timerDisplay.textContent = `${minutes}:${
        seconds < 10 ? "0" : ""
      }${seconds}`;
    }
  }

  // Mettre Ã  jour le timer avec une valeur externe (crÃªperie)
  setTimerDisplay(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds) % 60;
    if (this.timerDisplay) {
      this.timerDisplay.textContent = `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    }
  }

  // Mettre Ã  jour le score affichÃ©
  updateScore(score) {
    if (this.currentScoreEl) this.currentScoreEl.textContent = score;
  }

  // Afficher l'Ã©cran de fin de jeu (grÃªle)
  showGameOver(
    score,
    hailsDestroyed,
    cloudDropsDestroyed,
    cornSaved,
    collectedPowerups,
  ) {
    clearInterval(this.timerInterval);

    const hailPoints = hailsDestroyed * HAIL_DEFAULT.points;
    const cloudDropPoints = cloudDropsDestroyed * CLOUD_DROPS_DEFAULT.points;
    const cornPoints = cornSaved * CORN_DEFAULT.points;
    const finalScore = hailPoints + cloudDropPoints + cornPoints;

    this.gameCanvas.style.display = "none";
    this.scoreDisplay.style.display = "none";
    this.gameOverScreen.style.display = "block";

    this.finalScoreEl.textContent = finalScore;
    document.getElementById("hails-destroyed").textContent = hailsDestroyed;
    document.getElementById("hails-points").textContent = hailPoints;
    document.getElementById("cloud-drops-destroyed").textContent =
      cloudDropsDestroyed;
    document.getElementById("cloud-drops-points").textContent = cloudDropPoints;
    document.getElementById("corn-saved").textContent = cornSaved;
    document.getElementById("corn-points").textContent = cornPoints;

    const gameOverTitle = document.querySelector("#game-over h2");
    if (this.gameEndReason === "time") {
      gameOverTitle.textContent = "Temps Ã©coulÃ©!";
    } else if (this.gameEndReason === "corn") {
      gameOverTitle.textContent = "Tous vos maÃ¯s sont dÃ©truits!";
    }

    this.addPowerupsRecap(collectedPowerups);

    // Note: le score est sauvegardÃ© par game.js (this.leaderboard.saveScore)

    return finalScore;
  }

  // Afficher l'Ã©cran de fin de jeu (crÃªperie)
  showCreperieGameOver(stats) {
    // stats = { score, crepesServed, heartsLost, reason }
    clearInterval(this.timerInterval);

    this.gameCanvas.style.display = "none";
    this.scoreDisplay.style.display = "none";
    this.gameOverScreen.style.display = "block";

    document.getElementById("creperie-final-score").textContent = stats.score;
    document.getElementById("creperie-crepes-served").textContent =
      stats.crepesServed;
    document.getElementById("creperie-hearts-lost").textContent =
      stats.heartsLost;

    const title = document.getElementById("creperie-game-over-title");
    if (title) {
      if (stats.reason === "time") {
        title.textContent = "â±ï¸ Temps Ã©coulÃ© !";
      } else {
        title.textContent = "ðŸ’” Trop de clients mÃ©contents !";
      }
    }

    // Breakdown recettes
    const breakdown = document.getElementById("creperie-recipe-breakdown");
    if (
      breakdown &&
      stats.recipeBreakdown &&
      stats.recipeBreakdown.length > 0
    ) {
      breakdown.innerHTML = stats.recipeBreakdown
        .map(
          (r) =>
            `<p>${r.label} Ã— ${r.count} = <strong>${r.points} pts</strong></p>`,
        )
        .join("");
    }

    // Sauvegarder le score
    this.leaderboard.saveScore(this.playerInfo, stats.score);
  }

  // Ajouter le rÃ©capitulatif des bonus/malus (grÃªle)
  addPowerupsRecap(collectedPowerups) {
    if (collectedPowerups.length === 0) return;

    const powerupCounts = {};
    collectedPowerups.forEach((powerup) => {
      if (!powerupCounts[powerup.type]) {
        powerupCounts[powerup.type] = {
          count: 0,
          name: powerup.name,
          good: POWERUP_TYPES[powerup.type].good,
          icon: POWERUP_TYPES[powerup.type].icon,
          color: POWERUP_TYPES[powerup.type].color,
        };
      }
      powerupCounts[powerup.type].count++;
    });

    const powerupsTitle = document.getElementById("powerups-title");
    powerupsTitle.style.display = "block";
    const powerupsList = document.getElementById("powerups-list");
    powerupsList.innerHTML = "";

    Object.keys(powerupCounts).forEach((type) => {
      const powerupInfo = powerupCounts[type];
      const powerupItem = document.createElement("div");
      powerupItem.className = "powerup-item";
      powerupItem.title = powerupInfo.name;

      const iconSpan = document.createElement("span");
      iconSpan.className = `powerup-icon ${
        powerupInfo.good ? "powerup-icon-good" : "powerup-icon-bad"
      }`;
      iconSpan.textContent = powerupInfo.icon;
      iconSpan.style.backgroundColor = powerupInfo.color;
      powerupItem.appendChild(iconSpan);

      if (powerupInfo.count > 1) {
        const countBadge = document.createElement("span");
        countBadge.className = `powerup-count ${
          powerupInfo.good ? "powerup-count-good" : "powerup-count-bad"
        }`;
        countBadge.textContent = powerupInfo.count;
        powerupItem.appendChild(countBadge);
      }
      powerupsList.appendChild(powerupItem);
    });
  }

  setGameEndReason(reason) {
    this.gameEndReason = reason;
  }

  setPlayerInfo(playerInfo) {
    this.playerInfo = playerInfo;
  }

  hideAllScreens() {
    this.welcomeScreen.style.display = "none";
    this.registerForm.style.display = "none";
    this.gameInstructions.style.display = "none";
    this.gameCanvas.style.display = "none";
    this.scoreDisplay.style.display = "none";
    this.gameOverScreen.style.display = "none";
  }

  showGameScreen() {
    this.gameCanvas.style.display = "block";
    this.scoreDisplay.style.display = "block";
  }

  getPlayerInfo() {
    return this.playerInfo;
  }

  stopTimer() {
    clearInterval(this.timerInterval);
  }

  // Test de l'Ã©cran de rÃ©capitulation (grÃªle)
  showTestRecap() {
    if (!this.playerInfo.nickname) {
      this.playerInfo = { nickname: "TesteurRecap", organization: "G2S" };
    }
    this.gameEndReason = "time";
    const testPowerups = [];
    for (let type in POWERUP_TYPES) {
      const count = Math.floor(Math.random() * 4);
      for (let i = 0; i < count; i++) {
        testPowerups.push({ type, name: POWERUP_TYPES[type].name });
      }
    }
    this.welcomeScreen.style.display = "none";
    this.registerForm.style.display = "none";
    this.gameInstructions.style.display = "none";
    this.gameCanvas.style.display = "none";
    this.scoreDisplay.style.display = "none";
    this.showGameOver(1500, 120, 50, 5, testPowerups);
  }
}
