import {
  addDaysToParts,
  getOffsetMinutes,
  getZonedParts,
  zonedToInstant,
  formatDuration,
  formatTime,
} from '../lib/time';

export type Direction = 'eastbound' | 'westbound' | 'none';
export type PrepLevel = 'minimal' | 'balanced' | 'full';
export type StayLength = 'short' | 'medium' | 'long';
export type CaffeineHabit = 'none' | 'one' | 'two_three' | 'lots';
export type Phase = 'before' | 'air' | 'after';
export type ItemKind =
  | 'sleep'
  | 'light'
  | 'avoid-light'
  | 'caffeine'
  | 'hydrate'
  | 'meal'
  | 'move'
  | 'nap'
  | 'bed'
  | 'note'
  | 'rest';
export type StrategyKind = 'shift' | 'partial' | 'stay-home' | 'stay-anchored';

export interface LayoverInput {
  city: string;
  code: string;
  tz: string;
  start: Date;
  end: Date;
}

export interface TripInput {
  originTz: string;
  destTz: string;
  departure: Date;
  arrival: Date;
  bedtime: number; // minutes from local midnight
  wake: number; // minutes from local midnight
  caffeine: CaffeineHabit;
  prep: PrepLevel;
  stay: StayLength;
  crewMode?: boolean;
  meetingAt?: Date | null;
  /** One or more connections. */
  layovers?: LayoverInput[];
  /** @deprecated single-connection form, kept for compatibility */
  layover?: LayoverInput | null;
}

export interface PlanItem {
  id: string;
  phase: Phase;
  kind: ItemKind;
  title: string;
  why: string;
  more: string;
  at: number; // epoch ms
  endAt?: number;
  durationMin?: number;
  highlight?: boolean;
}

export interface ArcSegment {
  start: number; // minutes from anchor
  end: number;
  type: 'sleep' | 'light' | 'avoid' | 'awake';
}

export interface Plan {
  originTz: string;
  destTz: string;
  departure: number;
  arrival: number;
  flightMinutes: number;
  direction: Direction;
  rawShiftMinutes: number;
  shiftMinutes: number; // signed effective shift
  isNearTwelveHours: boolean;
  dailyShiftMinutes: number; // magnitude per day
  prepDays: number;
  strategy: StrategyKind;
  strategyLine: string;
  prepLine: string;
  phases: Record<Phase, PlanItem[]>;
  items: PlanItem[];
  arcAnchor: number; // dest local midnight of arrival day
  arcSegments: ArcSegment[];
}

const MIN = 60000;

const prepFactor: Record<PrepLevel, number> = { minimal: 0.5, balanced: 0.78, full: 1 };
const prepDaysFor: Record<PrepLevel, number> = { minimal: 0, balanced: 2, full: 3 };

function norm(minutes: number): number {
  return ((minutes % 1440) + 1440) % 1440;
}

function atLocal(
  base: { year: number; month: number; day: number },
  dayOffset: number,
  minutes: number,
  tz: string,
): number {
  const d = addDaysToParts(base.year, base.month, base.day, dayOffset);
  return zonedToInstant(d.year, d.month, d.day, Math.floor(minutes / 60), minutes % 60, tz).getTime();
}

/**
 * The core recommendation engine. Pure, deterministic and UI-free.
 */
