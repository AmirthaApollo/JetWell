import { useMemo } from 'react';
import { Icon } from './Icon';
import { buildPlan } from '../engine/planEngine';
import { tripToInput } from '../store/seed';
import { formatDate, formatDuration, formatTime } from '../lib/time';
import type { Trip } from '../store/types';

export function TripCard({
  trip,
  now,
  past,
  onOpen,
  onEdit,
  onDuplicate,
  onReturn,
  hasReturn,
  recoveryCount,
}: {
  trip: Trip;
  now: number;
  past?: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onReturn: () => void;
  hasReturn: boolean;
  recoveryCount: number;
}) {
  const plan = useMemo(() => buildPlan(tripToInput(trip)), [trip]);
  const dep = new Date(trip.departureISO);
  const arr = new Date(trip.arrivalISO);
  const live = now >= dep.getTime() - 48 * 3600000 && now <= arr.getTime() + 72 * 3600000;
  const abs = Math.abs(plan.shiftMinutes);
  const dir = plan.shiftMinutes > 0 ? 'ahead' : plan.shiftMinutes < 0 ? 'behind' : 'none';

  return (
    <div className="trip-card ticket" style={{ cursor: 'default' }}>
      <button onClick={onOpen} style={{ textAlign: 'left', background: 'none' }} aria-label={`Open ${trip.label} itinerary`}>
        <div className="tc-route mono">
          {trip.originCode} → {trip.destCode}
          {live && (
            <span className="badge-soft soon" style={{ marginLeft: 10 }}>
              Live
            </span>
          )}
          {past && (
            <span className="badge-soft past" style={{ marginLeft: 10 }}>
              Done
            </span>
          )}
        </div>
        <div className="tc-cities">
          {trip.originCity} → {trip.destCity}
        </div>
        <div className="tc-meta">
          <span>
            <Icon name="calendar" size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
            {formatDate(dep, trip.originTz)}
          </span>
          <span>
            <Icon name="clock" size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
            {formatTime(dep, trip.originTz)} → {formatTime(arr, trip.destTz)} {trip.destCode}
          </span>
          <span>{formatDuration(plan.flightMinutes)} flight</span>
          {recoveryCount > 0 && <span>{recoveryCount} recovery score{recoveryCount > 1 ? 's' : ''}</span>}
        </div>
      </button>
      <div className="tc-shift">
        <div className="eyebrow">Time shift</div>
        <div className="mono" style={{ fontSize: 20, margin: '4px 0 12px' }}>
          {plan.direction === 'none' ? 'none' : `${formatDuration(abs)} ${dir}`}
        </div>
        <div className="row gap-8" style={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-sm" onClick={onOpen}>
            Open
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onEdit} aria-label="Edit flight">
            <Icon name="note" size={14} />
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onDuplicate} aria-label="Duplicate trip">
            <Icon name="copy" size={14} />
          </button>
          {!hasReturn && (
            <button className="btn btn-ghost btn-sm" onClick={onReturn} aria-label="Plan return trip">
              <Icon name="refresh" size={14} /> Return
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
