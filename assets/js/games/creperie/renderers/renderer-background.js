// renderer-background.js — Rendu du fond : mur, sol restaurant, sol cuisine, lampes, plantes

import { COL, vGrad } from "./renderer-colors.js";

export function drawBackground(ctx, W, H, counterY, counterH, time) {
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

  // ── Sol cuisine (damier 3D avec bevel) ──
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

export function drawLamps(ctx, W, rH, time) {
  const lampY = rH * 0.11;
  const lampPositions = [0.12, 0.32, 0.5, 0.68, 0.88];
  const t = time;

  lampPositions.forEach((xr) => {
    const lx = W * xr;
    // Fil
    const wireGrad = ctx.createLinearGradient(0, 0, 0, lampY - 10);
    wireGrad.addColorStop(0, "#8B7355");
    wireGrad.addColorStop(1, "#6B5335");
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
