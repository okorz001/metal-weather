import { describe, expect, it } from "vitest";

import {
  applyMockWeather,
  parseMockWeather,
  serializeMockWeatherParams,
} from "./mockWeather";
import type { WeatherData } from "./types";

const baseWeather: WeatherData = {
  displayName: "Seattle, WA, US",
  temperatureCelsius: 15,
  temperatureFahrenheit: 59,
  feelsLikeCelsius: 12,
  feelsLikeFahrenheit: 53.6,
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

describe("serializeMockWeatherParams", () => {
  it("returns an empty string when there are no underscore params", () => {
    expect(serializeMockWeatherParams(new URLSearchParams())).toBe("");
  });

  it("serializes a single underscore-prefixed param", () => {
    const result = serializeMockWeatherParams(
      new URLSearchParams("_status=Thunderstorm"),
    );
    expect(result).toBe("&_status=Thunderstorm");
  });

  it("serializes multiple underscore-prefixed params in order", () => {
    const result = serializeMockWeatherParams(
      new URLSearchParams("_status=Thunderstorm&_temperatureCelsius=5"),
    );
    expect(result).toBe("&_status=Thunderstorm&_temperatureCelsius=5");
  });

  it("ignores non-underscore params", () => {
    const result = serializeMockWeatherParams(
      new URLSearchParams("name=Seattle&lat=47.6&lon=-122.3&_status=Snow"),
    );
    expect(result).toBe("&_status=Snow");
  });

  it("URL-encodes underscore param values", () => {
    const result = serializeMockWeatherParams(
      new URLSearchParams("_status=Thunder Storm"),
    );
    expect(result).toBe("&_status=Thunder%20Storm");
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
