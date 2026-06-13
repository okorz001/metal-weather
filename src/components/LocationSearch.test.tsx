import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import LocationSearch, { type Tab } from "./LocationSearch";

function renderTab(
  tab: Tab,
  onSearch = vi.fn(),
  onGeoSearch = vi.fn(),
  onTabChange = vi.fn(),
) {
  render(
    <LocationSearch
      tab={tab}
      onTabChange={onTabChange}
      onSearch={onSearch}
      onGeoSearch={onGeoSearch}
      disabled={false}
    />,
  );
  return { onSearch, onGeoSearch, onTabChange };
}

describe("LocationSearch", () => {
  it("renders all three tab buttons", () => {
    renderTab("location");
    expect(
      screen.getByRole("button", { name: "Current Location" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "City" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Coordinates" }),
    ).toBeInTheDocument();
  });

  it("calls onTabChange when a tab button is clicked", () => {
    const { onTabChange } = renderTab("location");
    fireEvent.click(screen.getByRole("button", { name: "City" }));
    expect(onTabChange).toHaveBeenCalledWith("city");
  });

  describe("Current Location tab", () => {
    it("shows Get My Location button initially", () => {
      renderTab("location");
      expect(
        screen.getByRole("button", { name: "Get My Location" }),
      ).toBeInTheDocument();
    });

    it("calls onGeoSearch after clicking the button", () => {
      const mockGeo = {
        getCurrentPosition: vi.fn((success) => {
          success({ coords: { latitude: 47.6, longitude: -122.3 } });
        }),
      };
      Object.defineProperty(navigator, "geolocation", {
        value: mockGeo,
        configurable: true,
      });
      const { onGeoSearch } = renderTab("location");
      expect(onGeoSearch).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole("button", { name: "Get My Location" }));
      expect(onGeoSearch).toHaveBeenCalledWith(47.6, -122.3);
    });

    it("shows Locating… while waiting for position", () => {
      const mockGeo = {
        getCurrentPosition: vi.fn(), // never resolves
      };
      Object.defineProperty(navigator, "geolocation", {
        value: mockGeo,
        configurable: true,
      });
      renderTab("location");
      fireEvent.click(screen.getByRole("button", { name: "Get My Location" }));
      expect(screen.getByText("Locating…")).toBeInTheDocument();
    });

    it("shows error when geolocation is not supported", () => {
      Object.defineProperty(navigator, "geolocation", {
        value: undefined,
        configurable: true,
      });
      renderTab("location");
      fireEvent.click(screen.getByRole("button", { name: "Get My Location" }));
      expect(
        screen.getByText("Geolocation is not supported by this browser."),
      ).toBeInTheDocument();
    });

    it("shows error message on geolocation failure", () => {
      const mockGeo = {
        getCurrentPosition: vi.fn((_, error) => {
          error({ message: "Permission denied" });
        }),
      };
      Object.defineProperty(navigator, "geolocation", {
        value: mockGeo,
        configurable: true,
      });
      renderTab("location");
      fireEvent.click(screen.getByRole("button", { name: "Get My Location" }));
      expect(screen.getByText("Permission denied")).toBeInTheDocument();
    });
  });

  describe("City tab", () => {
    it("submits on button click", () => {
      const { onSearch } = renderTab("city");
      fireEvent.change(screen.getByPlaceholderText("City name"), {
        target: { value: "Seattle" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Search" }));
      expect(onSearch).toHaveBeenCalledWith("Seattle");
    });

    it("submits on Enter keypress", () => {
      const { onSearch } = renderTab("city");
      const input = screen.getByPlaceholderText("City name");
      fireEvent.change(input, { target: { value: "Tokyo" } });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(onSearch).toHaveBeenCalledWith("Tokyo");
    });

    it("does not submit when input is empty", () => {
      const { onSearch } = renderTab("city");
      fireEvent.click(screen.getByRole("button", { name: "Search" }));
      expect(onSearch).not.toHaveBeenCalled();
    });

    it("disables input and button when disabled prop is true", () => {
      render(
        <LocationSearch
          tab="city"
          onTabChange={vi.fn()}
          onSearch={vi.fn()}
          onGeoSearch={vi.fn()}
          disabled
        />,
      );
      expect(screen.getByPlaceholderText("City name")).toBeDisabled();
      expect(screen.getByRole("button", { name: "Search" })).toBeDisabled();
    });
  });

  describe("Coordinates tab", () => {
    it("submits lat,lon on button click", () => {
      const { onSearch } = renderTab("coords");
      fireEvent.change(screen.getByPlaceholderText("Latitude"), {
        target: { value: "47.6" },
      });
      fireEvent.change(screen.getByPlaceholderText("Longitude"), {
        target: { value: "-122.3" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Search" }));
      expect(onSearch).toHaveBeenCalledWith("47.6,-122.3");
    });

    it("does not submit when either field is empty", () => {
      const { onSearch } = renderTab("coords");
      fireEvent.change(screen.getByPlaceholderText("Latitude"), {
        target: { value: "47.6" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Search" }));
      expect(onSearch).not.toHaveBeenCalled();
    });
  });
});
