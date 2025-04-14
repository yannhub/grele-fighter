// collision.js - Gestion des collisions entre objets du jeu

import { HAIL_DEFAULT, CORN_DEFAULT } from "./constants.js";

export default class CollisionManager {
  constructor(player, hailSystem, cornField, powerupSystem) {
    this.player = player;
    this.hailSystem = hailSystem;
    this.cornField = cornField;
    this.powerupSystem = powerupSystem;
    this.score = 0;
    this.hailsDestroyed = 0;
  }

  // Vérifier toutes les collisions
  checkCollisions() {
    this.checkBulletHailCollisions();
    this.checkPowerupPlayerCollisions();
    this.checkHailCornCollisions();
    this.checkCloudCollisions();
  }

  // Vérifier les collisions entre les balles et les grêlons
  checkBulletHailCollisions() {
    const bullets = this.player.bullets;
    const hails = this.hailSystem.hails;

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
          this.hailSystem.createHailParticles(hail.x, hail.y, hail.size);

          // Supprimer le grêlon et augmenter le score
          hails.splice(j, 1);
          j--;

          // Ajouter des points au score et incrémenter le compteur de grêlons détruits
          this.score += HAIL_DEFAULT.points;
          this.hailsDestroyed++;

          break;
        }
      }

      // Vérifier les collisions entre les balles et les gouttes du nuage d'orage
      if (this.powerupSystem.activeCloudMalus && i < bullets.length) {
        // Vérifier que la balle existe toujours
        const cloudDrops = this.powerupSystem.activeCloudMalus.drops;
        for (let j = 0; j < cloudDrops.length; j++) {
          const drop = cloudDrops[j];

          // Vérifier la collision
          if (
            bullet.x < drop.x + drop.size &&
            bullet.x + bullet.width > drop.x - drop.size &&
            bullet.y < drop.y + drop.size &&
            bullet.y + bullet.height > drop.y - drop.size
          ) {
            // Collision détectée
            bullets.splice(i, 1);
            i--;

            // Créer une animation de particules à l'emplacement de la goutte
            this.hailSystem.createHailParticles(
              drop.x - drop.size / 2,
              drop.y - drop.size / 2,
              drop.size
            );

            // Supprimer la goutte
            cloudDrops.splice(j, 1);
            j--;

            // Ajouter 5 points au score (moins que les grêlons normaux)
            this.score += 5;
            this.hailsDestroyed++;

            break;
          }
        }
      }
    }
  }

  // Vérifier les collisions entre les bonus/malus et le joueur
  checkPowerupPlayerCollisions() {
    const powerups = this.powerupSystem.powerups;

    for (let i = 0; i < powerups.length; i++) {
      const powerup = powerups[i];
      const powerupCenterX = powerup.x + powerup.size / 2;
      const powerupCenterY = powerup.y + powerup.size / 2;
      const powerupRadius = powerup.size / 2;

      // Point central du joueur
      const playerCenterX = this.player.getCenterX();
      const playerCenterY = this.player.getCenterY();

      // Distance entre les centres
      const dx = powerupCenterX - playerCenterX;
      const dy = powerupCenterY - playerCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Rayon approximatif du joueur
      const playerRadius = this.player.getRadius();

      // Vérifier si la distance est inférieure à la somme des rayons (collision)
      if (distance < powerupRadius + playerRadius) {
        // Appliquer l'effet du bonus/malus
        this.powerupSystem.applyPowerupEffect(
          powerup,
          this.player,
          this.cornField
        );

        // Créer une animation d'effet au point de collision
        this.powerupSystem.createPowerupEffect(powerup);

        // Supprimer le bonus/malus
        powerups.splice(i, 1);
        i--;

        continue;
      }
    }
  }

  // Vérifier les collisions entre les grêlons et les épis de maïs
  checkHailCornCollisions() {
    const hails = this.hailSystem.hails;
    const cornStalks = this.cornField.cornStalks;

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
            this.cornField.createDyingCorn(
              stalk.x,
              stalk.y,
              stalk.width,
              stalk.height
            );

            // Supprimer le grêlon
            hails.splice(i, 1);
            i--;

            break;
          }
        }
      }
    }
  }

  // Vérifier les collisions entre le nuage orageux et les épis de maïs
  checkCloudCollisions() {
    if (!this.powerupSystem.activeCloudMalus) return;

    const cloudDrops = this.powerupSystem.activeCloudMalus.drops;
    const cornStalks = this.cornField.cornStalks;

    for (let i = 0; i < cloudDrops.length; i++) {
      const drop = cloudDrops[i];

      for (let j = 0; j < cornStalks.length; j++) {
        const stalk = cornStalks[j];

        // Ne vérifier que si l'épi est encore vivant
        if (stalk.alive) {
          // Vérifier la collision avec une précision améliorée
          if (
            drop.x + drop.size / 2 > stalk.x &&
            drop.x - drop.size / 2 < stalk.x + stalk.width &&
            drop.y + drop.size > stalk.y
          ) {
            // L'épi est touché
            stalk.alive = false;

            // Créer une animation d'épi qui se fane
            this.cornField.createDyingCorn(
              stalk.x,
              stalk.y,
              stalk.width,
              stalk.height
            );

            // Supprimer la goutte/grêlon du nuage
            cloudDrops.splice(i, 1);
            i--;

            break;
          }
        }
      }
    }
  }

  // Vérifie si tous les épis de maïs sont détruits
  areAllCornsDead() {
    return this.cornField.areAllCornsDead();
  }

  // Récupérer le score actuel
  getScore() {
    return this.score;
  }

  // Récupérer le nombre de grêlons détruits
  getHailsDestroyed() {
    return this.hailsDestroyed;
  }

  // Réinitialiser les statistiques
  reset() {
    this.score = 0;
    this.hailsDestroyed = 0;
  }
}
