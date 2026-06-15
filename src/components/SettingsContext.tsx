"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

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
 * The `dark` class on the wrapper drives all `dark:` Tailwind variants for
 * every descendant. Toggling dark mode is a pure React state update — no
 * imperative DOM manipulation — so the change is immediate and reliable.
 *
 * The theme preference is persisted to `localStorage` under the key
 * `"theme"` (`"dark"` or `"light"`) and restored on mount via the lazy
 * `useState` initializer. `suppressHydrationWarning` on the wrapper
 * silences the React warning that occurs when the server-rendered value
 * (always `"dark"`) differs from a client-side `"light"` preference.
 *
 * @param children - The component subtree that can access settings via
 *   {@link useSettings}.
 * @returns The settings provider element wrapping a themed div.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("theme") !== "light";
  });

  function toggleDark() {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  }

  return (
    <SettingsContext.Provider value={{ isDark, toggleDark }}>
      <div
        suppressHydrationWarning
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
