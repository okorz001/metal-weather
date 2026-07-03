import type { WeatherData } from "./types";

/**
 * Top-level scalar properties of {@link WeatherData} that may be overridden via
 * underscore-prefixed query string parameters.
 *
 * The `hourly` array is intentionally excluded because it cannot be expressed
 * meaningfully as a single query string value.
 */
const MOCK_WEATHER_KEYS = [
  "displayName",
  "temperatureCelsius",
  "temperatureFahrenheit",
  "feelsLikeCelsius",
  "feelsLikeFahrenheit",
  "windSpeedKmh",
  "windSpeedMph",
  "windDirectionDeg",
  "humidityPercent",
  "precipitationMm",
  "precipitationIn",
  "status",
  "highCelsius",
  "highFahrenheit",
  "lowCelsius",
  "lowFahrenheit",
] as const satisfies readonly (keyof WeatherData)[];

/**
 * Parses mock weather overrides from underscore-prefixed query string
 * parameters.
 *
 * For each mockable top-level property of {@link WeatherData}, the
 * corresponding `_`-prefixed parameter is read (e.g. `?_status=Rain` overrides
 * `status`, `?_temperatureCelsius=5` overrides `temperatureCelsius`). Values
 * that parse as a finite number are coerced to numbers; all other values are
 * kept as strings. Parameters without the underscore prefix and unknown keys
 * are ignored.
 *
 * @param params - The query string parameters to read overrides from.
 * @returns A partial {@link WeatherData} containing only the overridden
 *   properties present in `params`.
 */
export function parseMockWeather(
  params: URLSearchParams,
): Partial<WeatherData> {
  const overrides: Partial<WeatherData> = {};
  for (const key of MOCK_WEATHER_KEYS) {
    const raw = params.get(`_${key}`);
    if (raw === null) continue;
    const num = Number(raw);
    const value = raw.trim() !== "" && Number.isFinite(num) ? num : raw;
    // The allow-list guarantees `key` is a valid WeatherData key; the value is
    // either a string or number, matching every mockable field's type.
    (overrides as Record<string, unknown>)[key] = value;
  }
  return overrides;
}

/**
 * Serializes the underscore-prefixed mock weather overrides in `params` back
 * into a query string fragment, so callers can append it when rewriting the
 * URL.
 *
 * `HomeContent` rewrites the URL with `router.push`/`router.replace`
 * whenever it resolves a location (search, coordinate input, GPS, selecting
 * a favorite, or geocoding on load). Building the new query string from only
 * `name`/`lat`/`lon` would silently drop any `_`-prefixed dev/testing
 * override (see {@link parseMockWeather}) present in the old URL, breaking
 * shareable mock links such as `/?_status=Thunderstorm`. This function
 * extracts every `_`-prefixed key in `params`, in their original order, and
 * returns them as a leading-`&`-joined fragment ready to concatenate onto an
 * existing query string.
 *
 * @param params - The current URL's query string parameters; only its
 *   `_`-prefixed entries are included in the result.
 * @returns A query string fragment such as `&_status=Thunderstorm`, or an
 *   empty string when `params` has no `_`-prefixed entries.
 */
export function serializeMockWeatherParams(params: URLSearchParams): string {
  let fragment = "";
  for (const [key, value] of params) {
    if (!key.startsWith("_")) continue;
    fragment += `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
  }
  return fragment;
}

/**
 * Merges mock weather overrides on top of real weather data.
 *
 * Performs a shallow merge of the top-level properties, so any overridden
 * array or object property replaces the real one entirely. When `mock` is
 * empty the returned object is equivalent to `weather`.
 *
 * @param weather - The real weather data fetched from the API.
 * @param mock - The mock overrides to apply on top of `weather`.
 * @returns A new {@link WeatherData} with the overrides applied.
 */
export function applyMockWeather(
  weather: WeatherData,
  mock: Partial<WeatherData>,
): WeatherData {
  return { ...weather, ...mock };
}
