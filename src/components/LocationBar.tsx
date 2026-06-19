"use client";

import { useState } from "react";

/**
 * A three-zone horizontal bar for displaying and changing the active location.
 *
 * The GPS icon button on the left triggers the browser Geolocation API
 * directly and calls `onGeolocate` with the coordinates on success. The center
 * shows the current location name (or a placeholder) and is clickable to open
 * the search modal. The bookmark icon on the right is a static placeholder
 * with no interaction.
 *
 * @param location - The current location name, or `null` when no location is set.
 * @param onOpenModal - Called when the location name area is clicked.
 * @param onGeolocate - Called with latitude and longitude when GPS succeeds.
 * @returns The rendered location bar element.
 */
export default function LocationBar({
  location,
  onOpenModal,
  onGeolocate,
}: {
  location: string | null;
  onOpenModal: () => void;
  onGeolocate: (lat: number, lon: number) => void;
}) {
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading">("idle");

  function handleGpsClick() {
    if (!navigator.geolocation) return;
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoStatus("idle");
        onGeolocate(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setGeoStatus("idle");
      },
    );
  }

  const iconBtn =
    "rounded p-1 hover:bg-zinc-200 disabled:opacity-50 dark:hover:bg-zinc-700";

  return (
    <div className="flex items-center gap-2 rounded-lg bg-zinc-50 px-4 py-3 text-zinc-900 dark:bg-zinc-900 dark:text-white">
      <button
        onClick={handleGpsClick}
        disabled={geoStatus === "loading"}
        aria-label="Detect my location"
        className={iconBtn}
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

      <button
        onClick={onOpenModal}
        className="min-w-0 flex-1 text-center text-sm font-semibold"
      >
        {location ?? <span className="text-zinc-500">Search for a city…</span>}
      </button>

      <div aria-hidden className={iconBtn}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 text-zinc-400 dark:text-zinc-600"
        >
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      </div>
    </div>
  );
}
