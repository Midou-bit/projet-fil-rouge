# Rapport du sprint final de mise en conformité technique — FRAMEFORGE

Date de clôture technique : **22 septembre 2026**  
Branche locale : **`rncp/finalisation-technique`**  
Périmètre : améliorations techniques et preuves ciblées pour RNCP38606, sans réécriture de
l'application, sans changement de stack, sans paiement, sans déploiement et sans fabrication de
preuves humaines.

## 1. Résumé

### État avant

Les deux audits historiques, `AUDIT_MEMOIRE_FRAMEFORGE.md` et
`AUDIT_INFOS_MANQUANTES_MEMOIRE.md`, ont servi de photographie de référence et n'ont pas été
modifiés. Le point bloquant principal était C17 : aucune API tierce métier n'était consommée
directement par React. Le frontend comptait **7 fichiers / 37 tests**, sans couverture configurée ;
la première mesure réalisée avant l'ajout des nouveaux tests a donné **13,66 % de lignes**. Le
backend comptait **50 tests** et **78,88 % de lignes** couvertes. Les audits initiaux détectaient
**12 vulnérabilités npm** dans le client (8 high, 4 moderate), dont 4 en production, **2 critical**
à la racine, ainsi que des dépendances NuGet vulnérables. La gestion du cache utilisateur, le faux
succès checkout, le calcul de résolution/RAM et le revenu du dashboard présentaient aussi des écarts
métier documentés.

### État après

- C17 est matérialisée par un flux direct **React → FreeToGame**, typé, limité, validé et testé.
- Le frontend atteint **118 tests sur 26 fichiers** et **60,53 % de lignes** couvertes ; lint et
  build de production réussissent.
- Le backend atteint **87 tests**, **80,50 % de lignes**, **52,83 % de branches** et **85,43 % de
  méthodes** couvertes ; restore et build Release réussissent sans avertissement ni erreur.
- Les audits finaux détectent **0 vulnérabilité npm** à la racine et dans le client, et **aucun
  package NuGet vulnérable** dans l'API ou le projet de tests.
- Les deux images Docker ont été reconstruites depuis l'état final du code. Le 22 septembre 2026,
  le frontend nginx, son proxy `/api`, l'API et SQLite ont répondu localement en HTTP 200. Les
  conteneurs ont ensuite été arrêtés proprement, sans supprimer le volume.
- Le workflow CI est renforcé, mais **aucune exécution GitHub Actions distante n'est revendiquée** :
  la branche n'a été ni poussée ni déployée.

Le sprint affecte **132 fichiers du projet : 94 fichiers suivis modifiés et 38 fichiers ajoutés,
rapport inclus**. Les deux audits historiques non suivis sont exclus de ce comptage et conservés
inchangés.

### Fonctionnalités ajoutées

- découverte Free-to-Play alimentée directement par FreeToGame, avec états chargement/erreur/vide,
  nouvel essai, cache et attribution ;
- export JSON des données du compte authentifié ;
- préférences de confidentialité avec retrait ou modification du consentement ;
- contrôle de santé `/health` incluant SQLite ;
- rate limiting natif ASP.NET Core sur les routes sensibles ;
- mesure de couverture et plans de tests traçables frontend/backend ;
- canonical, `noindex` ciblé et protections HTTP cohérentes sur Netlify et nginx.

### Bugs et faiblesses corrigés

- fuite temporaire de cache et course du panier lors d'un changement d'utilisateur ;
- succès checkout déduit d'un simple paramètre d'URL ;
- confusion entre paiement simulé et Stripe test, gestion incomplète des erreurs et des commandes en
  attente ;
- double application du facteur de résolution, RAM ignorée dans le verdict, catégories CPU/GPU non
  garanties et recommandations hors stock ;
