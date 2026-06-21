import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  addFavorite,
  getFavorites,
  isFavorite,
  removeFavorite,
} from "./favorites";
import type { Location } from "./types";

const SEATTLE: Location = {
  displayName: "Seattle, WA, US",
  lat: 47.6,
  lon: -122.3,
};
const TOKYO: Location = {
  displayName: "Tokyo, Japan",
  lat: 35.6895,
  lon: 139.6917,
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getFavorites", () => {
  it("returns empty array when localStorage is empty", () => {
    expect(getFavorites()).toEqual([]);
  });

  it("returns empty array when the key is missing", () => {
    localStorage.removeItem("favorites");
    expect(getFavorites()).toEqual([]);
  });

  it("returns empty array when stored JSON is malformed", () => {
    localStorage.setItem("favorites", "not json");
    expect(getFavorites()).toEqual([]);
  });

  it("returns parsed favorites when the key exists", () => {
    localStorage.setItem("favorites", JSON.stringify([SEATTLE]));
    expect(getFavorites()).toEqual([SEATTLE]);
  });
});

describe("addFavorite", () => {
  it("appends a favorite to an empty list", () => {
    addFavorite(SEATTLE);
    expect(getFavorites()).toEqual([SEATTLE]);
  });

  it("appends a second favorite", () => {
    addFavorite(SEATTLE);
    addFavorite(TOKYO);
    expect(getFavorites()).toEqual([SEATTLE, TOKYO]);
  });

  it("is idempotent — same coords twice yields one entry", () => {
    addFavorite(SEATTLE);
    addFavorite(SEATTLE);
    expect(getFavorites()).toHaveLength(1);
  });

  it("dispatches a StorageEvent", () => {
    const handler = vi.fn();
    window.addEventListener("storage", handler);
    addFavorite(SEATTLE);
    window.removeEventListener("storage", handler);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe("removeFavorite", () => {
  it("removes the matching favorite", () => {
    addFavorite(SEATTLE);
    addFavorite(TOKYO);
    removeFavorite(SEATTLE.lat, SEATTLE.lon);
    expect(getFavorites()).toEqual([TOKYO]);
  });

  it("is a no-op when coords are not found", () => {
    addFavorite(SEATTLE);
    removeFavorite(0, 0);
    expect(getFavorites()).toHaveLength(1);
  });

  it("dispatches a StorageEvent", () => {
    addFavorite(SEATTLE);
    const handler = vi.fn();
    window.addEventListener("storage", handler);
    removeFavorite(SEATTLE.lat, SEATTLE.lon);
    window.removeEventListener("storage", handler);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe("isFavorite", () => {
  it("returns true for a stored location", () => {
    addFavorite(SEATTLE);
    expect(isFavorite(SEATTLE.lat, SEATTLE.lon)).toBe(true);
  });

  it("returns false for an unknown location", () => {
    expect(isFavorite(0, 0)).toBe(false);
  });
});

describe("EPSILON tolerance", () => {
  it("treats coords within 0.00005 degrees as the same location", () => {
    addFavorite(SEATTLE);
    expect(isFavorite(SEATTLE.lat + 0.00005, SEATTLE.lon + 0.00005)).toBe(true);
  });

  it("treats coords 0.0002 degrees apart as different locations", () => {
    addFavorite(SEATTLE);
    expect(isFavorite(SEATTLE.lat + 0.0002, SEATTLE.lon + 0.0002)).toBe(false);
  });
});
