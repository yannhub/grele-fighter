// hail.js - Gestion des grêlons et de leur animation

import {
  HAIL_DEFAULT,
  ANIMATION,
  MAX_SPEED_MULTIPLIER,
  HAIL_PROBABILITY,
  STORM_CLOUD,
} from "./constants.js";

export default class HailSystem {
  constructor(canvas, ctx, scaleFactor) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.scaleFactor = scaleFactor;
    this.hails = [];
    this.hailParticles = []; // Animation de particules d'éclatement des grêlons
    this.gameSpeed = 1; // Multiplicateur de vitesse général du jeu
    // Pas de limite sur le nombre maximum de grêlons
  }

  // Création d'un grêlon
  createHail() {
    const baseSize = Math.random() * 5 + HAIL_DEFAULT.minSize;
    const size = baseSize * this.scaleFactor;

    // Limiter l'augmentation de la vitesse des grêlons
    // Utiliser Math.min pour plafonner la vitesse maximale
    const cappedSpeed =
      Math.min(this.gameSpeed, MAX_SPEED_MULTIPLIER) * this.scaleFactor;

    this.hails.push({
      x: Math.random() * (this.canvas.width - size),
      y: -size,
      size: size,
      speed: cappedSpeed,
    });

    // Augmenter fortement la fréquence des grêlons avec une progression douce
    // Augmentation de la probabilité de base pour avoir plus de grêlons
    const extraHailProbability = Math.min(
      HAIL_PROBABILITY.baseProbability +
        (this.gameSpeed - 1) * HAIL_PROBABILITY.multiplier,
      HAIL_PROBABILITY.maxProbability
    );

    // Chance d'avoir un second grêlon (augmentée)
    if (Math.random() < extraHailProbability) {
      setTimeout(() => {
        // Créer un grêlon avec un léger décalage pour une meilleure répartition
        const newSize =
          (Math.random() * 5 + HAIL_DEFAULT.minSize) * this.scaleFactor;
        this.hails.push({
          x: Math.random() * (this.canvas.width - newSize),
          y: -newSize,
          size: newSize,
          speed: cappedSpeed,
        });
      }, Math.random() * HAIL_PROBABILITY.extraDelay1); // Décalage aléatoire
    }

    // Chance d'avoir un troisième grêlon (augmentée et disponible plus tôt)
    if (
      this.gameSpeed > HAIL_PROBABILITY.difficultyThreshold1 &&
      Math.random() <
        extraHailProbability - HAIL_PROBABILITY.probabilityReduction1
    ) {
      setTimeout(() => {
        const newSize =
          (Math.random() * 5 + HAIL_DEFAULT.minSize) * this.scaleFactor;
        this.hails.push({
          x: Math.random() * (this.canvas.width - newSize),
          y: -newSize,
          size: newSize,
          speed: cappedSpeed,
        });
      }, Math.random() * HAIL_PROBABILITY.extraDelay2); // Décalage aléatoire plus important
    }

    // Ajout d'une quatrième chance de grêlon à des niveaux de difficulté plus élevés
    if (
      this.gameSpeed > HAIL_PROBABILITY.difficultyThreshold2 &&
      Math.random() <
        extraHailProbability - HAIL_PROBABILITY.probabilityReduction2
    ) {
      setTimeout(() => {
        const newSize =
          (Math.random() * 5 + HAIL_DEFAULT.minSize) * this.scaleFactor;
        this.hails.push({
          x: Math.random() * (this.canvas.width - newSize),
          y: -newSize,
          size: newSize,
          speed: cappedSpeed,
        });
      }, Math.random() * HAIL_PROBABILITY.extraDelay3);
    }
  }

  // Mise à jour de la position des grêlons
  update() {
    this.moveHails();
    this.updateParticles();
  }

  // Déplacement des grêlons
  moveHails() {
    for (let i = 0; i < this.hails.length; i++) {
      this.hails[i].y += this.hails[i].speed;

      // Supprimer les grêlons qui sortent de l'écran
      if (this.hails[i].y > this.canvas.height + this.hails[i].size) {
        this.hails.splice(i, 1);
        i--;
      }
    }
  }

  // Mise à jour des particules d'animation
  updateParticles() {
    for (let i = 0; i < this.hailParticles.length; i++) {
      const particle = this.hailParticles[i];

      // Mettre à jour la position et l'opacité
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      particle.alpha -= ANIMATION.fadeRate;

      // Réduire légèrement la taille pour donner l'impression de fonte
      particle.size *= ANIMATION.shrinkRate;

      // Supprimer la particule une fois qu'elle est presque transparente
      if (particle.alpha <= 0) {
        this.hailParticles.splice(i, 1);
        i--;
      }
    }
  }

  // Dessin des grêlons et particules
  draw() {
    this.drawHails();
    this.drawHailParticles();
  }

  // Dessin des grêlons
  drawHails() {
    for (const hail of this.hails) {
      // Dessiner un grêlon (cercle blanc/bleuté)
      this.ctx.fillStyle = HAIL_DEFAULT.color;
      this.ctx.beginPath();
      this.ctx.arc(
        hail.x + hail.size / 2,
        hail.y + hail.size / 2,
        hail.size / 2,
        0,
        Math.PI * 2
      );
      this.ctx.fill();

      // Ajouter un effet de brillance
      this.ctx.fillStyle = HAIL_DEFAULT.highlightColor;
      this.ctx.beginPath();
      this.ctx.arc(
        hail.x + hail.size / 3,
        hail.y + hail.size / 3,
        hail.size / 6,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
    }
  }

  // Dessin des particules d'animation
  drawHailParticles() {
    for (const particle of this.hailParticles) {
      // Dessiner une particule avec sa couleur propre
      this.ctx.fillStyle = particle.color.startsWith("#")
        ? `${particle.color}${Math.floor(particle.alpha * 255)
            .toString(16)
            .padStart(2, "0")}`
        : particle.color.replace(")", `, ${particle.alpha})`);

      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  // Création des particules d'animation lors de la destruction d'un grêlon
  createHailParticles(x, y, size, hailColor = HAIL_DEFAULT.color) {
    // Plus de particules pour de plus gros grêlons
    const particleCount = Math.floor(size * ANIMATION.particleCount);

    // Créer des particules qui s'éparpillent dans toutes les directions
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2; // Angle aléatoire
      const speed = (Math.random() * 2 + 1) * this.scaleFactor; // Vitesse aléatoire

      this.hailParticles.push({
        x: x + size / 2,
        y: y + size / 2,
        size: Math.random() * 3 * this.scaleFactor + 1 * this.scaleFactor, // Taille variée
        speedX: Math.cos(angle) * speed, // Vitesse horizontale basée sur l'angle
        speedY: Math.sin(angle) * speed, // Vitesse verticale basée sur l'angle
        alpha: 1.0, // Opacité initiale
        color: Math.random() > 0.7 ? "#ffffff" : hailColor, // Mélange de bleu et blanc
      });
    }
  }

  // Gestion du nuage d'orage (malus spécial)
  createStormCloud() {
    return {
      x:
        Math.random() *
        (this.canvas.width - STORM_CLOUD.width * this.scaleFactor),
      y: STORM_CLOUD.posY * this.scaleFactor,
      width: STORM_CLOUD.width * this.scaleFactor,
      height: STORM_CLOUD.height * this.scaleFactor,
      speedX:
        STORM_CLOUD.speed * this.scaleFactor * (Math.random() > 0.5 ? 1 : -1), // Direction aléatoire
      lastDropTime: 0,
      drops: [], // Grêlons générés par le nuage
      endTime: Date.now() + STORM_CLOUD.duration, // Durée du nuage d'orage
    };
  }

  // Mise à jour du facteur d'échelle
  updateScaleFactor(newScaleFactor) {
    const scaleRatio = newScaleFactor / this.scaleFactor;
    this.scaleFactor = newScaleFactor;

    // Mettre à jour les grêlons existants
    for (const hail of this.hails) {
      hail.size *= scaleRatio;
      hail.speed *= scaleRatio;
    }

    // Mettre à jour les particules existantes
    for (const particle of this.hailParticles) {
      particle.size *= scaleRatio;
      particle.speedX *= scaleRatio;
      particle.speedY *= scaleRatio;
    }
  }

  // Mise à jour de la vitesse du jeu
  setGameSpeed(speed) {
    this.gameSpeed = speed;
  }
}
