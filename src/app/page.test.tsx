import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Home from "./page";

vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

vi.mock("@/lib/geocode");
vi.mock("@/lib/weather");
vi.mock("@/lib/songs");

describe("Home", () => {
  it("renders the site name", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "metal-weather",
    );
  });

  it("renders the location search input on initial load", () => {
    render(<Home />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });
});
