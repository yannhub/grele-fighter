// spinner.js - Écran de tirage au sort avec roue animée

export default class Spinner {
  constructor(leaderboard) {
    this.leaderboard = leaderboard;
    this.participants = [];
    this.isSpinning = false;
    this.spinnerElement = document.getElementById("spinner-modal");
    this.wheelCanvas = document.getElementById("spinner-wheel");
    this.spinButton = document.getElementById("spin-button");
    this.closeButton = document.getElementById("spinner-close");
    this.winnerDisplay = document.getElementById("winner-display");

    this.wheelRadius = 200;
    this.wheelCenter = 250;
    this.ctx = this.wheelCanvas.getContext("2d");
    this.currentRotation = 0;
    this.winningRotation = 0;

    // Ajuster la taille du canvas à son conteneur CSS
    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(this.wheelCanvas);

    // Couleurs arc-en-ciel pour la roue
    this.colors = [
      "#FF6B6B",
      "#FFA500",
      "#FFD700",
      "#76FF03",
      "#00BCD4",
      "#2196F3",
      "#9C27B0",
      "#FF1493",
      "#00FF00",
      "#FF4500",
      "#00CED1",
      "#32CD32",
    ];

    this.setupEventListeners();
  }

  setupEventListeners() {
    if (this.spinButton) {
      this.spinButton.addEventListener("click", () => this.startSpin());
    }
    if (this.closeButton) {
      this.closeButton.addEventListener("click", () => this.closeSpinner());
    }

    // Fermer le winner display
    const winnerCloseBtn = document.getElementById("winner-close");
    if (winnerCloseBtn) {
      winnerCloseBtn.addEventListener("click", () => this.closeWinner());
    }

    // Fermer en cliquant en dehors de la modale
    const overlay = document.getElementById("spinner-overlay");
    if (overlay) {
      overlay.addEventListener("click", () => this.closeSpinner());
    }
  }

  /**
   * Ouvrir l'écran de tirage au sort
   */
  openSpinner() {
    this.participants = this.getParticipants();

    if (this.participants.length < 2) {
      alert("❌ Au moins 2 participants sont nécessaires pour un tirage!");
      return;
    }

    this.spinnerElement.style.display = "block";
    this.winnerDisplay.style.display = "none";
    this.spinButton.disabled = false;
    this.spinButton.classList.remove("winner-mode");
    this.spinButton.textContent = "🚀 LANCER LA ROUE";
    this.isSpinning = false;
    // Double rAF : garantit que le navigateur a terminé le layout après display:block
    requestAnimationFrame(() =>
      requestAnimationFrame(() => this.resizeCanvas()),
    );
  }

  closeSpinner() {
    this.spinnerElement.style.display = "none";
    this.winnerDisplay.style.display = "none";
    this.isSpinning = false;
  }

  closeWinner() {
    this.winnerDisplay.style.display = "none";
    this.winnerDisplay.classList.remove("show-winner");
    this.spinButton.disabled = false;
    this.spinButton.classList.remove("winner-mode");
    this.spinButton.textContent = "🚀 LANCER LA ROUE";
  }

  /**
   * Ajuster les dimensions du canvas à l'espace CSS disponible
   */
  resizeCanvas() {
    // getBoundingClientRect force un reflow et renvoie la taille CSS réelle
    const wrapper = this.wheelCanvas.parentElement;
    const size = Math.floor(wrapper.getBoundingClientRect().width);
    if (size === 0) return;
    this.wheelCanvas.width = size;
    this.wheelCanvas.height = size;
    this.wheelRadius = size * 0.4;
    this.wheelCenter = size / 2;
    this.drawWheel();
  }

  /**
   * Récupérer les participants (joueurs du leaderboard en cours de jeu)
   */
  getParticipants() {
    const bestScores = this.leaderboard.getBestScores();

    return bestScores.map((entry) => ({
      name: entry.nickname,
      score: entry.score,
    }));
  }

  /**
   * Dessiner la roue avec gradient et relief
   */
  drawWheel() {
    const canvas = this.wheelCanvas;
    const ctx = this.ctx;
    const participants = this.participants;
    const numParticipants = participants.length;

    // Nettoyer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Appliquer la rotation
    ctx.save();
    ctx.translate(this.wheelCenter, this.wheelCenter);
    ctx.rotate(this.currentRotation);

    const angleSlice = (2 * Math.PI) / numParticipants;

    // Dessiner chaque segment de la roue
    participants.forEach((participant, index) => {
      const startAngle = index * angleSlice;
      const endAngle = (index + 1) * angleSlice;

      // Couleur du segment
      const color = this.colors[index % this.colors.length];
      const darkerColor = this.darkenColor(color, 0.2);

      // Créer un gradient radial pour l'effet de relief
      const gradient = ctx.createLinearGradient(
        -this.wheelRadius * Math.cos(startAngle + angleSlice / 2),
        -this.wheelRadius * Math.sin(startAngle + angleSlice / 2),
        -this.wheelRadius * 0.3 * Math.cos(startAngle + angleSlice / 2),
        -this.wheelRadius * 0.3 * Math.sin(startAngle + angleSlice / 2),
      );
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, darkerColor);

      // Dessiner le segment
      ctx.beginPath();
      ctx.arc(0, 0, this.wheelRadius, startAngle, endAngle);
      ctx.lineTo(0, 0);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = "#FFF";
      ctx.lineWidth = 4;
      ctx.stroke();

      // Dessiner le texte du nom
      ctx.save();
      ctx.rotate(startAngle + angleSlice / 2);
      ctx.textAlign = "right";
      ctx.font = "bold 16px Arial";
      ctx.fillStyle = "#FFF";
      ctx.shadowColor = "#000";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.fillText(participant.name, this.wheelRadius - 30, 6);
      ctx.restore();
    });

