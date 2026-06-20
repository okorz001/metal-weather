import type { WeatherStatus } from "./types";

/**
 * Maps each {@link WeatherStatus} to a representative emoji character.
 *
 * Used by {@link WeatherCard} and {@link HourlyForecast} to render weather
 * condition icons without relying on external image assets.
 */
export const WEATHER_EMOJI: Record<WeatherStatus, string> = {
  Clear: "☀️",
  Cloudy: "☁️",
  Foggy: "🌫️",
  Drizzle: "🌦️",
  Rain: "🌧️",
  Snow: "❄️",
  Thunderstorm: "⛈️",
};
