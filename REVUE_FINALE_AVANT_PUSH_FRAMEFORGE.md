# Revue finale avant push — FRAMEFORGE

Date de contrôle : 22 septembre 2026  
Verdict : **GO POUR PUSH**

## 1. Branche auditée

- Branche : `rncp/finalisation-technique`.
- HEAD conservé : `738074b` (`Affiche les comptes de démonstration sur la page de connexion`).
- Aucun reset, checkout destructif, rebase, merge, push, pull request ou déploiement n'a été effectué.
- Aucun commit n'a été créé pendant la revue : le contrôle du staging et le push restent sous contrôle utilisateur.

## 2. Nombre de fichiers modifiés, ajoutés et supprimés

État final incluant le présent rapport :

- **96 fichiers suivis modifiés** ;
- **41 fichiers non suivis**, dont 39 candidats au commit et 2 audits historiques volontairement exclus ;
- **0 fichier supprimé** ;
- **0 fichier staged**.

Le diff des fichiers déjà suivis représente 2 472 insertions et 857 suppressions. La commande de staging proposée en section 18 couvre 135 fichiers candidats (96 modifiés + 39 ajoutés) et exclut les deux audits historiques.

Le working tree n'est donc pas propre par choix : aucun commit automatique n'a été créé et les deux audits locaux restent non suivis.

## 3. Problèmes trouvés

| Niveau | Problème réel constaté | Conséquence avant correction |
|---|---|---|
| Fonctionnel | Les scripts Windows `detect-pc.bat` et `detect-pc.ps1` ouvraient encore `localhost:5173`. | Le téléchargement depuis le site public ne ramenait pas l'utilisateur vers le déploiement FrameForge. |
| Confidentialité | Le fragment `#pc=...` était consommé mais restait visible dans l'adresse et l'historique courant. | Une configuration matérielle pouvait être conservée dans un lien copié alors que la politique annonçait son retrait. |
| Métier | Une suggestion d'upgrade pouvait retomber sur une pièce disponible mais trop faible ; le calcul local ne filtrait pas le stock. | Une recommandation pouvait être présentée à tort comme une montée en gamme exploitable. |
| Déploiement | `DEPLOY.md` indiquait qu'un simple push de branche lançait la CI et donnait `client/dist` comme publish directory malgré une base Netlify déjà positionnée sur `client`. | Procédure GitHub Actions/Netlify techniquement trompeuse. |
| Documentation | Dates, commande de couverture backend, métriques finales et description de l'arborescence n'étaient plus alignées sur l'état contrôlé. | Preuves de tests non reproductibles ou chiffres devenus obsolètes. |

Aucun bug bloquant supplémentaire, migration manquante, erreur d'ownership, régression d'authentification ou incohérence de contrat frontend/backend n'a été identifié après correction.

## 4. Corrections appliquées

- URL publique `https://frameforge-build.netlify.app` configurée dans les deux scripts de détection.
- Retrait immédiat et sans nouvelle entrée d'historique du fragment matériel après sa lecture dans `Checker.tsx` ; le test Checker existant couvre ce comportement.
- `BuildService.UpgradeFor` limité aux composants en stock atteignant réellement le seuil ; retour `null` si aucun upgrade valable n'existe.
- Recommandation locale du Checker limitée elle aussi aux composants en stock atteignant le seuil.
- Test backend existant étendu au seuil impossible, sans multiplier artificiellement le nombre de tests.
- Procédure CI/Netlify, dates, commandes et métriques documentaires réalignées sur les validations finales.
- Aucun ajout de fonctionnalité, changement de stack, dépendance ou migration pendant cette revue.

## 5. Tests et contrôles exécutés

Frontend :

- `npm ci` : réussi ;
- `npm run lint` : réussi sans erreur ;
- `npm test -- --maxWorkers=2` : réussi ;
- `npm run test:coverage -- --maxWorkers=2` : réussi ;
- `npm run build` : réussi ;
- `npm audit` et `npm audit --omit=dev` : réussis, 0 vulnérabilité.

