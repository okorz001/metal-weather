import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import type { WeatherData } from "@/lib/types";

import { SettingsProvider } from "./SettingsContext";
import WeatherCard from "./WeatherCard";

const mockWeather: WeatherData = {
  displayName: "Seattle, WA, US",
  temperatureCelsius: 15,
  temperatureFahrenheit: 59,
  feelsLikeCelsius: 12,
  feelsLikeFahrenheit: (12 * 9) / 5 + 32,
  windSpeedKmh: 20,
  windSpeedMph: 20 * 0.621371,
  windDirectionDeg: 270,
  humidityPercent: 80,
  precipitationMm: 1.2,
  precipitationIn: 1.2 / 25.4,
  status: "Rain",
  highCelsius: 18,
  highFahrenheit: 64.4,
  lowCelsius: 10,
  lowFahrenheit: 50,
  hourly: [],
};

function renderMetric() {
  localStorage.setItem("units", "metric");
  return render(
    <SettingsProvider>
      <WeatherCard weather={mockWeather} />
    </SettingsProvider>,
  );
}

function renderImperial() {
  localStorage.setItem("units", "imperial");
  return render(
    <SettingsProvider>
      <WeatherCard weather={mockWeather} />
    </SettingsProvider>,
  );
}

describe("WeatherCard", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the condition emoji", () => {
    renderMetric();
    expect(screen.getByText("🌧️")).toBeInTheDocument();
  });

  it("renders temperature in Celsius when metric", () => {
    renderMetric();
    expect(screen.getByText("15.0°C")).toBeInTheDocument();
  });

  it("renders temperature in Fahrenheit when imperial", () => {
    renderImperial();
    expect(screen.getByText("59.0°F")).toBeInTheDocument();
  });

  it("renders high/low in Celsius when metric", () => {
    renderMetric();
    expect(screen.getByText("18.0° / 10.0°")).toBeInTheDocument();
  });

  it("renders high/low in Fahrenheit when imperial", () => {
    renderImperial();
    expect(screen.getByText("64.4° / 50.0°")).toBeInTheDocument();
  });

  it("renders wind speed in km/h with compass direction when metric", () => {
    renderMetric();
    expect(screen.getByText("Wind: 20.0 km/h W")).toBeInTheDocument();
  });

  it("renders wind speed in mph with compass direction when imperial", () => {
    renderImperial();
    expect(
      screen.getByText(`Wind: ${(20 * 0.621371).toFixed(1)} mph W`),
    ).toBeInTheDocument();
  });

  it("renders precipitation in mm when metric", () => {
    renderMetric();
    expect(screen.getByText("Precip: 1.2 mm")).toBeInTheDocument();
  });

  it("renders precipitation in inches when imperial", () => {
    renderImperial();
    expect(
      screen.getByText(`Precip: ${(1.2 / 25.4).toFixed(2)} in`),
    ).toBeInTheDocument();
  });

  it("renders feels-like temperature in Celsius when metric", () => {
    renderMetric();
    expect(screen.getByText("Feels like: 12.0°C")).toBeInTheDocument();
  });

  it("renders feels-like temperature in Fahrenheit when imperial", () => {
    renderImperial();
    expect(
      screen.getByText(`Feels like: ${((12 * 9) / 5 + 32).toFixed(1)}°F`),
    ).toBeInTheDocument();
  });

  it("renders humidity", () => {
    renderMetric();
    expect(screen.getByText("Humidity: 80%")).toBeInTheDocument();
  });
});
