import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import type { Favorite } from "@/lib/types";

import { FavoritesProvider, useFavorites } from "./FavoritesContext";

const SEATTLE: Favorite = {
  displayName: "Seattle, WA, US",
  lat: 47.6,
  lon: -122.3,
};
const TOKYO: Favorite = {
  displayName: "Tokyo, Japan",
  lat: 35.6895,
  lon: 139.6917,
};

beforeEach(() => {
  localStorage.clear();
});

function TestConsumer() {
  const { favorites, addFavorite, removeFavorite } = useFavorites();
  return (
    <div>
      <ul>
        {favorites.map((f) => (
          <li key={`${f.lat},${f.lon}`}>{f.displayName}</li>
        ))}
      </ul>
      <button onClick={() => addFavorite(SEATTLE)}>Add Seattle</button>
      <button onClick={() => addFavorite(TOKYO)}>Add Tokyo</button>
      <button onClick={() => removeFavorite(SEATTLE.lat, SEATTLE.lon)}>
        Remove Seattle
      </button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <FavoritesProvider>
      <TestConsumer />
    </FavoritesProvider>,
  );
}

describe("FavoritesProvider", () => {
  it("starts with an empty favorites list", () => {
    renderWithProvider();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("shows a favorite after addFavorite is called", () => {
    renderWithProvider();
    fireEvent.click(screen.getByRole("button", { name: "Add Seattle" }));
    expect(screen.getByText("Seattle, WA, US")).toBeInTheDocument();
  });

  it("shows multiple favorites", () => {
    renderWithProvider();
    fireEvent.click(screen.getByRole("button", { name: "Add Seattle" }));
    fireEvent.click(screen.getByRole("button", { name: "Add Tokyo" }));
    expect(screen.getByText("Seattle, WA, US")).toBeInTheDocument();
    expect(screen.getByText("Tokyo, Japan")).toBeInTheDocument();
  });

  it("removes a favorite after removeFavorite is called", () => {
    renderWithProvider();
    fireEvent.click(screen.getByRole("button", { name: "Add Seattle" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove Seattle" }));
    expect(screen.queryByText("Seattle, WA, US")).not.toBeInTheDocument();
  });

  it("re-renders when a native StorageEvent fires (cross-tab sync)", () => {
    localStorage.setItem("favorites", JSON.stringify([SEATTLE]));
    renderWithProvider();
    act(() => {
      window.dispatchEvent(new StorageEvent("storage"));
    });
    expect(screen.getByText("Seattle, WA, US")).toBeInTheDocument();
  });
});

describe("useFavorites outside provider", () => {
  it("returns an empty favorites list as fallback", () => {
    function Bare() {
      const { favorites } = useFavorites();
      return <span>{favorites.length}</span>;
    }
    render(<Bare />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