Backend :

- `dotnet restore FrameForge.sln` : réussi ;
- `dotnet build api/api.csproj -c Release --no-restore` : réussi ;
- `dotnet test api.Tests/api.Tests.csproj -c Release --no-restore` : réussi ;
- couverture XPlat/Cobertura : réussie ;
- `dotnet list FrameForge.sln package --vulnerable --include-transitive` : aucun paquet vulnérable signalé.

Contrôles complémentaires :

- `git diff --check` : réussi ;
- JSON, TOML et YAML parsés avec succès ; `actionlint` n'était pas installé, la CI a donc aussi été relue manuellement ;
- appel FreeToGame réel en lecture seule ;
- configuration, build, démarrage et smoke tests Docker sur l'état final ;
- recherche de secrets, fichiers indésirables et attribution interdite ;
- vérification des cinq derniers commits en format `fuller`.

Une exécution volontairement simultanée des suites backend et frontend a saturé l'hôte et produit six timeouts frontend. La suite frontend exacte, rejouée seule immédiatement après, a terminé avec 118/118 tests réussis ; aucune assertion métier n'est restée en échec.

## 6. Résultats frontend

- **26 fichiers de tests réussis sur 26**.
- **118 tests réussis sur 118**, 0 échec.
- TypeScript et build Vite réussis : 576 modules transformés.
- ESLint : 0 erreur.
- Contrats checkout, cache d'identité, réponse tardive du panier, consentement, export, SEO/noindex, FreeToGame, scoring, accessibilité ciblée et reduced motion couverts par les tests présents.
- Le build final contient les deux scripts Windows avec l'URL publique, sans occurrence de `localhost:5173` dans ces scripts.

## 7. Résultats backend

- **87 tests réussis sur 87**, 0 échec, 0 ignoré.
- Build Release : **0 avertissement, 0 erreur**.
- Authentification, JWT, rate limiting, validation DTO, rôles, ownership, checkout, stock concurrent, export/effacement transactionnel, health check, scoring, RAM et recommandations sont validés par les suites unitaires ou d'intégration.
- Aucun changement de modèle persistant nécessitant une nouvelle migration n'a été introduit par la revue.
- Le test final étendu confirme qu'aucun faux upgrade n'est renvoyé si le seuil est inaccessible.

## 8. Couverture

| Suite | Lignes | Branches | Fonctions/méthodes | Seuil CI |
|---|---:|---:|---:|---:|
| Frontend V8 | **62,26 %** (797/1 280) | 59,55 % (667/1 120) | 41,51 % (225/542) | lignes ≥ 50 % : respecté |
| Backend Cobertura | **80,51 %** (4 522/5 616) | 52,83 % (307/581) | 85,43 % (393/460) | lignes ≥ 50 % : respecté |

Les rapports HTML/Cobertura et `TestResults` sont des artefacts locaux ignorés, pas des fichiers à versionner.

## 9. Audits de dépendances

- Audit npm racine : 0 vulnérabilité.
- Audit npm client complet : 0 vulnérabilité.
- Audit npm client production (`--omit=dev`) : 0 vulnérabilité.
- Audit NuGet direct et transitif : aucun paquet vulnérable signalé.
- `npm ci` et `npm ls --depth=0` confirment la cohérence du lockfile et l'absence de dépendance invalide.
- Environnement validé : Node 20.19.6, npm 10.8.2 et SDK .NET 8.0.420, cohérents avec le dépôt et la CI.

## 10. Secrets

