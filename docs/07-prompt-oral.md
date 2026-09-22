# Prompt de génération du support d'oral

Ce fichier contient un prompt autoporteur à copier-coller vers un outil de génération de
présentation. Tout le contenu factuel y est recopié, l'outil n'a donc besoin d'aucun accès au code.

Copier tout ce qui suit la ligne de séparation.

---

## RÔLE

Tu es directeur artistique et coach en prise de parole. Tu conçois un support de présentation
PowerPoint pour un oral blanc de fin d'études, ainsi que les notes orales qui vont avec.

## MISSION

Produire un support de **15 diapositives** pour un passage de **20 minutes**, sur un projet de fin
d'année appelé FrameForge. Le support doit couvrir : ce qu'est le projet, l'angle marketing retenu,
la sécurité applicative, et la protection des données personnelles.

## CONTRAINTES ABSOLUES

1. **N'invente rien.** Utilise exclusivement les faits listés dans ce prompt. Si une information
   manque pour remplir une diapositive, écris `[À COMPLÉTER PAR L'ÉTUDIANT]` plutôt que de combler.
2. **Aucun chiffre en dehors de cette liste blanche** : 74 composants, 7 catégories, 24 jeux,
   4 parcours, 87 tests back-end, 118 tests front-end, 80,51 % de couverture de lignes back-end,
   62,26 % de couverture de lignes front-end, 12 caractères de mot de passe minimum, 5 tentatives
   avant verrouillage, 12 heures de validité du jeton, 1200 par 630 pixels pour l'image de partage,
   9 sections dans la politique de confidentialité, 860 pixels de point de rupture, 375 pixels de largeur mobile,
   30 secondes de délai d'attente, 3 nouvelles tentatives, 0 euro de coût de fonctionnement.
   Interdiction formelle d'inventer une taille de marché, un nombre d'utilisateurs, un chiffre
   d'affaires, un taux de conversion ou un témoignage.
3. **Les manques sont des correctifs, pas des renoncements.** Certains points ne sont pas encore
   implémentés. Il s'agit d'un oral blanc : l'étudiant corrigera avant l'oral final. Formule donc
   systématiquement « pas encore en place, correctif prévu, voici lequel », jamais « nous n'avons
   pas fait ». Ne masque aucun manque : les assumer est un point fort devant un jury.
4. **Une idée par diapositive.** Six lignes de texte maximum. Pas de paragraphe.
5. Écris en **français**, sans tiret cadratin, sans emoji.

---

## LE PROJET

### Le problème

Acheter des composants pour un PC de jeu suppose de répondre à une question que les boutiques en
ligne ne traitent pas : est-ce que cette configuration fera tourner le jeu auquel je veux jouer, et
à quelle fluidité. Les catalogues affichent des fiches techniques. Un acheteur non expert lit une
quantité de mémoire, une fréquence, un nombre de cœurs, et ne sait pas traduire ces chiffres en
images par seconde. L'information nécessaire à la décision est absente de la page censée provoquer
la décision.

Le raisonnement inverse manque aussi. Un joueur qui possède déjà une machine ne sait pas dire si
elle suffit pour un jeu donné, ni quelle pièce changer en priorité.

### La réponse

FrameForge est une boutique de composants PC dont le catalogue est indexé sur l'usage réel, le jeu,
et non sur la seule fiche technique. Formule de positionnement : « Choisis un jeu, on te dit quoi
acheter. Et l'inverse. »

### Les quatre parcours

1. **Boutique** : catalogue, recherche, filtres par prix, marque et niveau de performance, tri,
   pagination, fiche produit, avis clients, panier.
2. **Je veux jouer à X** : l'utilisateur choisit un jeu, une résolution et une fluidité visée. Le
   site compose une configuration complète, chiffrée, et physiquement assemblable, ajoutable au
   panier en un geste.
3. **Vérificateur** : l'utilisateur indique son processeur et sa carte graphique, puis un jeu. Le
   site rend un verdict immédiat en trois états, et propose une mise à niveau ciblée avec lien
   d'achat direct.
