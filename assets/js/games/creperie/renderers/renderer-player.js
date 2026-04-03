// renderer-player.js — Rendu du joueur (Cerise), de l'auto-joueur et des items tenus

import { IT, ITEM_COLORS, ITEM_ICONS } from "../creperie-constants.js";
import {
  COL,
  dropShadow,
  lightenColor,
  roundRect,
  vGrad,
} from "./renderer-colors.js";
import { drawAssembledCrepe } from "./renderer-crepe.js";

// ══════════════════════════════════════════════════════════════════════════════
//  PLAYER (Cerise) — Cel-shading outlines, gradients, enriched visuals
// ══════════════════════════════════════════════════════════════════════════════
export function drawPlayer(ctx, player, counterY, counterH, time) {
  const px = player.x,
    py = player.y,
    sz = player.size;
  const t = time;

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
  const bandGrad = ctx.createLinearGradient(hatX, 0, hatX + hatW, 0);
  bandGrad.addColorStop(0, "#E30613");
  bandGrad.addColorStop(1, "#C00510");
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
  ctx.ellipse(headCX, hatHatY + 2, hatW * 0.4, headR * 0.3, 0, 0, Math.PI * 2);
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

  // Eyes
  const eyeOffX = player.direction * headR * 0.12;
  const eyeY = headCY + headR * 0.05;
  [-0.22, 0.18].forEach((ex) => {
    const eX = headCX + eyeOffX + headR * ex;
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.ellipse(eX, eyeY, headR * 0.18, headR * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "#4A8AC0";
    ctx.beginPath();
    ctx.arc(eX, eyeY + 0.5, headR * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1A1A1A";
    ctx.beginPath();
    ctx.arc(eX, eyeY + 0.5, headR * 0.055, 0, Math.PI * 2);
    ctx.fill();
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

  // Smile
  ctx.strokeStyle = "#C05050";
  ctx.lineWidth = headR * 0.12;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(headCX, eyeY + headR * 0.25, headR * 0.3, 0.22, Math.PI - 0.22);
  ctx.stroke();
  ctx.lineCap = "butt";

  // Items held above head (with bobbing animation)
  const bob = Math.sin(t / 800) * 2;
  drawHeldItems(ctx, player, px, headCY - headR - sz * 0.35 + bob, sz);

  ctx.restore();
}

// ══════════════════════════════════════════════════════════════════════════════
//  AUTO PLAYER (Assurance G2S)
// ══════════════════════════════════════════════════════════════════════════════
export function drawAutoPlayer(ctx, ap, counterY, time) {
  const px = ap.x,
    py = ap.y,
    sz = ap.size;
  const t = time;

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
  drawHeldItems(ctx, ap, px, hY - hR - sz * 0.25, sz);

  ctx.restore();
}

// ══════════════════════════════════════════════════════════════════════════════
//  BONUS INDICATOR
// ══════════════════════════════════════════════════════════════════════════════
export function drawBonusIndicator(ctx, W, H, bonusTimer, time) {
  const x = 12,
    y = H - 74,
    bw = 190,
    bh = 42;
  const frac = Math.max(0, bonusTimer / 15);
  const pulse = 0.85 + 0.15 * Math.abs(Math.sin(time / 300));

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
//  HELD ITEMS
// ══════════════════════════════════════════════════════════════════════════════
export function drawHeldItems(ctx, player, cx, topY, sz) {
  if (player.hands.length === 0) return;

  const itemSize = sz * 0.4;
  const spacing = itemSize + 5;
  const totalW = player.hands.length * spacing - 5;
  const startX = cx - totalW / 2;

  player.hands.forEach((item, i) => {
    const ix = startX + i * spacing;
    const iy = topY;

    ctx.save();
    ctx.shadowBlur = 6;
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    roundRect(ctx, ix - itemSize / 2, iy - itemSize / 2, itemSize, itemSize, 6);
    const itemBaseColor = ITEM_COLORS[item.type] || "#DDD";
    const itemGrad = ctx.createRadialGradient(
      ix,
      iy - 2,
      2,
      ix,
      iy,
      itemSize * 0.5,
    );
    itemGrad.addColorStop(0, lightenColor(itemBaseColor, 30));
    itemGrad.addColorStop(1, itemBaseColor);
    ctx.fillStyle = itemGrad;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = 2;
    ctx.stroke();

    if (item.type === IT.ASSEMBLED_CREPE) {
      // Beautiful drawn crepe with toppings
      drawAssembledCrepe(
        ctx,
        ix,
        iy,
        itemSize * 0.44,
        item.toppings ?? [],
        itemSize * 0.42,
      );
    } else {
      ctx.font = `${itemSize * 0.62}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(ITEM_ICONS[item.type] || "?", ix, iy);
    }
    ctx.restore();
  });
}
