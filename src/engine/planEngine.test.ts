import { describe, it, expect } from 'vitest';
import { buildPlan, currentItem, nextItem, type TripInput } from './planEngine';
import { parseLocalInput, getOffsetMinutes } from '../lib/time';

function makeInput(partial: Partial<TripInput> & Pick<TripInput, 'originTz' | 'destTz' | 'departure' | 'arrival'>): TripInput {
  return {
    bedtime: 23 * 60,
    wake: 7 * 60,
    caffeine: 'two_three',
    prep: 'balanced',
    stay: 'long',
    ...partial,
  };
}

const DEL = 'Asia/Kolkata';
const LHR = 'Europe/London';
const NYC = 'America/New_York';
const SIN = 'Asia/Singapore';

describe('plan engine — direction and shift', () => {
  it('DEL → LHR in winter is westbound ~5h30 behind', () => {
    const dep = parseLocalInput('2026-01-15T02:00', DEL)!;
    const arr = parseLocalInput('2026-01-15T07:00', LHR)!;
    const plan = buildPlan(makeInput({ originTz: DEL, destTz: LHR, departure: dep, arrival: arr }));
    expect(plan.direction).toBe('westbound');
    expect(plan.shiftMinutes).toBe(-330);
    expect(plan.strategyLine).toMatch(/Delay/i);
  });

  it('NYC → LHR is eastbound and advances the clock', () => {
    const dep = parseLocalInput('2026-01-15T18:00', NYC)!;
    const arr = parseLocalInput('2026-01-16T06:00', LHR)!;
    const plan = buildPlan(makeInput({ originTz: NYC, destTz: LHR, departure: dep, arrival: arr }));
    expect(plan.direction).toBe('eastbound');
    expect(plan.shiftMinutes).toBe(300);
  });

  it('SIN → NYC is treated as a ~11h eastbound shift (near twelve)', () => {
    const dep = parseLocalInput('2026-01-15T09:00', SIN)!;
    const arr = parseLocalInput('2026-01-15T14:00', NYC)!;
    const plan = buildPlan(makeInput({ originTz: SIN, destTz: NYC, departure: dep, arrival: arr }));
    expect(plan.direction).toBe('eastbound');
    expect(Math.abs(plan.shiftMinutes)).toBe(660);
    expect(plan.isNearTwelveHours).toBe(true);
  });

  it('is DST aware: London offset differs between winter and summer', () => {
    const winter = parseLocalInput('2026-01-15T12:00', LHR)!;
    const summer = parseLocalInput('2026-07-15T12:00', LHR)!;
    expect(getOffsetMinutes(winter, LHR)).toBe(0);
    expect(getOffsetMinutes(summer, LHR)).toBe(60);
    const dep = parseLocalInput('2026-07-15T02:00', DEL)!;
    const arr = parseLocalInput('2026-07-15T07:00', LHR)!;
    const plan = buildPlan(makeInput({ originTz: DEL, destTz: LHR, departure: dep, arrival: arr }));
    expect(plan.shiftMinutes).toBe(-270);
  });
});

describe('plan engine — strategies', () => {
  function plan(overrides: Partial<TripInput> = {}) {
    const dep = parseLocalInput('2026-01-15T02:00', DEL)!;
    const arr = parseLocalInput('2026-01-15T07:00', LHR)!;
    return buildPlan(makeInput({ originTz: DEL, destTz: LHR, departure: dep, arrival: arr, ...overrides }));
  }

  it('short stays stay on home time with no prep days', () => {
    const p = plan({ stay: 'short' });
    expect(p.strategy).toBe('stay-home');
    expect(p.prepDays).toBe(0);
    expect(p.dailyShiftMinutes).toBe(0);
  });

  it('crew mode becomes stay-anchored', () => {
    const p = plan({ crewMode: true });
    expect(p.strategy).toBe('stay-anchored');
    expect(p.strategyLine).toMatch(/anchored/i);
  });

  it('full prep starts 3 days out', () => {
    expect(plan({ prep: 'full' }).prepDays).toBe(3);
    expect(plan({ prep: 'balanced' }).prepDays).toBe(2);
    expect(plan({ prep: 'minimal', stay: 'long' }).prepDays).toBe(0);
  });
});

