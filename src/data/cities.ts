export type City = {
  id: string;
  city: string;
  country: string;
  code: string; // IATA-ish 3 letter code
  tz: string; // IANA
  lat: number;
  lon: number;
};

/**
 * ~80 major cities with IANA time zones so the app works fully offline.
 * Offsets are computed at request time via Intl, so DST is always correct.
 */
export const CITIES: City[] = [
  { id: 'del', city: 'Delhi', country: 'India', code: 'DEL', tz: 'Asia/Kolkata', lat: 28.61, lon: 77.21 },
  { id: 'bom', city: 'Mumbai', country: 'India', code: 'BOM', tz: 'Asia/Kolkata', lat: 19.09, lon: 72.88 },
  { id: 'blr', city: 'Bengaluru', country: 'India', code: 'BLR', tz: 'Asia/Kolkata', lat: 12.97, lon: 77.59 },
  { id: 'maa', city: 'Chennai', country: 'India', code: 'MAA', tz: 'Asia/Kolkata', lat: 13.08, lon: 80.27 },
  { id: 'hyd', city: 'Hyderabad', country: 'India', code: 'HYD', tz: 'Asia/Kolkata', lat: 17.38, lon: 78.47 },
  { id: 'ccu', city: 'Kolkata', country: 'India', code: 'CCU', tz: 'Asia/Kolkata', lat: 22.57, lon: 88.36 },
  { id: 'goi', city: 'Goa', country: 'India', code: 'GOI', tz: 'Asia/Kolkata', lat: 15.38, lon: 73.83 },
  { id: 'cok', city: 'Kochi', country: 'India', code: 'COK', tz: 'Asia/Kolkata', lat: 9.93, lon: 76.27 },
  { id: 'lhr', city: 'London', country: 'United Kingdom', code: 'LHR', tz: 'Europe/London', lat: 51.51, lon: -0.13 },
  { id: 'par', city: 'Paris', country: 'France', code: 'CDG', tz: 'Europe/Paris', lat: 48.86, lon: 2.35 },
  { id: 'ams', city: 'Amsterdam', country: 'Netherlands', code: 'AMS', tz: 'Europe/Amsterdam', lat: 52.37, lon: 4.9 },
  { id: 'fra', city: 'Frankfurt', country: 'Germany', code: 'FRA', tz: 'Europe/Berlin', lat: 50.11, lon: 8.68 },
  { id: 'ber', city: 'Berlin', country: 'Germany', code: 'BER', tz: 'Europe/Berlin', lat: 52.52, lon: 13.4 },
  { id: 'mad', city: 'Madrid', country: 'Spain', code: 'MAD', tz: 'Europe/Madrid', lat: 40.42, lon: -3.7 },
  { id: 'bcn', city: 'Barcelona', country: 'Spain', code: 'BCN', tz: 'Europe/Madrid', lat: 41.39, lon: 2.17 },
  { id: 'rom', city: 'Rome', country: 'Italy', code: 'FCO', tz: 'Europe/Rome', lat: 41.9, lon: 12.5 },
  { id: 'mil', city: 'Milan', country: 'Italy', code: 'MXP', tz: 'Europe/Rome', lat: 45.46, lon: 9.19 },
  { id: 'zrh', city: 'Zurich', country: 'Switzerland', code: 'ZRH', tz: 'Europe/Zurich', lat: 47.38, lon: 8.54 },
  { id: 'vie', city: 'Vienna', country: 'Austria', code: 'VIE', tz: 'Europe/Vienna', lat: 48.21, lon: 16.37 },
  { id: 'ist', city: 'Istanbul', country: 'Türkiye', code: 'IST', tz: 'Europe/Istanbul', lat: 41.01, lon: 28.98 },
  { id: 'dub', city: 'Dublin', country: 'Ireland', code: 'DUB', tz: 'Europe/Dublin', lat: 53.35, lon: -6.26 },
  { id: 'lis', city: 'Lisbon', country: 'Portugal', code: 'LIS', tz: 'Europe/Lisbon', lat: 38.72, lon: -9.14 },
  { id: 'sto', city: 'Stockholm', country: 'Sweden', code: 'ARN', tz: 'Europe/Stockholm', lat: 59.33, lon: 18.07 },
  { id: 'cph', city: 'Copenhagen', country: 'Denmark', code: 'CPH', tz: 'Europe/Copenhagen', lat: 55.68, lon: 12.57 },
  { id: 'osl', city: 'Oslo', country: 'Norway', code: 'OSL', tz: 'Europe/Oslo', lat: 59.91, lon: 10.75 },
  { id: 'hel', city: 'Helsinki', country: 'Finland', code: 'HEL', tz: 'Europe/Helsinki', lat: 60.17, lon: 24.94 },
  { id: 'ath', city: 'Athens', country: 'Greece', code: 'ATH', tz: 'Europe/Athens', lat: 37.98, lon: 23.73 },
  { id: 'waw', city: 'Warsaw', country: 'Poland', code: 'WAW', tz: 'Europe/Warsaw', lat: 52.23, lon: 21.01 },
  { id: 'pra', city: 'Prague', country: 'Czechia', code: 'PRG', tz: 'Europe/Prague', lat: 50.08, lon: 14.44 },
  { id: 'mow', city: 'Moscow', country: 'Russia', code: 'SVO', tz: 'Europe/Moscow', lat: 55.76, lon: 37.62 },
  { id: 'nyc', city: 'New York', country: 'United States', code: 'JFK', tz: 'America/New_York', lat: 40.71, lon: -74.01 },
  { id: 'was', city: 'Washington', country: 'United States', code: 'IAD', tz: 'America/New_York', lat: 38.91, lon: -77.04 },
  { id: 'bos', city: 'Boston', country: 'United States', code: 'BOS', tz: 'America/New_York', lat: 42.36, lon: -71.06 },
  { id: 'atl', city: 'Atlanta', country: 'United States', code: 'ATL', tz: 'America/New_York', lat: 33.75, lon: -84.39 },
  { id: 'mia', city: 'Miami', country: 'United States', code: 'MIA', tz: 'America/New_York', lat: 25.76, lon: -80.19 },
  { id: 'ord', city: 'Chicago', country: 'United States', code: 'ORD', tz: 'America/Chicago', lat: 41.88, lon: -87.63 },
  { id: 'dfw', city: 'Dallas', country: 'United States', code: 'DFW', tz: 'America/Chicago', lat: 32.78, lon: -96.8 },
  { id: 'hou', city: 'Houston', country: 'United States', code: 'IAH', tz: 'America/Chicago', lat: 29.76, lon: -95.37 },
  { id: 'den', city: 'Denver', country: 'United States', code: 'DEN', tz: 'America/Denver', lat: 39.74, lon: -104.99 },
  { id: 'phx', city: 'Phoenix', country: 'United States', code: 'PHX', tz: 'America/Phoenix', lat: 33.45, lon: -112.07 },
  { id: 'lax', city: 'Los Angeles', country: 'United States', code: 'LAX', tz: 'America/Los_Angeles', lat: 34.05, lon: -118.24 },
  { id: 'sfo', city: 'San Francisco', country: 'United States', code: 'SFO', tz: 'America/Los_Angeles', lat: 37.77, lon: -122.42 },
  { id: 'sea', city: 'Seattle', country: 'United States', code: 'SEA', tz: 'America/Los_Angeles', lat: 47.61, lon: -122.33 },
  { id: 'san', city: 'San Diego', country: 'United States', code: 'SAN', tz: 'America/Los_Angeles', lat: 32.72, lon: -117.16 },
  { id: 'las', city: 'Las Vegas', country: 'United States', code: 'LAS', tz: 'America/Los_Angeles', lat: 36.17, lon: -115.14 },
  { id: 'yyz', city: 'Toronto', country: 'Canada', code: 'YYZ', tz: 'America/Toronto', lat: 43.65, lon: -79.38 },
  { id: 'yvr', city: 'Vancouver', country: 'Canada', code: 'YVR', tz: 'America/Vancouver', lat: 49.28, lon: -123.12 },
  { id: 'yul', city: 'Montreal', country: 'Canada', code: 'YUL', tz: 'America/Toronto', lat: 45.5, lon: -73.57 },
  { id: 'mex', city: 'Mexico City', country: 'Mexico', code: 'MEX', tz: 'America/Mexico_City', lat: 19.43, lon: -99.13 },
  { id: 'gru', city: 'São Paulo', country: 'Brazil', code: 'GRU', tz: 'America/Sao_Paulo', lat: -23.55, lon: -46.63 },
  { id: 'eze', city: 'Buenos Aires', country: 'Argentina', code: 'EZE', tz: 'America/Argentina/Buenos_Aires', lat: -34.6, lon: -58.38 },
  { id: 'bog', city: 'Bogotá', country: 'Colombia', code: 'BOG', tz: 'America/Bogota', lat: 4.71, lon: -74.07 },
  { id: 'lim', city: 'Lima', country: 'Peru', code: 'LIM', tz: 'America/Lima', lat: -12.05, lon: -77.04 },
  { id: 'scl', city: 'Santiago', country: 'Chile', code: 'SCL', tz: 'America/Santiago', lat: -33.45, lon: -70.67 },
  { id: 'dxb', city: 'Dubai', country: 'UAE', code: 'DXB', tz: 'Asia/Dubai', lat: 25.2, lon: 55.27 },
  { id: 'auh', city: 'Abu Dhabi', country: 'UAE', code: 'AUH', tz: 'Asia/Dubai', lat: 24.45, lon: 54.38 },
  { id: 'doh', city: 'Doha', country: 'Qatar', code: 'DOH', tz: 'Asia/Qatar', lat: 25.29, lon: 51.53 },
  { id: 'ruh', city: 'Riyadh', country: 'Saudi Arabia', code: 'RUH', tz: 'Asia/Riyadh', lat: 24.71, lon: 46.68 },
  { id: 'jed', city: 'Jeddah', country: 'Saudi Arabia', code: 'JED', tz: 'Asia/Riyadh', lat: 21.49, lon: 39.19 },
  { id: 'tlv', city: 'Tel Aviv', country: 'Israel', code: 'TLV', tz: 'Asia/Jerusalem', lat: 32.08, lon: 34.78 },
  { id: 'sin', city: 'Singapore', country: 'Singapore', code: 'SIN', tz: 'Asia/Singapore', lat: 1.35, lon: 103.82 },
  { id: 'kul', city: 'Kuala Lumpur', country: 'Malaysia', code: 'KUL', tz: 'Asia/Kuala_Lumpur', lat: 3.14, lon: 101.69 },
  { id: 'bkk', city: 'Bangkok', country: 'Thailand', code: 'BKK', tz: 'Asia/Bangkok', lat: 13.76, lon: 100.5 },
  { id: 'hkg', city: 'Hong Kong', country: 'Hong Kong', code: 'HKG', tz: 'Asia/Hong_Kong', lat: 22.32, lon: 114.17 },
  { id: 'nrt', city: 'Tokyo', country: 'Japan', code: 'NRT', tz: 'Asia/Tokyo', lat: 35.68, lon: 139.69 },
  { id: 'osa', city: 'Osaka', country: 'Japan', code: 'KIX', tz: 'Asia/Tokyo', lat: 34.69, lon: 135.5 },
  { id: 'icn', city: 'Seoul', country: 'South Korea', code: 'ICN', tz: 'Asia/Seoul', lat: 37.57, lon: 126.98 },
  { id: 'pek', city: 'Beijing', country: 'China', code: 'PEK', tz: 'Asia/Shanghai', lat: 39.9, lon: 116.41 },
  { id: 'sha', city: 'Shanghai', country: 'China', code: 'PVG', tz: 'Asia/Shanghai', lat: 31.23, lon: 121.47 },
  { id: 'tpe', city: 'Taipei', country: 'Taiwan', code: 'TPE', tz: 'Asia/Taipei', lat: 25.03, lon: 121.57 },
  { id: 'mnl', city: 'Manila', country: 'Philippines', code: 'MNL', tz: 'Asia/Manila', lat: 14.6, lon: 120.98 },
  { id: 'cgk', city: 'Jakarta', country: 'Indonesia', code: 'CGK', tz: 'Asia/Jakarta', lat: -6.21, lon: 106.85 },
  { id: 'dps', city: 'Bali', country: 'Indonesia', code: 'DPS', tz: 'Asia/Makassar', lat: -8.65, lon: 115.22 },
  { id: 'syd', city: 'Sydney', country: 'Australia', code: 'SYD', tz: 'Australia/Sydney', lat: -33.87, lon: 151.21 },
  { id: 'mel', city: 'Melbourne', country: 'Australia', code: 'MEL', tz: 'Australia/Melbourne', lat: -37.81, lon: 144.96 },
  { id: 'bne', city: 'Brisbane', country: 'Australia', code: 'BNE', tz: 'Australia/Brisbane', lat: -27.47, lon: 153.03 },
  { id: 'per', city: 'Perth', country: 'Australia', code: 'PER', tz: 'Australia/Perth', lat: -31.95, lon: 115.86 },
  { id: 'akl', city: 'Auckland', country: 'New Zealand', code: 'AKL', tz: 'Pacific/Auckland', lat: -36.85, lon: 174.76 },
  { id: 'jnb', city: 'Johannesburg', country: 'South Africa', code: 'JNB', tz: 'Africa/Johannesburg', lat: -26.2, lon: 28.05 },
  { id: 'cpt', city: 'Cape Town', country: 'South Africa', code: 'CPT', tz: 'Africa/Johannesburg', lat: -33.92, lon: 18.42 },
  { id: 'cai', city: 'Cairo', country: 'Egypt', code: 'CAI', tz: 'Africa/Cairo', lat: 30.04, lon: 31.24 },
  { id: 'nbo', city: 'Nairobi', country: 'Kenya', code: 'NBO', tz: 'Africa/Nairobi', lat: -1.29, lon: 36.82 },
  { id: 'lag', city: 'Lagos', country: 'Nigeria', code: 'LOS', tz: 'Africa/Lagos', lat: 6.52, lon: 3.38 },
  { id: 'hnd', city: 'Honolulu', country: 'United States', code: 'HNL', tz: 'Pacific/Honolulu', lat: 21.31, lon: -157.86 },
];

export function searchCities(query: string, limit = 7): City[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored = CITIES.map((c) => {
    const city = c.city.toLowerCase();
    const country = c.country.toLowerCase();
    const code = c.code.toLowerCase();
    let score = 0;
    if (city.startsWith(q)) score = 100;
    else if (code.startsWith(q)) score = 90;
    else if (city.includes(q)) score = 60;
    else if (country.startsWith(q)) score = 40;
    else if (country.includes(q)) score = 20;
    return { c, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.c.city.localeCompare(b.c.city));
  return scored.slice(0, limit).map((x) => x.c);
}

export function findCity(id: string): City | undefined {
  return CITIES.find((c) => c.id === id);
}
