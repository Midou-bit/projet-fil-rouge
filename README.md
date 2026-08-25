# FRAMEFORGE ⚙️

> Boutique de composants PC **+ moteur de recommandation gaming**.
> Tu choisis un jeu → on te dit quoi acheter pour le faire tourner. Et inversement.

Projet de Master 1 — Développement Fullstack. Stack **React + Vite (TypeScript)** côté front,
**ASP.NET Core 8 Web API + EF Core** côté back.

---

## 🚀 Démarrage rapide

### Prérequis
- **.NET 8 SDK** ([télécharger](https://dotnet.microsoft.com/download/dotnet/8.0))
- **Node.js 18+** et npm

> Base de données : **SQLite** (zéro-install). Le fichier `api/frameforge.db` est créé
> automatiquement au premier lancement, avec migration + **seed** (74 composants, 2 comptes démo).
> Aucune configuration requise.

### Données du catalogue
- **Composants** : **74 références réelles** issues du dataset open-source
  [docyx/pc-part-dataset](https://github.com/docyx/pc-part-dataset) (vrais noms, prix, specs), transformées
  **hors-ligne** → `api/Data/seed-components.json` (embarqué, lu au seed). Le `PerfScore` et les specs de
  compatibilité (socket, DDR, TDP, wattage) sont **dérivés** (absents du dataset). Visuel : **vraie photo eBay**
  si récupérée via `tools/fetch-ebay-images.py` (voir ci-dessous), sinon photo Wikimedia représentative
  (`ComponentImages`), sinon **tuile générée on-brand** (thème Tron) — toujours un visuel cohérent, jamais de
  case vide.
- **Jeux** : importés depuis **[FreeToGame](https://www.freetogame.com/api-doc)** (sans clé) **EN ARRIÈRE-PLAN**
  → vrais jeux + vraies miniatures, **sans bloquer le démarrage** (l'API répond tout de suite, les jeux
  apparaissent ~2-3 s après, une seule fois sur base fraîche). Hors-ligne → fallback de 16 jeux curatés.
- Le **PerfScore** (0-100) des composants et les seuils de perf des jeux sont calculés en interne
  (modèle d'estimation assumé, pas de benchmark réel).

### Installation (une seule fois)
```bash
npm run install:all      # installe la racine + le client
```

### Lancer le projet (front + back en UNE commande)
```bash
npm run dev
```
- **API** (cyan) → http://localhost:5099 — Swagger sur http://localhost:5099/swagger
- **WEB** (jaune) → http://localhost:5173

Le front parle à l'API via un proxy Vite (`/api`) ; le CORS est aussi configuré.

### Comptes de démo (seed)
| Rôle   | Email                   | Mot de passe        |
|--------|-------------------------|---------------------|
| Admin  | `admin@frameforge.dev`  | `AdminFrame2026!`   |
| Client | `client@frameforge.dev` | `ClientFrame2026!`  |

> Politique de mot de passe conforme **CNIL** : 12 caractères minimum, avec majuscule, minuscule,
> chiffre et caractère spécial, couplée à un verrouillage de compte après 5 échecs.

(Le bouton **Connexion** propose ces comptes en un clic.)

### 📷 Photos composants depuis eBay (optionnel)

Par défaut les composants affichent une photo Wikimedia représentative ou une tuile générée. Pour de
**vraies photos produit eBay**, `tools/fetch-ebay-images.py` récupère hors-ligne une image par composant
via l'**API eBay Browse** (recherche publique par nom) et l'écrit dans `seed-components.json`.

**Prérequis côté eBay** (une fois, sur [developer.ebay.com](https://developer.ebay.com)) :
1. Créer une appli → un keyset **Sandbox** est généré automatiquement.
2. Sur la page **Application Keys**, cliquer **"Create a keyset"** sous **Production**.
3. Le keyset Production est créé **désactivé** (conformité obligatoire) → aller dans l'onglet
   **Alerts & Notifications** (environnement **Production**), activer le toggle **"Exempted from
   Marketplace Account Deletion"** et choisir **"I do not persist eBay data"** (exact pour ce script :
   recherche publique anonyme, aucune donnée de compte eBay stockée).
4. Récupérer l'**App ID (Client ID)** et le **Cert ID (Client Secret)** Production (sans `SBX` dedans).

**Exécution :**
```bash
export EBAY_CLIENT_ID=...        # App ID Production
export EBAY_CLIENT_SECRET=...    # Cert ID Production
python3 tools/fetch-ebay-images.py       # remplit imageUrl dans seed-components.json

# seed-components.json est un EmbeddedResource → il faut rebuild pour ré-embarquer le JSON,
# puis régénérer la base (le seed catalogue ne s'exécute que sur une base vide) :
dotnet build api/api.csproj
rm -f api/frameforge.db api/frameforge.db-shm api/frameforge.db-wal
npm run dev                              # reseed au démarrage avec les nouvelles URLs
```
Sans clés (ou clés invalides), le script s'arrête proprement avec un message clair — rien n'est cassé,
les composants gardent leur visuel de repli.

---

## 🧭 Les 4 entrées du site

1. **Boutique** — catalogue par catégorie, recherche, filtres (prix/marque/perf), tri, pagination,
   fiche produit, avis, panier, **paiement Stripe test**.
2. **Je veux jouer à X** (`/jouer`) — choisis un jeu + résolution + FPS → **build complet recommandé**,
   chiffré, ajoutable au panier en un clic.
3. **Vérificateur** (`/verificateur`) — choisis ton CPU + GPU (catalogue) + un jeu → verdict immédiat
   (« ça tourne » / « trop faible ») + **upgrade conseillé avec lien d'achat**.
4. **Builder interactif** (`/builder`) — assemble ton PC, **barres de stats animées** (façon CoD)
   qui se recalculent en temps réel + **avant/après** sur un jeu donné.

---

## 💳 Paiement Stripe

Le checkout fonctionne en **deux modes** :
- **Stripe test configuré** → vraie session Stripe Checkout (carte test `4242 4242 4242 4242`). La
  confirmation revérifie le statut du paiement auprès de Stripe (`Session.PaymentStatus`) avant de
  décrémenter le stock — le client ne peut pas se marquer « payé » sans avoir réellement payé.
- **Sans clé Stripe** (par défaut) → **paiement simulé** (« mode démo ») pour rester démontrable
  sans configuration. La commande passe en `Paid`, le stock est décrémenté, le panier vidé.

Le stock est re-validé à la confirmation (pas seulement à la création) et protégé par un token de
concurrence : deux confirmations concurrentes sur le même produit ne peuvent pas survendre.

Pour activer Stripe réel, renseigner la clé dans `api/appsettings.Development.json` (voir ci-dessous).

---

## 🔑 Configuration des clés (secrets)

Les secrets ne sont **jamais committés** dans `api/appsettings.json` (qui ne contient que la structure).
Les vraies valeurs vont dans **`api/appsettings.Development.json`** (gitignoré).

1. Copier le template : `cp api/appsettings.Development.example.json api/appsettings.Development.json`
2. Renseigner ce qui t'intéresse (tout est **optionnel**) :
   - `Jwt:Key` — clé de signature (≥ 32 car.). Absente → clé de dev de repli.
   - `Stripe:SecretKey` / `PublishableKey` — clés test Stripe. Absentes → checkout en mode démo simulé.

> Alternative idiomatique .NET : `dotnet user-secrets` (les valeurs ne touchent jamais le disque du repo).

---

## ✅ Tests

Tests unitaires du moteur de score (xUnit) :
```bash
dotnet test        # depuis la racine ou api.Tests/
```
Couvre `ScoringService` : FPS estimés, facteur de résolution, bottleneck, qualité visuelle, verdicts.

---

## 🧠 Le moteur de score

Modèle d'**estimation assumé** (pas des benchmarks réels), dans `api/Services/ScoringService.cs` :
```
fpsGpuBound = (gpuScore / RecoGpuScore) * TargetFps * resolutionFactor   (1080p=1.0, 1440p=0.7, 4K=0.45)
fpsCpuBound = (cpuScore / RecoCpuScore) * TargetFps
fpsEstimé   = min(fpsGpuBound, fpsCpuBound)
```
+ pénalité de **bottleneck** si l'écart GPU/CPU dépasse 25 points, et 5 barres de stats
(perf gaming, CPU, qualité visuelle, FPS, rapport qualité/prix).

---

## 🗂️ Architecture

```
/frameforge
├── package.json          # orchestration front+back (concurrently)
├── api/                   # ASP.NET Core 8 Web API
│   ├── Controllers/       # Auth, Products, Categories, Cart, Checkout, Orders,
│   │                      # Games, Build, Reviews, Support, Admin
│   ├── Models/            # entités EF Core
│   ├── DTOs/              # objets de transfert (jamais d'entité brute exposée)
│   ├── Services/          # ScoringService, BuildService, CatalogImportService, TokenService, Mapping
│   ├── Data/              # AppDbContext, migrations, DbSeeder, ComponentImages
│   └── Program.cs
├── api.Tests/             # tests xUnit (ScoringService)
└── client/                # React + Vite + TypeScript
    └── src/
        ├── api/           # axios + types + endpoints
        ├── components/    # StatBar, StatPanel, ProductCard, MediaImage, Navbar, Toast…
        ├── context/       # AuthContext (JWT en mémoire), CartContext
        ├── pages/         # Home, Shop, ProductDetail, Games, Builder, Checker, PlayWhat…
        │   └── admin/     # Dashboard, Products, Categories, Orders, Support
        └── lib/
```

---

## 🔌 Endpoints principaux

```
POST   /api/auth/register | /api/auth/login
GET    /api/products  (search, category, brand, minPrice, maxPrice, minPerf, sort, page)
GET    /api/products/{id} | /api/products/{id}/reviews | /api/products/brands
POST   /api/products | PUT | DELETE                        [Admin]
GET    /api/categories | POST | PUT | DELETE               [Admin sur écriture]
GET/POST/PUT/DELETE /api/cart…                             [Auth]
POST   /api/checkout | POST /api/checkout/confirm/{id}     [Auth]
GET    /api/orders                                         [Auth]
GET    /api/admin/orders | PUT /api/admin/orders/{id}/status   [Admin]
GET    /api/games | /api/games/{id} | /api/games/{id}/build
POST   /api/check        (vérificateur)
POST   /api/build/calc   (builder temps réel)
POST   /api/reviews                                        [Auth]
POST   /api/support | GET /api/admin/support              [Admin sur lecture]
GET    /api/admin/stats                                    [Admin]
```

---

## 🎨 Design system

Direction **Tron** (froid, géométrique, glow cyan sur fond sombre) **+ accent jaune Cyberpunk**
réservé aux actions d'achat. Polices **Chakra Petch** (titres), **JetBrains Mono** (stats/prix),
**Space Grotesk** (corps). Animations courtes (200–300 ms), responsive, anti-fatigue.

---

## ⚠️ Hors-scope assumé

- Pas de vraie transaction bancaire (Stripe **test** / mode démo).
- Stock & prix en dur dans la BDD (seed).
- FPS = **modèle d'estimation** par formule, pas des benchmarks réels.
- Pas de logistique / livraison réelle.
