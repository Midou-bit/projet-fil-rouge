import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { checkoutApi } from '../api/endpoints';
import { useCart } from '../context/CartContext';
import { useSeo } from '../lib/seo';

export default function CheckoutSuccess() {
  useSeo('Commande confirmée', 'Ta commande FrameForge est enregistrée. Retrouve-la dans « Mes commandes ».');
  const [params] = useSearchParams();
  const orderId = Number(params.get('orderId'));
  const simulated = params.get('simulated') === '1';
  const { refresh } = useCart();
  const qc = useQueryClient();
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>(simulated ? 'success' : 'pending');
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    // Historique des commandes + stock produits à rafraîchir après l'achat.
    const after = () => { void refresh(); qc.invalidateQueries({ queryKey: ['orders'] }); qc.invalidateQueries({ queryKey: ['products'] }); };
    // En mode Stripe réel, la page de retour confirme la commande (décrément stock + vide panier).
    if (orderId && !simulated) {
      checkoutApi.confirm(orderId).then(() => { setStatus('success'); after(); }).catch(() => setStatus('error'));
    } else {
      after();
    }
  }, [orderId, simulated, refresh, qc]);

  const failed = status === 'error';

  return (
    <div className="container center" style={{ maxWidth: 520, padding: '2rem' }}>
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200 }}
        style={{ fontSize: '4rem' }}>{failed ? '⚠️' : '✅'}</motion.div>
      <h1>{failed ? 'Confirmation impossible' : 'Commande confirmée'}</h1>
      <p className="muted">
        {failed
          ? 'Le paiement n\'a pas pu être confirmé automatiquement.'
          : status === 'success' ? 'Ton paiement a été validé' : 'Validation en cours…'}
        {orderId ? ` — commande #${orderId}.` : '.'}
      </p>
      {failed && (
        <p className="badge badge-danger">Contacte le support si le montant a bien été débité.</p>
      )}
      {simulated && <p className="badge badge-warning">Paiement simulé (mode démo, Stripe non configuré)</p>}
      <div className="row" style={{ justifyContent: 'center', marginTop: '1.5rem' }}>
        {failed
          ? <Link to="/contact" className="btn btn-cyan">Contacter le support</Link>
          : <Link to="/commandes" className="btn btn-cyan">Voir mes commandes</Link>}
        <Link to="/boutique" className="btn btn-ghost">Continuer mes achats</Link>
      </div>
    </div>
  );
}
