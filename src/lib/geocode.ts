const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const REVERSE_GEOCODING_URL =
  "https://api.bigdatacloud.net/data/reverse-geocode-client";

interface GeocodingResult {
  latitude: number;
  longitude: number;
  name: string;
  admin1?: string;
  admin2?: string;
  country?: string;
  country_code?: string;
}

/**
 * Resolves a location name to geographic coordinates.
 *
 * Calls the Open-Meteo Geocoding API and returns the best match.
 * Accepts an optional comma-separated qualifier (e.g. `"San Jose, CA"`) to
 * disambiguate results by matching the qualifier against the region, sub-region,
 * country, or country code fields; falls back to the top result if no qualifier
 * matches. Throws a descriptive error if no results are found or the request fails.
 *
 * @param location - The location name to search for (e.g. "Seattle" or "San Jose, CA").
 * @returns The latitude, longitude, and human-readable display name of the location.
 */
export async function geocodeLocation(
  location: string,
): Promise<{ lat: number; lon: number; displayName: string }> {
  const [cityName, ...rest] = location.split(",").map((s) => s.trim());
  const qualifiers = rest.filter(Boolean);
  const count = qualifiers.length > 0 ? 10 : 1;

  const url = `${GEOCODING_URL}?name=${encodeURIComponent(cityName)}&count=${count}&language=en&format=json`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch (e) {
    throw new Error(
      `Failed to reach geocoding service: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  if (!response.ok) {
    throw new Error(`Geocoding request failed with status ${response.status}`);
  }

  const data = (await response.json()) as { results?: GeocodingResult[] };

  if (!data.results || data.results.length === 0) {
    throw new Error(`Location not found: "${location}"`);
  }

  let result = data.results[0];

  if (qualifiers.length > 0) {
    const matches = (field: string, q: string) => {
      const f = field.toLowerCase();
      const lq = q.toLowerCase();
      return f === lq || f.split(/\s+/).some((word) => word.startsWith(lq));
    };
    const match = data.results.find((r) =>
      qualifiers.some((q) =>
        [r.admin1, r.admin2, r.country, r.country_code]
          .filter(Boolean)
          .some((field) => matches(field!, q)),
      ),
    );
    if (match) result = match;
  }

  const countryDisplayNames = new Intl.DisplayNames(["en"], { type: "region" });
  const country = result.country_code
    ? (countryDisplayNames.of(result.country_code) ?? result.country)
    : result.country;

  const displayName = [result.name, result.admin1, country]
    .filter(Boolean)
    .join(", ");

  return { lat: result.latitude, lon: result.longitude, displayName };
}

interface ReverseGeocodingResult {
  city?: string;
  principalSubdivision?: string;
  countryCode?: string;
}

/**
 * Resolves geographic coordinates to a human-readable location name.
 *
 * Calls the BigDataCloud reverse geocoding API (no API key required) and
 * returns a display name built from the city, region, and country. Throws a
 * descriptive error if the request fails or returns a non-OK status; callers
 * should fall back to raw coordinate strings on failure.
 *
 * @param lat - The latitude in decimal degrees.
 * @param lon - The longitude in decimal degrees.
 * @returns A human-readable display name such as "Seattle, Washington, United States".
 */
export async function reverseGeocode(
  lat: number,
  lon: number,
): Promise<string> {
  const url = `${REVERSE_GEOCODING_URL}?latitude=${lat}&longitude=${lon}&localityLanguage=en`;

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

  const data = (await response.json()) as ReverseGeocodingResult;

  const countryDisplayNames = new Intl.DisplayNames(["en"], { type: "region" });
  const country = data.countryCode
    ? (countryDisplayNames.of(data.countryCode) ?? data.countryCode)
    : undefined;

  return [data.city, data.principalSubdivision, country]
    .filter(Boolean)
    .join(", ");
}