- commandes annulées comptées dans le chiffre d'affaires ;
- suppression de compte non transactionnelle et export/consentement incomplets ;
- validation d'entrées, clé JWT de production, logs structurés et dépendances vulnérables ;
- lacunes ciblées d'accessibilité : labels, focus, régions dynamiques, dialogues et mouvement réduit.

### Commandes de validation exécutées

| Périmètre | Commandes | Résultat final |
|---|---|---|
| Frontend | `npm run lint` ; `npm test -- --maxWorkers=2` ; `npm run test:coverage -- --maxWorkers=2` ; `npm run build` | Succès ; 118/118 tests ; seuil lignes ≥ 50 % respecté ; build Vite produit |
| npm | `npm audit` à la racine ; `npm audit` et `npm audit --omit=dev` dans `client/` | 0 vulnérabilité détectée pour les trois audits |
| Backend | `dotnet restore FrameForge.sln --verbosity minimal` ; `dotnet build api/api.csproj -c Release --no-restore` ; `dotnet test api.Tests/api.Tests.csproj -c Release --no-restore` | Succès ; build 0 avertissement/0 erreur ; 87/87 tests |
| Couverture backend | `dotnet test api.Tests/api.Tests.csproj -c Release --no-build --collect:"XPlat Code Coverage" --results-directory TestResults/final-after-review` | Cobertura généré ; lignes 80,50 % |
| NuGet | `dotnet list FrameForge.sln package --vulnerable --include-transitive` | Aucun package vulnérable détecté dans les deux projets |
| Docker | `docker compose config` ; `docker compose build` ; `docker compose up -d` ; contrôles HTTP ; `docker compose stop` | Configuration et images valides ; parcours nginx → API → SQLite validé ; arrêt propre |

## 2. Tableau RNCP avant / après

