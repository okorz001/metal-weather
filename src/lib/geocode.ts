const OSM_URL = "https://nominatim.openstreetmap.org/search";
const OSM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";
const BDC_REVERSE_URL =
  "https://api.bigdatacloud.net/data/reverse-geocode-client";

const US_STATES: Record<string, string> = {
  Alabama: "AL",
  Alaska: "AK",
  Arizona: "AZ",
  Arkansas: "AR",
  California: "CA",
  Colorado: "CO",
  Connecticut: "CT",
  Delaware: "DE",
  Florida: "FL",
  Georgia: "GA",
  Hawaii: "HI",
  Idaho: "ID",
  Illinois: "IL",
  Indiana: "IN",
  Iowa: "IA",
  Kansas: "KS",
  Kentucky: "KY",
  Louisiana: "LA",
  Maine: "ME",
  Maryland: "MD",
  Massachusetts: "MA",
  Michigan: "MI",
  Minnesota: "MN",
  Mississippi: "MS",
  Missouri: "MO",
  Montana: "MT",
  Nebraska: "NE",
  Nevada: "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  Ohio: "OH",
  Oklahoma: "OK",
  Oregon: "OR",
  Pennsylvania: "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  Tennessee: "TN",
  Texas: "TX",
  Utah: "UT",
  Vermont: "VT",
  Virginia: "VA",
  Washington: "WA",
  "West Virginia": "WV",
  Wisconsin: "WI",
  Wyoming: "WY",
};

const US_STATE_ABBREVS: Record<string, string> = Object.fromEntries(
  Object.entries(US_STATES).map(([name, abbrev]) => [abbrev, name]),
);

/**
 * Normalizes a string for case- and accent-insensitive comparison.
 *
 * Lowercases the input and strips combining diacritical marks (e.g. accents)
 * so that values like `"San José"` and `"San Jose"` compare as equal. This
 * lets name and qualifier matching succeed regardless of accent usage.
 *
 * @param value - The string to normalize.
 * @returns The lowercased, accent-stripped form of the input.
 */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function formatDisplayName(
  city: string | undefined,
  subdivision: string | undefined,
  countryCode: string | undefined,
  country: string | undefined,
): string {
  if (countryCode === "US") {
    const region = subdivision ? US_STATES[subdivision] : undefined;
    if (region) return [city, region].filter(Boolean).join(", ");
  }
  return [city, country].filter(Boolean).join(", ");
}

/**
 * Parses a coordinate string of the form "lat,lon" into numeric values.
 *
 * Accepts optional whitespace around the comma and around the entire string.
 * Validates that latitude is in the range [-90, 90] and longitude is in the
 * range [-180, 180]. Returns `null` for any input that does not match this
 * format or fails validation, so callers can safely fall through to normal
 * location search.
 *
 * @param input - The raw string to test (e.g. `"47.6,-122.3"`).
 * @returns An object with `lat` and `lon` as numbers, or `null` if the input
 *   is not a valid coordinate pair.
 */
export function parseCoordinates(
  input: string,
): { lat: number; lon: number } | null {
  const match = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/.exec(input);
  if (!match) return null;
  const lat = parseFloat(match[1]);
  const lon = parseFloat(match[2]);
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { lat, lon };
}

