import { Link } from 'react-router-dom';
import type { Product } from '../api/types';
import { euro } from '../lib/format';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { errorMessage } from '../api/client';
import PerfBadge from './PerfBadge';
import MediaImage from './MediaImage';

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const { notify } = useToast();

  async function add() {
    if (!isAuthenticated) {
      notify('Connecte-toi pour ajouter au panier.', 'info');
      return;
    }
    try {
      await addItem(product.id, 1);
      notify(`${product.name} ajouté au panier.`, 'success');
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  }

  const out = product.stock <= 0;

  // Le lien couvre image + infos ; le footer (prix + bouton) est un FRÈRE du lien
  // → pas de <button> imbriqué dans un <a> (HTML valide + accessible).
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Link to={`/produit/${product.id}`}
        style={{ display: 'flex', flexDirection: 'column', flex: 1, color: 'var(--text)' }}>
        <div style={{ position: 'relative', aspectRatio: '3/2', background: 'var(--bg)', overflow: 'hidden' }}>
          <MediaImage src={product.imageUrl} alt={product.name} categorySlug={product.categorySlug}
            fit="cover" label={product.brand} />
          <span style={{ position: 'absolute', top: 8, left: 8 }}><PerfBadge score={product.perfScore} /></span>
          {out && <span className="badge badge-danger" style={{ position: 'absolute', top: 8, right: 8 }}>Rupture</span>}
        </div>
        <div style={{ padding: '0.9rem 0.9rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <span className="badge" style={{ alignSelf: 'flex-start' }}>{product.brand}</span>
          <strong style={{ fontFamily: 'var(--font-title)', fontSize: '1.02rem', lineHeight: 1.25 }}>{product.name}</strong>
          <span className="muted" style={{ fontSize: '0.8rem' }}>{product.categoryName}</span>
        </div>
      </Link>
      <div className="row between" style={{ padding: '0 0.9rem 0.9rem', marginTop: 'auto' }}>
        <span className="price" style={{ fontSize: '1.15rem' }}>{euro(product.price)}</span>
        <button className="btn btn-action btn-sm" onClick={add} disabled={out}>
          {out ? 'Indispo' : 'Ajouter'}
        </button>
      </div>
    </div>
  );
}
