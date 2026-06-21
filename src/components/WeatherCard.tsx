"use client";

import type { WeatherData } from "@/lib/types";
import { WEATHER_EMOJI } from "@/lib/weatherEmoji";

import { useSettings } from "./SettingsContext";

/**
 * Displays current weather conditions as a simplified card.
 *
 * Shows the current temperature (in the unit system from {@link useSettings}),
 * a large condition emoji in the top-right corner, and today's high/low
 * temperatures below the emoji. The detail grid (wind, humidity,
 * precipitation), location name, and song section are shown in separate
 * dedicated components.
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
    </div>
  );
}
