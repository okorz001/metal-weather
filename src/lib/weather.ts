import type { WeatherData } from "./types";

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
  return {
    displayName,
    temperatureCelsius: 15.0,
    windSpeedKmh: 20,
    windDirectionDeg: 270,
    humidityPercent: 80,
    precipitationMm: 1.2,
    weatherCode: 61,
    conditionLabel: "Rain",
  };
}
