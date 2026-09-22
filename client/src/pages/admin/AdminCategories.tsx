import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '../../api/endpoints';
import { useCategories } from '../../api/queries';
import type { Category } from '../../api/types';
import { useToast } from '../../components/Toast';
import { errorMessage } from '../../api/client';

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function AdminCategories() {
  const qc = useQueryClient();
  const { data: cats = [] } = useCategories();
  const [name, setName] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const { notify } = useToast();

  const refresh = () => qc.invalidateQueries({ queryKey: ['categories'] });

  async function create(e: React.FormEvent) {
    e.preventDefault();
    try { await categoriesApi.create({ name, slug: slugify(name) }); setName(''); notify('Catégorie créée.', 'success'); refresh(); }
    catch (err) { notify(errorMessage(err), 'error'); }
  }
  async function saveEdit(id: number) {
    try { await categoriesApi.update(id, { name: editName, slug: slugify(editName) }); setEditId(null); notify('Mise à jour.', 'success'); refresh(); }
    catch (err) { notify(errorMessage(err), 'error'); }
  }
  async function remove(c: Category) {
    if (!confirm(`Supprimer "${c.name}" ?`)) return;
    try { await categoriesApi.remove(c.id); notify('Supprimée.', 'success'); refresh(); }
    catch (err) { notify(errorMessage(err), 'error'); }
  }

  return (
    <div className="grid split-sidebar" style={{ alignItems: 'start' }}>
      <div className="surface" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', minWidth: 380 }}>
          <thead>
            <tr className="muted" style={{ textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
              <th scope="col" style={{ padding: '0.6rem' }}>Nom</th><th scope="col">Slug</th><th scope="col">Produits</th><th scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {cats.map((c) => (
              <tr key={c.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '0.5rem 0.6rem' }}>
                  {editId === c.id
                    ? <input aria-label={`Nouveau nom de la catégorie ${c.name}`} value={editName} onChange={(e) => setEditName(e.target.value)} />
                    : c.name}
                </td>
                <td className="mono muted">{c.slug}</td>
                <td>{c.productCount}</td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {editId === c.id ? (
                    <>
                      <button className="btn btn-sm btn-cyan" aria-label={`Enregistrer la catégorie ${c.name}`}
                        onClick={() => saveEdit(c.id)}>OK</button>
                      <button className="btn btn-sm btn-ghost" aria-label={`Annuler la modification de ${c.name}`}
                        onClick={() => setEditId(null)}>✕</button>
                    </>
                  ) : (
                    <>
                      <button className="btn btn-sm btn-ghost" aria-label={`Modifier ${c.name}`}
                        onClick={() => { setEditId(c.id); setEditName(c.name); }}>✏️</button>
                      <button className="btn btn-sm btn-danger" aria-label={`Supprimer ${c.name}`}
                        onClick={() => remove(c)}>🗑️</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={create} className="surface stack" style={{ padding: '1.2rem' }}>
        <h3 style={{ marginTop: 0 }}>Nouvelle catégorie</h3>
        <div><label htmlFor="new-category-name">Nom</label><input id="new-category-name" required value={name} onChange={(e) => setName(e.target.value)} /></div>
        {name && <p className="muted mono" style={{ fontSize: '0.78rem' }}>slug : {slugify(name)}</p>}
        <button className="btn btn-action">Créer</button>
      </form>
    </div>
  );
}
