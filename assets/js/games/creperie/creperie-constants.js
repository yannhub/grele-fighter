// creperie-constants.js — Configuration du jeu La Crêperie

export const GAME_DURATION = 120; // secondes
export const MAX_HEARTS = 5;
export const BILIG_COOK_TIME = 3500; // ms de cuisson
export const GAMEOVER_ACTION_DELAY = 2000; // ms avant l'apparition des boutons de fin de partie

// Ratios de mise en page (fraction de la hauteur du CANVAS)
export const HUD_H = 72; // px — hauteur du HUD dédié (hors zone jeu)
export const COUNTER_Y_RATIO = 0.5; // bord supérieur du comptoir (relatif à gameH)
export const COUNTER_HEIGHT_RATIO = 0.14; // hauteur du comptoir
export const PASSAGE_X_RATIO = 0.88; // le comptoir haut s'arrête ici (passage à droite)
export const KITCHEN_TOP_LANE_Y_RATIO = 0.68; // Y de marche en haut de la cuisine
export const KITCHEN_BOTTOM_LANE_Y_RATIO = 0.8; // Y de marche en bas de la cuisine
export const PLAYER_DINING_Y_RATIO = 0.28; // Y initial du joueur dans la salle
export const BOTTOM_COUNTER_Y_RATIO = 0.86; // bord supérieur du 2e comptoir (bas)
export const BOTTOM_COUNTER_HEIGHT_RATIO = 0.11; // hauteur du 2e comptoir

// Joueur
export const PLAYER_SPEED = 800; // px/sec
export const MAX_HANDS = 4;
export const PLAYER_SIZE = 110; // px (hauteur du sprite)
export const INTERACT_Y_TOLERANCE = 44; // px — proximité front comptoir pour interaction

// Vitesse du serveur NPC
export const WAITER_SPEED = 800; // px/sec

// Bonus Assurance G2S — assistants obtenus via contrats clients
export const BONUS_COOK_SPEEDUP = 1; // les biligs assistants cuisent à vitesse normale
export const BONUS_AUTO_SPEED_RATIO = 0.25; // vitesse réduite du joueur auto (2× plus lent que le joueur)

// Assistants crépiers (accumulables via contrats)
export const MAX_ASSISTANTS = 5;
export const ASSISTANT_DURATION = 90; // secondes de durée par assistant
export const MIN_PLAYER_ORDERS = 2; // commandes min réservées au joueur avant d'attribuer aux assistants
export const ASSISTANT_ACCEL_PER_SEC = 1.0; // px/s gagnés par seconde de jeu écoulée (200→320px/s sur 120s)
export const CONTRACT_DURATION = 20000; // ms avant disparition d'un contrat G2S
export const CONTRACT_COLLECT_RADIUS = 90; // distance de collecte (px)

// Mécanique d'incendie
export const BROWN_DELAY = 8000; // ms après état READY avant que la crêpe brunisse
export const BURN_DELAY = 12000; // ms après état READY avant d'attraper feu
export const FIRE_SPREAD_DELAY = 3000; // ms avant propagation à un bilig voisin
export const FIREFIGHTER_SPEED = 480; // px/sec

// Configuration de l'écran d'accueil
export const GAME_CONFIG = {
  title: "Bienvenue dans votre crêperie !",
  subtitle:
    "Préparez et servez un maximum de crêpes délicieuses à vos clients en 1 minute 30 !",
  hidePrize: false,
};

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
  DONATION: "DONATION", // zone de don (comptoir bas, droite)
  CALL_G2S: "CALL_G2S", // station d'appel pompier G2S (comptoir bas, avant DON)
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

// Disposition des postes du comptoir HAUT (de gauche à droite, jusqu'au passage)
// xRatio = centre x en fraction de la largeur du canvas
export const STATION_LAYOUT = [
  { type: ST.BATTER, label: "Pâte", xRatio: 0.06 },
  { type: ST.BILIG, label: "Bilig 1", xRatio: 0.16 },
  { type: ST.BILIG, label: "Bilig 2", xRatio: 0.26 },
  { type: ST.BUTTER, label: "Beurre", xRatio: 0.37 },
  { type: ST.SUGAR, label: "Sucre", xRatio: 0.45 },
  { type: ST.CHOCOLATE, label: "Chocolat", xRatio: 0.53 },
  { type: ST.STRAWBERRY, label: "Fraise", xRatio: 0.61 },
  { type: ST.LEMON, label: "Citron", xRatio: 0.69 },
  { type: ST.WHIPPED_CREAM, label: "Chantilly", xRatio: 0.77 },
  { type: ST.DELIVERY, label: "Envoi", xRatio: 0.85 },
];

// Disposition des postes du comptoir BAS (CALL_G2S + DONATION)
// Les biligs assistants sont placés dynamiquement à gauche
export const STATION_LAYOUT_BOTTOM = [
  { type: ST.CALL_G2S, label: "🚒 G2S", xRatio: 0.82 },
  { type: ST.DONATION, label: "Don 🫶", xRatio: 0.93 },
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
    toppings: ["SUGAR", "LEMON"],
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
// patienceDuration augmentée pour compenser le temps de marche du serveur
export const DIFFICULTY_STEPS = [
  { at: 0, spawnInterval: 4600, patienceDuration: 40000 },
  { at: 30, spawnInterval: 4400, patienceDuration: 35000 },
  { at: 60, spawnInterval: 4200, patienceDuration: 32000 },
  { at: 90, spawnInterval: 4000, patienceDuration: 30000 },
  { at: 110, spawnInterval: 3200, patienceDuration: 28000 },
];

// Positions des tables dans la salle (ratios relatifs à la zone restaurant = haut du canvas)
// 10 tables sur 3 rangées
export const TABLE_POSITIONS = [
  // Rangée du fond
  { xRatio: 0.12, yRatio: 0.16 },
  { xRatio: 0.38, yRatio: 0.16 },
  { xRatio: 0.64, yRatio: 0.16 },
  // Rangée du milieu (décalée)
  { xRatio: 0.25, yRatio: 0.46 },
  { xRatio: 0.51, yRatio: 0.46 },
  { xRatio: 0.77, yRatio: 0.46 },
  // Rangée avant
  { xRatio: 0.16, yRatio: 0.76 },
  { xRatio: 0.42, yRatio: 0.76 }, // nouveau : centre rangée avant
  { xRatio: 0.68, yRatio: 0.76 },
  // Table isolée droite (entre fond et milieu)
  { xRatio: 0.82, yRatio: 0.31 }, // nouveau : coin droit haut
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
  BATTER: "🥣",
  ASSEMBLED_CREPE: "🥞",
  BUTTER: "🧈",
  SUGAR: "🍬",
  CHOCOLATE: "🍫",
  STRAWBERRY: "🍓",
  LEMON: "🍋",
  WHIPPED_CREAM: "🍦",
};

// Ordre gauche→droite des toppings sur le plan de travail (BUTTER est le plus à gauche)
export const TOPPING_ORDER = [
  "BUTTER",
  "SUGAR",
  "CHOCOLATE",
  "STRAWBERRY",
  "LEMON",
  "WHIPPED_CREAM",
];
