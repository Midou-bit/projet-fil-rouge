import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { reviewsApi } from '../api/endpoints';
import { qk, useProduct, useReviews } from '../api/queries';
import { euro, date, parseSpecs } from '../lib/format';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { errorMessage } from '../api/client';
import PerfBadge from '../components/PerfBadge';
import MediaImage from '../components/MediaImage';
import { useSeo } from '../lib/seo';

function Stars({ value }: { value: number }) {
  return <span style={{ color: 'var(--accent-yellow)', letterSpacing: 2 }}>{'★'.repeat(Math.round(value))}<span className="muted">{'★'.repeat(5 - Math.round(value))}</span></span>;
}

export default function ProductDetail() {
  const { id } = useParams();
  const pid = Number(id);
  const validId = Number.isFinite(pid) && pid > 0;
  const qc = useQueryClient();
  const { data: product, isLoading, isError } = useProduct(validId ? pid : 0);
  const { data: reviews = [] } = useReviews(pid);
  const [qty, setQty] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const { notify } = useToast();

  // SEO + données structurées Product (JSON-LD) pour le référencement de la fiche.
  const jsonLd = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.imageUrl || undefined,
    description: product.description,
    brand: { '@type': 'Brand', name: product.brand },
    category: product.categoryName,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'EUR',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
    ...(product.reviewCount > 0 ? {
      aggregateRating: { '@type': 'AggregateRating', ratingValue: product.averageRating, reviewCount: product.reviewCount },
    } : {}),
  } : undefined;
  useSeo(
    product?.name,
    product ? `${product.name} — ${product.brand}, ${product.categoryName}. ${product.description}`.slice(0, 160) : undefined,
    jsonLd,
    product?.imageUrl,
  );

  async function add() {
    if (!isAuthenticated) return notify('Connecte-toi pour ajouter au panier.', 'info');
    try { await addItem(pid, qty); notify('Ajouté au panier.', 'success'); }
    catch (e) { notify(errorMessage(e), 'error'); }
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    try {
      await reviewsApi.create(pid, rating, comment);
      setComment('');
      notify('Merci pour ton avis !', 'success');
      // Rafraîchit avis + fiche (note moyenne) via invalidation du cache.
      qc.invalidateQueries({ queryKey: qk.reviews(pid) });
      qc.invalidateQueries({ queryKey: qk.product(pid) });
    } catch (e) { notify(errorMessage(e), 'error'); }
  }

  if (!validId || isError) {
    return (
      <div className="container center" style={{ padding: '3rem' }}>
        <h1>Produit introuvable</h1>
        <p className="muted">Ce produit n'existe pas ou n'est plus disponible.</p>
        <Link to="/boutique" className="btn btn-cyan">Retour à la boutique</Link>
      </div>
    );
  }
  if (isLoading || !product) return <div className="container center" style={{ padding: '3rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>;

  const specs = parseSpecs(product.specs);

  return (
    <div className="container has-buybar">
      <Link to="/boutique" className="muted" style={{ fontSize: '0.88rem' }}>← Retour à la boutique</Link>
      <div className="grid split" style={{ marginTop: '1rem', alignItems: 'start' }}>
        <div className="surface" style={{ position: 'relative', overflow: 'hidden', aspectRatio: '3/2' }}>
          <MediaImage src={product.imageUrl} alt={product.name} categorySlug={product.categorySlug}
            fit="contain" label={product.brand} />
        </div>
        <div className="stack">
          <div className="row wrap" style={{ gap: '0.5rem' }}>
            <span className="badge">{product.brand}</span>
            <span className="badge badge-cyan">{product.categoryName}</span>
            <PerfBadge score={product.perfScore} />
          </div>
          <h1 style={{ margin: 0 }}>{product.name}</h1>
          {product.reviewCount > 0 && (
            <div className="row" style={{ gap: '0.5rem' }}><Stars value={product.averageRating} />
              <span className="muted" style={{ fontSize: '0.85rem' }}>{product.averageRating} ({product.reviewCount} avis)</span></div>
          )}
          <p className="muted">{product.description}</p>
          <div className="price" style={{ fontSize: '2rem' }}>{euro(product.price)}</div>
          <div className="row" style={{ gap: '0.5rem' }}>
            <span className={`badge ${product.stock > 0 ? 'badge-success' : 'badge-danger'}`}>
              {product.stock > 0 ? `En stock (${product.stock})` : 'Rupture'}
            </span>
          </div>
          <div className="row" style={{ gap: '0.6rem' }}>
            <input type="number" min={1} max={product.stock} value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} style={{ width: 90 }} />
            <button className="btn btn-action" disabled={product.stock <= 0} onClick={add}>🛒 Ajouter au panier</button>
          </div>

          {specs.length > 0 && (
            <div className="surface" style={{ padding: '1rem' }}>
              <h3 style={{ fontSize: '1rem', marginTop: 0 }}>Spécifications</h3>
              {/* Conteneur de défilement : une valeur longue ne doit pas pousser toute la page
                  en défilement horizontal sur un écran étroit. */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                  <tbody>
                    {specs.map(([k, v]) => (
                      <tr key={k} style={{ borderTop: '1px solid var(--border)' }}>
                        <td className="muted" style={{ padding: '0.4rem 0' }}>{k}</td>
                        <td style={{ padding: '0.4rem 0', textAlign: 'right' }}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Avis */}
      <section style={{ marginTop: '2.5rem' }}>
        <h2>Avis clients</h2>
        {isAuthenticated && (
          <form onSubmit={submitReview} className="surface" style={{ padding: '1rem', marginBottom: '1rem', display: 'grid', gap: '0.6rem' }}>
            <div className="row" style={{ gap: '0.5rem' }}>
              <label style={{ margin: 0 }}>Note</label>
              <select value={rating} onChange={(e) => setRating(Number(e.target.value))} style={{ width: 110 }}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
              </select>
            </div>
            <textarea rows={2} required minLength={1} placeholder="Ton retour sur ce composant…" value={comment} onChange={(e) => setComment(e.target.value)} />
            <button className="btn btn-cyan btn-sm" style={{ justifySelf: 'start' }} disabled={!comment.trim()}>Publier mon avis</button>
          </form>
        )}
        {reviews.length === 0 ? <p className="muted">Aucun avis pour le moment.</p> : (
          <div className="stack">
            {reviews.map((r) => (
              <div key={r.id} className="surface" style={{ padding: '0.9rem' }}>
                <div className="row between">
                  <strong>{r.author}</strong>
                  <Stars value={r.rating} />
                </div>
                <p style={{ margin: '0.4rem 0 0' }}>{r.comment}</p>
                <span className="muted" style={{ fontSize: '0.75rem' }}>{date(r.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Barre d'achat collante, mobile uniquement : au-delà de 860 px le bouton reste
          visible dans la colonne de droite, la barre est masquée en CSS. */}
      <div className="buybar">
        <div>
          <div className="price" style={{ fontSize: '1.15rem', lineHeight: 1.2 }}>{euro(product.price)}</div>
          <span className="muted" style={{ fontSize: '0.75rem' }}>
            {product.stock > 0 ? `En stock (${product.stock})` : 'Rupture de stock'}
          </span>
        </div>
        <button className="btn btn-action" disabled={product.stock <= 0} onClick={add}>
          🛒 Ajouter au panier
        </button>
      </div>
    </div>
  );
}
