"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import catalog from "@/data/songs.json";
import { geocodeLocation, reverseGeocode } from "@/lib/geocode";
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
 * Reads `?tab=` from the URL to initialize the active tab, and `?q=` to
 * auto-search on mount. Tab selection is managed as local React state after
 * the initial render, so switching tabs does not cause a navigation. For
 * `city` and `coords` tabs, automatically triggers a weather search on mount
 * and whenever `q` changes. For the `location` tab, geolocation is triggered
 * by `LocationSearch` and the result is passed directly to `handleGeoSearch`
 * without modifying the URL. Manages all search state and renders the
 * appropriate result card.
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
  const [tab, setTab] = useState<Tab>(() => parseTab(searchParams.get("tab")));

  const [result, setResult] = useState<WeatherResult | null>(null);
  // Start in loading state when a query is already in the URL (e.g. on initial load
  // or back/forward navigation), so no synchronous setState is needed inside effects.
  const [loading, setLoading] = useState(tab !== "location" && !!q);

  // Tracks the currently active search so stale responses are discarded.
  const searchIdRef = useRef(0);

  async function runSearch(
    lat: number,
    lon: number,
    displayName: string,
    id: number,
  ) {
    try {
      const weather = await fetchWeather(lat, lon, displayName);
      if (searchIdRef.current !== id) return;
      const song = pickSong(typedCatalog, weather.status);
      setResult({ ok: true, weather, song });
    } catch (e) {
      if (searchIdRef.current !== id) return;
      const message = e instanceof Error ? e.message : "An error occurred";
      setResult({ ok: false, message, song: pickErrorSong(typedCatalog) });
    } finally {
      if (searchIdRef.current === id) setLoading(false);
    }
  }

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

  async function runSearchFromQuery(
    location: string,
    searchTab: Tab,
    id: number,
  ) {
    try {
      const { lat, lon, displayName } = await resolve(location, searchTab);
      if (searchIdRef.current !== id) return;
      await runSearch(lat, lon, displayName, id);
    } catch (e) {
      if (searchIdRef.current !== id) return;
      const message = e instanceof Error ? e.message : "An error occurred";
      setResult({ ok: false, message, song: pickErrorSong(typedCatalog) });
      setLoading(false);
    }
  }

  function handleSearch(location: string) {
    const id = ++searchIdRef.current;
    setLoading(true);
    setResult(null);
    router.push(
      `/?tab=${encodeURIComponent(tab)}&q=${encodeURIComponent(location)}`,
    );
    void runSearchFromQuery(location, tab, id);
  }

  async function runGeoSearch(lat: number, lon: number, id: number) {
    let displayName = `${lat},${lon}`;
    try {
      displayName = await reverseGeocode(lat, lon);
    } catch {
      // fall back to raw coordinates
    }
    if (searchIdRef.current !== id) return;
    await runSearch(lat, lon, displayName, id);
  }

  function handleGeoSearch(lat: number, lon: number) {
    const id = ++searchIdRef.current;
    setLoading(true);
    setResult(null);
    void runGeoSearch(lat, lon, id);
  }

  function handleTabChange(newTab: Tab) {
    setTab(newTab);
    setResult(null);
  }

  useEffect(() => {
    if (!q || tab === "location") return;
    const id = ++searchIdRef.current;
    void runSearchFromQuery(q, tab, id);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mt-3 w-full max-w-lg space-y-3">
      <LocationSearch
        tab={tab}
        onTabChange={handleTabChange}
        onSearch={handleSearch}
        onGeoSearch={handleGeoSearch}
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
