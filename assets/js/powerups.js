// powerups.js - Gestion des bonus/malus et de leurs effets

import {
  POWERUP_DEFAULT,
  POWERUP_TYPES,
  PLAYER_DEFAULT,
  CLOUD_DROPS_DEFAULT,
} from "./constants.js";

export default class PowerupSystem {
  constructor(canvas, ctx, scaleFactor) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.scaleFactor = scaleFactor;
    this.powerups = [];
    this.activePowerups = []; // Bonus/malus actuellement actifs
    this.powerupEffects = []; // Animations d'effets
    this.activeCloudMalus = null; // Nuage d'orage actif
    this.collectedPowerups = []; // Historique des bonus/malus récupérés

    // Propriétés pour la fréquence progressive
    this.powerupFrequency = POWERUP_DEFAULT.createInterval; // Intervalle initial
    this.minPowerupFrequency = 3000; // Intervalle minimum (3 secondes)
  }

  // Création d'un bonus/malus aléatoire
  createPowerup() {
    // Déterminer si c'est un bonus ou un malus
    const isBonus = Math.random() < POWERUP_DEFAULT.bonusProbability;

    // Sélectionner un type de bonus/malus aléatoire
    const powerupTypes = Object.keys(POWERUP_TYPES).filter(
      (type) => POWERUP_TYPES[type].good === isBonus
    );
    const powerupType =
      powerupTypes[Math.floor(Math.random() * powerupTypes.length)];

    // Taille du bonus/malus
    const size = POWERUP_DEFAULT.size * this.scaleFactor;

    // Créer le bonus/malus
    this.powerups.push({
      x: Math.random() * (this.canvas.width - size),
      y: -size,
      size: size,
      speed: POWERUP_DEFAULT.speed * this.scaleFactor,
      type: powerupType,
      rotation: 0, // Pour l'animation de rotation
      pulse: 0, // Pour l'animation de pulsation
      pulseDirection: 1, // Direction de la pulsation (augmente ou diminue)
    });
  }

  // Mettre à jour l'intervalle de génération des bonus/malus
  updatePowerupFrequency(gameSpeed) {
    // Réduire progressivement l'intervalle en fonction de la vitesse du jeu
    // Avec une formule qui diminue l'intervalle mais pas trop rapidement
    const newFrequency = Math.max(
      this.minPowerupFrequency,
      POWERUP_DEFAULT.createInterval - (gameSpeed - 1) * 4000
    );

    this.powerupFrequency = newFrequency;
    return newFrequency;
  }

  // Mise à jour des bonus/malus
  update() {
    this.movePowerups();
    this.handleActivePowerups();
    this.updatePowerupEffects();
  }

  // Déplacement des bonus/malus
  movePowerups() {
    for (let i = 0; i < this.powerups.length; i++) {
      const powerup = this.powerups[i];

      // Déplacer le bonus/malus vers le bas
      powerup.y += powerup.speed;

      // Animation de rotation douce
      powerup.rotation += 0.02;

      // Animation de pulsation
      powerup.pulse += 0.05 * powerup.pulseDirection;
      if (powerup.pulse >= 1) powerup.pulseDirection = -1;
      if (powerup.pulse <= 0) powerup.pulseDirection = 1;

      // Supprimer les bonus/malus qui sortent de l'écran
      if (powerup.y > this.canvas.height + powerup.size) {
        this.powerups.splice(i, 1);
        i--;
      }
    }
  }

  // Gestion des bonus/malus actifs
  handleActivePowerups() {
    const currentTime = Date.now();
    const activePowerupTypes = new Set(); // Pour suivre les types de powerups toujours actifs

    // Parcourir la liste des bonus/malus actifs
    for (let i = 0; i < this.activePowerups.length; i++) {
      const powerup = this.activePowerups[i];

      // Vérifier si le bonus/malus est expiré
      if (currentTime > powerup.endTime) {
        // Avant de supprimer, vérifier si d'autres powerups du même type sont actifs
        const otherActivePowerupsOfSameType = this.activePowerups.filter(
          (p) =>
            p.type === powerup.type && p !== powerup && currentTime <= p.endTime
        );

        // Ne restaurer que s'il n'y a pas d'autre powerup du même type actif
        if (
          otherActivePowerupsOfSameType.length === 0 &&
          powerup.restoreFunction
        ) {
          powerup.restoreFunction();
        }

        this.activePowerups.splice(i, 1);
        i--;
      } else {
        // Ce powerup est toujours actif, ajouter son type à l'ensemble
        activePowerupTypes.add(powerup.type);
      }
    }

    // Gérer le nuage orageux (malus spécial)
    if (this.activeCloudMalus && currentTime > this.activeCloudMalus.endTime) {
      this.activeCloudMalus = null;
    }
  }

  // Mise à jour des effets visuels des bonus/malus
  updatePowerupEffects() {
    const currentTime = Date.now();

    for (let i = 0; i < this.powerupEffects.length; i++) {
      const effect = this.powerupEffects[i];
      const elapsedTime = currentTime - effect.startTime;
      const progress = elapsedTime / effect.duration;

      // Vérifier si l'effet est expiré
      if (progress >= 1) {
        this.powerupEffects.splice(i, 1);
        i--;
        continue;
      }

      // Déplacer la particule ou le texte selon le type d'effet
      if (effect.type === "TEXT") {
        // Déplacer le texte vers le haut
        effect.y += effect.speedY;
      } else {
        // Déplacer la particule
        effect.x += effect.speedX * (1 - progress);
        effect.y += effect.speedY * (1 - progress);
      }
    }
  }

  // Dessin des bonus/malus et de leurs effets
  draw() {
    this.drawPowerups();
    this.drawPowerupEffects();
    this.drawStormCloud();
  }

  // Dessin des bonus/malus
  drawPowerups() {
    for (const powerup of this.powerups) {
      const powerupInfo = POWERUP_TYPES[powerup.type];
      const centerX = powerup.x + powerup.size / 2;
      const centerY = powerup.y + powerup.size / 2;

      // Sauvegarder le contexte pour la rotation
      this.ctx.save();
      this.ctx.translate(centerX, centerY);
      this.ctx.rotate(powerup.rotation);

      // Appliquer l'effet de pulsation
      const pulseFactor = 1 + powerup.pulse * 0.1; // Pulsation de +/- 10%

      // Dessiner la bulle (couleur selon type)
      this.ctx.fillStyle = powerupInfo.color;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, (powerup.size / 2) * pulseFactor, 0, Math.PI * 2);
      this.ctx.fill();

      // Ajouter un éclat
      this.ctx.fillStyle = powerupInfo.good
        ? "rgba(255, 255, 255, 0.6)"
        : "rgba(0, 0, 0, 0.3)";
      this.ctx.beginPath();
      this.ctx.arc(
        -powerup.size / 5,
        -powerup.size / 5,
        powerup.size / 6,
        0,
        Math.PI * 2
      );
      this.ctx.fill();

      // Dessiner l'icône au centre
      this.ctx.fillStyle = "#FFFFFF";
      this.ctx.font = `bold ${20 * this.scaleFactor}px Arial`;
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(powerupInfo.icon, 0, 0);

      // Restaurer le contexte
      this.ctx.restore();
    }
  }

  // Dessin des effets visuels des bonus/malus
  drawPowerupEffects() {
    const currentTime = Date.now();

    for (let i = 0; i < this.powerupEffects.length; i++) {
      const effect = this.powerupEffects[i];
      const elapsedTime = currentTime - effect.startTime;
      const progress = elapsedTime / effect.duration;

      // Animation différente selon le type d'effet
      if (effect.type === "TEXT") {
        // Texte flottant pour le nom du bonus/malus
        this.ctx.font = `bold ${16 * this.scaleFactor}px Arial`;
        this.ctx.textAlign = "center";
        this.ctx.fillStyle = `${effect.color}${Math.floor((1 - progress) * 255)
          .toString(16)
          .padStart(2, "0")}`;
        this.ctx.fillText(effect.text, effect.x, effect.y);
      } else {
        // Particules pour l'animation de l'effet
        this.ctx.fillStyle = `${effect.color}${Math.floor((1 - progress) * 255)
          .toString(16)
          .padStart(2, "0")}`;

        // Formes différentes selon que c'est un bonus ou un malus
        if (effect.isGood) {
          // Étoiles pour les bonus
          const size = effect.size * (1 - progress * 0.5);
          this.drawStar(effect.x, effect.y, 5, size / 2, size / 4);
        } else {
          // Cercles pour les malus
          this.ctx.beginPath();
          this.ctx.arc(
            effect.x,
            effect.y,
            effect.size * (1 - progress * 0.5),
            0,
            Math.PI * 2
          );
          this.ctx.fill();
        }
      }
    }
  }

  // Dessin du nuage d'orage (malus spécial)
  drawStormCloud() {
    if (!this.activeCloudMalus) return;

    const cloud = this.activeCloudMalus;

    // Dessiner le nuage
    this.ctx.save();

    // Dessiner le corps principal du nuage (gris foncé)
    const gradient = this.ctx.createRadialGradient(
      cloud.x + cloud.width / 2,
      cloud.y + cloud.height / 2,
      10 * this.scaleFactor,
      cloud.x + cloud.width / 2,
      cloud.y + cloud.height / 2,
      cloud.width / 2
    );
    gradient.addColorStop(0, "#4B0082"); // Indigo au centre
    gradient.addColorStop(1, "#000033"); // Bleu très foncé aux bords

    // Forme du nuage (plusieurs cercles combinés)
    this.ctx.fillStyle = gradient;

    // Cercle principal
    this.ctx.beginPath();
    this.ctx.arc(
      cloud.x + cloud.width / 2,
      cloud.y + cloud.height / 2,
      cloud.width / 3,
      0,
      Math.PI * 2
    );
    this.ctx.fill();

    // Cercles supplémentaires pour donner une forme de nuage
    const cloudPoints = [
      {
        x: cloud.x + cloud.width * 0.2,
        y: cloud.y + cloud.height * 0.4,
        r: cloud.width * 0.2,
      },
      {
        x: cloud.x + cloud.width * 0.4,
        y: cloud.y + cloud.height * 0.3,
        r: cloud.width * 0.15,
      },
      {
        x: cloud.x + cloud.width * 0.6,
        y: cloud.y + cloud.height * 0.3,
        r: cloud.width * 0.18,
      },
      {
        x: cloud.x + cloud.width * 0.8,
        y: cloud.y + cloud.height * 0.4,
        r: cloud.width * 0.2,
      },
    ];

    for (const point of cloudPoints) {
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, point.r, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Éclairs occasionnels (effet visuel)
    if (Math.random() < 0.1) {
      this.ctx.strokeStyle = "#FFFF00"; // Jaune vif
      this.ctx.lineWidth = 2 * this.scaleFactor;
      this.ctx.beginPath();

      // Point de départ au centre du nuage
      const startX = cloud.x + cloud.width / 2;
      const startY = cloud.y + cloud.height * 0.8;

      this.ctx.moveTo(startX, startY);

      // Créer un tracé en zigzag
      let x = startX;
      let y = startY;

      for (let i = 0; i < 3; i++) {
        // Calculer le prochain point avec un déplacement aléatoire
        const nextX = x + (Math.random() * 20 - 10) * this.scaleFactor;
        const nextY = y + (10 + Math.random() * 10) * this.scaleFactor;

        this.ctx.lineTo(nextX, nextY);
        x = nextX;
        y = nextY;
      }

      this.ctx.stroke();
    }

    // Dessiner les gouttes/grêlons du nuage
    this.drawCloudDrops(cloud);

    this.ctx.restore();
  }

  // Dessiner et mettre à jour les gouttes du nuage d'orage
  drawCloudDrops(cloud) {
    for (let i = 0; i < cloud.drops.length; i++) {
      const drop = cloud.drops[i];

      // Dessiner la goutte (petit grêlon)
      this.ctx.fillStyle = CLOUD_DROPS_DEFAULT.color;
      this.ctx.beginPath();
      this.ctx.arc(drop.x, drop.y, drop.size / 2, 0, Math.PI * 2);
      this.ctx.fill();

      // Ajouter un effet de brillance
      this.ctx.fillStyle = CLOUD_DROPS_DEFAULT.highlightColor;
      this.ctx.beginPath();
      this.ctx.arc(
        drop.x - drop.size / 4,
        drop.y - drop.size / 4,
        drop.size / 6,
        0,
        Math.PI * 2
      );
      this.ctx.fill();

      // Déplacer la goutte vers le bas
      drop.y += drop.speed;

      // Supprimer les gouttes qui sortent de l'écran
      if (drop.y > this.canvas.height) {
        cloud.drops.splice(i, 1);
        i--;
      }
    }
  }

  // Mise à jour du nuage d'orage
  updateStormCloud() {
    if (!this.activeCloudMalus) return;

    const cloud = this.activeCloudMalus;

    // Déplacer le nuage horizontalement
    cloud.x += cloud.speedX;

    // Inverser la direction si le nuage atteint les bords
    if (cloud.x <= 0 || cloud.x + cloud.width >= this.canvas.width) {
      cloud.speedX *= -1;
    }

    // Faire tomber des grêlons à intervalles réguliers
    const currentTime = Date.now();
    if (currentTime - cloud.lastDropTime > CLOUD_DROPS_DEFAULT.createInterval) {
      // Créer un nouveau grêlon/goutte
      const dropSize =
        (Math.random() *
          (CLOUD_DROPS_DEFAULT.maxSize - CLOUD_DROPS_DEFAULT.minSize) +
          CLOUD_DROPS_DEFAULT.minSize) *
        this.scaleFactor;

      cloud.drops.push({
        x: cloud.x + Math.random() * cloud.width,
        y: cloud.y + cloud.height,
        size: dropSize,
        speed: CLOUD_DROPS_DEFAULT.speed * this.scaleFactor,
      });

      cloud.lastDropTime = currentTime;
    }
  }

  // Activation d'un bonus ou malus
  applyPowerupEffect(powerup, player, cornField) {
    const powerupInfo = POWERUP_TYPES[powerup.type];

    // Enregistrer le bonus/malus récupéré pour le récapitulatif
    this.collectedPowerups.push({
      type: powerup.type,
      name: powerupInfo.name,
      time: new Date().getTime(),
    });

    // Appliquer l'effet en fonction du type
    switch (powerup.type) {
      // Bonus
      case "RAPID_FIRE":
        // Augmenter la cadence de tir (réduire le délai)
        player.setFireRate(PLAYER_DEFAULT.fireRate / 2); // Cadence plus rapide

        // Ajouter à la liste des bonus actifs avec durée
        this.activePowerups.push({
          type: powerup.type,
          endTime: Date.now() + powerupInfo.duration,
          restoreFunction: () => player.setFireRate(PLAYER_DEFAULT.fireRate),
        });
        break;

      case "PARALLEL_BULLETS":
      case "DIAGONAL_BULLETS":
        // Ajouter à la liste des bonus actifs avec durée
        this.activePowerups.push({
          type: powerup.type,
          endTime: Date.now() + powerupInfo.duration,
        });
        break;

      case "SPEED_UP":
        // Augmenter la vitesse du joueur
        player.setSpeed(PLAYER_DEFAULT.speed * 1.5); // Vitesse augmentée

        // Ajouter à la liste des bonus actifs avec durée
        this.activePowerups.push({
          type: powerup.type,
          endTime: Date.now() + powerupInfo.duration,
          restoreFunction: () => player.setSpeed(PLAYER_DEFAULT.speed),
        });
        break;

      case "RECOVER_CORN":
        // Récupérer 5 épis de maïs détruits
        cornField.recoverCorns(5);
        break;

      // Malus
      case "SLOW_DOWN":
        // Réduire la vitesse du joueur
        player.setSpeed(PLAYER_DEFAULT.speed / 2); // Vitesse réduite

        // Ajouter à la liste des malus actifs avec durée
        this.activePowerups.push({
          type: powerup.type,
          endTime: Date.now() + powerupInfo.duration,
          restoreFunction: () => player.setSpeed(PLAYER_DEFAULT.speed),
        });
        break;

      case "STORM_CLOUD":
        // Créer un nuage qui se déplace et fait tomber des grêlons
        this.activeCloudMalus = {
          x: Math.random() * (this.canvas.width - 100 * this.scaleFactor),
          y: 50 * this.scaleFactor,
          width: 120 * this.scaleFactor,
          height: 60 * this.scaleFactor,
          speedX: 1 * this.scaleFactor * (Math.random() > 0.5 ? 1 : -1), // Direction aléatoire
          lastDropTime: 0,
          drops: [], // Grêlons générés par le nuage
          endTime: Date.now() + powerupInfo.duration,
        };
        break;
    }
  }

  // Création d'une animation d'effet lors de la récupération d'un bonus/malus
  createPowerupEffect(powerup) {
    const powerupInfo = POWERUP_TYPES[powerup.type];
    const isGood = powerupInfo.good;
    const effectDuration = 1000; // Durée de l'effet en millisecondes

    // Créer des particules qui représentent l'effet du bonus/malus
    const particleCount = 20;
    const baseSize = powerup.size;

    // Effet spécial pour la récupération de maïs
    if (powerup.type === "RECOVER_CORN") {
      // Animation spéciale pour le bonus de récupération de maïs
      // géré séparément pour afficher les effets sur les épis
    }

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2; // Angle aléatoire
      const distance = (Math.random() * baseSize) / 2; // Distance du centre
      const x = powerup.x + powerup.size / 2 + Math.cos(angle) * distance;
      const y = powerup.y + powerup.size / 2 + Math.sin(angle) * distance;

      this.powerupEffects.push({
        x: x,
        y: y,
        size: Math.random() * 8 * this.scaleFactor + 2 * this.scaleFactor,
        speedX: Math.cos(angle) * (1 + Math.random()) * this.scaleFactor * 2,
        speedY: Math.sin(angle) * (1 + Math.random()) * this.scaleFactor * 2,
        color: powerupInfo.color,
        alpha: 1.0,
        isGood: isGood,
        type: powerup.type,
        startTime: Date.now(),
        duration: effectDuration + Math.random() * 500, // Variation légère de la durée
      });
    }

    // Ajouter un texte flottant qui indique le nom du bonus/malus
    this.powerupEffects.push({
      x: powerup.x + powerup.size / 2,
      y: powerup.y - 20 * this.scaleFactor,
      text: powerupInfo.name,
      color: powerupInfo.color,
      alpha: 1.0,
      speedY: -1 * this.scaleFactor, // Déplacement lent vers le haut
      isGood: isGood,
      type: "TEXT",
      startTime: Date.now(),
      duration: effectDuration * 1.5,
    });
  }

  // Fonction utilitaire pour dessiner une étoile (pour les effets de bonus)
  drawStar(cx, cy, spikes, outerRadius, innerRadius) {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      this.ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      this.ctx.lineTo(x, y);
      rot += step;
    }

    this.ctx.lineTo(cx, cy - outerRadius);
    this.ctx.closePath();
    this.ctx.fill();
  }

  // Vérifier si un bonus spécifique est actif
  isPowerupActive(type) {
    return this.activePowerups.some((powerup) => powerup.type === type);
  }

  // Mise à jour du facteur d'échelle
  updateScaleFactor(newScaleFactor) {
    const scaleRatio = newScaleFactor / this.scaleFactor;
    this.scaleFactor = newScaleFactor;

    // Mettre à jour les bonus/malus existants
    for (const powerup of this.powerups) {
      powerup.size *= scaleRatio;
      powerup.speed *= scaleRatio;
    }

    // Mettre à jour les effets existants
    for (const effect of this.powerupEffects) {
      if (effect.size) effect.size *= scaleRatio;
      if (effect.speedX) effect.speedX *= scaleRatio;
      if (effect.speedY) effect.speedY *= scaleRatio;
    }

    // Mettre à jour le nuage d'orage s'il est actif
    if (this.activeCloudMalus) {
      this.activeCloudMalus.width *= scaleRatio;
      this.activeCloudMalus.height *= scaleRatio;
      this.activeCloudMalus.speedX *= scaleRatio;

      // Mettre à jour les gouttes du nuage
      for (const drop of this.activeCloudMalus.drops) {
        drop.size *= scaleRatio;
        drop.speed *= scaleRatio;
      }
    }
  }
}
