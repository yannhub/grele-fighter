// renderer-stations.js — Rendu de toutes les stations de cuisine

import { ITEM_ICONS, ST } from "../creperie-constants.js";
import { BILIG_STATE } from "../creperie-stations.js";
import { COL, hGrad, lerpColor, roundRect, vGrad } from "./renderer-colors.js";
import { drawAssembledCrepe } from "./renderer-crepe.js";

export function drawStations(ctx, stations, counterY, counterH, time) {
  stations.forEach((s) => drawStation(ctx, s, counterY, counterH, time));
}

export function drawStation(ctx, s, counterY, counterH, time) {
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
    case ST.TRASH:
      drawTrash(ctx, s, sx, sy, sw, sh);
      break;
    case ST.BATTER:
      drawBatterStation(ctx, s, sx, sy, sw, sh);
      break;
    default:
      drawIngredientStation(ctx, s, sx, sy, sw, sh);
  }

  // Station label badge
  ctx.save();
  const labelFont = `bold ${Math.max(11, sw * 0.2)}px Arial`;
  ctx.font = labelFont;
  const labelText = s.label;
  const textW = ctx.measureText(labelText).width;
  const badgeW = textW + 16;
  const badgeH = 18;
  const badgeX = sx + sw / 2 - badgeW / 2;
  const badgeY = sy + sh + 4;
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 9);
  ctx.fillStyle = COL.LABEL_BG;
  ctx.fill();
  // Text shadow
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(labelText, sx + sw / 2 + 1, badgeY + badgeH / 2 + 1);
  // Text
  ctx.fillStyle = COL.TEXT_LABEL;
  ctx.fillText(labelText, sx + sw / 2, badgeY + badgeH / 2);
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

  // Cooking surface — outer ring (metal brush effect)
  ctx.beginPath();
  ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
  const ringGrad = ctx.createRadialGradient(cx, cy, r - 2, cx, cy, r + 4);
  ringGrad.addColorStop(0, COL.BILIG_METAL_B);
  ringGrad.addColorStop(0.5, "#AAA");
  ringGrad.addColorStop(1, COL.BILIG_METAL_C);
  ctx.fillStyle = ringGrad;
  ctx.fill();
  ctx.strokeStyle = COL.OUTLINE;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inner cooking surface (radial gradient for convex effect)
  let surfA, surfB;
  if (s.biligState === BILIG_STATE.EMPTY) {
    surfA = "#999";
    surfB = "#666";
  } else if (s.biligState === BILIG_STATE.COOKING) {
    const p = s.cookProgress;
    surfA = lerpColor("#999", "#E8B030", p);
    surfB = lerpColor("#666", "#C08010", p);
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

  // Concentric grooves
  ctx.strokeStyle = "rgba(0,0,0,0.10)";
  ctx.lineWidth = 0.8;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * (i / 4), 0, Math.PI * 2);
    ctx.stroke();
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

    // Pulsing glow
    const glow = Math.sin(t / 300) * 0.3 + 0.5;
    ctx.save();
    ctx.globalAlpha = glow * 0.4;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
    ctx.strokeStyle = COL.BILIG_GLOW;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();

    // Ready badge
    ctx.save();
    ctx.font = `bold ${Math.max(10, sw * 0.2)}px Arial`;
    ctx.fillStyle = COL.BILIG_GLOW;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowBlur = 6;
    ctx.shadowColor = "rgba(255,200,60,0.6)";
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
  const cx = sx + sw / 2;

  // Scale visually down to avoid the trash dominating the UI
  ctx.save();
  ctx.translate(cx, sy + sh * 0.5);
  ctx.scale(0.72, 0.72);
  ctx.translate(-cx, -(sy + sh * 0.5));

  // Can body (cylindrical tapered shape with gradient)
  const bodyTop = sy + sh * 0.25;
  const bodyH = sh * 0.65;
  ctx.beginPath();
  ctx.moveTo(sx + 6, bodyTop);
  ctx.lineTo(sx + 4, bodyTop + bodyH);
  ctx.lineTo(sx + sw - 4, bodyTop + bodyH);
  ctx.lineTo(sx + sw - 6, bodyTop);
  ctx.closePath();
  const trashGrad = vGrad(
    ctx,
    bodyTop,
    bodyTop + bodyH,
    COL.TRASH_A,
    COL.TRASH_B,
  );
  ctx.fillStyle = trashGrad;
  ctx.fill();
  ctx.strokeStyle = COL.OUTLINE;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Specular reflection
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = "#FFF";
  ctx.fillRect(sx + 8, bodyTop + 4, 3, bodyH - 8);
  ctx.restore();

  // Curved ridges
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  for (let i = 1; i < 3; i++) {
    const rx = sx + 6 + (sw - 12) * (i / 3);
    ctx.beginPath();
    ctx.moveTo(rx, bodyTop + 6);
    ctx.quadraticCurveTo(rx - 1, bodyTop + bodyH / 2, rx, bodyTop + bodyH - 4);
    ctx.stroke();
  }

  // Lid (domed with gradient)
  const lidGrad = hGrad(
    ctx,
    sx + 3,
    sx + sw - 3,
    COL.TRASH_LID_A,
    COL.TRASH_LID_B,
  );
  roundRect(ctx, sx + 3, sy + sh * 0.18, sw - 6, sh * 0.1, 4);
  ctx.fillStyle = lidGrad;
  ctx.fill();
  ctx.strokeStyle = COL.OUTLINE;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Lid handle (U shape)
  ctx.strokeStyle = "#606870";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, sy + sh * 0.16, 6, Math.PI, 0);
  ctx.stroke();

  // Pedal (small rect at bottom-right)
  ctx.fillStyle = "#555";
  roundRect(ctx, sx + sw - 14, sy + sh * 0.85, 10, 6, 2);
  ctx.fill();
  ctx.strokeStyle = COL.OUTLINE;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Icon
  ctx.font = `${Math.max(14, sw * 0.3)}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🗑️", cx, bodyTop + bodyH * 0.45);

  ctx.restore(); // end scale
}