export function buildPlan(input: TripInput): Plan {
  const { originTz, destTz } = input;
  const departure = input.departure.getTime();
  const arrival = input.arrival.getTime();
  const flightMinutes = Math.max(30, Math.round((arrival - departure) / MIN));

  // --- Direction & shift -------------------------------------------------
  const originOffset = getOffsetMinutes(input.departure, originTz);
  const destOffset = getOffsetMinutes(input.departure, destTz);
  const raw = destOffset - originOffset;
  let direction: Direction;
  let shift: number;
  if (raw > 720) {
    direction = 'westbound';
    shift = raw - 1440;
  } else if (raw < -720) {
    direction = 'eastbound';
    shift = raw + 1440;
  } else {
    direction = raw > 0 ? 'eastbound' : raw < 0 ? 'westbound' : 'none';
    shift = raw;
  }
  const nearTwelve = Math.abs(shift) >= 540;

  // --- Strategy ----------------------------------------------------------
  let strategy: StrategyKind = 'shift';
  if (input.crewMode) strategy = 'stay-anchored';
  else if (input.stay === 'short') strategy = 'stay-home';
  else if (input.stay === 'medium') strategy = 'partial';

  const prepDays = strategy === 'stay-home' || strategy === 'stay-anchored' ? 0 : prepDaysFor[input.prep];

  const baseRate = direction === 'westbound' ? 90 : 60; // minutes per day
  let dailyShift = Math.round(baseRate * prepFactor[input.prep]);
  if (strategy === 'partial') dailyShift = Math.round(dailyShift * 0.7);
  if (strategy === 'stay-home' || strategy === 'stay-anchored') dailyShift = 0;

  const cap = Math.min(Math.abs(shift), 180);
  dailyShift = Math.min(dailyShift, Math.max(30, cap));

  const strategyLine = buildStrategyLine(direction, shift, strategy, input.crewMode);
  const prepLine = buildPrepLine(input.prep, prepDays, strategy);

  // --- Phase builders ----------------------------------------------------
  const before: PlanItem[] = [];
  const air: PlanItem[] = [];
  const after: PlanItem[] = [];

  const depParts = getZonedParts(input.departure, originTz);
  const arrParts = getZonedParts(input.arrival, destTz);

  // Destination bedtime/wake instants on a given dest day offset.
  const destBed = (dayOffset: number) => atLocal(arrParts, dayOffset, input.bedtime, destTz);
  const destWake = (dayOffset: number) => atLocal(arrParts, dayOffset, input.wake, destTz);

  // ---- BEFORE -----------------------------------------------------------
  if (strategy === 'stay-anchored') {
    before.push({
      id: 'before-anchor',
      phase: 'before',
      kind: 'note',
      title: 'Stay anchored to one clock',
      why: 'Crossing zones often works best when you keep a single home-time rhythm instead of chasing every shift.',
      more:
        'Pick the clock you want to live on, usually home base, and protect your sleep window around the roster. Use light and meals to stay on that clock.',
      at: atLocal(depParts, -1, 20 * 60, originTz),
      highlight: true,
    });
    before.push({
      id: 'before-anchor-sleep',
      phase: 'before',
      kind: 'sleep',
      title: 'Protect your sleep window',
      why: 'Keeping one steady sleep block is the whole strategy when you travel constantly.',
      more: 'Blackout your room, keep a consistent wake time, and bank sleep before a long duty period.',
      at: atLocal(depParts, -1, input.bedtime, originTz),
      durationMin: Math.round(norm(input.wake - input.bedtime) / 60) * 60 || 420,
    });
  } else {
    for (let i = prepDays; i >= 1; i--) {
      const dayOffset = -i;
      const shiftSoFar = dailyShift * (prepDays - i + 1);
      const targetBed = norm(input.bedtime + (direction === 'eastbound' ? -shiftSoFar : shiftSoFar));
      before.push({
        id: `before-bed-${i}`,
        phase: 'before',
        kind: 'bed',
        title:
          direction === 'eastbound'
            ? `Lights out ${shiftSoFar} min earlier`
            : `Start winding down ${shiftSoFar} min later`,
        why:
          direction === 'eastbound'
            ? 'Moving bedtime earlier a little each night makes the early nights after landing far easier.'
            : 'Pushing bedtime later now means your body is already partway to destination time.',
        more:
          'Keep the shift small. 45 to 60 minutes a night is plenty. A gentle nudge, not a perfect schedule.',
        at: atLocal(depParts, dayOffset, targetBed, originTz),
      });

      // Light guidance, mornings.
      before.push({
        id: `before-light-${i}`,
        phase: 'before',
        kind: direction === 'eastbound' ? 'light' : 'avoid-light',
        title:
          direction === 'eastbound'
            ? 'Bright light soon after waking'
            : 'Dim light in the first hours after waking',
        why:
          direction === 'eastbound'
            ? 'Morning light helps pull your body clock earlier.'
            : 'Avoiding bright light early keeps your clock from holding you back from the delay you want.',
        more:
          direction === 'eastbound'
            ? 'Get outside or sit by a bright window for 20-30 minutes. Skip sunglasses.'
            : 'Keep the room dim, skip the bright window seat, and wear sunglasses outdoors if it is sunny.',
        at: atLocal(depParts, dayOffset, norm(input.wake + 30), originTz),
      });
    }

    if (prepDays === 0) {
      before.push({
        id: 'before-preflight',
        phase: 'before',
        kind: 'note',
        title: 'No prep needed, just travel well',
        why: 'You chose to keep this simple. A few small things on the day still help.',
        more: 'Pack light, eat normally, and avoid caffeine after early afternoon on your travel day.',
        at: atLocal(depParts, -1, 18 * 60, originTz),
      });
    }

    // Pre-flight kit (day before).
    before.push({
      id: 'before-kit',
      phase: 'before',
      kind: 'note',
      title: 'Pack a simple sleep kit',
      why: 'A few small items make the flight and first nights much easier.',
      more: 'Eye mask, earplugs, a water bottle and a light layer. That is usually enough.',
      at: atLocal(depParts, -1, 20 * 60, originTz),
    });
    before.push({
      id: 'before-hydrate',
      phase: 'before',
      kind: 'hydrate',
      title: 'Hydrate, and go easy on alcohol',
      why: 'Plane air is drying, and alcohol fragments the sleep you are trying to protect.',
      more: 'Water, herbal tea or juice. If you drink, keep it light and early on the flight.',
      at: atLocal(depParts, 0, Math.max(0, Math.round((departure - atLocal(depParts, 0, 0, originTz)) / MIN) - 180), originTz),
    });
  }

  // ---- IN THE AIR -------------------------------------------------------
  if (strategy === 'stay-anchored') {
    air.push({
      id: 'air-anchor-sleep',
      phase: 'air',
      kind: 'sleep',
      title: 'Sleep if it falls in your anchored night',
      why: 'Keep your chosen clock: sleep when it is night at that zone, even if the cabin lights are on.',
      more: 'Eye mask and earplugs let you sleep on your own clock.',
      at: departure + Math.round(flightMinutes * 0.35) * MIN,
      durationMin: 300,
    });
    air.push({
      id: 'air-anchor-wake',
      phase: 'air',
      kind: 'move',
      title: 'Stay awake and move if it is your daytime',
      why: 'Treat the flight as an ordinary day on your anchored clock.',
      more: 'Stand, stretch and keep water nearby.',
      at: departure + Math.round(flightMinutes * 0.7) * MIN,
    });
  } else {
    air.push({
      id: 'air-watch',
      phase: 'air',
      kind: 'note',
      title: 'Set your watch to destination time',
      why: 'Your body follows your attention. Start living on destination time the moment you board.',
      more: 'Change your phone too, and think about what you would normally be doing at that hour back home.',
      at: departure + 10 * MIN,
    });

    air.push({
      id: 'air-meal',
      phase: 'air',
      kind: 'meal',
      title: 'Eat the first meal on destination time',
      why: 'Meals are a powerful timing signal. Shifting them early helps your body follow.',
      more: 'Nothing heroic. Eat when destination people eat, and skip a meal if it lands at a strange hour.',
      at: departure + 75 * MIN,
    });

    // Caffeine cutoff relative to destination bedtime.
    const cutoff = destBed(0) - 7 * 60 * MIN;
    if (input.caffeine !== 'none' && cutoff > departure && cutoff < arrival) {
      air.push({
        id: 'air-caffeine',
        phase: 'air',
        kind: 'caffeine',
        title: 'Last coffee now',
        why: 'Caffeine lingers for hours. Stopping about seven hours before target bedtime protects your first night.',
        more: 'This is your cut-off on the flight. After this, water or nothing caffeinated.',
        at: cutoff,
        highlight: true,
      });
    } else if (input.caffeine !== 'none') {
      air.push({
        id: 'air-caffeine-note',
        phase: 'air',
        kind: 'caffeine',
        title: 'Keep caffeine modest',
        why: 'A small, planned coffee can help you stay awake in the destination afternoon.',
        more: 'Avoid caffeine within several hours of your target bedtime.',
        at: departure + 150 * MIN,
      });
    }

    // Sleep window mapped to destination night when it overlaps the flight.
    const nightStart = destBed(-1);
    const nightEnd = destWake(0);
    const sleepStart = Math.max(departure, nightStart);
    const sleepEnd = Math.min(arrival, nightEnd);
    if (sleepEnd - sleepStart > 90 * MIN) {
      air.push({
        id: 'air-sleep',
        phase: 'air',
        kind: 'sleep',
        title: 'Sleep on the plane',
        why: 'This window lines up with destination night, so sleeping now starts the shift before you land.',
        more: 'Eye mask on, window shade down, phone on a short alarm. Even a couple of hours counts.',
        at: sleepStart,
        endAt: sleepEnd,
        durationMin: Math.round((sleepEnd - sleepStart) / MIN),
        highlight: true,
      });
      air.push({
        id: 'air-wake',
        phase: 'air',
        kind: 'rest',
        title: 'Wake and get light near landing',
        why: 'Waking into daylight helps you land on the right foot.',
        more: 'Open the shade on the destination morning, or use cabin light if it is still dark.',
        at: Math.max(sleepEnd, arrival - 90 * MIN),
      });
    } else {
      air.push({
        id: 'air-stayawake',
        phase: 'air',
        kind: 'move',
        title: 'Mostly stay awake and move',
        why: 'On this timing, sleeping now would work against your shift.',
        more: 'Stand, stretch, walk the aisle when it is safe. Stir occasionally.',
        at: departure + Math.round(flightMinutes * 0.4) * MIN,
      });
      air.push({
        id: 'air-rest',
        phase: 'air',
        kind: 'rest',
        title: 'If tired, rest briefly, no long sleep',
        why: 'A short doze takes the edge off without spoiling your landing night.',
        more: 'Keep it under 30 minutes and before the last few hours of the flight.',
        at: arrival - 150 * MIN,
      });
    }

    air.push({
      id: 'air-water',
      phase: 'air',
      kind: 'hydrate',
      title: 'Keep hydrating',
      why: 'Steady water helps with headaches and grogginess on landing.',
      more: 'A glass an hour rather than a lot at once.',
      at: departure + Math.round(flightMinutes * 0.55) * MIN,
    });

    air.push({
      id: 'air-shade',
      phase: 'air',
      kind: direction === 'eastbound' ? 'light' : 'avoid-light',
      title: direction === 'eastbound' ? 'Open the shade on approach' : 'Keep it dim on approach',
      why:
        direction === 'eastbound'
          ? 'You want light at the destination morning to pull your clock earlier.'
          : 'You want to hold onto evening dimness so your clock can drift later.',
      more: 'Match what destination locals see at that hour.',
      at: arrival - 45 * MIN,
    });
  }

  // ---- LAYOVER(S) -------------------------------------------------------
  // Each connection gets its own light, movement and optional rest guidance.
  const layovers = input.layovers ?? (input.layover ? [input.layover] : []);
  layovers.forEach((lo, idx) => {
    const loStart = lo.start.getTime();
    const loEnd = lo.end.getTime();
    const loMinutes = Math.round((loEnd - loStart) / MIN);
    const tag = `lo${idx}`;
    if (loMinutes >= 240) {
      air.push({
        id: `layover-light-${tag}`,
        phase: 'air',
        kind: 'light',
        title: `Get light and move in ${lo.city}`,
        why: 'A long connection is a chance to reset with daylight and a walk, not just sit.',
        more: 'Find a window or step outside if your bags and the airport allow. 15 minutes is enough.',
        at: loStart + 20 * MIN,
        highlight: true,
      });
      air.push({
        id: `layover-move-${tag}`,
        phase: 'air',
        kind: 'move',
        title: `Walk the terminal in ${lo.city}`,
        why: 'Movement keeps energy up and stiffness down on a long journey.',
        more: 'A slow 10-minute lap, water on the way.',
        at: loStart + Math.round(loMinutes * 0.45) * MIN,
      });
      if (loMinutes >= 300) {
        air.push({
          id: `layover-rest-${tag}`,
          phase: 'air',
          kind: 'nap',
          title: `A short rest in ${lo.city}`,
          why: 'A brief, planned nap is better than drifting off randomly and missing your flight.',
          more: 'Set a loud alarm. Keep it under 30 minutes.',
          at: loStart + Math.round(loMinutes * 0.6) * MIN,
          durationMin: 30,
        });
      }
    } else if (loMinutes > 0) {
      air.push({
        id: `layover-quick-${tag}`,
        phase: 'air',
        kind: 'note',
        title: `Quick connection in ${lo.city}`,
        why: 'Too short to plan around. Stay hydrated and keep moving.',
        more: 'Grab water on the way to the next gate.',
        at: loStart,
      });
    }
  });

  // ---- AFTER LANDING ----------------------------------------------------
  const dayOfArrival = 0;

  // Daylight, the most important item.
  const lightWindow = direction === 'eastbound' ? [6 * 60 + 30, 10 * 60 + 30] : [16 * 60, 20 * 60];
  const dayStart = atLocal(arrParts, 0, 0, destTz);
  const arrivalMin = Math.round((arrival - dayStart) / MIN);
  let lightInstant = atLocal(arrParts, dayOfArrival, lightWindow[0], destTz);
  if (arrivalMin < lightWindow[1]) {
    lightInstant = Math.max(arrival + 20 * MIN, atLocal(arrParts, 0, lightWindow[0], destTz));
    if (lightInstant > atLocal(arrParts, 0, lightWindow[1], destTz)) {
      lightInstant = atLocal(arrParts, 1, lightWindow[0], destTz);
    }
  }
  after.push({
    id: 'after-light',
    phase: 'after',
    kind: 'light',
    title: direction === 'eastbound' ? 'Get morning light, soon' : 'Get evening light today',
    why:
      direction === 'eastbound'
        ? 'Morning light at your destination is the single most useful thing for shifting earlier.'
        : 'Evening light helps push your clock later, which is the direction you need.',
    more: 'Step outside for 15-30 minutes without sunglasses. The most important thing you can do today.',
    at: lightInstant,
    highlight: true,
  });

  // Avoid the opposite light.
  after.push({
    id: 'after-avoid',
    phase: 'after',
    kind: 'avoid-light',
    title: direction === 'eastbound' ? 'Avoid bright light late evening' : 'Avoid bright light first thing',
    why:
      direction === 'eastbound'
        ? 'Evening light pulls your clock the wrong way when you are trying to move earlier.'
        : 'Morning light will anchor you to the old clock. Keep it dim.',
    more: 'Dim lamps, lower screens, and wear sunglasses outdoors at the wrong time of day.',
    at:
      direction === 'eastbound'
        ? atLocal(arrParts, 0, 21 * 60, destTz)
        : atLocal(arrParts, 1, 7 * 60, destTz),
  });

  // First meal on destination time.
  after.push({
    id: 'after-meal',
    phase: 'after',
    kind: 'meal',
    title: 'Eat your next meal on local time',
    why: 'Meals set your body clock almost as strongly as light.',
    more: 'Eat when locals eat, even if you are not very hungry. A light, normal meal is ideal.',
    at: Math.max(arrival + 60 * MIN, atLocal(arrParts, 0, 12 * 60, destTz)),
  });

  // Gentle movement.
  after.push({
    id: 'after-move',
    phase: 'after',
    kind: 'move',
    title: 'Take a short walk',
    why: 'Gentle movement lifts energy and pairs well with daylight.',
    more: 'A 10-20 minute stroll outside.',
    at: lightInstant + 45 * MIN,
  });

  // Nap rules.
  after.push({
    id: 'after-nap',
    phase: 'after',
    kind: 'nap',
    title: 'If you nap, keep it short',
    why: 'A short, early nap takes the edge off without pushing tonight’s sleep away.',
    more: 'Under 30 minutes, and before 3pm local. Set an alarm.',
    at: atLocal(arrParts, 0, 13 * 60, destTz),
  });

  // Target bedtime night one.
  after.push({
    id: 'after-bed',
    phase: 'after',
    kind: 'bed',
    title: 'Target bedtime tonight',
    why: 'Anchoring tonight to local bedtime stops the drift before it starts.',
    more: 'Wind down an hour before. Dim lights, no big meals, phone away.',
    at: destBed(0) > arrival ? destBed(0) : destBed(1),
    highlight: true,
  });

  // Day 2 & 3 mini recovery.
  after.push({
    id: 'after-day2',
    phase: 'after',
    kind: 'note',
    title: 'Day 2 & 3: keep the rhythm',
    why: 'Most of the adjustment happens in the first three days. Repetition does the work.',
    more:
      direction === 'eastbound'
        ? 'Morning light each day, avoid late-evening brightness, keep naps short, and hold your local bedtime.'
        : 'Late-afternoon and evening light each day, dim mornings, and hold your local wake time.',
    at: atLocal(arrParts, 1, direction === 'eastbound' ? 7 * 60 + 30 : 17 * 60, destTz),
  });

  // Meeting-aware tip.
  if (input.meetingAt) {
    const mLocal = getZonedParts(input.meetingAt, destTz);
    const lowWindow = direction === 'eastbound' ? [13 * 60, 17 * 60] : [3 * 60, 9 * 60];
    const inLow = mLocal.hour * 60 + mLocal.minute >= lowWindow[0] && mLocal.hour * 60 + mLocal.minute <= lowWindow[1];
    after.push({
      id: 'after-meeting',
      phase: 'after',
      kind: 'note',
      title: inLow ? 'Heads-up: your meeting lands in a low patch' : 'Your meeting timing looks workable',
      why: inLow
        ? 'That slot often falls in the groggiest part of the adjustment.'
        : 'That slot tends to sit outside the usual dip.',
      more: inLow
        ? 'A short walk in daylight beforehand, water, and a small planned coffee earlier, not right before.'
        : 'Keep your normal rhythm that day and get light as planned.',
      at: input.meetingAt.getTime() - 60 * MIN,
      highlight: inLow,
    });
  }

  // --- Assemble ----------------------------------------------------------
  const phases = { before, air, after };
  const items = [...before, ...air, ...after].sort((a, b) => a.at - b.at);

  const arcAnchor = atLocal(arrParts, 0, 0, destTz);
  const arcSegments = buildArcSegments(input, direction);

  return {
    originTz,
    destTz,
    departure,
    arrival,
    flightMinutes,
    direction,
    rawShiftMinutes: raw,
    shiftMinutes: shift,
    isNearTwelveHours: nearTwelve,
    dailyShiftMinutes: dailyShift,
    prepDays,
    strategy,
    strategyLine,
    prepLine,
    phases,
    items,
    arcAnchor,
    arcSegments,
  };
}

