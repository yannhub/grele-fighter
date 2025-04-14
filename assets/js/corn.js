// corn.js - Gestion des épis de maïs

import { CORN_COUNT, CORN_DEFAULT, ANIMATION } from "./constants.js";

export default class CornField {
  constructor(canvas, ctx, scaleFactor) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.scaleFactor = scaleFactor;
    this.cornStalks = [];
    this.dyingCorns = []; // Animation des épis qui se fanent
    this.init();
  }

  // Initialise les épis de maïs
  init() {
    this.cornStalks = [];
    const cornWidth = Math.floor(this.canvas.width / CORN_COUNT);
    const cornHeight = CORN_DEFAULT.height * this.scaleFactor;

    for (let i = 0; i < CORN_COUNT; i++) {
      this.cornStalks.push({
        x: i * cornWidth,
        y: this.canvas.height - cornHeight,
        width: cornWidth - 2, // Petit espace entre les épis
        height: cornHeight,
        alive: true,
      });
    }
  }

  // Dessine tous les épis de maïs
  draw() {
    // Dessiner les épis de maïs vivants
    this.drawCorns();

    // Dessiner les animations d'épis mourants
    this.drawDyingCorns();
  }

  // Dessine les épis de maïs
  drawCorns() {
    for (const stalk of this.cornStalks) {
      if (stalk.alive) {
        // Tige de l'épi
        this.ctx.fillStyle = "#4CAF50"; // Vert
        const stemWidth = 4 * this.scaleFactor;
        this.ctx.fillRect(
          stalk.x + stalk.width / 2 - stemWidth / 2,
          stalk.y + 10 * this.scaleFactor,
          stemWidth,
          stalk.height - 10 * this.scaleFactor
        );

        // Épi de maïs (forme cylindrique jaune)
        this.ctx.fillStyle = "#FFC107"; // Jaune maïs
        this.ctx.beginPath();
        this.ctx.ellipse(
          stalk.x + stalk.width / 2,
          stalk.y + 10 * this.scaleFactor,
          stalk.width / 3,
          15 * this.scaleFactor,
          0,
          0,
          Math.PI * 2
        );
        this.ctx.fill();

        // Soies du maïs (filaments marrons au sommet)
        this.ctx.fillStyle = "#8D6E63"; // Marron
        this.ctx.beginPath();
        this.ctx.ellipse(
          stalk.x + stalk.width / 2,
          stalk.y,
          stalk.width / 6,
          5 * this.scaleFactor,
          0,
          0,
          Math.PI * 2
        );
        this.ctx.fill();

        // Grains de maïs (points)
        this.ctx.fillStyle = "#FFD54F"; // Jaune doré
        for (let i = 0; i < 8; i++) {
          for (let j = 0; j < 3; j++) {
            this.ctx.beginPath();
            this.ctx.arc(
              stalk.x +
                stalk.width / 2 -
                5 * this.scaleFactor +
                j * 5 * this.scaleFactor,
              stalk.y + 7 * this.scaleFactor + i * 2 * this.scaleFactor,
              1 * this.scaleFactor,
              0,
              Math.PI * 2
            );
            this.ctx.fill();
          }
        }

        // Feuilles de maïs
        this.ctx.fillStyle = "#66BB6A"; // Vert clair
        this.ctx.beginPath();
        this.ctx.moveTo(
          stalk.x + stalk.width / 2,
          stalk.y + 20 * this.scaleFactor
        );
        this.ctx.quadraticCurveTo(
          stalk.x + stalk.width / 2 - 15 * this.scaleFactor,
          stalk.y + 30 * this.scaleFactor,
          stalk.x + stalk.width / 2 - 25 * this.scaleFactor,
          stalk.y + 25 * this.scaleFactor
        );
        this.ctx.lineTo(
          stalk.x + stalk.width / 2,
          stalk.y + 35 * this.scaleFactor
        );
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.moveTo(
          stalk.x + stalk.width / 2,
          stalk.y + 25 * this.scaleFactor
        );
        this.ctx.quadraticCurveTo(
          stalk.x + stalk.width / 2 + 15 * this.scaleFactor,
          stalk.y + 35 * this.scaleFactor,
          stalk.x + stalk.width / 2 + 25 * this.scaleFactor,
          stalk.y + 30 * this.scaleFactor
        );
        this.ctx.lineTo(
          stalk.x + stalk.width / 2,
          stalk.y + 40 * this.scaleFactor
        );
        this.ctx.fill();
      }
    }
  }

  // Crée une animation d'épi mourant
  createDyingCorn(x, y, width, height) {
    this.dyingCorns.push({
      x: x,
      y: y,
      width: width,
      height: height,
      alpha: 1.0, // Opacité initiale
      rotation: 0,
      color: "#FFC107", // Couleur de départ (jaune comme le maïs)
    });
  }

  // Dessine les animations des épis mourants
  drawDyingCorns() {
    for (let i = 0; i < this.dyingCorns.length; i++) {
      const corn = this.dyingCorns[i];

      // Sauvegarder le contexte pour appliquer la rotation
      this.ctx.save();

      // Déplacer le point d'origine à la base de l'épi de maïs
      this.ctx.translate(corn.x + corn.width / 2, corn.y + corn.height);

      // Appliquer la rotation (pencher progressivement l'épi)
      this.ctx.rotate(corn.rotation);

      // Calculer la couleur intermédiaire entre jaune et marron
      const brownValue = Math.floor(139 * (1 - corn.alpha) + 255 * corn.alpha);
      const greenValue = Math.floor(69 * (1 - corn.alpha) + 193 * corn.alpha);
      const redValue = Math.floor(19 * (1 - corn.alpha) + 255 * corn.alpha);

      // Dessiner l'épi qui se fane
      // Tige de l'épi (qui devient marron progressivement)
      this.ctx.fillStyle = `rgba(${redValue}, ${greenValue}, 19, ${corn.alpha})`;
      const stemWidth = 4 * this.scaleFactor;
      this.ctx.fillRect(-stemWidth / 2, -corn.height, stemWidth, corn.height);

      // Épi de maïs (qui devient marron progressivement)
      this.ctx.fillStyle = `rgba(${redValue}, ${greenValue}, 19, ${corn.alpha})`;
      this.ctx.beginPath();
      this.ctx.ellipse(
        0,
        -corn.height + 10 * this.scaleFactor,
        corn.width / 3,
        15 * this.scaleFactor,
        0,
        0,
        Math.PI * 2
      );
      this.ctx.fill();

      // Restaurer le contexte
      this.ctx.restore();

      // Faire évoluer l'animation
      corn.alpha -= ANIMATION.dyingCornFade; // Diminuer l'opacité lentement
      corn.rotation += ANIMATION.dyingCornRotation; // Augmenter la rotation (pencher l'épi)

      // Supprimer l'épi fané une fois que l'animation est terminée
      if (corn.alpha <= 0) {
        this.dyingCorns.splice(i, 1);
        i--;
      }
    }
  }

  // Récupère le nombre d'épis vivants
  getAliveCornCount() {
    return this.cornStalks.filter((stalk) => stalk.alive).length;
  }

  // Vérifie si tous les épis sont morts
  areAllCornsDead() {
    return this.getAliveCornCount() === 0;
  }

  // Récupération d'épis détruits (pour le bonus RECOVER_CORN)
  recoverCorns(count = 5) {
    // Collecter tous les indices des épis détruits
    const deadCornIndices = this.cornStalks
      .map((stalk, index) => ({ stalk, index }))
      .filter((item) => !item.stalk.alive)
      .map((item) => item.index);

    // Si aucun épi détruit, rien à faire
    if (deadCornIndices.length === 0) return 0;

    // Mélanger les indices pour créer une distribution éparse
    for (let i = deadCornIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deadCornIndices[i], deadCornIndices[j]] = [
        deadCornIndices[j],
        deadCornIndices[i],
      ];
    }

    // Récupérer jusqu'à 'count' épis de manière aléatoire
    const cornToRecover = Math.min(count, deadCornIndices.length);
    for (let i = 0; i < cornToRecover; i++) {
      this.cornStalks[deadCornIndices[i]].alive = true;
    }

    return cornToRecover;
  }

  // Mise à jour du scaleFactor
  updateScaleFactor(newScaleFactor) {
    this.scaleFactor = newScaleFactor;
    this.init();
  }
}
