# Spécifications techniques de besoin

Traduction des besoins du [cahier des charges](01-cahier-des-charges.md) en exigences techniques
vérifiables. Chaque exigence porte un identifiant, un critère de vérification et le fichier qui la
met en œuvre.

---

## 1. Pile technique retenue

| Couche | Technologie | Version |
|---|---|---|
| Interface | React, Vite, TypeScript | React 19, Vite 8, TypeScript 6 |
| État serveur | TanStack React Query | 5 |
| Navigation | React Router | 7 |
| Animation | Framer Motion | 12 |
| Interface de programmation | ASP.NET Core Web API | .NET 8 |
| Accès aux données | Entity Framework Core | 8 |
| Base de données | SQLite | fichier local |
| Authentification | ASP.NET Core Identity, jeton JWT | 8 |
| Paiement | Stripe.net, mode `StripeTest` facultatif ou simulation | 52 |
| Tests back-end | xUnit, WebApplicationFactory, coverlet | 2.9 |
| Tests front-end | Vitest, Testing Library, jsdom | 4 |
| Intégration continue | GitHub Actions | v4 |
| Conteneurisation | Docker, nginx | images officielles |

La justification de ces choix figure dans la [note de veille](05-veille-technique.md).

---

## 2. Exigences fonctionnelles

### 2.1 Catalogue

| Id | Exigence | Vérification |
|---|---|---|
| EF-01 | Le catalogue expose au moins soixante-dix références réparties en sept catégories | `GET /api/categories` retourne sept entrées, somme des compteurs égale à 74 |
| EF-02 | La liste des produits est paginée, taille par défaut douze, maximum cent | `GET /api/products` retourne `items`, `total`, `page`, `pageSize`, `totalPages` |
| EF-03 | La liste accepte recherche, catégorie, marque, prix minimum et maximum, performance minimale et tri | Chaque paramètre modifie le jeu de résultats |
| EF-04 | Chaque produit porte un indicateur de performance entier de 0 à 100 | Champ `perfScore` présent sur chaque élément |
| EF-05 | Une fiche produit absente renvoie un état 404 et une page dédiée | `GET /api/products/999999` répond 404 |

### 2.2 Moteur d'estimation

| Id | Exigence | Vérification |
|---|---|---|
| EF-10 | Les images par seconde estimées sont la borne la plus basse entre la limite graphique et la limite processeur | Tests unitaires de `ScoringService.EstimateFps` |
| EF-11 | Les seuils de jeu portent déjà leur résolution et leur cible FPS ; le calcul ne réapplique pas de facteur de résolution | Tests de référence identiques frontend/backend |
| EF-12 | Un écart de plus de vingt-cinq points entre processeur et carte graphique applique une pénalité progressive | `ScoringService.BottleneckPenalty` |
| EF-13 | La performance globale pondère la carte graphique à 70 % et le processeur à 30 %, bornée entre 0 et 100 | `ScoringService.GamingPerformance` |
| EF-14 | Le verdict distingue trois états : recommandé, minimum, insuffisant | `ScoringService.Evaluate` |
| EF-15 | Une configuration recommandée est physiquement assemblable | Socket de la carte mère égal à celui du processeur, type de mémoire égal à celui de la carte mère, alimentation couvrant la consommation |
| EF-16 | La RAM minimale participe aux verdicts minimum et recommandé | Tests unitaires de `ScoringService.Evaluate` et de `client/src/lib/scoring.ts` |

### 2.3 Compte et sécurité d'accès

| Id | Exigence | Vérification |
|---|---|---|
| EF-20 | Le mot de passe exige douze caractères minimum et les quatre types de caractères | `Program.cs`, options Identity |
| EF-21 | Cinq échecs de connexion verrouillent le compte cinq minutes | Options de verrouillage Identity |
| EF-22 | Le jeton expire au bout de douze heures | `TokenService.CreateToken` |
| EF-23 | Une adresse électronique ne peut être utilisée deux fois | `RequireUniqueEmail` |
| EF-24 | Les routes d'administration sont refusées à un compte client | Réponse 403 |

### 2.4 Commande et paiement

