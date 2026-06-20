"use client";

import { useEffect, useRef, useState } from "react";

import { useSettings } from "./SettingsContext";

/**
 * Fixed top application bar for Metal Weather.
 *
 * Renders a persistent header with the site name and a hamburger menu button.
 * The hamburger button toggles a dropdown panel containing display settings.
 * The dropdown closes when the user clicks outside it or presses Escape.
 *
 * @returns The rendered app bar element.
 */
export default function AppBar() {
  const { isDark, toggleDark, isMetric, toggleMetric } = useSettings();
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
    <>
      <div className="h-14" />
      <header className="fixed top-0 right-0 left-0 z-50 flex h-14 items-center bg-zinc-900 px-2 text-zinc-100 shadow-md">
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
            <div className="absolute top-full left-0 mt-1 min-w-48 rounded-lg bg-white shadow-xl dark:bg-zinc-800">
              <div className="p-2">
                <p className="mb-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                  Theme
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      if (isDark) toggleDark();
                    }}
                    className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                      !isDark
                        ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-600 dark:text-white"
                        : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                  >
                    Light
                  </button>
                  <button
                    onClick={() => {
                      if (!isDark) toggleDark();
                    }}
                    className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                      isDark
                        ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-600 dark:text-white"
                        : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                  >
                    Dark
                  </button>
                </div>
              </div>
              <div className="border-t border-zinc-200 p-3 dark:border-zinc-700">
                <p className="mb-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                  Units
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      if (isMetric) toggleMetric();
                    }}
                    className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                      !isMetric
                        ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-600 dark:text-white"
                        : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                  >
                    Imperial
                  </button>
                  <button
                    onClick={() => {
                      if (!isMetric) toggleMetric();
                    }}
                    className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                      isMetric
                        ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-600 dark:text-white"
                        : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                  >
                    Metric
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <h1 className="absolute left-1/2 -mb-2 -translate-x-1/2 font-serif text-4xl tracking-wide">
          Metal Weather
        </h1>
      </header>
    </>
  );
}
