"use client";

import type { Song, WeatherData } from "@/lib/types";

import MusicPlayer from "./MusicPlayer";
import { useSettings } from "./SettingsContext";

function toCardinal(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

/**
 * Displays current weather data and the matched metal song.
 *
 * Shows condition label, location, temperature, wind speed and cardinal
 * direction, humidity, precipitation, and a "Now Playing" section with the
 * song title and artist. Unit system (metric vs imperial) is read from
 * {@link useSettings}.
 *
 * @param weather - Normalized weather data to display.
 * @param song - The metal song matched to the current weather condition.
 * @returns The rendered weather card element.
 */
export default function WeatherCard({
  weather,
  song,
}: {
  weather: WeatherData;
  song: Song;
}) {
  const { isMetric } = useSettings();

  const displayTemp = isMetric
    ? `${weather.temperatureCelsius.toFixed(1)} °C`
    : `${weather.temperatureFahrenheit.toFixed(1)} °F`;

  const displayWind = isMetric
    ? `${weather.windSpeedKmh} km/h ${toCardinal(weather.windDirectionDeg)}`
    : `${weather.windSpeedMph.toFixed(1)} mph ${toCardinal(weather.windDirectionDeg)}`;

  const displayPrecip = isMetric
    ? `${weather.precipitationMm} mm`
    : `${weather.precipitationIn.toFixed(2)} in`;

  return (
    <div className="rounded-lg bg-zinc-50 p-6 text-zinc-900 dark:bg-zinc-900 dark:text-white">
      <div className="mb-4">
        <div className="text-sm font-semibold tracking-wide text-zinc-600 uppercase dark:text-zinc-400">
          {weather.status}
        </div>
        <div className="text-xl font-bold">{weather.displayName}</div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Temperature
          </div>
          <div className="font-semibold">{displayTemp}</div>
        </div>
        <div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">Wind</div>
          <div className="font-semibold">{displayWind}</div>
        </div>
        <div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Humidity
          </div>
          <div className="font-semibold">{weather.humidityPercent}%</div>
        </div>
        <div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Precipitation
          </div>
          <div className="font-semibold">{displayPrecip}</div>
        </div>
      </div>

      <div className="border-t border-zinc-200 pt-4 dark:border-zinc-700">
        <div className="text-sm font-semibold tracking-wide text-zinc-600 uppercase dark:text-zinc-400">
          Now Playing
        </div>
        <div className="font-bold">{song.title}</div>
        <div className="text-zinc-700 dark:text-zinc-300">{song.artist}</div>
        <MusicPlayer song={song} />
      </div>
    </div>
  );
}
