// collision.js - Gestion des collisions entre objets du jeu

import { HAIL_DEFAULT, CLOUD_DROPS_DEFAULT } from "./constants.js";

export default class CollisionManager {
  constructor(player, hailSystem, cornField, powerupSystem) {
    this.player = player;
    this.hailSystem = hailSystem;
    this.cornField = cornField;
    this.powerupSystem = powerupSystem;
    this.score = 0;
    this.hailsDestroyed = 0;
    this.cloudDropsDestroyed = 0; // Nouveau compteur pour les gouttes de nuage
  }

  // Vérifier toutes les collisions
  checkCollisions() {
    this.checkBulletHailCollisions();
    this.checkRobotBulletCollisions(); // Vérifier les collisions avec les projectiles du robot
    this.checkPowerupPlayerCollisions();
    this.checkHailCornCollisions();
    this.checkCloudCollisions();
    this.checkExplosionEffect(); // Vérifier l'effet de l'explosion
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
              drop.size,
              CLOUD_DROPS_DEFAULT.color
            );

            // Supprimer la goutte
            cloudDrops.splice(j, 1);
            j--;

            // Ajouter des points au score (moins que les grêlons normaux)
            this.score += CLOUD_DROPS_DEFAULT.points;
            this.cloudDropsDestroyed++; // Utiliser le compteur dédié aux gouttes de nuage

            break;
          }
        }
      }
    }
  }

  // Vérifier les collisions entre les projectiles du robot et les grêlons/gouttes
  checkRobotBulletCollisions() {
    // Si le robot n'est pas actif, ne rien faire
    if (!this.powerupSystem.activeRobotCart) return;

    const robotBullets = this.powerupSystem.activeRobotCart.bullets;
    const hails = this.hailSystem.hails;

    for (let i = 0; i < robotBullets.length; i++) {
      const bullet = robotBullets[i];

      // Vérifier les collisions avec les grêlons
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
          robotBullets.splice(i, 1);
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

      // Vérifier les collisions avec les gouttes du nuage d'orage
      if (this.powerupSystem.activeCloudMalus && i < robotBullets.length) {
        // Vérifier que le projectile existe toujours
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
            robotBullets.splice(i, 1);
            i--;

            // Créer une animation de particules à l'emplacement de la goutte
            this.hailSystem.createHailParticles(
              drop.x - drop.size / 2,
              drop.y - drop.size / 2,
              drop.size,
              CLOUD_DROPS_DEFAULT.color
            );

            // Supprimer la goutte
            cloudDrops.splice(j, 1);
            j--;

            // Ajouter des points au score
            this.score += CLOUD_DROPS_DEFAULT.points;
            this.cloudDropsDestroyed++;

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

  // Vérifier l'effet de l'explosion et détruire tous les grêlons
  checkExplosionEffect() {
    // Vérifier si un anneau d'explosion est actif
    if (this.powerupSystem.explosionRing) {
      const ring = this.powerupSystem.explosionRing;
      const centerX = ring.x;
      const centerY = ring.y;
      const currentRadius = ring.currentRadius;

      // Récupérer tous les grêlons
      const hails = this.hailSystem.hails;

      // Parcourir tous les grêlons pour les détruire s'ils sont atteints par l'explosion
      for (let i = hails.length - 1; i >= 0; i--) {
        const hail = hails[i];
        const hailCenterX = hail.x + hail.size / 2;
        const hailCenterY = hail.y + hail.size / 2;

        // Calculer la distance entre le centre de l'explosion et le centre du grêlon
        const dx = centerX - hailCenterX;
        const dy = centerY - hailCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Si le grêlon est à l'intérieur du rayon de l'anneau, le détruire
        // En comparant avec currentRadius - 15 et currentRadius pour créer un effet d'anneau
        if (
          distance <= currentRadius &&
          distance >= currentRadius - 15 * this.powerupSystem.scaleFactor
        ) {
          // Créer une animation de particules à l'emplacement du grêlon
          this.hailSystem.createHailParticles(hail.x, hail.y, hail.size);

          // Ajouter des points au score et incrémenter le compteur de grêlons détruits
          this.score += HAIL_DEFAULT.points;
          this.hailsDestroyed++;

          // Supprimer le grêlon
          hails.splice(i, 1);
        }
      }

      // Faire la même chose pour les gouttes du nuage toxique si elles existent
      if (this.powerupSystem.activeCloudMalus) {
        const cloudDrops = this.powerupSystem.activeCloudMalus.drops;

        for (let i = cloudDrops.length - 1; i >= 0; i--) {
          const drop = cloudDrops[i];

          // Calculer la distance
          const dx = centerX - drop.x;
          const dy = centerY - drop.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Si la goutte est dans le rayon d'action de l'explosion
          if (
            distance <= currentRadius &&
            distance >= currentRadius - 15 * this.powerupSystem.scaleFactor
          ) {
            // Créer une animation de particules
            this.hailSystem.createHailParticles(
              drop.x - drop.size / 2,
              drop.y - drop.size / 2,
              drop.size,
              CLOUD_DROPS_DEFAULT.color
            );

            // Ajouter des points au score
            this.score += CLOUD_DROPS_DEFAULT.points;
            this.cloudDropsDestroyed++;

            // Supprimer la goutte
            cloudDrops.splice(i, 1);
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

  // Récupérer le nombre de gouttes de nuage détruites
  getCloudDropsDestroyed() {
    return this.cloudDropsDestroyed;
  }

  // Réinitialiser les statistiques
  reset() {
    this.score = 0;
    this.hailsDestroyed = 0;
    this.cloudDropsDestroyed = 0;
  }
}
