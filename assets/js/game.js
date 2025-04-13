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

// Variables du jeu
let canvas, ctx;
let player = {
  x: 0,
  y: 0,
  width: 50,
  height: 30,
  speed: 5,
};

let bullets = [];
let hails = [];
let score = 0;
let gameInterval;
let hailInterval;
let playerInfo = {};
let gameSpeed = 1;
let keys = {};
let lastScoreUpdate = 0; // Pour suivre la dernière mise à jour du score

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
    score: score.toFixed(2),
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
    li.innerHTML = `${index + 1}. ${entry.nickname} <span>${
      entry.score
    }</span>`;
    leaderboardList.appendChild(li);
  });
}

// Initialiser le jeu
function initGame() {
  canvas = document.getElementById("game-canvas");
  ctx = canvas.getContext("2d");

  // Positionner le joueur
  player.x = canvas.width / 2 - player.width / 2;
  player.y = canvas.height - player.height - 10;

  // Initialiser les épis de maïs
  initCornStalks();

  // Démarrer le compteur de temps pour le score
  startTime = Date.now();

  // Ajouter les écouteurs d'événements pour le clavier
  window.addEventListener("keydown", function (e) {
    keys[e.key] = true;
  });

  window.addEventListener("keyup", function (e) {
    keys[e.key] = false;
  });

  // Démarrer la boucle du jeu
  gameInterval = setInterval(gameLoop, 1000 / 60); // 60 FPS

  // Générer des grêlons à intervalles réguliers
  hailInterval = setInterval(createHail, 1000);

  // Démarrer avec un score de 0
  score = 0;
  updateScore();
}

// Initialise les épis de maïs
function initCornStalks() {
  cornStalks = [];
  const cornWidth = Math.floor(canvas.width / CORN_COUNT);

  for (let i = 0; i < CORN_COUNT; i++) {
    cornStalks.push({
      x: i * cornWidth,
      y: canvas.height - 40,
      width: cornWidth - 2, // Petit espace entre les épis
      height: 40,
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

  // Déplacer et dessiner le joueur
  movePlayer();
  drawPlayer();

  // Déplacer et dessiner les balles
  moveBullets();
  drawBullets();

  // Déplacer et dessiner les grêlons
  moveHails();
  drawHails();

  // Vérifier les collisions
  checkCollisions();

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
      ctx.fillRect(
        stalk.x + stalk.width / 2 - 2,
        stalk.y + 10,
        4,
        stalk.height - 10
      );

      // Épi de maïs (forme cylindrique jaune)
      ctx.fillStyle = "#FFC107"; // Jaune maïs
      ctx.beginPath();
      ctx.ellipse(
        stalk.x + stalk.width / 2,
        stalk.y + 10,
        stalk.width / 3,
        15,
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
        5,
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
            stalk.x + stalk.width / 2 - 5 + j * 5,
            stalk.y + 7 + i * 2,
            1,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }

      // Feuilles de maïs
      ctx.fillStyle = "#66BB6A"; // Vert clair
      ctx.beginPath();
      ctx.moveTo(stalk.x + stalk.width / 2, stalk.y + 20);
      ctx.quadraticCurveTo(
        stalk.x + stalk.width / 2 - 15,
        stalk.y + 30,
        stalk.x + stalk.width / 2 - 25,
        stalk.y + 25
      );
      ctx.lineTo(stalk.x + stalk.width / 2, stalk.y + 35);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(stalk.x + stalk.width / 2, stalk.y + 25);
      ctx.quadraticCurveTo(
        stalk.x + stalk.width / 2 + 15,
        stalk.y + 35,
        stalk.x + stalk.width / 2 + 25,
        stalk.y + 30
      );
      ctx.lineTo(stalk.x + stalk.width / 2, stalk.y + 40);
      ctx.fill();
    }
  }
}

function movePlayer() {
  // Permettre au joueur d'aller jusqu'au bord complet de l'écran
  if (keys["ArrowLeft"] && player.x > -player.width / 3) {
    player.x -= player.speed;
  }
  if (keys["ArrowRight"] && player.x < canvas.width - player.width * 2 / 3) {
    player.x += player.speed;
  }
  if (keys[" "] && bullets.length < 5) {
    // Éviter le spam en limitant le nombre de balles
    createBullet();
    // Réinitialiser la touche espace pour éviter les tirs continus
    keys[" "] = false;
  }
}

function drawPlayer() {
  // Corps du véhicule
  ctx.fillStyle = "#007540";
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // Ajouter un canon sur le dessus
  ctx.fillStyle = "#005a32";
  ctx.fillRect(player.x + player.width / 2 - 5, player.y - 10, 10, 10);
  
  // Ajouter le texte "G2S" en blanc
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 16px Arial";
  ctx.textAlign = "center";
  ctx.fillText("G2S", player.x + player.width / 2, player.y + player.height / 2 + 5);
  
  // Ajouter des roues (deux cercles noirs à gauche et à droite)
  ctx.fillStyle = "#000000";
  // Roue gauche
  ctx.beginPath();
  ctx.arc(player.x + 10, player.y + player.height, 6, 0, Math.PI * 2);
  ctx.fill();
  // Roue droite
  ctx.beginPath();
  ctx.arc(player.x + player.width - 10, player.y + player.height, 6, 0, Math.PI * 2);
  ctx.fill();
}

function createBullet() {
  bullets.push({
    x: player.x + player.width / 2 - 5,
    y: player.y - 10,
    width: 5,
    height: 10,
    speed: 7,
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
  const size = Math.random() * 10 + 15; // Taille entre 15 et 25
  hails.push({
    x: Math.random() * (canvas.width - size),
    y: -size,
    size: size,
    speed: (Math.random() * 2 + 1) * gameSpeed,
  });

  // Augmenter la fréquence des grêlons avec le temps
  if (gameSpeed > 1.5 && Math.random() > 0.7) {
    createHail();
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
    ctx.fillStyle = "#a8cef0";
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

        // Supprimer le grêlon
        hails.splice(j, 1);
        j--;

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

function checkGameOver() {
  // Vérifier s'il reste des épis de maïs vivants
  const remainingCornStalks = cornStalks.filter((stalk) => stalk.alive).length;

  if (remainingCornStalks === 0) {
    endGame();
  }
}

function updateScore() {
  // Calculer le score basé sur le temps écoulé depuis le début du jeu
  const elapsedTime = (Date.now() - startTime) / 1000; // Convertir en secondes
  score = elapsedTime;
  currentScoreEl.textContent = score.toFixed(2);
}

function endGame() {
  // Arrêter les intervalles
  clearInterval(gameInterval);
  clearInterval(hailInterval);

  // Calculer le score final en secondes
  const finalScore = (Date.now() - startTime) / 1000;

  // Afficher l'écran de fin
  gameCanvas.style.display = "none";
  scoreDisplay.style.display = "none";
  gameOverScreen.style.display = "block";

  // Afficher le score final avec 2 décimales
  finalScoreEl.textContent = finalScore.toFixed(2);

  // Sauvegarder le score (on passe directement le finalScore)
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
});
