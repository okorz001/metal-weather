import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import LocationBar from "./LocationBar";

function renderBar(
  overrides: Partial<React.ComponentProps<typeof LocationBar>> = {},
) {
  const props = {
    location: null,
    onOpenModal: vi.fn(),
    onGeolocate: vi.fn(),
    isFavorite: false,
    onToggleFavorite: vi.fn(),
    ...overrides,
  };
  return { ...render(<LocationBar {...props} />), props };
}

describe("LocationBar bookmark button", () => {
  it("is disabled when no location is set", () => {
    renderBar({ location: null });
    const btn = screen.getByRole("button", { name: /favorites/i });
    expect(btn).toBeDisabled();
  });

  it("is enabled when a location is set", () => {
    renderBar({ location: "Seattle, WA, US" });
    expect(screen.getByRole("button", { name: /favorites/i })).toBeEnabled();
  });

  it("has correct label and aria-pressed when not favorited", () => {
    renderBar({ location: "Seattle, WA, US", isFavorite: false });
    const btn = screen.getByRole("button", { name: "Add to favorites" });
    expect(btn).toHaveAttribute("aria-pressed", "false");
  });

  it("has correct label and aria-pressed when favorited", () => {
    renderBar({ location: "Seattle, WA, US", isFavorite: true });
    const btn = screen.getByRole("button", { name: "Remove from favorites" });
    expect(btn).toHaveAttribute("aria-pressed", "true");
  });

  it("calls onToggleFavorite when clicked", () => {
    const { props } = renderBar({ location: "Seattle, WA, US" });
    fireEvent.click(screen.getByRole("button", { name: /favorites/i }));
    expect(props.onToggleFavorite).toHaveBeenCalledTimes(1);
  });
});
