// game.js - Gestionnaire principal du jeu

import {
  BASE_WIDTH,
  BASE_HEIGHT,
  DIFFICULTY_INCREASE_RATE,
  HAIL_DEFAULT,
  FRAME_DURATION,
  BACKGROUND,
  UI,
} from "./constants.js";
import Player from "./player.js";
import CornField from "./corn.js";
import HailSystem from "./hail.js";
import PowerupSystem from "./powerups.js";
import CollisionManager from "./collision.js";
import Leaderboard from "./leaderboard.js";

export default class Game {
  constructor(ui) {
    this.ui = ui;

    // Canvas et contexte
    this.canvas = document.getElementById("game-canvas");
    this.ctx = this.canvas.getContext("2d");

    // Facteur d'échelle pour adapter les éléments à la taille du viewport
    this.scaleFactor = 1;

    // Vitesse du jeu (augmente progressivement pour la difficulté)
    this.gameSpeed = 1;

    // Flag pour le nuage d'orage
    this.stormCloudTriggered = false;

    // Intervalles
    this.gameInterval = null;
    this.hailInterval = null;
    this.powerupInterval = null;
    this.powerupTimeout = null; // Nouveau timeout pour la génération dynamique des bonus/malus

    // Instancier le gestionnaire de leaderboard
    this.leaderboard = new Leaderboard();

    // Initialiser les systèmes de jeu
    this.initializeSystems();
  }

  // Initialisation des différents systèmes du jeu
  initializeSystems() {
    // Redimensionner le canvas
    this.resizeGame();

    // Instancier le joueur
    this.player = new Player(this.canvas, this.ctx, this.scaleFactor);

    // Instancier le champ de maïs
    this.cornField = new CornField(this.canvas, this.ctx, this.scaleFactor);

    // Instancier le système de grêlons
    this.hailSystem = new HailSystem(this.canvas, this.ctx, this.scaleFactor);

    // Instancier le système de bonus/malus
    this.powerupSystem = new PowerupSystem(
      this.canvas,
      this.ctx,
      this.scaleFactor
    );

    // Donner au joueur une référence au système de bonus/malus
    this.player.setPowerupSystem(this.powerupSystem);

    // Instancier le gestionnaire de collision
    this.collisionManager = new CollisionManager(
      this.player,
      this.hailSystem,
      this.cornField,
      this.powerupSystem
    );
  }

  // Démarrer une nouvelle partie
  startGame() {
    // Réinitialiser les variables du jeu
    this.resetGame();

    // Enregistrer le temps de début de la partie
    this.gameStartTime = Date.now();

    // Démarrer le timer
    this.ui.startTimer();

    // Démarrer la boucle du jeu
    this.gameInterval = setInterval(() => this.gameLoop(), FRAME_DURATION); // 60 FPS

    // Générer des grêlons à intervalles réguliers avec une fréquence qui augmente avec le temps
    this.updateHailInterval();

    // Planifier la première génération de bonus/malus
    this.schedulePowerupCreation();
  }

  // Mise à jour de l'intervalle de création des grêlons en fonction de la difficulté
  updateHailInterval() {
    // Arrêter l'intervalle précédent s'il existe
    if (this.hailInterval) clearInterval(this.hailInterval);

    // Utiliser l'intervalle déjà calculé dans gameLoop ou le calculer si c'est la première fois
    const newInterval =
      this.currentHailInterval ||
      Math.max(
        HAIL_DEFAULT.minInterval,
        HAIL_DEFAULT.createInterval -
          (this.gameSpeed - 0.5) * HAIL_DEFAULT.intervalReduction
      );

    // Créer un nouvel intervalle avec le délai calculé
    this.hailInterval = setInterval(() => {
      this.hailSystem.createHail();

      // Mettre à jour l'intervalle à chaque création de grêlon
      // en utilisant la valeur calculée dans gameLoop
      if (this.currentHailInterval !== newInterval) {
        this.updateHailInterval();
      }
    }, newInterval);
  }

  // Planifier la création d'un bonus/malus avec un délai dynamique
  schedulePowerupCreation() {
    // Utiliser la méthode avec le temps de début du jeu pour obtenir une progression linéaire
    const currentInterval = this.powerupSystem.updatePowerupFrequency(
      this.gameStartTime
    );

    // Créer un nouveau timeout avec l'intervalle actuel
    this.powerupTimeout = setTimeout(() => {
      // Créer un bonus/malus
      this.powerupSystem.createPowerup();

      // Planifier le prochain si le jeu est toujours en cours
      if (this.gameInterval) {
        this.schedulePowerupCreation();
      }
    }, currentInterval);
  }

  // Réinitialiser l'état du jeu
  resetGame() {
    // Réinitialiser les variables principales
    this.gameSpeed = 1;
    this.stormCloudTriggered = false;

    // Réinitialiser les systèmes
    this.initializeSystems();

    // Réinitialiser le gestionnaire de collision
    this.collisionManager.reset();

    // Arrêter les intervalles existants si nécessaire
    if (this.gameInterval) clearInterval(this.gameInterval);
    if (this.hailInterval) clearInterval(this.hailInterval);
    if (this.powerupTimeout) clearTimeout(this.powerupTimeout);
  }

