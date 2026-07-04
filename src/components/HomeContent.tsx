"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import catalog from "@/data/songs.json";
import {
  geocodeLocation,
  parseCoordinates,
  reverseGeocode,
} from "@/lib/geocode";
import {
  applyMockWeather,
  serializeMockWeatherParams,
} from "@/lib/mockWeather";
import { pickErrorSong, pickSong } from "@/lib/songs";
import type { Location, SongCatalog, WeatherResult } from "@/lib/types";
import { fetchWeather } from "@/lib/weather";

import ErrorCard from "./ErrorCard";
import { useFavorites } from "./FavoritesContext";
import HourlyForecast from "./HourlyForecast";
import LocationBar from "./LocationBar";
import LocationModal from "./LocationModal";
import { useMockWeather } from "./MockWeatherContext";
import SongCard from "./SongCard";
import Spinner from "./Spinner";
import WeatherCard from "./WeatherCard";

const typedCatalog = catalog as SongCatalog;

/**
 * The main application content component.
 *
 * Manages location search, weather fetching, and song selection. If `?lat=` and
 * `?lon=` are present in the URL on load, the weather fetch runs automatically
 * using the optional `?name=` as the display name (reverse geocoding is used
 * when `?name=` is absent). If only `?name=` is present it is geocoded and the
 * URL is updated with the resolved coordinates before fetching. Otherwise the
 * location modal opens so the user can enter a city. Once a result is set the modal closes and the user can reopen it
 * by clicking the {@link LocationBar}. The GPS button in {@link LocationModal}
 * triggers geolocation and closes the modal on success. Manages all search
 * state and renders the appropriate result cards.
 *
 * Must be rendered inside a `<Suspense>` boundary because it uses
 * `useSearchParams`.
 *
 * @returns The rendered location bar, modal, and weather or error result cards.
 */