4. **Assembleur** : composition libre pièce par pièce, cinq indicateurs recalculés en direct,
   contrôle de compatibilité et comparaison avant après sur un jeu donné.

S'y ajoute un espace d'administration réservé : tableau de bord, gestion du catalogue et des
catégories, suivi des commandes, traitement des messages de support.

### La pile technique

Interface : React 19, TypeScript, Vite, TanStack React Query, React Router.
Serveur : ASP.NET Core 8, Entity Framework Core, base SQLite.
Authentification : ASP.NET Core Identity avec jeton JWT.
Paiement : mode simulation par défaut ; mode `StripeTest` possible uniquement avec une clé de test configurée.
Tests : xUnit côté serveur, Vitest côté interface.
Industrialisation : GitHub Actions, conteneurs Docker.
Hébergement : Netlify pour le site, Render pour l'interface de programmation, offres gratuites.

### Le moteur d'estimation

Modèle de calcul assumé, pas des mesures réelles. Principe : dans une configuration, la pièce la
plus faible impose sa limite. Le site calcule une limite graphique et une limite processeur, et
retient la plus basse des deux. Les exigences portent déjà leur résolution et leur cible d'images
par seconde : aucun second facteur de résolution n'est appliqué. Un écart trop grand entre les deux
composants applique une pénalité de goulet d'étranglement. La mémoire participe aussi au verdict.
Cette honnêteté sur la nature du modèle est annoncée sur le site lui-même.

---

## BLOC MARKETING

Neuf décisions marketing réellement mises en œuvre dans le produit.

**Positionnement.** Le catalogue est indexé sur l'usage et non sur la fiche technique. C'est la
différenciation centrale, tout le reste en découle.

**Quatre entrées par intention.** Le site ne propose pas un catalogue unique mais quatre parcours,
chacun répondant à une question différente. La page d'accueil oriente vers un parcours plutôt que
d'exposer tout le catalogue.

**Chaque parcours de conseil se referme sur l'achat.** Le vérificateur ne s'arrête pas au diagnostic :
quand le verdict est insuffisant, il propose la mise à niveau ciblée avec un lien direct vers la
fiche produit. Le parcours de recommandation se termine par un bouton d'ajout au panier de la
configuration entière.

**Le code couleur porte l'intention commerciale.** Règle du design system : le cyan guide, le jaune
fait agir. Le jaune n'apparaît que sur les boutons déclenchant un achat. Le regard reçoit
l'information avant la lecture.

**Preuve sociale.** Avis clients sur les fiches produit, note moyenne exposée en données structurées
pour les moteurs de recherche.

**Référencement naturel.** Titre et description propres à chaque page, données structurées de type
Organization pour le site et Product pour chaque fiche, plan de site, fichier d'exclusion des
robots.

**Partage social.** Image de partage 1200 par 630 pixels, balises Open Graph et Twitter. Une fiche
produit partage sa propre photo.

**Essai sans friction.** Deux comptes de démonstration permettent de parcourir tout le tunnel
d'achat sans créer de compte.

**Mesure d'audience.** Le chargeur GoatCounter est prêt, mais aucun code de site n'est configuré et
aucune activation réelle n'est revendiquée. Le script ne peut être chargé qu'après consentement ;
les propriétés du service devront être vérifiées lors de la création du compte externe.

**API tierce directe.** La page Jeux contient une rubrique de découverte qui interroge l'API
publique FreeToGame directement depuis React, avec HTTPS, délai maximal, validation de réponse,
cache, états de repli et aucune clé exposée.

---

## BLOC SÉCURITÉ

### Ce qui est en place

**Authentification.** Politique de mot de passe renforcée : douze
caractères minimum avec majuscule, minuscule, chiffre et caractère spécial. Verrouillage du compte
après cinq tentatives infructueuses. Mots de passe hachés, jamais stockés en clair.

**Gestion du jeton.** Jeton JWT signé, valable douze heures. La clé de signature est résolue par une
source unique, et l'application refuse de démarrer en production si cette clé est absente, plutôt
que de signer avec une valeur présente dans le code source. Côté navigateur, la session est stockée
en `sessionStorage` et non en `localStorage` : elle disparaît à la fermeture de l'onglet, ce qui
réduit la durée d'exposition.

