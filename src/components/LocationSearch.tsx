"use client";

import { useState } from "react";

/**
 * A location search form with a text input and submit button.
 *
 * Submits when the user presses Enter or clicks the button.
 * The input value is preserved after submission so the user can refine it.
 *
 * @param onSearch - Callback invoked with the trimmed location string on submit.
 * @param disabled - When true, disables the input and button.
 * @returns The rendered search form element.
 */
export default function LocationSearch({
  onSearch,
  disabled = false,
}: {
  onSearch: (location: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");

  function handleSubmit() {
    const trimmed = value.trim();
    if (trimmed) {
      onSearch(trimmed);
    }
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        disabled={disabled}
        placeholder="Enter a location"
        className="flex-1 rounded-lg bg-zinc-800 px-4 py-2 text-white placeholder-zinc-500 focus:ring-2 focus:ring-zinc-500 focus:outline-none disabled:opacity-50"
      />
      <button
        onClick={handleSubmit}
        disabled={disabled}
        className="rounded-lg bg-zinc-700 px-4 py-2 text-white hover:bg-zinc-600 disabled:opacity-50"
      >
        Search
      </button>
    </div>
  );
}
