// renderer-customers.js — Rendu des clients — style kawaii cartoon 3D

import { ITEM_ICONS, TABLE_POSITIONS } from "../creperie-constants.js";
import {
  COL,
  dropShadow,
  lightenColor,
  roundRect,
  vGrad,
} from "./renderer-colors.js";

// ── Kawaii helpers (local) ──────────────────────────────────────────────────
function kEye(ctx, cx, cy, rw, rh, irisColor) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rw, rh, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#FBFBFB";
  ctx.fill();
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1.4;
  ctx.stroke();
  const ig = ctx.createRadialGradient(
    cx,
    cy - rh * 0.1,
    0,
    cx,
    cy + rh * 0.1,
    rh * 0.65,
  );
  ig.addColorStop(0, lightenColor(irisColor, 55));
  ig.addColorStop(0.5, irisColor);
  ig.addColorStop(1, "#0A0A18");
  ctx.beginPath();
  ctx.arc(cx, cy + rh * 0.08, rh * 0.62, 0, Math.PI * 2);
  ctx.fillStyle = ig;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy + rh * 0.12, rh * 0.34, 0, Math.PI * 2);
  ctx.fillStyle = "#0D0D0D";
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(
    cx - rw * 0.26,
    cy - rh * 0.26,
    rw * 0.26,
    rh * 0.22,
    -0.35,
    0,
    Math.PI * 2,
  );
  ctx.fillStyle = "rgba(255,255,255,0.96)";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + rw * 0.18, cy + rh * 0.1, rh * 0.11, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.60)";
  ctx.fill();
}

function kCheek(ctx, cx, cy, r) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, "rgba(255,90,100,0.48)");
  g.addColorStop(1, "rgba(255,90,100,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, r * 0.62, 0, 0, Math.PI * 2);
  ctx.fill();
}

// 5 outfit configs: [bodyLight, bodyDark, hairLight, hairDark, irisColor, accent]
const OUTFITS = [
  ["#5A9FE8", "#2E70C0", "#5A3010", "#2A1208", "#3A7FCC", "#FFD700"], // blue + brown hair
  ["#F0A040", "#C07020", "#1A1A1A", "#0A0A0A", "#8B4513", "#FFFFFF"], // orange + black hair
  ["#A060D0", "#7030A0", "#FFDE22", "#C89010", "#9040C0", "#FFB0E8"], // purple + blonde
  ["#40B870", "#208850", "#C84030", "#901020", "#206830", "#FFE080"], // green + red hair
  ["#E85050", "#B02020", "#4A90E8", "#2060B0", "#C02020", "#FFE0D0"], // red + blue hair
];

export function drawCustomers(ctx, W, counterY, customers, time) {
  const rH = counterY;
  customers.forEach((c) => {
    const tablePos = TABLE_POSITIONS[c.tableIndex];
    if (!tablePos) return;
    const tx = W * tablePos.xRatio;
    const ty = rH * tablePos.yRatio - 30;

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

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(tx, ty);
    ctx.scale(scale, scale);
    drawCustomerBody(ctx, c, time);
    drawSpeechBubble(ctx, c, time);
    ctx.restore();
  });
}

