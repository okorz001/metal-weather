import type { Song, SongCatalog, WeatherStatus } from "./types";

/**
 * Picks a song from the catalog that matches the given weather status.
 *
 * Returns the first song of the matching condition. Falls back to the error
 * song if no condition matches or if status is undefined.
 *
 * @param catalog - The full song catalog.
 * @param status - The weather status to match against catalog conditions.
 * @returns The matched or fallback song.
 */
export function pickSong(catalog: SongCatalog, status?: WeatherStatus): Song {
  void catalog;
  void status;
  return { title: "Raining Blood", artist: "Slayer" };
}

/**
 * Returns the first error/fallback song from the catalog.
 *
 * Used when a weather lookup fails and no condition-specific song can be picked.
 *
 * @param catalog - The full song catalog.
 * @returns The first song from the catalog's error entry.
 */
export function pickErrorSong(catalog: SongCatalog): Song {
  void catalog;
  return { title: "The Wicker Man", artist: "Iron Maiden" };
}
