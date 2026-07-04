"use client";

import type { WeatherData } from "@/lib/types";

import { useSettings } from "./SettingsContext";
import WeatherIcon, { PrecipitationIcon, WindIcon } from "./WeatherIcon";

/**
 * Displays current weather conditions as a card.
 *
 * Shows the current temperature (in the unit system from {@link useSettings}),
 * a large condition icon, today's high/low and status text, and a details
 * row with current wind speed and precipitation amount.
 *
 * @param weather - Normalized weather data to display.
 * @returns The rendered weather card element.
 */
export default function WeatherCard({ weather }: { weather: WeatherData }) {
  const { isMetric } = useSettings();

  const displayTemp = isMetric
    ? `${Math.round(weather.temperatureCelsius)}°C`
    : `${Math.round(weather.temperatureFahrenheit)}°F`;

  const displayHigh = isMetric
    ? `${Math.round(weather.highCelsius)}°`
    : `${Math.round(weather.highFahrenheit)}°`;

  const displayLow = isMetric
    ? `${Math.round(weather.lowCelsius)}°`
    : `${Math.round(weather.lowFahrenheit)}°`;

  const displayWind = isMetric
    ? `${weather.windSpeedKmh.toFixed(1)} km/h`
    : `${weather.windSpeedMph.toFixed(1)} mph`;

  const displayPrecip = isMetric
    ? `${weather.precipitationMm.toFixed(1)} mm`
    : `${weather.precipitationIn.toFixed(2)} in`;

  return (
    <div className="rounded-lg bg-zinc-50 p-2 text-zinc-900 dark:bg-zinc-900 dark:text-white">
      <div className="grid grid-cols-2 place-items-center gap-1">
        {/* -mb-4 compensates for extra whitespace below glyphs in the serif font */}
        <div className="-mb-6 font-serif text-7xl leading-none">
          {displayTemp}
        </div>
        {weather.status != null ? (
          <WeatherIcon
            status={weather.status}
            className="text-7xl leading-none"
          />
        ) : (
          <div />
        )}
        <div>
          <span className="mr-1 text-xl font-bold text-red-500">↑</span>
          {displayHigh}{" "}
          <span className="text-zinc-600 dark:text-zinc-400">/</span>{" "}
          <span className="mr-1 text-xl font-bold text-blue-500">↓</span>
          {displayLow}
        </div>
        {weather.status ? <div>{weather.status}</div> : <div />}
        <span className="inline-flex items-center gap-1">
          <WindIcon />
          {displayWind}
        </span>
        <span className="inline-flex items-center gap-1">
          <PrecipitationIcon />
          {displayPrecip}
        </span>
      </div>
    </div>
  );
}
