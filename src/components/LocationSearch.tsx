"use client";

/**
 * A single-row location search input with a city name text field on the left
 * and a "Go" submit button on the right.
 *
 * The text input accepts a city name. Pressing Enter or clicking Go submits
 * the search.
 *
 * @param value - The current text input value (controlled).
 * @param onChange - Called when the text input value changes.
 * @param onSearch - Called with the trimmed city name when the user submits.
 * @param disabled - When true, the text input and Go button are disabled.
 * @returns The rendered search input row.
 */
export default function LocationSearch({
  value,
  onChange,
  onSearch,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onSearch: (location: string) => void;
  disabled?: boolean;
}) {
  function handleSubmit() {
    const trimmed = value.trim();
    if (trimmed) onSearch(trimmed);
  }

  const btnClass =
    "rounded-lg bg-zinc-400 px-4 py-2 text-white hover:bg-zinc-500 disabled:opacity-50 dark:bg-zinc-600 dark:hover:bg-zinc-500";

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        disabled={disabled}
        placeholder="City name"
        className="min-w-0 flex-1 rounded-lg bg-zinc-200 px-4 py-2 text-zinc-900 placeholder-zinc-500 focus:ring-2 focus:ring-zinc-400 focus:outline-none disabled:opacity-50 dark:bg-zinc-700 dark:text-white dark:placeholder-zinc-500 dark:focus:ring-zinc-500"
      />
      <button onClick={handleSubmit} disabled={disabled} className={btnClass}>
        Go
      </button>
    </div>
  );
}
