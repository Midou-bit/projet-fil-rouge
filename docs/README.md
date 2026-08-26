# Dossier de conception FrameForge

Documentation de conception du Projet Fil Rouge, titre professionnel Développeur Full Stack
(RNCP 38606). Ces documents formalisent la conception d'une application qui existe et tourne en
production. Ils constituent le support du bloc de compétences BC01 et alimentent le mémoire
professionnel, sans s'y substituer.

## Correspondance avec le référentiel

| Document | Compétences couvertes |
|---|---|
| [01. Cahier des charges fonctionnel](01-cahier-des-charges.md) | Analyser la demande, conseiller sur l'expression du besoin, identifier les caractéristiques du projet |
| [02. Spécifications techniques de besoin](02-specifications-techniques.md) | Traduire les besoins en spécifications techniques |
| [03. Dossier de conception](03-conception.md) | Modéliser l'application, déterminer l'architecture logicielle |
| [04. Modèle de données](04-modele-de-donnees.md) | Concevoir l'architecture des bases de données et la couche de persistance |
| [05. Veille technique](05-veille-technique.md) | Proposer des solutions alternatives issues de la veille métier |
| [06. Maquettes et zoning](06-maquettes.md) | Concevoir les maquettes wireframe, concevoir l'interface conformément |

Les compétences relatives au RGPD et à la CNIL sont traitées dans le [cahier des
charges](01-cahier-des-charges.md#6-contraintes-reglementaires) et mises en œuvre dans l'application,
sur les pages `/confidentialite` et `/conditions`.

## Documents connexes hors de ce dossier

| Fichier | Objet |
|---|---|
| [`../README.md`](../README.md) | Présentation, installation, endpoints, design system |
| [`../DEPLOY.md`](../DEPLOY.md) | Procédure de déploiement et adresses de production |
| [`../CHANGELOG.md`](../CHANGELOG.md) | Journal des évolutions, format Keep a Changelog |
| [`../client/README.md`](../client/README.md) | Documentation du front-end |

## Adresses de production

Site : https://frameforge-build.netlify.app
API : https://frameforge-c231.onrender.com

## Avertissement de méthode

Ces documents ont été rédigés après le développement, à partir du code réellement écrit. Ils
décrivent la conception telle qu'elle a été appliquée, pas une conception théorique antérieure.
Chaque affirmation technique est vérifiable dans les sources, référencées par chemin de fichier.
