// creperie-game.js — Coordinateur principal du jeu Crêperie

import { AssuranceAutoPlayer } from "./creperie-auto-player.js";
import {
  ASSISTANCE_TOKEN_DURATION,
  ASSISTANCE_TOKEN_SPAWN_INTERVAL,
  ASSISTANT_BILIG_Y_RATIO,
  ASSISTANT_DURATION,
  ASSISTANT_Y_RATIO,
  COUNTER_HEIGHT_RATIO,
  COUNTER_Y_RATIO,
  FIREFIGHTER_SPEED,
  GAME_DURATION,
  MAX_ASSISTANCE_TOKENS,
  MAX_ASSISTANTS,
  MAX_HANDS,
  MAX_HEARTS,
  PLAYER_Y_RATIO,
  STATION_LAYOUT,
  TOKEN_COLLECT_RADIUS,
} from "./creperie-constants.js";
import { CustomerManager } from "./creperie-customers.js";
import { CreperiePlayer } from "./creperie-player.js";
import { CreperieRenderer } from "./creperie-renderer.js";
import { BILIG_STATE, Station, createStations } from "./creperie-stations.js";
import { CreperieWaiter } from "./creperie-waiter.js";

export default class CreperieGame {
  constructor() {
    this.canvas = document.getElementById("game-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.ui = null;
    this.leaderboard = null;

    // État de jeu
    this.score = 0;
    this.timeLeft = GAME_DURATION;
    this.heartsLeft = MAX_HEARTS;
    this.crepesServed = 0;
    this.isRunning = false;
    this.lastTimestamp = 0;
    this.rafId = null;

    // Pour le récap game-over
    this.recipeBreakdown = {};

    // Input
    this.keys = { left: false, right: false, space: false };
    this._spaceConsumed = false;

    // Personnage choisi
    this.character = "cerise";

    // Nouveau système d'assistants crépiers
    this.assistants = []; // {player, bilig, timer}
    this.assistanceBiligs = []; // Stations biligs du bas (pré-créées)
    this.assistanceTokens = []; // Tokens au sol: {x, y, timer, duration}
    this.tokenSpawnTimer = 0;

    // Incendie
    this.incendieToken = null; // {x, y} ou null
    this.firefighter = null; // {x, y, targetBilig, state}

    // Dons à l'association
    this.donationCount = 0;

    // Serveur NPC
    this.waiter = null;

    // Sous-systèmes
    this.stations = [];
    this.player = null;
    this.customerManager = null;
    this.renderer = null;

    // Feedback livraison
    this.deliveryFeedback = null;

    // Handlers
    this._onKeyDown = this._handleKeyDown.bind(this);
    this._onKeyUp = this._handleKeyUp.bind(this);
    this._loop = this._gameLoop.bind(this);
  }

  // ── Interface adapter ──────────────────────────────────────────────────────
  setUI(ui) {
    this.ui = ui;
  }

  resizeGame() {
    const container = this.canvas.parentElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    if (rect.width > 0) this.canvas.width = rect.width;
    if (rect.height > 0) this.canvas.height = rect.height;
    this._layoutStations();
    if (this.player)
      this.player.onResize(this.canvas.width, this.canvas.height);
    if (this.renderer) this.renderer.onResize();
    if (this.waiter)
      this.waiter.onResize(this.canvas.width, this.canvas.height);
    this.assistants.forEach((a) =>
      a.player.onResize(this.canvas.width, this.canvas.height),
    );
  }

  startGame(playerInfo = {}) {
    this.character = playerInfo.character || "cerise";

    // Réinitialiser l'état
    this.score = 0;
    this.timeLeft = GAME_DURATION;
    this.heartsLeft = MAX_HEARTS;
    this.crepesServed = 0;
    this.recipeBreakdown = {};
    this.deliveryFeedback = null;
    this.isRunning = true;
    this.lastTimestamp = 0;
    this.keys = { left: false, right: false, space: false };
    this._spaceConsumed = false;
    this.assistants = [];
    this.assistanceTokens = [];
    this.tokenSpawnTimer = 0;
    this.incendieToken = null;
    this.firefighter = null;
    this.donationCount = 0;
    this.waiter = null;

    // Canvas correctement dimensionné
    this.resizeGame();

    // Créer les sous-systèmes
    this.stations = createStations(STATION_LAYOUT);

    // Pré-créer 5 biligs d'assistants (rangée du bas, désactivés à l'init)
    this.assistanceBiligs = Array.from({ length: MAX_ASSISTANTS }, () => {
      const s = new Station("BILIG", "", 0);
      s.isAssistantBilig = true;
      return s;
    });

    this.player = new CreperiePlayer(this.canvas.width / 2, this.canvas.height);
    this.player.character = this.character;
    this.customerManager = new CustomerManager(
      () => this._onUnhappyGameOver(),
      () => {
        this.heartsLeft = Math.max(0, this.heartsLeft - 1);
      },
    );
    this.renderer = new CreperieRenderer(this.ctx);
    this.waiter = new CreperieWaiter(this.canvas.width, this.canvas.height);

    this._layoutStations();
    this.player.onResize(this.canvas.width, this.canvas.height);

    // Masquer le DOM HUD (tout est dans le canvas maintenant)
    if (this.ui && this.ui.scoreDisplay) {
      this.ui.scoreDisplay.style.display = "none";
    }

    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);
    this.rafId = requestAnimationFrame(this._loop);
  }

