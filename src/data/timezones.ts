/**
 * Full IANA time zone coverage so a traveller can pick any place in the world
 * offline. Prefer the runtime's own list, but normalise legacy aliases (e.g.
 * Asia/Calcutta → Asia/Kolkata) and add searchable country/region names.
 */

const FALLBACK: string[] = [
  'Africa/Abidjan',
  'Africa/Accra',
  'Africa/Addis_Ababa',
  'Africa/Algiers',
  'Africa/Cairo',
  'Africa/Casablanca',
  'Africa/Dakar',
  'Africa/Dar_es_Salaam',
  'Africa/Johannesburg',
  'Africa/Khartoum',
  'Africa/Lagos',
  'Africa/Nairobi',
  'Africa/Tripoli',
  'Africa/Tunis',
  'America/Anchorage',
  'America/Argentina/Buenos_Aires',
  'America/Bogota',
  'America/Caracas',
  'America/Chicago',
  'America/Denver',
  'America/Edmonton',
  'America/Halifax',
  'America/Lima',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/Montevideo',
  'America/New_York',
  'America/Panama',
  'America/Phoenix',
  'America/Santiago',
  'America/Sao_Paulo',
  'America/St_Johns',
  'America/Toronto',
  'America/Vancouver',
  'Asia/Almaty',
  'Asia/Baghdad',
  'Asia/Bangkok',
  'Asia/Beirut',
  'Asia/Colombo',
  'Asia/Dhaka',
  'Asia/Dubai',
  'Asia/Ho_Chi_Minh',
  'Asia/Hong_Kong',
  'Asia/Jakarta',
  'Asia/Jerusalem',
  'Asia/Kabul',
  'Asia/Karachi',
  'Asia/Kathmandu',
  'Asia/Kolkata',
  'Asia/Kuala_Lumpur',
  'Asia/Kuwait',
  'Asia/Manila',
  'Asia/Muscat',
  'Asia/Riyadh',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Taipei',
  'Asia/Tashkent',
  'Asia/Tbilisi',
  'Asia/Tehran',
  'Asia/Tokyo',
  'Asia/Ulaanbaatar',
  'Asia/Yangon',
  'Atlantic/Azores',
  'Atlantic/Reykjavik',
  'Australia/Adelaide',
  'Australia/Brisbane',
  'Australia/Darwin',
  'Australia/Hobart',
  'Australia/Melbourne',
  'Australia/Perth',
  'Australia/Sydney',
  'Europe/Amsterdam',
  'Europe/Athens',
  'Europe/Berlin',
  'Europe/Brussels',
  'Europe/Bucharest',
  'Europe/Budapest',
  'Europe/Copenhagen',
  'Europe/Dublin',
  'Europe/Helsinki',
  'Europe/Istanbul',
  'Europe/Kyiv',
  'Europe/Lisbon',
  'Europe/London',
  'Europe/Madrid',
  'Europe/Moscow',
  'Europe/Oslo',
  'Europe/Paris',
  'Europe/Prague',
  'Europe/Rome',
  'Europe/Stockholm',
  'Europe/Vienna',
  'Europe/Warsaw',
  'Europe/Zurich',
  'Pacific/Auckland',
  'Pacific/Fiji',
  'Pacific/Guam',
  'Pacific/Honolulu',
  'Pacific/Port_Moresby',
  'Pacific/Tahiti',
];

/** Legacy zone ids returned by some engines, mapped to their canonical name. */
const ALIAS: Record<string, string> = {
  'Asia/Calcutta': 'Asia/Kolkata',
  'Asia/Katmandu': 'Asia/Kathmandu',
  'Asia/Rangoon': 'Asia/Yangon',
  'Asia/Saigon': 'Asia/Ho_Chi_Minh',
  'Asia/Dacca': 'Asia/Dhaka',
  'Asia/Macao': 'Asia/Macau',
  'Europe/Kiev': 'Europe/Kyiv',
  'America/Godthab': 'America/Nuuk',
  'America/Atka': 'America/Adak',
  'Pacific/Enderbury': 'Pacific/Kanton',
  'Pacific/Ponape': 'Pacific/Pohnpei',
  'Pacific/Truk': 'Pacific/Chuuk',
  'Africa/Asmera': 'Africa/Asmara',
  'America/Buenos_Aires': 'America/Argentina/Buenos_Aires',
  'Europe/Uzhgorod': 'Europe/Kyiv',
  'Europe/Zaporozhye': 'Europe/Kyiv',
  'Asia/Chongqing': 'Asia/Shanghai',
  'Asia/Chungking': 'Asia/Shanghai',
  'Asia/Harbin': 'Asia/Shanghai',
  'Asia/Ulan_Bator': 'Asia/Ulaanbaatar',
  'Australia/Canberra': 'Australia/Sydney',
  'Australia/NSW': 'Australia/Sydney',
};

