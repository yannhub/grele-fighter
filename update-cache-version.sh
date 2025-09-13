#!/bin/bash

# Script pour mettre à jour automatiquement la version du cache
# Usage: ./update-cache-version.sh [type]
# type peut être: major, minor, patch (défaut: patch)

SW_FILE="sw.js"
UPDATE_TYPE=${1:-patch}

echo "🔄 Mise à jour de la version du cache..."

# Vérifier si le fichier sw.js existe
if [ ! -f "$SW_FILE" ]; then
    echo "❌ Erreur: $SW_FILE non trouvé"
    exit 1
fi

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
    
    # Afficher un résumé des modifications
    echo ""
    echo "📝 Résumé des modifications:"
    echo "  - Version: $CURRENT_VERSION → $NEW_VERSION"
    echo "  - Type de mise à jour: $UPDATE_TYPE"
    echo "  - Date: $(date)"
else
    echo "❌ Erreur: La mise à jour a échoué"
    exit 1
fi

echo ""
echo "🚀 N'oubliez pas de:"
echo "   1. Tester votre application"
echo "   2. Vérifier que les nouvelles ressources sont bien cachées"
echo "   3. Commit vos changements si tout fonctionne"