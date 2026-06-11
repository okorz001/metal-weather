"use client";

import { useState } from "react";

/** The three location input modes. */
export type Tab = "location" | "city" | "coords";

/** Ordered list of all tabs, used for validation and rendering. */
export const TABS: Tab[] = ["location", "city", "coords"];

const TAB_LABELS: Record<Tab, string> = {
  location: "Current Location",
  city: "City",
  coords: "Coordinates",
};

/**
 * A tabbed location input component with three modes.
 *
 * - **Current Location**: requests the device's GPS coordinates via the
 *   browser Geolocation API and submits them as `"lat,lon"`.
 * - **City**: accepts a free-text city name and submits it as-is for
 *   downstream geocoding.
 * - **Coordinates**: accepts explicit latitude and longitude fields and
 *   submits them as `"lat,lon"`.
 *
 * The active tab is controlled externally via `tab` and `onTabChange` so the
 * selection can be persisted in the URL.
 *
 * @param tab - The currently active tab.
 * @param onTabChange - Called with the new tab when the user switches tabs.
 * @param onSearch - Callback invoked with a location string on submit. City
 *   tab passes a city name; the other two tabs pass a `"lat,lon"` string.
 * @param disabled - When true, all inputs and buttons are disabled.
 * @returns The rendered tabbed location input.
 */
export default function LocationSearch({
  tab,
  onTabChange,
  onSearch,
  disabled = false,
}: {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  onSearch: (location: string) => void;
  disabled?: boolean;
}) {
  const [city, setCity] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  function handleCitySubmit() {
    const trimmed = city.trim();
    if (trimmed) onSearch(trimmed);
  }

  function handleCoordsSubmit() {
    const trimmedLat = lat.trim();
    const trimmedLon = lon.trim();
    if (trimmedLat && trimmedLon) onSearch(`${trimmedLat},${trimmedLon}`);
  }

  function handleCurrentLocation() {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        onSearch(`${pos.coords.latitude},${pos.coords.longitude}`);
      },
      (err) => {
        setLocating(false);
        setGeoError(err.message);
      },
    );
  }

  const tabButtonClass = (t: Tab) =>
    `flex-1 rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
      tab === t
        ? "bg-zinc-800 text-white"
        : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
    }`;

  return (
    <div>
      <div className="flex gap-px">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => onTabChange(t)}
            className={tabButtonClass(t)}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>
      <div className="rounded-tr-lg rounded-b-lg bg-zinc-800 p-4">
        {tab === "location" && (
          <div className="space-y-2">
            <button
              onClick={handleCurrentLocation}
              disabled={disabled || locating}
              className="w-full rounded-lg bg-zinc-700 px-4 py-2 text-white hover:bg-zinc-600 disabled:opacity-50"
            >
              {locating ? "Locating…" : "Use My Location"}
            </button>
            {geoError && <p className="text-sm text-red-400">{geoError}</p>}
          </div>
        )}
        {tab === "city" && (
          <div className="flex gap-2">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCitySubmit()}
              disabled={disabled}
              placeholder="City name"
              className="flex-1 rounded-lg bg-zinc-700 px-4 py-2 text-white placeholder-zinc-500 focus:ring-2 focus:ring-zinc-500 focus:outline-none disabled:opacity-50"
            />
            <button
              onClick={handleCitySubmit}
              disabled={disabled}
              className="rounded-lg bg-zinc-600 px-4 py-2 text-white hover:bg-zinc-500 disabled:opacity-50"
            >
              Search
            </button>
          </div>
        )}
        {tab === "coords" && (
          <div className="flex gap-2">
            <input
              type="number"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCoordsSubmit()}
              disabled={disabled}
              placeholder="Latitude"
              className="flex-1 rounded-lg bg-zinc-700 px-4 py-2 text-white placeholder-zinc-500 focus:ring-2 focus:ring-zinc-500 focus:outline-none disabled:opacity-50"
            />
            <input
              type="number"
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCoordsSubmit()}
              disabled={disabled}
              placeholder="Longitude"
              className="flex-1 rounded-lg bg-zinc-700 px-4 py-2 text-white placeholder-zinc-500 focus:ring-2 focus:ring-zinc-500 focus:outline-none disabled:opacity-50"
            />
            <button
              onClick={handleCoordsSubmit}
              disabled={disabled}
              className="rounded-lg bg-zinc-600 px-4 py-2 text-white hover:bg-zinc-500 disabled:opacity-50"
            >
              Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
