const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";
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

interface NominatimResult {
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
  const url = `${NOMINATIM_URL}?${query}&format=json&addressdetails=1`;

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

  const data = (await response.json()) as NominatimResult[];

  if (data.length === 0) {
    throw new Error(`Location not found: "${location}"`);
  }

  const matches = (field: string, q: string) => {
    const f = field.toLowerCase();
    const lq = q.toLowerCase();
    return f === lq || f.split(/\s+/).some((word) => word.startsWith(lq));
  };

  const nameMatches = data.filter(
    (r) => r.name?.toLowerCase() === cityName.toLowerCase(),
  );
  const pool = nameMatches.length > 0 ? nameMatches : data;

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
}

interface NominatimReverseResult {
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
    : undefined;

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
export async function reverseGeocodeNominatim(
  lat: number,
  lon: number,
): Promise<string> {
  const url = `${NOMINATIM_REVERSE_URL}?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;

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

  const data = (await response.json()) as NominatimReverseResult;

  const area =
    data.address?.suburb ??
    data.address?.neighbourhood ??
    data.address?.city ??
    data.address?.town ??
    data.address?.village;

  const countryCode = data.address?.country_code?.toUpperCase();

  return formatDisplayName(
    area,
    data.address?.state,
    countryCode,
    data.address?.country,
  );
}

/**
 * Resolves geographic coordinates to a human-readable location name.
 *
 * Delegates to {@link reverseGeocodeNominatim}. Throws a descriptive error if
 * the request fails or returns a non-OK status; callers should fall back to
 * raw coordinate strings on failure.
 *
 * @param lat - The latitude in decimal degrees.
 * @param lon - The longitude in decimal degrees.
 * @returns A human-readable display name such as `"Seattle, WA"`.
 */
export async function reverseGeocode(
  lat: number,
  lon: number,
): Promise<string> {
  return reverseGeocodeNominatim(lat, lon);
}
