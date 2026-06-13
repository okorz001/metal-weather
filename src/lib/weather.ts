import { WeatherCode, WEATHER_CODE_STATUS } from "./types";
import type { WeatherData } from "./types";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const CURRENT_FIELDS =
  "temperature_2m,wind_speed_10m,wind_direction_10m,relative_humidity_2m,precipitation,weather_code";

/**
 * Fetches current weather conditions for the given coordinates.
 *
 * Calls the Open-Meteo Forecast API and maps the response to a `WeatherData` object.
 * Throws a descriptive error if the request fails.
 *
 * @param lat - Latitude of the location.
 * @param lon - Longitude of the location.
 * @param displayName - Human-readable location name to include in the result.
 * @returns Normalized current weather data for the location.
 */
export async function fetchWeather(
  lat: number,
  lon: number,
  displayName: string,
): Promise<WeatherData> {
  const url = `${FORECAST_URL}?latitude=${lat}&longitude=${lon}&current=${CURRENT_FIELDS}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch (e) {
    throw new Error(
      `Failed to reach weather service: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  if (!response.ok) {
    throw new Error(`Weather request failed with status ${response.status}`);
  }

  const data = (await response.json()) as {
    current: {
      temperature_2m: number;
      wind_speed_10m: number;
      wind_direction_10m: number;
      relative_humidity_2m: number;
      precipitation: number;
      weather_code: number;
    };
  };

  const { current } = data;
  return {
    displayName,
    temperatureCelsius: current.temperature_2m,
    windSpeedKmh: current.wind_speed_10m,
    windDirectionDeg: current.wind_direction_10m,
    humidityPercent: current.relative_humidity_2m,
    precipitationMm: current.precipitation,
    status: WEATHER_CODE_STATUS[current.weather_code as WeatherCode],
  };
}
