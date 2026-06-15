"use client";

import type { Song } from "@/lib/types";

import MusicPlayer from "./MusicPlayer";

/**
 * Displays an error message alongside a fallback metal song.
 *
 * Styled consistently with WeatherCard using the same card appearance.
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
    <div className="rounded-lg bg-zinc-50 p-6 text-zinc-900 dark:bg-zinc-900 dark:text-white">
      <div className="mb-4">
        <div className="text-sm font-semibold tracking-wide text-red-400 uppercase">
          Error
        </div>
        <div className="font-semibold">{message}</div>
      </div>

      <div className="border-t border-zinc-200 pt-4 dark:border-zinc-700">
        <div className="text-sm font-semibold tracking-wide text-zinc-600 uppercase dark:text-zinc-400">
          Now Playing
        </div>
        <div className="font-bold">{song.title}</div>
        <div className="text-zinc-700 dark:text-zinc-300">{song.artist}</div>
        <MusicPlayer song={song} />
      </div>
    </div>
  );
}