| Compétence | État avant | Modification | Preuve | État après | Action humaine restante |
|---|---|---|---|---|---|
| C11 — RGPD | 🟠 PREUVE PARTIELLE | Consentement daté/versionné et révocable, politique factuelle, export propriétaire, suppression transactionnelle | `client/src/lib/consent.ts`, `Privacy.tsx`, `AccountController.cs`, `AccountPrivacyTests.cs` | 🟠 PREUVE PARTIELLE | Validation juridique, rectification, durées/purges et double opt-in réel |
| C13 — Interface/accessibilité | 🟠 PREUVE PARTIELLE | Labels, lien d'évitement, focus visible, annonces dynamiques, dialogue, navigation et mouvement réduit | `Layout.tsx`, `Navbar.tsx`, `index.css`, tests de composants | 🟠 PREUVE PARTIELLE | Audit RGAA manuel, lecteur d'écran et audit navigateur axe/WAVE |
| C15 — UX | 🟠 PREUVE PARTIELLE | États d'erreur/chargement/vide, nouvel essai, checkout honnête, isolation de session et fin du faux succès RAM | `Games.tsx`, `CheckoutSuccess.tsx`, `Checker.tsx`, contextes et tests associés | 🟠 PREUVE PARTIELLE | Tests utilisateurs ; rendre l'URL de réouverture des scripts de détection compatible avec le site public |
| C16 — Qualité/sécurité/écoconception frontend | 🟠 PREUVE PARTIELLE | CSP/headers, dépendances corrigées, cache borné, lint/tests/build et seuil de couverture | `netlify.toml`, `client/nginx.conf`, `vite.config.ts`, sorties de validation | 🟠 PREUVE PARTIELLE | Recontrôler les headers publics ; mesurer Lighthouse/écoconception et traiter polling/images si nécessaire |
| C17 — API tierce frontend | 🔴 MANQUANT | Intégration directe FreeToGame depuis React, sans secret et sans relais API FRAMEFORGE | `freeToGame.ts`, `Games.tsx`, tests réseau simulés, `docs/11-api-tierce-frontend.md` | ✅ PREUVE FORTE | Revalider périodiquement le CORS externe et capturer le flux navigateur |
| C18 — Tests frontend | 🟠 PREUVE PARTIELLE | Provider V8, seuil CI, 19 nouveaux fichiers de tests ciblés et plan de tests | 118/118 tests ; 60,53 % lignes ; `docs/09-plan-tests-frontend.md` | ✅ PREUVE FORTE | Ajouter E2E/accessibilité si le référentiel ou le jury les exige explicitement |
| C19 — Industrialisation frontend | ✅ PREUVE FORTE | CI enrichie avec couverture bloquante, audit production, artefact et build conteneur | `.github/workflows/ci.yml` et reproduction locale des commandes | ✅ PREUVE FORTE | Pousser la branche et conserver une exécution GitHub Actions verte |
| C20 — SEO/analytics | 🟠 PREUVE PARTIELLE | Canonical, `noindex`, sitemap/robots, métadonnées, JSON-LD et analytics soumis au consentement | `seo.ts`, `sitemap.xml`, `robots.txt`, `analytics.ts` et tests | 🟠 PREUVE PARTIELLE | Activer/vérifier GoatCounter, exécuter Lighthouse et décider du traitement de la limite CSR |
| C21 — Persistance/sécurité | ✅ PREUVE FORTE | Suppression transactionnelle, révocation effective après suppression, volume SQLite Docker et health check DB | `AccountController.cs`, `Program.cs`, tests d'intégration, Compose | ✅ PREUVE FORTE | Valider disque persistant, sauvegarde et restauration sur Render |
| C23 — Paiement/monétisation | 🟠 PREUVE PARTIELLE | Modes `Simulation`/`StripeTest` explicites, succès confirmé serveur, vérification Stripe, stock idempotent | `CheckoutController.cs`, UI checkout et tests dédiés | 🟠 PREUVE PARTIELLE | Configurer Stripe test, effectuer une carte test et, si nécessaire, ajouter un webhook signé |
| C24 — API sécurisée | 🟠 PREUVE PARTIELLE | Rate limiting, validation DTO/métier, JWT robuste en production, ownership, rôles et logs sans PII | `Program.cs`, `JwtKeyProvider.cs`, contrôleurs et tests auth/validation/rate limit | 🟠 PREUVE PARTIELLE | Retirer/protéger les comptes démo publics, borner les proxies de confiance en production et réaliser un test d'intrusion si requis |
| C25 — Tests backend | 🟠 PREUVE PARTIELLE | Cas ajoutés sur auth, RGPD, checkout, scoring, validation, rate limiting et santé ; seuil CI | 87/87 ; 80,50 % lignes ; `docs/10-plan-tests-backend.md` | ✅ PREUVE FORTE | Conserver le rapport d'artefact issu d'une future exécution CI distante |
| C26 — Industrialisation backend | 🟠 PREUVE PARTIELLE | Solution, restore/build/test/audit/coverage CI, health check et build/run Docker validé localement | `FrameForge.sln`, workflow, Dockerfiles, Compose et contrôles HTTP | 🟠 PREUVE PARTIELLE | Exécuter la CI distante, vérifier le CD, la production, le monitoring et les sauvegardes |

Ces statuts évaluent uniquement les preuves présentes ou exécutées. Ils ne constituent ni une
validation officielle du titre, ni une conformité juridique ou d'accessibilité globale.

## 3. API tierce

| Élément | Implémentation |
|---|---|
| Fournisseur | FreeToGame |
| Endpoint | `GET https://www.freetogame.com/api/games?platform=pc&sort-by=popularity` |
| Fichier frontend principal | `client/src/api/freeToGame.ts` |
| Intégration UI/cache | `client/src/api/queries.ts` et `client/src/pages/Games.tsx` |
| Données reçues | identifiant, titre, miniature, description courte, genre, plateforme, date et URL publique |
| Données envoyées | paramètres publics `platform=pc` et `sort-by=popularity` ; aucune donnée personnelle FRAMEFORGE |
| Authentification | aucune, conformément au caractère public de l'endpoint |
| Résilience | délai de 8 secondes, `AbortController`, annulation React Query, erreur HTTP/format, états chargement/erreur/vide et nouvel essai |
| Cache | fraîcheur 30 minutes, conservation 1 heure, un seul nouvel essai, pas de recharge au focus |
| Tests | `client/src/api/freeToGame.test.ts` et `client/src/pages/Games.test.tsx`, avec réseau simulé |

