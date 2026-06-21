/**
 * A centered animated loading spinner.
 *
 * Renders a circular spinning indicator centered horizontally and vertically
 * within its container. Intended as a drop-in replacement for plain text
 * loading placeholders.
 *
 * @returns A centered `<div>` containing an animated spinner ring.
 */
export default function Spinner() {
  return (
    <div className="flex w-full items-center justify-center py-16">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-zinc-600 border-t-transparent" />
    </div>
  );
}
