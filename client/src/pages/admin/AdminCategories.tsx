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
              <th style={{ padding: '0.6rem' }}>Nom</th><th>Slug</th><th>Produits</th><th></th>
            </tr>
          </thead>
          <tbody>
            {cats.map((c) => (
              <tr key={c.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '0.5rem 0.6rem' }}>
                  {editId === c.id
                    ? <input value={editName} onChange={(e) => setEditName(e.target.value)} />
                    : c.name}
                </td>
                <td className="mono muted">{c.slug}</td>
                <td>{c.productCount}</td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {editId === c.id ? (
                    <>
                      <button className="btn btn-sm btn-cyan" onClick={() => saveEdit(c.id)}>OK</button>
                      <button className="btn btn-sm btn-ghost" onClick={() => setEditId(null)}>✕</button>
                    </>
                  ) : (
                    <>
                      <button className="btn btn-sm btn-ghost" onClick={() => { setEditId(c.id); setEditName(c.name); }}>✏️</button>
                      <button className="btn btn-sm btn-danger" onClick={() => remove(c)}>🗑️</button>
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
        <div><label>Nom</label><input required value={name} onChange={(e) => setName(e.target.value)} /></div>
        {name && <p className="muted mono" style={{ fontSize: '0.78rem' }}>slug : {slugify(name)}</p>}
        <button className="btn btn-action">Créer</button>
      </form>
    </div>
  );
}
