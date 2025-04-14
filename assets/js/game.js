// Éléments DOM
const welcomeScreen = document.getElementById("welcome-screen");
const registerForm = document.getElementById("register-form");
const gameInstructions = document.getElementById("game-instructions");
const gameCanvas = document.getElementById("game-canvas");
const scoreDisplay = document.getElementById("score-display");
const currentScoreEl = document.getElementById("current-score");
const gameOverScreen = document.getElementById("game-over");
const finalScoreEl = document.getElementById("final-score");
const leaderboardList = document.getElementById("leaderboard-list");

// Boutons
const startBtn = document.getElementById("start-btn");
const submitInfoBtn = document.getElementById("submit-info");
const playBtn = document.getElementById("play-btn");
const playAgainBtn = document.getElementById("play-again-btn");
const testModeBtn = document.getElementById("test-mode-btn");

// Variables du jeu
let canvas, ctx;
let player = {
  x: 0,
  y: 0,
  width: 50, // Sera redimensionné en fonction du canvas
  height: 30, // Sera redimensionné en fonction du canvas
  speed: 5, // Sera redimensionné en fonction du canvas
};

// Facteurs de dimensionnement pour adapter les éléments à la taille du viewport
let scaleFactor = 1;
let baseWidth = 600; // Largeur de référence du canvas
let baseHeight = 400; // Hauteur de référence du canvas

let bullets = [];
let hails = [];
let score = 0;
let gameInterval;
let hailInterval;
let timerInterval;
let playerInfo = {};
let gameSpeed = 1;
let keys = {};
let lastKeyStates = {}; // Pour suivre l'état précédent des touches
let hailsDestroyed = 0; // Compteur de grêlons détruits
let gameTimeInSecs = 120; // 2 minutes
let timeRemaining = gameTimeInSecs; // Temps restant en secondes
let gameEndReason = ""; // Raison de fin de partie ("time" ou "corn")
let lastFireTime = 0; // Temps du dernier tir
let fireRate = 250; // Cadence de tir en millisecondes (250ms par défaut)

// Tableaux pour les animations
let hailParticles = []; // Animation de particules d'éclatement des grêlons
let dyingCorns = []; // Animation des épis qui se fanent

// Tableau des épis de maïs
let cornStalks = [];
const CORN_COUNT = 20;
let startTime = 0; // Pour calculer le temps de survie

// Gestion du localStorage pour les scores
function getLeaderboard() {
  const leaderboard =
    JSON.parse(localStorage.getItem("greleDefenseLeaderboard")) || [];
  return leaderboard;
}

function saveScore(playerInfo, score) {
  let leaderboard = getLeaderboard();

  // Créer une entrée pour le nouveau score
  const entry = {
    firstname: playerInfo.firstname,
    lastname: playerInfo.lastname,
    nickname:
      playerInfo.nickname ||
      `${playerInfo.firstname} ${playerInfo.lastname.charAt(0)}.`,
    email: playerInfo.email || "",
    organization: playerInfo.organization || "",
    score: score,
    date: new Date().toISOString(),
  };

  // Ajouter le nouveau score
  leaderboard.push(entry);

  // Trier par score décroissant
  leaderboard.sort((a, b) => b.score - a.score);

  // Limiter à 10 entrées
  if (leaderboard.length > 10) {
    leaderboard = leaderboard.slice(0, 10);
  }

  // Sauvegarder dans le localStorage
  localStorage.setItem("greleDefenseLeaderboard", JSON.stringify(leaderboard));

  // Mettre à jour l'affichage
  updateLeaderboardDisplay();
}

function updateLeaderboardDisplay() {
  const leaderboard = getLeaderboard();
  leaderboardList.innerHTML = "";

  if (leaderboard.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Pas encore de scores";
    leaderboardList.appendChild(li);
    return;
  }

  leaderboard.forEach((entry, index) => {
    const li = document.createElement("li");
    li.innerHTML = `${index + 1}. ${
      entry.nickname
    } <span class="organization">${
      entry.organization
    }</span> <span class="score">${entry.score}</span>`;

    // Créer un attribut data pour stocker les informations complètes du joueur
    li.setAttribute(
      "data-player-info",
      JSON.stringify({
        nom: `${entry.firstname} ${entry.lastname}`,
        pseudo: entry.nickname,
        email: entry.email,
        organisation: entry.organization,
        score: entry.score,
        date: new Date(entry.date).toLocaleDateString("fr-FR"),
      })
    );

    // Ajouter la classe pour le style de la tooltip
    li.classList.add("leaderboard-entry");

    leaderboardList.appendChild(li);
  });

  // Ajouter les écouteurs d'événements pour le survol
  setupLeaderboardTooltips();
}

