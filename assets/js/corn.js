// corn.js - Gestion des épis de maïs

import {
  CORN_COUNT,
  CORN_DEFAULT,
  ANIMATION,
  CORN_COLORS,
} from "./constants.js";

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
        width: cornWidth - CORN_DEFAULT.gap, // Petit espace entre les épis
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
        this.ctx.fillStyle = CORN_COLORS.stem; // Vert
        const stemWidth = CORN_DEFAULT.stemWidth * this.scaleFactor;
        this.ctx.fillRect(
          stalk.x + stalk.width / 2 - stemWidth / 2,
          stalk.y + CORN_DEFAULT.stemOffsetY * this.scaleFactor,
          stemWidth,
          stalk.height - CORN_DEFAULT.stemOffsetY * this.scaleFactor
        );

        // Épi de maïs (forme cylindrique jaune)
        this.ctx.fillStyle = CORN_COLORS.cob; // Jaune maïs
        this.ctx.beginPath();
        this.ctx.ellipse(
          stalk.x + stalk.width / 2,
          stalk.y + CORN_DEFAULT.stemOffsetY * this.scaleFactor,
          stalk.width / CORN_DEFAULT.clobWidth,
          CORN_DEFAULT.clobHeight * this.scaleFactor,
          0,
          0,
          Math.PI * 2
        );
        this.ctx.fill();

        // Soies du maïs (filaments marrons au sommet)
        this.ctx.fillStyle = CORN_COLORS.silk; // Marron
        this.ctx.beginPath();
        this.ctx.ellipse(
          stalk.x + stalk.width / 2,
          stalk.y,
          stalk.width / CORN_DEFAULT.silkRadius,
          CORN_DEFAULT.silkHeight * this.scaleFactor,
          0,
          0,
          Math.PI * 2
        );
        this.ctx.fill();

        // Grains de maïs (points)
        this.ctx.fillStyle = CORN_COLORS.grain; // Jaune doré
        for (let i = 0; i < CORN_DEFAULT.grainCountY; i++) {
          for (let j = 0; j < CORN_DEFAULT.grainCountX; j++) {
            this.ctx.beginPath();
            this.ctx.arc(
              stalk.x +
                stalk.width / 2 -
                CORN_DEFAULT.grainSpacingX * this.scaleFactor +
                j * CORN_DEFAULT.grainSpacingX * this.scaleFactor,
              stalk.y +
                CORN_DEFAULT.stemOffsetY * this.scaleFactor +
                i * CORN_DEFAULT.grainSpacingY * this.scaleFactor,
              CORN_DEFAULT.grainRadius * this.scaleFactor,
              0,
              Math.PI * 2
            );
            this.ctx.fill();
          }
        }

        // Feuilles de maïs
        this.ctx.fillStyle = CORN_COLORS.leaf; // Vert clair
        this.ctx.beginPath();
        this.ctx.moveTo(
          stalk.x + stalk.width / 2,
          stalk.y + CORN_DEFAULT.leafOffset1 * this.scaleFactor
        );
        this.ctx.quadraticCurveTo(
          stalk.x +
            stalk.width / 2 -
            CORN_DEFAULT.leafOffset1 * this.scaleFactor,
          stalk.y + CORN_DEFAULT.leafOffset2 * this.scaleFactor,
          stalk.x +
            stalk.width / 2 -
            CORN_DEFAULT.leafOffset2 * this.scaleFactor,
          stalk.y + CORN_DEFAULT.leafOffset1 * this.scaleFactor
        );
        this.ctx.lineTo(
          stalk.x + stalk.width / 2,
          stalk.y + CORN_DEFAULT.leafOffset3 * this.scaleFactor
        );
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.moveTo(
          stalk.x + stalk.width / 2,
          stalk.y + CORN_DEFAULT.leafOffset2 * this.scaleFactor
        );
        this.ctx.quadraticCurveTo(
          stalk.x +
            stalk.width / 2 +
            CORN_DEFAULT.leafOffset1 * this.scaleFactor,
          stalk.y + CORN_DEFAULT.leafOffset3 * this.scaleFactor,
          stalk.x +
            stalk.width / 2 +
            CORN_DEFAULT.leafOffset2 * this.scaleFactor,
          stalk.y + CORN_DEFAULT.leafOffset2 * this.scaleFactor
        );
        this.ctx.lineTo(
          stalk.x + stalk.width / 2,
          stalk.y + CORN_DEFAULT.leafOffset4 * this.scaleFactor
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
      color: CORN_COLORS.cob, // Couleur de départ (jaune comme le maïs)
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
      const brownValue = Math.floor(
        CORN_COLORS.dyingRedEnd * (1 - corn.alpha) +
          CORN_COLORS.dyingRedStart * corn.alpha
      );
      const greenValue = Math.floor(
        CORN_COLORS.dyingGreenEnd * (1 - corn.alpha) +
          CORN_COLORS.dyingGreenStart * corn.alpha
      );
      const redValue = Math.floor(
        CORN_COLORS.dyingBlueValue * (1 - corn.alpha) +
          CORN_COLORS.dyingRedStart * corn.alpha
      );

      // Dessiner l'épi qui se fane
      // Tige de l'épi (qui devient marron progressivement)
      this.ctx.fillStyle = `rgba(${redValue}, ${greenValue}, ${CORN_COLORS.dyingBlueValue}, ${corn.alpha})`;
      const stemWidth = CORN_DEFAULT.stemWidth * this.scaleFactor;
      this.ctx.fillRect(-stemWidth / 2, -corn.height, stemWidth, corn.height);

      // Épi de maïs (qui devient marron progressivement)
      this.ctx.fillStyle = `rgba(${redValue}, ${greenValue}, ${CORN_COLORS.dyingBlueValue}, ${corn.alpha})`;
      this.ctx.beginPath();
      this.ctx.ellipse(
        0,
        -corn.height + CORN_DEFAULT.stemOffsetY * this.scaleFactor,
        corn.width / CORN_DEFAULT.clobWidth,
        CORN_DEFAULT.clobHeight * this.scaleFactor,
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
  recoverCorns(count = CORN_DEFAULT.recoverCount) {
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
