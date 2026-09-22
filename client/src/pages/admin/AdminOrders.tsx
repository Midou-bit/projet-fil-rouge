import { useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../../api/endpoints';
import { useAllOrders } from '../../api/queries';
import { euro, date } from '../../lib/format';
import { useToast } from '../../components/Toast';
import { errorMessage } from '../../api/client';

const STATUSES = ['Pending', 'Paid', 'Shipped', 'Cancelled'];
const TONE: Record<string, string> = { Pending: 'warning', Paid: 'success', Shipped: 'cyan', Cancelled: 'danger' };

export default function AdminOrders() {
  const qc = useQueryClient();
  const { data: orders = [], isLoading } = useAllOrders();
  const { notify } = useToast();

  async function setStatus(id: number, status: string) {
    try {
      await ordersApi.setStatus(id, status);
      notify('Statut mis à jour.', 'success');
      qc.invalidateQueries({ queryKey: ['orders'] });
    } catch (e) { notify(errorMessage(e), 'error'); }
  }

  return (
    <div className="stack">
      {isLoading ? (
        <div className="center" role="status" aria-live="polite" style={{ padding: '2rem' }}>
          <div className="spinner" aria-hidden="true" style={{ margin: '0 auto' }} />
          <span className="sr-only">Chargement des commandes…</span>
        </div>
      ) : orders.length === 0 && <p className="muted">Aucune commande.</p>}
      {orders.map((o) => (
        <div key={o.id} className="surface" style={{ padding: '1rem' }}>
          <div className="row between wrap">
            <div>
              <strong>Commande #{o.id}</strong>
              <span className="muted" style={{ marginLeft: '0.6rem', fontSize: '0.85rem' }}>{o.customerEmail}</span>
            </div>
            <div className="row" style={{ gap: '0.5rem' }}>
              <span className={`badge badge-${TONE[o.status] ?? 'cyan'}`}>{o.status}</span>
              <select aria-label={`Statut de la commande ${o.id}`} value={o.status}
                onChange={(e) => setStatus(o.id, e.target.value)} style={{ width: 130 }}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="muted" style={{ fontSize: '0.78rem' }}>{date(o.createdAt)}</div>
          <ul style={{ margin: '0.5rem 0', paddingLeft: '1.1rem', fontSize: '0.88rem' }}>
            {o.items.map((i) => <li key={i.productId}>{i.quantity} × {i.productName} <span className="muted">({euro(i.unitPrice)})</span></li>)}
          </ul>
          <div className="row between"><span className="muted">Total</span><span className="price">{euro(o.totalPrice)}</span></div>
        </div>
      ))}
    </div>
  );
}
