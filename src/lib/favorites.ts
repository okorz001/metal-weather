import type { Favorite } from "./types";

const KEY = "favorites";

/** Tolerance for floating-point lat/lon comparison (≈11 m at equator). */
const EPSILON = 0.0001;

function coordsMatch(a: Favorite, lat: number, lon: number): boolean {
  return Math.abs(a.lat - lat) < EPSILON && Math.abs(a.lon - lon) < EPSILON;
}

/**
 * Returns all saved favorite locations from localStorage.
 *
 * @returns The list of favorites, or an empty array when none are saved or the
 *   stored data is malformed.
 */
export function getFavorites(): Favorite[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Favorite[];
  } catch {
    return [];
  }
}

/**
 * Adds a location to the favorites list if it is not already present.
 *
 * Identity is determined by comparing lat/lon within {@link EPSILON} degrees.
 * Dispatches a `StorageEvent` on `window` so same-tab subscribers are notified.
 *
 * @param fav - The location to save.
 */
export function addFavorite(fav: Favorite): void {
  const current = getFavorites();
  if (current.some((f) => coordsMatch(f, fav.lat, fav.lon))) return;
  localStorage.setItem(KEY, JSON.stringify([...current, fav]));
  window.dispatchEvent(new StorageEvent("storage"));
}

/**
 * Removes a favorite location by coordinates.
 *
 * No-op if no favorite matches the given coordinates. Dispatches a
 * `StorageEvent` on `window` so same-tab subscribers are notified.
 *
 * @param lat - Latitude of the location to remove.
 * @param lon - Longitude of the location to remove.
 */
export function removeFavorite(lat: number, lon: number): void {
  const next = getFavorites().filter((f) => !coordsMatch(f, lat, lon));
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new StorageEvent("storage"));
}

/**
 * Returns `true` when a location matching the given coordinates is saved.
 *
 * @param lat - Latitude to check.
 * @param lon - Longitude to check.
 * @returns Whether the location is in the favorites list.
 */
export function isFavorite(lat: number, lon: number): boolean {
  return getFavorites().some((f) => coordsMatch(f, lat, lon));
}
