# Déploiement de FrameForge

## Adresses de production

| Élément | Adresse | Hébergeur |
|---|---|---|
| **Site** | https://frameforge-build.netlify.app | Netlify (offre gratuite) |
| **API** | https://frameforge-c231.onrender.com | Render (offre gratuite, Docker) |

Le site appelle l'API via `/api`, réécrit côté serveur par `client/public/_redirects`.
Paiement en **mode démo** (aucune clé Stripe en production).

Le reste de ce document explique comment reproduire ce déploiement de zéro.

---

Le site doit être **accessible en ligne** pour la soutenance. Deux options.

## Option A — Local « type production » (Docker Compose)

Vérifie que tout tourne comme en prod (front nginx + API conteneurisée) :

```bash
docker compose up --build
# → http://localhost:8080  (le front proxie /api vers l'API)
```

⚠️ Renseigne une vraie clé JWT en Production dans `docker-compose.yml` (`Jwt__Key`, ≥ 32 caractères),
sinon l'API refuse de démarrer (sécurité voulue).

## Option B — Mise en ligne (hébergeurs gratuits)

Architecture retenue : **API** sur un service Docker, **front** en statique. Les deux services
ci-dessous ont une offre gratuite suffisante pour la démonstration.

### 0. Prérequis — le projet doit être sur GitHub

Render et Netlify se branchent sur un **dépôt Git**. Si ce n'est pas déjà fait :

```bash
git init -b main
git status --short          # vérifier qu'aucun secret ne part (voir .gitignore)
git add -A && git commit -m "..."
git remote add origin git@github.com:<toi>/frameforge.git
git push -u origin main
```

> Ne doivent **jamais** être commités : `api/appsettings.Development.json` (clés) et `api/frameforge.db`
> (base locale). Ils sont couverts par `.gitignore` — le `git status` ci-dessus le confirme.

Le push déclenche aussi la CI GitHub Actions (`.github/workflows/ci.yml`) : build + tests API,
lint + tests + build front.

### 1. API — Render (ou Railway / Fly.io)

1. Render → *New* → *Web Service* → connecte le repo → **Root Directory : `api`** (détecte le `Dockerfile`).
2. Variables d'environnement :
   - `Jwt__Key` = une chaîne aléatoire ≥ 32 caractères **(obligatoire — l'API refuse de démarrer sans)**
   - `Stripe__SecretKey` = `sk_test_...` *(optionnel ; sinon paiement simulé — c'est le mode retenu)*
3. Déploie → tu obtiens une URL, ex. `https://frameforge-api.onrender.com`.
   (Render termine le TLS ; l'API gère `X-Forwarded-Proto` → pas de boucle de redirection.)

> **Si tu actives un jour de vraies clés Stripe**, ajoute aussi `Stripe__SuccessUrl` et
> `Stripe__CancelUrl` pointant sur le domaine public (`https://<ton-site>/checkout/success` et
> `/checkout/cancel`). Sans elles, `appsettings.json` renvoie l'acheteur sur `http://localhost:5173`
> après paiement. Sans clé Stripe (mode démo), ce point est sans effet.

### 2. Front — Netlify (ou Vercel)

1. **Avant de déployer**, ouvre `client/public/_redirects` et remplace l'hôte de la première règle par
   l'URL Render obtenue à l'étape 1. Le fichier est déjà versionné :
   ```
   /api/*  https://<URL-API-RENDER>/api/:splat  200
   /*      /index.html  200
   ```
   La règle `/api/*` en **200** est une réécriture côté serveur : le navigateur reste en same-origin,
   donc le CORS de l'API n'a pas besoin d'être élargi. La règle `/*` évite les 404 sur rafraîchissement
   d'une route React Router (`/boutique`, `/builder`…).
2. Netlify → *Add new site* → *Import from Git* → **Base directory : `client`**.
3. Build command : `npm run build` — Publish directory : `client/dist`. (Netlify sert HTTPS automatiquement.)
4. *(optionnel)* variable de build `VITE_GOATCOUNTER_CODE=ton-code` pour activer la mesure d'audience
   ([GoatCounter](https://www.goatcounter.com), gratuit et sans cookie). Le code est la partie qui
   précède `.goatcounter.com` dans l'adresse de ton tableau de bord. Sans elle, aucun script de suivi
   n'est chargé.

### 3. Renseigner le domaine réel (SEO)

Trois fichiers contiennent encore le domaine d'exemple `https://frameforge.example` — à remplacer par
l'URL Netlify, puis redéployer le front :

- `client/public/sitemap.xml` (8 URLs)
- `client/public/robots.txt` (ligne `Sitemap:`)
- `client/index.html` (bloc JSON-LD `Organization`, champ `url`)

### 4. Vérifier

- Ouvre l'URL Netlify → l'accueil s'affiche, la boutique charge les produits (preuve que `/api` est bien proxifié).
- Rafraîchis directement sur `/boutique` → pas de 404 (règle SPA active).
- Connexion avec un compte démo, ajout au panier, checkout (mode démo), page confidentialité, bannière cookies.
- `/robots.txt` et `/sitemap.xml` affichent le vrai domaine.
- Suppression de compte depuis « Mes commandes » (droit à l'effacement RGPD).

> **Cold-start** : sur offre gratuite, Render endort le conteneur après ~15 min d'inactivité et met
> 50-60 s à le réveiller. Le front encaisse (timeout axios 30 s + 3 retries), mais **réveille l'API
> quelques minutes avant la soutenance** en ouvrant l'URL Render — la démo sera instantanée.

> **SQLite en conteneur** : la base est recréée + seedée à chaque redéploiement (données de démo
> volatiles). Pour persister, monte un volume (fait dans `docker-compose.yml` en local).
