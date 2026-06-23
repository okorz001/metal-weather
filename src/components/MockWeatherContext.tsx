"use client";

import { useSearchParams } from "next/navigation";
import { createContext, useContext, type ReactNode } from "react";

import { parseMockWeather } from "@/lib/mockWeather";
import type { WeatherData } from "@/lib/types";

const MockWeatherContext = createContext<Partial<WeatherData>>({});

/**
 * Provides mock weather overrides parsed from the query string to the component
 * tree.
 *
 * Reads underscore-prefixed development parameters (e.g. `?_status=Rain`) via
 * {@link parseMockWeather} so the rendering layer can merge them on top of the
 * real fetched weather data. The overrides never reach the data layer.
 *
 * Must be rendered inside a `<Suspense>` boundary because it uses
 * `useSearchParams`.
 *
 * @param children - The component subtree that can access the overrides via
 *   {@link useMockWeather}.
 * @returns The mock weather provider element.
 */
export function MockWeatherProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const mockWeather = parseMockWeather(
    new URLSearchParams(searchParams.toString()),
  );

  return (
    <MockWeatherContext.Provider value={mockWeather}>
      {children}
    </MockWeatherContext.Provider>
  );
}

/**
 * Returns the mock weather overrides from the nearest
 * {@link MockWeatherProvider}.
 *
 * Falls back to an empty object when rendered outside a provider, which makes
 * it a no-op and keeps component unit tests simple.
 *
 * @returns The current mock weather overrides.
 */
export function useMockWeather(): Partial<WeatherData> {
  return useContext(MockWeatherContext);
}
