import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import LocationSearch from "./LocationSearch";

describe("LocationSearch", () => {
  it("renders all three tabs", () => {
    render(<LocationSearch onSearch={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: "Current Location" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "City" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Coordinates" }),
    ).toBeInTheDocument();
  });

  it("defaults to Current Location tab with Use My Location button", () => {
    render(<LocationSearch onSearch={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: "Use My Location" }),
    ).toBeInTheDocument();
  });

  describe("City tab", () => {
    function renderCityTab(onSearch = vi.fn()) {
      render(<LocationSearch onSearch={onSearch} />);
      fireEvent.click(screen.getByRole("button", { name: "City" }));
      return onSearch;
    }

    it("submits on button click", () => {
      const onSearch = renderCityTab();
      fireEvent.change(screen.getByPlaceholderText("City name"), {
        target: { value: "Seattle" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Search" }));
      expect(onSearch).toHaveBeenCalledWith("Seattle");
    });

    it("submits on Enter keypress", () => {
      const onSearch = renderCityTab();
      const input = screen.getByPlaceholderText("City name");
      fireEvent.change(input, { target: { value: "Tokyo" } });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(onSearch).toHaveBeenCalledWith("Tokyo");
    });

    it("does not submit when input is empty", () => {
      const onSearch = renderCityTab();
      fireEvent.click(screen.getByRole("button", { name: "Search" }));
      expect(onSearch).not.toHaveBeenCalled();
    });

    it("disables input and button when disabled prop is true", () => {
      render(<LocationSearch onSearch={vi.fn()} disabled />);
      fireEvent.click(screen.getByRole("button", { name: "City" }));
      expect(screen.getByPlaceholderText("City name")).toBeDisabled();
      expect(screen.getByRole("button", { name: "Search" })).toBeDisabled();
    });
  });

  describe("Coordinates tab", () => {
    function renderCoordsTab(onSearch = vi.fn()) {
      render(<LocationSearch onSearch={onSearch} />);
      fireEvent.click(screen.getByRole("button", { name: "Coordinates" }));
      return onSearch;
    }

    it("submits lat,lon on button click", () => {
      const onSearch = renderCoordsTab();
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
      const onSearch = renderCoordsTab();
      fireEvent.change(screen.getByPlaceholderText("Latitude"), {
        target: { value: "47.6" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Search" }));
      expect(onSearch).not.toHaveBeenCalled();
    });
  });

  describe("Current Location tab", () => {
    it("shows error when geolocation is not supported", () => {
      const originalGeo = navigator.geolocation;
      Object.defineProperty(navigator, "geolocation", {
        value: undefined,
        configurable: true,
      });
      render(<LocationSearch onSearch={vi.fn()} />);
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
      const onSearch = vi.fn();
      const mockGeo = {
        getCurrentPosition: vi.fn((success) =>
          success({ coords: { latitude: 47.6, longitude: -122.3 } }),
        ),
      };
      Object.defineProperty(navigator, "geolocation", {
        value: mockGeo,
        configurable: true,
      });
      render(<LocationSearch onSearch={onSearch} />);
      fireEvent.click(screen.getByRole("button", { name: "Use My Location" }));
      expect(onSearch).toHaveBeenCalledWith("47.6,-122.3");
    });
  });
});
