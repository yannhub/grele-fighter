// leaderboard.js - Gestion du classement des joueurs

import { STORAGE_KEY } from "./constants.js";

export default class Leaderboard {
  constructor(ui = null) {
    this.leaderboardElement = document.getElementById("leaderboard-list");
    this.tooltipElement = null;
    this.ui = ui; // Référence à l'UI pour permettre de lancer une partie
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

  // Récupérer uniquement les meilleurs scores par joueur
  getBestScores() {
    const allScores = this.getLeaderboard();
    const bestScoresByPlayer = new Map();

    // Pour chaque score, conserver uniquement le meilleur par joueur (insensible à la casse)
    allScores.forEach((entry) => {
      const lowercaseNickname = entry.nickname.toLowerCase();
      const currentBest = bestScoresByPlayer.get(lowercaseNickname);

      // Si le joueur n'existe pas encore ou si le nouveau score est meilleur
      if (!currentBest || entry.score > currentBest.score) {
        bestScoresByPlayer.set(lowercaseNickname, entry);
      }
    });

    // Convertir la Map en tableau
    const bestScores = Array.from(bestScoresByPlayer.values());

    // Trier par score décroissant
    bestScores.sort((a, b) => b.score - a.score);

    return bestScores;
  }

  // Obtenir tous les scores d'un joueur donné
  getPlayerScoreHistory(nickname) {
    const allScores = this.getLeaderboard();
    const lowercaseNickname = nickname.toLowerCase();

    // Filtrer les scores par nickname (insensible à la casse) et trier par score décroissant
    return allScores
      .filter((entry) => entry.nickname.toLowerCase() === lowercaseNickname)
      .sort((a, b) => b.score - a.score);
  }

  // Vérifier si un pseudo existe déjà
  checkNicknameExists(nickname) {
    if (!nickname) return false;
    const history = this.getPlayerScoreHistory(nickname);
    return history.length > 0;
  }

  // Sauvegarder un nouveau score
  saveScore(playerInfo, score) {
    let leaderboard = this.getLeaderboard();
    const lowercaseNickname = (playerInfo.nickname || "Anonyme").toLowerCase();

    // Vérifier si ce joueur a déjà joué précédemment (insensible à la casse)
    // Si oui, utiliser le même format de nickname pour la cohérence visuelle
    let existingEntry = leaderboard.find(
      (entry) => entry.nickname.toLowerCase() === lowercaseNickname
    );

    // Créer une entrée pour le nouveau score
    const entry = {
      nickname: existingEntry
        ? existingEntry.nickname
        : playerInfo.nickname || "Anonyme",
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
    const bestScores = this.getBestScores();
    this.leaderboardElement.innerHTML = "";

    if (bestScores.length === 0) {
      const li = document.createElement("li");
      li.textContent = "Pas encore de scores";
      this.leaderboardElement.appendChild(li);
      return;
    }

    bestScores.forEach((entry, index) => {
      const li = document.createElement("li");
      li.innerHTML = `${index + 1}. ${
        entry.nickname
      } <span class="organization">${
        entry.organization
      }</span> <span class="score">${entry.score}</span>`;

      // Stocker le nickname pour récupérer l'historique lors du survol
      li.setAttribute("data-nickname", entry.nickname);

      // Créer un attribut data pour stocker les informations du meilleur score
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

    // Ajouter les écouteurs d'événements pour le clic
    this.setupTooltips();
  }

  // Configurer les infobulles au clic des entrées du classement
  setupTooltips() {
    const entries = document.querySelectorAll(".leaderboard-entry");
    let activeTooltip = null;

    // Fonction pour fermer le tooltip actif
    const closeActiveTooltip = (e) => {
      // Ne pas fermer si on clique sur le tooltip lui-même
      if (this.tooltipElement.contains(e.target)) {
        return;
      }

      // Ne pas fermer si on clique sur un élément du leaderboard avec le tooltip déjà ouvert
      if (
        e.target.closest(".leaderboard-entry") &&
        this.tooltipElement.style.display === "block"
      ) {
        return;
      }

      this.tooltipElement.style.display = "none";
      if (activeTooltip) {
        activeTooltip.classList.remove("active");
        activeTooltip = null;
      }
      // Retirer l'écouteur d'événement une fois le tooltip fermé
      document.removeEventListener("click", closeActiveTooltip);
    };

    entries.forEach((entry) => {
      // Retirer les écouteurs pour le survol
      entry.removeEventListener("mouseenter", entry.mouseenterHandler);
      entry.removeEventListener("mouseleave", entry.mouseleaveHandler);

      // Ajouter l'écouteur pour le clic
      entry.addEventListener("click", (e) => {
        const playerInfo = JSON.parse(entry.getAttribute("data-player-info"));
        const nickname = entry.getAttribute("data-nickname");

        // Si ce tooltip est déjà actif, le fermer
        if (activeTooltip === entry) {
          this.tooltipElement.style.display = "none";
          entry.classList.remove("active");
          activeTooltip = null;
          document.removeEventListener("click", closeActiveTooltip);
          return;
        }

        // Marquer l'entrée comme active
        if (activeTooltip) {
          activeTooltip.classList.remove("active");
        }
        entry.classList.add("active");
        activeTooltip = entry;

        // Récupérer l'historique des scores du joueur
        const scoreHistory = this.getPlayerScoreHistory(nickname);

        // Créer le contenu HTML pour l'historique des scores
        let historyHTML = "";
        if (scoreHistory.length > 1) {
          historyHTML = `
            <div class="score-history">
              <h4>${scoreHistory.length} parties</h4>
              <div class="score-history-list">
          `;

          scoreHistory.forEach((historyEntry) => {
            historyHTML += `
              <div class="score-item">
                <span class="score-value">${historyEntry.score}</span>
                <span class="score-date">${new Date(
                  historyEntry.date
                ).toLocaleDateString("fr-FR")}</span>
              </div>
            `;
          });

          historyHTML += `
              </div>
            </div>
          `;
        }

        // Formatter le contenu de la tooltip
        this.tooltipElement.innerHTML = `
          <div class="tooltip-content">
            <h3>${playerInfo.pseudo}</h3>
            <p><strong>Nom:</strong> ${playerInfo.nom}</p>
            <p><strong>Email:</strong> ${playerInfo.email}</p>
            <p><strong>Organisation:</strong> ${playerInfo.organisation}</p>
            <p><strong>Meilleur score:</strong> ${playerInfo.score}</p>
            <p><strong>Date:</strong> ${playerInfo.date}</p>
            ${historyHTML}
            <button id="play-with-player-btn" class="tooltip-play-btn">Jouer avec ce joueur</button>
          </div>
        `;

        // Positionner la tooltip près de l'élément cliqué
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

        // Ajouter un écouteur global pour fermer le tooltip au clic ailleurs
        setTimeout(() => {
          document.addEventListener("click", closeActiveTooltip);
        }, 0);

        // Ajouter un écouteur pour le bouton "Jouer avec ce joueur"
        setTimeout(() => {
          const playButton = document.getElementById("play-with-player-btn");
          if (playButton) {
            playButton.addEventListener("click", () => {
              this.playWithPlayer(nickname, playerInfo.organisation);
            });
          }
        }, 0);

        // Empêcher la propagation pour éviter la fermeture immédiate
        e.stopPropagation();
      });
    });
  }

  // Jouer avec un joueur sélectionné dans le leaderboard
  playWithPlayer(nickname, organization) {
    // Vérifier si l'UI est disponible
    if (!this.ui) {
      console.error("UI non disponible pour lancer une partie");
      return;
    }

    // Fermer la tooltip
    this.tooltipElement.style.display = "none";

    // Configurer les informations du joueur
    this.ui.setPlayerInfo({
      nickname: nickname,
      organization: organization,
    });

    // Masquer tous les écrans sauf le jeu
    this.ui.hideAllScreens();
    this.ui.showGameScreen();

    // Démarrer une nouvelle partie
    this.ui.gameManager.startGame();
  }
}
