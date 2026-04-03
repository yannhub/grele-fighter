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

  // Wood plank dividers — vertical with slight bezier wobble (organic feel)
  ctx.strokeStyle = COL.COUNTER_WOOD_GRAIN;
  ctx.lineWidth = 1.5;
  for (let lx = 0; lx < W; lx += 65) {
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
  // Horizontal grain lines — sine-wave wobble for natural wood feel
  ctx.save();
  ctx.strokeStyle = "rgba(0,0,0,0.05)";
  ctx.lineWidth = 0.7;
  for (let ly = faceY + 7; ly < faceY + faceH - 3; ly += 8) {
    ctx.beginPath();
    ctx.moveTo(0, ly);
    for (let wx = 0; wx < W; wx += 24) {
      ctx.lineTo(wx, ly + Math.sin((wx / W) * Math.PI * 4 + ly * 0.3) * 1.3);
    }
    ctx.lineTo(W, ly);
    ctx.stroke();
  }
  ctx.restore();
  // Wood knots with concentric ring detail
  ctx.fillStyle = COL.COUNTER_WOOD_KNOT;
  for (let kx = 30; kx < W; kx += 130) {
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