La sécurité repose sur HTTPS, une constante limitée au domaine `www.freetogame.com`,
`credentials: "omit"`, `referrerPolicy: "no-referrer"`, l'absence de secret navigateur, une
validation du tableau et des champs/URL reçus, une limite de six éléments et l'échappement React.
Le test externe daté du 21 septembre 2026 a renvoyé HTTP 200 et
`Access-Control-Allow-Origin: *` pour un GET avec origine ; ce comportement externe peut changer.

Cette API publique ne nécessite pas d'identification. La sécurisation repose sur HTTPS, l'absence
de secret client, la limitation des données transmises, le contrôle du domaine appelé, la
validation des réponses et la gestion des erreurs.

**API tierce métier consommée directement par le frontend : OUI**

## 4. Tests frontend

Commande exacte de la mesure finale, depuis `client/` :

```bash
npm run test:coverage -- --maxWorkers=2
```

| Mesure | Résultat final |
|---|---:|
| Fichiers de tests | 26 réussis |
| Tests | 118 réussis |
| Statements | 56,64 % (899/1 587) |
| Branches | 57,69 % (645/1 118) |
| Functions | 41,32 % (224/542) |
| Lines | **60,53 % (773/1 277)** |

Le seuil obligatoire de **50 % sur les lignes** est configuré et franchi. La couverture des
fonctions reste sous l'objectif souhaitable de 50 % ; elle n'est pas masquée et ne remet pas en
cause le seuil obligatoire demandé. La première mesure, effectuée avant l'ajout de tests, était de
12,38 % statements, 9,23 % branches, 8,13 % functions et 13,66 % lines. Le plan correspondant est
`docs/09-plan-tests-frontend.md`.

## 5. Tests backend

Commande exacte de la mesure finale, depuis la racine :

```bash
dotnet test api.Tests/api.Tests.csproj -c Release --no-build \
  --collect:"XPlat Code Coverage" \
  --results-directory TestResults/final-after-review
```

| Mesure | Résultat final |
|---|---:|
| Tests | 87 réussis, 0 échec |
| Line coverage | **80,50 % (4 517/5 611)** |
| Branch coverage | **52,83 % (307/581)** |
| Method coverage | **85,43 % (393/460)** |

Avant le sprint : 50 tests, 78,88 % de lignes, 44,39 % de branches et 75,56 % de méthodes. Les
nouveaux cas couvrent les corrections réellement apportées, sans multiplication artificielle. Le
plan traçable est `docs/10-plan-tests-backend.md`.

## 6. Sécurité

- **Headers frontend** : CSP, `X-Content-Type-Options: nosniff`, `Referrer-Policy`,
  `Permissions-Policy` et `X-Frame-Options: DENY` sont alignés dans `netlify.toml` et
  `client/nginx.conf`. Les headers nginx ont été observés pendant le run Docker local.
- **CSP** : `default-src 'self'`, objets et frames interdits, `frame-ancestors 'none'`, avec seulement
  les domaines réellement nécessaires pour FreeToGame, GoatCounter, Google Fonts, eBay et
  Wikimedia. L'inline CSS reste autorisé pour les styles réellement utilisés ; aucun `unsafe-eval`.
- **Rate limiting** : login 10 requêtes/60 s, inscription 5/600 s, support public 5/600 s et calculs
  30/60 s par partition, configurables côté serveur.
- **Validation** : annotations et contrôles métier sur longueurs, plages, enums, résolution/FPS/RAM,
  quantité/note/URL, catégories CPU/GPU et propriétés de produit.
