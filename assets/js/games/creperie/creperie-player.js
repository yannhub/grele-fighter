// creperie-player.js — Joueur (Cerise) avec déplacement horizontal

import { PLAYER_SIZE, PLAYER_SPEED } from "./creperie-constants.js";

const WALK_FRAME_COUNT = 4;
const WALK_FRAME_DURATION = 120; // ms par frame

export class CreperiePlayer {
  constructor(startX, canvasHeight) {
    this.x = startX;
    this.y = canvasHeight * 0.8;
    this.size = PLAYER_SIZE;
    this.minX = 20;
    this.maxX = 800 - 20;

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
    this.maxX = canvasWidth - 20;
    this.y = canvasHeight * 0.8;
    // Reclamper x
    this.x = Math.max(this.minX, Math.min(this.maxX, this.x));
  }

  update(dt, keys) {
    let dx = 0;
    if (keys.left) dx -= PLAYER_SPEED * (dt / 1000);
    if (keys.right) dx += PLAYER_SPEED * (dt / 1000);

    if (dx !== 0) {
      this.x = Math.max(this.minX, Math.min(this.maxX, this.x + dx));
      this.direction = dx > 0 ? 1 : -1;
      this.isMoving = true;

      this.walkTimer += dt;
      if (this.walkTimer >= WALK_FRAME_DURATION) {
        this.walkFrame = (this.walkFrame + 1) % WALK_FRAME_COUNT;
        this.walkTimer = 0;
      }
    } else {
      this.isMoving = false;
      this.walkFrame = 0;
      this.walkTimer = 0;
    }

    if (this.interactFlashTimer > 0) {
      this.interactFlashTimer = Math.max(0, this.interactFlashTimer - dt);
    }
  }

  triggerInteractFlash() {
    this.interactFlashTimer = 200;
  }
}
