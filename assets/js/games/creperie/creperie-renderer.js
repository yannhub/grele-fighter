// creperie-renderer.js — Rendu complet du jeu Crêperie (dessin procédural Canvas 2D)
// Style graphique Overcooked : gradients, cel-shading outlines, ombres portées, éclairage ambiant
// Les rendus sont délégués aux sous-fichiers dans le dossier renderers/

import { COUNTER_HEIGHT_RATIO, COUNTER_Y_RATIO } from "./creperie-constants.js";

import { drawAmbientLighting } from "./renderers/renderer-ambient.js";
import { drawBackground } from "./renderers/renderer-background.js";
import { drawCounter } from "./renderers/renderer-counter.js";
import { drawCustomers } from "./renderers/renderer-customers.js";
import { drawFurniture } from "./renderers/renderer-furniture.js";
import {
  addParticles as _addParticles,
  updateParticles as _updateParticles,
  drawDeliveryFeedback,
  drawHUD,
  drawParticles,
} from "./renderers/renderer-hud.js";
import {
  drawAutoPlayer,
  drawBonusIndicator,
  drawPlayer,
} from "./renderers/renderer-player.js";
import { drawStations } from "./renderers/renderer-stations.js";
import { drawWaiter } from "./renderers/renderer-waiter.js";

// ─── Renderer ────────────────────────────────────────────────────────────────
export class CreperieRenderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.deliveryFeedback = null;
    this.particles = [];
    this._time = 0;
  }

  onResize() {}

  render(
    canvas,
    stations,
    player,
    customerManager,
    score,
    timeLeft,
    heartsLeft,
    maxHearts,
    deliveryFeedback,
    autoPlayer = null,
    bonusTimer = null,
    waiter = null,
  ) {
    const W = canvas.width;
    const H = canvas.height;
    const ctx = this.ctx;
    const counterY = H * COUNTER_Y_RATIO;
    const counterH = H * COUNTER_HEIGHT_RATIO;
    this._time = Date.now();

    ctx.clearRect(0, 0, W, H);

    drawBackground(ctx, W, H, counterY, counterH, this._time);
    drawFurniture(ctx, W, counterY, customerManager);
    drawCustomers(ctx, W, counterY, customerManager.customers, this._time);
    if (waiter) drawWaiter(ctx, waiter, W, H, counterY, counterH, this._time);
    drawCounter(ctx, W, counterY, counterH);
    drawStations(
      ctx,
      stations,
      counterY,
      counterH,
      this._time,
      player.currentStation,
    );
    drawPlayer(ctx, player, counterY, counterH, this._time);
    if (autoPlayer) drawAutoPlayer(ctx, autoPlayer, counterY, this._time);
    drawParticles(ctx, this.particles);
    drawDeliveryFeedback(ctx, deliveryFeedback);
    drawHUD(ctx, W, H, score, timeLeft, heartsLeft, maxHearts);
    if (bonusTimer !== null)
      drawBonusIndicator(ctx, W, H, bonusTimer, this._time);
    drawAmbientLighting(ctx, W, H, counterY);
  }

  addParticles(x, y, color, count = 10) {
    _addParticles(this.particles, x, y, color, count);
  }

  updateParticles(dt) {
    this.particles = _updateParticles(this.particles, dt);
  }
}
