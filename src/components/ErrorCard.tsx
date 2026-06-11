"use client";

import type { Song } from "@/lib/types";

/**
 * Displays an error message alongside a fallback metal song.
 *
 * Styled consistently with WeatherCard using the same dark zinc card appearance.
 *
 * @param message - The error message to display.
 * @param song - The fallback song to show when an error occurs.
 * @returns The rendered error card element.
 */
export default function ErrorCard({
  message,
  song,
}: {
  message: string;
  song: Song;
}) {
  return (
    <div className="rounded-lg bg-zinc-900 p-6 text-white">
      <div className="mb-4">
        <div className="text-sm font-semibold tracking-wide text-red-400 uppercase">
          Error
        </div>
        <div className="font-semibold">{message}</div>
      </div>

      <div className="border-t border-zinc-700 pt-4">
        <div className="text-sm font-semibold tracking-wide text-zinc-400 uppercase">
          Now Playing
        </div>
        <div className="font-bold">{song.title}</div>
        <div className="text-zinc-300">{song.artist}</div>
      </div>
    </div>
  );
}