- Aucun secret à signature connue, clé privée, jeton GitHub, clé Stripe exploitable, JWT en dur ou en-tête Bearer n'a été trouvé dans les fichiers candidats.
- Aucun fichier n'est staged.
- `api/appsettings.Development.json` et `.claude/settings.local.json` existent localement mais sont ignorés ; leur contenu n'a pas été reproduit ni ajouté au diff.
- Les bases SQLite locales, `.env` et artefacts générés sont couverts par les règles d'exclusion pertinentes ; aucun certificat ou fichier de clé privée n'a été détecté dans le dépôt.
- Les mots de passe des deux comptes de démonstration sont publics et intentionnels ; ils ne doivent jamais être réutilisés avec des données réelles.
- Par prudence, toute ancienne clé réelle éventuellement stockée dans un fichier local de réglages doit être révoquée ou renouvelée par l'utilisateur ; cela ne bloque pas le push, car aucun de ces fichiers n'est suivi ou staged.

## 11. CI

- YAML syntaxiquement valide et workflow relu intégralement.
- Jobs API, client et conteneurs cohérents ; le job Docker dépend des deux jobs de validation.
- Node 20 et .NET 8 conformes aux prérequis.
- `npm ci`, lint, tests/couverture, seuil de lignes, audits, builds et artefacts sont correctement positionnés.
- Les chemins de travail et d'artefacts sont cohérents avec la racine du runner.
- `docker compose config` et les deux builds d'images réussissent localement.
- Aucun secret en dur, commit automatique, réécriture Git ou mécanisme modifiant auteur/committer n'est présent.
- Déclencheurs réels : pull request, ou push sur `main`. Le premier push de `rncp/finalisation-technique` seul ne lancera pas la CI tant qu'aucune pull request n'est ouverte.

## 12. Docker

- `docker compose config --quiet` : réussi avec une clé JWT éphémère forte.
- Images finales `fil_rouge-api` et `fil_rouge-web` : construites avec succès après les corrections.
- Conteneurs démarrés en environnement `Production` ; API et nginx opérationnels.
- Smoke tests HTTP : `/`, `/health`, `/api/products?pageSize=1`, `/jeux`, `/verificateur`, `/robots.txt`, `/sitemap.xml`, `/detect-pc.bat` et `/detect-pc.ps1` ont tous répondu **200**.
- Santé : `Healthy`, base `Healthy`.
- CSP, `nosniff`, anti-iframe, Referrer-Policy et Permissions-Policy présents sur le frontend nginx.
- Les conteneurs et le réseau temporaires ont été retirés après recette ; le volume `api-data` n'a pas été supprimé.

Les avertissements ASP.NET observés concernent les clés Data Protection non persistées dans ce conteneur de démonstration et l'absence de port HTTPS dans la topologie locale HTTP derrière nginx. Ils n'ont empêché aucune route ; le TLS public reste terminé par l'hébergeur. Ils sont à réévaluer si des tokens Identity persistants ou une autre topologie d'hébergement sont ajoutés.

## 13. Documentation

- `docs/09-plan-tests-frontend.md` et `docs/10-plan-tests-backend.md` portent les commandes, dates et métriques finales exactes.
- `docs/11-api-tierce-frontend.md` correspond au contrôle CORS du 22 septembre 2026.
- `README.md`, `DEPLOY.md`, `CHANGELOG.md` et les supports oraux modifiés sont alignés sur les résultats finaux.
- La documentation précise désormais le déclenchement réel de la CI et le chemin Netlify relatif correct (`dist`).
- Les trois rapports historiques n'ont pas été modifiés. Leurs empreintes avant/après sont restées identiques :
  - `AUDIT_MEMOIRE_FRAMEFORGE.md` : `987da61f…` ;
  - `AUDIT_INFOS_MANQUANTES_MEMOIRE.md` : `3f9d2a6d…` ;
  - `RAPPORT_SPRINT_RNCP_FRAMEFORGE.md` : `872b3d79…`.

## 14. Risques restants

Risques non bloquants pour la démonstration pédagogique :

