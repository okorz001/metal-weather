import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter, useSearchParams } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as geocodeModule from "@/lib/geocode";
import * as songsModule from "@/lib/songs";
import type { Song, WeatherData } from "@/lib/types";
import * as weatherModule from "@/lib/weather";

import { FavoritesProvider } from "./FavoritesContext";
import HomeContent from "./HomeContent";

vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
}));

vi.mock("@/lib/geocode");
vi.mock("@/lib/weather");
vi.mock("@/lib/songs");

const mockWeather: WeatherData = {
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

const mockSong: Song = { title: "Raining Blood", artist: "Slayer" };
const mockErrorSong: Song = { title: "The Wicker Man", artist: "Iron Maiden" };

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.removeItem("favorites");
  vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams());
  vi.mocked(useRouter).mockReturnValue({
    push: vi.fn(),
    replace: vi.fn(),
  } as ReturnType<typeof useRouter>);
  vi.mocked(geocodeModule.geocodeLocation).mockResolvedValue({
    lat: 47.6,
    lon: -122.3,
    displayName: "Seattle, WA, US",
  });
  vi.mocked(weatherModule.fetchWeather).mockResolvedValue(mockWeather);
  vi.mocked(songsModule.pickSong).mockReturnValue(mockSong);
  vi.mocked(songsModule.pickErrorSong).mockReturnValue(mockErrorSong);
});

function renderHome() {
  return render(
    <FavoritesProvider>
      <HomeContent />
    </FavoritesProvider>,
  );
}

describe("HomeContent", () => {
  it("renders the search input on initial load with no result", () => {
    renderHome();
    expect(screen.getByPlaceholderText("City name")).toBeInTheDocument();
    expect(screen.queryByText("Raining Blood")).not.toBeInTheDocument();
    expect(screen.queryByText("The Wicker Man")).not.toBeInTheDocument();
  });

  it("auto-searches when only ?name= param is present on mount", async () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("name=Seattle"),
    );
    renderHome();
    await waitFor(() =>
      expect(screen.getByText("Raining Blood")).toBeInTheDocument(),
    );
    expect(geocodeModule.geocodeLocation).toHaveBeenCalledWith("Seattle");
    expect(weatherModule.fetchWeather).toHaveBeenCalledWith(
      47.6,
      -122.3,
      "Seattle, WA, US",
    );
  });

  it("auto-searches when ?lat= and ?lon= params are present on mount", async () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("name=Seattle%2C+WA%2C+US&lat=47.6&lon=-122.3"),
    );
    renderHome();
    await waitFor(() =>
      expect(screen.getByText("Raining Blood")).toBeInTheDocument(),
    );
    expect(geocodeModule.geocodeLocation).not.toHaveBeenCalled();
    expect(weatherModule.fetchWeather).toHaveBeenCalledWith(
      47.6,
      -122.3,
      "Seattle, WA, US",
    );
  });

  describe("manual city search", () => {
    it("searches and renders WeatherCard on submit", async () => {
      renderHome();
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
      renderHome();
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
      renderHome();
      fireEvent.change(screen.getByPlaceholderText("City name"), {
        target: { value: "Seattle" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Search" }));
      expect(document.querySelector(".animate-spin")).toBeInTheDocument();
      resolve();
      await waitFor(() =>
        expect(document.querySelector(".animate-spin")).not.toBeInTheDocument(),
      );
    });
  });

  describe("coordinate input", () => {
    beforeEach(() => {
      vi.mocked(geocodeModule.parseCoordinates).mockReturnValue({
        lat: 47.6,
        lon: -122.3,
      });
      vi.mocked(geocodeModule.reverseGeocode).mockResolvedValue("Seattle, WA");
    });

    it("skips geocoding and reverse-geocodes when input is coordinates", async () => {
      renderHome();
      fireEvent.change(screen.getByPlaceholderText("City name"), {
        target: { value: "47.6,-122.3" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Search" }));
      await waitFor(() =>
        expect(screen.getByText("Raining Blood")).toBeInTheDocument(),
      );
      expect(geocodeModule.geocodeLocation).not.toHaveBeenCalled();
      expect(geocodeModule.reverseGeocode).toHaveBeenCalledWith(47.6, -122.3);
    });

    it("falls back to raw coordinate string when reverse geocoding fails", async () => {
      vi.mocked(geocodeModule.reverseGeocode).mockRejectedValue(
        new Error("Network error"),
      );
      renderHome();
      fireEvent.change(screen.getByPlaceholderText("City name"), {
        target: { value: "47.6,-122.3" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Search" }));
      await waitFor(() =>
        expect(screen.getByText("Raining Blood")).toBeInTheDocument(),
      );
      expect(geocodeModule.geocodeLocation).not.toHaveBeenCalled();
      expect(weatherModule.fetchWeather).toHaveBeenCalledWith(
        47.6,
        -122.3,
        "47.6,-122.3",
      );
    });

    it("auto-searches when only ?lat= and ?lon= are present, reverse geocodes for display name", async () => {
      vi.mocked(geocodeModule.reverseGeocode).mockResolvedValue("Seattle, WA");
      vi.mocked(useSearchParams).mockReturnValue(
        new URLSearchParams("lat=47.6&lon=-122.3"),
      );
      renderHome();
      await waitFor(() =>
        expect(screen.getByText("Raining Blood")).toBeInTheDocument(),
      );
      expect(geocodeModule.geocodeLocation).not.toHaveBeenCalled();
      expect(geocodeModule.reverseGeocode).toHaveBeenCalledWith(47.6, -122.3);
      expect(weatherModule.fetchWeather).toHaveBeenCalledWith(
        47.6,
        -122.3,
        "Seattle, WA",
      );
    });
  });

  describe("favorites", () => {
    async function searchSeattle() {
      renderHome();
      fireEvent.change(screen.getByPlaceholderText("City name"), {
        target: { value: "Seattle" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Search" }));
      await waitFor(() =>
        expect(screen.getByText("Raining Blood")).toBeInTheDocument(),
      );
    }

    it("clicking bookmark after a successful search adds the location to favorites", async () => {
      await searchSeattle();
      fireEvent.click(screen.getByRole("button", { name: "Add to favorites" }));
      const stored = JSON.parse(localStorage.getItem("favorites") ?? "[]");
      expect(stored).toHaveLength(1);
      expect(stored[0].displayName).toBe("Seattle, WA, US");
    });

    it("clicking bookmark again removes the location from favorites", async () => {
      await searchSeattle();
      fireEvent.click(screen.getByRole("button", { name: "Add to favorites" }));
      fireEvent.click(
        screen.getByRole("button", { name: "Remove from favorites" }),
      );
      const stored = JSON.parse(localStorage.getItem("favorites") ?? "[]");
      expect(stored).toHaveLength(0);
    });

    it("selecting a favorite navigates without calling geocodeLocation", async () => {
      localStorage.setItem(
        "favorites",
        JSON.stringify([
          { displayName: "Seattle, WA, US", lat: 47.6, lon: -122.3 },
        ]),
      );
      renderHome();
      fireEvent.click(
        screen.getByRole("button", { name: "Enter a location…" }),
      );
      await waitFor(() =>
        expect(screen.getByText("Seattle, WA, US")).toBeInTheDocument(),
      );
      fireEvent.click(screen.getByRole("button", { name: /^Seattle, WA, US/ }));
      await waitFor(() =>
        expect(screen.getByText("Raining Blood")).toBeInTheDocument(),
      );
      expect(geocodeModule.geocodeLocation).not.toHaveBeenCalled();
    });
  });
});