**Contrôle d'accès.** Séparation des rôles. Chaque route d'écriture du catalogue, des catégories,
des commandes et du support porte une exigence de rôle administrateur. Un compte client reçoit un
refus.

**En-têtes HTTP de sécurité** sur toutes les réponses : politique de sécurité du contenu,
`X-Frame-Options` en refus total contre le détournement de clic, `nosniff` contre l'interprétation
de type, politique de référent, politique de permissions. En production s'ajoutent HSTS et la
redirection HTTPS. La chaîne de proxy de l'hébergeur est prise en compte pour éviter une boucle de
redirection.

**Surface d'exposition.** Aucune entité de base de données n'est exposée directement : tout passe
par des objets de transfert validés, avec champs obligatoires, longueurs maximales, plages de
valeurs et expressions régulières. En production, aucune trace d'exception n'est renvoyée au client,
seulement un message générique.

**Intégrité transactionnelle.** La colonne de stock porte un jeton de concurrence : deux
confirmations simultanées sur le même produit ne peuvent pas survendre. Le stock est revérifié à la
confirmation, pas seulement à la création de la commande.

**Paiement.** En mode `StripeTest`, le serveur ne fait jamais confiance au retour du navigateur. Il
relit le statut de la session de test auprès de Stripe avant toute décrémentation de stock. En mode
simulation, une confirmation serveur reste obligatoire. Dans les deux cas, la commande appartient
au compte connecté et la confirmation est idempotente. Aucun paiement Stripe test abouti n'est
revendiqué sans vérification externe.

**Secrets.** Aucun secret n'est versionné. Le fichier de configuration public ne contient que la
structure, un fichier d'exemple est fourni, les vraies valeurs sont ignorées par le gestionnaire de
versions et injectées en variables d'environnement chez l'hébergeur.

**Protection contre les abus.** Le limiteur natif ASP.NET Core protège la connexion, l'inscription,
le support public et les calculs coûteux. Des journaux structurés, sans mot de passe, jeton ni contenu
privé, couvrent les refus d'authentification et les mutations importantes. `/health` vérifie l'API et
SQLite avec une réponse minimale.

### Ce qui reste à compléter

| Point | Pourquoi c'est un risque | Correctif annoncé |
|---|---|---|
| Aucune supervision ni alerte | Une indisponibilité se découvre en ouvrant le site | Sonde de disponibilité périodique, avec l'effet secondaire utile de garder le serveur éveillé |
| Pas de révocation de jeton | Un jeton dérobé reste valable douze heures | Jeton de rafraîchissement à durée courte, ou liste de révocation |
| Persistance Render non vérifiable depuis le dépôt | Sans disque externe, SQLite est recréée au redéploiement | Vérifier la console Render puis configurer un volume ou une base gérée |
| Aucun audit d'accessibilité formel | La conformité au référentiel RGAA n'est pas démontrée | Audit des contrastes et de la navigation au clavier |
| Aucun webhook Stripe signé configuré | Un retour de navigateur reste nécessaire au flux actuel | Configurer un endpoint et un secret de signature dans un environnement Stripe test réel |

---

## BLOC PROTECTION DES DONNÉES

### Ce qui est en place

**Politique de confidentialité** accessible publiquement, en 9 sections. Elle décrit factuellement le
compte, les stockages navigateur, le panier serveur, les commandes, avis et support, les services
externes, les durées non automatisées, les droits, l'outil de détection matérielle et la sécurité.

**Cette dernière section mérite d'être citée à l'oral.** Le site propose un petit outil facultatif à
télécharger, qui lit localement le modèle de carte graphique, de processeur et la quantité de
mémoire, puis rouvre le site avec le résultat. Ce résultat transite par le fragment de l'adresse,
c'est-à-dire la partie après le dièse, que les navigateurs n'envoient jamais au serveur. La donnée
est donc lue et décodée uniquement dans le navigateur, puis oubliée. La politique le dit
explicitement, et reconnaît que ces informations pourraient techniquement constituer une empreinte
matérielle.

