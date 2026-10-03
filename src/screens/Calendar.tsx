import { useMemo, useState } from 'react';
import { useRouter } from '../router';
import { useStore } from '../store/store';
import { useNow } from '../components/hooks';
import { useToast } from '../components/Toast';
import { Icon } from '../components/Icon';
import { SectionHead } from '../components/SectionHead';
import { TripCard } from '../components/TripCard';
import type { Trip } from '../store/types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function dayStart(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function Calendar() {
  const { navigate } = useRouter();
  const { trips, setActive, recovery, duplicateTrip, returnTrip } = useStore();
  const { push } = useToast();
  const now = useNow(60000);
  const today = new Date(now);
  const [cursor, setCursor] = useState(() => ({ y: today.getFullYear(), m: today.getMonth() }));

  const first = new Date(cursor.y, cursor.m, 1);
  const leading = first.getDay();
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < leading; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(cursor.y, cursor.m, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const tripDays = useMemo(() => {
    const map = new Map<number, Trip[]>();
    for (const t of trips) {
      const dep = dayStart(new Date(t.departureISO));
      const arr = dayStart(new Date(t.arrivalISO));
      for (let ts = dep; ts <= arr; ts += 86400000) {
        const list = map.get(ts) ?? [];
        list.push(t);
        map.set(ts, list);
      }
    }
    return map;
  }, [trips]);

  function shift(delta: number) {
    setCursor((c) => {
      const d = new Date(c.y, c.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }

  function open(t: Trip) {
    setActive(t.id);
    navigate('itinerary');
  }

  function edit(t: Trip) {
    setActive(t.id);
    navigate('edit');
  }

  const sorted = useMemo(
    () => [...trips].sort((a, b) => new Date(a.departureISO).getTime() - new Date(b.departureISO).getTime()),
    [trips],
  );
  const upcomingList = sorted.filter((t) => new Date(t.arrivalISO).getTime() > now);
  const pastList = sorted.filter((t) => new Date(t.arrivalISO).getTime() <= now).reverse();

  return (
    <div className="screen">
      <SectionHead
        icon="calendar"
        eyebrow="Your travel schedule"
        title={`${MONTHS[cursor.m]} ${cursor.y}`}
        action={
          <button className="btn btn-primary btn-sm" onClick={() => navigate('plan')}>
            <Icon name="plus" size={16} /> New trip
          </button>
        }
      />

      <div className="cal-toolbar">
        <button className="btn btn-ghost btn-sm" onClick={() => shift(-1)} aria-label="Previous month">
          <Icon name="chevron" size={16} style={{ transform: 'rotate(90deg)' }} />
        </button>
        <button
          className="btn-quiet"
          onClick={() => setCursor({ y: today.getFullYear(), m: today.getMonth() })}
        >
          Today
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => shift(1)} aria-label="Next month">
          <Icon name="chevron" size={16} style={{ transform: 'rotate(-90deg)' }} />
        </button>
      </div>

      <div className="calendar card">
        <div className="cal-weekdays">
          {WEEKDAYS.map((w) => (
            <div key={w} className="cal-weekday">
              {w}
            </div>
          ))}
        </div>
        <div className="cal-grid">
          {cells.map((date, i) => {
            if (!date) return <div className="cal-cell empty" key={'e' + i} />;
            const ts = date.getTime();
            const dayTrips = tripDays.get(ts) ?? [];
            const isToday = dayStart(today) === ts;
            return (
              <div className={`cal-cell ${isToday ? 'today' : ''} ${dayTrips.length ? 'has-trips' : ''}`} key={ts}>
                <span className="cal-daynum mono">{date.getDate()}</span>
                <div className="cal-chips">
                  {dayTrips.map((t) => {
                    const past = new Date(t.arrivalISO).getTime() < now;
                    return (
                      <button
                        key={t.id}
                        className={`cal-chip ${past ? 'past' : 'soon'}`}
                        onClick={() => open(t)}
                        title={`${t.originCity} to ${t.destCity}`}
                      >
                        {t.originCode}
                        <Icon name="arrow" size={11} />
                        {t.destCode}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="cal-legend">
        <span className="cal-key">
          <span className="cal-dot soon" /> Upcoming
        </span>
        <span className="cal-key">
          <span className="cal-dot past" /> Past
        </span>
      </div>

      <div className="section-head" style={{ marginTop: 30 }}>
        <div>
          <div className="eyebrow">My trips</div>
          <h3 style={{ fontSize: 22, marginTop: 4 }}>{trips.length} trip{trips.length === 1 ? '' : 's'}</h3>
        </div>
      </div>

      {trips.length === 0 && (
        <div className="card pad muted small" style={{ textAlign: 'center', padding: 30 }}>
          No trips yet. Add one and we'll build the plan.
        </div>
      )}

      {upcomingList.length > 0 && (
        <>
          <div className="eyebrow" style={{ margin: '10px 0 12px' }}>Upcoming</div>
          <div className="trip-list">
            {upcomingList.map((t) => (
              <TripCard
                key={t.id}
                trip={t}
                now={now}
                onOpen={() => open(t)}
                onEdit={() => edit(t)}
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

      {pastList.length > 0 && (
        <>
          <div className="eyebrow" style={{ margin: '30px 0 12px' }}>Done</div>
          <div className="trip-list">
            {pastList.map((t) => (
              <TripCard
                key={t.id}
                trip={t}
                now={now}
                past
                onOpen={() => open(t)}
                onEdit={() => edit(t)}
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
