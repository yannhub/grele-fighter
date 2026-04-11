// renderer-stations.js — Rendu de toutes les stations de cuisine

import { ITEM_ICONS, ST } from "../creperie-constants.js";
import { BILIG_STATE } from "../creperie-stations.js";
import {
  COL,
  circleHighlight,
  glowCircle,
  hGrad,
  lerpColor,
  roundRect,
  vGrad,
} from "./renderer-colors.js";
import { drawAssembledCrepe } from "./renderer-crepe.js";

export function drawStations(
  ctx,
  stations,
  counterY,
  counterH,
  time,
  currentStation = null,
) {
  stations.forEach((s) =>
    drawStation(ctx, s, counterY, counterH, time, s === currentStation),
  );
}

// Dessine les biligs assistants + les stations du comptoir bas
export function drawBottomStations(
  ctx,
  assistanceBiligs,
  bottomStations,
  bottomCounterY,
  bottomCounterH,
  time,
  currentStation = null,
  assistants = [],
  hasActiveFire = false,
) {
  // Biligs assistants (même rendu que les biligs du joueur)
  assistanceBiligs.forEach((s) => {
    const isActive = s === currentStation;
    drawBilig(ctx, s, s.x, s.y, s.w, s.h, time);
    // Label avec numéro d'assistant
    _drawStationLabel(ctx, s, time, isActive);
    if (isActive) _drawActiveHalo(ctx, s);
  });
  // Stations spéciales du bas
  bottomStations.forEach((s) => {
    const isActive = s === currentStation;
    if (s.type === ST.CALL_G2S) {
      drawCallG2S(ctx, s, s.x, s.y, s.w, s.h, time, hasActiveFire);
    } else if (s.type === ST.DONATION) {
      drawDonation(ctx, s, s.x, s.y, s.w, s.h, time);
    }
    _drawStationLabel(ctx, s, time, isActive);
    if (isActive) _drawActiveHalo(ctx, s);
  });
}

export function drawStation(
  ctx,
  s,
  counterY,
  counterH,
  time,
  isActive = false,
) {
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
      drawBilig(ctx, s, sx, sy, sw, sh, time);
      break;
    case ST.DELIVERY:
      drawDeliveryStation(ctx, s, sx, sy, sw, sh, time);
      break;
    case ST.BATTER:
      drawBatterStation(ctx, s, sx, sy, sw, sh);
      break;
    default:
      drawIngredientStation(ctx, s, sx, sy, sw, sh);
  }

  // Station label badge
  _drawStationLabel(ctx, s, time, isActive);

  // ── Halo de surbrillance ──────────────────────────────────────────────────
  if (isActive) _drawActiveHalo(ctx, s);
}

function _drawStationLabel(ctx, s, time, isActive) {
  const { w: sw, h: sh, x: sx, y: sy } = s;
  ctx.save();
  const labelFont = `bold ${Math.max(11, sw * 0.2)}px Arial`;
  ctx.font = labelFont;
  const labelText = s.label || "";
  const textW = ctx.measureText(labelText).width;
  const badgeW = textW + 16;
  const badgeH = 18;
  const badgeX = sx + sw / 2 - badgeW / 2;
  const badgeY = sy + sh + 4;
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 9);
  ctx.fillStyle = COL.LABEL_BG;
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(labelText, sx + sw / 2 + 1, badgeY + badgeH / 2 + 1);
  ctx.fillStyle = COL.TEXT_LABEL;
  ctx.fillText(labelText, sx + sw / 2, badgeY + badgeH / 2);
  ctx.restore();
}

