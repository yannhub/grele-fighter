// renderer-hud.js — HUD (coeurs), particules, feedback livraison

import { COL, heartPath, roundRect } from "./renderer-colors.js";

// ══════════════════════════════════════════════════════════════════════════════
//  HUD — Hearts
// ══════════════════════════════════════════════════════════════════════════════
export function drawHUD(ctx, W, H, score, timeLeft, heartsLeft, maxHearts) {
  const heartSize = 28;
  const heartX = W - maxHearts * (heartSize + 8) - 12;
  const heartY = H - 38;

  for (let i = 0; i < maxHearts; i++) {
    const hx = heartX + i * (heartSize + 6);
    const isFull = i < heartsLeft;

    if (isFull) {
      heartPath(ctx, hx + heartSize / 2, heartY, heartSize * 0.5);
      // Outer glow when only 1 heart left
      if (heartsLeft === 1) {
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 220);
        ctx.save();
        ctx.shadowBlur = 18 * pulse;
        ctx.shadowColor = `rgba(255,60,60,${0.6 * pulse})`;
        ctx.fillStyle = "transparent";
        ctx.strokeStyle = `rgba(255,80,80,${0.4 * pulse})`;
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();
        heartPath(ctx, hx + heartSize / 2, heartY, heartSize * 0.5);
      }
      const hGrad2 = ctx.createRadialGradient(
        hx + heartSize / 2 - 3,
        heartY - 4,
        2,
        hx + heartSize / 2,
        heartY,
        heartSize * 0.5,
      );
      hGrad2.addColorStop(0, COL.HEART_FULL_A);
      hGrad2.addColorStop(1, COL.HEART_FULL_B);
      ctx.fillStyle = hGrad2;
      ctx.fill();
      ctx.strokeStyle = "#8B1A1A";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Specular highlight
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = "#FFF";
      ctx.beginPath();
      ctx.ellipse(
        hx + heartSize * 0.35,
        heartY - heartSize * 0.18,
        heartSize * 0.12,
        heartSize * 0.08,
        -0.3,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.restore();
    } else {
      heartPath(ctx, hx + heartSize / 2, heartY, heartSize * 0.5);
      ctx.fillStyle = COL.HEART_EMPTY;
      ctx.fill();
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  PARTICLES
// ══════════════════════════════════════════════════════════════════════════════
export function addParticles(particlesArray, x, y, color, count = 10) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
    const speed = 80 + Math.random() * 80;
    const isStar = Math.random() > 0.5;
    particlesArray.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      color,
      size: 4 + Math.random() * 5,
      isStar,
    });
  }
}

export function updateParticles(particlesArray, dt) {
  const dtS = dt / 1000;
  return particlesArray.filter((p) => {
    p.x += p.vx * dtS;
    p.y += p.vy * dtS;
    p.vy += 200 * dtS;
    p.life -= dtS * 1.8;
    return p.life > 0;
  });
}

export function drawParticles(ctx, particles) {
  particles.forEach((p) => {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.translate(p.x, p.y);

    if (p.isStar) {
      ctx.fillStyle = p.color;
      // Outer glow halo below star
      ctx.save();
      ctx.globalAlpha = p.life * 0.3;
      ctx.shadowBlur = p.size * 3;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const r = p.size;
        const ir = p.size * 0.4;
        ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        const midAngle = angle + Math.PI / 5;
        ctx.lineTo(Math.cos(midAngle) * ir, Math.sin(midAngle) * ir);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      // Crisp star on top
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const r = p.size;
        const ir = p.size * 0.4;
        ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        const midAngle = angle + Math.PI / 5;
        ctx.lineTo(Math.cos(midAngle) * ir, Math.sin(midAngle) * ir);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }

    // Ghost trail
    ctx.globalAlpha = p.life * 0.3;
    ctx.beginPath();
    ctx.arc(-p.vx * 0.02, -p.vy * 0.02, p.size * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();

    ctx.restore();
  });
}

// ══════════════════════════════════════════════════════════════════════════════
//  DELIVERY FEEDBACK
// ══════════════════════════════════════════════════════════════════════════════
export function drawDeliveryFeedback(ctx, feedback) {
  if (!feedback || feedback.timer <= 0) return;
  const progress = 1 - feedback.timer / feedback.maxTimer;
  const alpha = Math.min(1, feedback.timer / 400);
  const vy = progress * -45;
  let scale = 1;
  if (progress < 0.15) {
    scale = (progress / 0.15) * 1.25;
  } else if (progress < 0.25) {
    scale = 1.25 - ((progress - 0.15) / 0.1) * 0.25;
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(feedback.x, feedback.y + vy);
  ctx.scale(scale, scale);

  const text = feedback.msg;
  ctx.font = "bold 18px Arial";
  const tw = ctx.measureText(text).width;
  const bw2 = tw + 20,
    bh2 = 30;
  roundRect(ctx, -bw2 / 2, -bh2 / 2, bw2, bh2, 8);
  ctx.fillStyle = feedback.color;
  ctx.fill();
  ctx.strokeStyle = "#FFF";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#FFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 0, 0);

  ctx.restore();
}
