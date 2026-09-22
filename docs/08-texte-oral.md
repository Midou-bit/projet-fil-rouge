# Texte d'oral, Projet Fil Rouge FrameForge

Document à double usage. Les blocs **À DIRE** sont rédigés pour être prononcés tels quels. Les blocs
**POUR LA DIAPOSITIVE** donnent les points à reporter dans le PowerPoint. Les blocs **CE QUE ÇA
DÉMONTRE** rappellent le bloc de compétences visé, à garder en tête sans forcément le dire.

**Adresses à avoir sous la main**

| | |
|---|---|
| Le site | https://frameforge-build.netlify.app |
| L'interface de programmation | https://frameforge-c231.onrender.com |
| Le dépôt de code | https://github.com/Midou-bit/projet-fil-rouge |

**Comptes de démonstration**

| Rôle | Identifiant | Mot de passe | Ce qu'il donne |
|---|---|---|---|
| Client | `client@frameforge.dev` | `ClientFrame2026!` | Panier, commande, avis, suppression de compte |
| Administrateur | `admin@frameforge.dev` | `AdminFrame2026!` | Tableau de bord, catalogue, catégories, commandes, support |

Ces deux comptes sont proposés en un clic sur la page de connexion du site, et affichés en clair
juste en dessous. Tu n'as donc rien à retenir ni à taper pendant la démonstration.

> Ouvre le site cinq minutes avant de passer. Le serveur se met en veille après quinze minutes sans
> visite et met environ une minute à se réveiller.

---

## Sommaire

1. Le projet, ce qu'il est et ce qu'il résout
2. Pourquoi ce projet, mes inspirations
3. À qui je m'adresse
4. L'angle marketing
5. La démonstration en direct
6. L'architecture technique
7. La protection des données personnelles
8. La sécurité
9. Ce qui reste à faire
10. Conclusion

---

## 1. Le projet, ce qu'il est et ce qu'il résout

**À DIRE**

Je vais vous présenter FrameForge, mon projet fil rouge.

Partons d'une situation concrète. Vous voulez acheter un ordinateur pour jouer à un jeu précis. Vous
allez sur un site de composants. On vous propose des cartes graphiques avec des chiffres : douze
gigaoctets de mémoire, une fréquence, un nombre de cœurs. Et vous vous posez une seule question, à
laquelle aucune de ces pages ne répond. Est-ce que ça va faire tourner mon jeu, et correctement.

Le problème est là. L'information dont vous avez besoin pour décider est absente de la page censée
vous faire décider. Les sites vendent des pièces classées par catégorie. Ils supposent que vous
savez déjà ce que vous cherchez. Résultat, soit vous achetez à l'aveugle, soit vous renoncez.

Et la question inverse n'est pas mieux traitée. Vous avez déjà une machine. Vous voulez savoir si
elle suffit pour un nouveau jeu, et si non, quelle pièce changer en priorité. Personne ne vous le
dit.

FrameForge répond aux deux. C'est une boutique de composants dont le catalogue n'est pas indexé sur
la fiche technique, mais sur l'usage réel. Vous choisissez un jeu, le site vous dit quoi acheter.
Vous donnez votre machine, il vous dit si ça passe.

**POUR LA DIAPOSITIVE**

- Acheter un PC pour jouer pose une question que les sites ne traitent pas
- Les fiches techniques donnent des chiffres, pas une réponse
- L'information de décision est absente de la page de décision
- La question inverse, ma machine suffit-elle, n'est pas traitée non plus
- FrameForge indexe le catalogue sur l'usage et non sur la pièce
- Choisis un jeu, on te dit quoi acheter. Et l'inverse.

**CE QUE ÇA DÉMONTRE**
Bloc BC01, concevoir et modéliser. J'ai analysé une demande, identifié un besoin réel et reformulé
le problème avant d'écrire la moindre ligne de code.

---

## 2. Pourquoi ce projet, mes inspirations

**À DIRE**

[À COMPLÉTER PAR TOI. Amorce possible : « J'ai choisi ce sujet parce que… », puis raconte en trois
ou quatre phrases ta situation personnelle. Un achat que tu as trouvé difficile, un proche que tu as
conseillé, une frustration vécue. C'est la partie que le jury retient, et c'est la seule que je ne
peux pas écrire à ta place.]

