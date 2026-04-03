// creperie-waiter.js — Serveur NPC qui livre les commandes aux tables

import {
  COUNTER_Y_RATIO,
  TABLE_POSITIONS,
  WAITER_SPEED,
} from "./creperie-constants.js";

export class CreperieWaiter {
  constructor(canvasWidth, canvasHeight) {
    this.homeX = canvasWidth * 0.89;
    this.homeY = canvasHeight * COUNTER_Y_RATIO - 35;
    this.x = this.homeX;
    this.y = this.homeY;
    this.size = 75;
    this.speed = WAITER_SPEED;
    this.direction = 1;
    this.isMoving = false;
    this.walkFrame = 0;

    // State machine: idle | delivering | returning
    this.state = "idle";
    this.deliveryQueue = []; // [{customer, crepe}]
    this.currentDelivery = null;
    this.heldCrepe = null;

    this.targetX = 0;
    this.targetY = 0;
    this.idleTimer = 0;
  }

  onResize(W, H) {
    this.homeX = W * 0.89;
    this.homeY = H * COUNTER_Y_RATIO - 35;
    if (this.state === "idle") {
      this.x = this.homeX;
      this.y = this.homeY;
    }
  }

  /**
   * Queue a delivery: waiter will pick up the crêpe and walk to the customer's table.
   * The customer should be in "served" state (patience frozen, waiting for food).
   */
  addDelivery(customer, crepe) {
    this.deliveryQueue.push({ customer, crepe });
  }

  update(dt, canvasWidth, canvasHeight) {
    const dtS = dt / 1000;

    if (this.state === "idle") {
      this.isMoving = false;
      this.idleTimer += dt;

      if (this.deliveryQueue.length > 0) {
        this.currentDelivery = this.deliveryQueue.shift();
        this.heldCrepe = this.currentDelivery.crepe;
        this.state = "delivering";

        // Calculate pixel target from customer's table position
        const c = this.currentDelivery.customer;
        const tp = TABLE_POSITIONS[c.tableIndex];
        if (tp) {
          const rH = canvasHeight * COUNTER_Y_RATIO; // restaurant zone height
          this.targetX = canvasWidth * tp.xRatio;
          this.targetY = rH * tp.yRatio + 30; // slightly below table center
        }
      }
      return;
    }

    if (this.state === "delivering") {
      this.walkFrame += dt / 80;
      if (this._moveToward(dtS)) {
        // Arrived at table — customer gets food
        const c = this.currentDelivery.customer;
        if (c.state === "served") {
          c.state = "leaving_happy";
        }
        this.heldCrepe = null;
        this.currentDelivery = null;
        this.state = "returning";
        this.targetX = this.homeX;
        this.targetY = this.homeY;
      }
      return;
    }

    if (this.state === "returning") {
      this.walkFrame += dt / 80;
      if (this._moveToward(dtS)) {
        this.state = "idle";
        this.isMoving = false;
      }
    }
  }

  _moveToward(dtS) {
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 5) {
      this.x = this.targetX;
      this.y = this.targetY;
      this.isMoving = false;
      return true;
    }

    const step = this.speed * dtS;
    const nx = dx / dist;
    const ny = dy / dist;
    this.x += nx * Math.min(step, dist);
    this.y += ny * Math.min(step, dist);
    this.direction = dx > 0 ? 1 : -1;
    this.isMoving = true;
    return false;
  }

  get isBusy() {
    return this.state !== "idle" || this.deliveryQueue.length > 0;
  }
}
