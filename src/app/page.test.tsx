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
  it("renders the location search tabs on initial load", () => {
    render(<Home />);
    expect(screen.getByRole("button", { name: "City" })).toBeInTheDocument();
  });
});
