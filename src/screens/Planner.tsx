import { useMemo, useState } from 'react';
import { useRouter } from '../router';
import { useStore } from '../store/store';
import { CitySearch } from '../components/CitySearch';
import { Icon } from '../components/Icon';
import { useToast } from '../components/Toast';
import { estimateFlightMinutes, findCity, type City } from '../data/cities';
import {
  formatDateTime,
  formatDuration,
  getOffsetMinutes,
  getZonedParts,
  parseLocalInput,
  toLocalInput,
  zonedToInstant,
  addDaysToParts,
  dayDiff,
} from '../lib/time';
import type { CaffeineHabit, PrepLevel, ScheduleType, StayLength } from '../engine/planEngine';
import { SAMPLE_CONFIGS, tripFromConfig, uid } from '../store/seed';
import type { Trip } from '../store/types';

const STEPS = 5;

function defaultDeparture(tz: string): string {
  const now = getZonedParts(new Date(), tz);
  const d = addDaysToParts(now.year, now.month, now.day, 3);
  return toLocalInput(zonedToInstant(d.year, d.month, d.day, 2, 0, tz), tz);
}

function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

const MINUTE_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function minToInput(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Rebuild a pickable place from a stored trip, including custom destinations. */
function cityFromTrip(trip: Trip, end: 'origin' | 'dest'): City {
  const id = end === 'origin' ? trip.originId : trip.destId;
  const builtin = findCity(id);
  if (builtin) return builtin;
  return {
    id,
    city: end === 'origin' ? trip.originCity : trip.destCity,
    code: end === 'origin' ? trip.originCode : trip.destCode,
    country: (end === 'origin' ? trip.originCountry : trip.destCountry) ?? '',
    tz: end === 'origin' ? trip.originTz : trip.destTz,
    custom: true,
  };
}

function connectionsFromTrip(trip: Trip): { city: City | null; hours: number }[] {
  const lows = trip.layovers ?? (trip.layover ? [trip.layover] : []);
  if (lows.length === 0) return [{ city: null, hours: 5 }];
  return lows.map((l) => ({
    city: {
      id: `layover:${l.code}:${l.tz}`,
      city: l.city,
      code: l.code,
      country: l.country ?? '',
      tz: l.tz,
      custom: true,
    },
    hours: Math.max(1, Math.round((new Date(l.endISO).getTime() - new Date(l.startISO).getTime()) / 3600000)),
  }));
}

export function Planner({ edit = false }: { edit?: boolean }) {
  const { navigate } = useRouter();
  const { activeTrip, updateTrip, addTrip, addScheduleItem, addCustomCity, customCities, trips, prefs, draft, clearDraft } =
    useStore();
  const { push } = useToast();

  const editing = edit && activeTrip ? activeTrip : null;
  const seed = useMemo(() => {
    if (editing) {
      return {
        origin: cityFromTrip(editing, 'origin'),
        dest: cityFromTrip(editing, 'dest'),
        depStr: toLocalInput(new Date(editing.departureISO), editing.originTz),
        durationMin: Math.max(
          30,
          Math.round((new Date(editing.arrivalISO).getTime() - new Date(editing.departureISO).getTime()) / 60000),
        ),
        bedtime: minToInput(editing.bedtime),
        wake: minToInput(editing.wake),
        caffeine: editing.caffeine,
        prep: editing.prep,
        stay: editing.stay,
        crewMode: Boolean(editing.crewMode),
        meetingStr: editing.meetingAtISO ? toLocalInput(new Date(editing.meetingAtISO), editing.destTz) : '',
        connections: connectionsFromTrip(editing),
      };
    }
    if (draft) {
      return {
        origin: draft.origin,
        dest: draft.dest,
        depStr: draft.depStr,
        durationMin: estimateFlightMinutes(draft.origin, draft.dest) ?? 10 * 60,
        bedtime: '23:00',
        wake: '07:00',
        caffeine: 'two_three' as CaffeineHabit,
        prep: 'balanced' as PrepLevel,
        stay: 'medium' as StayLength,
        crewMode: false,
        meetingStr: '',
        connections: [{ city: null, hours: 5 }] as { city: City | null; hours: number }[],
      };
    }
    return null;
  }, [editing, draft]);

  const [step, setStep] = useState(1);
  const [origin, setOrigin] = useState<City | null>(seed?.origin ?? null);
  const [dest, setDest] = useState<City | null>(seed?.dest ?? null);
  const [depStr, setDepStr] = useState(
    seed?.depStr ?? defaultDeparture(findCity(prefs.homeCityId, customCities)?.tz ?? 'UTC'),
  );
  const [durationMin, setDurationMin] = useState(seed?.durationMin ?? 10 * 60);
  const [durationTouched, setDurationTouched] = useState(Boolean(seed));
  const [bedtime, setBedtime] = useState(seed?.bedtime ?? '23:00');
  const [wake, setWake] = useState(seed?.wake ?? '07:00');
  const [caffeine, setCaffeine] = useState<CaffeineHabit>(seed?.caffeine ?? 'two_three');
  const [prep, setPrep] = useState<PrepLevel>(seed?.prep ?? 'balanced');
  const [stay, setStay] = useState<StayLength>(seed?.stay ?? 'medium');
  const [showOptional, setShowOptional] = useState(false);
  const [crewMode, setCrewMode] = useState(seed?.crewMode ?? false);
  const [meetingStr, setMeetingStr] = useState(seed?.meetingStr ?? '');
  const [connections, setConnections] = useState<{ city: City | null; hours: number }[]>(
    seed?.connections ?? [{ city: null, hours: 5 }],
  );
  const [commitments, setCommitments] = useState<
    { id: string; title: string; date: string; start: string; end: string; type: ScheduleType }[]
  >([]);
  const [building, setBuilding] = useState(false);

  const durH = Math.floor(durationMin / 60);
  const durM = durationMin % 60;

  function maybeEstimate(o: City | null, d: City | null) {
    if (durationTouched || !o || !d) return;
    const est = estimateFlightMinutes(o, d);
    if (est) setDurationMin(Math.round(est / 5) * 5);
  }

  function pickOrigin(c: City | null) {
    setOrigin(c);
    if (c) {
      if (!depStr) setDepStr(defaultDeparture(c.tz));
      if (c.custom) addCustomCity(c);
    }
    maybeEstimate(c, dest);
  }

  function pickDest(c: City | null) {
    setDest(c);
    if (c?.custom) addCustomCity(c);
    maybeEstimate(origin, c);
  }

  function updatePart(part: 'date' | 'time', value: string) {
    const [d = '', t = ''] = depStr.split('T');
    const nd = part === 'date' ? value : d;
    const nt = part === 'time' ? value : t || '00:00';
    if (!nd) return;
    setDepStr(`${nd}T${nt}`);
  }

  function setDuration(hours: number, minutes: number) {
    setDurationTouched(true);
    setDurationMin(Math.max(0, Math.min(30 * 60, hours * 60 + minutes)));
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

  const arrival = useMemo(() => {
    if (!origin || !dest || !depStr || durationMin <= 0) return null;
    const dep = parseLocalInput(depStr, origin.tz);
    if (!dep) return null;
    return new Date(dep.getTime() + durationMin * 60000);
  }, [origin, dest, depStr, durationMin]);

  const arrivalDateStr = arrival && dest ? toLocalInput(arrival, dest.tz).slice(0, 10) : '';

  const canNext =
    (step === 1 && origin && dest && origin.id !== dest.id && depStr && durationMin > 0 && arrival) ||
    step === 2 ||
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
    const arrivalInstant = arrival;
    if (!departure || !arrivalInstant || arrivalInstant.getTime() <= departure.getTime()) return;
    setBuilding(true);
    const [bh, bm] = bedtime.split(':').map(Number);
    const [wh, wm] = wake.split(':').map(Number);

    const total = arrivalInstant.getTime() - departure.getTime();
    const active = connections.filter((c) => c.city && c.city.id);
    const layovers: Trip['layovers'] = active.map((c, i) => {
      const cCity = c.city as City;
      const frac = (i + 1) / (active.length + 1);
      const start = new Date(departure.getTime() + total * frac);
      const end = new Date(Math.min(start.getTime() + c.hours * 3600000, arrivalInstant.getTime() - 45 * 60000));
      return {
        city: cCity.city,
        code: cCity.code,
        country: cCity.country,
        tz: cCity.tz,
        startISO: start.toISOString(),
        endISO: end.toISOString(),
      };
    });
    const label = [origin.city, ...active.map((c) => (c.city as City).city), dest.city].join(' → ');

    const trip: Trip = {
      id: editing?.id ?? uid(),
      originId: origin.id,
      destId: dest.id,
      originCity: origin.city,
      originCode: origin.code,
      originCountry: origin.country,
      originTz: origin.tz,
      destCity: dest.city,
      destCode: dest.code,
      destCountry: dest.country,
      destTz: dest.tz,
      departureISO: departure.toISOString(),
      arrivalISO: arrivalInstant.toISOString(),
      bedtime: bh * 60 + (bm || 0),
      wake: wh * 60 + (wm || 0),
      caffeine,
      prep,
      stay,
      crewMode,
      meetingAtISO: meetingStr ? parseLocalInput(meetingStr, dest.tz)?.toISOString() ?? null : null,
      layovers,
      createdAt: editing?.createdAt ?? Date.now(),
      isDemo: false,
      label,
    };

    if (editing) {
      updateTrip(trip);
      push({ title: 'Flight updated', body: 'Your recovery plan has been recalculated.', icon: 'plane' });
      navigate('itinerary');
      return;
    }

    window.setTimeout(() => {
      addTrip(trip);
      clearDraft();
      for (const c of commitments) {
        if (!c.title.trim() || !c.date) continue;
        const on = parseLocalInput(`${c.date}T00:00`, dest.tz);
        if (!on) continue;
        addScheduleItem({
          id: uid(),
          tripId: trip.id,
          day: Math.max(1, dayDiff(arrivalInstant, on, dest.tz) + 1),
          title: c.title.trim(),
          startMin: toMin(c.start),
          endMin: toMin(c.end),
          type: c.type,
        });
      }
      push({ title: 'Trip saved', body: 'Here are the time zones of your journey.', icon: 'globe' });
      navigate('journey');
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
          <h2>Add a flight</h2>
          <p className="hint">
            Pick both cities anywhere in the world, then set the departure and the flight time. We handle the time
            zones.
          </p>
          <div className="field-grid">
            <CitySearch
              label="From"
              value={origin}
              onPick={pickOrigin}
              cities={customCities}
              autoFocus
              placeholder="e.g. Delhi"
            />
            <CitySearch
              label="To"
              value={dest}
              onPick={pickDest}
              cities={customCities}
              placeholder="Any city or airport worldwide"
            />
          </div>

          <div style={{ marginTop: 24 }}>
              <div className="datetime-grid">
                <div className="field">
                  <label htmlFor="dep-date">Departure date{origin ? ` · ${origin.city}` : ''}</label>
                  <input
                    id="dep-date"
                    type="date"
                    className="input mono"
                    value={depStr.slice(0, 10)}
                    onChange={(e) => updatePart('date', e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="dep-time">Departure time</label>
                  <input
                    id="dep-time"
                    type="time"
                    className="input mono"
                    value={depStr.slice(11, 16)}
                    onChange={(e) => updatePart('time', e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="dur-h">Flight time · hours</label>
                  <input
                    id="dur-h"
                    type="number"
                    min={0}
                    max={30}
                    className="input mono"
                    value={durH}
                    onChange={(e) => setDuration(Number(e.target.value) || 0, durM)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="dur-m">Minutes</label>
                  <select
                    id="dur-m"
                    className="input mono"
                    value={durM}
                    onChange={(e) => setDuration(durH, Number(e.target.value))}
                  >
                    {MINUTE_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {String(m).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {arrival && dest && (
                <div className="tz-callout">
                  <Icon name="plane" size={20} />
                  <div>
                    You land in {dest.city} on <strong className="mono">{formatDateTime(arrival, dest.tz)}</strong>{' '}
                    local time · {formatDuration(durationMin)} in the air.
                    {!durationTouched && (
                      <span className="tiny muted"> Estimated from the distance — adjust above.</span>
                    )}
                  </div>
                </div>
              )}
              {tzInfo && (
                <div className="tz-callout">
                  <Icon name="globe" size={20} />
                  <div>
                    <strong className="mono">{tzInfo.label}.</strong> {tzInfo.note}
                  </div>
                </div>
              )}

              {origin && dest && (
                <div style={{ marginTop: 22 }}>
                <div className="between row" style={{ marginBottom: 10 }}>
                  <span className="eyebrow">Connections (optional)</span>
                  <button
                    className="btn-quiet"
                    onClick={() => setConnections((c) => [...c, { city: null, hours: 5 }])}
                    type="button"
                  >
                    <Icon name="plus" size={15} /> Add layover
                  </button>
                </div>
                {connections.map((conn, i) => (
                  <div className="connection-row" key={i}>
                    <CitySearch
                      label={`Connection ${i + 1}`}
                      value={conn.city}
                      cities={customCities}
                      onPick={(c) => {
                        if (c?.custom) addCustomCity(c);
                        setConnections((list) => list.map((x, j) => (j === i ? { ...x, city: c } : x)));
                      }}
                      placeholder="Any city or airport worldwide"
                    />
                    <div className="field conn-hours">
                      <label htmlFor={`lay-${i}`}>Hours</label>
                      <input
                        id={`lay-${i}`}
                        type="number"
                        min={1}
                        max={24}
                        className="input mono"
                        value={conn.hours}
                        onChange={(e) =>
                          setConnections((list) =>
                            list.map((x, j) =>
                              j === i ? { ...x, hours: Math.max(1, Math.min(24, Number(e.target.value) || 1)) } : x,
                            ),
                          )
                        }
                      />
                    </div>
                    {connections.length > 1 && (
                      <button
                        className="btn-quiet conn-remove"
                        onClick={() => setConnections((list) => list.filter((_, j) => j !== i))}
                        aria-label={`Remove connection ${i + 1}`}
                        type="button"
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    )}
                  </div>
                ))}
                </div>
              )}
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

      {step === 2 && (
        <div className="step" key="s2">
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
                  ['two_three', '2-3 cups', 'A steady everyday habit.'],
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

      {step === 3 && (
        <div className="step" key="s3">
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

      {step === 4 && (
        <div className="step" key="s4">
          <h2>How long are you staying?</h2>
          <p className="hint">Short trips stay on home time. Easier than shifting twice.</p>
          <div className="option-list">
            {(
              [
                ['short', 'Under 3 days', 'Stay on home time, partial shift.'],
                ['medium', '3-7 days', 'Partially shift toward destination time.'],
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
            <Icon name="chevron" size={16} /> Optional: crew mode or a key meeting
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
            </div>
          )}
        </div>
      )}

      {step === 5 && (
        <div className="step" key="s5">
          <h2>Anything you need to be awake for?</h2>
          <p className="hint">
            Optional. Add meetings, classes or events in {dest ? `${dest.city} local time` : 'destination time'}. We
            will flag the ones that clash with your body clock and plan around them.
          </p>

          {commitments.length === 0 && (
            <p className="small muted" style={{ marginBottom: 14 }}>
              Nothing added yet. You can skip this and add it later.
            </p>
          )}

          <div className="stack" style={{ gap: 12 }}>
            {commitments.map((c, i) => (
              <div className="commitment-row card" key={c.id}>
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor={`c-title-${i}`}>Title</label>
                  <input
                    id={`c-title-${i}`}
                    className="input"
                    value={c.title}
                    placeholder="e.g. Client kickoff"
                    onChange={(e) =>
                      setCommitments((list) => list.map((x) => (x.id === c.id ? { ...x, title: e.target.value } : x)))
                    }
                  />
                </div>
                <div className="field">
                  <label htmlFor={`c-date-${i}`}>Date</label>
                  <input
                    id={`c-date-${i}`}
                    type="date"
                    className="input mono"
                    value={c.date}
                    onChange={(e) =>
                      setCommitments((list) => list.map((x) => (x.id === c.id ? { ...x, date: e.target.value } : x)))
                    }
                  />
                </div>
                <div className="field">
                  <label htmlFor={`c-start-${i}`}>Start</label>
                  <input
                    id={`c-start-${i}`}
                    type="time"
                    className="input mono"
                    value={c.start}
                    onChange={(e) =>
                      setCommitments((list) => list.map((x) => (x.id === c.id ? { ...x, start: e.target.value } : x)))
                    }
                  />
                </div>
                <div className="field">
                  <label htmlFor={`c-end-${i}`}>End</label>
                  <input
                    id={`c-end-${i}`}
                    type="time"
                    className="input mono"
                    value={c.end}
                    onChange={(e) =>
                      setCommitments((list) => list.map((x) => (x.id === c.id ? { ...x, end: e.target.value } : x)))
                    }
                  />
                </div>
                <div className="field">
                  <label htmlFor={`c-type-${i}`}>Type</label>
                  <select
                    id={`c-type-${i}`}
                    className="input"
                    value={c.type}
                    onChange={(e) =>
                      setCommitments((list) =>
                        list.map((x) => (x.id === c.id ? { ...x, type: e.target.value as ScheduleType } : x)),
                      )
                    }
                  >
                    <option value="meeting">Meeting</option>
                    <option value="class">Class</option>
                    <option value="event">Event</option>
                    <option value="free">Free</option>
                  </select>
                </div>
                <button
                  className="btn-quiet commitment-remove"
                  onClick={() => setCommitments((list) => list.filter((x) => x.id !== c.id))}
                  aria-label={`Remove ${c.title || 'item'}`}
                  type="button"
                >
                  <Icon name="trash" size={16} />
                </button>
              </div>
            ))}
          </div>

          <button
            className="btn btn-ghost"
            style={{ marginTop: 14 }}
            onClick={() =>
              setCommitments((list) => [
                ...list,
                { id: uid(), title: '', date: arrivalDateStr, start: '09:00', end: '10:00', type: 'meeting' },
              ])
            }
            type="button"
          >
            <Icon name="plus" size={16} /> Add an item
          </button>
        </div>
      )}

      <div className="planner-foot">
        {step > 1 ? (
          <button className="btn btn-ghost" onClick={() => setStep((s) => s - 1)}>
            Back
          </button>
        ) : (
          <button
            className="btn-quiet"
            onClick={() => navigate(editing || trips.length ? 'itinerary' : 'landing')}
          >
            Cancel
          </button>
        )}
        {step < STEPS ? (
          <button className="btn btn-primary" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
            Continue <Icon name="arrow" size={17} />
          </button>
        ) : (
          <button className="btn btn-accent" onClick={build}>
            {editing ? 'Save changes' : 'Build my plan'} <Icon name={editing ? 'check' : 'spark'} size={17} />
          </button>
        )}
      </div>
    </div>
  );
}
