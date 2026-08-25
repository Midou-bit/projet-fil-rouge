import { useQueryClient } from '@tanstack/react-query';
import { supportApi } from '../../api/endpoints';
import { useSupportMessages } from '../../api/queries';
import { date } from '../../lib/format';
import { useToast } from '../../components/Toast';
import { errorMessage } from '../../api/client';

export default function AdminSupport() {
  const qc = useQueryClient();
  const { data: msgs = [], isLoading } = useSupportMessages();
  const { notify } = useToast();

  async function answer(id: number) {
    try {
      await supportApi.markAnswered(id);
      notify('Marqué comme répondu.', 'success');
      qc.invalidateQueries({ queryKey: ['support'] });
    } catch (e) { notify(errorMessage(e), 'error'); }
  }

  return (
    <div className="stack">
      {isLoading ? (
        <div className="center" style={{ padding: '2rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : msgs.length === 0 && <p className="muted">Aucun message.</p>}
      {msgs.map((m) => (
        <div key={m.id} className="surface" style={{ padding: '1rem' }}>
          <div className="row between wrap">
            <strong>{m.subject}</strong>
            <span className={`badge ${m.status === 'Open' ? 'badge-warning' : 'badge-success'}`}>
              {m.status === 'Open' ? 'À traiter' : 'Répondu'}
            </span>
          </div>
          <div className="muted mono" style={{ fontSize: '0.78rem' }}>{m.email} · {date(m.createdAt)}</div>
          <p style={{ margin: '0.6rem 0' }}>{m.message}</p>
          {m.status === 'Open' && <button className="btn btn-sm btn-cyan" onClick={() => answer(m.id)}>Marquer comme répondu</button>}
        </div>
      ))}
    </div>
  );
}