function buildStrategyLine(
  direction: Direction,
  shift: number,
  strategy: StrategyKind,
  crewMode?: boolean,
): string {
  const amount = formatDuration(Math.abs(shift));
  if (crewMode) {
    return `Stay anchored to home time. You cross zones constantly, so the goal is a steady rhythm, not a full shift.`;
  }
  if (strategy === 'stay-home') {
    return `Stay on home time. Your trip is short, so it is not worth shifting. Get through it and recover when you get back.`;
  }
  if (direction === 'none') {
    return `No time zone change. Hold your normal routine and arrive fresh.`;
  }
  const verb = direction === 'eastbound' ? 'Advance' : 'Delay';
  const dir = direction === 'eastbound' ? 'Eastbound' : 'Westbound';
  const flavor =
    direction === 'eastbound'
      ? 'mostly: get morning light, dim the evening, and move bedtime earlier.'
      : 'mostly: stay up later, get evening light, and dim the morning.';
  const partial = strategy === 'partial' ? ' A partial shift, since your stay is on the shorter side.' : '';
  return `${verb} your body clock by about ${amount}. ${dir}, so ${flavor}${partial}`;
}

function buildPrepLine(prep: PrepLevel, prepDays: number, strategy: StrategyKind): string {
  if (strategy === 'stay-home') return 'No pre-flight shifting. Keep your normal rhythm.';
  if (strategy === 'stay-anchored') return 'No shifting. Protect one clock.';
  if (prepDays === 0) return 'Starting on your travel day. No earlier prep needed.';
  const labels: Record<PrepLevel, string> = {
    minimal: 'a light start',
    balanced: 'a balanced start',
    full: 'a full start',
  };
  return `${prepDays} day${prepDays > 1 ? 's' : ''} out, ${labels[prep]}.`;
}

