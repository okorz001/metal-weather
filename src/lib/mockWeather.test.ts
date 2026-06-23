import { describe, expect, it } from "vitest";

import { applyMockWeather, parseMockWeather } from "./mockWeather";
import type { WeatherData } from "./types";

const baseWeather: WeatherData = {
  displayName: "Seattle, WA, US",
  temperatureCelsius: 15,
  temperatureFahrenheit: 59,
  windSpeedKmh: 20,
  windSpeedMph: 12.4,
  windDirectionDeg: 270,
  humidityPercent: 80,
  precipitationMm: 1.2,
  precipitationIn: 0.05,
  status: "Rain",
  highCelsius: 18,
  highFahrenheit: 64.4,
  lowCelsius: 10,
  lowFahrenheit: 50,
  hourly: [],
};

describe("parseMockWeather", () => {
  it("parses a string status override", () => {
    const result = parseMockWeather(
      new URLSearchParams("_status=Thunderstorm"),
    );
    expect(result).toEqual({ status: "Thunderstorm" });
  });

  it("coerces numeric overrides to numbers", () => {
    const result = parseMockWeather(
      new URLSearchParams("_temperatureCelsius=5&_humidityPercent=42"),
    );
    expect(result).toEqual({ temperatureCelsius: 5, humidityPercent: 42 });
  });

  it("ignores parameters without the underscore prefix", () => {
    const result = parseMockWeather(
      new URLSearchParams("status=Snow&name=London&lat=51.5"),
    );
    expect(result).toEqual({});
  });

  it("ignores unknown underscore-prefixed parameters", () => {
    const result = parseMockWeather(new URLSearchParams("_foo=bar"));
    expect(result).toEqual({});
  });

  it("ignores the hourly property", () => {
    const result = parseMockWeather(new URLSearchParams("_hourly=anything"));
    expect(result).toEqual({});
  });

  it("returns an empty object when there are no overrides", () => {
    expect(parseMockWeather(new URLSearchParams())).toEqual({});
  });
});

describe("applyMockWeather", () => {
  it("shallow merges overrides on top of real data", () => {
    const result = applyMockWeather(baseWeather, { status: "Snow" });
    expect(result.status).toBe("Snow");
    expect(result.temperatureCelsius).toBe(15);
    expect(result).not.toBe(baseWeather);
  });

  it("returns equivalent data when there are no overrides", () => {
    expect(applyMockWeather(baseWeather, {})).toEqual(baseWeather);
  });
});