describe('plan engine — output integrity', () => {
  const dep = parseLocalInput('2026-01-15T02:00', DEL)!;
  const arr = parseLocalInput('2026-01-15T07:00', LHR)!;
  const p = buildPlan(makeInput({ originTz: DEL, destTz: LHR, departure: dep, arrival: arr }));

  it('produces all three phases with items', () => {
    expect(p.phases.before.length).toBeGreaterThan(0);
    expect(p.phases.air.length).toBeGreaterThan(0);
    expect(p.phases.after.length).toBeGreaterThan(0);
  });

  it('sorts every item chronologically', () => {
    for (let i = 1; i < p.items.length; i++) {
      expect(p.items[i].at).toBeGreaterThanOrEqual(p.items[i - 1].at);
    }
  });

  it('gives every item a title, why and learn-more', () => {
    for (const item of p.items) {
      expect(item.title.length).toBeGreaterThan(2);
      expect(item.why.length).toBeGreaterThan(5);
      expect(item.more.length).toBeGreaterThan(5);
      expect(item.id).toBeTruthy();
    }
  });

  it('never mentions medication, supplements or dosages', () => {
    const text = p.items.map((i) => `${i.title} ${i.why} ${i.more}`).join(' ').toLowerCase();
    for (const banned of ['melatonin', 'dosage', 'supplement', 'medication', 'pill']) {
      expect(text).not.toContain(banned);
    }
    expect(/\bmg\b/.test(text)).toBe(false);
  });

  it('builds an arc covering the 48h window with sleep and light blocks', () => {
    expect(p.arcSegments.length).toBeGreaterThan(0);
    for (const s of p.arcSegments) {
      expect(s.start).toBeGreaterThanOrEqual(0);
      expect(s.end).toBeLessThanOrEqual(2880);
    }
    expect(p.arcSegments.some((s) => s.type === 'sleep')).toBe(true);
    expect(p.arcSegments.some((s) => s.type === 'light')).toBe(true);
  });
});

describe('plan engine — layover and meeting', () => {
  it('adds layover guidance for connections over four hours', () => {
    const dep = parseLocalInput('2026-01-15T02:00', DEL)!;
    const layStart = parseLocalInput('2026-01-15T07:00', LHR)!;
    const layEnd = parseLocalInput('2026-01-15T12:00', LHR)!;
    const arr = parseLocalInput('2026-01-15T19:00', NYC)!;
    const p = buildPlan(
      makeInput({
        originTz: DEL,
        destTz: NYC,
        departure: dep,
        arrival: arr,
        layover: { city: 'London', code: 'LHR', tz: LHR, start: layStart, end: layEnd },
      }),
    );
    expect(p.items.some((i) => i.id.startsWith('layover'))).toBe(true);
  });

  it('flags meetings that fall in a likely low-energy window', () => {
    const dep = parseLocalInput('2026-01-15T02:00', DEL)!;
    const arr = parseLocalInput('2026-01-15T07:00', LHR)!;
    const meeting = parseLocalInput('2026-01-15T15:00', LHR)!;
    const p = buildPlan(makeInput({ originTz: DEL, destTz: LHR, departure: dep, arrival: arr, meetingAt: meeting }));
    const item = p.items.find((i) => i.id === 'after-meeting');
    expect(item).toBeTruthy();
  });
});

describe('current/next item helpers', () => {
  const dep = parseLocalInput('2026-01-15T02:00', DEL)!;
  const arr = parseLocalInput('2026-01-15T07:00', LHR)!;
  const p = buildPlan(makeInput({ originTz: DEL, destTz: LHR, departure: dep, arrival: arr }));

  it('finds the current and next item', () => {
    const mid = p.departure + 3600_000;
    const cur = currentItem(p.items, mid);
    expect(cur.current).toBeTruthy();
    expect(cur.current!.at).toBeLessThanOrEqual(mid);
    const nxt = nextItem(p.items, mid);
    if (nxt) expect(nxt.at).toBeGreaterThan(mid);
  });
});
