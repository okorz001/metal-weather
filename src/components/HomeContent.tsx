"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import catalog from "@/data/songs.json";
import { geocodeLocation, reverseGeocode } from "@/lib/geocode";
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
 * Reads `?q=` from the URL to initialize the search input and auto-search on
 * mount. The GPS button in `LocationSearch` triggers geolocation; on success,
 * the coordinates are reverse-geocoded to a city name, the input is populated,
 * the URL is updated to `?q=<city>`, and the weather search runs using the
 * known coordinates (skipping a second geocode call). Manages all search state
 * and renders the appropriate result card.
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

  const [inputValue, setInputValue] = useState(q);
  const [result, setResult] = useState<WeatherResult | null>(null);
  // Start in loading state when a query is already in the URL (e.g. on initial
  // load or back/forward navigation), so no synchronous setState is needed
  // inside effects.
  const [loading, setLoading] = useState(!!q);

  // Tracks the currently active search so stale responses are discarded.
  const searchIdRef = useRef(0);
  // Set before a GPS-triggered router.push to prevent the useEffect from
  // starting a redundant geocode call after the URL update.
  const skipQEffect = useRef(false);

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

  async function runSearchFromQuery(location: string, id: number) {
    try {
      const { lat, lon, displayName } = await geocodeLocation(location);
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
    router.push(`/?q=${encodeURIComponent(location)}`);
    void runSearchFromQuery(location, id);
  }

  async function runGeoSearch(lat: number, lon: number, id: number) {
    let displayName = `${lat},${lon}`;
    try {
      displayName = await reverseGeocode(lat, lon);
    } catch {
      // fall back to raw coordinates
    }
    if (searchIdRef.current !== id) return;
    setInputValue(displayName);
    skipQEffect.current = true;
    router.push(`/?q=${encodeURIComponent(displayName)}`);
    await runSearch(lat, lon, displayName, id);
  }

  function handleGeoSearch(lat: number, lon: number) {
    const id = ++searchIdRef.current;
    setLoading(true);
    setResult(null);
    void runGeoSearch(lat, lon, id);
  }

  useEffect(() => {
    if (!q) return;
    if (skipQEffect.current) {
      skipQEffect.current = false;
      return;
    }
    const id = ++searchIdRef.current;
    void runSearchFromQuery(q, id);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mt-3 w-full max-w-lg space-y-3">
      <LocationSearch
        value={inputValue}
        onChange={setInputValue}
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
