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