interface OsmResult {
  name?: string;
  lat: string;
  lon: string;
  address?: {
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
}

/**
 * Resolves a location name or US zip code to geographic coordinates.
 *
 * Calls the Nominatim (OpenStreetMap) Geocoding API and returns the best
 * match. A 5-digit input is treated as a US postal code; all other inputs
 * are treated as city names. For city name queries, accepts an optional
 * comma-separated qualifier (e.g. `"San Jose, CA"`) to disambiguate results
 * by matching the qualifier against the state, county, country, or country
 * code fields; falls back to the top result if no qualifier matches. Throws a
 * descriptive error if no results are found or the request fails.
 *
 * @param location - The location to search for (e.g. `"Seattle"`, `"San Jose, CA"`, or `"95124"`).
 * @returns The latitude, longitude, and human-readable display name of the location.
 */
export async function geocodeLocation(
  location: string,
): Promise<{ lat: number; lon: number; displayName: string }> {
  const [cityName, ...rest] = location.split(",").map((s) => s.trim());
  const qualifiers = rest.filter(Boolean);

  const isZip = /^\d{5}$/.test(cityName);
  const query = isZip
    ? `postalcode=${encodeURIComponent(cityName)}&countrycodes=us&limit=1`
    : `q=${encodeURIComponent(cityName)}&limit=10`;
  const url = `${OSM_URL}?${query}&format=json&addressdetails=1`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { "User-Agent": "metal-weather/1.0" },
    });
  } catch (e) {
    throw new Error(
      `Failed to reach geocoding service: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  if (!response.ok) {
    throw new Error(`Geocoding request failed with status ${response.status}`);
  }

  const data = (await response.json()) as OsmResult[];

  if (data.length === 0) {
    throw new Error(`Location not found: "${location}"`);
  }

  const matches = (field: string, q: string) => {
    const expanded = US_STATE_ABBREVS[q.toUpperCase()];
    const candidates = expanded ? [expanded, q] : [q];
    return candidates.some((candidate) => {
      const f = normalize(field);
      const lq = normalize(candidate);
      return f === lq || f.split(/\s+/).some((word) => word.startsWith(lq));
    });
  };

  const nameMatches = data.filter(
    (r) => r.name && normalize(r.name) === normalize(cityName),
  );

  let fallbackPool = data;
  if (!isZip && nameMatches.length === 0) {
    const queryTokens = cityName
      .split(/[^a-zA-Z0-9]+/)
      .map(normalize)
      .filter(Boolean);
    const relevant = data.filter((r) => {
      if (!r.name) return false;
      const nameTokens = normalize(r.name)
        .split(/[^a-z0-9]+/)
        .filter(Boolean);
      return queryTokens.some((qt) =>
        nameTokens.some((nt) => nt.startsWith(qt) || qt.startsWith(nt)),
      );
    });
    if (relevant.length === 0) {
      throw new Error(`Location not found: "${location}"`);
    }
    fallbackPool = relevant;
  }

  const pool = nameMatches.length > 0 ? nameMatches : fallbackPool;

  let result = pool[0];

  if (qualifiers.length > 0) {
    const match = pool.find((r) =>
      qualifiers.some((q) =>
        [
          r.address?.state,
          r.address?.county,
          r.address?.country,
          r.address?.country_code?.toUpperCase(),
        ]
          .filter(Boolean)
          .some((field) => matches(field!, q)),
      ),
    );
    if (match) result = match;
  }

  const area =
    result.address?.suburb ??
    result.address?.neighbourhood ??
    result.address?.city ??
    result.address?.town ??
    result.address?.village ??
    result.name;

  const displayName =
    formatDisplayName(
      area,
      result.address?.state,
      result.address?.country_code?.toUpperCase(),
      result.address?.country,
    ) || location;

  return {
    lat: parseFloat(result.lat),
    lon: parseFloat(result.lon),
    displayName,
  };
}

interface BdcReverseResult {
  city?: string;
  principalSubdivision?: string;
  countryCode?: string;
  continent?: string;
  locality?: string;
}

interface OsmReverseResult {
  error?: string;
  address?: {
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
}

/**
 * Resolves geographic coordinates to a human-readable location name using the
 * BigDataCloud reverse geocoding API (no API key required).
 *
 * Returns a display name built from the city, region, and country. Throws a
 * descriptive error if the request fails or returns a non-OK status; callers
 * should fall back to raw coordinate strings on failure.
 *
 * @param lat - The latitude in decimal degrees.
 * @param lon - The longitude in decimal degrees.
 * @returns A human-readable display name such as `"Seattle, WA"`.
 */
export async function reverseGeocodeBdc(
  lat: number,
  lon: number,
): Promise<string> {
  const url = `${BDC_REVERSE_URL}?latitude=${lat}&longitude=${lon}&localityLanguage=en`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch (e) {
    throw new Error(
      `Failed to reach reverse geocoding service: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  if (!response.ok) {
    throw new Error(
      `Reverse geocoding request failed with status ${response.status}`,
    );
  }

  const data = (await response.json()) as BdcReverseResult;

  const countryDisplayNames = new Intl.DisplayNames(["en"], { type: "region" });
  const country = data.countryCode
    ? (countryDisplayNames.of(data.countryCode) ?? data.countryCode)
    : data.continent || data.locality;

  return formatDisplayName(
    data.city,
    data.principalSubdivision,
    data.countryCode,
    country,
  );
}

/**
 * Resolves geographic coordinates to a human-readable location name using the
 * Nominatim (OpenStreetMap) reverse geocoding API.
 *
 * Returns a display name built from the city, region, and country using the
 * same address fields as forward geocoding. Throws a descriptive error if the
 * request fails or returns a non-OK status; callers should fall back to raw
 * coordinate strings on failure.
 *
 * @param lat - The latitude in decimal degrees.
 * @param lon - The longitude in decimal degrees.
 * @returns A human-readable display name such as `"Seattle, WA"`.
 */
export async function reverseGeocodeOsm(
  lat: number,
  lon: number,
): Promise<string> {
  const url = `${OSM_REVERSE_URL}?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { "User-Agent": "metal-weather/1.0" },
    });
  } catch (e) {
    throw new Error(
      `Failed to reach reverse geocoding service: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  if (!response.ok) {
    throw new Error(
      `Reverse geocoding request failed with status ${response.status}`,
    );
  }

  const data = (await response.json()) as OsmReverseResult;

  if (data.error) {
    throw new Error(`Reverse geocoding failed: ${data.error}`);
  }

  const area =
    data.address?.suburb ??
    data.address?.neighbourhood ??
    data.address?.city ??
    data.address?.town ??
    data.address?.village;

  const countryCode = data.address?.country_code?.toUpperCase();

  const displayName = formatDisplayName(
    area,
    data.address?.state,
    countryCode,
    data.address?.country,
  );

  if (!displayName) {
    throw new Error(`Location not found at ${lat},${lon}`);
  }

  return displayName;
}

/**
 * Resolves geographic coordinates to a human-readable location name.
 *
 * Tries {@link reverseGeocodeOsm} first; falls back to {@link reverseGeocodeBdc}
 * if OSM fails for any reason. Throws if both fail.
 *
 * @param lat - The latitude in decimal degrees.
 * @param lon - The longitude in decimal degrees.
 * @returns A human-readable display name such as `"Seattle, WA"`.
 */
export async function reverseGeocode(
  lat: number,
  lon: number,
): Promise<string> {
  try {
    return await reverseGeocodeOsm(lat, lon);
  } catch {
    return reverseGeocodeBdc(lat, lon);
  }
}
