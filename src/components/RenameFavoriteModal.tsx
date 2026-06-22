"use client";

import { useEffect, useRef, useState } from "react";

import type { Location } from "@/lib/types";

/**
 * A focused modal dialog for renaming a saved favorite location.
 *
 * Renders as a centered card over a dark backdrop (above `LocationModal`).
 * The text input is pre-filled with the favorite's current display name.
 * Saving with a non-empty value calls `onSave`; saving with an empty value
 * or dismissing via the backdrop or Escape key calls `onDismiss` without
 * changing the name.
 *
 * @param favorite - The favorite location whose name is being edited.
 * @param onSave - Called with the trimmed replacement name when the user confirms.
 * @param onDismiss - Called when the user cancels without saving.
 * @returns The rendered modal element.
 */
export default function RenameFavoriteModal({
  favorite,
  onSave,
  onDismiss,
}: {
  favorite: Location;
  onSave: (newName: string) => void;
  onDismiss: () => void;
}) {
  const [name, setName] = useState(favorite.displayName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onDismiss();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onDismiss]);

  function handleSave() {
    const trimmed = name.trim();
    if (trimmed) {
      onSave(trimmed);
    } else {
      onDismiss();
    }
  }

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4"
      onClick={onDismiss}
    >
      <div
        className="w-full max-w-sm rounded-lg bg-white p-4 shadow-xl dark:bg-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-zinc-900 dark:text-white">
            Rename Favorite
          </h2>
          <button
            onClick={onDismiss}
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
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          className="mb-3 w-full rounded-lg bg-zinc-200 px-2 py-2 text-zinc-900 focus:ring-2 focus:ring-zinc-400 focus:outline-none dark:bg-zinc-700 dark:text-white dark:focus:ring-zinc-500"
        />
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="rounded-lg bg-zinc-400 px-3 py-2 text-white hover:bg-zinc-500 dark:bg-zinc-600 dark:hover:bg-zinc-500"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
