import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { checkoutApi } from '../api/endpoints';
import { euro } from '../lib/format';
import { useToast } from '../components/Toast';
import { errorMessage } from '../api/client';

export default function CartPage() {
  const { cart, loading, updateItem, removeItem, refresh } = useCart();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function checkout() {
    setBusy(true);
    try {
      const res = await checkoutApi.create();
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl; // redirection Stripe test
      } else if (res.simulated) {
        // Mode démo : paiement simulé côté API, on va direct à la page de succès.
        await refresh();
        navigate(`/checkout/success?orderId=${res.orderId}&simulated=1`);
      }
    } catch (e) {
      notify(errorMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  }

  if (loading && !cart) {
    return <div className="container center" style={{ padding: '3rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container center" style={{ padding: '3rem' }}>
        <h1>Ton panier est vide</h1>
        <p className="muted">Direction la boutique pour forger ton setup.</p>
        <Link to="/boutique" className="btn btn-cyan">Explorer la boutique</Link>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Panier</h1>
      <div className="grid split" style={{ alignItems: 'start' }}>
        <div className="stack">
          {cart.items.map((it) => (
            <div key={it.id} className="surface row" style={{ padding: '0.8rem', gap: '1rem' }}>
              <div style={{ width: 80, height: 60, background: 'var(--bg)', borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                {it.imageUrl && <img src={it.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
              <div style={{ flex: 1 }}>
                <Link to={`/produit/${it.productId}`}><strong>{it.productName}</strong></Link>
                <div className="price muted" style={{ fontSize: '0.85rem' }}>{euro(it.unitPrice)} / unité</div>
              </div>
              {/* Commit sur blur/Enter (pas à chaque frappe) → évite une rafale de requêtes. */}
              <input type="number" min={1} max={it.stock} defaultValue={it.quantity} key={`${it.id}-${it.quantity}`}
                style={{ width: 70 }}
                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                onBlur={(e) => {
                  const q = Math.max(1, Math.min(it.stock, Number(e.target.value) || 1));
                  if (q !== it.quantity) updateItem(it.id, q).catch((err) => notify(errorMessage(err), 'error'));
                }} />
              <div className="price" style={{ width: 90, textAlign: 'right' }}>{euro(it.lineTotal)}</div>
              <button className="btn btn-sm btn-danger" aria-label={`Retirer ${it.productName} du panier`}
                onClick={() => removeItem(it.id).catch((err) => notify(errorMessage(err), 'error'))}>✕</button>
            </div>
          ))}
        </div>

        <div className="surface" style={{ padding: '1.2rem', position: 'sticky', top: 80 }}>
          <h3 style={{ marginTop: 0 }}>Récapitulatif</h3>
          <div className="row between"><span className="muted">Articles</span><span>{cart.itemCount}</span></div>
          <div className="row between" style={{ marginTop: '0.4rem' }}><span className="muted">Livraison</span><span className="badge badge-success">Offerte</span></div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1rem 0' }} />
          <div className="row between"><strong>Total</strong><span className="price" style={{ fontSize: '1.4rem' }}>{euro(cart.total)}</span></div>
          <button className="btn btn-action btn-block" style={{ marginTop: '1rem' }} disabled={busy} onClick={checkout}>
            {busy ? '…' : '💳 Payer'}
          </button>
          <p className="muted center" style={{ fontSize: '0.75rem', marginTop: '0.6rem' }}>
            Paiement Stripe en mode test — carte 4242 4242 4242 4242.
          </p>
        </div>
      </div>
    </div>
  );
}