function _drawActiveHalo(ctx, s) {
  const { w: sw, h: sh, x: sx, y: sy } = s;
  const time = Date.now();
  const pulse = 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(time / 380));
  const gP = 0.5 + 0.5 * Math.sin(time / 190 + Math.PI / 3);
  const m = 6;
  const hx = sx + m,
    hy = sy + m;
  const hw = sw - m * 2,
    hh = sh - m * 2;
  const rr = 7;
  ctx.save();
  ctx.strokeStyle = `rgba(255,215,30,${0.13 * pulse})`;
  ctx.lineWidth = 14;
  roundRect(ctx, hx, hy, hw, hh, rr);
  ctx.stroke();
  ctx.strokeStyle = `rgba(255,230,50,${0.3 * pulse})`;
  ctx.lineWidth = 7;
  roundRect(ctx, hx, hy, hw, hh, rr);
  ctx.stroke();
  ctx.shadowBlur = 10;
  ctx.shadowColor = `rgba(255,215,20,${0.95 * pulse})`;
  ctx.strokeStyle = `rgba(255,250,130,${0.95 * pulse})`;
  ctx.lineWidth = 1.8;
  roundRect(ctx, hx, hy, hw, hh, rr);
  ctx.stroke();
  ctx.shadowBlur = 0;
  const fillG = ctx.createLinearGradient(hx, hy, hx, hy + hh);
  fillG.addColorStop(0, `rgba(255,255,180,${0.22 * pulse})`);
  fillG.addColorStop(0.4, `rgba(255,235,70,${0.08 * pulse})`);
  fillG.addColorStop(1, `rgba(255,200,0,0)`);
  ctx.fillStyle = fillG;
  roundRect(ctx, hx, hy, hw, hh, rr);
  ctx.fill();
  const gs = Math.min(hw, hh) * 0.2;
  ctx.strokeStyle = `rgba(255,255,210,${0.9 * gP * pulse})`;
  ctx.lineWidth = 1.8;
  ctx.lineCap = "round";
  ctx.shadowBlur = 6;
  ctx.shadowColor = `rgba(255,255,160,${0.8 * gP})`;
  [
    { cx: hx, cy: hy, dx: 1, dy: 1 },
    { cx: hx + hw, cy: hy, dx: -1, dy: 1 },
    { cx: hx, cy: hy + hh, dx: 1, dy: -1 },
    { cx: hx + hw, cy: hy + hh, dx: -1, dy: -1 },
  ].forEach(({ cx: cx_, cy: cy_, dx, dy }) => {
    ctx.beginPath();
    ctx.moveTo(cx_ + dx * gs, cy_);
    ctx.lineTo(cx_, cy_);
    ctx.lineTo(cx_, cy_ + dy * gs);
    ctx.stroke();
  });
  ctx.restore();
}

export function drawBilig(ctx, s, sx, sy, sw, sh, time) {
  const cx = sx + sw / 2,
    cy = sy + sh * 0.48;
  const r = Math.min(sw, sh) * 0.4;
  const t = time;

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

  // Cooking surface — outer ring (metal brush effect + specular arc)
  ctx.beginPath();
  ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
  const ringGrad = ctx.createRadialGradient(cx, cy, r - 2, cx, cy, r + 4);
  ringGrad.addColorStop(0, COL.BILIG_METAL_B);
  ringGrad.addColorStop(0.5, "#BBB");
  ringGrad.addColorStop(1, COL.BILIG_METAL_C);
  ctx.fillStyle = ringGrad;
  ctx.fill();
  ctx.strokeStyle = COL.OUTLINE;
  ctx.lineWidth = 2;
  ctx.stroke();
  circleHighlight(ctx, cx, cy, r + 4, 0.3); // metallic rim light

  // Inner cooking surface (radial gradient for convex effect)
  let surfA, surfB;
  if (s.biligState === BILIG_STATE.EMPTY) {
    surfA = "#999";
    surfB = "#666";
  } else if (s.biligState === BILIG_STATE.COOKING) {
    const p = s.cookProgress;
    surfA = lerpColor("#999", "#E8B030", p);
    surfB = lerpColor("#666", "#C08010", p);
  } else if (s.biligState === BILIG_STATE.BURNING) {
    surfA = "#FF3300";
    surfB = "#880000";
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
  circleHighlight(ctx, cx, cy, r, 0.16); // surface sheen

  // Concentric grooves
  ctx.strokeStyle = "rgba(0,0,0,0.10)";
  ctx.lineWidth = 0.8;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * (i / 4), 0, Math.PI * 2);
    ctx.stroke();
  }

  // 🔥 BURNING state — flammes animées
  if (s.biligState === BILIG_STATE.BURNING) {
    _drawFlames(ctx, cx, cy, r, t);
  }

  // Crêpe on bilig (READY state)
  if (s.biligState === BILIG_STATE.READY) {
    drawAssembledCrepe(
      ctx,
      cx,
      cy,
      r - 7,
      s.biligToppings,
      Math.max(16, sw * 0.3),
    );

    // Warm radial background glow + animated ring
    const glow = Math.sin(t / 300) * 0.35 + 0.65;
    glowCircle(ctx, cx, cy, r * 1.9, COL.BILIG_GLOW, glow * 0.28);
    ctx.save();
    ctx.shadowBlur = 14 * glow;
    ctx.shadowColor = `rgba(255,210,60,${glow * 0.55})`;
    ctx.globalAlpha = glow * 0.55;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 7, 0, Math.PI * 2);
    ctx.strokeStyle = COL.BILIG_GLOW;
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.globalAlpha = glow * 0.25;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 15, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // Ready check badge
    ctx.save();
    ctx.font = `bold ${Math.max(10, sw * 0.2)}px Arial`;
    ctx.fillStyle = COL.BILIG_GLOW;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowBlur = 10 * glow;
    ctx.shadowColor = "rgba(255,200,60,0.75)";
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