/** Canonical zones we always want available, even if the engine omits them. */
const CANONICAL_EXTRA = [
  'Asia/Kolkata',
  'Asia/Kathmandu',
  'Asia/Yangon',
  'Asia/Ho_Chi_Minh',
  'Europe/Kyiv',
  'America/Nuuk',
];

/** Extra search terms (countries, common names) so typing "India" finds a zone. */
const COUNTRY_ALIAS: Record<string, string> = {
  'Asia/Kolkata': 'india delhi mumbai bangalore bengaluru ist',
  'Asia/Colombo': 'sri lanka',
  'Asia/Kathmandu': 'nepal',
  'Asia/Dhaka': 'bangladesh',
  'Asia/Karachi': 'pakistan',
  'Asia/Kabul': 'afghanistan',
  'Asia/Tehran': 'iran',
  'Asia/Baghdad': 'iraq',
  'Asia/Riyadh': 'saudi arabia',
  'Asia/Dubai': 'uae united arab emirates',
  'Asia/Qatar': 'qatar',
  'Asia/Kuwait': 'kuwait',
  'Asia/Bahrain': 'bahrain',
  'Asia/Muscat': 'oman',
  'Asia/Amman': 'jordan',
  'Asia/Beirut': 'lebanon',
  'Asia/Damascus': 'syria',
  'Asia/Jerusalem': 'israel',
  'Asia/Gaza': 'palestine',
  'Asia/Hebron': 'palestine',
  'Asia/Tbilisi': 'georgia',
  'Asia/Yerevan': 'armenia',
  'Asia/Baku': 'azerbaijan',
  'Asia/Tashkent': 'uzbekistan',
  'Asia/Almaty': 'kazakhstan',
  'Asia/Bishkek': 'kyrgyzstan',
  'Asia/Dushanbe': 'tajikistan',
  'Asia/Ashgabat': 'turkmenistan',
  'Asia/Ulaanbaatar': 'mongolia',
  'Asia/Shanghai': 'china',
  'Asia/Hong_Kong': 'hong kong',
  'Asia/Macau': 'macau',
  'Asia/Taipei': 'taiwan',
  'Asia/Tokyo': 'japan',
  'Asia/Seoul': 'south korea korea',
  'Asia/Pyongyang': 'north korea',
  'Asia/Bangkok': 'thailand',
  'Asia/Ho_Chi_Minh': 'vietnam',
  'Asia/Phnom_Penh': 'cambodia',
  'Asia/Vientiane': 'laos',
  'Asia/Yangon': 'myanmar burma',
  'Asia/Kuala_Lumpur': 'malaysia',
  'Asia/Singapore': 'singapore',
  'Asia/Jakarta': 'indonesia',
  'Asia/Makassar': 'indonesia bali',
  'Asia/Jayapura': 'indonesia',
  'Asia/Manila': 'philippines',
  'Asia/Brunei': 'brunei',
  'Asia/Dili': 'timor',
  'Europe/Istanbul': 'turkey turkiye',
  'Europe/London': 'uk united kingdom britain england',
  'Europe/Paris': 'france',
  'Europe/Berlin': 'germany',
  'Europe/Madrid': 'spain',
  'Europe/Rome': 'italy',
  'Europe/Amsterdam': 'netherlands holland',
  'Europe/Brussels': 'belgium',
  'Europe/Zurich': 'switzerland',
  'Europe/Vienna': 'austria',
  'Europe/Lisbon': 'portugal',
  'Europe/Dublin': 'ireland',
  'Europe/Stockholm': 'sweden',
  'Europe/Oslo': 'norway',
  'Europe/Copenhagen': 'denmark',
  'Europe/Helsinki': 'finland',
  'Europe/Warsaw': 'poland',
  'Europe/Prague': 'czech czechia',
  'Europe/Budapest': 'hungary',
  'Europe/Athens': 'greece',
  'Europe/Bucharest': 'romania',
  'Europe/Sofia': 'bulgaria',
  'Europe/Belgrade': 'serbia',
  'Europe/Zagreb': 'croatia',
  'Europe/Moscow': 'russia',
  'Europe/Kyiv': 'ukraine',
  'Europe/Riga': 'latvia',
  'Europe/Vilnius': 'lithuania',
  'Europe/Tallinn': 'estonia',
  'Atlantic/Reykjavik': 'iceland',
  'America/New_York': 'usa united states new york',
  'America/Chicago': 'usa united states chicago',
  'America/Denver': 'usa united states denver',
  'America/Los_Angeles': 'usa united states los angeles',
  'America/Phoenix': 'usa united states phoenix',
  'America/Anchorage': 'usa united states alaska',
  'America/Toronto': 'canada',
  'America/Vancouver': 'canada',
  'America/Edmonton': 'canada',
  'America/Halifax': 'canada',
  'America/Mexico_City': 'mexico',
  'America/Sao_Paulo': 'brazil',
  'America/Argentina/Buenos_Aires': 'argentina',
  'America/Santiago': 'chile',
  'America/Lima': 'peru',
  'America/Bogota': 'colombia',
  'America/Caracas': 'venezuela',
  'Africa/Cairo': 'egypt',
  'Africa/Lagos': 'nigeria',
  'Africa/Nairobi': 'kenya',
  'Africa/Johannesburg': 'south africa',
  'Africa/Addis_Ababa': 'ethiopia',
  'Africa/Casablanca': 'morocco',
  'Africa/Accra': 'ghana',
  'Africa/Dar_es_Salaam': 'tanzania',
  'Australia/Sydney': 'australia',
  'Australia/Melbourne': 'australia',
  'Australia/Brisbane': 'australia',
  'Australia/Perth': 'australia',
  'Australia/Adelaide': 'australia',
  'Australia/Darwin': 'australia',
  'Australia/Hobart': 'australia',
  'Pacific/Auckland': 'new zealand',
  'Pacific/Fiji': 'fiji',
  'Pacific/Guam': 'guam',
  'Pacific/Honolulu': 'hawaii usa united states',
  'Pacific/Tahiti': 'french polynesia',
};

