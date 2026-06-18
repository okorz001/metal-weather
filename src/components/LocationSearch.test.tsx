import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import LocationSearch from "./LocationSearch";

function renderSearch(
  value = "",
  onSearch = vi.fn(),
  onGeoSearch = vi.fn(),
  onChange = vi.fn(),
) {
  render(
    <LocationSearch
      value={value}
      onChange={onChange}
      onSearch={onSearch}
      onGeoSearch={onGeoSearch}
      disabled={false}
    />,
  );
  return { onSearch, onGeoSearch, onChange };
}

describe("LocationSearch", () => {
  it("renders the city input, GPS button, and Go button", () => {
    renderSearch();
    expect(screen.getByPlaceholderText("City name")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Use my location" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go" })).toBeInTheDocument();
  });

  it("calls onChange when the input value changes", () => {
    const { onChange } = renderSearch();
    fireEvent.change(screen.getByPlaceholderText("City name"), {
      target: { value: "Seattle" },
    });
    expect(onChange).toHaveBeenCalledWith("Seattle");
  });

  it("calls onSearch with trimmed value on Go click", () => {
    const { onSearch } = renderSearch("  Seattle  ");
    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(onSearch).toHaveBeenCalledWith("Seattle");
  });

  it("calls onSearch on Enter keypress", () => {
    const { onSearch } = renderSearch("Tokyo");
    fireEvent.keyDown(screen.getByPlaceholderText("City name"), {
      key: "Enter",
    });
    expect(onSearch).toHaveBeenCalledWith("Tokyo");
  });

  it("does not call onSearch when input is empty", () => {
    const { onSearch } = renderSearch("");
    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("does not call onSearch when input is whitespace only", () => {
    const { onSearch } = renderSearch("   ");
    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("disables the input and Go button when disabled prop is true", () => {
    render(
      <LocationSearch
        value=""
        onChange={vi.fn()}
        onSearch={vi.fn()}
        onGeoSearch={vi.fn()}
        disabled
      />,
    );
    expect(screen.getByPlaceholderText("City name")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Go" })).toBeDisabled();
  });

  it("does not disable the GPS button when disabled prop is true", () => {
    render(
      <LocationSearch
        value=""
        onChange={vi.fn()}
        onSearch={vi.fn()}
        onGeoSearch={vi.fn()}
        disabled
      />,
    );
    expect(
      screen.getByRole("button", { name: "Use my location" }),
    ).not.toBeDisabled();
  });

  describe("GPS button", () => {
    it("calls onGeoSearch and returns to idle on success", () => {
      const mockGeo = {
        getCurrentPosition: vi.fn((success) => {
          success({ coords: { latitude: 47.6, longitude: -122.3 } });
        }),
      };
      Object.defineProperty(navigator, "geolocation", {
        value: mockGeo,
        configurable: true,
      });
      const { onGeoSearch } = renderSearch();
      fireEvent.click(screen.getByRole("button", { name: "Use my location" }));
      expect(onGeoSearch).toHaveBeenCalledWith(47.6, -122.3);
      expect(
        screen.getByRole("button", { name: "Use my location" }),
      ).not.toBeDisabled();
    });

    it("disables the GPS button while locating", () => {
      const mockGeo = {
        getCurrentPosition: vi.fn(), // never resolves
      };
      Object.defineProperty(navigator, "geolocation", {
        value: mockGeo,
        configurable: true,
      });
      renderSearch();
      fireEvent.click(screen.getByRole("button", { name: "Use my location" }));
      expect(
        screen.getByRole("button", { name: "Use my location" }),
      ).toBeDisabled();
    });

    it("shows an error when geolocation is not supported", () => {
      Object.defineProperty(navigator, "geolocation", {
        value: undefined,
        configurable: true,
      });
      renderSearch();
      fireEvent.click(screen.getByRole("button", { name: "Use my location" }));
      expect(
        screen.getByText("Geolocation is not supported by this browser."),
      ).toBeInTheDocument();
    });

    it("shows an error on geolocation failure", () => {
      const mockGeo = {
        getCurrentPosition: vi.fn((_, error) => {
          error({ message: "Permission denied" });
        }),
      };
      Object.defineProperty(navigator, "geolocation", {
        value: mockGeo,
        configurable: true,
      });
      renderSearch();
      fireEvent.click(screen.getByRole("button", { name: "Use my location" }));
      expect(screen.getByText("Permission denied")).toBeInTheDocument();
    });
  });
});
