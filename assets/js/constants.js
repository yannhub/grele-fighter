// constants.js - Définition des constantes du jeu

// Dimensions de base
export const BASE_WIDTH = 600; // Largeur de référence du canvas
export const BASE_HEIGHT = 400; // Hauteur de référence du canvas

// Variables de temps
export const GAME_TIME_IN_SECS = 180; // 3 minutes de jeu
export const FPS = 60; // Images par seconde pour la boucle de jeu
export const FRAME_DURATION = 1000 / FPS;

// Taux de difficulté progressive
export const DIFFICULTY_INCREASE_RATE = 1 / (GAME_TIME_IN_SECS * FPS);
export const MAX_SPEED_MULTIPLIER = 3; // Vitesse maximale des grêlons

// Paramètres du joueur
export const PLAYER_DEFAULT = {
  width: 50,
  height: 30,
  speed: 5,
  fireRate: 300, // Cadence de tir en ms (250ms par défaut)
};

// Paramètres du canon du joueur
export const PLAYER_CANON = {
  width: 10,
  height: 10,
  yOffset: 6, // Décalage vertical du joueur par rapport au bas
};

// Paramètres d'affichage du joueur
export const PLAYER_DISPLAY = {
  fontSize: 16,
  textOffsetY: 5,
  wheelRadius: 6,
  wheelOffsetX: 10,
  textColor: "#FFFFFF",
  bodyColor: "#007540",
  canonColor: "#005a32",
  wheelColor: "#000000",
};

// Paramètres des munitions
export const BULLET_DEFAULT = {
  width: 5,
  height: 10,
  speed: 7,
  diagonalSpeedMultiplier: 0.9,
  diagonalOffsetX: 2,
  color: "#ffeb3b",
};

// Paramètres des grêlons
export const HAIL_DEFAULT = {
  minSize: 20,
  maxSize: 25,
  speed: 1,
  createInterval: 1000, // Intervalle de création (1s)
  points: 10, // Points par grêlon détruit
  minInterval: 20, // Intervalle minimal
  intervalReduction: 500,
  color: "#6495ED", // Couleur des grêlons
  highlightColor: "#FFFFFF", // Couleur de la brillance
};

// Paramètres des épis de maïs
export const CORN_COUNT = 20;
export const CORN_DEFAULT = {
  height: 40,
  points: 100, // Points par épi sauvé
  gap: 2, // Espace entre les épis
  stemWidth: 4,
  stemOffsetY: 10,
  clobWidth: 3, // Diviseur pour largeur de l'épi
  clobHeight: 15,
  silkRadius: 6, // Diviseur pour rayon des soies
  silkHeight: 5,
  grainRadius: 1,
  grainSpacingX: 5,
  grainSpacingY: 2,
  grainCountX: 3,
  grainCountY: 8,
  leafOffset1: 15,
  leafOffset2: 25,
  leafOffset3: 35,
  leafOffset4: 40,
  recoverCount: 5, // Nombre d'épis à récupérer avec le bonus
};

// Couleurs des épis de maïs
export const CORN_COLORS = {
  stem: "#4CAF50", // Tige verte
  cob: "#FFC107", // Jaune maïs
  silk: "#8D6E63", // Soies marron
  grain: "#FFD54F", // Grains jaune doré
  leaf: "#66BB6A", // Feuilles vert clair
  dyingRedStart: 255,
  dyingRedEnd: 19,
  dyingGreenStart: 193,
  dyingGreenEnd: 69,
  dyingBlueValue: 19,
};

// Paramètres des gouttes du nuage d'orage
export const CLOUD_DROPS_DEFAULT = {
  minSize: 10, // Taille minimale des gouttes
  maxSize: 15, // Taille maximale des gouttes
  speed: 3, // Vitesse de chute
  createInterval: 500, // Intervalle de création (500ms)
  color: "#9932cc", // Couleur des gouttes (bleu cornflower)
  highlightColor: "#FFFFFF", // Couleur de la brillance
  points: 50, // Points par goutte détruite
};

// Paramètres du nuage d'orage
export const STORM_CLOUD = {
  width: 120,
  height: 60,
  posY: 50,
  speed: 1,
  duration: 10000, // 10 secondes
};

// Paramètres des bonus/malus
export const POWERUP_DEFAULT = {
  size: 30,
  speed: 2,
  createInterval: 10000, // Intervalle de création (10s)
  bonusProbability: 0.8, // 80% de chance d'obtenir un bonus vs. malus
};

// Couleurs du fond
export const BACKGROUND = {
  skyTop: "#87CEEB", // Bleu ciel en haut
  skyBottom: "#B0E2FF", // Bleu ciel plus clair en bas
};

// Paramètres de l'interface
export const UI = {
  gamePadding: 40,
  maxHeightRatio: 0.8,
  aspectRatio: 0.7,
};

// Types de bonus/malus avec leurs caractéristiques
export const POWERUP_TYPES = {
  // Bonus (effets positifs)
  RAPID_FIRE: {
    name: "Cadence Rapide",
    color: "#32CD32",
    good: true,
    icon: "⚡",
    duration: 15000,
  },
  PARALLEL_BULLETS: {
    name: "Tirs Parallèles",
    color: "#1E90FF",
    good: true,
    icon: "⋔",
    duration: 12000,
  },
  DIAGONAL_BULLETS: {
    name: "Tirs Diagonaux",
    color: "#9932CC",
    good: true,
    icon: "✕",
    duration: 12000,
  },
  SPEED_UP: {
    name: "Vitesse Améliorée",
    color: "#00BFFF",
    good: true,
    icon: "➤",
    duration: 10000,
  },
  RECOVER_CORN: {
    name: "Récupération de Maïs",
    color: "#FFD700", // Or
    good: true,
    icon: "🌽",
    duration: 1000, // Effet immédiat
  },

  // Malus (effets négatifs)
  SLOW_DOWN: {
    name: "Ralentissement",
    color: "#B22222",
    good: false,
    icon: "⊗",
    duration: 8000,
  },
  STORM_CLOUD: {
    name: "Nuage toxique",
    color: "#4B0082",
    good: false,
    icon: "☁",
    duration: 10000,
  },
};

// Paramètres des animations
export const ANIMATION = {
  particleCount: 1.5, // Multiplicateur pour le nombre de particules
  fadeRate: 0.025, // Vitesse de disparition des particules
  shrinkRate: 0.98, // Taux de réduction de taille des particules
  dyingCornRotation: 0.01, // Vitesse de rotation des épis mourants
  dyingCornFade: 0.01, // Vitesse de disparition des épis mourants
};

// Noms de stockage local
export const STORAGE_KEY = "greleDefenseLeaderboard";
