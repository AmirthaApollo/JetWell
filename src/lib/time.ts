/**
 * Time-zone helpers built on Intl.DateTimeFormat. No external date library.
 * All functions are pure and DST-aware because Intl resolves offsets per-instant.
 */

export type ZonedParts = {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
  minute: number;
  second: number;
  weekday: number; // 0 Sun - 6 Sat
};

const partsCache = new Map<string, Intl.DateTimeFormat>();
const dtfCache = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  let f = partsCache.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'short',
    });
    partsCache.set(timeZone, f);
  }
  return f;
}

/** Wall-clock components of an instant, as seen in `timeZone`. */
export function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = partsFormatter(timeZone).formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  let hour = parseInt(map.hour, 10);
  if (hour === 24) hour = 0;
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return {
    year: parseInt(map.year, 10),
    month: parseInt(map.month, 10),
    day: parseInt(map.day, 10),
    hour,
    minute: parseInt(map.minute, 10),
    second: parseInt(map.second, 10),
    weekday: weekdays.indexOf(map.weekday ?? 'Sun'),
  };
}

/** Offset of `timeZone` at a given instant, in minutes east of UTC. */
export function getOffsetMinutes(date: Date, timeZone: string): number {
  const p = getZonedParts(date, timeZone);
  const asUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  // Round to the nearest minute to avoid ms drift.
  const diffMs = asUTC - date.getTime();
  return Math.round(diffMs / 60000);
}

/**
 * Convert wall-clock time in a zone to the absolute instant.
 * Handles DST by iterating once against the resolved offset.
 */
export function zonedToInstant(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  timeZone = 'UTC',
): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute, 0);
  let offset = getOffsetMinutes(new Date(guess), timeZone);
  let ts = guess - offset * 60000;
  const offset2 = getOffsetMinutes(new Date(ts), timeZone);
  if (offset2 !== offset) {
    offset = offset2;
    ts = guess - offset * 60000;
  }
  return new Date(ts);
}

/** The instant corresponding to a `YYYY-MM-DDTHH:mm` string interpreted in `timeZone`. */
export function parseLocalInput(value: string, timeZone: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!m) return null;
  return zonedToInstant(
    +m[1],
    +m[2],
    +m[3],
    +m[4],
    +m[5],
    timeZone,
  );
}

/** Format an instant into a value usable by `<input type="datetime-local">` in a zone. */
export function toLocalInput(date: Date, timeZone: string): string {
  const p = getZonedParts(date, timeZone);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

function fmt(timeZone: string, opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = timeZone + '|' + JSON.stringify(opts);
  let f = dtfCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', { timeZone, ...opts });
    dtfCache.set(key, f);
  }
  return f;
}

/** e.g. "7:30 PM" */
export function formatTime(date: Date, timeZone: string, hour12 = false): string {
  return fmt(timeZone, { hour: 'numeric', minute: '2-digit', hour12 }).format(date);
}

/** e.g. "19:30:05" or "7:30:05 PM" */
export function formatClock(date: Date, timeZone: string, hour12 = false): string {
  return fmt(timeZone, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12 }).format(date);
}

/** e.g. "Tue, 12 Mar" */
export function formatDate(date: Date, timeZone: string): string {
  return fmt(timeZone, { weekday: 'short', day: 'numeric', month: 'short' }).format(date);
}

/** e.g. "Tue 12 Mar" */
export function formatDay(date: Date, timeZone: string): string {
  return fmt(timeZone, { weekday: 'short', day: 'numeric', month: 'short' }).format(date).replace(',', '');
}

/** e.g. "Tue 12 Mar, 7:30 PM" */
export function formatDateTime(date: Date, timeZone: string, hour12 = false): string {
  return fmt(timeZone, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12,
  }).format(date);
}

/** Local calendar day key (YYYY-MM-DD) in a zone. */
export function dayKey(date: Date, timeZone: string): string {
  const p = getZonedParts(date, timeZone);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** Whole-calendar-day difference between two instants in a zone. */
export function dayDiff(a: Date, b: Date, timeZone: string): number {
  const pa = getZonedParts(a, timeZone);
  const pb = getZonedParts(b, timeZone);
  const ua = Date.UTC(pa.year, pa.month - 1, pa.day);
  const ub = Date.UTC(pb.year, pb.month - 1, pb.day);
  return Math.round((ub - ua) / 86400000);
}

/** Add calendar days to a wall-clock date, returning wall components (no tz applied). */
export function addDaysToParts(
  year: number,
  month: number,
  day: number,
  deltaDays: number,
): { year: number; month: number; day: number } {
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/** Human offset label, e.g. "GMT+5:30" or "UTC−4". */
export function offsetLabel(date: Date, timeZone: string): string {
  const mins = getOffsetMinutes(date, timeZone);
  const sign = mins >= 0 ? '+' : '−';
  const abs = Math.abs(mins);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `UTC${sign}${h}${m ? ':' + String(m).padStart(2, '0') : ''}`;
}

/** Minutes between two zones at an instant (dest - origin). */
export function zoneDiffMinutes(at: Date, originTz: string, destTz: string): number {
  return getOffsetMinutes(at, destTz) - getOffsetMinutes(at, originTz);
}

/** Format a duration in minutes as "5h 30m". */
export function formatDuration(minutes: number): string {
  const abs = Math.abs(Math.round(minutes));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}
