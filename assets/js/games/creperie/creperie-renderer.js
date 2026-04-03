// creperie-renderer.js — Rendu complet du jeu Crêperie (dessin procédural Canvas 2D)
// Style graphique Overcooked : gradients, cel-shading outlines, ombres portées, éclairage ambiant

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

// ─── Palettes (Overcooked warm tones) ────────────────────────────────────────
const COL = {
  // Salle du restaurant
  WALL_TOP: "#FFF5E8",
  WALL_BOTTOM: "#E8D0B0",
  WALL_STRIP: "#D4B888",
  WALL_STRIP_SHADOW: "#B8986A",
  BASEBOARD: "#8B6840",
  BASEBOARD_HIGHLIGHT: "#A88860",

  // Sol restaurant (damier)
  FLOOR_TILE_A: "#E0CEAE",
  FLOOR_TILE_B: "#C8B490",
  FLOOR_TILE_HIGHLIGHT: "rgba(255,255,255,0.18)",
  FLOOR_TILE_SHADOW: "rgba(0,0,0,0.08)",
  FLOOR_JOINT: "rgba(0,0,0,0.05)",

  // Comptoir
  COUNTER_TOP_A: "#8B4513",
  COUNTER_TOP_B: "#B06030",
  COUNTER_TOP_SPECULAR: "rgba(255,255,255,0.12)",
  COUNTER_FRONT_A: "#7B4020",
  COUNTER_FRONT_B: "#5A2A10",
  COUNTER_EDGE: "#4A2010",
  COUNTER_MOLDING: "#3A1808",
  COUNTER_WOOD_GRAIN: "rgba(0,0,0,0.12)",
  COUNTER_WOOD_KNOT: "rgba(0,0,0,0.10)",

  // Cuisine (dessous comptoir)
  FLOOR_KITCHEN_A: "#B8B0A0",
  FLOOR_KITCHEN_B: "#A8A090",
  FLOOR_KITCHEN_HIGHLIGHT: "rgba(255,255,255,0.12)",
  FLOOR_KITCHEN_SHADOW: "rgba(0,0,0,0.06)",

  // Mobilier
  TABLE_A: "#C8A060",
  TABLE_B: "#A07830",
  TABLE_HIGHLIGHT: "#E0C890",
  TABLE_GRAIN: "rgba(0,0,0,0.06)",
  TABLE_LEG_A: "#8B5020",
  TABLE_LEG_B: "#6B3A15",
  CHAIR_A: "#B87040",
  CHAIR_B: "#8B4820",
  CHAIR_CUSHION_A: "#A02028",
  CHAIR_CUSHION_B: "#701018",

  // Bilig
  BILIG_EMPTY: "#888",
  BILIG_COOKING: "#E8A020",
  BILIG_READY: "#D4A000",
  BILIG_GLOW: "#FFD060",
  BILIG_METAL_A: "#666",
  BILIG_METAL_B: "#999",
  BILIG_METAL_C: "#555",

  // Stations ingrédients
  STATION_BOWL_OUTER: "#E8D8C0",
  STATION_BOWL_INNER: "#D4C0A0",
  STATION_BOWL_RIM: "#F0E4D0",
  STATION_BOWL_STROKE: "#B09060",

  // Livraison
  DELIVERY_BASE: "#2ECC71",
  DELIVERY_GLOW: "#27AE60",
  DELIVERY_REJECT: "#E74C3C",

  // Poubelle
  TRASH_A: "#808890",
  TRASH_B: "#606870",
  TRASH_HIGHLIGHT: "rgba(255,255,255,0.15)",
  TRASH_LID_A: "#707880",
  TRASH_LID_B: "#505860",

  // Bulle client
  BUBBLE_TOP: "#FFFFF8",
  BUBBLE_BOTTOM: "#FFF8E8",
  BUBBLE_BORDER: "#C0A070",
  BUBBLE_SHADOW: "rgba(0,0,0,0.18)",

  // HUD
  HEART_FULL_A: "#FF4040",
  HEART_FULL_B: "#C02020",
  HEART_EMPTY: "#444",
  HEART_SPECULAR: "rgba(255,255,255,0.5)",

  // Texte
  TEXT_LABEL: "#FFFFFF",
  LABEL_BG: "rgba(80,40,20,0.75)",
  TEXT_WHITE: "#FFFFFF",
  TEXT_DARK: "#222222",

  // Outline cartoon (cel-shading)
  OUTLINE: "#333333",
  OUTLINE_W: 2.5,

  // Ambient light
  LAMP_GLOW: "rgba(255,220,150,0.07)",
  VIGNETTE: "rgba(0,0,0,0.12)",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
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

/** Draw a filled + outlined roundRect in one call (cel-shading style) */
function celRect(
  ctx,
  x,
  y,
  w,
  h,
  r,
  fill,
  outline = COL.OUTLINE,
  lw = COL.OUTLINE_W,
) {
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = lw;
  ctx.stroke();
}

/** Create a vertical linear gradient */
function vGrad(ctx, y0, y1, c0, c1) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, c0);
  g.addColorStop(1, c1);
  return g;
}

/** Create a horizontal linear gradient */
function hGrad(ctx, x0, x1, c0, c1) {
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, c0);
  g.addColorStop(1, c1);
  return g;
}

/** Draw a drop shadow ellipse under an object */
function dropShadow(ctx, cx, cy, rx, ry, alpha = 0.15) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#000";
  ctx.fill();
  ctx.restore();
}

