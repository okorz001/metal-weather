"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  addFavorite,
  getFavorites,
  isFavorite,
  removeFavorite,
} from "@/lib/favorites";
import type { Favorite } from "@/lib/types";

/**
 * Subscribes to `localStorage` changes via the `storage` window event.
 *
 * @param callback - Called by React when the store may have changed.
 * @returns A cleanup function that removes the listener.
 */
function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

let _cachedRaw: string | null = undefined!;
let _cachedFavorites: Favorite[] = [];

/**
 * Returns the current favorites list from localStorage.
 *
 * Caches the parsed result keyed on the raw JSON string so that
 * `useSyncExternalStore` receives a stable reference when nothing has changed,
 * preventing React from entering an infinite re-render loop.
 */
function getFavoritesSnapshot(): Favorite[] {
  const raw = localStorage.getItem("favorites");
  if (raw !== _cachedRaw) {
    _cachedRaw = raw;
    _cachedFavorites = getFavorites();
  }
  return _cachedFavorites;
}

const EMPTY_FAVORITES: Favorite[] = [];

/** Server snapshot: always empty so SSR output matches the default client state. */
function getFavoritesServerSnapshot(): Favorite[] {
  return EMPTY_FAVORITES;
}

interface FavoritesContextValue {
  favorites: Favorite[];
  addFavorite: (fav: Favorite) => void;
  removeFavorite: (lat: number, lon: number) => void;
  isFavorite: (lat: number, lon: number) => boolean;
}

const FavoritesContext = createContext<FavoritesContextValue>({
  favorites: [],
  addFavorite: () => {},
  removeFavorite: () => {},
  isFavorite: () => false,
});

/**
 * Provides the favorites list and mutation actions to the component tree.
 *
 * Favorites are persisted to `localStorage` under the key `"favorites"` and
 * read via `useSyncExternalStore`. The server snapshot always returns an empty
 * array so SSR and the initial client render agree, avoiding hydration
 * mismatches. React re-renders after hydration if stored favorites exist. The
 * mutation functions dispatch a `StorageEvent` so same-tab subscribers are
 * notified; cross-tab sync is handled automatically by the browser's native
 * `storage` event.
 *
 * @param children - The component subtree that can access favorites via
 *   {@link useFavorites}.
 * @returns The favorites provider element.
 */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const favorites = useSyncExternalStore(
    subscribe,
    getFavoritesSnapshot,
    getFavoritesServerSnapshot,
  );

  return (
    <FavoritesContext.Provider
      value={{ favorites, addFavorite, removeFavorite, isFavorite }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

/**
 * Returns the current favorites list and mutation actions from the nearest
 * {@link FavoritesProvider}.
 *
 * Falls back to an empty list and no-op functions when rendered outside a
 * provider, which keeps component unit tests simple.
 *
 * @returns The current favorites context value.
 */
export function useFavorites(): FavoritesContextValue {
  return useContext(FavoritesContext);
}
