// creperie-auto-player.js — Joueur automatique du bonus "Assurance G2S"

import {
  BONUS_AUTO_SPEED_RATIO,
  IT,
  KITCHEN_BOTTOM_LANE_Y_RATIO,
  KITCHEN_TOP_LANE_Y_RATIO,
  PLAYER_SPEED,
  ST,
} from "./creperie-constants.js";
import { BILIG_STATE } from "./creperie-stations.js";

const TOPPING_TYPES = new Set([
  IT.BUTTER,
  IT.SUGAR,
  IT.CHOCOLATE,
  IT.STRAWBERRY,
  IT.LEMON,
  IT.WHIPPED_CREAM,
]);

// Stations du comptoir HAUT (l'assistant doit y monter)
const TOP_COUNTER_TYPES = new Set([
  ST.BATTER,
  ST.BILIG,
  ST.BUTTER,
  ST.SUGAR,
  ST.CHOCOLATE,
  ST.STRAWBERRY,
  ST.LEMON,
  ST.WHIPPED_CREAM,
  ST.DELIVERY,
]);

export class AssuranceAutoPlayer {
  constructor(canvasWidth, canvasHeight, assignedBilig, laneConfig) {
    this.x = assignedBilig
      ? assignedBilig.x + assignedBilig.w / 2
      : canvasWidth * 0.25;

    // L'assistant commence sur la lane basse (près de son bilig)
    const bottomLaneY = laneConfig
      ? laneConfig.kitchenBottomLaneY
      : canvasHeight * KITCHEN_BOTTOM_LANE_Y_RATIO;
    this.y = bottomLaneY;

    this.hands = [];
    this.speed = PLAYER_SPEED * BONUS_AUTO_SPEED_RATIO;
    this.size = 60;
    this.direction = 1;
    this.isMoving = false;
    this.walkFrame = 0;

    // Bilig assigné (exclusif à cet assistant)
    this.assignedBilig = assignedBilig || null;
    this.myBilig = assignedBilig || null;

    // Lanes Y
    this._topLaneY = laneConfig
      ? laneConfig.kitchenTopLaneY
      : canvasHeight * KITCHEN_TOP_LANE_Y_RATIO;
    this._bottomLaneY = bottomLaneY;

    // Target Y pour le déplacement 2D
    this.targetLaneY = this._bottomLaneY;

    // State
    this.targetStation = null;
    this.pendingToppings = [];
    this.interactCooldown = 0;

    // Client actuellement targété (pour flag visuel)
    this.targetCustomer = null;
  }

  onResize(W, H) {
    // Les lanes sont recalculées depuis les constantes
    this._topLaneY = H * KITCHEN_TOP_LANE_Y_RATIO;
    this._bottomLaneY = H * KITCHEN_BOTTOM_LANE_Y_RATIO;
    if (this.assignedBilig) {
      this.x = this.assignedBilig.x + this.assignedBilig.w / 2;
    }
    // Ajuster Y à la lane cible actuelle
    if (
      Math.abs(this.y - this._topLaneY) < Math.abs(this.y - this._bottomLaneY)
    ) {
      this.y = this._topLaneY;
    } else {
      this.y = this._bottomLaneY;
    }
  }

  update(dt, stations, customerManager, game) {
    if (this.isMoving) this.walkFrame = (this.walkFrame + dt / 80) % 8;
    this.interactCooldown = Math.max(0, this.interactCooldown - dt);

    const arrived = this._move(dt);

    if (arrived && this.targetStation && this.interactCooldown === 0) {
      this._doInteract(stations, customerManager, game);
    }

    if (!this.targetStation && this.interactCooldown === 0) {
      this._decideNextTask(stations, customerManager, game);
    }
  }

  // ── Mouvement 2D ─────────────────────────────────────────────────────────
  _move(dt) {
    if (!this.targetStation) {
      this.isMoving = false;
      return false;
    }
    const tx = this.targetStation.x + this.targetStation.w / 2;
    const ty = this.targetLaneY;
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 5) {
      this.x = tx;
      this.y = ty;
      this.isMoving = false;
      return true;
    }

