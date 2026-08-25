import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../../api/endpoints';
import { useCategories, useProducts } from '../../api/queries';
import type { Product } from '../../api/types';
import { euro } from '../../lib/format';
import { useToast } from '../../components/Toast';
import { errorMessage } from '../../api/client';

type Form = Partial<Product> & { categoryId?: number };
const EMPTY: Form = { name: '', brand: '', price: 0, stock: 0, perfScore: 50, description: '', imageUrl: '', specs: '', categoryId: undefined };

export default function AdminProducts() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Form | null>(null);
  const [search, setSearch] = useState('');
  const { notify } = useToast();

  const { data: page } = useProducts({ search: search || undefined, pageSize: 100, sort: 'name' });
  const items = page?.items ?? [];
  const { data: cats = [] } = useCategories();

  // Rafraîchit toutes les listes/fiches produits après une mutation.
  const refresh = () => qc.invalidateQueries({ queryKey: ['products'] });

  function startCreate() { setEditing({ ...EMPTY, categoryId: cats[0]?.id }); }
  function startEdit(p: Product) { setEditing({ ...p }); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    if (editing.specs) {
      try { JSON.parse(editing.specs); }
      catch { notify('Specs : JSON invalide.', 'error'); return; }
    }
    const body = {
      name: editing.name, brand: editing.brand, price: Number(editing.price),
      stock: Number(editing.stock), perfScore: Number(editing.perfScore),
      description: editing.description ?? '', imageUrl: editing.imageUrl || undefined,
      specs: editing.specs || undefined, categoryId: Number(editing.categoryId),
    };
    try {
      if (editing.id) { await productsApi.update(editing.id, body); notify('Produit mis à jour.', 'success'); }
      else { await productsApi.create(body); notify('Produit créé.', 'success'); }
      setEditing(null); refresh();
    } catch (err) { notify(errorMessage(err), 'error'); }
  }

  async function remove(p: Product) {
    if (!confirm(`Supprimer "${p.name}" ?`)) return;
    try { await productsApi.remove(p.id); notify('Produit supprimé.', 'success'); refresh(); }
    catch (err) { notify(errorMessage(err), 'error'); }
  }

  return (
    <div>
      <div className="row between wrap" style={{ marginBottom: '1rem' }}>
        <input placeholder="Rechercher…" style={{ maxWidth: 280 }} value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn btn-action" onClick={startCreate}>+ Nouveau produit</button>
      </div>

      <div className="surface" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', minWidth: 640 }}>
          <thead>
            <tr className="muted" style={{ textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
              <th style={{ padding: '0.6rem' }}>Nom</th><th>Catégorie</th><th>Prix</th><th>Stock</th><th>Perf</th><th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '0.55rem 0.6rem' }}>{p.name} <span className="muted">· {p.brand}</span></td>
                <td>{p.categoryName}</td>
                <td className="price">{euro(p.price)}</td>
                <td>{p.stock}</td>
                <td><span className="badge badge-cyan">{p.perfScore}</span></td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button className="btn btn-sm btn-ghost" onClick={() => startEdit(p)} aria-label={`Modifier ${p.name}`}>✏️</button>
                  <button className="btn btn-sm btn-danger" onClick={() => remove(p)} aria-label={`Supprimer ${p.name}`}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div onClick={() => setEditing(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', zIndex: 200, padding: '1rem' }}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={save} className="surface stack"
            style={{ padding: '1.5rem', width: 'min(560px, 95vw)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginTop: 0 }}>{editing.id ? 'Modifier' : 'Nouveau'} produit</h2>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div><label>Nom</label><input required value={editing.name ?? ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><label>Marque</label><input required value={editing.brand ?? ''} onChange={(e) => setEditing({ ...editing, brand: e.target.value })} /></div>
              <div><label>Prix (€)</label><input type="number" step="0.01" min="0" value={editing.price ?? 0} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} /></div>
              <div><label>Stock</label><input type="number" min="0" value={editing.stock ?? 0} onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })} /></div>
              <div><label>PerfScore (0-100)</label><input type="number" min="0" max="100" value={editing.perfScore ?? 0} onChange={(e) => setEditing({ ...editing, perfScore: Number(e.target.value) })} /></div>
              <div>
                <label>Catégorie</label>
                <select value={editing.categoryId ?? ''} onChange={(e) => setEditing({ ...editing, categoryId: Number(e.target.value) })}>
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div><label>Image URL</label><input value={editing.imageUrl ?? ''} onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value })} /></div>
            <div><label>Description</label><textarea rows={2} value={editing.description ?? ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
            <div><label>Specs (JSON)</label><input className="mono" placeholder='{"Vram":"16 Go"}' value={editing.specs ?? ''} onChange={(e) => setEditing({ ...editing, specs: e.target.value })} /></div>
            <div className="row" style={{ justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Annuler</button>
              <button className="btn btn-action">Enregistrer</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