- **JWT** : clé suffisamment robuste obligatoire en production ; valeurs manquantes, faibles ou de
  type exemple/remplacement sont refusées au démarrage. Un token d'un compte supprimé n'est plus
  accepté car l'utilisateur est revalidé en base.
- **Logs** : événements structurés pour auth, mutations admin, checkout, suppression de compte,
  support et services externes, sans mot de passe, JWT, clé, carte ou corps privé complet.
- **Health check** : `/health` répond de façon minimale et vérifie SQLite sans exposer chemin,
  connexion, secret ou stack trace ; la réponse est `no-store`.
- **Dépendances corrigées** : notamment `axios`, React Router, Vitest/coverage, `concurrently`,
  `shell-quote`, `SQLitePCLRaw.bundle_e_sqlite3`, Stripe.net, SDK de test, xUnit et coverlet.
- **Risques applicatifs restant à traiter** : les comptes Client/Admin de démonstration et leurs mots
  de passe sont publics et seedés ; ils ne doivent pas protéger de données réelles. La configuration
  des forwarded headers accepte actuellement un proxy non préenregistré pour convenir à
  l'hébergement dynamique ; l'accès direct à l'API doit être bloqué par l'infrastructure ou les
  plages de proxies doivent être bornées, faute de quoi l'IP utilisée pour le rate limiting peut
  dépendre d'un header non fiable. Un fichier local ignoré `.claude/settings.local.json`, signalé
  historiquement comme sensible, n'a pas été ouvert pendant ce sprint ; une règle explicite du
  `.gitignore` du dépôt empêche désormais son ajout accidentel.
- **Vulnérabilités restantes détectées** : aucune avec `npm audit` racine, `npm audit` client,
  `npm audit --omit=dev` et `dotnet list FrameForge.sln package --vulnerable
  --include-transitive` au 22 septembre 2026. Ce résultat daté n'est pas une garantie future.

## 7. RGPD

Les éléments techniques réellement présents après le sprint sont :

- consentement analytics refusé par défaut, choix symétrique, daté et versionné dans le navigateur ;
- chargement de GoatCounter uniquement après consentement et uniquement avec un code public valide ;
- commande « Préférences de confidentialité » pour consulter, modifier ou retirer le choix ;
- politique de confidentialité décrivant honnêtement compte, `sessionStorage`, panier serveur,
  commandes, avis, support, builds `localStorage`, tiers, Stripe/GoatCounter conditionnels,
  suppression et limites ;
- `GET /api/account/export` authentifié et limité au propriétaire : compte, commandes, avis,
  messages de support rattachés et panier, sans hash, stamp, token, secret, session Stripe ni données
  d'un autre utilisateur ; téléchargement JSON depuis l'interface ;
- `DELETE /api/account` authentifié, transactionnel, avec suppression des données liées, contrôle du
  résultat Identity et rollback en cas d'échec ; tests d'autorisation, d'isolation et de contenu.

Ce qui reste incomplet : validation juridique de la politique et des bases légales, responsable et
contact définitifs, registre de traitements, durées de conservation et purge automatique,
rectification autonome de l'e-mail, traitement des messages anonymes non rattachables, procédures
formelles de réponse aux droits, chiffrement/sauvegarde de production et vérification des
sous-traitants. Aucune conformité RGPD globale n'est revendiquée.

**DOUBLE OPT-IN RÉEL : NON CONFIGURÉ**

Aucun fournisseur e-mail n'est configuré et aucun envoi n'est simulé comme preuve réelle.

## 8. SEO / analytics

- `useSeo` gère title, description, canonical sans paramètres de requête, Open Graph, Twitter Cards,
  robots et JSON-LD ; les routes privées et la 404 sont en `noindex, nofollow`.
- `robots.txt` et un sitemap statique honnête couvrent les routes publiques stables. Les produits
  dynamiques ne sont pas figés artificiellement dans le sitemap.
