// renderer-background.js — Rendu du fond : mur, sol restaurant, sol cuisine, lampes, plantes

import { COL, vGrad } from "./renderer-colors.js";

export function drawBackground(
  ctx,
  W,
  H,
  counterY,
  counterH,
  bottomCounterY,
  bottomCounterH,
  time,
) {
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
      ctx.fillStyle = colIdx === 0 ? COL.FLOOR_TILE_A : COL.FLOOR_TILE_B;
      ctx.fillRect(tx, ty, tileS, tileS);
      ctx.fillStyle = COL.FLOOR_TILE_HIGHLIGHT;
      ctx.fillRect(tx, ty, tileS, 1.5);
      ctx.fillRect(tx, ty, 1.5, tileS);
      ctx.fillStyle = COL.FLOOR_TILE_SHADOW;
      ctx.fillRect(tx, ty + tileS - 1.5, tileS, 1.5);
      ctx.fillRect(tx + tileS - 1.5, ty, 1.5, tileS);
      ctx.fillStyle = COL.FLOOR_JOINT;
      ctx.fillRect(tx + tileS - 0.5, ty, 1, tileS);
      ctx.fillRect(tx, ty + tileS - 0.5, tileS, 1);
    }
  }

  // ── Plantes décoratives aux extrémités ──
  drawPlant(ctx, 28, rH - plH - 6);
  drawPlant(ctx, W - 28, rH - plH - 6);

  // ── Sol cuisine (entre les deux comptoirs + sous le comptoir bas) ──
  const kitchenTop = counterY + counterH;
  const kTile = 38;
  for (let tx = 0; tx < W; tx += kTile) {
    for (let ty = kitchenTop; ty < H; ty += kTile) {
      const colIdx = (Math.floor(tx / kTile) + Math.floor(ty / kTile)) % 2;
      ctx.fillStyle = colIdx === 0 ? COL.FLOOR_KITCHEN_A : COL.FLOOR_KITCHEN_B;
      ctx.fillRect(tx, ty, kTile, kTile);
      ctx.fillStyle = COL.FLOOR_KITCHEN_HIGHLIGHT;
      ctx.fillRect(tx, ty, kTile, 1);
      ctx.fillRect(tx, ty, 1, kTile);
      ctx.fillStyle = COL.FLOOR_KITCHEN_SHADOW;
      ctx.fillRect(tx, ty + kTile - 1, kTile, 1);
      ctx.fillRect(tx + kTile - 1, ty, 1, kTile);
    }
  }

  // ── Lampes suspendues ──
  drawLamps(ctx, W, rH, time);
}

