// renderer-screens.js — Écrans d'intro et de fin de partie dessinés sur canvas
// Style glassmorphism identique au HUD : fonds sombres, dégradés or, arrondis lumineux

import {
  GAME_DURATION,
  GAMEOVER_ACTION_DELAY,
  MAX_HEARTS,
} from "../creperie-constants.js";
import { roundRect } from "./renderer-colors.js";

// ── Helpers internes ──────────────────────────────────────────────────────────

function _glassCard(ctx, x, y, w, h, r = 18, alpha = 0.88) {
  const bg = ctx.createLinearGradient(x, y, x, y + h);
  bg.addColorStop(0, `rgba(10,10,32,${alpha})`);
  bg.addColorStop(1, `rgba(5,5,22,${Math.min(1, alpha + 0.08)})`);
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function _goldText(ctx, text, x, y, size, align = "center") {
  const g = ctx.createLinearGradient(x - 10, y - size, x + 10, y + size * 0.3);
  g.addColorStop(0, "#FFE566");
  g.addColorStop(0.5, "#FFD700");
  g.addColorStop(1, "#FF9500");
  ctx.font = `bold ${size}px 'Arial', sans-serif`;
  ctx.fillStyle = g;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.shadowBlur = 18;
  ctx.shadowColor = "rgba(255,180,0,0.65)";
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 0;
}

function _spaceKey(ctx, x, y, w, h, label, pulse) {
  const glowAlpha = 0.55 + 0.45 * pulse;
  const scale = 1 + 0.04 * pulse;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  // Fond du bouton
  const bg = ctx.createLinearGradient(-w / 2, -h / 2, -w / 2, h / 2);
  bg.addColorStop(0, `rgba(255,160,0,${glowAlpha})`);
  bg.addColorStop(1, `rgba(200,90,0,${glowAlpha})`);
  roundRect(ctx, -w / 2, -h / 2, w, h, 12);
  ctx.fillStyle = bg;
  ctx.shadowBlur = 28 * pulse;
  ctx.shadowColor = "rgba(255,160,0,0.8)";
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = `rgba(255,220,100,${0.6 + 0.4 * pulse})`;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Texte
  ctx.font = `bold 19px Arial`;
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 0, 0);
  ctx.restore();
}

