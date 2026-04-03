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

// ── Kawaii helpers ─────────────────────────────────────────────────────────────
function kawaiiEye(ctx, cx, cy, rw, rh, irisColor = "#3A7FCC") {
  const sg = ctx.createRadialGradient(
    cx - rw * 0.2,
    cy - rh * 0.2,
    1,
    cx,
    cy,
    Math.max(rw, rh),
  );
  sg.addColorStop(0, "#FFFFFF");
  sg.addColorStop(1, "#EDF0F5");
  ctx.beginPath();
  ctx.ellipse(cx, cy, rw, rh, 0, 0, Math.PI * 2);
  ctx.fillStyle = sg;
  ctx.fill();
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1.8;
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
  ctx.arc(cx + rw * 0.2, cy + rh * 0.12, rh * 0.11, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.fill();
}

function kawaiiCheek(ctx, cx, cy, r) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, "rgba(255,90,100,0.52)");
  g.addColorStop(1, "rgba(255,90,100,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, r * 0.65, 0, 0, Math.PI * 2);
  ctx.fill();
}

// ══════════════════════════════════════════════════════════════════════════════
//  PLAYER (Cerise) — Kawaii chibi cartoon 3D
// ══════════════════════════════════════════════════════════════════════════════
export function drawPlayer(ctx, player, counterY, counterH, time) {
  const px = player.x,
    py = player.y,
    sz = player.size;
  const t = time;
  const dir = player.direction;

  ctx.save();

  // Drop shadow
  dropShadow(ctx, px, py + sz * 0.54, sz * 0.36, sz * 0.08, 0.22);

  // Idle sway
  const idle = player.isMoving ? 0 : Math.sin(t / 1900) * 0.006;
  if (idle) {
    ctx.translate(px, py);
    ctx.rotate(idle);
    ctx.translate(-px, -py);
  }
  const walk = player.isMoving
    ? Math.sin((player.walkFrame / 4) * Math.PI * 2)
    : 0;

  // ── LEGS ──
  const legW = sz * 0.14,
    legH = sz * 0.22,
    legY = py + sz * 0.28;
  [
    [px - sz * 0.13, walk * sz * 0.06],
    [px + sz * 0.01, -walk * sz * 0.06],
  ].forEach(([lx, off]) => {
    roundRect(ctx, lx, legY + off, legW, legH, legW * 0.48);
    const lg = ctx.createLinearGradient(
      lx,
      legY + off,
      lx + legW,
      legY + off + legH,
    );
    lg.addColorStop(0, "#FEE0D6");
    lg.addColorStop(1, "#E8A898");
    ctx.fillStyle = lg;
    ctx.fill();
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
  // Round shoes
  [
    [px - sz * 0.06, legY + legH + walk * sz * 0.06],
    [px + sz * 0.08, legY + legH - walk * sz * 0.06],
  ].forEach(([sx3, sy3]) => {
    ctx.beginPath();
    ctx.ellipse(
      sx3,
      sy3 + sz * 0.058,
      legW * 0.88,
      sz * 0.072,
      0,
      0,
      Math.PI * 2,
    );
    const sg = ctx.createRadialGradient(
      sx3,
      sy3 + sz * 0.02,
      1,
      sx3,
      sy3 + sz * 0.06,
      legW * 0.88,
    );
    sg.addColorStop(0, "#EE2424");
    sg.addColorStop(1, "#820808");
    ctx.fillStyle = sg;
    ctx.fill();
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(
      sx3 - legW * 0.25,
      sy3 + sz * 0.018,
      legW * 0.22,
      sz * 0.022,
      -0.35,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = "rgba(255,255,255,0.42)";
    ctx.fill();
  });

  // ── SKIRT (poofy kawaii) ──
  const skirtTopY = py + sz * 0.16,
    skirtBotY = py + sz * 0.46,
    sMidY = (skirtTopY + skirtBotY) / 2;
  ctx.beginPath();
  ctx.moveTo(px - sz * 0.23, skirtTopY);
  ctx.bezierCurveTo(
    px - sz * 0.4,
    sMidY,
    px - sz * 0.38,
    sMidY + sz * 0.04,
    px - sz * 0.32,
    skirtBotY,
  );
  ctx.lineTo(px + sz * 0.32, skirtBotY);
  ctx.bezierCurveTo(
    px + sz * 0.38,
    sMidY + sz * 0.04,
    px + sz * 0.4,
    sMidY,
    px + sz * 0.23,
    skirtTopY,
  );
  ctx.closePath();
  const skG = ctx.createLinearGradient(px - sz * 0.38, 0, px + sz * 0.38, 0);
  skG.addColorStop(0, "#F0F0FF");
  skG.addColorStop(0.5, "#FFFFFF");
  skG.addColorStop(1, "#E8E8F8");
  ctx.fillStyle = skG;
  ctx.fill();
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = "#4CAF50";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(px - sz * 0.3, skirtBotY - 5);
  ctx.lineTo(px + sz * 0.3, skirtBotY - 5);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineCap = "butt";
  ctx.beginPath();
  ctx.ellipse(px - sz * 0.1, sMidY, sz * 0.04, sz * 0.09, 0.15, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.40)";
  ctx.fill();

  // ── BODY (chubby egg) ──
  const bRx = sz * 0.23,
    bRy = sz * 0.21,
    bCX = px,
    bCY = py - sz * 0.04;
  ctx.beginPath();
  ctx.ellipse(bCX, bCY, bRx, bRy, 0, 0, Math.PI * 2);
  const bodyG = ctx.createRadialGradient(
    bCX - bRx * 0.28,
    bCY - bRy * 0.28,
    bRy * 0.05,
    bCX,
    bCY,
    Math.max(bRx, bRy),
  );
  bodyG.addColorStop(0, "#FFFFFF");
  bodyG.addColorStop(0.5, "#F5F5FF");
  bodyG.addColorStop(1, "#D8D8E8");
  ctx.fillStyle = bodyG;
  ctx.fill();
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(
    bCX - bRx * 0.22,
    bCY - bRy * 0.24,
    bRx * 0.18,
    bRy * 0.12,
    -0.4,
    0,
    Math.PI * 2,
  );
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fill();
  [
    [-sz * 0.12, sz * 0.01],
    [sz * 0.09, sz * 0.0],
    [-sz * 0.05, sz * 0.12],
    [sz * 0.13, sz * 0.12],
    [-sz * 0.13, sz * 0.25],
    [sz * 0.03, sz * 0.24],
  ].forEach(([dx, dy]) => {
    ctx.beginPath();
    ctx.arc(bCX + dx, bCY - bRy + dy + sz * 0.02, sz * 0.04, 0, Math.PI * 2);
    ctx.fillStyle = "#4CAF50";
    ctx.fill();
    ctx.strokeStyle = "#2E8B2E";
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // ── ARMS (chubby stubs) ──
  const armW = sz * 0.12,
    armH = sz * 0.24,
    armY = bCY - bRy * 0.6;
  const armGL = vGrad(ctx, armY, armY + armH, "#FFFFFF", "#E0E0EE");
  ctx.save();
  ctx.translate(px - bRx - armW * 0.2, armY + walk * sz * 0.03);
  ctx.rotate(-0.28 + walk * 0.22);
  roundRect(ctx, -armW / 2, 0, armW, armH, armW * 0.48);
  ctx.fillStyle = armGL;
  ctx.fill();
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.translate(px + bRx + armW * 0.2, armY - walk * sz * 0.03);
  ctx.rotate(0.28 - walk * 0.22);
  roundRect(ctx, -armW / 2, 0, armW, armH, armW * 0.48);
  ctx.fillStyle = armGL;
  ctx.fill();
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // ── HEAD (big kawaii chibi) ──
  const headR = sz * 0.25;
  const headCX = px,
    headCY = bCY - bRy - headR * 0.55;

  // Neck
  roundRect(
    ctx,
    px - sz * 0.07,
    headCY + headR * 0.74,
    sz * 0.14,
    sz * 0.12,
    4,
  );
  ctx.fillStyle = "#FDE8DF";
  ctx.fill();

  // Hair back layer (fluffy blonde)
  ctx.beginPath();
  ctx.arc(headCX, headCY, headR * 1.1, 0, Math.PI * 2);
  const hairBG = ctx.createRadialGradient(
    headCX - headR * 0.2,
    headCY - headR * 0.4,
    headR * 0.1,
    headCX,
    headCY,
    headR * 1.1,
  );
  hairBG.addColorStop(0, "#FFDD28");
  hairBG.addColorStop(1, "#C89010");
  ctx.fillStyle = hairBG;
  ctx.fill();
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Side curls
  [-1, 1].forEach((side) => {
    ctx.save();
    ctx.translate(headCX + side * headR * 0.98, headCY + headR * 0.2);
    ctx.rotate(side * 0.12);
    ctx.beginPath();
    ctx.ellipse(0, 0, headR * 0.25, headR * 0.42, 0, 0, Math.PI * 2);
    const curlG = vGrad(ctx, -headR * 0.42, headR * 0.42, "#FFDD28", "#C08808");
    ctx.fillStyle = curlG;
    ctx.fill();
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  });

  // Face sphere
  ctx.beginPath();
  ctx.arc(headCX, headCY, headR, 0, Math.PI * 2);
  const faceG = ctx.createRadialGradient(
    headCX - headR * 0.25,
    headCY - headR * 0.25,
    headR * 0.04,
    headCX,
    headCY,
    headR,
  );
  faceG.addColorStop(0, "#FFE8D4");
  faceG.addColorStop(0.55, "#FFD0BC");
  faceG.addColorStop(1, "#E8A88A");
  ctx.fillStyle = faceG;
  ctx.fill();
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(
    headCX - headR * 0.2,
    headCY - headR * 0.22,
    headR * 0.18,
    headR * 0.13,
    -0.4,
    0,
    Math.PI * 2,
  );
  ctx.fillStyle = "rgba(255,255,255,0.42)";
  ctx.fill();

  // Hair fringe (front)
  ctx.beginPath();
  ctx.ellipse(
    headCX,
    headCY - headR * 0.58,
    headR * 1.06,
    headR * 0.6,
    0,
    Math.PI,
    0,
  );
  const fringeG = vGrad(
    ctx,
    headCY - headR * 1.08,
    headCY - headR * 0.1,
    "#FFDE22",
    "#C89010",
  );
  ctx.fillStyle = fringeG;
  ctx.fill();
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(
    headCX - headR * 0.22,
    headCY - headR * 0.84,
    headR * 0.28,
    headR * 0.1,
    -0.5,
    0,
    Math.PI * 2,
  );
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fill();

  // ── CHEF HAT ──
  const hatW = headR * 1.88,
    hatBandH = headR * 0.28,
    hatHatH = headR * 0.75;
  const hatX = headCX - hatW / 2,
    hatBandY = headCY - headR * 0.84,
    hatTopY = hatBandY - hatHatH;
  // Puff
  ctx.beginPath();
  ctx.ellipse(
    headCX,
    hatTopY + 6,
    hatW * 0.44,
    headR * 0.34,
    0,
    0,
    Math.PI * 2,
  );
  const puffG = ctx.createRadialGradient(
    headCX - hatW * 0.1,
    hatTopY - 2,
    2,
    headCX,
    hatTopY + 6,
    hatW * 0.44,
  );
  puffG.addColorStop(0, "#FFFFFF");
  puffG.addColorStop(1, "#DDDDDD");
  ctx.fillStyle = puffG;
  ctx.fill();
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Hat body
  roundRect(
    ctx,
    hatX + hatW * 0.06,
    hatTopY + headR * 0.28,
    hatW * 0.88,
    hatHatH - headR * 0.12,
    5,
  );
  ctx.fillStyle = vGrad(ctx, hatTopY, hatBandY, "#FFFFFF", "#EEEEEE");
  ctx.fill();
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // G2S red band
  const bandG = ctx.createLinearGradient(hatX, 0, hatX + hatW, 0);
  bandG.addColorStop(0, "#CC0010");
  bandG.addColorStop(0.5, "#FF2030");
  bandG.addColorStop(1, "#BB0010");
  roundRect(ctx, hatX, hatBandY, hatW, hatBandH, 3);
  ctx.fillStyle = bandG;
  ctx.fill();
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.20)";
  ctx.fillRect(hatX + 4, hatBandY + 2, hatW - 8, hatBandH * 0.4);

  // ── EYES ──
  const eyeW = headR * 0.28,
    eyeH = headR * 0.24,
    eyeY = headCY + headR * 0.06;
  const eyeOffX = dir * headR * 0.1;
  [headCX + eyeOffX - headR * 0.26, headCX + eyeOffX + headR * 0.14].forEach(
    (ex) => kawaiiEye(ctx, ex, eyeY, eyeW, eyeH, "#3A7FCC"),
  );

  // ── CHEEKS & NOSE & SMILE ──
  kawaiiCheek(ctx, headCX - headR * 0.48, eyeY + headR * 0.22, headR * 0.22);
  kawaiiCheek(ctx, headCX + headR * 0.48, eyeY + headR * 0.22, headR * 0.22);
  ctx.beginPath();
  ctx.arc(
    headCX + eyeOffX * 0.3,
    eyeY + headR * 0.18,
    headR * 0.052,
    0,
    Math.PI * 2,
  );
  ctx.fillStyle = "rgba(180,100,80,0.28)";
  ctx.fill();
  ctx.strokeStyle = "#C06060";
  ctx.lineWidth = headR * 0.1;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(
    headCX + eyeOffX * 0.2,
    eyeY + headR * 0.34,
    headR * 0.22,
    0.25,
    Math.PI - 0.25,
  );
  ctx.stroke();
  ctx.lineCap = "butt";

  // Items held
  const bob = Math.sin(t / 800) * 2;
  drawHeldItems(ctx, player, px, headCY - headR - sz * 0.36 + bob, sz);

  ctx.restore();
}

// ══════════════════════════════════════════════════════════════════════════════
//  AUTO PLAYER (Assurance G2S) — Kawaii chibi, rouge G2S
// ══════════════════════════════════════════════════════════════════════════════
export function drawAutoPlayer(ctx, ap, counterY, time) {
  const px = ap.x,
    py = ap.y,
    sz = ap.size;
  const t = time;
  ctx.save();

  // Red G2S pulsing halo
  const pulse = 0.55 + 0.45 * Math.abs(Math.sin(t / 350));
  ctx.save();
  ctx.globalAlpha = 0.28 * pulse;
  ctx.beginPath();
  ctx.ellipse(px, py + sz * 0.54, sz * 0.68, sz * 0.13, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#E30613";
  ctx.fill();
  ctx.restore();

  dropShadow(ctx, px, py + sz * 0.54, sz * 0.34, sz * 0.08, 0.2);
  const walk = ap.isMoving ? Math.sin((ap.walkFrame / 4) * Math.PI * 2) : 0;

  // LEGS
  const legW2 = sz * 0.14,
    legH2 = sz * 0.22,
    legY2 = py + sz * 0.28;
  [
    [px - sz * 0.13, walk * sz * 0.06],
    [px + sz * 0.01, -walk * sz * 0.06],
  ].forEach(([lx, off]) => {
    roundRect(ctx, lx, legY2 + off, legW2, legH2, legW2 * 0.48);
    const lg = vGrad(
      ctx,
      legY2 + off,
      legY2 + off + legH2,
      "#FEE0D6",
      "#E8A898",
    );
    ctx.fillStyle = lg;
    ctx.fill();
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
  [
    [px - sz * 0.06, legY2 + legH2 + walk * sz * 0.06],
    [px + sz * 0.08, legY2 + legH2 - walk * sz * 0.06],
  ].forEach(([sx3, sy3]) => {
    ctx.beginPath();
    ctx.ellipse(
      sx3,
      sy3 + sz * 0.058,
      legW2 * 0.88,
      sz * 0.072,
      0,
      0,
      Math.PI * 2,
    );
    const sg = ctx.createRadialGradient(
      sx3,
      sy3,
      1,
      sx3,
      sy3 + sz * 0.06,
      legW2 * 0.88,
    );
    sg.addColorStop(0, "#EE2424");
    sg.addColorStop(1, "#820808");
    ctx.fillStyle = sg;
    ctx.fill();
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  // SKIRT (red G2S, poofy)
  const sk2TopY = py + sz * 0.16,
    sk2BotY = py + sz * 0.46,
    sk2MidY = (sk2TopY + sk2BotY) / 2;
  ctx.beginPath();
  ctx.moveTo(px - sz * 0.23, sk2TopY);
  ctx.bezierCurveTo(
    px - sz * 0.4,
    sk2MidY,
    px - sz * 0.38,
    sk2MidY + sz * 0.04,
    px - sz * 0.32,
    sk2BotY,
  );
  ctx.lineTo(px + sz * 0.32, sk2BotY);
  ctx.bezierCurveTo(
    px + sz * 0.38,
    sk2MidY + sz * 0.04,
    px + sz * 0.4,
    sk2MidY,
    px + sz * 0.23,
    sk2TopY,
  );
  ctx.closePath();
  const skG2 = vGrad(ctx, sk2TopY, sk2BotY, "#FF3030", "#BB0010");
  ctx.fillStyle = skG2;
  ctx.fill();
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 2;
  ctx.stroke();

  // BODY (chubby egg, white + G2S)
  const bRx2 = sz * 0.23,
    bRy2 = sz * 0.21,
    bCX2 = px,
    bCY2 = py - sz * 0.04;
  ctx.beginPath();
  ctx.ellipse(bCX2, bCY2, bRx2, bRy2, 0, 0, Math.PI * 2);
  const bG2 = ctx.createRadialGradient(
    bCX2 - bRx2 * 0.28,
    bCY2 - bRy2 * 0.28,
    bRy2 * 0.05,
    bCX2,
    bCY2,
    Math.max(bRx2, bRy2),
  );
  bG2.addColorStop(0, "#FFFFFF");
  bG2.addColorStop(1, "#F0F0F8");
  ctx.fillStyle = bG2;
  ctx.fill();
  ctx.strokeStyle = "#E30613";
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.save();
  ctx.font = `bold ${sz * 0.18}px Arial`;
  ctx.fillStyle = "#E30613";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowBlur = 4;
  ctx.shadowColor = "rgba(227,6,19,0.4)";
  ctx.fillText("G2S", bCX2, bCY2 + sz * 0.02);
  ctx.restore();

  // ARMS
  const armW2 = sz * 0.12,
    armH2 = sz * 0.24,
    armY2 = bCY2 - bRy2 * 0.6;
  const armGL2 = vGrad(ctx, armY2, armY2 + armH2, "#FFFFFF", "#E0E0EE");
  ctx.save();
  ctx.translate(px - bRx2 - armW2 * 0.2, armY2 + walk * sz * 0.03);
  ctx.rotate(-0.28 + walk * 0.22);
  roundRect(ctx, -armW2 / 2, 0, armW2, armH2, armW2 * 0.48);
  ctx.fillStyle = armGL2;
  ctx.fill();
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.translate(px + bRx2 + armW2 * 0.2, armY2 - walk * sz * 0.03);
  ctx.rotate(0.28 - walk * 0.22);
  roundRect(ctx, -armW2 / 2, 0, armW2, armH2, armW2 * 0.48);
  ctx.fillStyle = armGL2;
  ctx.fill();
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // HEAD
  const hR2 = sz * 0.25,
    hX2 = px,
    hY2 = bCY2 - bRy2 - hR2 * 0.55;
  roundRect(ctx, px - sz * 0.07, hY2 + hR2 * 0.74, sz * 0.14, sz * 0.12, 4);
  ctx.fillStyle = "#FDE8DF";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(hX2, hY2, hR2 * 1.1, 0, Math.PI * 2);
  const hBG2 = ctx.createRadialGradient(
    hX2 - hR2 * 0.2,
    hY2 - hR2 * 0.4,
    hR2 * 0.1,
    hX2,
    hY2,
    hR2 * 1.1,
  );
  hBG2.addColorStop(0, "#FFDD28");
  hBG2.addColorStop(1, "#C89010");
  ctx.fillStyle = hBG2;
  ctx.fill();
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  [-1, 1].forEach((side) => {
    ctx.save();
    ctx.translate(hX2 + side * hR2 * 0.98, hY2 + hR2 * 0.2);
    ctx.rotate(side * 0.12);
    ctx.beginPath();
    ctx.ellipse(0, 0, hR2 * 0.25, hR2 * 0.42, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#FFDD28";
    ctx.fill();
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  });
  ctx.beginPath();
  ctx.arc(hX2, hY2, hR2, 0, Math.PI * 2);
  const fG2 = ctx.createRadialGradient(
    hX2 - hR2 * 0.25,
    hY2 - hR2 * 0.25,
    hR2 * 0.04,
    hX2,
    hY2,
    hR2,
  );
  fG2.addColorStop(0, "#FFE8D4");
  fG2.addColorStop(0.55, "#FFD0BC");
  fG2.addColorStop(1, "#E8A88A");
  ctx.fillStyle = fG2;
  ctx.fill();
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(
    hX2 - hR2 * 0.2,
    hY2 - hR2 * 0.22,
    hR2 * 0.18,
    hR2 * 0.13,
    -0.4,
    0,
    Math.PI * 2,
  );
  ctx.fillStyle = "rgba(255,255,255,0.42)";
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(hX2, hY2 - hR2 * 0.58, hR2 * 1.06, hR2 * 0.6, 0, Math.PI, 0);
  const frG2 = vGrad(
    ctx,
    hY2 - hR2 * 1.08,
    hY2 - hR2 * 0.1,
    "#FFDE22",
    "#C89010",
  );
  ctx.fillStyle = frG2;
  ctx.fill();
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // G2S cap
  const capW = hR2 * 1.85,
    capBandH = hR2 * 0.25,
    capX = hX2 - capW / 2,
    capBandY = hY2 - hR2 * 0.82;
  const capBG = ctx.createLinearGradient(capX, 0, capX + capW, 0);
  capBG.addColorStop(0, "#CC0010");
  capBG.addColorStop(0.5, "#FF1E30");
  capBG.addColorStop(1, "#BB0010");
  ctx.beginPath();
  ctx.moveTo(capX, capBandY + capBandH);
  ctx.lineTo(capX + capW, capBandY + capBandH);
  ctx.lineTo(hX2 + hR2 * 1.08, capBandY);
  ctx.lineTo(capX + capW * 0.6, capBandY);
  ctx.ellipse(hX2, capBandY, hR2 * 0.6, hR2 * 0.28, 0, 0, Math.PI, true);
  ctx.lineTo(capX, capBandY);
  ctx.closePath();
  ctx.fillStyle = capBG;
  ctx.fill();
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(capX + 4, capBandY + 2, capW - 8, capBandH * 0.4);
  ctx.save();
  ctx.font = `bold ${hR2 * 0.28}px Arial`;
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("G2S", hX2, capBandY + capBandH * 0.55);
  ctx.restore();

  // Eyes, cheeks, nose, smile
  const eW2 = hR2 * 0.28,
    eH2 = hR2 * 0.24,
    eY2b = hY2 + hR2 * 0.06;
  const eOff2 = (ap.direction || 1) * hR2 * 0.1;
  [hX2 + eOff2 - hR2 * 0.26, hX2 + eOff2 + hR2 * 0.14].forEach((ex) =>
    kawaiiEye(ctx, ex, eY2b, eW2, eH2, "#3A7FCC"),
  );
  kawaiiCheek(ctx, hX2 - hR2 * 0.48, eY2b + hR2 * 0.22, hR2 * 0.22);
  kawaiiCheek(ctx, hX2 + hR2 * 0.48, eY2b + hR2 * 0.22, hR2 * 0.22);
  ctx.beginPath();
  ctx.arc(hX2 + eOff2 * 0.3, eY2b + hR2 * 0.18, hR2 * 0.052, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(180,100,80,0.28)";
  ctx.fill();
  ctx.strokeStyle = "#C06060";
  ctx.lineWidth = hR2 * 0.1;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(
    hX2 + eOff2 * 0.2,
    eY2b + hR2 * 0.34,
    hR2 * 0.22,
    0.25,
    Math.PI - 0.25,
  );
  ctx.stroke();
  ctx.lineCap = "butt";

  drawHeldItems(ctx, ap, px, hY2 - hR2 - sz * 0.36, sz);
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
  ctx.save();
  ctx.shadowBlur = 8;
  ctx.shadowColor = "rgba(227,6,19,0.3)";
  roundRect(ctx, x, y, bw, bh, 10);
  ctx.fillStyle = "#2D2B45";
  ctx.fill();
  ctx.restore();
  roundRect(ctx, x, y, bw, bh, 10);
  ctx.strokeStyle = "#E30613";
  ctx.lineWidth = 2;
  ctx.stroke();
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
