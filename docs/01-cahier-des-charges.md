# Cahier des charges fonctionnel

Projet FrameForge. Document de cadrage du besoin, des utilisateurs visés et des contraintes.

---

## 1. Origine et analyse de la demande

### 1.1 Le problème observé

Acheter des composants pour un PC de jeu suppose de répondre à une question que les boutiques en
ligne ne traitent pas : est-ce que cette configuration fera tourner le jeu auquel je veux jouer, et à
quel niveau de fluidité.

Les catalogues existants présentent des fiches techniques. Un acheteur non expert lit une quantité de
mémoire vidéo, une fréquence, un nombre de cœurs, et ne sait pas traduire ces chiffres en images par
seconde. L'information nécessaire à la décision est absente de la page qui doit provoquer la décision.

Le raisonnement inverse manque tout autant. Un joueur qui possède déjà une machine ne sait pas dire si
elle suffit pour un jeu donné, ni quelle pièce changer en priorité si elle ne suffit pas.

### 1.2 La demande formulée

Le projet est une commande interne, formulée dans le cadre du Projet Fil Rouge. Elle tient en une
phrase : construire une boutique de composants informatiques dont le catalogue est indexé sur l'usage
réel, le jeu, et non sur la seule fiche technique.

### 1.3 Reformulation et conseil apporté

La demande initiale se limitait à une boutique en ligne classique. L'analyse a conduit à la
reformuler autour d'une valeur différenciante, le moteur de recommandation, et à la découper en
quatre parcours indépendants plutôt qu'en un catalogue unique.

Trois arbitrages ont été proposés et retenus au moment du cadrage.

Le moteur repose sur un **modèle d'estimation assumé**, pas sur des mesures réelles. Produire des
relevés de performance exigerait un banc de test et un accès matériel hors de portée. Le choix a été
d'écrire une formule explicable, documentée et testée, et de l'annoncer comme telle sur le site.

Le paiement fonctionne en **mode démonstration** par défaut. Encaisser réellement supposerait un
statut commercial. Le code intègre néanmoins Stripe en environnement de test, activable par clé.

Le catalogue s'appuie sur des **données réelles issues d'un jeu de données libre**, transformées hors
ligne. Un catalogue inventé aurait affaibli la crédibilité de la démonstration.

---

## 2. Objectifs

| Objectif | Traduction fonctionnelle |
|---|---|
| Rendre la décision d'achat accessible à un non expert | Traduire toute fiche technique en indicateurs lisibles, images par seconde et niveau de qualité visuelle |
| Répondre à la question « ce jeu tournera-t-il chez moi » | Vérificateur de configuration, verdict immédiat et conseil de mise à niveau |
| Répondre à la question « que dois-je acheter pour ce jeu » | Composition automatique d'une configuration complète et cohérente |
| Permettre l'exploration libre | Assembleur interactif recalculant les indicateurs en direct |
| Démontrer un cycle e-commerce complet | Panier, commande, paiement, historique, administration |

---

## 3. Utilisateurs visés

### 3.1 Le joueur non expert

Sait quel jeu il veut lancer, ne sait pas lire une fiche technique. Il entre par « Je veux jouer à X »,
choisit un jeu, une résolution et une fluidité visée, obtient une configuration chiffrée qu'il ajoute
au panier en un geste. Son besoin est une réponse, pas une liste de références.

### 3.2 Le joueur qui possède déjà une machine

Veut savoir si sa configuration suffit avant d'acheter un jeu, ou quelle pièce remplacer. Il entre par
le vérificateur, sélectionne son processeur et sa carte graphique, obtient un verdict et une
proposition de mise à niveau assortie d'un lien d'achat.

### 3.3 L'utilisateur averti

Connaît le matériel et veut comparer. Il entre par la boutique ou par l'assembleur, utilise les
filtres par prix, marque et niveau de performance, et observe l'effet de chaque changement sur les
indicateurs.

### 3.4 L'administrateur

Gère le catalogue, les catégories, les commandes et les messages de support depuis un espace réservé.

---

## 4. Périmètre fonctionnel

### 4.1 Les quatre parcours publics

**Boutique.** Catalogue par catégorie, recherche textuelle, filtres sur le prix, la marque et le
niveau de performance, tri, pagination, fiche produit détaillée, avis clients, panier.

**Je veux jouer à X.** Sélection d'un jeu, d'une résolution et d'une fluidité visée. Le système
compose une configuration complète et assemblable, l'affiche chiffrée et permet de l'ajouter au
panier en une action.

**Vérificateur.** Sélection d'un processeur et d'une carte graphique depuis le catalogue, puis d'un
jeu. Le système rend un verdict et propose une mise à niveau ciblée avec lien d'achat.

**Assembleur.** Composition libre pièce par pièce, avec cinq indicateurs animés recalculés à chaque
changement, contrôle de compatibilité et comparaison avant après sur un jeu donné.

### 4.2 Le cycle transactionnel

Création de compte, connexion, panier persistant, commande, paiement, historique des commandes,
suppression du compte et des données associées.

### 4.3 L'espace d'administration

Tableau de bord avec les indicateurs de vente, gestion des produits et des catégories, suivi des
commandes et de leur statut, traitement des messages de support.

### 4.4 Hors périmètre, explicitement

