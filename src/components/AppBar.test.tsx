import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SettingsProvider } from "./SettingsContext";
import AppBar from "./AppBar";

function renderWithSettings() {
  return render(
    <SettingsProvider>
      <AppBar />
    </SettingsProvider>,
  );
}

describe("AppBar", () => {
  it("renders the site title", () => {
    renderWithSettings();
    expect(
      screen.getByRole("heading", { name: "Metal Weather" }),
    ).toBeInTheDocument();
  });

  it("hamburger button is present", () => {
    renderWithSettings();
    expect(
      screen.getByRole("button", { name: "Open menu" }),
    ).toBeInTheDocument();
  });

  it("dropdown is hidden by default", () => {
    renderWithSettings();
    expect(screen.queryByText("Theme")).not.toBeInTheDocument();
  });

  it("opens dropdown when hamburger is clicked", () => {
    renderWithSettings();
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByText("Theme")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dark" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Light" })).toBeInTheDocument();
  });

  it("closes dropdown when hamburger is clicked again", () => {
    renderWithSettings();
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.queryByText("Theme")).not.toBeInTheDocument();
  });

  it("closes dropdown on Escape key", () => {
    renderWithSettings();
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("Theme")).not.toBeInTheDocument();
  });

  it("closes dropdown when clicking outside", () => {
    render(
      <div>
        <SettingsProvider>
          <AppBar />
        </SettingsProvider>
        <div data-testid="outside">Outside</div>
      </div>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByText("Theme")).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(screen.queryByText("Theme")).not.toBeInTheDocument();
  });

  it("switches to light mode when Light is clicked", () => {
    renderWithSettings();
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    fireEvent.click(screen.getByRole("button", { name: "Light" }));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("switches back to dark mode when Dark is clicked", () => {
    renderWithSettings();
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    // Switch to light, then dark — menu stays open between clicks.
    fireEvent.click(screen.getByRole("button", { name: "Light" }));
    fireEvent.click(screen.getByRole("button", { name: "Dark" }));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
