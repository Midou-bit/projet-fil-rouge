import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { type ProductQuery } from '../api/endpoints';
import { useBrands, useCategories, useProducts } from '../api/queries';
import ProductCard from '../components/ProductCard';
import { useSeo } from '../lib/seo';

const SORTS = [
  { v: 'name', l: 'Nom (A→Z)' },
  { v: 'price_asc', l: 'Prix croissant' },
  { v: 'price_desc', l: 'Prix décroissant' },
  { v: 'perf', l: 'Performance' },
  { v: 'newest', l: 'Nouveautés' },
];

export default function Shop() {
  useSeo('Boutique', 'Catalogue de composants PC : cartes graphiques, processeurs, RAM, SSD, cartes mères, alimentations et boîtiers. Filtres par prix, marque et performance.');
  const [params, setParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(params.get('search') ?? '');
  const [minPriceInput, setMinPriceInput] = useState(params.get('minPrice') ?? '');
  const [maxPriceInput, setMaxPriceInput] = useState(params.get('maxPrice') ?? '');
  const [minPerfInput, setMinPerfInput] = useState(params.get('minPerf') ?? '');

  // Filtres dérivés de l'URL (partageable, retour navigateur OK)
  const query: ProductQuery = useMemo(() => ({
    search: params.get('search') || undefined,
    category: params.get('category') || undefined,
    brand: params.get('brand') || undefined,
    minPrice: params.get('minPrice') ? Number(params.get('minPrice')) : undefined,
    maxPrice: params.get('maxPrice') ? Number(params.get('maxPrice')) : undefined,
    minPerf: params.get('minPerf') ? Number(params.get('minPerf')) : undefined,
    sort: params.get('sort') || 'name',
    page: params.get('page') ? Number(params.get('page')) : 1,
    pageSize: 12,
  }), [params]);

  // TanStack Query : cache + dédup (catégories/marques partagées, page produits mise en cache par filtre).
  const { data: cats = [] } = useCategories();
  const { data: brands = [] } = useBrands();
  const { data, isLoading: loading } = useProducts(query);

  function update(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === undefined || v === '') next.delete(k);
      else next.set(k, v);
    });
    if (!('page' in patch)) next.set('page', '1'); // reset page quand un filtre change
    setParams(next);
  }

  // Recherche + filtres numériques debouncés : un seul appel 350 ms après la dernière frappe
  // (anti-spam réseau) — inputs contrôlés pour rester synchrones avec l'URL (partage/retour navigateur).
  useEffect(() => {
    const v = searchInput.trim() || undefined;
    if (v === query.search) return;
    const t = setTimeout(() => update({ search: v }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  useEffect(() => {
    const v = minPriceInput.trim() || undefined;
    if (v === (query.minPrice?.toString() ?? undefined)) return;
    const t = setTimeout(() => update({ minPrice: v }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minPriceInput]);

  useEffect(() => {
    const v = maxPriceInput.trim() || undefined;
    if (v === (query.maxPrice?.toString() ?? undefined)) return;
    const t = setTimeout(() => update({ maxPrice: v }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxPriceInput]);

  useEffect(() => {
    const v = minPerfInput.trim() || undefined;
    if (v === (query.minPerf?.toString() ?? undefined)) return;
    const t = setTimeout(() => update({ minPerf: v }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minPerfInput]);

  return (
    <div className="container">
      <h1>Boutique</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '1.5rem' }}>
        {/* Barre de filtres */}
        <div className="surface" style={{ padding: '1rem', display: 'grid', gap: '0.8rem', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', alignItems: 'end' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="shop-search">Recherche</label>
            <input id="shop-search" type="search" placeholder="RTX, Ryzen, boîtier…" value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)} />
          </div>
          <div>
            <label htmlFor="shop-category">Catégorie</label>
            <select id="shop-category" value={query.category ?? ''} onChange={(e) => update({ category: e.target.value || undefined })}>
              <option value="">Toutes</option>
              {cats.map((c) => <option key={c.id} value={c.slug}>{c.name} ({c.productCount})</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="shop-brand">Marque</label>
            <select id="shop-brand" value={query.brand ?? ''} onChange={(e) => update({ brand: e.target.value || undefined })}>
              <option value="">Toutes</option>
              {brands.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="shop-min-price">Prix min (€)</label>
            <input id="shop-min-price" type="number" min={0} value={minPriceInput}
              onChange={(e) => setMinPriceInput(e.target.value)} />
          </div>
          <div>
            <label htmlFor="shop-max-price">Prix max (€)</label>
            <input id="shop-max-price" type="number" min={0} value={maxPriceInput}
              onChange={(e) => setMaxPriceInput(e.target.value)} />
          </div>
          <div>
            <label htmlFor="shop-min-perf">Performance minimale</label>
            <input id="shop-min-perf" type="number" min={0} max={100} value={minPerfInput}
              onChange={(e) => setMinPerfInput(e.target.value)} />
          </div>
          <div>
            <label htmlFor="shop-sort">Trier par</label>
            <select id="shop-sort" value={query.sort} onChange={(e) => update({ sort: e.target.value })}>
              {SORTS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
          </div>
        </div>

        {/* Résultats */}
        <div>
          {loading ? (
            <div className="center" role="status" aria-live="polite" style={{ padding: '3rem' }}>
              <div className="spinner" aria-hidden="true" style={{ margin: '0 auto' }} />
              <span className="sr-only">Chargement des produits…</span>
            </div>
          ) : !data || data.items.length === 0 ? (
            <p className="muted center" style={{ padding: '3rem' }}>Aucun produit ne correspond à ces filtres.</p>
          ) : (
            <>
              <p className="muted" aria-live="polite" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{data.total} résultat(s)</p>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                {data.items.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
              {data.totalPages > 1 && (
                <nav className="row center" aria-label="Pagination des produits" style={{ justifyContent: 'center', marginTop: '1.5rem', gap: '0.5rem' }}>
                  <button className="btn btn-sm" disabled={data.page <= 1} onClick={() => update({ page: String(data.page - 1) })}>← Préc.</button>
                  <span className="badge">Page {data.page} / {data.totalPages}</span>
                  <button className="btn btn-sm" disabled={data.page >= data.totalPages} onClick={() => update({ page: String(data.page + 1) })}>Suiv. →</button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
