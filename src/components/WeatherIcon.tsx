import type { ReactNode } from "react";

import type { WeatherStatus } from "@/lib/types";

// Explicit hex colors (rather than currentColor) so each icon keeps its
// weather-appropriate coloring and stays legible on both the light
// (zinc-50) and dark (zinc-900) card backgrounds.
const SUN = "#f59e0b"; // amber-500
const CLOUD = "#9ca3af"; // gray-400
const RAIN = "#3b82f6"; // blue-500
const SNOW = "#93c5fd"; // blue-300
const BOLT = "#facc15"; // yellow-400

// Shared cloud outline used as the base of the precipitation icons.
const cloud = (
  <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" stroke={CLOUD} />
);

// A six-pointed snowflake (three lines crossed at 60 degrees) centered at
// (cx, cy) with the given arm radius. One arm is vertical; the other two sit
// at +/-30 degrees from horizontal, so their horizontal reach (ax) is large
// and their vertical reach (ay) is small.
function flake(cx: number, cy: number, r: number) {
  const ax = (r * Math.sqrt(3)) / 2;
  const ay = r / 2;
  return (
    <g key={`${cx}-${cy}`}>
      <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} />
      <line x1={cx - ax} y1={cy + ay} x2={cx + ax} y2={cy - ay} />
      <line x1={cx + ax} y1={cy + ay} x2={cx - ax} y2={cy - ay} />
    </g>
  );
}

/**
 * Inline SVG glyph for each {@link WeatherStatus}.
 *
 * Each entry is the set of child shapes drawn inside the shared 24x24
 * viewBox of {@link WeatherIcon}. Stroke colors are baked in per shape so a
 * single status can mix hues (e.g. a gray cloud over blue rain).
 */
const ICONS: Record<WeatherStatus, ReactNode> = {
  Clear: (
    <g stroke={SUN}>
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </g>
  ),
  Cloudy: (
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" stroke={CLOUD} />
  ),
  Foggy: (
    <g stroke={CLOUD}>
      <line x1="3" y1="7" x2="21" y2="7" />
      <line x1="3" y1="11" x2="17" y2="11" />
      <line x1="7" y1="15" x2="21" y2="15" />
      <line x1="3" y1="19" x2="19" y2="19" />
    </g>
  ),
  Drizzle: (
    <>
      {cloud}
      <g stroke={RAIN}>
        <line x1="9" y1="19" x2="9" y2="21" />
        <line x1="15" y1="19" x2="15" y2="21" />
      </g>
    </>
  ),
  Rain: (
    <>
      {cloud}
      <g stroke={RAIN}>
        <line x1="8" y1="18" x2="8" y2="23" />
        <line x1="12" y1="18" x2="12" y2="23" />
        <line x1="16" y1="18" x2="16" y2="23" />
      </g>
    </>
  ),
  Snow: (
    <>
      {cloud}
      <g stroke={SNOW} strokeWidth={1}>
        {flake(9, 20, 1.9)}
        {flake(15, 22, 1.9)}
      </g>
    </>
  ),
  Thunderstorm: (
    <>
      {cloud}
      <polygon
        points="11 12 8 17 11 17 10 22 15 16 12 16"
        stroke={BOLT}
        fill={BOLT}
      />
    </>
  ),
};

/**
 * Shared inline-SVG frame for the weather glyphs.
 *
 * Sizes the icon at `1em` (so it scales with the surrounding font size),
 * establishes the shared 24x24 viewBox and stroke defaults, and exposes an
 * accessible name via `role="img"` and `aria-label`.
 *
 * @param label - Accessible name announced by assistive technology.
 * @param className - Optional additional CSS classes applied to the `<svg>`.
 * @param children - The shapes drawn inside the viewBox.
 * @returns The rendered `<svg>` element.
 */
function Glyph({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <svg
      role="img"
      aria-label={label}
      className={className}
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

/**
 * Renders a weather condition as an inline SVG icon.
 *
 * The icon is drawn at `1em`, so it scales with the surrounding font size
 * (e.g. Tailwind's `text-7xl` / `text-2xl`). Colors are fixed per status and
 * chosen to read on both light and dark card backgrounds. An `aria-label`
 * exposes the status name to assistive technology.
 *
 * @param status - The weather status to render an icon for.
 * @param className - Optional additional CSS classes applied to the `<svg>`.
 * @returns The rendered weather icon element.
 */
export default function WeatherIcon({
  status,
  className,
}: {
  status: WeatherStatus;
  className?: string;
}) {
  return (
    <Glyph label={status} className={className}>
      {ICONS[status]}
    </Glyph>
  );
}

/**
 * Renders a wind icon: two curling airflow streams.
 *
 * Deliberately simpler than the busy "gust" emoji. Drawn at `1em` in the
 * neutral cloud gray so it reads on both light and dark card backgrounds.
 *
 * @param className - Optional additional CSS classes applied to the `<svg>`.
 * @returns The rendered wind icon element.
 */
export function WindIcon({ className }: { className?: string }) {
  return (
    <Glyph label="Wind" className={className}>
      <g stroke={CLOUD}>
        <path d="M3 9h9a2.5 2.5 0 1 0 -2.5 -2.5" />
        <path d="M3 15h13a2.5 2.5 0 1 1 -2.5 2.5" />
      </g>
    </Glyph>
  );
}

/**
 * Renders a precipitation icon: a single filled water drop.
 *
 * Drawn at `1em` in the rain blue so it reads on both light and dark card
 * backgrounds.
 *
 * @param className - Optional additional CSS classes applied to the `<svg>`.
 * @returns The rendered precipitation icon element.
 */
export function PrecipitationIcon({ className }: { className?: string }) {
  return (
    <Glyph label="Precipitation" className={className}>
      <path
        d="M12 3.5C12 3.5 6.5 10 6.5 14a5.5 5.5 0 1 0 11 0C17.5 10 12 3.5 12 3.5Z"
        fill={RAIN}
        stroke={RAIN}
      />
    </Glyph>
  );
}

/**
 * Renders a directional arrow icon (used to mark the daily high and low).
 *
 * Drawn at `1em` in `currentColor`, so the caller controls both size and
 * color via CSS (e.g. Tailwind `text-red-500` / `text-blue-500`).
 *
 * @param direction - Which way the arrow points.
 * @param label - Accessible name announced by assistive technology.
 * @param className - Optional additional CSS classes applied to the `<svg>`.
 * @returns The rendered arrow icon element.
 */
export function ArrowIcon({
  direction,
  label,
  className,
}: {
  direction: "up" | "down";
  label: string;
  className?: string;
}) {
  return (
    <Glyph label={label} className={className}>
      <g stroke="currentColor">
        {direction === "up" ? (
          <>
            <line x1="12" y1="20" x2="12" y2="5" />
            <polyline points="6 11 12 5 18 11" />
          </>
        ) : (
          <>
            <line x1="12" y1="4" x2="12" y2="19" />
            <polyline points="6 13 12 19 18 13" />
          </>
        )}
      </g>
    </Glyph>
  );
}
