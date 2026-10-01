import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon, type IconName } from '../components/Icon';
import { useReducedMotion } from '../components/hooks';

type ToolId = 'winddown' | 'breathing' | 'light' | 'stretch' | 'nap';

const TOOLS: { id: ToolId; title: string; icon: IconName; blurb: string }[] = [
  { id: 'winddown', title: 'Wind-down timer', icon: 'sleep', blurb: 'A screen-free countdown that dims to help you settle.' },
  { id: 'breathing', title: 'Breathing', icon: 'globe', blurb: 'In 4, hold 4, out 6. A few quiet minutes.' },
  { id: 'light', title: 'Light break', icon: 'light', blurb: 'Get outside for 10–15 minutes at the right time.' },
  { id: 'stretch', title: 'Quick stretch', icon: 'move', blurb: 'A guided 3-minute stretch, seated-friendly.' },
  { id: 'nap', title: 'Nap timer', icon: 'nap', blurb: 'A short nap with a gentle end.' },
];

function useCountdown(initialSeconds: number) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [running, setRunning] = useState(false);
  const ref = useRef<number>();

  const stop = useCallback(() => {
    if (ref.current) window.clearInterval(ref.current);
    ref.current = undefined;
  }, []);

  useEffect(() => {
    if (!running) return;
    ref.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return stop;
  }, [running, stop]);

  const start = useCallback((seconds?: number) => {
    if (seconds !== undefined) setRemaining(seconds);
    setRunning(true);
  }, []);
  const pause = useCallback(() => setRunning(false), []);
  const reset = useCallback(
    (seconds?: number) => {
      setRunning(false);
      setRemaining(seconds ?? initialSeconds);
    },
    [initialSeconds],
  );

  return { remaining, running, start, pause, reset, setRemaining };
}

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function Reset() {
  const [active, setActive] = useState<ToolId | null>(null);

  if (active) {
    return <ToolRunner id={active} onClose={() => setActive(null)} />;
  }

  return (
    <div className="screen">
      <div className="section-head">
        <div>
          <div className="eyebrow">In the moment</div>
          <h2 style={{ fontSize: 30, marginTop: 4 }}>Reset</h2>
        </div>
      </div>
      <p className="muted" style={{ marginBottom: 24, maxWidth: '52ch' }}>
        Small tools for the middle of the night or the middle of a long flight. Nothing here is complicated.
      </p>
      <div className="tool-grid">
        {TOOLS.map((t) => (
          <button className="tool" key={t.id} onClick={() => setActive(t.id)}>
            <span className="t-ico">
              <Icon name={t.icon} size={22} />
            </span>
            <h3>{t.title}</h3>
            <p>{t.blurb}</p>
            <span className="learn" style={{ marginTop: 'auto' }}>
              Open <Icon name="arrow" size={14} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ToolRunner({ id, onClose }: { id: ToolId; onClose: () => void }) {
  const meta = TOOLS.find((t) => t.id === id)!;
  switch (id) {
    case 'winddown':
      return <WindDown onClose={onClose} />;
    case 'breathing':
      return <Breathing onClose={onClose} />;
    case 'light':
      return <LightBreak onClose={onClose} />;
    case 'stretch':
      return <Stretch onClose={onClose} />;
    case 'nap':
      return <Nap onClose={onClose} />;
    default:
      return (
        <div className="screen">
          <button className="btn-quiet" onClick={onClose}>
            Back
          </button>
          <h2>{meta.title}</h2>
        </div>
      );
  }
}

function RunnerShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="screen" style={{ maxWidth: 620 }}>
      <button className="btn-quiet" onClick={onClose} style={{ marginBottom: 14 }}>
        <Icon name="chevron" size={16} style={{ transform: 'rotate(90deg)' }} /> All tools
      </button>
      <div className="tool-runner">
        <div className="eyebrow">{title}</div>
        {children}
      </div>
    </div>
  );
}

function WindDown({ onClose }: { onClose: () => void }) {
  const [minutes, setMinutes] = useState(10);
  const { remaining, running, start, pause, reset } = useCountdown(minutes * 60);
  const [dim, setDim] = useState(false);
  const progress = 1 - remaining / (minutes * 60);

  useEffect(() => {
    if (remaining === 0 && running === false && dim) {
      const t = window.setTimeout(() => setDim(false), 5000);
      return () => window.clearTimeout(t);
    }
  }, [remaining, running, dim]);

  if (dim) {
    return (
      <div className="dim-screen" role="dialog" aria-label="Wind-down timer running">
        <div>
          <div className="d-time" aria-live="polite">
            {fmt(remaining)}
          </div>
          <div className="d-sub">
            {remaining === 0 ? 'Rest now. Everything else can wait.' : 'Put the screen down. Let the room go dark.'}
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 30 }}>
            <button className="btn btn-ghost" onClick={() => (running ? pause() : start())}>
              {running ? 'Pause' : 'Resume'}
            </button>
            <button className="btn btn-ghost" onClick={() => setDim(false)}>
              Exit
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <RunnerShell title="Wind-down" onClose={onClose}>
      <h2 style={{ fontSize: 26 }}>Set a wind-down</h2>
      <p className="muted">A dim countdown with no bright screen. Start it in bed.</p>
      <div className="row gap-8" style={{ justifyContent: 'center', margin: '8px 0' }}>
        <div className="segmented">
          {[5, 10, 20].map((m) => (
            <button
              key={m}
              className={minutes === m ? 'on' : ''}
              onClick={() => {
                setMinutes(m);
                reset(m * 60);
              }}
            >
              {m} min
            </button>
          ))}
        </div>
      </div>
      <div className="timer-time" aria-live="polite">{fmt(remaining)}</div>
      <TimerRing progress={progress} />
      <div className="row gap-12">
        {remaining === 0 ? (
          <button className="btn btn-accent" onClick={() => reset(minutes * 60)}>
            Again
          </button>
        ) : running ? (
          <button className="btn btn-ghost" onClick={pause}>
            Pause
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => start()}>
            Start
          </button>
        )}
        <button className="btn btn-accent" onClick={() => setDim(true)}>
          Dim &amp; run
        </button>
      </div>
    </RunnerShell>
  );
}

function TimerRing({ progress }: { progress: number }) {
  const r = 74;
  const c = 2 * Math.PI * r;
  return (
    <svg width="180" height="180" className="timer-ring" aria-hidden="true">
      <circle className="track" cx="90" cy="90" r={r} fill="none" strokeWidth="6" />
      <circle
        className="prog"
        cx="90"
        cy="90"
        r={r}
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * progress}
        style={{ transition: 'stroke-dashoffset 1s linear' }}
      />
    </svg>
  );
}

