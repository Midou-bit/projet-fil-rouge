import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { euro, date } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { qk, useMyOrders } from '../api/queries';
import { accountApi, ordersApi } from '../api/endpoints';
import { errorMessage } from '../api/client';
import { useToast } from '../components/Toast';
import { useSeo } from '../lib/seo';

const STATUS_TONE: Record<string, string> = { Pending: 'warning', Paid: 'success', Shipped: 'cyan', Cancelled: 'danger' };
const STATUS_LABEL: Record<string, string> = { Pending: 'En attente', Paid: 'Payée', Shipped: 'Expédiée', Cancelled: 'Annulée' };

export default function Orders() {
  useSeo('Mes commandes', 'Historique de tes commandes FrameForge et gestion de ton compte.');
  const { data: orders = [], isLoading: loading } = useMyOrders();
  const { email, logout } = useAuth();
  const { notify } = useToast();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);

  async function cancel(id: number) {
    try {
      await ordersApi.cancel(id);
      qc.invalidateQueries({ queryKey: qk.myOrders });
      notify('Commande annulée.', 'success');
    } catch (e) { notify(errorMessage(e), 'error'); }
  }

  async function downloadData() {
    setExporting(true);
    try {
      const exported = await accountApi.exportData();
      const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `frameforge-donnees-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      notify('Tes données ont été exportées.', 'success');
    } catch (e) {
      notify(errorMessage(e, "L'export de tes données a échoué."), 'error');
    } finally {
      setExporting(false);
    }
  }

  // Effacement des données FrameForge reliées par l'identifiant du compte.
  async function deleteAccount() {
    if (!confirm('Supprimer définitivement ton compte et les données FrameForge qui lui sont liées (commandes, avis, panier, messages connectés) ? Cette action est irréversible.')) return;
    try {
      await accountApi.remove();
      logout();
      notify('Ton compte et ses données FrameForge liées ont été supprimés.', 'success');
      navigate('/');
    } catch (e) { notify(errorMessage(e), 'error'); }
  }

  return (
    <div className="container">
      <h1>Mes commandes</h1>
      <p className="muted" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{email}</p>
      {loading ? (
        <div className="center" role="status" aria-live="polite" style={{ padding: '2rem' }}>
          <div className="spinner" aria-hidden="true" style={{ margin: '0 auto' }} />
          <span className="sr-only">Chargement de tes commandes…</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="surface center" style={{ padding: '2.5rem' }}>
          <p className="muted">Aucune commande pour l’instant.</p>
          <Link to="/boutique" className="btn btn-cyan">Faire un achat</Link>
        </div>
      ) : (
        <div className="stack">
          {orders.map((o) => (
            <div key={o.id} className="surface" style={{ padding: '1rem' }}>
              <div className="row between wrap">
                <strong>Commande #{o.id}</strong>
                <span className={`badge badge-${STATUS_TONE[o.status] ?? 'cyan'}`}>{STATUS_LABEL[o.status] ?? o.status}</span>
              </div>
              <div className="muted" style={{ fontSize: '0.8rem' }}>{date(o.createdAt)}</div>
              <ul style={{ margin: '0.6rem 0', paddingLeft: '1.1rem', fontSize: '0.9rem' }}>
                {o.items.map((i) => (
                  <li key={i.productId}>{i.quantity} × {i.productName} <span className="muted">({euro(i.unitPrice)})</span></li>
                ))}
              </ul>
              <div className="row between"><span className="muted">Total</span><span className="price">{euro(o.totalPrice)}</span></div>
              {o.status === 'Pending' && (
                <div className="row" style={{ justifyContent: 'flex-end', marginTop: '0.6rem' }}>
                  <button className="btn btn-sm btn-danger" onClick={() => cancel(o.id)}>Annuler la commande</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Zone de contrôle des données : export propriétaire et effacement. */}
      <div className="surface" style={{ padding: '1.2rem', marginTop: '2rem', borderColor: 'rgba(255,42,109,0.4)' }}>
        <h3 style={{ marginTop: 0 }}>Confidentialité & données (RGPD)</h3>
        <p className="muted" style={{ fontSize: '0.9rem' }}>
          Télécharge une copie JSON des données liées à ton compte ou demande leur suppression.
          Les limites sont détaillées dans notre <Link to="/confidentialite">politique de confidentialité</Link>.
        </p>
        <div className="row wrap">
          <button className="btn btn-sm btn-cyan" onClick={downloadData} disabled={exporting}
            aria-busy={exporting || undefined}>
            {exporting ? 'Préparation…' : 'Télécharger mes données'}
          </button>
          <button className="btn btn-sm btn-danger" onClick={deleteAccount}>Supprimer mon compte et ses données liées</button>
        </div>
      </div>
    </div>
  );
}
