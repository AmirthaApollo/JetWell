import { useMemo } from 'react';
import { useRouter } from '../router';
import { useStore } from '../store/store';
import { Icon } from '../components/Icon';
import { useNow } from '../components/hooks';
import { useToast } from '../components/Toast';
import { buildPlan } from '../engine/planEngine';
import { tripToInput } from '../store/seed';
import { formatDate, formatDuration, formatTime } from '../lib/time';
import type { Trip } from '../store/types';

export function Trips() {
  const { navigate } = useRouter();
  const { trips, setActive, duplicateTrip, returnTrip, recovery } = useStore();
  const { push } = useToast();
  const now = useNow(60000);

  const sorted = useMemo(
    () => [...trips].sort((a, b) => new Date(a.departureISO).getTime() - new Date(b.departureISO).getTime()),
    [trips],
  );

  const upcoming = sorted.filter((t) => new Date(t.arrivalISO).getTime() > now);
  const past = sorted.filter((t) => new Date(t.arrivalISO).getTime() <= now).reverse();

  function open(t: Trip) {
    setActive(t.id);
    navigate('itinerary');
  }

  return (
    <div className="screen">
      <div className="section-head">
        <div>
          <div className="eyebrow">Your travel</div>
          <h2 style={{ fontSize: 30, marginTop: 4 }}>My trips</h2>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('plan')}>
          <Icon name="plus" size={16} /> New trip
        </button>
      </div>

      {trips.length === 0 && (
        <div className="card pad center" style={{ padding: 44 }}>
          <p className="muted" style={{ marginBottom: 18 }}>
            No trips yet. Add one and we'll build the plan.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('plan')}>
            Plan a trip
          </button>
        </div>
      )}

      {upcoming.length > 0 && (
        <>
          <div className="eyebrow" style={{ margin: '10px 0 12px' }}>Upcoming</div>
          <div className="trip-list">
            {upcoming.map((t) => (
              <TripCard
                key={t.id}
                trip={t}
                now={now}
                onOpen={() => open(t)}
                onDuplicate={() => {
                  duplicateTrip(t.id);
                  push({ title: 'Trip duplicated', body: 'Adjust the dates and you\u2019re set.', icon: 'copy' });
                }}
                onReturn={() => {
                  returnTrip(t.id);
                  push({ title: 'Return trip added', icon: 'plane' });
                }}
                hasReturn={trips.some((x) => x.originId === t.destId && x.destId === t.originId && x.id !== t.id)}
                recoveryCount={recovery.filter((r) => r.tripId === t.id).length}
              />
            ))}
          </div>
        </>
      )}

      {past.length > 0 && (
        <>
          <div className="eyebrow" style={{ margin: '30px 0 12px' }}>Done</div>
          <div className="trip-list">
            {past.map((t) => (
              <TripCard
                key={t.id}
                trip={t}
                now={now}
                past
                onOpen={() => open(t)}
                onDuplicate={() => {
                  duplicateTrip(t.id);
                  push({ title: 'Trip duplicated', icon: 'copy' });
                }}
                onReturn={() => {
                  returnTrip(t.id);
                  push({ title: 'Return trip added', icon: 'plane' });
                }}
                hasReturn={trips.some((x) => x.originId === t.destId && x.destId === t.originId && x.id !== t.id)}
                recoveryCount={recovery.filter((r) => r.tripId === t.id).length}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TripCard({
  trip,
  now,
  past,
  onOpen,
  onDuplicate,
  onReturn,
  hasReturn,
  recoveryCount,
}: {
  trip: Trip;
  now: number;
  past?: boolean;
  onOpen: () => void;
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
