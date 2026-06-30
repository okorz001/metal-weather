import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  geocodeLocation,
  parseCoordinates,
  reverseGeocode,
  reverseGeocodeBdc,
  reverseGeocodeOsm,
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

  it("requests English-language names from the geocoding API", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [
        {
          lat: "21.4225",
          lon: "39.8262",
          name: "Mecca",
          address: {
            city: "Mecca",
            country: "Saudi Arabia",
            country_code: "sa",
          },
        },
      ],
    } as Response);

    await geocodeLocation("Mecca");
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("accept-language=en");
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

  it("matches a qualifier against an accented result name", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [
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
      ],
    } as Response);

    const result = await geocodeLocation("San Jose, Costa Rica");
    expect(result).toEqual({
      lat: 9.9281,
      lon: -84.0907,
      displayName: "San José, Costa Rica",
    });
  });

  it("applies qualifier filtering within results", async () => {
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

  it("expands a US state abbreviation qualifier to match multi-word state names", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [
        {
          lat: "43.7167",
          lon: "-74.4833",
          name: "Canada Lake",
          address: {
            city: "Canada Lake",
            state: "Indiana",
            country: "United States",
            country_code: "us",
          },
        },
        {
          lat: "43.2167",
          lon: "-74.5167",
          name: "Canada Lake",
          address: {
            city: "Canada Lake",
            state: "New York",
            country: "United States",
            country_code: "us",
          },
        },
      ],
    } as Response);

    const result = await geocodeLocation("Canada Lake, NY");
    expect(result).toEqual({
      lat: 43.2167,
      lon: -74.5167,
      displayName: "Canada Lake, NY",
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

  it("resolves qualifier when top result name does not match query", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [
        {
          importance: 0.3,
          lat: "44.0",
          lon: "7.0",
          name: "Mecca",
          address: {
            city: "Mecca",
            country: "Italy",
            country_code: "it",
          },
        },
        {
          importance: 0.6,
          lat: "21.4225",
          lon: "39.8262",
          name: "Makkah Al Mukarramah",
          address: {
            city: "Makkah Al Mukarramah",
            country: "Saudi Arabia",
            country_code: "sa",
          },
        },
      ],
    } as Response);

    const result = await geocodeLocation("Mecca, Saudi Arabia");
    expect(result.lat).toBeCloseTo(21.4225);
    expect(result.lon).toBeCloseTo(39.8262);
  });

  it("prefers higher importance result when multiple results exist", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [
        {
          importance: 0.3,
          lat: "44.0",
          lon: "7.0",
          name: "Mecca",
          address: { city: "Mecca", country: "Italy", country_code: "it" },
        },
        {
          importance: 0.6,
          lat: "33.9",
          lon: "-116.1",
          name: "Mecca",
          address: {
            city: "Mecca",
            state: "California",
            country: "United States",
            country_code: "us",
          },
        },
      ],
    } as Response);

    const result = await geocodeLocation("Mecca");
    expect(result.lat).toBeCloseTo(33.9);
  });

  it("returns the top result when result name differs from query", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [
        {
          lat: "40.7128",
          lon: "-74.006",
          name: "New York City",
          address: {
            city: "New York City",
            state: "New York",
            country: "United States",
            country_code: "us",
          },
        },
      ],
    } as Response);

    const result = await geocodeLocation("New York");
    expect(result.displayName).toBe("New York City, NY");
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
        locality: "New Swabia",
      }),
    } as Response);

    const result = await reverseGeocodeBdc(-75, 0);
    expect(result).toBe("Antarctica");
  });

  it("falls back to locality when continent is also missing", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        city: "",
        principalSubdivision: "",
        countryCode: "",
        continent: "",
        locality: "Atlantic Ocean",
      }),
    } as Response);

    const result = await reverseGeocodeBdc(0, 0);
    expect(result).toBe("Atlantic Ocean");
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

describe("reverseGeocodeOsm", () => {
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

    const result = await reverseGeocodeOsm(47.60621, -122.33207);
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

    const result = await reverseGeocodeOsm(48.8566, 2.3522);
    expect(result).toBe("Paris, France");
  });

  it("requests English-language names from the reverse geocoding API", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        address: {
          city: "Mecca",
          country: "Saudi Arabia",
          country_code: "sa",
        },
      }),
    } as Response);

    await reverseGeocodeOsm(21.4225, 39.8262);
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("accept-language=en");
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

    const result = await reverseGeocodeOsm(38.9072, -77.0369);
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

    const result = await reverseGeocodeOsm(37.3, -121.9);
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

    const result = await reverseGeocodeOsm(47.53, -122.03);
    expect(result).toBe("Issaquah, WA");
  });

  it("throws when the response contains an error field", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ error: "Unable to geocode" }),
    } as Response);

    await expect(reverseGeocodeOsm(0, 0)).rejects.toThrow(
      "Reverse geocoding failed: Unable to geocode",
    );
  });

  it("throws when no meaningful name can be derived from the address", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ address: { road: "Kohnen-Traverse" } }),
    } as Response);

    await expect(reverseGeocodeOsm(-75, 0)).rejects.toThrow(
      "Location not found at -75,0",
    );
  });

  it("throws when the API returns a non-OK status", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    await expect(reverseGeocodeOsm(0, 0)).rejects.toThrow(
      "Reverse geocoding request failed with status 500",
    );
  });

  it("throws when the network request fails", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    await expect(reverseGeocodeOsm(0, 0)).rejects.toThrow(
      "Failed to reach reverse geocoding service: Network error",
    );
  });
});

describe("reverseGeocode", () => {
  it("returns OSM result when OSM succeeds", async () => {
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

  it("falls back to BDC when OSM fails", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ error: "Unable to geocode" }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          city: "Seattle",
          principalSubdivision: "Washington",
          countryCode: "US",
        }),
      } as Response);

    const result = await reverseGeocode(47.60621, -122.33207);
    expect(result).toBe("Seattle, WA");
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("nominatim.openstreetmap.org/reverse"),
      expect.any(Object),
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("bigdatacloud.net"),
    );
  });

  it("throws when both OSM and BDC fail", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    await expect(reverseGeocode(0, 0)).rejects.toThrow("Network error");
  });
});
