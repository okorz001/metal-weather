"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

/**
 * Subscribes to `localStorage` changes via the `storage` window event.
 * Shared by all settings stores; any write dispatches a `StorageEvent` so
 * every store re-reads its own key.
 *
 * @param callback - Called by React when the store may have changed.
 * @returns A cleanup function that removes the listener.
 */
function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

/** Returns `true` when dark mode is active (anything other than `"light"`). */
function getThemeSnapshot(): boolean {
  return localStorage.getItem("theme") !== "light";
}

/** Server snapshot: always dark so SSR output matches the default client state. */
function getThemeServerSnapshot(): boolean {
  return true;
}

/** Returns `true` when metric units are active (only when explicitly set to `"metric"`). */
function getUnitsSnapshot(): boolean {
  return localStorage.getItem("units") === "metric";
}

/** Server snapshot: always imperial. */
function getUnitsServerSnapshot(): boolean {
  return false;
}

interface SettingsContextValue {
  isDark: boolean;
  isMetric: boolean;
  toggleDark: () => void;
  toggleMetric: () => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  isDark: true,
  isMetric: false,
  toggleDark: () => {},
  toggleMetric: () => {},
});

/**
 * Provides application-wide display settings to the component tree and
 * renders a full-page wrapper that carries the `dark` class when dark mode
 * is active.
 *
 * Both `theme` and `units` preferences are backed by `localStorage` and read
 * via `useSyncExternalStore`. The server snapshots always return the defaults
 * (dark, imperial) so SSR and the initial client render agree, avoiding
 * hydration mismatches. React re-renders after hydration if the stored
 * preferences differ. Toggle functions write to `localStorage` and dispatch a
 * `StorageEvent` to notify the same-tab subscribers; cross-tab sync is handled
 * automatically by the browser's native `storage` event.
 *
 * @param children - The component subtree that can access settings via
 *   {@link useSettings}.
 * @returns The settings provider element wrapping a themed div.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const isDark = useSyncExternalStore(
    subscribe,
    getThemeSnapshot,
    getThemeServerSnapshot,
  );
  const isMetric = useSyncExternalStore(
    subscribe,
    getUnitsSnapshot,
    getUnitsServerSnapshot,
  );

  function toggleDark() {
    localStorage.setItem("theme", isDark ? "light" : "dark");
    window.dispatchEvent(new StorageEvent("storage"));
  }

  function toggleMetric() {
    localStorage.setItem("units", isMetric ? "imperial" : "metric");
    window.dispatchEvent(new StorageEvent("storage"));
  }

  return (
    <SettingsContext.Provider
      value={{ isDark, isMetric, toggleDark, toggleMetric }}
    >
      <div
        className={
          isDark
            ? "dark min-h-screen bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100"
            : "min-h-screen bg-zinc-100 text-zinc-900"
        }
      >
        {children}
      </div>
    </SettingsContext.Provider>
  );
}

/**
 * Returns the current application settings from the nearest
 * {@link SettingsProvider}.
 *
 * Falls back to default values (`isDark: true`, `isMetric: true`, no-op
 * toggles) when rendered outside a provider, which keeps component unit
 * tests simple.
 *
 * @returns The current settings context value.
 */
export function useSettings(): SettingsContextValue {
  return useContext(SettingsContext);
}
