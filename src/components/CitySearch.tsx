import { useEffect, useId, useRef, useState } from 'react';
import { searchCities, makeCustomCity, timezoneCityLabel, type City } from '../data/cities';
import { searchTimezones } from '../data/timezones';
import { offsetLabel } from '../lib/time';
import { Icon } from './Icon';

export function CitySearch({
  label,
  value,
  onPick,
  cities = [],
  placeholder = 'Search a city',
  autoFocus,
}: {
  label: string;
  value: City | null;
  onPick: (c: City | null) => void;
  /** Extra (user-added) cities to search alongside the built-in list. */
  cities?: City[];
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [customName, setCustomName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const picked = value && value.id ? value : null;

  const cityResults = query && customName === null ? searchCities(query, cities) : [];
  const tzResults = customName !== null ? searchTimezones(query) : [];
  const canAddCustom = customName === null && query.trim().length >= 2;
  const addOffset = canAddCustom ? 1 : 0;
  const rowCount = customName === null ? cityResults.length + addOffset : tzResults.length;

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    setActive(0);
  }, [query, customName]);

  function closeAll() {
    setQuery('');
    setCustomName(null);
    setOpen(false);
  }

  function choose(c: City) {
    onPick(c);
    closeAll();
  }

  function chooseActive() {
    if (customName !== null) {
      const tz = tzResults[active];
      if (tz) choose(makeCustomCity(customName, tz));
      return;
    }
    if (canAddCustom && active === 0) {
      startCustom();
      return;
    }
    const idx = active - addOffset;
    if (idx >= 0 && idx < cityResults.length) choose(cityResults[idx]);
  }

  function startCustom() {
    const name = query.trim();
    if (name.length < 2) return;
    setCustomName(name);
    setQuery('');
    setActive(0);
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, Math.max(0, rowCount - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      if (rowCount === 0) return;
      e.preventDefault();
      chooseActive();
    } else if (e.key === 'Escape') {
      if (customName !== null) {
        setCustomName(null);
        setQuery(customName);
      } else {
        setOpen(false);
      }
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
            <div className="tiny muted">
              {picked.custom ? `${picked.country} · ${picked.tz}` : picked.country}
            </div>
          </div>
          <button
            className="x"
            onClick={() => {
              onPick(null);
              setQuery('');
              setCustomName(null);
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
            placeholder={customName !== null ? 'Search country, city or time zone' : placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActive(0);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
          />
          {open && (customName !== null || cityResults.length > 0 || canAddCustom) && (
            <ul className="results" id={listId} role="listbox">
              {customName !== null && (
                <li className="results-head">
                  <button
                    className="btn-quiet"
                    type="button"
                    onClick={() => {
                      setCustomName(null);
                      setQuery(customName);
                      inputRef.current?.focus();
                    }}
                  >
                    <Icon name="chevron" size={15} style={{ transform: 'rotate(90deg)' }} /> Back
                  </button>
                  <span className="tiny muted">
                    Time zone for <strong>{customName}</strong>
                  </span>
                </li>
              )}

              {canAddCustom && (
                <li role="option" aria-selected={active === 0}>
                  <button
                    className={`result ${active === 0 ? 'active' : ''}`}
                    onMouseEnter={() => setActive(0)}
                    onClick={startCustom}
                  >
                    <span className="code mono">
                      <Icon name="plus" size={14} />
                    </span>
                    <span>
                      <span style={{ fontWeight: 600 }}>Add “{query.trim()}”</span>
                      <span className="muted small" style={{ marginLeft: 8 }}>
                        anywhere in the world
                      </span>
                    </span>
                  </button>
                </li>
              )}

              {customName === null &&
                cityResults.map((c, i) => (
                  <li key={c.id} role="option" aria-selected={i + addOffset === active}>
                    <button
                      className={`result ${i + addOffset === active ? 'active' : ''}`}
                      onMouseEnter={() => setActive(i + addOffset)}
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

              {customName !== null &&
                tzResults.map((tz, i) => (
                  <li key={tz} role="option" aria-selected={i === active}>
                    <button
                      className={`result ${i === active ? 'active' : ''}`}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => choose(makeCustomCity(customName, tz))}
                    >
                      <span className="code mono">{timezoneCityLabel(tz).slice(0, 3).toUpperCase()}</span>
                      <span>
                        <span style={{ fontWeight: 600 }}>{timezoneCityLabel(tz)}</span>
                        <span className="muted small" style={{ marginLeft: 8 }}>
                          {tz} · {offsetLabel(new Date(), tz)}
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