**Bannière de consentement** avec le refus présenté au même niveau visuel que l'acceptation. Le
stockage strictement essentiel, la session et le panier, est exclu du consentement et annoncé comme
tel.

**Droits d'accès et d'effacement.** Depuis l'espace commandes, le compte connecté peut télécharger
un export JSON de son profil et de ses données liées. La suppression transactionnelle efface le
compte, les avis, le panier, les commandes et les messages de support reliés par son identifiant.
Les messages visiteurs non reliés et les données déjà reçues par un tiers ne sont pas prétendus supprimés.

**Minimisation.** Seules sont collectées une adresse électronique, un mot de passe haché,
l'historique des commandes, les avis publiés et les messages de support. Aucune donnée sensible.

**Mentions légales et conditions générales** sur une page dédiée : éditeur, hébergeurs, objet du
site, prix, processus de commande, paiement en mode démonstration, absence de livraison, droit de
rétractation, propriété intellectuelle.

**Consentement.** Le choix analytics est daté, versionné, consultable et modifiable depuis
« Préférences de confidentialité ». GoatCounter reste désactivé tant que le propriétaire n'a pas
créé puis configuré un site externe ; le dépôt ne garantit ni ses traitements ni son hébergement.

### Les limites à assumer

L'export et l'effacement liés au compte sont implémentés, mais la **rectification autonome** ne l'est
pas : l'adresse et le mot de passe ne se modifient pas depuis l'interface. La demande passe encore par
le support. Il n'existe ni purge automatique par durée, ni registre des traitements fourni, ni
double opt-in réel faute de fournisseur d'e-mail. La configuration externe de GoatCounter, les
traitements des hébergeurs et l'identité juridique du responsable restent à compléter par le
propriétaire. Ces limites interdisent de déclarer une conformité RGPD globale.

---

## CHARTE GRAPHIQUE DU SUPPORT

Le support doit reprendre l'identité visuelle du site. Direction artistique : froide, géométrique,
sombre, inspirée de Tron.

### Couleurs, valeurs exactes à utiliser

| Rôle | Code |
|---|---|
| Fond de diapositive | `#0a0e14` |
| Blocs, encadrés, cartes | `#121826` |
| Bordures et séparateurs | `#223049` |
| Accent principal, titres, filets | `#22d3ee` |
| Accent d'action, une seule fois par diapositive | `#f5d90a` |
| Texte courant | `#e2e8f0` |
| Texte secondaire | `#8a93a3` |
| Signal positif | `#34f5c5` |
| Signal négatif | `#ff2a6d` |

**Règle à respecter strictement : le cyan guide, le jaune fait agir.** Le cyan porte la structure,
les titres et les filets. Le jaune ne sert qu'à désigner l'élément sur lequel on veut l'attention,
au maximum une fois par diapositive. C'est la règle du produit lui-même, la reprendre dans le
support montre la cohérence.

### Typographie

Titres : **Chakra Petch**, en demi-gras ou gras.
Chiffres, codes et termes techniques : **JetBrains Mono**.
Texte courant : **Space Grotesk**.

Ces trois polices viennent de Google Fonts et doivent être installées sur la machine avant
l'ouverture du fichier. Si elles ne peuvent pas être utilisées, remplacer par des polices de
métriques proches : Rajdhani ou Titillium Web pour les titres, Consolas pour le monospace, Manrope
pour le corps de texte.

### Motifs visuels

Autorisés et encouragés : maillage géométrique très discret en fond, filets cyan fins comme
séparateurs, chiffres en gros caractères monospace, barres de progression horizontales pour figurer
les indicateurs de performance.

**Interdits** : dégradés violets, ombres portées sur tous les éléments, icônes emoji, images de
banque décoratives, silhouettes de personnes, fonds de circuits imprimés génériques.

---

## PLAN MINUTÉ, 20 MINUTES

