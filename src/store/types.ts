import type { CaffeineHabit, PrepLevel, StayLength } from '../engine/planEngine';

export interface Layover {
  city: string;
  code: string;
  tz: string;
  startISO: string;
  endISO: string;
}

export interface Trip {
  id: string;
  originId: string;
  destId: string;
  originCity: string;
  originCode: string;
  originTz: string;
  destCity: string;
  destCode: string;
  destTz: string;
  departureISO: string;
  arrivalISO: string;
  bedtime: number;
  wake: number;
  caffeine: CaffeineHabit;
  prep: PrepLevel;
  stay: StayLength;
  crewMode?: boolean;
  meetingAtISO?: string | null;
  layover?: Layover | null;
  createdAt: number;
  isDemo?: boolean;
  label?: string;
}

export interface Prefs {
  homeCityId: string;
  bedtime: number;
  wake: number;
  caffeine: CaffeineHabit;
  hour12: boolean;
  notifications: boolean;
}

export interface CheckIn {
  id: string;
  tripId: string;
  at: number;
  energy: number; // 1-5
  sleepiness: number; // 1-5
  mood: number; // 1-5
  sleepQuality: number; // 1-5
}

export interface RecoveryScore {
  id: string;
  tripId: string;
  at: number;
  score: number; // 1-5, "how settled do you feel"
}

export interface AppState {
  trips: Trip[];
  activeTripId: string | null;
  completed: Record<string, Record<string, boolean>>;
  packing: Record<string, Record<string, boolean>>;
  prefs: Prefs;
  checkins: CheckIn[];
  recovery: RecoveryScore[];
  dismissedTips: Record<string, boolean>;
  seededAt: number | null;
}
