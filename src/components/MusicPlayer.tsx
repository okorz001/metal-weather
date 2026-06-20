"use client";

import { useRef, useState } from "react";

import type { Song } from "@/lib/types";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Minimal HTML5 audio player for a single song.
 *
 * Renders play/pause controls, a seek slider, and an elapsed/total time
 * display. Returns `null` when the song has no `audioFile` set, so callers
 * do not need to guard against missing assets.
 *
 * Playback resets to the beginning whenever `song.audioFile` changes (i.e.
 * when a new weather result selects a different track).
 *
 * @param song - The song to play. Must have `audioFile` populated for the
 *   player to render.
 * @returns The rendered player element, or `null` if no audio file is available.
 */
export default function MusicPlayer({ song }: { song: Song }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [prevAudioFile, setPrevAudioFile] = useState(song.audioFile);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loadError, setLoadError] = useState(false);

  // Derived state reset: when the track changes, reset playback state before
  // rendering so the UI reflects the new song immediately (avoids a useEffect
  // round-trip that would cause a stale intermediate render).
  if (prevAudioFile !== song.audioFile) {
    setPrevAudioFile(song.audioFile);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setLoadError(false);
  }

  if (!song.audioFile) return null;

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      void audio.play();
    }
    setPlaying((p) => !p);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value);
    if (audioRef.current) audioRef.current.currentTime = t;
    setCurrentTime(t);
  };

  return (
    <div className="mt-3 flex min-w-0 items-center gap-3">
      <audio
        ref={audioRef}
        src={song.audioFile}
        autoPlay
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => setPlaying(false)}
        onError={() => setLoadError(true)}
      />
      <button
        onClick={togglePlay}
        disabled={loadError}
        aria-label={playing ? "Pause" : "Play"}
        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-zinc-300 text-zinc-900 hover:bg-zinc-400 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-700 dark:text-white dark:hover:bg-zinc-600"
      >
        {playing ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-3 w-3"
          >
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-3 w-3"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
      <input
        type="range"
        min={0}
        max={duration || 1}
        step={0.1}
        value={currentTime}
        onChange={handleSeek}
        disabled={loadError}
        aria-label="Seek"
        className="h-1 flex-1 cursor-pointer accent-zinc-600 disabled:cursor-not-allowed disabled:opacity-40 dark:accent-zinc-400"
      />
      <span className="flex-shrink-0 font-mono text-xs text-zinc-600 dark:text-zinc-400">
        {`${formatTime(currentTime)} / ${formatTime(duration)}`}
      </span>
    </div>
  );
}
