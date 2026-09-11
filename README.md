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

Le JavaScript du template charge ses modules à la demande. Les interactions
propres au site se trouvent dans `finance-template-clean/js/site.js`.

Les tests vérifient les liens, les métadonnées, les langues et la conservation
des pieds de page existants. Les tests navigateur couvrent les formats mobile
et ordinateur et interceptent les envois de formulaires et de chat.
Ils peuvent viser une URL déployée avec `BASE_URL=https://gescom.digital npm run test:browser`.
Les captures et mesures sont écrites dans `test-results/` (non versionné).

Déploiement du projet Vercel lié : `vercel --prod`.
