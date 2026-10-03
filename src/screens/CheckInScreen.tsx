import { useMemo, useState } from 'react';
import { useRouter } from '../router';
import { useStore } from '../store/store';
import { Icon } from '../components/Icon';
import { SectionHead } from '../components/SectionHead';
import { useNow } from '../components/hooks';
import { buildPlan } from '../engine/planEngine';
import { tripToInput } from '../store/seed';
import { formatTime } from '../lib/time';

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
  const { activeTrip, addCheckIn, addRecovery, prefs } = useStore();
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
      return 'Sleepy. If it\u2019s before 3pm, a brief nap is fine, under 30 minutes. Otherwise, light and movement.';
    return 'Steady. Keep the rhythm: light at the right time, meals on local time, and a consistent bedtime.';
  }

  return (
    <div className="screen" style={{ maxWidth: 680 }}>
      <SectionHead icon="info" eyebrow="Optional · under 20 seconds" title="How I'm feeling" />
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
              distressed, it's worth speaking with a doctor or another qualified professional. Jetwell is general
              wellness guidance only. It can't assess or treat anything.
            </div>
          ) : (
            <div className="response">{responseText()}</div>
          )}
          <button className="btn-quiet" style={{ marginTop: 14 }} onClick={() => setSubmitted(false)}>
            Edit check-in
          </button>
        </>
      )}

      {landed && (
        <div className="card pad" style={{ marginTop: 30, maxWidth: 440 }}>
          <label htmlFor="settled-scale" style={{ display: 'block', fontWeight: 600, marginBottom: 10 }}>
            How settled do you feel today? (1-5)
          </label>
          <div className="scale" id="settled-scale">
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
            A soft guide to your own adjustment, not a medical measurement.
          </p>
        </div>
      )}

      <p className="footer-note" style={{ marginTop: 30 }}>
        People with sleep disorders, who are pregnant, or with health conditions that affect sleep should check with a
        professional before changing routines. Last check-in time:{' '}
        {formatTime(new Date(now), activeTrip.destTz, prefs.hour12)} {activeTrip.destCity}.
      </p>
    </div>
  );
}
