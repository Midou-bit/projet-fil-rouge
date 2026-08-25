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
  // Erreur conservée dans le formulaire : l'utilisateur vient d'écrire un message long,
  // il doit pouvoir lire ce qui a échoué sans que ça disparaisse au bout de 3 secondes.
  const [error, setError] = useState<string | null>(null);
  const { notify } = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await supportApi.send(email, subject, message);
      setSent(true);
      notify('Message envoyé !', 'success');
    } catch (err) { setError(errorMessage(err, "L'envoi a échoué. Réessaie dans un instant.")); }
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
          <div>
            <label htmlFor="contact-email">Email</label>
            <input id="contact-email" type="email" required value={email} aria-invalid={error ? true : undefined}
              onChange={(e) => { setEmail(e.target.value); setError(null); }} />
          </div>
          <div>
            <label htmlFor="contact-subject">Sujet</label>
            <input id="contact-subject" required value={subject}
              onChange={(e) => { setSubject(e.target.value); setError(null); }} />
          </div>
          <div>
            <label htmlFor="contact-message">Message</label>
            <textarea id="contact-message" rows={5} required value={message}
              aria-describedby={error ? 'contact-error' : undefined}
              onChange={(e) => { setMessage(e.target.value); setError(null); }} />
          </div>
          {error && <p id="contact-error" role="alert" className="form-error">{error}</p>}
          <button className="btn btn-action">Envoyer</button>
        </form>
      )}
    </div>
  );
}
