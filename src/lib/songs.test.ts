import { describe, expect, it } from "vitest";

import { pickErrorSong, pickSong } from "./songs";
import type { SongCatalog } from "./types";

const catalog: SongCatalog = {
  conditions: [
    {
      status: "Rain",
      songs: [{ title: "Raining Blood", artist: "Slayer" }],
    },
    {
      status: "Snow",
      songs: [{ title: "Snowblind", artist: "Black Sabbath" }],
    },
  ],
  error: {
    songs: [{ title: "The Wicker Man", artist: "Iron Maiden" }],
  },
};

const catalogWithContext: SongCatalog = {
  conditions: [
    {
      status: "Clear",
      minTemperatureFahrenheit: 90,
      songs: [{ title: "Too Hot", artist: "Hot Band" }],
    },
    {
      status: "Clear",
      maxTemperatureFahrenheit: 40,
      songs: [{ title: "Frozen", artist: "Cold Band" }],
    },
    {
      status: "Clear",
      minWindSpeedMph: 25,
      songs: [{ title: "Into the Wind", artist: "Windy Band" }],
    },
    {
      status: "Clear",
      songs: [{ title: "Power of the Sun", artist: "Bruce Dickinson" }],
    },
    {
      status: "Rain",
      songs: [{ title: "Raining Blood", artist: "Slayer" }],
    },
  ],
  error: {
    songs: [{ title: "The Wicker Man", artist: "Iron Maiden" }],
  },
};

describe("pickSong", () => {
  it("returns the first song matching the given status", () => {
    expect(pickSong(catalog, { status: "Rain" })).toEqual({
      title: "Raining Blood",
      artist: "Slayer",
    });
  });

  it("falls back to the error song for an unrecognized status", () => {
    expect(pickSong(catalog, { status: "Thunderstorm" })).toEqual({
      title: "The Wicker Man",
      artist: "Iron Maiden",
    });
  });

  it("falls back to the error song when context is undefined", () => {
    expect(pickSong(catalog, undefined)).toEqual({
      title: "The Wicker Man",
      artist: "Iron Maiden",
    });
  });

  it("falls back to the error song when status is undefined", () => {
    expect(pickSong(catalog, {})).toEqual({
      title: "The Wicker Man",
      artist: "Iron Maiden",
    });
  });
});

describe("pickSong with context", () => {
  it("matches the hot condition when temperature meets minimum", () => {
    expect(
      pickSong(catalogWithContext, {
        status: "Clear",
        temperatureFahrenheit: 95,
      }),
    ).toEqual({ title: "Too Hot", artist: "Hot Band" });
  });

  it("matches the cold condition when temperature meets maximum", () => {
    expect(
      pickSong(catalogWithContext, {
        status: "Clear",
        temperatureFahrenheit: 35,
      }),
    ).toEqual({ title: "Frozen", artist: "Cold Band" });
  });

  it("matches the windy condition when wind speed meets minimum", () => {
    expect(
      pickSong(catalogWithContext, { status: "Clear", windSpeedMph: 30 }),
    ).toEqual({ title: "Into the Wind", artist: "Windy Band" });
  });

  it("falls through to generic when no numeric constraint matches", () => {
    expect(
      pickSong(catalogWithContext, {
        status: "Clear",
        temperatureFahrenheit: 70,
        windSpeedMph: 10,
      }),
    ).toEqual({ title: "Power of the Sun", artist: "Bruce Dickinson" });
  });

  it("skips conditions with empty songs arrays and falls through", () => {
    const catalogEmptySongs: SongCatalog = {
      conditions: [
        {
          status: "Clear",
          minTemperatureFahrenheit: 90,
          songs: [],
        },
        {
          status: "Clear",
          songs: [{ title: "Power of the Sun", artist: "Bruce Dickinson" }],
        },
      ],
      error: {
        songs: [{ title: "The Wicker Man", artist: "Iron Maiden" }],
      },
    };
    expect(
      pickSong(catalogEmptySongs, {
        status: "Clear",
        temperatureFahrenheit: 95,
      }),
    ).toEqual({ title: "Power of the Sun", artist: "Bruce Dickinson" });
  });

  it("skips constrained conditions when context value is absent", () => {
    expect(pickSong(catalogWithContext, { status: "Clear" })).toEqual({
      title: "Power of the Sun",
      artist: "Bruce Dickinson",
    });
  });

  it("skips constraints only on the missing axis when one context value is absent", () => {
    expect(
      pickSong(catalogWithContext, {
        status: "Clear",
        temperatureFahrenheit: 95,
      }),
    ).toEqual({ title: "Too Hot", artist: "Hot Band" });
    expect(
      pickSong(catalogWithContext, { status: "Clear", windSpeedMph: 30 }),
    ).toEqual({ title: "Into the Wind", artist: "Windy Band" });
  });

  it("returns non-Clear conditions without numeric context", () => {
    expect(
      pickSong(catalogWithContext, {
        status: "Rain",
        temperatureFahrenheit: 95,
      }),
    ).toEqual({ title: "Raining Blood", artist: "Slayer" });
  });
});

describe("pickErrorSong", () => {
  it("returns the first error song from the catalog", () => {
    expect(pickErrorSong(catalog)).toEqual({
      title: "The Wicker Man",
      artist: "Iron Maiden",
    });
  });
});