  // Boucle principale du jeu
  gameLoop() {
    // Effacer le canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Dessiner le fond (champ de maïs)
    this.drawBackground();

    // Mettre à jour et dessiner le joueur
    this.player.update();
    this.player.draw();

    // Mettre à jour et dessiner les grêlons
    this.hailSystem.update();
    this.hailSystem.draw();

    // Mettre à jour et dessiner les bonus/malus
    this.powerupSystem.update();
    this.powerupSystem.draw();

    // Mettre à jour le nuage d'orage si actif
    if (this.powerupSystem.activeCloudMalus) {
      this.powerupSystem.updateStormCloud();
    }

    // Vérifier les collisions
    this.collisionManager.checkCollisions();

    // Afficher les informations de debug
    this.drawDebugInfo();

    // Mettre à jour le score affiché
    this.ui.updateScore(
      this.collisionManager.getScore(),
      this.currentHailInterval
    );

    // Vérifier si tous les épis sont détruits
    if (this.collisionManager.areAllCornsDead()) {
      this.ui.setGameEndReason("corn");
      this.endGame();
    }

    // Augmenter progressivement la difficulté
    this.gameSpeed += DIFFICULTY_INCREASE_RATE;

    this.hailSystem.setGameSpeed(this.gameSpeed);
    this.player.setGameSpeed(this.gameSpeed);

    // Mettre à jour l'intervalle de création des grêlons à chaque frame
    const newInterval = Math.max(
      HAIL_DEFAULT.minInterval,
      HAIL_DEFAULT.createInterval -
        Math.log(this.gameSpeed) * HAIL_DEFAULT.intervalReduction * 3
    );

    // Si l'intervalle a changé de façon significative (plus de 10ms de différence)
    // ou s'il n'existe pas encore, le mettre à jour et recréer le timer
    if (
      !this.currentHailInterval ||
      Math.abs(this.currentHailInterval - newInterval) > 10
    ) {
      this.currentHailInterval = newInterval;
      this.updateHailInterval();
    } else {
      this.currentHailInterval = newInterval;
    }
  }

  // Dessiner l'arrière-plan
  drawBackground() {
    // Créer un dégradé de bleu pour le ciel
    const skyGradient = this.ctx.createLinearGradient(
      0,
      0,
      0,
      this.canvas.height
    );
    skyGradient.addColorStop(0, BACKGROUND.skyTop); // Bleu ciel en haut
    skyGradient.addColorStop(1, BACKGROUND.skyBottom); // Bleu ciel plus clair en bas

    // Appliquer le fond bleu
    this.ctx.fillStyle = skyGradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Dessiner les épis de maïs en bas du canvas
    this.cornField.draw();
  }

  // Redimensionner le jeu en fonction de la taille de l'écran
  resizeGame() {
    const gameArea = document.querySelector(".game-area");
    const gameAreaWidth = gameArea.clientWidth - UI.gamePadding; // -40 pour le padding
    const gameAreaHeight = Math.min(
      window.innerHeight * UI.maxHeightRatio,
      gameAreaWidth * UI.aspectRatio
    );

    // Ajuster la taille du canvas
    this.canvas.width = gameAreaWidth;
    this.canvas.height = gameAreaHeight;

    // Calculer le facteur d'échelle par rapport à la taille de référence
    this.scaleFactor = Math.min(
      this.canvas.width / BASE_WIDTH,
      this.canvas.height / BASE_HEIGHT
    );

    // Mettre à jour le facteur d'échelle pour chaque système
    if (this.player) this.player.updateScaleFactor(this.scaleFactor);
    if (this.cornField) this.cornField.updateScaleFactor(this.scaleFactor);
    if (this.hailSystem) this.hailSystem.updateScaleFactor(this.scaleFactor);
    if (this.powerupSystem)
      this.powerupSystem.updateScaleFactor(this.scaleFactor);
  }

  // Déclencher le nuage d'orage (pour le timer)
  triggerStormCloud() {
    if (!this.stormCloudTriggered) {
      // Créer un nuage d'orage en utilisant le type de malus STORM_CLOUD
      this.powerupSystem.activeCloudMalus = this.hailSystem.createStormCloud();
      this.stormCloudTriggered = true;
    }
  }

  // Nouvelle méthode pour afficher les informations de debug
  drawDebugInfo() {
    // Définir le style du texte et du fond pour la fenêtre de debug
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    this.ctx.fillRect(10, 10, 220, 90);
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "14px monospace";

    // Afficher les informations
    this.ctx.fillText(`GameSpeed: ${this.gameSpeed.toFixed(3)}`, 40, 30);
    this.ctx.fillText(
      `HailInterval: ${Math.round(this.currentHailInterval || 0)}ms`,
      40,
      50
    );
    this.ctx.fillText(
      `BaseFireRate: ${Math.round(this.player.baseFireRate)}ms`,
      40,
      70
    );
  }

  // Terminer la partie
  endGame() {
    // Arrêter les intervalles
    clearInterval(this.gameInterval);
    clearInterval(this.hailInterval);
    if (this.powerupTimeout) clearTimeout(this.powerupTimeout);

    // Calculer le score final
    const hailsDestroyed = this.collisionManager.getHailsDestroyed();
    const cloudDropsDestroyed = this.collisionManager.getCloudDropsDestroyed();
    const cornSaved = this.cornField.getAliveCornCount();
    const collectedPowerups = this.powerupSystem.collectedPowerups;

    // Afficher l'écran de fin
    const finalScore = this.ui.showGameOver(
      this.collisionManager.getScore(),
      hailsDestroyed,
      cloudDropsDestroyed,
      cornSaved,
      collectedPowerups
    );

    // Sauvegarder le score
    this.leaderboard.saveScore(this.ui.getPlayerInfo(), finalScore);
  }
}
