"use client";

import { useState } from "react";

import type { Location } from "@/lib/types";

import LocationSearch from "./LocationSearch";
import RenameFavoriteModal from "./RenameFavoriteModal";

/**
 * A full-screen overlay modal wrapping the location search form and favorites list.
 *
 * Renders over all other content when `open` is true. Closes automatically
 * when the user submits a search or selects a favorite. Can also be dismissed
 * via the close button. When favorites exist, they are listed below the search
 * form with a minus button to remove each one.
 *
 * @param open - Whether the modal is visible.
 * @param onClose - Called when the user explicitly closes the modal.
 * @param value - The current text input value (controlled).
 * @param onChange - Called when the text input value changes.
 * @param onSearch - Called with the trimmed city name when the user submits.
 * @param disabled - When true, the search form inputs are disabled.
 * @param favorites - The list of saved favorite locations to display.
 * @param onSelectFavorite - Called with the chosen favorite when its name is clicked.
 * @param onRemoveFavorite - Called with the favorite to remove when its minus button is clicked.
 * @param onRenameFavorite - Called with the updated coordinates and name when the user saves a rename.
 * @returns The rendered modal element, or `null` when closed.
 */
export default function LocationModal({
  open,
  onClose,
  value,
  onChange,
  onSearch,
  disabled = false,
  favorites,
  onSelectFavorite,
  onRemoveFavorite,
  onRenameFavorite,
}: {
  open: boolean;
  onClose: () => void;
  value: string;
  onChange: (value: string) => void;
  onSearch: (location: string) => void;
  disabled?: boolean;
  favorites: Location[];
  onSelectFavorite: (fav: Location) => void;
  onRemoveFavorite: (fav: Location) => void;
  onRenameFavorite: (lat: number, lon: number, newName: string) => void;
}) {
  const [editingFavorite, setEditingFavorite] = useState<Location | null>(null);

  if (!open) return null;

  function handleSearch(location: string) {
    onSearch(location);
    onClose();
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-2 pt-16">
        <div className="w-full max-w-lg rounded-lg bg-white p-4 shadow-xl dark:bg-zinc-800">
          <div className="mb-2 flex items-center justify-between">
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
            disabled={disabled}
          />
          {favorites.length > 0 && (
            <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-700">
              <p className="mb-1 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                Favorites
              </p>
              <ul>
                {favorites.map((fav) => (
                  <li
                    key={`${fav.lat},${fav.lon}`}
                    className="flex items-center gap-2 py-1"
                  >
                    <div className="min-w-0 flex-1">
                      <button
                        onClick={() => {
                          onSelectFavorite(fav);
                          onClose();
                        }}
                        className="min-w-0 rounded px-1 text-left hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      >
                        <div className="truncate text-zinc-900 dark:text-white">
                          {fav.displayName}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          {fav.lat.toFixed(4)}, {fav.lon.toFixed(4)}
                        </div>
                      </button>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingFavorite(fav);
                      }}
                      aria-label={`Rename ${fav.displayName}`}
                      className="shrink-0 rounded p-1 text-zinc-500 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-700"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onRemoveFavorite(fav)}
                      aria-label={`Remove ${fav.displayName} from favorites`}
                      className="shrink-0 rounded p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    >
                      ❌
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      {editingFavorite && (
        <RenameFavoriteModal
          favorite={editingFavorite}
          onSave={(newName) => {
            onRenameFavorite(editingFavorite.lat, editingFavorite.lon, newName);
            setEditingFavorite(null);
          }}
          onDismiss={() => setEditingFavorite(null)}
        />
      )}
    </>
  );
}
