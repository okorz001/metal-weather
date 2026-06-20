function formatTime(datetime: string): string {
  // Open-Meteo format: "2024-01-01T05:43"
  const hour = parseInt(datetime.slice(11, 13), 10);
  const minute = datetime.slice(14, 16);
  const period = hour < 12 ? "AM" : "PM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute} ${period}`;
}

/**
 * Displays today's sunrise and sunset times in a 2×2 grid.
 *
 * The top row shows a sun emoji and a moon emoji; the bottom row shows the
 * corresponding formatted local times. Times are derived from the ISO-8601
 * datetime strings returned by Open-Meteo.
 *
 * @param sunrise - ISO-8601 datetime string for today's sunrise, e.g. `"2024-01-01T05:43"`.
 * @param sunset - ISO-8601 datetime string for today's sunset, e.g. `"2024-01-01T19:52"`.
 * @returns The rendered sunrise/sunset card element.
 */
export default function SunriseSunsetCard({
  sunrise,
  sunset,
}: {
  sunrise: string;
  sunset: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-lg bg-zinc-50 p-2 text-zinc-900 dark:bg-zinc-900 dark:text-white">
      <div className="flex flex-col items-center gap-2">
        <div className="text-2xl leading-none">☀️</div>
        <div className="text-sm">{formatTime(sunrise)}</div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="text-2xl leading-none">🌙</div>
        <div className="text-sm">{formatTime(sunset)}</div>
      </div>
    </div>
  );
}