/** Draw a heart shape using Bézier curves */
function heartPath(ctx, cx, cy, size) {
  const s = size;
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.35);
  ctx.bezierCurveTo(
    cx + s * 0.5,
    cy - s * 0.1,
    cx + s * 0.55,
    cy - s * 0.5,
    cx,
    cy - s * 0.25,
  );
  ctx.bezierCurveTo(
    cx - s * 0.55,
    cy - s * 0.5,
    cx - s * 0.5,
    cy - s * 0.1,
    cx,
    cy + s * 0.35,
  );
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
    this.deliveryFeedback = null;
    this.particles = [];
    this._time = 0; // animation time accumulator
  }

  onResize() {}

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
    waiter = null,
  ) {
    const W = canvas.width;
    const H = canvas.height;
    const ctx = this.ctx;
    const counterY = H * COUNTER_Y_RATIO;
    const counterH = H * COUNTER_HEIGHT_RATIO;
    this._time = Date.now();

    ctx.clearRect(0, 0, W, H);

    this._drawBackground(W, H, counterY, counterH);
    this._drawFurniture(W, H, counterY, customerManager);
    this._drawCustomers(W, H, counterY, customerManager.customers);
    if (waiter) this._drawWaiter(waiter, W, H, counterY, counterH);
    this._drawCounter(W, counterY, counterH);
    this._drawStations(stations, counterY, counterH);
    this._drawPlayer(player, counterY, counterH);
    if (autoPlayer) this._drawAutoPlayer(autoPlayer, counterY);
    this._drawParticles();
    this._drawDeliveryFeedback(deliveryFeedback);
    this._drawHUD(ctx, W, H, score, timeLeft, heartsLeft, maxHearts);
    if (bonusTimer !== null) this._drawBonusIndicator(ctx, W, H, bonusTimer);
    this._drawAmbientLighting(W, H, counterY);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  //  BACKGROUND — Mur, sol restaurant, sol cuisine, lampes
  // ══════════════════════════════════════════════════════════════════════════════
  _drawBackground(W, H, counterY, counterH) {
    const ctx = this.ctx;
    const rH = counterY; // restaurant height

    // ── Mur du fond (gradient vertical chaud) ──
    const wallGrad = vGrad(ctx, 0, rH * 0.72, COL.WALL_TOP, COL.WALL_BOTTOM);
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, W, rH);

    // Motif papier peint subtil (losanges)
    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.fillStyle = "#A08060";
    const pSize = 30;
    for (let px = 0; px < W; px += pSize * 2) {
      for (let py = 0; py < rH * 0.68; py += pSize * 2) {
        ctx.beginPath();
        ctx.moveTo(px + pSize, py);
        ctx.lineTo(px + pSize * 2, py + pSize);
        ctx.lineTo(px + pSize, py + pSize * 2);
        ctx.lineTo(px, py + pSize);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();

    // ── Frise decorative (moulure avec ombre) ──
    const friseY = rH * 0.7;
    const friseH = 10;
    // Ombre sous la frise
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    ctx.fillRect(0, friseY + friseH, W, 4);
    // Corps de la frise
    ctx.fillStyle = COL.WALL_STRIP;
    ctx.fillRect(0, friseY, W, friseH);
    // Highlight sur le haut
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(0, friseY, W, 2);
    // Motif décoratif losanges dans la frise
    ctx.fillStyle = COL.WALL_STRIP_SHADOW;
    const diamSize = friseH - 4;
    for (let dx = diamSize; dx < W; dx += diamSize * 3) {
      ctx.beginPath();
      ctx.moveTo(dx, friseY + 2);
      ctx.lineTo(dx + diamSize / 2, friseY + friseH / 2);
      ctx.lineTo(dx, friseY + friseH - 2);
      ctx.lineTo(dx - diamSize / 2, friseY + friseH / 2);
      ctx.closePath();
      ctx.fill();
    }

    // ── Plinthe (baseboards avec gradient + ombre) ──
    const plH = 12;
    const plY = counterY - plH;
    const plGrad = vGrad(
      ctx,
      plY,
      plY + plH,
      COL.BASEBOARD_HIGHLIGHT,
      COL.BASEBOARD,
    );
    ctx.fillStyle = plGrad;
    ctx.fillRect(0, plY, W, plH);
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.fillRect(0, plY + plH - 2, W, 2);

    // ── Sol du restaurant (damier 3D avec bevel) ──
    const tileS = 48;
    const floorStartY = Math.floor(rH * 0.72);
    for (let tx = 0; tx < W; tx += tileS) {
      for (let ty = floorStartY; ty < rH - plH; ty += tileS) {
        const colIdx = (Math.floor(tx / tileS) + Math.floor(ty / tileS)) % 2;
        // Base tile color
        ctx.fillStyle = colIdx === 0 ? COL.FLOOR_TILE_A : COL.FLOOR_TILE_B;
        ctx.fillRect(tx, ty, tileS, tileS);
        // Bevel highlight (top + left)
        ctx.fillStyle = COL.FLOOR_TILE_HIGHLIGHT;
        ctx.fillRect(tx, ty, tileS, 1.5);
        ctx.fillRect(tx, ty, 1.5, tileS);
        // Bevel shadow (bottom + right)
        ctx.fillStyle = COL.FLOOR_TILE_SHADOW;
        ctx.fillRect(tx, ty + tileS - 1.5, tileS, 1.5);
        ctx.fillRect(tx + tileS - 1.5, ty, 1.5, tileS);
        // Joint
        ctx.fillStyle = COL.FLOOR_JOINT;
        ctx.fillRect(tx + tileS - 0.5, ty, 1, tileS);
        ctx.fillRect(tx, ty + tileS - 0.5, tileS, 1);
      }
    }

    // ── Plantes décoratives aux extrémités ──
    this._drawPlant(ctx, 28, rH - plH - 6);
    this._drawPlant(ctx, W - 28, rH - plH - 6);

    // ── Sol cuisine (damier 3D avec bevel) ──
    const kitchenTop = counterY + counterH;
    const kTile = 38;
    for (let tx = 0; tx < W; tx += kTile) {
      for (let ty = kitchenTop; ty < H; ty += kTile) {
        const colIdx = (Math.floor(tx / kTile) + Math.floor(ty / kTile)) % 2;
        ctx.fillStyle =
          colIdx === 0 ? COL.FLOOR_KITCHEN_A : COL.FLOOR_KITCHEN_B;
        ctx.fillRect(tx, ty, kTile, kTile);
        // Bevel
        ctx.fillStyle = COL.FLOOR_KITCHEN_HIGHLIGHT;
        ctx.fillRect(tx, ty, kTile, 1);
        ctx.fillRect(tx, ty, 1, kTile);
        ctx.fillStyle = COL.FLOOR_KITCHEN_SHADOW;
        ctx.fillRect(tx, ty + kTile - 1, kTile, 1);
        ctx.fillRect(tx + kTile - 1, ty, 1, kTile);
      }
    }

    // ── Lampes suspendues ──
    this._drawLamps(W, rH);
  }

  _drawPlant(ctx, cx, baseY) {
    // Pot
    ctx.fillStyle = "#A06840";
    ctx.beginPath();
    ctx.moveTo(cx - 10, baseY);
    ctx.lineTo(cx + 10, baseY);
    ctx.lineTo(cx + 8, baseY - 16);
    ctx.lineTo(cx - 8, baseY - 16);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#7A4A28";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Rim
    ctx.fillStyle = "#8B5830";
    ctx.fillRect(cx - 10, baseY - 18, 20, 4);
    // Foliage (3 triangles)
    ctx.fillStyle = "#3A8A3A";
    [
      [-6, -18, 12],
      [0, -28, 14],
      [5, -20, 11],
    ].forEach(([ox, oy, sz]) => {
      ctx.beginPath();
      ctx.moveTo(cx + ox, baseY + oy);
      ctx.lineTo(cx + ox - sz / 2, baseY + oy + sz);
      ctx.lineTo(cx + ox + sz / 2, baseY + oy + sz);
      ctx.closePath();
      ctx.fill();
    });
    // Darker leaves
    ctx.fillStyle = "#2A7A2A";
    [
      [-3, -22, 8],
      [3, -15, 7],
    ].forEach(([ox, oy, sz]) => {
      ctx.beginPath();
      ctx.moveTo(cx + ox, baseY + oy);
      ctx.lineTo(cx + ox - sz / 2, baseY + oy + sz);
      ctx.lineTo(cx + ox + sz / 2, baseY + oy + sz);
      ctx.closePath();
      ctx.fill();
    });
  }

  _drawLamps(W, rH) {
    const ctx = this.ctx;
    const lampY = rH * 0.11;
    // 5 lampes couvrant les 5 tables
    const lampPositions = [0.12, 0.32, 0.5, 0.68, 0.88];
    const t = this._time;

    lampPositions.forEach((xr) => {
      const lx = W * xr;
      // Fil
      const wireGrad = vGrad(ctx, 0, lampY - 10, "#8B7355", "#6B5335");
      ctx.strokeStyle = wireGrad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, lampY - 14);
      ctx.stroke();

      // Halo lumineux sous la lampe
      ctx.save();
      const haloR = 85;
      const haloGrad = ctx.createRadialGradient(
        lx,
        lampY + 14,
        4,
        lx,
        lampY + 14,
        haloR,
      );
      haloGrad.addColorStop(0, "rgba(255,220,130,0.10)");
      haloGrad.addColorStop(1, "rgba(255,220,130,0)");
      ctx.fillStyle = haloGrad;
      ctx.fillRect(lx - haloR, lampY - haloR + 14, haloR * 2, haloR * 2);
      ctx.restore();

      // Abat-jour (gradient trapézoïdal)
      ctx.beginPath();
      ctx.moveTo(lx - 24, lampY - 14);
      ctx.lineTo(lx + 24, lampY - 14);
      ctx.lineTo(lx + 16, lampY + 10);
      ctx.lineTo(lx - 16, lampY + 10);
      ctx.closePath();
      const shadeGrad = ctx.createRadialGradient(
        lx,
        lampY - 2,
        2,
        lx,
        lampY - 2,
        28,
      );
      shadeGrad.addColorStop(0, "#E8C040");
      shadeGrad.addColorStop(1, "#A07020");
      ctx.fillStyle = shadeGrad;
      ctx.fill();
      ctx.strokeStyle = "#805818";
      ctx.lineWidth = 2;
      ctx.stroke();
      // Highlight band on top
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.fillRect(lx - 22, lampY - 14, 44, 3);

      // Ampoule avec glow
      ctx.save();
      const bulbPulse = 0.9 + 0.1 * Math.sin(t / 1500 + xr * 10);
      ctx.shadowBlur = 18 * bulbPulse;
      ctx.shadowColor = "rgba(255,220,100,0.6)";
      ctx.beginPath();
      ctx.arc(lx, lampY + 16, 6, 0, Math.PI * 2);
      const bulbGrad = ctx.createRadialGradient(
        lx - 1,
        lampY + 14,
        1,
        lx,
        lampY + 16,
        6,
      );
      bulbGrad.addColorStop(0, "#FFFEF0");
      bulbGrad.addColorStop(1, "#FFE870");
      ctx.fillStyle = bulbGrad;
      ctx.fill();
      ctx.restore();
    });
  }

  // ══════════════════════════════════════════════════════════════════════════════
  //  FURNITURE — Tables & Chaises (style Overcooked, gradients + grain bois)
  // ══════════════════════════════════════════════════════════════════════════════
  _drawFurniture(W, H, counterY, customerManager) {
    const rH = counterY;
    TABLE_POSITIONS.forEach((pos, i) => {
      const tx = W * pos.xRatio;
      const ty = rH * pos.yRatio;
      const customer = customerManager.customers.find(
        (c) => c.tableIndex === i,
      );
      this._drawTable(tx, ty, customer, i);
    });
  }

  _drawTable(cx, cy, customer, tableIdx) {
    const ctx = this.ctx;
    const tw = 90,
      th = 56;

    // Drop shadow under table
    dropShadow(ctx, cx, cy + th / 2 + 8, tw * 0.45, 6, 0.12);

    // 4 table legs (gradient)
    const legW = 7,
      legH = 14;
    const legOffX = tw / 2 - 10;
    const legOffY = th / 2;
    [
      [-legOffX, legOffY],
      [legOffX, legOffY],
      [-legOffX, -legOffY + 4],
      [legOffX, -legOffY + 4],
    ].forEach(([ox, oy]) => {
      const ly = cy + oy;
      const legGrad = vGrad(
        ctx,
        ly,
        ly + legH,
        COL.TABLE_LEG_A,
        COL.TABLE_LEG_B,
      );
      roundRect(ctx, cx + ox - legW / 2, ly, legW, legH, 2);
      ctx.fillStyle = legGrad;
      ctx.fill();
      ctx.strokeStyle = COL.OUTLINE;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // Table top (gradient + grain bois + outline)
    const tabGrad = hGrad(
      ctx,
      cx - tw / 2,
      cx + tw / 2,
      COL.TABLE_B,
      COL.TABLE_A,
    );
    roundRect(ctx, cx - tw / 2, cy - th / 2, tw, th, 8);
    ctx.fillStyle = tabGrad;
    ctx.fill();
    // Wood grain lines
    ctx.strokeStyle = COL.TABLE_GRAIN;
    ctx.lineWidth = 1;
    for (let gy = -th / 2 + 10; gy < th / 2 - 5; gy += 13) {
      ctx.beginPath();
      ctx.moveTo(cx - tw / 2 + 6, cy + gy);
      ctx.lineTo(cx + tw / 2 - 6, cy + gy);
      ctx.stroke();
    }
    // Specular highlight band
    ctx.fillStyle = "rgba(255,255,255,0.10)";
    ctx.fillRect(cx - tw / 2 + 6, cy - th / 2 + th * 0.28, tw - 12, 3);
    // Outline
    roundRect(ctx, cx - tw / 2, cy - th / 2, tw, th, 8);
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Nappe à carreaux (losange central rouge/blanc style Overcooked)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 4);
    const clothS = 22;
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = "#CC3030";
    ctx.fillRect(-clothS / 2, -clothS / 2, clothS, clothS);
    ctx.fillStyle = "#FFF";
    const cs2 = clothS / 2;
    ctx.fillRect(-cs2, -cs2, cs2, cs2);
    ctx.fillRect(0, 0, cs2, cs2);
    ctx.restore();

    // Assiettes (2 petits cercles blancs)
    ctx.fillStyle = "#F8F4F0";
    ctx.strokeStyle = "#D0C0A8";
    ctx.lineWidth = 1;
    [-18, 18].forEach((ox) => {
      ctx.beginPath();
      ctx.arc(cx + ox, cy, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // Chairs (top + bottom)
    const chairOff = th / 2 + 20;
    this._drawChair(
      cx,
      cy - chairOff,
      false,
      customer?.state === "seated" ||
        customer?.state === "served" ||
        customer?.state === "leaving_happy",
    );
    this._drawChair(cx, cy + chairOff, true, false);
  }

  _drawChair(cx, cy, flipped, occupied) {
    const ctx = this.ctx;
    const cw = 42,
      ch = 26;

    // Assise (gradient radial = effet coussin)
    roundRect(ctx, cx - cw / 2, cy - ch / 2, cw, ch, 6);
    if (occupied) {
      const cushGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, cw * 0.5);
      cushGrad.addColorStop(0, COL.CHAIR_CUSHION_A);
      cushGrad.addColorStop(1, COL.CHAIR_CUSHION_B);
      ctx.fillStyle = cushGrad;
    } else {
      const chGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, cw * 0.5);
      chGrad.addColorStop(0, COL.CHAIR_A);
      chGrad.addColorStop(1, COL.CHAIR_B);
      ctx.fillStyle = chGrad;
    }
    ctx.fill();
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Dossier (arrondi semi-circulaire)
    const backH = 16;
    const backDir = flipped ? 1 : -1;
    const backY = cy + backDir * (ch / 2);
    roundRect(
      ctx,
      cx - cw / 2 + 3,
      Math.min(backY, backY + backH * backDir),
      cw - 6,
      Math.abs(backH),
      5,
    );
    ctx.fillStyle = occupied ? "#8B2520" : "#9A5830";
    ctx.fill();
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // ══════════════════════════════════════════════════════════════════════════════
  //  CUSTOMERS — Corps cartoon cel-shading + bulles de commande premium
  // ══════════════════════════════════════════════════════════════════════════════
  _drawCustomers(W, H, counterY, customers) {
    const rH = counterY;
    customers.forEach((c) => {
      const tablePos = TABLE_POSITIONS[c.tableIndex];
      if (!tablePos) return;

      const tx = W * tablePos.xRatio;
      const ty = rH * tablePos.yRatio - 28; // above the chair

      let alpha = 1,
        scale = 1;
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
    const isHappy =
      customer.state === "leaving_happy" || customer.state === "served";
    const t = this._time;

    // 5 outfit colors
    const outfitColors = [
      ["#4A90D9", "#3570B0"],
      ["#E67E22", "#C06818"],
      ["#8E44AD", "#6E2490"],
      ["#27AE60", "#1A8A48"],
      ["#E74C3C", "#C03030"],
    ];
    const [bodyA, bodyB] = outfitColors[customer.tableIndex % 5];

    // 5 hair styles (color + shape hint)
    const hairColors = ["#4A2800", "#1A1A1A", "#D4A030", "#8B3A00", "#666"];
    const hairColor = hairColors[customer.tableIndex % 5];

    // Drop shadow
    dropShadow(ctx, 0, 18, 14, 4, 0.15);

    // Idle micro-animation (subtle head bob)
    const bob = Math.sin(t / 2500 + customer.tableIndex * 1.7) * 1.2;

    ctx.save();
    ctx.translate(0, bob);

    // ── Body (ellipse, gradient, outlined) ──
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 18, 0, 0, Math.PI * 2);
    const bodyGrad = vGrad(ctx, -18, 18, bodyA, bodyB);
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = COL.OUTLINE_W;
    ctx.stroke();

    // Subtle pattern on body (horizontal stripes)
    ctx.save();
    ctx.clip();
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = "#FFF";
    ctx.lineWidth = 2;
    for (let sy = -14; sy < 18; sy += 6) {
      ctx.beginPath();
      ctx.moveTo(-15, sy);
      ctx.lineTo(15, sy);
      ctx.stroke();
    }
    ctx.restore();

    // ── Head (gradient radial, outlined) ──
    const headR = 16;
    const headY = -28;
    ctx.beginPath();
    ctx.arc(0, headY, headR, 0, Math.PI * 2);
    const faceGrad = ctx.createRadialGradient(0, headY - 3, 2, 0, headY, headR);
    faceGrad.addColorStop(0, "#FFD5C5");
    faceGrad.addColorStop(1, "#E8AB95");
    ctx.fillStyle = faceGrad;
    ctx.fill();
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = COL.OUTLINE_W;
    ctx.stroke();

    // ── Hair ──
    ctx.beginPath();
    ctx.ellipse(
      0,
      headY - headR * 0.5,
      headR * 1.1,
      headR * 0.62,
      0,
      Math.PI,
      0,
    );
    ctx.fillStyle = hairColor;
    ctx.fill();
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ── Eyes ──
    if (isHappy) {
      // Happy eyes (arcs)
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      [-5, 5].forEach((ex) => {
        ctx.beginPath();
        ctx.arc(ex, headY - 1, 3.5, Math.PI + 0.3, -0.3);
        ctx.stroke();
      });
    } else if (isAngry) {
      // Angry eyes
      ctx.fillStyle = "#FFF";
      [-5, 5].forEach((ex) => {
        ctx.beginPath();
        ctx.arc(ex, headY - 1, 4, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = "#C03030";
      [-5, 5].forEach((ex) => {
        ctx.beginPath();
        ctx.arc(ex, headY - 1, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
      // Angry brows
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-8, headY - 7);
      ctx.lineTo(-3, headY - 5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(8, headY - 7);
      ctx.lineTo(3, headY - 5);
      ctx.stroke();
    } else {
      // Normal eyes (white + iris + reflet)
      [-5, 5].forEach((ex) => {
        ctx.fillStyle = "#FFF";
        ctx.beginPath();
        ctx.ellipse(ex, headY - 1, 4.5, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = COL.OUTLINE;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Iris
        ctx.fillStyle = "#3A2000";
        ctx.beginPath();
        ctx.arc(ex, headY - 0.5, 2.2, 0, Math.PI * 2);
        ctx.fill();
        // Reflet
        ctx.fillStyle = "#FFF";
        ctx.beginPath();
        ctx.arc(ex - 1, headY - 2, 1, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // ── Mouth ──
    if (isHappy) {
      ctx.fillStyle = "#C05050";
      ctx.beginPath();
      ctx.arc(0, headY + 7, 5, 0, Math.PI);
      ctx.fill();
      ctx.strokeStyle = COL.OUTLINE;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (isAngry) {
      ctx.strokeStyle = "#C03030";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-4, headY + 8);
      ctx.lineTo(-1, headY + 6);
      ctx.lineTo(2, headY + 8);
      ctx.lineTo(4, headY + 6);
      ctx.stroke();
      // Steam puffs above head
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = "#AAA";
      const steam = Math.sin(t / 400) * 3;
      [
        [-6, -48 + steam, 3],
        [0, -54 + steam * 0.7, 4],
        [5, -50 + steam * 1.2, 3],
      ].forEach(([sx, sy, sr]) => {
        ctx.beginPath();
        ctx.arc(sx, headY + sy + 40, sr, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    } else {
      ctx.strokeStyle = "#A05050";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(0, headY + 5, 4, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }

    // Rosy cheeks
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "#FF8888";
    [-8, 8].forEach((cx2) => {
      ctx.beginPath();
      ctx.ellipse(cx2, headY + 4, 4, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    ctx.restore(); // end bob
  }

  _drawSpeechBubble(customer) {
    if (customer.state !== "seated" && customer.state !== "served") return;
    const ctx = this.ctx;
    const bw = 130,
      bh = 78;
    const bx = -bw / 2,
      by = 58;

    // Shadow
    ctx.save();
    ctx.shadowBlur = 12;
    ctx.shadowColor = COL.BUBBLE_SHADOW;
    const bubGrad = vGrad(ctx, by, by + bh, COL.BUBBLE_TOP, COL.BUBBLE_BOTTOM);
    roundRect(ctx, bx, by, bw, bh, 10);
    ctx.fillStyle = bubGrad;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = COL.BUBBLE_BORDER;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Pointer arrow (up)
    ctx.beginPath();
    ctx.moveTo(bx + bw / 2 - 8, by);
    ctx.lineTo(bx + bw / 2, by - 10);
    ctx.lineTo(bx + bw / 2 + 8, by);
    ctx.closePath();
    ctx.fillStyle = COL.BUBBLE_TOP;
    ctx.fill();
    ctx.strokeStyle = COL.BUBBLE_BORDER;
    ctx.lineWidth = 2;
    ctx.stroke();
    // Cover the line inside
    ctx.fillStyle = COL.BUBBLE_TOP;
    ctx.fillRect(bx + bw / 2 - 7, by, 14, 3);

    // If served: show checkmark instead of recipe
    if (customer.state === "served") {
      ctx.font = "bold 38px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#2ECC71";
      ctx.fillText("✅", bx + bw / 2, by + bh / 2 + 2);
      return;
    }

    // Recipe label in colored badge
    const recipe = customer.recipe;
    ctx.save();
    const labelW = ctx.measureText ? 0 : 0; // will use approx
    roundRect(ctx, bx + 8, by + 5, bw - 16, 18, 9);
    ctx.fillStyle = recipe.color + "40"; // 25% alpha
    ctx.fill();
    ctx.font = "bold 11px Arial";
    ctx.fillStyle = "#555";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(recipe.label, bx + bw / 2, by + 14);
    ctx.restore();

    // Recipe icons in little circles
    const icons = recipe.toppings.map((t) => ITEM_ICONS[t] || "?");
    const iconSize = 28;
    const totalW = icons.length * (iconSize + 6) - 6;
    const startX = bx + (bw - totalW) / 2;
    icons.forEach((icon, i) => {
      const ix = startX + i * (iconSize + 6) + iconSize / 2;
      const iy = by + bh / 2 + 10;
      // Circle background
      ctx.beginPath();
      ctx.arc(ix, iy, iconSize / 2 + 2, 0, Math.PI * 2);
      ctx.fillStyle = "#FFF";
      ctx.fill();
      ctx.strokeStyle = "#DDD";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Icon
      ctx.font = `${iconSize}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(icon, ix, iy);
    });

    // Patience timer (larger, gradient-filled arc)
    const pf = customer.patienceFraction;
    const timerR = 14;
    const timerX = bx + bw - timerR - 6;
    const timerY = by + timerR + 6;
    const tColor = pf > 0.5 ? "#2ECC71" : pf > 0.25 ? "#F39C12" : "#E74C3C";

    // Background ring
    ctx.beginPath();
    ctx.arc(timerX, timerY, timerR, 0, Math.PI * 2);
    ctx.strokeStyle = "#EEE";
    ctx.lineWidth = 5;
    ctx.stroke();

    // Filled arc
    ctx.beginPath();
    ctx.arc(
      timerX,
      timerY,
      timerR,
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * pf,
    );
    ctx.strokeStyle = tColor;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.lineCap = "butt";

    // Pulsing when low
    if (pf < 0.25) {
      const pulse = Math.abs(Math.sin(this._time / 250));
      ctx.save();
      ctx.globalAlpha = pulse * 0.4;
      ctx.beginPath();
      ctx.arc(timerX, timerY, timerR + 3, 0, Math.PI * 2);
      ctx.strokeStyle = "#E74C3C";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    // Topping count badge
    ctx.beginPath();
    ctx.arc(bx + timerR + 6, by + timerR + 6, 9, 0, Math.PI * 2);
    ctx.fillStyle = recipe.color || "#888";
    ctx.fill();
    ctx.strokeStyle = "#FFF";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.font = "bold 10px Arial";
    ctx.fillStyle = "#FFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${recipe.toppings.length}`, bx + timerR + 6, by + timerR + 6);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  //  COUNTER — Wooden counter with gradients, grain, moldings
  // ══════════════════════════════════════════════════════════════════════════════
  _drawCounter(W, counterY, counterH) {
    const ctx = this.ctx;

    // Molding top (thin dark strip)
    ctx.fillStyle = COL.COUNTER_MOLDING;
    ctx.fillRect(0, counterY, W, 4);

    // Plan de travail (dessus — gradient horizontal avec reflet spéculaire)
    const topH = 14;
    const topGrad = hGrad(ctx, 0, W, COL.COUNTER_TOP_A, COL.COUNTER_TOP_B);
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, counterY + 4, W, topH);
    // Specular highlight
    ctx.fillStyle = COL.COUNTER_TOP_SPECULAR;
    ctx.fillRect(0, counterY + 4 + topH * 0.3, W, 3);

    // Façade du comptoir (gradient vertical + texture bois)
    const faceY = counterY + 4 + topH;
    const faceH = counterH - topH - 4;
    const faceGrad = vGrad(
      ctx,
      faceY,
      faceY + faceH,
      COL.COUNTER_FRONT_A,
      COL.COUNTER_FRONT_B,
    );
    ctx.fillStyle = faceGrad;
    ctx.fillRect(0, faceY, W, faceH);

    // Wood plank lines
    ctx.strokeStyle = COL.COUNTER_WOOD_GRAIN;
    ctx.lineWidth = 1.5;
    for (let lx = 0; lx < W; lx += 65) {
      ctx.beginPath();
      ctx.moveTo(lx, faceY);
      ctx.lineTo(lx, faceY + faceH);
      ctx.stroke();
    }
    // Wood knots (deterministic positions)
    ctx.fillStyle = COL.COUNTER_WOOD_KNOT;
    for (let kx = 30; kx < W; kx += 130) {
      const ky = faceY + faceH * 0.4 + (kx % 7) * 3;
      ctx.beginPath();
      ctx.ellipse(kx, ky, 5, 3, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Molding bottom (thick with shadow)
    ctx.fillStyle = COL.COUNTER_EDGE;
    ctx.fillRect(0, counterY + counterH - 6, W, 6);
    // Bottom shadow
    ctx.save();
    ctx.shadowBlur = 4;
    ctx.shadowColor = "rgba(0,0,0,0.2)";
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = COL.COUNTER_MOLDING;
    ctx.fillRect(0, counterY + counterH - 2, W, 2);
    ctx.restore();
  }

  // ══════════════════════════════════════════════════════════════════════════════
  //  STATIONS — All cooking stations with premium graphics
  // ══════════════════════════════════════════════════════════════════════════════
  _drawStations(stations, counterY, counterH) {
    stations.forEach((s) => this._drawStation(s, counterY, counterH));
  }

  _drawStation(s, counterY, counterH) {
    const ctx = this.ctx;
    const { w: sw, h: sh, x: sx, y: sy } = s;

    // Interaction flash
    if (s.flashTimer > 0 && s.flashColor) {
      const alpha = s.flashTimer / 600;
      ctx.save();
      ctx.globalAlpha = alpha * 0.6;
      roundRect(ctx, sx - 3, sy - 3, sw + 6, sh + 6, 8);
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

    // Station label badge
    ctx.save();
    const labelFont = `bold ${Math.max(11, sw * 0.2)}px Arial`;
    ctx.font = labelFont;
    const labelText = s.label;
    const textW = ctx.measureText(labelText).width;
    const badgeW = textW + 16;
    const badgeH = 18;
    const badgeX = sx + sw / 2 - badgeW / 2;
    const badgeY = sy + sh + 4;
    roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 9);
    ctx.fillStyle = COL.LABEL_BG;
    ctx.fill();
    // Text shadow
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(labelText, sx + sw / 2 + 1, badgeY + badgeH / 2 + 1);
    // Text
    ctx.fillStyle = COL.TEXT_LABEL;
    ctx.fillText(labelText, sx + sw / 2, badgeY + badgeH / 2);
    ctx.restore();
  }

  _drawBilig(s, sx, sy, sw, sh) {
    const ctx = this.ctx;
    const cx = sx + sw / 2,
      cy = sy + sh * 0.48;
    const r = Math.min(sw, sh) * 0.4;
    const t = this._time;

    // Metal base (3D gradient)
    roundRect(ctx, sx + 2, sy + sh * 0.78, sw - 4, sh * 0.22, 4);
    const baseGrad = vGrad(
      ctx,
      sy + sh * 0.78,
      sy + sh,
      COL.BILIG_METAL_B,
      COL.BILIG_METAL_C,
    );
    ctx.fillStyle = baseGrad;
    ctx.fill();
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Cooking surface — outer ring (metal brush effect)
    ctx.beginPath();
    ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
    const ringGrad = ctx.createRadialGradient(cx, cy, r - 2, cx, cy, r + 4);
    ringGrad.addColorStop(0, COL.BILIG_METAL_B);
    ringGrad.addColorStop(0.5, "#AAA");
    ringGrad.addColorStop(1, COL.BILIG_METAL_C);
    ctx.fillStyle = ringGrad;
    ctx.fill();
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner cooking surface (radial gradient for convex effect)
    let surfA, surfB;
    if (s.biligState === BILIG_STATE.EMPTY) {
      surfA = "#999";
      surfB = "#666";
    } else if (s.biligState === BILIG_STATE.COOKING) {
      const p = s.cookProgress;
      surfA = this._lerpColor("#999", "#E8B030", p);
      surfB = this._lerpColor("#666", "#C08010", p);
    } else {
      surfA = "#E8C040";
      surfB = "#B89020";
    }
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    const surfGrad = ctx.createRadialGradient(
      cx - r * 0.2,
      cy - r * 0.2,
      1,
      cx,
      cy,
      r,
    );
    surfGrad.addColorStop(0, surfA);
    surfGrad.addColorStop(1, surfB);
    ctx.fillStyle = surfGrad;
    ctx.fill();

    // Concentric grooves
    ctx.strokeStyle = "rgba(0,0,0,0.10)";
    ctx.lineWidth = 0.8;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(cx, cy, r * (i / 4), 0, Math.PI * 2);
      ctx.stroke();
    }

    // Crêpe on bilig (READY state)
    if (s.biligState === BILIG_STATE.READY) {
      // Wavy-edge crêpe using bezier
      ctx.beginPath();
      const cr = r - 7;
      const segments = 12;
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const wave = Math.sin(angle * 5 + 1.5) * 2.5;
        const px2 = cx + Math.cos(angle) * (cr + wave);
        const py2 = cy + Math.sin(angle) * (cr * 0.8 + wave);
        if (i === 0) ctx.moveTo(px2, py2);
        else ctx.lineTo(px2, py2);
      }
      ctx.closePath();
      const crepeGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, cr);
      crepeGrad.addColorStop(0, "#E8C870");
      crepeGrad.addColorStop(1, "#C89838");
      ctx.fillStyle = crepeGrad;
      ctx.fill();
      ctx.strokeStyle = "#A07828";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Brown spots (cooked texture)
      ctx.fillStyle = "rgba(120,80,30,0.25)";
      for (let i = 0; i < 7; i++) {
        const ang = (i / 7) * Math.PI * 2 + 0.3;
        const pr2 = (cr - 6) * 0.55;
        ctx.beginPath();
        ctx.arc(
          cx + Math.cos(ang) * pr2,
          cy + Math.sin(ang) * pr2 * 0.8,
          2.5,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }

      // Topping icons on crepe
      s.biligToppings.forEach((tt, i) => {
        const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
        ctx.font = `${Math.max(12, sw * 0.24)}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          ITEM_ICONS[tt] || "?",
          cx + Math.cos(angle) * (r - 14),
          cy + Math.sin(angle) * (r - 14),
        );
      });

      // Pulsing glow
      const glow = Math.sin(t / 300) * 0.3 + 0.5;
      ctx.save();
      ctx.globalAlpha = glow * 0.4;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
      ctx.strokeStyle = COL.BILIG_GLOW;
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();

      // Ready badge
      ctx.save();
      ctx.font = `bold ${Math.max(10, sw * 0.2)}px Arial`;
      ctx.fillStyle = COL.BILIG_GLOW;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowBlur = 6;
      ctx.shadowColor = "rgba(255,200,60,0.6)";
      ctx.fillText("✓", cx, cy + r + 13);
      ctx.restore();
    }

    // Cooking progress bar
    if (s.biligState === BILIG_STATE.COOKING) {
      const barW = sw - 8,
        barH = 8;
      const barX = sx + 4,
        barY = sy + sh - 16;
      // Background
      roundRect(ctx, barX, barY, barW, barH, 4);
      ctx.fillStyle = "#333";
      ctx.fill();
      ctx.strokeStyle = "#555";
      ctx.lineWidth = 1;
      ctx.stroke();
      // Fill (gradient red → orange → gold)
      const prog = s.cookProgress;
      const barFillGrad = hGrad(
        ctx,
        barX,
        barX + barW * prog,
        "#FF5500",
        "#FFD700",
      );
      roundRect(
        ctx,
        barX + 1,
        barY + 1,
        Math.max(0, barW * prog - 2),
        barH - 2,
        3,
      );
      ctx.fillStyle = barFillGrad;
      ctx.fill();
      // Glow
      ctx.save();
      ctx.shadowBlur = 5;
      ctx.shadowColor = "rgba(255,180,0,0.4)";
      ctx.fillRect(barX + barW * prog - 4, barY, 2, barH);
      ctx.restore();

      // Deposited toppings
      s.biligToppings.forEach((tt, i) => {
        ctx.font = `${Math.max(10, sw * 0.2)}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          ITEM_ICONS[tt] || "?",
          sx + (i + 0.5) * (sw / 3),
          sy + sh * 0.25,
        );
      });

      // Steam animation
      ctx.save();
      ctx.globalAlpha = 0.15 + prog * 0.15;
      const steamT = t / 600;
      for (let si = 0; si < 3; si++) {
        const sx2 = cx + (si - 1) * (r * 0.5);
        const sy2 = cy - r - 6 - ((steamT + si * 1.1) % 3) * 10;
        const sr = 3 + Math.sin(steamT + si) * 1.5;
        ctx.beginPath();
        ctx.arc(sx2, sy2, sr, 0, Math.PI * 2);
        ctx.fillStyle = "#FFF";
        ctx.fill();
      }
      ctx.restore();
    }
  }

  _drawBatterStation(s, sx, sy, sw, sh) {
    const ctx = this.ctx;
    const cx = sx + sw / 2,
      cy = sy + sh * 0.42;

    // Bidon (trapézoïdal, gradient + reflet)
    ctx.beginPath();
    ctx.moveTo(sx + 8, sy + 6);
    ctx.lineTo(sx + sw - 8, sy + 6);
    ctx.lineTo(sx + sw - 5, sy + sh * 0.72);
    ctx.lineTo(sx + 5, sy + sh * 0.72);
    ctx.closePath();
    const bidonGrad = vGrad(ctx, sy + 6, sy + sh * 0.72, "#D8C890", "#A89060");
    ctx.fillStyle = bidonGrad;
    ctx.fill();
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Specular reflection on left side
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = "#FFF";
    ctx.fillRect(sx + 9, sy + 10, 4, sh * 0.55);
    ctx.restore();

    // Handle (arc on right side)
    ctx.strokeStyle = "#907848";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(sx + sw - 4, cy, sh * 0.18, -0.8, 0.8);
    ctx.stroke();

    // Lid (gradient)
    const lidGrad = hGrad(ctx, sx + 3, sx + sw - 3, "#9A7F4A", "#7A6230");
    roundRect(ctx, sx + 3, sy + 2, sw - 6, sh * 0.15, 4);
    ctx.fillStyle = lidGrad;
    ctx.fill();
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Lid handle
    ctx.fillStyle = "#8B7340";
    ctx.beginPath();
    ctx.arc(cx, sy + 2, 4, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Batter splashes (decorative)
    ctx.fillStyle = "rgba(200,180,130,0.35)";
    [
      [sx + 3, sy + sh * 0.68, 3],
      [sx + sw - 6, sy + sh * 0.55, 2.5],
    ].forEach(([dx, dy, dr]) => {
      ctx.beginPath();
      ctx.arc(dx, dy, dr, 0, Math.PI * 2);
      ctx.fill();
    });

    // Icon
    ctx.font = `${sw * 0.42}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🥣", cx, cy + sh * 0.12);
  }

  _drawIngredientStation(s, sx, sy, sw, sh) {
    const ctx = this.ctx;
    const cx = sx + sw / 2,
      cy = sy + sh * 0.5;

    // 3D Bowl shape
    const bowlW = sw - 8,
      bowlH = sh * 0.52;
    const bowlY = sy + sh * 0.28;

    // Bowl interior (dark gradient for depth)
    ctx.beginPath();
    ctx.ellipse(
      cx,
      bowlY + bowlH * 0.5,
      bowlW / 2 - 3,
      bowlH * 0.35,
      0,
      0,
      Math.PI * 2,
    );
    const innerGrad = ctx.createRadialGradient(
      cx,
      bowlY + bowlH * 0.4,
      2,
      cx,
      bowlY + bowlH * 0.5,
      bowlW / 2,
    );
    innerGrad.addColorStop(0, COL.STATION_BOWL_INNER);
    innerGrad.addColorStop(1, "#B8A080");
    ctx.fillStyle = innerGrad;
    ctx.fill();

    // Bowl body (outer)
    ctx.beginPath();
    ctx.moveTo(sx + 4, bowlY);
    ctx.quadraticCurveTo(sx + 2, bowlY + bowlH, cx, bowlY + bowlH + 4);
    ctx.quadraticCurveTo(sx + sw - 2, bowlY + bowlH, sx + sw - 4, bowlY);
    ctx.lineTo(sx + 4, bowlY);
    ctx.closePath();
    const bowlGrad = vGrad(
      ctx,
      bowlY,
      bowlY + bowlH + 4,
      COL.STATION_BOWL_OUTER,
      "#C8B490",
    );
    ctx.fillStyle = bowlGrad;
    ctx.fill();
    ctx.strokeStyle = COL.STATION_BOWL_STROKE;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Bowl rim (top ellipse)
    ctx.beginPath();
    ctx.ellipse(cx, bowlY, bowlW / 2, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = COL.STATION_BOWL_RIM;
    ctx.fill();
    ctx.strokeStyle = COL.STATION_BOWL_STROKE;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Rim highlight
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.ellipse(cx, bowlY - 1, bowlW / 2 - 4, 2.5, 0, Math.PI + 0.3, -0.3);
    ctx.strokeStyle = "#FFF";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // Ingredient icon (larger)
    const icon = ITEM_ICONS[s.type] || "?";
    ctx.font = `${Math.max(16, sw * 0.42)}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(icon, cx, bowlY + bowlH * 0.3);
  }

  _drawDeliveryStation(s, sx, sy, sw, sh) {
    const ctx = this.ctx;
    const cx = sx + sw / 2;
    const hasRejected = s.deliveryStatus === "rejected";
    const hasWaiting = s.deliveryStatus === "waiting";
    const isEmpty = s.deliveryStatus === "empty";
    const t = this._time;

    // Guichet base (rounded with gradient)
    const baseColor = isEmpty
      ? COL.DELIVERY_BASE
      : hasRejected
        ? COL.DELIVERY_REJECT
        : "#3498DB";
    const baseDark = isEmpty
      ? COL.DELIVERY_GLOW
      : hasRejected
        ? "#C0392B"
        : "#2980B9";
    const baseGrad = vGrad(ctx, sy + 4, sy + sh - 4, baseColor, baseDark);
    roundRect(ctx, sx + 2, sy + 4, sw - 4, sh - 4, 8);
    ctx.fillStyle = baseGrad;
    ctx.fill();
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Top surface (inclined)
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(sx + 4, sy + 5, sw - 8, 5);

    // Service bell
    if (isEmpty || hasWaiting) {
      const bellY = sy + sh * 0.22;
      // Bell body (half circle)
      ctx.beginPath();
      ctx.arc(cx, bellY + 4, 8, Math.PI, 0);
      ctx.closePath();
      const bellGrad = ctx.createRadialGradient(cx, bellY, 2, cx, bellY + 4, 8);
      bellGrad.addColorStop(0, "#FFE040");
      bellGrad.addColorStop(1, "#C8A020");
      ctx.fillStyle = bellGrad;
      ctx.fill();
      ctx.strokeStyle = "#8A6A10";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Bell knob
      ctx.beginPath();
      ctx.arc(cx, bellY - 1, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#DAA520";
      ctx.fill();
      ctx.strokeStyle = "#8A6A10";
      ctx.lineWidth = 1;
      ctx.stroke();
      // Bell base
      ctx.fillStyle = "#B89020";
      ctx.fillRect(cx - 10, bellY + 4, 20, 3);
    }

    // LED indicator
    const ledR = 4;
    const ledX = sx + sw - 10;
    const ledY = sy + 12;
    const ledPulse = 0.7 + 0.3 * Math.sin(t / 300);
    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = isEmpty
      ? "rgba(46,204,113,0.5)"
      : hasRejected
        ? "rgba(231,76,60,0.5)"
        : "rgba(52,152,219,0.5)";
    ctx.beginPath();
    ctx.arc(ledX, ledY, ledR, 0, Math.PI * 2);
    ctx.fillStyle = isEmpty ? "#2ECC71" : hasRejected ? "#E74C3C" : "#3498DB";
    ctx.globalAlpha = ledPulse;
    ctx.fill();
    ctx.restore();

    // State content
    if (isEmpty) {
      // Empty tray (oval)
      ctx.beginPath();
      ctx.ellipse(cx, sy + sh * 0.55, sw * 0.28, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      ctx.font = `${Math.max(16, sw * 0.35)}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(hasRejected ? "❌" : "🥞", cx, sy + sh * 0.5);
    }

    // Rejected flash
    if (hasRejected) {
      const flash = Math.abs(Math.sin(t / 250));
      ctx.save();
      ctx.globalAlpha = flash * 0.3;
      roundRect(ctx, sx, sy + 2, sw, sh, 8);
      ctx.fillStyle = "#E74C3C";
      ctx.fill();
      ctx.restore();
    }
  }

  _drawTrash(s, sx, sy, sw, sh) {
    const ctx = this.ctx;
    const cx = sx + sw / 2;

    // Can body (cylindrical tapered shape with gradient)
    const bodyTop = sy + sh * 0.25;
    const bodyH = sh * 0.65;
    ctx.beginPath();
    ctx.moveTo(sx + 6, bodyTop);
    ctx.lineTo(sx + 4, bodyTop + bodyH);
    ctx.lineTo(sx + sw - 4, bodyTop + bodyH);
    ctx.lineTo(sx + sw - 6, bodyTop);
    ctx.closePath();
    const trashGrad = vGrad(
      ctx,
      bodyTop,
      bodyTop + bodyH,
      COL.TRASH_A,
      COL.TRASH_B,
    );
    ctx.fillStyle = trashGrad;
    ctx.fill();
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Specular reflection
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = "#FFF";
    ctx.fillRect(sx + 8, bodyTop + 4, 3, bodyH - 8);
    ctx.restore();

    // Curved ridges
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 3; i++) {
      const rx = sx + 6 + (sw - 12) * (i / 3);
      ctx.beginPath();
      ctx.moveTo(rx, bodyTop + 6);
      ctx.quadraticCurveTo(
        rx - 1,
        bodyTop + bodyH / 2,
        rx,
        bodyTop + bodyH - 4,
      );
      ctx.stroke();
    }

    // Lid (domed with gradient)
    const lidGrad = hGrad(
      ctx,
      sx + 3,
      sx + sw - 3,
      COL.TRASH_LID_A,
      COL.TRASH_LID_B,
    );
    roundRect(ctx, sx + 3, sy + sh * 0.18, sw - 6, sh * 0.1, 4);
    ctx.fillStyle = lidGrad;
    ctx.fill();
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Lid handle (U shape)
    ctx.strokeStyle = "#606870";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, sy + sh * 0.16, 6, Math.PI, 0);
    ctx.stroke();

    // Pedal (small rect at bottom-right)
    ctx.fillStyle = "#555";
    roundRect(ctx, sx + sw - 14, sy + sh * 0.85, 10, 6, 2);
    ctx.fill();
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Icon
    ctx.font = `${Math.max(14, sw * 0.3)}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🗑️", cx, bodyTop + bodyH * 0.45);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  //  WAITER NPC — Serveur automatique style Overcooked
  // ══════════════════════════════════════════════════════════════════════════════
  _drawWaiter(waiter, W, H, counterY, counterH) {
    const ctx = this.ctx;
    const px = waiter.x,
      py = waiter.y;
    const sz = 75;
    const t = this._time;
    const walk = waiter.isMoving
      ? Math.sin((waiter.walkFrame / 4) * Math.PI * 2)
      : 0;

    ctx.save();

    // Drop shadow
    dropShadow(ctx, px, py + sz * 0.52, sz * 0.3, sz * 0.07, 0.18);

    // ── Legs (black pants) ──
    const legW = sz * 0.12,
      legH = sz * 0.24;
    const legY2 = py + sz * 0.2;
    const legOffL = walk * sz * 0.06,
      legOffR = -walk * sz * 0.06;
    ctx.fillStyle = "#222";
    roundRect(ctx, px - sz * 0.12, legY2 + legOffL, legW, legH, 3);
    ctx.fill();
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    roundRect(ctx, px + sz * 0.01, legY2 + legOffR, legW, legH, 3);
    ctx.fill();
    ctx.stroke();
    // Shoes
    ctx.fillStyle = "#1A1A1A";
    ctx.beginPath();
    ctx.ellipse(
      px - sz * 0.06,
      legY2 + legH + legOffL + sz * 0.02,
      legW * 0.7,
      sz * 0.045,
      0.15,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(
      px + sz * 0.07,
      legY2 + legH + legOffR + sz * 0.02,
      legW * 0.7,
      sz * 0.045,
      -0.15,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    // ── Lower body (black pants) ──
    ctx.beginPath();
    ctx.moveTo(px - sz * 0.22, py + sz * 0.18);
    ctx.lineTo(px + sz * 0.22, py + sz * 0.18);
    ctx.lineTo(px + sz * 0.25, py + sz * 0.42);
    ctx.lineTo(px - sz * 0.25, py + sz * 0.42);
    ctx.closePath();
    ctx.fillStyle = "#222";
    ctx.fill();
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = COL.OUTLINE_W;
    ctx.stroke();

    // ── Body (black shirt + white apron) ──
    const bW = sz * 0.5,
      bH = sz * 0.4;
    const bX = px - bW / 2,
      bY = py - sz * 0.16;
    const shirtGrad = vGrad(ctx, bY, bY + bH, "#333", "#1A1A1A");
    roundRect(ctx, bX, bY, bW, bH, sz * 0.08);
    ctx.fillStyle = shirtGrad;
    ctx.fill();
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = COL.OUTLINE_W;
    ctx.stroke();
    // Apron
    const apW = bW * 0.7,
      apH = bH * 0.65;
    const apX = px - apW / 2,
      apY = bY + bH * 0.3;
    const apronGrad = vGrad(ctx, apY, apY + apH, "#FFFFFF", "#E8E8E8");
    roundRect(ctx, apX, apY, apW, apH, 4);
    ctx.fillStyle = apronGrad;
    ctx.fill();
    ctx.strokeStyle = "#CCC";
    ctx.lineWidth = 1;
    ctx.stroke();
    // Bow tie
    ctx.fillStyle = "#E30613";
    ctx.beginPath();
    ctx.moveTo(px, bY + 6);
    ctx.lineTo(px - 5, bY + 1);
    ctx.lineTo(px - 5, bY + 11);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(px, bY + 6);
    ctx.lineTo(px + 5, bY + 1);
    ctx.lineTo(px + 5, bY + 11);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px, bY + 6, 2, 0, Math.PI * 2);
    ctx.fillStyle = "#C00";
    ctx.fill();

    // ── Arms ──
    const aW = sz * 0.1,
      aH = sz * 0.28,
      aY = bY + sz * 0.04;
    // Left arm (holding tray when delivering)
    ctx.save();
    ctx.translate(bX - aW * 0.3, aY - walk * sz * 0.04);
    const leftRot = waiter.state === "delivering" ? -0.8 : -0.15 + walk * 0.15;
    ctx.rotate(leftRot);
    roundRect(ctx, 0, 0, aW, aH, 3);
    ctx.fillStyle = "#FDBCB4";
    ctx.fill();
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    // Right arm
    ctx.save();
    ctx.translate(bX + bW + aW * 0.3 - aW, aY + walk * sz * 0.04);
    ctx.rotate(0.15 - walk * 0.15);
    roundRect(ctx, 0, 0, aW, aH, 3);
    ctx.fillStyle = "#FDBCB4";
    ctx.fill();
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // ── Head ──
    const hR = sz * 0.2,
      hX = px,
      hY = bY - hR * 0.65;
    // Neck
    ctx.fillStyle = "#FDBCB4";
    ctx.fillRect(px - sz * 0.06, hY + hR * 0.5, sz * 0.12, sz * 0.14);
    // Head circle
    ctx.beginPath();
    ctx.arc(hX, hY, hR, 0, Math.PI * 2);
    const faceGrad = ctx.createRadialGradient(hX, hY - 2, 2, hX, hY, hR);
    faceGrad.addColorStop(0, "#FFD5C5");
    faceGrad.addColorStop(1, "#E8AB95");
    ctx.fillStyle = faceGrad;
    ctx.fill();
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = COL.OUTLINE_W;
    ctx.stroke();
    // Short brown hair
    ctx.beginPath();
    ctx.ellipse(hX, hY - hR * 0.5, hR * 1.05, hR * 0.55, 0, Math.PI, 0);
    ctx.fillStyle = "#3A1E00";
    ctx.fill();
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Eyes
    const eDir = waiter.direction || 1;
    const eOff = eDir * hR * 0.1;
    [-0.22, 0.18].forEach((ex) => {
      ctx.fillStyle = "#FFF";
      ctx.beginPath();
      ctx.ellipse(
        hX + eOff + hR * ex,
        hY + hR * 0.05,
        hR * 0.14,
        hR * 0.12,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.strokeStyle = COL.OUTLINE;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "#3A2000";
      ctx.beginPath();
      ctx.arc(hX + eOff + hR * ex, hY + hR * 0.06, hR * 0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFF";
      ctx.beginPath();
      ctx.arc(
        hX + eOff + hR * ex - 1,
        hY + hR * 0.02,
        hR * 0.03,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    });
    // Smile
    ctx.strokeStyle = "#A05050";
    ctx.lineWidth = hR * 0.08;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(hX, hY + hR * 0.22, hR * 0.22, 0.3, Math.PI - 0.3);
    ctx.stroke();
    ctx.lineCap = "butt";

    // ── Tray (when carrying) ──
    if (waiter.state === "delivering" || waiter.state === "picking") {
      const trayX = px - sz * 0.42;
      const trayY = hY - hR - sz * 0.12;
      // Arm connection for tray
      // Silver tray (gradient)
      ctx.beginPath();
      ctx.ellipse(trayX, trayY, sz * 0.18, sz * 0.05, 0, 0, Math.PI * 2);
      const trayGrad = ctx.createRadialGradient(
        trayX,
        trayY - 2,
        1,
        trayX,
        trayY,
        sz * 0.18,
      );
      trayGrad.addColorStop(0, "#E8E8E8");
      trayGrad.addColorStop(1, "#A0A0A0");
      ctx.fillStyle = trayGrad;
      ctx.fill();
      ctx.strokeStyle = COL.OUTLINE;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Crepe on tray
      if (waiter.heldCrepe) {
        ctx.font = `${sz * 0.2}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🥞", trayX, trayY - 6);
      }
    }

    ctx.restore();
  }

  // ══════════════════════════════════════════════════════════════════════════════
  //  AUTO PLAYER (Assurance G2S) — Updated with cel-shading
  // ══════════════════════════════════════════════════════════════════════════════
  _drawAutoPlayer(ap, counterY) {
    const ctx = this.ctx;
    const px = ap.x,
      py = ap.y,
      sz = ap.size;
    const t = this._time;

    ctx.save();

    // Red pulsing halo
    const pulse = 0.55 + 0.45 * Math.abs(Math.sin(t / 350));
    ctx.save();
    ctx.globalAlpha = 0.28 * pulse;
    ctx.beginPath();
    ctx.ellipse(px, py + sz * 0.55, sz * 0.7, sz * 0.15, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#E30613";
    ctx.fill();
    ctx.restore();

    // Drop shadow
    dropShadow(ctx, px, py + sz * 0.55, sz * 0.32, sz * 0.08, 0.18);

    const walk = ap.isMoving ? Math.sin((ap.walkFrame / 4) * Math.PI * 2) : 0;

    // Red G2S skirt
    ctx.beginPath();
    ctx.moveTo(px - sz * 0.28, py + sz * 0.22);
    ctx.lineTo(px + sz * 0.28, py + sz * 0.22);
    ctx.lineTo(px + sz * 0.32, py + sz * 0.5);
    ctx.lineTo(px - sz * 0.32, py + sz * 0.5);
    ctx.closePath();
    ctx.fillStyle = "#E30613";
    ctx.fill();
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = COL.OUTLINE_W;
    ctx.stroke();

    // Legs
    const legW = sz * 0.13,
      legH = sz * 0.28,
      legY = py + sz * 0.22;
    ctx.fillStyle = "#FDBCB4";
    roundRect(ctx, px - sz * 0.14, legY + walk * sz * 0.07, legW, legH, 3);
    ctx.fill();
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    roundRect(ctx, px + sz * 0.01, legY - walk * sz * 0.07, legW, legH, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#C00000";
    ctx.beginPath();
    ctx.ellipse(
      px - sz * 0.07,
      legY + legH + walk * sz * 0.07 + sz * 0.03,
      legW * 0.7,
      sz * 0.055,
      0.2,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(
      px + sz * 0.07,
      legY + legH - walk * sz * 0.07 + sz * 0.03,
      legW * 0.7,
      sz * 0.055,
      -0.2,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    // Body (white shirt with G2S logo, outlined)
    const bW = sz * 0.54,
      bH = sz * 0.42,
      bX = px - bW / 2,
      bY = py - sz * 0.18;
    roundRect(ctx, bX, bY, bW, bH, sz * 0.1);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.strokeStyle = "#E30613";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = COL.OUTLINE_W;
    ctx.stroke();
    ctx.font = `bold ${sz * 0.2}px Arial`;
    ctx.fillStyle = "#E30613";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("G2S", px, bY + bH * 0.5);

    // Arms
    const aW = sz * 0.11,
      aH = sz * 0.3,
      aY2 = bY + sz * 0.05;
    ctx.save();
    ctx.translate(bX - aW * 0.4, aY2 - walk * sz * 0.05);
    ctx.rotate(-0.15 + walk * 0.2);
    roundRect(ctx, 0, 0, aW, aH, 4);
    ctx.fillStyle = "#FDBCB4";
    ctx.fill();
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.translate(bX + bW + aW * 0.4 - aW, aY2 + walk * sz * 0.05);
    ctx.rotate(0.15 - walk * 0.2);
    roundRect(ctx, 0, 0, aW, aH, 4);
    ctx.fillStyle = "#FDBCB4";
    ctx.fill();
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // Head
    const hR = sz * 0.22,
      hX = px,
      hY = bY - hR * 0.7;
    ctx.fillStyle = "#FDBCB4";
    ctx.fillRect(px - sz * 0.07, hY + hR * 0.6, sz * 0.14, sz * 0.16);
    ctx.beginPath();
    ctx.arc(hX, hY, hR, 0, Math.PI * 2);
    const faceGrad = ctx.createRadialGradient(hX, hY - 2, 2, hX, hY, hR);
    faceGrad.addColorStop(0, "#FFD5C5");
    faceGrad.addColorStop(1, "#E8AB95");
    ctx.fillStyle = faceGrad;
    ctx.fill();
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = COL.OUTLINE_W;
    ctx.stroke();
    // Dark hair
    ctx.beginPath();
    ctx.ellipse(hX, hY - hR * 0.55, hR * 1.02, hR * 0.55, 0, Math.PI, 0);
    ctx.fillStyle = "#4A2800";
    ctx.fill();
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Red G2S cap
    ctx.fillStyle = "#E30613";
    ctx.beginPath();
    ctx.ellipse(hX, hY - hR * 0.75, hR * 1.05, hR * 0.35, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(hX - hR * 1.1, hY - hR * 0.78, hR * 2.2, hR * 0.22);
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(hX, hY - hR * 0.75, hR * 1.05, hR * 0.35, 0, Math.PI, 0);
    ctx.stroke();
    // Eyes
    const eOff = ap.direction * hR * 0.12,
      eY2 = hY + hR * 0.05;
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.ellipse(
      hX + eOff - hR * 0.22,
      eY2,
      hR * 0.16,
      hR * 0.13,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(
      hX + eOff + hR * 0.18,
      eY2,
      hR * 0.16,
      hR * 0.13,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.fillStyle = "#3A2000";
    ctx.beginPath();
    ctx.arc(hX + eOff - hR * 0.22, eY2, hR * 0.09, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(hX + eOff + hR * 0.18, eY2, hR * 0.09, 0, Math.PI * 2);
    ctx.fill();

    // Items held
    this._drawHeldItems(ap, px, hY - hR - sz * 0.25, sz);

    ctx.restore();
  }

  // ── Bonus indicator ──────────────────────────────────────────────────────────
  _drawBonusIndicator(ctx, W, H, bonusTimer) {
    const x = 12,
      y = H - 74,
      bw = 190,
      bh = 42;
    const frac = Math.max(0, bonusTimer / 15);
    const pulse = 0.85 + 0.15 * Math.abs(Math.sin(this._time / 300));

    ctx.save();
    ctx.globalAlpha = 0.92;
    // Badge background
    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = "rgba(227,6,19,0.3)";
    roundRect(ctx, x, y, bw, bh, 10);
    ctx.fillStyle = "#2D2B45";
    ctx.fill();
    ctx.restore();
    // Outline
    roundRect(ctx, x, y, bw, bh, 10);
    ctx.strokeStyle = "#E30613";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Progress bar
    roundRect(ctx, x + 6, y + bh - 12, (bw - 12) * frac, 7, 3.5);
    ctx.fillStyle = frac > 0.4 ? "#E30613" : "#FF6B6B";
    ctx.globalAlpha = pulse;
    ctx.fill();
    ctx.globalAlpha = 0.92;

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 13px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("🛡️ Assurance G2S", x + 10, y + bh * 0.38);
    ctx.fillStyle = "#FFCDD2";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "right";
    ctx.fillText(`${Math.ceil(bonusTimer)}s`, x + bw - 10, y + bh * 0.38);
    ctx.restore();
  }

  // ══════════════════════════════════════════════════════════════════════════════
  //  PLAYER (Cerise) — Cel-shading outlines, gradients, enriched visuals
  // ══════════════════════════════════════════════════════════════════════════════
  _drawPlayer(player, counterY, counterH) {
    const ctx = this.ctx;
    const px = player.x,
      py = player.y,
      sz = player.size;
    const t = this._time;

    ctx.save();

    // Drop shadow
    dropShadow(ctx, px, py + sz * 0.55, sz * 0.34, sz * 0.09, 0.22);

    // Idle micro-sway
    const idle = player.isMoving ? 0 : Math.sin(t / 2000) * 0.005;
    if (idle) {
      ctx.translate(px, py);
      ctx.rotate(idle);
      ctx.translate(-px, -py);
    }

    const walk = player.isMoving
      ? Math.sin((player.walkFrame / 4) * Math.PI * 2)
      : 0;

    // ── Skirt (white with green polka dots, outlined) ──
    ctx.beginPath();
    ctx.moveTo(px - sz * 0.28, py + sz * 0.22);
    ctx.lineTo(px + sz * 0.28, py + sz * 0.22);
    ctx.lineTo(px + sz * 0.32, py + sz * 0.5);
    ctx.lineTo(px - sz * 0.32, py + sz * 0.5);
    ctx.closePath();
    const skirtGrad = vGrad(
      ctx,
      py + sz * 0.22,
      py + sz * 0.5,
      "#FFFFFF",
      "#F0F0F0",
    );
    ctx.fillStyle = skirtGrad;
    ctx.fill();
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = COL.OUTLINE_W;
    ctx.stroke();
    // Green polka dots with tiny shadow
    const dotPositions = [
      [-sz * 0.18, sz * 0.28],
      [0, sz * 0.32],
      [sz * 0.16, sz * 0.28],
      [-sz * 0.1, sz * 0.42],
      [sz * 0.08, sz * 0.45],
    ];
    dotPositions.forEach(([dx, dy]) => {
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      ctx.beginPath();
      ctx.arc(px + dx + 0.5, py + dy + 0.5, sz * 0.042, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#4CAF50";
      ctx.beginPath();
      ctx.arc(px + dx, py + dy, sz * 0.042, 0, Math.PI * 2);
      ctx.fill();
    });

    // ── Legs ──
    const legW = sz * 0.13,
      legH = sz * 0.28;
    const legY = py + sz * 0.22;
    const legLX = px - sz * 0.14,
      legRX = px + sz * 0.01;
    const legOffL = walk * sz * 0.07,
      legOffR = -walk * sz * 0.07;

    // Legs (gradient chair)
    const legGrad = vGrad(ctx, legY, legY + legH, "#FDBCB4", "#E8A090");
    [
      [legLX, legOffL],
      [legRX, legOffR],
    ].forEach(([lx, off]) => {
      roundRect(ctx, lx, legY + off, legW, legH, 3);
      ctx.fillStyle = legGrad;
      ctx.fill();
      ctx.strokeStyle = COL.OUTLINE;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // Red shoes (with specular highlight)
    [
      [legLX + legW / 2, legY + legH + legOffL + sz * 0.03, 0.2],
      [legRX + legW / 2, legY + legH + legOffR + sz * 0.03, -0.2],
    ].forEach(([sx2, sy2, rot]) => {
      ctx.fillStyle = "#C00000";
      ctx.beginPath();
      ctx.ellipse(sx2, sy2, legW * 0.75, sz * 0.06, rot, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = COL.OUTLINE;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Specular
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = "#FFF";
      ctx.beginPath();
      ctx.ellipse(sx2 - 1, sy2 - 1, legW * 0.3, sz * 0.02, rot, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // ── Body (white blouse with green dots, gradient, outlined) ──
    const bodyW = sz * 0.54,
      bodyH = sz * 0.42;
    const bodyX = px - bodyW / 2,
      bodyY = py - sz * 0.18;
    const bodyGrad = vGrad(ctx, bodyY, bodyY + bodyH, "#FFFFFF", "#F0F0F0");
    roundRect(ctx, bodyX, bodyY, bodyW, bodyH, sz * 0.1);
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = COL.OUTLINE_W;
    ctx.stroke();
    // Green dots with shadow
    [
      [-sz * 0.14, sz * 0.06],
      [sz * 0.1, sz * 0.04],
      [-sz * 0.06, sz * 0.2],
      [sz * 0.15, sz * 0.22],
      [-sz * 0.17, sz * 0.32],
      [sz * 0.04, sz * 0.34],
    ].forEach(([dx, dy]) => {
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      ctx.beginPath();
      ctx.arc(px + dx + 0.5, bodyY + dy + 0.5, sz * 0.044, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#4CAF50";
      ctx.beginPath();
      ctx.arc(px + dx, bodyY + dy, sz * 0.044, 0, Math.PI * 2);
      ctx.fill();
    });

    // ── Arms (gradient, outlined) ──
    const armW = sz * 0.11,
      armH = sz * 0.3;
    const armY = bodyY + sz * 0.05;
    // Left arm
    ctx.save();
    ctx.translate(bodyX - armW * 0.4, armY - walk * sz * 0.05);
    ctx.rotate(-0.15 + walk * 0.2);
    roundRect(ctx, 0, 0, armW, armH, 4);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = "#4CAF50";
    [
      [armW * 0.5, armH * 0.2],
      [armW * 0.3, armH * 0.55],
      [armW * 0.65, armH * 0.68],
    ].forEach(([dx, dy]) => {
      ctx.beginPath();
      ctx.arc(dx, dy, armW * 0.22, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
    // Right arm
    ctx.save();
    ctx.translate(bodyX + bodyW + armW * 0.4 - armW, armY + walk * sz * 0.05);
    ctx.rotate(0.15 - walk * 0.2);
    roundRect(ctx, 0, 0, armW, armH, 4);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = "#4CAF50";
    [
      [armW * 0.5, armH * 0.2],
      [armW * 0.3, armH * 0.55],
      [armW * 0.65, armH * 0.68],
    ].forEach(([dx, dy]) => {
      ctx.beginPath();
      ctx.arc(dx, dy, armW * 0.22, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // ── Head ──
    const headR = sz * 0.22;
    const headCX = px,
      headCY = bodyY - headR * 0.7;

    // Neck
    ctx.fillStyle = "#FDBCB4";
    ctx.fillRect(px - sz * 0.07, headCY + headR * 0.6, sz * 0.14, sz * 0.16);

    // Head (gradient radial)
    ctx.beginPath();
    ctx.arc(headCX, headCY, headR, 0, Math.PI * 2);
    const faceGrad = ctx.createRadialGradient(
      headCX - 2,
      headCY - 3,
      2,
      headCX,
      headCY,
      headR,
    );
    faceGrad.addColorStop(0, "#FFD5C5");
    faceGrad.addColorStop(1, "#E8AB95");
    ctx.fillStyle = faceGrad;
    ctx.fill();
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = COL.OUTLINE_W;
    ctx.stroke();

    // Blonde hair (gradient + strands)
    const hairGrad = vGrad(
      ctx,
      headCY - headR,
      headCY - headR * 0.2,
      "#FFDD30",
      "#D4A010",
    );
    ctx.beginPath();
    ctx.ellipse(
      headCX,
      headCY - headR * 0.55,
      headR * 1.08,
      headR * 0.6,
      0,
      Math.PI,
      0,
    );
    ctx.fillStyle = hairGrad;
    ctx.fill();
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Side hair curls
    ctx.fillStyle = "#F0C020";
    ctx.beginPath();
    ctx.ellipse(
      headCX - headR * 0.88,
      headCY + headR * 0.12,
      headR * 0.32,
      headR * 0.48,
      -0.25,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(
      headCX + headR * 0.88,
      headCY + headR * 0.12,
      headR * 0.32,
      headR * 0.48,
      0.25,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.stroke();

    // Chef hat (gradient + folds)
    const hatW = headR * 1.7;
    const hatBandH = headR * 0.24;
    const hatHatH = headR * 0.7;
    const hatX = headCX - hatW / 2;
    const hatBandY = headCY - headR * 0.74;
    const hatHatY = hatBandY - hatHatH;
    // Red Groupama band
    const bandGrad = hGrad(ctx, hatX, hatX + hatW, "#E30613", "#C00510");
    ctx.fillStyle = bandGrad;
    ctx.fillRect(hatX, hatBandY, hatW, hatBandH);
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(hatX, hatBandY, hatW, hatBandH);
    // Hat body (gradient)
    const hatGrad = vGrad(ctx, hatHatY, hatBandY, "#FFFFFF", "#F0F0F0");
    roundRect(ctx, hatX + hatW * 0.05, hatHatY, hatW * 0.9, hatHatH + 2, 4);
    ctx.fillStyle = hatGrad;
    ctx.fill();
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Hat puff on top
    ctx.beginPath();
    ctx.ellipse(
      headCX,
      hatHatY + 2,
      hatW * 0.4,
      headR * 0.3,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = 1;
    ctx.stroke();
    // Fold lines on hat
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(hatX + hatW * 0.3, hatHatY + 5);
    ctx.lineTo(hatX + hatW * 0.28, hatBandY - 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(hatX + hatW * 0.65, hatHatY + 8);
    ctx.lineTo(hatX + hatW * 0.7, hatBandY - 2);
    ctx.stroke();
    ctx.restore();

    // Eyes (larger, with iris and double reflet)
    const eyeOffX = player.direction * headR * 0.12;
    const eyeY = headCY + headR * 0.05;
    [-0.22, 0.18].forEach((ex) => {
      const eX = headCX + eyeOffX + headR * ex;
      // White of eye
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.ellipse(eX, eyeY, headR * 0.18, headR * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = COL.OUTLINE;
      ctx.lineWidth = 1;
      ctx.stroke();
      // Blue iris
      ctx.fillStyle = "#4A8AC0";
      ctx.beginPath();
      ctx.arc(eX, eyeY + 0.5, headR * 0.1, 0, Math.PI * 2);
      ctx.fill();
      // Pupil
      ctx.fillStyle = "#1A1A1A";
      ctx.beginPath();
      ctx.arc(eX, eyeY + 0.5, headR * 0.055, 0, Math.PI * 2);
      ctx.fill();
      // Double reflet (large + small)
      ctx.fillStyle = "#FFF";
      ctx.beginPath();
      ctx.arc(
        eX - headR * 0.04,
        eyeY - headR * 0.04,
        headR * 0.05,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.beginPath();
      ctx.arc(
        eX + headR * 0.04,
        eyeY + headR * 0.04,
        headR * 0.025,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    });

    // Rosy cheeks (gradient radial)
    [-0.42, 0.42].forEach((cx) => {
      const grad = ctx.createRadialGradient(
        headCX + headR * cx,
        eyeY + headR * 0.2,
        1,
        headCX + headR * cx,
        eyeY + headR * 0.2,
        headR * 0.22,
      );
      grad.addColorStop(0, "rgba(255,130,130,0.35)");
      grad.addColorStop(1, "rgba(255,130,130,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(
        headCX + headR * cx,
        eyeY + headR * 0.2,
        headR * 0.22,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    });

    // Smile (thicker, rounder)
    ctx.strokeStyle = "#C05050";
    ctx.lineWidth = headR * 0.12;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(headCX, eyeY + headR * 0.25, headR * 0.3, 0.22, Math.PI - 0.22);
    ctx.stroke();
    ctx.lineCap = "butt";

    // Items held above head (with bobbing animation)
    const bob = Math.sin(t / 800) * 2;
    this._drawHeldItems(player, px, headCY - headR - sz * 0.35 + bob, sz);

    ctx.restore();
  }

  _drawHeldItems(player, cx, topY, sz) {
    const ctx = this.ctx;
    if (player.hands.length === 0) return;

    const itemSize = sz * 0.4;
    const spacing = itemSize + 5;
    const totalW = player.hands.length * spacing - 5;
    const startX = cx - totalW / 2;

    player.hands.forEach((item, i) => {
      const ix = startX + i * spacing;
      const iy = topY;

      // Item background (gradient + outline + shadow)
      ctx.save();
      ctx.shadowBlur = 6;
      ctx.shadowColor = "rgba(0,0,0,0.3)";
      roundRect(
        ctx,
        ix - itemSize / 2,
        iy - itemSize / 2,
        itemSize,
        itemSize,
        6,
      );
      const itemBaseColor = ITEM_COLORS[item.type] || "#DDD";
      const itemGrad = ctx.createRadialGradient(
        ix,
        iy - 2,
        2,
        ix,
        iy,
        itemSize * 0.5,
      );
      itemGrad.addColorStop(0, this._lightenColor(itemBaseColor, 30));
      itemGrad.addColorStop(1, itemBaseColor);
      ctx.fillStyle = itemGrad;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = COL.OUTLINE;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Icon
      if (item.type === IT.ASSEMBLED_CREPE && item.toppings?.length > 0) {
        ctx.font = `${itemSize * 0.55}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(ITEM_ICONS.ASSEMBLED_CREPE, ix, iy);
        const tSize = itemSize * 0.3;
        item.toppings.slice(0, 3).forEach((topping, ti) => {
          const ta =
            (ti / Math.max(1, item.toppings.length)) * Math.PI * 2 -
            Math.PI / 2;
          const tr = itemSize * 0.28;
          ctx.font = `${tSize}px serif`;
          ctx.fillText(
            ITEM_ICONS[topping] || "?",
            ix + Math.cos(ta) * tr,
            iy + Math.sin(ta) * tr,
          );
        });
      } else {
        ctx.font = `${itemSize * 0.62}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(ITEM_ICONS[item.type] || "?", ix, iy);
      }
      ctx.restore();
    });
  }

  // ══════════════════════════════════════════════════════════════════════════════
  //  HUD — Hearts, feedback, particles
  // ══════════════════════════════════════════════════════════════════════════════
  _drawHUD(ctx, W, H, score, timeLeft, heartsLeft, maxHearts) {
    const heartSize = 28;
    const heartX = W - maxHearts * (heartSize + 8) - 12;
    const heartY = H - 38;

    for (let i = 0; i < maxHearts; i++) {
      const hx = heartX + i * (heartSize + 6);
      const isFull = i < heartsLeft;

      if (isFull) {
        // Gradient-filled heart via Bézier
        heartPath(ctx, hx + heartSize / 2, heartY, heartSize * 0.5);
        const hGrad2 = ctx.createRadialGradient(
          hx + heartSize / 2 - 3,
          heartY - 4,
          2,
          hx + heartSize / 2,
          heartY,
          heartSize * 0.5,
        );
        hGrad2.addColorStop(0, COL.HEART_FULL_A);
        hGrad2.addColorStop(1, COL.HEART_FULL_B);
        ctx.fillStyle = hGrad2;
        ctx.fill();
        ctx.strokeStyle = "#8B1A1A";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Specular highlight
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = "#FFF";
        ctx.beginPath();
        ctx.ellipse(
          hx + heartSize * 0.35,
          heartY - heartSize * 0.18,
          heartSize * 0.12,
          heartSize * 0.08,
          -0.3,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.restore();
      } else {
        // Empty heart
        heartPath(ctx, hx + heartSize / 2, heartY, heartSize * 0.5);
        ctx.fillStyle = COL.HEART_EMPTY;
        ctx.fill();
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  }

  // ── Particles (circles + star shapes) ──────────────────────────────────────
  addParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const speed = 80 + Math.random() * 80;
      const isStar = Math.random() > 0.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color,
        size: 4 + Math.random() * 5,
        isStar,
      });
    }
  }

  updateParticles(dt) {
    const dtS = dt / 1000;
    this.particles = this.particles.filter((p) => {
      p.x += p.vx * dtS;
      p.y += p.vy * dtS;
      p.vy += 200 * dtS;
      p.life -= dtS * 1.8;
      return p.life > 0;
    });
  }

  _drawParticles() {
    const ctx = this.ctx;
    this.particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.translate(p.x, p.y);

      if (p.isStar) {
        // 5-pointed star
        ctx.fillStyle = p.color;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
          const r = p.size;
          const ir = p.size * 0.4;
          ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
          const midAngle = angle + Math.PI / 5;
          ctx.lineTo(Math.cos(midAngle) * ir, Math.sin(midAngle) * ir);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }

      // Ghost trail
      ctx.globalAlpha = p.life * 0.3;
      ctx.beginPath();
      ctx.arc(-p.vx * 0.02, -p.vy * 0.02, p.size * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();

      ctx.restore();
    });
  }

  _drawDeliveryFeedback(feedback) {
    if (!feedback || feedback.timer <= 0) return;
    const ctx = this.ctx;
    const progress = 1 - feedback.timer / feedback.maxTimer;
    const alpha = Math.min(1, feedback.timer / 400);
    const vy = progress * -45;
    // Scale animation (elastic overshoot)
    let scale = 1;
    if (progress < 0.15) {
      scale = (progress / 0.15) * 1.25;
    } else if (progress < 0.25) {
      scale = 1.25 - ((progress - 0.15) / 0.1) * 0.25;
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(feedback.x, feedback.y + vy);
    ctx.scale(scale, scale);

    // Badge background
    const text = feedback.msg;
    ctx.font = "bold 18px Arial";
    const tw = ctx.measureText(text).width;
    const bw2 = tw + 20,
      bh2 = 30;
    roundRect(ctx, -bw2 / 2, -bh2 / 2, bw2, bh2, 8);
    ctx.fillStyle = feedback.color;
    ctx.fill();
    ctx.strokeStyle = "#FFF";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Text
    ctx.fillStyle = "#FFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 0, 0);

    ctx.restore();
  }

  // ══════════════════════════════════════════════════════════════════════════════
  //  AMBIENT LIGHTING — Warm overlay + vignette
  // ══════════════════════════════════════════════════════════════════════════════
  _drawAmbientLighting(W, H, counterY) {
    const ctx = this.ctx;

    // Warm lamp glow on restaurant area
    const lampPositions = [0.12, 0.32, 0.5, 0.68, 0.88];
    const rH = counterY;
    ctx.save();
    lampPositions.forEach((xr) => {
      const lx = W * xr;
      const ly = rH * 0.11 + 14;
      const r = 120;
      const grad = ctx.createRadialGradient(lx, ly, 10, lx, ly, r);
      grad.addColorStop(0, "rgba(255,215,140,0.06)");
      grad.addColorStop(1, "rgba(255,215,140,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(lx - r, ly - r, r * 2, r * 2);
    });
    ctx.restore();

    // Vignette (dark corners)
    ctx.save();
    const vigR = Math.max(W, H) * 0.8;
    const vigGrad = ctx.createRadialGradient(
      W / 2,
      H / 2,
      vigR * 0.5,
      W / 2,
      H / 2,
      vigR,
    );
    vigGrad.addColorStop(0, "rgba(0,0,0,0)");
    vigGrad.addColorStop(1, COL.VIGNETTE);
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // ── Utilities ──────────────────────────────────────────────────────────────
  _lerpColor(a, b, t) {
    if (isNaN(t)) t = 0; // Fallback if t is NaN

    let r1, g1, b1, r2, g2, b2;

    const parseColor = (c) => {
      if (c.startsWith("#") && c.length >= 7) {
        return [
          parseInt(c.slice(1, 3), 16) || 0,
          parseInt(c.slice(3, 5), 16) || 0,
          parseInt(c.slice(5, 7), 16) || 0,
        ];
      } else if (c.startsWith("rgb(")) {
        const parts = c.slice(4, -1).split(",");
        return [
          parseInt(parts[0]?.trim()) || 0,
          parseInt(parts[1]?.trim()) || 0,
          parseInt(parts[2]?.trim()) || 0,
        ];
      } else {
        return [128, 128, 128]; // Default gray
      }
    };

    [r1, g1, b1] = parseColor(a);
    [r2, g2, b2] = parseColor(b);

    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const bv = Math.round(b1 + (b2 - b1) * t);
    return `rgb(${r},${g},${bv})`;
  }

  _lightenColor(hex, amount) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = Math.min(255, r + amount);
    g = Math.min(255, g + amount);
    b = Math.min(255, b + amount);
    return `rgb(${r},${g},${b})`;
  }
}
