import { useMemo } from 'react';
import { useRouter } from '../router';
import { useStore } from '../store/store';
import { useNow } from '../components/hooks';
import { Icon } from '../components/Icon';
import { SectionHead } from '../components/SectionHead';
import { Divider } from '../components/Divider';
import { findCity } from '../data/cities';
import { buildPlan } from '../engine/planEngine';
import { tripToInput } from '../store/seed';
import { formatClock, formatDuration, getOffsetMinutes, offsetLabel } from '../lib/time';

export function Journey() {
  const { navigate } = useRouter();
  const { activeTrip, prefs, customCities } = useStore();
  const now = useNow(1000);

  const plan = useMemo(() => (activeTrip ? buildPlan(tripToInput(activeTrip)) : null), [activeTrip]);

  if (!activeTrip || !plan) {
    return (
      <div className="screen">
        <div className="card pad center" style={{ padding: 44 }}>
          <h2 style={{ fontSize: 26, marginBottom: 10 }}>No trip yet</h2>
          <p className="muted" style={{ marginBottom: 20 }}>
            Add a flight to see the time zones of your journey.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('plan')}>
            Plan my trip
          </button>
        </div>
      </div>
    );
  }

  const home = findCity(prefs.homeCityId, customCities) ?? findCity(activeTrip.originId, customCities);
  const homeTz = home?.tz ?? activeTrip.originTz;
  const homeName = home?.city ?? activeTrip.originCity;

  const stops = [
    { key: 'o', code: activeTrip.originCode, city: activeTrip.originCity, country: activeTrip.originCountry, tz: activeTrip.originTz, kind: 'Origin' },
    ...(activeTrip.layovers ?? (activeTrip.layover ? [activeTrip.layover] : [])).map((l, i) => ({
      key: 'l' + i,
      code: l.code,
      city: l.city,
      country: l.country,
      tz: l.tz,
      kind: 'Layover',
    })),
    { key: 'd', code: activeTrip.destCode, city: activeTrip.destCity, country: activeTrip.destCountry, tz: activeTrip.destTz, kind: 'Destination' },
  ];

  const directionNote =
    plan.direction === 'eastbound'
      ? 'Travelling east: harder to adjust. Your body has to advance its clock.'
      : plan.direction === 'westbound'
        ? 'Travelling west: easier to adjust. Your body has to delay its clock, which comes more naturally.'
        : 'No time zone change. Hold your normal rhythm.';

  return (
    <div className="screen">
      <SectionHead
        icon="globe"
        eyebrow="Time zones of my journey"
        title={`${activeTrip.originCity} to ${activeTrip.destCity}`}
        action={
          <div className="row gap-8">
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('edit')}>
              <Icon name="note" size={15} /> Edit flight
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('schedule')}>
              <Icon name="calendar" size={15} /> My commitments
            </button>
          </div>
        }
      />

      <div className={`direction-note ${plan.direction}`}>
        <Icon name={plan.direction === 'eastbound' ? 'light' : plan.direction === 'westbound' ? 'sleep' : 'globe'} size={18} />
        <span>{directionNote}</span>
      </div>

      <ol className="route-line" aria-label="Your route">
        {stops.map((s) => {
          const diff = getOffsetMinutes(new Date(now), s.tz) - getOffsetMinutes(new Date(now), homeTz);
          const abs = Math.abs(diff);
          const rel = diff > 0 ? 'ahead of' : diff < 0 ? 'behind' : 'same as';
          return (
            <li className="stop" key={s.key}>
              <div className="stop-marker" aria-hidden="true" />
              <div className="stop-card card">
                <div className="stop-head">
                  <div>
                    <span className="stop-kind eyebrow">{s.kind}</span>
                    <h3 className="stop-city">{s.city}</h3>
                    <div className="tiny muted">{s.country ?? s.tz}</div>
                  </div>
                  <div className="stop-now">
                    <div className="stop-clock mono">{formatClock(new Date(now), s.tz, prefs.hour12)}</div>
                    <div className="tiny muted">local now</div>
                  </div>
                </div>
                <div className="stop-meta">
                  <span className="chip mono">{s.tz}</span>
                  <span className="chip mono">{offsetLabel(new Date(now), s.tz)}</span>
                  <span className={`chip ${diff === 0 ? '' : diff > 0 ? 'chip-light' : 'chip-sleep'}`}>
                    <span className="dot" />
                    {diff === 0 ? `same time as ${homeName}` : `${formatDuration(abs)} ${rel} ${homeName}`}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <Divider icon="globe" />

      <div className="row gap-12" style={{ flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => navigate('schedule')}>
          Add commitments <Icon name="arrow" size={16} />
        </button>
        <button className="btn btn-ghost" onClick={() => navigate('itinerary')}>
          View recovery plan
        </button>
      </div>
    </div>
  );
}