function buildArcSegments(input: TripInput, direction: Direction): ArcSegment[] {
  const segs: ArcSegment[] = [];
  const span = 48 * 60;
  const bed = input.bedtime;
  const wake = input.wake;
  for (let d = 0; d < 2; d++) {
    const dayStart = d * 1440;
    // sleep block (may wrap past midnight)
    const sleepStart = dayStart + bed;
    const sleepEnd = dayStart + (wake < bed ? wake + 1440 : wake);
    segs.push({ start: sleepStart, end: sleepEnd, type: 'sleep' });

    const light = direction === 'eastbound' ? [dayStart + 390, dayStart + 630] : [dayStart + 960, dayStart + 1200];
    const avoid = direction === 'eastbound' ? [dayStart + 1230, dayStart + 1410] : [dayStart + 360, dayStart + 600];
    segs.push({ start: light[0], end: light[1], type: 'light' });
    segs.push({ start: avoid[0], end: avoid[1], type: 'avoid' });
  }
  // clamp to span
  return segs
    .map((s) => ({ ...s, start: Math.max(0, s.start), end: Math.min(span, s.end) }))
    .filter((s) => s.end > s.start)
    .sort((a, b) => a.start - b.start);
}

/** Returns the item that is "current" at `now`, plus the next ones. */
export function currentItem(items: PlanItem[], now: number): { current: PlanItem | null; index: number } {
  let idx = -1;
  for (let i = 0; i < items.length; i++) {
    if (items[i].at <= now) idx = i;
    else break;
  }
  return { current: idx >= 0 ? items[idx] : null, index: idx };
}