| Temps | Séquence |
|---|---|
| 0:00 à 1:30 | Ouverture et problème |
| 1:30 à 3:00 | La réponse et le positionnement |
| 3:00 à 6:00 | Démonstration live, parcours de recommandation |
| 6:00 à 8:00 | Démonstration live, vérificateur puis achat |
| 8:00 à 10:00 | L'angle marketing |
| 10:00 à 13:00 | L'architecture technique |
| 13:00 à 16:00 | La sécurité applicative |
| 16:00 à 18:00 | La protection des données et l'écart assumé |
| 18:00 à 19:00 | Qualité, tests et industrialisation |
| 19:00 à 20:00 | Ce qui reste à faire, feuille de route |

---

## SCÉNARIO DE DÉMONSTRATION LIVE

À intégrer comme notes, pas comme diapositives.

**Avant de passer, impérativement.** Ouvrir le site cinq minutes à l'avance et laisser la boutique
charger. Le serveur d'hébergement gratuit met le conteneur en veille après quinze minutes
d'inactivité et prend cinquante à soixante secondes à se réveiller. Le site encaisse ce délai, avec
30 secondes d'attente et 3 nouvelles tentatives, mais le premier chargement serait lent devant le
jury.

**Attention.** Les boutons de remplissage automatique des comptes de démonstration n'existent qu'en
environnement de développement. Sur le site en ligne, il faut taper les identifiants à la main.
Les préparer dans le presse-papier ou les avoir sous les yeux.

**Séquence 1, trois minutes.** Aller sur le parcours de recommandation. Choisir un jeu, une
résolution, une fluidité. Montrer la configuration composée. Insister sur un point : la
configuration est physiquement assemblable, le socket de la carte mère correspond au processeur, le
type de mémoire correspond à la carte mère, l'alimentation couvre la consommation. Ce n'est pas un
tri par prix. Ajouter au panier.

**Séquence 2, deux minutes.** Aller sur le vérificateur. Choisir volontairement un processeur et une
carte graphique trop faibles pour un jeu exigeant. Montrer le verdict négatif, puis la mise à niveau
proposée avec son lien d'achat. Dire la phrase : le diagnostic ne s'arrête pas au diagnostic, il se
referme sur l'achat.

**Séquence de secours si le réseau tombe.** Basculer sur des captures d'écran préparées à l'avance,
et le dire au jury plutôt que de s'acharner.

---

## FORMAT DE SORTIE ATTENDU

Produis exactement **15 diapositives**, dans cet ordre :

1. Titre du projet et accroche
2. Le problème
3. La réponse, en une phrase
4. Les quatre parcours, en schéma
5. Diapositive d'appui pour la démonstration live
6. Le positionnement marketing
7. La conversion, la règle cyan et jaune
8. L'acquisition, référencement et mesure
9. L'architecture technique
10. Le moteur d'estimation
11. La sécurité applicative, ce qui est en place
12. La sécurité, ce qui arrive, avec le calendrier
13. La protection des données, ce qui est en place
14. Les limites RGPD et les actions restant au propriétaire
15. Qualité, industrialisation et feuille de route

Pour **chaque** diapositive, fournis :

- Le **titre**, court, six mots maximum.
- Le **contenu**, six lignes maximum, sous forme de points courts ou d'un schéma décrit en mots.
- La **couleur d'accent** utilisée, et où le jaune est posé s'il l'est.
- Les **notes orales**, quatre à six phrases, écrites comme on parle, telles que l'étudiant peut les
  dire pendant que la diapositive est à l'écran.
- Le **minutage**, cohérent avec le plan ci-dessus.

Termine par la liste des captures d'écran à préparer, et par le scénario de démonstration live
reformaté en aide-mémoire d'une page.

## CE QUE TU NE DOIS PAS PRODUIRE

Pas de slogan creux du type « révolutionner l'expérience d'achat ». Pas de chiffre de marché, de
projection de croissance ou de nombre d'utilisateurs, aucun n'existe. Pas de faux témoignage. Pas de
capture d'écran décrite comme si tu l'avais vue. Pas de section « concurrence » ou « business model »
détaillée, elles n'ont pas été travaillées dans le projet. Pas de dégradé violet. Pas d'emoji.
