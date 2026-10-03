import { describe, it, expect } from 'vitest';
import {
  CITIES,
  estimateFlightMinutes,
  findCity,
  makeCustomCity,
  searchCities,
} from './cities';
import { TIMEZONES, searchTimezones } from './timezones';

describe('custom cities (anywhere in the world)', () => {
  it('builds a usable place from a name and an IANA zone', () => {
    const c = makeCustomCity('Reykjavik', 'Atlantic/Reykjavik');
    expect(c.tz).toBe('Atlantic/Reykjavik');
    expect(c.city).toBe('Reykjavik');
    expect(c.custom).toBe(true);
    expect(c.id.startsWith('custom:')).toBe(true);
    expect(c.code).toHaveLength(3);
  });

  it('handles multi-word names and keeps a stable id', () => {
    const a = makeCustomCity('new york', 'America/New_York');
    const b = makeCustomCity('New York', 'America/New_York');
    expect(a.city).toBe('New York');
    expect(a.id).toBe(b.id);
    expect(a.code).toBe('NYX');
  });

  it('searches user-added cities alongside the built-ins', () => {
    const custom = makeCustomCity('Tromso', 'Europe/Oslo');
    expect(searchCities('tromso', [custom])[0]?.id).toBe(custom.id);
    expect(searchCities('tromso').length).toBe(0);
  });

  it('resolves custom cities by id when extras are supplied', () => {
    const custom = makeCustomCity('Tromso', 'Europe/Oslo');
    expect(findCity(custom.id)).toBeUndefined();
    expect(findCity(custom.id, [custom])?.city).toBe('Tromso');
  });

  it('still finds built-in cities with no extras', () => {
    expect(findCity(CITIES[0].id)?.city).toBe(CITIES[0].city);
  });
});

describe('flight time estimation', () => {
  it('estimates a sensible block time between two known cities', () => {
    const del = findCity('del')!;
    const lhr = findCity('lhr')!;
    const minutes = estimateFlightMinutes(del, lhr);
    expect(minutes).not.toBeNull();
    expect(minutes!).toBeGreaterThan(420);
    expect(minutes!).toBeLessThan(720);
  });

  it('returns null when a place has no coordinates', () => {
    const custom = makeCustomCity('Nowhere', 'Europe/Oslo');
    expect(estimateFlightMinutes(custom, CITIES[0])).toBeNull();
  });
});

describe('timezone catalogue', () => {
  it('exposes a broad set of zones', () => {
    expect(TIMEZONES.length).toBeGreaterThan(50);
  });

  it('includes canonical India zone even when the engine reports the legacy alias', () => {
    expect(TIMEZONES).toContain('Asia/Kolkata');
  });

  it('finds zones by country name and by city', () => {
    expect(searchTimezones('india')).toContain('Asia/Kolkata');
    expect(searchTimezones('kolkata')).toContain('Asia/Kolkata');
    expect(searchTimezones('reykjavik')).toContain('Atlantic/Reykjavik');
  });

  it('shows common zones first when the query is empty', () => {
    expect(searchTimezones('').slice(0, 12)).toContain('Asia/Kolkata');
  });
});