const BREATH = [
  { label: 'In', secs: 4, scale: 1.25 },
  { label: 'Hold', secs: 4, scale: 1.25 },
  { label: 'Out', secs: 6, scale: 0.85 },
];

function Breathing({ onClose }: { onClose: () => void }) {
  const total = 180;
  const { remaining, running, start, pause, reset } = useCountdown(total);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [phaseLeft, setPhaseLeft] = useState(BREATH[0].secs);
  const phaseRef = useRef(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => {
      setPhaseLeft((left) => {
        if (left > 1) return left - 1;
        const ni = (phaseRef.current + 1) % BREATH.length;
        phaseRef.current = ni;
        setPhaseIdx(ni);
        return BREATH[ni].secs;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [running]);

  const phase = BREATH[phaseIdx];
  const finished = remaining === 0;

  return (
    <RunnerShell title="Breathing · 4 · 4 · 6" onClose={onClose}>
      <h2 style={{ fontSize: 26 }}>{finished ? 'Nicely done' : 'Follow the circle'}</h2>
      <p className="muted">Three minutes. Breathe in for four, hold for four, out for six.</p>
      <div className="breath-wrap">
        <div
          className="breath-halo"
          style={{ transform: `scale(${running ? phase.scale : 1})`, transitionDuration: reduced ? '0s' : `${phase.secs}s` }}
        />
        <div
          className="breath-circle"
          style={{ transform: `scale(${running ? phase.scale : 1})`, transitionDuration: reduced ? '0s' : `${phase.secs}s` }}
        >
          {finished ? 'Rest' : running ? phase.label : 'Ready'}
        </div>
      </div>
      <div className="mono" style={{ fontSize: 18 }} aria-live="polite">
        {fmt(remaining)}
      </div>
      <div className="tiny muted" aria-live="polite">
        {finished ? 'Session complete' : `${phase.label} · ${phaseLeft}s`}
      </div>
      <div className="row gap-12">
        {finished ? (
          <button
            className="btn btn-accent"
            onClick={() => {
              reset(total);
              setPhaseIdx(0);
              setPhaseLeft(BREATH[0].secs);
              start();
            }}
          >
            Again
          </button>
        ) : running ? (
          <button className="btn btn-ghost" onClick={pause}>
            Pause
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => start()}>
            Start
          </button>
        )}
      </div>
    </RunnerShell>
  );
}

function LightBreak({ onClose }: { onClose: () => void }) {
  const [minutes, setMinutes] = useState(15);
  const { remaining, running, start, pause, reset } = useCountdown(minutes * 60);
  const progress = 1 - remaining / (minutes * 60);
  return (
    <RunnerShell title="Light break" onClose={onClose}>
      <h2 style={{ fontSize: 26 }}>Step outside</h2>
      <p className="muted">Fifteen minutes of daylight is the most useful thing you can do today.</p>
      <div className="timer-time" aria-live="polite">{fmt(remaining)}</div>
      <TimerRing progress={progress} />
      <div className="segmented">
        {[10, 15, 20].map((m) => (
          <button
            key={m}
            className={minutes === m ? 'on' : ''}
            onClick={() => {
              setMinutes(m);
              reset(m * 60);
            }}
          >
            {m} min
          </button>
        ))}
      </div>
      <div className="row gap-12">
        {remaining === 0 ? (
          <button className="btn btn-accent" onClick={() => reset(minutes * 60)}>
            Again
          </button>
        ) : running ? (
          <button className="btn btn-ghost" onClick={pause}>
            Pause
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => start()}>
            Start
          </button>
        )}
      </div>
    </RunnerShell>
  );
}

const STRETCH_STEPS: { text: string; secs: number }[] = [
  { text: 'Sit tall. Roll your shoulders back slowly, five times.', secs: 40 },
  { text: 'Tilt your head gently to one side, breathe, then the other.', secs: 40 },
  { text: 'Circle both ankles, ten times each way.', secs: 40 },
  { text: 'Reach both arms overhead and lengthen your spine.', secs: 40 },
  { text: 'Turn your torso to the right, hold, then to the left.', secs: 40 },
];

function Stretch({ onClose }: { onClose: () => void }) {
  const total = STRETCH_STEPS.reduce((s, x) => s + x.secs, 0);
  const { remaining, running, start, pause, reset } = useCountdown(total);
  const elapsed = total - remaining;
  let acc = 0;
  let idx = 0;
  for (let i = 0; i < STRETCH_STEPS.length; i++) {
    if (elapsed < acc + STRETCH_STEPS[i].secs) {
      idx = i;
      break;
    }
    acc += STRETCH_STEPS[i].secs;
    idx = i;
  }
  const stepLeft = acc + STRETCH_STEPS[idx].secs - elapsed;
  const finished = remaining === 0;

  return (
    <RunnerShell title="Quick stretch · seated-friendly" onClose={onClose}>
      <h2 style={{ fontSize: 26 }}>{finished ? 'Looser already' : `Step ${idx + 1} of ${STRETCH_STEPS.length}`}</h2>
      <p className="stretch-step">{finished ? 'Nicely done. Shake it out.' : STRETCH_STEPS[idx].text}</p>
      <div className="mono" style={{ fontSize: 22 }} aria-live="polite">
        {fmt(finished ? 0 : stepLeft)}
      </div>
      <div className="progress" style={{ width: '100%' }}>
        <div className="bar">
          <i style={{ width: `${(elapsed / total) * 100}%` }} />
        </div>
      </div>
      <div className="row gap-12">
        {finished ? (
          <button className="btn btn-accent" onClick={() => reset(total)}>
            Again
          </button>
        ) : running ? (
          <button className="btn btn-ghost" onClick={pause}>
            Pause
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => start()}>
            Start
          </button>
        )}
      </div>
    </RunnerShell>
  );
}