// Fonction pour configurer les tooltips au survol
function setupLeaderboardTooltips() {
  const entries = document.querySelectorAll(".leaderboard-entry");

  // Créer un élément tooltip s'il n'existe pas déjà
  let tooltip = document.getElementById("player-tooltip");
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.id = "player-tooltip";
    tooltip.className = "player-tooltip";
    document.body.appendChild(tooltip);
  }

  entries.forEach((entry) => {
    entry.addEventListener("mouseenter", function (e) {
      const playerInfo = JSON.parse(this.getAttribute("data-player-info"));

      // Formatter le contenu de la tooltip
      tooltip.innerHTML = `
        <div class="tooltip-content">
          <h3>${playerInfo.pseudo}</h3>
          <p><strong>Nom:</strong> ${playerInfo.nom}</p>
          <p><strong>Email:</strong> ${playerInfo.email}</p>
          <p><strong>Organisation:</strong> ${playerInfo.organisation}</p>
          <p><strong>Score:</strong> ${playerInfo.score}</p>
          <p><strong>Date:</strong> ${playerInfo.date}</p>
        </div>
      `;

      // Positionner la tooltip près de l'élément survolé
      const rect = this.getBoundingClientRect();
      tooltip.style.display = "block";

      // Calculer la largeur de la fenêtre
      const windowWidth = window.innerWidth;

      // Calculer si la tooltip déborde à droite (en laissant une marge de 20px)
      const tooltipWidth = tooltip.offsetWidth;
      const rightOverflow = rect.right + tooltipWidth + 20 > windowWidth;

      // Si la tooltip déborde à droite, l'afficher à gauche de l'élément
      if (rightOverflow) {
        tooltip.style.left = `${rect.left - tooltipWidth - 10}px`;
      } else {
        tooltip.style.left = `${rect.right + 10}px`;
      }

      tooltip.style.top = `${rect.top}px`;
    });

    entry.addEventListener("mouseleave", function () {
      tooltip.style.display = "none";
    });
  });
}

// Fonction pour ajuster la taille du canvas et des éléments de jeu
function resizeGame() {
  const gameArea = document.querySelector(".game-area");
  const gameAreaWidth = gameArea.clientWidth - 40; // -40 pour le padding
  const gameAreaHeight = Math.min(
    window.innerHeight * 0.8,
    gameAreaWidth * 0.7
  );

  // Ajuster la taille du canvas
  canvas.width = gameAreaWidth;
  canvas.height = gameAreaHeight;

  // Calculer le facteur d'échelle par rapport à la taille de référence
  scaleFactor = Math.min(canvas.width / baseWidth, canvas.height / baseHeight);

  // Ajuster la taille du joueur en fonction du nouveau facteur d'échelle
  player.width = 50 * scaleFactor;
  player.height = 30 * scaleFactor;
  player.speed = 5 * scaleFactor;

  // Repositionner le joueur
  player.x = canvas.width / 2 - player.width / 2;
  player.y = canvas.height - player.height - 6 * scaleFactor;
  // Reinitialiser les épis de maïs avec les bonnes dimensions
  if (cornStalks.length > 0) {
    initCornStalks();
  }

  // Ajuster la taille et position des balles
  for (let bullet of bullets) {
    bullet.width = 5 * scaleFactor;
    bullet.height = 10 * scaleFactor;
    bullet.speed = 7 * scaleFactor;
  }

  // Ajuster la taille et position des grêlons
  for (let hail of hails) {
    hail.size = hail.size * scaleFactor;
    hail.speed = hail.speed * scaleFactor;
  }
}