export default function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const name = searchParams.get("name") ?? "";
  const latStr = searchParams.get("lat") ?? "";
  const lonStr = searchParams.get("lon") ?? "";

  const [inputValue, setInputValue] = useState("");
  const [result, setResult] = useState<WeatherResult | null>(null);
  const [loading, setLoading] = useState(!!(latStr && lonStr) || !!name);
  const [modalOpen, setModalOpen] = useState(!(latStr && lonStr) && !name);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);

  const { favorites, addFavorite, removeFavorite, renameFavorite, isFavorite } =
    useFavorites();

  const mockWeather = useMockWeather();

  // Tracks the currently active search so stale responses are discarded.
  const searchIdRef = useRef(0);
  // Set before a handler-triggered router.push to prevent the useEffect from
  // starting a redundant search after the URL update.
  const skipUrlEffect = useRef(false);

  async function runSearch(
    lat: number,
    lon: number,
    displayName: string,
    id: number,
  ) {
    try {
      const weather = await fetchWeather(lat, lon, displayName);
      if (searchIdRef.current !== id) return;
      setResult({ ok: true, weather });
      setCurrentLocation({ displayName, lat, lon });
    } catch (e) {
      if (searchIdRef.current !== id) return;
      const message = e instanceof Error ? e.message : "An error occurred";
      setResult({ ok: false, message });
    } finally {
      if (searchIdRef.current === id) setLoading(false);
    }
  }

  async function runSearchFromUrl(
    lat: number,
    lon: number,
    displayName: string,
    id: number,
  ) {
    let resolvedName = displayName;
    if (!resolvedName) {
      try {
        const reversed = await reverseGeocode(lat, lon);
        resolvedName = reversed ?? `${lat},${lon}`;
      } catch {
        resolvedName = `${lat},${lon}`;
      }
      if (searchIdRef.current !== id) return;
      skipUrlEffect.current = true;
      router.replace(
        `/?name=${encodeURIComponent(resolvedName)}&lat=${lat}&lon=${lon}${serializeMockWeatherParams(searchParams)}`,
      );
    }
    await runSearch(lat, lon, resolvedName, id);
  }

  async function handleSearch(input: string) {
    const id = ++searchIdRef.current;
    setLoading(true);
    setResult(null);
    setCurrentLocation(null);

    const coords = parseCoordinates(input);
    if (coords) {
      const { lat, lon } = coords;
      let displayName = input;
      try {
        const resolved = await reverseGeocode(lat, lon);
        if (resolved) displayName = resolved;
      } catch {
        // fall back to raw coordinate string
      }
      if (searchIdRef.current !== id) return;
      skipUrlEffect.current = true;
      router.push(
        `/?name=${encodeURIComponent(displayName)}&lat=${lat}&lon=${lon}${serializeMockWeatherParams(searchParams)}`,
      );
      await runSearch(lat, lon, displayName, id);
      return;
    }

    try {
      const { lat, lon, displayName } = await geocodeLocation(input);
      if (searchIdRef.current !== id) return;
      skipUrlEffect.current = true;
      router.push(
        `/?name=${encodeURIComponent(displayName)}&lat=${lat}&lon=${lon}${serializeMockWeatherParams(searchParams)}`,
      );
      await runSearch(lat, lon, displayName, id);
    } catch (e) {
      if (searchIdRef.current !== id) return;
      const message = e instanceof Error ? e.message : "An error occurred";
      setResult({ ok: false, message });
      setLoading(false);
    }
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
    skipUrlEffect.current = true;
    router.push(
      `/?name=${encodeURIComponent(displayName)}&lat=${lat}&lon=${lon}${serializeMockWeatherParams(searchParams)}`,
    );
    await runSearch(lat, lon, displayName, id);
  }

  function handleGeoSearch(lat: number, lon: number) {
    const id = ++searchIdRef.current;
    setLoading(true);
    setResult(null);
    setCurrentLocation(null);
    void runGeoSearch(lat, lon, id);
  }

  function handleToggleFavorite() {
    if (!currentLocation) return;
    if (isFavorite(currentLocation.lat, currentLocation.lon)) {
      removeFavorite(currentLocation.lat, currentLocation.lon);
    } else {
      addFavorite({
        displayName: currentLocation.displayName,
        lat: currentLocation.lat,
        lon: currentLocation.lon,
      });
    }
  }

  function handleSelectFavorite(loc: Location) {
    const id = ++searchIdRef.current;
    setLoading(true);
    setResult(null);
    setCurrentLocation(loc);
    skipUrlEffect.current = true;
    router.push(
      `/?name=${encodeURIComponent(loc.displayName)}&lat=${loc.lat}&lon=${loc.lon}${serializeMockWeatherParams(searchParams)}`,
    );
    void runSearch(loc.lat, loc.lon, loc.displayName, id);
  }

  async function runSearchFromName(inputName: string, id: number) {
    const coords = parseCoordinates(inputName);
    if (coords) {
      const { lat, lon } = coords;
      let displayName = inputName;
      try {
        const resolved = await reverseGeocode(lat, lon);
        if (resolved) displayName = resolved;
      } catch {
        // fall back to raw coordinate string
      }
      if (searchIdRef.current !== id) return;
      skipUrlEffect.current = true;
      router.replace(
        `/?name=${encodeURIComponent(displayName)}&lat=${lat}&lon=${lon}${serializeMockWeatherParams(searchParams)}`,
      );
      await runSearch(lat, lon, displayName, id);
      return;
    }

    try {
      const { lat, lon, displayName } = await geocodeLocation(inputName);
      if (searchIdRef.current !== id) return;
      skipUrlEffect.current = true;
      router.replace(
        `/?name=${encodeURIComponent(displayName)}&lat=${lat}&lon=${lon}${serializeMockWeatherParams(searchParams)}`,
      );
      await runSearch(lat, lon, displayName, id);
    } catch (e) {
      if (searchIdRef.current !== id) return;
      const message = e instanceof Error ? e.message : "An error occurred";
      setResult({ ok: false, message });
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!latStr || !lonStr) return;
    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);
    if (isNaN(lat) || isNaN(lon)) return;
    if (skipUrlEffect.current) {
      skipUrlEffect.current = false;
      return;
    }
    const id = ++searchIdRef.current;
    setLoading(true);
    setResult(null);
    setCurrentLocation(name ? { displayName: name, lat, lon } : null);
    void runSearchFromUrl(lat, lon, name, id);
  }, [latStr, lonStr, name]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!name || latStr || lonStr) return;
    if (skipUrlEffect.current) {
      skipUrlEffect.current = false;
      return;
    }
    const id = ++searchIdRef.current;
    setLoading(true);
    setResult(null);
    setCurrentLocation(null);
    void runSearchFromName(name, id);
  }, [latStr, lonStr, name]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mt-2 w-full max-w-3xl space-y-2">
      <LocationBar
        location={currentLocation?.displayName ?? null}
        coords={currentLocation}
        loading={loading}
        onOpenModal={() => setModalOpen(true)}
        isFavorite={
          currentLocation
            ? isFavorite(currentLocation.lat, currentLocation.lon)
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
        onGeolocate={handleGeoSearch}
        disabled={loading}
        favorites={favorites}
        onSelectFavorite={handleSelectFavorite}
        onRemoveFavorite={(fav) => removeFavorite(fav.lat, fav.lon)}
        onRenameFavorite={renameFavorite}
      />
      {loading && <Spinner />}
      {!loading &&
        result?.ok === true &&
        (() => {
          // Mock overrides from the query string are merged on top of the real
          // data here in the rendering layer, then the song is derived from the
          // merged status so it reflects any mocked condition. With no overrides
          // this matches the real data.
          const weather = applyMockWeather(result.weather, mockWeather);
          const song = pickSong(typedCatalog, {
            status: weather.status,
            temperatureFahrenheit: weather.temperatureFahrenheit,
            windSpeedMph: weather.windSpeedMph,
          });
          return (
            <>
              <WeatherCard weather={weather} />
              <SongCard song={song} />
              <HourlyForecast hourly={weather.hourly} />
            </>
          );
        })()}
      {!loading && result?.ok === false && (
        <ErrorCard
          message={result.message}
          song={pickErrorSong(typedCatalog)}
        />
      )}
    </div>
  );
}
