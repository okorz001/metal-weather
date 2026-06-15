"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

/**
 * Subscribes to `localStorage` theme changes via the `storage` window event.
 *
 * @param callback - Called by React when the store may have changed.
 * @returns A cleanup function that removes the listener.
 */
function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

/** Returns `true` when dark mode is active (anything other than `"light"`). */
function getSnapshot(): boolean {
  return localStorage.getItem("theme") !== "light";
}

/** Server snapshot: always dark so SSR output matches the default client state. */
function getServerSnapshot(): boolean {
  return true;
}

interface SettingsContextValue {
  isDark: boolean;
  toggleDark: () => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  isDark: true,
  toggleDark: () => {},
});

/**
 * Provides application-wide display settings to the component tree and
 * renders a full-page wrapper that carries the `dark` class when dark mode
 * is active.
 *
 * The theme is backed by `localStorage` under the key `"theme"` (`"dark"` or
 * `"light"`). `useSyncExternalStore` reads it on the client and subscribes to
 * the `storage` event so changes propagate across tabs. The server snapshot
 * always returns `true` (dark) so the initial server and client renders agree,
 * avoiding hydration mismatches; React re-renders after hydration if the
 * stored preference differs.
 *
 * @param children - The component subtree that can access settings via
 *   {@link useSettings}.
 * @returns The settings provider element wrapping a themed div.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const isDark = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  function toggleDark() {
    localStorage.setItem("theme", isDark ? "light" : "dark");
    window.dispatchEvent(new StorageEvent("storage"));
  }

  return (
    <SettingsContext.Provider value={{ isDark, toggleDark }}>
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
 * Falls back to default values (`isDark: true`, no-op toggle) when rendered
 * outside a provider, which keeps component unit tests simple.
 *
 * @returns The current settings context value.
 */
export function useSettings(): SettingsContextValue {
  return useContext(SettingsContext);
}
