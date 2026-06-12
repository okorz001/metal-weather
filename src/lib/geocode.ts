const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

/**
 * Resolves a location name to geographic coordinates.
 *
 * Calls the Open-Meteo Geocoding API and returns the best match.
 * Throws a descriptive error if no results are found or the request fails.
 *
 * @param location - The location name to search for (e.g. "Seattle").
 * @returns The latitude, longitude, and human-readable display name of the location.
 */
export async function geocodeLocation(
  location: string,
): Promise<{ lat: number; lon: number; displayName: string }> {
  const url = `${GEOCODING_URL}?name=${encodeURIComponent(location)}&count=1&language=en&format=json`;

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

  const data = (await response.json()) as {
    results?: Array<{
      latitude: number;
      longitude: number;
      name: string;
      admin1?: string;
      country?: string;
    }>;
  };

  if (!data.results || data.results.length === 0) {
    throw new Error(`Location not found: "${location}"`);
  }

  const result = data.results[0];
  const displayName = [result.name, result.admin1, result.country]
    .filter(Boolean)
    .join(", ");

  return { lat: result.latitude, lon: result.longitude, displayName };
}
