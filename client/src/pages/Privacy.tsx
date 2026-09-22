import { Link } from 'react-router-dom';
import { useSeo } from '../lib/seo';

/** Politique factuelle de la démonstration ; l'exploitant doit renseigner son identité avant production. */
export default function Privacy() {
  useSeo(
    'Politique de confidentialité',
    'Données, stockages, services externes et moyens de contrôle disponibles dans FrameForge.',
  );

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <h1>Politique de confidentialité</h1>
      <p className="muted">Dernière mise à jour : 22 septembre 2026. Projet pédagogique — environnement de démonstration.</p>

      <section className="stack" style={{ gap: '1.2rem', marginTop: '1.5rem' }}>
        <div>
          <h2>1. Responsable et contact</h2>
          <p>
            FrameForge est un projet étudiant. Cette démonstration ne publie ni identité juridique
            d'exploitant, ni délégué à la protection des données (DPO). L'exploitant d'un déploiement
            réel doit compléter ces informations et configurer un contact opérationnel. Pour cette instance,
            les demandes passent par le <Link to="/contact">formulaire de contact</Link>.
          </p>
        </div>

        <div>
          <h2>2. Données traitées par FrameForge</h2>
          <ul>
            <li><strong>Compte</strong> : adresse e-mail, date de création, rôle et données techniques d'authentification. Le mot de passe est traité par ASP.NET Identity sous forme de hachage, pas enregistré en clair par l'application.</li>
            <li><strong>Panier et commandes</strong> : produits, quantités, prix, statut et date. Le panier est conservé côté serveur et lié au compte.</li>
            <li><strong>Avis</strong> : note, commentaire, produit, date et compte auteur.</li>
            <li><strong>Support</strong> : e-mail, sujet, message, statut et date. Pour une personne connectée, le message est aussi lié à son compte ; un message visiteur ne l'est pas.</li>
          </ul>
        </div>

        <div>
          <h2>3. Stockages dans le navigateur</h2>
          <ul>
            <li><code>sessionStorage</code> contient le jeton de session, l'e-mail et le rôle jusqu'à la déconnexion ou la fermeture de l'onglet.</li>
            <li><code>localStorage</code> contient le choix de mesure d'audience, daté et versionné, ainsi que les builds que tu choisis d'enregistrer dans le Builder.</li>
            <li>Le panier n'est pas stocké dans le navigateur : il est relu depuis l'API après authentification.</li>
          </ul>
          <p>Tu peux effacer les données locales avec les outils de ton navigateur. Retirer le consentement depuis
          « Préférences de confidentialité » empêche les prochains chargements du script de mesure ; cela
          n'annule pas une requête déjà transmise.</p>
        </div>

        <div>
          <h2>4. Finalités et choix</h2>
          <p>Les données sont utilisées pour authentifier le compte, fournir le panier et les commandes de
          démonstration, publier les avis demandés et traiter le support. La mesure d'audience GoatCounter est
          facultative : elle n'est chargée que si un code de site a été configuré <strong>et</strong> après ton
          accord. Tu peux refuser sans perdre les fonctions essentielles. Cette démonstration ne comporte pas de
          publicité ciblée ni de fonctionnalité de revente de données.</p>
        </div>

        <div>
          <h2>5. Services externes et destinataires</h2>
          <ul>
            <li><strong>Netlify et Render</strong> hébergent respectivement l'interface et l'API/base de données. Ils peuvent traiter des journaux techniques selon leur propre configuration et leurs conditions.</li>
            <li><strong>FreeToGame</strong> : la section de découverte appelle directement son API depuis ton navigateur. L'appel est fait sans identifiant applicatif et avec une politique <code>no-referrer</code>, mais le service reçoit nécessairement les informations réseau utiles à la réponse (par exemple l'adresse IP). Les miniatures sont aussi chargées depuis son domaine.</li>
            <li><strong>Google Fonts, Wikimedia Commons et eBay Images</strong> peuvent recevoir des requêtes réseau lorsque les polices ou visuels distants sont chargés.</li>
            <li><strong>Stripe</strong> n'intervient que si le mode Stripe test est configuré et que tu suis la redirection de paiement. Stripe traite alors les données saisies sur sa page et un identifiant de session de paiement est conservé côté serveur. En mode simulé, Stripe n'est pas appelé.</li>
            <li><strong>GoatCounter</strong> ne peut être chargé qu'après consentement et configuration. Le niveau d'identification, l'hébergement et la durée réelle dépendent du compte choisi par l'exploitant et doivent être vérifiés avant production.</li>
          </ul>
        </div>

        <div>
          <h2>6. Conservation et limites actuelles</h2>
          <p>L'application ne met pas encore en œuvre de purge automatique par ancienneté : compte, panier,
          commandes, avis et messages liés restent en base jusqu'à la suppression du compte ou une intervention
          de l'exploitant. Les messages envoyés sans connexion ne sont pas rattachés automatiquement à un compte
          et doivent faire l'objet d'une demande précise. Les stockages du navigateur restent jusqu'aux échéances
          indiquées au §3 ou à leur effacement manuel. Les journaux des hébergeurs et données déjà reçues par
          un service externe ne sont pas supprimés par le bouton FrameForge.</p>
        </div>

        <div>
          <h2>7. Accès, export, effacement et autres droits</h2>
          <p>Depuis <Link to="/commandes">Mes commandes</Link>, une personne connectée peut télécharger un
          export JSON de son compte, de son panier, de ses commandes, avis et messages de support liés. Elle peut
          aussi demander la suppression du compte et de ces données liées. Les comptes de démonstration protégés
          ne sont pas supprimables depuis l'interface afin de maintenir la démo.</p>
          <p>Pour rectifier une donnée non modifiable dans l'interface, demander l'accès à un message visiteur,
          exercer une opposition ou demander une limitation, utilise le <Link to="/contact">formulaire de
          contact</Link> en donnant assez d'éléments pour retrouver la donnée. Une instance exploitée en France
          doit aussi permettre une réclamation auprès de la CNIL. Ces fonctions techniques ne constituent pas, à
          elles seules, une certification de conformité RGPD.</p>
        </div>

        <div>
          <h2>8. Analyse du matériel (Vérificateur)</h2>
          <p>Sur la page <Link to="/verificateur">Vérificateur</Link>, tu peux — <strong>si tu le souhaites</strong> —
          télécharger un outil (<code>detect-pc.bat</code> / <code>detect-pc.ps1</code>) et l'exécuter sur ton
          ordinateur. Il lit localement le modèle de la carte graphique, du processeur et la quantité de RAM, puis
          rouvre FrameForge avec le résultat.</p>
          <p>L'outil n'appelle pas l'API FrameForge. Le résultat est placé dans le <strong>fragment de
          l'adresse</strong> (après <code>#</code>), qui n'est pas envoyé au serveur lors de la requête HTTP. Il est
          lu dans le navigateur pour préremplir l'estimation, puis retiré de l'adresse. Il n'est pas enregistré par
          l'application. Cette information pouvant contribuer à une empreinte matérielle, l'exécution reste
          volontaire et la sélection manuelle est toujours disponible.</p>
        </div>

        <div>
          <h2>9. Sécurité</h2>
          <p>Le déploiement prévoit HTTPS, mots de passe hachés par ASP.NET Identity, jetons de session,
          autorisations côté API et en-têtes de sécurité. Aucun dispositif ne supprimant tout risque, n'envoie
          pas d'information sensible dans les avis ou le formulaire de support de cette démonstration.</p>
        </div>
      </section>
    </div>
  );
}
