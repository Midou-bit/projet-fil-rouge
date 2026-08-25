import { Link } from 'react-router-dom';
import { useSeo } from '../lib/seo';

/** Mentions légales et conditions générales de vente. Projet pédagogique : les obligations
 *  d'un commerce en ligne sont traitées, mais aucune vente réelle n'a lieu. */
export default function Terms() {
  useSeo(
    'Conditions générales et mentions légales',
    "Éditeur, hébergement, conditions de vente et limites de FrameForge, boutique de démonstration.",
  );

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <h1>Conditions générales et mentions légales</h1>
      <p className="muted">
        Dernière mise à jour : août 2026. FrameForge est un projet pédagogique de fin d'année.
        Aucune vente réelle n'y est conclue, aucun bien n'y est expédié.
      </p>

      <section className="stack" style={{ gap: '1.2rem', marginTop: '1.5rem' }}>
        <div>
          <h2>1. Éditeur du site</h2>
          <p>
            FrameForge, projet réalisé par un étudiant en Master 1 Développement Fullstack, à des fins
            de démonstration et d'évaluation. Contact : <a href="mailto:contact@frameforge.dev">contact@frameforge.dev</a>,
            adresse de démonstration. Le canal réellement fonctionnel est le{' '}
            <Link to="/contact">formulaire de contact</Link>, dont les messages arrivent dans l'espace
            d'administration du site.
          </p>
        </div>

        <div>
          <h2>2. Hébergement</h2>
          <p>
            L'interface est hébergée par <strong>Netlify, Inc.</strong> (netlify.com) et l'interface de
            programmation par <strong>Render Services, Inc.</strong> (render.com), tous deux établis aux
            États-Unis. Les coordonnées complètes de ces sociétés figurent sur leurs sites respectifs.
          </p>
        </div>

        <div>
          <h2>3. Objet du site</h2>
          <p>
            FrameForge présente un catalogue de composants informatiques et propose un moteur de
            recommandation : à partir d'un jeu, d'une résolution et d'une fluidité visée, le site compose
            une configuration complète et estime les images par seconde attendues.
          </p>
          <p>
            Ces estimations reposent sur un <strong>modèle de calcul interne</strong>, pas sur des mesures
            réelles. Elles servent à illustrer un raisonnement de compatibilité et ne constituent ni un
            conseil d'achat, ni une garantie de performance.
          </p>
        </div>

        <div>
          <h2>4. Produits, prix et disponibilité</h2>
          <p>
            Les fiches produits reprennent des références réelles issues d'un jeu de données libre. Les
            prix sont exprimés en euros toutes taxes comprises et les stocks sont fictifs, fixés au
            moment de l'initialisation de la base. Ni les uns ni les autres ne reflètent le marché.
          </p>
        </div>

        <div>
          <h2>5. Commande</h2>
          <p>
            La commande suppose la création d'un compte. Elle se déroule en trois temps : ajout au panier,
            validation du panier, confirmation. Le stock est vérifié une seconde fois à la confirmation :
            si un article vient à manquer entre les deux étapes, la commande est refusée.
          </p>
        </div>

        <div>
          <h2>6. Paiement</h2>
          <p>
            Le paiement fonctionne en <strong>mode démonstration</strong> : aucune coordonnée bancaire
            n'est demandée, aucun montant n'est débité, aucun établissement de paiement n'est sollicité.
            La commande passe simplement à l'état « payée ».
          </p>
          <p>
            Le code prend également en charge Stripe en environnement de test, activable par une clé de
            configuration. Dans ce mode, seules les cartes de test de Stripe sont acceptées et le
            paiement est revérifié auprès de Stripe avant toute décrémentation de stock.
          </p>
        </div>

        <div>
          <h2>7. Livraison</h2>
          <p>
            Aucune livraison n'existe. Il n'y a ni transporteur, ni frais de port, ni délai, ni suivi.
            Une commande confirmée reste une écriture en base de données.
          </p>
        </div>

        <div>
          <h2>8. Rétractation, retours et garanties</h2>
          <p>
            Le droit de rétractation de quatorze jours, les garanties légales de conformité et contre les
            vices cachés s'appliquent aux ventes à distance réelles. Aucune vente réelle n'étant conclue
            ici, ces dispositions n'ont pas d'objet. Tu peux supprimer une commande de démonstration en
            supprimant ton compte depuis <Link to="/commandes">Mes commandes</Link>.
          </p>
        </div>

        <div>
          <h2>9. Compte et comportement</h2>
          <p>
            Tu es responsable de la confidentialité de ton mot de passe. Le site refuse les mots de passe
            de moins de douze caractères et verrouille temporairement un compte après cinq échecs de
            connexion. Les avis publiés engagent leur auteur : propos injurieux, trompeurs ou hors sujet
            peuvent être retirés sans préavis depuis l'espace d'administration.
          </p>
        </div>

        <div>
          <h2>10. Propriété intellectuelle</h2>
          <p>
            Le code source de FrameForge est publié sous licence MIT. Les noms de produits, marques et
            visuels de jeux appartiennent à leurs détenteurs respectifs et sont utilisés à titre
            d'illustration dans un cadre pédagogique.
          </p>
        </div>

        <div>
          <h2>11. Données personnelles</h2>
          <p>
            Le traitement des données, la mesure d'audience et l'exercice de tes droits sont détaillés
            dans la <Link to="/confidentialite">politique de confidentialité</Link>, qui fait partie
            intégrante des présentes conditions.
          </p>
        </div>

        <div>
          <h2>12. Droit applicable</h2>
          <p>
            Les présentes conditions sont soumises au droit français. Ce site n'ayant pas d'activité
            commerciale, aucun litige de consommation ne peut en naître.
          </p>
        </div>
      </section>
    </div>
  );
}
