import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  geocodeLocation,
  parseCoordinates,
  reverseGeocode,
  reverseGeocodeBdc,
  reverseGeocodeNominatim,
} from "./geocode";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("parseCoordinates", () => {
  it("returns lat and lon for integer coordinates", () => {
    expect(parseCoordinates("47,-122")).toEqual({ lat: 47, lon: -122 });
  });

  it("returns lat and lon for decimal coordinates", () => {
    expect(parseCoordinates("47.6,-122.3")).toEqual({ lat: 47.6, lon: -122.3 });
  });

  it("accepts whitespace around the comma", () => {
    expect(parseCoordinates(" 47.6 , -122.3 ")).toEqual({
      lat: 47.6,
      lon: -122.3,
    });
  });

  it("accepts boundary values", () => {
    expect(parseCoordinates("90,180")).toEqual({ lat: 90, lon: 180 });
    expect(parseCoordinates("-90,-180")).toEqual({ lat: -90, lon: -180 });
  });

  it("returns null when latitude is out of range", () => {
    expect(parseCoordinates("91,0")).toBeNull();
    expect(parseCoordinates("-91,0")).toBeNull();
  });

  it("returns null when longitude is out of range", () => {
    expect(parseCoordinates("0,181")).toBeNull();
    expect(parseCoordinates("0,-181")).toBeNull();
  });

  it("returns null for a plain city name", () => {
    expect(parseCoordinates("Seattle")).toBeNull();
  });

  it("returns null for a city name with qualifier", () => {
    expect(parseCoordinates("San Jose, CA")).toBeNull();
  });

  it("returns null for a zip code", () => {
    expect(parseCoordinates("95124")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(parseCoordinates("")).toBeNull();
  });
});

describe("geocodeLocation", () => {
  it("returns lat, lon, and displayName on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [
        {
          lat: "47.60621",
          lon: "-122.33207",
          name: "Seattle",
          address: {
            city: "Seattle",
            state: "Washington",
            country: "United States",
            country_code: "us",
          },
        },
      ],
    } as Response);

    const result = await geocodeLocation("Seattle");
    expect(result).toEqual({
      lat: 47.60621,
      lon: -122.33207,
      displayName: "Seattle, WA",
    });
  });

  it("omits missing state/country fields from displayName", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [
        {
          lat: "51.5074",
          lon: "-0.1278",
          name: "London",
          address: { city: "London" },
        },
      ],
    } as Response);

    const result = await geocodeLocation("London");
    expect(result.displayName).toBe("London");
  });

  it("picks the matching result when a qualifier is provided", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [
        {
          lat: "9.9281",
          lon: "-84.0907",
          name: "San José",
          address: {
            city: "San José",
            state: "San José Province",
            country: "Costa Rica",
            country_code: "cr",
          },
        },
        {
          lat: "37.3382",
          lon: "-121.8863",
          name: "San Jose",
          address: {
            city: "San Jose",
            state: "California",
            country: "United States",
            country_code: "us",
          },
        },
      ],
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
      json: async () => [
        {
          lat: "39.9",
          lon: "-84.2",
          name: "Venice Township",
          address: {
            city: "Venice Township",
            state: "Ohio",
            country: "United States",
            country_code: "us",
          },
        },
        {
          lat: "45.4375",
          lon: "12.3358",
          name: "Venice",
          address: {
            city: "Venice",
            state: "Veneto",
            country: "Italy",
            country_code: "it",
          },
        },
      ],
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
      json: async () => [
        {
          lat: "45.4375",
          lon: "12.3358",
          name: "Venice",
          address: {
            city: "Venice",
            state: "Veneto",
            country: "Italy",
            country_code: "it",
          },
        },
        {
          lat: "33.985",
          lon: "-118.472",
          name: "Venice",
          address: {
            city: "Venice",
            state: "California",
            country: "United States",
            country_code: "us",
          },
        },
      ],
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
      json: async () => [
        {
          lat: "47.60621",
          lon: "-122.33207",
          name: "Springfield",
          address: {
            city: "Springfield",
            state: "Oregon",
            country: "United States",
            country_code: "us",
          },
        },
      ],
    } as Response);

    const result = await geocodeLocation("Springfield, ZZ");
    expect(result.lat).toBe(47.60621);
  });

  it("throws when results array is empty", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [],
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

describe("geocodeLocation zip code", () => {
  it("returns suburb as displayName when available", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [
        {
          lat: "37.255",
          lon: "-121.892",
          address: {
            suburb: "Willow Glen",
            state: "California",
            country: "United States",
            country_code: "us",
          },
        },
      ],
    } as Response);

    const result = await geocodeLocation("95124");
    expect(result).toEqual({
      lat: 37.255,
      lon: -121.892,
      displayName: "Willow Glen, CA",
    });
  });

  it("falls back to city when no suburb is present", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [
        {
          lat: "37.255",
          lon: "-121.892",
          address: {
            city: "San Jose",
            state: "California",
            country: "United States",
            country_code: "us",
          },
        },
      ],
    } as Response);

    const result = await geocodeLocation("95124");
    expect(result.displayName).toBe("San Jose, CA");
  });

  it("falls back to the zip string when no area name is resolvable", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [{ lat: "37.255", lon: "-121.892" }],
    } as Response);

    const result = await geocodeLocation("95124");
    expect(result.displayName).toBe("95124");
  });

  it("throws when results array is empty", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response);

    await expect(geocodeLocation("95124")).rejects.toThrow(
      'Location not found: "95124"',
    );
  });

  it("throws when the API returns a non-OK status", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 503,
    } as Response);

    await expect(geocodeLocation("95124")).rejects.toThrow(
      "Geocoding request failed with status 503",
    );
  });

  it("throws when the network request fails", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("timeout"));

    await expect(geocodeLocation("95124")).rejects.toThrow(
      "Failed to reach geocoding service: timeout",
    );
  });
});

