// creperie-auto-player.js — Joueur automatique du bonus "Assurance G2S"

import {
  BONUS_AUTO_SPEED_RATIO,
  IT,
  PLAYER_SPEED,
  PLAYER_Y_RATIO,
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

export class AssuranceAutoPlayer {
  constructor(canvasWidth, canvasHeight) {
    this.x = canvasWidth * 0.25;
    this.y = canvasHeight * PLAYER_Y_RATIO;
    this.hands = [];
    this.speed = PLAYER_SPEED * BONUS_AUTO_SPEED_RATIO;
    this.size = 60;
    this.direction = 1;
    this.isMoving = false;
    this.walkFrame = 0;

    // State
    this.targetStation = null; // station to move toward
    this.myBilig = null; // bilig currently claimed
    this.pendingToppings = []; // toppings still to collect for current recipe
    this.interactCooldown = 0; // ms before next interaction attempt
  }

  onResize(W, H) {
    this.y = H * PLAYER_Y_RATIO;
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

  // ── Mouvement ────────────────────────────────────────────────────────────────
  _move(dt) {
    if (!this.targetStation) {
      this.isMoving = false;
      return false;
    }
    const tx = this.targetStation.x + this.targetStation.w / 2;
    const dx = tx - this.x;
    if (Math.abs(dx) < 4) {
      this.isMoving = false;
      this.x = tx;
      return true;
    }
    const step =
      Math.sign(dx) * Math.min(Math.abs(dx), (this.speed * dt) / 1000);
    this.x += step;
    this.direction = Math.sign(dx);
    this.isMoving = true;
    return false;
  }

  // ── Interaction ──────────────────────────────────────────────────────────────
  _doInteract(stations, customerManager, game) {
    const s = this.targetStation;
    const result = s.interact(this.hands);
    this.interactCooldown = 200;

    switch (result.action) {
      case "give": {
        if (this.hands.length < 3) {
          this.hands.push(result.item);
          // Si c'est un topping collecté, on le retire de la liste en attente
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
          const pts = game._calcPoints(match);
          game.score += pts;
          game.crepesServed++;
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
          const fx = s.x + s.w / 2;
          const fy = s.y - 20;
          game._showDeliveryFeedback(`+${pts} pts 🛡️`, "#E30613", fx, fy);
          game.renderer.addParticles(fx, fy, "#E30613", 12);
          // Serveur NPC livre la crêpe
          if (game.waiter) {
            game.waiter.addDelivery(match, result.crepe);
          } else {
            match.state = "leaving_happy";
          }
        } else {
          s.rejectDelivery();
          // Récupère la crêpe pour la jeter
          this.interactCooldown = 400;
        }
        this.targetStation = null;
        break;
      }

      case "retrieve_rejected":
        if (this.hands.length < 3) this.hands.push(result.item);
        // Jette la crêpe rejetée en la laissant tomber (clear hands)
        this.hands = this.hands.filter((h) => h.type !== IT.ASSEMBLED_CREPE);
        this.targetStation = null;
        break;

      default:
        // "none" — bilig encore en cuisson ou autre
        this.targetStation = null;
        this.interactCooldown = 350;
        break;
    }
  }

  // ── Décision ─────────────────────────────────────────────────────────────────
  _decideNextTask(stations, customerManager, game) {
    // Priorité 1 : livrer la crêpe prête
    if (this.hands.some((h) => h.type === IT.ASSEMBLED_CREPE)) {
      const delivery = stations.find((s) => s.type === ST.DELIVERY);
      if (delivery) {
        this.targetStation = delivery;
        return;
      }
    }

    // Priorité 2 : mon bilig est PRÊT → aller récupérer
    if (this.myBilig && this.myBilig.biligState === BILIG_STATE.READY) {
      this.targetStation = this.myBilig;
      return;
    }

    // Priorité 3 : mon bilig cuit + j'ai des toppings à déposer
    if (
      this.myBilig &&
      this.myBilig.biligState === BILIG_STATE.COOKING &&
      this.hands.some((h) => TOPPING_TYPES.has(h.type)) &&
      this.pendingToppings.length === 0
    ) {
      this.targetStation = this.myBilig;
      return;
    }

    // Priorité 4 : mon bilig cuit + toppings encore à collecter
    if (
      this.myBilig &&
      this.myBilig.biligState === BILIG_STATE.COOKING &&
      this.pendingToppings.length > 0
    ) {
      const nextTopping = this.pendingToppings[0];
      const toppingStation = stations.find((s) => s.type === nextTopping);
      if (toppingStation) {
        this.targetStation = toppingStation;
        return;
      }
      // ingrédient introuvable → on skip
      this.pendingToppings.shift();
      return;
    }

    // Priorité 5 : mon bilig cuit, plus rien à faire → attendre qu'il soit prêt
    if (this.myBilig && this.myBilig.biligState === BILIG_STATE.COOKING) {
      this.interactCooldown = 400;
      return;
    }

    // Priorité 6 : j'ai la pâte → aller à un bilig libre
    if (this.hands.some((h) => h.type === IT.BATTER)) {
      const freeBilig = stations.find(
        (s) => s.type === ST.BILIG && s.biligState === BILIG_STATE.EMPTY,
      );
      if (freeBilig) {
        this.myBilig = freeBilig;
        this.targetStation = freeBilig;
        return;
      }
      // Pas de bilig libre → attendre
      this.interactCooldown = 500;
      return;
    }

    // Priorité 7 : démarrer une nouvelle crêpe pour le client le plus urgent
    const seated = customerManager.customers.filter(
      (c) => c.state === "seated",
    );
    if (seated.length === 0) {
      this.interactCooldown = 400;
      return;
    }

    seated.sort((a, b) => a.patienceRemaining - b.patienceRemaining);
    const target = seated[0];
    this.pendingToppings = [...target.recipe.toppings];
    this.myBilig = null;

    const batterStation = stations.find((s) => s.type === ST.BATTER);
    if (batterStation) {
      this.targetStation = batterStation;
    }
  }
}