- Des améliorations ciblées couvrent H1, labels et textes alternatifs, et les tests vérifient
  notamment canonical, métadonnées et `noindex`. La hiérarchie complète H2/H3, en particulier sur
  panier, commandes, fiche produit et administration, reste à auditer manuellement.
- La SPA reste rendue côté client : avant exécution JavaScript, une route comme `/jeux` reçoit le
  head de base. La route React 404 devient `noindex` après hydratation, mais le fallback SPA
  nginx/Netlify répond encore HTTP 200 : cette limite de **soft-404** reste donc ouverte. Aucun
  SSR/prérendu ni traitement edge n'a été ajouté uniquement pour gonfler la preuve.
- Le code GoatCounter est prêt et soumis au consentement, mais `VITE_GOATCOUNTER_CODE` reste vide :
  **analytics n'est pas activé ni vérifié en production**.
- Chrome/Chromium et Lighthouse n'étaient pas disponibles dans l'environnement : **aucun audit
  Lighthouse n'a été exécuté et aucun score n'est fourni**.

## 9. Corrections métier

- **Cache utilisateur** : le cache React Query est effacé au changement d'identité, à la déconnexion
  et après un 401 ; les clés privées ne peuvent plus survivre entre utilisateurs.
- **Panier** : un garde identité/version empêche une réponse lancée pour A d'écraser le panier de B.
- **Scoring/FPS** : le facteur de résolution n'est appliqué qu'une fois ; une configuration au niveau
  recommandé reste cohérente avec la cible FPS. Des cas de référence partagés valident la parité
  frontend/backend.
- **RAM** : la capacité intervient désormais dans `MeetsRecommended`. Si le verdict échoue sans
  alternative CPU/GPU, le Checker n'affiche plus un faux succès et invite à vérifier la RAM et les
  prérequis ; un test de composant couvre ce cas.
- **Catégories** : un GPU/CPU soumis au calcul doit appartenir à la bonne catégorie.
- **Stock** : les recommandations préfèrent les composants disponibles lorsqu'une alternative
  existe ; aucune compatibilité matérielle exhaustive n'est promise.
- **Checkout** : modes serveur explicites `Simulation` et `StripeTest`, commande initialement
  `Pending`, confirmation propriétaire côté serveur, contrôle du statut Stripe, erreurs 502/503,
  stock traité de façon idempotente et absence de succès fondé sur `?simulated=1`. Une session
  Stripe active en attente est conservée ; l'historique des anciennes simulations est annulé plutôt
  que supprimé. **Aucun paiement Stripe avec carte test n'a été effectué pendant ce sprint et aucun
  webhook signé n'est configuré.**
- **Dashboard** : seuls les statuts `Paid` et `Shipped` contribuent au revenu ; `Cancelled` et
  `Pending` en sont exclus.
- **Compte** : export propriétaire, suppression atomique et invalidation des JWT après effacement.

## 10. CI/CD / Docker

Le workflow `.github/workflows/ci.yml` conserve les étapes existantes et ajoute :

- frontend : `npm ci`, lint, couverture avec seuil lignes ≥ 50 %, audit production, build et artefact
  de couverture ;
- backend : restore, build Release, tests/couverture, contrôle lignes ≥ 50 %, audit NuGet et artefact
  Cobertura ;
- global : validation Compose puis build des deux images après succès des jobs applicatifs.

Les commandes applicatives équivalentes ont toutes réussi localement. **Le workflow GitHub n'a pas
été exécuté après ces changements**, car aucun commit n'a été poussé. Aucun CD Netlify/Render et
aucune vérification de la version publique ne sont donc revendiqués.

Docker a réellement été validé pendant la finalisation : `docker compose config`, construction des
images, démarrage puis contrôles de l'état exact du code. Le démarrage a reçu une valeur JWT locale,
temporaire et conforme via `FRAMEFORGE_JWT_KEY` ; sa valeur n'est volontairement ni affichée ni
versionnée. Le 22 septembre 2026 :

