"use client";

import { useEffect, useState } from "react";

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
 * Mounts when the Current Location tab is active and immediately requests the
 * device's GPS position. Unmounts (and resets) when the user switches away,
 * so returning to the tab re-triggers the request.
 *
 * @param onGeoSearch - Called with latitude and longitude on success.
 * @returns Status text: "Locating…" while pending, or a red error on failure.
 */
function LocationTab({
  onGeoSearch,
}: {
  onGeoSearch: (lat: number, lon: number) => void;
}) {
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      // Deferred to avoid synchronous setState in effect body.
      Promise.resolve().then(() =>
        setGeoError("Geolocation is not supported by this browser."),
      );
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => onGeoSearch(pos.coords.latitude, pos.coords.longitude),
      (err) => setGeoError(err.message),
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (geoError) return <p className="text-sm text-red-400">{geoError}</p>;
  return <p className="text-zinc-400">Locating…</p>;
}

/**
 * A tabbed location input component with three modes.
 *
 * - **Current Location**: automatically requests the device's GPS coordinates
 *   via the browser Geolocation API when the tab becomes active and calls
 *   `onGeoSearch` with the result. Coordinates are not pushed to the URL.
 * - **City**: accepts a free-text city name and calls `onSearch` with it for
 *   downstream geocoding.
 * - **Coordinates**: accepts explicit latitude and longitude fields and calls
 *   `onSearch` with a `"lat,lon"` string.
 *
 * The active tab is controlled externally via `tab` and `onTabChange`.
 *
 * @param tab - The currently active tab.
 * @param onTabChange - Called with the new tab when the user switches tabs.
 * @param onSearch - Called on submit from the City or Coordinates tab. City
 *   tab passes a city name; Coordinates tab passes a `"lat,lon"` string.
 * @param onGeoSearch - Called with latitude and longitude when the Current
 *   Location tab successfully obtains the device's position.
 * @param disabled - When true, all inputs and buttons are disabled.
 * @returns The rendered tabbed location input.
 */
export default function LocationSearch({
  tab,
  onTabChange,
  onSearch,
  onGeoSearch,
  disabled = false,
}: {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  onSearch: (location: string) => void;
  onGeoSearch: (lat: number, lon: number) => void;
  disabled?: boolean;
}) {
  const [city, setCity] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");

  function handleCitySubmit() {
    const trimmed = city.trim();
    if (trimmed) onSearch(trimmed);
  }

  function handleCoordsSubmit() {
    const trimmedLat = lat.trim();
    const trimmedLon = lon.trim();
    if (trimmedLat && trimmedLon) onSearch(`${trimmedLat},${trimmedLon}`);
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
        {tab === "location" && <LocationTab onGeoSearch={onGeoSearch} />}
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
              className="min-w-0 flex-1 rounded-lg bg-zinc-700 px-4 py-2 text-white placeholder-zinc-500 focus:ring-2 focus:ring-zinc-500 focus:outline-none disabled:opacity-50"
            />
            <input
              type="number"
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCoordsSubmit()}
              disabled={disabled}
              placeholder="Longitude"
              className="min-w-0 flex-1 rounded-lg bg-zinc-700 px-4 py-2 text-white placeholder-zinc-500 focus:ring-2 focus:ring-zinc-500 focus:outline-none disabled:opacity-50"
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