- aucun paiement Stripe test de bout en bout ni webhook signé n'a été exécuté ; le mode validé est la simulation ;
- GitHub Actions, Netlify et Render n'ont pas été mutés pendant la revue : la validation finale de ces services reste à observer après push et pull request ;
- l'API fait confiance au proxy frontal déclaré pour les en-têtes forwarded ; l'isolation du port applicatif et le comportement de l'IP cliente doivent rester vérifiés chez l'hébergeur ;
- SQLite, sauvegarde, restauration, supervision et persistance Render relèvent encore de l'exploitation ;
- FreeToGame est un service externe : le GET était 200 avec CORS autorisant `GET`, mais ce comportement peut changer ; le fallback d'interface est prévu ;
- les comptes de démonstration sont partagés et ne doivent contenir aucune donnée réelle ;
- les tests automatisés ne remplacent pas une recette multi-navigateurs, un audit RGAA complet ou un test de charge.

Aucun de ces risques ne constitue un bug bloquant pour le périmètre de soutenance annoncé.

## 15. Fichiers à ne pas committer

À conserver hors commit :

- `AUDIT_MEMOIRE_FRAMEFORGE.md` ;
- `AUDIT_INFOS_MANQUANTES_MEMOIRE.md` ;
- `.claude/settings.local.json` ;
- `api/appsettings.Development.json` ;
- `.env`, `.env.local` et tout fichier de secrets réel ;
- `api/frameforge.db`, `api/frameforge.db-shm`, `api/frameforge.db-wal` ;
- `node_modules/`, `client/node_modules/`, `client/dist/`, `client/coverage/` ;
- `TestResults/`, `bin/`, `obj/`, logs, caches Python et fichiers IDE.

Ces chemins locaux sont ignorés. Les deux audits historiques restent visibles dans `git status` parce qu'ils sont volontairement non suivis ; la commande de staging ci-dessous les exclut explicitement. `RAPPORT_SPRINT_RNCP_FRAMEFORGE.md` et le présent rapport sont, eux, des livrables candidats au commit.

## 16. Commits locaux créés

- Aucun commit créé.
- Hash court : sans objet.
- Message : sans objet.
- HEAD est resté sur `738074b`.

Ce choix évite de préparer un historique sans nécessité et laisse à l'utilisateur le contrôle explicite du staging et du commit global du sprint.

## 17. Vérification de l'attribution Git

- Identité Git utilisateur conservée : **OUI**.
- Configuration `user.name` / `user.email` présente et cohérente avec l'auteur et le committer du HEAD : **OUI**.
- Identité assimilable à un bot ou un agent automatisé : **NON**.
- `Co-authored-by` IA présent dans les commits récents : **NON**.
- Mention IA interdite dans les messages/trailers récents : **NON**.
- Attribution interdite introduite dans le diff : **NON**.
- Configuration Git modifiée pendant la revue : **NON**.

L'adresse e-mail complète n'est volontairement pas reproduite dans ce rapport.

## 18. Commandes exactes à exécuter ensuite

Vérifier une dernière fois l'identité locale, stage tous les livrables sauf les deux audits, puis contrôler le diff staged avant commit :

```bash
git config user.name
git config user.email

git add -- . \
  ':(exclude)AUDIT_MEMOIRE_FRAMEFORGE.md' \
  ':(exclude)AUDIT_INFOS_MANQUANTES_MEMOIRE.md'

git diff --cached --check
git diff --cached --stat
git diff --cached --name-status
git status --short

git commit -m "feat: finalize RNCP technical sprint"
git log -1 --format=fuller
git push --set-upstream origin rncp/finalisation-technique
```

Après le push, ouvrir la pull request sur GitHub afin de déclencher le workflow, puis n'autoriser le déploiement qu'après validation de tous les jobs. Aucun de ces actes n'a été effectué pendant la revue.

## 19. Verdict final

**GO POUR PUSH**

Les builds, tests, seuils de couverture, audits de dépendances, contrôles de secrets, configuration CI, images Docker et parcours de fumée sont validés. Les défauts réels trouvés pendant la revue sont corrigés et couverts. Il ne reste aucun bloqueur technique connu dans le périmètre annoncé.
