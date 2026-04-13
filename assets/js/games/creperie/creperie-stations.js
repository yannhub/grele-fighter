// creperie-stations.js — Gestion des postes de travail

import {
  BILIG_COOK_TIME,
  BROWN_DELAY,
  BURN_DELAY,
  FIRE_SPREAD_DELAY,
  IT,
  MAX_HANDS,
  ST,
} from "./creperie-constants.js";

export const BILIG_STATE = {
  EMPTY: "empty",
  COOKING: "cooking",
  READY: "ready",
  BROWNING: "browning",
  BURNING: "burning",
};

const TOPPING_TYPES = new Set([
  IT.BUTTER,
  IT.SUGAR,
  IT.CHOCOLATE,
  IT.STRAWBERRY,
  IT.LEMON,
  IT.WHIPPED_CREAM,
]);

export class Station {
  constructor(type, label, xRatio) {
    this.type = type;
    this.label = label;
    this.xRatio = xRatio;

    // Dimensions calculées lors du resize
    this.x = 0;
    this.y = 0;
    this.w = 0;
    this.h = 0;

    // Flag assistant bilig (joueur ne peut pas interagir)
    this.isAssistantBilig = false;

    // État du bilig
    this.biligState = BILIG_STATE.EMPTY;
    this.cookTimer = 0;
    this.cookProgress = 0; // 0→1
    this.biligToppings = []; // ingrédients posés sur le bilig
    this.burnTimer = 0; // ms depuis l'état READY (déclenchement incendie)
    this.spreadTimer = null; // ms restantes avant propagation du feu (null = pas en feu)

    // État du poste d'envoi
    this.deliveryCrepe = null; // { type, toppings[] }
    this.deliveryStatus = "empty"; // "empty" | "waiting" | "rejected"

    // Feedback visuel
    this.flashTimer = 0; // ms restantes pour le flash coloré
    this.flashColor = null;
  }

  update(dt, cookMultiplier = 1) {
    if (this.type === ST.BILIG) {
      if (this.biligState === BILIG_STATE.COOKING) {
        this.cookTimer += dt * cookMultiplier;
        this.cookProgress = Math.min(1, this.cookTimer / BILIG_COOK_TIME);
        if (this.cookTimer >= BILIG_COOK_TIME) {
          this.biligState = BILIG_STATE.READY;
          this.cookProgress = 1;
          this.burnTimer = 0;
        }
      } else if (this.biligState === BILIG_STATE.READY) {
        this.burnTimer += dt;
        if (this.burnTimer >= BROWN_DELAY) {
          this.biligState = BILIG_STATE.BROWNING;
        }
      } else if (this.biligState === BILIG_STATE.BROWNING) {
        this.burnTimer += dt;
        if (this.burnTimer >= BURN_DELAY) {
          this.biligState = BILIG_STATE.BURNING;
          this.spreadTimer = FIRE_SPREAD_DELAY;
        }
      } else if (
        this.biligState === BILIG_STATE.BURNING &&
        this.spreadTimer !== null
      ) {
        this.spreadTimer -= dt;
      }
    }
    if (this.flashTimer > 0) {
      this.flashTimer = Math.max(0, this.flashTimer - dt);
    }
  }

  // Extinction d'incendie par le pompier
  resetFire() {
    this.biligState = BILIG_STATE.EMPTY;
    this.cookTimer = 0;
    this.cookProgress = 0;
    this.burnTimer = 0;
    this.spreadTimer = null;
    this.biligToppings = [];
    this.flash("#4FC3F7"); // bleu eau
  }

  // Forcer l'état incendie (propagation)
  setBurning() {
    if (this.biligState === BILIG_STATE.BURNING) return;
    if (this.biligState === BILIG_STATE.EMPTY) return;
    this.biligState = BILIG_STATE.BURNING;
    this.spreadTimer = FIRE_SPREAD_DELAY;
  }

  /**
   * Le joueur appuie sur ESPACE à ce poste.
   * Retourne { action, ... } selon le type et l'état du poste.
   */
  interact(playerHands) {
    switch (this.type) {
      case ST.BATTER:
        return this._interactBatter(playerHands);
      case ST.BILIG:
        if (this.biligState === BILIG_STATE.BURNING) return { action: "none" };
        return this._interactBilig(playerHands);
      case ST.DELIVERY:
        return this._interactDelivery(playerHands);
      case ST.DONATION:
        return this._interactDonation(playerHands);
      case ST.CALL_G2S:
        return this._interactCallG2S();
      default:
        return this._interactIngredient(playerHands);
    }
  }

