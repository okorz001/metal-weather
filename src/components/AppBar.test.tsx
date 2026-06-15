import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AppBar from "./AppBar";

describe("AppBar", () => {
  it("renders the site title", () => {
    render(<AppBar />);
    expect(
      screen.getByRole("heading", { name: "Metal Weather" }),
    ).toBeInTheDocument();
  });

  it("hamburger button is present", () => {
    render(<AppBar />);
    expect(
      screen.getByRole("button", { name: "Open menu" }),
    ).toBeInTheDocument();
  });

  it("dropdown is hidden by default", () => {
    render(<AppBar />);
    expect(
      screen.queryByText("More options coming soon"),
    ).not.toBeInTheDocument();
  });

  it("opens dropdown when hamburger is clicked", () => {
    render(<AppBar />);
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByText("More options coming soon")).toBeInTheDocument();
  });

  it("closes dropdown when hamburger is clicked again", () => {
    render(<AppBar />);
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(
      screen.queryByText("More options coming soon"),
    ).not.toBeInTheDocument();
  });

  it("closes dropdown on Escape key", () => {
    render(<AppBar />);
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(
      screen.queryByText("More options coming soon"),
    ).not.toBeInTheDocument();
  });

  it("closes dropdown when clicking outside", () => {
    render(
      <div>
        <AppBar />
        <div data-testid="outside">Outside</div>
      </div>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByText("More options coming soon")).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(
      screen.queryByText("More options coming soon"),
    ).not.toBeInTheDocument();
  });
});
