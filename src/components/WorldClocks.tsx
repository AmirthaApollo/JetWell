import { useNow } from './hooks';
import { Icon } from './Icon';
import { formatClock, formatDate, getZonedParts } from '../lib/time';

export interface ClockZone {
  code: string;
  city: string;
  tz: string;
  highlight?: boolean;
}

export function WorldClocks({ clocks, hour12 }: { clocks: ClockZone[]; hour12: boolean }) {
  const now = useNow(1000);

  return (
    <section className="worldclocks card" aria-label="World clocks for your destinations">
      <div className="wc-head">
        <span className="eyebrow">World clocks</span>
        <span className="tiny muted">Live at each stop</span>
      </div>
      <div className="wc-row">
        {clocks.map((c) => {
          const at = new Date(now);
          const { hour } = getZonedParts(at, c.tz);
          const day = hour >= 6 && hour < 18;
          return (
            <div className={`wc ${c.highlight ? 'is-dest' : ''}`} key={c.tz + c.code}>
              <div className="wc-top">
                <span className="wc-code mono">{c.code}</span>
                <span className={`wc-phase ${day ? 'day' : 'night'}`} aria-label={day ? 'Daytime' : 'Night'}>
                  <Icon name={day ? 'light' : 'sleep'} size={13} />
                </span>
              </div>
              <div className="wc-time mono" aria-live="off">
                {formatClock(at, c.tz, hour12)}
              </div>
              <div className="wc-city">{c.city}</div>
              <div className="wc-date tiny muted">{formatDate(at, c.tz)}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
