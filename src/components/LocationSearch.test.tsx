import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import LocationSearch, { type Tab } from "./LocationSearch";

function renderTab(tab: Tab, onSearch = vi.fn(), onTabChange = vi.fn()) {
  render(
    <LocationSearch
      tab={tab}
      onTabChange={onTabChange}
      onSearch={onSearch}
      disabled={false}
    />,
  );
  return { onSearch, onTabChange };
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
    it("shows Use My Location button", () => {
      renderTab("location");
      expect(
        screen.getByRole("button", { name: "Use My Location" }),
      ).toBeInTheDocument();
    });

    it("shows error when geolocation is not supported", () => {
      const originalGeo = navigator.geolocation;
      Object.defineProperty(navigator, "geolocation", {
        value: undefined,
        configurable: true,
      });
      renderTab("location");
      fireEvent.click(screen.getByRole("button", { name: "Use My Location" }));
      expect(
        screen.getByText("Geolocation is not supported by this browser."),
      ).toBeInTheDocument();
      Object.defineProperty(navigator, "geolocation", {
        value: originalGeo,
        configurable: true,
      });
    });

    it("calls onSearch with lat,lon on success", () => {
      const mockGeo = {
        getCurrentPosition: vi.fn((success) =>
          success({ coords: { latitude: 47.6, longitude: -122.3 } }),
        ),
      };
      Object.defineProperty(navigator, "geolocation", {
        value: mockGeo,
        configurable: true,
      });
      const { onSearch } = renderTab("location");
      fireEvent.click(screen.getByRole("button", { name: "Use My Location" }));
      expect(onSearch).toHaveBeenCalledWith("47.6,-122.3");
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
