import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { error: Error | null }

/** Filet de sécurité : sans ça, une erreur de rendu dans une page blanchit toute l'app. */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erreur non interceptée dans l’app :', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="container center" style={{ padding: '4rem' }}>
          <h1>Une erreur est survenue</h1>
          <p className="muted">L'application a rencontré un problème inattendu.</p>
          <button className="btn btn-cyan" onClick={() => { this.setState({ error: null }); window.location.href = '/'; }}>
            Retour à l'accueil
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
