import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchWeather } from "./weather";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("fetchWeather", () => {
  it("returns WeatherData on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        current: {
          temperature_2m: 10.5,
          wind_speed_10m: 15.2,
          wind_direction_10m: 180,
          relative_humidity_2m: 75,
          precipitation: 0.0,
          weather_code: 3,
        },
      }),
    } as Response);

    const result = await fetchWeather(
      47.6,
      -122.3,
      "Seattle, Washington, United States",
    );
    expect(result).toEqual({
      displayName: "Seattle, Washington, United States",
      temperatureCelsius: 10.5,
      windSpeedKmh: 15.2,
      windDirectionDeg: 180,
      humidityPercent: 75,
      precipitationMm: 0.0,
      weatherCode: 3,
      conditionLabel: "",
    });
  });

  it("throws when the API returns a non-OK status", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    await expect(fetchWeather(47.6, -122.3, "Seattle")).rejects.toThrow(
      "Weather request failed with status 500",
    );
  });

  it("throws when the network request fails", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    await expect(fetchWeather(47.6, -122.3, "Seattle")).rejects.toThrow(
      "Failed to reach weather service: Network error",
    );
  });
});
