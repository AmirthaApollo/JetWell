import { useState } from 'react';
import type { Plan } from '../engine/planEngine';
import type { Trip as TripModel } from '../store/types';
import { Icon } from './Icon';
import { Barcode } from './Barcode';
import { formatDate, formatTime, formatDuration } from '../lib/time';

export function BoardingPass({
  trip,
  plan,
  hour12,
}: {
  trip: TripModel;
  plan: Plan;
  hour12: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const dep = new Date(plan.departure);
  const arr = new Date(plan.arrival);
  const abs = Math.abs(plan.shiftMinutes);
  const diffLabel = `${formatDuration(abs)} ${plan.shiftMinutes > 0 ? 'ahead' : 'behind'}`;
  const dirLabel =
    plan.direction === 'eastbound' ? 'Eastbound' : plan.direction === 'westbound' ? 'Westbound' : 'Same zone';

  return (
    <section className={`bpass ticket ${collapsed ? 'collapsed' : ''}`} aria-label="Trip summary">
      <div className="bpass-main">
        <div className="bpass-top">
          <span className="eyebrow">Boarding pass · recovery plan</span>
          <button
            className="btn-quiet bpass-collapse"
            onClick={() => setCollapsed((v) => !v)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Expand trip summary' : 'Collapse trip summary'}
          >
            <Icon name="chevron" size={18} />
          </button>
        </div>
        <div className="route">
          <div>
            <div className="code mono">{trip.originCode}</div>
            <div className="city-name">{trip.originCity}</div>
          </div>
          <div className="arrowline" aria-hidden="true" />
          <div>
            <div className="code mono">{trip.destCode}</div>
            <div className="city-name">{trip.destCity}</div>
          </div>
        </div>
        <div className="bpass-times">
          <div>
            <div className="l">Departs</div>
            <div className="t">{formatTime(dep, trip.originTz, hour12)}</div>
            <div className="tiny muted">{formatDate(dep, trip.originTz)}</div>
          </div>
          <div>
            <div className="l">Lands</div>
            <div className="t">{formatTime(arr, trip.destTz, hour12)}</div>
            <div className="tiny muted">{formatDate(arr, trip.destTz)}</div>
          </div>
        </div>
        <div className="bpass-tags">
          <span className={`chip ${plan.direction === 'eastbound' ? 'chip-light' : 'chip-sleep'}`}>
            <span className="dot" /> {dirLabel}
          </span>
          <span className="chip">
            <span className="dot" /> {diffLabel}
          </span>
          <span className="chip chip-accent">
            <span className="dot" /> {formatDuration(plan.flightMinutes)} in the air
          </span>
          {plan.isNearTwelveHours && (
            <span className="chip">
              <span className="dot" /> Near 12h, shortest direction used
            </span>
          )}
        </div>
      </div>
      <div className="bpass-code">
        <Barcode seed={trip.id + trip.originCode + trip.destCode} height={34} />
      </div>
      <div className="bpass-strategy">
        <span className="s-label">Strategy</span>
        {plan.strategyLine}
      </div>
    </section>
  );
}
