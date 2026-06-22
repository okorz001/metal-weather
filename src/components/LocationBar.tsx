"use client";

/**
 * A three-zone horizontal bar for displaying and changing the active location.
 *
 * The center shows the current location name (or a placeholder) and is
 * clickable to open the search modal. The bookmark icon on the right adds or
 * removes the current location from favorites; it is disabled when no location
 * is loaded.
 *
 * @param location - The current location name, or `null` when no location is set.
 * @param coords - The current coordinates, or `null` when no location is set.
 * @param onOpenModal - Called when the location name area is clicked.
 * @param isFavorite - Whether the current location is saved as a favorite.
 * @param onToggleFavorite - Called when the bookmark button is clicked.
 * @returns The rendered location bar element.
 */
export default function LocationBar({
  location,
  coords = null,
  onOpenModal,
  isFavorite,
  onToggleFavorite,
}: {
  location: string | null;
  coords?: { lat: number; lon: number } | null;
  onOpenModal: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  const iconBtn =
    "rounded p-1 hover:bg-zinc-200 disabled:opacity-50 dark:hover:bg-zinc-700";

  return (
    <div className="flex items-center gap-2 rounded-lg bg-zinc-50 p-2 text-zinc-900 dark:bg-zinc-900 dark:text-white">
      <div className="w-7 flex-shrink-0" />
      <div className="min-w-0 flex-1 overflow-x-auto text-center">
        <button
          onClick={onOpenModal}
          className="rounded px-1 hover:bg-zinc-200 dark:hover:bg-zinc-700"
        >
          <div className="text-lg font-semibold whitespace-nowrap">
            {location ?? (
              <span className="text-zinc-500">Search for a city…</span>
            )}
          </div>
          {coords && (
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}
            </div>
          )}
        </button>
      </div>

      <button
        onClick={onToggleFavorite}
        disabled={location === null}
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        aria-pressed={isFavorite}
        className={`flex-shrink-0 ${iconBtn}`}
      >
        <svg
          viewBox="0 0 24 24"
          fill={isFavorite ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-5 w-5 ${isFavorite ? "text-yellow-400" : "text-zinc-400 dark:text-zinc-600"}`}
        >
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    </div>
  );
}