  endGame() {
    this._stopGame("time");
  }

  // ── Layout ─────────────────────────────────────────────────────────────────
  _layoutStations() {
    if (this.stations.length === 0) return;
    const W = this.canvas.width;
    const H = this.canvas.height;
    const counterY = H * COUNTER_Y_RATIO;
    const counterH = H * COUNTER_HEIGHT_RATIO;

    const stationW = Math.max(58, W * 0.087);
    const stationH = counterH * 0.85;

    // Postes principaux
    this.stations.forEach((s) => {
      s.x = W * s.xRatio - stationW / 2;
      s.y = counterY;
      s.w = stationW;
      s.h = stationH;
    });

    // Biligs assistants — rangée du bas
    const assistBiligH = H * 0.08;
    const assistBiligW = stationW * 0.85;
    const assistBiligY = H * ASSISTANT_BILIG_Y_RATIO;
    const totalW = MAX_ASSISTANTS * (assistBiligW + 8) - 8;
    const startX = (W - totalW) / 2;
    this.assistanceBiligs.forEach((s, i) => {
      s.x = startX + i * (assistBiligW + 8);
      s.y = assistBiligY;
      s.w = assistBiligW;
      s.h = assistBiligH;
    });
  }

  // ── Boucle principale ──────────────────────────────────────────────────────
  _gameLoop(timestamp) {
    if (!this.isRunning) return;

    const dt = this.lastTimestamp
      ? Math.min(80, timestamp - this.lastTimestamp)
      : 16;
    this.lastTimestamp = timestamp;

    this.timeLeft = Math.max(0, this.timeLeft - dt / 1000);
    if (this.timeLeft === 0) {
      this._stopGame("time");
      return;
    }

    const elapsed = GAME_DURATION - this.timeLeft;
    const W = this.canvas.width;
    const H = this.canvas.height;

    // Mise à jour des assistants
    this._updateAssistants(dt);

    // Tokens d'assistance au sol
    this._updateTokens(dt, elapsed, W, H);

    // Vérifier collisions joueur + tokens
    this._checkTokenCollisions(W, H);

    // Vérifier biligs en feu → spawner token incendie
    this._checkFireBiligs(W, H);

    // Mise à jour pompier
    this._updateFirefighter(dt);

    // Mise à jour des sous-systèmes
    const allBiligs = [...this.assistanceBiligs];
    this.stations.forEach((s) => s.update(dt, 1));
    this.assistanceBiligs.forEach((s) => s.update(dt, 1));
    this.player.update(dt, this.keys);
    this.customerManager.update(dt, elapsed);

    if (this.waiter) {
      this.waiter.update(dt, W, H);
    }

    this.player.currentStation = this._detectStation();

    if (this.keys.space && !this._spaceConsumed) {
      this._processInteraction();
      this._spaceConsumed = true;
    }

    this.renderer.updateParticles(dt);

    if (this.deliveryFeedback) {
      this.deliveryFeedback.timer -= dt;
    }

    // Rendu canvas
    this.renderer.render(
      this.canvas,
      this.stations,
      this.player,
      this.customerManager,
      this.score,
      this.timeLeft,
      this.heartsLeft,
      MAX_HEARTS,
      this.deliveryFeedback,
      this.assistants,
      this.assistanceBiligs,
      this.assistanceTokens,
      this.incendieToken,
      this.firefighter,
      this.waiter,
      this.donationCount,
    );

    this._drawStationHint(W, H);
    this.rafId = requestAnimationFrame(this._loop);
  }

