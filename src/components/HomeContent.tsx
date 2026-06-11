"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import catalog from "@/data/songs.json";
import { geocodeLocation } from "@/lib/geocode";
import { pickErrorSong, pickSong } from "@/lib/songs";
import type { SongCatalog, WeatherResult } from "@/lib/types";
import { fetchWeather } from "@/lib/weather";

import ErrorCard from "./ErrorCard";
import { type Tab, TABS } from "./LocationSearch";
import LocationSearch from "./LocationSearch";
import WeatherCard from "./WeatherCard";

const typedCatalog = catalog as SongCatalog;

function parseTab(value: string | null): Tab {
  return TABS.includes(value as Tab) ? (value as Tab) : "location";
}

/**
 * The main application content component.
 *
 * Reads `?tab=` and `?q=` URL search params and automatically triggers a
 * weather search on mount and whenever the params change. The active tab
 * determines how `q` is interpreted: `coords` and `location` tabs treat it
 * as a `"lat,lon"` string; `city` tab passes it to geocoding. Manages all
 * search state and renders the appropriate result card.
 *
 * Must be rendered inside a `<Suspense>` boundary because it uses
 * `useSearchParams`.
 *
 * @returns The rendered search form and weather or error result.
 */
export default function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const tab = parseTab(searchParams.get("tab"));

  const [result, setResult] = useState<WeatherResult | null>(null);
  // Start in loading state when a query is already in the URL (e.g. on initial load
  // or back/forward navigation), so no synchronous setState is needed inside effects.
  const [loading, setLoading] = useState(!!q);

  // Tracks the currently active search so stale responses are discarded.
  const searchIdRef = useRef(0);

  async function resolve(
    location: string,
    resolveTab: Tab,
  ): Promise<{ lat: number; lon: number; displayName: string }> {
    if (resolveTab === "city") {
      return geocodeLocation(location);
    }
    const [rawLat, rawLon] = location.split(",");
    return { lat: Number(rawLat), lon: Number(rawLon), displayName: location };
  }

  async function runSearch(location: string, searchTab: Tab, id: number) {
    try {
      const { lat, lon, displayName } = await resolve(location, searchTab);
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
    router.push(
      `/?tab=${encodeURIComponent(tab)}&q=${encodeURIComponent(location)}`,
    );
    void runSearch(location, tab, id);
  }

  function handleTabChange(newTab: Tab) {
    router.push(`/?tab=${encodeURIComponent(newTab)}`);
  }

  useEffect(() => {
    if (!q) return;
    const id = ++searchIdRef.current;
    void runSearch(q, tab, id);
  }, [q, tab]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="w-full max-w-lg space-y-6">
      <LocationSearch
        tab={tab}
        onTabChange={handleTabChange}
        onSearch={handleSearch}
        disabled={loading}
      />
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
