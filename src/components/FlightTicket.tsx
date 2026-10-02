import type { Plan } from '../engine/planEngine';
import type { Trip } from '../store/types';
import { Barcode } from './Barcode';
import { Icon } from './Icon';
import { formatDate, formatDuration, formatTime } from '../lib/time';

export function FlightTicket({
  trip,
  plan,
  hour12,
  onOpen,
  onNew,
}: {
  trip: Trip | null;
  plan: Plan | null;
  hour12: boolean;
  onOpen: () => void;
  onNew: () => void;
}) {
  if (!trip || !plan) {
    return (
      <div className="fticket ticket empty">
        <div className="ft-top">
          <span className="ft-air">Jetwell</span>
          <span className="ft-class mono">NO TRIP YET</span>
        </div>
        <div className="ft-empty">
          <Icon name="plane" size={26} />
          <h3>No flight on the board</h3>
          <p className="small muted">Add one and your ticket appears here.</p>
          <button className="btn btn-accent" onClick={onNew}>
            Plan a trip
          </button>
        </div>
      </div>
    );
  }

  const dep = new Date(plan.departure);
  const arr = new Date(plan.arrival);
  const abs = Math.abs(plan.shiftMinutes);
  const shift = plan.shiftMinutes === 0 ? 'None' : `${formatDuration(abs)} ${plan.shiftMinutes > 0 ? 'ahead' : 'behind'}`;
  const dir = plan.direction === 'eastbound' ? 'Eastbound' : plan.direction === 'westbound' ? 'Westbound' : 'Same zone';

  return (
    <div className="fticket ticket">
      <div className="ft-top">
        <span className="ft-air">
          <Icon name="plane" size={15} /> Jetwell
        </span>
        <span className="ft-class mono">BOARDING PASS · RECOVERY PLAN</span>
      </div>

      <div className="ft-route">
        <div className="ft-end">
          <span className="ft-code mono">{trip.originCode}</span>
          <span className="ft-city">{trip.originCity}</span>
          <span className="ft-time mono">{formatTime(dep, trip.originTz, hour12)}</span>
          <span className="ft-date">{formatDate(dep, trip.originTz)}</span>
        </div>

        <div className="ft-mid" aria-hidden="true">
          <svg viewBox="0 0 160 40" width="100%">
            <path d="M4 32 C 46 6, 114 6, 156 32" fill="none" stroke="var(--hairline-strong)" strokeWidth="1.5" strokeDasharray="4 5" />
            <circle cx="4" cy="32" r="4" fill="var(--sand)" />
            <circle cx="156" cy="32" r="4" fill="var(--accent)" />
            <path d="M-8 2 L10 0 L-8 -2 L-5 0 Z" transform="translate(80 9) rotate(3)" fill="var(--accent)" />
          </svg>
          <span className="ft-dur mono">{formatDuration(plan.flightMinutes)}</span>
        </div>

        <div className="ft-end end">
          <span className="ft-code mono">{trip.destCode}</span>
          <span className="ft-city">{trip.destCity}</span>
          <span className="ft-time mono">{formatTime(arr, trip.destTz, hour12)}</span>
          <span className="ft-date">{formatDate(arr, trip.destTz)}</span>
        </div>
      </div>

      <div className="ft-fields">
        <div className="ft-field">
          <span className="l">CLASS</span>
          <span className="v mono">
            {trip.prep === 'full' ? 'Full prep' : trip.prep === 'balanced' ? 'Balanced' : 'Light'}
          </span>
        </div>
        <div className="ft-field">
          <span className="l">SHIFT</span>
          <span className="v mono">{shift}</span>
        </div>
        <div className="ft-field">
          <span className="l">DIRECTION</span>
          <span className="v mono">{dir}</span>
        </div>
        <div className="ft-field">
          <span className="l">FLIGHT</span>
          <span className="v mono">{formatDuration(plan.flightMinutes)}</span>
        </div>
      </div>

      <div className="ft-stub">
        <div className="ft-barcode">
          <Barcode seed={trip.id + trip.originCode + trip.destCode} />
        </div>
        <button className="btn btn-accent" onClick={onOpen}>
          Open my plan <Icon name="arrow" size={16} />
        </button>
      </div>
    </div>
  );
}
