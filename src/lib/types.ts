/**
 * High-level weather status derived from a WMO weather code.
 *
 * Groups the fine-grained WMO codes into broad conditions used for
 * song matching and display.
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
 * A single song entry in the catalog.
 *
 * @param title - The song title.
 * @param artist - The performing artist or band.
 * @param audioFile - Optional path to the MP3 asset served from public/, e.g. `/assets/raining-blood.mp3`.
 * @param youtubeId - Optional YouTube video ID.
 */
export interface Song {
  title: string;
  artist: string;
  audioFile?: string;
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
