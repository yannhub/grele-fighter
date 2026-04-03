// renderer-customers.js — Rendu des clients et de leurs bulles de commande

import { ITEM_ICONS, TABLE_POSITIONS } from "../creperie-constants.js";
import { COL, dropShadow, roundRect, vGrad } from "./renderer-colors.js";

export function drawCustomers(ctx, W, counterY, customers, time) {
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
  const isAngry =
    customer.state === "leaving_angry" ||
    (customer.state === "seated" && customer.patienceFraction < 0.25);
  const isHappy =
    customer.state === "leaving_happy" || customer.state === "served";
  const t = time;

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
  ctx.ellipse(0, headY - headR * 0.5, headR * 1.1, headR * 0.62, 0, Math.PI, 0);
  ctx.fillStyle = hairColor;
  ctx.fill();
  ctx.strokeStyle = COL.OUTLINE;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ── Eyes ──
  if (isHappy) {
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    [-5, 5].forEach((ex) => {
      ctx.beginPath();
      ctx.arc(ex, headY - 1, 3.5, Math.PI + 0.3, -0.3);
      ctx.stroke();
    });
  } else if (isAngry) {
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

export function drawSpeechBubble(ctx, customer, time) {
  if (customer.state !== "seated" && customer.state !== "served") return;
  const bw = 130,
    bh = 68;
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
  if (pf < 0.25) {
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