Sur le plan visuel, je me suis inspiré de l'univers de Tron. Une direction froide, géométrique, sur
fond sombre, avec du cyan comme couleur de repère. J'y ai ajouté un jaune emprunté à l'esthétique
cyberpunk, mais avec une règle stricte que je détaillerai plus loin.

Sur les données, j'ai fait un choix de crédibilité. Plutôt que d'inventer un catalogue, j'ai utilisé
un jeu de données ouvert de composants informatiques réels, avec de vrais noms, de vrais prix et de
vraies caractéristiques. Pour les jeux, j'interroge un service public qui me fournit les titres et
les vignettes officielles.

Je voulais que la démonstration tienne sur des données vraies. Un catalogue inventé aurait décrédibilisé
tout le reste.

**POUR LA DIAPOSITIVE**

- [À COMPLÉTER : ma motivation personnelle]
- Direction artistique inspirée de Tron, froide et géométrique
- Accent jaune emprunté au cyberpunk, réservé à un seul usage
- Composants issus d'un jeu de données ouvert, vrais noms et vrais prix
- Jeux et vignettes fournis par un service public
- Un catalogue inventé aurait décrédibilisé la démonstration

**CE QUE ÇA DÉMONTRE**
Bloc BC01, volet veille technique. J'ai comparé des sources de données, écarté celles qui ne
convenaient pas et justifié mon choix.

---

## 3. À qui je m'adresse

**À DIRE**

J'ai identifié trois profils, et le site est construit autour d'eux.

Le premier, c'est le joueur qui ne sait pas lire une fiche technique. Il sait à quoi il veut jouer,
c'est tout. Il ne veut pas une liste de références, il veut une réponse. Pour lui, j'ai fait un
parcours où il choisit un jeu, une qualité d'image, et où le site compose la machine complète.

Le deuxième possède déjà un ordinateur. Il veut savoir si sa configuration tient avant d'acheter un
jeu, ou quelle pièce remplacer. Pour lui, j'ai fait un vérificateur qui rend un verdict immédiat.

Le troisième s'y connaît. Il veut comparer, tester des combinaisons, voir l'effet de chaque
changement. Pour lui, j'ai fait un assembleur interactif où les indicateurs se recalculent en direct.

Ces trois profils m'ont donné une décision de structure. Je n'ai pas fait un catalogue unique avec
des filtres. J'ai fait quatre entrées différentes, une par intention.

**POUR LA DIAPOSITIVE**

- Trois profils identifiés avant la conception
- Le débutant veut une réponse, pas une liste
- Celui qui a déjà une machine veut un verdict
- L'utilisateur averti veut comparer et tester
- Conséquence de structure : quatre entrées par intention, pas un catalogue unique

**CE QUE ÇA DÉMONTRE**
Bloc BC01. Identification du public utilisateur, et traduction de cette analyse en une décision
d'architecture fonctionnelle.

---

## 4. L'angle marketing

**À DIRE**

Mon angle marketing tient en une idée. Le produit vend par sa structure, pas par des slogans.

Premier levier, le positionnement. Je ne me place pas sur le terrain des gros catalogues, je ne
peux pas rivaliser sur le nombre de références. Je me place sur la traduction : je transforme une
fiche technique en réponse compréhensible. C'est ma différenciation, et tout le reste en découle.

Deuxième levier, les quatre portes d'entrée. Chaque parcours répond à une question formulée en
langage courant. Un visiteur qui arrive sait immédiatement laquelle le concerne. Une page d'accueil
qui déverse tout le catalogue perd celui qui ne sait pas quoi chercher.

Troisième levier, et c'est celui dont je suis le plus satisfait. Chaque parcours de conseil se
referme sur un achat. Le vérificateur ne s'arrête pas au diagnostic. Quand il dit que la machine est
trop faible, il propose la pièce à changer, avec le lien direct vers sa fiche. Le parcours de
recommandation se termine par un bouton qui ajoute la configuration entière au panier, en une action.
Je ne laisse jamais l'utilisateur devant une information sans lui donner la suite.

Quatrième levier, la couleur. J'ai posé une règle dans mon système de design : le cyan guide, le
jaune fait agir. Le cyan porte la navigation, les titres, la structure. Le jaune n'apparaît que sur
les boutons qui déclenchent un achat. Nulle part ailleurs. Résultat, le regard trouve l'action avant
même que le cerveau ait lu le texte.

