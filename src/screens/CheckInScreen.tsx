import { useMemo, useState } from 'react';
import { useRouter } from '../router';
import { useStore } from '../store/store';
import { Icon } from '../components/Icon';
import { useNow } from '../components/hooks';
import { buildPlan } from '../engine/planEngine';
import { tripToInput } from '../store/seed';
import { dayDiff, formatTime } from '../lib/time';

interface ScaleDef {
  key: 'energy' | 'sleepiness' | 'mood' | 'sleepQuality';
  label: string;
  low: string;
  high: string;
}

const SCALES: ScaleDef[] = [
  { key: 'energy', label: 'Energy', low: 'Drained', high: 'Energised' },
  { key: 'sleepiness', label: 'Sleepiness', low: 'Wide awake', high: 'Very sleepy' },
  { key: 'mood', label: 'Mood', low: 'Low', high: 'Bright' },
  { key: 'sleepQuality', label: 'How did you sleep last night?', low: 'Terrible', high: 'Great' },
];

function Scale({
  def,
  value,
  onChange,
}: {
  def: ScaleDef;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="checkin-block">
      <label id={`${def.key}-label`}>{def.label}</label>
      <div className="scale" role="radiogroup" aria-labelledby={`${def.key}-label`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            role="radio"
            aria-checked={value === n}
            aria-label={`${def.label}: ${n} of 5`}
            className={`scale-btn ${value === n ? 'on' : ''}`}
            onClick={() => onChange(n)}
          >
            <span className="face" />
            <span className="mono">{n}</span>
          </button>
        ))}
      </div>
      <div className="between row tiny muted" style={{ marginTop: 6 }}>
        <span>{def.low}</span>
        <span>{def.high}</span>
      </div>
    </div>
  );
}

export function CheckInScreen() {
  const { navigate } = useRouter();
  const { activeTrip, addCheckIn, addRecovery, recovery, prefs } = useStore();
  const now = useNow(60000);

  const [energy, setEnergy] = useState(3);
  const [sleepiness, setSleepiness] = useState(3);
  const [mood, setMood] = useState(3);
  const [sleepQuality, setSleepQuality] = useState(3);
  const [submitted, setSubmitted] = useState(false);
  const [settled, setSettled] = useState<number | null>(null);

  const plan = useMemo(() => (activeTrip ? buildPlan(tripToInput(activeTrip)) : null), [activeTrip]);

  if (!activeTrip || !plan) {
    return (
      <div className="screen">
        <div className="card pad center" style={{ padding: 44 }}>
          <h2 style={{ fontSize: 26, marginBottom: 10 }}>No active trip</h2>
          <button className="btn btn-primary" onClick={() => navigate('plan')}>
            Plan a trip
          </button>
        </div>
      </div>
    );
  }

  const landed = now >= plan.arrival;
  const severe = sleepQuality <= 1 || mood <= 1;

  const tripRecovery = recovery.filter((r) => r.tripId === activeTrip.id).sort((a, b) => a.at - b.at);

  function submit() {
    addCheckIn({ tripId: activeTrip!.id, at: Date.now(), energy, sleepiness, mood, sleepQuality });
    setSubmitted(true);
  }

  function responseText(): string {
    if (severe) return '';
    if (energy <= 2 && sleepiness >= 4)
      return 'Energy\u2019s low and you\u2019re sleepy. Try a 20-minute nap before 3pm, then get daylight and water.';
    if (energy <= 2)
      return 'Energy\u2019s low. A short walk in daylight will do more than another coffee right now.';
    if (sleepiness <= 2 && energy >= 4)
      return 'You\u2019re in good shape. Keep light and meals on destination time today and hold your bedtime.';
    if (sleepiness >= 4)
      return 'Sleepy. If it\u2019s before 3pm, a brief nap is fine — under 30 minutes. Otherwise, light and movement.';
    return 'Steady. Keep the rhythm: light at the right time, meals on local time, and a consistent bedtime.';
  }

  return (
    <div className="screen" style={{ maxWidth: 680 }}>
      <div className="section-head">
        <div>
          <div className="eyebrow">Optional · under 20 seconds</div>
          <h2 style={{ fontSize: 30, marginTop: 4 }}>How I'm feeling</h2>
        </div>
      </div>
      <p className="muted" style={{ marginBottom: 26, maxWidth: '52ch' }}>
        A quick check so we can adjust the rest of your plan. There are no wrong answers here.
      </p>

      {!submitted ? (
        <div className="card pad">
          {SCALES.map((def) => (
            <Scale
              key={def.key}
              def={def}
              value={{ energy, sleepiness, mood, sleepQuality }[def.key]}
              onChange={(n) => {
                if (def.key === 'energy') setEnergy(n);
                else if (def.key === 'sleepiness') setSleepiness(n);
                else if (def.key === 'mood') setMood(n);
                else setSleepQuality(n);
              }}
            />
          ))}
          <button className="btn btn-primary" onClick={submit}>
            Save check-in <Icon name="check" size={17} />
          </button>
        </div>
      ) : (
        <>
          {severe ? (
            <div className="response warn">
              <strong>Thanks for being honest.</strong> If sleep is feeling persistently difficult or you're feeling
              distressed, it's worth speaking with a doctor or another qualified professional. Jetlagged is general
              wellness guidance only — it can't assess or treat anything.
            </div>
          ) : (
            <div className="response">{responseText()}</div>
          )}
          <button className="btn-quiet" style={{ marginTop: 14 }} onClick={() => setSubmitted(false)}>
            Edit check-in
          </button>
        </>
      )}

      <div className="card recovery-chart" style={{ marginTop: 30 }}>
        <div className="between row" style={{ marginBottom: 8 }}>
          <div>
            <div className="eyebrow">Recovery curve</div>
            <div className="small muted">How settled you feel, by day since landing.</div>
          </div>
        </div>
        <RecoveryCurve
          points={tripRecovery.map((r) => ({
            day: landed ? dayDiff(new Date(plan.arrival), new Date(r.at), activeTrip.destTz) : 0,
            value: r.score,
            at: r.at,
          }))}
        />
        {landed && (
          <div style={{ marginTop: 18 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 10 }}>
              How settled do you feel today? (1–5)
            </label>
            <div className="scale">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  className={`scale-btn ${settled === n ? 'on' : ''}`}
                  onClick={() => {
                    setSettled(n);
                    addRecovery({ tripId: activeTrip.id, at: Date.now(), score: n });
                  }}
                  aria-label={`${n} of 5`}
                >
                  <span className="face" />
                  <span className="mono">{n}</span>
                </button>
              ))}
            </div>
            <p className="tiny muted" style={{ marginTop: 8 }}>
              A soft guide to your own adjustment — not a medical measurement.
            </p>
          </div>
        )}
      </div>

      <p className="footer-note" style={{ marginTop: 30 }}>
        People with sleep disorders, who are pregnant, or with health conditions that affect sleep should check with a
        professional before changing routines. Last check-in time:{' '}
        {formatTime(new Date(now), activeTrip.destTz, prefs.hour12)} {activeTrip.destCity}.
      </p>
    </div>
  );
}

