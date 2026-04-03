// renderer-ambient.js — Éclairage ambiant, halos de lampes et vignette

export function drawAmbientLighting(ctx, W, H, counterY) {
  // Warm lamp glow on restaurant area (slightly stronger radius + alpha)
  const lampPositions = [0.12, 0.32, 0.5, 0.68, 0.88];
  const rH = counterY;
  ctx.save();
  lampPositions.forEach((xr) => {
    const lx = W * xr;
    const ly = rH * 0.11 + 14;
    const r = 140;
    const grad = ctx.createRadialGradient(lx, ly, 8, lx, ly, r);
    grad.addColorStop(0, "rgba(255,210,130,0.09)");
    grad.addColorStop(0.6, "rgba(255,200,110,0.03)");
    grad.addColorStop(1, "rgba(255,200,100,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(lx - r, ly - r, r * 2, r * 2);
  });
  ctx.restore();

  // Warm vignette — slightly amber tint at edges (cozier than pure black)
  ctx.save();
  const vigR = Math.max(W, H) * 0.82;
  const vigGrad = ctx.createRadialGradient(
    W / 2,
    H / 2,
    vigR * 0.48,
    W / 2,
    H / 2,
    vigR,
  );
  vigGrad.addColorStop(0, "rgba(0,0,0,0)");
  vigGrad.addColorStop(0.75, "rgba(20,8,0,0.06)");
  vigGrad.addColorStop(1, "rgba(30,12,0,0.18)");
  ctx.fillStyle = vigGrad;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}
