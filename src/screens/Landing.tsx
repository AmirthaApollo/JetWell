import { useMemo, useState } from 'react';
import { useRouter } from '../router';
import { useStore } from '../store/store';
import { CitySearch } from '../components/CitySearch';
import { Icon } from '../components/Icon';
import { LogoMark } from '../components/LogoMark';
import { estimateFlightMinutes, findCity, type City } from '../data/cities';
import { formatDuration, getOffsetMinutes, parseLocalInput } from '../lib/time';

function isoDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function wrapShift(minutes: number): number {
  if (minutes > 720) return minutes - 1440;
  if (minutes < -720) return minutes + 1440;
  return minutes;
}

export function Landing() {
  const { navigate } = useRouter();
  const { addCustomCity, customCities, setDraft } = useStore();

  const [from, setFrom] = useState<City | null>(() => findCity('del') ?? null);
  const [to, setTo] = useState<City | null>(() => findCity('lhr') ?? null);
  const [date, setDate] = useState(() => isoDate(new Date(Date.now() + 3 * 86400000)));

  const info = useMemo(() => {
    if (!from || !to) return null;
    const dep = parseLocalInput(`${date}T12:00`, from.tz) ?? new Date();
    const shift = wrapShift(getOffsetMinutes(dep, to.tz) - getOffsetMinutes(dep, from.tz));
    const abs = Math.abs(shift);
    const sign = shift > 0 ? '+' : shift < 0 ? '−' : '';
    const flight = estimateFlightMinutes(from, to) ?? 530;
    return { abs, sign, flight };
  }, [from, to, date]);

  function pick(setter: (c: City | null) => void) {
    return (c: City | null) => {
      if (c?.custom) addCustomCity(c);
      setter(c);
    };
  }

  function create() {
    if (!from || !to) return;
    setDraft({ origin: from, dest: to, depStr: `${date}T02:00` });
    navigate('plan');
  }

  return (
    <div className="landing">
      <nav className="jw-nav" aria-label="JetWell">
        <span className="jw-brand">
          <LogoMark size={24} />
          JetWell
        </span>
        <div className="jw-nav-spacer" />
        <button className="jw-btn jw-btn-primary" onClick={() => navigate('plan')}>
          Get Started <Icon name="arrow" size={16} />
        </button>
      </nav>

      <section className="jw-hero">
        <div className="jw-hero-copy">
          <h1>
            Beat jet lag.
            <br />
            Feel like yourself again.
          </h1>
          <p className="jw-lede">
            Enter your flight, see how your body clock will shift, and get a personalised recovery plan.
          </p>
          <div className="jw-hero-cta">
            <button className="jw-btn jw-btn-primary" onClick={() => navigate('plan')}>
              Plan my recovery <Icon name="arrow" size={17} />
            </button>
          </div>
        </div>

        <div className="jw-hero-visual">
          <div className="jw-ticket">
            <div className="jw-ticket-top">
              <span className="jw-ticket-brand">JETWELL</span>
              <span className="jw-ticket-label">Your recovery journey</span>
            </div>

            <div className="jw-route">
              <div className="jw-end">
                <div className="jw-code">{from?.code ?? '—'}</div>
                <div className="jw-city">{from?.city ?? 'From'}</div>
              </div>
              <div className="jw-flightpath">
                <svg className="jw-path-svg" viewBox="0 0 160 44" aria-hidden="true">
                  <path
                    d="M6 34 C 48 8, 112 8, 154 34"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="0.5 8"
                    strokeLinecap="round"
                  />
                  <circle cx="6" cy="34" r="3.4" fill="currentColor" />
                  <circle cx="154" cy="34" r="3.4" fill="currentColor" />
                </svg>
                <div className="jw-flight-meta">
                  {info ? `${formatDuration(info.flight)} · ${info.sign}${formatDuration(info.abs)}` : 'Add your flight'}
                </div>
              </div>
              <div className="jw-end right">
                <div className="jw-code">{to?.code ?? '—'}</div>
                <div className="jw-city">{to?.city ?? 'To'}</div>
              </div>
            </div>

            <div className="jw-form">
              <CitySearch
                label="Flying from"
                value={from}
                onPick={pick(setFrom)}
                cities={customCities}
                placeholder="Search any city"
              />
              <CitySearch
                label="Flying to"
                value={to}
                onPick={pick(setTo)}
                cities={customCities}
                placeholder="Search any city"
              />
              <div className="jw-field jw-field-date">
                <label htmlFor="jw-date">Departure date</label>
                <input
                  id="jw-date"
                  type="date"
                  className="input"
                  value={date}
                  onChange={(e) => setDate(e.target.value || date)}
                />
              </div>
              <button className="jw-btn jw-btn-primary jw-create" onClick={create}>
                Create plan
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
