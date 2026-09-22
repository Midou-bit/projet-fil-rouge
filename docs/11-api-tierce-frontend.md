# API tierce consommée directement par le frontend

## Fonctionnalité

La section **« Découverte Free-to-Play en direct »** complète le catalogue de jeux FRAMEFORGE. Elle affiche au plus six jeux populaires fournis en temps réel par FreeToGame, sans remplacer les jeux et exigences techniques gérés par l'API FRAMEFORGE.

Le flux réseau est distinct et directement observable dans les outils de développement du navigateur :

```text
Navigateur React
  -> GET https://www.freetogame.com/api/games?platform=pc&sort-by=popularity
  -> JSON FreeToGame
```

Aucun appel à l'API ASP.NET Core FRAMEFORGE n'intervient dans ce flux.

## Contrat utilisé

| Élément | Valeur |
|---|---|
| Fournisseur | [FreeToGame](https://www.freetogame.com/) |
| Documentation officielle | [FreeToGame API](https://www.freetogame.com/api-doc) |
| Endpoint | `https://www.freetogame.com/api/games?platform=pc&sort-by=popularity` |
| Méthode | `GET` HTTPS |
| Authentification | Aucune : ni compte, ni clé, ni jeton |
| Format | Tableau JSON de jeux |
| Données retenues | identifiant, titre, miniature, courte description, genre, plateforme, date et URL de la fiche FreeToGame |
| Données envoyées | paramètres publics `platform` et `sort-by`; aucune donnée de compte ou donnée personnelle FRAMEFORGE |

Le fournisseur demande une attribution par lien actif et indique d'éviter plus de dix requêtes par seconde. L'interface affiche donc un lien d'attribution visible. React Query conserve la réponse fraîche pendant 30 minutes, la garde en cache pendant une heure, ne recharge pas au focus et ne tente qu'une nouvelle fois en cas d'échec.

## Sécurité, CORS et résilience

Un contrôle en lecture seule effectué le 22 septembre 2026 depuis l'origine déclarée `https://frameforge-build.netlify.app` a obtenu une réponse HTTPS `200` avec `Access-Control-Allow-Origin: *` et une méthode `GET` autorisée. L'endpoint accepte ainsi le `GET` CORS simple utilisé par le frontend. Une requête `OPTIONS` a répondu `403`; l'intégration n'utilise donc aucun en-tête personnalisé ni méthode qui déclencherait un preflight.

La rubrique CORS de la documentation officielle oriente encore les intégrateurs vers RapidAPI. Le comportement observé de l'endpoint direct est donc documenté comme une preuve datée, pas comme une garantie permanente du fournisseur. Si cet en-tête disparaît, l'état d'erreur isolé préserve le reste de la page au lieu de contourner CORS par un proxy caché.

Cette API publique ne nécessite pas d'identification. La sécurisation repose sur HTTPS, l'absence de secret client, la limitation des données transmises, le contrôle du domaine appelé, la validation des réponses et la gestion des erreurs.

Mesures appliquées dans `client/src/api/freeToGame.ts` :

- endpoint HTTPS constant et limité au domaine `www.freetogame.com` ;
- `credentials: "omit"` et `referrerPolicy: "no-referrer"` ;
- aucun secret dans le code ou dans une variable `VITE_*` ;
- annulation transmise par React Query et délai maximal de huit secondes via `AbortController` ;
- vérification du statut HTTP et du fait que la réponse est un tableau ;
- validation minimale des identifiants, titres et URL HTTPS FreeToGame avant affichage ;
- échappement natif des textes par React ;
- états chargement, erreur, vide et bouton de nouvel essai ;
- échec isolé : le catalogue FRAMEFORGE continue de fonctionner si FreeToGame est indisponible.

## Fichiers d'implémentation

- `client/src/api/freeToGame.ts` : contrat TypeScript, appel direct, délai, annulation et validation ;
- `client/src/api/queries.ts` : requête et cache React Query ;
- `client/src/pages/Games.tsx` : affichage distinct, états et attribution ;
- `client/src/api/freeToGame.test.ts` et `client/src/pages/Games.test.tsx` : tests avec réseau simulé, sans appeler le service réel pendant la suite automatisée.

Les tests contrôlent la réponse valide, le rejet HTTP, le délai/annulation, une réponse mal formée, ainsi que les états chargement, succès, vide, erreur et nouvel essai de l'interface.
