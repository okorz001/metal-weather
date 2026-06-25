"use client";

import type { WeatherData } from "@/lib/types";
import { WEATHER_EMOJI } from "@/lib/weatherEmoji";

import { useSettings } from "./SettingsContext";

const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;

function windDegToCompass(deg: number): string {
  return COMPASS[Math.round(deg / 45) % 8];
}

/**
 * Displays current weather conditions as a card.
 *
 * Shows the current temperature (in the unit system from {@link useSettings}),
 * a large condition emoji, today's high/low and status text, and a details
 * row with current wind speed (with 8-point compass direction) and
 * precipitation amount.
 *
 * @param weather - Normalized weather data to display.
 * @returns The rendered weather card element.
 */
export default function WeatherCard({ weather }: { weather: WeatherData }) {
  const { isMetric } = useSettings();

  const displayTemp = isMetric
    ? `${weather.temperatureCelsius.toFixed(1)}°C`
    : `${weather.temperatureFahrenheit.toFixed(1)}°F`;

  const displayHigh = isMetric
    ? `${weather.highCelsius.toFixed(1)}°`
    : `${weather.highFahrenheit.toFixed(1)}°`;

  const displayLow = isMetric
    ? `${weather.lowCelsius.toFixed(1)}°`
    : `${weather.lowFahrenheit.toFixed(1)}°`;

  const emoji = weather.status != null ? WEATHER_EMOJI[weather.status] : null;

  const compass = windDegToCompass(weather.windDirectionDeg);
  const displayWind = isMetric
    ? `${weather.windSpeedKmh.toFixed(1)} km/h ${compass}`
    : `${weather.windSpeedMph.toFixed(1)} mph ${compass}`;

  const displayPrecip = isMetric
    ? `${weather.precipitationMm.toFixed(1)} mm`
    : `${weather.precipitationIn.toFixed(2)} in`;

  return (
    <div className="rounded-lg bg-zinc-50 p-2 text-zinc-900 dark:bg-zinc-900 dark:text-white">
      <div className="grid grid-cols-[auto_auto] place-items-center justify-around gap-y-2">
        {/* -mb-8 compensates for extra whitespace below glyphs in the serif font */}
        <div className="-mb-4 font-serif text-8xl leading-none">
          {displayTemp}
        </div>
        {emoji && <div className="text-7xl leading-none">{emoji}</div>}
        <div className="text-zinc-600 dark:text-zinc-400">
          {displayHigh} / {displayLow}
        </div>
        {weather.status && (
          <div className="text-zinc-600 dark:text-zinc-400">
            {weather.status}
          </div>
        )}
      </div>
      <div className="mt-2 flex justify-around text-sm text-zinc-600 dark:text-zinc-400">
        <span>Wind: {displayWind}</span>
        <span>Precip: {displayPrecip}</span>
      </div>
    </div>
  );
}
