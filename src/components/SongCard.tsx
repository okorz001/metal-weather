"use client";

import type { Song } from "@/lib/types";

import MusicPlayer from "./MusicPlayer";

/**
 * Displays the matched metal song with cover art and playback controls.
 *
 * Renders a square cover art image on the left and song metadata with
 * {@link MusicPlayer} controls on the right. When `song.coverArt` is absent
 * a grey placeholder block is shown instead.
 *
 * @param song - The metal song to display.
 * @returns The rendered song card element.
 */
export default function SongCard({ song }: { song: Song }) {
  return (
    <div className="flex gap-4 rounded-lg bg-zinc-50 p-4 text-zinc-900 dark:bg-zinc-900 dark:text-white">
      {song.coverArt ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={song.coverArt}
          alt={`${song.title} cover art`}
          className="h-24 w-24 flex-shrink-0 rounded object-cover"
        />
      ) : (
        <div className="h-24 w-24 flex-shrink-0 rounded bg-zinc-300 dark:bg-zinc-700" />
      )}
      <div className="flex min-w-0 flex-col justify-center">
        <div className="text-sm font-semibold tracking-wide text-zinc-600 uppercase dark:text-zinc-400">
          Now Playing
        </div>
        <div className="truncate font-bold">{song.title}</div>
        <div className="truncate text-zinc-700 dark:text-zinc-300">
          {song.artist}
        </div>
        <MusicPlayer song={song} />
      </div>
    </div>
  );
}
