// renderer-hud.js — HUD moderne plein-canvas (glassmorphism top strip)

import {
  GAME_DURATION,
  HUD_H,
  MAX_ASSISTANTS as _MAX_ASSISTANTS,
} from "../creperie-constants.js";
import { heartPath, roundRect } from "./renderer-colors.js";

const MAX_ASSISTANTS = _MAX_ASSISTANTS;

// ══════════════════════════════════════════════════════════════════════════════
//  HUD — Bande dédiée en haut du canvas (non-overlay)
// ══════════════════════════════════════════════════════════════════════════════
export function drawHUD(
  ctx,
  W,
  H,
  score,
  displayScore,
  scoreFlashTimer,
  timeLeft,
  heartsLeft,
  maxHearts,
  assistantCount = 0,
  donationCount = 0,
  comboCount = 0,
  comboTimer = 0,
) {
  const t = Date.now();

  // ── Fond glassmorphism ────────────────────────────────────────────────────
  ctx.save();
  const bg = ctx.createLinearGradient(0, 0, 0, HUD_H);
  bg.addColorStop(0, "rgba(15,15,30,0.82)");
  bg.addColorStop(1, "rgba(20,20,45,0.72)");
  ctx.fillStyle = bg;
  roundRect(ctx, 0, 0, W, HUD_H, 14);
  ctx.fill();

  // Ligne de séparation lumineuse
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, HUD_H);
  ctx.lineTo(W, HUD_H);
  ctx.stroke();

  // ── ZONE GAUCHE : Score animé ─────────────────────────────────────────────
  const scoreX = 18;
  // Icône trophée stylisé
  ctx.font = "bold 22px Arial";
  ctx.fillStyle = "#FFD700";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("🏆", scoreX, HUD_H * 0.42);

  const scoreStr = Math.round(displayScore).toString();
  // Scale animé quand le score monte
  const flashFrac = Math.max(0, scoreFlashTimer / 600);
  const scoreScale = 1 + 0.28 * flashFrac;
  const baseFontSize = Math.max(30, 36 - Math.max(0, scoreStr.length - 3) * 3);
  const fontSize = Math.round(baseFontSize * scoreScale);

  ctx.save();
  ctx.font = `bold ${fontSize}px 'Arial', sans-serif`;
  // Dégradé or pour le score
  const sg = ctx.createLinearGradient(
    scoreX + 32,
    HUD_H * 0.2,
    scoreX + 32,
    HUD_H * 0.7,
  );
  sg.addColorStop(0, "#FFE066");
  sg.addColorStop(0.5, "#FFD700");
  sg.addColorStop(1, "#FF8C00");
  ctx.fillStyle = sg;
  ctx.shadowBlur = 12 + 8 * flashFrac;
  ctx.shadowColor = `rgba(255,200,0,${0.7 + 0.3 * flashFrac})`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(scoreStr, scoreX + 32, HUD_H * 0.44);
  ctx.shadowBlur = 0;
  ctx.restore();

  // Label "pts"
  ctx.font = "11px Arial";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  {
    ctx.font = `bold ${Math.max(30, 36 - Math.max(0, scoreStr.length - 3) * 3)}px Arial`;
    const sw2 = ctx.measureText(scoreStr).width;
    ctx.font = "11px Arial";
    ctx.fillText("pts", scoreX + 32 + sw2 + 4, HUD_H * 0.65);
  }

  // ── ZONE CENTRE : Minuteur ────────────────────────────────────────────────
  const cx = W / 2;
  const mins = Math.floor(timeLeft / 60);
  const secs = Math.floor(timeLeft) % 60;
  const timeStr = `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  const isUrgent = timeLeft < 15;
  const urgentPulse = isUrgent ? 0.7 + 0.3 * Math.sin(t / 200) : 1;

  // Arc de progression
  const arcR = 22;
  const arcFrac = timeLeft / GAME_DURATION;
  const arcStartAngle = -Math.PI / 2;
  const arcColor =
    arcFrac > 0.5 ? "#4CAF50" : arcFrac > 0.2 ? "#FF9800" : "#F44336";

  // Fond arc (cercle complet demi-transparent)
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, HUD_H * 0.5, arcR, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 5;
  ctx.stroke();

  // Arc rempli (progression)
  ctx.beginPath();
  ctx.arc(
    cx,
    HUD_H * 0.5,
    arcR,
    arcStartAngle,
    arcStartAngle + arcFrac * Math.PI * 2,
  );
  ctx.strokeStyle = arcColor;
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  if (isUrgent) {
    ctx.shadowBlur = 12 * urgentPulse;
    ctx.shadowColor = "#F44336";
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.lineCap = "butt";

  // Texte du timer
  const timerFontSize = isUrgent ? 18 * urgentPulse : 18;
  ctx.font = `bold ${timerFontSize}px Arial`;
  ctx.fillStyle = isUrgent ? `rgba(255,80,80,${urgentPulse})` : "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (isUrgent) {
    ctx.shadowBlur = 10 * urgentPulse;
    ctx.shadowColor = "#F44336";
  }
  ctx.fillText(timeStr, cx, HUD_H * 0.5);
  ctx.shadowBlur = 0;
  ctx.restore();

  // ── ZONE DROITE : Cœurs (28px, plus grands) ──────────────────────────────
  const heartSize = 28;
  const heartSpacing = heartSize + 7;
  const heartsStartX = W - maxHearts * heartSpacing - 14;
  const heartY = HUD_H * 0.5;

  for (let i = 0; i < maxHearts; i++) {
    const hx = heartsStartX + i * heartSpacing;
    const isFull = i < heartsLeft;
    heartPath(ctx, hx + heartSize / 2, heartY, heartSize * 0.5);
    if (isFull) {
      const pulse = heartsLeft === 1 ? 0.5 + 0.5 * Math.sin(t / 220) : 0;
      const hg = ctx.createRadialGradient(
        hx + heartSize * 0.4,
        heartY - 3,
        1,
        hx + heartSize / 2,
        heartY,
        heartSize * 0.55,
      );
      hg.addColorStop(0, "#FF6B8A");
      hg.addColorStop(1, "#C0102A");
      ctx.fillStyle = hg;
      if (pulse > 0) {
        ctx.shadowBlur = 16 * pulse;
        ctx.shadowColor = `rgba(255,60,60,${0.8 * pulse})`;
      }
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#8B1A1A";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }

  // ── ZONE MILIEU-DROITE : Slots assistants ─────────────────────────────────
  const slotSize = 18;
  const slotSpacing = slotSize + 4;
  const slotsX =
    W - maxHearts * heartSpacing - MAX_ASSISTANTS * slotSpacing - 28;
  const slotY = HUD_H * 0.5;

  for (let i = 0; i < MAX_ASSISTANTS; i++) {
    const sx = slotsX + i * slotSpacing;
    ctx.beginPath();
    ctx.arc(sx, slotY, slotSize / 2, 0, Math.PI * 2);
    if (i < assistantCount) {
      // Slot actif
      const aG = ctx.createRadialGradient(
        sx - 3,
        slotY - 3,
        1,
        sx,
        slotY,
        slotSize / 2,
      );
      aG.addColorStop(0, "#FF6B6B");
      aG.addColorStop(1, "#E30613");
      ctx.fillStyle = aG;
      ctx.shadowBlur = 8;
      ctx.shadowColor = "rgba(227,6,19,0.6)";
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#FFAAAA";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // "G" text
      ctx.font = "bold 8px Arial";
      ctx.fillStyle = "#FFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("G2S", sx, slotY);
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.font = "9px Arial";
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("+", sx, slotY);
    }
  }

  // Label assistants
  ctx.font = "9px Arial";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.textAlign = "center";
  ctx.fillText(
    "assistants",
    slotsX + (MAX_ASSISTANTS * slotSpacing) / 2 - slotSpacing / 2,
    HUD_H - 7,
  );

  // ── BADGE DONS (coin inférieur gauche du HUD) ──────────────────────────────
  if (donationCount > 0) {
    const badgeX = 12,
      badgeY = HUD_H - 18;
    roundRect(ctx, badgeX, badgeY, 70, 14, 7);
    ctx.fillStyle = "rgba(255,140,0,0.25)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,140,0,0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.font = "bold 10px Arial";
    ctx.fillStyle = "#FFB74D";
    ctx.textAlign = "left";
    ctx.fillText(
      `🫶 ${donationCount} don${donationCount > 1 ? "s" : ""}`,
      badgeX + 5,
      badgeY + 7,
    );
  }

  // ── BADGE COMBO (centre du HUD, sous le timer) ───────────────────────────
  if (comboCount >= 2) {
    const timerFrac = Math.max(0, comboTimer / 3000);
    const alpha = 0.4 + 0.6 * timerFrac;
    const pulse = 1 + 0.08 * Math.sin(t / 120);
    const badgeW = 104 * pulse;
    const comboX = W / 2;
    const comboY = HUD_H - 11;
    ctx.save();
    ctx.globalAlpha = alpha;
    // Fond ardent centré
    roundRect(ctx, comboX - badgeW / 2, comboY - 9, badgeW, 16, 8);
    const cg = ctx.createLinearGradient(
      comboX - badgeW / 2,
      comboY,
      comboX + badgeW / 2,
      comboY,
    );
    cg.addColorStop(0, "rgba(255,80,0,0.7)");
    cg.addColorStop(1, "rgba(255,200,0,0.5)");
    ctx.fillStyle = cg;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,160,0,0.8)";
    ctx.lineWidth = 1;
    ctx.stroke();
    // Texte centré
    ctx.font = `bold ${Math.round(11 * pulse)}px Arial`;
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowBlur = 6;
    ctx.shadowColor = "#FF8800";
    ctx.fillText(`🔥 COMBO ×${comboCount}`, comboX, comboY);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  ctx.restore();
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

// ══════════════════════════════════════════════════════════════════════════════
//  FLOATING TEXTS — textes animés au niveau des clients (sans encadré)
// ══════════════════════════════════════════════════════════════════════════════
export function drawFloatingTexts(ctx, floatingTexts) {
  floatingTexts.forEach((ft) => {
    if (ft.timer <= 0) return;
    const progress = 1 - ft.timer / ft.maxTimer;
    // Fondu : entrée rapide (200ms), sortie lente
    const alpha =
      Math.min(1, ft.timer / 250) *
      Math.max(0, Math.min(1, (ft.timer / ft.maxTimer) * 3.5));
    const vy = progress * -70;
    const scale = Math.max(0.8, 1.3 - 0.3 * progress);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(ft.x, ft.y + vy);
    ctx.scale(scale, scale);

    // Halo lumineux (glow) sans fond opaque
    ctx.font = "bold 30px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowBlur = 22;
    ctx.shadowColor = ft.color || "#2ECC71";
    ctx.fillStyle = ft.color || "#2ECC71";
    // Contour noir léger pour lisibilité
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.lineWidth = 4;
    ctx.lineJoin = "round";
    ctx.strokeText(ft.text, 0, 0);
    // Fill brillant
    ctx.shadowBlur = 18;
    ctx.fillText(ft.text, 0, 0);
    ctx.shadowBlur = 0;

    ctx.restore();
  });
}