  // ── Assistants ─────────────────────────────────────────────────────────────
  _updateAssistants(dt) {
    const allStations = [...this.stations, ...this.assistanceBiligs];
    this.assistants = this.assistants.filter((a) => {
      a.timer -= dt / 1000;
      if (a.timer <= 0) {
        // L'assistant expire: libérer les clients flagués
        if (a.player.targetCustomer) {
          a.player.targetCustomer.handledByAssistant = false;
          a.player.targetCustomer = null;
        }
        a.bilig.biligState = BILIG_STATE.EMPTY;
        a.bilig.cookTimer = 0;
        a.bilig.biligToppings = [];
        return false;
      }
      a.player.update(dt, allStations, this.customerManager, this);
      return true;
    });
  }

  _spawnAssistant(W, H) {
    if (this.assistants.length >= MAX_ASSISTANTS) return;

    // Trouver un slot bilig libre
    const usedBiligs = new Set(this.assistants.map((a) => a.bilig));
    const freeBilig = this.assistanceBiligs.find((b) => !usedBiligs.has(b));
    if (!freeBilig) return;

    const assistant = new AssuranceAutoPlayer(W, H, freeBilig);
    // Positonner l'assistant au niveau du rang inférieur
    assistant.y = H * ASSISTANT_Y_RATIO;
    this.assistants.push({
      player: assistant,
      bilig: freeBilig,
      timer: ASSISTANT_DURATION,
    });
  }

  // ── Tokens d'assistance ────────────────────────────────────────────────────
  _updateTokens(dt, elapsed, W, H) {
    // Mettre à jour les timers des tokens existants
    this.assistanceTokens = this.assistanceTokens.filter((t) => {
      t.timer -= dt;
      return t.timer > 0;
    });

    // Spawner nouveaux tokens
    this.tokenSpawnTimer += dt;
    const interval =
      this.assistants.length < 2
        ? ASSISTANCE_TOKEN_SPAWN_INTERVAL * 0.6
        : ASSISTANCE_TOKEN_SPAWN_INTERVAL;
    if (
      this.tokenSpawnTimer >= interval &&
      this.assistanceTokens.length < MAX_ASSISTANCE_TOKENS &&
      this.assistants.length < MAX_ASSISTANTS
    ) {
      this.tokenSpawnTimer = 0;
      this._spawnAssistanceToken(W, H);
    }
    // Premier token spawn rapide (après 8s)
    if (
      elapsed > 8 &&
      this.assistanceTokens.length === 0 &&
      this.assistants.length === 0 &&
      this.tokenSpawnTimer === 0
    ) {
      this._spawnAssistanceToken(W, H);
    }
  }

  _spawnAssistanceToken(W, H) {
    const margin = W * 0.1;
    const x = margin + Math.random() * (W - margin * 2);
    const y = H * PLAYER_Y_RATIO - 30;
    this.assistanceTokens.push({
      x,
      y,
      timer: ASSISTANCE_TOKEN_DURATION,
      duration: ASSISTANCE_TOKEN_DURATION,
    });
  }

  _checkTokenCollisions(W, H) {
    if (this.assistants.length >= MAX_ASSISTANTS) {
      this.assistanceTokens = []; // Plus de place, nettoyer les tokens
      return;
    }
    const px = this.player.x;
    const py = this.player.y;
    this.assistanceTokens = this.assistanceTokens.filter((t) => {
      const dx = px - t.x;
      const dy = py - t.y;
      if (Math.sqrt(dx * dx + dy * dy) < TOKEN_COLLECT_RADIUS) {
        this._spawnAssistant(W, H);
        return false;
      }
      return true;
    });

    // Collision avec le token incendie
    if (this.incendieToken && !this.firefighter) {
      const dx = px - this.incendieToken.x;
      const dy = py - this.incendieToken.y;
      if (Math.sqrt(dx * dx + dy * dy) < TOKEN_COLLECT_RADIUS) {
        this._spawnFirefighter(W, H);
      }
    }
  }

  // ── Incendie ───────────────────────────────────────────────────────────────
  _checkFireBiligs(W, H) {
    if (this.incendieToken || this.firefighter) return;

    // Rethabilge vérifier tous les biligs (joueur + assistants)
    const allBiligs = [
      ...this.stations.filter((s) => s.type === "BILIG"),
      ...this.assistanceBiligs,
    ];
    const burning = allBiligs.find((s) => s.biligState === BILIG_STATE.BURNING);
    if (!burning) return;

    // Spawner le token d'assurance incendie au centre de la cuisine
    const margin = W * 0.15;
    const x = margin + Math.random() * (W - margin * 2);
    const y = H * PLAYER_Y_RATIO - 25;
    this.incendieToken = { x, y };
  }

