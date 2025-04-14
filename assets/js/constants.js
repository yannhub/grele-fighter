// constants.js - Définition des constantes du jeu

// Dimensions de base
export const BASE_WIDTH = 600; // Largeur de référence du canvas
export const BASE_HEIGHT = 400; // Hauteur de référence du canvas

// Variables de temps
export const GAME_TIME_IN_SECS = 120; // 2 minutes de jeu

// Paramètres du joueur
export const PLAYER_DEFAULT = {
  width: 50,
  height: 30,
  speed: 5,
  fireRate: 250, // Cadence de tir en ms (250ms par défaut)
};

// Paramètres des munitions
export const BULLET_DEFAULT = {
  width: 5,
  height: 10,
  speed: 7,
};

// Paramètres des grêlons
export const HAIL_DEFAULT = {
  minSize: 20,
  maxSize: 25,
  speed: 1,
  createInterval: 1000, // Intervalle de création (1s)
  points: 10, // Points par grêlon détruit
};

// Paramètres des épis de maïs
export const CORN_COUNT = 20;
export const CORN_DEFAULT = {
  height: 40,
  points: 50, // Points par épi sauvé
};

// Taux de difficulté progressive
export const DIFFICULTY_INCREASE_RATE = 0.0005;
export const MAX_SPEED_MULTIPLIER = 1.6; // Vitesse maximale des grêlons (x1.6)

// Paramètres des bonus/malus
export const POWERUP_DEFAULT = {
  size: 30,
  speed: 2,
  createInterval: 10000, // Intervalle de création (10s)
  bonusProbability: 0.7, // 70% de chance d'obtenir un bonus vs. malus
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
    name: "Nuage d'Orage",
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
