// creperie-constants.js — Configuration du jeu La Crêperie

export const GAME_DURATION = 90; // secondes
export const MAX_HEARTS = 3;
export const BILIG_COOK_TIME = 5500; // ms de cuisson

// Ratios de mise en page (fraction de la hauteur du canvas)
export const COUNTER_Y_RATIO = 0.48; // bord supérieur du comptoir
export const COUNTER_HEIGHT_RATIO = 0.18; // hauteur du comptoir
export const PLAYER_Y_RATIO = 0.74; // centre Y du joueur (en dessous du comptoir)

// Joueur
export const PLAYER_SPEED = 560; // px/sec
export const MAX_HANDS = 3;
export const PLAYER_SIZE = 92; // px (hauteur du sprite)

// Bonus Assurance G2S
export const BONUS_DURATION = 15;       // secondes
export const BONUS_COOK_SPEEDUP = 2.5;  // multiplicateur de vitesse de cuisson
export const BONUS_AUTO_SPEED_RATIO = 0.85; // vitesse relative du joueur auto

// Types de postes
export const ST = {
  BATTER: "BATTER",
  BILIG: "BILIG",
  BUTTER: "BUTTER",
  SUGAR: "SUGAR",
  CHOCOLATE: "CHOCOLATE",
  STRAWBERRY: "STRAWBERRY",
  LEMON: "LEMON",
  WHIPPED_CREAM: "WHIPPED_CREAM",
  DELIVERY: "DELIVERY",
  TRASH: "TRASH",
};

// Types d'items (ce que le joueur peut tenir en main)
export const IT = {
  BATTER: "BATTER",
  ASSEMBLED_CREPE: "ASSEMBLED_CREPE",
  BUTTER: "BUTTER",
  SUGAR: "SUGAR",
  CHOCOLATE: "CHOCOLATE",
  STRAWBERRY: "STRAWBERRY",
  LEMON: "LEMON",
  WHIPPED_CREAM: "WHIPPED_CREAM",
};

// Disposition des postes : de gauche à droite le long du comptoir
// xRatio = centre x en fraction de la largeur du canvas
export const STATION_LAYOUT = [
  { type: ST.BATTER, label: "Pâte", xRatio: 0.06 },
  { type: ST.BILIG, label: "Bilig 1", xRatio: 0.18 },
  { type: ST.BILIG, label: "Bilig 2", xRatio: 0.3 },
  { type: ST.BUTTER, label: "Beurre", xRatio: 0.4 },
  { type: ST.SUGAR, label: "Sucre", xRatio: 0.48 },
  { type: ST.CHOCOLATE, label: "Chocolat", xRatio: 0.56 },
  { type: ST.STRAWBERRY, label: "Fraise", xRatio: 0.64 },
  { type: ST.LEMON, label: "Citron", xRatio: 0.72 },
  { type: ST.WHIPPED_CREAM, label: "Chantilly", xRatio: 0.8 },
  { type: ST.DELIVERY, label: "Envoi", xRatio: 0.89 },
  { type: ST.TRASH, label: "Poubelle", xRatio: 0.97 },
];

// Recettes : ordre des toppings non significatif pour le match
export const RECIPES = [
  {
    id: "beurre_sucre",
    toppings: ["BUTTER", "SUGAR"],
    points: 80,
    label: "Beurre-Sucre",
    icon: "🧈",
    color: "#F5DEB3",
  },
  {
    id: "chocolat",
    toppings: ["CHOCOLATE"],
    points: 80,
    label: "Chocolat",
    icon: "🍫",
    color: "#5D3A1A",
  },
  {
    id: "fraise",
    toppings: ["STRAWBERRY"],
    points: 80,
    label: "Fraise",
    icon: "🍓",
    color: "#FF6B6B",
  },
  {
    id: "citron_sucre",
    toppings: ["LEMON", "SUGAR"],
    points: 100,
    label: "Citron-Sucre",
    icon: "🍋",
    color: "#FFF176",
  },
  {
    id: "fraise_chantilly",
    toppings: ["STRAWBERRY", "WHIPPED_CREAM"],
    points: 150,
    label: "Fraise-Chantilly",
    icon: "🍓",
    color: "#FFB7C5",
  },
  {
    id: "choco_fraise",
    toppings: ["CHOCOLATE", "STRAWBERRY"],
    points: 150,
    label: "Choco-Fraise",
    icon: "🍫",
    color: "#8B0000",
  },
  {
    id: "complet",
    toppings: ["BUTTER", "SUGAR", "LEMON"],
    points: 180,
    label: "Complet",
    icon: "⭐",
    color: "#FFE4B5",
  },
  {
    id: "royal",
    toppings: ["CHOCOLATE", "STRAWBERRY", "WHIPPED_CREAM"],
    points: 200,
    label: "Royal",
    icon: "👑",
    color: "#C0392B",
  },
];

// Paliers de difficulté (elapsed en secondes → paramètres)
export const DIFFICULTY_STEPS = [
  { at: 0, spawnInterval: 14000, patienceDuration: 32000 },
  { at: 15, spawnInterval: 11000, patienceDuration: 28000 },
  { at: 30, spawnInterval: 9000, patienceDuration: 24000 },
  { at: 45, spawnInterval: 7000, patienceDuration: 20000 },
  { at: 60, spawnInterval: 5500, patienceDuration: 17000 },
  { at: 75, spawnInterval: 4500, patienceDuration: 14000 },
];

// Positions des tables dans la salle (ratios relatifs à la zone restaurant = haut du canvas)
export const TABLE_POSITIONS = [
  { xRatio: 0.12, yRatio: 0.22 },
  { xRatio: 0.35, yRatio: 0.22 },
  { xRatio: 0.58, yRatio: 0.22 },
  { xRatio: 0.8, yRatio: 0.22 },
];

// Couleurs des items
export const ITEM_COLORS = {
  BATTER: "#E8C88A",
  ASSEMBLED_CREPE: "#C8913A",
  BUTTER: "#FFD700",
  SUGAR: "#F5F5F5",
  CHOCOLATE: "#3E1F00",
  STRAWBERRY: "#FF3333",
  LEMON: "#FFE033",
  WHIPPED_CREAM: "#FAFAFA",
};

// Icônes emoji des items
export const ITEM_ICONS = {
  BATTER: "💧",
  ASSEMBLED_CREPE: "🥞",
  BUTTER: "🧈",
  SUGAR: "🍬",
  CHOCOLATE: "🍫",
  STRAWBERRY: "🍓",
  LEMON: "🍋",
  WHIPPED_CREAM: "🍦",
};
