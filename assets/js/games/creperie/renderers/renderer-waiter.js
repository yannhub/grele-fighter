// renderer-waiter.js — Rendu du serveur NPC automatique (style Overcooked)

import { COL, dropShadow, roundRect, vGrad } from "./renderer-colors.js";

export function drawWaiter(ctx, waiter, W, H, counterY, counterH, time) {
  const px = waiter.x,
    py = waiter.y;
  const sz = 75;
  const t = time;
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
    ctx.arc(hX + eOff + hR * ex - 1, hY + hR * 0.02, hR * 0.03, 0, Math.PI * 2);
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
