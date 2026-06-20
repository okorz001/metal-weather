"use client";

import type { WeatherDataHourly } from "@/lib/types";
import { WEATHER_EMOJI } from "@/lib/weatherEmoji";

import { useSettings } from "./SettingsContext";

function formatHour(time: string): string {
  // time format from Open-Meteo: "2024-01-01T14:00"
  const hour = parseInt(time.slice(11, 13), 10);
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

/**
 * Horizontally scrollable 12-hour forecast strip.
 *
 * Each column shows the forecast temperature (top), a weather condition emoji
 * (middle), and a formatted hour label (bottom). Unit system (metric vs
 * imperial) is read from {@link useSettings}.
 *
 * @param hourly - The 12-hour forecast entries from {@link WeatherData}.
 * @returns The rendered hourly forecast strip.
 */
export default function HourlyForecast({
  hourly,
}: {
  hourly: WeatherDataHourly[];
}) {
  const { isMetric } = useSettings();

  return (
    <div className="overflow-x-auto rounded-lg bg-zinc-50 p-2 dark:bg-zinc-900">
      <div className="flex gap-4">
        {hourly.map(
          ({ time, temperatureCelsius, temperatureFahrenheit, status }) => {
            const temp = isMetric
              ? `${temperatureCelsius.toFixed(0)}°`
              : `${temperatureFahrenheit.toFixed(0)}°`;
            const emoji = status != null ? WEATHER_EMOJI[status] : "—";
            return (
              <div
                key={time}
                className="flex min-w-[3.5rem] flex-col items-center gap-1 text-zinc-900 dark:text-white"
              >
                <div className="text-sm font-semibold">{temp}</div>
                <div className="text-2xl leading-none">{emoji}</div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400">
                  {formatHour(time)}
                </div>
              </div>
            );
          },
        )}
      </div>
    </div>
  );
}
