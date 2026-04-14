// creperie-customers.js — Gestion des clients et de leurs commandes

import {
  DIFFICULTY_STEPS,
  MAX_HEARTS,
  RECIPES,
  TABLE_POSITIONS,
} from "./creperie-constants.js";

let customerIdCounter = 0;

export class Customer {
  constructor(tableIndex, recipe, maxPatience) {
    this.id = ++customerIdCounter;
    this.tableIndex = tableIndex;
    this.recipe = recipe;
    this.maxPatience = maxPatience;
    this.patienceRemaining = maxPatience;
    this.state = "arriving"; // "arriving" | "seated" | "served" | "leaving_happy" | "leaving_angry"

    // Animation d'arrivée (évolue de 0→1)
    this.arrivalProgress = 0;
    // Position actuelle (calculée par le renderer depuis tableIndex)
    this.x = 0;
    this.y = 0;

    // Timer de départ animé (quand le client part)
    this.leavingTimer = 0;
    this.leavingDuration = 1200; // ms
  }

  get patienceFraction() {
    return this.patienceRemaining / this.maxPatience;
  }

  update(dt) {
    if (this.state === "arriving") {
      this.arrivalProgress = Math.min(1, this.arrivalProgress + dt / 200);
      if (this.arrivalProgress >= 1) this.state = "seated";
      return;
    }

    if (this.state === "seated") {
      this.patienceRemaining = Math.max(0, this.patienceRemaining - dt);
      if (this.patienceRemaining === 0) {
        this.state = "leaving_angry";
      }
      return;
    }

    // Served: patience is frozen, waiting for waiter to deliver
    if (this.state === "served") return;

    if (this.state === "leaving_happy" || this.state === "leaving_angry") {
      this.leavingTimer += dt;
    }
  }

  get isDone() {
    return (
      (this.state === "leaving_happy" || this.state === "leaving_angry") &&
      this.leavingTimer >= this.leavingDuration
    );
  }
}

export class CustomerManager {
  constructor(onGameOver, onAngryLeave) {
    this.customers = [];
    this.occupiedTables = new Set(); // indices de tables occupées
    this.onGameOver = onGameOver;
    this.onAngryLeave = onAngryLeave || null;
    this.unhappyCount = 0;

    // Nombre d'assistants actifs (mis à jour par le jeu chaque frame)
    this.assistantCount = 0;

    // Spawn timer
    this.spawnTimer = 0;
    this.spawnInterval = DIFFICULTY_STEPS[0].spawnInterval;
    this.patienceDuration = DIFFICULTY_STEPS[0].patienceDuration;

    // Spawn immédiat du premier client après ~1s
    this.spawnTimer = this.spawnInterval - 3500;

    // Callback appelé à chaque apparition de client (utilisé pour l'attribution aux assistants)
    this.onCustomerSpawned = null;
  }

