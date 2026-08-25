import { Link } from 'react-router-dom';
import { useSeo } from '../lib/seo';

export default function NotFound() {
  useSeo('Page introuvable', 'Cette page n’existe pas ou plus. Retourne à la boutique FrameForge.');
  return (
    <div className="container center" style={{ padding: '4rem' }}>
      <h1 className="glitch" style={{ fontSize: '4rem' }}>404</h1>
      <p className="muted">Cette page n’existe pas (ou a été désassemblée).</p>
      <Link to="/" className="btn btn-cyan">Retour à l’accueil</Link>
    </div>
  );
}
