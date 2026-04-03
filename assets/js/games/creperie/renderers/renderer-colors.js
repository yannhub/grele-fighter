// renderer-colors.js — Palette COL + helpers canvas communs

// ─── Palettes (Overcooked warm tones) ────────────────────────────────────────
export const COL = {
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
export function roundRect(ctx, x, y, w, h, r) {
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
export function celRect(
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
export function vGrad(ctx, y0, y1, c0, c1) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, c0);
  g.addColorStop(1, c1);
  return g;
}

/** Create a horizontal linear gradient */
export function hGrad(ctx, x0, x1, c0, c1) {
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, c0);
  g.addColorStop(1, c1);
  return g;
}

/** Draw a drop shadow ellipse under an object */
export function dropShadow(ctx, cx, cy, rx, ry, alpha = 0.15) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#000";
  ctx.fill();
  ctx.restore();
}

/** Draw a heart shape using Bézier curves */
export function heartPath(ctx, cx, cy, size) {
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

export function fillText(ctx, text, x, y, font, color, align = "center") {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function lerpColor(a, b, t) {
  if (isNaN(t)) t = 0;

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
      return [128, 128, 128];
    }
  };

  const [r1, g1, b1] = parseColor(a);
  const [r2, g2, b2] = parseColor(b);

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const bv = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${bv})`;
}

export function lightenColor(hex, amount) {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  r = Math.min(255, r + amount);
  g = Math.min(255, g + amount);
  b = Math.min(255, b + amount);
  return `rgb(${r},${g},${b})`;
}