function _drawBackground(ctx, W, H, time) {
  // Fond très sombre avec léger glow central animé
  ctx.fillStyle = "#04030f";
  ctx.fillRect(0, 0, W, H);
  const bg = ctx.createRadialGradient(
    W * 0.5,
    H * 0.38,
    0,
    W * 0.5,
    H * 0.38,
    Math.max(W, H) * 0.6,
  );
  const pulse = 0.5 + 0.5 * Math.sin(time / 2800);
  bg.addColorStop(0, `rgba(22,12,52,${0.85 + 0.05 * pulse})`);
  bg.addColorStop(0.6, "rgba(8,5,24,0.6)");
  bg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Quelques étoiles statiques (seed basé sur position)
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  const stars = [
    [0.08, 0.12],
    [0.92, 0.08],
    [0.15, 0.88],
    [0.85, 0.92],
    [0.05, 0.5],
    [0.95, 0.52],
    [0.5, 0.04],
    [0.5, 0.96],
    [0.22, 0.3],
    [0.78, 0.28],
    [0.3, 0.72],
    [0.7, 0.75],
  ];
  for (const [rx, ry] of stars) {
    const twinkle = 0.5 + 0.5 * Math.sin(time / 1200 + rx * 10 + ry * 7);
    ctx.globalAlpha = 0.08 + 0.18 * twinkle;
    ctx.beginPath();
    ctx.arc(W * rx, H * ry, 1.5 + twinkle, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Ligne déco en bas
  const lineG = ctx.createLinearGradient(0, 0, W, 0);
  lineG.addColorStop(0, "transparent");
  lineG.addColorStop(0.3, "rgba(255,180,0,0.2)");
  lineG.addColorStop(0.7, "rgba(255,180,0,0.2)");
  lineG.addColorStop(1, "transparent");
  ctx.strokeStyle = lineG;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, H - 4);
  ctx.lineTo(W, H - 4);
  ctx.stroke();
}

// ══════════════════════════════════════════════════════════════════════════════
//  ÉCRAN D'INTRO / RÈGLES
// ══════════════════════════════════════════════════════════════════════════════

export function drawIntroScreen(
  ctx,
  W,
  H,
  playerInfo,
  time,
  selectedSpeedIdx = 1,
) {
  const t = Date.now();
  const pulse = 0.5 + 0.5 * Math.sin(t / 600);

  ctx.save();
  _drawBackground(ctx, W, H, time);

  const cx = W / 2;
  const cardPad = 16;
  const cardW = Math.min(W * 0.92, 700);
  const cardX = cx - cardW / 2;
  const gap = 20;

  // ── Titre compact (emoji + texte + pseudo) ────────────────────────────────────────
  let curY = 20;

  ctx.font = "bold 42px 'Segoe UI', Arial, sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowBlur = 0;
  ctx.fillText("🥞", cx, curY + 22);
  curY += 56;

  _goldText(ctx, "LA CRÊPERIE", cx, curY + 22, 42);
  curY += 50;

  if (playerInfo && playerInfo.nickname) {
    ctx.font = "bold 19px 'Segoe UI', Arial, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`Bienvenue, ${playerInfo.nickname} !`, cx, curY + 13);
    curY += 28;
  }
  curY += gap * 1.5;

  // ── Carte contrôles ────────────────────────────────────────────────────────
  const controlH = 68;
  const cardTopY = curY;
  _glassCard(ctx, cardX, cardTopY, cardW, controlH, 14);

  // Gauche : flèches
  const arrowGroupX = cardX + cardW * 0.22;
  ctx.font = "bold 30px 'Segoe UI', Arial, sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("◀ ▶", arrowGroupX, cardTopY + 26);
  ctx.font = "bold 17px 'Segoe UI', Arial, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText("Se déplacer", arrowGroupX, cardTopY + 52);

  // Séparateur
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, cardTopY + 10);
  ctx.lineTo(cx, cardTopY + controlH - 10);
  ctx.stroke();

  // Droite : touche ESPACE
  const spaceGroupX = cardX + cardW * 0.72;
  roundRect(ctx, spaceGroupX - 48, cardTopY + 10, 96, 30, 8);
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.50)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.font = "bold 17px 'Segoe UI', Arial, sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("ESPACE", spaceGroupX, cardTopY + 25);
  ctx.font = "bold 17px 'Segoe UI', Arial, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText("Interagir", spaceGroupX, cardTopY + 54);
  curY = cardTopY + controlH + gap;

  // ── Carte règles ───────────────────────────────────────────────────────────
  const rules = [
    { icon: "🥣", text: "Mettez la pâte dans le bilig et attendez la cuisson" },
    { icon: "🧈", text: "Récupérez les ingrédients (max 4 en main)" },
    {
      icon: "🥞",
      text: "Déposez les ingrédients, ramassez la crêpe, livrez !",
    },
    {
      icon: "😊",
      text: "Servez les clients avant qu'ils partent — 5 départs = fin",
    },
    { icon: "🫶", text: "Zone de don si vous vous trompez (+1 pt)" },
    { icon: "🤝", text: "Contrats G2S → assistants crépiers automatiques" },
    { icon: "⏱️", text: `${GAME_DURATION / 60}min — Le rythme s'accélère !` },
  ];
  const lineH = 32;
  const rulesH = rules.length * lineH + cardPad * 2;
  const rulesTopY = curY;
  _glassCard(ctx, cardX, rulesTopY, cardW, rulesH, 14);

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  rules.forEach((rule, i) => {
    const ry = rulesTopY + cardPad + i * lineH + lineH / 2;
    if (i > 0) {
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cardX + 10, ry - lineH / 2);
      ctx.lineTo(cardX + cardW - 10, ry - lineH / 2);
      ctx.stroke();
    }
    ctx.font = "22px 'Segoe UI', Arial, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(rule.icon, cardX + cardPad, ry);
    ctx.save();
    ctx.beginPath();
    ctx.rect(
      cardX + cardPad + 36,
      ry - lineH / 2,
      cardW - cardPad * 2 - 36,
      lineH,
    );
    ctx.clip();
    ctx.font = "bold 18px 'Segoe UI', Arial, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(rule.text, cardX + cardPad + 36, ry);
    ctx.restore();
  });
  curY = rulesTopY + rulesH + gap * 1.5;

  // ── Sélection de vitesse ───────────────────────────────────────────────────
  const speedOptions = [
    { label: "Débutant", idx: 0 },
    { label: "Intermédiaire", idx: 1 },
    { label: "Expert", idx: 2 },
  ];
  const speedCardH = 72;
  const speedCardTopY = curY;
  _glassCard(ctx, cardX, speedCardTopY, cardW, speedCardH, 14);

  ctx.font = "bold 14px 'Segoe UI', Arial, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("◀  Vitesse du joueur  ▶", cx, speedCardTopY + 13);

  const btnW = (cardW - 32) / 3;
  const btnH = 38;
  const btnY = speedCardTopY + 26;
  speedOptions.forEach((opt) => {
    const bx = cardX + 8 + opt.idx * (btnW + 8);
    const isSelected = opt.idx === selectedSpeedIdx;
    // Fond bouton
    const btnBg = ctx.createLinearGradient(bx, btnY, bx, btnY + btnH);
    if (isSelected) {
      btnBg.addColorStop(0, "rgba(255,180,0,0.85)");
      btnBg.addColorStop(1, "rgba(200,90,0,0.85)");
    } else {
      btnBg.addColorStop(0, "rgba(255,255,255,0.12)");
      btnBg.addColorStop(1, "rgba(255,255,255,0.05)");
    }
    roundRect(ctx, bx, btnY, btnW, btnH, 10);
    ctx.fillStyle = btnBg;
    ctx.fill();
    ctx.strokeStyle = isSelected
      ? `rgba(255,230,100,${0.7 + 0.3 * pulse})`
      : "rgba(255,255,255,0.2)";
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.stroke();
    // Texte
    ctx.font = `bold 15px 'Segoe UI', Arial, sans-serif`;
    ctx.fillStyle = isSelected ? "#FFFFFF" : "rgba(255,255,255,0.6)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(opt.label, bx + btnW / 2, btnY + btnH / 2);
  });
  curY = speedCardTopY + speedCardH + gap * 1.5;

  // ── CTA Lancement ──────────────────────────────────────────────────────────
  const ctaY = curY + 8;
  // Label au-dessus
  ctx.font = "bold 17px 'Segoe UI', Arial, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Prêt à servir ? Appuyez sur", cx, ctaY);

  // Grande touche ESPACE
  const keyW = Math.min(cardW * 0.72, 360);
  const keyH = 52;
  const keyY = ctaY + 16;
  const glowA = 0.55 + 0.45 * pulse;
  ctx.save();
  ctx.translate(cx, keyY + keyH / 2);
  // Halo externe
  ctx.shadowBlur = 32 * pulse;
  ctx.shadowColor = "rgba(255,150,0,0.9)";
  // Fond bouton dégradé chaud
  const kbg = ctx.createLinearGradient(0, -keyH / 2, 0, keyH / 2);
  kbg.addColorStop(0, `rgba(255,180,0,${glowA})`);
  kbg.addColorStop(1, `rgba(210,80,0,${glowA})`);
  roundRect(ctx, -keyW / 2, -keyH / 2, keyW, keyH, 14);
  ctx.fillStyle = kbg;
  ctx.fill();
  ctx.shadowBlur = 0;
  // Bordure lumineuse
  ctx.strokeStyle = `rgba(255,230,120,${0.7 + 0.3 * pulse})`;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // Reflet en haut
  roundRect(ctx, -keyW / 2 + 6, -keyH / 2 + 4, keyW - 12, keyH * 0.3, 8);
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fill();
  // Icône clavier + texte
  ctx.font = "bold 28px 'Segoe UI', Arial, sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowBlur = 8;
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.fillText("ESPACE", 0, -1);
  ctx.shadowBlur = 0;
  ctx.restore();

  // Sous-label
  ctx.font = "bold 18px 'Segoe UI', Arial, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("pour lancer la partie !", cx, keyY + keyH + 20);

  ctx.restore();
}