/** Shown first when the picker opens empty, so common zones are one tap away. */
const PRIORITY = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Bangkok',
  'Asia/Hong_Kong',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Dhaka',
  'Asia/Karachi',
  'Asia/Kathmandu',
  'Asia/Colombo',
  'Asia/Jakarta',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Amsterdam',
  'Europe/Istanbul',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'Australia/Sydney',
  'Pacific/Auckland',
  'Africa/Johannesburg',
  'Africa/Lagos',
  'Africa/Cairo',
];

function supported(): string[] {
  try {
    const intl = Intl as unknown as { supportedValuesOf?: (key: string) => string[] };
    if (typeof intl.supportedValuesOf === 'function') {
      const zones = intl.supportedValuesOf('timeZone');
      if (Array.isArray(zones) && zones.length > 0) return zones;
    }
  } catch {
    /* ignore and use fallback */
  }
  return FALLBACK;
}

function buildZones(): string[] {
  const set = new Set<string>();
  for (const z of supported()) set.add(ALIAS[z] ?? z);
  for (const z of CANONICAL_EXTRA) set.add(z);
  return [...set].sort();
}

export const TIMEZONES: string[] = buildZones();

/** e.g. "Asia" for "Asia/Kolkata" */
export function regionOf(tz: string): string {
  return tz.split('/')[0].replace(/_/g, ' ');
}

/** A short, human place name from a zone id, e.g. "Kolkata" for "Asia/Kolkata". */
export function placeOf(tz: string): string {
  const parts = tz.split('/');
  const last = parts[parts.length - 1] ?? tz;
  return last.replace(/_/g, ' ');
}

const searchCache = new Map<string, string>();

function searchText(tz: string): string {
  let cached = searchCache.get(tz);
  if (cached) return cached;
  const bits = [tz.replace(/_/g, ' '), placeOf(tz), regionOf(tz)];
  for (const style of ['long', 'longGeneric'] as const) {
    try {
      const value = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: style })
        .formatToParts(new Date())
        .find((p) => p.type === 'timeZoneName')?.value;
      if (value) bits.push(value);
    } catch {
      /* unsupported zone/style, skip */
    }
  }
  const alias = COUNTRY_ALIAS[tz];
  if (alias) bits.push(alias);
  cached = bits.join(' ').toLowerCase();
  searchCache.set(tz, cached);
  return cached;
}

/** Filter the zone list by a free-text query (country, city or zone). */
export function searchTimezones(query: string, limit = 500): string[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    const priority = PRIORITY.filter((z) => TIMEZONES.includes(z));
    const prioritySet = new Set(priority);
    const rest = TIMEZONES.filter((z) => !prioritySet.has(z));
    return [...priority, ...rest].slice(0, limit);
  }
  return TIMEZONES.filter((tz) => searchText(tz).includes(q)).slice(0, limit);
}
