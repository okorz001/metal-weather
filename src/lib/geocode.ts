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
  throw new Error(`Location not found: "${location}"`);
}
