// renderer-ambient.js — Éclairage ambiant, halos de lampes et vignette

import { COL } from "./renderer-colors.js";

export function drawAmbientLighting(ctx, W, H, counterY) {
  // Warm lamp glow on restaurant area
  const lampPositions = [0.12, 0.32, 0.5, 0.68, 0.88];
  const rH = counterY;
  ctx.save();
  lampPositions.forEach((xr) => {
    const lx = W * xr;
    const ly = rH * 0.11 + 14;
    const r = 120;
    const grad = ctx.createRadialGradient(lx, ly, 10, lx, ly, r);
    grad.addColorStop(0, "rgba(255,215,140,0.06)");
    grad.addColorStop(1, "rgba(255,215,140,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(lx - r, ly - r, r * 2, r * 2);
  });
  ctx.restore();

  // Vignette (dark corners)
  ctx.save();
  const vigR = Math.max(W, H) * 0.8;
  const vigGrad = ctx.createRadialGradient(
    W / 2,
    H / 2,
    vigR * 0.5,
    W / 2,
    H / 2,
    vigR,
  );
  vigGrad.addColorStop(0, "rgba(0,0,0,0)");
  vigGrad.addColorStop(1, COL.VIGNETTE);
  ctx.fillStyle = vigGrad;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}
