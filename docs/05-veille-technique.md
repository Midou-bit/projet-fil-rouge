# Veille technique et justification des choix

Ce document retrace les alternatives étudiées à chaque décision structurante, et dit pourquoi
l'une a été retenue. Plusieurs choix sont des corrections de décisions antérieures : ils sont
présentés comme tels.

---

## 1. Base de données

**Retenu : SQLite.**

Alternatives étudiées :

| Option | Écartée parce que |
|---|---|
| SQL Server LocalDB | Indisponible sous Linux, or l'environnement de développement est un WSL Ubuntu |
| MySQL ou PostgreSQL | Impose un serveur à administrer en local et un service payant ou limité en production |
| MongoDB | Le domaine est fortement relationnel : commandes, lignes, produits, catégories. Le document n'apporte rien ici |

SQLite tient dans un fichier, ne demande aucune administration, et Entity Framework Core le pilote
avec le même code qu'un autre moteur relationnel. Une bascule vers PostgreSQL se ferait en changeant
le fournisseur et la chaîne de connexion, le modèle et les requêtes restant identiques.

Limite assumée : sur l'offre gratuite de Render, le système de fichiers est éphémère, la base est
donc régénérée à chaque déploiement.

---

## 2. Gestion de l'état côté interface

**Retenu : TanStack React Query, plus deux contextes React.**

| Option | Écartée parce que |
|---|---|
| Redux et Immer, enseignés en cours | L'essentiel de l'état du site est de l'état **serveur**, pas de l'état client. Redux aurait imposé de réécrire à la main le cache, la déduplication, l'invalidation et les nouvelles tentatives |
| useState et useEffect seuls | Chaque page aurait redemandé les mêmes données, sans cache ni déduplication |
| Zustand | Résout le même problème que Redux, donc le mauvais problème ici |

La distinction entre état serveur et état client est le point de veille qui a guidé ce choix. Les
produits, les catégories et les jeux appartiennent au serveur : ils se mettent en cache, s'invalident
et se rafraîchissent. React Query fournit tout cela. Restent deux états réellement clients, la
session et le panier, confiés à des contextes React simples.

Bénéfice mesurable : les nouvelles tentatives avec délai croissant, configurées une seule fois,
absorbent le réveil du serveur d'hébergement gratuit sans une ligne de code par page.

---

## 3. Catalogue de jeux

**Retenu : FreeToGame, avec repli hors ligne.**

| Option | Écartée parce que |
|---|---|
| RAWG | Exige une clé d'accès. Tentative menée puis abandonnée, l'obtention n'a pas abouti |
| IGDB | Passe par une authentification Twitch, complexité disproportionnée |
| Catalogue saisi à la main | Peu crédible et fastidieux à maintenir |

FreeToGame ne demande aucune clé, renvoie des titres réels avec leurs vignettes, et se consomme en
une requête. Le service fournit environ vingt-quatre jeux gratuits, ce qui suffit à la démonstration.

L'enseignement principal de cette itération n'est pas le choix du service mais **le moment de
l'appel**. Une première version importait les jeux au démarrage de l'interface de programmation, qui
restait indisponible une vingtaine de secondes. La règle retenue depuis : aucun appel réseau externe
ne bloque le démarrage. L'import s'exécute en tâche de fond, et une liste de seize jeux intégrée au
code prend le relais en cas d'échec.

---

## 4. Catalogue de composants

**Retenu : jeu de données libre, transformé hors ligne.**

| Option | Écartée parce que |
|---|---|
| Saisie manuelle | Trop long pour soixante-quatorze références, et sujet aux erreurs |
| Interrogation d'une place de marché en direct | Dépendance réseau à chaque affichage, et conditions d'utilisation contraignantes |
| Données inventées | Décrédibilise la démonstration |

Le jeu de données `docyx/pc-part-dataset` fournit des noms, prix et caractéristiques réels. La
transformation vers le format de l'application est faite **hors ligne**, une seule fois, et le
résultat est embarqué comme ressource dans l'assemblage. L'application n'a donc aucune dépendance
réseau pour son catalogue.

Les caractéristiques absentes du jeu de données, indicateur de performance, socket, type de mémoire,
consommation, sont dérivées par une règle documentée et assumée comme une estimation.

---

## 5. Visuels des produits

Trois itérations, dont deux abandons.

La première version affichait des photos Wikimedia représentatives par catégorie. Rendu jugé mauvais :
fonds blancs, modèles génériques, incohérence avec la direction artistique sombre du site.

La deuxième remplaçait toute photo par une tuile générée dans la charte, avec l'icône de la catégorie.
Cohérente visuellement, mais moins convaincante pour une boutique.

La version actuelle récupère de vraies photos produit via l'interface de programmation eBay, une
seule fois hors ligne, écrites dans le fichier d'alimentation. Le composant d'image conserve la
tuile générée comme repli si une adresse échoue. Aucune case vide n'est possible.

