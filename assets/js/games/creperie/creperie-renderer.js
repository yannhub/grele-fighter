// creperie-renderer.js — Rendu complet du jeu Crêperie (dessin procédural Canvas 2D)
// Style graphique Overcooked : gradients, cel-shading outlines, ombres portées, éclairage ambiant
// Les rendus sont délégués aux sous-fichiers dans le dossier renderers/

import {
  BOTTOM_COUNTER_HEIGHT_RATIO,
  BOTTOM_COUNTER_Y_RATIO,
  COUNTER_HEIGHT_RATIO,
  COUNTER_Y_RATIO,
  HUD_H,
  PASSAGE_X_RATIO,
} from "./creperie-constants.js";

import { drawAmbientLighting } from "./renderers/renderer-ambient.js";
import { drawBackground } from "./renderers/renderer-background.js";
import {
  drawBottomCounter,
  drawTopCounter,
} from "./renderers/renderer-counter.js";
import {
  drawContracts,
  drawCustomers,
} from "./renderers/renderer-customers.js";
import { drawFurniture } from "./renderers/renderer-furniture.js";
import {
  addParticles as _addParticles,
  updateParticles as _updateParticles,
  drawFloatingTexts,
  drawHUD,
  drawParticles,
} from "./renderers/renderer-hud.js";
import {
  drawAutoPlayer,
  drawFirefighterPlayer,
  drawPlayer,
} from "./renderers/renderer-player.js";
import {
  drawBottomStations,
  drawStations,
} from "./renderers/renderer-stations.js";
import { drawWaiter } from "./renderers/renderer-waiter.js";

// ─── Renderer ────────────────────────────────────────────────────────────────
export class CreperieRenderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.particles = [];
    this._time = 0;
  }

  onResize() {}

  render(
    canvas,
    stations,
    bottomStations,
    player,
    customerManager,
    score,
    displayScore,
    scoreFlashTimer,
    timeLeft,
    heartsLeft,
    maxHearts,
    floatingTexts,
    assistants = [],
    assistanceBiligs = [],
    g2sContracts = [],
    firefighter = null,
    waiter = null,
    donationCount = 0,
    hasActiveFire = false,
  ) {
    const W = canvas.width;
    const H = canvas.height;
    const ctx = this.ctx;
    this._time = Date.now();

    // ── Fond de canvas (couleur de base pour la bande HUD) ──────────────────
    ctx.fillStyle = "#1A0A05";
    ctx.fillRect(0, 0, W, HUD_H);

    // ── Tout le jeu est décalé de HUD_H vers le bas ─────────────────────────
    ctx.save();
    ctx.translate(0, HUD_H);
    const gameH = H - HUD_H;

    const counterY = gameH * COUNTER_Y_RATIO;
    const counterH = gameH * COUNTER_HEIGHT_RATIO;
    const passageX = W * PASSAGE_X_RATIO;
    const bottomCounterY = gameH * BOTTOM_COUNTER_Y_RATIO;
    const bottomCounterH = gameH * BOTTOM_COUNTER_HEIGHT_RATIO;

    // Fond de base
    ctx.fillStyle = "#E8D0B0";
    ctx.fillRect(0, 0, W, gameH);

    drawBackground(
      ctx,
      W,
      gameH,
      counterY,
      counterH,
      bottomCounterY,
      bottomCounterH,
      this._time,
    );
    drawFurniture(ctx, W, counterY, customerManager);
    drawCustomers(ctx, W, counterY, customerManager.customers, this._time);
    // Contrats G2S dans la salle
    drawContracts(ctx, g2sContracts, this._time);

    if (waiter)
      drawWaiter(ctx, waiter, W, gameH, counterY, counterH, this._time);

    // Comptoir haut (s'arrête au passage)
    drawTopCounter(ctx, W, counterY, counterH, passageX);
    // Comptoir bas (pleine largeur)
    drawBottomCounter(ctx, W, bottomCounterY, bottomCounterH);

    // Stations comptoir haut
    drawStations(
      ctx,
      stations,
      counterY,
      counterH,
      this._time,
      player.currentStation,
    );

    // Biligs des assistants + stations du bas (CALL_G2S, DON)
    drawBottomStations(
      ctx,
      assistanceBiligs,
      bottomStations,
      bottomCounterY,
      bottomCounterH,
      this._time,
      player.currentStation,
      assistants,
      hasActiveFire,
    );

    drawPlayer(ctx, player, counterY, counterH, this._time);

    // Assistants crépiers
    assistants.forEach((a) => {
      drawAutoPlayer(ctx, a.player, counterY, this._time);
    });

    // Pompier G2S
    if (firefighter) drawFirefighterPlayer(ctx, firefighter, this._time);

    drawParticles(ctx, this.particles);

    // Textes flottants (score au niveau des clients dans la salle)
    drawFloatingTexts(ctx, floatingTexts);

    drawAmbientLighting(ctx, W, gameH, counterY);

    ctx.restore();

    // ── HUD dédié (dessiné HORS de la translation, en haut du canvas) ───────
    drawHUD(
      ctx,
      W,
      H,
      score,
      displayScore,
      scoreFlashTimer,
      timeLeft,
      heartsLeft,
      maxHearts,
      assistants.length,
      donationCount,
    );
  }

  addParticles(x, y, color, count = 10) {
    _addParticles(this.particles, x, y, color, count);
  }

  updateParticles(dt) {
    this.particles = _updateParticles(this.particles, dt);
  }
}