function Nap({ onClose }: { onClose: () => void }) {
  const [minutes, setMinutes] = useState(20);
  const { remaining, running, start, pause, reset } = useCountdown(minutes * 60);
  const progress = 1 - remaining / (minutes * 60);
  const ended = remaining === 0 && !running;
  return (
    <RunnerShell title="Nap timer" onClose={onClose}>
      <h2 style={{ fontSize: 26 }}>{ended ? 'Gently up' : 'A short nap'}</h2>
      <p className="muted">Keep it under 30 minutes, and before 3pm local. Set a loud alarm.</p>
      <div className="timer-time" aria-live="polite">{fmt(remaining)}</div>
      <TimerRing progress={progress} />
      <div className="segmented">
        {[20, 30].map((m) => (
          <button
            key={m}
            className={minutes === m ? 'on' : ''}
            onClick={() => {
              setMinutes(m);
              reset(m * 60);
            }}
          >
            {m} min
          </button>
        ))}
      </div>
      <div className="row gap-12">
        {ended ? (
          <button className="btn btn-accent" onClick={() => reset(minutes * 60)}>
            Again
          </button>
        ) : running ? (
          <button className="btn btn-ghost" onClick={pause}>
            Pause
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => start()}>
            Start
          </button>
        )}
      </div>
    </RunnerShell>
  );
}
