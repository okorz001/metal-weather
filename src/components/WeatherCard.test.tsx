import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Song, WeatherData } from "@/lib/types";

import WeatherCard from "./WeatherCard";

const mockWeather: WeatherData = {
  displayName: "Seattle, WA, US",
  temperatureCelsius: 15,
  windSpeedKmh: 20,
  windDirectionDeg: 270,
  humidityPercent: 80,
  precipitationMm: 1.2,
  weatherCode: 61,
  conditionLabel: "Rain",
};

const mockSong: Song = {
  title: "Raining Blood",
  artist: "Slayer",
};

describe("WeatherCard", () => {
  it("renders condition label and location", () => {
    render(<WeatherCard weather={mockWeather} song={mockSong} />);
    expect(screen.getByText("Rain")).toBeInTheDocument();
    expect(screen.getByText("Seattle, WA, US")).toBeInTheDocument();
  });

  it("renders temperature in Celsius by default", () => {
    render(<WeatherCard weather={mockWeather} song={mockSong} />);
    expect(screen.getByText("15.0 °C")).toBeInTheDocument();
  });

  it("toggles temperature to Fahrenheit", () => {
    render(<WeatherCard weather={mockWeather} song={mockSong} />);
    fireEvent.click(screen.getByRole("button", { name: /show in °f/i }));
    expect(screen.getByText("59.0 °F")).toBeInTheDocument();
  });

  it("toggles back to Celsius", () => {
    render(<WeatherCard weather={mockWeather} song={mockSong} />);
    fireEvent.click(screen.getByRole("button", { name: /show in °f/i }));
    fireEvent.click(screen.getByRole("button", { name: /show in °c/i }));
    expect(screen.getByText("15.0 °C")).toBeInTheDocument();
  });

  it("renders wind speed and cardinal direction", () => {
    render(<WeatherCard weather={mockWeather} song={mockSong} />);
    expect(screen.getByText("20 km/h W")).toBeInTheDocument();
  });

  it("renders humidity", () => {
    render(<WeatherCard weather={mockWeather} song={mockSong} />);
    expect(screen.getByText("80%")).toBeInTheDocument();
  });

  it("renders precipitation", () => {
    render(<WeatherCard weather={mockWeather} song={mockSong} />);
    expect(screen.getByText("1.2 mm")).toBeInTheDocument();
  });

  it("renders song title and artist", () => {
    render(<WeatherCard weather={mockWeather} song={mockSong} />);
    expect(screen.getByText("Raining Blood")).toBeInTheDocument();
    expect(screen.getByText("Slayer")).toBeInTheDocument();
  });
});
