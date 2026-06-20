import { beforeEach, describe, expect, it, vi } from "vitest";

import { geocodeLocation, reverseGeocode } from "./geocode";

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
            country: "United States of America (the)",
            country_code: "US",
          },
        ],
      }),
    } as Response);

    const result = await geocodeLocation("Seattle");
    expect(result).toEqual({
      lat: 47.60621,
      lon: -122.33207,
      displayName: "Seattle, WA",
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
      displayName: "San Jose, CA",
    });
  });

  it("prefers exact name match over higher-ranked result with different name", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            latitude: 39.9,
            longitude: -84.2,
            name: "Venice Township",
            admin1: "Ohio",
            country: "United States",
            country_code: "US",
          },
          {
            latitude: 45.4375,
            longitude: 12.3358,
            name: "Venice",
            admin1: "Veneto",
            country: "Italy",
            country_code: "IT",
          },
        ],
      }),
    } as Response);

    const result = await geocodeLocation("Venice");
    expect(result).toEqual({
      lat: 45.4375,
      lon: 12.3358,
      displayName: "Venice, Italy",
    });
  });

  it("applies qualifier filtering within exact name matches", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            latitude: 45.4375,
            longitude: 12.3358,
            name: "Venice",
            admin1: "Veneto",
            country: "Italy",
            country_code: "IT",
          },
          {
            latitude: 33.985,
            longitude: -118.472,
            name: "Venice",
            admin1: "California",
            country: "United States",
            country_code: "US",
          },
        ],
      }),
    } as Response);

    const result = await geocodeLocation("Venice, CA");
    expect(result).toEqual({
      lat: 33.985,
      lon: -118.472,
      displayName: "Venice, CA",
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

describe("reverseGeocode", () => {
  it("abbreviates US state and includes country", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        city: "Seattle",
        principalSubdivision: "Washington",
        countryCode: "US",
      }),
    } as Response);

    const result = await reverseGeocode(47.60621, -122.33207);
    expect(result).toBe("Seattle, WA");
  });

  it("omits subdivision for non-US locations", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        city: "Paris",
        principalSubdivision: "Île-de-France",
        countryCode: "FR",
      }),
    } as Response);

    const result = await reverseGeocode(48.8566, 2.3522);
    expect(result).toBe("Paris, France");
  });

  it("falls back to country when US subdivision has no abbreviation", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        city: "Washington D.C.",
        principalSubdivision: "District of Columbia",
        countryCode: "US",
      }),
    } as Response);

    const result = await reverseGeocode(38.9072, -77.0369);
    expect(result).toBe("Washington D.C., United States");
  });

  it("omits empty city from the display name", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        city: "",
        principalSubdivision: "Washington",
        countryCode: "US",
      }),
    } as Response);

    const result = await reverseGeocode(47.60621, -122.33207);
    expect(result).toBe("WA");
  });

  it("throws when the API returns a non-OK status", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    await expect(reverseGeocode(0, 0)).rejects.toThrow(
      "Reverse geocoding request failed with status 500",
    );
  });

  it("throws when the network request fails", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    await expect(reverseGeocode(0, 0)).rejects.toThrow(
      "Failed to reach reverse geocoding service: Network error",
    );
  });
});
