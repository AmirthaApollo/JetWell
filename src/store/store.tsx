import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { AppState, CheckIn, Prefs, RecoveryScore, ScheduleItem, Trip } from './types';
import { seedTrips, uid } from './seed';

const KEY = 'jetwell:v1';

const defaultPrefs: Prefs = {
  homeCityId: 'del',
  bedtime: 23 * 60,
  wake: 7 * 60,
  caffeine: 'two_three',
  hour12: false,
  notifications: true,
};

const defaultRecovery = (trips: Trip[]): RecoveryScore[] => {
  const past = trips.find((t) => t.id === 'past-lhr-del');
  if (!past) return [];
  const arr = new Date(past.arrivalISO).getTime();
  const scores = [1, 2, 4, 4, 5, 5];
  return scores.map((score, i) => ({
    id: `seed-rec-${i}`,
    tripId: past.id,
    at: arr + i * 86400000,
    score,
  }));
};

function freshState(): AppState {
  const trips = seedTrips();
  return {
    trips,
    activeTripId: 'demo-del-lhr',
    completed: {},
    packing: {},
    schedule: [],
    prefs: defaultPrefs,
    checkins: [],
    recovery: defaultRecovery(trips),
    dismissedTips: {},
    seededAt: Date.now(),
  };
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed.trips || !Array.isArray(parsed.trips) || parsed.trips.length === 0) return freshState();
    return { ...freshState(), ...parsed, prefs: { ...defaultPrefs, ...parsed.prefs } };
  } catch {
    return freshState();
  }
}

interface StoreValue extends AppState {
  activeTrip: Trip | null;
  setActive: (id: string | null) => void;
  addTrip: (trip: Trip) => void;
  updateTrip: (trip: Trip) => void;
  deleteTrip: (id: string) => void;
  duplicateTrip: (id: string) => Trip | null;
  returnTrip: (id: string) => Trip | null;
  toggleItem: (tripId: string, itemId: string) => void;
  setItemDone: (tripId: string, itemId: string, done: boolean) => void;
  isDone: (tripId: string, itemId: string) => boolean;
  togglePacking: (tripId: string, itemId: string) => void;
  isPacked: (tripId: string, itemId: string) => boolean;
  updatePrefs: (patch: Partial<Prefs>) => void;
  addScheduleItem: (item: ScheduleItem) => void;
  updateScheduleItem: (item: ScheduleItem) => void;
  deleteScheduleItem: (id: string) => void;
  addCheckIn: (c: Omit<CheckIn, 'id'>) => void;
  addRecovery: (r: Omit<RecoveryScore, 'id'>) => void;
  dismissTip: (id: string) => void;
  clearTrip: (id: string) => void;
  resetDemo: () => void;
  clearAll: () => void;
}

