import type { WeatherData, WeatherDataHourly, WeatherStatus } from "./types";

// WMO weather interpretation codes — internal to this module.
enum WeatherCode {
  ClearSky = 0,
  MainlyClear = 1,
  PartlyCloudy = 2,
  Overcast = 3,
  Fog = 45,
  DepositingRimeFog = 48,
  DrizzleLight = 51,
  DrizzleModerate = 53,
  DrizzleDense = 55,
  FreezingDrizzleLight = 56,
  FreezingDrizzleHeavy = 57,
  RainSlight = 61,
  RainModerate = 63,
  RainHeavy = 65,
  FreezingRainLight = 66,
  FreezingRainHeavy = 67,
  SnowSlight = 71,
  SnowModerate = 73,
  SnowHeavy = 75,
  SnowGrains = 77,
  RainShowersSlight = 80,
  RainShowersModerate = 81,
  RainShowersViolent = 82,
  SnowShowersSlight = 85,
  SnowShowersHeavy = 86,
  Thunderstorm = 95,
  ThunderstormWithSlightHail = 96,
  ThunderstormWithHeavyHail = 99,
}

const WEATHER_CODE_STATUS: Partial<Record<WeatherCode, WeatherStatus>> = {
  [WeatherCode.ClearSky]: "Clear",
  [WeatherCode.MainlyClear]: "Clear",
  [WeatherCode.PartlyCloudy]: "Partly Cloudy",
  [WeatherCode.Overcast]: "Overcast",
  [WeatherCode.Fog]: "Foggy",
  [WeatherCode.DepositingRimeFog]: "Foggy",
  [WeatherCode.DrizzleLight]: "Drizzle",
  [WeatherCode.DrizzleModerate]: "Drizzle",
  [WeatherCode.DrizzleDense]: "Drizzle",
  [WeatherCode.FreezingDrizzleLight]: "Drizzle",
  [WeatherCode.FreezingDrizzleHeavy]: "Drizzle",
  [WeatherCode.RainSlight]: "Rain",
  [WeatherCode.RainModerate]: "Rain",
  [WeatherCode.RainHeavy]: "Rain",
  [WeatherCode.FreezingRainLight]: "Rain",
  [WeatherCode.FreezingRainHeavy]: "Rain",
  [WeatherCode.SnowSlight]: "Snow",
  [WeatherCode.SnowModerate]: "Snow",
  [WeatherCode.SnowHeavy]: "Snow",
  [WeatherCode.SnowGrains]: "Snow",
  [WeatherCode.RainShowersSlight]: "Rain",
  [WeatherCode.RainShowersModerate]: "Rain",
  [WeatherCode.RainShowersViolent]: "Rain",
  [WeatherCode.SnowShowersSlight]: "Snow",
  [WeatherCode.SnowShowersHeavy]: "Snow",
  [WeatherCode.Thunderstorm]: "Thunderstorm",
  [WeatherCode.ThunderstormWithSlightHail]: "Thunderstorm",
  [WeatherCode.ThunderstormWithHeavyHail]: "Thunderstorm",
};

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const CURRENT_FIELDS =
  "temperature_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,relative_humidity_2m,precipitation,weather_code";
const DAILY_FIELDS = "temperature_2m_max,temperature_2m_min";
const HOURLY_FIELDS = "temperature_2m,weather_code";

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
  const url = `${FORECAST_URL}?latitude=${lat}&longitude=${lon}&current=${CURRENT_FIELDS}&daily=${DAILY_FIELDS}&hourly=${HOURLY_FIELDS}&timezone=auto`;

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
      time: string;
      temperature_2m: number;
      apparent_temperature: number;
      wind_speed_10m: number;
      wind_direction_10m: number;
      relative_humidity_2m: number;
      precipitation: number;
      weather_code: number;
    };
    daily: {
      temperature_2m_max: number[];
      temperature_2m_min: number[];
    };
    hourly: {
      time: string[];
      temperature_2m: number[];
      weather_code: number[];
    };
  };

  const { current, daily } = data;
  const temperatureCelsius = current.temperature_2m;
  const feelsLikeCelsius = current.apparent_temperature;
  const windSpeedKmh = current.wind_speed_10m;
  const precipitationMm = current.precipitation;
  const highCelsius = daily.temperature_2m_max[0];
  const lowCelsius = daily.temperature_2m_min[0];

  const currentHour = current.time.slice(0, 13) + ":00";
  const startIdx = data.hourly.time.indexOf(currentHour) + 1;
  const hourly = data.hourly.time
    .slice(startIdx, startIdx + 12)
    .map((time, i): WeatherDataHourly => {
      const temperatureCelsius = data.hourly.temperature_2m[startIdx + i];
      return {
        time,
        temperatureCelsius,
        temperatureFahrenheit: (temperatureCelsius * 9) / 5 + 32,
        status:
          WEATHER_CODE_STATUS[
            data.hourly.weather_code[startIdx + i] as WeatherCode
          ],
      };
    });

  return {
    displayName,
    temperatureCelsius,
    temperatureFahrenheit: (temperatureCelsius * 9) / 5 + 32,
    feelsLikeCelsius,
    feelsLikeFahrenheit: (feelsLikeCelsius * 9) / 5 + 32,
    windSpeedKmh,
    windSpeedMph: windSpeedKmh * 0.621371,
    windDirectionDeg: current.wind_direction_10m,
    humidityPercent: current.relative_humidity_2m,
    precipitationMm,
    precipitationIn: precipitationMm / 25.4,
    status: WEATHER_CODE_STATUS[current.weather_code as WeatherCode],
    highCelsius,
    highFahrenheit: (highCelsius * 9) / 5 + 32,
    lowCelsius,
    lowFahrenheit: (lowCelsius * 9) / 5 + 32,
    hourly,
  };
}