Cinquième levier, la preuve sociale. Les fiches produit portent des avis clients et une note
moyenne, et cette note est exposée en données structurées pour que les moteurs de recherche la
comprennent.

Dernier levier, l'acquisition. Chaque page a son propre titre et sa propre description. Les fiches
produit sont décrites en données structurées, donc un moteur sait qu'il s'agit d'un produit, avec un
prix et une disponibilité. J'ai un plan de site, un fichier d'exclusion des robots, et une image de
partage pour que le lien s'affiche correctement quand on l'envoie sur une messagerie.

Et un choix que j'assume : le chargeur de mesure GoatCounter ne peut démarrer qu'après consentement.
Il est techniquement prêt, mais aucun code de site n'est configuré et je ne prétends donc pas avoir
mesuré une audience. Les propriétés réelles du service devront être vérifiées au moment de créer le
compte externe.

**POUR LA DIAPOSITIVE**

- Le produit vend par sa structure, pas par des slogans
- Positionnement sur la traduction, pas sur la taille du catalogue
- Quatre portes d'entrée, une question courante par parcours
- Chaque parcours de conseil se referme sur un achat
- Le cyan guide, le jaune fait agir : le jaune uniquement sur l'achat
- Preuve sociale : avis et note moyenne en données structurées
- Acquisition : titre par page, données structurées, plan de site, image de partage
- Mesure d'audience optionnelle, inactive sans configuration et soumise au consentement

**CE QUE ÇA DÉMONTRE**
Bloc BC01 pour l'identification des besoins de référencement dès le cadrage, bloc BC02 pour la mise
en œuvre du référencement et de l'expérience utilisateur dans l'interface.

---

## 5. La démonstration en direct

**À DIRE**

Je vais vous montrer deux parcours sur le site en ligne.

Premier parcours. Je choisis un jeu, une résolution, une fluidité visée. Le site me compose une
machine complète et chiffrée. Regardez un détail qui compte : cette configuration est réellement
assemblable. La carte mère correspond au socket du processeur, la mémoire correspond au type de la
carte mère, l'alimentation couvre la consommation de la carte graphique. Ce n'est pas un tri par
prix, c'est un assemblage vérifié. Et je peux l'ajouter au panier en un clic.

Deuxième parcours. Je vais sur le vérificateur et je choisis volontairement une machine trop faible.
Le site me rend un verdict négatif. Et immédiatement en dessous, il me propose la pièce à changer,
avec le lien vers sa fiche. Le diagnostic se referme sur l'achat, c'est exactement ce que je décrivais
tout à l'heure.

**POUR LA DIAPOSITIVE**

- Diapositive d'appui, l'essentiel se passe à l'écran
- Parcours 1 : du jeu à la configuration complète, ajoutée au panier en un clic
- La configuration est assemblable, pas seulement bon marché
- Parcours 2 : verdict négatif, puis mise à niveau conseillée avec lien d'achat
- Site : frameforge-build.netlify.app

**CE QUE ÇA DÉMONTRE**
Bloc BC02. Interface fonctionnelle, parcours utilisateur fluide, consommation sécurisée d'une
interface de programmation.

> **Rappel pratique.** Les boutons qui remplissent automatiquement les comptes de démonstration
> n'existent qu'en environnement de développement. Sur le site en ligne, tape les identifiants à la
> main. Prépare-les à l'avance. Et si le réseau tombe, bascule sur des captures d'écran et dis-le au
> jury plutôt que de t'acharner.

---

## 6. L'architecture technique

**À DIRE**

Passons à la technique, en restant compréhensible.

L'application est coupée en deux. D'un côté le site que vous voyez, écrit en React avec TypeScript.
De l'autre un serveur qui contient toute l'intelligence et les données, écrit en C sharp avec
ASP.NET Core. Les deux communiquent par une interface de programmation qui n'échange que des
données, jamais de pages.

Cette séparation a un intérêt concret. Le site est un ensemble de fichiers statiques, hébergé sur
Netlify. Le serveur tourne dans un conteneur Docker chez Render. Les deux évoluent indépendamment.
Une rubrique de la page Jeux démontre aussi un autre flux : React appelle directement l'API publique
FreeToGame en HTTPS, sans clé ni donnée de compte, avec délai maximal et réponse validée.