export function nextItem(items: PlanItem[], now: number): PlanItem | null {
  return items.find((i) => i.at > now) ?? null;
}

/* ==========================================================================
 * SCHEDULE
 * The traveller can add fixed commitments (meetings, classes, events) for the
 * days after landing. These are stored in destination local time and the
 * engine flags any that land in the body's biological night.
 * ========================================================================== */

export type ScheduleType = 'meeting' | 'class' | 'event' | 'free';

export interface ScheduleItem {
  id: string;
  tripId: string;
  day: number; // 1-based day after landing
  title: string;
  startMin: number; // minutes from destination local midnight
  endMin: number;
  type: ScheduleType;
}

export interface ScheduleConflict {
  itemId: string;
  severity: 'warn' | 'info';
  message: string;
}

/**
 * Compute the absolute instant of a schedule item, anchored to destination
 * local midnight on the day of arrival. Pure and DST-aware.
 */
export function scheduleItemInstant(item: ScheduleItem, arrival: number, destTz: string): number {
  const arrParts = getZonedParts(new Date(arrival), destTz);
  const day = addDaysToParts(arrParts.year, arrParts.month, arrParts.day, item.day - 1);
  const minute = item.startMin;
  return zonedToInstant(day.year, day.month, day.day, Math.floor(minute / 60), minute % 60, destTz).getTime();
}