Aucune transaction bancaire réelle. Aucune logistique ni livraison. Aucun relevé de performance
mesuré, les images par seconde sont estimées par formule. Les prix et les stocks sont figés à
l'initialisation de la base.

---

## 5. Contraintes non fonctionnelles

### 5.1 Sécurité

Mots de passe conformes aux recommandations de la CNIL, douze caractères minimum avec les quatre
types de caractères, couplés au verrouillage du compte après cinq tentatives infructueuses.
Authentification par jeton signé. Séparation des rôles. En-têtes HTTP de sécurité sur toutes les
réponses. Redirection HTTPS et HSTS en production. Aucun secret dans le dépôt.

### 5.2 Performance et éco-conception

Chargement différé de chaque page, images en chargement paresseux, pagination systématique des listes.
Le paquet livré au navigateur reste sous un mégaoctet. Aucun appel réseau externe ne doit bloquer le
démarrage de l'interface de programmation.

### 5.3 Accessibilité et affichage

Affichage utilisable à partir de 375 pixels de large. Textes alternatifs sur les images. Messages
d'erreur rattachés au champ concerné et annoncés aux technologies d'assistance. Animations courtes,
désactivées si l'utilisateur a exprimé la préférence correspondante.

### 5.4 Référencement

Titre et description propres à chaque page, données structurées, plan de site, fichier d'exclusion
des robots, image de partage sur les réseaux, outil de mesure d'audience sans cookie.

### 5.5 Disponibilité

Application accessible en ligne pendant la période d'évaluation, servie en HTTPS.

---

## 6. Contraintes réglementaires

### 6.1 Données personnelles

Le site collecte une adresse électronique, un mot de passe stocké sous forme hachée, l'historique des
commandes, les avis publiés et les messages de support. Aucune donnée sensible au sens du règlement
général sur la protection des données n'est traitée.

Obligations retenues et mises en œuvre :

| Obligation | Mise en œuvre |
|---|---|
| Information des personnes | Page `/confidentialite`, huit sections |
| Consentement au dépôt de traceurs | Bannière avec refus possible, stockage essentiel exclu du consentement |
| Droit à l'effacement | Suppression du compte et des données liées depuis l'espace commandes |
| Minimisation | Aucune donnée collectée au-delà du nécessaire au service |
| Sécurité du traitement | Hachage des mots de passe, jeton signé, chiffrement du transport |
| Mesure d'audience | Outil sans cookie, chargé uniquement après consentement |

### 6.2 Obligations du commerce en ligne

Mentions légales et conditions générales sur la page `/conditions` : identité de l'éditeur,
hébergeurs, objet du service, prix, processus de commande, modalités de paiement, absence de
livraison, droit de rétractation, propriété intellectuelle.

### 6.3 Propriété intellectuelle

Code source publié sous licence MIT. Les noms de produits et les visuels de jeux appartiennent à
leurs détenteurs et sont utilisés à titre d'illustration dans un cadre pédagogique.

---

## 7. Planification

Le projet suit le découpage du Projet Fil Rouge en deux phases.

| Phase | Contenu | Jalon |
|---|---|---|
| Phase 1 | Interface, parcours utilisateur, consommation de l'interface de programmation, tests front | Rendu de fin de première année |
| Phase 2 | Interface de programmation, persistance, authentification, tests, industrialisation | Rendu de deuxième année |
| Mise en production | Conteneurisation, hébergement, intégration continue, conformité | Avant la soutenance |
| Soutenance | Mémoire professionnel et présentation orale | Un à deux mois après la fin de formation |

Le suivi des évolutions est tenu dans [`../CHANGELOG.md`](../CHANGELOG.md), au format Keep a
Changelog et en versionnage sémantique.

---

## 8. Budget

Contrainte posée au cadrage : coût de fonctionnement nul. Elle est tenue.

| Poste | Choix | Coût |
|---|---|---|
| Base de données | SQLite, sans serveur à administrer | 0 € |
| Hébergement de l'interface de programmation | Render, offre gratuite | 0 € |
| Hébergement du site | Netlify, offre gratuite | 0 € |
| Certificat de sécurité | Fourni par les deux hébergeurs | 0 € |
| Intégration continue | GitHub Actions, dépôt public | 0 € |
| Mesure d'audience | GoatCounter, usage non commercial | 0 € |
| Catalogue de composants | Jeu de données libre | 0 € |
| Catalogue de jeux | FreeToGame, sans clé d'accès | 0 € |
| Paiement | Stripe, environnement de test | 0 € |

La contrepartie assumée de l'offre gratuite de Render est la mise en veille du conteneur après
quinze minutes sans visite, et un réveil de cinquante à soixante secondes. Elle est compensée côté
interface par un délai d'attente de trente secondes et trois nouvelles tentatives.

---

## 9. Critères d'acceptation

Le projet est considéré comme livré lorsque les conditions suivantes sont réunies simultanément.

Les quatre parcours publics fonctionnent de bout en bout sur l'adresse de production. Un compte peut
être créé, une commande passée et retrouvée dans l'historique. L'administrateur peut modifier le
catalogue et changer le statut d'une commande. La suppression de compte efface effectivement les
données liées. La couverture de tests du back-end dépasse cinquante pour cent. La chaîne
d'intégration continue est au vert. Le site répond en HTTPS et porte les en-têtes de sécurité
attendus.
