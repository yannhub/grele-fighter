// player.js - Gestion du joueur et des tirs

import {
  PLAYER_DEFAULT,
  BULLET_DEFAULT,
  PLAYER_CANON,
  PLAYER_DISPLAY,
} from "./constants.js";

export default class Player {
  constructor(canvas, ctx, scaleFactor) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.scaleFactor = scaleFactor;

    // Propriétés du joueur
    this.width = PLAYER_DEFAULT.width * scaleFactor;
    this.height = PLAYER_DEFAULT.height * scaleFactor;
    this.speed = PLAYER_DEFAULT.speed * scaleFactor;
    this.fireRate = PLAYER_DEFAULT.fireRate;
    this.lastFireTime = 0;

    // Position initiale
    this.x = canvas.width / 2 - this.width / 2;
    this.y = canvas.height - this.height - PLAYER_CANON.yOffset * scaleFactor;

    // Gestion des inputs
    this.keys = {};
    this.lastKeyStates = {};

    // Projectiles
    this.bullets = [];

    // Ajouter les écouteurs d'événements pour le clavier
    this.setupControls();
  }

  // Configuration des contrôles
  setupControls() {
    window.addEventListener("keydown", (e) => {
      this.keys[e.key] = true;
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.key] = false;
    });
  }

  // Mise à jour de la position du joueur
  update() {
    this.move();
    this.shoot();
    this.updateBullets();

    // Mettre à jour l'état précédent des touches
    this.lastKeyStates = { ...this.keys };
  }

  // Déplacement du joueur
  move() {
    // Permettre au joueur d'aller jusqu'au bord complet de l'écran
    if (this.keys["ArrowLeft"] && this.x > -this.width / 3) {
      this.x -= this.speed;
    }
    if (
      this.keys["ArrowRight"] &&
      this.x < this.canvas.width - (this.width * 2) / 3
    ) {
      this.x += this.speed;
    }
  }

  // Gestion des tirs
  shoot() {
    // Vérifier si espace vient d'être pressé (nouvel appui)
    const spaceJustPressed = this.keys[" "] && !this.lastKeyStates[" "];

    // Vérifier si les bonus de tir parallèle et diagonal sont actifs
    const parallelBonus =
      this.powerupSystem &&
      this.powerupSystem.isPowerupActive("PARALLEL_BULLETS");
    const diagonalBonus =
      this.powerupSystem &&
      this.powerupSystem.isPowerupActive("DIAGONAL_BULLETS");

    // Taux de tir actuel - ne pas réinitialiser lors de l'utilisation des bonus
    const currentTime = Date.now();
    const timeSinceLastFire = currentTime - this.lastFireTime;

    // Si espace vient juste d'être pressé, permettre un tir immédiat (contourne la cadence)
    if (spaceJustPressed) {
      this.createBullet(parallelBonus, diagonalBonus);
      this.lastFireTime = currentTime;
    }
    // Sinon, si espace est maintenu, respecter la cadence normale
    else if (this.keys[" "]) {
      if (timeSinceLastFire >= this.fireRate) {
        this.createBullet(parallelBonus, diagonalBonus);
        this.lastFireTime = currentTime;
      }
    }
  }

  // Création d'un projectile
  createBullet(parallelBonus = false, diagonalBonus = false) {
    const bulletWidth = BULLET_DEFAULT.width * this.scaleFactor;
    const bulletHeight = BULLET_DEFAULT.height * this.scaleFactor;
    const bulletSpeed = BULLET_DEFAULT.speed * this.scaleFactor;
    const canonHeight = PLAYER_CANON.height * this.scaleFactor;

    // Créer une balle au centre (par défaut)
    this.bullets.push({
      x: this.x + this.width / 2 - bulletWidth / 2,
      y: this.y - canonHeight,
      width: bulletWidth,
      height: bulletHeight,
      speed: bulletSpeed,
      speedX: 0, // Par défaut, pas de déplacement horizontal
    });

    // Ajouter des balles parallèles si le bonus est actif
    if (parallelBonus) {
      // Balle à gauche
      this.bullets.push({
        x: this.x + this.width / 4 - bulletWidth / 2,
        y: this.y - canonHeight,
        width: bulletWidth,
        height: bulletHeight,
        speed: bulletSpeed,
        speedX: 0,
      });

      // Balle à droite
      this.bullets.push({
        x: this.x + (this.width * 3) / 4 - bulletWidth / 2,
        y: this.y - canonHeight,
        width: bulletWidth,
        height: bulletHeight,
        speed: bulletSpeed,
        speedX: 0,
      });
    }

    // Ajouter des balles diagonales si le bonus est actif
    if (diagonalBonus) {
      // Balle diagonale gauche
      this.bullets.push({
        x: this.x + this.width / 2 - bulletWidth / 2,
        y: this.y - canonHeight,
        width: bulletWidth,
        height: bulletHeight,
        speed: bulletSpeed * BULLET_DEFAULT.diagonalSpeedMultiplier,
        speedX: -BULLET_DEFAULT.diagonalOffsetX * this.scaleFactor,
      });

      // Balle diagonale droite
      this.bullets.push({
        x: this.x + this.width / 2 - bulletWidth / 2,
        y: this.y - canonHeight,
        width: bulletWidth,
        height: bulletHeight,
        speed: bulletSpeed * BULLET_DEFAULT.diagonalSpeedMultiplier,
        speedX: BULLET_DEFAULT.diagonalOffsetX * this.scaleFactor,
      });
    }
  }

  // Mise à jour de la position des projectiles
  updateBullets() {
    for (let i = 0; i < this.bullets.length; i++) {
      this.bullets[i].y -= this.bullets[i].speed;
      this.bullets[i].x += this.bullets[i].speedX;

      // Supprimer les balles qui sortent de l'écran
      if (
        this.bullets[i].y < 0 ||
        this.bullets[i].x < 0 ||
        this.bullets[i].x > this.canvas.width
      ) {
        this.bullets.splice(i, 1);
        i--;
      }
    }
  }

  // Dessin du joueur
  draw() {
    this.drawPlayer();
    this.drawBullets();
  }

  // Dessin du véhicule du joueur
  drawPlayer() {
    // Corps du véhicule
    this.ctx.fillStyle = PLAYER_DISPLAY.bodyColor;
    this.ctx.fillRect(this.x, this.y, this.width, this.height);

    // Ajouter un canon sur le dessus
    const canonWidth = PLAYER_CANON.width * this.scaleFactor;
    const canonHeight = PLAYER_CANON.height * this.scaleFactor;
    this.ctx.fillStyle = PLAYER_DISPLAY.canonColor;
    this.ctx.fillRect(
      this.x + this.width / 2 - canonWidth / 2,
      this.y - canonHeight,
      canonWidth,
      canonHeight
    );

    // Ajouter le texte "G2S" en blanc
    this.ctx.fillStyle = PLAYER_DISPLAY.textColor;
    this.ctx.font = `bold ${
      PLAYER_DISPLAY.fontSize * this.scaleFactor
    }px Arial`;
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      "G2S",
      this.x + this.width / 2,
      this.y + this.height / 2 + PLAYER_DISPLAY.textOffsetY * this.scaleFactor
    );

    // Ajouter des roues (deux cercles noirs à gauche et à droite)
    const wheelRadius = PLAYER_DISPLAY.wheelRadius * this.scaleFactor;
    this.ctx.fillStyle = PLAYER_DISPLAY.wheelColor;
    // Roue gauche
    this.ctx.beginPath();
    this.ctx.arc(
      this.x + PLAYER_DISPLAY.wheelOffsetX * this.scaleFactor,
      this.y + this.height,
      wheelRadius,
      0,
      Math.PI * 2
    );
    this.ctx.fill();
    // Roue droite
    this.ctx.beginPath();
    this.ctx.arc(
      this.x + this.width - PLAYER_DISPLAY.wheelOffsetX * this.scaleFactor,
      this.y + this.height,
      wheelRadius,
      0,
      Math.PI * 2
    );
    this.ctx.fill();
  }

  // Dessin des projectiles
  drawBullets() {
    this.ctx.fillStyle = BULLET_DEFAULT.color;
    for (const bullet of this.bullets) {
      this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }
  }

  // Mise à jour des attributs du joueur
  setSpeed(newSpeed) {
    this.speed = newSpeed * this.scaleFactor;
  }

  setFireRate(newFireRate) {
    this.fireRate = newFireRate;
  }

  // Mise à jour du facteur d'échelle
  updateScaleFactor(newScaleFactor) {
    const scaleRatio = newScaleFactor / this.scaleFactor;

    this.scaleFactor = newScaleFactor;
    this.width = PLAYER_DEFAULT.width * newScaleFactor;
    this.height = PLAYER_DEFAULT.height * newScaleFactor;
    this.speed = PLAYER_DEFAULT.speed * newScaleFactor;

    // Repositionner le joueur
    this.y =
      this.canvas.height - this.height - PLAYER_CANON.yOffset * newScaleFactor;

    // Ajuster les balles existantes
    for (const bullet of this.bullets) {
      bullet.width *= scaleRatio;
      bullet.height *= scaleRatio;
      bullet.speed *= scaleRatio;
      if (bullet.speedX !== 0) {
        bullet.speedX *= scaleRatio;
      }
    }
  }

  // Pour les collisions
  getRadius() {
    return (this.width + this.height) / 4;
  }

  getCenterX() {
    return this.x + this.width / 2;
  }

  getCenterY() {
    return this.y + this.height / 2;
  }

  // Définit une référence au système de bonus/malus
  setPowerupSystem(powerupSystem) {
    this.powerupSystem = powerupSystem;
  }
}
