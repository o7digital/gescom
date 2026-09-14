# Suivi SEO GESCOM — septembre 2026

Le site utilise Astro en génération statique. Pendant la première phase de
migration, Astro rend les documents existants avec un layout commun et le
générateur Node continue d’alimenter les pages de services multilingues.
Les modifications sont faites sur `dev`, qui contenait déjà `origin/main`.

## Constats vérifiés

- L’accueil et `/demo-finance.html` renvoyaient le même contenu en HTTP 200.
- Les 12 pages de services FR/EN/ES existaient déjà en production.
- Les pages À propos, Contact et les pages légales n’avaient pas de métadonnées Open Graph.
- Le sitemap exposait 25 URL canoniques, sans alternances linguistiques dans le XML.
- L’accueil avait un H1, mais plusieurs titres de sections passaient directement au H3.

## Changements

- Redirection permanente de `/demo-finance.html` vers `/` et correction des liens internes associés.
- Métadonnées de partage propres à chaque page, portrait d’Aurélie et identification cohérente de GESCOM.
- Données structurées WebSite et WebPage, avec AboutPage et ContactPage lorsque pertinent.
- Alternances FR/EN/ES dans le sitemap, cohérentes avec les balises HTML.
- Titres de sections de l’accueil réorganisés et dimensions de l’image principale renseignées.
- Environ 3 300 mots de contenu supplémentaire sur les trois langues : guide de délégation et FAQ de l’accueil, deux rubriques et deux réponses supplémentaires par page de service.
- Sources éditoriales centralisées dans `scripts/content.mjs` pour permettre leur amélioration sans modifier les pages générées.

## Prochaines décisions éditoriales

Le ciblage actuel reste l’adjointe administrative pour entrepreneurs, travailleurs autonomes et PME de Mauricie. Les textes mentionnent Trois-Rivières et Shawinigan comme zones desservies à distance, avec une seule implantation à Saint-Élie-de-Caxton.

Les prochains contenus doivent répondre à des questions distinctes, puis renvoyer vers le service adapté :

1. « Quelles tâches confier à une adjointe administrative virtuelle ? » : méthode de sélection, exemples de consignes et validations à garder.
2. « Comment préparer ses documents pour la tenue de livres ? » : organisation des pièces et coordination avec le comptable, sans inventer de règles fiscales.
3. « Organiser le suivi des devis et factures d’une petite entreprise » : exemples de statuts et informations à réunir.

Pour aller plus loin, les preuves propres à GESCOM auront plus de valeur que des variantes de textes : présentation détaillée de l’expérience d’Aurélie, outils effectivement utilisés et cas clients documentés avec leur autorisation. Les tarifs, certifications et résultats clients ne doivent être ajoutés qu’après confirmation.

## Mesure à mettre en place

L’accès Google Search Console n’a pas été fourni : aucune conclusion sur les impressions, les positions ou la couverture réelle dans Google n’est possible à partir de cet audit technique.

Dans Search Console, vérifier la propriété du domaine, soumettre `https://gescom.digital/sitemap.xml`, inspecter l’accueil et les quatre services français, puis comparer les clics, impressions et requêtes sur des périodes équivalentes. Distinguer les requêtes de marque « GESCOM » des recherches de services. Ces données permettront de choisir le prochain contenu à publier.

Références : [URL canoniques et redirections](https://developers.google.com/search/docs/crawling-indexing/301-redirects), [sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [sites multilingues](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites).
