import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Location } from "@/lib/types";

import LocationModal from "./LocationModal";

const SEATTLE: Location = {
  displayName: "Seattle, WA, US",
  lat: 47.6,
  lon: -122.3,
};
const TOKYO: Location = {
  displayName: "Tokyo, Japan",
  lat: 35.6895,
  lon: 139.6917,
};

function renderModal(
  overrides: Partial<React.ComponentProps<typeof LocationModal>> = {},
) {
  const props = {
    open: true,
    onClose: vi.fn(),
    value: "",
    onChange: vi.fn(),
    onSearch: vi.fn(),
    favorites: [],
    onSelectFavorite: vi.fn(),
    onRemoveFavorite: vi.fn(),
    ...overrides,
  };
  return { ...render(<LocationModal {...props} />), props };
}

describe("LocationModal favorites list", () => {
  it("does not render a favorites section when favorites is empty", () => {
    renderModal({ favorites: [] });
    expect(screen.queryByText("Favorites")).not.toBeInTheDocument();
  });

  it("renders favorite location names", () => {
    renderModal({ favorites: [SEATTLE, TOKYO] });
    expect(screen.getByText("Seattle, WA, US")).toBeInTheDocument();
    expect(screen.getByText("Tokyo, Japan")).toBeInTheDocument();
  });

  it("renders a minus button for each favorite", () => {
    renderModal({ favorites: [SEATTLE] });
    expect(
      screen.getByRole("button", {
        name: `Remove ${SEATTLE.displayName} from favorites`,
      }),
    ).toBeInTheDocument();
  });

  it("calls onRemoveFavorite when the minus button is clicked", () => {
    const { props } = renderModal({ favorites: [SEATTLE] });
    fireEvent.click(
      screen.getByRole("button", {
        name: `Remove ${SEATTLE.displayName} from favorites`,
      }),
    );
    expect(props.onRemoveFavorite).toHaveBeenCalledWith(SEATTLE);
  });

  it("does not close the modal when the minus button is clicked", () => {
    const { props } = renderModal({ favorites: [SEATTLE] });
    fireEvent.click(
      screen.getByRole("button", {
        name: `Remove ${SEATTLE.displayName} from favorites`,
      }),
    );
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("calls onSelectFavorite and onClose when a favorite name is clicked", () => {
    const { props } = renderModal({ favorites: [SEATTLE] });
    fireEvent.click(screen.getByRole("button", { name: /^Seattle, WA, US/ }));
    expect(props.onSelectFavorite).toHaveBeenCalledWith(SEATTLE);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});
