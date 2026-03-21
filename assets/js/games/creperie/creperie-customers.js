// creperie-customers.js — Gestion des clients et de leurs commandes

import {
  DIFFICULTY_STEPS,
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
    this.state = "arriving"; // "arriving" | "seated" | "leaving_happy" | "leaving_angry"

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
      this.arrivalProgress = Math.min(1, this.arrivalProgress + dt / 800);
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
  constructor(onGameOver) {
    this.customers = [];
    this.occupiedTables = new Set(); // indices de tables occupées
    this.onGameOver = onGameOver;
    this.unhappyCount = 0;

    // Spawn timer
    this.spawnTimer = 0;
    this.spawnInterval = DIFFICULTY_STEPS[0].spawnInterval;
    this.patienceDuration = DIFFICULTY_STEPS[0].patienceDuration;

    // Spawn immédiat du premier client après 2s
    this.spawnTimer = -this.spawnInterval + 2000;
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
        toRemove.push(c);
        if (this.unhappyCount >= 3) {
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
    let step = DIFFICULTY_STEPS[0];
    for (const s of DIFFICULTY_STEPS) {
      if (elapsed >= s.at) step = s;
      else break;
    }
    this.spawnInterval = step.spawnInterval;
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
  }

  _pickRecipe() {
    // Toutes recettes disponibles, avec poids inversement proportionnel à la difficulté
    return RECIPES[Math.floor(Math.random() * RECIPES.length)];
  }

  /**
   * Cherche un client dont la commande correspond exactement aux toppings fournis.
   * Retourne le client s'il existe, sinon null.
   */
  tryMatch(toppings) {
    const key = [...toppings].sort().join(",");
    for (const c of this.customers) {
      if (c.state !== "seated") continue;
      const recipeKey = [...c.recipe.toppings].sort().join(",");
      if (recipeKey === key) {
        c.state = "leaving_happy";
        return c;
      }
    }
    return null;
  }

  get seatedCount() {
    return this.customers.filter((c) => c.state === "seated").length;
  }
}
