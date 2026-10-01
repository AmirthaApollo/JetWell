import { useMemo, useState } from 'react';
import { useRouter } from '../router';
import { useStore } from '../store/store';
import { CitySearch } from '../components/CitySearch';
import { Icon } from '../components/Icon';
import { useToast } from '../components/Toast';
import type { City } from '../data/cities';
import {
  formatDuration,
  getOffsetMinutes,
  getZonedParts,
  parseLocalInput,
  toLocalInput,
  zonedToInstant,
  addDaysToParts,
} from '../lib/time';
import type { CaffeineHabit, PrepLevel, StayLength } from '../engine/planEngine';
import { SAMPLE_CONFIGS, tripFromConfig, uid } from '../store/seed';
import type { Trip } from '../store/types';

const STEPS = 5;

function defaultDeparture(tz: string): string {
  const now = getZonedParts(new Date(), tz);
  const d = addDaysToParts(now.year, now.month, now.day, 3);
  return toLocalInput(zonedToInstant(d.year, d.month, d.day, 2, 0, tz), tz);
}

function addHoursToInput(value: string, tz: string, hours: number): string {
  const base = parseLocalInput(value, tz);
  if (!base) return value;
  return toLocalInput(new Date(base.getTime() + hours * 3600000), tz);
}

export function Planner() {
  const { navigate } = useRouter();
  const { addTrip, trips } = useStore();
  const { push } = useToast();

  const [step, setStep] = useState(1);
  const [origin, setOrigin] = useState<City | null>(null);
  const [dest, setDest] = useState<City | null>(null);
  const [depStr, setDepStr] = useState('');
  const [arrStr, setArrStr] = useState('');
  const [bedtime, setBedtime] = useState('23:00');
  const [wake, setWake] = useState('07:00');
  const [caffeine, setCaffeine] = useState<CaffeineHabit>('two_three');
  const [prep, setPrep] = useState<PrepLevel>('balanced');
  const [stay, setStay] = useState<StayLength>('medium');
  const [showOptional, setShowOptional] = useState(false);
  const [crewMode, setCrewMode] = useState(false);
  const [meetingStr, setMeetingStr] = useState('');
  const [via, setVia] = useState<City | null>(null);
  const [layoverHours, setLayoverHours] = useState(5);
  const [building, setBuilding] = useState(false);

  function pickOrigin(c: City) {
    if (!c.id) {
      setOrigin(null);
      return;
    }
    setOrigin(c);
    const dep = depStr || defaultDeparture(c.tz);
    setDepStr(dep);
    if (dest && !arrStr) setArrStr(addHoursToInput(dep, dest.tz, 10));
  }

  function pickDest(c: City) {
    if (!c.id) {
      setDest(null);
      return;
    }
    setDest(c);
    if (depStr && !arrStr) setArrStr(addHoursToInput(depStr, c.tz, 10));
  }

  const tzInfo = useMemo(() => {
    if (!origin || !dest || !depStr) return null;
    const depInstant = parseLocalInput(depStr, origin.tz);
    if (!depInstant) return null;
    const raw = getOffsetMinutes(depInstant, dest.tz) - getOffsetMinutes(depInstant, origin.tz);
    const abs = Math.abs(raw);
    const dir = raw > 0 ? 'ahead of' : 'behind';
    const near12 = abs >= 540;
    const word = raw > 0 ? 'Eastbound' : 'Westbound';
    const ease = raw > 0 ? 'usually harder to adjust to' : 'usually easier to adjust to';
    const note = near12
      ? `That is close to a half-day shift, so we use whichever direction is shorter and explain it.`
      : `${word}, which is ${ease}.`;
    return { raw, label: `${formatDuration(abs)} ${dir} your home time`, note };
  }, [origin, dest, depStr]);

  const canNext =
    (step === 1 && origin && dest && origin.id !== dest.id) ||
    (step === 2 && depStr && arrStr && tzInfo) ||
    step === 3 ||
    step === 4 ||
    step === 5;

  function loadSample(label: string) {
    const cfg = SAMPLE_CONFIGS.find((c) => c.label === label);
    if (!cfg) return;
    const trip = tripFromConfig(cfg);
    addTrip(trip);
    push({ title: `${label} loaded`, body: 'Your itinerary is ready.', icon: 'plane' });
    navigate('itinerary');
  }

  function build() {
    if (!origin || !dest) return;
    const departure = parseLocalInput(depStr, origin.tz);
    const arrival = parseLocalInput(arrStr, dest.tz);
    if (!departure || !arrival) return;
    setBuilding(true);
    const [bh, bm] = bedtime.split(':').map(Number);
    const [wh, wm] = wake.split(':').map(Number);

    let layover: Trip['layover'] = null;
    if (via && via.id) {
      const total = arrival.getTime() - departure.getTime();
      const start = new Date(departure.getTime() + total * 0.5);
      const end = new Date(Math.min(start.getTime() + layoverHours * 3600000, arrival.getTime() - 45 * 60000));
      layover = { city: via.city, code: via.code, tz: via.tz, startISO: start.toISOString(), endISO: end.toISOString() };
    }

    const trip: Trip = {
      id: uid(),
      originId: origin.id,
      destId: dest.id,
      originCity: origin.city,
      originCode: origin.code,
      originTz: origin.tz,
      destCity: dest.city,
      destCode: dest.code,
      destTz: dest.tz,
      departureISO: departure.toISOString(),
      arrivalISO: arrival.toISOString(),
      bedtime: bh * 60 + (bm || 0),
      wake: wh * 60 + (wm || 0),
      caffeine,
      prep,
      stay,
      crewMode,
      meetingAtISO: meetingStr ? parseLocalInput(meetingStr, dest.tz)?.toISOString() ?? null : null,
      layover,
      createdAt: Date.now(),
      label: via && via.id ? `${origin.city} → ${via.city} → ${dest.city}` : `${origin.city} → ${dest.city}`,
    };

    window.setTimeout(() => {
      addTrip(trip);
      push({ title: 'Itinerary ready', body: 'Land ready. Follow it loosely.', icon: 'check' });
      navigate('itinerary');
    }, 1250);
  }

  if (building) {
    return (
      <div className="loading-screen" role="status" aria-live="polite">
        <div className="word">Building your itinerary…</div>
        <div className="skel-stack" aria-hidden="true">
          <div className="skel" style={{ height: 120, borderRadius: 24 }} />
          <div className="skel" style={{ height: 64, borderRadius: 16 }} />
          <div className="skel" style={{ height: 64, borderRadius: 16 }} />
          <div className="skel" style={{ height: 64, borderRadius: 16 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="planner">
      <div className="progress" aria-label={`Step ${step} of ${STEPS}`}>
        <span className="count">
          {String(step).padStart(2, '0')} / {String(STEPS).padStart(2, '0')}
        </span>
        <div className="bar">
          <i style={{ width: `${(step / STEPS) * 100}%` }} />
        </div>
      </div>

      {step === 1 && (
        <div className="step" key="s1">
          <h2>Where are you flying?</h2>
          <p className="hint">Two cities is all we need to start. We handle the time zones.</p>
          <div className="field-grid">
            <CitySearch label="From" value={origin?.id ?? null} onPick={pickOrigin} autoFocus placeholder="e.g. Delhi" />
            <CitySearch label="To" value={dest?.id ?? null} onPick={pickDest} placeholder="e.g. London" />
          </div>
          <div className="example-strip">
            <span className="eyebrow" style={{ alignSelf: 'center', marginRight: 4 }}>
              Try one
            </span>
            {SAMPLE_CONFIGS.map((c) => (
              <button className="example-chip" key={c.label} onClick={() => loadSample(c.label)}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && origin && dest && (
        <div className="step" key="s2">
          <h2>When does your flight leave and land?</h2>
          <p className="hint">
            Enter times in each city's own local time — we do the conversion.
          </p>
          <div className="field-grid">
            <div className="field">
              <label htmlFor="dep">Departure · {origin.city}</label>
              <input
                id="dep"
                type="datetime-local"
                className="input mono"
                value={depStr}
                onChange={(e) => {
                  setDepStr(e.target.value);
                  if (dest) setArrStr(addHoursToInput(e.target.value, dest.tz, 10));
                }}
              />
            </div>
            <div className="field">
              <label htmlFor="arr">Arrival · {dest.city}</label>
              <input
                id="arr"
                type="datetime-local"
                className="input mono"
                value={arrStr}
                onChange={(e) => setArrStr(e.target.value)}
              />
            </div>
          </div>
          {tzInfo && (
            <div className="tz-callout">
              <Icon name="globe" size={20} />
              <div>
                <strong className="mono">{tzInfo.label}.</strong> {tzInfo.note}
              </div>
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="step" key="s3">
          <h2>How's your usual rhythm?</h2>
          <p className="hint">Rough is fine. We only need the shape of your normal day.</p>
          <div className="field-grid">
            <div className="field">
              <label htmlFor="bed">Usual bedtime</label>
              <input id="bed" type="time" className="input mono" value={bedtime} onChange={(e) => setBedtime(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="wake">Usual wake time</label>
              <input id="wake" type="time" className="input mono" value={wake} onChange={(e) => setWake(e.target.value)} />
            </div>
          </div>
          <div style={{ marginTop: 22 }}>
            <span className="eyebrow" style={{ display: 'block', marginBottom: 10 }}>
              Caffeine habit
            </span>
            <div className="option-list">
              {(
                [
                  ['none', 'None', 'No caffeine, or rarely.'],
                  ['one', '1 cup', 'One a day, usually morning.'],
                  ['two_three', '2–3 cups', 'A steady everyday habit.'],
                  ['lots', 'Lots', 'Caffeine is how you function.'],
                ] as [CaffeineHabit, string, string][]
              ).map(([v, t, s]) => (
                <button className={`option ${caffeine === v ? 'sel' : ''}`} key={v} onClick={() => setCaffeine(v)}>
                  <span className="o-mark">{caffeine === v && <Icon name="check" size={13} />}</span>
                  <span>
                    <span className="o-title">{t}</span>
                    <span className="o-sub" style={{ display: 'block' }}>{s}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="step" key="s4">
          <h2>How much do you want to adjust before you fly?</h2>
          <p className="hint">More prep means smaller, earlier changes. Less prep keeps things simple.</p>
          <div className="option-list">
            {(
              [
                ['minimal', 'Just get me through', 'Minimal prep. A few things on travel day.'],
                ['balanced', 'Balanced', 'A gentle start, 2 days out.'],
                ['full', 'Full prep', 'Start 3 days out and shift a little each night.'],
              ] as [PrepLevel, string, string][]
            ).map(([v, t, s]) => (
              <button className={`option ${prep === v ? 'sel' : ''}`} key={v} onClick={() => setPrep(v)}>
                <span className="o-mark">{prep === v && <Icon name="check" size={13} />}</span>
                <span>
                  <span className="o-title">{t}</span>
                  <span className="o-sub" style={{ display: 'block' }}>{s}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="step" key="s5">
          <h2>How long are you staying?</h2>
          <p className="hint">Short trips get a "stay on home time" plan — recovering back home is easier than shifting twice.</p>
          <div className="option-list">
            {(
              [
                ['short', 'Under 3 days', 'Stay on home time, partial shift.'],
                ['medium', '3–7 days', 'Partially shift toward destination time.'],
                ['long', '1 week +', 'Shift fully to destination time.'],
              ] as [StayLength, string, string][]
            ).map(([v, t, s]) => (
              <button className={`option ${stay === v ? 'sel' : ''}`} key={v} onClick={() => setStay(v)}>
                <span className="o-mark">{stay === v && <Icon name="check" size={13} />}</span>
                <span>
                  <span className="o-title">{t}</span>
                  <span className="o-sub" style={{ display: 'block' }}>{s}</span>
                </span>
              </button>
            ))}
          </div>

          <button
            className="btn-quiet"
            style={{ marginTop: 16, paddingLeft: 0 }}
            onClick={() => setShowOptional((v) => !v)}
            aria-expanded={showOptional}
          >
            <Icon name="chevron" size={16} /> Optional: crew mode, a meeting, or a connection
          </button>

          {showOptional && (
            <div className="fade-in" style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div className="pref-row" style={{ borderBottom: 'none', padding: 0 }}>
                <div>
                  <div className="pr-label">Crew / frequent traveller</div>
                  <div className="pr-sub">Keep one body clock instead of shifting every trip.</div>
                </div>
                <button
                  className={`switch ${crewMode ? 'on' : ''}`}
                  role="switch"
                  aria-checked={crewMode}
                  aria-label="Crew mode"
                  onClick={() => setCrewMode((v) => !v)}
                />
              </div>
              {dest && (
                <div className="field">
                  <label htmlFor="meeting">An important meeting or exam after landing (optional)</label>
                  <input
                    id="meeting"
                    type="datetime-local"
                    className="input mono"
                    value={meetingStr}
                    onChange={(e) => setMeetingStr(e.target.value)}
                  />
                  <div className="tiny muted" style={{ marginTop: 6 }}>
                    Entered in {dest.city} local time.
                  </div>
                </div>
              )}
              {dest && (
                <div className="field-grid">
                  <CitySearch
                    label="Connection through (optional)"
                    value={via?.id ?? null}
                    onPick={(c) => setVia(c.id ? c : null)}
                    placeholder="e.g. Dubai"
                  />
                  {via && via.id && (
                    <div className="field">
                      <label htmlFor="lay">Layover length (hours)</label>
                      <input
                        id="lay"
                        type="number"
                        min={1}
                        max={24}
                        className="input mono"
                        value={layoverHours}
                        onChange={(e) => setLayoverHours(Math.max(1, Math.min(24, Number(e.target.value) || 1)))}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="planner-foot">
        {step > 1 ? (
          <button className="btn btn-ghost" onClick={() => setStep((s) => s - 1)}>
            Back
          </button>
        ) : (
          <button className="btn-quiet" onClick={() => navigate(trips.length ? 'itinerary' : 'landing')}>
            Cancel
          </button>
        )}
        {step < STEPS ? (
          <button className="btn btn-primary" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
            Continue <Icon name="arrow" size={17} />
          </button>
        ) : (
          <button className="btn btn-accent" onClick={build}>
            Build my plan <Icon name="spark" size={17} />
          </button>
        )}
      </div>
    </div>
  );
}
