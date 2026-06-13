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
 * Content for the Current Location tab. Shows a button that requests the
 * device's GPS position when clicked. Unmounts (and resets to idle) when the
 * user switches away, so returning to the tab shows the button again.
 *
 * @param onGeoSearch - Called with latitude and longitude on success.
 * @returns A button in idle state, a "Locating…" message while pending, or a
 *   red error message on failure.
 */
function LocationTab({
  onGeoSearch,
}: {
  onGeoSearch: (lat: number, lon: number) => void;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [geoError, setGeoError] = useState<string | null>(null);

  function handleClick() {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by this browser.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => onGeoSearch(pos.coords.latitude, pos.coords.longitude),
      (err) => {
        setGeoError(err.message);
        setStatus("error");
      },
    );
  }

  if (status === "error")
    return <p className="text-sm text-red-400">{geoError}</p>;
  if (status === "loading") return <p className="text-zinc-400">Locating…</p>;
  return (
    <div className="flex justify-center">
      <button
        onClick={handleClick}
        className="rounded-lg bg-zinc-600 px-4 py-2 text-white hover:bg-zinc-500"
      >
        Get My Location
      </button>
    </div>
  );
}

/**
 * A tabbed location input component with three modes.
 *
 * - **Current Location**: shows a "Get My Location" button. On click, requests
 *   the device's GPS coordinates via the browser Geolocation API and calls
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
