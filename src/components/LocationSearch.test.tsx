import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import LocationSearch from "./LocationSearch";

describe("LocationSearch", () => {
  it("renders input and button", () => {
    render(<LocationSearch onSearch={vi.fn()} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument();
  });

  it("submits on button click", () => {
    const onSearch = vi.fn();
    render(<LocationSearch onSearch={onSearch} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Seattle" },
    });
    fireEvent.click(screen.getByRole("button", { name: /search/i }));
    expect(onSearch).toHaveBeenCalledWith("Seattle");
  });

  it("submits on Enter keypress", () => {
    const onSearch = vi.fn();
    render(<LocationSearch onSearch={onSearch} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Tokyo" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSearch).toHaveBeenCalledWith("Tokyo");
  });

  it("does not submit when input is empty", () => {
    const onSearch = vi.fn();
    render(<LocationSearch onSearch={onSearch} />);
    fireEvent.click(screen.getByRole("button", { name: /search/i }));
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("disables input and button when disabled prop is true", () => {
    render(<LocationSearch onSearch={vi.fn()} disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByRole("button", { name: /search/i })).toBeDisabled();
  });
});