| Id | Exigence | Vérification |
|---|---|---|
| EF-30 | Le stock est contrôlé à la création de la commande et de nouveau à la confirmation | `CheckoutController` |
| EF-31 | Deux confirmations concurrentes sur le même produit ne peuvent pas survendre | Jeton de concurrence sur la colonne de stock |
| EF-32 | En mode Stripe test, le statut du paiement est revérifié auprès de Stripe avant décrémentation | Lecture de `Session.PaymentStatus` |
| EF-33 | En mode `Simulation`, la commande reste en attente jusqu'à une confirmation serveur explicite ; aucune transaction financière n'a lieu | Mode démonstration |
| EF-34 | Une commande confirmée deux fois n'est traitée qu'une fois | Contrôle d'idempotence sur le statut |

### 2.5 Protection des données

| Id | Exigence | Vérification |
|---|---|---|
| EF-40 | La suppression du compte efface avis, panier, messages et commandes | `DELETE /api/account` |
| EF-41 | Les comptes de démonstration sont protégés contre la suppression | Réponse 400 explicite |
| EF-42 | Aucun traceur n'est déposé avant consentement explicite | `CookieBanner.tsx`, `analytics.ts` |
| EF-43 | Le compte connecté peut exporter en JSON ses données FRAMEFORGE liées, sans champs Identity sensibles ni session Stripe | `GET /api/account/export`, tests d'isolation |
| EF-44 | Le consentement de mesure est consultable, modifiable, retirable, daté et versionné | `PrivacyPreferences.tsx`, `consent.ts` |

---

## 3. Contrat de l'interface de programmation

Style REST, échanges en JSON, encodage UTF-8. Aucune entité de persistance n'est exposée
directement : toute réponse passe par un objet de transfert défini dans `api/DTOs/`.

### 3.1 Ressources publiques

```
POST   /api/auth/register            création de compte
POST   /api/auth/login               connexion, retourne le jeton
GET    /api/products                 liste paginée et filtrée
GET    /api/products/{id}            fiche détaillée
GET    /api/products/{id}/reviews    avis d'un produit
GET    /api/products/brands          marques disponibles
GET    /api/categories               catégories et compteurs
GET    /api/games                    catalogue de jeux
GET    /api/games/{id}               fiche d'un jeu
GET    /api/games/{id}/build         configuration recommandée
POST   /api/check                    verdict du vérificateur
POST   /api/build/calc               recalcul des indicateurs de l'assembleur
POST   /api/support                  message de support
GET    /health                      santé API et accès base, sans détail sensible
```

### 3.2 Ressources authentifiées

```
GET    /api/cart                     panier courant
POST   /api/cart/items               ajout au panier
PUT    /api/cart/items/{id}          modification de quantité
DELETE /api/cart/items/{id}          retrait d'une ligne
DELETE /api/cart                     vidage du panier
POST   /api/checkout                 création de la commande
POST   /api/checkout/confirm/{id}    confirmation du paiement
GET    /api/orders                   historique
GET    /api/orders/{id}              détail d'une commande appartenant au compte
POST   /api/orders/{id}/cancel       annulation d'une commande en attente
POST   /api/reviews                  publication d'un avis
GET    /api/account/export           export JSON des données liées au compte
DELETE /api/account                  suppression du compte et des données
```

### 3.3 Ressources réservées à l'administration

```
POST   /api/products                 création
PUT    /api/products/{id}            modification
DELETE /api/products/{id}            suppression
POST   /api/categories               création
PUT    /api/categories/{id}          modification
DELETE /api/categories/{id}          suppression
GET    /api/admin/orders             toutes les commandes
PUT    /api/admin/orders/{id}/status changement de statut
GET    /api/admin/support            messages reçus
GET    /api/admin/stats              indicateurs du tableau de bord
```

### 3.4 Codes de retour

| Code | Signification retenue |
|---|---|
| 200 | Succès avec corps |
| 201 | Ressource créée |
| 204 | Succès sans corps, cas de la suppression |
| 400 | Données invalides ou règle métier violée, corps `{ message }` ou `{ errors }` |
| 401 | Jeton absent, invalide ou expiré |
| 403 | Jeton valide mais rôle insuffisant |
| 404 | Ressource inexistante |
| 409 | Conflit de concurrence sur le stock |
| 429 | Limite de requêtes atteinte |
| 500 | Erreur interne, message générique sans détail technique en production |
| 502 | Service Stripe test temporairement indisponible |
| 503 | Mode de paiement ou configuration critique temporairement indisponible |

---

## 4. Exigences non fonctionnelles

### 4.1 Sécurité

