# Changelog

Journal des évolutions de FrameForge. Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/),
versions selon [SemVer](https://semver.org/lang/fr/). Entrées par ordre décroissant.

## [1.2.1] — 2026-08-25 — Préparation de la mise en ligne

### Ajouté
- **Règles de routage Netlify** (`client/public/_redirects`) : proxy `/api/*` vers l'API et repli SPA
  sur `index.html`. Sans ce fichier, le front déployé ne joignait pas l'API et tout rafraîchissement
  sur une route React Router renvoyait un 404.
- **README du front** ([client/README.md](client/README.md)) : remplace le template Vite par défaut
  (scripts, résolution de `/api` selon l'environnement, structure de `src/`, variables de build).

### Modifié
- **Résilience au cold-start** : timeout axios porté de 12 s à 30 s et `retry` de 2 à 3 — un conteneur
  endormi sur une offre d'hébergement gratuite met 50-60 s à se réveiller.
- [DEPLOY.md](DEPLOY.md) : prérequis Git/GitHub, remplacement du domaine d'exemple dans
  `sitemap.xml` / `robots.txt` / JSON-LD, et variables `Stripe__SuccessUrl` / `Stripe__CancelUrl`
  à prévoir si de vraies clés Stripe sont activées un jour.
- `.gitignore` : exclusion des artefacts Python (`__pycache__/`, `*.pyc`) du script `tools/`.

## [1.2.0] — 2026-07-24 — Conformité RNCP (sécurité, RGPD, SEO)

### Sécurité
- Politique de mot de passe conforme **CNIL** (12 caractères min. + 4 types de caractères) couplée au verrouillage de compte.
- **En-têtes HTTP de sécurité** sur toutes les réponses API : CSP, `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy` ; **HSTS + redirection HTTPS** en production.

### RGPD
- **Bannière de consentement** aux cookies/mesures d'audience (le stockage essentiel reste sans consentement).
- Page **politique de confidentialité** (`/confidentialite`).
- **Droit à l'effacement** : suppression du compte et de toutes les données personnelles associées
  (`DELETE /api/account`) depuis « Mes commandes ».
- Mesure d'audience **anonyme et sans cookie** (Plausible), activée uniquement avec consentement.

### SEO
- `title`/`meta`/Open Graph **par page** (hook `useSeo`), **JSON-LD** (Organization + Product), `robots.txt`, `sitemap.xml`.

### Qualité
- Couverture de tests back-end mesurée : **78,5 %** (> 50 % requis).

## [1.1.0] — 2026-07-24 — Cohérence des builds & design

### Ajouté
- Builder : builds **toujours compatibles** (socket/RAM/alim coordonnés) au chargement et via presets ;
  explication débutant + **substitut compatible en 1 clic** quand une incompatibilité est créée.
- Moteur de reco « Je veux jouer à X » : builds **réellement assemblables**.
- Vraies **photos produit eBay** (74 composants) via `tools/fetch-ebay-images.py`.
- Page d'accueil : hero 2 colonnes avec aperçu build animé, bande de stats, cartes numérotées.

### Corrigé
- Cartes produit de taille uniforme ; « Top performances » sans espace vide.
- Résilience démarrage : `timeout` axios, retry React Query, refetch des jeux importés en arrière-plan.

## [1.0.0] — 2026-07-23 — Base + durcissement

### Ajouté
- 4 flux : Boutique, « Je veux jouer à X », Vérificateur, Builder + espace Admin.
- Paiement **Stripe test** avec vérification du paiement et idempotence.
- Auth JWT + Identity + verrouillage ; validation DTO ; ownership.
- Tests API (intégration + unitaires) + tests front (Vitest) ; **CI** GitHub Actions ; TypeScript strict.
