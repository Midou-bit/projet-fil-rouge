import { Link } from 'react-router-dom';

export default function CheckoutCancel() {
  return (
    <div className="container center" style={{ maxWidth: 520, padding: '2rem' }}>
      <div style={{ fontSize: '3.5rem' }}>🛑</div>
      <h1>Paiement annulé</h1>
      <p className="muted">Aucun montant n’a été débité. Ton panier t’attend toujours.</p>
      <Link to="/panier" className="btn btn-cyan">Retour au panier</Link>
    </div>
  );
}
