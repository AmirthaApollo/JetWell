import { useEffect, useMemo, useState } from 'react';
import { useRouter } from '../router';
import { useStore } from '../store/store';
import { useNow } from '../components/hooks';
import { useToast } from '../components/Toast';
import { Icon, kindIcon } from '../components/Icon';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { buildPlan, currentItem } from '../engine/planEngine';
import { tripToInput } from '../store/seed';
import { formatDuration, formatTime } from '../lib/time';

function countdown(ms: number): string {
  if (ms <= 0) return 'now';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

export function TripMode() {
  const { navigate } = useRouter();
  const { activeTrip, prefs, toggleItem, isDone } = useStore();
  const { push } = useToast();
  const now = useNow(1000);
  const [offset, setOffset] = useState(0);

  const plan = useMemo(() => (activeTrip ? buildPlan(tripToInput(activeTrip)) : null), [activeTrip]);

  useEffect(() => {
    setOffset(0);
  }, [activeTrip?.id]);

  if (!activeTrip || !plan) {
    return (
      <div className="screen">
        <div className="card pad" style={{ textAlign: 'center', padding: 48 }}>
          <h2 style={{ fontSize: 26, marginBottom: 12 }}>Nothing live right now</h2>
          <button className="btn btn-primary" onClick={() => navigate('plan')}>
            Plan a trip
          </button>
        </div>
      </div>
    );
  }

  const live = now >= plan.departure - 48 * 3600000 && now <= plan.arrival + 72 * 3600000;

  if (!live) {
    const until = plan.departure - now;
    return (
      <div className="now-view">
        <div className="card pad center" style={{ padding: 44 }}>
          <div className="eyebrow">Trip mode</div>
          <h2 style={{ fontSize: 30, margin: '10px 0' }}>
            {until > 0 ? 'Not live yet' : 'This trip has wrapped'}
          </h2>
          <p className="muted" style={{ maxWidth: 40 + 'ch', marginBottom: 20 }}>
            {until > 0
              ? `Trip mode opens 48 hours before departure. That's in ${formatDuration(until / 60000)}.`
              : 'Here is the plan for reference. You can still check items off.'}
          </p>
          <button className="btn btn-ghost" onClick={() => navigate('itinerary')}>
            View itinerary
          </button>
        </div>
      </div>
    );
  }

  const base = currentItem(plan.items, now);
  const startIndex = Math.max(0, base.index);
  const idx = Math.min(startIndex + offset, plan.items.length - 1);
  const current = plan.items[idx];
  const upNext = plan.items.slice(idx + 1, idx + 3);
  const nextAt = plan.items[idx + 1]?.at;
  const done = isDone(activeTrip.id, current.id);

  function handleDone(label: 'Done' | 'Skip') {
    toggleItem(activeTrip!.id, current.id);
    push({
      title: label === 'Done' ? 'Nice work.' : 'Skipped. No problem.',
      body: label === 'Done' ? 'On to the next one.' : 'Even half of this plan helps.',
      icon: label === 'Done' ? 'check' : 'arrow',
    });
    setOffset((o) => o + 1);
  }

  return (
    <div className="now-view">
      <div className="now-card">
        <div className="n-eyebrow">
          Right now · {activeTrip.destCity} {formatTime(new Date(now), activeTrip.destTz, prefs.hour12)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
          <span className={`k-ico k-${current.kind}`} style={{ width: 34, height: 34 }}>
            <Icon name={kindIcon(current.kind)} size={18} />
          </span>
          <span style={{ fontSize: 13, color: 'rgba(250,248,244,0.7)' }}>Step {idx + 1} of {plan.items.length}</span>
        </div>
        <h2>{current.title}</h2>
        <p className="n-why">{current.why}</p>
        <div className="n-time">
          {formatTime(new Date(current.at), activeTrip.destTz, prefs.hour12)} ·{' '}
          {formatTime(new Date(current.at), activeTrip.originTz, prefs.hour12)} home
        </div>

        {nextAt && (
          <>
            <div className="n-eyebrow" style={{ marginTop: 22 }}>
              Next step in
            </div>
            <div className="countdown" aria-live="polite">
              <AnimatedNumber value={nextAt - now} format={(n) => countdown(n)} />
            </div>
          </>
        )}

        <div className="now-actions">
          <button className="btn btn-accent" onClick={() => handleDone('Done')} disabled={done}>
            <Icon name="check" size={17} /> Done
          </button>
          <button className="btn btn-ghost" onClick={() => handleDone('Skip')}>
            Skip
          </button>
        </div>
      </div>

      <div className="up-next">
        <div className="eyebrow" style={{ margin: '6px 0 12px' }}>Up next</div>
        <div className="row-list">
          {upNext.length === 0 && <p className="muted small">That's the end of the plan. Nicely done.</p>}
          {upNext.map((item) => (
            <div className="item" key={item.id} style={{ cursor: 'default' }}>
              <div className="it-time">
                <span className="dest">{formatTime(new Date(item.at), activeTrip.destTz, prefs.hour12)}</span>
                <span className="daytag mono">{formatDuration((item.at - now) / 60000)}</span>
              </div>
              <div className="it-body">
                <div className="it-title">
                  <span className={`k-ico k-${item.kind}`}>
                    <Icon name={kindIcon(item.kind)} size={15} />
                  </span>
                  {item.title}
                </div>
                <p className="it-why">{item.why}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className="btn-quiet" onClick={() => navigate('itinerary')}>
        Open the full itinerary
      </button>
    </div>
  );
}
