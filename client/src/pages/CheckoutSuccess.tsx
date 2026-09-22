import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { checkoutApi } from '../api/endpoints';
import { useCart } from '../context/CartContext';
import { useSeo } from '../lib/seo';

export default function CheckoutSuccess() {
  useSeo('Validation de la commande', 'FrameForge vérifie la commande côté serveur avant d’afficher sa confirmation.');
  const [params] = useSearchParams();
  const orderId = Number(params.get('orderId'));
  const hasValidOrderId = Number.isInteger(orderId) && orderId > 0;
  const { refresh } = useCart();
  const qc = useQueryClient();
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>(hasValidOrderId ? 'pending' : 'error');
  const [paymentMode, setPaymentMode] = useState<'simulation' | 'stripe_test' | null>(null);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    // Historique des commandes + stock produits à rafraîchir après l'achat.
    const after = () => { void refresh(); qc.invalidateQueries({ queryKey: ['orders'] }); qc.invalidateQueries({ queryKey: ['products'] }); };
    // Une query string n'est jamais une preuve de succès. Simulation comme Stripe test passent
    // par la même confirmation serveur, qui vérifie propriétaire, statut, paiement et stock.
    if (hasValidOrderId) {
      checkoutApi.confirm(orderId).then((confirmation) => {
        if ((confirmation.status !== 'Paid' && confirmation.status !== 'Shipped')
          || (confirmation.paymentMode !== 'simulation' && confirmation.paymentMode !== 'stripe_test')) {
          setStatus('error');
          return;
        }
        setPaymentMode(confirmation.paymentMode);
        setStatus('success');
        after();
      }).catch(() => setStatus('error'));
    }
  }, [hasValidOrderId, orderId, refresh, qc]);

  const failed = status === 'error';

  return (
    <div className="container center" style={{ maxWidth: 520, padding: '2rem' }}>
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200 }}
        style={{ fontSize: '4rem' }}>{failed ? '⚠️' : status === 'success' ? '✅' : '⏳'}</motion.div>
      <h1>{failed ? 'Confirmation impossible' : status === 'success' ? 'Commande confirmée' : 'Validation serveur en cours'}</h1>
      <p className="muted" aria-live="polite">
        {failed
          ? 'La commande n\'a pas pu être confirmée par le serveur.'
          : status === 'success'
            ? paymentMode === 'simulation' ? 'La commande de démonstration a été validée par le serveur'
              : 'Le paiement Stripe test a été vérifié par le serveur'
            : 'Validation en cours…'}
        {orderId ? ` — commande #${orderId}.` : '.'}
      </p>
      {failed && (
        <p className="badge badge-danger">Aucun succès n'a été enregistré. Réessaie ou contacte le support.</p>
      )}
      {status === 'success' && paymentMode === 'simulation' && (
        <p className="badge badge-warning">Paiement simulé — aucun paiement réel n'a été effectué</p>
      )}
      {status === 'success' && paymentMode === 'stripe_test' && (
        <p className="badge badge-success">Paiement Stripe test confirmé</p>
      )}
      <div className="row" style={{ justifyContent: 'center', marginTop: '1.5rem' }}>
        {failed
          ? <Link to="/contact" className="btn btn-cyan">Contacter le support</Link>
          : status === 'success' && <Link to="/commandes" className="btn btn-cyan">Voir mes commandes</Link>}
        <Link to="/boutique" className="btn btn-ghost">Continuer mes achats</Link>
      </div>
    </div>
  );
}
