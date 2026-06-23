import type { Song, SongCatalog, SongContext } from "./types";

/**
 * Picks a song from the catalog matching the given weather context.
 *
 * Iterates catalog conditions in order, returning the first song from the
 * first condition where all of the following hold:
 * - `context.status` matches `condition.status`
 * - `condition.songs` is non-empty (empty arrays act as placeholders and fall
 *   through to the next matching entry)
 * - Every numeric bound on the condition is satisfied by the context. When a
 *   condition omits a bound on an axis that axis is not considered. When a
 *   condition specifies a bound but the corresponding context value is absent,
 *   the condition is skipped (the constraint cannot be verified).
 *
 * Falls back to the error song when no condition matches, `context` is
 * undefined, or `context.status` is undefined.
 *
 * @param catalog - The full song catalog.
 * @param context - Current weather measurements used to match catalog
 *   conditions. Includes `status`, `temperatureFahrenheit`, and `windSpeedMph`.
 * @returns The matched or fallback song.
 */
export function pickSong(catalog: SongCatalog, context?: SongContext): Song {
  if (context?.status !== undefined) {
    for (const condition of catalog.conditions) {
      if (condition.status !== context.status) continue;
      if (condition.songs.length === 0) continue;
      if (condition.minTemperatureFahrenheit !== undefined) {
        if (
          context.temperatureFahrenheit === undefined ||
          context.temperatureFahrenheit < condition.minTemperatureFahrenheit
        )
          continue;
      }
      if (condition.maxTemperatureFahrenheit !== undefined) {
        if (
          context.temperatureFahrenheit === undefined ||
          context.temperatureFahrenheit > condition.maxTemperatureFahrenheit
        )
          continue;
      }
      if (condition.minWindSpeedMph !== undefined) {
        if (
          context.windSpeedMph === undefined ||
          context.windSpeedMph < condition.minWindSpeedMph
        )
          continue;
      }
      return condition.songs[0];
    }
  }
  return pickErrorSong(catalog);
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
  return catalog.error.songs[0];
}