  _interactBatter(playerHands) {
    if (playerHands.length >= MAX_HANDS) return { action: "none" };
    // Pas de pâte si on a déjà une crêpe assemblée
    if (playerHands.some((i) => i.type === IT.ASSEMBLED_CREPE))
      return { action: "none" };
    return { action: "give", item: { type: IT.BATTER } };
  }

  _interactBilig(playerHands) {
    switch (this.biligState) {
      case BILIG_STATE.EMPTY: {
        const idx = playerHands.findIndex((i) => i.type === IT.BATTER);
        if (idx < 0) return { action: "none" };
        this.biligState = BILIG_STATE.COOKING;
        this.cookTimer = 0;
        this.cookProgress = 0;
        this.burnTimer = 0;
        this.biligToppings = [];
        return { action: "take", itemIndex: idx };
      }

      case BILIG_STATE.COOKING: {
        const slotsLeft = 3 - this.biligToppings.length;
        const toppings = playerHands
          .filter((i) => TOPPING_TYPES.has(i.type))
          .slice(0, slotsLeft);
        if (toppings.length > 0) {
          toppings.forEach((t) => this.biligToppings.push(t.type));
          return { action: "deposit_toppings", toppingItems: toppings };
        }
        return { action: "none" };
      }

      case BILIG_STATE.READY:
      case BILIG_STATE.BROWNING: {
        const slotsLeft = 3 - this.biligToppings.length;
        const toppings = playerHands
          .filter((i) => TOPPING_TYPES.has(i.type))
          .slice(0, slotsLeft);
        if (toppings.length > 0) {
          toppings.forEach((t) => this.biligToppings.push(t.type));
          return { action: "deposit_toppings", toppingItems: toppings };
        }
        if (playerHands.length >= MAX_HANDS) return { action: "none" };
        const crepe = {
          type: IT.ASSEMBLED_CREPE,
          toppings: [...this.biligToppings],
        };
        this.biligState = BILIG_STATE.EMPTY;
        this.biligToppings = [];
        this.cookProgress = 0;
        this.burnTimer = 0;
        return { action: "give", item: crepe };
      }
    }
    return { action: "none" };
  }

  _interactDelivery(playerHands) {
    if (this.deliveryStatus === "empty") {
      const idx = playerHands.findIndex((i) => i.type === IT.ASSEMBLED_CREPE);
      if (idx < 0) return { action: "none" };
      this.deliveryCrepe = playerHands[idx];
      this.deliveryStatus = "waiting";
      return {
        action: "take_for_delivery",
        itemIndex: idx,
        crepe: this.deliveryCrepe,
      };
    }
    if (this.deliveryStatus === "rejected") {
      const crepe = this.deliveryCrepe;
      this.deliveryCrepe = null;
      this.deliveryStatus = "empty";
      if (playerHands.length >= MAX_HANDS) {
        // Remettre en rejected si mains pleines
        this.deliveryCrepe = crepe;
        this.deliveryStatus = "rejected";
        return { action: "none" };
      }
      return { action: "retrieve_rejected", item: crepe };
    }
    return { action: "none" };
  }

  _interactDonation(playerHands) {
    if (playerHands.length === 0) return { action: "none" };
    return { action: "donation" };
  }

  _interactCallG2S() {
    // Le jeu vérifie s'il y a un feu actif (état passé via game)
    // On retourne une action générique; le jeu décidera
    return { action: "call_g2s" };
  }

  _interactIngredient(playerHands) {
    if (playerHands.length >= MAX_HANDS) return { action: "none" };
    const itemType = STATION_TO_ITEM[this.type];
    if (!itemType) return { action: "none" };
    return { action: "give", item: { type: itemType } };
  }

  // Appelé depuis le jeu quand il y a un match client
  acceptDelivery() {
    this.deliveryCrepe = null;
    this.deliveryStatus = "empty";
    this.flash("#2ECC71"); // vert
  }

  // Appelé depuis le jeu quand aucun client ne veut cette crêpe
  rejectDelivery() {
    this.deliveryStatus = "rejected";
    this.flash("#E74C3C"); // rouge
  }

  flash(color) {
    this.flashColor = color;
    this.flashTimer = 600;
  }
}

const STATION_TO_ITEM = {
  [ST.BUTTER]: IT.BUTTER,
  [ST.SUGAR]: IT.SUGAR,
  [ST.CHOCOLATE]: IT.CHOCOLATE,
  [ST.STRAWBERRY]: IT.STRAWBERRY,
  [ST.LEMON]: IT.LEMON,
  [ST.WHIPPED_CREAM]: IT.WHIPPED_CREAM,
};

export function createStations(layout) {
  return layout.map((def) => new Station(def.type, def.label, def.xRatio));
}
