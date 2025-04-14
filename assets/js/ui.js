// ui.js - Gestion de l'interface utilisateur et la navigation entre écrans

import { GAME_TIME_IN_SECS, CORN_DEFAULT, POWERUP_TYPES } from "./constants.js";

export default class UI {
  constructor(gameManager) {
    this.gameManager = gameManager;

    // Éléments DOM
    this.welcomeScreen = document.getElementById("welcome-screen");
    this.registerForm = document.getElementById("register-form");
    this.gameInstructions = document.getElementById("game-instructions");
    this.gameCanvas = document.getElementById("game-canvas");
    this.scoreDisplay = document.getElementById("score-display");
    this.currentScoreEl = document.getElementById("current-score");
    this.gameOverScreen = document.getElementById("game-over");
    this.finalScoreEl = document.getElementById("final-score");

    // Boutons
    this.startBtn = document.getElementById("start-btn");
    this.submitInfoBtn = document.getElementById("submit-info");
    this.playBtn = document.getElementById("play-btn");
    this.playAgainBtn = document.getElementById("play-again-btn");
    this.testModeBtn = document.getElementById("test-mode-btn");
    this.testRecapBtn = document.getElementById("test-recap-btn");

    // Timer
    this.timerDisplay = document.getElementById("timer");
    this.timeRemaining = GAME_TIME_IN_SECS;
    this.timerInterval = null;

    // État du jeu
    this.playerInfo = {};
    this.gameEndReason = "";

    // Initialiser les événements
    this.setupEventListeners();
  }

  // Configuration des écouteurs d'événements
  setupEventListeners() {
    this.startBtn.addEventListener("click", () => {
      this.welcomeScreen.style.display = "none";
      this.registerForm.style.display = "block";
    });

    this.registerForm.addEventListener("submit", (e) => {
      e.preventDefault();

      // Récupérer les informations du joueur
      this.playerInfo = {
        firstname: document.getElementById("firstname").value,
        lastname: document.getElementById("lastname").value,
        nickname: document.getElementById("nickname").value,
        email: document.getElementById("email").value,
        organization: document.getElementById("organization").value,
      };

      // Passer aux instructions
      this.registerForm.style.display = "none";
      this.gameInstructions.style.display = "block";
    });

    this.playBtn.addEventListener("click", () => {
      // Masquer les instructions et afficher le jeu
      this.gameInstructions.style.display = "none";
      this.gameCanvas.style.display = "block";
      this.scoreDisplay.style.display = "block";

      // Démarrer le jeu
      this.gameManager.startGame();
    });

    this.playAgainBtn.addEventListener("click", () => {
      // Masquer l'écran de fin
      this.gameOverScreen.style.display = "none";

      // Afficher le jeu
      this.gameCanvas.style.display = "block";
      this.scoreDisplay.style.display = "block";

      // Démarrer une nouvelle partie
      this.gameManager.startGame();
    });

    this.testModeBtn.addEventListener("click", () => {
      this.startTestMode();
    });

    // Écouteur pour le bouton de test de l'écran récap
    this.testRecapBtn?.addEventListener("click", () => {
      this.showTestRecap();
    });

    // Gestionnaire de redimensionnement
    window.addEventListener("resize", () => {
      this.gameManager.resizeGame();
    });
  }

  // Mode test pour démarrer rapidement
  startTestMode() {
    // Configurer des informations de joueur par défaut
    this.playerInfo = {
      firstname: "Testeur",
      lastname: "G2S",
      nickname: "TesteurG2S",
      email: "testeur@g2s.com",
      organization: "G2S",
    };

    // Masquer l'écran d'accueil
    this.welcomeScreen.style.display = "none";

    // Afficher directement le canvas de jeu et le score
    this.gameCanvas.style.display = "block";
    this.scoreDisplay.style.display = "block";

    // Démarrer le jeu
    this.gameManager.startGame();
  }

