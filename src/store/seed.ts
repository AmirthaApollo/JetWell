import { CITIES, findCity } from '../data/cities';
import { addDaysToParts, getZonedParts, zonedToInstant } from '../lib/time';
import type { Trip } from './types';
import type { TripInput } from '../engine/planEngine';

function futureLocal(dayOffset: number, hour: number, minute: number, tz: string): Date {
  const now = getZonedParts(new Date(), tz);
  const d = addDaysToParts(now.year, now.month, now.day, dayOffset);
  return zonedToInstant(d.year, d.month, d.day, hour, minute, tz);
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

interface SampleConfig {
  originId: string;
  destId: string;
  dayOffset: number;
  depHour: number;
  depMin: number;
  durationMin: number;
  stay: Trip['stay'];
  prep: Trip['prep'];
  isDemo?: boolean;
  label: string;
}

export const SAMPLE_CONFIGS: SampleConfig[] = [
  {
    originId: 'del',
    destId: 'lhr',
    dayOffset: 3,
    depHour: 2,
    depMin: 0,
    durationMin: 10 * 60 + 30,
    stay: 'medium',
    prep: 'balanced',
    isDemo: true,
    label: 'Delhi → London',
  },
  {
    originId: 'blr',
    destId: 'sfo',
    dayOffset: 9,
    depHour: 22,
    depMin: 30,
    durationMin: 20 * 60,
    stay: 'long',
    prep: 'full',
    label: 'Bengaluru → San Francisco',
  },
  {
    originId: 'nyc',
    destId: 'sin',
    dayOffset: 14,
    depHour: 20,
    depMin: 15,
    durationMin: 18 * 60 + 45,
    stay: 'long',
    prep: 'balanced',
    label: 'New York → Singapore',
  },
  {
    originId: 'lhr',
    destId: 'dxb',
    dayOffset: 6,
    depHour: 13,
    depMin: 40,
    durationMin: 6 * 60 + 50,
    stay: 'short',
    prep: 'minimal',
    label: 'London → Dubai',
  },
];

export function tripFromConfig(cfg: SampleConfig, createdAt = Date.now()): Trip {
  const o = findCity(cfg.originId) ?? CITIES[0];
  const d = findCity(cfg.destId) ?? CITIES[1];
  const departure = futureLocal(cfg.dayOffset, cfg.depHour, cfg.depMin, o.tz);
  const arrival = new Date(departure.getTime() + cfg.durationMin * 60000);
  return {
    id: cfg.isDemo ? 'demo-del-lhr' : uid(),
    originId: o.id,
    destId: d.id,
    originCity: o.city,
    originCode: o.code,
    originCountry: o.country,
    originTz: o.tz,
    destCity: d.city,
    destCode: d.code,
    destCountry: d.country,
    destTz: d.tz,
    departureISO: departure.toISOString(),
    arrivalISO: arrival.toISOString(),
    bedtime: 23 * 60,
    wake: 7 * 60,
    caffeine: 'two_three',
    prep: cfg.prep,
    stay: cfg.stay,
    createdAt,
    isDemo: cfg.isDemo,
    label: cfg.label,
  };
}

/** A finished return trip so the recovery curve and My Trips look alive. */
export function pastTrip(): Trip {
  const o = findCity('lhr')!;
  const d = findCity('del')!;
  const departure = futureLocal(-8, 21, 15, o.tz);
  const arrival = new Date(departure.getTime() + (8 * 60 + 45) * 60000);
  return {
    id: 'past-lhr-del',
    originId: o.id,
    destId: d.id,
    originCity: o.city,
    originCode: o.code,
    originCountry: o.country,
    originTz: o.tz,
    destCity: d.city,
    destCode: d.code,
    destCountry: d.country,
    destTz: d.tz,
    departureISO: departure.toISOString(),
    arrivalISO: arrival.toISOString(),
    bedtime: 23 * 60,
    wake: 7 * 60,
    caffeine: 'two_three',
    prep: 'balanced',
    stay: 'long',
    createdAt: departure.getTime() - 86400000,
    label: 'London → Delhi',
  };
}

export function seedTrips(): Trip[] {
  const demo = tripFromConfig(SAMPLE_CONFIGS[0]);
  const others = SAMPLE_CONFIGS.slice(1).map((c) => tripFromConfig(c));
  return [demo, ...others, pastTrip()];
}

export function tripToInput(trip: Trip): TripInput {
  const lows = trip.layovers ?? (trip.layover ? [trip.layover] : []);
  return {
    originTz: trip.originTz,
    destTz: trip.destTz,
    departure: new Date(trip.departureISO),
    arrival: new Date(trip.arrivalISO),
    bedtime: trip.bedtime,
    wake: trip.wake,
    caffeine: trip.caffeine,
    prep: trip.prep,
    stay: trip.stay,
    crewMode: trip.crewMode,
    meetingAt: trip.meetingAtISO ? new Date(trip.meetingAtISO) : null,
    layovers: lows.map((l) => ({
      city: l.city,
      code: l.code,
      tz: l.tz,
      start: new Date(l.startISO),
      end: new Date(l.endISO),
    })),
  };
}