    const step = this.speed * (dt / 1000);
    const nx = dx / dist;
    const ny = dy / dist;
    this.x += nx * Math.min(step, dist);
    this.y += ny * Math.min(step, dist);
    this.direction = dx > 0 ? 1 : -1;
    this.isMoving = true;
    return false;
  }

  // ── Détermine la lane Y cible selon le type de station ──────────────────
  _setTargetStation(station) {
    this.targetStation = station;
    if (!station) return;
    // Biligs assistants et stations du comptoir bas → lane basse
    if (station.isAssistantBilig || !TOP_COUNTER_TYPES.has(station.type)) {
      this.targetLaneY = this._bottomLaneY;
    } else {
      // Stations du comptoir haut → lane haute
      this.targetLaneY = this._topLaneY;
    }
  }

  // ── Interaction ──────────────────────────────────────────────────────────
  _doInteract(stations, customerManager, game) {
    const s = this.targetStation;
    const result = s.interact(this.hands);
    this.interactCooldown = 200;

    switch (result.action) {
      case "give": {
        if (this.hands.length < 3) {
          this.hands.push(result.item);
          if (TOPPING_TYPES.has(result.item.type)) {
            const idx = this.pendingToppings.indexOf(result.item.type);
            if (idx >= 0) this.pendingToppings.splice(idx, 1);
          }
        }
        this.targetStation = null;
        break;
      }
      case "take":
        this.hands.splice(result.itemIndex, 1);
        this.targetStation = null;
        break;

      case "deposit_toppings":
        result.toppingItems.forEach((item) => {
          const idx = this.hands.indexOf(item);
          if (idx >= 0) this.hands.splice(idx, 1);
        });
        this.targetStation = null;
        break;

      case "take_for_delivery": {
        this.hands.splice(result.itemIndex, 1);
        const toppings = result.crepe.toppings || [];
        const match = customerManager.tryMatch(toppings);
        if (match) {
          match.handledByAssistant = false;
          if (this.targetCustomer === match) this.targetCustomer = null;
          const pts = game._calcPoints(match);
          game.score += pts;
          game.crepesServed++;
          game.scoreFlashTimer = 600;
          s.acceptDelivery();
          const label = match.recipe.label;
          if (!game.recipeBreakdown[label]) {
            game.recipeBreakdown[label] = {
              count: 0,
              points: 0,
              basePoints: match.recipe.points,
            };
          }
          game.recipeBreakdown[label].count++;
          game.recipeBreakdown[label].points += pts;
          if (game.waiter) {
            const tableIndex = match.tableIndex;
            game.waiter.addDelivery(match, result.crepe, () => {
              const W = game.canvas.width;
              const { TABLE_POSITIONS } = game._tablePositions || {};
              // Fallback: popup à la station
              const fx = s.x + s.w / 2;
              const fy = s.y - 20;
              game._spawnFloatingText(`+${pts}`, fx, fy, "#2ECC71");
            });
          } else {
            match.state = "leaving_happy";
            game._spawnFloatingText(
              `+${pts}`,
              s.x + s.w / 2,
              s.y - 20,
              "#2ECC71",
            );
          }
        } else {
          // Donation automatique : libérer la station immédiatement
          s.acceptDelivery();
          game.donationCount++;
          game.score += 1;
          s.flash("#FF8C00");
          game._spawnFloatingText("+1 🫶", s.x + s.w / 2, s.y - 20, "#FF8C00");
          game.renderer.addParticles(s.x + s.w / 2, s.y, "#FF8C00", 8);
          this.interactCooldown = 400;
        }
        this.targetStation = null;
        break;
      }

      case "retrieve_rejected":
        if (this.hands.length < 3) this.hands.push(result.item);
        // Marquer la crêpe comme rejetée pour la diriger vers le don
        result.item._rejected = true;
        this.targetStation = null;
        break;

      case "donation":
        // Le don a été effectué : vider les items donnés
        this.hands = [];
        game.donationCount++;
        game.score += 1;
        this.targetStation = null;
        break;

      default:
        this.targetStation = null;
        this.interactCooldown = 350;
        break;
    }
  }

  // ── Décision ─────────────────────────────────────────────────────────────
  _decideNextTask(stations, customerManager, game) {
    // Priorité 0 : crêpe rejetée en main → aller au don
    const rejectedCrepe = this.hands.find(
      (h) => h.type === IT.ASSEMBLED_CREPE && h._rejected,
    );
    if (rejectedCrepe) {
      const donation = stations.find((s) => s.type === ST.DONATION);
      if (donation) {
        this._setTargetStation(donation);
        return;
      }
      // Pas de station de don disponible : jeter
      this.hands = this.hands.filter((h) => h !== rejectedCrepe);
    }
    // Priorité 1 : livrer la crêpe prête
    if (this.hands.some((h) => h.type === IT.ASSEMBLED_CREPE)) {
      const delivery = stations.find((s) => s.type === ST.DELIVERY);
      if (delivery) {
        this._setTargetStation(delivery);
        return;
      }
    }

    // Priorité 2 : mon bilig assigné est PRÊT → aller récupérer
    if (
      this.assignedBilig &&
      this.assignedBilig.biligState === BILIG_STATE.READY
    ) {
      this.myBilig = this.assignedBilig;
      this._setTargetStation(this.assignedBilig);
      return;
    }

    // Si mon bilig est en feu, libérer le client ciblé
    if (
      this.assignedBilig &&
      this.assignedBilig.biligState === BILIG_STATE.BURNING
    ) {
      if (this.targetCustomer) {
        this.targetCustomer.handledByAssistant = false;
        this.targetCustomer = null;
      }
      this.pendingToppings = [];
      this.hands = this.hands.filter(
        (h) => h.type !== IT.BATTER && h.type !== IT.ASSEMBLED_CREPE,
      );
      this.interactCooldown = 600;
      return;
    }

    // Priorité 3 : mon bilig cuit + j'ai des toppings à déposer
    if (
      this.assignedBilig &&
      this.assignedBilig.biligState === BILIG_STATE.COOKING &&
      this.hands.some((h) => TOPPING_TYPES.has(h.type)) &&
      this.pendingToppings.length === 0
    ) {
      this._setTargetStation(this.assignedBilig);
      return;
    }

    // Priorité 4 : mon bilig cuit + toppings encore à collecter
    if (
      this.assignedBilig &&
      this.assignedBilig.biligState === BILIG_STATE.COOKING &&
      this.pendingToppings.length > 0
    ) {
      const nextTopping = this.pendingToppings[0];
      const toppingStation = stations.find((s) => s.type === nextTopping);
      if (toppingStation) {
        this._setTargetStation(toppingStation);
        return;
      }
      this.pendingToppings.shift();
      return;
    }

    // Priorité 5 : mon bilig cuit, plus rien à faire → attendre
    if (
      this.assignedBilig &&
      this.assignedBilig.biligState === BILIG_STATE.COOKING
    ) {
      this.interactCooldown = 400;
      return;
    }

    // Priorité 6 : j'ai la pâte → aller à mon bilig assigné
    if (this.hands.some((h) => h.type === IT.BATTER)) {
      if (
        this.assignedBilig &&
        this.assignedBilig.biligState === BILIG_STATE.EMPTY
      ) {
        this.myBilig = this.assignedBilig;
        this._setTargetStation(this.assignedBilig);
        return;
      }
      this.interactCooldown = 500;
      return;
    }

    // Priorité 7 : démarrer une nouvelle crêpe pour le client le plus urgent
    // Ne prendre une commande que s'il en reste au moins 2 pour le joueur
    const seated = customerManager.customers.filter(
      (c) => c.state === "seated" && !c.handledByAssistant,
    );
    if (seated.length <= 1) {
      this.interactCooldown = 500;
      return;
    }

    seated.sort((a, b) => a.patienceRemaining - b.patienceRemaining);
    const target = seated[0];
    target.handledByAssistant = true;
    this.targetCustomer = target;
    this.pendingToppings = [...target.recipe.toppings];
    this.myBilig = this.assignedBilig || null;

    const batterStation = stations.find((s) => s.type === ST.BATTER);
    if (batterStation) this._setTargetStation(batterStation);
  }
}
