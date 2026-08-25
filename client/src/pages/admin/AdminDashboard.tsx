import { motion } from 'framer-motion';
import { euro } from '../../lib/format';
import { useAdminStats } from '../../api/queries';

function Stat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <motion.div className="surface" style={{ padding: '1.2rem' }}
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ fontSize: '1.6rem' }}>{icon}</div>
      <div className="price" style={{ fontSize: '1.8rem', margin: '0.3rem 0' }}>{value}</div>
      <div className="muted" style={{ fontSize: '0.85rem' }}>{label}</div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading, isError } = useAdminStats();

  if (isError) {
    return (
      <div className="center" style={{ padding: '2rem' }}>
        <p className="muted">Impossible de charger les statistiques. Réessaie dans un instant.</p>
      </div>
    );
  }
  if (isLoading || !stats) return <div className="center" style={{ padding: '2rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>;

  return (
    <div className="stack">
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        <Stat icon="💰" label="Chiffre d'affaires" value={euro(stats.revenue)} />
        <Stat icon="📦" label="Commandes" value={String(stats.totalOrders)} />
        <Stat icon="🧩" label="Produits" value={String(stats.totalProducts)} />
        <Stat icon="👤" label="Utilisateurs" value={String(stats.totalUsers)} />
        <Stat icon="📨" label="Support en attente" value={String(stats.pendingSupport)} />
      </div>

      <div className="surface" style={{ padding: '1.2rem' }}>
        <h3 style={{ marginTop: 0 }}>Top produits vendus</h3>
        {stats.topProducts.length === 0 ? (
          <p className="muted">Aucune vente enregistrée pour l’instant.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr className="muted" style={{ textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                <th style={{ padding: '0.4rem 0' }}>Produit</th><th>Qté</th><th style={{ textAlign: 'right' }}>CA</th>
              </tr>
            </thead>
            <tbody>
              {stats.topProducts.map((t) => (
                <tr key={t.name} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.5rem 0' }}>{t.name}</td>
                  <td>{t.quantitySold}</td>
                  <td className="price" style={{ textAlign: 'right' }}>{euro(t.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
