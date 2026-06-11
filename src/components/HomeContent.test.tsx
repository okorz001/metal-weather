import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter, useSearchParams } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as geocodeModule from "@/lib/geocode";
import * as songsModule from "@/lib/songs";
import type { Song, WeatherData } from "@/lib/types";
import * as weatherModule from "@/lib/weather";

import HomeContent from "./HomeContent";

vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

vi.mock("@/lib/geocode");
vi.mock("@/lib/weather");
vi.mock("@/lib/songs");

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

const mockSong: Song = { title: "Raining Blood", artist: "Slayer" };
const mockErrorSong: Song = { title: "The Wicker Man", artist: "Iron Maiden" };

beforeEach(() => {
  vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams());
  vi.mocked(useRouter).mockReturnValue({ push: vi.fn() } as ReturnType<
    typeof useRouter
  >);
  vi.mocked(geocodeModule.geocodeLocation).mockResolvedValue({
    lat: 47.6,
    lon: -122.3,
    displayName: "Seattle, WA, US",
  });
  vi.mocked(weatherModule.fetchWeather).mockResolvedValue(mockWeather);
  vi.mocked(songsModule.pickSong).mockReturnValue({
    song: mockSong,
    conditionLabel: "Rain",
  });
  vi.mocked(songsModule.pickErrorSong).mockReturnValue(mockErrorSong);
});

describe("HomeContent", () => {
  it("renders the location tabs on initial load with no result", () => {
    render(<HomeContent />);
    expect(screen.getByRole("button", { name: "City" })).toBeInTheDocument();
    expect(screen.queryByText("Raining Blood")).not.toBeInTheDocument();
    expect(screen.queryByText("The Wicker Man")).not.toBeInTheDocument();
  });

  it("auto-searches when ?tab=city&q= params are present on mount", async () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("tab=city&q=Seattle"),
    );
    render(<HomeContent />);
    await waitFor(() =>
      expect(screen.getByText("Raining Blood")).toBeInTheDocument(),
    );
    expect(geocodeModule.geocodeLocation).toHaveBeenCalledWith("Seattle");
  });

  it("pushing the City tab button calls router.push with ?tab=city", () => {
    const push = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ push } as ReturnType<
      typeof useRouter
    >);
    render(<HomeContent />);
    fireEvent.click(screen.getByRole("button", { name: "City" }));
    expect(push).toHaveBeenCalledWith("/?tab=city");
  });

  describe("with city tab active via URL", () => {
    beforeEach(() => {
      vi.mocked(useSearchParams).mockReturnValue(
        new URLSearchParams("tab=city"),
      );
    });

    it("searches and renders WeatherCard on manual submit", async () => {
      render(<HomeContent />);
      fireEvent.change(screen.getByPlaceholderText("City name"), {
        target: { value: "Tokyo" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Search" }));
      await waitFor(() =>
        expect(screen.getByText("Raining Blood")).toBeInTheDocument(),
      );
      expect(geocodeModule.geocodeLocation).toHaveBeenCalledWith("Tokyo");
    });

    it("renders ErrorCard when geocoding fails", async () => {
      vi.mocked(geocodeModule.geocodeLocation).mockRejectedValue(
        new Error("Location not found"),
      );
      render(<HomeContent />);
      fireEvent.change(screen.getByPlaceholderText("City name"), {
        target: { value: "?????" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Search" }));
      await waitFor(() =>
        expect(screen.getByText("Location not found")).toBeInTheDocument(),
      );
      expect(screen.getByText("The Wicker Man")).toBeInTheDocument();
    });

    it("shows loading indicator while fetch is in flight", async () => {
      let resolve!: () => void;
      vi.mocked(geocodeModule.geocodeLocation).mockReturnValue(
        new Promise((r) => {
          resolve = () =>
            r({ lat: 47.6, lon: -122.3, displayName: "Seattle, WA, US" });
        }),
      );
      render(<HomeContent />);
      fireEvent.change(screen.getByPlaceholderText("City name"), {
        target: { value: "Seattle" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Search" }));
      expect(screen.getByText("Loading…")).toBeInTheDocument();
      resolve();
      await waitFor(() =>
        expect(screen.queryByText("Loading…")).not.toBeInTheDocument(),
      );
    });
  });
});