const Ctx = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => load());
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable or full, ignore */
    }
  }, [state]);

  const setActive = useCallback((id: string | null) => {
    setState((s) => ({ ...s, activeTripId: id }));
  }, []);

  const addTrip = useCallback((trip: Trip) => {
    setState((s) => ({ ...s, trips: [trip, ...s.trips], activeTripId: trip.id }));
  }, []);

  const updateTrip = useCallback((trip: Trip) => {
    setState((s) => ({ ...s, trips: s.trips.map((t) => (t.id === trip.id ? trip : t)) }));
  }, []);

  const deleteTrip = useCallback((id: string) => {
    setState((s) => {
      const trips = s.trips.filter((t) => t.id !== id);
      return {
        ...s,
        trips,
        schedule: s.schedule.filter((x) => x.tripId !== id),
        activeTripId: s.activeTripId === id ? trips[0]?.id ?? null : s.activeTripId,
      };
    });
  }, []);

  /** Clear the active/selected trip entirely, including its schedule. */
  const clearTrip = useCallback((id: string) => {
    setState((s) => {
      const trips = s.trips.filter((t) => t.id !== id);
      const completed = { ...s.completed };
      const packing = { ...s.packing };
      delete completed[id];
      delete packing[id];
      return {
        ...s,
        trips,
        completed,
        packing,
        schedule: s.schedule.filter((x) => x.tripId !== id),
        activeTripId: s.activeTripId === id ? trips[0]?.id ?? null : s.activeTripId,
      };
    });
  }, []);

  const duplicateTrip = useCallback((id: string): Trip | null => {
    const src = state.trips.find((t) => t.id === id);
    if (!src) return null;
    const dep = new Date(src.departureISO).getTime();
    const arr = new Date(src.arrivalISO).getTime();
    const dur = arr - dep;
    const departure = new Date(Date.now() + 21 * 86400000 + 9 * 3600000);
    const copy: Trip = {
      ...src,
      id: uid(),
      departureISO: departure.toISOString(),
      arrivalISO: new Date(departure.getTime() + dur).toISOString(),
      createdAt: Date.now(),
      isDemo: false,
      label: `${src.originCity} → ${src.destCity}`,
    };
    setState((s) => ({ ...s, trips: [copy, ...s.trips], activeTripId: copy.id }));
    return copy;
  }, [state.trips]);

  const returnTrip = useCallback((id: string): Trip | null => {
    const src = state.trips.find((t) => t.id === id);
    if (!src) return null;
    const dep = new Date(src.departureISO).getTime();
    const arr = new Date(src.arrivalISO).getTime();
    const dur = arr - dep;
    const outboundDeparture = new Date(src.departureISO);
    const departure = new Date(outboundDeparture.getTime() + (src.stay === 'short' ? 3 : src.stay === 'medium' ? 5 : 10) * 86400000);
    const ret: Trip = {
      id: uid(),
      originId: src.destId,
      destId: src.originId,
      originCity: src.destCity,
      originCode: src.destCode,
      originTz: src.destTz,
      destCity: src.originCity,
      destCode: src.originCode,
      destTz: src.originTz,
      departureISO: departure.toISOString(),
      arrivalISO: new Date(departure.getTime() + dur).toISOString(),
      bedtime: src.bedtime,
      wake: src.wake,
      caffeine: src.caffeine,
      prep: src.prep,
      stay: 'long',
      crewMode: src.crewMode,
      createdAt: Date.now(),
      label: `${src.destCity} → ${src.originCity}`,
    };
    setState((s) => ({ ...s, trips: [ret, ...s.trips], activeTripId: ret.id }));
    return ret;
  }, [state.trips]);

  const toggleItem = useCallback((tripId: string, itemId: string) => {
    setState((s) => {
      const forTrip = { ...(s.completed[tripId] ?? {}) };
      forTrip[itemId] = !forTrip[itemId];
      return { ...s, completed: { ...s.completed, [tripId]: forTrip } };
    });
  }, []);

  const setItemDone = useCallback((tripId: string, itemId: string, done: boolean) => {
    setState((s) => {
      const forTrip = { ...(s.completed[tripId] ?? {}) };
      forTrip[itemId] = done;
      return { ...s, completed: { ...s.completed, [tripId]: forTrip } };
    });
  }, []);

  const isDone = useCallback(
    (tripId: string, itemId: string) => Boolean(state.completed[tripId]?.[itemId]),
    [state.completed],
  );

  const togglePacking = useCallback((tripId: string, itemId: string) => {
    setState((s) => {
      const forTrip = { ...(s.packing[tripId] ?? {}) };
      forTrip[itemId] = !forTrip[itemId];
      return { ...s, packing: { ...s.packing, [tripId]: forTrip } };
    });
  }, []);

  const isPacked = useCallback(
    (tripId: string, itemId: string) => Boolean(state.packing[tripId]?.[itemId]),
    [state.packing],
  );

  const updatePrefs = useCallback((patch: Partial<Prefs>) => {
    setState((s) => ({ ...s, prefs: { ...s.prefs, ...patch } }));
  }, []);

  const addScheduleItem = useCallback((item: ScheduleItem) => {
    setState((s) => ({ ...s, schedule: [...s.schedule, item] }));
  }, []);

  const updateScheduleItem = useCallback((item: ScheduleItem) => {
    setState((s) => ({ ...s, schedule: s.schedule.map((x) => (x.id === item.id ? item : x)) }));
  }, []);

  const deleteScheduleItem = useCallback((id: string) => {
    setState((s) => ({ ...s, schedule: s.schedule.filter((x) => x.id !== id) }));
  }, []);

  const addCheckIn = useCallback((c: Omit<CheckIn, 'id'>) => {
    setState((s) => ({ ...s, checkins: [{ ...c, id: uid() }, ...s.checkins] }));
  }, []);

  const addRecovery = useCallback((r: Omit<RecoveryScore, 'id'>) => {
    setState((s) => {
      const others = s.recovery.filter((x) => !(x.tripId === r.tripId && sameDay(x.at, r.at)));
      return { ...s, recovery: [...others, { ...r, id: uid() }].sort((a, b) => a.at - b.at) };
    });
  }, []);

  const dismissTip = useCallback((id: string) => {
    setState((s) => ({ ...s, dismissedTips: { ...s.dismissedTips, [id]: true } }));
  }, []);

  const resetDemo = useCallback(() => {
    setState(freshState());
  }, []);

  const clearAll = useCallback(() => {
    const s = freshState();
    const empty: AppState = {
      ...s,
      trips: [],
      activeTripId: null,
      completed: {},
      packing: {},
      schedule: [],
      checkins: [],
      recovery: [],
    };
    setState(empty);
  }, []);

  const activeTrip = useMemo(
    () => state.trips.find((t) => t.id === state.activeTripId) ?? null,
    [state.trips, state.activeTripId],
  );

  const value: StoreValue = {
    ...state,
    activeTrip,
    setActive,
    addTrip,
    updateTrip,
    deleteTrip,
    duplicateTrip,
    returnTrip,
    toggleItem,
    setItemDone,
    isDone,
    togglePacking,
    isPacked,
    updatePrefs,
    addScheduleItem,
    updateScheduleItem,
    deleteScheduleItem,
    addCheckIn,
    addRecovery,
    dismissTip,
    clearTrip,
    resetDemo,
    clearAll,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function sameDay(a: number, b: number): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

export function useStore(): StoreValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used within StoreProvider');
  return v;
}