| Id | Exigence | Mise en œuvre |
|---|---|---|
| ENF-01 | Toutes les réponses portent les en-têtes de sécurité | Intergiciel dans `api/Program.cs` |
| ENF-02 | Le transport est chiffré en production, avec HSTS | `UseHsts` et `UseHttpsRedirection` |
| ENF-03 | La chaîne de proxy est prise en compte sans boucle de redirection | `UseForwardedHeaders` |
| ENF-04 | Aucune trace d'exception n'est renvoyée au client en production | Gestionnaire d'exception dédié |
| ENF-05 | L'application refuse de démarrer en production sans clé de signature | `JwtKeyProvider.Resolve` |
| ENF-06 | Aucun secret n'est versionné | `.gitignore`, fichier d'exemple committé |
| ENF-07 | Les routes publiques sensibles sont limitées par adresse réseau | Politiques ASP.NET Core sur connexion, inscription, support et calculs |
| ENF-08 | La santé de l'API et de SQLite est vérifiable sans exposer de diagnostic interne | `GET /health` |

### 4.2 Performance et éco-conception

| Id | Exigence | Seuil |
|---|---|---|
| ENF-10 | Chaque page est un fragment chargé à la demande | Vérifié au build, un fichier par page |
| ENF-11 | Le paquet initial reste sous un mégaoctet non compressé | Mesuré à 660 kilooctets |
| ENF-12 | Les images sont en chargement paresseux | Attribut `loading="lazy"` |
| ENF-13 | Aucune liste n'est renvoyée sans pagination | Plafond de cent éléments par page |
| ENF-14 | Aucun appel réseau externe ne bloque le démarrage de l'interface de programmation | Import des jeux exécuté en tâche de fond |

### 4.3 Affichage et accessibilité

| Id | Exigence | Seuil |
|---|---|---|
| ENF-20 | L'affichage reste utilisable à partir de 375 pixels | Aucun défilement horizontal du corps de page |
| ENF-21 | Les tableaux larges défilent dans leur propre conteneur | Conteneur en défilement horizontal |
| ENF-22 | Toute image porte une alternative textuelle | Propriété obligatoire du composant d'image |
| ENF-23 | Les erreurs de saisie sont rattachées au champ et annoncées | `aria-invalid`, `role="alert"`, région active |
| ENF-24 | Les animations CSS et Framer Motion respectent la préférence de mouvement réduit | Règle média dédiée et `MotionConfig reducedMotion="user"` |

### 4.4 Référencement

| Id | Exigence | Mise en œuvre |
|---|---|---|
| ENF-30 | Titre et description propres à chaque page | Fonction `useSeo` |
| ENF-31 | Données structurées sur l'organisation et sur chaque produit | Blocs JSON-LD |
| ENF-32 | Plan de site et fichier d'exclusion des robots | Servis à la racine |
| ENF-33 | Image de partage au format 1200 par 630 | Balises Open Graph et Twitter |
| ENF-34 | Chargeur GoatCounter optionnel | Chargé uniquement après consentement et configuration d'un code de site |
| ENF-35 | Une URL canonique cohérente est publiée et les pages privées/404 sont en `noindex` | `useSeo`, canonical et robots meta |

### 4.5 Qualité

| Id | Exigence | Seuil |
|---|---|---|
| ENF-40 | Le code TypeScript est vérifié en mode strict | Échec du build sinon |
| ENF-41 | L'analyse statique ne remonte aucune erreur | ESLint en intégration continue |
| ENF-42 | Les couvertures de lignes frontend et backend dépassent cinquante pour cent | Seuils contrôlés par Vitest et GitHub Actions/Cobertura |
| ENF-43 | Toute fusion sur la branche principale déclenche build, analyse, tests, audits et construction Docker | GitHub Actions |

---

## 5. Environnements

| Environnement | Base | Paiement | Documentation d'API | Adresse |
|---|---|---|---|---|
| Développement | SQLite locale, régénérée | Simulé sauf clé fournie | Exposée | `localhost:5173` et `localhost:5099` |
| Conteneurs locaux | SQLite sur volume persistant | Simulé | Masquée | `localhost:8080` |
| Production | SQLite éphémère, régénérée à chaque déploiement | Simulé | Masquée | Netlify et Render |

Le routage du préfixe `/api` vers l'interface de programmation est assuré par le mandataire de Vite
en développement, par nginx dans les conteneurs, et par une règle de réécriture Netlify en production.
Le code de l'interface utilise une adresse de base relative et ignore cette différence.
