import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import type { Song, WeatherData } from "@/lib/types";

import { SettingsProvider } from "./SettingsContext";
import WeatherCard from "./WeatherCard";

const mockWeather: WeatherData = {
  displayName: "Seattle, WA, US",
  temperatureCelsius: 15,
  temperatureFahrenheit: 59,
  windSpeedKmh: 20,
  windSpeedMph: 20 * 0.621371,
  windDirectionDeg: 270,
  humidityPercent: 80,
  precipitationMm: 1.2,
  precipitationIn: 1.2 / 25.4,
  status: "Rain",
};

const mockSong: Song = {
  title: "Raining Blood",
  artist: "Slayer",
};

function renderMetric() {
  return render(
    <SettingsProvider>
      <WeatherCard weather={mockWeather} song={mockSong} />
    </SettingsProvider>,
  );
}

function renderImperial() {
  localStorage.setItem("units", "imperial");
  return render(
    <SettingsProvider>
      <WeatherCard weather={mockWeather} song={mockSong} />
    </SettingsProvider>,
  );
}

describe("WeatherCard", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders condition label and location", () => {
    renderMetric();
    expect(screen.getByText("Rain")).toBeInTheDocument();
    expect(screen.getByText("Seattle, WA, US")).toBeInTheDocument();
  });

  it("renders temperature in Celsius when metric", () => {
    renderMetric();
    expect(screen.getByText("15.0 °C")).toBeInTheDocument();
  });

  it("renders temperature in Fahrenheit when imperial", () => {
    renderImperial();
    expect(screen.getByText("59.0 °F")).toBeInTheDocument();
  });

  it("renders wind speed in km/h when metric", () => {
    renderMetric();
    expect(screen.getByText("20 km/h W")).toBeInTheDocument();
  });

  it("renders wind speed in mph when imperial", () => {
    renderImperial();
    expect(screen.getByText("12.4 mph W")).toBeInTheDocument();
  });

  it("renders precipitation in mm when metric", () => {
    renderMetric();
    expect(screen.getByText("1.2 mm")).toBeInTheDocument();
  });

  it("renders precipitation in inches when imperial", () => {
    renderImperial();
    expect(screen.getByText("0.05 in")).toBeInTheDocument();
  });

  it("renders humidity", () => {
    renderMetric();
    expect(screen.getByText("80%")).toBeInTheDocument();
  });

  it("renders song title and artist", () => {
    renderMetric();
    expect(screen.getByText("Raining Blood")).toBeInTheDocument();
    expect(screen.getByText("Slayer")).toBeInTheDocument();
  });
});