Le cœur du projet, c'est le moteur d'estimation. Le principe est simple : une machine va à la
vitesse de sa pièce la plus lente, comme une chaîne casse à son maillon le plus faible. Je calcule
une limite imposée par la carte graphique, une limite imposée par le processeur, et je retiens la
plus basse. Les seuils du jeu sont déjà définis pour une résolution et une cible de fluidité : je ne
compte donc pas une seconde fois la résolution. J'ajoute une pénalité quand les deux pièces sont trop
déséquilibrées, comme une voiture puissante avec des pneus trop petits, et la mémoire participe au verdict.

Un point d'honnêteté que je mets en avant sur le site lui-même : ce sont des estimations calculées,
pas des mesures réelles. Je n'ai pas de banc de test. Je l'assume et je l'écris.

Côté données, j'utilise une base SQLite avec Entity Framework. Le schéma est versionné par
migrations, donc la base se crée et se met à jour toute seule au démarrage. Un détail technique dont
je suis content : les montants sont stockés en centimes entiers, parce que stocker un prix en nombre
à virgule introduit des erreurs d'arrondi sur les additions.

Sur la qualité, j'ai quatre-vingt-sept tests automatisés côté serveur, avec 80,51 pour cent des lignes
couvertes, et cent dix-huit tests côté interface sur vingt-six fichiers, avec 62,26 pour cent des
lignes couvertes. Une chaîne d'intégration continue lance le lint, les tests, les seuils de couverture,
les audits de dépendances, les builds et les images Docker.

Enfin l'industrialisation. Chaque envoi ou proposition de modification déclenche la CI : contrôles,
couvertures, audits, builds et construction Docker. Le déploiement public dépend ensuite des réglages
externes Netlify et Render ; la branche de finalisation n'est pas présentée comme déployée tant que le
propriétaire ne l'a pas poussée et vérifiée.

**POUR LA DIAPOSITIVE**

- Deux parties séparées : le site en React, le serveur en ASP.NET Core
- Elles échangent des données, jamais des pages
- API FreeToGame appelée directement par React pour la découverte
- Le moteur : la machine va à la vitesse de sa pièce la plus lente
- Seuils déjà liés à la résolution, sans double facteur ; pénalité si les pièces sont déséquilibrées
- Ce sont des estimations, pas des mesures, et je le dis sur le site
- Base SQLite, schéma versionné, montants en centimes entiers
- 87 tests serveur, 80,51 % de lignes ; 118 tests interface, 62,26 % de lignes
- CI automatisée ; déploiement Netlify/Render à vérifier après le push du propriétaire

**CE QUE ÇA DÉMONTRE**
Bloc BC02 pour l'interface et ses tests, bloc BC03 pour le serveur, la base de données et
l'industrialisation, bloc BC04 pour la préparation et la vérification du déploiement.

---

## 7. La protection des données personnelles

**À DIRE**

J'ai traité le RGPD comme une contrainte de conception, pas comme une page ajoutée à la fin.

Ce que je collecte, d'abord, et c'est volontairement peu. Une adresse électronique, un mot de passe
qui n'est jamais stocké en clair, l'historique des commandes, les avis publiés et les messages
envoyés au support. Aucune donnée sensible.

Ce qui est en place aujourd'hui. Une politique de confidentialité en neuf sections, accessible depuis
le pied de page. Un bandeau de consentement où le bouton refuser est exactement aussi visible que le
bouton accepter, ce qui n'est pas le cas partout. Le stockage strictement nécessaire, la session et
le panier, est exclu du consentement et annoncé comme tel. Une page de mentions légales et de
conditions générales. Depuis mon espace commandes, je peux télécharger un export JSON de mon compte,
de mon panier, de mes commandes, de mes avis et de mes messages liés. Je peux aussi supprimer
transactionnellement le compte et ces données reliées par mon identifiant. Je ne prétends pas que ce
bouton efface les messages visiteurs non reliés ni ce qui a déjà été reçu par un service externe.

Je veux aussi mentionner un point dont je suis fier. Le site propose un petit outil facultatif qui
lit le matériel de votre ordinateur pour remplir le vérificateur. Le résultat revient au site par la
partie de l'adresse située après le dièse. Cette partie n'est jamais envoyée au serveur par les
navigateurs. La donnée est donc lue dans votre navigateur, utilisée sur le moment, et oubliée. Je
l'explique en détail dans ma politique, et je reconnais honnêtement que ces informations pourraient
techniquement constituer une empreinte matérielle.

