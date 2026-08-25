import { Link } from 'react-router-dom';
import { useSeo } from '../lib/seo';

/** Politique de confidentialité — traitement des données personnelles (RGPD, C11). */
export default function Privacy() {
  useSeo(
    'Politique de confidentialité',
    'Comment FrameForge collecte, utilise et protège tes données personnelles (RGPD).',
  );

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <h1>Politique de confidentialité</h1>
      <p className="muted">Dernière mise à jour : juillet 2026. Projet pédagogique — données de démonstration.</p>

      <section className="stack" style={{ gap: '1.2rem', marginTop: '1.5rem' }}>
        <div>
          <h2>1. Responsable du traitement</h2>
          <p>FrameForge (projet étudiant). Contact : <a href="mailto:elhasnaouiahmed3a1@gmail.com">elhasnaouiahmed3a1@gmail.com</a>.</p>
        </div>
        <div>
          <h2>2. Données collectées</h2>
          <ul>
            <li><strong>Compte</strong> : adresse e-mail et mot de passe (haché, jamais stocké en clair).</li>
            <li><strong>Commandes</strong> : produits commandés, montants (paiement Stripe en mode test).</li>
            <li><strong>Avis & support</strong> : contenu que tu publies volontairement.</li>
            <li><strong>Stockage local</strong> : ta session (jeton) et ton panier — <em>essentiels</em> au fonctionnement.</li>
          </ul>
        </div>
        <div>
          <h2>3. Finalités</h2>
          <p>Gérer ton compte, tes commandes et le service client. Aucune revente de données. Les statistiques
          d'audience éventuelles sont <strong>anonymes</strong> et soumises à ton consentement (bannière cookies).</p>
        </div>
        <div>
          <h2>4. Durée de conservation</h2>
          <p>Tes données sont conservées le temps de ton compte. Tu peux le supprimer à tout moment (voir §6),
          ce qui efface tes données personnelles associées.</p>
        </div>
        <div>
          <h2>5. Sécurité</h2>
          <p>Mots de passe hachés, authentification par jeton, politique de mot de passe conforme CNIL,
          en-têtes HTTP de sécurité, communication chiffrée (HTTPS en production).</p>
        </div>
        <div>
          <h2>6. Tes droits (RGPD)</h2>
          <p>Tu disposes d'un droit d'accès, de rectification et d'effacement. Depuis la page{' '}
          <Link to="/commandes">Mes commandes</Link>, tu peux <strong>supprimer ton compte et tes données</strong>
          en un clic. Pour toute demande, contacte le DPO ci-dessus.</p>
        </div>
        <div>
          <h2>7. Cookies & stockage</h2>
          <p>Seul le stockage essentiel (session, panier) est utilisé sans consentement. Les mesures d'audience
          ne sont activées qu'avec ton accord, révocable en vidant le stockage du site.</p>
        </div>
        <div>
          <h2>8. Analyse du matériel (Vérificateur)</h2>
          <p>Sur la page <Link to="/verificateur">Vérificateur</Link>, tu peux — <strong>si tu le souhaites</strong> —
          télécharger un petit outil (<code>detect-pc.bat</code> / <code>detect-pc.ps1</code>) et l'exécuter sur ton
          ordinateur. Il lit localement le modèle de ta carte graphique, ton processeur et la quantité de RAM, puis
          rouvre FrameForge avec le résultat.</p>
          <p>Cet outil <strong>n'envoie rien à notre serveur</strong>. Le résultat est transmis à la page via le
          <strong> fragment de l'adresse</strong> (la partie après <code>#</code>), que les navigateurs
          <strong> n'envoient jamais au serveur</strong> : il est lu et décodé <strong>uniquement dans ton
          navigateur</strong>, sur le moment, à seule fin d'estimer la compatibilité d'un jeu, puis oublié. Ces données
          ne sont <strong>ni stockées, ni utilisées pour du pistage</strong>, bien qu'elles puissent techniquement
          constituer une empreinte matérielle. Télécharger et lancer l'outil est entièrement volontaire, son code
          source est lisible, et tu peux à tout moment choisir ton matériel manuellement à la place.</p>
        </div>
      </section>
    </div>
  );
}