/**
 * Flag commitments that fall during the body clock's night at home, or very
 * early destination mornings, with a gentle suggestion.
 */
export function evaluateSchedule(
  items: ScheduleItem[],
  opts: { arrival: number; destTz: string; originTz: string },
): ScheduleConflict[] {
  const out: ScheduleConflict[] = [];
  for (const it of items) {
    const at = scheduleItemInstant(it, opts.arrival, opts.destTz);
    const home = getZonedParts(new Date(at), opts.originTz);
    const homeMin = home.hour * 60 + home.minute;
    const bioNight = homeMin >= 23 * 60 || homeMin < 6 * 60;
    const localHour = Math.floor(it.startMin / 60);
    if (bioNight) {
      out.push({
        itemId: it.id,
        severity: 'warn',
        message: `${it.title} at ${padTime(it.startMin)} falls during your biological night (about ${formatTime(
          new Date(at),
          opts.originTz,
        )} at home). Consider a short nap before it.`,
      });
    } else if (localHour < 7) {
      out.push({
        itemId: it.id,
        severity: 'info',
        message: `${it.title} is an early start. Get daylight first and keep the morning simple.`,
      });
    }
  }
  return out;
}

function padTime(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/* ==========================================================================
 * EATING
 * Meal timing nudged toward destination local time, attached per day.
 * ========================================================================== */

export interface MealTip {
  day: number;
  at: number; // instant of the first meal suggestion
  title: string;
  text: string;
}

export const EATING_TIPS: string[] = [
  'Lighter meals on arrival night. Big dinners sit badly on a confused body clock.',
  'Hydrate steadily through the day. Water, not just coffee.',
  'Limit alcohol and heavy meals close to bedtime.',
  'Get protein early in the local day to steady your energy.',
  'Caffeine cut-off: about 8 hours before your target bedtime.',
];

/** Build one meal-timing card for each day after landing. */
export function mealTips(opts: { arrival: number; destTz: string; dayCount: number }): MealTip[] {
  const arrParts = getZonedParts(new Date(opts.arrival), opts.destTz);
  const tips: MealTip[] = [];
  for (let d = 1; d <= opts.dayCount; d++) {
    const day = addDaysToParts(arrParts.year, arrParts.month, arrParts.day, d - 1);
    const at = zonedToInstant(day.year, day.month, day.day, 8, 0, opts.destTz).getTime();
    tips.push({
      day: d,
      at,
      title: d === 1 ? 'Day 1: eat lightly' : `Day ${d}: eat on local time`,
      text:
        d === 1
          ? 'Breakfast 8am, lunch 1pm, dinner 7pm local. Keep it light tonight even if you are not hungry.'
          : 'Breakfast 8am, lunch 1pm, dinner 7pm local. Protein early, lighter dinner.',
    });
  }
  return tips;
}

