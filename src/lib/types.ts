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
 * @param audioFile - Path to the MP3 asset served from public/, e.g. `/assets/raining-blood.mp3`.
 * @param youtubeId - YouTube video ID.
 * @param startTime - Start time in seconds for the cropped audio clip.
 * @param endTime - End time in seconds for the cropped audio clip.
 * @param fadeIn - Fade-in duration in seconds for the audio clip.
 * @param fadeOut - Fade-out duration in seconds for the audio clip.
 * @param coverArt - Path to the cover art image served from public/, e.g. `/assets/raining-blood.jpg`.
 */
export interface Song {
  title: string;
  artist: string;
  audioFile: string;
  youtubeId: string;
  startTime: number;
  endTime: number;
  fadeIn: number;
  fadeOut: number;
  coverArt?: string;
}

/**
 * A weather condition entry in the song catalog.
 *
 * Numeric bound fields are optional and inclusive. When absent, no constraint
 * is applied on that axis. A condition matches only when all specified bounds
 * are satisfied by the values in the {@link SongContext}.
 *
 * @param status - The weather status this condition matches.
 * @param minTemperatureFahrenheit - Lower inclusive temperature bound in °F.
 *   When absent, no lower temperature constraint is applied.
 * @param maxTemperatureFahrenheit - Upper inclusive temperature bound in °F.
 *   When absent, no upper temperature constraint is applied.
 * @param minWindSpeedMph - Lower inclusive wind speed bound in mph.
 *   When absent, no wind speed constraint is applied.
 * @param songs - Songs associated with this condition. An empty array causes
 *   the condition to be skipped during matching, allowing fall-through to a
 *   more generic entry.
 */
export interface SongCondition {
  status: WeatherStatus;
  minTemperatureFahrenheit?: number;
  maxTemperatureFahrenheit?: number;
  minWindSpeedMph?: number;
  songs: Song[];
}

/**
 * Numeric weather measurements passed to {@link pickSong} to enable
 * condition-specific song matching beyond the categorical {@link WeatherStatus}.
 *
 * All fields are optional. When a field is absent, any catalog condition that
 * specifies a bound on that axis is skipped because the constraint cannot be
 * verified; matching falls through to the next entry.
 *
 * @param status - The current weather status derived from the WMO code.
 * @param temperatureFahrenheit - Current temperature in degrees Fahrenheit.
 * @param windSpeedMph - Current wind speed in mph.
 */
export interface SongContext {
  status?: WeatherStatus;
  temperatureFahrenheit?: number;
  windSpeedMph?: number;
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
 * A single entry in the 12-hour hourly forecast.
 *
 * @param time - ISO-8601 datetime string from Open-Meteo, e.g. `"2024-01-01T14:00"`.
 * @param temperatureCelsius - Forecast temperature in degrees Celsius.
 * @param temperatureFahrenheit - Forecast temperature in degrees Fahrenheit.
 * @param status - Forecast weather status. Absent if the WMO code is unrecognized.
 */
export interface WeatherDataHourly {
  time: string;
  temperatureCelsius: number;
  temperatureFahrenheit: number;
  status?: WeatherStatus;
}

/**
 * Normalized current weather data returned from the forecast API.
 *
 * Temperature, wind speed, and precipitation are provided in both metric and
 * imperial units so the rendering layer can select without conversion.
 *
 * @param displayName - Human-readable location name (city, region, country).
 * @param temperatureCelsius - Current temperature in degrees Celsius.
 * @param temperatureFahrenheit - Current temperature in degrees Fahrenheit.
 * @param windSpeedKmh - Current wind speed in km/h.
 * @param windSpeedMph - Current wind speed in mph.
 * @param windDirectionDeg - Wind direction in degrees (0–360).
 * @param humidityPercent - Relative humidity as a percentage (0–100).
 * @param precipitationMm - Current precipitation in millimeters.
 * @param precipitationIn - Current precipitation in inches.
 * @param status - High-level weather status derived from the WMO code. Absent if
 *   the API returned an unrecognized code.
 * @param highCelsius - Today's forecast high temperature in degrees Celsius.
 * @param highFahrenheit - Today's forecast high temperature in degrees Fahrenheit.
 * @param lowCelsius - Today's forecast low temperature in degrees Celsius.
 * @param lowFahrenheit - Today's forecast low temperature in degrees Fahrenheit.
 * @param hourly - Upcoming 12-hour forecast starting from the current hour.
 */
export interface WeatherData {
  displayName: string;
  temperatureCelsius: number;
  temperatureFahrenheit: number;
  windSpeedKmh: number;
  windSpeedMph: number;
  windDirectionDeg: number;
  humidityPercent: number;
  precipitationMm: number;
  precipitationIn: number;
  status?: WeatherStatus;
  highCelsius: number;
  highFahrenheit: number;
  lowCelsius: number;
  lowFahrenheit: number;
  hourly: WeatherDataHourly[];
}

/**
 * A resolved location with coordinates and a human-readable display name.
 *
 * Used both for saved favorites and as the canonical location type throughout
 * the app. Coordinates are the primary data; the display name is for rendering.
 *
 * @param displayName - Human-readable location name as returned by geocoding.
 * @param lat - Latitude in decimal degrees.
 * @param lon - Longitude in decimal degrees.
 */
export interface Location {
  displayName: string;
  lat: number;
  lon: number;
}

/**
 * Discriminated union representing a weather lookup result.
 *
 * When `ok` is `true`, `weather` holds the fetched data.
 * When `ok` is `false`, `message` describes the error. The song is not stored;
 * it is resolved from the weather status (or the error fallback) at render time.
 */
export type WeatherResult =
  | { ok: true; weather: WeatherData }
  | { ok: false; message: string };
