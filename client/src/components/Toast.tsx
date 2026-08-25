import { AnimatePresence, motion } from 'framer-motion';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type ToastTone = 'success' | 'error' | 'info';
interface Toast { id: number; message: string; tone: ToastTone; }

interface ToastContextValue {
  notify: (message: string, tone?: ToastTone) => void;
}
const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      {/* Région live : sans elle, un lecteur d'écran n'annonce jamais ces messages, qui
          apparaissent hors du flux de lecture puis disparaissent au bout de 3 secondes. */}
      <div aria-live="polite" aria-atomic="false"
        style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000, display: 'grid', gap: 10 }}>
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              role={t.tone === 'error' ? 'alert' : 'status'}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className="surface"
              style={{
                padding: '0.7rem 1rem',
                borderLeft: `3px solid var(--${t.tone === 'success' ? 'success' : t.tone === 'error' ? 'danger' : 'accent-cyan'})`,
                maxWidth: 340,
                fontSize: '0.9rem',
              }}
            >
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