describe("reverseGeocodeBdc", () => {
  it("abbreviates US state and includes country", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        city: "Seattle",
        principalSubdivision: "Washington",
        countryCode: "US",
      }),
    } as Response);

    const result = await reverseGeocodeBdc(47.60621, -122.33207);
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

    const result = await reverseGeocodeBdc(48.8566, 2.3522);
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

    const result = await reverseGeocodeBdc(38.9072, -77.0369);
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

    const result = await reverseGeocodeBdc(47.60621, -122.33207);
    expect(result).toBe("WA");
  });

  it("falls back to continent when country is missing", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        city: "",
        principalSubdivision: "",
        countryCode: "",
        continent: "Antarctica",
      }),
    } as Response);

    const result = await reverseGeocodeBdc(-75, 0);
    expect(result).toBe("Antarctica");
  });

  it("throws when the API returns a non-OK status", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    await expect(reverseGeocodeBdc(0, 0)).rejects.toThrow(
      "Reverse geocoding request failed with status 500",
    );
  });

  it("throws when the network request fails", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    await expect(reverseGeocodeBdc(0, 0)).rejects.toThrow(
      "Failed to reach reverse geocoding service: Network error",
    );
  });
});

describe("reverseGeocodeNominatim", () => {
  it("abbreviates US state", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        address: {
          city: "Seattle",
          state: "Washington",
          country: "United States",
          country_code: "us",
        },
      }),
    } as Response);

    const result = await reverseGeocodeNominatim(47.60621, -122.33207);
    expect(result).toBe("Seattle, WA");
  });

  it("omits subdivision for non-US locations", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        address: {
          city: "Paris",
          state: "Île-de-France",
          country: "France",
          country_code: "fr",
        },
      }),
    } as Response);

    const result = await reverseGeocodeNominatim(48.8566, 2.3522);
    expect(result).toBe("Paris, France");
  });

  it("falls back to country when US subdivision has no abbreviation", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        address: {
          city: "Washington D.C.",
          state: "District of Columbia",
          country: "United States",
          country_code: "us",
        },
      }),
    } as Response);

    const result = await reverseGeocodeNominatim(38.9072, -77.0369);
    expect(result).toBe("Washington D.C., United States");
  });

  it("prefers suburb over city", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        address: {
          suburb: "Willow Glen",
          city: "San Jose",
          state: "California",
          country: "United States",
          country_code: "us",
        },
      }),
    } as Response);

    const result = await reverseGeocodeNominatim(37.3, -121.9);
    expect(result).toBe("Willow Glen, CA");
  });

  it("falls back to town when no city or suburb", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        address: {
          town: "Issaquah",
          state: "Washington",
          country: "United States",
          country_code: "us",
        },
      }),
    } as Response);

    const result = await reverseGeocodeNominatim(47.53, -122.03);
    expect(result).toBe("Issaquah, WA");
  });

  it("throws when the API returns a non-OK status", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    await expect(reverseGeocodeNominatim(0, 0)).rejects.toThrow(
      "Reverse geocoding request failed with status 500",
    );
  });

  it("throws when the network request fails", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    await expect(reverseGeocodeNominatim(0, 0)).rejects.toThrow(
      "Failed to reach reverse geocoding service: Network error",
    );
  });
});

describe("reverseGeocode", () => {
  it("delegates to reverseGeocodeNominatim", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        address: {
          city: "Seattle",
          state: "Washington",
          country: "United States",
          country_code: "us",
        },
      }),
    } as Response);

    const result = await reverseGeocode(47.60621, -122.33207);
    expect(result).toBe("Seattle, WA");
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("nominatim.openstreetmap.org/reverse"),
      expect.any(Object),
    );
  });
});
