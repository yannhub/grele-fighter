// ui.js - Gestion de l'interface utilisateur et la navigation entre écrans

import {
  CLOUD_DROPS_DEFAULT,
  CORN_DEFAULT,
  GAME_TIME_IN_SECS,
  HAIL_DEFAULT,
  POWERUP_TYPES,
} from "./games/grele/grele-constants.js";
import Leaderboard from "./leaderboard.js";

export default class UI {
  constructor(gameManager, gameId = "grele") {
    this.gameManager = gameManager;
    this.gameId = gameId;
    this.leaderboard = new Leaderboard(this, gameId);

    // Éléments DOM partagés
    this.welcomeScreen = document.getElementById("welcome-screen");
    this.registerForm = document.getElementById("register-form");
    this.gameCanvas = document.getElementById("game-canvas");
    this.scoreDisplay = document.getElementById("score-display");
    this.currentScoreEl = document.getElementById("current-score");
    this.timerDisplay = document.getElementById("timer");
    this.contentEl = document.querySelector(".content");

    // Éléments spécifiques au jeu actif
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
      // Crêperie ou autre jeu
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
      // Masquer les boutons de test spécifiques à grêle
      const testBtn = document.getElementById("test-mode-btn");
      if (testBtn) testBtn.style.display = "none";
      const testRecapBtn = document.getElementById("test-recap-btn");
      if (testRecapBtn) testRecapBtn.style.display = "none";
    }

    // Timer
    this.timeRemaining = GAME_TIME_IN_SECS;
    this.timerInterval = null;

    // État du jeu
    this.playerInfo = { character: "cerise" };
    this.gameEndReason = "";

    // Initialiser les valeurs d'interface depuis les constantes (grêle uniquement)
    if (gameId === "grele") {
      this.initializeUIValues();
    }

    // Initialiser les événements
    this.setupEventListeners();

