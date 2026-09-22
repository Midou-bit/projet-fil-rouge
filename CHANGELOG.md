# Changelog

Journal des évolutions de FrameForge. Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/),
versions selon [SemVer](https://semver.org/lang/fr/). Entrées par ordre décroissant.

## [1.4.0] — 2026-09-22 — Finalisation technique RNCP

Cette entrée décrit uniquement les améliorations réalisées pendant la phase de finalisation ; elle
ne les attribue pas rétroactivement aux versions précédentes.

### Ajouté
- **API tierce frontend C17** : rubrique « Découverte Free-to-Play en direct » qui appelle
  FreeToGame directement depuis React, avec contrat typé, validation de réponse, délai maximal,
  cache, états chargement/erreur/vide et tests réseau simulés.
- **Protection des données** : export JSON propriétaire (`GET /api/account/export`), préférences de
  confidentialité modifiables, consentement daté/versionné et politique réécrite factuellement.
- **Exploitation API** : health check API/SQLite à réponse minimale, rate limiting des routes
  sensibles et journaux structurés sans contenu privé ni secret.
- Plans de tests frontend/backend et documentation du flux FreeToGame direct.

### Corrigé
- Isolation du cache React Query et du panier lors d'un changement de compte.
- Checkout : aucun succès déduit de l'URL ; confirmation serveur obligatoire en simulation,
  vérification Stripe en mode `StripeTest`, conservation d'une session Stripe en attente et
  idempotence de la confirmation.
- Scoring : suppression du double facteur de résolution, prise en compte de la RAM dans le verdict,
  parité de cas de référence frontend/backend, validation des catégories CPU/GPU et préférence pour
  le stock disponible.
- Tableau de bord : chiffre d'affaires limité aux commandes `Paid` et `Shipped`.
- Accessibilité ciblée : labels, noms accessibles, régions de chargement, lien d'évitement, focus
  visible, dialogues et respect du mouvement réduit. Aucun audit RGAA complet n'est revendiqué.
- SEO : canonical, `noindex` des routes privées/404, sitemap/robots cohérents et métadonnées sociales.

### Sécurité et dépendances
- CSP et en-têtes de sécurité alignés pour Netlify et nginx ; clé JWT robuste obligatoire en
  production ; validation renforcée des DTO et paramètres.
- Audits finaux : **0 vulnérabilité npm** (racine, frontend complet et production) et **0 package
  NuGet vulnérable** détecté pour l'API et les tests.

### Qualité et industrialisation
- Frontend : **118 tests sur 26 fichiers**, **62,26 % de lignes** couvertes ; seuil CI à 50 %.
- Backend : **87 tests**, **80,51 % de lignes**, **52,83 % de branches** et **85,43 % de méthodes**.
- CI enrichie avec couvertures et seuils, audits de dépendances, artefacts et build Docker.
- Les deux images Docker ont été construites et l'environnement Compose a été exécuté localement les
  21 et 22 septembre 2026 : frontend, proxy `/api`, SQLite et `/health` ont répondu en HTTP 200.

### Limites explicites
- Aucun paiement Stripe par carte test n'a été réalisé ; aucun webhook signé n'est configuré.
- GoatCounter reste inactif sans compte et code de site externes.
- Lighthouse et un audit RGAA complet n'ont pas été exécutés ; aucun score ni conformité n'est inventé.
- La branche de finalisation n'a pas été poussée ni vérifiée sur Netlify/Render.

## [1.3.0] — 2026-08-25 — Finitions de production

### Ajouté
- **Conditions générales et mentions légales** (`/conditions`) : éditeur, hébergeurs, objet du site,
  prix, commande, paiement en mode démonstration, absence de livraison, propriété intellectuelle.
  Liées depuis le pied de page et référencées au `sitemap.xml`.
- **Image de partage** (`og-image.png`, 1200×630) plus les balises `og:image`, `og:url` et
  `twitter:image`. Une fiche produit partage désormais sa propre photo via `useSeo`.
- **Jeu de favicons complet** : PNG 32/192/512, `apple-touch-icon` 180×180 et `site.webmanifest`.
- **Barre d'achat collante sous 860 px** sur la fiche produit : le bouton restait hors écran
  dès qu'on déroulait les spécifications.
- Titres et descriptions sur le panier, la confirmation et l'annulation de commande.

### Modifié
- **Mesure d'audience** : bascule de Plausible vers **GoatCounter**, gratuit et sans cookie.
  La logique de consentement est inchangée, seule la variable de build devient `VITE_GOATCOUNTER_CODE`.
- **Erreurs de formulaire** : connexion et contact affichent l'erreur dans le formulaire, conservée
  jusqu'à correction, avec `aria-invalid` sur le champ. Les notifications flottantes gardent les
  confirmations et portent enfin `role="alert"` et `aria-live`.
- Adresse de contact remplacée par une adresse de démonstration : un e-mail personnel réel figurait
  en clair sur une page indexable.
- Trois tableaux (fiche produit, tableau de bord, catégories) placés dans un conteneur de défilement,
  faute de quoi ils poussaient la page entière en défilement horizontal sur mobile.

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
