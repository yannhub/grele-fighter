// creperie-game.js — Coordinateur principal du jeu Crêperie

import {
  COUNTER_HEIGHT_RATIO,
  COUNTER_Y_RATIO,
  GAME_DURATION,
  MAX_HANDS,
  MAX_HEARTS,
  STATION_LAYOUT,
  BONUS_DURATION,
  BONUS_COOK_SPEEDUP,
} from "./creperie-constants.js";
import { CustomerManager } from "./creperie-customers.js";
import { CreperiePlayer } from "./creperie-player.js";
import { CreperieRenderer } from "./creperie-renderer.js";
import { createStations } from "./creperie-stations.js";
import { AssuranceAutoPlayer } from "./creperie-auto-player.js";

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
    this.recipeBreakdown = {}; // { label → { count, totalPoints } }

    // Input
    this.keys = { left: false, right: false, space: false };
    this._spaceConsumed = false;

    // Bonus Assurance G2S
    this.bonusActive = false;
    this.bonusTimer = 0;     // secondes restantes
    this.bonusUsed = false;  // une seule utilisation par partie
    this.autoPlayer = null;

    // Sous-systèmes (créés dans startGame)
    this.stations = [];
    this.player = null;
    this.customerManager = null;
    this.renderer = null;

    // Feedback livraison
    this.deliveryFeedback = null;

    // Handlers d'événements (liés à this pour pouvoir les retirer)
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
  }

  startGame() {
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
    this.bonusActive = false;
    this.bonusTimer = 0;
    this.bonusUsed = false;
    this.autoPlayer = null;

    // S'assurer que le canvas est correctement dimensionné maintenant qu'il est visible
    this.resizeGame();

    // Créer les sous-systèmes
    this.stations = createStations(STATION_LAYOUT);
    this.player = new CreperiePlayer(this.canvas.width / 2, this.canvas.height);
    this.customerManager = new CustomerManager(
      () => this._onUnhappyGameOver(),
      () => { this.heartsLeft = Math.max(0, this.heartsLeft - 1); this._updateDOM(); },
    );
    this.renderer = new CreperieRenderer(this.ctx);

    this._layoutStations();
    this.player.onResize(this.canvas.width, this.canvas.height);

    // Écouter le clavier
    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);

    // Lancer la boucle
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

    // Largeur d'un poste : ~8% de la largeur du canvas (min 50px)
    const stationW = Math.max(50, W * 0.078);
    const stationH = counterH * 0.85;

    this.stations.forEach((s) => {
      s.x = W * s.xRatio - stationW / 2;
      s.y = counterY;
      s.w = stationW;
      s.h = stationH;
    });
  }

  // ── Boucle principale ──────────────────────────────────────────────────────
  _gameLoop(timestamp) {
    if (!this.isRunning) return;

    const dt = this.lastTimestamp
      ? Math.min(80, timestamp - this.lastTimestamp)
      : 16;
    this.lastTimestamp = timestamp;

    // Mise à jour du temps
    this.timeLeft = Math.max(0, this.timeLeft - dt / 1000);
    if (this.timeLeft === 0) {
      this._stopGame("time");
      return;
    }

    const elapsed = GAME_DURATION - this.timeLeft;

    // Mise à jour du bonus Assurance G2S
    const cookMult = this.bonusActive ? BONUS_COOK_SPEEDUP : 1;
    if (this.bonusActive) {
      this.bonusTimer -= dt / 1000;
      if (this.bonusTimer <= 0) {
        this.bonusActive = false;
        this.bonusTimer = 0;
        this.autoPlayer = null;
      } else if (this.autoPlayer) {
        this.autoPlayer.update(dt, this.stations, this.customerManager, this);
      }
    }

    // Mise à jour des sous-systèmes
    this.stations.forEach((s) => s.update(dt, cookMult));
    this.player.update(dt, this.keys);
    this.customerManager.update(dt, elapsed);

    // Détecter la station active (chevauchement horizontal avec Cerise)
    this.player.currentStation = this._detectStation();

    // Traiter l'action ESPACE (une seule fois par pression)
    if (this.keys.space && !this._spaceConsumed) {
      this._processInteraction();
      this._spaceConsumed = true;
    }

    // Mise à jour des particules
    this.renderer.updateParticles(dt);

    // Feedback livraison
    if (this.deliveryFeedback) {
      this.deliveryFeedback.timer -= dt;
    }

    // Mise à jour de l'affichage DOM (score + timer avec cœurs)
    this._updateDOM();

    // Rendu canvas
    const W = this.canvas.width;
    const H = this.canvas.height;
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
      this.autoPlayer,
      this.bonusActive ? this.bonusTimer : null,
    );

    // Afficher l'indicateur de station disponible (surimpression)
    this._drawStationHint(W, H);

    this.rafId = requestAnimationFrame(this._loop);
  }

  _drawStationHint(W, H) {
    const s = this.player.currentStation;
    if (!s) return;
    const ctx = this.ctx;
    const cx = s.x + s.w / 2;
    const counterY = H * COUNTER_Y_RATIO;

    ctx.save();
    ctx.font = "bold 11px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.lineWidth = 3;
    const hint = "[ ESPACE ]";
    ctx.strokeText(hint, cx, counterY - 4);
    ctx.fillText(hint, cx, counterY - 4);
    ctx.restore();
  }

  _updateDOM() {
    if (!this.ui) return;
    const mins = Math.floor(this.timeLeft / 60);
    const secs = Math.floor(this.timeLeft) % 60;
    const timeStr = `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    const hearts =
      "❤️".repeat(this.heartsLeft) + "🖤".repeat(MAX_HEARTS - this.heartsLeft);
    const bonusHint = !this.bonusUsed
      ? ` &nbsp;<span style="color:#E30613;font-weight:bold">[A] 🛡️</span>`
      : "";

    if (this.ui.scoreDisplay) {
      this.ui.scoreDisplay.innerHTML =
        `Score: <span id="current-score">${this.score}</span> &nbsp;` +
        `${hearts} &nbsp;` +
        `Temps: <span id="timer">${timeStr}</span>` +
        bonusHint;
    }
  }

  // ── Détection de station ───────────────────────────────────────────────────
  _detectStation() {
    const px = this.player.x;
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
        // Item enlevé des mains par la station, chercher un client
        this.player.hands.splice(result.itemIndex, 1);
        const toppings = result.crepe.toppings || [];
        const match = this.customerManager.tryMatch(toppings);

        if (match) {
          const pts = this._calcPoints(match);
          this.score += pts;
          this.crepesServed++;
          station.acceptDelivery();

          // Enregistrer pour le récap
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

          // Récompense visuelle
          const fx = station.x + station.w / 2;
          const fy = station.y - 20;
          this._showDeliveryFeedback(`+${pts} pts 🎉`, "#2ECC71", fx, fy);
          this.renderer.addParticles(fx, fy, "#FFD700", 10);
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

      case "trash":
        this.player.hands = [];
        this.player.triggerInteractFlash();
        break;

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

    // Construire le tableau récap
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
        this._spaceConsumed = false; // nouvelle pression
      }
      e.preventDefault();
    }
    if ((e.key === "a" || e.key === "A") && !this.bonusUsed && this.isRunning) {
      this.bonusUsed = true;
      this.bonusActive = true;
      this.bonusTimer = BONUS_DURATION;
      this.autoPlayer = new AssuranceAutoPlayer(
        this.canvas.width,
        this.canvas.height,
      );
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