    // Afficher le leaderboard avec les scores existants
    this.leaderboard.updateDisplay();
  }

  setGameManager(gameManager) {
    this.gameManager = gameManager;
  }

  _setGameActive(active) {
    this.contentEl.classList.toggle("game-active", active);
  }

  // Initialise les valeurs de l'interface à partir des constantes (grêle)
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

  // Configuration des écouteurs d'événements
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
      this.playerInfo = { ...this.playerInfo, nickname, organization };
      this.registerForm.style.display = "none";

      if (this.gameId === "creperie") {
        // Pour la crêperie : aller directement au canvas (l'intro est dans le canvas)
        this.gameCanvas.style.display = "block";
        this._setGameActive(true);
        this.gameManager.startGame(this.playerInfo);
      } else {
        this.gameInstructions.style.display = "block";
      }
    });

    this.playBtn.addEventListener("click", () => {
      this.gameInstructions.style.display = "none";
      this.gameCanvas.style.display = "block";
      this._setGameActive(true);
      if (this.gameId !== "creperie") {
        this.scoreDisplay.style.display = "block";
      }
      this.gameManager.startGame(this.playerInfo);
    });

    // Crêperie : lancer avec la barre espace depuis l'écran des règles
    if (this.gameId === "creperie") {
      window.addEventListener("keydown", (e) => {
        if (
          e.key === " " &&
          this.gameInstructions &&
          this.gameInstructions.style.display !== "none"
        ) {
          e.preventDefault();
          this.gameInstructions.style.display = "none";
          this.gameCanvas.style.display = "block";
          this._setGameActive(true);
          this.gameManager.startGame(this.playerInfo);
        }
      });

      // Sélecteur de personnage
      this._setupCharacterSelector();
    }

    // Lightbox sketchnote
    this._setupSketchnoteModal();

    this.playAgainBtn.addEventListener("click", () => {
      this.gameOverScreen.style.display = "none";
      this.gameCanvas.style.display = "block";
      this._setGameActive(true);
      if (this.gameId !== "creperie") {
        this.scoreDisplay.style.display = "block";
      }
      this.gameManager.startGame(this.playerInfo);
    });

    this.homeBtn.addEventListener("click", () => {
      this.gameCanvas.style.display = "none";
      this._setGameActive(false);
      this.scoreDisplay.style.display = "none";
      this.gameOverScreen.style.display = "none";
      this.welcomeScreen.style.display = "block";
      document.getElementById("register-form").reset();
      this.playerInfo = { character: "cerise" };
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

  // Mode test pour démarrer rapidement (grêle)
  startTestMode() {
    this.playerInfo = { nickname: "TesteurG2S", organization: "G2S" };
    this.welcomeScreen.style.display = "none";
    this.gameCanvas.style.display = "block";
    this._setGameActive(true);
    this.scoreDisplay.style.display = "block";
    this.gameManager.startGame(this.playerInfo);
  }

  // Démarrer le timer (utilisé par le jeu grêle uniquement)
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

  // Mettre à jour l'affichage du timer (grêle — utilise this.timeRemaining)
  updateTimer() {
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    if (this.timerDisplay) {
      this.timerDisplay.textContent = `${minutes}:${
        seconds < 10 ? "0" : ""
      }${seconds}`;
    }
  }

  // Mettre à jour le timer avec une valeur externe (crêperie)
  setTimerDisplay(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds) % 60;
    if (this.timerDisplay) {
      this.timerDisplay.textContent = `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    }
  }

  // Mettre à jour le score affiché
  updateScore(score) {
    if (this.currentScoreEl) this.currentScoreEl.textContent = score;
  }

  // Afficher l'écran de fin de jeu (grêle)
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
    this._setGameActive(false);
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
      gameOverTitle.textContent = "Temps écoulé!";
    } else if (this.gameEndReason === "corn") {
      gameOverTitle.textContent = "Tous vos maïs sont détruits!";
    }

    this.addPowerupsRecap(collectedPowerups);

    // Note: le score est sauvegardé par game.js (this.leaderboard.saveScore)

    return finalScore;
  }

  // Afficher l'écran de fin de jeu (crêperie)
  showCreperieGameOver(stats) {
    // Pour la crêperie, l'écran de fin est désormais géré par le canvas (renderer-screens.js)
    // Cette méthode ne fait plus rien (garde pour compatibilité avec l'ancien code)
  }

  // ── Sélecteur de personnage ──────────────────────────────────────────────────
  _setupCharacterSelector() {
    const cards = document.querySelectorAll(".character-card");
    if (!cards.length) return;

    // Sélection par clic
    cards.forEach((card) => {
      card.addEventListener("click", () => {
        cards.forEach((c) => c.classList.remove("selected"));
        card.classList.add("selected");
        this.playerInfo = {
          ...this.playerInfo,
          character: card.dataset.character,
        };
      });
    });

    // Valeur initiale
    this.playerInfo = { ...this.playerInfo, character: "cerise" };
  }

  // ── Lightbox sketchnote ──────────────────────────────────────────────────────
  _setupSketchnoteModal() {
    const thumb = document.getElementById("sketchnote-thumb");
    const modal = document.getElementById("sketchnote-modal");
    const overlay = document.getElementById("sketchnote-overlay");
    const closeBtn = document.getElementById("sketchnote-close");
    if (!thumb || !modal) return;

    const openModal = () => {
      modal.style.display = "flex";
    };
    const closeModal = () => {
      modal.style.display = "none";
    };

    thumb.addEventListener("click", openModal);
    if (overlay) overlay.addEventListener("click", closeModal);
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.style.display !== "none") closeModal();
    });
  }

  // Ajouter le récapitulatif des bonus/malus (grêle)
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
    this._setGameActive(false);
    this.scoreDisplay.style.display = "none";
    this.gameOverScreen.style.display = "none";
  }

  showGameScreen() {
    this.gameCanvas.style.display = "block";
    this._setGameActive(true);
    this.scoreDisplay.style.display = "block";
  }

  getPlayerInfo() {
    return this.playerInfo;
  }

  stopTimer() {
    clearInterval(this.timerInterval);
  }

  // Test de l'écran de récapitulation (grêle)
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
    this._setGameActive(false);
    this.scoreDisplay.style.display = "none";
    this.showGameOver(1500, 120, 50, 5, testPowerups);
  }
}
