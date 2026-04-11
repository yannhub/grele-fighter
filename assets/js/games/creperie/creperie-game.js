// creperie-game.js — Coordinateur principal du jeu Crêperie

import { AssuranceAutoPlayer } from "./creperie-auto-player.js";
import {
  ASSISTANT_DURATION,
  BOTTOM_COUNTER_HEIGHT_RATIO,
  BOTTOM_COUNTER_Y_RATIO,
  CONTRACT_COLLECT_RADIUS,
  CONTRACT_DURATION,
  COUNTER_HEIGHT_RATIO,
  COUNTER_Y_RATIO,
  FIREFIGHTER_SPEED,
  GAME_DURATION,
  HUD_H,
  INTERACT_Y_TOLERANCE,
  KITCHEN_BOTTOM_LANE_Y_RATIO,
  KITCHEN_TOP_LANE_Y_RATIO,
  MAX_ASSISTANTS,
  MAX_HANDS,
  MAX_HEARTS,
  PASSAGE_X_RATIO,
  STATION_LAYOUT,
  STATION_LAYOUT_BOTTOM,
  TABLE_POSITIONS,
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
    this.displayScore = 0; // valeur animée vers score
    this.scoreFlashTimer = 0; // déclenche l'animation de grow du score HUD
    this.timeLeft = GAME_DURATION;
    this.heartsLeft = MAX_HEARTS;
    this.crepesServed = 0;
    this.isRunning = false;
    this.lastTimestamp = 0;
    this.rafId = null;

    // Pour le récap game-over
    this.recipeBreakdown = {};

    // Input
    this.keys = {
      left: false,
      right: false,
      up: false,
      down: false,
      space: false,
    };
    this._spaceConsumed = false;

    // Personnage choisi
    this.character = "cerise";

    // Assistants crépiers
    this.assistants = []; // {player, bilig, timer}
    this.assistanceBiligs = []; // Stations biligs du bas (pré-créées)
    this.g2sContracts = []; // Contrats G2S dans la salle: {x, y, timer, duration}

    // Stations & layout
    this.stations = []; // comptoir haut
    this.bottomStations = []; // comptoir bas (CALL_G2S + DONATION)
    this.tableRects = []; // {cx, cy} pour les collisions de tables

    // Incendie
    this.firefighter = null; // {x, y, targetsQueue, state, ...}

    // Dons à l'association
    this.donationCount = 0;

    // Serveur NPC
    this.waiter = null;

    // Sous-systèmes
    this.player = null;
    this.customerManager = null;
    this.renderer = null;

    // Textes flottants (remplace deliveryFeedback slot unique)
    this.floatingTexts = [];

    // Layout courant (mis à jour par _layoutStations)
    this._gameH = 0;
    this._counterY = 0;
    this._counterH = 0;
    this._passageX = 0;
    this._bottomCounterY = 0;
    this._bottomCounterH = 0;
    this._kitchenTopLaneY = 0;
    this._kitchenBottomLaneY = 0;

    // Handlers
    this._onKeyDown = this._handleKeyDown.bind(this);
    this._onKeyUp = this._handleKeyUp.bind(this);
    this._loop = this._gameLoop.bind(this);
  }

  // ── Interface adapter ──────────────────────────────────────────────────────
  setUI(ui) {
    this.ui = ui;
  }

  get _gameLayout() {
    return {
      gameH: this._gameH,
      counterY: this._counterY,
      passageX: this._passageX,
      kitchenTopLaneY: this._kitchenTopLaneY,
      kitchenBottomLaneY: this._kitchenBottomLaneY,
      tableRects: this.tableRects,
    };
  }

  get hasActiveFire() {
    const allBiligs = [
      ...this.stations.filter((s) => s.type === "BILIG"),
      ...this.assistanceBiligs,
    ];
    return allBiligs.some((b) => b.biligState === BILIG_STATE.BURNING);
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
    if (this.waiter) this.waiter.onResize(this.canvas.width, this._gameH);
    this.assistants.forEach((a) =>
      a.player.onResize(this.canvas.width, this._gameH),
    );
  }

  startGame(playerInfo = {}) {
    this.character = playerInfo.character || "cerise";

    // Réinitialiser l'état
    this.score = 0;
    this.displayScore = 0;
    this.scoreFlashTimer = 0;
    this.timeLeft = GAME_DURATION;
    this.heartsLeft = MAX_HEARTS;
    this.crepesServed = 0;
    this.recipeBreakdown = {};
    this.floatingTexts = [];
    this.isRunning = true;
    this.lastTimestamp = 0;
    this.keys = {
      left: false,
      right: false,
      up: false,
      down: false,
      space: false,
    };
    this._spaceConsumed = false;
    this.assistants = [];
    this.g2sContracts = [];
    this.firefighter = null;
    this.donationCount = 0;
    this.waiter = null;

    // Canvas correctement dimensionné
    this.resizeGame();

    // Créer les sous-systèmes
    this.stations = createStations(STATION_LAYOUT);
    this.bottomStations = createStations(STATION_LAYOUT_BOTTOM);

    // Les biligs assistants sont créés à la volée quand un assistant est ajouté
    this.assistanceBiligs = [];

    this.player = new CreperiePlayer(this.canvas.width / 2, this._gameH);
    this.player.character = this.character;
    this.customerManager = new CustomerManager(
      () => this._onUnhappyGameOver(),
      () => {
        this.heartsLeft = Math.max(0, this.heartsLeft - 1);
      },
    );
    this.renderer = new CreperieRenderer(this.ctx);
    this.waiter = new CreperieWaiter(this.canvas.width, this._gameH);

    this._layoutStations();
    this.player.onResize(this.canvas.width, this._gameH);

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
    const W = this.canvas.width;
    const H = this.canvas.height;
    this._gameH = H - HUD_H;
    const gameH = this._gameH;

    this._counterY = gameH * COUNTER_Y_RATIO;
    this._counterH = gameH * COUNTER_HEIGHT_RATIO;
    this._passageX = W * PASSAGE_X_RATIO;
    this._bottomCounterY = gameH * BOTTOM_COUNTER_Y_RATIO;
    this._bottomCounterH = gameH * BOTTOM_COUNTER_HEIGHT_RATIO;
    this._kitchenTopLaneY = gameH * KITCHEN_TOP_LANE_Y_RATIO;
    this._kitchenBottomLaneY = gameH * KITCHEN_BOTTOM_LANE_Y_RATIO;

    if (this.stations.length === 0) return;

    const stationW = Math.max(56, W * 0.085);
    const stationH = this._counterH * 0.85;

    // Postes du comptoir HAUT (jusqu'au passage)
    this.stations.forEach((s) => {
      s.x = W * s.xRatio - stationW / 2;
      s.y = this._counterY;
      s.w = stationW;
      s.h = stationH;
    });

    // Postes du comptoir BAS (CALL_G2S + DONATION)
    const bottomStationH = this._bottomCounterH * 0.85;
    this.bottomStations.forEach((s) => {
      s.x = W * s.xRatio - stationW / 2;
      s.y = this._bottomCounterY;
      s.w = stationW;
      s.h = bottomStationH;
    });

    // Biligs assistants — rangée du bas, même taille que les biligs joueur
    const assistBiligXRatios = [0.08, 0.18, 0.28, 0.38, 0.48];
    this.assistanceBiligs.forEach((s, i) => {
      s.x = W * assistBiligXRatios[i] - stationW / 2;
      s.y = this._bottomCounterY;
      s.w = stationW;
      s.h = bottomStationH;
    });

    // Rectangles de collision des tables (en coords jeu)
    this.tableRects = TABLE_POSITIONS.map((tp) => ({
      cx: W * tp.xRatio,
      cy: this._counterY * tp.yRatio,
    }));
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
    const gameH = this._gameH;

    // Score animé (rattrape la valeur réelle à 400 pts/s)
    if (this.displayScore < this.score) {
      this.displayScore = Math.min(
        this.score,
        this.displayScore + 400 * (dt / 1000),
      );
    }
    if (this.scoreFlashTimer > 0) {
      this.scoreFlashTimer = Math.max(0, this.scoreFlashTimer - dt);
    }

    // Mise à jour des assistants
    this._updateAssistants(dt);

    // Contrats G2S dans la salle
    this._updateContracts(dt);

    // Propagation du feu
    this._updateFireSpread();

    // Mise à jour pompier
    this._updateFirefighter(dt);

    // Mise à jour des sous-systèmes
    this.stations.forEach((s) => s.update(dt, 1));
    this.bottomStations.forEach((s) => s.update(dt, 1));
    this.assistanceBiligs.forEach((s) => s.update(dt, 1));
    this.player.update(dt, this.keys, this._gameLayout);
    this.customerManager.update(dt, elapsed);

    if (this.waiter) {
      this.waiter.update(dt, W, gameH);
    }

    // Collision contrats (seulement si dans la salle)
    this._checkContractCollisions(W, gameH);

    this.player.currentStation = this._detectStation();

    if (this.keys.space && !this._spaceConsumed) {
      this._processInteraction();
      this._spaceConsumed = true;
    }

    this.renderer.updateParticles(dt);

    // Mise à jour floating texts
    this.floatingTexts = this.floatingTexts.filter((ft) => {
      ft.timer -= dt;
      return ft.timer > 0;
    });

    // Rendu canvas
    this.renderer.render(
      this.canvas,
      this.stations,
      this.bottomStations,
      this.player,
      this.customerManager,
      this.score,
      this.displayScore,
      this.scoreFlashTimer,
      this.timeLeft,
      this.heartsLeft,
      MAX_HEARTS,
      this.floatingTexts,
      this.assistants,
      this.assistanceBiligs,
      this.g2sContracts,
      this.firefighter,
      this.waiter,
      this.donationCount,
      this.hasActiveFire,
    );

    this._drawStationHint(W, gameH);
    this.rafId = requestAnimationFrame(this._loop);
  }

  // ── Assistants ─────────────────────────────────────────────────────────────
  _updateAssistants(dt) {
    const allStations = [
      ...this.stations,
      ...this.assistanceBiligs,
      ...this.bottomStations,
    ];
    this.assistants = this.assistants.filter((a) => {
      a.timer -= dt / 1000;
      if (a.timer <= 0) {
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

    // Créer un nouveau bilig pour cet assistant
    const assistBiligXRatios = [0.08, 0.18, 0.28, 0.38, 0.48];
    const idx = this.assistanceBiligs.length;
    const stationW = Math.max(56, W * 0.085);
    const bottomStationH = this._bottomCounterH * 0.85;
    const newBilig = new Station("BILIG", "", 0);
    newBilig.isAssistantBilig = true;
    newBilig.x = W * assistBiligXRatios[idx] - stationW / 2;
    newBilig.y = this._bottomCounterY;
    newBilig.w = stationW;
    newBilig.h = bottomStationH;
    this.assistanceBiligs.push(newBilig);

    const assistant = new AssuranceAutoPlayer(W, H, newBilig, {
      kitchenTopLaneY: this._kitchenTopLaneY,
      kitchenBottomLaneY: this._kitchenBottomLaneY,
    });
    this.assistants.push({
      player: assistant,
      bilig: newBilig,
      timer: ASSISTANT_DURATION,
    });
  }

  // ── Contrats G2S ───────────────────────────────────────────────────────────
  _spawnContract(customer) {
    const W = this.canvas.width;
    const tp = TABLE_POSITIONS[customer.tableIndex];
    if (!tp) return;
    // Position : à droite de la table
    const cx = W * tp.xRatio + 60; // 60px à droite du centre de la table
    const cy = this._counterY * tp.yRatio;
    this.g2sContracts.push({
      x: cx,
      y: cy,
      timer: CONTRACT_DURATION,
      duration: CONTRACT_DURATION,
      tableIndex: customer.tableIndex,
    });
  }

  _updateContracts(dt) {
    this.g2sContracts = this.g2sContracts.filter((c) => {
      c.timer -= dt;
      return c.timer > 0;
    });
  }

  _checkContractCollisions(W, H) {
    if (this.player.zone !== "dining") return;
    if (this.assistants.length >= MAX_ASSISTANTS) {
      this.g2sContracts = [];
      return;
    }
    const px = this.player.x;
    const py = this.player.y;
    this.g2sContracts = this.g2sContracts.filter((c) => {
      const dx = px - c.x;
      const dy = py - c.y;
      if (Math.sqrt(dx * dx + dy * dy) < CONTRACT_COLLECT_RADIUS) {
        this._spawnAssistant(W, H);
        return false;
      }
      return true;
    });
  }

  // ── Incendie & propagation ─────────────────────────────────────────────────
  _updateFireSpread() {
    const allBiligs = [
      ...this.stations.filter((s) => s.type === "BILIG"),
      ...this.assistanceBiligs,
    ];
    for (const bilig of allBiligs) {
      if (
        bilig.biligState === BILIG_STATE.BURNING &&
        bilig.spreadTimer !== null &&
        bilig.spreadTimer <= 0
      ) {
        bilig.spreadTimer = null; // neutralise pour ne pas propager deux fois
        // Trouver le bilig non-brûlant le plus proche
        const target = allBiligs
          .filter((b) => b !== bilig && b.biligState !== BILIG_STATE.BURNING)
          .sort((a, b) => Math.abs(a.x - bilig.x) - Math.abs(b.x - bilig.x))[0];
        if (target) target.setBurning();
      }
    }
  }

  _spawnFirefighter(W, H) {
    const allBiligs = [
      ...this.stations.filter((s) => s.type === "BILIG"),
      ...this.assistanceBiligs,
    ];
    const burningBiligs = allBiligs.filter(
      (b) => b.biligState === BILIG_STATE.BURNING,
    );
    if (burningBiligs.length === 0) return;

    this.firefighter = {
      x: 0, // entre depuis la gauche
      y: this._kitchenTopLaneY,
      targetsQueue: [...burningBiligs],
      targetBilig: burningBiligs[0],
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
        ff.extinguishTimer = 1200;
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
        // Passer au bilig suivant en feu
        ff.targetsQueue.shift();
        const next = ff.targetsQueue.find(
          (b) => b.biligState === BILIG_STATE.BURNING,
        );
        if (next) {
          ff.targetBilig = next;
          ff.state = "walking";
          ff.isMoving = true;
        } else {
          ff.state = "done";
        }
      }
    } else if (ff.state === "done") {
      ff.x += FIREFIGHTER_SPEED * 0.7 * (1 / 60);
      ff.direction = 1;
      ff.isMoving = true;
      if (ff.x > this.canvas.width + 100) {
        this.firefighter = null;
      }
    }
  }

  _drawStationHint(W, gameH) {
    const s = this.player.currentStation;
    if (!s) return;
    const ctx = this.ctx;
    const cx = s.x + s.w / 2;
    // Afficher le hint juste au-dessus du comptoir (en coords canvas = gameH + HUD_H)
    const hintY = s.y + HUD_H - 8;

    const t = Date.now();
    const bob = Math.sin(t / 400) * 2;
    const hint = "[ ESPACE ]";
    ctx.save();
    ctx.font = "bold 12px Arial";
    const tw = ctx.measureText(hint).width;
    const bw = tw + 16,
      bh = 22;
    const bx = cx - bw / 2,
      by = hintY + bob - bh;

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
    ctx.fillStyle = "#333";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(hint, cx, by + bh / 2);
    ctx.restore();
  }

  _updateDOM() {
    // HUD entier dans le canvas — ne rien faire
  }

  // ── Détection de station ───────────────────────────────────────────────────
  _detectStation() {
    if (this.player.zone !== "kitchen") return null;
    const px = this.player.x;
    const py = this.player.y;

    // Comptoir haut
    for (const s of this.stations) {
      if (px >= s.x && px <= s.x + s.w) {
        const frontY = s.y + s.h; // bord avant du comptoir
        if (Math.abs(py - frontY) < INTERACT_Y_TOLERANCE) return s;
      }
    }
    // Comptoir bas (stations spéciales uniquement — les biligs assistants sont exclus)
    for (const s of this.bottomStations) {
      if (px >= s.x && px <= s.x + s.w) {
        const frontY = s.y; // interagir depuis le haut du comptoir bas
        if (Math.abs(py - frontY) < INTERACT_Y_TOLERANCE) return s;
      }
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
          match.handledByAssistant = false;
          const pts = this._calcPoints(match);
          this.score += pts;
          this.crepesServed++;
          this.scoreFlashTimer = 600;
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

          // Particules à la station
          const fx = station.x + station.w / 2;
          const fy = station.y - 20;
          this.renderer.addParticles(fx, fy, "#FFD700", 10);

          // Contrat G2S si le client était patient (> 50%) — spawn à l'arrivée du serveur
          const shouldSpawnContract = match.patienceFraction > 0.5;

          if (this.waiter) {
            // Geler la patience du client pendant le trajet du serveur
            match.state = "served";
            // Le popup de score ET le contrat G2S apparaissent quand le serveur arrive
            const tableIndex = match.tableIndex;
            this.waiter.addDelivery(match, result.crepe, () => {
              if (shouldSpawnContract) this._spawnContract(match);
              const W = this.canvas.width;
              const tp = TABLE_POSITIONS[tableIndex];
              if (tp) {
                const tx = W * tp.xRatio;
                const ty = this._counterY * tp.yRatio - 50;
                this._spawnFloatingText(`+${pts}`, tx, ty);
              }
            });
          } else {
            match.state = "leaving_happy";
          }
        } else {
          // Donation automatique : la crêpe non désirée part directement en don
          station.acceptDelivery();
          this.score += 1;
          this.donationCount++;
          const fx = station.x + station.w / 2;
          const fy = station.y;
          station.flash("#FF8C00");
          this._spawnFloatingText("+1 🫶", fx, fy - 30, "#FF8C00");
          this.renderer.addParticles(fx, fy, "#FF8C00", 8);
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
        this.player.hands = [];
        this.player.triggerInteractFlash();
        this.score += 1;
        this.donationCount++;
        station.flash("#FF8C00");
        const dx = station.x + station.w / 2;
        const dy = station.y - 20;
        this._spawnFloatingText("+1 🫶", dx, dy, "#FF8C00");
        this.renderer.addParticles(dx, dy, "#FF8C00", 8);
        break;
      }

      case "call_g2s": {
        if (this.hasActiveFire) {
          this._spawnFirefighter(this.canvas.width, this._gameH);
          station.flash("#FF4400");
        } else {
          this._spawnFloatingText(
            "Pas d'incendie 🤷",
            station.x + station.w / 2,
            station.y - 30,
            "#888888",
          );
        }
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

  _spawnFloatingText(text, x, y, color = "#2ECC71") {
    this.floatingTexts.push({ text, x, y, color, timer: 2000, maxTimer: 2000 });
    if (color === "#2ECC71") this.scoreFlashTimer = 600;
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

    if (this.customerManager) {
      this.customerManager.customers.forEach((c) => {
        c.handledByAssistant = false;
      });
    }

    const recipeBreakdown = Object.entries(this.recipeBreakdown).map(
      ([label, data]) => ({ label, count: data.count, points: data.points }),
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
    if (e.key === "ArrowUp") {
      this.keys.up = true;
      e.preventDefault();
    }
    if (e.key === "ArrowDown") {
      this.keys.down = true;
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
    if (e.key === "ArrowUp") this.keys.up = false;
    if (e.key === "ArrowDown") this.keys.down = false;
    if (e.key === " ") {
      this.keys.space = false;
      this._spaceConsumed = false;
    }
  }
}
