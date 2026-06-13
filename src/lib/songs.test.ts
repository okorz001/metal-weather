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

describe("pickSong", () => {
  it("returns the first song matching the given status", () => {
    expect(pickSong(catalog, "Rain")).toEqual({
      title: "Raining Blood",
      artist: "Slayer",
    });
  });

  it("falls back to the error song for an unrecognized status", () => {
    expect(pickSong(catalog, "Thunderstorm")).toEqual({
      title: "The Wicker Man",
      artist: "Iron Maiden",
    });
  });

  it("falls back to the error song when status is undefined", () => {
    expect(pickSong(catalog, undefined)).toEqual({
      title: "The Wicker Man",
      artist: "Iron Maiden",
    });
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