  _spawnFirefighter(W, H) {
    // Trouver le bilig en feu le plus proche
    const allBiligs = [
      ...this.stations.filter((s) => s.type === "BILIG"),
      ...this.assistanceBiligs,
    ];
    const burningBilig = allBiligs.find(
      (s) => s.biligState === BILIG_STATE.BURNING,
    );
    if (!burningBilig) return;

    this.incendieToken = null;
    this.firefighter = {
      x: 0, // entre depuis la gauche
      y: H * PLAYER_Y_RATIO,
      targetBilig: burningBilig,
      state: "walking",
      size: 70,
      direction: 1,
      isMoving: true,
      walkFrame: 0,
    };
  }

  _updateFirefighter(dt) {
    const ff = this.firefighter;
    if (!ff) return;

    if (ff.state === "walking") {
      ff.walkFrame = (ff.walkFrame + dt / 80) % 8;
      const tx = ff.targetBilig.x + ff.targetBilig.w / 2;
      const dx = tx - ff.x;
      if (Math.abs(dx) < 6) {
        ff.x = tx;
        ff.state = "extinguishing";
        ff.extinguishTimer = 1200; // ms
        ff.isMoving = false;
      } else {
        const step =
          Math.sign(dx) *
          Math.min(Math.abs(dx), (FIREFIGHTER_SPEED * dt) / 1000);
        ff.x += step;
        ff.direction = Math.sign(dx);
      }
    } else if (ff.state === "extinguishing") {
      ff.extinguishTimer -= dt;
      if (ff.extinguishTimer <= 0) {
        ff.targetBilig.resetFire();
        // Libérer l'assistant si son bilig était en feu
        this.assistants.forEach((a) => {
          if (a.bilig === ff.targetBilig && a.player.targetCustomer) {
            a.player.targetCustomer.handledByAssistant = false;
            a.player.targetCustomer = null;
          }
        });
        ff.state = "done";
      }
    } else if (ff.state === "done") {
      // Sortir vers la droite
      ff.x += FIREFIGHTER_SPEED * 0.7 * (1 / 60);
      ff.direction = 1;
      ff.isMoving = true;
      if (ff.x > this.canvas.width + 100) {
        this.firefighter = null;
      }
    }
  }