- `GET /health` → 200, état API et SQLite `Healthy` ;
- `GET /api/products?pageSize=1` via nginx → 200, un produit et total 74 ;
- `GET /` → 200 avec CSP et métadonnées ;
- `robots.txt`, `sitemap.xml` et le repli SPA `/jeux` avaient également répondu 200 lors du run ;
- les conteneurs ont été arrêtés avec `docker compose stop`, volume `api-data` conservé.

Les logs locaux ont aussi révélé des avertissements non bloquants à traiter selon l'hébergement :
séquençage de reconstruction de tables SQLite pendant certaines migrations, clés ASP.NET Data
Protection éphémères/non chiffrées dans le conteneur et absence de port HTTPS direct pour la
redirection API locale derrière nginx. Aucun monitoring centralisé, sauvegarde/restauration,
persistance Render, health check public ou déploiement automatique n'a été vérifié.

## 11. Actions humaines restantes

1. **Activer GoatCounter**, si souhaité : créer un site GoatCounter ; récupérer son code public ;
   configurer `VITE_GOATCOUNTER_CODE` dans Netlify ; rebuild/deploy ; accepter analytics ; vérifier
   l'événement dans GoatCounter.
2. **Valider Stripe en test uniquement** : placer une `sk_test_...` dans le coffre de variables
   Render, jamais dans Git ; lancer une commande avec une carte de test ; vérifier succès, annulation,
   statut et stock. Décider ensuite si un webhook signé et sa réconciliation sont requis.
3. **Livrer la branche** : relire les changements, créer le ou les commits, pousser puis ouvrir une
   pull request (ou intégrer sur `main`) afin de déclencher et vérifier GitHub Actions ; contrôler
   ensuite les déploiements Netlify/Render et leurs variables sans les afficher.
4. **RGPD** : faire valider textes, bases légales, contact, sous-traitants, durées, purge,
   rectification et procédures par le propriétaire/conseil compétent. Choisir et configurer un vrai
   fournisseur e-mail avant toute revendication de double opt-in.
5. **Accessibilité/qualité** : exécuter un audit RGAA manuel, clavier et lecteur d'écran, axe/WAVE et
   Lighthouse sur accueil, boutique et jeux ; corriger puis conserver les rapports réels.
6. **UX** : organiser des tests avec de vrais utilisateurs, dater le protocole et conserver les
   retours réels sans les reconstituer rétroactivement. Corriger/configurer l'URL des scripts
   `detect-pc.bat` et `detect-pc.ps1`, qui ciblent encore `localhost:5173`, avant de promettre une
   réouverture automatique depuis le site public, puis tester réellement le parcours sous Windows.
7. **Exploitation Render** : confirmer le disque persistant SQLite, définir sauvegarde/restauration,
   rotation des secrets, supervision, alertes et rétention des logs ; tester une restauration.
8. **Secrets et comptes de démonstration** : révoquer/faire tourner tout identifiant eBay qui aurait
   été conservé dans le fichier local ignoré `.claude/settings.local.json`, sans l'ouvrir en séance
   ni le committer ; retirer ou isoler les identifiants Admin/Client publics avant tout usage avec
   des données réelles ; borner les proxies de confiance ou bloquer l'accès direct à l'API.
9. **Preuves humaines historiques** : joindre uniquement les wireframes, décisions, Kanban ou traces
   de veille réellement produits et datables par le propriétaire ; ne rien fabriquer après coup.

## 12. Preuves pour le mémoire

Avant toute capture, masquer JWT, cookies, adresses e-mail, identifiants, clés et données privées.
Une sortie de terminal doit afficher la commande et son résultat utile, sans secret d'environnement.

