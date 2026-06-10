#!/bin/bash

# Script pour mettre à jour automatiquement la liste des URLs et la version du cache
# Usage: ./update-cache-version.sh [type]
# type peut être: major, minor, patch (défaut: patch)

SW_FILE="sw.js"
ASSETS_DIR="assets"
UPDATE_TYPE=${1:-patch}

echo "🔄 Mise à jour de la liste des fichiers et de la version du cache..."
echo ""

# ==================== ÉTAPE 1: Générer la liste des URLs ====================
echo "📋 ÉTAPE 1: Génération de la liste des fichiers à mettre en cache..."

# Créer la liste des URLs
URLS_ARRAY="const urlsToCache = [\n"
URLS_ARRAY="${URLS_ARRAY}  // Pages principales\n"
URLS_ARRAY="${URLS_ARRAY}  \"./\",\n"
URLS_ARRAY="${URLS_ARRAY}  \"./index.html\",\n"
URLS_ARRAY="${URLS_ARRAY}  \"./favicon.svg\",\n"
URLS_ARRAY="${URLS_ARRAY}  \"./manifest.json\",\n"
URLS_ARRAY="${URLS_ARRAY}  \"./offline.html\",\n\n"
URLS_ARRAY="${URLS_ARRAY}  // Assets (CSS, JS, Images)\n"

# Scanner récursivement tous les fichiers du dossier assets
if [ -d "$ASSETS_DIR" ]; then
    for file in $(find "$ASSETS_DIR" -type f ! -name "sw-register.js" | sort); do
        URLS_ARRAY="${URLS_ARRAY}  \"./$file\",\n"
    done
fi

# Supprimer la dernière virgule
URLS_ARRAY=$(echo -e "$URLS_ARRAY" | sed '$ s/,$//')
URLS_ARRAY="${URLS_ARRAY}\n];"

echo -e "$URLS_ARRAY" > /tmp/cache_urls.txt

# Remplacer dans le fichier sw.js
if [ -f "$SW_FILE" ]; then
    START_LINE=$(grep -n "const urlsToCache = \[" "$SW_FILE" | cut -d: -f1)
    END_LINE=$(grep -n "^\];" "$SW_FILE" | head -1 | cut -d: -f1)
    
    if [ -n "$START_LINE" ] && [ -n "$END_LINE" ]; then
        head -n $((START_LINE - 1)) "$SW_FILE" > /tmp/sw_new.js
        cat /tmp/cache_urls.txt >> /tmp/sw_new.js
        tail -n +$((END_LINE + 1)) "$SW_FILE" >> /tmp/sw_new.js
        
        mv /tmp/sw_new.js "$SW_FILE"
        
        FILES_COUNT=$(grep "^\s*\"\\./" "$SW_FILE" | wc -l)
        echo "✅ Liste mise à jour: $FILES_COUNT fichiers à mettre en cache"
    else
        echo "❌ Erreur: Impossible de trouver la section urlsToCache"
        exit 1
    fi
else
    echo "❌ Erreur: Fichier $SW_FILE non trouvé"
    exit 1
fi

# ==================== ÉTAPE 2: Mettre à jour la version ====================
echo ""
echo "📦 ÉTAPE 2: Mise à jour de la version du cache..."

# Extraire la version actuelle
CURRENT_VERSION=$(grep -o 'const CACHE_VERSION = "[^"]*"' $SW_FILE | sed 's/const CACHE_VERSION = "//;s/"//')

if [ -z "$CURRENT_VERSION" ]; then
    echo "❌ Erreur: Version actuelle non trouvée dans $SW_FILE"
    exit 1
fi

echo "📋 Version actuelle: $CURRENT_VERSION"

# Séparer les parties de la version (major.minor.patch)
IFS='.' read -r -a VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR=${VERSION_PARTS[0]:-0}
MINOR=${VERSION_PARTS[1]:-0}
PATCH=${VERSION_PARTS[2]:-0}

# Mettre à jour selon le type
case $UPDATE_TYPE in
    "major")
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        ;;
    "minor")
        MINOR=$((MINOR + 1))
        PATCH=0
        ;;
    "patch"|*)
        PATCH=$((PATCH + 1))
        ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"

echo "🆕 Nouvelle version: $NEW_VERSION"

# Remplacer la version dans le fichier
sed -i "s/const CACHE_VERSION = \"[^\"]*\"/const CACHE_VERSION = \"$NEW_VERSION\"/" "$SW_FILE"

# Vérifier que le changement a été effectué
UPDATED_VERSION=$(grep -o 'const CACHE_VERSION = "[^"]*"' $SW_FILE | sed 's/const CACHE_VERSION = "//;s/"//')

if [ "$UPDATED_VERSION" = "$NEW_VERSION" ]; then
    echo "✅ Version mise à jour avec succès: $NEW_VERSION"
else
    echo "❌ Erreur: La mise à jour a échoué"
    exit 1
fi

# ==================== RÉSUMÉ ====================
echo ""
echo "🎉 RÉSUMÉ DES MODIFICATIONS:"
echo "  📋 Fichiers cachés: $FILES_COUNT"
echo "  📦 Version: $CURRENT_VERSION → $NEW_VERSION"
echo "  🏷️  Type: $UPDATE_TYPE"
echo "  📅 Date: $(date)"
echo ""
echo "✨ Prêt à être commité!"