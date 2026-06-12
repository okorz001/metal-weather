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
 * A weather condition entry mapping WMO codes to a set of songs.
 *
 * @param label - Human-readable condition name (e.g. "Clear Sky").
 * @param codes - WMO weather code numbers that match this condition.
 * @param songs - Songs associated with this condition.
 */
export interface SongCondition {
  label: string;
  codes: number[];
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
    label: string;
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
 * @param weatherCode - WMO weather interpretation code.
 * @param conditionLabel - Human-readable condition label resolved from the song catalog.
 */
export interface WeatherData {
  displayName: string;
  temperatureCelsius: number;
  windSpeedKmh: number;
  windDirectionDeg: number;
  humidityPercent: number;
  precipitationMm: number;
  weatherCode?: WeatherCode;
  conditionLabel: string;
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