export function drawCustomerBody(ctx, customer, time) {
  const outfit = OUTFITS[customer.tableIndex % 5];
  const [bodyA, bodyB, hairA, hairB, irisColor, accent] = outfit;

  const isAngry =
    customer.state === "leaving_angry" ||
    (customer.state === "seated" && customer.patienceFraction < 0.25);
  const isHappy =
    customer.state === "leaving_happy" || customer.state === "served";
  const t = time;
  const bob = Math.sin(t / 2500 + customer.tableIndex * 1.7) * 1.2;

  // Drop shadow
  dropShadow(ctx, 0, 20, 16, 5, 0.15);

  ctx.save();
  ctx.translate(0, bob);

  // ── BODY (chubby egg, kawaii) ──
  ctx.beginPath();
  ctx.ellipse(0, 0, 15, 18, 0, 0, Math.PI * 2);
  const bodyG = ctx.createRadialGradient(-5, -6, 1, 0, 0, 20);
  bodyG.addColorStop(0, bodyA);
  bodyG.addColorStop(0.6, bodyB);
  bodyG.addColorStop(1, "#00000020");
  ctx.fillStyle = bodyG;
  ctx.fill();
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1.8;
  ctx.stroke();
  // Body specular
  ctx.beginPath();
  ctx.ellipse(-6, -8, 5, 3.5, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.30)";
  ctx.fill();
  // Accent stripe / decoration
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0.4, Math.PI - 0.4);
  ctx.stroke();
  ctx.restore();

  // ── HEAD (big round kawaii) ──
  const headR = 19;
  const headY = -30;

  // Hair back (big fluffy blob)
  ctx.beginPath();
  ctx.arc(0, headY, headR * 1.12, 0, Math.PI * 2);
  const hairBG = ctx.createRadialGradient(
    -headR * 0.2,
    headY - headR * 0.3,
    headR * 0.1,
    0,
    headY,
    headR * 1.12,
  );
  hairBG.addColorStop(0, hairA);
  hairBG.addColorStop(1, hairB);
  ctx.fillStyle = hairBG;
  ctx.fill();
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Face sphere
  ctx.beginPath();
  ctx.arc(0, headY, headR, 0, Math.PI * 2);
  const faceG = ctx.createRadialGradient(
    -headR * 0.25,
    headY - headR * 0.25,
    headR * 0.04,
    0,
    headY,
    headR,
  );
  faceG.addColorStop(0, "#FFE8D4");
  faceG.addColorStop(0.55, "#FFD0BC");
  faceG.addColorStop(1, "#E8A88A");
  ctx.fillStyle = faceG;
  ctx.fill();
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 1.8;
  ctx.stroke();
  // Face specular
  ctx.beginPath();
  ctx.ellipse(
    -headR * 0.22,
    headY - headR * 0.22,
    headR * 0.17,
    headR * 0.11,
    -0.4,
    0,
    Math.PI * 2,
  );
  ctx.fillStyle = "rgba(255,255,255,0.40)";
  ctx.fill();

  // Hair fringe
  ctx.beginPath();
  ctx.ellipse(
    0,
    headY - headR * 0.56,
    headR * 1.08,
    headR * 0.55,
    0,
    Math.PI,
    0,
  );
  const fringeG = vGrad(
    ctx,
    headY - headR * 1.08,
    headY - headR * 0.1,
    hairA,
    hairB,
  );
  ctx.fillStyle = fringeG;
  ctx.fill();
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ── ACCESSORY (per variant) ──
  switch (customer.tableIndex % 5) {
    case 0: // Round glasses
      [-5.5, 5.5].forEach((ex) => {
        ctx.beginPath();
        ctx.arc(ex, headY - 1, 4.5, 0, Math.PI * 2);
        ctx.strokeStyle = "#4A3010";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
      ctx.beginPath();
      ctx.moveTo(-1, headY - 1);
      ctx.lineTo(1, headY - 1);
      ctx.stroke();
      break;
    case 1: // Cute ear studs (tiny circles)
      [-headR * 1.05, headR * 1.05].forEach((ex) => {
        ctx.beginPath();
        ctx.arc(ex, headY + 3, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = "#FFD700";
        ctx.fill();
        ctx.strokeStyle = "#B8860B";
        ctx.lineWidth = 1;
        ctx.stroke();
      });
      break;
    case 2: // Bow on top
      ctx.save();
      ctx.translate(headR * 0.25, headY - headR * 0.95);
      [
        [-1, -0.1],
        [1, 0.1],
      ].forEach(([s, rot]) => {
        ctx.save();
        ctx.translate(s * 4, 0);
        ctx.rotate(rot);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(s * 6, -3);
        ctx.lineTo(s * 6, 3);
        ctx.closePath();
        ctx.fillStyle = "#FF80C0";
        ctx.fill();
        ctx.restore();
      });
      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fillStyle = "#FF40A0";
      ctx.fill();
      ctx.restore();
      break;
    case 3: // Baseball cap (accent color)
      ctx.beginPath();
      ctx.moveTo(-headR * 0.9, headY - headR * 0.55);
      ctx.lineTo(headR * 0.9, headY - headR * 0.55);
      ctx.quadraticCurveTo(
        headR * 0.9,
        headY - headR * 1.08,
        0,
        headY - headR * 1.1,
      );
      ctx.quadraticCurveTo(
        -headR * 0.9,
        headY - headR * 1.08,
        -headR * 0.9,
        headY - headR * 0.55,
      );
      ctx.closePath();
      ctx.fillStyle = accent;
      ctx.fill();
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-headR * 0.9, headY - headR * 0.55);
      ctx.lineTo(-headR * 1.2, headY - headR * 0.5);
      ctx.lineWidth = 3;
      ctx.strokeStyle = accent;
      ctx.stroke();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = "#333";
      ctx.stroke();
      break;
    case 4: // Star hairpin
      ctx.save();
      ctx.translate(headR * 0.7, headY - headR * 0.78);
      ctx.font = "10px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("⭐", 0, 0);
      ctx.restore();
      break;
  }

  // ── EYES ──
  const eyeW = headR * 0.26,
    eyeH = headR * 0.22,
    eyeYPos = headY - 1;

  if (isHappy) {
    // Crescent happy eyes (^_^)
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    [-6, 6].forEach((ex) => {
      ctx.beginPath();
      ctx.arc(ex, eyeYPos + 1, eyeW * 0.8, Math.PI + 0.3, -0.3);
      ctx.stroke();
    });
    ctx.lineCap = "butt";
  } else if (isAngry) {
    // Angry eyes (red pupils + V brows)
    [-6, 6].forEach((ex) => {
      ctx.beginPath();
      ctx.ellipse(ex, eyeYPos, eyeW * 0.8, eyeH * 0.8, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#FFF";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ex, eyeYPos, eyeH * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = "#CC2020";
      ctx.fill();
    });
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-10, eyeYPos - 7);
    ctx.lineTo(-4, eyeYPos - 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(10, eyeYPos - 7);
    ctx.lineTo(4, eyeYPos - 4);
    ctx.stroke();
    ctx.lineCap = "butt";
  } else {
    // Normal kawaii eyes
    [-6, 6].forEach((ex) => kEye(ctx, ex, eyeYPos, eyeW, eyeH, irisColor));
  }

  // ── CHEEKS ──
  kCheek(ctx, -headR * 0.54, eyeYPos + headR * 0.22, headR * 0.18);
  kCheek(ctx, headR * 0.54, eyeYPos + headR * 0.22, headR * 0.18);

  // ── MOUTH ──
  if (isHappy) {
    ctx.beginPath();
    ctx.arc(0, headY + 9, 5.5, 0.1, Math.PI - 0.1);
    ctx.fillStyle = "#C06060";
    ctx.fill();
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // Tongue peeking
    ctx.beginPath();
    ctx.arc(0, headY + 13, 3, 0, Math.PI);
    ctx.fillStyle = "#FF8888";
    ctx.fill();
  } else if (isAngry) {
    ctx.strokeStyle = "#C03030";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-5, headY + 9);
    ctx.lineTo(-2, headY + 7);
    ctx.lineTo(2, headY + 9);
    ctx.lineTo(5, headY + 7);
    ctx.stroke();
    ctx.lineCap = "butt";
    // Steam puffs
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "#AAA";
    const steam = Math.sin(t / 400) * 3;
    [
      [-7, -50, 3],
      [0, -56, 4],
      [6, -52, 3],
    ].forEach(([sx, sy, sr]) => {
      ctx.beginPath();
      ctx.arc(sx, headY + sy + 40 + steam, sr, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  } else {
    ctx.strokeStyle = "#A05050";
    ctx.lineWidth = 1.8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, headY + 6, 4, 0.25, Math.PI - 0.25);
    ctx.stroke();
    ctx.lineCap = "butt";
  }

  ctx.restore(); // end bob
}

export function drawSpeechBubble(ctx, customer, time) {
  if (customer.state !== "seated" && customer.state !== "served") return;
  const bw = 130,
    bh = 68;
  const bx = -bw / 2,
    by = 58;

  // Couleur de bordure : bleue/verte si géré par assistant
  const isHandled = customer.handledByAssistant && customer.state === "seated";
  const borderColor = isHandled ? "#2196F3" : COL.BUBBLE_BORDER;

  // Shadow
  ctx.save();
  ctx.shadowBlur = isHandled ? 14 : 12;
  ctx.shadowColor = isHandled ? "rgba(33,150,243,0.4)" : COL.BUBBLE_SHADOW;
  const bubGrad = vGrad(
    ctx,
    by,
    by + bh,
    COL.BUBBLE_TOP,
    isHandled ? "#E8F4FD" : COL.BUBBLE_BOTTOM,
  );
  roundRect(ctx, bx, by, bw, bh, 10);
  ctx.fillStyle = bubGrad;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = isHandled ? 2.5 : 2;
  ctx.stroke();
  ctx.restore();

  // Pointer arrow — bezier tail (rounder feel)
  ctx.beginPath();
  ctx.moveTo(bx + bw / 2 - 9, by);
  ctx.quadraticCurveTo(bx + bw / 2, by - 12, bx + bw / 2 + 9, by);
  ctx.closePath();
  ctx.fillStyle = COL.BUBBLE_TOP;
  ctx.fill();
  ctx.strokeStyle = COL.BUBBLE_BORDER;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Cover seam
  ctx.fillStyle = COL.BUBBLE_TOP;
  ctx.fillRect(bx + bw / 2 - 8, by, 16, 3);

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
  roundRect(ctx, bx + 8, by + 5, bw - 16, 18, 9);
  ctx.fillStyle = recipe.color + "40"; // 25% alpha
  ctx.fill();
  ctx.font = "bold 11px Arial";
  ctx.fillStyle = "#555";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(recipe.label, bx + bw / 2, by + 14);

  // Patience timer — cerⶄle flottant juste au-dessus de la bulle
  const pf = customer.patienceFraction;
  const timerR = 12;
  const timerX = 0; // centré sur le client
  const timerY = by - timerR - 8; // au-dessus de la flèche
  const tColor = pf > 0.5 ? "#2ECC71" : pf > 0.25 ? "#F39C12" : "#E74C3C";

  // Anneau de fond
  ctx.beginPath();
  ctx.arc(timerX, timerY, timerR, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(0,0,0,0.12)";
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(timerX, timerY, timerR, 0, Math.PI * 2);
  ctx.strokeStyle = "#EEE";
  ctx.lineWidth = 4.5;
  ctx.stroke();

  // Arc rempli
  ctx.beginPath();
  ctx.arc(
    timerX,
    timerY,
    timerR,
    -Math.PI / 2,
    -Math.PI / 2 + Math.PI * 2 * pf,
  );
  ctx.strokeStyle = tColor;
  ctx.lineWidth = 4.5;
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.lineCap = "butt";

  // Pulsation quand le temps est presque écoulé
  if (pf < 0.25 && !isHandled) {
    const pulse = Math.abs(Math.sin(time / 250));
    ctx.save();
    ctx.globalAlpha = pulse * 0.4;
    ctx.beginPath();
    ctx.arc(timerX, timerY, timerR + 3, 0, Math.PI * 2);
    ctx.strokeStyle = "#E74C3C";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  // Badge "assistant en route" si géré par un assistant G2S
  if (isHandled) {
    const badgeW = 68,
      badgeH = 14;
    const badgeX = bx + (bw - badgeW) / 2;
    const badgeY = by + bh - badgeH - 4;
    roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 7);
    ctx.fillStyle = "rgba(33,150,243,0.85)";
    ctx.fill();
    ctx.strokeStyle = "#90CAF9";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.font = "bold 8px Arial";
    ctx.fillStyle = "#FFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🛡️ G2S en route", badgeX + badgeW / 2, badgeY + badgeH / 2);
  }

  // Icônes de recette
  const icons = recipe.toppings.map((t) => ITEM_ICONS[t] || "?");
  const iconSize = 28;
  const totalW = icons.length * (iconSize + 6) - 6;
  const startX = bx + (bw - totalW) / 2;
  icons.forEach((icon, i) => {
    const ix = startX + i * (iconSize + 6) + iconSize / 2;
    const iy = by + bh / 2 + 6;
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
}
