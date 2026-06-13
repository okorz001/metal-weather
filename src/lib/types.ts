/**
 * WMO weather interpretation codes as defined by the World Meteorological Organization.
 *
 * These are vendor-agnostic codes used by weather services (e.g. Open-Meteo) to
 * describe current conditions. See the WMO GRIB code table for the full specification.
 */
export enum WeatherCode {
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

/**
 * High-level weather status derived from a WMO weather code.
 *
 * Groups the fine-grained WMO codes into broad conditions used for
 * song matching and display. Use `WEATHER_CODE_STATUS` to map a
 * `WeatherCode` to its corresponding status.
 */
export type WeatherStatus =
  | "Clear"
  | "Cloudy"
  | "Foggy"
  | "Drizzle"
  | "Rain"
  | "Snow"
  | "Thunderstorm";

/**
 * Maps each `WeatherCode` to its corresponding `WeatherStatus`.
 *
 * Codes absent from this map (e.g. unrecognized values returned by an API)
 * produce `undefined` when indexed, which callers should treat as an unknown
 * condition and fall back to a default behavior.
 */
export const WEATHER_CODE_STATUS: Partial<Record<WeatherCode, WeatherStatus>> =
  {
    [WeatherCode.ClearSky]: "Clear",
    [WeatherCode.MainlyClear]: "Clear",
    [WeatherCode.PartlyCloudy]: "Cloudy",
    [WeatherCode.Overcast]: "Cloudy",
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

/**
 * A single song entry in the catalog.
 *
 * @param title - The song title.
 * @param artist - The performing artist or band.
 * @param youtubeId - Optional YouTube video ID for embedding.
 */
export interface Song {
  title: string;
  artist: string;
  youtubeId?: string;
}

/**
 * A weather condition entry in the song catalog.
 *
 * @param status - The weather status this condition matches.
 * @param songs - Songs associated with this condition.
 */
export interface SongCondition {
  status: WeatherStatus;
  songs: Song[];
}

/**
 * The full song catalog loaded from the JSON data file.
 *
 * @param conditions - List of weather conditions with their songs.
 * @param error - Fallback entry used when no condition matches or an error occurs.
 */
export interface SongCatalog {
  conditions: SongCondition[];
  error: {
    songs: Song[];
  };
}

/**
 * Normalized current weather data returned from the forecast API.
 *
 * @param displayName - Human-readable location name (city, region, country).
 * @param temperatureCelsius - Current temperature in degrees Celsius.
 * @param windSpeedKmh - Current wind speed in km/h.
 * @param windDirectionDeg - Wind direction in degrees (0–360).
 * @param humidityPercent - Relative humidity as a percentage (0–100).
 * @param precipitationMm - Current precipitation in millimeters.
 * @param status - High-level weather status derived from the WMO code. Absent if
 *   the API returned an unrecognized code.
 */
export interface WeatherData {
  displayName: string;
  temperatureCelsius: number;
  windSpeedKmh: number;
  windDirectionDeg: number;
  humidityPercent: number;
  precipitationMm: number;
  status?: WeatherStatus;
}

/**
 * Discriminated union representing a weather lookup result.
 *
 * When `ok` is `true`, `weather` and `song` are present.
 * When `ok` is `false`, `message` describes the error and `song` is the error song.
 */
export type WeatherResult =
  | { ok: true; weather: WeatherData; song: Song }
  | { ok: false; message: string; song: Song };
