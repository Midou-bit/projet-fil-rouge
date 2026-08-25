# FrameForge — Front (React + Vite + TypeScript)

Interface de [FrameForge](../README.md) : boutique de composants PC + moteur de recommandation gaming.
Le back-end ASP.NET Core vit dans [`../api`](../api).

> Pour lancer **front + back ensemble**, utilise `npm run dev` à la **racine** du projet.
> Les commandes ci-dessous ne démarrent que le front (qui a besoin de l'API sur le port 5099).

## Scripts

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de dev Vite sur http://localhost:5173 (proxy `/api` → `localhost:5099`) |
| `npm run build` | Vérification TypeScript (`tsc -b`) puis build de production dans `dist/` |
| `npm test` | Tests unitaires Vitest (jsdom + Testing Library) |
| `npm run lint` | ESLint sur tout le projet |
| `npm run preview` | Sert le contenu de `dist/` en local |

## Communication avec l'API

[`src/api/client.ts`](src/api/client.ts) crée une instance axios avec `baseURL: '/api'` — **toujours
relatif**. C'est l'environnement qui route ce préfixe vers le back-end :

| Environnement | Mécanisme |
|---|---|
| Dev | proxy Vite ([`vite.config.ts`](vite.config.ts)) |
| Docker Compose | reverse-proxy nginx ([`nginx.conf`](nginx.conf)) |
| Netlify | règle de réécriture ([`public/_redirects`](public/_redirects)) |

L'interceptor injecte le JWT sur chaque requête ; un 401 sur une requête **authentifiée** purge la
session via `AuthContext`.

## Structure de `src/`

```
api/          axios, types, endpoints, hooks React Query
components/   StatBar, StatPanel, ProductCard, MediaImage, Navbar, CookieBanner, Toast…
context/      AuthContext (JWT en mémoire), CartContext
lib/          scoring, compatibilité, détection matériel, SEO (useSeo), analytics, format
pages/        Home, Shop, ProductDetail, Games, PlayWhat, Checker, Builder, Privacy…
  admin/      Dashboard, Products, Categories, Orders, Support
test/         setup Vitest
```

Chaque page est chargée en **lazy** ([`App.tsx`](src/App.tsx)) : le bundle initial reste léger.

## Variables d'environnement

| Variable | Rôle |
|---|---|
| `VITE_PLAUSIBLE_DOMAIN` | Domaine pour la mesure d'audience anonyme. Absente → aucun script de suivi n'est chargé. |

La mesure d'audience n'est activée qu'**après consentement explicite** via la bannière cookies
([`components/CookieBanner.tsx`](src/components/CookieBanner.tsx)).
