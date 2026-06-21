"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import catalog from "@/data/songs.json";
import {
  geocodeLocation,
  parseCoordinates,
  reverseGeocode,
} from "@/lib/geocode";
import { pickErrorSong, pickSong } from "@/lib/songs";
import type { Favorite, SongCatalog, WeatherResult } from "@/lib/types";
import { fetchWeather } from "@/lib/weather";

import ErrorCard from "./ErrorCard";
import { useFavorites } from "./FavoritesContext";
import HourlyForecast from "./HourlyForecast";
import LocationBar from "./LocationBar";
import LocationModal from "./LocationModal";
import SongCard from "./SongCard";
import Spinner from "./Spinner";
import WeatherCard from "./WeatherCard";

const typedCatalog = catalog as SongCatalog;

/**
 * The main application content component.
 *
 * Manages location search, weather fetching, and song selection. If `?q=` is
 * present in the URL on load, the search runs automatically. Otherwise the
 * location modal opens so the user can enter a city. Once a result is set the
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
  const [loading, setLoading] = useState(!!q);
  const [modalOpen, setModalOpen] = useState(!q);
  const [currentCoords, setCurrentCoords] = useState<{
    lat: number;
    lon: number;
  } | null>(null);

  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();

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
      setCurrentCoords({ lat, lon });
    } catch (e) {
      if (searchIdRef.current !== id) return;
      const message = e instanceof Error ? e.message : "An error occurred";
      setResult({ ok: false, message, song: pickErrorSong(typedCatalog) });
    } finally {
      if (searchIdRef.current === id) setLoading(false);
    }
  }

  function applyResolvedLocation(resolvedName: string, inputName: string) {
    if (resolvedName !== inputName) {
      skipQEffect.current = true;
      router.replace(`/?q=${encodeURIComponent(resolvedName)}`);
      setInputValue(resolvedName);
    }
  }

  async function runSearchFromQuery(location: string, id: number) {
    const coords = parseCoordinates(location);
    if (coords) {
      const { lat, lon } = coords;
      let displayName = location;
      try {
        const resolved = await reverseGeocode(lat, lon);
        if (resolved) displayName = resolved;
      } catch {
        // fall back to raw coordinate string
      }
      if (searchIdRef.current !== id) return;
      applyResolvedLocation(displayName, location);
      await runSearch(lat, lon, displayName, id);
      return;
    }

    try {
      const { lat, lon, displayName } = await geocodeLocation(location);
      if (searchIdRef.current !== id) return;
      applyResolvedLocation(displayName, location);
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
      const resolved = await reverseGeocode(lat, lon);
      if (resolved) displayName = resolved;
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

  function handleToggleFavorite() {
    if (!currentCoords || !location) return;
    if (isFavorite(currentCoords.lat, currentCoords.lon)) {
      removeFavorite(currentCoords.lat, currentCoords.lon);
    } else {
      addFavorite({
        displayName: location,
        lat: currentCoords.lat,
        lon: currentCoords.lon,
      });
    }
  }

  function handleSelectFavorite(fav: Favorite) {
    const id = ++searchIdRef.current;
    setLoading(true);
    setResult(null);
    setInputValue(fav.displayName);
    skipQEffect.current = true;
    router.push(`/?q=${encodeURIComponent(fav.displayName)}`);
    void runSearch(fav.lat, fav.lon, fav.displayName, id);
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

  const location = result?.ok === true ? result.weather.displayName : null;

  return (
    <div className="mt-2 w-full max-w-3xl space-y-2">
      <LocationBar
        location={location}
        onOpenModal={() => setModalOpen(true)}
        onGeolocate={handleGeoSearch}
        isFavorite={
          currentCoords
            ? isFavorite(currentCoords.lat, currentCoords.lon)
            : false
        }
        onToggleFavorite={handleToggleFavorite}
      />
      <LocationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        value={inputValue}
        onChange={setInputValue}
        onSearch={handleSearch}
        disabled={loading}
        favorites={favorites}
        onSelectFavorite={handleSelectFavorite}
        onRemoveFavorite={(fav) => removeFavorite(fav.lat, fav.lon)}
      />
      {loading && <Spinner />}
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
