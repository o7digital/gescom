#!/bin/bash

# Script de conversion des images en WebP pour optimisation du site GESCOM
# Utilise cwebp (installé via Homebrew: brew install webp)

echo "🖼️  Conversion des images en WebP..."

# Vérifier si cwebp est installé
if ! command -v cwebp &> /dev/null; then
    echo "❌ cwebp n'est pas installé. Installation via Homebrew..."
    brew install webp
fi

# Convertir les images du logo
echo "📁 Conversion des logos..."
if [ -f "finance-template-clean/images/logo.png" ]; then
    cwebp -q 90 "finance-template-clean/images/logo.png" -o "finance-template-clean/images/logo.webp"
    echo "✅ logo.png → logo.webp"
fi

# Convertir hero-bg.png
echo "📁 Conversion du background hero..."
if [ -f "finance-template-clean/demos/finance/images/hero-bg.png" ]; then
    cwebp -q 85 "finance-template-clean/demos/finance/images/hero-bg.png" -o "finance-template-clean/demos/finance/images/hero-bg.webp"
    echo "✅ hero-bg.png → hero-bg.webp"
fi

# Convertir man.png
echo "📁 Conversion de man.png..."
if [ -f "finance-template-clean/demos/finance/images/man.png" ]; then
    cwebp -q 85 "finance-template-clean/demos/finance/images/man.png" -o "finance-template-clean/demos/finance/images/man.webp"
    echo "✅ man.png → man.webp"
fi

# Convertir les images de services
echo "📁 Conversion des images services..."
for i in {1..6}; do
    if [ -f "finance-template-clean/demos/finance/images/services/$i.jpg" ]; then
        cwebp -q 85 "finance-template-clean/demos/finance/images/services/$i.jpg" -o "finance-template-clean/demos/finance/images/services/$i.webp"
        echo "✅ services/$i.jpg → services/$i.webp"
    fi
done

# Convertir les images users
echo "📁 Conversion des images utilisateurs..."
for i in {1..3}; do
    if [ -f "finance-template-clean/demos/finance/images/users/$i.jpg" ]; then
        cwebp -q 85 "finance-template-clean/demos/finance/images/users/$i.jpg" -o "finance-template-clean/demos/finance/images/users/$i.webp"
        echo "✅ users/$i.jpg → users/$i.webp"
    fi
done

# Convertir gemini-gescom.png
echo "📁 Conversion de gemini-gescom.png..."
if [ -f "public/gescom/gemini-gescom.png" ]; then
    cwebp -q 90 "public/gescom/gemini-gescom.png" -o "public/gescom/gemini-gescom.webp"
    echo "✅ gemini-gescom.png → gemini-gescom.webp"
fi

echo "✅ Conversion terminée!"
echo "📊 Prochaine étape: mettre à jour les références dans les fichiers HTML"
