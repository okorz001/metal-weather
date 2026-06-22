import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import LocationSearch from "./LocationSearch";

function renderSearch(value = "", onSearch = vi.fn(), onChange = vi.fn()) {
  render(
    <LocationSearch
      value={value}
      onChange={onChange}
      onSearch={onSearch}
      disabled={false}
    />,
  );
  return { onSearch, onChange };
}

describe("LocationSearch", () => {
  it("renders the city input and search button", () => {
    renderSearch();
    expect(screen.getByPlaceholderText("City name")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
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
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
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
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("does not call onSearch when input is whitespace only", () => {
    const { onSearch } = renderSearch("   ");
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("disables the input and search button when disabled prop is true", () => {
    render(
      <LocationSearch
        value=""
        onChange={vi.fn()}
        onSearch={vi.fn()}
        disabled
      />,
    );
    expect(screen.getByPlaceholderText("City name")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Search" })).toBeDisabled();
  });
});
