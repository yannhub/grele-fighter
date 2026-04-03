// renderer-furniture.js — Tables, chaises et mobilier de la salle

import { TABLE_POSITIONS } from "../creperie-constants.js";
import { COL, dropShadow, hGrad, roundRect, vGrad } from "./renderer-colors.js";

export function drawFurniture(ctx, W, counterY, customerManager) {
  const rH = counterY;
  TABLE_POSITIONS.forEach((pos, i) => {
    const tx = W * pos.xRatio;
    const ty = rH * pos.yRatio;
    const customer = customerManager.customers.find((c) => c.tableIndex === i);
    drawTable(ctx, tx, ty, customer, i);
  });
}

export function drawTable(ctx, cx, cy, customer, tableIdx) {
  const tw = 90,
    th = 56;

  // Drop shadow under table
  dropShadow(ctx, cx, cy + th / 2 + 8, tw * 0.45, 6, 0.12);

  // 4 table legs (gradient)
  const legW = 7,
    legH = 14;
  const legOffX = tw / 2 - 10;
  const legOffY = th / 2;
  [
    [-legOffX, legOffY],
    [legOffX, legOffY],
    [-legOffX, -legOffY + 4],
    [legOffX, -legOffY + 4],
  ].forEach(([ox, oy]) => {
    const ly = cy + oy;
    const legGrad = vGrad(ctx, ly, ly + legH, COL.TABLE_LEG_A, COL.TABLE_LEG_B);
    roundRect(ctx, cx + ox - legW / 2, ly, legW, legH, 2);
    ctx.fillStyle = legGrad;
    ctx.fill();
    ctx.strokeStyle = COL.OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  // Table top (gradient + grain bois + outline)
  const tabGrad = hGrad(
    ctx,
    cx - tw / 2,
    cx + tw / 2,
    COL.TABLE_B,
    COL.TABLE_A,
  );
  roundRect(ctx, cx - tw / 2, cy - th / 2, tw, th, 8);
  ctx.fillStyle = tabGrad;
  ctx.fill();
  // Wood grain lines
  ctx.strokeStyle = COL.TABLE_GRAIN;
  ctx.lineWidth = 1;
  for (let gy = -th / 2 + 10; gy < th / 2 - 5; gy += 13) {
    ctx.beginPath();
    ctx.moveTo(cx - tw / 2 + 6, cy + gy);
    ctx.lineTo(cx + tw / 2 - 6, cy + gy);
    ctx.stroke();
  }
  // Specular highlight band
  ctx.fillStyle = "rgba(255,255,255,0.10)";
  ctx.fillRect(cx - tw / 2 + 6, cy - th / 2 + th * 0.28, tw - 12, 3);
  // Outline
  roundRect(ctx, cx - tw / 2, cy - th / 2, tw, th, 8);
  ctx.strokeStyle = COL.OUTLINE;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Nappe à carreaux (losange central rouge/blanc style Overcooked)
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.PI / 4);
  const clothS = 22;
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = "#CC3030";
  ctx.fillRect(-clothS / 2, -clothS / 2, clothS, clothS);
  ctx.fillStyle = "#FFF";
  const cs2 = clothS / 2;
  ctx.fillRect(-cs2, -cs2, cs2, cs2);
  ctx.fillRect(0, 0, cs2, cs2);
  ctx.restore();

  // Assiettes (2 petits cercles blancs)
  ctx.fillStyle = "#F8F4F0";
  ctx.strokeStyle = "#D0C0A8";
  ctx.lineWidth = 1;
  [-18, 18].forEach((ox) => {
    ctx.beginPath();
    ctx.arc(cx + ox, cy, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  // Chairs (top + bottom)
  const chairOff = th / 2 + 20;
  drawChair(
    ctx,
    cx,
    cy - chairOff,
    false,
    customer?.state === "seated" ||
      customer?.state === "served" ||
      customer?.state === "leaving_happy",
  );
  drawChair(ctx, cx, cy + chairOff, true, false);
}

export function drawChair(ctx, cx, cy, flipped, occupied) {
  const cw = 42,
    ch = 26;

  // Assise (gradient radial = effet coussin)
  roundRect(ctx, cx - cw / 2, cy - ch / 2, cw, ch, 6);
  if (occupied) {
    const cushGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, cw * 0.5);
    cushGrad.addColorStop(0, COL.CHAIR_CUSHION_A);
    cushGrad.addColorStop(1, COL.CHAIR_CUSHION_B);
    ctx.fillStyle = cushGrad;
  } else {
    const chGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, cw * 0.5);
    chGrad.addColorStop(0, COL.CHAIR_A);
    chGrad.addColorStop(1, COL.CHAIR_B);
    ctx.fillStyle = chGrad;
  }
  ctx.fill();
  ctx.strokeStyle = COL.OUTLINE;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Dossier (arrondi semi-circulaire)
  const backH = 16;
  const backDir = flipped ? 1 : -1;
  const backY = cy + backDir * (ch / 2);
  roundRect(
    ctx,
    cx - cw / 2 + 3,
    Math.min(backY, backY + backH * backDir),
    cw - 6,
    Math.abs(backH),
    5,
  );
  ctx.fillStyle = occupied ? "#8B2520" : "#9A5830";
  ctx.fill();
  ctx.strokeStyle = COL.OUTLINE;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}
