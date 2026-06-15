"use client";

import {
  createContext,
  useContext,
  useLayoutEffect,
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
 * Provides application-wide display settings to the component tree and
 * renders a full-page wrapper that carries the `dark` class when dark mode
 * is active.
 *
 * The `dark` class on the wrapper drives all `dark:` Tailwind variants for
 * every descendant. Toggling dark mode is a pure React state update — no
 * imperative DOM manipulation — so the change is immediate and reliable.
 *
 * State is initialized to `true` (dark) so the server render and initial
 * client render always agree, avoiding hydration mismatches. A
 * `useLayoutEffect` then reads `localStorage` and corrects the theme
 * synchronously before the browser paints, so there is no visible flash.
 *
 * @param children - The component subtree that can access settings via
 *   {@link useSettings}.
 * @returns The settings provider element wrapping a themed div.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  useLayoutEffect(() => {
    const applyTheme = () => {
      setIsDark(localStorage.getItem("theme") !== "light");
    };
    applyTheme();
    window.addEventListener("storage", applyTheme);
    return () => window.removeEventListener("storage", applyTheme);
  }, []);

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