export function drawPlant(ctx, cx, baseY) {
  // ── Ground shadow ──
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.beginPath();
  ctx.ellipse(cx, baseY + 3, 15, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#000";
  ctx.fill();
  ctx.restore();

  // ── Pot body — gradient trapezoid with bezier sides ──
  const potGrd = ctx.createLinearGradient(cx - 13, 0, cx + 13, 0);
  potGrd.addColorStop(0, "#904A20");
  potGrd.addColorStop(0.35, "#D08848");
  potGrd.addColorStop(1, "#904A20");
  ctx.beginPath();
  ctx.moveTo(cx - 10, baseY);
  ctx.bezierCurveTo(cx - 11, baseY + 5, cx - 9, baseY + 14, cx - 7, baseY + 15);
  ctx.lineTo(cx + 7, baseY + 15);
  ctx.bezierCurveTo(cx + 9, baseY + 14, cx + 11, baseY + 5, cx + 10, baseY);
  ctx.closePath();
  ctx.fillStyle = potGrd;
  ctx.fill();
  ctx.strokeStyle = "#7A4A28";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Pot highlight strip
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#FFF";
  ctx.fillRect(cx - 8, baseY + 3, 3, 10);
  ctx.restore();

  // ── Pot rim (ellipse + inner highlight) ──
  ctx.beginPath();
  ctx.ellipse(cx, baseY, 11, 3.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#CC7840";
  ctx.fill();
  ctx.strokeStyle = "#7A4A28";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.ellipse(cx, baseY - 0.5, 7, 1.5, 0, Math.PI + 0.3, -0.3);
  ctx.strokeStyle = "#FFF";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // ── Soil ──
  ctx.beginPath();
  ctx.ellipse(cx, baseY - 0.5, 8, 2.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#5A3416";
  ctx.fill();

  // ── Organic bezier leaves (gradient petal shapes) ──
  const leaf = (ox, oy, angle, size, c1, c2) => {
    ctx.save();
    ctx.translate(cx + ox, baseY + oy);
    ctx.rotate(angle);
    const lg = ctx.createLinearGradient(0, 0, 0, -size);
    lg.addColorStop(0, c2);
    lg.addColorStop(1, c1);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(
      -size * 0.38,
      -size * 0.42,
      -size * 0.32,
      -size * 0.88,
      0,
      -size,
    );
    ctx.bezierCurveTo(
      size * 0.32,
      -size * 0.88,
      size * 0.38,
      -size * 0.42,
      0,
      0,
    );
    ctx.fillStyle = lg;
    ctx.fill();
    ctx.strokeStyle = "#1E5A1E";
    ctx.lineWidth = 0.8;
    ctx.stroke();
    // Midrib
    ctx.globalAlpha = 0.28;
    ctx.beginPath();
    ctx.moveTo(0, -1);
    ctx.lineTo(0, -size * 0.82);
    ctx.strokeStyle = "#1B4D1B";
    ctx.lineWidth = 0.7;
    ctx.stroke();
    ctx.restore();
  };
  leaf(-8, -16, -0.45, 17, "#6EC96E", "#2E7D32");
  leaf(7, -14, 0.55, 15, "#81C784", "#388E3C");
  leaf(0, -22, -0.05, 20, "#57B857", "#2E7D32");
  leaf(-4, -19, -0.9, 13, "#9DCE9D", "#43A047");
  leaf(10, -17, 1.0, 14, "#6BC46B", "#388E3C");
}

export function drawLamps(ctx, W, rH, time) {
  const lampY = rH * 0.11;
  const lampPositions = [0.12, 0.32, 0.5, 0.68, 0.88];
  const t = time;

  lampPositions.forEach((xr) => {
    const lx = W * xr;
    const bulbPulse = 0.9 + 0.1 * Math.sin(t / 1500 + xr * 10);

    // ── Suspension wire ──
    const wireGrad = ctx.createLinearGradient(0, 0, 0, lampY - 10);
    wireGrad.addColorStop(0, "#8B7355");
    wireGrad.addColorStop(1, "#6B5335");
    ctx.strokeStyle = wireGrad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lx, 0);
    ctx.lineTo(lx, lampY - 14);
    ctx.stroke();

    // ── Warm light cone below lamp (volumetric feel) ──
    ctx.save();
    const coneH = rH * 0.36;
    const coneGrad = ctx.createLinearGradient(
      lx,
      lampY + 12,
      lx,
      lampY + 12 + coneH,
    );
    coneGrad.addColorStop(0, "rgba(255,215,120,0.12)");
    coneGrad.addColorStop(0.5, "rgba(255,200,100,0.04)");
    coneGrad.addColorStop(1, "rgba(255,200,100,0)");
    ctx.fillStyle = coneGrad;
    ctx.beginPath();
    ctx.moveTo(lx - 9, lampY + 12);
    ctx.lineTo(lx - coneH * 0.7, lampY + 12 + coneH);
    ctx.lineTo(lx + coneH * 0.7, lampY + 12 + coneH);
    ctx.lineTo(lx + 9, lampY + 12);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // ── Wide ambient halo ──
    ctx.save();
    const haloR = 95;
    const haloGrad = ctx.createRadialGradient(
      lx,
      lampY + 14,
      4,
      lx,
      lampY + 14,
      haloR,
    );
    haloGrad.addColorStop(0, "rgba(255,220,130,0.13)");
    haloGrad.addColorStop(1, "rgba(255,220,130,0)");
    ctx.fillStyle = haloGrad;
    ctx.fillRect(lx - haloR, lampY - haloR + 14, haloR * 2, haloR * 2);
    ctx.restore();

    // ── Lampshade — bell shape (bezier, more organic than flat trapezoid) ──
    ctx.beginPath();
    ctx.moveTo(lx - 25, lampY - 14);
    ctx.lineTo(lx + 25, lampY - 14);
    ctx.bezierCurveTo(
      lx + 25,
      lampY - 6,
      lx + 18,
      lampY + 6,
      lx + 15,
      lampY + 11,
    );
    ctx.lineTo(lx - 15, lampY + 11);
    ctx.bezierCurveTo(
      lx - 18,
      lampY + 6,
      lx - 25,
      lampY - 6,
      lx - 25,
      lampY - 14,
    );
    ctx.closePath();
    const shadeGrad = ctx.createLinearGradient(
      lx - 24,
      lampY - 14,
      lx + 24,
      lampY - 14,
    );
    shadeGrad.addColorStop(0, "#5A3E18");
    shadeGrad.addColorStop(0.5, "#C09030");
    shadeGrad.addColorStop(1, "#5A3E18");
    ctx.fillStyle = shadeGrad;
    ctx.fill();
    ctx.strokeStyle = "#3A2810";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Inner warm glow on shade
    ctx.save();
    ctx.globalAlpha = 0.18 * bulbPulse;
    ctx.fillStyle = "#FFD080";
    ctx.fill();
    ctx.restore();
    // Top rim highlight
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(lx - 23, lampY - 14, 46, 2.5);

    // ── Bulb with animated glow ──
    ctx.save();
    ctx.shadowBlur = 20 * bulbPulse;
    ctx.shadowColor = "rgba(255,220,100,0.7)";
    ctx.beginPath();
    ctx.arc(lx, lampY + 2, 5, 0, Math.PI * 2);
    const bulbGrad = ctx.createRadialGradient(
      lx - 1,
      lampY,
      1,
      lx,
      lampY + 2,
      5,
    );
    bulbGrad.addColorStop(0, "#FFFEF8");
    bulbGrad.addColorStop(1, "#FFE060");
    ctx.fillStyle = bulbGrad;
    ctx.fill();
    ctx.restore();
  });
}
