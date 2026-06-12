import { beforeEach, describe, expect, it, vi } from "vitest";

import { geocodeLocation } from "./geocode";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("geocodeLocation", () => {
  it("returns lat, lon, and displayName on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            latitude: 47.60621,
            longitude: -122.33207,
            name: "Seattle",
            admin1: "Washington",
            country: "United States",
          },
        ],
      }),
    } as Response);

    const result = await geocodeLocation("Seattle");
    expect(result).toEqual({
      lat: 47.60621,
      lon: -122.33207,
      displayName: "Seattle, Washington, United States",
    });
  });

  it("omits missing admin1/country fields from displayName", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [{ latitude: 51.5074, longitude: -0.1278, name: "London" }],
      }),
    } as Response);

    const result = await geocodeLocation("London");
    expect(result.displayName).toBe("London");
  });

  it("picks the matching result when a qualifier is provided", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            latitude: 9.9281,
            longitude: -84.0907,
            name: "San José",
            admin1: "San José Province",
            country: "Costa Rica",
            country_code: "CR",
          },
          {
            latitude: 37.3382,
            longitude: -121.8863,
            name: "San Jose",
            admin1: "California",
            country: "United States",
            country_code: "US",
          },
        ],
      }),
    } as Response);

    const result = await geocodeLocation("San Jose, CA");
    expect(result).toEqual({
      lat: 37.3382,
      lon: -121.8863,
      displayName: "San Jose, California, United States",
    });
  });

  it("falls back to first result when qualifier matches nothing", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            latitude: 47.60621,
            longitude: -122.33207,
            name: "Springfield",
            admin1: "Oregon",
            country: "United States",
            country_code: "US",
          },
        ],
      }),
    } as Response);

    const result = await geocodeLocation("Springfield, ZZ");
    expect(result.lat).toBe(47.60621);
  });

  it("throws when results array is empty", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
    } as Response);

    await expect(geocodeLocation("NoSuchPlace")).rejects.toThrow(
      'Location not found: "NoSuchPlace"',
    );
  });

  it("throws when results field is absent", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    await expect(geocodeLocation("NoSuchPlace")).rejects.toThrow(
      'Location not found: "NoSuchPlace"',
    );
  });

  it("throws when the API returns a non-OK status", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 429,
    } as Response);

    await expect(geocodeLocation("Seattle")).rejects.toThrow(
      "Geocoding request failed with status 429",
    );
  });

  it("throws when the network request fails", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    await expect(geocodeLocation("Seattle")).rejects.toThrow(
      "Failed to reach geocoding service: Network error",
    );
  });
});