Maintenant, ce qui n'est pas complet, et je préfère le dire avant qu'on me le demande. La
rectification autonome n'existe pas : il n'y a aucun moyen de changer son mot de passe ou son adresse
depuis l'interface, la demande passe encore par le support. Il n'y a ni purge automatique par
ancienneté, ni registre des traitements fourni, ni double opt-in réel faute de fournisseur d'e-mail.
Le consentement analytics est désormais daté, versionné, consultable et retirable, mais GoatCounter
reste désactivé tant que le propriétaire n'a pas créé et configuré un compte externe. Ces limites
m'empêchent de déclarer une conformité RGPD globale.

**POUR LA DIAPOSITIVE**

En place :
- Minimisation : adresse, mot de passe haché, commandes, avis, messages. Rien de sensible.
- Politique de confidentialité factuelle en 9 sections
- Bandeau de consentement, refuser aussi visible qu'accepter
- Export JSON et effacement transactionnel des données reliées au compte
- Outil de détection matérielle qui n'envoie rien au serveur
- Mentions légales et conditions générales

À compléter :
- Modification du mot de passe et de l'adresse, pour la rectification autonome
- Politique de conservation et purge automatique
- Registre des traitements et identité juridique du responsable
- Double opt-in avec un fournisseur d'e-mail réellement configuré
- Activation et vérification externes de GoatCounter

**CE QUE ÇA DÉMONTRE**
Bloc BC01, compétence sur les moyens techniques garantissant le respect de la CNIL et du RGPD,
déterminés en conception puis implémentés.

---

## 8. La sécurité

**À DIRE**

La sécurité, je l'ai traitée sur trois plans : le compte, l'échange, et la transaction.

Le compte. J'applique la recommandation de la CNIL : douze caractères minimum, avec majuscule,
minuscule, chiffre et caractère spécial. Au bout de cinq tentatives ratées, le compte se verrouille
temporairement. Les mots de passe sont hachés, je ne peux pas les lire moi-même.

Une fois connecté, l'utilisateur reçoit un jeton signé, valable douze heures. La clé qui signe ce
jeton est résolue à un seul endroit du code, et surtout, l'application refuse de démarrer en
production si cette clé est absente. J'ai préféré un serveur qui ne démarre pas à un serveur qui
signe avec une clé visible dans le code source. Côté navigateur, la session est rangée dans un
stockage qui s'efface à la fermeture de l'onglet, pas dans un stockage permanent.

L'échange. Toutes mes réponses portent des en-têtes de sécurité : une politique de contenu, une
interdiction d'affichage dans un cadre étranger pour éviter le détournement de clic, et d'autres.
En production, toute connexion est forcée en HTTPS. Aucune trace d'erreur technique n'est renvoyée à
l'utilisateur, seulement un message générique, parce qu'une erreur détaillée renseigne un attaquant.
Et je n'expose jamais mes tables de base directement : tout passe par des objets intermédiaires
validés, avec champs obligatoires, longueurs maximales et plages de valeurs.

La transaction, et c'est le point le plus intéressant. En simulation, une confirmation serveur est
obligatoire : un paramètre dans l'adresse ne suffit pas. Si le mode Stripe test est explicitement
configuré, mon serveur relit le statut de la session auprès de Stripe avant de décrémenter le stock.
Je n'ai pas encore effectué de paiement Stripe avec une carte test et je ne prétends donc pas le
contraire. J'ai aussi un verrou sur le stock : deux confirmations du dernier article ne peuvent pas
s'écraser.

Enfin, aucun secret n'est présent dans mon dépôt de code. Les clés sont injectées en variables
d'environnement chez l'hébergeur.

La finalisation a ajouté le rate limiting natif sur la connexion, l'inscription, le support et les
calculs, des journaux structurés sur les opérations importantes, et une route de santé qui contrôle
SQLite sans publier de détail interne. Il reste une supervision avec alerte, un mécanisme général de
révocation des jetons et, pour Stripe, un webhook signé à configurer dans un vrai environnement test.

**POUR LA DIAPOSITIVE**