// ══════════════════════════════════════════════════════════════════════════════
//  ÉCRAN DE FIN DE PARTIE
// ══════════════════════════════════════════════════════════════════════════════

export function drawGameOverScreen(
  ctx,
  W,
  H,
  stats,
  time,
  selectedAction = 0,
  elapsedMs = 0,
) {
  const t = Date.now();
  const pulse = 0.5 + 0.5 * Math.sin(t / 600);

  ctx.save();
  _drawBackground(ctx, W, H, time);

  const cx = W / 2;
  const cardPad = 20;
  const cardW = Math.min(W * 0.88, 580);
  const cardX = cx - cardW / 2;

  // ── Titre raison ──────────────────────────────────────────────────────────
  const titleY = H * 0.1;
  const titleEmoji = stats.reason === "time" ? "⏱️" : "💔";
  const titleText =
    stats.reason === "time" ? "TEMPS ÉCOULÉ !" : "TROP DE CLIENTS MÉCONTENTS !";

  ctx.font = "bold 28px Arial";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(titleEmoji, cx, titleY - 2);

  ctx.font = `bold 26px Arial`;
  const titleColor = stats.reason === "time" ? "#4EC9FF" : "#FF6B8A";
  ctx.fillStyle = titleColor;
  ctx.shadowBlur = 18;
  ctx.shadowColor =
    stats.reason === "time" ? "rgba(78,201,255,0.5)" : "rgba(255,60,100,0.5)";
  ctx.fillText(titleText, cx, titleY + 36);
  ctx.shadowBlur = 0;

  // ── Score principal ────────────────────────────────────────────────────────
  const scoreCardY = titleY + 68;
  const scoreCardH = 88;
  _glassCard(ctx, cardX, scoreCardY, cardW, scoreCardH, 16, 0.78);

  // Accent coloré à gauche
  roundRect(ctx, cardX, scoreCardY, 6, scoreCardH, 16);
  ctx.fillStyle = "#FFD700";
  ctx.fill();

  ctx.font = "bold 15px Arial";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("SCORE FINAL", cardX + 24, scoreCardY + 24);

  _goldText(
    ctx,
    stats.score.toLocaleString("fr-FR"),
    cardX + 24,
    scoreCardY + 62,
    50,
    "left",
  );

  // Badges stats à droite du score card
  const badgesX = cardX + cardW - cardPad;
  const badgeData = [
    { icon: "🥞", val: stats.crepesServed, label: "crèpes" },
    {
      icon: "💔",
      val: `${stats.heartsLost}/${MAX_HEARTS}`,
      label: "mécontents",
    },
  ];
  if (stats.donationCount > 0) {
    badgeData.push({ icon: "🫶", val: stats.donationCount, label: "dons" });
  }
  const badgeW = 88;
  const badgeGap = 8;
  const badgesStartX =
    badgesX - badgeData.length * (badgeW + badgeGap) + badgeGap;
  badgeData.forEach((b, i) => {
    const bx = badgesStartX + i * (badgeW + badgeGap) + badgeW / 2;
    const by = scoreCardY + scoreCardH / 2;
    roundRect(ctx, bx - badgeW / 2, by - 32, badgeW, 64, 10);
    ctx.fillStyle = "rgba(255,255,255,0.07)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.font = "22px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText(b.icon, bx, by - 16);
    ctx.font = "bold 16px 'Segoe UI', Arial, sans-serif";
    ctx.fillStyle = "#FFD700";
    ctx.fillText(b.val, bx, by + 4);
    // Label clippé pour éviter le débordement
    ctx.save();
    ctx.beginPath();
    ctx.rect(bx - badgeW / 2 + 4, by + 18, badgeW - 8, 14);
    ctx.clip();
    ctx.font = "12px 'Segoe UI', Arial, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillText(b.label, bx, by + 25);
    ctx.restore();
  });

  // ── Breakdown recettes ────────────────────────────────────────────────────
  let recipeCardBottom = scoreCardY + scoreCardH + 12;

  if (stats.recipeBreakdown && stats.recipeBreakdown.length > 0) {
    const sorted = [...stats.recipeBreakdown].sort(
      (a, b) => b.points - a.points,
    );
    const lineH = 30;
    const recipeCardH = sorted.length * lineH + cardPad * 2;
    const recipeCardY = recipeCardBottom;

    _glassCard(ctx, cardX, recipeCardY, cardW, recipeCardH, 14);

    ctx.font = "bold 13px Arial";
    ctx.fillStyle = "#FFD700";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("📋  DÉTAIL DES RECETTES", cardX + cardPad, recipeCardY + 15);

    sorted.forEach((r, i) => {
      const ry = recipeCardY + cardPad + 22 + i * lineH;
      if (i > 0) {
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cardX + 12, ry - lineH / 2);
        ctx.lineTo(cardX + cardW - 12, ry - lineH / 2);
        ctx.stroke();
      }

      // Barre de fond
      const barMaxW = cardW * 0.35;
      const maxPts = sorted[0].points;
      const barW2 = (r.points / maxPts) * barMaxW;
      const barX = cardX + cardW - cardPad - barMaxW;
      roundRect(ctx, barX, ry - 8, barMaxW, 16, 6);
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fill();
      if (barW2 > 4) {
        const bg = ctx.createLinearGradient(barX, 0, barX + barMaxW, 0);
        bg.addColorStop(0, "rgba(255,160,0,0.5)");
        bg.addColorStop(1, "rgba(255,220,0,0.3)");
        roundRect(ctx, barX, ry - 8, barW2, 16, 6);
        ctx.fillStyle = bg;
        ctx.fill();
      }

      ctx.font = "15px Arial";
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(r.label, cardX + cardPad, ry + 1);

      ctx.font = "14px Arial";
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillText(`× ${r.count}`, cardX + cardW * 0.48, ry + 1);

      ctx.font = "bold 15px Arial";
      ctx.fillStyle = "#FFD700";
      ctx.textAlign = "right";
      ctx.fillText(`${r.points} pts`, cardX + cardW - cardPad, ry + 1);
    });

    recipeCardBottom = recipeCardY + recipeCardH + 12;
  }

  // ── Message dons ──────────────────────────────────────────────────────────
  if (stats.donationCount > 0) {
    const donCardH = 88;
    _glassCard(ctx, cardX, recipeCardBottom, cardW, donCardH, 16, 0.78);
    // Accent orange vif sur toute la hauteur gauche
    roundRect(ctx, cardX, recipeCardBottom, 8, donCardH, 16);
    const donAccent = ctx.createLinearGradient(
      0,
      recipeCardBottom,
      0,
      recipeCardBottom + donCardH,
    );
    donAccent.addColorStop(0, "#FF8C00");
    donAccent.addColorStop(1, "#FF5500");
    ctx.fillStyle = donAccent;
    ctx.fill();
    // Icône cœur/mains
    ctx.font = "36px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("🫶", cardX + 22, recipeCardBottom + donCardH / 2);
    // Texte principal en gras
    ctx.font = "bold 16px Arial";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "left";
    const donNb = stats.donationCount;
    ctx.fillText(
      `Vous vous êtes engagé à offrir ${donNb} crêpe${donNb > 1 ? "s" : ""} au stand G2S.`,
      cardX + 72,
      recipeCardBottom + donCardH / 2 - 14,
    );
    // Sous-texte inspirant
    ctx.font = "14px Arial";
    ctx.fillStyle = "rgba(255,200,100,0.9)";
    ctx.fillText(
      "Chaque geste compte !",
      cardX + 72,
      recipeCardBottom + donCardH / 2 + 14,
    );
    recipeCardBottom += donCardH + 14;
  }

  // ── Actions (fondu après 3 secondes, espace sans effet avant) ───────────────────
  const actBtnH = 58;
  const actBtnGap = 16;
  const actTotalW = cardW * 0.9;
  const actSingleW = (actTotalW - actBtnGap) / 2;
  const actBtnY = recipeCardBottom + 18;
  const actStartX = cx - actTotalW / 2;

  if (elapsedMs >= GAMEOVER_ACTION_DELAY) {
    const fadeIn = Math.min(1, (elapsedMs - GAMEOVER_ACTION_DELAY) / 500);

    const actions = [
      { icon: "🏠", label: "Accueil" },
      { icon: "🔄", label: "Rejouer" },
    ];

    actions.forEach((action, i) => {
      const bx = actStartX + i * (actSingleW + actBtnGap);
      const isSelected = i === selectedAction;
      const glowA = 0.6 + 0.35 * pulse;

      ctx.save();
      ctx.globalAlpha = fadeIn;

      if (isSelected) {
        ctx.shadowBlur = 28 * pulse;
        ctx.shadowColor = "rgba(255,140,0,0.85)";
      }

      const bg = ctx.createLinearGradient(bx, actBtnY, bx, actBtnY + actBtnH);
      if (isSelected) {
        bg.addColorStop(0, `rgba(255,175,0,${glowA})`);
        bg.addColorStop(1, `rgba(205,70,0,${glowA})`);
      } else {
        bg.addColorStop(0, "rgba(14,14,40,0.90)");
        bg.addColorStop(1, "rgba(7,7,24,0.90)");
      }
      roundRect(ctx, bx, actBtnY, actSingleW, actBtnH, 14);
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Reflet en haut
      roundRect(ctx, bx + 5, actBtnY + 4, actSingleW - 10, actBtnH * 0.28, 8);
      ctx.fillStyle = "rgba(255,255,255,0.10)";
      ctx.fill();

      ctx.strokeStyle = isSelected
        ? `rgba(255,225,100,${0.65 + 0.35 * pulse})`
        : "rgba(255,255,255,0.20)";
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      roundRect(ctx, bx, actBtnY, actSingleW, actBtnH, 14);
      ctx.stroke();

      ctx.shadowBlur = isSelected ? 6 : 0;
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.font = "26px Arial";
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        action.icon,
        bx + actSingleW / 2,
        actBtnY + actBtnH / 2 - 10,
      );
      ctx.font = "bold 20px 'Segoe UI', Arial, sans-serif";
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(
        action.label,
        bx + actSingleW / 2,
        actBtnY + actBtnH / 2 + 14,
      );
      ctx.shadowBlur = 0;

      ctx.restore();
    });

    ctx.globalAlpha = fadeIn * 0.55;
    ctx.font = "14px 'Segoe UI', Arial, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      "← → pour choisir  •  ESPACE pour confirmer",
      cx,
      actBtnY + actBtnH + 18,
    );
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}
