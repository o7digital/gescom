# Template Finance - Canvas

Ce dossier contient uniquement les fichiers nécessaires pour le template **demo-finance.html**.

## 📁 Structure du dossier

```
finance-template-clean/
├── demo-finance.html      # Page principale
├── style.css              # Style principal Canvas
├── favicon.ico            # Icône du site
├── css/                   # Feuilles de style
│   ├── font-icons.css
│   ├── swiper.css
│   └── custom.css
├── js/                    # Scripts JavaScript
│   ├── plugins.min.js
│   └── functions.bundle.js
├── images/                # Images globales (logos, etc.)
├── demos/finance/         # Ressources spécifiques au template Finance
│   ├── finance.css
│   └── images/
└── include/               # Scripts serveur (formulaires)
    └── form.php
```

## 🚀 Utilisation

### En local
```bash
cd finance-template-clean
python3 -m http.server 8000
```
Puis ouvrir: http://localhost:8000/demo-finance.html

### Déploiement
Uploader tous les fichiers de ce dossier sur votre serveur web.

## 📊 Statistiques
- **Taille**: ~831 MB
- **Fichiers**: 5883 fichiers
- **Optimisé**: Sans Revolution Slider ni autres démos

## ✅ Ce qui est inclus
- ✅ Page demo-finance.html complète
- ✅ Tous les CSS nécessaires
- ✅ Tous les JavaScript nécessaires
- ✅ Toutes les images utilisées
- ✅ Toutes les fonts d'icônes
- ✅ Formulaire de contact (PHP)

## ❌ Ce qui a été retiré
- ❌ Revolution Slider (non utilisé)
- ❌ Autres démos HTML
- ❌ Twitter OAuth
- ❌ Fichiers de build (gulpfile, package.json)

## 📝 Notes
- Les fonts Google sont chargées depuis Google Fonts (CDN)
- Le template est responsive et fonctionne sur tous les appareils
- Le formulaire de contact nécessite PHP côté serveur
