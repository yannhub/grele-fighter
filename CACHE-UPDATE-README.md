# Système de Mise à Jour du Cache

Ce système permet de forcer la mise à jour du cache du Service Worker lorsque vos ressources changent.

## 🚀 Comment ça marche

### 1. Versioning automatique
- Le cache utilise maintenant une version dans `sw.js` : `CACHE_VERSION`
- Chaque fois que cette version change, un nouveau cache est créé
- L'ancien cache est automatiquement supprimé

### 2. Notification utilisateur
- Quand une nouvelle version est disponible, une bannière apparaît
- L'utilisateur peut choisir de mettre à jour ou ignorer
- La bannière se masque automatiquement après 10 secondes

### 3. Scripts automatiques
- Scripts pour incrémenter automatiquement la version
- Disponible en version Linux/Mac (`.sh`)

## 📁 Fichiers ajoutés

- `assets/js/sw-update.js` - Gestionnaire côté client
- `assets/css/sw-update.css` - Styles pour la bannière
- `update-cache-version.sh` - Script Linux/Mac

## 🛠️ Utilisation

### Méthode 1: Scripts automatiques

```bash
# Incrémenter le patch (1.0.0 → 1.0.1)
./update-cache-version.sh

# Incrémenter le minor (1.0.1 → 1.1.0)
./update-cache-version.sh minor

# Incrémenter le major (1.1.0 → 2.0.0)
./update-cache-version.sh major
```

### Méthode 2: Manuelle

1. Ouvrez `sw.js`
2. Modifiez la ligne: `const CACHE_VERSION = "1.0.1";`
3. Incrémentez le numéro de version
4. Sauvegardez le fichier

## 📱 Integration dans votre HTML

Ajoutez ces lignes dans votre `index.html` :

```html
<!-- CSS pour la bannière de mise à jour -->
<link rel="stylesheet" href="./assets/css/sw-update.css">

<!-- Script de gestion des mises à jour (après vos autres scripts) -->
<script src="./assets/js/sw-update.js"></script>
```

## 🔄 Workflow recommandé

1. **Développement:**
   - Travaillez normalement sur vos fichiers
   - Testez localement

2. **Avant déploiement:**
   - Exécutez le script de mise à jour de version
   - Vérifiez que la nouvelle version apparaît dans `sw.js`

3. **Déploiement:**
   - Déployez tous vos fichiers
   - Les utilisateurs verront automatiquement la bannière de mise à jour

4. **Test:**
   - Visitez votre site
   - Vérifiez que la nouvelle version se charge
   - Testez la bannière de mise à jour

## ⚙️ Configuration avancée

### Personnaliser la bannière
Modifiez `assets/css/sw-update.css` pour changer l'apparence.

### Changer la fréquence de vérification
Dans `sw-update.js`, modifiez la ligne :
```javascript
// Vérifier toutes les 5 minutes (300000 ms)
setInterval(() => {
  swUpdate.checkForUpdate();
}, 5 * 60 * 1000);
```

### Forcer une mise à jour programmatiquement
```javascript
// Depuis la console ou votre code
swUpdate.checkForUpdate();
```

## 🐛 Dépannage

### La bannière n'apparaît pas
- Vérifiez que `sw-update.js` et `sw-update.css` sont inclus dans votre HTML
- Ouvrez les outils de développement et vérifiez la console

### Le cache ne se met pas à jour
- Vérifiez que la version dans `sw.js` a bien changé
- Forcez un rechargement complet (Ctrl+Shift+R)
- Vérifiez dans les outils de développement > Application > Service Workers

### Les scripts ne fonctionnent pas
- **Linux/Mac:** Rendez le script exécutable : `chmod +x update-cache-version.sh`

## 📊 Types de versions

- **patch** (1.0.0 → 1.0.1) : Corrections de bugs, petites modifications
- **minor** (1.0.1 → 1.1.0) : Nouvelles fonctionnalités compatibles
- **major** (1.1.0 → 2.0.0) : Changements majeurs, breaking changes

## 🎯 Bonnes pratiques

1. **Testez toujours** après une mise à jour de version
2. **Incrémentez de façon cohérente** selon le type de changement
3. **Gardez un changelog** de vos modifications
4. **Sauvegardez** avant les modifications importantes (les scripts le font automatiquement)