function RecoveryCurve({ points }: { points: { day: number; value: number; at: number }[] }) {
  const W = 620;
  const H = 190;
  const pad = { l: 34, r: 14, t: 18, b: 30 };
  const maxDay = Math.max(3, ...points.map((p) => p.day));
  const xFor = (d: number) => pad.l + (d / maxDay) * (W - pad.l - pad.r);
  const yFor = (v: number) => pad.t + (1 - (v - 1) / 4) * (H - pad.t - pad.b);

  const sorted = [...points].sort((a, b) => a.day - b.day);
  const line = sorted.map((p) => `${xFor(p.day)},${yFor(p.value)}`).join(' ');
  const area =
    sorted.length > 1
      ? `${xFor(sorted[0].day)},${H - pad.b} ` + line + ` ${xFor(sorted[sorted.length - 1].day)},${H - pad.b}`
      : '';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Recovery curve: settled feeling by day since landing">
      {[1, 3, 5].map((v) => (
        <g key={v}>
          <line x1={pad.l} y1={yFor(v)} x2={W - pad.r} y2={yFor(v)} stroke="var(--hairline)" strokeWidth="1" />
          <text x="12" y={yFor(v) + 4} className="rc-label">
            {v}
          </text>
        </g>
      ))}
      {Array.from({ length: maxDay + 1 }).map((_, d) => (
        <text key={d} x={xFor(d)} y={H - 8} textAnchor="middle" className="rc-label">
          D{d}
        </text>
      ))}
      {area && <polygon points={area} fill="var(--accent-wash)" opacity="0.7" />}
      {sorted.length > 1 && <polyline points={line} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" />}
      {sorted.map((p) => (
        <circle key={p.at} cx={xFor(p.day)} cy={yFor(p.value)} r="4.5" fill="var(--accent)" stroke="var(--card)" strokeWidth="2" />
      ))}
      {sorted.length === 0 && (
        <text x={W / 2} y={H / 2} textAnchor="middle" className="rc-label">
          No recovery scores yet — add one after you land.
        </text>
      )}
    </svg>
  );
}