    ctx.restore();

    // Dessiner l'indicateur central avec relief
    const centerGradient = ctx.createRadialGradient(
      this.wheelCenter - 8,
      this.wheelCenter - 8,
      5,
      this.wheelCenter,
      this.wheelCenter,
      20,
    );
    centerGradient.addColorStop(0, "#FFFFFF");
    centerGradient.addColorStop(1, "#CCCCCC");
    ctx.fillStyle = centerGradient;
    ctx.beginPath();
    ctx.arc(this.wheelCenter, this.wheelCenter, 20, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Dessiner le pointeur en haut de la roue (triangle pointant vers le bas)
    ctx.fillStyle = "#FF1493";
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = -2;
    ctx.beginPath();
    ctx.moveTo(this.wheelCenter - 20, this.wheelCenter - this.wheelRadius - 25);
    ctx.lineTo(this.wheelCenter + 20, this.wheelCenter - this.wheelRadius - 25);
    ctx.lineTo(this.wheelCenter, this.wheelCenter - this.wheelRadius - 5);
    ctx.closePath();
    ctx.fill();
    ctx.shadowColor = "transparent";
  }

  /**
   * Lancer la roue avec momentum
   * Inspiré de l'approche CodePen Lucky Wheel (szsoma) :
   * on tourne d'un angle aléatoire, puis on détecte quel segment
   * se trouve sous le pointeur après l'arrêt — pas de pré-calcul du gagnant.
   */
  startSpin() {
    if (this.isSpinning || this.participants.length === 0) return;

    this.isSpinning = true;
    this.spinButton.disabled = true;
    this.winnerDisplay.style.display = "none";

    // Angle aléatoire : 8 à 12 tours complets + angle supplémentaire aléatoire
    const fullSpins = (8 + Math.floor(Math.random() * 5)) * 2 * Math.PI;
    const extraAngle = Math.random() * 2 * Math.PI;
    this.winningRotation = this.currentRotation + fullSpins + extraAngle;

    this.animateSpin();
  }

  /**
   * Animer la rotation de la roue, puis détecter le gagnant par position
   */
  animateSpin() {
    const startRotation = this.currentRotation;
    const duration = 5500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeProgress = this.easeOutCubic(progress);
      this.currentRotation =
        startRotation + (this.winningRotation - startRotation) * easeProgress;

      this.drawWheel();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isSpinning = false;

        // Détecter le gagnant : quel segment est sous le pointeur (12h = -π/2) ?
        const angleSlice = (2 * Math.PI) / this.participants.length;
        // Angle du pointeur relatif à la roue, normalisé dans [0, 2π)
        const pointerRelative =
          (((-Math.PI / 2 - this.currentRotation) % (2 * Math.PI)) +
            2 * Math.PI) %
          (2 * Math.PI);
        const winnerIndex =
          Math.floor(pointerRelative / angleSlice) % this.participants.length;
        this.showWinner(winnerIndex);
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Ease-out cubic pour l'animation
   */
  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * Ease-out exponential pour plus d'inertie
   */
  easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  /**
   * Assombrir une couleur
   */
  darkenColor(color, percent) {
    const num = parseInt(color.replace(/^#/, ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
    const B = Math.max(0, (num & 0x0000ff) - amt);
    return (
      "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
    );
  }

  /**
   * Afficher le gagnant avec une belle animation
   */
  showWinner(winnerIndex) {
    const winner = this.participants[winnerIndex];

    // Afficher l'écran du gagnant
    this.winnerDisplay.style.display = "flex";
    const winnerName = this.winnerDisplay.querySelector(".winner-name");
    const winnerMedal = this.winnerDisplay.querySelector(".winner-medal");

    winnerName.textContent = winner.name;
    winnerMedal.textContent = "🏆";

    // Animation d'apparition
    this.winnerDisplay.classList.add("show-winner");

    // Ajouter un délai avant de permettre de relancer
    setTimeout(() => {
      this.spinButton.disabled = false;
      this.spinButton.classList.add("winner-mode");
      this.spinButton.textContent = "🎉 REJOUER";
    }, 2000);
  }
}
