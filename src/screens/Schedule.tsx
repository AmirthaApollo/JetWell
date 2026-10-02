import { useMemo, useState } from 'react';
import { useRouter } from '../router';
import { useStore } from '../store/store';
import { Icon } from '../components/Icon';
import { evaluateSchedule, type ScheduleItem, type ScheduleType } from '../engine/planEngine';
import { tripToInput } from '../store/seed';
import { buildPlan } from '../engine/planEngine';

const DAYS = 5;
const TYPES: { value: ScheduleType; label: string; icon: 'note' | 'light' | 'spark' | 'rest' }[] = [
  { value: 'meeting', label: 'Meeting', icon: 'note' },
  { value: 'class', label: 'Class', icon: 'light' },
  { value: 'event', label: 'Event', icon: 'spark' },
  { value: 'free', label: 'Free', icon: 'rest' },
];

function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}
function toTime(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}
function fmt(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  const ampm = h < 12 ? 'am' : 'pm';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, '0')}${ampm}`;
}

export function Schedule() {
  const { navigate } = useRouter();
  const { activeTrip, schedule, addScheduleItem, updateScheduleItem, deleteScheduleItem } = useStore();

  const [day, setDay] = useState(1);
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('10:00');
  const [type, setType] = useState<ScheduleType>('meeting');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const plan = useMemo(() => (activeTrip ? buildPlan(tripToInput(activeTrip)) : null), [activeTrip]);

  const conflicts = useMemo(() => {
    if (!activeTrip || !plan) return [];
    return evaluateSchedule(schedule.filter((s) => s.tripId === activeTrip.id), {
      arrival: plan.arrival,
      destTz: activeTrip.destTz,
      originTz: activeTrip.originTz,
    });
  }, [schedule, activeTrip, plan]);

  if (!activeTrip || !plan) {
    return (
      <div className="screen">
        <div className="card pad center" style={{ padding: 44 }}>
          <h2 style={{ fontSize: 26, marginBottom: 10 }}>No trip yet</h2>
          <p className="muted" style={{ marginBottom: 20 }}>
            Add a flight first, then we can line up your schedule.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('plan')}>
            Plan my trip
          </button>
        </div>
      </div>
    );
  }

  const dayItems = schedule
    .filter((s) => s.tripId === activeTrip.id && s.day === day)
    .sort((a, b) => a.startMin - b.startMin);

  function reset() {
    setTitle('');
    setStart('09:00');
    setEnd('10:00');
    setType('meeting');
    setEditingId(null);
    setError('');
  }

  function save() {
    if (!title.trim()) {
      setError('Give the item a title.');
      return;
    }
    if (toMin(end) <= toMin(start)) {
      setError('End time must be after the start time.');
      return;
    }
    const item: ScheduleItem = {
      id: editingId ?? Math.random().toString(36).slice(2, 10),
      tripId: activeTrip!.id,
      day,
      title: title.trim(),
      startMin: toMin(start),
      endMin: toMin(end),
      type,
    };
    if (editingId) updateScheduleItem(item);
    else addScheduleItem(item);
    reset();
  }

  function edit(item: ScheduleItem) {
    setEditingId(item.id);
    setTitle(item.title);
    setStart(toTime(item.startMin));
    setEnd(toTime(item.endMin));
    setType(item.type);
    setError('');
  }

  return (
    <div className="screen" style={{ maxWidth: 720 }}>
      <div className="section-head">
        <div>
          <div className="eyebrow">Days after landing · {activeTrip.destCity} local time</div>
          <h2 style={{ fontSize: 30, marginTop: 4 }}>Add my schedule</h2>
        </div>
      </div>
      <p className="muted" style={{ marginBottom: 22, maxWidth: '54ch' }}>
        Add anything fixed you have to be awake for. We will flag the ones that clash with your body clock and plan around them.
      </p>

      <div className="day-tabs" role="tablist" aria-label="Days after landing">
        {Array.from({ length: DAYS }).map((_, i) => {
          const d = i + 1;
          const count = schedule.filter((s) => s.tripId === activeTrip.id && s.day === d).length;
          return (
            <button
              key={d}
              role="tab"
              aria-selected={day === d}
              className={`day-tab ${day === d ? 'on' : ''}`}
              onClick={() => setDay(d)}
            >
              <span className="day-tab-num mono">Day {d}</span>
              {count > 0 && <span className="day-tab-count">{count}</span>}
            </button>
          );
        })}
      </div>

      <div className="card pad" style={{ marginBottom: 20 }}>
        <div className="schedule-form">
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="s-title">Title</label>
            <input
              id="s-title"
              className="input"
              value={title}
              placeholder="e.g. Client kickoff"
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="s-start">Start</label>
            <input id="s-start" type="time" className="input mono" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="s-end">End</label>
            <input id="s-end" type="time" className="input mono" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="s-type">Type</label>
            <select id="s-type" className="input" value={type} onChange={(e) => setType(e.target.value as ScheduleType)}>
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {error && (
          <p className="tiny danger" role="alert" style={{ marginTop: 10 }}>
            {error}
          </p>
        )}
        <div className="row gap-8" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
          {editingId && (
            <button className="btn-quiet" onClick={reset}>
              Cancel
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={save}>
            <Icon name={editingId ? 'check' : 'plus'} size={15} /> {editingId ? 'Save changes' : 'Add to Day ' + day}
          </button>
        </div>
      </div>

      <div className="stack" style={{ gap: 10 }}>
        {dayItems.length === 0 && (
          <div className="card pad muted small" style={{ textAlign: 'center', padding: 30 }}>
            Nothing scheduled for Day {day} yet. Add a commitment above, or keep it clear.
          </div>
        )}
        {dayItems.map((item) => {
          const conflict = conflicts.find((c) => c.itemId === item.id);
          const meta = TYPES.find((t) => t.value === item.type)!;
          return (
            <div className={`schedule-item ${conflict ? 'flagged' : ''}`} key={item.id}>
              <div className="si-time mono">
                {fmt(item.startMin)}<span className="si-to">to</span>{fmt(item.endMin)}
              </div>
              <div className="si-body">
                <div className="si-title">
                  <Icon name={meta.icon} size={15} /> {item.title}
                </div>
                <span className="badge-soft">{meta.label}</span>
                {conflict && (
                  <p className={`si-flag ${conflict.severity}`}>
                    <Icon name="info" size={13} /> {conflict.message}
                  </p>
                )}
              </div>
              <div className="si-actions">
                <button className="btn-quiet" onClick={() => edit(item)} aria-label={`Edit ${item.title}`}>
                  <Icon name="note" size={16} />
                </button>
                <button className="btn-quiet" onClick={() => deleteScheduleItem(item.id)} aria-label={`Delete ${item.title}`}>
                  <Icon name="trash" size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {conflicts.length > 0 && (
        <p className="tiny muted" style={{ marginTop: 18 }}>
          {conflicts.length} item{conflicts.length > 1 ? 's' : ''} clash with your body clock. Your recovery plan will still work around them.
        </p>
      )}

      <div className="row gap-12" style={{ marginTop: 24, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => navigate('itinerary')}>
          See my recovery plan <Icon name="arrow" size={16} />
        </button>
        <button className="btn btn-ghost" onClick={() => navigate('journey')}>
          Back to time zones
        </button>
      </div>
    </div>
  );
}
