"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface SettingsContextValue {
  isDark: boolean;
  toggleDark: () => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  isDark: true,
  toggleDark: () => {},
});

/**
 * Provides application-wide display settings to the component tree.
 *
 * On mount, reads the persisted theme preference from `localStorage`. When
 * `toggleDark` is called it flips the `dark` class on `<html>` and writes
 * the new value to `localStorage` so the preference survives page reloads.
 *
 * @param children - The component subtree that can access settings via
 *   {@link useSettings}.
 * @returns The settings provider element.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem("theme");
    return stored !== "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  function toggleDark() {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  }

  return (
    <SettingsContext.Provider value={{ isDark, toggleDark }}>
      {children}
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