  update(dt, elapsed) {
    // Mettre à jour la difficulté
    this._applyDifficulty(elapsed);

    // Faire évoluer tous les clients
    const toRemove = [];
    for (const c of this.customers) {
      c.update(dt);
      if (c.state === "leaving_angry" && c.isDone) {
        this.unhappyCount++;
        if (this.onAngryLeave) this.onAngryLeave();
        toRemove.push(c);
        if (this.unhappyCount >= MAX_HEARTS) {
          this.onGameOver();
          return;
        }
      } else if (c.state === "leaving_happy" && c.isDone) {
        toRemove.push(c);
      }
    }

    // Supprimer les clients partis et libérer leurs tables
    for (const c of toRemove) {
      if (c.state === "leaving_angry" || c.state === "leaving_happy") {
        this.occupiedTables.delete(c.tableIndex);
      }
      this.customers = this.customers.filter((x) => x !== c);
    }

    // Faire apparaître un nouveau client
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this._spawnCustomer();
    }
  }

  _applyDifficulty(elapsed) {
    this._elapsed = elapsed;
    let step = DIFFICULTY_STEPS[0];
    for (const s of DIFFICULTY_STEPS) {
      if (elapsed >= s.at) step = s;
      else break;
    }
    // Chaque assistant ralentit un peu le spawn (plafonné à 1.5× pour ne pas bloquer les spawns)
    const assistantSlowdown = Math.min(1.5, 1 + this.assistantCount * 0.35);
    this.spawnInterval = step.spawnInterval * assistantSlowdown;
    this.patienceDuration = step.patienceDuration;
  }

  _spawnCustomer() {
    if (this.occupiedTables.size >= TABLE_POSITIONS.length) return;

    // Trouver une table libre
    let freeIndex = -1;
    const shuffled = [...TABLE_POSITIONS.keys()].sort(
      () => Math.random() - 0.5,
    );
    for (const i of shuffled) {
      if (!this.occupiedTables.has(i)) {
        freeIndex = i;
        break;
      }
    }
    if (freeIndex < 0) return;

    // Choisir une recette (recettes simples en priorité au début)
    const recipe = this._pickRecipe();
    const customer = new Customer(freeIndex, recipe, this.patienceDuration);
    this.occupiedTables.add(freeIndex);
    this.customers.push(customer);
    if (this.onCustomerSpawned) this.onCustomerSpawned(customer);
  }

  _pickRecipe() {
    const elapsed = this._elapsed || 0;
    const weights = RECIPES.map((r) => {
      const pts = r.points;
      if (elapsed < 30) {
        if (pts <= 100) return 3; // recettes simples favorisées au début
        if (pts >= 150) return 0.3; // recettes complexes rarissimes au début
        return 1;
      }
      if (elapsed >= 60) {
        if (pts >= 150) return 1.5; // recettes complexes favorisées en fin de partie
        return 1;
      }
      return 1; // 30-60s : poids neutres
    });
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < RECIPES.length; i++) {
      r -= weights[i];
      if (r <= 0) return RECIPES[i];
    }
    return RECIPES[RECIPES.length - 1];
  }

  /**
   * Cherche un client dont la commande correspond exactement aux toppings fournis.
   * @param {string[]} toppings
   * @param {Customer|null} preferredCustomer  Si fourni (livraison assistant) : tenter ce client
   *   en priorité, puis se limiter aux clients handledByAssistant en fallback.
   */
  tryMatch(toppings, preferredCustomer = null) {
    const key = [...toppings].sort().join(",");

    // 1. Essayer d'abord le client ciblé par l'assistant
    if (preferredCustomer && preferredCustomer.state === "seated") {
      const recipeKey = [...preferredCustomer.recipe.toppings].sort().join(",");
      if (recipeKey === key) {
        preferredCustomer.state = "served";
        return preferredCustomer;
      }
    }

    // 2. Chercher dans le pool général, mais si un client préféré était spécifié
    //    (livraison assistant) on se limite aux commandes handledByAssistant
    //    pour ne jamais voler une commande du joueur.
    const assistantOnly = preferredCustomer !== null;
    for (const c of this.customers) {
      if (c.state !== "seated") continue;
      if (assistantOnly && !c.handledByAssistant) continue;
      const recipeKey = [...c.recipe.toppings].sort().join(",");
      if (recipeKey === key) {
        c.state = "served";
        return c;
      }
    }
    return null;
  }

  get seatedCount() {
    return this.customers.filter((c) => c.state === "seated").length;
  }

  /** Nombre de commandes disponibles pour le joueur (assis + non pris par assistant) */
  get unhandledCount() {
    return this.customers.filter(
      (c) => c.state === "seated" && !c.handledByAssistant,
    ).length;
  }

  /** Force l'apparition immédiate d'un client (ignoré si toutes les tables sont prises) */
  forceSpawn() {
    this._spawnCustomer();
    this.spawnTimer = 0; // remet le timer pour éviter un double spawn juste après
  }
}