En place :
- Mot de passe renforcé, 12 caractères et 4 types, verrouillage après 5 tentatives
- Mots de passe hachés, jeton signé valable 12 heures
- Le serveur refuse de démarrer en production sans clé de signature
- Session effacée à la fermeture de l'onglet
- En-têtes de sécurité, HTTPS forcé, aucune erreur technique renvoyée
- Aucune table exposée, données entrantes validées
- Simulation confirmée côté serveur ; vérification Stripe uniquement en mode StripeTest configuré
- Concurrence sur le stock détectée et refusée
- Aucun secret dans le dépôt
- Rate limiting, journaux structurés et route de santé minimale

À mettre en place :
- Supervision et alertes
- Révocation de jeton
- Webhook Stripe signé et paiement par carte test à vérifier

**CE QUE ÇA DÉMONTRE**
Bloc BC03, sécurité de l'interface de programmation, authentification et autorisation. Bloc BC04
pour la sécurisation de l'environnement de production.

---

## 9. Ce qui reste à faire

**À DIRE**

Je termine par ce qui n'est pas fini, parce qu'un projet honnête a une feuille de route.

Sur la conformité, l'export et l'effacement liés sont en place. Il reste la rectification autonome,
une politique de conservation, un registre des traitements et le double opt-in réel.

Sur la sécurité, le rate limiting, les journaux structurés et le health check sont en place. Il reste
la supervision avec alerte, la révocation générale des jetons et le webhook Stripe signé.

Sur l'infrastructure, le dépôt ne prouve pas qu'un disque persistant est configuré sur Render. Sans
volume, SQLite est recréée à chaque mise en ligne. Pour un usage réel, il faut vérifier ce réglage
externe puis utiliser un volume persistant ou une base gérée.

Et sur l'accessibilité, j'ai posé les bases, les textes alternatifs sur les images, les erreurs de
formulaire annoncées aux lecteurs d'écran, une navigation mobile. Mais je n'ai pas conduit d'audit
formel des contrastes et de la navigation au clavier. C'est un chantier identifié.

**POUR LA DIAPOSITIVE**

- Conformité : rectification, conservation, registre et double opt-in
- Sécurité : supervision, révocation et webhook Stripe signé
- Infrastructure : base persistante en production
- Accessibilité : bases posées, audit formel à conduire

**CE QUE ÇA DÉMONTRE**
Bloc BC04, maintien en condition opérationnelle et capacité à identifier la dette technique.

---

## 10. Conclusion

**À DIRE**

Pour résumer. J'ai identifié un problème simple que les boutiques existantes ne traitent pas, et j'y
ai répondu en renversant la logique du catalogue. J'ai construit quatre parcours autour de trois
profils d'utilisateurs. J'ai traité le marketing comme une question de structure et non de slogans.
J'ai traité la conformité et la sécurité dès la conception, pas à la fin. Et le tout est en ligne,
testé, et déployé automatiquement.

[À COMPLÉTER PAR TOI. Amorce possible : « Ce que ce projet m'a le plus appris, c'est… » Deux ou trois
phrases sur ce que tu retiens. Une difficulté que tu as surmontée, une décision que tu referais
autrement, une compétence que tu ne maîtrisais pas avant. C'est la dernière chose que le jury
entendra.]

Le site est accessible à l'adresse frameforge-build.netlify.app, et le code est public sur GitHub.

Je vous remercie, et je suis à votre disposition pour vos questions.

**POUR LA DIAPOSITIVE**

- Un problème réel, une réponse par le renversement du catalogue
- Quatre parcours, trois profils
- Le marketing par la structure
- La conformité et la sécurité dès la conception
- En ligne, testé, déployé automatiquement
- [À COMPLÉTER : ce que j'ai appris]
- frameforge-build.netlify.app

---

## Aide-mémoire du jour J

Cinq minutes avant, ouvre le site et laisse la boutique charger, le serveur se réveille en une
minute environ.

Les deux comptes de démonstration sont désormais proposés en un clic sur la page de connexion du
site, et écrits en clair juste dessous. Rien à taper, rien à retenir.

Prépare deux ou trois captures d'écran de secours si le réseau lâche.

Les deux phrases à ne pas rater : « le cyan guide, le jaune fait agir », et « les droits techniques
d'accès et d'effacement sont présents, mais ils ne suffisent pas à déclarer une conformité RGPD
globale ». La première montre que tu as pensé le produit. La seconde montre que tu sais délimiter les
preuves de ton travail.