// Met à jour l'affichage du timer
function updateTimer() {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timerDisplay = document.getElementById("timer");
  timerDisplay.textContent = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

// Initialiser le jeu
function initGame() {
  canvas = document.getElementById("game-canvas");
  ctx = canvas.getContext("2d");

  // Réinitialiser les variables du jeu
  score = 0;
  timeRemaining = gameTimeInSecs;
  hailsDestroyed = 0;
  gameEndReason = "";
  lastKeyStates = {}; // Réinitialiser l'état des touches

  // Adapter la taille du canvas à son conteneur
  resizeGame();

  // Initialiser les épis de maïs
  initCornStalks();

  // Ajouter les écouteurs d'événements pour le clavier
  window.addEventListener("keydown", function (e) {
    keys[e.key] = true;
  });

  window.addEventListener("keyup", function (e) {
    keys[e.key] = false;
  });

  // Écouter les changements de taille d'écran
  window.addEventListener("resize", resizeGame);

  // Afficher le timer initial
  updateTimer();

  // Démarrer le timer
  timerInterval = setInterval(function () {
    timeRemaining--;
    updateTimer();

    // Vérifier si le temps est écoulé
    if (timeRemaining <= 0) {
      gameEndReason = "time";
      endGame();
    }
  }, 1000);

  // Démarrer la boucle du jeu
  gameInterval = setInterval(gameLoop, 1000 / 60); // 60 FPS

  // Générer des grêlons à intervalles réguliers
  hailInterval = setInterval(createHail, 1500);

  // Mettre à jour l'affichage du score
  updateScore();
}

// Initialise les épis de maïs
function initCornStalks() {
  cornStalks = [];
  const cornWidth = Math.floor(canvas.width / CORN_COUNT);
  const cornHeight = 40 * scaleFactor;

  for (let i = 0; i < CORN_COUNT; i++) {
    cornStalks.push({
      x: i * cornWidth,
      y: canvas.height - cornHeight,
      width: cornWidth - 2, // Petit espace entre les épis
      height: cornHeight,
      alive: true,
    });
  }
}

// Fonctions du jeu
function gameLoop() {
  // Effacer le canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Dessiner le fond (champ de maïs)
  drawBackground();

  // Déplacer et dessiner les grêlons
  moveHails();
  drawHails();

  // Déplacer et dessiner le joueur
  movePlayer();
  drawPlayer();

  // Déplacer et dessiner les balles
  moveBullets();
  drawBullets();

  // Vérifier les collisions
  checkCollisions();

  // Dessiner les animations
  drawHailParticles();
  drawDyingCorns();

  // Augmenter progressivement la difficulté
  gameSpeed += 0.0005;

  // Mettre à jour le score basé sur le temps écoulé
  updateScore();
}

function drawBackground() {
  // Créer un dégradé de bleu pour le ciel
  const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  skyGradient.addColorStop(0, "#87CEEB"); // Bleu ciel en haut
  skyGradient.addColorStop(1, "#B0E2FF"); // Bleu ciel plus clair en bas

  // Appliquer le fond bleu
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Dessiner les épis de maïs en bas du canvas
  drawCornStalks();
}

function drawCornStalks() {
  for (const stalk of cornStalks) {
    if (stalk.alive) {
      // Tige de l'épi
      ctx.fillStyle = "#4CAF50"; // Vert
      const stemWidth = 4 * scaleFactor;
      ctx.fillRect(
        stalk.x + stalk.width / 2 - stemWidth / 2,
        stalk.y + 10 * scaleFactor,
        stemWidth,
        stalk.height - 10 * scaleFactor
      );

      // Épi de maïs (forme cylindrique jaune)
      ctx.fillStyle = "#FFC107"; // Jaune maïs
      ctx.beginPath();
      ctx.ellipse(
        stalk.x + stalk.width / 2,
        stalk.y + 10 * scaleFactor,
        stalk.width / 3,
        15 * scaleFactor,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Soies du maïs (filaments marrons au sommet)
      ctx.fillStyle = "#8D6E63"; // Marron
      ctx.beginPath();
      ctx.ellipse(
        stalk.x + stalk.width / 2,
        stalk.y,
        stalk.width / 6,
        5 * scaleFactor,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Grains de maïs (points)
      ctx.fillStyle = "#FFD54F"; // Jaune doré
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 3; j++) {
          ctx.beginPath();
          ctx.arc(
            stalk.x + stalk.width / 2 - 5 * scaleFactor + j * 5 * scaleFactor,
            stalk.y + 7 * scaleFactor + i * 2 * scaleFactor,
            1 * scaleFactor,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }

      // Feuilles de maïs
      ctx.fillStyle = "#66BB6A"; // Vert clair
      ctx.beginPath();
      ctx.moveTo(stalk.x + stalk.width / 2, stalk.y + 20 * scaleFactor);
      ctx.quadraticCurveTo(
        stalk.x + stalk.width / 2 - 15 * scaleFactor,
        stalk.y + 30 * scaleFactor,
        stalk.x + stalk.width / 2 - 25 * scaleFactor,
        stalk.y + 25 * scaleFactor
      );
      ctx.lineTo(stalk.x + stalk.width / 2, stalk.y + 35 * scaleFactor);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(stalk.x + stalk.width / 2, stalk.y + 25 * scaleFactor);
      ctx.quadraticCurveTo(
        stalk.x + stalk.width / 2 + 15 * scaleFactor,
        stalk.y + 35 * scaleFactor,
        stalk.x + stalk.width / 2 + 25 * scaleFactor,
        stalk.y + 30 * scaleFactor
      );
      ctx.lineTo(stalk.x + stalk.width / 2, stalk.y + 40 * scaleFactor);
      ctx.fill();
    }
  }
}

function movePlayer() {
  // Permettre au joueur d'aller jusqu'au bord complet de l'écran
  if (keys["ArrowLeft"] && player.x > -player.width / 3) {
    player.x -= player.speed;
  }
  if (keys["ArrowRight"] && player.x < canvas.width - (player.width * 2) / 3) {
    player.x += player.speed;
  }
  
  // Vérifier si espace vient d'être pressé (nouvel appui)
  const spaceJustPressed = keys[" "] && !lastKeyStates[" "];
  
  // Si espace vient juste d'être pressé, permettre un tir immédiat (contourne la cadence)
  if (spaceJustPressed && bullets.length < 5) {
    createBullet();
    lastFireTime = Date.now();
  }
  // Sinon, si espace est maintenu, respecter la cadence normale
  else if (keys[" "] && bullets.length < 5) {
    const currentTime = Date.now();
    if (currentTime - lastFireTime >= fireRate) {
      createBullet();
      lastFireTime = currentTime;
    }
  }
  
  // Mettre à jour l'état précédent des touches
  lastKeyStates = {...keys};
}

function drawPlayer() {
  // Corps du véhicule
  ctx.fillStyle = "#007540";
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // Ajouter un canon sur le dessus
  const canonWidth = 10 * scaleFactor;
  const canonHeight = 10 * scaleFactor;
  ctx.fillStyle = "#005a32";
  ctx.fillRect(
    player.x + player.width / 2 - canonWidth / 2,
    player.y - canonHeight,
    canonWidth,
    canonHeight
  );

  // Ajouter le texte "G2S" en blanc
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `bold ${16 * scaleFactor}px Arial`;
  ctx.textAlign = "center";
  ctx.fillText(
    "G2S",
    player.x + player.width / 2,
    player.y + player.height / 2 + 5 * scaleFactor
  );

  // Ajouter des roues (deux cercles noirs à gauche et à droite)
  const wheelRadius = 6 * scaleFactor;
  ctx.fillStyle = "#000000";
  // Roue gauche
  ctx.beginPath();
  ctx.arc(
    player.x + 10 * scaleFactor,
    player.y + player.height,
    wheelRadius,
    0,
    Math.PI * 2
  );
  ctx.fill();
  // Roue droite
  ctx.beginPath();
  ctx.arc(
    player.x + player.width - 10 * scaleFactor,
    player.y + player.height,
    wheelRadius,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

function createBullet() {
  const bulletWidth = 5 * scaleFactor;
  const bulletHeight = 10 * scaleFactor;
  const bulletSpeed = 7 * scaleFactor;
  const canonHeight = 10 * scaleFactor;

  bullets.push({
    x: player.x + player.width / 2 - bulletWidth / 2,
    y: player.y - canonHeight,
    width: bulletWidth,
    height: bulletHeight,
    speed: bulletSpeed,
  });
}

function moveBullets() {
  for (let i = 0; i < bullets.length; i++) {
    bullets[i].y -= bullets[i].speed;

    // Supprimer les balles qui sortent de l'écran
    if (bullets[i].y < 0) {
      bullets.splice(i, 1);
      i--;
    }
  }
}

function drawBullets() {
  ctx.fillStyle = "#ffeb3b";
  for (const bullet of bullets) {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  }
}

function createHail() {
  const baseSize = Math.random() * 5 + 20;
  const size = baseSize * scaleFactor;

  // Limiter l'augmentation de la vitesse des grêlons
  // Utiliser Math.min pour plafonner la vitesse maximale à 1.6 fois la vitesse initiale
  const cappedSpeed = Math.min(gameSpeed, 1.6) * scaleFactor;

  hails.push({
    x: Math.random() * (canvas.width - size),
    y: -size,
    size: size,
    speed: cappedSpeed,
  });

  // Augmenter fortement la fréquence des grêlons avec une progression douce
  // Probabilité croissante plus aggressive pour le nombre
  // À gameSpeed = 1, probabilité = 0.05 (5%)
  // À gameSpeed = 1.5, probabilité = 0.25 (25%)
  // À gameSpeed = 2, probabilité = 0.40 (40%)
  // À gameSpeed = 2.5, probabilité = 0.50 (50%)
  const extraHailProbability = Math.min(0.05 + (gameSpeed - 1) * 0.4, 0.6);

  // Chance d'avoir un second grêlon
  if (gameSpeed > 1 && Math.random() < extraHailProbability) {
    setTimeout(() => {
      // Créer un grêlon avec un léger décalage pour une meilleure répartition
      const newSize = (Math.random() * 5 + 20) * scaleFactor;
      hails.push({
        x: Math.random() * (canvas.width - newSize),
        y: -newSize,
        size: newSize,
        speed: cappedSpeed,
      });
    }, Math.random() * 200); // Décalage aléatoire jusqu'à 200ms
  }

  // Chance d'avoir un troisième grêlon à des niveaux plus élevés
  if (gameSpeed > 1.8 && Math.random() < extraHailProbability - 0.2) {
    setTimeout(() => {
      const newSize = (Math.random() * 5 + 20) * scaleFactor;
      hails.push({
        x: Math.random() * (canvas.width - newSize),
        y: -newSize,
        size: newSize,
        speed: cappedSpeed,
      });
    }, Math.random() * 350); // Décalage aléatoire plus important
  }
}

function moveHails() {
  for (let i = 0; i < hails.length; i++) {
    hails[i].y += hails[i].speed;

    // Supprimer les grêlons qui sortent de l'écran
    if (hails[i].y > canvas.height + hails[i].size) {
      hails.splice(i, 1);
      i--;
    }
  }
}

function drawHails() {
  for (const hail of hails) {
    // Dessiner un grêlon (cercle blanc/bleuté)
    ctx.fillStyle = "#6495ED";
    ctx.beginPath();
    ctx.arc(
      hail.x + hail.size / 2,
      hail.y + hail.size / 2,
      hail.size / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Ajouter un effet de brillance
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(
      hail.x + hail.size / 3,
      hail.y + hail.size / 3,
      hail.size / 6,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
}

function checkCollisions() {
  // Vérifier les collisions entre les balles et les grêlons
  for (let i = 0; i < bullets.length; i++) {
    const bullet = bullets[i];

    for (let j = 0; j < hails.length; j++) {
      const hail = hails[j];

      // Vérifier la collision (simple boîte englobante)
      if (
        bullet.x < hail.x + hail.size &&
        bullet.x + bullet.width > hail.x &&
        bullet.y < hail.y + hail.size &&
        bullet.y + bullet.height > hail.y
      ) {
        // Collision détectée
        bullets.splice(i, 1);
        i--;

        // Créer une animation de particules à l'emplacement du grêlon
        createHailParticles(hail.x, hail.y, hail.size);

        // Supprimer le grêlon et augmenter le score
        hails.splice(j, 1);
        j--;

        // Ajouter 10 points au score et incrémenter le compteur de grêlons détruits
        score += 10;
        hailsDestroyed++;
        updateScore();

        break;
      }
    }
  }

  // Vérifier les collisions entre les grêlons et les épis de maïs
  for (let i = 0; i < hails.length; i++) {
    const hail = hails[i];

    for (let j = 0; j < cornStalks.length; j++) {
      const stalk = cornStalks[j];

      // Ne vérifier que si l'épi est encore vivant
      if (stalk.alive) {
        // Vérifier la collision (simple boîte englobante)
        if (
          hail.x + hail.size / 2 > stalk.x &&
          hail.x + hail.size / 2 < stalk.x + stalk.width &&
          hail.y + hail.size > stalk.y
        ) {
          // L'épi est touché
          stalk.alive = false;

          // Créer une animation d'épi qui se fane
          createDyingCorn(stalk.x, stalk.y, stalk.width, stalk.height);

          // Supprimer le grêlon
          hails.splice(i, 1);
          i--;

          // Vérifier si tous les épis sont morts
          checkGameOver();

          break;
        }
      }
    }
  }
}

function createHailParticles(x, y, size) {
  // Plus de particules pour de plus gros grêlons
  const particleCount = Math.floor(size * 1.5);

  // Créer des particules qui s'éparpillent dans toutes les directions
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2; // Angle aléatoire
    const speed = (Math.random() * 2 + 1) * scaleFactor; // Vitesse aléatoire

    hailParticles.push({
      x: x + size / 2,
      y: y + size / 2,
      size: Math.random() * 3 * scaleFactor + 1 * scaleFactor, // Taille variée
      speedX: Math.cos(angle) * speed, // Vitesse horizontale basée sur l'angle
      speedY: Math.sin(angle) * speed, // Vitesse verticale basée sur l'angle
      alpha: 1.0, // Opacité initiale
      color: Math.random() > 0.7 ? "#ffffff" : "#6495ED", // Mélange de bleu et blanc
    });
  }
}

function drawHailParticles() {
  for (let i = 0; i < hailParticles.length; i++) {
    const particle = hailParticles[i];

    // Dessiner une particule avec sa couleur propre
    ctx.fillStyle = particle.color.startsWith("#")
      ? `${particle.color}${Math.floor(particle.alpha * 255)
          .toString(16)
          .padStart(2, "0")}`
      : particle.color.replace(")", `, ${particle.alpha})`);

    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();

    // Mettre à jour la position et l'opacité
    particle.x += particle.speedX;
    particle.y += particle.speedY;
    particle.alpha -= 0.025; // Diminuer un peu plus vite pour une animation plus dynamique

    // Réduire légèrement la taille pour donner l'impression de fonte
    particle.size *= 0.98;

    // Supprimer la particule une fois qu'elle est presque transparente
    if (particle.alpha <= 0) {
      hailParticles.splice(i, 1);
      i--;
    }
  }
}

function createDyingCorn(x, y, width, height) {
  dyingCorns.push({
    x: x,
    y: y,
    width: width,
    height: height,
    alpha: 1.0, // Opacité initiale
    rotation: 0,
    color: "#FFC107", // Couleur de départ (jaune comme le maïs)
  });
}

function drawDyingCorns() {
  for (let i = 0; i < dyingCorns.length; i++) {
    const corn = dyingCorns[i];

    // Sauvegarder le contexte pour appliquer la rotation
    ctx.save();

    // Déplacer le point d'origine à la base de l'épi de maïs
    ctx.translate(corn.x + corn.width / 2, corn.y + corn.height);

    // Appliquer la rotation (pencher progressivement l'épi)
    ctx.rotate(corn.rotation);

    // Calculer la couleur intermédiaire entre jaune et marron
    const brownValue = Math.floor(139 * (1 - corn.alpha) + 255 * corn.alpha);
    const greenValue = Math.floor(69 * (1 - corn.alpha) + 193 * corn.alpha);
    const redValue = Math.floor(19 * (1 - corn.alpha) + 255 * corn.alpha);

    // Dessiner l'épi qui se fane
    // Tige de l'épi (qui devient marron progressivement)
    ctx.fillStyle = `rgba(${redValue}, ${greenValue}, 19, ${corn.alpha})`;
    const stemWidth = 4 * scaleFactor;
    ctx.fillRect(-stemWidth / 2, -corn.height, stemWidth, corn.height);

    // Épi de maïs (qui devient marron progressivement)
    ctx.fillStyle = `rgba(${redValue}, ${greenValue}, 19, ${corn.alpha})`;
    ctx.beginPath();
    ctx.ellipse(
      0,
      -corn.height + 10 * scaleFactor,
      corn.width / 3,
      15 * scaleFactor,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Restaurer le contexte
    ctx.restore();

    // Faire évoluer l'animation
    corn.alpha -= 0.01; // Diminuer l'opacité lentement
    corn.rotation += 0.01; // Augmenter la rotation (pencher l'épi)

    // Supprimer l'épi fané une fois que l'animation est terminée
    if (corn.alpha <= 0) {
      dyingCorns.splice(i, 1);
      i--;
    }
  }
}

function checkGameOver() {
  // Vérifier s'il reste des épis de maïs vivants
  const remainingCornStalks = cornStalks.filter((stalk) => stalk.alive).length;

  if (remainingCornStalks === 0) {
    // Définir la raison de fin de partie
    gameEndReason = "corn";
    endGame();
  }
}

function updateScore() {
  // Mettre à jour l'affichage du score
  currentScoreEl.textContent = score;
}

function endGame() {
  // Arrêter les intervalles
  clearInterval(gameInterval);
  clearInterval(hailInterval);
  clearInterval(timerInterval);

  // Calculer le score final incluant les bonus pour les maïs restants
  const remainingCornStalks = cornStalks.filter((stalk) => stalk.alive).length;
  const cornPoints = remainingCornStalks * 50;
  const hailPoints = hailsDestroyed * 10;
  const finalScore = hailPoints + cornPoints;

  // Afficher l'écran de fin
  gameCanvas.style.display = "none";
  scoreDisplay.style.display = "none";
  gameOverScreen.style.display = "block";

  // Remplir les détails du score final
  finalScoreEl.textContent = finalScore;
  document.getElementById("hails-destroyed").textContent = hailsDestroyed;
  document.getElementById("hails-points").textContent = hailPoints;
  document.getElementById("corn-saved").textContent = remainingCornStalks;
  document.getElementById("corn-points").textContent = cornPoints;

  // Message différent selon la raison de fin de partie
  const gameOverTitle = document.querySelector("#game-over h2");
  if (gameEndReason === "time") {
    gameOverTitle.textContent = "Temps écoulé!";
  } else if (gameEndReason === "corn") {
    gameOverTitle.textContent = "Tous vos maïs sont détruits!";
  }

  // Sauvegarder le score
  saveScore(playerInfo, finalScore);
}

// Navigation entre les écrans
startBtn.addEventListener("click", function () {
  welcomeScreen.style.display = "none";
  registerForm.style.display = "block";
});

registerForm.addEventListener("submit", function (e) {
  e.preventDefault();

  // Récupérer les informations du joueur
  playerInfo = {
    firstname: document.getElementById("firstname").value,
    lastname: document.getElementById("lastname").value,
    nickname: document.getElementById("nickname").value,
    email: document.getElementById("email").value,
    organization: document.getElementById("organization").value,
  };

  // Passer aux instructions
  registerForm.style.display = "none";
  gameInstructions.style.display = "block";
});

playBtn.addEventListener("click", function () {
  // Masquer les instructions et afficher le jeu
  gameInstructions.style.display = "none";
  gameCanvas.style.display = "block";
  scoreDisplay.style.display = "block";

  // Démarrer le jeu
  initGame();
});

playAgainBtn.addEventListener("click", function () {
  // Réinitialiser les éléments du jeu
  bullets = [];
  hails = [];
  gameSpeed = 1;

  // Masquer l'écran de fin
  gameOverScreen.style.display = "none";

  // Afficher le jeu
  gameCanvas.style.display = "block";
  scoreDisplay.style.display = "block";

  // Démarrer une nouvelle partie
  initGame();
});

// Initialiser le leaderboard au chargement
document.addEventListener("DOMContentLoaded", function () {
  updateLeaderboardDisplay();

  // Au chargement initial de la page, s'assurer que le canvas est caché
  // mais adapté à la taille de son conteneur
  canvas = document.getElementById("game-canvas");
  resizeGame();

  // Ajouter un écouteur d'événement pour le redimensionnement de la fenêtre
  window.addEventListener("resize", resizeGame);
});

// Fonction pour démarrer le mode test
function startTestMode() {
  // Configurer des informations de joueur par défaut
  playerInfo = {
    firstname: "Testeur",
    lastname: "G2S",
    nickname: "TesteurG2S",
    email: "testeur@g2s.com",
    organization: "G2S",
  };

  // Masquer l'écran d'accueil
  welcomeScreen.style.display = "none";

  // Afficher directement le canvas de jeu et le score
  gameCanvas.style.display = "block";
  scoreDisplay.style.display = "block";

  // Démarrer le jeu
  initGame();
}

// Ajouter l'écouteur d'événements au bouton de test
testModeBtn.addEventListener("click", startTestMode);