export function drawBatterStation(ctx, s, sx, sy, sw, sh) {
  const cx = sx + sw / 2;
  const bowlW = sw - 6;
  const bowlH = sh * 0.53;
  const bowlY = sy + sh * 0.26;
  const innerRX = bowlW / 2 - 5;
  const innerRY = bowlH * 0.36;
  const innerCY = bowlY + bowlH * 0.5;

  // ── Corps extérieur du bol (céramique bleue) ────────────────────────────────
  ctx.beginPath();
  ctx.moveTo(sx + 3, bowlY);
  ctx.quadraticCurveTo(sx + 1, bowlY + bowlH, cx, bowlY + bowlH + 4);
  ctx.quadraticCurveTo(sx + sw - 1, bowlY + bowlH, sx + sw - 3, bowlY);
  ctx.lineTo(sx + 3, bowlY);
  ctx.closePath();
  const bowlG = vGrad(ctx, bowlY, bowlY + bowlH + 4, "#5B9BD5", "#2C5F90");
  ctx.fillStyle = bowlG;
  ctx.fill();
  ctx.strokeStyle = "#1A4070";
  ctx.lineWidth = 2;
  ctx.stroke();

  // ── Pâte à crêpe visible à l'intérieur du bol ──────────────────────────────
  // On clip sur l'ellipse intérieure pour que la pâte reste dans le bol
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, innerCY, innerRX, innerRY, 0, 0, Math.PI * 2);
  ctx.clip();

  // Fond sombre (fond du bol)
  ctx.fillStyle = "#3B7AB0";
  ctx.fillRect(cx - innerRX, innerCY - innerRY, innerRX * 2, innerRY * 2);

  // Remplissage pâte (beige doré, couvre les 80% inférieurs)
  const batterTop = innerCY - innerRY * 0.62;
  const batterG = vGrad(
    ctx,
    batterTop,
    innerCY + innerRY,
    "#F5E5A0",
    "#C8A43A",
  );
  ctx.fillStyle = batterG;
  ctx.fillRect(cx - innerRX, batterTop, innerRX * 2, innerRY * 2);

  // Surface de la pâte : ellipse brillante simulant le niveau liquide
  ctx.beginPath();
  ctx.ellipse(
    cx,
    batterTop + 3,
    innerRX * 0.92,
    innerRY * 0.18,
    0,
    0,
    Math.PI * 2,
  );
  const surfG = ctx.createRadialGradient(
    cx - innerRX * 0.2,
    batterTop,
    1,
    cx,
    batterTop + 2,
    innerRX * 0.9,
  );
  surfG.addColorStop(0, "#FFF8CC");
  surfG.addColorStop(0.6, "#EDD060");
  surfG.addColorStop(1, "#C8A43A");
  ctx.fillStyle = surfG;
  ctx.fill();

  // Petite brillance sur la surface (reflet)
  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.ellipse(
    cx - innerRX * 0.28,
    batterTop + 1,
    innerRX * 0.22,
    innerRY * 0.07,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fillStyle = "#FFFADC";
  ctx.fill();
  ctx.restore();

  ctx.restore(); // end clip

  // ── Reflet latéral sur le corps bleu ───────────────────────────────────────
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#FFF";
  ctx.fillRect(sx + 5, bowlY + 6, 3, bowlH * 0.45);
  ctx.restore();

  // ── Rebord supérieur ────────────────────────────────────────────────────────
  ctx.beginPath();
  ctx.ellipse(cx, bowlY, bowlW / 2, 5, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#70AEE0";
  ctx.fill();
  ctx.strokeStyle = "#1A4070";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.beginPath();
  ctx.ellipse(cx, bowlY - 1, bowlW / 2 - 4, 2.5, 0, Math.PI + 0.3, -0.3);
  ctx.strokeStyle = "#FFF";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // Louche (manche + tête ronde)
  const scoopX = sx + sw * 0.24;
  const scoopY = bowlY - Math.max(5, sw * 0.1);
  const handleEndX = sx + sw - 2;
  const handleEndY = sy + sh * 0.08;
  const ladleR = Math.max(6, sw * 0.15);

  // Manche en bois
  ctx.strokeStyle = "#7B4A20";
  ctx.lineWidth = Math.max(2.5, sw * 0.07);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(scoopX, scoopY);
  ctx.lineTo(handleEndX, handleEndY);
  ctx.stroke();

  // Tête de la louche (cuillère ronde avec pâte)
  ctx.beginPath();
  ctx.arc(scoopX, scoopY, ladleR, 0, Math.PI * 2);
  const ladleG = ctx.createRadialGradient(
    scoopX - ladleR * 0.25,
    scoopY - ladleR * 0.25,
    1,
    scoopX,
    scoopY,
    ladleR,
  );
  ladleG.addColorStop(0, "#EEE0A0");
  ladleG.addColorStop(0.75, "#D4B860");
  ladleG.addColorStop(1, "#A88844");
  ctx.fillStyle = ladleG;
  ctx.fill();
  ctx.strokeStyle = "#7B4A20";
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

export function drawIngredientStation(ctx, s, sx, sy, sw, sh) {
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

export function drawDeliveryStation(ctx, s, sx, sy, sw, sh, time) {
  const cx = sx + sw / 2;
  const hasRejected = s.deliveryStatus === "rejected";
  const hasWaiting = s.deliveryStatus === "waiting";
  const isEmpty = s.deliveryStatus === "empty";
  const t = time;

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
    ctx.beginPath();
    ctx.ellipse(cx, sy + sh * 0.55, sw * 0.28, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();
  } else {
    // Flash + ✕ dessinés AVANT la crêpe pour ne pas masquer le contenu
    if (hasRejected) {
      const flash = Math.abs(Math.sin(t / 250));
      ctx.save();
      ctx.globalAlpha = flash;
      roundRect(ctx, sx - 1, sy + 1, sw + 2, sh + 2, 9);
      ctx.strokeStyle = "#E74C3C";
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.font = `bold ${Math.max(12, sw * 0.28)}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#E74C3C";
      ctx.fillText("✕", cx + Math.min(sw, sh) * 0.16, sy + sh * 0.3);
      ctx.restore();
    }

    // Crêpe (disque + toppings + icônes) toujours au premier plan
    const toppings = s.deliveryCrepe?.toppings ?? [];
    drawAssembledCrepe(
      ctx,
      cx,
      sy + sh * 0.52,
      Math.min(sw, sh) * 0.22,
      toppings,
      Math.max(16, sw * 0.3),
    );
  }

  // (flash et ✕ déplacés avant le rendu de la crêpe ci-dessus)
}

export function drawTrash(ctx, s, sx, sy, sw, sh) {
  // Legacy — redirige vers le rendu donation
  drawDonation(ctx, s, sx, sy, sw, sh, Date.now());
}

// ── DONATION — Zone de don à l'association ─────────────────────────────────
export function drawDonation(ctx, s, sx, sy, sw, sh, time) {
  const cx = sx + sw / 2;
  const cy = sy + sh * 0.5;
  const t = time;
  const pulse = 0.85 + 0.15 * Math.sin(t / 700);

  // Fond chaleureux
  roundRect(ctx, sx + 2, sy + 2, sw - 4, sh - 4, 8);
  const dG = vGrad(ctx, sy, sy + sh, "#FF8C42", "#D4541E");
  ctx.fillStyle = dG;
  ctx.fill();
  ctx.strokeStyle = "#FFB870";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Boîte de don stylisée
  const boxW = sw * 0.72,
    boxH = sh * 0.55;
  const boxX = cx - boxW / 2,
    boxY = sy + sh * 0.18;
  roundRect(ctx, boxX, boxY, boxW, boxH, 5);
  ctx.fillStyle = "#FFEEDD";
  ctx.fill();
  ctx.strokeStyle = "#CC6620";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Fente sur le dessus de la boîte
  ctx.strokeStyle = "#AA4412";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx - boxW * 0.22, boxY + 2);
  ctx.lineTo(cx + boxW * 0.22, boxY + 2);
  ctx.stroke();
  ctx.lineCap = "butt";

  // Ruban / décoration
  ctx.strokeStyle = "#E30613";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, boxY);
  ctx.lineTo(cx, boxY + boxH);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(boxX, boxY + boxH * 0.5);
  ctx.lineTo(boxX + boxW, boxY + boxH * 0.5);
  ctx.stroke();
  // Nœud (petit cœur)
  ctx.font = `${Math.max(10, sw * 0.25)}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🫶", cx, boxY + boxH * 0.5);

  // Label "Asso"
  ctx.font = `bold ${Math.max(7, sw * 0.14)}px Arial`;
  ctx.fillStyle = "#FFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowBlur = 3;
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.fillText("DON", cx, sy + sh * 0.84);
  ctx.shadowBlur = 0;
}

// ── CALL G2S — Station d'appel pompier ────────────────────────────────────
export function drawCallG2S(
  ctx,
  s,
  sx,
  sy,
  sw,
  sh,
  time,
  isFireActive = false,
) {
  const cx = sx + sw / 2;
  const cy = sy + sh * 0.5;
  const t = time;

  // Pulsation rouge quand feu actif
  const firePulse = isFireActive ? 0.7 + 0.3 * Math.sin(t / 150) : 0;

  // Fond
  roundRect(ctx, sx + 2, sy + 2, sw - 4, sh - 4, 8);
  let bgG;
  if (isFireActive) {
    bgG = vGrad(
      ctx,
      sy,
      sy + sh,
      `rgba(220,30,10,${0.7 + 0.25 * firePulse})`,
      "#8B1010",
    );
  } else {
    bgG = vGrad(ctx, sy, sy + sh, "#2255AA", "#102060");
  }
  ctx.fillStyle = bgG;
  ctx.fill();
  // Glow rouge si feu
  if (isFireActive) {
    ctx.save();
    ctx.shadowBlur = 20 * firePulse;
    ctx.shadowColor = "#FF2200";
    ctx.strokeStyle = `rgba(255,80,20,${firePulse})`;
    ctx.lineWidth = 3;
    roundRect(ctx, sx + 2, sy + 2, sw - 4, sh - 4, 8);
    ctx.stroke();
    ctx.restore();
  } else {
    ctx.strokeStyle = "#4488EE";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Icône téléphone / sirène
  const iconY = sy + sh * 0.42;
  ctx.font = `${Math.max(14, sw * 0.36)}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (isFireActive) {
    ctx.save();
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#FFD700";
    ctx.fillText("🚒", cx, iconY);
    ctx.restore();
    // Texte d'alerte
    ctx.font = `bold ${Math.max(7, sw * 0.14)}px Arial`;
    ctx.fillStyle = `rgba(255,220,80,${0.8 + 0.2 * firePulse})`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowBlur = 6;
    ctx.shadowColor = "#FF4400";
    ctx.fillText("FEU!", cx, sy + sh * 0.78);
    ctx.shadowBlur = 0;
  } else {
    ctx.fillText("📞", cx, iconY);
    ctx.font = `bold ${Math.max(6, sw * 0.12)}px Arial`;
    ctx.fillStyle = "rgba(170,210,255,0.8)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("G2S", cx, sy + sh * 0.8);
  }
}

// ── ASSISTANT BILIG — REMPLACÉ par drawBilig commun ───────────────────────
// (les biligs assistants sont dessinés via drawBilig dans drawBottomStations)

// ── FLAMMES animées (partagées bilig joueur + assistant) ───────────────────
function _drawFlames(ctx, cx, cy, r, t) {
  ctx.save();
  const numFlames = 5;
  for (let i = 0; i < numFlames; i++) {
    const angle = (i / numFlames) * Math.PI * 2 + t / 400;
    const wobble = Math.sin(t / 120 + i * 1.8) * 0.3;
    const fH = r * (0.8 + wobble * 0.4);
    const fX = cx + Math.cos(angle) * r * 0.4;
    const fY = cy + Math.sin(angle) * r * 0.4;

    const flameG = ctx.createRadialGradient(fX, fY, 0, fX, fY - fH * 0.5, fH);
    flameG.addColorStop(0, "rgba(255,240,80,0.95)");
    flameG.addColorStop(0.4, "rgba(255,120,20,0.85)");
    flameG.addColorStop(0.8, "rgba(200,20,0,0.6)");
    flameG.addColorStop(1, "rgba(100,0,0,0)");

    ctx.beginPath();
    ctx.moveTo(fX - r * 0.18, fY);
    ctx.bezierCurveTo(
      fX - r * 0.12,
      fY - fH * 0.4,
      fX + r * 0.1 * wobble,
      fY - fH * 0.75,
      fX,
      fY - fH,
    );
    ctx.bezierCurveTo(
      fX - r * 0.1 * wobble,
      fY - fH * 0.75,
      fX + r * 0.12,
      fY - fH * 0.4,
      fX + r * 0.18,
      fY,
    );
    ctx.closePath();
    ctx.fillStyle = flameG;
    ctx.fill();
  }

  // Fumée légère
  ctx.globalAlpha = 0.12;
  for (let si = 0; si < 3; si++) {
    const sx2 = cx + (si - 1) * r * 0.4;
    const sy2 = cy - r - 8 - ((t / 600 + si * 1.1) % 3) * 10;
    const sr = 4 + Math.sin(t / 600 + si) * 2;
    ctx.beginPath();
    ctx.arc(sx2, sy2, sr, 0, Math.PI * 2);
    ctx.fillStyle = "#888";
    ctx.fill();
  }

  // Glow rouge pulsant
  ctx.globalAlpha = 0.4 + 0.3 * Math.sin(t / 150);
  ctx.beginPath();
  ctx.arc(cx, cy, r + 8, 0, Math.PI * 2);
  const glow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r + 8);
  glow.addColorStop(0, "rgba(255,80,0,0.4)");
  glow.addColorStop(1, "rgba(255,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fill();

  ctx.restore();
}

// ── EXPORT ASSISTANT BILIGS ────────────────────────────────────────────────
export function drawAssistantBiligs(ctx, assistanceBiligs, time, assistants) {
  if (!assistanceBiligs || assistanceBiligs.length === 0) return;

  // Fond barre inférieure (séparation visuelle)
  const first = assistanceBiligs[0];
  const last = assistanceBiligs[assistanceBiligs.length - 1];
  if (first.w > 0) {
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = "#FFF";
    ctx.fillRect(
      first.x - 8,
      first.y - 6,
      last.x + last.w - first.x + 16,
      first.h + 28,
    );
    ctx.restore();
  }

  assistanceBiligs.forEach((bilig, i) => {
    const isActive = i < assistants.length;
    if (!isActive) {
      // Slot vide : ombre grisée
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(
        bilig.x + bilig.w / 2,
        bilig.y + bilig.h * 0.42,
        Math.min(bilig.w, bilig.h) * 0.36,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = "#555";
      ctx.fill();
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1;
      ctx.stroke();
      // "+"
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = "#FFF";
      ctx.font = `bold ${Math.max(12, bilig.w * 0.35)}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("+", bilig.x + bilig.w / 2, bilig.y + bilig.h * 0.42);
      ctx.restore();
    } else {
      drawAssistantBiligStation(
        ctx,
        bilig,
        bilig.x,
        bilig.y,
        bilig.w,
        bilig.h,
        time,
      );
    }
  });
}
