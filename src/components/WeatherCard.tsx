"use client";

import { useState } from "react";

import type { Song, WeatherData } from "@/lib/types";

function toCardinal(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

/**
 * Displays current weather data and the matched metal song.
 *
 * Shows condition label, location, temperature with a Celsius/Fahrenheit toggle,
 * wind speed and cardinal direction, humidity, precipitation, and a "Now Playing"
 * section with the song title and artist.
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
  const [celsius, setCelsius] = useState(true);

  const displayTemp = celsius
    ? `${weather.temperatureCelsius.toFixed(1)} °C`
    : `${((weather.temperatureCelsius * 9) / 5 + 32).toFixed(1)} °F`;

  return (
    <div className="rounded-lg bg-zinc-900 p-6 text-white">
      <div className="mb-4">
        <div className="text-sm font-semibold tracking-wide text-zinc-400 uppercase">
          {weather.conditionLabel}
        </div>
        <div className="text-xl font-bold">{weather.displayName}</div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <div className="text-sm text-zinc-400">Temperature</div>
          <div className="font-semibold">{displayTemp}</div>
          <button
            onClick={() => setCelsius((c) => !c)}
            className="mt-1 text-xs text-zinc-400 underline hover:text-white"
          >
            Show in {celsius ? "°F" : "°C"}
          </button>
        </div>
        <div>
          <div className="text-sm text-zinc-400">Wind</div>
          <div className="font-semibold">
            {weather.windSpeedKmh} km/h {toCardinal(weather.windDirectionDeg)}
          </div>
        </div>
        <div>
          <div className="text-sm text-zinc-400">Humidity</div>
          <div className="font-semibold">{weather.humidityPercent}%</div>
        </div>
        <div>
          <div className="text-sm text-zinc-400">Precipitation</div>
          <div className="font-semibold">{weather.precipitationMm} mm</div>
        </div>
      </div>

      <div className="border-t border-zinc-700 pt-4">
        <div className="text-sm font-semibold tracking-wide text-zinc-400 uppercase">
          Now Playing
        </div>
        <div className="font-bold">{song.title}</div>
        <div className="text-zinc-300">{song.artist}</div>
      </div>
    </div>
  );
}