  // Démarrer le timer
  startTimer() {
    this.timeRemaining = GAME_TIME_IN_SECS;
    this.updateTimer();

    // Démarrer le timer
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      this.updateTimer();

      // Déclencher un événement après 1 minute de jeu
      const elapsedTime = GAME_TIME_IN_SECS - this.timeRemaining;
      if (elapsedTime === 60) {
        this.gameManager.triggerStormCloud();
      }

      // Vérifier si le temps est écoulé
      if (this.timeRemaining <= 0) {
        this.gameEndReason = "time";
        this.gameManager.endGame();
      }
    }, 1000);
  }

  // Mettre à jour l'affichage du timer
  updateTimer() {
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    this.timerDisplay.textContent = `${minutes}:${
      seconds < 10 ? "0" : ""
    }${seconds}`;
  }

  // Mettre à jour le score affiché
  updateScore(score) {
    this.currentScoreEl.textContent = score;
  }

  // Afficher l'écran de fin de jeu
  showGameOver(score, hailsDestroyed, cornSaved, collectedPowerups) {
    // Arrêter le timer
    clearInterval(this.timerInterval);

    // Calculer les points
    const hailPoints = hailsDestroyed * 10;
    const cornPoints = cornSaved * CORN_DEFAULT.points;
    const finalScore = hailPoints + cornPoints;

    // Afficher l'écran de fin
    this.gameCanvas.style.display = "none";
    this.scoreDisplay.style.display = "none";
    this.gameOverScreen.style.display = "block";

    // Remplir les détails du score final
    this.finalScoreEl.textContent = finalScore;
    document.getElementById("hails-destroyed").textContent = hailsDestroyed;
    document.getElementById("hails-points").textContent = hailPoints;
    document.getElementById("corn-saved").textContent = cornSaved;
    document.getElementById("corn-points").textContent = cornPoints;

    // Message différent selon la raison de fin de partie
    const gameOverTitle = document.querySelector("#game-over h2");
    if (this.gameEndReason === "time") {
      gameOverTitle.textContent = "Temps écoulé!";
    } else if (this.gameEndReason === "corn") {
      gameOverTitle.textContent = "Tous vos maïs sont détruits!";
    }

    // Ajouter le récapitulatif des bonus/malus récupérés
    this.addPowerupsRecap(collectedPowerups);

    return finalScore;
  }

  // Ajouter le récapitulatif des bonus/malus récupérés
  addPowerupsRecap(collectedPowerups) {
    // S'il n'y a pas de powerups récupérés, ne rien afficher du tout
    if (collectedPowerups.length === 0) {
      return;
    }

    // Compter les occurrences de chaque type de bonus/malus
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

    // Rendre visible le titre des powerups
    const powerupsTitle = document.getElementById("powerups-title");
    powerupsTitle.style.display = "block";

    // Récupérer le conteneur de la liste des powerups
    const powerupsList = document.getElementById("powerups-list");

    // Vider le conteneur avant de le remplir
    powerupsList.innerHTML = "";

    // Remplir la liste avec les powerups
    Object.keys(powerupCounts).forEach((type) => {
      const powerupInfo = powerupCounts[type];

      // Créer l'élément powerup
      const powerupItem = document.createElement("div");
      powerupItem.className = "powerup-item";
      powerupItem.title = powerupInfo.name; // Afficher le nom au survol

      // Créer un cercle coloré avec l'icône
      const iconSpan = document.createElement("span");
      iconSpan.className = `powerup-icon ${
        powerupInfo.good ? "powerup-icon-good" : "powerup-icon-bad"
      }`;
      iconSpan.textContent = powerupInfo.icon;
      iconSpan.style.backgroundColor = powerupInfo.color;

      // Ajouter l'icône au conteneur powerup
      powerupItem.appendChild(iconSpan);

      // Ajouter un compteur si plus d'un powerup du même type
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

  // Définir la raison de fin de jeu
  setGameEndReason(reason) {
    this.gameEndReason = reason;
  }

  // Obtenir les informations du joueur
  getPlayerInfo() {
    return this.playerInfo;
  }

  // Arrêter le timer
  stopTimer() {
    clearInterval(this.timerInterval);
  }

  // Test de l'écran de récapitulation avec des données simulées
  showTestRecap() {
    // Configurer des informations de joueur par défaut si non définies
    if (!this.playerInfo.firstname) {
      this.playerInfo = {
        firstname: "Testeur",
        lastname: "Récap",
        nickname: "TesteurRecap",
        email: "recap@test.com",
        organization: "G2S",
      };
    }

    // Simuler la fin de partie avec des données de test
    this.gameEndReason = "time"; // Le temps est écoulé

    // Créer quelques données de powerups test pour l'exemple
    const testPowerups = [];
    // Ajouter quelques powerups fictifs (vérifie dans constants.js les types disponibles)
    for (let type in POWERUP_TYPES) {
      // Ajouter entre 0 et 3 occurrences de chaque type
      const count = Math.floor(Math.random() * 4);
      for (let i = 0; i < count; i++) {
        testPowerups.push({
          type: type,
          name: POWERUP_TYPES[type].name,
        });
      }
    }

    // Masquer tous les autres écrans
    this.welcomeScreen.style.display = "none";
    this.registerForm.style.display = "none";
    this.gameInstructions.style.display = "none";
    this.gameCanvas.style.display = "none";
    this.scoreDisplay.style.display = "none";

    // Afficher l'écran de récapitulation avec des scores simulés
    this.showGameOver(
      1500, // Score total
      120, // 120 grêlons détruits
      5, // 5 maïs sauvés
      testPowerups // Array de powerups collectés
    );
  }
}
