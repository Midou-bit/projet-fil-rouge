import { useEffect, useRef, useState } from 'react';
import type { Product } from '../api/types';
import { euro } from '../lib/format';
import MediaImage from './MediaImage';
import PerfBadge from './PerfBadge';

interface Props {
  icon: string;
  label: string;
  options: Product[];
  value?: number;
  onChange: (id: number) => void;
}

function Thumb({ p, size }: { p: Product; size: number }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0, background: 'var(--bg)', borderRadius: 6, overflow: 'hidden' }}>
      <MediaImage src={p.imageUrl} alt={p.name} categorySlug={p.categorySlug} fit="contain" />
    </div>
  );
}

/** Sélecteur de composant avec MINIATURES (remplace le <select> texte-seul du builder). */
export default function BuilderSlot({ icon, label, options, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.id === value);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = `slot-listbox-${label.replace(/\s+/g, '-')}`;

  function pick(id: number) {
    onChange(id);
    setOpen(false);
  }

  // Ferme au clic extérieur et à l'échappement (comportement standard d'un listbox custom).
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function onListKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="option"]'));
    const idx = items.findIndex((el) => el === document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); items[Math.min(idx + 1, items.length - 1)]?.focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); items[Math.max(idx - 1, 0)]?.focus(); }
  }

  return (
    <div className="surface" style={{ padding: '0.7rem' }} ref={rootRef}>
      <div className="row between" style={{ marginBottom: '0.5rem' }}>
        <span style={{ fontFamily: 'var(--font-title)', fontSize: '0.95rem' }}>{icon} {label}</span>
        {current && <span className="price">{euro(current.price)}</span>}
      </div>

      {/* Sélection courante (cliquable pour ouvrir la liste) */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        className="surface"
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem',
          padding: '0.5rem', background: 'var(--bg)', cursor: 'pointer', textAlign: 'left',
          borderColor: open ? 'var(--accent-cyan)' : 'var(--border)',
        }}
      >
        {current && <Thumb p={current} size={42} />}
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {current?.name ?? '—'}
          </span>
          {current && <span className="muted" style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>perf {current.perfScore}</span>}
        </span>
        <span className="muted" aria-hidden>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div id={listId} role="listbox" aria-label={label} onKeyDown={onListKeyDown}
          style={{ marginTop: '0.4rem', maxHeight: 240, overflowY: 'auto', display: 'grid', gap: '0.3rem' }}>
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              role="option"
              aria-selected={o.id === value}
              onClick={() => pick(o.id)}
              className="row"
              style={{
                gap: '0.6rem', padding: '0.4rem 0.5rem', borderRadius: 6, textAlign: 'left',
                background: o.id === value ? 'rgba(34,211,238,0.1)' : 'transparent',
                border: '1px solid transparent', cursor: 'pointer', width: '100%',
              }}
            >
              <Thumb p={o} size={36} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.88rem' }}>{o.name}</span>
                <span className="price" style={{ fontSize: '0.8rem' }}>{euro(o.price)}</span>
              </span>
              <PerfBadge score={o.perfScore} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
