// renderer-counter.js — Rendu des comptoirs en bois (gradients, grain, moulures)

import { COL, hGrad, roundRect, vGrad } from "./renderer-colors.js";

// Dessine un comptoir jusqu'à passageX (comptoir du haut avec passage à droite)
export function drawTopCounter(ctx, W, counterY, counterH, passageX) {
  _drawCounterBody(ctx, 0, passageX, counterY, counterH);

  // Montants du passage (comme un cadre de porte)
  ctx.save();
  const postW = 8;
  const postH = counterH + 8;
  const postX = passageX - postW / 2;
  const postGrad = vGrad(
    ctx,
    counterY - 4,
    counterY + postH,
    "#5A2A10",
    "#3A1008",
  );
  roundRect(ctx, postX, counterY - 4, postW, postH, 3);
  ctx.fillStyle = postGrad;
  ctx.fill();
  ctx.strokeStyle = "#2A0A04";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

// Dessine le comptoir du bas (pleine largeur)
export function drawBottomCounter(ctx, W, bottomCounterY, bottomCounterH) {
  _drawCounterBody(ctx, 0, W, bottomCounterY, bottomCounterH);
}

// Moteur commun des deux comptoirs
function _drawCounterBody(ctx, fromX, toX, counterY, counterH) {
  const W2 = toX - fromX;

  // Molding top (thin dark strip)
  ctx.fillStyle = COL.COUNTER_MOLDING;
  ctx.fillRect(fromX, counterY, W2, 4);

  // Plan de travail (dessus — gradient horizontal avec reflet spéculaire)
  const topH = 14;
  const topGrad = hGrad(ctx, fromX, toX, COL.COUNTER_TOP_A, COL.COUNTER_TOP_B);
  ctx.fillStyle = topGrad;
  ctx.fillRect(fromX, counterY + 4, W2, topH);
  // Specular highlight
  ctx.fillStyle = COL.COUNTER_TOP_SPECULAR;
  ctx.fillRect(fromX, counterY + 4 + topH * 0.3, W2, 3);

  // Façade du comptoir (gradient vertical + texture bois)
  const faceY = counterY + 4 + topH;
  const faceH = counterH - topH - 4;
  const faceGrad = vGrad(
    ctx,
    faceY,
    faceY + faceH,
    COL.COUNTER_FRONT_A,
    COL.COUNTER_FRONT_B,
  );
  ctx.fillStyle = faceGrad;
  ctx.fillRect(fromX, faceY, W2, faceH);

  // Wood plank dividers
  ctx.strokeStyle = COL.COUNTER_WOOD_GRAIN;
  ctx.lineWidth = 1.5;
  for (let lx = fromX; lx < toX; lx += 65) {
    ctx.beginPath();
    ctx.moveTo(lx, faceY);
    ctx.bezierCurveTo(
      lx + 2,
      faceY + faceH * 0.33,
      lx - 1,
      faceY + faceH * 0.67,
      lx,
      faceY + faceH,
    );
    ctx.stroke();
  }
  // Horizontal grain lines
  ctx.save();
  ctx.strokeStyle = "rgba(0,0,0,0.05)";
  ctx.lineWidth = 0.7;
  for (let ly = faceY + 7; ly < faceY + faceH - 3; ly += 8) {
    ctx.beginPath();
    ctx.moveTo(fromX, ly);
    for (let wx = fromX; wx < toX; wx += 24) {
      ctx.lineTo(
        wx,
        ly + Math.sin(((wx - fromX) / W2) * Math.PI * 4 + ly * 0.3) * 1.3,
      );
    }
    ctx.lineTo(toX, ly);
    ctx.stroke();
  }
  ctx.restore();
  // Wood knots
  ctx.fillStyle = COL.COUNTER_WOOD_KNOT;
  for (let kx = fromX + 30; kx < toX; kx += 130) {
    const ky = faceY + faceH * 0.4 + (kx % 7) * 3;
    ctx.beginPath();
    ctx.ellipse(kx, ky, 6, 3.5, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(kx, ky, 11, 6, 0.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(kx, ky, 17, 8.5, 0.3, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Molding bottom
  ctx.fillStyle = COL.COUNTER_EDGE;
  ctx.fillRect(fromX, counterY + counterH - 6, W2, 6);
  ctx.save();
  ctx.shadowBlur = 4;
  ctx.shadowColor = "rgba(0,0,0,0.2)";
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = COL.COUNTER_MOLDING;
  ctx.fillRect(fromX, counterY + counterH - 2, W2, 2);
  ctx.restore();
}
