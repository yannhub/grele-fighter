// renderer-waiter.js — Rendu du serveur NPC — style kawaii cartoon 3D

import {
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
  ctx.lineWidth = 1.6;
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
  ctx.fillStyle = "rgba(255,255,255,0.97)";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + rw * 0.18, cy + rh * 0.1, rh * 0.11, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.fill();
}

function kCheek(ctx, cx, cy, r) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, "rgba(255,90,100,0.50)");
  g.addColorStop(1, "rgba(255,90,100,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, r * 0.65, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function drawWaiter(ctx, waiter, W, H, counterY, counterH, time) {
  const px = waiter.x,
    py = waiter.y;
  const sz = 75;
  const walk = waiter.isMoving
    ? Math.sin((waiter.walkFrame / 4) * Math.PI * 2)
    : 0;
  const dir = waiter.direction || 1;

  ctx.save();

  // Drop shadow
  dropShadow(ctx, px, py + sz * 0.54, sz * 0.32, sz * 0.07, 0.18);

  // ── LEGS (chubby, dark trousers) ──
  const legW = sz * 0.14,
    legH = sz * 0.22,
    legY = py + sz * 0.28;
  [
    [px - sz * 0.12, walk * sz * 0.05],
    [px + sz * 0.01, -walk * sz * 0.05],
  ].forEach(([lx, off]) => {
    roundRect(ctx, lx, legY + off, legW, legH, legW * 0.45);
    const lg = ctx.createRadialGradient(
      lx + legW / 2,
      legY + off + legH / 2,
      legH * 0.05,
      lx + legW / 2,
      legY + off + legH / 2,
      legH * 0.6,
    );
    lg.addColorStop(0, "#3A3A4A");
    lg.addColorStop(1, "#1A1A28");
    ctx.fillStyle = lg;
    ctx.fill();
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
  // Round shoes
  [
    [px - sz * 0.05, legY + legH + walk * sz * 0.05],
    [px + sz * 0.08, legY + legH - walk * sz * 0.05],
  ].forEach(([sx2, sy2]) => {
    ctx.beginPath();
    ctx.ellipse(
      sx2,
      sy2 + sz * 0.055,
      legW * 0.88,
      sz * 0.07,
      0,
      0,
      Math.PI * 2,
    );
    const sg = ctx.createRadialGradient(
      sx2,
      sy2,
      1,
      sx2,
      sy2 + sz * 0.05,
      legW * 0.88,
    );
    sg.addColorStop(0, "#3A3A3A");
    sg.addColorStop(1, "#111111");
    ctx.fillStyle = sg;
    ctx.fill();
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(
      sx2 - legW * 0.2,
      sy2 + sz * 0.015,
      legW * 0.2,
      sz * 0.018,
      -0.3,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fill();
  });

  // ── LOWER BODY (dark trousers, poofy) ──
  const skY = py + sz * 0.16,
    skBY = py + sz * 0.44,
    skMY = (skY + skBY) / 2;
  ctx.beginPath();
  ctx.moveTo(px - sz * 0.2, skY);
  ctx.bezierCurveTo(
    px - sz * 0.32,
    skMY,
    px - sz * 0.3,
    skMY + sz * 0.04,
    px - sz * 0.26,
    skBY,
  );
  ctx.lineTo(px + sz * 0.26, skBY);
  ctx.bezierCurveTo(
    px + sz * 0.3,
    skMY + sz * 0.04,
    px + sz * 0.32,
    skMY,
    px + sz * 0.2,
    skY,
  );
  ctx.closePath();
  const trG = vGrad(ctx, skY, skBY, "#2E2E3E", "#18182A");
  ctx.fillStyle = trG;
  ctx.fill();
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 2;
  ctx.stroke();

  // ── BODY (white shirt + dark waistcoat + white apron) ──
  const bRx = sz * 0.21,
    bRy = sz * 0.2,
    bCX = px,
    bCY = py - sz * 0.02;
  ctx.beginPath();
  ctx.ellipse(bCX, bCY, bRx, bRy, 0, 0, Math.PI * 2);
  const shG = ctx.createRadialGradient(
    bCX - bRx * 0.28,
    bCY - bRy * 0.28,
    bRy * 0.05,
    bCX,
    bCY,
    Math.max(bRx, bRy),
  );
  shG.addColorStop(0, "#2E2E3A");
  shG.addColorStop(1, "#1A1A28");
  ctx.fillStyle = shG;
  ctx.fill();
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 2;
  ctx.stroke();
  // Apron (white oval)
  ctx.beginPath();
  ctx.ellipse(bCX, bCY + bRy * 0.15, bRx * 0.65, bRy * 0.72, 0, 0, Math.PI * 2);
  const apG = ctx.createRadialGradient(
    bCX - bRx * 0.1,
    bCY - bRy * 0.1,
    bRy * 0.05,
    bCX,
    bCY,
    bRy * 0.72,
  );
  apG.addColorStop(0, "#FFFFFF");
  apG.addColorStop(1, "#E8E8E8");
  ctx.fillStyle = apG;
  ctx.fill();
  ctx.strokeStyle = "#DDD";
  ctx.lineWidth = 1;
  ctx.stroke();
  // Body specular
  ctx.beginPath();
  ctx.ellipse(
    bCX - bRx * 0.22,
    bCY - bRy * 0.22,
    bRx * 0.16,
    bRy * 0.11,
    -0.4,
    0,
    Math.PI * 2,
  );
  ctx.fillStyle = "rgba(255,255,255,0.20)";
  ctx.fill();
  // Bow tie (red, cute)
  const btY = bCY - bRy * 0.55;
  [
    [-1, -0.12],
    [1, 0.12],
  ].forEach(([side, rot]) => {
    ctx.save();
    ctx.translate(bCX + side * 5, btY);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(side * 7, -4);
    ctx.lineTo(side * 7, 4);
    ctx.closePath();
    ctx.fillStyle = "#E30613";
    ctx.fill();
    ctx.strokeStyle = "#900";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  });
  ctx.beginPath();
  ctx.arc(bCX, btY, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = "#CC0010";
  ctx.fill();

  // ── ARMS (chubby) ──
  const armW = sz * 0.11,
    armH = sz * 0.22,
    armY = bCY - bRy * 0.6;
  // Left arm (raised when delivering)
  ctx.save();
  ctx.translate(px - bRx - armW * 0.15, armY + walk * sz * 0.04);
  const leftRot = waiter.state === "delivering" ? -0.85 : -0.25 + walk * 0.18;
  ctx.rotate(leftRot);
  roundRect(ctx, -armW / 2, 0, armW, armH, armW * 0.45);
  const armG = vGrad(ctx, 0, armH, "#FDE8DF", "#E8A898");
  ctx.fillStyle = armG;
  ctx.fill();
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
  // Right arm
  ctx.save();
  ctx.translate(px + bRx + armW * 0.15, armY - walk * sz * 0.04);
  ctx.rotate(0.25 - walk * 0.18);
  roundRect(ctx, -armW / 2, 0, armW, armH, armW * 0.45);
  ctx.fillStyle = armG;
  ctx.fill();
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // ── HEAD (big kawaii chibi) ──
  const hR = sz * 0.24,
    hX = px,
    hY = bCY - bRy - hR * 0.55;

  // Neck
  roundRect(ctx, px - sz * 0.065, hY + hR * 0.74, sz * 0.13, sz * 0.11, 4);
  ctx.fillStyle = "#FDE8DF";
  ctx.fill();

  // Hair (dark brown, short, rounded)
  ctx.beginPath();
  ctx.arc(hX, hY, hR * 1.06, 0, Math.PI * 2);
  const hairG = ctx.createRadialGradient(
    hX - hR * 0.2,
    hY - hR * 0.4,
    hR * 0.1,
    hX,
    hY,
    hR * 1.06,
  );
  hairG.addColorStop(0, "#5A3010");
  hairG.addColorStop(1, "#2A1208");
  ctx.fillStyle = hairG;
  ctx.fill();
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Hair sheen
  ctx.beginPath();
  ctx.ellipse(
    hX - hR * 0.18,
    hY - hR * 0.72,
    hR * 0.2,
    hR * 0.08,
    -0.5,
    0,
    Math.PI * 2,
  );
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.fill();

  // Face
  ctx.beginPath();
  ctx.arc(hX, hY, hR, 0, Math.PI * 2);
  const faceG = ctx.createRadialGradient(
    hX - hR * 0.25,
    hY - hR * 0.25,
    hR * 0.04,
    hX,
    hY,
    hR,
  );
  faceG.addColorStop(0, "#FFE8D4");
  faceG.addColorStop(0.55, "#FFD0BC");
  faceG.addColorStop(1, "#E8A88A");
  ctx.fillStyle = faceG;
  ctx.fill();
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 2;
  ctx.stroke();
  // Face specular
  ctx.beginPath();
  ctx.ellipse(
    hX - hR * 0.2,
    hY - hR * 0.22,
    hR * 0.17,
    hR * 0.12,
    -0.4,
    0,
    Math.PI * 2,
  );
  ctx.fillStyle = "rgba(255,255,255,0.40)";
  ctx.fill();

  // Hair fringe (short, just covers top edge)
  ctx.beginPath();
  ctx.ellipse(hX, hY - hR * 0.62, hR * 1.04, hR * 0.44, 0, Math.PI, 0);
  const fringeG = vGrad(
    ctx,
    hY - hR * 1.06,
    hY - hR * 0.3,
    "#5A3010",
    "#2A1208",
  );
  ctx.fillStyle = fringeG;
  ctx.fill();
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Fringe sheen
  ctx.beginPath();
  ctx.ellipse(
    hX - hR * 0.2,
    hY - hR * 0.8,
    hR * 0.24,
    hR * 0.08,
    -0.5,
    0,
    Math.PI * 2,
  );
  ctx.fillStyle = "rgba(255,255,255,0.20)";
  ctx.fill();

  // ── EYES ──
  const eyeW = hR * 0.27,
    eyeH = hR * 0.23,
    eyeY = hY + hR * 0.06;
  const eyeOff = dir * hR * 0.1;
  [hX + eyeOff - hR * 0.26, hX + eyeOff + hR * 0.14].forEach((ex) =>
    kEye(ctx, ex, eyeY, eyeW, eyeH, "#4A7FCC"),
  );

  // ── CHEEKS & NOSE & SMILE ──
  kCheek(ctx, hX - hR * 0.46, eyeY + hR * 0.22, hR * 0.2);
  kCheek(ctx, hX + hR * 0.46, eyeY + hR * 0.22, hR * 0.2);
  ctx.beginPath();
  ctx.arc(hX + eyeOff * 0.3, eyeY + hR * 0.18, hR * 0.048, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(180,100,80,0.26)";
  ctx.fill();
  ctx.strokeStyle = "#C06060";
  ctx.lineWidth = hR * 0.09;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(hX + eyeOff * 0.2, eyeY + hR * 0.33, hR * 0.2, 0.25, Math.PI - 0.25);
  ctx.stroke();
  ctx.lineCap = "butt";

  // ── TRAY (when delivering) ──
  if (waiter.state === "delivering" || waiter.state === "picking") {
    const tArmEndX = px - bRx - armW * 0.15 + Math.cos(-0.85) * armH * 0.85;
    const tArmEndY =
      bCY - bRy * 0.6 + walk * sz * 0.04 + Math.sin(-0.85) * armH * 0.85;
    const trayX = tArmEndX - sz * 0.05;
    const trayY = tArmEndY - sz * 0.06;
    ctx.beginPath();
    ctx.ellipse(trayX, trayY, sz * 0.2, sz * 0.055, 0, 0, Math.PI * 2);
    const trayG = ctx.createRadialGradient(
      trayX,
      trayY - 2,
      1,
      trayX,
      trayY,
      sz * 0.2,
    );
    trayG.addColorStop(0, "#E8E8F0");
    trayG.addColorStop(1, "#9A9AAA");
    ctx.fillStyle = trayG;
    ctx.fill();
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Tray rim highlight
    ctx.beginPath();
    ctx.ellipse(
      trayX - sz * 0.06,
      trayY - sz * 0.02,
      sz * 0.08,
      sz * 0.018,
      -0.2,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fill();
    if (waiter.heldCrepe) {
      ctx.font = `${sz * 0.22}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🥞", trayX, trayY - 6);
    }
  }

  ctx.restore();
}
