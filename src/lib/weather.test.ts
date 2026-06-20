import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchWeather } from "./weather";

beforeEach(() => {
  vi.restoreAllMocks();
});

const hourlyTimes = Array.from(
  { length: 24 },
  (_, i) => `2024-01-01T${String(i).padStart(2, "0")}:00`,
);
const hourlyTemps = Array.from({ length: 24 }, () => 10.5);
const hourlyCodes = Array.from({ length: 24 }, () => 3);

describe("fetchWeather", () => {
  it("returns WeatherData with mapped status on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        current: {
          time: "2024-01-01T00:00",
          temperature_2m: 10.5,
          wind_speed_10m: 15.2,
          wind_direction_10m: 180,
          relative_humidity_2m: 75,
          precipitation: 0.0,
          weather_code: 3,
        },
        daily: {
          temperature_2m_max: [14.0],
          temperature_2m_min: [7.0],
          sunrise: ["2024-01-01T07:00"],
          sunset: ["2024-01-01T17:00"],
        },
        hourly: {
          time: hourlyTimes,
          temperature_2m: hourlyTemps,
          weather_code: hourlyCodes,
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
      temperatureFahrenheit: (10.5 * 9) / 5 + 32,
      windSpeedKmh: 15.2,
      windSpeedMph: 15.2 * 0.621371,
      windDirectionDeg: 180,
      humidityPercent: 75,
      precipitationMm: 0.0,
      precipitationIn: 0.0 / 25.4,
      status: "Cloudy",
      highCelsius: 14.0,
      highFahrenheit: (14.0 * 9) / 5 + 32,
      lowCelsius: 7.0,
      lowFahrenheit: (7.0 * 9) / 5 + 32,
      sunrise: "2024-01-01T07:00",
      sunset: "2024-01-01T17:00",
      hourly: hourlyTimes.slice(0, 12).map((time, i) => ({
        time,
        temperatureCelsius: hourlyTemps[i],
        temperatureFahrenheit: (hourlyTemps[i] * 9) / 5 + 32,
        status: "Cloudy",
      })),
    });
  });

  it("starts hourly forecast from the current hour when time has minutes", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        current: {
          time: "2024-01-01T05:37",
          temperature_2m: 10.5,
          wind_speed_10m: 15.2,
          wind_direction_10m: 180,
          relative_humidity_2m: 75,
          precipitation: 0.0,
          weather_code: 3,
        },
        daily: {
          temperature_2m_max: [14.0],
          temperature_2m_min: [7.0],
          sunrise: ["2024-01-01T07:00"],
          sunset: ["2024-01-01T17:00"],
        },
        hourly: {
          time: hourlyTimes,
          temperature_2m: hourlyTemps,
          weather_code: hourlyCodes,
        },
      }),
    } as Response);

    const result = await fetchWeather(47.6, -122.3, "Seattle");
    expect(result.hourly[0].time).toBe("2024-01-01T05:00");
    expect(result.hourly).toHaveLength(12);
  });

  it("sets status to undefined for an unrecognized weather code", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        current: {
          time: "2024-01-01T00:00",
          temperature_2m: 10.5,
          wind_speed_10m: 15.2,
          wind_direction_10m: 180,
          relative_humidity_2m: 75,
          precipitation: 0.0,
          weather_code: 999,
        },
        daily: {
          temperature_2m_max: [14.0],
          temperature_2m_min: [7.0],
          sunrise: ["2024-01-01T07:00"],
          sunset: ["2024-01-01T17:00"],
        },
        hourly: {
          time: hourlyTimes,
          temperature_2m: hourlyTemps,
          weather_code: Array.from({ length: 12 }, () => 999),
        },
      }),
    } as Response);

    const result = await fetchWeather(47.6, -122.3, "Seattle");
    expect(result.status).toBeUndefined();
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
