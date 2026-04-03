// renderer-crepe.js — Rendu partagé de la crêpe assemblée (bilig, mains, livraison)

import { ITEM_ICONS } from "../creperie-constants.js";

/**
 * Dessine une belle crêpe assemblée avec ses toppings dessinés.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx      centre X
 * @param {number} cy      centre Y
 * @param {number} cr      rayon de la crêpe (px)
 * @param {string[]} toppings  liste des types de toppings (IT.*)
 * @param {number} iconSize   taille des icônes emoji sous la crêpe (0 = aucune)
 */
export function drawAssembledCrepe(ctx, cx, cy, cr, toppings, iconSize = 14) {
  // ── Disque crêpe (légèrement elliptique, bord ondulé) ──────────────────────
  ctx.save();
  ctx.beginPath();
  const segs = 16;
  for (let i = 0; i <= segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    const wave = Math.sin(a * 6 + 0.8) * cr * 0.04;
    const rx = cr + wave;
    const ry = cr * 0.82 + wave * 0.6;
    const px = cx + Math.cos(a) * rx;
    const py = cy + Math.sin(a) * ry;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();

  const cg = ctx.createRadialGradient(
    cx - cr * 0.12,
    cy - cr * 0.1,
    cr * 0.08,
    cx,
    cy,
    cr,
  );
  cg.addColorStop(0, "#F6E080");
  cg.addColorStop(0.65, "#DEB840");
  cg.addColorStop(1, "#B88028");
  ctx.fillStyle = cg;
  ctx.fill();
  ctx.strokeStyle = "#9A7020";
  ctx.lineWidth = Math.max(1, cr * 0.045);
  ctx.stroke();

  // Taches de cuisson
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = "#6B3A08";
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.35;
    const r2 = cr * 0.47;
    ctx.beginPath();
    ctx.ellipse(
      cx + Math.cos(a) * r2,
      cy + Math.sin(a) * r2 * 0.82,
      cr * 0.09 + Math.sin(a * 3) * cr * 0.025,
      cr * 0.065,
      a,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.restore();
  ctx.restore();

  // ── Toppings ────────────────────────────────────────────────────────────────
  const n = toppings.length;
  toppings.forEach((t, i) => _drawTopping(ctx, cx, cy, cr, t, i, n));

  // ── Rangée d'icônes emoji sous la crêpe ────────────────────────────────────
  if (iconSize >= 7 && n > 0) {
    ctx.save();
    ctx.font = `${iconSize}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const gap = iconSize * 1.15;
    const totalW = n * gap - (gap - iconSize);
    let ix = cx - totalW / 2 + iconSize / 2;
    const iy = cy + cr * 0.82 + iconSize * 0.8;
    toppings.forEach((t) => {
      ctx.fillText(ITEM_ICONS[t] || "?", ix, iy);
      ix += gap;
    });
    ctx.restore();
  }
}

// ── Position d'un topping selon l'index et le nombre total ──────────────────
function _toppingPos(cx, cy, cr, i, n) {
  const r2 = cr * 0.35;
  if (n === 1) return { x: cx, y: cy };
  if (n === 2) {
    const angles = [-Math.PI * 0.4, Math.PI * 0.6];
    return {
      x: cx + Math.cos(angles[i]) * r2,
      y: cy + Math.sin(angles[i]) * r2 * 0.82,
    };
  }
  // 3 toppings : triangle équilatéral
  const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
  return {
    x: cx + Math.cos(angle) * r2,
    y: cy + Math.sin(angle) * r2 * 0.82,
  };
}

function _drawTopping(ctx, cx, cy, cr, type, i, n) {
  const { x, y } = _toppingPos(cx, cy, cr, i, n);
  const rs = cr * 0.28; // rayon de la zone du topping
  ctx.save();

  switch (type) {
    case "CHOCOLATE": {
      // Filet de chocolat fondu (zigzag brun)
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = "#5A2800";
      ctx.beginPath();
      ctx.ellipse(x, y, rs * 0.75, rs * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      const zw = rs * 1.1,
        zh = rs * 0.8,
        steps = 4;
      ctx.strokeStyle = "#2E1200";
      ctx.lineWidth = Math.max(1.5, cr * 0.04);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(x - zw, y);
      for (let k = 0; k <= steps; k++) {
        const kx = x - zw + ((k + 1) * zw * 2) / (steps + 1);
        const ky = y + (k % 2 === 0 ? zh * 0.4 : -zh * 0.4);
        ctx.lineTo(kx, ky);
      }
      ctx.stroke();
      break;
    }

    case "STRAWBERRY": {
      // Taches de confiture rouge
      const spots = [
        [0, 0, 0.55],
        [-0.48, -0.28, 0.3],
        [0.42, 0.22, 0.3],
      ];
      spots.forEach(([dx, dy, dr]) => {
        ctx.beginPath();
        ctx.ellipse(
          x + dx * rs,
          y + dy * rs * 0.8,
          rs * dr,
          rs * dr * 0.72,
          0.3,
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = "#D82030";
        ctx.globalAlpha = 0.68;
        ctx.fill();
      });
      // Pépins
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = "#FFF0A0";
      for (let k = 0; k < 5; k++) {
        const ka = (k / 5) * Math.PI * 2;
        const ks = Math.max(1, rs * 0.1);
        ctx.beginPath();
        ctx.ellipse(
          x + Math.cos(ka) * rs * 0.32,
          y + Math.sin(ka) * rs * 0.25,
          ks,
          ks * 1.6,
          ka,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      break;
    }

    case "BUTTER": {
      // Motte de beurre (rectangle jaune, légèrement fondu)
      const bw = rs * 1.0,
        bh = rs * 0.65;
      // Halo de fonte
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = "#DDAA00";
      ctx.beginPath();
      ctx.ellipse(x, y + bh * 0.3, bw * 0.75, bh * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // Bloc
      _roundedRect(ctx, x - bw / 2, y - bh / 2, bw, bh, rs * 0.15);
      const bg = ctx.createLinearGradient(x, y - bh / 2, x, y + bh / 2);
      bg.addColorStop(0, "#FFEE60");
      bg.addColorStop(1, "#D4A800");
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.strokeStyle = "#AA8000";
      ctx.lineWidth = Math.max(1, cr * 0.025);
      ctx.stroke();
      // Reflet
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = "#FFF";
      _roundedRect(
        ctx,
        x - bw * 0.28,
        y - bh * 0.35,
        bw * 0.5,
        bh * 0.3,
        rs * 0.06,
      );
      ctx.fill();
      ctx.restore();
      break;
    }

    case "SUGAR": {
      // Cristaux de sucre éparpillés
      ctx.save();
      for (let k = 0; k < 20; k++) {
        const a = (k / 20) * Math.PI * 2 + 0.3;
        const r2 = rs * (0.25 + (k % 3) * 0.22);
        const kx = x + Math.cos(a) * r2;
        const ky = y + Math.sin(a) * r2 * 0.78;
        const s2 = Math.max(1.2, cr * 0.023) * (0.8 + (k % 2) * 0.4);
        ctx.globalAlpha = 0.55 + (k % 3) * 0.15;
        ctx.fillStyle = k % 4 === 0 ? "#CCDDFF" : "#F8F8FF";
        ctx.beginPath();
        ctx.rect(kx - s2 / 2, ky - s2 / 2, s2, s2);
        ctx.fill();
      }
      ctx.restore();
      break;
    }

    case "LEMON": {
      // Quartier de citron (éventail)
      const lr = rs * 0.88;
      const startA = -Math.PI * 0.72,
        endA = Math.PI * 0.72;
      ctx.fillStyle = "#FFF176";
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.arc(x, y, lr, startA, endA);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#C9A800";
      ctx.lineWidth = Math.max(1, cr * 0.03);
      ctx.stroke();
      // Anneau de zeste
      ctx.beginPath();
      ctx.arc(x, y, lr * 0.87, startA, endA);
      ctx.strokeStyle = "#E6C800";
      ctx.lineWidth = Math.max(1.5, cr * 0.045);
      ctx.stroke();
      // Segments rayonnants
      ctx.strokeStyle = "#C9A800";
      ctx.lineWidth = Math.max(0.7, cr * 0.018);
      for (let k = 0; k < 4; k++) {
        const la = startA + (k + 0.5) * ((endA - startA) / 4);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(la) * lr * 0.87, y + Math.sin(la) * lr * 0.87);
        ctx.stroke();
      }
      break;
    }

    case "WHIPPED_CREAM": {
      // Spirale de chantilly
      const turns = 2.5,
        steps = 48;
      ctx.strokeStyle = "#F8F8F8";
      ctx.lineWidth = Math.max(2, cr * 0.055);
      ctx.lineCap = "round";
      ctx.beginPath();
      let first = true;
      for (let k = 0; k <= steps; k++) {
        const t2 = (k / steps) * turns * Math.PI * 2;
        const r2 = rs * 0.1 + (1 - k / steps) * rs * 0.8;
        const kx = x + Math.cos(-t2 + Math.PI * 0.5) * r2;
        const ky = y + Math.sin(-t2 + Math.PI * 0.5) * r2 * 0.78;
        if (first) {
          ctx.moveTo(kx, ky);
          first = false;
        } else ctx.lineTo(kx, ky);
      }
      ctx.stroke();
      // Ombre légère
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = "#AAAACC";
      ctx.lineWidth = Math.max(0.8, cr * 0.022);
      first = true;
      ctx.beginPath();
      for (let k = 0; k <= steps; k++) {
        const t2 = (k / steps) * turns * Math.PI * 2;
        const r2 = rs * 0.1 + (1 - k / steps) * rs * 0.8;
        const kx = x + Math.cos(-t2 + Math.PI * 0.5) * r2 + 1;
        const ky = y + Math.sin(-t2 + Math.PI * 0.5) * r2 * 0.78 + 1;
        if (first) {
          ctx.moveTo(kx, ky);
          first = false;
        } else ctx.lineTo(kx, ky);
      }
      ctx.stroke();
      ctx.restore();
      break;
    }

    default:
      break;
  }

  ctx.restore();
}

// Helper : rectangle arrondi (équivalent local à roundRect de renderer-colors)
function _roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
