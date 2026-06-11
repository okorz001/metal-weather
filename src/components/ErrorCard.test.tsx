import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Song } from "@/lib/types";

import ErrorCard from "./ErrorCard";

const mockSong: Song = {
  title: "The Wicker Man",
  artist: "Iron Maiden",
};

describe("ErrorCard", () => {
  it("renders error message", () => {
    render(<ErrorCard message="Location not found" song={mockSong} />);
    expect(screen.getByText("Location not found")).toBeInTheDocument();
  });

  it("renders song title and artist", () => {
    render(<ErrorCard message="Location not found" song={mockSong} />);
    expect(screen.getByText("The Wicker Man")).toBeInTheDocument();
    expect(screen.getByText("Iron Maiden")).toBeInTheDocument();
  });
});
