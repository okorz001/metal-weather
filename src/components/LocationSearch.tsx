"use client";

import { useState } from "react";

/**
 * A single-row location search input with a GPS button on the left, a city
 * name text field in the middle, and a "Go" submit button on the right.
 *
 * The text input accepts a city name. The GPS button triggers the browser
 * Geolocation API; on success it calls `onGeoSearch` and returns to its idle
 * state — the parent is responsible for reverse-geocoding the coordinates and
 * populating `value`. GPS errors are shown below the input row.
 *
 * @param value - The current text input value (controlled).
 * @param onChange - Called when the text input value changes.
 * @param onSearch - Called with the trimmed city name when the user submits.
 * @param onGeoSearch - Called with latitude and longitude when GPS succeeds.
 * @param disabled - When true, the text input and Go button are disabled.
 *   The GPS button is not affected by this prop.
 * @returns The rendered search input row.
 */
export default function LocationSearch({
  value,
  onChange,
  onSearch,
  onGeoSearch,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onSearch: (location: string) => void;
  onGeoSearch: (lat: number, lon: number) => void;
  disabled?: boolean;
}) {
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "error">(
    "idle",
  );
  const [geoError, setGeoError] = useState<string | null>(null);

  function handleSubmit() {
    const trimmed = value.trim();
    if (trimmed) onSearch(trimmed);
  }

  function handleGpsClick() {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by this browser.");
      setGeoStatus("error");
      return;
    }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoStatus("idle");
        onGeoSearch(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setGeoError(err.message);
        setGeoStatus("error");
      },
    );
  }

  const btnClass =
    "rounded-lg bg-zinc-400 px-4 py-2 text-white hover:bg-zinc-500 disabled:opacity-50 dark:bg-zinc-600 dark:hover:bg-zinc-500";

  return (
    <div>
      <div className="flex gap-2">
        <button
          onClick={handleGpsClick}
          disabled={geoStatus === "loading"}
          aria-label="Use my location"
          className={btnClass}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </button>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          disabled={disabled}
          placeholder="City name"
          className="min-w-0 flex-1 rounded-lg bg-zinc-200 px-4 py-2 text-zinc-900 placeholder-zinc-500 focus:ring-2 focus:ring-zinc-400 focus:outline-none disabled:opacity-50 dark:bg-zinc-700 dark:text-white dark:placeholder-zinc-500 dark:focus:ring-zinc-500"
        />
        <button onClick={handleSubmit} disabled={disabled} className={btnClass}>
          Go
        </button>
      </div>
      {geoStatus === "error" && (
        <p className="mt-1 text-sm text-red-400">{geoError}</p>
      )}
    </div>
  );
}
