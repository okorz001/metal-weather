"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import catalog from "@/data/songs.json";
import { geocodeLocation } from "@/lib/geocode";
import { pickErrorSong, pickSong } from "@/lib/songs";
import type { SongCatalog, WeatherResult } from "@/lib/types";
import { fetchWeather } from "@/lib/weather";

import ErrorCard from "./ErrorCard";
import LocationSearch from "./LocationSearch";
import WeatherCard from "./WeatherCard";

const typedCatalog = catalog as SongCatalog;

/**
 * The main application content component.
 *
 * Reads the `?q=` URL search param and automatically triggers a weather search
 * on mount and whenever the param changes. Manages all search state and renders
 * the appropriate result card.
 *
 * Must be rendered inside a `<Suspense>` boundary because it uses `useSearchParams`.
 *
 * @returns The rendered search form and weather or error result.
 */
export default function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";

  const [result, setResult] = useState<WeatherResult | null>(null);
  // Start in loading state when a query is already in the URL (e.g. on initial load
  // or back/forward navigation), so no synchronous setState is needed inside effects.
  const [loading, setLoading] = useState(!!q);

  // Tracks the currently active search so stale responses are discarded.
  const searchIdRef = useRef(0);

  async function resolve(
    location: string,
  ): Promise<{ lat: number; lon: number; displayName: string }> {
    const coords = location.match(/^\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*$/);
    if (coords) {
      return {
        lat: Number(coords[1]),
        lon: Number(coords[2]),
        displayName: location,
      };
    }
    return geocodeLocation(location);
  }

  async function runSearch(location: string, id: number) {
    try {
      const { lat, lon, displayName } = await resolve(location);
      if (searchIdRef.current !== id) return;
      const weather = await fetchWeather(lat, lon, displayName);
      if (searchIdRef.current !== id) return;
      const { song, conditionLabel } = pickSong(
        typedCatalog,
        weather.weatherCode,
      );
      setResult({ ok: true, weather: { ...weather, conditionLabel }, song });
    } catch (e) {
      if (searchIdRef.current !== id) return;
      const message = e instanceof Error ? e.message : "An error occurred";
      setResult({ ok: false, message, song: pickErrorSong(typedCatalog) });
    } finally {
      if (searchIdRef.current === id) setLoading(false);
    }
  }

  function handleSearch(location: string) {
    const id = ++searchIdRef.current;
    setLoading(true);
    setResult(null);
    router.push(`/?q=${encodeURIComponent(location)}`);
    void runSearch(location, id);
  }

  useEffect(() => {
    if (!q) return;
    const id = ++searchIdRef.current;
    void runSearch(q, id);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="w-full max-w-lg space-y-6">
      <LocationSearch onSearch={handleSearch} disabled={loading} />
      {loading && <div>Loading…</div>}
      {!loading && result?.ok === true && (
        <WeatherCard weather={result.weather} song={result.song} />
      )}
      {!loading && result?.ok === false && (
        <ErrorCard message={result.message} song={result.song} />
      )}
    </div>
  );
}
