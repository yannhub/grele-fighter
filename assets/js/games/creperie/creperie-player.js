// creperie-player.js — Joueur avec déplacement 2D (cuisine + salle)

import {
  KITCHEN_BOTTOM_LANE_Y_RATIO,
  KITCHEN_TOP_LANE_Y_RATIO,
  PLAYER_SIZE,
  PLAYER_SPEED,
} from "./creperie-constants.js";

const WALK_FRAME_COUNT = 4;
const WALK_FRAME_DURATION = 120; // ms par frame

export class CreperiePlayer {
  constructor(startX, canvasWidth, canvasHeight) {
    this.x = startX;
    this.y = canvasHeight * KITCHEN_TOP_LANE_Y_RATIO;
    this.size = PLAYER_SIZE;
    this.minX = 22;
    this.maxX = canvasWidth - 22;

    // Zone : "kitchen" ou "dining"
    this.zone = "kitchen";
    // Lane Y (en cuisine) : 0 = haut, 1 = bas
    this._lane = 0;

    // Items tenus en main (max MAX_HANDS)
    this.hands = [];

    // Animation
    this.walkFrame = 0;
    this.walkTimer = 0;
    this.direction = 1; // 1 = droite, -1 = gauche
    this.isMoving = false;

    // Station devant laquelle le joueur se trouve (mis à jour chaque frame)
    this.currentStation = null;

    // Feedback flash (item reçu / déposé)
    this.interactFlashTimer = 0;
  }

  onResize(canvasWidth, canvasHeight) {
    this.maxX = canvasWidth - 22;
    // Recalcule Y selon la zone actuelle
    if (this.zone === "kitchen") {
      if (this._lane === 0) {
        this.y = canvasHeight * KITCHEN_TOP_LANE_Y_RATIO;
      } else {
        this.y = canvasHeight * KITCHEN_BOTTOM_LANE_Y_RATIO;
      }
    }
    this.x = Math.max(this.minX, Math.min(this.maxX, this.x));
  }

  update(dt, keys, gameLayout) {
    const {
      gameH,
      counterY,
      passageX,
      kitchenTopLaneY,
      kitchenBottomLaneY,
      tableRects = [],
    } = gameLayout || {};

    const spd = PLAYER_SPEED * (dt / 1000);
    let moving = false;

    if (this.zone === "kitchen") {
      // ── Mouvement horizontal ─────────────────────────────────────────────
      if (keys.left) {
        this.x -= spd;
        this.direction = -1;
        moving = true;
      }
      if (keys.right) {
        this.x += spd;
        this.direction = 1;
        moving = true;
      }
      this.x = Math.max(this.minX, Math.min(this.maxX, this.x));

      // ── Mouvement vertical entre les deux lanes ──────────────────────────
      if (keys.up && this._lane === 1) {
        this._lane = 0;
        this.y = kitchenTopLaneY;
      }
      if (keys.down && this._lane === 0) {
        this._lane = 1;
        this.y = kitchenBottomLaneY;
      }

      // ── Transition vers la salle (montée + à droite du passage) ──────────
      if (keys.up && this._lane === 0 && this.x > passageX - 20) {
        this.zone = "dining";
        this.y = counterY - PLAYER_SIZE / 2; // arriver en bas de la salle, près du comptoir
        this._lane = 0;
        this.direction = -1;
      }
    } else {
      // ── Mouvement libre dans la salle (2D) ───────────────────────────────
      let nx = this.x,
        ny = this.y;
      if (keys.left) {
        nx -= spd;
        this.direction = -1;
        moving = true;
      }
      if (keys.right) {
        nx += spd;
        this.direction = 1;
        moving = true;
      }
      if (keys.up) {
        ny -= spd;
        moving = true;
      }
      if (keys.down) {
        ny += spd;
        moving = true;
      }

      // Bornes
      nx = Math.max(this.minX, Math.min(this.maxX, nx));
      ny = Math.max(4, Math.min(counterY - 16, ny));

      this.x = nx;
      this.y = ny;

      // ── Transition retour cuisine (descente + à droite du passage) ────────
      if (keys.down && this.y >= counterY - 20 && this.x > passageX - 20) {
        this.zone = "kitchen";
        this._lane = 0;
        this.y = kitchenTopLaneY;
      }
    }

    // Animation de marche
    if (keys.left || keys.right || keys.up || keys.down) {
      moving = true;
      this.walkTimer += dt;
      if (this.walkTimer >= WALK_FRAME_DURATION) {
        this.walkFrame = (this.walkFrame + 1) % WALK_FRAME_COUNT;
        this.walkTimer = 0;
      }
    } else {
      moving = false;
      this.walkFrame = 0;
      this.walkTimer = 0;
    }
    this.isMoving = moving;

    if (this.interactFlashTimer > 0) {
      this.interactFlashTimer = Math.max(0, this.interactFlashTimer - dt);
    }
  }

  triggerInteractFlash() {
    this.interactFlashTimer = 200;
  }
}
