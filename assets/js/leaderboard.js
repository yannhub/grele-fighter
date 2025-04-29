// leaderboard.js - Gestion du classement des joueurs

import { STORAGE_KEY } from "./constants.js";

export default class Leaderboard {
  constructor() {
    this.leaderboardElement = document.getElementById("leaderboard-list");
    this.tooltipElement = null;
    this.initTooltip();
  }

  // Initialiser l'élément tooltip
  initTooltip() {
    this.tooltipElement = document.getElementById("player-tooltip");
    if (!this.tooltipElement) {
      this.tooltipElement = document.createElement("div");
      this.tooltipElement.id = "player-tooltip";
      this.tooltipElement.className = "player-tooltip";
      document.body.appendChild(this.tooltipElement);
    }
  }

  // Récupérer les scores depuis le stockage local
  getLeaderboard() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  }

  // Sauvegarder un nouveau score
  saveScore(playerInfo, score) {
    let leaderboard = this.getLeaderboard();

    // Créer une entrée pour le nouveau score
    const entry = {
      nickname: playerInfo.nickname || "Anonyme",
      organization: playerInfo.organization || "",
      score: score,
      date: new Date().toISOString(),
    };

    // Récupérer les anciens champs si disponibles (pour compatibilité avec les données existantes)
    if (playerInfo.firstname) entry.firstname = playerInfo.firstname;
    if (playerInfo.lastname) entry.lastname = playerInfo.lastname;
    if (playerInfo.email) entry.email = playerInfo.email;

    // Ajouter le nouveau score
    leaderboard.push(entry);

    // Trier par score décroissant
    leaderboard.sort((a, b) => b.score - a.score);

    // Sauvegarder dans le localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leaderboard));

    // Mettre à jour l'affichage
    this.updateDisplay();
  }

  // Mettre à jour l'affichage du classement
  updateDisplay() {
    const leaderboard = this.getLeaderboard();
    this.leaderboardElement.innerHTML = "";

    if (leaderboard.length === 0) {
      const li = document.createElement("li");
      li.textContent = "Pas encore de scores";
      this.leaderboardElement.appendChild(li);
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
          nom:
            entry.firstname && entry.lastname
              ? `${entry.firstname} ${entry.lastname}`
              : "Anonyme",
          pseudo: entry.nickname,
          email: entry.email || "Non renseigné",
          organisation: entry.organization,
          score: entry.score,
          date: new Date(entry.date).toLocaleDateString("fr-FR"),
        })
      );

      // Ajouter la classe pour le style de la tooltip
      li.classList.add("leaderboard-entry");

      this.leaderboardElement.appendChild(li);
    });

    // Ajouter les écouteurs d'événements pour le survol
    this.setupTooltips();
  }

  // Configurer les infobulles au survol des entrées du classement
  setupTooltips() {
    const entries = document.querySelectorAll(".leaderboard-entry");

    entries.forEach((entry) => {
      entry.addEventListener("mouseenter", (e) => {
        const playerInfo = JSON.parse(entry.getAttribute("data-player-info"));

        // Formatter le contenu de la tooltip
        this.tooltipElement.innerHTML = `
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
        const rect = entry.getBoundingClientRect();
        this.tooltipElement.style.display = "block";

        // Calculer la largeur de la fenêtre
        const windowWidth = window.innerWidth;

        // Calculer si la tooltip déborde à droite (en laissant une marge de 20px)
        const tooltipWidth = this.tooltipElement.offsetWidth;
        const rightOverflow = rect.right + tooltipWidth + 20 > windowWidth;

        // Si la tooltip déborde à droite, l'afficher à gauche de l'élément
        if (rightOverflow) {
          this.tooltipElement.style.left = `${rect.left - tooltipWidth - 10}px`;
        } else {
          this.tooltipElement.style.left = `${rect.right + 10}px`;
        }

        this.tooltipElement.style.top = `${rect.top}px`;
      });

      entry.addEventListener("mouseleave", () => {
        this.tooltipElement.style.display = "none";
      });
    });
  }
}
