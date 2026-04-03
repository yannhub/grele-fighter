// renderer-counter.js — Rendu du comptoir en bois (gradients, grain, moulures)

import { COL, hGrad, vGrad } from "./renderer-colors.js";

export function drawCounter(ctx, W, counterY, counterH) {
  // Molding top (thin dark strip)
  ctx.fillStyle = COL.COUNTER_MOLDING;
  ctx.fillRect(0, counterY, W, 4);

  // Plan de travail (dessus — gradient horizontal avec reflet spéculaire)
  const topH = 14;
  const topGrad = hGrad(ctx, 0, W, COL.COUNTER_TOP_A, COL.COUNTER_TOP_B);
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, counterY + 4, W, topH);
  // Specular highlight
  ctx.fillStyle = COL.COUNTER_TOP_SPECULAR;
  ctx.fillRect(0, counterY + 4 + topH * 0.3, W, 3);

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
  ctx.fillRect(0, faceY, W, faceH);

  // Wood plank lines
  ctx.strokeStyle = COL.COUNTER_WOOD_GRAIN;
  ctx.lineWidth = 1.5;
  for (let lx = 0; lx < W; lx += 65) {
    ctx.beginPath();
    ctx.moveTo(lx, faceY);
    ctx.lineTo(lx, faceY + faceH);
    ctx.stroke();
  }
  // Wood knots (deterministic positions)
  ctx.fillStyle = COL.COUNTER_WOOD_KNOT;
  for (let kx = 30; kx < W; kx += 130) {
    const ky = faceY + faceH * 0.4 + (kx % 7) * 3;
    ctx.beginPath();
    ctx.ellipse(kx, ky, 5, 3, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Molding bottom (thick with shadow)
  ctx.fillStyle = COL.COUNTER_EDGE;
  ctx.fillRect(0, counterY + counterH - 6, W, 6);
  // Bottom shadow
  ctx.save();
  ctx.shadowBlur = 4;
  ctx.shadowColor = "rgba(0,0,0,0.2)";
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = COL.COUNTER_MOLDING;
  ctx.fillRect(0, counterY + counterH - 2, W, 2);
  ctx.restore();
}
