import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from '../router';
import { useStore } from '../store/store';
import { useNow, useReducedMotion } from '../components/hooks';
import { useToast } from '../components/Toast';
import { BoardingPass } from '../components/BoardingPass';
import { DayArc } from '../components/DayArc';
import { ItemCard } from '../components/ItemCard';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';
import { buildPlan, currentItem, nextItem, type Phase } from '../engine/planEngine';
import { tripToInput } from '../store/seed';
import { formatDuration } from '../lib/time';
import { planToText, planToIcs, downloadFile, tripTitle } from '../lib/export';
import { PACKING_LIST } from '../lib/packing';
import type { PlanItem } from '../engine/planEngine';

const PHASE_META: Record<Phase, { title: string; sub: (p: ReturnType<typeof buildPlan>) => string }> = {
  before: {
    title: 'Before you fly',
    sub: (p) => (p.prepDays > 0 ? `${p.prepDays} day${p.prepDays > 1 ? 's' : ''} out` : 'Travel day'),
  },
  air: { title: 'In the air', sub: (p) => formatDuration(p.flightMinutes) + ' flight' },
  after: { title: 'After you land', sub: () => 'First three days' },
};

const PAGE_SIZE = 5;

export function Itinerary() {
  const { navigate } = useRouter();
  const { activeTrip, prefs, isDone, toggleItem, togglePacking, isPacked, returnTrip, trips } = useStore();
  const { push } = useToast();
  const now = useNow(30000);
  const reduced = useReducedMotion();
  const [mode, setMode] = useState<'dest' | 'home'>('dest');
  const [packOpen, setPackOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const refs = useRef<Record<string, HTMLElement | null>>({});
  const scrolled = useRef(false);

  const plan = useMemo(() => (activeTrip ? buildPlan(tripToInput(activeTrip)) : null), [activeTrip]);

  const current = plan ? currentItem(plan.items, now) : { current: null, index: -1 };
  const upcoming = plan ? nextItem(plan.items, now) : null;

  useEffect(() => {
    if (!plan || scrolled.current) return;
    if (now >= plan.departure - 6 * 3600000 && current.current) {
      scrolled.current = true;
      const el = refs.current[current.current.id];
      if (el) {
        window.setTimeout(() => {
          el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
        }, 350);
      }
    }
  }, [plan, now, current.current, reduced]);

  if (!activeTrip || !plan) {
    return (
      <div className="screen">
        <div className="card pad" style={{ textAlign: 'center', padding: 48 }}>
          <h2 style={{ fontSize: 30, marginBottom: 10 }}>No trip yet</h2>
          <p className="muted" style={{ marginBottom: 22 }}>
            Add a flight and we'll build the plan.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('plan')}>
            Plan my trip <Icon name="arrow" size={17} />
          </button>
        </div>
      </div>
    );
  }

  const primaryTz = mode === 'dest' ? activeTrip.destTz : activeTrip.originTz;
  const secondaryTz = mode === 'dest' ? activeTrip.originTz : activeTrip.destTz;
  const secondaryLabel = mode === 'dest' ? 'home' : 'dest';

  const returnExists = trips.some(
    (t) => t.originId === activeTrip.destId && t.destId === activeTrip.originId && t.id !== activeTrip.id,
  );

  function share() {
    const text = planToText(plan!, activeTrip!, prefs.hour12);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => push({ title: 'Plan copied', body: 'Paste it anywhere — notes, chat, email.', icon: 'copy' }),
        () => push({ title: 'Could not copy', body: 'Try the print view instead.', icon: 'info' }),
      );
    } else {
      push({ title: 'Copy unavailable', body: 'Try the print view instead.', icon: 'info' });
    }
  }

  const nowIndex = plan.items.findIndex((i) => i.at > now);

  return (
    <div className="screen wide">
      <div className="between row" style={{ marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="eyebrow">{activeTrip.label ?? `${activeTrip.originCity} → ${activeTrip.destCity}`}</div>
          <h2 style={{ fontSize: 30, marginTop: 4 }}>Your recovery plan</h2>
        </div>
        <div className="bpass-actions">
          <button className="btn btn-ghost btn-sm" onClick={share} aria-label="Copy plan as text">
            <Icon name="share" size={15} /> Share
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => window.print()} aria-label="Print itinerary">
            <Icon name="print" size={15} /> Print
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              downloadFile(`${tripTitle(activeTrip)}.ics`, planToIcs(plan, activeTrip), 'text/calendar');
              push({ title: 'Calendar file downloaded', body: 'Import it to get reminders.', icon: 'download' });
            }}
          >
            <Icon name="download" size={15} /> .ics
          </button>
        </div>
      </div>

      {current.current && upcoming && (
        <button className="sticky-now" onClick={() => navigate('now')}>
          <span className="nm-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--sand)' }} />
          Now: {upcoming.title} · in {formatDuration((upcoming.at - now) / 60000)}
        </button>
      )}

      <BoardingPass trip={activeTrip} plan={plan} hour12={prefs.hour12} />

      <div className="between row" style={{ margin: '20px 0 0', flexWrap: 'wrap', gap: 12 }}>
        <span className="eyebrow">Times shown in</span>
        <div className="segmented" role="group" aria-label="Time zone display">
          <button className={mode === 'dest' ? 'on' : ''} onClick={() => setMode('dest')} aria-pressed={mode === 'dest'}>
            {activeTrip.destCity} time
          </button>
          <button className={mode === 'home' ? 'on' : ''} onClick={() => setMode('home')} aria-pressed={mode === 'home'}>
            {activeTrip.originCity} time
          </button>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <DayArc plan={plan} now={now} hour12={prefs.hour12} />
      </div>

      <div className="between row" style={{ marginTop: 20, flexWrap: 'wrap', gap: 12 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setPackOpen(true)}>
          <Icon name="note" size={15} /> Recovery packing list
        </button>
        {!returnExists && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              returnTrip(activeTrip.id);
              push({ title: 'Return trip added', body: 'We planned the flight home too.', icon: 'plane' });
              navigate('trips');
            }}
          >
            <Icon name="refresh" size={15} /> Add the return flight
          </button>
        )}
      </div>

      <div className="timeline">
        {(['before', 'air', 'after'] as Phase[]).map((phase) => {
          const all = plan.phases[phase];
          const shown = expanded[phase] ? all : all.slice(0, PAGE_SIZE);
          const markerBefore = phase === 'before' ? 0 : phase === 'air' ? plan.phases.before.length : plan.phases.before.length + plan.phases.air.length;
          return (
            <section className="phase" key={phase} aria-label={PHASE_META[phase].title}>
              <div className="phase-head">
                <span className="ph-dot" />
                <h3>{PHASE_META[phase].title}</h3>
                <div className="phase-rule" />
                <span className="ph-sub">{PHASE_META[phase].sub(plan)}</span>
              </div>
              <div className="stack" style={{ gap: 8 }}>
                {shown.map((item: PlanItem, i: number) => {
                  const globalIndex = markerBefore + i;
                  const showMarker = nowIndex === globalIndex && nowIndex !== -1;
                  const done = isDone(activeTrip.id, item.id);
                  const missed = item.at < now && !done && item.kind !== 'note';
                  return (
                    <div key={item.id}>
                      {showMarker && (
                        <div className="now-marker" aria-label="Current position in the plan">
                          <span className="nm-dot" />
                          <span className="nm-label">Now</span>
                          <span className="nm-line" />
                        </div>
                      )}
                      <ItemCard
                        item={item}
                        primaryTz={primaryTz}
                        secondaryTz={secondaryTz}
                        secondaryLabel={secondaryLabel}
                        hour12={prefs.hour12}
                        done={done}
                        missed={missed && !item.highlight}
                        onToggle={() => toggleItem(activeTrip.id, item.id)}
                        innerRef={(el) => {
                          refs.current[item.id] = el;
                        }}
                      />
                    </div>
                  );
                })}
                {all.length > PAGE_SIZE && (
                  <button
                    className="btn-quiet show-more"
                    onClick={() => setExpanded((e) => ({ ...e, [phase]: !e[phase] }))}
                    aria-expanded={Boolean(expanded[phase])}
                  >
                    {expanded[phase] ? 'Show less' : `Show ${all.length - PAGE_SIZE} more`}
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <p className="footer-note" style={{ marginTop: 40 }}>
        Jetlagged offers general wellness guidance and is not a medical device or diagnostic tool. For sleep aids or
        medication, check with a pharmacist or doctor.
      </p>

      <Modal open={packOpen} onClose={() => setPackOpen(false)} title="Recovery packing list" sheetOnMobile>
        <p className="muted small" style={{ marginBottom: 16 }}>
          Short and simple. Tick as you pack.
        </p>
        <div className="stack" style={{ gap: 8 }}>
          {PACKING_LIST.map((p) => {
            const on = isPacked(activeTrip.id, p.id);
            return (
              <button key={p.id} className={`pack-item ${on ? 'on' : ''}`} onClick={() => togglePacking(activeTrip.id, p.id)} aria-pressed={on}>
                <Icon name={p.icon} size={18} />
                <span className="pk-label" style={{ flex: 1 }}>
                  {p.label}
                </span>
                <span className={`k-ico k-${on ? 'light' : 'note'}`} style={{ width: 26, height: 26 }}>
                  {on ? <Icon name="check" size={14} /> : <Icon name="plus" size={14} />}
                </span>
              </button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
