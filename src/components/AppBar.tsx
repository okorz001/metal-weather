"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fixed top application bar for Metal Weather.
 *
 * Renders a persistent header with the site name and a hamburger menu button.
 * The hamburger button toggles a dropdown panel that is anchored below it.
 * The dropdown closes when the user clicks outside it or presses Escape.
 *
 * @returns The rendered app bar element.
 */
export default function AppBar() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <header className="fixed top-0 right-0 left-0 z-50 flex h-14 items-center bg-zinc-900 px-4 text-zinc-100 shadow-md">
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen((o) => !o)}
          aria-label="Open menu"
          aria-expanded={isOpen}
          className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-zinc-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            className="h-5 w-5"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 min-w-48 rounded-lg bg-zinc-800 shadow-xl">
            <p className="p-4 text-sm text-zinc-400">
              More options coming soon
            </p>
          </div>
        )}
      </div>

      <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold tracking-wide">
        Metal Weather
      </h1>
    </header>
  );
}
