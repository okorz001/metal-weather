"use client";

import LocationSearch from "./LocationSearch";

/**
 * A full-screen overlay modal wrapping the location search form.
 *
 * Renders over all other content when `open` is true. Closes automatically
 * when the user submits a text search or triggers GPS (via the inner
 * {@link LocationSearch}). Can also be dismissed via the close button.
 *
 * @param open - Whether the modal is visible.
 * @param onClose - Called when the user explicitly closes the modal.
 * @param value - The current text input value (controlled).
 * @param onChange - Called when the text input value changes.
 * @param onSearch - Called with the trimmed city name when the user submits.
 * @param onGeoSearch - Called with latitude and longitude when GPS succeeds.
 * @param disabled - When true, the search form inputs are disabled.
 * @returns The rendered modal element, or `null` when closed.
 */
export default function LocationModal({
  open,
  onClose,
  value,
  onChange,
  onSearch,
  onGeoSearch,
  disabled = false,
}: {
  open: boolean;
  onClose: () => void;
  value: string;
  onChange: (value: string) => void;
  onSearch: (location: string) => void;
  onGeoSearch: (lat: number, lon: number) => void;
  disabled?: boolean;
}) {
  if (!open) return null;

  function handleSearch(location: string) {
    onSearch(location);
    onClose();
  }

  function handleGeoSearch(lat: number, lon: number) {
    onGeoSearch(lat, lon);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-16">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-zinc-900 dark:text-white">
            Search Location
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-zinc-900 hover:bg-zinc-200 dark:text-white dark:hover:bg-zinc-700"
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
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <LocationSearch
          value={value}
          onChange={onChange}
          onSearch={handleSearch}
          onGeoSearch={handleGeoSearch}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
