// creperie-renderer.js — Rendu complet du jeu Crêperie (dessin procédural Canvas 2D)

import {
  COUNTER_HEIGHT_RATIO,
  COUNTER_Y_RATIO,
  IT,
  ITEM_COLORS,
  ITEM_ICONS,
  ST,
  TABLE_POSITIONS,
} from "./creperie-constants.js";
import { BILIG_STATE } from "./creperie-stations.js";

// ─── Palettes ────────────────────────────────────────────────────────────────
const COL = {
  // Salle du restaurant
  FLOOR_RESTAURANT: "#FFF0DC",
  FLOOR_TILE_A: "#FAE8C8",
  FLOOR_TILE_B: "#F0D8B0",
  WALL: "#F5E6CF",
  WALL_STRIP: "#E8D4B0",
  BASEBOARD: "#C4956A",

  // Comptoir
  COUNTER_TOP: "#A0522D",
  COUNTER_FRONT: "#7B3F1E",
  COUNTER_EDGE: "#5C2E10",

  // Cuisine (dessous comptoir)
  FLOOR_KITCHEN: "#D4C4A8",
  FLOOR_KITCHEN_LINE: "#BEB09A",

  // Mobilier
  TABLE_TOP: "#DEB887",
  TABLE_LEG: "#A0522D",
  CHAIR: "#CD853F",
  CHAIR_CUSHION: "#8B0000",

  // Bilig
  BILIG_EMPTY: "#888",
  BILIG_COOKING: "#E8A020",
  BILIG_READY: "#D4A000",
  BILIG_GLOW: "#FFD060",
  BILIG_BLACK: "#222",

  // Stations ingrédients
  STATION_BASE: "#F5E6D0",
  STATION_BORDER: "#D4A070",

  // Livraison
  DELIVERY_BASE: "#2ECC71",
  DELIVERY_BORDER: "#27AE60",
  DELIVERY_REJECT: "#E74C3C",

  // Poubelle
  TRASH_BASE: "#95A5A6",
  TRASH_BORDER: "#7F8C8D",
  TRASH_LID: "#7F8C8D",

  // Bulle client
  BUBBLE_BG: "#FFFFFFEE",
  BUBBLE_BORDER: "#DDD",

  // HUD
  HEART_FULL: "#E74C3C",
  HEART_EMPTY: "#555",
  HUD_BG: "rgba(0,0,0,0.45)",

  // Texte
  TEXT_LABEL: "#5C3317",
  TEXT_WHITE: "#FFFFFF",
  TEXT_DARK: "#222222",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function fillText(ctx, text, x, y, font, color, align = "center") {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
  ctx.restore();
}

// ─── Renderer ────────────────────────────────────────────────────────────────
export class CreperieRenderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.deliveryFeedback = null; // { msg, color, timer, x, y }
    this.particles = []; // effets de particules
  }

  onResize() {
    // Pas d'état dépendant de la taille pour l'instant
  }

  // Point d'entrée principal
  render(
    canvas,
    stations,
    player,
    customerManager,
    score,
    timeLeft,
    heartsLeft,
    maxHearts,
    deliveryFeedback,
    autoPlayer = null,
    bonusTimer = null,
  ) {
    const W = canvas.width;
    const H = canvas.height;
    const ctx = this.ctx;
    const counterY = H * COUNTER_Y_RATIO;
    const counterH = H * COUNTER_HEIGHT_RATIO;

    ctx.clearRect(0, 0, W, H);

    this._drawBackground(W, H, counterY, counterH);
    this._drawFurniture(W, H, counterY, customerManager);
    this._drawCustomers(W, H, counterY, customerManager.customers);
    this._drawCounter(W, counterY, counterH);
    this._drawStations(stations, counterY, counterH);
    this._drawPlayer(player, counterY, counterH);
    if (autoPlayer) this._drawAutoPlayer(autoPlayer, counterY);
    this._drawParticles();
    this._drawDeliveryFeedback(deliveryFeedback);
    this._drawHUD(ctx, W, H, score, timeLeft, heartsLeft, maxHearts);
    if (bonusTimer !== null) this._drawBonusIndicator(ctx, W, H, bonusTimer);
  }

  // ── Arrière-plan ────────────────────────────────────────────────────────────
  _drawBackground(W, H, counterY, counterH) {
    const ctx = this.ctx;
    const restaurantH = counterY;

    // Mur du fond (restaurant)
    ctx.fillStyle = COL.WALL;
    ctx.fillRect(0, 0, W, restaurantH);

    // Frise décorative sur le mur
    ctx.fillStyle = COL.WALL_STRIP;
    ctx.fillRect(0, restaurantH * 0.7, W, 8);
    const stripeW = 60;
    for (let xs = 0; xs < W; xs += stripeW * 2) {
      ctx.fillRect(xs, restaurantH * 0.7, stripeW, 8);
    }

    // Plinthe
    ctx.fillStyle = COL.BASEBOARD;
    ctx.fillRect(0, counterY - 10, W, 10);

    // Sol du restaurant (damier subtil)
    const tileS = 40;
    for (let tx = 0; tx < W; tx += tileS) {
      for (
        let ty = Math.floor(restaurantH * 0.75);
        ty < restaurantH;
        ty += tileS
      ) {
        const colIdx = (Math.floor(tx / tileS) + Math.floor(ty / tileS)) % 2;
        ctx.fillStyle = colIdx === 0 ? COL.FLOOR_TILE_A : COL.FLOOR_TILE_B;
        ctx.fillRect(tx, ty, tileS, tileS);
      }
    }

    // Sol cuisine (sous le comptoir)
    ctx.fillStyle = COL.FLOOR_KITCHEN;
    ctx.fillRect(0, counterY + counterH, W, H - (counterY + counterH));

    // Lignes de carrelage cuisine
    const kTile = 35;
    ctx.strokeStyle = COL.FLOOR_KITCHEN_LINE;
    ctx.lineWidth = 0.5;
    for (let lx = 0; lx < W; lx += kTile) {
      ctx.beginPath();
      ctx.moveTo(lx, counterY + counterH);
      ctx.lineTo(lx, H);
      ctx.stroke();
    }
    for (let ly = counterY + counterH; ly < H; ly += kTile) {
      ctx.beginPath();
      ctx.moveTo(0, ly);
      ctx.lineTo(W, ly);
      ctx.stroke();
    }

    // Lampes suspendues (décoration)
    this._drawLamps(W, restaurantH);
  }

  _drawLamps(W, restaurantH) {
    const ctx = this.ctx;
    const lampY = restaurantH * 0.12;
    const lampPositions = [0.15, 0.45, 0.75];
    lampPositions.forEach((xr) => {
      const lx = W * xr;
      // Fil
      ctx.strokeStyle = "#8B7355";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, lampY - 12);
      ctx.stroke();
      // Abat-jour
      ctx.beginPath();
      ctx.moveTo(lx - 18, lampY - 12);
      ctx.lineTo(lx + 18, lampY - 12);
      ctx.lineTo(lx + 12, lampY + 8);
      ctx.lineTo(lx - 12, lampY + 8);
      ctx.closePath();
      ctx.fillStyle = "#D4A030";
      ctx.fill();
      ctx.strokeStyle = "#A07020";
      ctx.lineWidth = 1;
      ctx.stroke();
      // Ampoule
      ctx.beginPath();
      ctx.arc(lx, lampY + 14, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#FFFACD";
      ctx.fill();
    });
  }

  // ── Mobilier ────────────────────────────────────────────────────────────────
  _drawFurniture(W, H, counterY, customerManager) {
    const ctx = this.ctx;
    const restaurantH = counterY;
    TABLE_POSITIONS.forEach((pos, i) => {
      const tx = W * pos.xRatio;
      const ty = restaurantH * pos.yRatio;
      const customer = customerManager.customers.find(
        (c) => c.tableIndex === i,
      );
      this._drawTable(tx, ty, customer, i);
    });
  }

  _drawTable(cx, cy, customer, tableIdx) {
    const ctx = this.ctx;
    const tw = 70,
      th = 44;

    // Plan de table
    roundRect(ctx, cx - tw / 2, cy - th / 2, tw, th, 6);
    ctx.fillStyle = COL.TABLE_TOP;
    ctx.fill();
    ctx.strokeStyle = "#9A7040";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Nappe légère
    roundRect(ctx, cx - tw / 2 + 4, cy - th / 2 + 4, tw - 8, th - 8, 4);
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fill();

    // Pieds de table
    const legOffset = tw / 2 - 8;
    ctx.fillStyle = COL.TABLE_LEG;
    [
      [-legOffset, th / 2],
      [legOffset, th / 2],
    ].forEach(([ox, oy]) => {
      ctx.fillRect(cx + ox - 3, cy + oy, 6, 12);
    });

    // Chaises (haut et bas de la table)
    this._drawChair(
      cx,
      cy - th / 2 - 18,
      false,
      customer?.state === "seated" || customer?.state === "leaving_happy",
    );
    this._drawChair(cx, cy + th / 2 + 18, true, false);
  }

  _drawChair(cx, cy, flipped, occupied) {
    const ctx = this.ctx;
    const cw = 30,
      ch = 18;

    ctx.save();
    if (flipped) ctx.scale(1, -1) && null; // note: not using transform for simplicity

    roundRect(ctx, cx - cw / 2, cy - ch / 2, cw, ch, 4);
    ctx.fillStyle = occupied ? "#A0302A" : COL.CHAIR;
    ctx.fill();
    ctx.strokeStyle = "#8B5E3C";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Dossier
    const backH = 14;
    const backDir = flipped ? 1 : -1;
    roundRect(
      ctx,
      cx - cw / 2 + 2,
      cy + backDir * (ch / 2),
      cw - 4,
      backH * backDir,
      3,
    );
    ctx.fillStyle = occupied ? "#8B2520" : "#B87040";
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // ── Clients ─────────────────────────────────────────────────────────────────
  _drawCustomers(W, H, counterY, customers) {
    const restaurantH = counterY;
    customers.forEach((c) => {
      const tablePos = TABLE_POSITIONS[c.tableIndex];
      if (!tablePos) return;

      const tx = W * tablePos.xRatio;
      const ty = restaurantH * tablePos.yRatio - 22; // chaise du haut

      let alpha = 1;
      let scale = 1;
      if (c.state === "arriving") {
        alpha = c.arrivalProgress;
        scale = 0.5 + c.arrivalProgress * 0.5;
      } else if (c.state === "leaving_happy" || c.state === "leaving_angry") {
        const p = c.leavingTimer / c.leavingDuration;
        alpha = 1 - p;
        scale = 1 + p * 0.3;
      }

      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      this.ctx.translate(tx, ty);
      this.ctx.scale(scale, scale);
      this._drawCustomerBody(c);
      this._drawSpeechBubble(c);
      this.ctx.restore();
    });
  }

  _drawCustomerBody(customer) {
    const ctx = this.ctx;
    const isAngry =
      customer.state === "leaving_angry" ||
      (customer.state === "seated" && customer.patienceFraction < 0.25);
    const isHappy = customer.state === "leaving_happy";

    // Corps simple (silhouette)
    const bodyColors = ["#4A90D9", "#E67E22", "#8E44AD"];
    const bodyColor = bodyColors[customer.tableIndex % 3];

    // Tête
    ctx.beginPath();
    ctx.arc(0, -22, 10, 0, Math.PI * 2);
    ctx.fillStyle = "#FDBCB4";
    ctx.fill();
    ctx.strokeStyle = "#D09080";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Corps
    roundRect(ctx, -10, -12, 20, 22, 4);
    ctx.fillStyle = bodyColor;
    ctx.fill();

    // Expressions
    ctx.fillStyle = "#333";
    ctx.font = "bold 8px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (isHappy) {
      ctx.fillStyle = "#2ECC71";
      ctx.fillText("😊", 0, -22);
    } else if (isAngry) {
      ctx.fillStyle = "#E74C3C";
      ctx.fillText("😠", 0, -22);
    } else {
      // Yeux
      ctx.fillStyle = "#333";
      ctx.beginPath();
      ctx.arc(-3, -23, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(3, -23, 1.5, 0, Math.PI * 2);
      ctx.fill();
      // Bouche
      ctx.beginPath();
      ctx.arc(0, -19, 4, 0, Math.PI);
      ctx.stroke();
    }
  }

  _drawSpeechBubble(customer) {
    if (customer.state !== "seated") return;
    const ctx = this.ctx;
    const bw = 90,
      bh = 56;
    const bx = -bw / 2,
      by = 52; // en dessous de la table

    // Ombre
    ctx.shadowBlur = 6;
    ctx.shadowColor = "rgba(0,0,0,0.15)";
    roundRect(ctx, bx, by, bw, bh, 8);
    ctx.fillStyle = COL.BUBBLE_BG;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = COL.BUBBLE_BORDER;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Queue de bulle (pointe vers le haut)
    ctx.beginPath();
    ctx.moveTo(bx + bw / 2 - 6, by);
    ctx.lineTo(bx + bw / 2, by - 8);
    ctx.lineTo(bx + bw / 2 + 6, by);
    ctx.closePath();
    ctx.fillStyle = COL.BUBBLE_BG;
    ctx.fill();

    // Timer de patience (arc)
    const pf = customer.patienceFraction;
    const timerColor = pf > 0.5 ? "#2ECC71" : pf > 0.25 ? "#F39C12" : "#E74C3C";
    const timerR = 8;
    const timerX = bx + bw - timerR - 4;
    const timerY = by + timerR + 4;
    ctx.beginPath();
    ctx.arc(
      timerX,
      timerY,
      timerR,
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * pf,
    );
    ctx.strokeStyle = timerColor;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(timerX, timerY, timerR, 0, Math.PI * 2);
    ctx.strokeStyle = "#DDD";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Icônes de la recette
    const icons = customer.recipe.toppings.map((t) => ITEM_ICONS[t] || "?");
    const iconSize = 22;
    const totalW = icons.length * (iconSize + 4) - 4;
    const startX = bx + (bw - totalW) / 2;
    ctx.font = `${iconSize}px serif`;
    ctx.textBaseline = "middle";
    icons.forEach((icon, i) => {
      ctx.fillText(
        icon,
        startX + i * (iconSize + 4) + iconSize / 2,
        by + bh / 2 + 6,
      );
    });

    // Nom recette
    ctx.font = "bold 8px Arial";
    ctx.fillStyle = "#555";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(customer.recipe.label, bx + bw / 2, by + 10);
  }

  // ── Comptoir ────────────────────────────────────────────────────────────────
  _drawCounter(W, counterY, counterH) {
    const ctx = this.ctx;

    // Plan de travail (dessus)
    const topH = 10;
    ctx.fillStyle = COL.COUNTER_TOP;
    ctx.fillRect(0, counterY, W, topH);

    // Façade du comptoir
    ctx.fillStyle = COL.COUNTER_FRONT;
    ctx.fillRect(0, counterY + topH, W, counterH - topH);

    // Reflets / planches
    ctx.strokeStyle = COL.COUNTER_EDGE;
    ctx.lineWidth = 1;
    for (let lx = 0; lx < W; lx += 80) {
      ctx.beginPath();
      ctx.moveTo(lx, counterY + topH);
      ctx.lineTo(lx, counterY + counterH);
      ctx.stroke();
    }

    // Tranche basse du comptoir
    ctx.fillStyle = COL.COUNTER_EDGE;
    ctx.fillRect(0, counterY + counterH - 4, W, 4);
  }

  // ── Postes ──────────────────────────────────────────────────────────────────
  _drawStations(stations, counterY, counterH) {
    stations.forEach((s) => {
      this._drawStation(s, counterY, counterH);
    });
  }

  _drawStation(s, counterY, counterH) {
    const ctx = this.ctx;
    const sw = s.w,
      sh = s.h;
    const sx = s.x,
      sy = s.y;

    // Flash d'interaction
    if (s.flashTimer > 0 && s.flashColor) {
      const alpha = s.flashTimer / 600;
      ctx.save();
      ctx.globalAlpha = alpha * 0.6;
      roundRect(ctx, sx - 2, sy - 2, sw + 4, sh + 4, 6);
      ctx.fillStyle = s.flashColor;
      ctx.fill();
      ctx.restore();
    }

    switch (s.type) {
      case ST.BILIG:
        this._drawBilig(s, sx, sy, sw, sh);
        break;
      case ST.DELIVERY:
        this._drawDeliveryStation(s, sx, sy, sw, sh);
        break;
      case ST.TRASH:
        this._drawTrash(s, sx, sy, sw, sh);
        break;
      case ST.BATTER:
        this._drawBatterStation(s, sx, sy, sw, sh);
        break;
      default:
        this._drawIngredientStation(s, sx, sy, sw, sh);
    }

    // Label du poste
    ctx.save();
    ctx.font = `bold ${Math.max(9, sw * 0.18)}px Arial`;
    ctx.fillStyle = COL.TEXT_LABEL;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(s.label, sx + sw / 2, sy + sh + 3);
    ctx.restore();
  }

  _drawBilig(s, sx, sy, sw, sh) {
    const ctx = this.ctx;
    const cx = sx + sw / 2,
      cy = sy + sh * 0.5;
    const r = Math.min(sw, sh) * 0.38;

    // Support bilig (pied)
    ctx.fillStyle = "#555";
    ctx.fillRect(cx - 4, sy + sh * 0.85, 8, sh * 0.15);

    // Surface de cuisson (cercle principal)
    let surfaceColor;
    if (s.biligState === BILIG_STATE.EMPTY) {
      surfaceColor = COL.BILIG_EMPTY;
    } else if (s.biligState === BILIG_STATE.COOKING) {
      // Interpoler entre gris et orange selon progression
      const t = s.cookProgress;
      surfaceColor = this._lerpColor(COL.BILIG_EMPTY, COL.BILIG_COOKING, t);
    } else {
      surfaceColor = COL.BILIG_READY;
    }

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = "#333"; // bord sombre
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, r - 3, 0, Math.PI * 2);
    ctx.fillStyle = surfaceColor;
    ctx.fill();

    // Motif de surface (lignes de cuisson)
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.lineWidth = 0.8;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(cx, cy, (r - 3) * (i / 4), 0, Math.PI * 2);
      ctx.stroke();
    }

    // Crêpe sur bilig (si ingrédients déposés OU prête)
    if (s.biligState === BILIG_STATE.READY) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, r - 6, r - 9, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#DEB887";
      ctx.fill();

      // Points dorés (grillé)
      ctx.fillStyle = "#A06820";
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const pr = (r - 10) * 0.6;
        ctx.beginPath();
        ctx.arc(
          cx + Math.cos(angle) * pr,
          cy + Math.sin(angle) * pr,
          2,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }

      // Indicateur toppings sur bilig
      s.biligToppings.forEach((tt, i) => {
        const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
        ctx.font = `${Math.max(10, sw * 0.22)}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          ITEM_ICONS[tt] || "?",
          cx + Math.cos(angle) * (r - 12),
          cy + Math.sin(angle) * (r - 12),
        );
      });

      // Lueur "prêt" pulsante
      const glow = Math.sin(Date.now() / 300) * 0.3 + 0.5;
      ctx.save();
      ctx.globalAlpha = glow * 0.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
      ctx.strokeStyle = COL.BILIG_GLOW;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();

      // "PRÊT!" badge
      ctx.save();
      ctx.font = `bold ${Math.max(8, sw * 0.17)}px Arial`;
      ctx.fillStyle = "#FFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = COL.BILIG_GLOW;
      ctx.fillText("✓", cx, cy + r + 10);
      ctx.restore();
    }

    // Barre de progression de cuisson
    if (s.biligState === BILIG_STATE.COOKING) {
      const barW = sw - 6,
        barH = 6;
      const barX = sx + 3,
        barY = sy + sh - 12;
      ctx.fillStyle = "#333";
      roundRect(ctx, barX, barY, barW, barH, 3);
      ctx.fill();
      ctx.fillStyle = this._lerpColor("#FF6B00", "#FFD700", s.cookProgress);
      roundRect(ctx, barX, barY, barW * s.cookProgress, barH, 3);
      ctx.fill();

      // Afficher ingrédients déjà déposés
      s.biligToppings.forEach((tt, i) => {
        ctx.font = `${Math.max(9, sw * 0.18)}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          ITEM_ICONS[tt] || "?",
          sx + (i + 0.5) * (sw / 3),
          sy + sh * 0.25,
        );
      });
    }
  }

  _drawBatterStation(s, sx, sy, sw, sh) {
    const ctx = this.ctx;
    const cx = sx + sw / 2,
      cy = sy + sh * 0.45;

    // Bidon de pâte
    roundRect(ctx, sx + 4, sy + 4, sw - 8, sh * 0.7, 6);
    ctx.fillStyle = "#D4C48A";
    ctx.fill();
    ctx.strokeStyle = "#A0906A";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Couvercle
    roundRect(ctx, sx + 2, sy + 2, sw - 4, sh * 0.18, 4);
    ctx.fillStyle = "#8B7340";
    ctx.fill();

    // Icône pâte
    ctx.font = `${sw * 0.38}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🥣", cx, cy + sh * 0.15);
  }

  _drawIngredientStation(s, sx, sy, sw, sh) {
    const ctx = this.ctx;
    const cx = sx + sw / 2,
      cy = sy + sh * 0.45;

    // Assiette / bol
    roundRect(ctx, sx + 3, sy + sh * 0.3, sw - 6, sh * 0.5, 5);
    ctx.fillStyle = COL.STATION_BASE;
    ctx.fill();
    ctx.strokeStyle = COL.STATION_BORDER;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Icône ingrédient
    const icon = ITEM_ICONS[s.type] || "?";
    ctx.font = `${Math.max(14, sw * 0.35)}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(icon, cx, cy + sh * 0.15);
  }

  _drawDeliveryStation(s, sx, sy, sw, sh) {
    const ctx = this.ctx;
    const cx = sx + sw / 2;

    const hasRejected = s.deliveryStatus === "rejected";
    const hasWaiting = s.deliveryStatus === "waiting";
    const isEmpty = s.deliveryStatus === "empty";

    // Base du poste d'envoi
    roundRect(ctx, sx + 2, sy + 4, sw - 4, sh - 4, 6);
    ctx.fillStyle = isEmpty
      ? COL.DELIVERY_BASE
      : hasRejected
        ? COL.DELIVERY_REJECT
        : "#3498DB";
    ctx.fill();
    ctx.strokeStyle = isEmpty
      ? COL.DELIVERY_BORDER
      : hasRejected
        ? "#C0392B"
        : "#2980B9";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Icône
    ctx.font = `${Math.max(14, sw * 0.32)}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      isEmpty ? "📤" : hasRejected ? "❌" : "🥞",
      cx,
      sy + sh * 0.45,
    );

    // Silhouette serveur
    if (isEmpty || hasWaiting) {
      ctx.save();
      ctx.font = `${Math.max(10, sw * 0.22)}px serif`;
      ctx.textAlign = "center";
      ctx.fillStyle = COL.TEXT_WHITE;
      ctx.fillText("🧑‍🍳", cx, sy + sh * 0.82);
      ctx.restore();
    }

    // Label état
    ctx.font = `bold 8px Arial`;
    ctx.fillStyle = COL.TEXT_WHITE;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (hasRejected) ctx.fillText("REJETÉ!", cx, sy + sh * 0.82);
  }

  _drawTrash(s, sx, sy, sw, sh) {
    const ctx = this.ctx;
    const cx = sx + sw / 2;

    // Corps poubelle
    roundRect(ctx, sx + 4, sy + sh * 0.2, sw - 8, sh * 0.7, 4);
    ctx.fillStyle = COL.TRASH_BASE;
    ctx.fill();
    ctx.strokeStyle = COL.TRASH_BORDER;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Couvercle
    roundRect(ctx, sx + 2, sy + sh * 0.16, sw - 4, sh * 0.1, 3);
    ctx.fillStyle = COL.TRASH_LID;
    ctx.fill();
    ctx.stroke();

    // Lignes verticales
    ctx.strokeStyle = "#899";
    ctx.lineWidth = 1;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(sx + 4 + (sw - 8) * (i / 3), sy + sh * 0.3);
      ctx.lineTo(sx + 4 + (sw - 8) * (i / 3), sy + sh * 0.9);
      ctx.stroke();
    }

    // Icône
    ctx.font = `${Math.max(12, sw * 0.28)}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🗑️", cx, sy + sh * 0.55);
  }

  // ── Joueur auto (Assurance G2S) ───────────────────────────────────────────
  _drawAutoPlayer(ap, counterY) {
    const ctx = this.ctx;
    const px = ap.x;
    const py = ap.y;
    const sz = ap.size;

    ctx.save();

    // Halo pulsant rouge
    const pulse = 0.55 + 0.45 * Math.abs(Math.sin(Date.now() / 350));
    ctx.save();
    ctx.globalAlpha = 0.28 * pulse;
    ctx.beginPath();
    ctx.ellipse(px, py + sz * 0.55, sz * 0.7, sz * 0.15, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#E30613";
    ctx.fill();
    ctx.restore();

    // Ombre
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.beginPath();
    ctx.ellipse(px, py + sz * 0.55, sz * 0.32, sz * 0.08, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#000";
    ctx.fill();
    ctx.restore();

    const walk = ap.isMoving ? Math.sin((ap.walkFrame / 4) * Math.PI * 2) : 0;

    // Jupe rouge G2S
    ctx.beginPath();
    ctx.moveTo(px - sz * 0.28, py + sz * 0.22);
    ctx.lineTo(px + sz * 0.28, py + sz * 0.22);
    ctx.lineTo(px + sz * 0.32, py + sz * 0.5);
    ctx.lineTo(px - sz * 0.32, py + sz * 0.5);
    ctx.closePath();
    ctx.fillStyle = "#E30613";
    ctx.fill();

    // Jambes
    const legW = sz * 0.13, legH = sz * 0.28, legY = py + sz * 0.22;
    ctx.fillStyle = "#FDBCB4";
    roundRect(ctx, px - sz * 0.14, legY + walk * sz * 0.07, legW, legH, 3); ctx.fill();
    roundRect(ctx, px + sz * 0.01, legY - walk * sz * 0.07, legW, legH, 3); ctx.fill();
    ctx.fillStyle = "#C00000";
    ctx.beginPath(); ctx.ellipse(px - sz*0.07, legY+legH+walk*sz*0.07+sz*0.03, legW*0.7, sz*0.055, 0.2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(px + sz*0.07, legY+legH-walk*sz*0.07+sz*0.03, legW*0.7, sz*0.055, -0.2, 0, Math.PI*2); ctx.fill();

    // Corps (blouse blanche avec logo G2S rouge)
    const bW = sz * 0.54, bH = sz * 0.42, bX = px - bW / 2, bY = py - sz * 0.18;
    roundRect(ctx, bX, bY, bW, bH, sz * 0.1);
    ctx.fillStyle = "#FFFFFF"; ctx.fill();
    ctx.strokeStyle = "#E30613"; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.font = `bold ${sz * 0.2}px Arial`;
    ctx.fillStyle = "#E30613";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("G2S", px, bY + bH * 0.5);

    // Bras
    const aW = sz * 0.11, aH = sz * 0.3, aY = bY + sz * 0.05;
    ctx.save(); ctx.translate(bX - aW*0.4, aY - walk*sz*0.05); ctx.rotate(-0.15 + walk*0.2);
    roundRect(ctx, 0, 0, aW, aH, 4); ctx.fillStyle = "#FDBCB4"; ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(bX + bW + aW*0.4 - aW, aY + walk*sz*0.05); ctx.rotate(0.15 - walk*0.2);
    roundRect(ctx, 0, 0, aW, aH, 4); ctx.fillStyle = "#FDBCB4"; ctx.fill(); ctx.restore();

    // Tête
    const hR = sz * 0.22, hX = px, hY = bY - hR * 0.7;
    ctx.fillStyle = "#FDBCB4";
    ctx.fillRect(px - sz*0.07, hY + hR*0.6, sz*0.14, sz*0.16);
    ctx.beginPath(); ctx.arc(hX, hY, hR, 0, Math.PI*2);
    ctx.fillStyle = "#FDBCB4"; ctx.fill();
    ctx.strokeStyle = "#E0A090"; ctx.lineWidth = 0.8; ctx.stroke();
    // Cheveux brun foncé
    ctx.beginPath(); ctx.ellipse(hX, hY - hR*0.55, hR*1.02, hR*0.55, 0, Math.PI, 0);
    ctx.fillStyle = "#4A2800"; ctx.fill();
    // Casquette rouge G2S
    ctx.fillStyle = "#E30613";
    ctx.beginPath(); ctx.ellipse(hX, hY - hR*0.75, hR*1.05, hR*0.35, 0, Math.PI, 0); ctx.fill();
    ctx.fillRect(hX - hR*1.1, hY - hR*0.78, hR*2.2, hR*0.22);
    ctx.font = `bold ${hR*0.42}px sans-serif`;
    ctx.fillStyle = "#FFFFFF"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(",", hX, hY - hR*0.68);
    // Yeux
    const eOff = ap.direction * hR * 0.12, eY2 = hY + hR*0.05;
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath(); ctx.ellipse(hX+eOff-hR*0.22, eY2, hR*0.16, hR*0.13, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(hX+eOff+hR*0.18, eY2, hR*0.16, hR*0.13, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#3A2000";
    ctx.beginPath(); ctx.arc(hX+eOff-hR*0.22, eY2, hR*0.09, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(hX+eOff+hR*0.18, eY2, hR*0.09, 0, Math.PI*2); ctx.fill();

    // Items tenus
    this._drawHeldItems(ap, px, hY - hR - sz * 0.25, sz);

    ctx.restore();
  }

  // ── Indicateur bonus Assurance G2S ────────────────────────────────────────
  _drawBonusIndicator(ctx, W, H, bonusTimer) {
    const x = 12, y = H - 70, bw = 180, bh = 38;
    const frac = Math.max(0, bonusTimer / 15);
    const pulse = 0.85 + 0.15 * Math.abs(Math.sin(Date.now() / 300));

    ctx.save();
    ctx.globalAlpha = 0.9;
    roundRect(ctx, x, y, bw, bh, 8);
    ctx.fillStyle = "#2D2B45"; ctx.fill();

    roundRect(ctx, x + 4, y + bh - 10, (bw - 8) * frac, 6, 3);
    ctx.fillStyle = frac > 0.4 ? "#E30613" : "#FF6B6B";
    ctx.globalAlpha = pulse; ctx.fill(); ctx.globalAlpha = 0.9;

    ctx.fillStyle = "#FFFFFF"; ctx.font = "bold 12px Arial";
    ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillText("\uD83D\uDEE1\uFE0F Assurance G2S", x + 8, y + bh * 0.4);
    ctx.fillStyle = "#FFCDD2"; ctx.font = "11px Arial";
    ctx.fillText(`${Math.ceil(bonusTimer)}s`, x + bw - 28, y + bh * 0.4);
    ctx.restore();
  }

  // ── Joueur (Cerise) ─────────────────────────────────────────────────────────
  _drawPlayer(player, counterY, counterH) {
    const ctx = this.ctx;
    const px = player.x;
    const py = player.y;
    const sz = player.size;

    ctx.save();

    // Ombre portée
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.ellipse(px, py + sz * 0.55, sz * 0.32, sz * 0.08, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#000";
    ctx.fill();
    ctx.restore();

    const walk = player.isMoving
      ? Math.sin((player.walkFrame / 4) * Math.PI * 2)
      : 0;

    // ── Jambes ──────────────────────────────────────────────────
    const legW = sz * 0.13;
    const legH = sz * 0.28;
    const legY = py + sz * 0.22;
    const legLX = px - sz * 0.14;
    const legRX = px + sz * 0.01;
    const legOffL = walk * sz * 0.07;
    const legOffR = -walk * sz * 0.07;

    // Jupe/robe blanche à pois verts — triangle
    ctx.beginPath();
    ctx.moveTo(px - sz * 0.28, py + sz * 0.22);
    ctx.lineTo(px + sz * 0.28, py + sz * 0.22);
    ctx.lineTo(px + sz * 0.32, py + sz * 0.5);
    ctx.lineTo(px - sz * 0.32, py + sz * 0.5);
    ctx.closePath();
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.strokeStyle = "#CCCCCC";
    ctx.lineWidth = 0.5;
    ctx.stroke();
    // Pois verts
    ctx.fillStyle = "#4CAF50";
    const dotPositions = [
      [-sz*0.18, sz*0.28], [0, sz*0.32], [sz*0.16, sz*0.28],
      [-sz*0.1, sz*0.42], [sz*0.08, sz*0.45],
    ];
    dotPositions.forEach(([dx, dy]) => {
      ctx.beginPath();
      ctx.arc(px + dx, py + dy, sz * 0.038, 0, Math.PI * 2);
      ctx.fill();
    });

    // Jambes (chair)
    ctx.fillStyle = "#FDBCB4";
    roundRect(ctx, legLX, legY + legOffL, legW, legH, 3);
    ctx.fill();
    roundRect(ctx, legRX, legY + legOffR, legW, legH, 3);
    ctx.fill();

    // Chaussures rouges
    ctx.fillStyle = "#C00000";
    ctx.beginPath();
    ctx.ellipse(legLX + legW / 2, legY + legH + legOffL + sz * 0.03, legW * 0.7, sz * 0.055, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(legRX + legW / 2, legY + legH + legOffR + sz * 0.03, legW * 0.7, sz * 0.055, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // ── Corps (blouse blanche à pois verts) ──────────────────────
    const bodyW = sz * 0.54;
    const bodyH = sz * 0.42;
    const bodyX = px - bodyW / 2;
    const bodyY = py - sz * 0.18;
    roundRect(ctx, bodyX, bodyY, bodyW, bodyH, sz * 0.1);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.strokeStyle = "#CCCCCC";
    ctx.lineWidth = 1;
    ctx.stroke();
    // Pois verts sur la blouse
    ctx.fillStyle = "#4CAF50";
    [
      [-sz*0.14, sz*0.06], [sz*0.1, sz*0.04],
      [-sz*0.06, sz*0.2], [sz*0.15, sz*0.22],
      [-sz*0.17, sz*0.32], [sz*0.04, sz*0.34],
    ].forEach(([dx, dy]) => {
      ctx.beginPath();
      ctx.arc(px + dx, bodyY + dy, sz * 0.04, 0, Math.PI * 2);
      ctx.fill();
    });

    // ── Bras ─────────────────────────────────────────────────────
    const armW = sz * 0.11;
    const armH = sz * 0.3;
    const armY = bodyY + sz * 0.05;
    const armOffL = -walk * sz * 0.05;
    const armOffR = walk * sz * 0.05;

    // Bras gauche
    ctx.save();
    ctx.translate(bodyX - armW * 0.4, armY + armOffL);
    ctx.rotate(-0.15 + walk * 0.2);
    roundRect(ctx, 0, 0, armW, armH, 4);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.strokeStyle = "#CCCCCC";
    ctx.lineWidth = 0.5;
    ctx.stroke();
    // Pois verts bras gauche
    ctx.fillStyle = "#4CAF50";
    [[armW*0.5, armH*0.2],[armW*0.3, armH*0.55],[armW*0.65, armH*0.68]].forEach(([dx,dy])=>{
      ctx.beginPath(); ctx.arc(dx, dy, armW*0.22, 0, Math.PI*2); ctx.fill();
    });
    ctx.restore();

    // Bras droit
    ctx.save();
    ctx.translate(bodyX + bodyW + armW * 0.4 - armW, armY + armOffR);
    ctx.rotate(0.15 - walk * 0.2);
    roundRect(ctx, 0, 0, armW, armH, 4);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.strokeStyle = "#CCCCCC";
    ctx.lineWidth = 0.5;
    ctx.stroke();
    // Pois verts bras droit
    ctx.fillStyle = "#4CAF50";
    [[armW*0.5, armH*0.2],[armW*0.3, armH*0.55],[armW*0.65, armH*0.68]].forEach(([dx,dy])=>{
      ctx.beginPath(); ctx.arc(dx, dy, armW*0.22, 0, Math.PI*2); ctx.fill();
    });
    ctx.restore();

    // ── Tête ─────────────────────────────────────────────────────
    const headR = sz * 0.22;
    const headCX = px;
    const headCY = bodyY - headR * 0.7;

    // Cou
    ctx.fillStyle = "#FDBCB4";
    ctx.fillRect(px - sz * 0.07, headCY + headR * 0.6, sz * 0.14, sz * 0.16);

    // Tête
    ctx.beginPath();
    ctx.arc(headCX, headCY, headR, 0, Math.PI * 2);
    ctx.fillStyle = "#FDBCB4";
    ctx.fill();
    ctx.strokeStyle = "#E0A090";
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Cheveux blonds
    ctx.beginPath();
    ctx.ellipse(headCX, headCY - headR * 0.55, headR * 1.05, headR * 0.58, 0, Math.PI, 0);
    ctx.fillStyle = "#F5C518";
    ctx.fill();
    // Mèches latérales blondes
    ctx.beginPath();
    ctx.ellipse(headCX - headR * 0.85, headCY + headR * 0.12, headR * 0.3, headR * 0.46, -0.25, 0, Math.PI * 2);
    ctx.fillStyle = "#F5C518";
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(headCX + headR * 0.85, headCY + headR * 0.12, headR * 0.3, headR * 0.46, 0.25, 0, Math.PI * 2);
    ctx.fillStyle = "#F5C518";
    ctx.fill();

    // Toque de chef blanche
    const hatW = headR * 1.7;
    const hatBandH = headR * 0.22;
    const hatHatH = headR * 0.65;
    const hatX = headCX - hatW / 2;
    const hatBandY = headCY - headR * 0.72;
    const hatHatY = hatBandY - hatHatH;
    // Bandeau rouge Groupama
    ctx.fillStyle = "#E30613";
    ctx.fillRect(hatX, hatBandY, hatW, hatBandH);
    // Corps de la toque
    ctx.fillStyle = "#FFFFFF";
    roundRect(ctx, hatX + hatW * 0.05, hatHatY, hatW * 0.9, hatHatH + 2, 3);
    ctx.fill();
    // Bosse du haut
    ctx.beginPath();
    ctx.ellipse(headCX, hatHatY + 2, hatW * 0.38, headR * 0.28, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.strokeStyle = "#DDD";
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Yeux
    const eyeOffX = player.direction * headR * 0.12;
    const eyeY = headCY + headR * 0.05;
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.ellipse(headCX + eyeOffX - headR * 0.22, eyeY, headR * 0.16, headR * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(headCX + eyeOffX + headR * 0.18, eyeY, headR * 0.16, headR * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3A2000";
    ctx.beginPath();
    ctx.arc(headCX + eyeOffX - headR * 0.22, eyeY, headR * 0.09, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(headCX + eyeOffX + headR * 0.18, eyeY, headR * 0.09, 0, Math.PI * 2);
    ctx.fill();
    // Reflet œil
    ctx.fillStyle = "#FFF";
    ctx.beginPath();
    ctx.arc(headCX + eyeOffX - headR * 0.19, eyeY - headR * 0.04, headR * 0.03, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(headCX + eyeOffX + headR * 0.21, eyeY - headR * 0.04, headR * 0.03, 0, Math.PI * 2);
    ctx.fill();

    // Joues roses
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#FF8888";
    ctx.beginPath();
    ctx.ellipse(headCX - headR * 0.42, eyeY + headR * 0.2, headR * 0.22, headR * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(headCX + headR * 0.42, eyeY + headR * 0.2, headR * 0.22, headR * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Sourire
    ctx.strokeStyle = "#C05050";
    ctx.lineWidth = headR * 0.1;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(headCX, eyeY + headR * 0.25, headR * 0.28, 0.25, Math.PI - 0.25);
    ctx.stroke();

    // Items tenus en main (affiché au-dessus)
    this._drawHeldItems(player, px, headCY - headR - sz * 0.35, sz);

    ctx.restore();
  }

  _drawHeldItems(player, cx, topY, sz) {
    const ctx = this.ctx;
    if (player.hands.length === 0) return;

    const itemSize = sz * 0.38;
    const spacing = itemSize + 4;
    const totalW = player.hands.length * spacing - 4;
    const startX = cx - totalW / 2;

    player.hands.forEach((item, i) => {
      const ix = startX + i * spacing;
      const iy = topY;

      // Fond item
      ctx.save();
      ctx.shadowBlur = 4;
      ctx.shadowColor = "rgba(0,0,0,0.3)";
      roundRect(
        ctx,
        ix - itemSize / 2,
        iy - itemSize / 2,
        itemSize,
        itemSize,
        4,
      );
      ctx.fillStyle = ITEM_COLORS[item.type] || "#DDD";
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(0,0,0,0.2)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Pour les crêpes assemblées, afficher les toppings
      if (
        item.type === IT.ASSEMBLED_CREPE &&
        item.toppings &&
        item.toppings.length > 0
      ) {
        ctx.font = `${itemSize * 0.55}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(ITEM_ICONS["ASSEMBLED_CREPE"], ix, iy);
        // Petites icônes toppings
        const tSize = itemSize * 0.28;
        item.toppings.slice(0, 3).forEach((t, ti) => {
          const ta =
            (ti / Math.max(1, item.toppings.length)) * Math.PI * 2 -
            Math.PI / 2;
          const tr = itemSize * 0.28;
          ctx.font = `${tSize}px serif`;
          ctx.fillText(
            ITEM_ICONS[t] || "?",
            ix + Math.cos(ta) * tr,
            iy + Math.sin(ta) * tr,
          );
        });
      } else {
        ctx.font = `${itemSize * 0.6}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(ITEM_ICONS[item.type] || "?", ix, iy);
      }
      ctx.restore();
    });
  }

  // ── HUD ─────────────────────────────────────────────────────────────────────
  _drawHUD(ctx, W, H, score, timeLeft, heartsLeft, maxHearts) {
    // Le HUD principal est rendu par le DOM (#score-display)
    // On dessine juste les cœurs sur le canvas
    const heartSize = 22;
    const heartX = W - maxHearts * (heartSize + 6) - 10;
    const heartY = H - 34;

    for (let i = 0; i < maxHearts; i++) {
      ctx.font = `${heartSize}px serif`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.fillStyle = i < heartsLeft ? COL.HEART_FULL : COL.HEART_EMPTY;
      ctx.fillText(
        i < heartsLeft ? "❤️" : "🖤",
        heartX + i * (heartSize + 4),
        heartY,
      );
    }

    // Indicateur de station active
    ctx.font = "bold 12px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
  }

  // ── Particules et feedbacks ─────────────────────────────────────────────────
  addParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 80 + Math.random() * 60;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color,
        size: 4 + Math.random() * 4,
      });
    }
  }

  updateParticles(dt) {
    const dtS = dt / 1000;
    this.particles = this.particles.filter((p) => {
      p.x += p.vx * dtS;
      p.y += p.vy * dtS;
      p.vy += 200 * dtS; // gravité
      p.life -= dtS * 1.8;
      return p.life > 0;
    });
  }

  _drawParticles() {
    const ctx = this.ctx;
    this.particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.restore();
    });
  }

  _drawDeliveryFeedback(feedback) {
    if (!feedback || feedback.timer <= 0) return;
    const ctx = this.ctx;
    const alpha = Math.min(1, feedback.timer / 400);
    const vy = (1 - feedback.timer / feedback.maxTimer) * -40;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = "bold 22px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = feedback.color;
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    ctx.strokeText(feedback.msg, feedback.x, feedback.y + vy);
    ctx.fillText(feedback.msg, feedback.x, feedback.y + vy);
    ctx.restore();
  }

  // ── Utilitaires ─────────────────────────────────────────────────────────────
  _lerpColor(a, b, t) {
    const r1 = parseInt(a.slice(1, 3), 16);
    const g1 = parseInt(a.slice(3, 5), 16);
    const b1 = parseInt(a.slice(5, 7), 16);
    const r2 = parseInt(b.slice(1, 3), 16);
    const g2 = parseInt(b.slice(3, 5), 16);
    const b2 = parseInt(b.slice(5, 7), 16);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const bv = Math.round(b1 + (b2 - b1) * t);
    return `rgb(${r},${g},${bv})`;
  }
}
