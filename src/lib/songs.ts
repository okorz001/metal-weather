import type { Song, SongCatalog } from "./types";

/**
 * Picks a song from the catalog that matches the given WMO weather code.
 *
 * Returns the first song of the matching condition. Falls back to the error
 * song if no condition matches the code.
 *
 * @param catalog - The full song catalog.
 * @param weatherCode - The WMO weather interpretation code.
 * @returns The matched song and the human-readable condition label.
 */
export function pickSong(
  catalog: SongCatalog,
  weatherCode: number,
): { song: Song; conditionLabel: string } {
  throw new Error(`pickSong not implemented (weatherCode: ${weatherCode})`);
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
  throw new Error("pickErrorSong not implemented");
}
