import { useState } from 'react';
import { supportApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { errorMessage } from '../api/client';
import { useSeo } from '../lib/seo';

export default function Contact() {
  useSeo('Contact & support', 'Une question sur un composant, une commande ou la compatibilité ? Écris-nous, on te répond.');
  const { email: userEmail } = useAuth();
  const [email, setEmail] = useState(userEmail ?? '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const { notify } = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await supportApi.send(email, subject, message);
      setSent(true);
      notify('Message envoyé !', 'success');
    } catch (err) { notify(errorMessage(err), 'error'); }
  }

  return (
    <div className="container" style={{ maxWidth: 560 }}>
      <h1>📨 Service client</h1>
      <p className="muted">Une question sur un composant, une commande, une compatibilité ? Écris-nous.</p>
      {sent ? (
        <div className="surface center" style={{ padding: '2rem' }}>
          <div style={{ fontSize: '2.5rem' }}>✅</div>
          <p>Merci ! Notre équipe te répondra rapidement.</p>
          <button className="btn btn-ghost btn-sm" onClick={() => { setSent(false); setSubject(''); setMessage(''); }}>
            Envoyer un autre message
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="surface stack" style={{ padding: '1.5rem' }}>
          <div><label>Email</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><label>Sujet</label><input required value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
          <div><label>Message</label><textarea rows={5} required value={message} onChange={(e) => setMessage(e.target.value)} /></div>
          <button className="btn btn-action">Envoyer</button>
        </form>
      )}
    </div>
  );
}