  _drawStationHint(W, H) {
    const s = this.player.currentStation;
    if (!s) return;
    const ctx = this.ctx;
    const cx = s.x + s.w / 2;
    const counterY = H * COUNTER_Y_RATIO;

    // Animated badge
    const t = Date.now();
    const bob = Math.sin(t / 400) * 2;
    const hint = "[ ESPACE ]";
    ctx.save();
    ctx.font = "bold 12px Arial";
    const tw = ctx.measureText(hint).width;
    const bw = tw + 16,
      bh = 22;
    const bx = cx - bw / 2,
      by = counterY - 8 + bob - bh;

    // Badge background
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.beginPath();
    ctx.moveTo(bx + 6, by);
    ctx.lineTo(bx + bw - 6, by);
    ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + 6);
    ctx.lineTo(bx + bw, by + bh - 6);
    ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - 6, by + bh);
    ctx.lineTo(bx + 6, by + bh);
    ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - 6);
    ctx.lineTo(bx, by + 6);
    ctx.quadraticCurveTo(bx, by, bx + 6, by);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Text
    ctx.fillStyle = "#333";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(hint, cx, by + bh / 2);
    ctx.restore();
  }

  _updateDOM() {
    // HUD maintenant entier dans le canvas — ne rien faire
  }

  // ── Détection de station ───────────────────────────────────────────────────
  _detectStation() {
    const px = this.player.x;
    // Ne pas interagir avec les biligs d'assistants
    for (const s of this.stations) {
      if (px >= s.x && px <= s.x + s.w) return s;
    }
    return null;
  }

  // ── Interactions ───────────────────────────────────────────────────────────
  _processInteraction() {
    const station = this.player.currentStation;
    if (!station) return;

    const result = station.interact(this.player.hands);

    switch (result.action) {
      case "give":
        if (this.player.hands.length < MAX_HANDS) {
          this.player.hands.push(result.item);
          this.player.triggerInteractFlash();
        }
        break;

      case "take":
        this.player.hands.splice(result.itemIndex, 1);
        this.player.triggerInteractFlash();
        break;

      case "deposit_toppings":
        result.toppingItems.forEach((item) => {
          const idx = this.player.hands.indexOf(item);
          if (idx >= 0) this.player.hands.splice(idx, 1);
        });
        this.player.triggerInteractFlash();
        break;

      case "take_for_delivery": {
        this.player.hands.splice(result.itemIndex, 1);
        const toppings = result.crepe.toppings || [];
        const match = this.customerManager.tryMatch(toppings);

        if (match) {
          match.handledByAssistant = false; // le joueur prend en charge
          const pts = this._calcPoints(match);
          this.score += pts;
          this.crepesServed++;
          station.acceptDelivery();

          const label = match.recipe.label;
          if (!this.recipeBreakdown[label]) {
            this.recipeBreakdown[label] = {
              count: 0,
              points: 0,
              basePoints: match.recipe.points,
            };
          }
          this.recipeBreakdown[label].count++;
          this.recipeBreakdown[label].points += pts;

          const fx = station.x + station.w / 2;
          const fy = station.y - 20;
          this._showDeliveryFeedback(`+${pts} pts 🎉`, "#2ECC71", fx, fy);
          this.renderer.addParticles(fx, fy, "#FFD700", 10);

          if (this.waiter) {
            this.waiter.addDelivery(match, result.crepe);
          } else {
            match.state = "leaving_happy";
          }
        } else {
          station.rejectDelivery();
          const fx = station.x + station.w / 2;
          const fy = station.y - 20;
          this._showDeliveryFeedback(
            "Personne ne veut ça! ❌",
            "#E74C3C",
            fx,
            fy,
          );
        }
        break;
      }

      case "retrieve_rejected":
        if (this.player.hands.length < MAX_HANDS) {
          this.player.hands.push(result.item);
          this.player.triggerInteractFlash();
        }
        break;

      case "donation": {
        // Don à l'association : vider les mains, +1 point symbolique
        this.player.hands = [];
        this.player.triggerInteractFlash();
        this.score += 1;
        this.donationCount++;
        station.flash("#FF8C00");
        const dx = station.x + station.w / 2;
        const dy = station.y - 20;
        this._showDeliveryFeedback("+1 🫶", "#FF8C00", dx, dy);
        this.renderer.addParticles(dx, dy, "#FF8C00", 8);
        break;
      }

      default:
        break;
    }
  }

  _calcPoints(customer) {
    const pf = customer.patienceRemaining / customer.maxPatience;
    return Math.max(10, Math.round(customer.recipe.points * (0.5 + pf * 0.5)));
  }

  _showDeliveryFeedback(msg, color, x, y) {
    this.deliveryFeedback = { msg, color, x, y, timer: 1600, maxTimer: 1600 };
  }

  // ── Game Over ──────────────────────────────────────────────────────────────
  _onUnhappyGameOver() {
    if (this.isRunning) this._stopGame("unhappy");
  }

  _stopGame(reason) {
    this.isRunning = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;

    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);

    // Libérer les flags clients
    if (this.customerManager) {
      this.customerManager.customers.forEach((c) => {
        c.handledByAssistant = false;
      });
    }

    const recipeBreakdown = Object.entries(this.recipeBreakdown).map(
      ([label, data]) => ({
        label,
        count: data.count,
        points: data.points,
      }),
    );

    if (this.ui) {
      this.ui.showCreperieGameOver({
        score: this.score,
        crepesServed: this.crepesServed,
        heartsLost: MAX_HEARTS - this.heartsLeft,
        reason,
        recipeBreakdown,
        donationCount: this.donationCount,
        assistantsUsed: this.assistants.length,
      });
    }
  }

  // ── Gestion du clavier ─────────────────────────────────────────────────────
  _handleKeyDown(e) {
    if (e.key === "ArrowLeft") {
      this.keys.left = true;
      e.preventDefault();
    }
    if (e.key === "ArrowRight") {
      this.keys.right = true;
      e.preventDefault();
    }
    if (e.key === " ") {
      if (!this.keys.space) {
        this.keys.space = true;
        this._spaceConsumed = false;
      }
      e.preventDefault();
    }
  }

  _handleKeyUp(e) {
    if (e.key === "ArrowLeft") this.keys.left = false;
    if (e.key === "ArrowRight") this.keys.right = false;
    if (e.key === " ") {
      this.keys.space = false;
      this._spaceConsumed = false;
    }
  }
}