Ce qui a été appris : un repli visuel cohérent vaut mieux qu'une photo approximative, et le repli
doit être conçu en même temps que le cas nominal.

---

## 6. Mesure d'audience

**Retenu : GoatCounter.**

| Option | Écartée parce que |
|---|---|
| Google Analytics | Dépose des cookies, transfère des données hors de l'Union européenne, et a fait l'objet de mises en demeure de la CNIL. Incompatible avec le discours du site |
| Plausible | Sans cookie et conforme, mais gratuit trente jours seulement. Retenu dans une première version, puis abandonné |
| Matomo auto-hébergé | Conforme, mais impose un serveur supplémentaire, contraire à la contrainte de coût nul |

L'intégration prépare le chargement de GoatCounter sans définir elle-même de cookie ni d'identifiant
applicatif. Elle reste néanmoins désactivée tant qu'aucun code de site externe n'est configuré et son
script n'est chargé qu'après consentement explicite. La localisation, les conditions du fournisseur
et les données effectivement reçues devront être vérifiées au moment de créer ce compte externe ; le
dépôt seul ne permet pas de les garantir.

---

## 7. Hébergement

**Retenu : Netlify pour le site, Render pour l'interface de programmation.**

| Option | Écartée parce que |
|---|---|
| Serveur privé virtuel | Coût mensuel, et administration système hors du périmètre |
| Vercel | Équivalent à Netlify pour le statique, mais moins direct pour une réécriture vers un service externe |
| Railway | Offre gratuite devenue trop limitée |
| Azure App Service | Cohérent avec .NET, mais aucune offre gratuite durable |

Les deux services se branchent sur le dépôt et redéploient à chaque poussée, ce qui donne un
déploiement continu sans écrire de chaîne dédiée. La contrepartie de l'offre gratuite de Render est
la mise en veille après quinze minutes, traitée par un délai d'attente de trente secondes et trois
nouvelles tentatives côté interface.

---

## 8. Paiement

**Retenu : Stripe en environnement de test, avec mode démonstration par défaut.**

Le point de veille utile ici n'est pas le choix du prestataire mais **la vérification du paiement**.
Une implémentation naïve fait confiance au retour du navigateur sur la page de succès. Un utilisateur
peut alors appeler directement l'adresse de confirmation et se déclarer payé.

En mode `StripeTest`, la mise en œuvre relit le statut de la session de test auprès de Stripe avant
toute décrémentation de stock. En mode `Simulation`, aucune transaction financière n'a lieu mais une
confirmation serveur reste obligatoire. Aucun paiement Stripe test abouti n'est prouvé par le dépôt.

---

## 9. Éco-conception

Le référentiel sensibilise au numérique responsable. Les mesures appliquées, par ordre d'effet :

| Mesure | Effet |
|---|---|
| Chargement différé de chaque page | Le navigateur ne télécharge que la page visitée |
| Chargement paresseux des images | Aucune image hors écran n'est transférée |
| Pagination systématique, plafond de cent éléments | Aucune réponse ne transporte le catalogue entier |
| Cache et déduplication des requêtes | Une même donnée n'est demandée qu'une fois par période de fraîcheur |
| Tuile générée plutôt qu'image de remplacement téléchargée | Zéro octet transféré pour un visuel manquant |
| Absence de police auto-hébergée en doublon | Trois familles, chargées une seule fois |

Résultat mesuré : 660 kilooctets pour l'ensemble des fichiers produits, dont 85 kilooctets compressés
pour le fragment principal.

Limite assumée : aucune mesure d'empreinte carbone n'a été conduite, et aucun budget de performance
n'a été formalisé.

---

## 10. Ce qui reste à explorer

Points identifiés pendant la veille, non traités faute de temps ou de pertinence immédiate.

**Rendu côté serveur.** Le référentiel couvre Next.js. Une application monopage reste pénalisée en
référencement, malgré les métadonnées par page. Un rendu côté serveur améliorerait l'indexation et le
premier affichage. Le coût de migration n'était pas justifié à ce stade.

**Base persistante en production.** Un service PostgreSQL géré remplacerait SQLite sans changer le
modèle, et supprimerait la perte de données à chaque déploiement.

**Supervision et alertes.** Aucun outil ne surveille aujourd'hui la disponibilité de l'interface de
programmation. Un contrôle périodique avec alerte serait le premier ajout utile, et aurait pour effet
secondaire de maintenir le conteneur éveillé.

**Audit d'accessibilité.** Les bases sont posées, textes alternatifs, erreurs annoncées, navigation
mobile. Un audit selon le référentiel général d'amélioration de l'accessibilité reste à conduire, en
particulier sur les contrastes et la navigation au clavier.
