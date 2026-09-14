# GESCOM

Le site statique publié par Vercel se trouve dans `finance-template-clean`.

```sh
npm ci
npm run build
npm test
npx playwright install chromium
npm run test:browser
```

Le build génère les douze pages de services FR/EN/ES depuis
`scripts/services.mjs`, leur sitemap et les versions minifiées de `style.css`
et `js/functions.js`. Modifier les textes des services dans ce fichier source,
puis relancer le build. Les autres pages HTML restent éditables directement.

Les rubriques complémentaires et les FAQ des accueils et services se trouvent
dans `scripts/content.mjs` en français, anglais et espagnol. Le bloc d’accueil
entre les commentaires `Generated home content` est régénéré au build.
`scripts/seo.mjs` harmonise les métadonnées de partage et les données structurées
à partir des titres et descriptions, et génère les alternances du sitemap.
Les anciens liens `/demo-finance.html` redirigent définitivement vers `/`.

Le JavaScript du template charge ses modules à la demande. Les interactions
propres au site se trouvent dans `finance-template-clean/js/site.js`.

Les tests vérifient les liens, les métadonnées, les langues et la conservation
des pieds de page existants. Les tests navigateur couvrent les formats mobile
et ordinateur et interceptent les envois de formulaires et de chat.
Ils peuvent viser une URL déployée avec `BASE_URL=https://gescom.digital npm run test:browser`.
Les captures et mesures sont écrites dans `test-results/` (non versionné).
Pour utiliser Chrome déjà installé : `BROWSER_CHANNEL=chrome npm run test:browser`.

Déploiement du projet Vercel lié : `vercel --prod`.

Après publication : `BASE_URL=https://gescom.digital npm run test:deployed`
vérifie les 25 URL du sitemap, les redirections, les métadonnées et les erreurs 404.