| Compétence | Capture | Emplacement | Ce qu'elle prouve | Légende conseillée |
|---|---|---|---|---|
| C17 | DevTools Network filtré sur `freetogame.com`, requête GET et réponse 200/CORS, avec la rubrique affichée | Page `/jeux`, navigateur en local ou après déploiement | Le navigateur appelle directement l'API métier tierce sans passer par `/api` | « Consommation directe et résiliente de FreeToGame depuis React » |
| C17/C15 | Trois états utiles maximum : chargement, résultat avec attribution, erreur ou vide | `/jeux`, en utilisant les mocks/tests ou une coupure réseau contrôlée | Gestion UX du cycle de requête externe | « États contrôlés de l'intégration FreeToGame » |
| C18 | Résumé terminal Vitest coverage | `client/`, commande de la section 4 | 118 tests et ligne coverage 60,53 %, supérieur au seuil | « Couverture automatisée du frontend après finalisation » |
| C25 | Résumé xUnit et lignes Cobertura | Racine, commande de la section 5 et rapport XML/outil de visualisation | 87 tests et couverture backend mesurée | « Tests d'intégration et couverture du backend » |
| C16 | Réponse `curl -I http://localhost:8080/` montrant CSP, nosniff, frame, referrer et permissions | Environnement Docker local redémarré | Les protections sont réellement servies par nginx | « En-têtes de sécurité du frontend conteneurisé » |
| C11 | Bannière puis dialogue « Préférences de confidentialité » | Accueil et pied de page | Refus initial, consultation, modification et retrait du consentement | « Consentement analytics modifiable et révocable » |
| C11 | Téléchargement export JSON avec valeurs personnelles masquées | Espace compte/commandes et onglet téléchargements | Portabilité limitée aux données du propriétaire | « Export sécurisé des données FRAMEFORGE » |
| C13/C15 | Parcours clavier avec lien d'évitement et focus visible, puis message dynamique | Accueil, login ou jeux | Améliorations d'accessibilité et feedback, sans prétendre à une conformité RGAA | « Navigation clavier et retours accessibles » |
| C20 | Head inspecté montrant canonical/robots/OG, puis `robots.txt` et `sitemap.xml` | Pages publiques et outils développeur | Socle SEO on-page réellement livré | « Métadonnées, canonical et indexation maîtrisée de la SPA » |
| C21/C24 | Même endpoint admin en 401 anonyme, 403 Client et 200 Admin, jetons masqués | Tests automatisés ou client HTTP local | Authentification, rôle et séparation des droits | « Contrôle d'accès JWT et autorisation par rôle » |
| C24/C26 | `GET /health` et réponse minimale `Healthy` | `http://localhost:8080/health` ou future URL Render | Disponibilité API et accès SQLite sans fuite de configuration | « Sonde de santé API et base de données » |
| C23 | Affichage explicite du mode effectif « paiement simulé » ou « Stripe test », puis confirmation serveur | Panier/checkout local ; Stripe test seulement après configuration humaine | Décision serveur visible, séparation des modes et absence de faux succès URL | « Checkout démonstration validé côté serveur » |
| C19 | Workflow et futur run GitHub Actions vert avec les trois jobs | `.github/workflows/ci.yml` et onglet Actions après push | Couverture/audits/builds exécutés en CI ; capture seulement après run réel | « Pipeline CI frontend, backend et conteneurs » |
| C26 | `docker compose ps` pendant le run, `/health`, `/api/products` et page frontend | Terminal et navigateur local | Chaîne frontend → nginx → API → SQLite réellement exécutée en finalisation | « Validation locale de l'environnement conteneurisé » |
| C15/C23 | Test automatisé qui refuse `?simulated=1` sans commande confirmée | Sortie Vitest ciblée ou code + résultat de test | Correction du faux écran de succès | « Confirmation checkout fondée sur l'état serveur » |

Les captures dépendant de GitHub, Netlify, Render, Stripe, GoatCounter, Lighthouse ou d'un audit RGAA
ne doivent être ajoutées au mémoire qu'après leur exécution réelle par le propriétaire.
