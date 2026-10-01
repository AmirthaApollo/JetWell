import { useEffect, useId, useRef, useState } from 'react';
import { searchCities, findCity, type City } from '../data/cities';
import { Icon } from './Icon';

export function CitySearch({
  label,
  value,
  onPick,
  placeholder = 'Search a city',
  autoFocus,
}: {
  label: string;
  value: string | null;
  onPick: (c: City) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const picked = value ? findCity(value) : null;
  const results = query ? searchCities(query) : [];

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  function choose(c: City) {
    onPick(c);
    setQuery('');
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(results[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="citysearch">
      <label className="eyebrow" htmlFor={listId + '-input'} style={{ display: 'block', marginBottom: 7 }}>
        {label}
      </label>
      {picked ? (
        <div className="picked">
          <span className="code mono" style={{ color: 'var(--accent-ink)' }}>{picked.code}</span>
          <div>
            <div style={{ fontWeight: 600 }}>{picked.city}</div>
            <div className="tiny muted">{picked.country}</div>
          </div>
          <button
            className="x"
            onClick={() => {
              onPick({ ...picked, id: '' });
              setQuery('');
              setOpen(true);
              inputRef.current?.focus();
            }}
            aria-label={`Change ${label}`}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      ) : (
        <>
          <input
            id={listId + '-input'}
            ref={inputRef}
            className="input"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            autoComplete="off"
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActive(0);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
          />
          {open && results.length > 0 && (
            <ul className="results" id={listId} role="listbox">
              {results.map((c, i) => (
                <li key={c.id} role="option" aria-selected={i === active}>
                  <button
                    className={`result ${i === active ? 'active' : ''}`}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(c)}
                  >
                    <span className="code mono">{c.code}</span>
                    <span>
                      <span style={{ fontWeight: 600 }}>{c.city}</span>
                      <span className="muted small" style={{ marginLeft: 8 }}>
                        {c.country}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
