"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import catalog from "@/data/songs.json";
import { geocodeLocation, reverseGeocode } from "@/lib/geocode";
import { pickErrorSong, pickSong } from "@/lib/songs";
import type { SongCatalog, WeatherResult } from "@/lib/types";
import { fetchWeather } from "@/lib/weather";

import ErrorCard from "./ErrorCard";
import HourlyForecast from "./HourlyForecast";
import LocationBar from "./LocationBar";
import LocationModal from "./LocationModal";
import SongCard from "./SongCard";
import WeatherCard from "./WeatherCard";

const typedCatalog = catalog as SongCatalog;

/**
 * The main application content component.
 *
 * Manages location search, weather fetching, and song selection. On first
 * render the location modal opens automatically. Once a result is set the
 * modal closes and the user can reopen it by clicking the {@link LocationBar}.
 * The GPS button in {@link LocationBar} triggers geolocation directly without
 * opening the modal. Manages all search state and renders the appropriate
 * result cards.
 *
 * Must be rendered inside a `<Suspense>` boundary because it uses
 * `useSearchParams`.
 *
 * @returns The rendered location bar, modal, and weather or error result cards.
 */
export default function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";

  const [inputValue, setInputValue] = useState(q);
  const [result, setResult] = useState<WeatherResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(true);

  // Tracks the currently active search so stale responses are discarded.
  const searchIdRef = useRef(0);
  // Skips the useEffect on the initial render so that a ?q= URL param only
  // pre-fills the input without auto-searching (user must click Go).
  const hasMountedRef = useRef(false);
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
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    if (!q) return;
    if (skipQEffect.current) {
      skipQEffect.current = false;
      return;
    }
    const id = ++searchIdRef.current;
    void runSearchFromQuery(q, id);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const location = result?.ok === true ? result.weather.displayName : null;

  return (
    <div className="mt-2 w-full max-w-3xl space-y-2">
      <LocationBar
        location={location}
        onOpenModal={() => setModalOpen(true)}
        onGeolocate={handleGeoSearch}
      />
      <LocationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        value={inputValue}
        onChange={setInputValue}
        onSearch={handleSearch}
        disabled={loading}
      />
      {loading && <div>Loading…</div>}
      {!loading && result?.ok === true && (
        <>
          <WeatherCard weather={result.weather} />
          <SongCard song={result.song} />
          <HourlyForecast hourly={result.weather.hourly} />
        </>
      )}
      {!loading && result?.ok === false && (
        <ErrorCard message={result.message} song={result.song} />
      )}
    </div>
  );
}
